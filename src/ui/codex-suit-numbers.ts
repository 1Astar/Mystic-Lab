import {
  COMBINATION_EXAMPLES,
  COURT_NOTE,
  NUMBER_STAGES,
  SUIT_GROUPS,
  SUIT_NUMBER_INTRO,
} from '../knowledge/minor-structure.ts';
import { cardFaceImageHtml } from '../tarot/card-images.ts';
import { formatCardNameZh } from '../tarot/card-names.ts';
import { TAROT_DECK } from '../tarot/deck.ts';
import { mountSuitNumberQuiz } from './codex-suit-quiz.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type SuitNumbersCallbacks = {
  onSelectCard: (deckId: string) => void;
};

export function mountSuitNumbersGuide(
  container: HTMLElement,
  callbacks: SuitNumbersCallbacks,
): void {
  container.className = 'suit-numbers-guide';
  container.innerHTML = `
    <section class="suit-numbers-intro">
      <h2 class="suit-numbers-title">${escapeHtml(SUIT_NUMBER_INTRO.title)}</h2>
      <p class="suit-numbers-subtitle">${escapeHtml(SUIT_NUMBER_INTRO.subtitle)}</p>
      <p class="suit-numbers-lead">${escapeHtml(SUIT_NUMBER_INTRO.lead)}</p>
    </section>
    <section class="suit-numbers-block suit-numbers-quiz-block">
      <div class="suit-numbers-quiz-host"></div>
    </section>
    <section class="suit-numbers-block">
      <h3>先看牌组：它在讲哪个领域</h3>
      <div class="suit-numbers-suits"></div>
    </section>
    <section class="suit-numbers-block">
      <h3>再看数字：它处在什么阶段</h3>
      <ol class="suit-numbers-nums"></ol>
    </section>
    <section class="suit-numbers-block">
      <h3>组合起来读</h3>
      <p class="suit-numbers-formula">牌名 = 牌组 + 数字 → 领域 × 阶段</p>
      <div class="suit-numbers-examples"></div>
    </section>
    <p class="suit-numbers-court">${escapeHtml(COURT_NOTE)}</p>
  `;

  const quizHost = container.querySelector('.suit-numbers-quiz-host') as HTMLElement;
  mountSuitNumberQuiz(quizHost);

  const suitsHost = container.querySelector('.suit-numbers-suits')!;
  for (const suit of SUIT_GROUPS) {
    const card = document.createElement('article');
    card.className = 'suit-numbers-suit-card';
    card.innerHTML = `
      <h4>${escapeHtml(suit.label)}</h4>
      <p class="suit-numbers-theme">${escapeHtml(suit.theme)}</p>
      <p class="suit-numbers-hint">${escapeHtml(suit.hint)}</p>
    `;
    suitsHost.appendChild(card);
  }

  const numsHost = container.querySelector('.suit-numbers-nums')!;
  for (const num of NUMBER_STAGES) {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="suit-num-badge">${escapeHtml(num.num)}</span>
      <span class="suit-num-label">${escapeHtml(num.label)}</span>
      <span class="suit-num-theme">${escapeHtml(num.theme)}</span>
    `;
    numsHost.appendChild(li);
  }

  const examplesHost = container.querySelector('.suit-numbers-examples')!;
  for (const ex of COMBINATION_EXAMPLES) {
    const card = TAROT_DECK.find((c) => c.id === ex.deckId);
    const nameCn = card ? formatCardNameZh(card) : ex.nameCn;
    const article = document.createElement('article');
    article.className = 'suit-numbers-example';
    article.innerHTML = `
      <button type="button" class="suit-example-btn" data-deck-id="${escapeHtml(ex.deckId)}">
        <div class="suit-example-face">
          ${cardFaceImageHtml(ex.deckId, nameCn, 'suit-example-img')}
        </div>
        <div class="suit-example-body">
          <h4>${escapeHtml(ex.nameCn)} = ${escapeHtml(ex.suitLabel)} + ${escapeHtml(ex.num)}</h4>
          <p class="suit-example-parts">
            <span>${escapeHtml(ex.suitLabel)} → ${escapeHtml(ex.suitTheme)}</span>
            <span>${escapeHtml(ex.num)} → ${escapeHtml(ex.numTheme)}</span>
          </p>
          <p class="suit-example-reading">${escapeHtml(ex.reading)}</p>
        </div>
      </button>
    `;
    examplesHost.appendChild(article);
  }

  container.querySelectorAll<HTMLButtonElement>('.suit-example-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.deckId;
      if (id) callbacks.onSelectCard(id);
    });
  });
}
