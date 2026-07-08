import {
  analyzeQuestion,
  applyQuestionAngle,
  getQuestionTypeLabel,
  type QuestionCoachResult,
} from '../tarot/question-coach.ts';

export type QuestionCoachHandle = {
  el: HTMLElement;
  bindInput: (input: HTMLTextAreaElement) => void;
  getActiveQuestion: () => string;
  destroy: () => void;
};

export function mountQuestionCoach(
  container: HTMLElement,
  onQuestionChange: (question: string) => void,
): QuestionCoachHandle {
  const root = document.createElement('div');
  root.className = 'question-coach';
  root.hidden = true;
  container.appendChild(root);

  let coach: QuestionCoachResult | null = null;
  let selectedAngleId = 'direct';
  let debounceTimer: number | null = null;

  function render(): void {
    if (!coach) {
      root.hidden = true;
      root.innerHTML = '';
      return;
    }

    root.hidden = false;

    const angleBtns = coach.angles
      .map(
        (a) => `
        <button type="button" class="coach-angle-btn ${a.id === selectedAngleId ? 'is-active' : ''}" data-angle="${a.id}">
          <span class="coach-angle-label">${escapeHtml(a.label)}</span>
          <span class="coach-angle-q">${escapeHtml(a.question)}</span>
        </button>`,
      )
      .join('');

    const genericList =
      coach.genericSuggestions.length > 0 && coach.angles.length <= 1
        ? `
        <div class="coach-generic">
          <p class="coach-generic-title">试着这样问：</p>
          <ul>${coach.genericSuggestions.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
        </div>`
        : '';

    const typeBadge = `<span class="coach-type-badge ${coach.isClosed ? 'is-closed' : 'is-open'}">${getQuestionTypeLabel(coach.isClosed)}</span>`;

    const anglesBlock =
      coach.isClosed && coach.angles.length > 1
        ? `
        <p class="coach-prompt">你正在问：${typeBadge}<strong>${escapeHtml(coach.originalQuestion)}</strong></p>
        <p class="coach-sub">封闭式问题可以直接占问；也可以点下面换成开放式，更容易读出「看清什么、怎么调整」：</p>
        <div class="coach-angles" role="group">${angleBtns}</div>`
        : coach.angles.length > 1
          ? `
        <p class="coach-prompt">你正在问：${typeBadge}<strong>${escapeHtml(coach.originalQuestion)}</strong></p>
        <div class="coach-angles" role="group">${angleBtns}</div>`
          : coach.pattern === 'open'
            ? `
        <p class="coach-prompt">你正在问：${typeBadge}<strong>${escapeHtml(coach.originalQuestion)}</strong></p>`
            : '';

    root.innerHTML = `
      ${coach.note ? `<p class="coach-note">${escapeHtml(coach.note)}</p>` : ''}
      ${anglesBlock}
      ${genericList}
      ${coach.isClosed ? `<button type="button" class="coach-keep-btn">保留原问题，继续</button>` : ''}
    `;

    root.querySelectorAll<HTMLButtonElement>('.coach-angle-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.angle ?? 'direct';
        selectedAngleId = id;
        if (!coach) return;
        coach = applyQuestionAngle(coach, id);
        onQuestionChange(coach.activeQuestion);
        render();
      });
    });

    root.querySelector<HTMLButtonElement>('.coach-keep-btn')?.addEventListener('click', () => {
      if (!coach) return;
      selectedAngleId = 'direct';
      coach = { ...coach, activeQuestion: coach.originalQuestion };
      onQuestionChange(coach.activeQuestion);
      render();
    });
  }

  function updateFromInput(text: string): void {
    const next = analyzeQuestion(text);
    if (!next) {
      coach = null;
      render();
      onQuestionChange(text.trim());
      return;
    }

    const prevOriginal = coach?.originalQuestion;
    coach = next;
    if (prevOriginal !== next.originalQuestion) {
      selectedAngleId = 'direct';
      coach.activeQuestion = next.originalQuestion;
    } else {
      coach.activeQuestion = applyQuestionAngle(
        { ...coach, activeQuestion: coach.originalQuestion },
        selectedAngleId,
      ).activeQuestion;
    }

    onQuestionChange(coach.activeQuestion);
    render();
  }

  return {
    el: root,
    getActiveQuestion: () => coach?.activeQuestion ?? '',
    bindInput(input: HTMLTextAreaElement): void {
      const onInput = (): void => {
        if (debounceTimer !== null) window.clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => updateFromInput(input.value), 280);
      };
      input.addEventListener('input', onInput);
      onInput();
    },
    destroy: () => {
      if (debounceTimer !== null) window.clearTimeout(debounceTimer);
      root.remove();
    },
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
