import {
  QUESTION_BG_HINTS,
  QUESTION_COMPARISONS,
  QUESTION_STARTER_EXAMPLES,
  QUESTION_TYPE_GUIDE,
} from '../tarot/question-guide.ts';

export function renderQuestionStageBackdrop(): string {
  const items = QUESTION_BG_HINTS.map(
    (item, i) =>
      `<span class="question-bg-hint is-${item.kind}" data-slot="${i + 1}">${escapeHtml(item.text)}</span>`,
  ).join('');

  return `<div class="question-bg-hints" aria-hidden="true">${items}</div>`;
}

export function openQuestionGuideModal(onPickExample: (text: string) => void): void {
  document.querySelector('.question-guide-modal')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'question-guide-modal';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'question-guide-modal-title');

  const compareRows = QUESTION_COMPARISONS.map(
    (row) => `
    <div class="guide-compare-row">
      <button type="button" class="guide-compare-btn is-closed" data-example="${escapeAttr(row.closed)}">
        <span class="guide-compare-kind">封闭式</span>
        <span class="guide-compare-text">${escapeHtml(row.closed)}</span>
      </button>
      <span class="guide-compare-arrow" aria-hidden="true">→</span>
      <button type="button" class="guide-compare-btn is-open" data-example="${escapeAttr(row.open)}">
        <span class="guide-compare-kind">开放式</span>
        <span class="guide-compare-text">${escapeHtml(row.open)}</span>
      </button>
      <p class="guide-compare-note">${escapeHtml(row.note)}</p>
    </div>`,
  ).join('');

  const starters = QUESTION_STARTER_EXAMPLES.map(
    (ex) =>
      `<button type="button" class="guide-starter-btn" data-example="${escapeAttr(ex.text)}" data-kind="${ex.kind}">${escapeHtml(ex.text)}</button>`,
  ).join('');

  const prosCons = (['closed', 'open'] as const)
    .map((kind) => {
      const info = QUESTION_TYPE_GUIDE[kind];
      const pros = info.pros.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
      const cons = info.cons.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
      return `
      <div class="guide-pros-cons-col is-${kind}">
        <h3 class="guide-pros-cons-title">${escapeHtml(info.title)}</h3>
        <p class="guide-pros-cons-desc">${escapeHtml(info.desc)}</p>
        <p class="guide-pros-cons-label">优点</p>
        <ul class="guide-pros-cons-list is-pro">${pros}</ul>
        <p class="guide-pros-cons-label">局限</p>
        <ul class="guide-pros-cons-list is-con">${cons}</ul>
      </div>`;
    })
    .join('');

  overlay.innerHTML = `
    <div class="question-guide-modal-backdrop"></div>
    <div class="question-guide-modal-card">
      <header class="question-guide-modal-header">
        <div>
          <h2 id="question-guide-modal-title" class="guide-modal-title">怎么问更好？</h2>
          <p class="guide-modal-desc">开放式帮你看清脉络；封闭式要明确答案。两种都可以占问，开放式通常更容易读出「看清什么、怎么调整」。</p>
        </div>
        <button type="button" class="question-guide-modal-close" aria-label="关闭">×</button>
      </header>
      <div class="guide-compare-intro">
        <div class="guide-type-pill is-closed">${escapeHtml(QUESTION_TYPE_GUIDE.closed.title)}</div>
        <span class="guide-compare-vs">对比</span>
        <div class="guide-type-pill is-open">${escapeHtml(QUESTION_TYPE_GUIDE.open.title)}</div>
      </div>
      <div class="guide-pros-cons">${prosCons}</div>
      <h3 class="guide-section-title">同一话题，两种问法</h3>
      <p class="guide-compare-hint">点任一示例可填入提问框</p>
      <div class="guide-compare-list">${compareRows}</div>
      <div class="guide-starters">
        <p class="guide-starters-label">不知道问什么？点一句试试：</p>
        <div class="guide-starters-row">${starters}</div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-visible'));

  const close = (): void => {
    overlay.classList.remove('is-visible');
    window.setTimeout(() => overlay.remove(), 280);
  };

  overlay.querySelectorAll<HTMLButtonElement>('[data-example]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.example ?? '';
      if (!text) return;
      onPickExample(text);
      close();
    });
  });

  overlay.querySelector('.question-guide-modal-close')?.addEventListener('click', close);
  overlay.querySelector('.question-guide-modal-backdrop')?.addEventListener('click', close);

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      close();
      window.removeEventListener('keydown', onKey);
    }
  };
  window.addEventListener('keydown', onKey);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, '&quot;');
}
