/**
 * 知识树：称号门槛进度 + 知识点目录标签
 */
import {
  BAZI_LEARN_TITLES,
  loadBaziLearn,
  resolveBaziLearnTitle,
  type BaziLearnState,
  type BaziLearnTitle,
  type BaziLearnTitleId,
} from './learn-store.ts';

export type LearnGateCheck = {
  label: string;
  done: boolean;
  /** 进度短标，如 0/5 */
  detail: string;
  /** 怎么做（一步说明） */
  howto: string;
  /** 跳转：未完成时展示 */
  action?: { label: string; path: string };
};

export type LearnGate = {
  id: BaziLearnTitleId;
  label: string;
  blurb: string;
  /** 整级怎么升（总览一句） */
  howto: string;
  /** 是否已达成 */
  reached: boolean;
  /** 是否为当前称号 */
  current: boolean;
  checks: LearnGateCheck[];
};

export type LearnTreeView = {
  state: BaziLearnState;
  title: BaziLearnTitle;
  gates: LearnGate[];
  nextHint: string;
  knowledgeRows: Array<{ id: string; label: string; collected: boolean }>;
};

/** 已知 why 知识点目录（未收集也可显示为空槽） */
export const KNOWLEDGE_CATALOG: Array<{ id: string; label: string }> = [
  { id: 'why:insight', label: '现实感悟 · 为什么这么写' },
  { id: 'why:season', label: '核心定调 · 得令与季节' },
  { id: 'why:energy', label: '能量状态 · 抑强扶弱' },
  { id: 'why:domain:personality', label: '五域 · 性格底色' },
  { id: 'why:domain:career', label: '五域 · 事业倾向' },
  { id: 'why:domain:relationship', label: '五域 · 关系模式' },
  { id: 'why:domain:wealth', label: '五域 · 财富方式' },
  { id: 'why:domain:inner', label: '五域 · 内在课题' },
  { id: 'why:forecast', label: '运势 · 年度天气' },
  { id: 'why:yiji', label: '运势 · 宜忌逻辑' },
];

function labelForId(id: string): string {
  return KNOWLEDGE_CATALOG.find((c) => c.id === id)?.label ?? id.replace(/^why:/, '');
}

