import { isCardCollected } from '../codex/collection.ts';
import {
  FOOL_JOURNEY_CHAPTERS,
  FOOL_JOURNEY_INTRO,
  MINOR_ARCANA_BRIEF,
} from '../knowledge/fool-journey.ts';
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
};

export function mountCodexStoryMap(
  container: HTMLElement,
  callbacks: CodexStoryMapCallbacks,
): void {
  const collectedMajor = FOOL_JOURNEY_CHAPTERS.reduce((n, ch) => {
    return n + ch.steps.filter((s) => isCardCollected(s.deckId)).length;
  }, 0);

  container.className = 'codex-story-map';
  container.innerHTML = `
    <section class="fool-journey-intro">
      <h2 class="fool-journey-title">${escapeHtml(FOOL_JOURNEY_INTRO.title)}</h2>
      <p class="fool-journey-subtitle">${escapeHtml(FOOL_JOURNEY_INTRO.subtitle)}</p>
      <p class="fool-journey-lead">${escapeHtml(FOOL_JOURNEY_INTRO.lead)}</p>
      <p class="fool-journey-progress">大阿卡那旅程 <strong>${collectedMajor}</strong> / 22 站已点亮</p>
    </section>
    <div class="fool-journey-chapters"></div>
    <section class="minor-brief-box">
      <h3>${escapeHtml(MINOR_ARCANA_BRIEF.title)}</h3>
      <p class="minor-brief-lead">${escapeHtml(MINOR_ARCANA_BRIEF.lead)}</p>
      <div class="minor-brief-grid">
        <div class="minor-brief-col">
          <h4>四组牌</h4>
          <ul>
            ${MINOR_ARCANA_BRIEF.suits
              .map((s) => `<li><strong>${escapeHtml(s.label)}</strong>：${escapeHtml(s.theme)}</li>`)
              .join('')}
          </ul>
        </div>
        <div class="minor-brief-col">
          <h4>数字线索</h4>
          <ul class="minor-number-list">
            ${MINOR_ARCANA_BRIEF.numbers
              .map(
                (n) =>
                  `<li><span class="minor-num">${escapeHtml(n.num)}</span>${escapeHtml(n.theme)}</li>`,
              )
              .join('')}
          </ul>
        </div>
      </div>
      <p class="minor-brief-note">侍从 / 骑士 / 王后 / 国王代表该花色在不同阶段的人格面向，可在收集图鉴中逐张展开。</p>
    </section>
  `;

  const chaptersHost = container.querySelector('.fool-journey-chapters')!;

  for (const chapter of FOOL_JOURNEY_CHAPTERS) {
    const section = document.createElement('section');
    section.className = 'fool-journey-chapter';
    section.innerHTML = `
      <header class="fool-chapter-head">
        <h3>${escapeHtml(chapter.title)}</h3>
        <p>${escapeHtml(chapter.subtitle)}</p>
      </header>
      <ol class="fool-journey-path"></ol>
    `;

    const path = section.querySelector('.fool-journey-path')!;
    for (const step of chapter.steps) {
      const card = TAROT_DECK.find((c) => c.id === step.deckId);
      const collected = isCardCollected(step.deckId);
      const nameCn = card ? formatCardNameZh(card) : step.nameCn;

      const li = document.createElement('li');
      li.className = `fool-step ${collected ? 'is-lit' : 'is-dim'}`;
      li.innerHTML = `
        <button type="button" class="fool-step-btn" data-deck-id="${escapeHtml(step.deckId)}">
          <span class="fool-step-order">${step.order}</span>
          <div class="fool-step-face">
            ${cardFaceImageHtml(step.deckId, nameCn, 'fool-step-img')}
            ${collected ? '' : '<span class="fool-step-dim" aria-hidden="true"></span>'}
          </div>
          <div class="fool-step-text">
            <p class="fool-step-name">${escapeHtml(nameCn)} · ${escapeHtml(step.title)}</p>
            <p class="fool-step-theme">${escapeHtml(step.theme)}</p>
          </div>
          <span class="fool-step-arrow" aria-hidden="true">→</span>
        </button>
      `;
      path.appendChild(li);
    }

    chaptersHost.appendChild(section);
  }

  container.querySelectorAll<HTMLButtonElement>('.fool-step-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.deckId;
      if (id) callbacks.onSelectCard(id);
    });
  });
}
