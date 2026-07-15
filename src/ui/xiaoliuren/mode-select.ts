export type LessonMode = 'beginner' | 'learn';

export type ModeOption = {
  id: LessonMode;
  emoji: string;
  title: string;
  desc: string;
  steps: string[];
};

export const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'learn',
    emoji: '🖐',
    title: '新手模式',
    desc: '手掌教学：按掌诀一步步顺数，看懂为什么落在这个宫位。',
    steps: ['认识掌诀落点', '从月起顺数', '再数日', '数时辰', '理解结果'],
  },
  {
    id: 'beginner',
    emoji: '◎',
    title: '快速模式',
    desc: '六神轮盘：点击开始后亮点自动旋转掐算，直达结果。',
    steps: ['认识时间', '确认时辰', '亮点旋转', '六神落位'],
  },
];

export function renderModeSelect(selected: LessonMode | null): string {
  return `
    <div class="xlr-mode-select">
      <h2 class="xlr-step-title">开始起课</h2>
      <p class="xlr-step-hint">先选方式，再点开始。两种结果相同，差别在过程。</p>
      <div class="xlr-mode-cards">
        ${MODE_OPTIONS.map((opt) => `
          <button type="button" class="xlr-mode-card${selected === opt.id ? ' is-selected' : ''}" data-mode="${opt.id}">
            <span class="xlr-mode-emoji">${opt.emoji}</span>
            <strong>${opt.title}</strong>
            <p>${opt.desc}</p>
            <div class="xlr-mode-flow">
              ${opt.steps.map((s, i) => `
                <span class="xlr-mode-flow-item">${s}</span>
                ${i < opt.steps.length - 1 ? '<span class="xlr-mode-flow-arrow">↓</span>' : ''}
              `).join('')}
            </div>
          </button>`).join('')}
      </div>
    </div>
  `;
}
