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
    id: 'beginner',
    emoji: '🌱',
    title: '新手模式',
    desc: '系统自动完成起课，你只需跟着看过程。',
    steps: ['当前时间', '农历转换', '月日时起课', '自动掐算', '结果'],
  },
  {
    id: 'learn',
    emoji: '📖',
    title: '学习模式',
    desc: '展开手掌模型，一步步理解为什么落在这个宫位。',
    steps: ['手掌起课点', '月份顺数', '日期顺数', '时辰落点', '理解结果'],
  },
];

export function renderModeSelect(selected: LessonMode | null): string {
  return `
    <div class="xlr-mode-select">
      <h2 class="xlr-step-title">选择你的起课方式</h2>
      <p class="xlr-step-hint">两种模式结果相同，差别在于过程展示的深度。</p>
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
