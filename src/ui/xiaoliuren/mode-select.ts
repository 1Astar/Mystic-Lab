import {
  getSkillGateStatus,
  isModeUnlocked,
  type SkillGateStatus,
} from '../../xiaoliuren/skill-gates.ts';

export type LessonMode = 'beginner' | 'learn' | 'practice';

export type ModeOption = {
  id: LessonMode;
  gate: '1' | '2' | '3';
  emoji: string;
  title: string;
  desc: string;
  steps: string[];
  lockHint: (status: SkillGateStatus) => string;
};

export const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'learn',
    gate: '1',
    emoji: '🖐',
    title: '第一关 · 新手模式',
    desc: '手掌教学：按掌诀一步步顺数，看懂为什么落在这个宫位。',
    steps: ['认识掌诀落点', '从月起顺数', '再数日', '数时辰', '理解结果'],
    lockHint: () => '',
  },
  {
    id: 'practice',
    gate: '2',
    emoji: '✦',
    title: '第二关 · 自主操练',
    desc: '空白掌：隐藏编号，自己点选顺数；点对继续，点错有提示。',
    steps: ['看清月日时位数', '空白掌自点', '三步全对', '解锁进度'],
    lockHint: () => '先完成一次新手模式，解锁本关。',
  },
  {
    id: 'beginner',
    gate: '3',
    emoji: '◎',
    title: '第三关 · 快速模式',
    desc: '六神轮盘：点击开始后亮点自动旋转掐算，直达结果。',
    steps: ['认识时间', '确认时辰', '亮点旋转', '六神落位'],
    lockHint: (status) =>
      status.beginner.remaining > 0
        ? `自主操练再成功 ${status.beginner.remaining} 次即可解锁。`
        : '',
  },
];

export function renderModeSelect(
  selected: LessonMode | null,
  status: SkillGateStatus = getSkillGateStatus(),
): string {
  const progressLine = status.beginner.unlocked
    ? '三关已通 · 快速模式可用'
    : status.practice.unlocked
      ? `操练进度 ${status.practice.clears}/${status.beginner.needPractice} · 达标解锁快速`
      : '先走通新手模式，再挑战空白掌';

  return `
    <div class="xlr-mode-select">
      <h2 class="xlr-step-title">通关学技能</h2>
      <p class="xlr-step-hint">三种结果相同，差别在过程。${progressLine}</p>
      <div class="xlr-mode-cards">
        ${MODE_OPTIONS.map((opt) => {
          const unlocked = isModeUnlocked(opt.id, {
            learnClears: status.learn.clears,
            practiceClears: status.practice.clears,
          });
          const lockText = unlocked ? '' : opt.lockHint(status);
          return `
          <button type="button" class="xlr-mode-card${selected === opt.id ? ' is-selected' : ''}${unlocked ? '' : ' is-locked'}" data-mode="${opt.id}" data-unlocked="${unlocked ? '1' : '0'}" ${unlocked ? '' : 'aria-disabled="true"'}>
            <span class="xlr-mode-gate">关${opt.gate}</span>
            <span class="xlr-mode-emoji">${opt.emoji}</span>
            <strong>${opt.title}</strong>
            <p>${opt.desc}</p>
            ${
              lockText
                ? `<p class="xlr-mode-lock">${lockText}</p>`
                : `<div class="xlr-mode-flow">
              ${opt.steps
                .map(
                  (s, i) => `
                <span class="xlr-mode-flow-item">${s}</span>
                ${i < opt.steps.length - 1 ? '<span class="xlr-mode-flow-arrow">↓</span>' : ''}
              `,
                )
                .join('')}
            </div>`
            }
          </button>`;
        }).join('')}
      </div>
    </div>
  `;
}
