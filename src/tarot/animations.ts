import type { DrawnCard } from './engine.ts';
import { formatCardNameZh, formatCardNameEn } from './card-names.ts';
import { cardBackArtHtml } from './card-back.ts';
import { cardFaceImageHtml } from './card-images.ts';

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export async function runShuffleAnimation(deckEl: HTMLElement): Promise<void> {
  deckEl.classList.add('is-shuffling');
  const duration = prefersReducedMotion() ? 400 : 1800;
  await wait(duration);
  deckEl.classList.remove('is-shuffling');
}

export async function runDealAnimation(
  slots: HTMLElement[],
  cards: DrawnCard[],
): Promise<void> {
  const delay = prefersReducedMotion() ? 100 : 400;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const drawn = cards[i];
    if (!slot || !drawn) continue;
    slot.classList.add('is-dealing');
    renderCardFace(slot, drawn, false);
    await wait(delay);
    slot.classList.remove('is-dealing');
  }
}

export async function runRevealAnimation(
  slots: HTMLElement[],
  cards: DrawnCard[],
): Promise<void> {
  const delay = prefersReducedMotion() ? 150 : 600;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const drawn = cards[i];
    if (!slot || !drawn) continue;
    slot.classList.add('is-flipping');
    await wait(delay / 2);
    renderCardFace(slot, drawn, true);
    await wait(delay / 2);
    slot.classList.remove('is-flipping');
  }
}

export function renderCardFace(
  slot: HTMLElement,
  drawn: DrawnCard,
  revealed: boolean,
  size: 'default' | 'hero' = 'default',
): void {
  const { card, reversed } = drawn;
  const nameZh = formatCardNameZh(card);
  const sizeClass = size === 'hero' ? ' is-hero' : '';
  const alt = `${nameZh} · ${formatCardNameEn(card)}`;

  slot.innerHTML = `
    <div class="tarot-card has-art${sizeClass} ${revealed ? 'is-revealed' : ''} ${reversed ? 'is-reversed' : ''}" style="--card-color: ${card.color}">
      <div class="tarot-card-inner">
        <div class="tarot-card-back">
          ${cardBackArtHtml()}
        </div>
        <div class="tarot-card-front">
          ${cardFaceImageHtml(card.id, alt)}
        </div>
      </div>
    </div>
  `;
}

export function createStarsLayer(): HTMLElement {
  const layer = document.createElement('div');
  layer.className = 'stars';
  if (prefersReducedMotion()) return layer;

  for (let i = 0; i < 40; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    layer.appendChild(star);
  }
  return layer;
}
