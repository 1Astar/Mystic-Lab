import { isCardCollected } from '../codex/collection.ts';
import {
  FOOL_JOURNEY_CHAPTERS,
  FOOL_JOURNEY_INTRO,
  FOOL_JOURNEY_STEPS,
} from '../knowledge/fool-journey.ts';
import { getContinueJourneyStep } from './codex-journey-detail.ts';
import { formatCardNameZh } from '../tarot/card-names.ts';
import { cardFaceImageHtml } from '../tarot/card-images.ts';
import { TAROT_DECK } from '../tarot/deck.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type CodexStoryMapCallbacks = {
  onSelectCard: (deckId: string) => void;
  onContinue: (deckId: string) => void;
};

export function mountCodexStoryMap(
  container: HTMLElement,
  callbacks: CodexStoryMapCallbacks,
): void {
  const collectedMajor = FOOL_JOURNEY_STEPS.filter((s) => isCardCollected(s.deckId)).length;
  const continueStep = getContinueJourneyStep();

  container.className = 'codex-story-map';
  container.innerHTML = `
    <section class="fool-journey-intro">
      <h2 class="fool-journey-title">${escapeHtml(FOOL_JOURNEY_INTRO.title)}</h2>
      <p class="fool-journey-subtitle">${escapeHtml(FOOL_JOURNEY_INTRO.subtitle)}</p>
      <p class="fool-journey-lead">${escapeHtml(FOOL_JOURNEY_INTRO.lead)}</p>
      <p class="fool-journey-progress">大阿卡那旅程 <strong>${collectedMajor}</strong> / 22 站已点亮</p>
      <button type="button" class="btn fool-journey-continue">
        继续旅程 → ${escapeHtml(continueStep.nameCn)} · ${escapeHtml(continueStep.title)}
      </button>
    </section>
    <div class="fool-journey-path-map"></div>
  `;

  container.querySelector('.fool-journey-continue')?.addEventListener('click', () => {
    callbacks.onContinue(continueStep.deckId);
  });

  const mapHost = container.querySelector('.fool-journey-path-map')!;

  for (const chapter of FOOL_JOURNEY_CHAPTERS) {
    const section = document.createElement('section');
    section.className = 'fool-path-chapter';
    section.innerHTML = `
      <header class="fool-path-chapter-head">
        <h3>${escapeHtml(chapter.title)}</h3>
        <p>${escapeHtml(chapter.subtitle)}</p>
      </header>
      <ol class="fool-path-track"></ol>
    `;

    const track = section.querySelector('.fool-path-track')!;
    chapter.steps.forEach((step, idx) => {
      const card = TAROT_DECK.find((c) => c.id === step.deckId);
      const collected = isCardCollected(step.deckId);
      const nameCn = card ? formatCardNameZh(card) : step.nameCn;
      const side = idx % 2 === 0 ? 'is-left' : 'is-right';

      const li = document.createElement('li');
      li.className = `fool-path-node ${side} ${collected ? 'is-lit' : 'is-dim'}`;
      li.innerHTML = `
        <button type="button" class="fool-path-btn" data-deck-id="${escapeHtml(step.deckId)}">
          <span class="fool-path-order">${step.order}</span>
          <div class="fool-path-face">
            ${cardFaceImageHtml(step.deckId, nameCn, 'fool-path-img')}
          </div>
          <div class="fool-path-text">
            <p class="fool-path-name">${escapeHtml(nameCn)}</p>
            <p class="fool-path-theme">${escapeHtml(step.title)} — ${escapeHtml(step.theme)}</p>
          </div>
        </button>
      `;
      track.appendChild(li);
    });

    mapHost.appendChild(section);
  }

  container.querySelectorAll<HTMLButtonElement>('.fool-path-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.deckId;
      if (id) callbacks.onSelectCard(id);
    });
  });
}
