import type { CardDefinition } from '../tarot/deck.ts';
import { buildCodexGridGroups, renderCodexCell } from '../codex/grid.ts';
import { navigate } from '../router.ts';

/** 全部牌面分段导航短名（下划线小 tab，非胶囊） */
const DECK_NAV_SHORT: Record<string, string> = {
  major: '大阿卡那',
  wands: '权杖',
  cups: '圣杯',
  swords: '宝剑',
  pentacles: '星币',
};

const MINOR_SUIT_HUBS = [
  {
    id: 'wands',
    icon: '🔥',
    label: '权杖',
    theme: '行动与创造',
    path: '/tarot/tujian/suit-numbers',
  },
  {
    id: 'cups',
    icon: '💧',
    label: '圣杯',
    theme: '情感与关系',
    path: '/tarot/tujian/suit-numbers',
  },
  {
    id: 'swords',
    icon: '🌪',
    label: '宝剑',
    theme: '思想与挑战',
    path: '/tarot/tujian/suit-numbers',
  },
  {
    id: 'pentacles',
    icon: '🌱',
    label: '星币',
    theme: '现实与积累',
    path: '/tarot/tujian/suit-numbers',
  },
] as const;

export function mountCodexAllView(
  container: HTMLElement,
  cards: CardDefinition[],
  onSelect: (deckId: string) => void,
): void {
  container.className = 'codex-all-view';
  container.innerHTML = `
    <section class="codex-world-intro">
      <h2 class="codex-world-title">塔罗世界</h2>
      <div class="codex-world-split">
        <article class="codex-world-block">
          <h3>大阿卡那</h3>
          <p>22 张人生旅程</p>
        </article>
        <span class="codex-world-arrow" aria-hidden="true">↓</span>
        <article class="codex-world-block">
          <h3>小阿卡那</h3>
          <p>56 张日常经验</p>
        </article>
      </div>
    </section>
    <section class="codex-world-hubs">
      <article class="codex-hub-major">
        <p class="codex-hub-label">大阿卡那</p>
        <button type="button" class="codex-hub-card codex-hub-journey">
          <span class="codex-hub-icon">🌙</span>
          <span class="codex-hub-text">
            <strong>愚人之旅</strong>
            <span>从 0 到 21 · 探索人的成长旅程</span>
          </span>
          <span class="codex-hub-go">进入 →</span>
        </button>
      </article>
      <article class="codex-hub-minor">
        <p class="codex-hub-label">小阿卡那 · 四个元素</p>
        <div class="codex-hub-suits"></div>
      </article>
    </section>
    <section class="codex-all-decks">
      <h3 class="codex-all-decks-title">全部牌面</h3>
      <nav class="codex-all-deck-nav" role="tablist" aria-label="牌组导航"></nav>
      <div class="codex-all-decks-host"></div>
    </section>
  `;

  container.querySelector('.codex-hub-journey')?.addEventListener('click', () => {
    navigate('/tarot/tujian/fool-journey');
  });

  const suitsHost = container.querySelector('.codex-hub-suits')!;
  for (const suit of MINOR_SUIT_HUBS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'codex-hub-suit';
    btn.dataset.suit = suit.id;
    btn.innerHTML = `
      <span class="codex-hub-suit-icon">${suit.icon}</span>
      <span class="codex-hub-suit-text">
        <strong>${suit.label}</strong>
        <span>${suit.theme}</span>
      </span>
    `;
    btn.addEventListener('click', () => {
      navigate(suit.path);
      setTimeout(() => {
        document.querySelector('.suit-numbers-suits')?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    });
    suitsHost.appendChild(btn);
  }

  const decksHost = container.querySelector('.codex-all-decks-host') as HTMLElement;
  const deckNav = container.querySelector('.codex-all-deck-nav') as HTMLElement;
  const groups = buildCodexGridGroups(cards);
  let activeDeck = groups[0]?.id ?? 'major';

  function setActiveNav(groupId: string): void {
    activeDeck = groupId;
    deckNav.querySelectorAll<HTMLButtonElement>('.codex-all-deck-nav-tab').forEach((btn) => {
      const on = btn.dataset.deck === groupId;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    decksHost.querySelectorAll<HTMLElement>('.codex-grid-section').forEach((section) => {
      const on = section.dataset.deck === groupId;
      section.hidden = !on;
      section.classList.toggle('is-active', on);
    });
  }

  for (const group of groups) {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'codex-all-deck-nav-tab';
    tab.role = 'tab';
    tab.dataset.deck = group.id;
    tab.textContent = DECK_NAV_SHORT[group.id] ?? group.label;
    tab.addEventListener('click', () => setActiveNav(group.id));
    deckNav.appendChild(tab);

    const section = document.createElement('section');
    section.className = 'codex-grid-section';
    section.dataset.deck = group.id;
    section.setAttribute('role', 'tabpanel');
    section.hidden = group.id !== activeDeck;
    section.innerHTML = `
      <header class="codex-grid-section-head">
        <div>
          <h3 class="codex-grid-section-title">${group.label}</h3>
          <p class="codex-grid-section-hint">${group.hint}</p>
        </div>
      </header>
      <div class="codex-grid-section-cells"></div>
    `;

    const cells = section.querySelector('.codex-grid-section-cells')!;
    for (const card of group.cards) {
      cells.appendChild(renderCodexCell(card, onSelect, { showRole: true }));
    }
    decksHost.appendChild(section);
  }

  if (groups[0]) setActiveNav(groups[0].id);
}
