import type { LifeProfileInput } from '../life/types.ts';
import { castBaziChart } from './cast.ts';

/** 十二时辰中点钟点（与 parse-birth SHICHEN 一致） */
export const SHICHEN_MID: ReadonlyArray<{ branch: string; midHour: number; clockRange: string }> = [
  { branch: '子', midHour: 0, clockRange: '23–1点' },
  { branch: '丑', midHour: 2, clockRange: '1–3点' },
  { branch: '寅', midHour: 4, clockRange: '3–5点' },
  { branch: '卯', midHour: 6, clockRange: '5–7点' },
  { branch: '辰', midHour: 8, clockRange: '7–9点' },
  { branch: '巳', midHour: 10, clockRange: '9–11点' },
  { branch: '午', midHour: 12, clockRange: '11–13点' },
  { branch: '未', midHour: 14, clockRange: '13–15点' },
  { branch: '申', midHour: 16, clockRange: '15–17点' },
  { branch: '酉', midHour: 18, clockRange: '17–19点' },
  { branch: '戌', midHour: 20, clockRange: '19–21点' },
  { branch: '亥', midHour: 22, clockRange: '21–23点' },
];

const BRANCH_ORDER = SHICHEN_MID.map((s) => s.branch);

export type RectifyTimeBand =
  | { kind: 'all' }
  | { kind: 'morning' }
  | { kind: 'afternoon' }
  | { kind: 'evening' }
  | { kind: 'night' }
  | { kind: 'branches'; branches: string[] };

export type HourCandidate = {
  branch: string;
  midHour: number;
  /** 写入档案 / cast 用，如 `6:00` */
  birthHour: string;
  /** 展示：卯时（约5–7点） */
  label: string;
  /** 时柱干支二字 */
  hourPillar: string;
  dayMaster: string;
};

/** 上午≈卯辰巳；下午≈午未申；傍晚≈酉戌；夜间≈亥子丑寅 */
export function resolveBranchesForBand(band: RectifyTimeBand): string[] {
  if (band.kind === 'all') return [...BRANCH_ORDER];
  if (band.kind === 'morning') return ['卯', '辰', '巳'];
  if (band.kind === 'afternoon') return ['午', '未', '申'];
  if (band.kind === 'evening') return ['酉', '戌'];
  if (band.kind === 'night') return ['亥', '子', '丑', '寅'];
  const wanted = new Set(
    band.branches.map((b) => b.replace(/时$/, '').trim()).filter(Boolean),
  );
  return BRANCH_ORDER.filter((b) => wanted.has(b));
}

function metaOf(branch: string): (typeof SHICHEN_MID)[number] | undefined {
  return SHICHEN_MID.find((s) => s.branch === branch);
}

/**
 * 固定年月日，按时段展开候选时柱（走现有 cast，含真太阳时）。
 * 日期无效或候选排盘失败 → 跳过该支；全无效 → []。
 */
export function listHourCandidates(
  profile: LifeProfileInput,
  band: RectifyTimeBand,
): HourCandidate[] {
  const branches = resolveBranchesForBand(band);
  const out: HourCandidate[] = [];

  for (const branch of branches) {
    const meta = metaOf(branch);
    if (!meta) continue;
    const birthHour = `${meta.midHour}:00`;
    const chart = castBaziChart(
      { ...profile, birthHour },
      new Date().getFullYear(),
      { includeLiunian: false },
    );
    if ('error' in chart) continue;
    const hourCell = chart.pillars.find((p) => p.key === 'hour');
    if (!hourCell || hourCell.empty) continue;
    out.push({
      branch,
      midHour: meta.midHour,
      birthHour,
      label: `${branch}时（约${meta.clockRange}）`,
      hourPillar: `${hourCell.stem}${hourCell.branch}`,
      dayMaster: chart.dayMaster,
    });
  }

  return out;
}
