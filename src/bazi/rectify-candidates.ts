import type { LifeProfileInput } from '../life/types.ts';
import { castBaziChart } from './cast.ts';
import { resolveBirthPlaceLng } from './cities.ts';
import {
  clockDateFromTrueSolar,
  clockHmForShichenMid,
  formatHm,
  hourToShichenBranch,
  toTrueSolarDate,
} from './true-solar.ts';

/** 十二时辰中点（真太阳时）与标准钟表区间说明 */
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
  /** 写入档案 / cast 用（当地钟表，已反推真太阳） */
  birthHour: string;
  /** 展示：含真太阳区间与当地钟表约点 */
  label: string;
  /** 时柱干支二字 */
  hourPillar: string;
  dayMaster: string;
  /** 当地钟表相对真太阳中点的偏移（分钟） */
  clockOffsetMin?: number;
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

function parseYmd(profile: LifeProfileInput): { y: number; m: number; d: number } | null {
  const y = Number(profile.birthYear);
  const m = Number(profile.birthMonth);
  const d = Number(profile.birthDay);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  if (y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

/** 时辰起止（真太阳）两端 → 当地钟表区间文案 */
function localClockRangeLabel(
  y: number,
  m: number,
  d: number,
  midHour: number,
  lng: number,
): string {
  const startHour = midHour === 0 ? 23 : midHour - 1;
  const endHour = midHour === 0 ? 1 : midHour + 1;
  const startClock = clockDateFromTrueSolar(new Date(y, m - 1, d, startHour, 0, 0), lng);
  const endClock = clockDateFromTrueSolar(new Date(y, m - 1, d, endHour, 0, 0), lng);
  return `${formatHm(startClock)}–${formatHm(endClock)}`;
}

/**
 * 固定年月日，按时段展开候选时柱。
 * birthHour = 使真太阳落在该时辰中点的当地钟表（含经度+均时差），避免「默认 19/20 点标准时」跨时辰。
 */
export function listHourCandidates(
  profile: LifeProfileInput,
  band: RectifyTimeBand,
): HourCandidate[] {
  const branches = resolveBranchesForBand(band);
  const ymd = parseYmd(profile);
  if (!ymd) return [];
  const place = resolveBirthPlaceLng(profile.birthPlace);
  const out: HourCandidate[] = [];

  for (const branch of branches) {
    const meta = metaOf(branch);
    if (!meta) continue;

    let birthHour = clockHmForShichenMid(ymd.y, ymd.m, ymd.d, meta.midHour, place.lng).clockHm;
    let pack = clockHmForShichenMid(ymd.y, ymd.m, ymd.d, meta.midHour, place.lng);

    // 校验：钟表 → 真太阳 → 时辰支应等于目标；边界再微调 ±30 分
    const verify = (hm: string): string | null => {
      const [hh, mm] = hm.split(':').map(Number);
      const clock = new Date(ymd.y, ymd.m - 1, ymd.d, hh ?? 0, mm ?? 0, 0);
      const tst = toTrueSolarDate(clock, place.lng);
      return hourToShichenBranch(tst.getHours()) === branch ? hm : null;
    };

    if (!verify(birthHour)) {
      for (const delta of [15, -15, 30, -30, 45, -45]) {
        const [hh, mm] = pack.clockHm.split(':').map(Number);
        const nudged = new Date(ymd.y, ymd.m - 1, ymd.d, hh ?? 0, (mm ?? 0) + delta, 0);
        const cand = formatHm(nudged);
        if (verify(cand)) {
          birthHour = cand;
          pack = { ...pack, clockHm: cand, offsetMin: pack.offsetMin + delta };
          break;
        }
      }
    }

    const chart = castBaziChart(
      { ...profile, birthHour },
      new Date().getFullYear(),
      { includeLiunian: false },
    );
    if ('error' in chart) continue;
    const hourCell = chart.pillars.find((p) => p.key === 'hour');
    if (!hourCell || hourCell.empty) continue;

    // 时柱地支应以真太阳为准；若仍不一致则跳过（极端边界）
    if (hourCell.branch && hourCell.branch !== branch) continue;

    const localRange = localClockRangeLabel(ymd.y, ymd.m, ymd.d, meta.midHour, place.lng);
    const placeBit = place.matched ? place.cityName : '东八区';
    out.push({
      branch,
      midHour: meta.midHour,
      birthHour,
      label: `${branch}时 · 真太阳约${meta.clockRange} · ${placeBit}钟表约${localRange}`,
      hourPillar: `${hourCell.stem}${hourCell.branch}`,
      dayMaster: chart.dayMaster,
      clockOffsetMin: pack.offsetMin,
    });
  }

  return out;
}
