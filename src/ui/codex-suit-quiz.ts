import {
  buildSuitNumberQuiz,
  type SuitNumberQuizItem,
} from '../knowledge/suit-number-quiz.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 「我来试试」：牌组 × 数字猜谜微交互 */
export function mountSuitNumberQuiz(container: HTMLElement): void {
  container.className = 'suit-number-quiz';
  let current: SuitNumberQuizItem | null = null;
  let answered = false;

  function renderQuestion(): void {
    current = buildSuitNumberQuiz();
    answered = false;
    if (!current) {
      container.innerHTML = `<p class="suit-quiz-empty">暂时出不了题，稍后再试。</p>`;
      return;
    }

    const q = current;
    container.innerHTML = `
      <div class="suit-quiz-head">
        <p class="suit-quiz-eyebrow">我来试试</p>
        <h3 class="suit-quiz-title">【${escapeHtml(q.suitLabel)} + ${escapeHtml(q.num)}】</h3>
        <p class="suit-quiz-prompt">${escapeHtml(q.prompt)}</p>
        <p class="suit-quiz-card-hint">对应小阿卡那：${escapeHtml(q.nameCn)}</p>
      </div>
      <div class="suit-quiz-options" role="group" aria-label="选项">
        ${q.options
          .map(
            (o, i) => `
          <button type="button" class="suit-quiz-option" data-opt="${escapeHtml(o.id)}">
            <span class="suit-quiz-opt-key">${String.fromCharCode(65 + i)}.</span>
            <span class="suit-quiz-opt-label">${escapeHtml(o.label)}</span>
          </button>`,
          )
          .join('')}
      </div>
      <p class="suit-quiz-feedback" hidden></p>
      <button type="button" class="btn btn-ghost btn-sm suit-quiz-next" hidden>再来一题</button>
    `;

    const feedback = container.querySelector<HTMLElement>('.suit-quiz-feedback')!;
    const nextBtn = container.querySelector<HTMLButtonElement>('.suit-quiz-next')!;

    container.querySelectorAll<HTMLButtonElement>('.suit-quiz-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (answered || !current) return;
        answered = true;
        const id = btn.dataset.opt ?? '';
        const opt = current.options.find((o) => o.id === id);
        const ok = Boolean(opt?.correct);

        container.querySelectorAll<HTMLButtonElement>('.suit-quiz-option').forEach((b) => {
          b.disabled = true;
          const o = current!.options.find((x) => x.id === b.dataset.opt);
          if (o?.correct) b.classList.add('is-correct');
          if (b === btn && !ok) b.classList.add('is-wrong');
        });

        feedback.hidden = false;
        feedback.className = `suit-quiz-feedback ${ok ? 'is-ok' : 'is-miss'}`;
        feedback.textContent = ok ? current.correctFeedback : current.wrongFeedback;
        nextBtn.hidden = false;
      });
    });

    nextBtn.addEventListener('click', () => renderQuestion());
  }

  renderQuestion();
}
