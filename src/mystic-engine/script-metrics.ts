/**
 * 剧本导演只抓 3 个核心指标：动变+日月冲合 · 卦名走向 · 世应用神关系
 */
import type { CastResult } from '../liuyao/engine.ts';
import { dressHexagram } from '../liuyao/najia.ts';
import { siZhuFromDate } from '../liuyao/ganzhi.ts';
import { buildReadingFacts } from '../liuyao/reading-facts.ts';
import {
  isAnDong,
  isYuePo,
} from '../liuyao/yao-special.ts';
import type { ShiYingRel } from '../liuyao/wuxing.ts';

/** 慢节奏 / 渐进类 */
const SLOW_HEX = new Set([
  '渐',
  '需',
  '屯',
  '蹇',
  '小畜',
  '蛊',
  '升',
  '晋',
  '贲',
]);

/** 停止 / 守住 / 止步类 */
const STOP_HEX = new Set([
  '艮',
  '剥',
  '遁',
  '否',
  '困',
  '明夷',
  '颐',
  '大畜',
  '蹇',
  '观',
]);

export type HexPace =
  | 'slow_then_stop'
  | 'slow'
  | 'stop'
  | 'soft_flow'
  | 'cut_open'
  | 'neutral';

export type CoreMetrics = {
  hasAnDong: boolean;
  hasYuePo: boolean;
  /** 暗动 + 月破 同时出现 = 拉锯战 */
  tugOfWar: boolean;
  hasMoving: boolean;
  pace: HexPace;
  primaryName: string;
  changedName: string | null;
  shiYingRel: ShiYingRel;
  yongHint: string;
  dayBranch: string;
  monthBranch: string;
};

function branchOfGanzhi(gz: string): string {
  return gz.slice(1) || '';
}

function detectPace(cast: CastResult): HexPace {
  const from = cast.primary.name;
  const to = cast.changed?.name ?? null;
  const slow = SLOW_HEX.has(from);
  const stopTo = to ? STOP_HEX.has(to) : false;
  const stopFrom = STOP_HEX.has(from);

  if (slow && stopTo) return 'slow_then_stop';
  if (stopTo || (stopFrom && !to)) return 'stop';
  if (slow) return 'slow';

  const kw = [
    ...cast.primary.keywords,
    ...(cast.changed?.keywords ?? []),
  ].join('');
  if (/柔|顺|渗|风|缓/.test(kw)) return 'soft_flow';
  if (/断|决|夬|开|闯/.test(kw)) return 'cut_open';
  return 'neutral';
}

export function extractCoreMetrics(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): CoreMetrics {
  const sz = siZhuFromDate(castAt);
  const dayBranch = branchOfGanzhi(sz.day);
  const monthBranch = branchOfGanzhi(sz.month);
  const dressed = dressHexagram(cast, sz.dayStem);

  let hasAnDong = false;
  let hasYuePo = false;
  for (const row of dressed.rows) {
    if (isAnDong(row, dayBranch)) hasAnDong = true;
    if (isYuePo(row, monthBranch)) hasYuePo = true;
  }

  const facts = buildReadingFacts(cast, question);
  return {
    hasAnDong,
    hasYuePo,
    tugOfWar: hasAnDong && hasYuePo,
    hasMoving: cast.changingIndexes.length > 0,
    pace: detectPace(cast),
    primaryName: cast.primary.name,
    changedName: cast.changed?.name ?? null,
    shiYingRel: facts.shiYingRel.rel,
    yongHint: facts.yong.name,
    dayBranch,
    monthBranch,
  };
}
