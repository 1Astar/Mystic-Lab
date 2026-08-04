import type { BaziChart } from './cast.ts';

export type ShenShaMark = {
  /** UI 标签，如「先天贵人」 */
  label: string;
  /** 传统名，折叠溯源用 */
  traditional: string;
  /** 是否偏「需安抚」 */
  needsComfort: boolean;
  comfort: string;
  /** 选入优先级，越小越优先 */
  priority: number;
};

type Rule = {
  names: string[];
  label: string;
  needsComfort: boolean;
  comfort: string;
  priority: number;
};

/** 只映射我们盘里会出现的神煞；UI 改名 + 安抚 */
const RULES: Rule[] = [
  {
    names: ['天乙贵人', '文昌'],
    label: '先天贵人',
    needsComfort: false,
    comfort: '关键时刻更容易遇到托住你的人与信息——主动开口，窗口才看得见。',
    priority: 1,
  },
  {
    names: ['禄神', '将星'],
    label: '稳定根基',
    needsComfort: false,
    comfort: '你身上带着「能站住」的底气；把力气用在可积累的事上会更顺。',
    priority: 2,
  },
  {
    names: ['羊刃'],
    label: '性格锐气',
    needsComfort: true,
    comfort:
      '你的命盘带有【性格锐气】的印记。这不代表要硬刚全世界，而是锋利感强——练的是收放，而不是磨平。',
    priority: 3,
  },
  {
    names: ['华盖'],
    label: '孤独感来源',
    needsComfort: true,
    comfort:
      '你的命盘带有【孤独感来源】的印记。在现代社会这往往代表精神独立、无法忍受平庸社交。请接纳自己的独处时光。',
    priority: 4,
  },
  {
    names: ['驿马'],
    label: '流动动力',
    needsComfort: false,
    comfort: '你容易被「动起来」牵引——换环境、换节奏有时比硬扛更对症。',
    priority: 5,
  },
  {
    names: ['桃花', '红鸾', '天喜'],
    label: '人际缘感',
    needsComfort: false,
    comfort: '人缘与被看见的机会更活跃；分清滋养关系与消耗关系就好。',
    priority: 6,
  },
];

function collectTraditional(chart: BaziChart): string[] {
  const out: string[] = [];
  for (const p of chart.pillars) {
    if (p.empty || p.key === 'liunian') continue;
    for (const s of p.shensha || []) {
      const t = s.trim();
      if (t) out.push(t);
    }
  }
  return [...new Set(out)];
}

/**
 * 神煞减量：最多 5 个，改名展示，凶向给安抚。
 */
export function buildShenShaMarks(chart: BaziChart, limit = 5): ShenShaMark[] {
  const present = collectTraditional(chart);
  const marks: ShenShaMark[] = [];
  const usedLabels = new Set<string>();

  for (const rule of RULES) {
    const hit = rule.names.find((n) => present.includes(n));
    if (!hit) continue;
    if (usedLabels.has(rule.label)) continue;
    usedLabels.add(rule.label);
    marks.push({
      label: rule.label,
      traditional: hit,
      needsComfort: rule.needsComfort,
      comfort: rule.comfort,
      priority: rule.priority,
    });
  }

  return marks.sort((a, b) => a.priority - b.priority).slice(0, limit);
}