export function buildLearnTreeView(state = loadBaziLearn()): LearnTreeView {
  const title = resolveBaziLearnTitle(state);
  const k = state.knowledgeIds.length;
  const nAny = state.interactionIds.length;
  const wins = state.guessWins;

  const chuguiReached = true;
  const zhimingReached = k >= 5 && nAny >= 1;
  const weekReview = state.interactionIds.some((id) => id.startsWith('review:week:'));
  const tuiyanReached =
    (k >= 5 && nAny >= 1 && wins >= 3) ||
    (k >= 8 && nAny >= 2) ||
    (k >= 5 && nAny >= 1 && weekReview);

  const gates: LearnGate[] = [
    {
      id: 'chugui',
      label: BAZI_LEARN_TITLES[0]!.label,
      blurb: BAZI_LEARN_TITLES[0]!.blurb,
      howto: '打开命盘解读即可入门，无需额外操作。',
      reached: chuguiReached,
      current: title.id === 'chugui',
      checks: [
        {
          label: '开始阅读解读',
          done: true,
          detail: '已入门',
          howto: '进入「命盘解读」即算迈过初窥门径。',
          action: { label: '去解读 ›', path: '/bazi/reading' },
        },
      ],
    },
    {
      id: 'zhiming',
      label: BAZI_LEARN_TITLES[1]!.label,
      blurb: BAZI_LEARN_TITLES[1]!.blurb,
      howto: '同时满足两件：知识点 ≥5，且做过 1 次互动推演。',
      reached: zhimingReached,
      current: title.id === 'zhiming',
      checks: [
        {
          label: '收集知识点',
          done: k >= 5,
          detail: `${Math.min(k, 5)} / 5`,
          howto:
            '在解读各段下方点【为什么这么解？】展开，再点【收入知识库】。总览 / 五域 / 运势都可收集。',
          action: { label: '去解读收集 ›', path: '/bazi/reading' },
        },
        {
          label: '完成互动推演',
          done: nAny >= 1,
          detail: nAny >= 1 ? '已完成 1 次+' : '0 / 1',
          howto:
            '任做一件即可：总览拖「能量天平」杠杆；运势 Tab 点【如果】模拟；猜命盘答一题；命盘页拖「时光机」。',
          action: { label: '去解读互动 ›', path: '/bazi/reading' },
        },
      ],
    },
    {
      id: 'tuiyan',
      label: BAZI_LEARN_TITLES[2]!.label,
      blurb: BAZI_LEARN_TITLES[2]!.blurb,
      howto: '先达到「知命不惑」，再任选 A / B / C 一条路径完成即可升级（三条满足其一）。',
      reached: tuiyanReached,
      current: title.id === 'tuiyan',
      checks: [
        {
          label: '路径 A：猜命盘答对',
          done: wins >= 3 && zhimingReached,
          detail: `${Math.min(wins, 3)} / 3`,
          howto: zhimingReached
            ? '打开「猜命盘」，累计答对 3 题（每天一题，跨天累计）。'
            : '需先达到「知命不惑」，再累计猜对 3 题。',
          action: { label: '去猜命盘 ›', path: '/bazi/guess' },
        },
        {
          label: '路径 B：周度复盘',
          done: weekReview && zhimingReached,
          detail: weekReview ? '本周已对账' : '未对账',
          howto: zhimingReached
            ? '打开「脑内天气预报」，至少写满 3 天心态，再点「完成本周对账」。'
            : '需先达到「知命不惑」，再去脑内天气写满 ≥3 天并点对账。',
          action: { label: '去脑内天气 ›', path: '/bazi/week' },
        },
        {
          label: '路径 C：深收集 + 多互动',
          done: k >= 8 && nAny >= 2,
          detail: `知识点 ${Math.min(k, 8)}/8 · 互动 ${Math.min(nAny, 2)}/2`,
          howto:
            '知识点凑满 8 个，且互动事件 ≥2（例如：能量杠杆 + 如果模拟，或猜命盘 + 时光机）。不必先达知命，但通常会顺路经过。',
          action: { label: '去解读继续 ›', path: '/bazi/reading' },
        },
      ],
    },
  ];

  let nextHint = '你已是推演大师：可继续猜命盘、脑内天气与收集，巩固复盘手感。';
  if (title.id === 'chugui') {
    const needK = Math.max(0, 5 - k);
    const needN = nAny >= 1 ? '' : '；再去做 1 次互动（能量天平 / 如果 / 猜命盘 / 时光机）';
    nextHint =
      needK > 0
        ? `下一称号「知命不惑」：还需收集 ${needK} 个知识点${needN}。→ 解读页【为什么这么解？】`
        : `下一称号「知命不惑」：知识点已够${needN || '，刷新即可看见升级'}。`;
  } else if (title.id === 'zhiming') {
    nextHint = `下一称号「推演大师」三选一：①猜命盘再对 ${Math.max(0, 3 - wins)} 题 → /猜命盘；②脑内天气对账一周 → /脑内天气；③知识点满 8 且互动满 2 → 继续解读。`;
  }

  const known = new Set(state.knowledgeIds);
  const knowledgeRows = [
    ...KNOWLEDGE_CATALOG.map((c) => ({
      id: c.id,
      label: c.label,
      collected: known.has(c.id),
    })),
    ...state.knowledgeIds
      .filter((id) => !KNOWLEDGE_CATALOG.some((c) => c.id === id))
      .map((id) => ({ id, label: labelForId(id), collected: true })),
  ];

  return {
    state,
    title,
    gates,
    nextHint,
    knowledgeRows,
  };
}

/** 供角标：含下一门槛提示时可短写 */
export function learnTreeProgressPct(state = loadBaziLearn()): number {
  const title = resolveBaziLearnTitle(state);
  if (title.id === 'tuiyan') return 100;
  if (title.id === 'zhiming') {
    const wins = Math.min(3, state.guessWins) / 3;
    const deep =
      (Math.min(8, state.knowledgeIds.length) / 8) * 0.5 +
      (Math.min(2, state.interactionIds.length) / 2) * 0.5;
    return Math.round(Math.max(wins, deep) * 100);
  }
  const k = Math.min(5, state.knowledgeIds.length) / 5;
  const n = state.interactionIds.length >= 1 ? 1 : 0;
  return Math.round(((k + n) / 2) * 100);
}
