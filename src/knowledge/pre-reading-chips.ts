import {
  detectQuestionTheme,
  type QuestionTheme,
} from '../codex/collection.ts';

export type ChipGroup = {
  id: string;
  label: string;
  chips: string[];
};

const BACKGROUND_GENERAL = ['事情刚发生', '纠结一段时间了', '快到节点了', '说不清卡在哪'];

const BACKGROUND_BY_THEME: Record<QuestionTheme, string[]> = {
  work: ['刚离职', '已面几家', '有 offer 在等', '犹豫要不要换', '准备面试'],
  love: ['暧昧中', '刚吵过', '异地', '想表白', '关系卡住'],
  study: ['临近考试', '压力大', '选题卡住', '在等结果', '怕不够好'],
  self: ['最近很累', '想理清方向', '情绪起伏', '想做决定', '需要喘息'],
};

const INTUITION_GENERAL = [
  '有点紧',
  '有点松',
  '像在防守',
  '心里一沉',
  '有希望',
  '说不清',
  '不太敢亮出自己',
  '熟悉的感觉',
];

const INTUITION_BY_THEME: Record<QuestionTheme, string[]> = {
  work: ['像被卡住', '需要休息', '该推进了', '边界不清', '怕选错'],
  love: ['心里没底', '想靠近又退', '需要空间', '有暖意', '怕受伤'],
  study: ['脑子转不动', '怕不够好', '方向模糊', '能撑住', '想放弃又不愿'],
  self: ['需要停一下', '该面对了', '能量不够', '想重新开始', '心里有底'],
};

const THEME_LABEL: Record<QuestionTheme, string> = {
  work: '工作 / 求职',
  love: '感情关系',
  study: '学业成长',
  self: '自我状态',
};

export function backgroundChipGroups(question: string): ChipGroup[] {
  const theme = detectQuestionTheme(question);
  return [
    { id: 'bg-general', label: '常见处境', chips: BACKGROUND_GENERAL },
    {
      id: `bg-${theme}`,
      label: THEME_LABEL[theme],
      chips: BACKGROUND_BY_THEME[theme],
    },
  ];
}

export function intuitionChipGroups(question: string): ChipGroup[] {
  const theme = detectQuestionTheme(question);
  return [
    { id: 'feel-general', label: '通用感受', chips: INTUITION_GENERAL },
    {
      id: `feel-${theme}`,
      label: THEME_LABEL[theme],
      chips: INTUITION_BY_THEME[theme],
    },
  ];
}

/** 在文本框中切换 chip 文案（用顿号拼接，可再手改） */
export function toggleChipInText(current: string, chip: string): string {
  const parts = current
    .split(/[、，,/\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const i = parts.indexOf(chip);
  if (i >= 0) parts.splice(i, 1);
  else parts.push(chip);
  return parts.join('、');
}

export function textHasChip(text: string, chip: string): boolean {
  return text
    .split(/[、，,/\n]+/)
    .map((s) => s.trim())
    .includes(chip);
}
