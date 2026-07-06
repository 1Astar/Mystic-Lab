import { toPng } from 'html-to-image';
import type { ReadingResult } from '../interpretation/types.ts';
import type { DrawnCard } from '../tarot/engine.ts';
import { cardLabel } from '../tarot/engine.ts';

export function buildShareCardElement(
  cards: DrawnCard[],
  reading: ReadingResult,
  question?: string,
): HTMLElement {
  const el = document.createElement('div');
  el.className = 'share-card';
  const date = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const cardsHtml = cards
    .map(
      (c) => `
      <div class="share-card-item" style="--card-color: ${c.card.color}">
        <span class="share-pos">${c.position ?? ''}</span>
        <span class="share-symbol">${c.card.symbol}</span>
        <span class="share-name">${cardLabel(c)}</span>
      </div>`,
    )
    .join('');

  el.innerHTML = `
    <div class="share-card-inner">
      <p class="share-brand">Mystic Lab · 随心而行</p>
      <p class="share-slogan">答案不在牌里，在你心里。</p>
      <p class="share-date">${date}</p>
      ${question ? `<p class="share-question">「${question}」</p>` : ''}
      <div class="share-cards">${cardsHtml}</div>
      <p class="share-summary">${reading.summary}</p>
      ${reading.learningNote ? `<p class="share-learning">我学到了：${reading.learningNote}</p>` : ''}
      <p class="share-footer">Mystic Lab · 心意卡片</p>
    </div>
  `;

  return el;
}

export function buildLearningCardElement(learningNote: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'share-card learning-card-export';
  el.innerHTML = `
    <div class="share-card-inner">
      <p class="share-brand">随心而学</p>
      <p class="share-slogan">我学到了什么</p>
      <p class="share-summary" style="margin-top:40px">${learningNote}</p>
      <p class="share-footer">答案不在牌里，在你心里。</p>
    </div>
  `;
  return el;
}

async function exportPng(element: HTMLElement, filename: string): Promise<void> {
  element.style.position = 'fixed';
  element.style.left = '-9999px';
  document.body.appendChild(element);

  try {
    const dataUrl = await toPng(element, {
      width: 1080,
      height: 1920,
      pixelRatio: 1,
      backgroundColor: '#0b0b14',
    });
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } finally {
    element.remove();
  }
}

export async function downloadShareCard(
  cards: DrawnCard[],
  reading: ReadingResult,
  question?: string,
): Promise<void> {
  await exportPng(
    buildShareCardElement(cards, reading, question),
    `mystic-lab-share-${Date.now()}.png`,
  );
}

export async function downloadLearningCard(learningNote: string): Promise<void> {
  await exportPng(
    buildLearningCardElement(learningNote),
    `mystic-lab-learn-${Date.now()}.png`,
  );
}
