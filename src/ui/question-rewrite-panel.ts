import { submitRewriteFeedback } from '../ai/question-feedback-sync.ts';
import type {
  RewriteCandidate,
  RewriteFeedbackReason,
  RewriteFeedbackSource,
} from '../ai/question-feedback.ts';
import {
  findRewriteCache,
  invalidateRewriteCache,
  normalizeRewriteQuestion,
  saveRewriteCache,
} from '../ai/question-rewrite-cache.ts';
import { rewriteQuestionOpen } from '../ai/question-rewrite.ts';
import { isAiConfigured, loadAiSettings } from '../ai/settings.ts';
import { openAiSettingsModal } from './ai-settings-panel.ts';

export type QuestionRewritePanelOptions = {
  source: RewriteFeedbackSource;
  getQuestion: () => string;
  /** 选用某条（提问页写入输入框） */
  onApply: (question: string) => void;
  /** 仅结果页：采用并重新占问 */
  onRestartWithQuestion?: (question: string) => void;
  /** 仅结果页：仅保存参考后的提示回调（可选） */
  onSavedReference?: (question: string) => void;
};

export type QuestionRewritePanelHandle = {
  el: HTMLElement;
  open: () => void;
  destroy: () => void;
};

const REASON_OPTIONS: RewriteFeedbackReason[] = [
  '太空泛',
  '仍太封闭',
  '偏题',
  '太长',
  '不够具体',
  '其他',
];

