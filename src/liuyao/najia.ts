import type { CastResult } from './engine.ts';
import {
  LINE_LABELS,
  palaceOfHexagram,
  upperLowerFromLines,
  yingLineOf,
  type LineBit,
} from './hexagrams.ts';
import type { TrigramId } from './trigrams.ts';
import type { WuXing } from './wuxing.ts';
import { trigramWuXing } from './wuxing.ts';

export type LiuQin = '兄弟' | '子孙' | '妻财' | '官鬼' | '父母';

export type LiuShen = '青龙' | '朱雀' | '勾陈' | '腾蛇' | '白虎' | '玄武';

export type YaoDress = {
  index: number;
  label: string;
  bit: LineBit;
  changing: boolean;
  branch: string;
  wuxing: WuXing;
  liuqin: LiuQin;
  liushen: LiuShen;
  isShi: boolean;
  isYing: boolean;
  changedBranch?: string;
  changedWuxing?: WuXing;
};

export type DressedHexagram = {
  palace: TrigramId;
  palaceWx: WuXing;
  rows: YaoDress[];
};

/** 京房纳甲：自下而上三爻地支 */
const NAJIA: Record<TrigramId, [string, string, string]> = {
  乾: ['子', '寅', '辰'],
  坤: ['未', '巳', '卯'],
  震: ['子', '寅', '辰'],
  巽: ['丑', '亥', '酉'],
  坎: ['寅', '辰', '午'],
  离: ['卯', '丑', '亥'],
  艮: ['辰', '午', '申'],
  兑: ['巳', '卯', '丑'],
};

const BRANCH_WX: Record<string, WuXing> = {
  子: '水',
  亥: '水',
  寅: '木',
  卯: '木',
  巳: '火',
  午: '火',
  申: '金',
  酉: '金',
  辰: '土',
  戌: '土',
  丑: '土',
  未: '土',
};

const LIUSHEN_CYCLE: LiuShen[] = ['青龙', '朱雀', '勾陈', '腾蛇', '白虎', '玄武'];

/** 日干 → 初爻六神起点 */
const STEM_START: Record<string, LiuShen> = {
  甲: '青龙',
  乙: '青龙',
  丙: '朱雀',
  丁: '朱雀',
  戊: '勾陈',
  己: '腾蛇',
  庚: '白虎',
  辛: '白虎',
  壬: '玄武',
  癸: '玄武',
};

const SHENG: Record<WuXing, WuXing> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};

const KE: Record<WuXing, WuXing> = {
  木: '土',
  土: '水',
  水: '火',
  火: '金',
  金: '木',
};

export function branchWuXing(branch: string): WuXing {
  return BRANCH_WX[branch] ?? '土';
}

export function liuqinOf(palaceWx: WuXing, lineWx: WuXing): LiuQin {
  if (palaceWx === lineWx) return '兄弟';
  if (SHENG[palaceWx] === lineWx) return '子孙';
  if (KE[palaceWx] === lineWx) return '妻财';
  if (KE[lineWx] === palaceWx) return '官鬼';
  if (SHENG[lineWx] === palaceWx) return '父母';
  return '兄弟';
}

export function liushenForDayStem(dayStem: string): LiuShen[] {
  const start = STEM_START[dayStem] ?? '青龙';
  const i0 = LIUSHEN_CYCLE.indexOf(start);
  return [0, 1, 2, 3, 4, 5].map((k) => LIUSHEN_CYCLE[(i0 + k) % 6]!);
}

export function branchesFromLines(lines: LineBit[]): string[] {
  const { upper, lower } = upperLowerFromLines(lines);
  return [...NAJIA[lower.id], ...NAJIA[upper.id]];
}

export function dressHexagram(cast: CastResult, dayStem: string): DressedHexagram {
  const palace = palaceOfHexagram(cast.primary.name) ?? cast.primary.lower;
  const palaceWx = trigramWuXing(palace);
  const branches = branchesFromLines(cast.primaryLines);
  const changedBranches =
    cast.changed && cast.changingIndexes.length > 0
      ? branchesFromLines(cast.changedLines)
      : null;
  const gods = liushenForDayStem(dayStem);

  const rows: YaoDress[] = [0, 1, 2, 3, 4, 5].map((i) => {
    const branch = branches[i]!;
    const wuxing = branchWuXing(branch);
    const changing = cast.changingIndexes.includes(i);
    const row: YaoDress = {
      index: i,
      label: LINE_LABELS[i]!,
      bit: cast.primaryLines[i]!,
      changing,
      branch,
      wuxing,
      liuqin: liuqinOf(palaceWx, wuxing),
      liushen: gods[i]!,
      isShi: cast.shiLine === i + 1,
      isYing: cast.yingLine === i + 1,
    };
    if (changing && changedBranches) {
      row.changedBranch = changedBranches[i];
      row.changedWuxing = branchWuXing(changedBranches[i]!);
    }
    return row;
  });

  return { palace, palaceWx, rows };
}

/** 变卦独立装卦（世应按变卦八宫重定；六神与日干同序） */
export function dressChangedHexagram(
  cast: CastResult,
  dayStem: string,
): DressedHexagram | null {
  if (!cast.changed) return null;
  const palace = palaceOfHexagram(cast.changed.name) ?? cast.changed.lower;
  const palaceWx = trigramWuXing(palace);
  const branches = branchesFromLines(cast.changedLines);
  const gods = liushenForDayStem(dayStem);
  const shi = cast.changed.shiLine;
  const ying = yingLineOf(shi);

  const rows: YaoDress[] = [0, 1, 2, 3, 4, 5].map((i) => {
    const branch = branches[i]!;
    const wuxing = branchWuXing(branch);
    return {
      index: i,
      label: LINE_LABELS[i]!,
      bit: cast.changedLines[i]!,
      changing: false,
      branch,
      wuxing,
      liuqin: liuqinOf(palaceWx, wuxing),
      liushen: gods[i]!,
      isShi: shi === i + 1,
      isYing: ying === i + 1,
    };
  });

  return { palace, palaceWx, rows };
}

export const LIUQIN_PLAIN: Record<LiuQin, string> = {
  兄弟: '同侪环境 / 盟友圈——同代人、社交圈、竞争与合作中的拉扯。',
  子孙: '内在创造力 / 破局点——灵感、破框、身体与放松愉悦的源泉。',
  妻财: '物质根基 / 自我价值——可掌控资源、回报与安全感来源。',
  官鬼: '目标系统 / 外部规则——职位项目、KPI、考核与社会评价框架。',
  父母: '安全基地 / 信息网——知识经验、文书合同、支持系统与基础盘。',
};

export const LIUSHEN_PLAIN: Record<LiuShen, string> = {
  青龙: '喜庆、贵人、文书顺利的气色。',
  朱雀: '口舌、信息、考试发言、吵闹。',
  勾陈: '迟滞、田土、纠缠、公务手续。',
  腾蛇: '虚惊、怪异、心神不定。',
  白虎: '凶险、伤灾、刚猛、手术血光（象义，非定论）。',
  玄武: '暗昧、偷盗、隐私、暧昧不明。',
};
