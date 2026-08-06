import type { BaziCodexKind } from './codex.ts';

export type CodexDetailPane = 'memory' | 'structure' | 'dimension' | 'relation';

export const CODEX_DETAIL_PANES: CodexDetailPane[] = [
  'memory',
  'structure',
  'dimension',
  'relation',
];

export const CODEX_DETAIL_LABELS: Record<CodexDetailPane, string> = {
  memory: '记忆',
  structure: '结构',
  dimension: '维度',
  relation: '生克',
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
