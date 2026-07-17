import type { CountPhase, CountStep } from './engine.ts';
import type { ChineseHour } from './chinese-hour.ts';
import type { LunarDate } from './lunar.ts';
import { getSixGodByIndex, SIX_GODS } from './six-gods.ts';

/** 正月→大安 … 六月→空亡，七月起循环 */
export const MONTH_GOD_CYCLE = SIX_GODS.map((g) => g.name);

export type PhaseTeach = {
  title: string;
  lead: string;
  rules: string[];
  example: string;
  conclusion: string;
};

/** 农历月 → 六神名（正月大安 … 六月空亡，七月循环） */
export function monthGodName(month: number): string {
  return MONTH_GOD_CYCLE[(month - 1 + 6) % 6];
}

export function buildPhaseTeach(
  phase: CountPhase,
  lunar: LunarDate,
  hour: ChineseHour,
  steps: CountStep[],
): PhaseTeach {
  if (phase === 'month') {
    const land = getSixGodByIndex(steps[0].landingIndex).name;
    return {
      title: '第一步：从月起',
      lead: '小六壬第一步，以农历月份作为起点。',
      rules: [
        '正月起大安。',
        '之后顺时针：正月大安 → 二月留连 → 三月速喜 → 四月赤口 → 五月小吉 → 六月空亡，然后循环。',
      ],
      example:
        '例如农历六月：从大安起 1大安 → 2留连 → 3速喜 → 4赤口 → 5小吉 → 6空亡，所以六月落空亡。',
      conclusion: `此刻农历${lunar.monthLabel}：从大安顺数 ${lunar.month} 位，落「${land}」。`,
    };
  }

  if (phase === 'day') {
    const from = getSixGodByIndex(steps[0].landingIndex).name;
    const land = getSixGodByIndex(steps[1].landingIndex).name;
    const firstDayGod = from;
    return {
      title: '第二步：从日起',
      lead: '以上一步得到的位置作为起点，按农历日期继续数。',
      rules: [
        '日数从当前月落点继续，不重回大安。',
        `月落点「${from}」算初一（第 1 位），再顺数到当日。`,
      ],
      example: `例如月初落到「${from}」时：初一落${firstDayGod}；若问初二，则再往前一位。`,
      conclusion: `此刻农历${lunar.dayLabel}：从「${from}」再顺数 ${lunar.day} 位，落「${land}」。`,
    };
  }

  const from = getSixGodByIndex(steps[1].landingIndex).name;
  const land = getSixGodByIndex(steps[2].landingIndex).name;
  return {
    title: '第三步：从时起',
    lead: '最后根据时辰，从上一日落点继续数，得到最终六神。',
    rules: [
      '子时为第 1 个时辰，丑为第 2 个……亥为第 12 个。',
      '时辰对照：子23–1 · 丑1–3 · 寅3–5 · 卯5–7 · 辰7–9 · 巳9–11 · 午11–13 · 未13–15 · 申15–17 · 酉17–19 · 戌19–21 · 亥21–23。',
    ],
    example: `当前是${hour.label}（${hour.alias} · ${hour.rangeLabel}），在十二时辰中排第 ${hour.order} 位。`,
    conclusion: `从「${from}」再顺数 ${hour.order} 位，落「${land}」。`,
  };
}

export function renderPhaseTeachCard(teach: PhaseTeach, opts?: { showMoon?: boolean }): string {
  const moon = opts?.showMoon
    ? `<div class="xlr-phase-moon" aria-hidden="true"><span class="xlr-phase-moon-disc"></span><span class="xlr-phase-moon-label">农历月</span></div>`
    : '';

  return `
    <details class="xlr-phase-teach">
      <summary class="xlr-phase-teach-summary">
        <span class="xlr-phase-teach-summary-label">本步规则说明</span>
        <span class="xlr-phase-teach-summary-hint">默认收起 · 点开查看</span>
      </summary>
      <div class="xlr-phase-teach-body">
        ${moon}
        <p class="xlr-phase-teach-lead">${teach.lead}</p>
        <ul class="xlr-phase-teach-rules">
          ${teach.rules.map((r) => `<li>${r}</li>`).join('')}
        </ul>
        <p class="xlr-phase-teach-example">${teach.example}</p>
        <p class="xlr-phase-teach-conclusion"><strong>所以：</strong>${teach.conclusion}</p>
      </div>
    </details>
  `;
}
