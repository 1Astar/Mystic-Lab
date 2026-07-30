/**
 * 盘面信号：对照六爻「分析」步 —— 用神、旺衰、动变、世应、原忌、日月冲
 * 供条件触发规则使用（现象 A）。
 */
import type { CastResult } from '../liuyao/engine.ts';
import { buildReadingFacts } from '../liuyao/reading-facts.ts';
import { buildYongStatusPack, type WangXiang } from '../liuyao/yao-strength.ts';
import { extractCoreMetrics, type CoreMetrics, type HexPace } from './script-metrics.ts';
import type { IntentId } from './types.ts';
import { detectIntents } from './intent.ts';

export type BoardSignals = CoreMetrics & {
  intentId: IntentId;
  question: string;
  yongName: string;
  yongWhy: string;
  yongWang: WangXiang | null;
  yongWeak: boolean;
  yongStrong: boolean;
  yongKong: boolean;
  yongMoving: boolean;
  hasYuan: boolean;
  hasJi: boolean;
  yuanTip: string;
  jiTip: string;
  bareQuit: boolean;
  timingAsk: boolean;
};

function isBareQuit(q: string): boolean {
  return /裸辞|不找下家.*辞|直接辞|马上辞|立刻辞/.test(q);
}

function isTimingAsk(q: string): boolean {
  return /几月|何时|什么时候|月底|月初|年底|时机|应期|什么时候能|哪天/.test(q);
}

export function collectBoardSignals(input: {
  question: string;
  cast: CastResult;
  castAt?: Date;
  intentId?: IntentId;
}): BoardSignals {
  const castAt = input.castAt ?? new Date();
  const q = input.question;
  const intentId =
    input.intentId ?? detectIntents(q)[0]?.id ?? 'open_explore';
  const core = extractCoreMetrics(input.cast, q, castAt);
  const facts = buildReadingFacts(input.cast, q, castAt);
  const yongPack = buildYongStatusPack(input.cast, q, castAt);
  const wang = yongPack.wangXiang;
  const yongWeak = wang === '休' || wang === '囚' || wang === '死';
  const yongStrong = wang === '旺' || wang === '相';

  return {
    ...core,
    intentId,
    question: q,
    yongName: facts.yong.name || core.yongHint || '本题关键点',
    yongWhy: facts.yong.why || facts.yong.tip || '',
    yongWang: wang,
    yongWeak,
    yongStrong,
    yongKong: yongPack.kong,
    yongMoving: yongPack.moving,
    hasYuan: Boolean(facts.shengKe.whyYuan),
    hasJi: Boolean(facts.shengKe.whyJi),
    yuanTip: facts.shengKe.whyYuan ?? '',
    jiTip: facts.shengKe.whyJi ?? '',
    bareQuit: isBareQuit(q),
    timingAsk: isTimingAsk(q) || intentId === 'timing',
  };
}

export type Phenomenon =
  | 'tugOfWar'
  | 'anDong'
  | 'yuePo'
  | 'pace_stop'
  | 'pace_slow_then_stop'
  | 'pace_slow'
  | 'shiYing_ke'
  | 'shiYing_sheng'
  | 'yong_weak'
  | 'yong_strong'
  | 'yong_kong'
  | 'yong_moving'
  | 'has_ji'
  | 'has_yuan'
  | 'has_moving'
  | 'bare_quit'
  | 'timing_ask'
  | 'no_change';

export function signalHas(s: BoardSignals, p: Phenomenon): boolean {
  switch (p) {
    case 'tugOfWar':
      return s.tugOfWar;
    case 'anDong':
      return s.hasAnDong && !s.tugOfWar;
    case 'yuePo':
      return s.hasYuePo && !s.tugOfWar;
    case 'pace_stop':
      return s.pace === 'stop';
    case 'pace_slow_then_stop':
      return s.pace === 'slow_then_stop';
    case 'pace_slow':
      return s.pace === 'slow' || s.pace === 'slow_then_stop';
    case 'shiYing_ke':
      return s.shiYingRel === '相克';
    case 'shiYing_sheng':
      return s.shiYingRel === '相生';
    case 'yong_weak':
      return s.yongWeak;
    case 'yong_strong':
      return s.yongStrong;
    case 'yong_kong':
      return s.yongKong;
    case 'yong_moving':
      return s.yongMoving;
    case 'has_ji':
      return s.hasJi;
    case 'has_yuan':
      return s.hasYuan;
    case 'has_moving':
      return s.hasMoving;
    case 'bare_quit':
      return s.bareQuit;
    case 'timing_ask':
      return s.timingAsk;
    case 'no_change':
      return !s.changedName;
    default:
      return false;
  }
}

export function allPhenomena(s: BoardSignals, list: Phenomenon[]): boolean {
  return list.every((p) => signalHas(s, p));
}

export function paceLabel(pace: HexPace): string {
  switch (pace) {
    case 'slow_then_stop':
      return '慢推进后可能急刹车';
    case 'slow':
      return '偏慢、要等';
    case 'stop':
      return '偏停、宜守';
    case 'soft_flow':
      return '宜柔进';
    case 'cut_open':
      return '宜决断';
    default:
      return '宜观后动';
  }
}
