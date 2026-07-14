import { submitRewriteFeedback } from '../ai/question-feedback-sync.ts';
import type {
  RewriteCandidate,
  RewriteFeedbackReason,
  RewriteFeedbackSource,
} from '../ai/question-feedback.ts';
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
  container: HTMLElement,
  options: QuestionRewritePanelOptions,
): QuestionRewritePanelHandle {
  const root = document.createElement('div');
  root.className = 'question-rewrite-panel';
  root.hidden = true;
  container.appendChild(root);

  let candidates: RewriteCandidate[] = [];
  let selectedIndex = 0;
  let loading = false;
  let error = '';
  let statusMsg = '';
  let feedbackOpen = false;
  let selectedReasons = new Set<RewriteFeedbackReason>();
  let feedbackNote = '';
  let expanded = false;

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

  function render(): void {
    if (!expanded) {
      root.hidden = true;
      root.innerHTML = '';
      return;
    }
    root.hidden = false;

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

    root.innerHTML = `
      <div class="rewrite-panel-head">
        <p class="rewrite-panel-title">AI 帮你改成更开放的问法</p>
        <button type="button" class="rewrite-panel-close" aria-label="收起">×</button>
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
    `;

    root.querySelector('.rewrite-panel-close')?.addEventListener('click', () => {
      expanded = false;
      render();
    });

    root.querySelector('.rewrite-regen')?.addEventListener('click', () => {
      void runGenerate();
    });

    root.querySelectorAll<HTMLButtonElement>('.rewrite-candidate').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedIndex = Number(btn.dataset.idx ?? 0);
        render();
      });
    });

    root.querySelector('.rewrite-apply')?.addEventListener('click', () => {
      const q = selectedQuestion();
      if (!q) return;
      options.onApply(q);
      statusMsg = '已写入提问框';
      render();
    });

    root.querySelector('.rewrite-apply-ref')?.addEventListener('click', () => {
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

    root.querySelector('.rewrite-apply-restart')?.addEventListener('click', () => {
      const q = selectedQuestion();
      if (!q || !options.onRestartWithQuestion) return;
      options.onRestartWithQuestion(q);
    });

    root.querySelector('.rewrite-dislike')?.addEventListener('click', () => {
      feedbackOpen = true;
      statusMsg = '';
      render();
    });

    root.querySelector('.rewrite-feedback-cancel')?.addEventListener('click', () => {
      feedbackOpen = false;
      render();
    });

    root.querySelectorAll<HTMLButtonElement>('.rewrite-reason-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const r = btn.dataset.reason as RewriteFeedbackReason;
        if (selectedReasons.has(r)) selectedReasons.delete(r);
        else selectedReasons.add(r);
        render();
      });
    });

    const noteEl = root.querySelector<HTMLTextAreaElement>('.rewrite-feedback-note');
    noteEl?.addEventListener('input', () => {
      feedbackNote = noteEl.value.slice(0, 200);
    });

    root.querySelector('.rewrite-feedback-submit')?.addEventListener('click', () => {
      void submitFeedback();
    });
  }

  async function runGenerate(): Promise<void> {
    const q = options.getQuestion().trim();
    if (q.length < 2) {
      error = '请先填写问题';
      render();
      return;
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
      root.querySelector('.rewrite-toolbar')?.prepend(btn);
      return;
    }

    loading = true;
    error = '';
    statusMsg = '';
    feedbackOpen = false;
    render();

    try {
      const result = await rewriteQuestionOpen(q, {
        previous: candidates.length ? candidates : undefined,
      });
      candidates = result.candidates;
      selectedIndex = 0;
      statusMsg = '已生成 3 条开放式问法';
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
    try {
      const result = await submitRewriteFeedback({
        source: options.source,
        originalQuestion: options.getQuestion().trim(),
        candidates,
        reasons: [...selectedReasons],
        note: feedbackNote,
      });
      statusMsg = result.starPm.ok
        ? '感谢反馈，已本机记录并同步 Star PM'
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
    el: root,
    open: () => {
      expanded = true;
      error = '';
      statusMsg = '';
      render();
      if (candidates.length === 0) void runGenerate();
    },
    destroy: () => {
      root.remove();
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