export function mountQuestionRewritePanel(
  options: QuestionRewritePanelOptions,
): QuestionRewritePanelHandle {
  const overlay = document.createElement('div');
  overlay.className = 'question-rewrite-modal';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'question-rewrite-modal-title');
  overlay.hidden = true;
  document.body.appendChild(overlay);

  let candidates: RewriteCandidate[] = [];
  let selectedIndex = 0;
  let loading = false;
  let error = '';
  let statusMsg = '';
  let feedbackOpen = false;
  let selectedReasons = new Set<RewriteFeedbackReason>();
  let feedbackNote = '';
  let expanded = false;
  /** 当前 candidates 对应的规范化原问 */
  let boundQuestionKey = '';

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function selectedQuestion(): string {
    return candidates[selectedIndex]?.question ?? '';
  }

  function closeModal(): void {
    expanded = false;
    overlay.classList.remove('is-visible');
    overlay.hidden = true;
    document.removeEventListener('keydown', onKeydown);
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') closeModal();
  }

  function render(): void {
    if (!expanded) {
      overlay.classList.remove('is-visible');
      overlay.hidden = true;
      return;
    }
    overlay.hidden = false;

    const list =
      candidates.length > 0
        ? `<div class="rewrite-candidates" role="listbox">${candidates
            .map(
              (c, i) => `
          <button type="button" class="rewrite-candidate ${i === selectedIndex ? 'is-active' : ''}" data-idx="${i}">
            <span class="rewrite-candidate-label">${escapeHtml(c.label)}</span>
            <span class="rewrite-candidate-q">${escapeHtml(c.question)}</span>
          </button>`,
            )
            .join('')}</div>`
        : '';

    const feedbackBlock = feedbackOpen
      ? `
      <div class="rewrite-feedback">
        <p class="rewrite-feedback-title">哪里不满意？</p>
        <div class="rewrite-reason-chips">
          ${REASON_OPTIONS.map(
            (r) =>
              `<button type="button" class="rewrite-reason-chip ${selectedReasons.has(r) ? 'is-active' : ''}" data-reason="${escapeHtml(r)}">${escapeHtml(r)}</button>`,
          ).join('')}
        </div>
        <textarea class="question-input rewrite-feedback-note" rows="2" placeholder="可选：补充说明（≤200字）">${escapeHtml(feedbackNote)}</textarea>
        <div class="rewrite-feedback-actions">
          <button type="button" class="btn btn-secondary btn-sm rewrite-feedback-submit">提交反馈</button>
          <button type="button" class="btn btn-ghost btn-sm rewrite-feedback-cancel">取消</button>
        </div>
      </div>`
      : '';

    const applyActions =
      candidates.length > 0
        ? options.source === 'result'
          ? `
          <button type="button" class="btn btn-secondary btn-sm rewrite-apply-ref">仅保存参考</button>
          <button type="button" class="btn btn-sm rewrite-apply-restart">采用并重新占问</button>`
          : `<button type="button" class="btn btn-sm rewrite-apply">采用此问法</button>`
        : '';

    overlay.innerHTML = `
      <div class="question-rewrite-modal-backdrop"></div>
      <div class="question-rewrite-modal-card">
        <div class="rewrite-panel-head">
          <p id="question-rewrite-modal-title" class="rewrite-panel-title">AI 帮你改成更开放的问法</p>
          <button type="button" class="rewrite-panel-close" aria-label="关闭">×</button>
        </div>
        ${error ? `<p class="rewrite-error">${escapeHtml(error)}</p>` : ''}
        ${statusMsg ? `<p class="rewrite-status">${escapeHtml(statusMsg)}</p>` : ''}
        ${loading ? '<p class="rewrite-loading">正在生成…</p>' : ''}
        ${list}
        <div class="rewrite-toolbar">
          <button type="button" class="btn btn-ghost btn-sm rewrite-regen" ${loading ? 'disabled' : ''}>
            ${candidates.length ? '重新生成' : '生成开放式问法'}
          </button>
          ${
            candidates.length
              ? `<button type="button" class="btn btn-ghost btn-sm rewrite-dislike" ${loading ? 'disabled' : ''}>不满意并反馈</button>`
              : ''
          }
          ${applyActions}
        </div>
        ${feedbackBlock}
      </div>
    `;

    if (!overlay.classList.contains('is-visible')) {
      requestAnimationFrame(() => overlay.classList.add('is-visible'));
    }

    overlay.querySelector('.rewrite-panel-close')?.addEventListener('click', closeModal);
    overlay.querySelector('.question-rewrite-modal-backdrop')?.addEventListener('click', closeModal);

    overlay.querySelector('.rewrite-regen')?.addEventListener('click', () => {
      void runGenerate({ force: true });
    });

    overlay.querySelectorAll<HTMLButtonElement>('.rewrite-candidate').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedIndex = Number(btn.dataset.idx ?? 0);
        render();
      });
    });

    overlay.querySelector('.rewrite-apply')?.addEventListener('click', () => {
      const q = selectedQuestion();
      if (!q) return;
      options.onApply(q);
      closeModal();
    });

    overlay.querySelector('.rewrite-apply-ref')?.addEventListener('click', () => {
      const q = selectedQuestion();
      if (!q) return;
      try {
        const key = 'mystic-lab-question-rewrite-refs';
        const prev = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[];
        const next = [
          { at: new Date().toISOString(), original: options.getQuestion(), rewritten: q },
          ...(Array.isArray(prev) ? prev : []),
        ].slice(0, 20);
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      statusMsg = '已保存为参考（本机）';
      options.onSavedReference?.(q);
      render();
    });

    overlay.querySelector('.rewrite-apply-restart')?.addEventListener('click', () => {
      const q = selectedQuestion();
      if (!q || !options.onRestartWithQuestion) return;
      closeModal();
      options.onRestartWithQuestion(q);
    });

    overlay.querySelector('.rewrite-dislike')?.addEventListener('click', () => {
      feedbackOpen = true;
      statusMsg = '';
      render();
    });

    overlay.querySelector('.rewrite-feedback-cancel')?.addEventListener('click', () => {
      feedbackOpen = false;
      render();
    });

    overlay.querySelectorAll<HTMLButtonElement>('.rewrite-reason-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const r = btn.dataset.reason as RewriteFeedbackReason;
        if (selectedReasons.has(r)) selectedReasons.delete(r);
        else selectedReasons.add(r);
        render();
      });
    });

    const noteEl = overlay.querySelector<HTMLTextAreaElement>('.rewrite-feedback-note');
    noteEl?.addEventListener('input', () => {
      feedbackNote = noteEl.value.slice(0, 200);
    });

    overlay.querySelector('.rewrite-feedback-submit')?.addEventListener('click', () => {
      void submitFeedback();
    });
  }

  async function runGenerate(opts?: { force?: boolean }): Promise<void> {
    const force = opts?.force === true;
    const q = options.getQuestion().trim();
    if (q.length < 2) {
      error = '请先填写问题';
      render();
      return;
    }

    if (!force) {
      const hit = findRewriteCache(q);
      if (hit) {
        candidates = hit.candidates;
        selectedIndex = 0;
        boundQuestionKey = normalizeRewriteQuestion(q);
        error = '';
        statusMsg = '沿用上次推荐（未调用 AI）';
        feedbackOpen = false;
        loading = false;
        render();
        return;
      }
    }

    if (!isAiConfigured(loadAiSettings())) {
      error = '尚未配置 AI。请先打开「AI 解读」启用并填写 Key。';
      statusMsg = '';
      render();
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-secondary btn-sm';
      btn.textContent = '去配置 AI';
      btn.addEventListener('click', () => openAiSettingsModal());
      overlay.querySelector('.rewrite-toolbar')?.prepend(btn);
      return;
    }

    loading = true;
    error = '';
    statusMsg = '';
    feedbackOpen = false;
    render();

    try {
      const result = await rewriteQuestionOpen(q, {
        previous: force && candidates.length ? candidates : undefined,
      });
      candidates = result.candidates;
      selectedIndex = 0;
      boundQuestionKey = normalizeRewriteQuestion(q);
      saveRewriteCache(q, candidates);
      statusMsg = force ? '已重新生成 3 条开放式问法' : '已生成 3 条开放式问法';
    } catch (err) {
      error = err instanceof Error ? err.message : '生成失败';
    } finally {
      loading = false;
      render();
    }
  }

  async function submitFeedback(): Promise<void> {
    if (selectedReasons.size === 0 && !feedbackNote.trim()) {
      error = '请至少选一个原因或填写说明';
      render();
      return;
    }
    loading = true;
    error = '';
    render();
    const original = options.getQuestion().trim();
    try {
      const result = await submitRewriteFeedback({
        source: options.source,
        originalQuestion: original,
        candidates,
        reasons: [...selectedReasons],
        note: feedbackNote,
      });
      invalidateRewriteCache(original);
      boundQuestionKey = '';
      statusMsg = result.starPm.ok
        ? '感谢反馈，已本机记录并同步 Star PM（下次将重新生成）'
        : result.starPm.message;
      feedbackOpen = false;
      selectedReasons = new Set();
      feedbackNote = '';
    } catch (err) {
      error = err instanceof Error ? err.message : '反馈提交失败';
    } finally {
      loading = false;
      render();
    }
  }

  return {
    el: overlay,
    open: () => {
      const q = options.getQuestion().trim();
      const key = normalizeRewriteQuestion(q);
      expanded = true;
      error = '';
      statusMsg = '';
      feedbackOpen = false;
      document.addEventListener('keydown', onKeydown);

      const hit = key.length >= 2 ? findRewriteCache(q) : null;
      if (hit) {
        candidates = hit.candidates;
        selectedIndex = 0;
        boundQuestionKey = key;
        statusMsg = '沿用上次推荐（未调用 AI）';
        render();
        return;
      }

      if (key !== boundQuestionKey) {
        candidates = [];
        selectedIndex = 0;
        boundQuestionKey = '';
      }

      render();
      if (candidates.length === 0) void runGenerate({ force: false });
    },
    destroy: () => {
      document.removeEventListener('keydown', onKeydown);
      overlay.remove();
    },
  };
}

/** 提问页头部小按钮 */
export function createAiOptimizeTrigger(onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'question-ai-optimize-trigger';
  btn.setAttribute('aria-label', '让 AI 帮我优化');
  btn.title = '让 AI 帮我优化';
  btn.innerHTML = `<span class="question-ai-optimize-icon" aria-hidden="true">✨</span><span class="question-ai-optimize-tip">让 AI 帮我优化</span>`;
  btn.addEventListener('click', onClick);
  return btn;
}
