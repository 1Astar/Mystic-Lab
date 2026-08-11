import type { CastResult } from '../liuyao/engine.ts';
import type { Tone } from './types.ts';

/** 按卦名归桶，避免关键词误伤（如「渐进」→soft、「革新」→cut、「沟通」→soft） */
const SOFT_NAMES = new Set(['涣', '巽', '渐', '家人', '中孚', '小畜']);
const FLOW_NAMES = new Set(['旅', '未济', '解', '随']);
const HARD_NAMES = new Set(['困', '蹇', '否', '剥', '坎', '明夷', '讼', '大过']);
const OPEN_NAMES = new Set(['泰', '同人', '大有', '升', '晋', '鼎', '丰', '既济', '益', '萃']);
const CUT_NAMES = new Set(['夬', '革', '遁', '噬嗑', '姤']);

const TONE_PRIORITY: Tone[] = ['soft', 'flow', 'cut', 'hard', 'open'];

function toneOfName(name: string | undefined | null): Tone | null {
  if (!name) return null;
  if (SOFT_NAMES.has(name)) return 'soft';
  if (FLOW_NAMES.has(name)) return 'flow';
  if (CUT_NAMES.has(name)) return 'cut';
  if (HARD_NAMES.has(name)) return 'hard';
  if (OPEN_NAMES.has(name)) return 'open';
  return null;
}

function pickPreferred(a: Tone | null, b: Tone | null): Tone | null {
  if (!a) return b;
  if (!b) return a;
  const ia = TONE_PRIORITY.indexOf(a);
  const ib = TONE_PRIORITY.indexOf(b);
  return ia <= ib ? a : b;
}

export function toneBag(cast: CastResult): string {
  const a = cast.primary.keywords.join('、');
  const b = cast.changed?.keywords.join('、') ?? '';
  return `${cast.primary.name}${cast.primary.fullName}${a}${b}${cast.changed?.name ?? ''}${cast.changed?.fullName ?? ''}`;
}

export type ToneFlags = {
  soft: boolean;
  flow: boolean;
  hard: boolean;
  open: boolean;
  cut: boolean;
  /** 兼容旧文案拼接 */
  bag: string;
};

/** 本/变卦气质标记（名称优先，可叠加） */
export function toneFlags(cast: CastResult): ToneFlags {
  const names = [cast.primary.name, cast.changed?.name];
  const soft = names.some((n) => n != null && SOFT_NAMES.has(n));
  const flow = names.some((n) => n != null && FLOW_NAMES.has(n));
  const hard = names.some((n) => n != null && HARD_NAMES.has(n));
  const open = names.some((n) => n != null && OPEN_NAMES.has(n));
  const cut = names.some((n) => n != null && CUT_NAMES.has(n));
  return { soft, flow, hard, open, cut, bag: toneBag(cast) };
}

/** 从本/变卦名推断语气气质（供动作库索引） */
export function detectTone(cast: CastResult): Tone {
  const primary = toneOfName(cast.primary.name);
  const changed = toneOfName(cast.changed?.name);
  return pickPreferred(primary, changed) ?? 'neutral';
}
