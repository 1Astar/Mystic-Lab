/**
 * 周易 64 卦校对稿 + 《增删卜易》教学摘录
 * - 卦辞/爻辞：开源整理（freizl/yijing，MIT），通行本摘录
 * - 增删卜易：义理教学整理（非全书扫描）；套壳条目用判词卡加厚
 */
import zhouyi64 from './data/zhouyi-64.json';
import zengshanMap from './data/zengshan-excerpts.json';
import { HEXAGRAMS } from './hexagrams.ts';
import { getHexVoice } from './hex-voice.ts';

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

const SHELL_ZENG =
  /本卦关键词偏|先定用神，再看世应动变|《增删卜易》义理：先定用神/;

function buildZengshan(
  name: string,
  hex: (typeof HEXAGRAMS)[number] | undefined,
): string {
  const raw = ZENG[name];
  const voice = getHexVoice(name);
  const kw = hex?.keywords.slice(0, 3).join('、') ?? '';
  const gist = hex?.gist ?? voice?.metaphorSolo ?? '';
  const tip = voice?.decision.split('\n')[0] ?? '静则论旺衰得失，动则追变爻生克。';

  if (raw && !SHELL_ZENG.test(raw) && voice) {
    if (!raw.includes(voice.frame)) {
      return `${raw} 教学补注：本卦主「${voice.frame}」。`;
    }
    return raw;
  }

  if (voice) {
    return (
      `《增删卜易》义理摘录（教学整理）：占此卦先定用神，次看世应、动变。` +
      `本卦主「${voice.frame}」${kw ? `（关键词：${kw}）` : ''}。${gist} ` +
      `读法要点：${tip} 静则论旺衰得失，动则追变爻生克，勿见吉凶字面即断。`
    );
  }

  return raw ?? '《增删卜易》义理：先定用神，再看世应动变。';
}

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
    zengshan: buildZengshan(g.name, hex),
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
