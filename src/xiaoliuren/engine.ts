import { getSixGodByIndex, type SixGod } from './six-gods.ts';
import type { ChineseHour } from './chinese-hour.ts';
import type { LunarDate } from './lunar.ts';

export type CountPhase = 'month' | 'day' | 'hour';

export type CountStep = {
  phase: CountPhase;
  title: string;
  detail: string;
  fromIndex: number;
  count: number;
  hops: number[];
  landingIndex: number;
};

export type LessonResult = {
  steps: CountStep[];
  resultIndex: number;
  result: SixGod;
  basisLabel: string;
};

function buildHops(fromIndex: number, count: number): number[] {
  const hops: number[] = [];
  for (let i = 0; i < count; i++) {
    hops.push((fromIndex + i) % 6);
  }
  return hops;
}

function buildStep(
  phase: CountPhase,
  title: string,
  detail: string,
  fromIndex: number,
  count: number,
): CountStep {
  const hops = buildHops(fromIndex, count);
  return {
    phase,
    title,
    detail,
    fromIndex,
    count,
    hops,
    landingIndex: hops[hops.length - 1] ?? fromIndex,
  };
}

/** 从食指下节大安起，顺数农历月 → 日 → 时辰（子=1 … 亥=12） */
export function computeLesson(
  lunar: LunarDate,
  hour: ChineseHour,
): LessonResult {
  const monthStep = buildStep(
    'month',
    '第一步：从月起',
    `农历${lunar.monthLabel} → 从大安起，顺数 ${lunar.month} 位`,
    0,
    lunar.month,
  );

  const dayStep = buildStep(
    'day',
    '第二步：从日起',
    `农历${lunar.dayLabel} → 从上一步落点「${getSixGodByIndex(monthStep.landingIndex).name}」继续，再顺数 ${lunar.day} 位（不重回大安）`,
    monthStep.landingIndex,
    lunar.day,
  );

  const hourStep = buildStep(
    'hour',
    '第三步：从时起',
    `${hour.label}（第 ${hour.order} 个时辰）→ 从「${getSixGodByIndex(dayStep.landingIndex).name}」继续，再顺数 ${hour.order} 位`,
    dayStep.landingIndex,
    hour.order,
  );

  const resultIndex = hourStep.landingIndex;
  const result = getSixGodByIndex(resultIndex);
  const basisLabel = `${lunar.label} · ${hour.label}`;

  return {
    steps: [monthStep, dayStep, hourStep],
    resultIndex,
    result,
    basisLabel,
  };
}
