/**
 * 周易 64 卦校对稿 + 《增删卜易》教学摘录
 * - 卦辞/爻辞：开源整理（freizl/yijing，MIT），通行本摘录
 * - 增删卜易：义理教学整理（非全书扫描），挂钩用神/世应/动变读法
 */
import zhouyi64 from './data/zhouyi-64.json';
import zengshanMap from './data/zengshan-excerpts.json';
import { HEXAGRAMS } from './hexagrams.ts';

export type ZhouYiGua = {
  id: string;
  name: string;
  gua_ci: string;
  tuan_ci: string;
  da_xiang: string;
  yao_ci: string[];
  xiao_xiang: string[];
  symbol: string;
};

export type ClassicCorpusEntry = {
  name: string;
  symbol: string;
  judgment: string;
  daXiang: string;
  /** 六爻爻辞（初→上）；乾坤可能含用九/用六作第 7 条，UI 仍主显示前六 */
  lineClassics: string[];
  /** 小象，作爻辞旁注 */
  lineNotes: string[];
  zengshan: string;
  modern: string;
};

const ZHOU = zhouyi64 as ZhouYiGua[];
const ZENG = zengshanMap as Record<string, string>;

const BY_NAME = new Map<string, ClassicCorpusEntry>();

for (const g of ZHOU) {
  const hex = HEXAGRAMS.find((h) => h.name === g.name);
  const lines = g.yao_ci.slice(0, 6);
  const notes = g.xiao_xiang.slice(0, 6);
  BY_NAME.set(g.name, {
    name: g.name,
    symbol: g.symbol,
    judgment: g.gua_ci.replace(/^[^：:]+[：:]/, '').trim() || g.gua_ci,
    daXiang: g.da_xiang,
    lineClassics: lines,
    lineNotes: notes,
    zengshan: ZENG[g.name] ?? '《增删卜易》义理：先定用神，再看世应动变。',
    modern: hex?.gist ?? g.da_xiang,
  });
}

export function getClassicCorpus(name: string): ClassicCorpusEntry | undefined {
  return BY_NAME.get(name);
}

export function listClassicCorpusNames(): string[] {
  return ZHOU.map((g) => g.name);
}

export function classicCorpusSize(): number {
  return BY_NAME.size;
}
