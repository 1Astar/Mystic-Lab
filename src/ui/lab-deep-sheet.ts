/**
 * 跨体系「深度解读」悬浮窗（深度解读 | 边看边问）
 * 边看边问支持本页预设常问 + 自由提问（概念本地答）
 */
import { navigate } from '../router.ts';
import { ICON_SPARK } from './lab-icons.ts';

export type LabDeepSystem = 'bazi' | 'ziwei';

export type LabAskPreset = { q: string; a: string[] };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPresetsHtml(presets: LabAskPreset[]): string {
  if (!presets.length) return '';
  const items = presets
    .map((item, i) => {
      const body = item.a
        .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
        .join('');
      return `
    <details class="ly-faq-item"${i === 0 ? ' open' : ''}>
      <summary>${escapeHtml(item.q)}</summary>
      <div class="ly-faq-body">${body}</div>
    </details>`;
    })
    .join('');
  return `
    <div class="ly-ask-section">
      <p class="ly-layer-guide">本页常问</p>
      <div class="ly-ask-faq">${items}</div>
    </div>`;
}

export type LabDeepSheetOpts = {
  system: LabDeepSystem;
  title: string;
  answerConcept: (q: string) => { answer: string; hit: boolean };
  onMiss?: (q: string) => void;
  onDeep?: () => void;
  deepHint?: string;
  /** 按当前盘面生成的常问 */
  presets?: LabAskPreset[];
  /** 默认打开边看边问 */
  initialTab?: 'deep' | 'ask';
  /** 打开后自动填入并回答 */
  seedQuery?: string;
};

/** @deprecated 改用 mountLabFloatActions */
export function mountLabDeepFab(
  _host: HTMLElement,
  opts: { label?: string; onOpen: () => void },
): () => void {
  document.querySelectorAll('[data-lab-deep-fab]').forEach((el) => el.remove());
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'ly-ai-side-fab is-icon lab-deep-fab';
  fab.dataset.labDeepFab = '1';
  fab.title = opts.label ?? '深度解读';
  fab.setAttribute('aria-label', opts.label ?? '深度解读');
  fab.innerHTML = ICON_SPARK;
  fab.addEventListener('click', () => opts.onOpen());
  (document.querySelector('#app') || document.body).appendChild(fab);
  return () => fab.remove();
}

export function openLabDeepSheet(opts: LabDeepSheetOpts): void {
  document.querySelector('.lab-deep-sheet')?.remove();

  const startTab = opts.initialTab ?? 'ask';
  const presets = opts.presets ?? [];

  const modal = document.createElement('div');
  modal.className = 'ly-follow-chat lab-deep-sheet is-open';
  modal.innerHTML = `
    <button type="button" class="ly-follow-chat-backdrop" data-deep-close aria-label="关闭"></button>
    <div class="ly-follow-chat-sheet" role="dialog" aria-modal="true">
      <header class="ly-follow-chat-head">
        <div>
          <p class="ly-follow-chat-kicker">深度解读</p>
          <h2>${escapeHtml(opts.title)}</h2>
        </div>
        <button type="button" class="ly-follow-chat-x" data-deep-close aria-label="关闭">×</button>
      </header>
      <div class="ly-deep-sheet-tabs" role="tablist">
        <button type="button" class="ly-deep-sheet-tab${startTab === 'deep' ? ' is-on' : ''}" data-deep-tab="deep">深度解读</button>
        <button type="button" class="ly-deep-sheet-tab${startTab === 'ask' ? ' is-on' : ''}" data-deep-tab="ask">边看边问</button>
      </div>
      <div class="ly-deep-sheet-pane" data-deep-pane="deep" ${startTab === 'ask' ? 'hidden' : ''}>
        <section class="ly-follow-deep-empty">
          <p>${escapeHtml(opts.deepHint ?? '结合你的盘面与情况，做一次更贴合的解读。概念题请切到「边看边问」。')}</p>
          <button type="button" class="btn ly-btn-gold btn-sm" data-deep-run>开始深度解读</button>
        </section>
      </div>
      <div class="ly-deep-sheet-pane ly-deep-ask-pane" data-deep-pane="ask" ${startTab === 'deep' ? 'hidden' : ''}>
        <section class="ly-ask-panel">
          <p class="ly-ask-ai-hint">概念追问优先本地词库，不耗 AI；找不到会记下来补知识。</p>
          ${renderPresetsHtml(presets)}
          <div class="ly-ask-section">
            <p class="ly-layer-guide">我还想问</p>
            <textarea class="question-input ly-ask-input" data-lab-ask-input rows="2" placeholder="例如：什么是食神？华盖是什么意思？"></textarea>
            <button type="button" class="btn ly-btn-gold btn-sm ly-ask-send" data-lab-ask-send>提问</button>
            <div class="ly-ask-result" data-lab-ask-result hidden></div>
          </div>
        </section>
      </div>
    </div>
  `;

  const close = () => {
    modal.classList.remove('is-open');
    setTimeout(() => modal.remove(), 220);
  };

  modal.querySelectorAll('[data-deep-close]').forEach((el) => {
    el.addEventListener('click', close);
  });

  modal.querySelectorAll<HTMLButtonElement>('[data-deep-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.deepTab === 'ask' ? 'ask' : 'deep';
      modal.querySelectorAll<HTMLButtonElement>('[data-deep-tab]').forEach((b) => {
        b.classList.toggle('is-on', b.dataset.deepTab === tab);
      });
      modal.querySelectorAll<HTMLElement>('[data-deep-pane]').forEach((pane) => {
        pane.hidden = pane.dataset.deepPane !== tab;
      });
    });
  });

  modal.querySelector('[data-deep-run]')?.addEventListener('click', () => {
    if (opts.onDeep) {
      opts.onDeep();
      return;
    }
    close();
    navigate(opts.system === 'bazi' ? '/bazi/chart' : '/ziwei/chart');
  });

  const input = modal.querySelector<HTMLTextAreaElement>('[data-lab-ask-input]')!;
  const result = modal.querySelector<HTMLElement>('[data-lab-ask-result]')!;
  const send = () => {
    const q = input.value.trim();
    if (q.length < 2) return;
    const got = opts.answerConcept(q);
    result.hidden = false;
    if (got.hit) {
      result.innerHTML = `<div class="ly-ask-answer-card"><p class="ly-ask-answer-text">${escapeHtml(got.answer).replace(/\n/g, '<br>')}</p><p class="ly-ask-hint">本地概念 · 未调用 AI</p></div>`;
    } else {
      opts.onMiss?.(q);
      result.innerHTML = `<div class="ly-ask-answer-card"><p class="ly-ask-answer-text">${escapeHtml(got.answer)}</p><p class="ly-ask-hint">词库暂无 · 已记下待补</p></div>`;
    }
  };
  modal.querySelector('[data-lab-ask-send]')?.addEventListener('click', send);
  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') send();
  });

  document.body.appendChild(modal);

  if (opts.seedQuery?.trim()) {
    input.value = opts.seedQuery.trim();
    send();
  }
}
