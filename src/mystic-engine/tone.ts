import type { CastResult } from '../liuyao/engine.ts';
import type { Tone } from './types.ts';

const SOFT = /涣|巽|渐|柔|渗|反复|沟通|协调|磨合/;
const FLOW = /涣|旅|未济|散|流动|漂|迁/;
const HARD = /困|蹇|否|剥|坎|险|阻/;
const OPEN = /泰|同人|大有|升|晋|鼎|丰|既济/;
const CUT = /夬|革|遁|退|决/;

function kwBag(cast: CastResult): string {
  const a = cast.primary.keywords.join('、');
  const b = cast.changed?.keywords.join('、') ?? '';
  return `${cast.primary.name}${cast.primary.fullName}${a}${b}${cast.changed?.name ?? ''}${cast.changed?.fullName ?? ''}`;
}

/** 从卦象关键词推断语气气质（供动作库索引） */
export function detectTone(cast: CastResult): Tone {
  const bag = kwBag(cast);
  if (SOFT.test(bag)) return 'soft';
  if (FLOW.test(bag)) return 'flow';
  if (CUT.test(bag)) return 'cut';
  if (HARD.test(bag)) return 'hard';
  if (OPEN.test(bag)) return 'open';
  return 'neutral';
}

export function toneBag(cast: CastResult): string {
  return kwBag(cast);
}
