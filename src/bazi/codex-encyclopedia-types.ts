import type { BaziCodexKind } from './codex.ts';

export type CodexDetailPane = 'basics' | 'express' | 'relation' | 'chart';

export const CODEX_DETAIL_PANES: CodexDetailPane[] = [
  'basics',
  'express',
  'relation',
  'chart',
];

export const CODEX_DETAIL_LABELS: Record<CodexDetailPane, string> = {
  basics: '基础',
  express: '表现',
  relation: '生克',
  chart: '命盘',
};

export type CodexRelLink = {
  id: string;
  label: string;
};

export type BaziEncyclopediaEntry = {
  id: string;
  kind: BaziCodexKind;
  /** 大标题：甲木 / 正官 / 子水 / 木 / 天乙贵人 */
  title: string;
  tags: {
    wuxing?: string;
    yinyang?: string;
    /** 天干 / 地支 / 十神 / 五行 / 星煞 */
    category: string;
  };
  /** 一句白话定义 */
  oneLiner: string;
  structure: {
    /** 结构图旁白 / 图解说明 */
    diagram: string;
    keywords: string[];
    mappings: string[];
  };
  dimensions: {
    personality: string;
    work: string;
    love: string;
    health: string;
  };
  relations: {
    generates: CodexRelLink[];
    controls: CodexRelLink[];
    helpedBy: CodexRelLink[];
    drainedBy: CodexRelLink[];
  };
};

/** 详情全量档案（由 entry + 模板合成） */
export type CodexDossier = {
  whatIs: string;
  wuxingLabel: string;
  yinyangLabel: string;
  season: string;
  likes: string[];
  dislikes: string[];
  personality: string;
  strength: string;
  imbalance: string;
  career: string;
  wealth: string;
  love: string;
  body: string;
  chartRole: string;
  combos: { peer: string; note: string }[];
  positive: string;
  memory: string;
  pillarMeaning: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  /** 卡片核心词（短） */
  coreKeyword: string;
};
