/**
 * 造命 · 问题导向任务
 * 文案口径：挑战 / 破局点 / 考验（不用不利、煞、忌恐吓）
 */

export type CraftQuestId =
  | 'career_jump'
  | 'love_timing'
  | 'money_now'
  | 'inner_pace'
  | 'move_change';

export type CraftQuest = {
  id: CraftQuestId;
  /** 首页按钮文案 */
  button: string;
  /** 完整问题 */
  question: string;
  /** 主看宫位（紫微） */
  palace: string;
  /** 辅看宫位 */
  supportPalace?: string;
  /** 本周小任务模板；可用 {star} {palace} */
  weeklyTask: string;
  /** 打卡经验 */
  xp: number;
};

export const CRAFT_QUESTS: CraftQuest[] = [
  {
    id: 'career_jump',
    button: '我今年该不该跳槽？',
    question: '我今年该不该换工作 / 调整事业轨道？',
    palace: '官禄',
    supportPalace: '迁移',
    weeklyTask:
      '本周做一件「最小职业实验」：主动约 1 次信息访谈，或改一版简历里最能代表你的三行描述，并写下你最在意的一条反馈。',
    xp: 25,
  },
  {
    id: 'love_timing',
    button: '我什么时候能遇到正缘？',
    question: '亲密关系接下来怎么走？正缘感从哪来？',
    palace: '夫妻',
    supportPalace: '福德',
    weeklyTask:
      '本周留 1 次不被打扰的约会或独处：写下「我在亲密里真正需要的三件事」，只选一件本周能说出口或做出来的。',
    xp: 25,
  },
  {
    id: 'money_now',
    button: '近期如何搞钱？',
    question: '近期钱与资源怎么进、怎么留？',
    palace: '财帛',
    supportPalace: '田宅',
    weeklyTask:
      '本周做一次「现金流体检」：列出本月固定开销与可砍的一项，并把一笔小钱转入「蓄水池」账户（哪怕 50 元）。',
    xp: 25,
  },
  {
    id: 'inner_pace',
    button: '最近心里总不安？',
    question: '近期内心节奏与满足感怎么调？',
    palace: '福德',
    supportPalace: '命宫',
    weeklyTask:
      '本周给自己留 2 小时独处：关掉通知，记录一件你对现在生活最满意的事，以及一件想慢慢调整的事。',
    xp: 20,
  },
  {
    id: 'move_change',
    button: '要不要换环境？',
    question: '要不要换城市 / 换赛道 / 扩大对外舞台？',
    palace: '迁移',
    supportPalace: '命宫',
    weeklyTask:
      '本周做一次「环境采样」：去一个你不常去的地方待 90 分钟（咖啡馆、园区、课程），回来写三句：哪里让你充电、哪里耗电、下周可重复什么。',
    xp: 20,
  },
];

export function getCraftQuest(id: string): CraftQuest | undefined {
  return CRAFT_QUESTS.find((q) => q.id === id);
}

/** ISO 周键：2026-W33 */
export function isoWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
