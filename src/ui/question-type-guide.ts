import { QUESTION_STARTER_EXAMPLES, QUESTION_TYPE_GUIDE } from '../tarot/question-guide.ts';

export function renderQuestionTypeGuide(): string {
  const openItems = QUESTION_TYPE_GUIDE.open.examples
    .map((ex) => `<li><button type="button" class="guide-example-btn" data-example="${escapeAttr(ex)}">${escapeHtml(ex)}</button></li>`)
    .join('');

  const closedItems = QUESTION_TYPE_GUIDE.closed.examples
    .map((ex) => `<li><button type="button" class="guide-example-btn" data-example="${escapeAttr(ex)}">${escapeHtml(ex)}</button></li>`)
    .join('');

  const starters = QUESTION_STARTER_EXAMPLES.map(
    (ex) =>
      `<button type="button" class="guide-starter-btn" data-example="${escapeAttr(ex.text)}" data-kind="${ex.kind}">${escapeHtml(ex.text)}</button>`,
  ).join('');

  return `
    <details class="question-type-guide" open>
      <summary class="question-type-guide-summary">怎么问更好？开放式 vs 封闭式</summary>
      <div class="question-type-guide-body">
        <div class="guide-type-block guide-type-open">
          <h3 class="guide-type-title">${escapeHtml(QUESTION_TYPE_GUIDE.open.title)}</h3>
          <p class="guide-type-desc">${escapeHtml(QUESTION_TYPE_GUIDE.open.desc)}</p>
          <ul class="guide-example-list">${openItems}</ul>
        </div>
        <div class="guide-type-block guide-type-closed">
          <h3 class="guide-type-title">${escapeHtml(QUESTION_TYPE_GUIDE.closed.title)}</h3>
          <p class="guide-type-desc">${escapeHtml(QUESTION_TYPE_GUIDE.closed.desc)}</p>
          <ul class="guide-example-list">${closedItems}</ul>
        </div>
        <div class="guide-starters">
          <p class="guide-starters-label">不知道问什么？点一句试试：</p>
          <div class="guide-starters-row">${starters}</div>
        </div>
      </div>
    </details>`;
}

export function wireQuestionTypeGuide(
  container: HTMLElement,
  onPickExample: (text: string) => void,
): void {
  container.querySelectorAll<HTMLButtonElement>('[data-example]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.example ?? '';
      if (text) onPickExample(text);
    });
  });
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
