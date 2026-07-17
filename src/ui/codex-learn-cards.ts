import { navigate } from '../router.ts';

export type LearnCardTarget = 'fool-journey' | 'suit-numbers';

const LEARN_CARDS: {
  id: LearnCardTarget;
  icon: string;
  title: string;
  desc: string;
  path: string;
}[] = [
  {
    id: 'fool-journey',
    icon: '🌙',
    title: '愚人之旅',
    desc: '大阿卡那 22 张牌串成一段成长故事',
    path: '/tarot/tujian/fool-journey',
  },
  {
    id: 'suit-numbers',
    icon: '🧩',
    title: '牌组 × 数字',
    desc: '牌组×数字规律 +「我来试试」猜谜',
    path: '/tarot/tujian/suit-numbers',
  },
];

export function mountCodexLearnCards(container: HTMLElement): void {
  container.className = 'codex-learn-cards';
  container.innerHTML = LEARN_CARDS.map(
    (card) => `
    <button type="button" class="codex-learn-card" data-path="${card.path}">
      <span class="codex-learn-icon" aria-hidden="true">${card.icon}</span>
      <span class="codex-learn-text">
        <strong class="codex-learn-title">${card.title}</strong>
        <span class="codex-learn-desc">${card.desc}</span>
      </span>
      <span class="codex-learn-arrow" aria-hidden="true">→</span>
    </button>
  `,
  ).join('');

  container.querySelectorAll<HTMLButtonElement>('.codex-learn-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      const path = btn.dataset.path;
      if (path) navigate(path);
    });
  });
}
