import type { CardDefinition } from '../tarot/deck.ts';
import { formatCardNameZh } from '../tarot/card-names.ts';
import { cardFaceImageHtml } from '../tarot/card-images.ts';
import { getCardRoleHint } from './card-role.ts';
import { getCodexEntry, isCardCollected } from './collection.ts';
import { navigate } from '../router.ts';

export type CodexGridGroup = {
  id: string;
  label: string;
  hint: string;
  journeyLink?: boolean;
  cards: CardDefinition[];
};

export const CODEX_GRID_GROUPS: {
  id: string;
  label: string;
  hint: string;
  journeyLink?: boolean;
  match: (card: CardDefinition) => boolean;
}[] = [
  {
    id: 'major',
    label: '大阿卡那',
    hint: '22 张原型牌，串成愚人之旅的成长线',
    journeyLink: true,
    match: (c) => c.arcana === 'major',
  },
  {
    id: 'wands',
    label: '权杖组',
    hint: '行动、热情、创造力',
    match: (c) => c.suit === 'wands',
  },
  {
    id: 'cups',
    label: '圣杯组',
    hint: '情绪、关系、感受',
    match: (c) => c.suit === 'cups',
  },
  {
    id: 'swords',
    label: '宝剑组',
    hint: '思考、冲突、判断',
    match: (c) => c.suit === 'swords',
  },
  {
    id: 'pentacles',
    label: '星币组',
    hint: '现实、金钱、资源',
    match: (c) => c.suit === 'pentacles',
  },
];

export function buildCodexGridGroups(cards: CardDefinition[]): CodexGridGroup[] {
  return CODEX_GRID_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    hint: g.hint,
    journeyLink: g.journeyLink,
    cards: cards.filter(g.match),
  })).filter((g) => g.cards.length > 0);
}

export function renderCodexCell(
  card: CardDefinition,
  onSelect: (deckId: string) => void,
  options?: { showRole?: boolean },
): HTMLButtonElement {
  const col = isCardCollected(card.id);
  const entry = getCodexEntry(card.id);
  const nameCn = formatCardNameZh(card);
  const role = options?.showRole ? getCardRoleHint(card) : null;

  const cell = document.createElement('button');
  cell.type = 'button';
  cell.className = `codex-cell ${col ? 'is-collected' : 'is-locked'}${role ? ' has-role' : ''}`;
  cell.innerHTML = `
    <div class="codex-cell-face">
      ${cardFaceImageHtml(card.id, nameCn, 'codex-cell-img')}
      ${
        col
          ? ''
          : `<span class="codex-cell-seal" aria-hidden="true"></span>
      <span class="codex-cell-lock" aria-hidden="true">未遇</span>
      <span class="codex-cell-tease">你尚未踏足这趟旅程</span>`
      }
    </div>
    <span class="codex-name">${nameCn}</span>
    ${role ? `<span class="codex-cell-role" title="${role.formula.replace(/"/g, '&quot;')}">${role.badge}</span>` : ''}
    ${entry && entry.count > 1 ? `<span class="codex-count">×${entry.count}</span>` : ''}
    ${entry?.favorite ? '<span class="codex-fav">★</span>' : ''}
  `;
  cell.addEventListener('click', () => onSelect(card.id));
  return cell;
}

export function mountCodexGroupedGrid(
  container: HTMLElement,
  groups: CodexGridGroup[],
  onSelect: (deckId: string) => void,
): void {
  container.className = 'codex-grid codex-grid-grouped';
  container.innerHTML = '';

  for (const group of groups) {
    const section = document.createElement('section');
    section.className = 'codex-grid-section';
    section.innerHTML = `
      <header class="codex-grid-section-head">
        <div>
          <h3 class="codex-grid-section-title">${group.label}</h3>
          <p class="codex-grid-section-hint">${group.hint}</p>
        </div>
        ${group.journeyLink ? '<button type="button" class="codex-grid-journey-link">查看愚人之旅 →</button>' : ''}
      </header>
      <div class="codex-grid-section-cells"></div>
    `;

    section.querySelector('.codex-grid-journey-link')?.addEventListener('click', () => {
      navigate('/tarot/tujian/fool-journey');
    });

    const cells = section.querySelector('.codex-grid-section-cells')!;
    for (const card of group.cards) {
      cells.appendChild(renderCodexCell(card, onSelect, { showRole: true }));
    }

    container.appendChild(section);
  }
}

export function mountCodexFlatGrid(
  container: HTMLElement,
  cards: CardDefinition[],
  onSelect: (deckId: string) => void,
): void {
  container.className = 'codex-grid';
  container.innerHTML = '';
  for (const card of cards) {
    container.appendChild(renderCodexCell(card, onSelect));
  }
}
