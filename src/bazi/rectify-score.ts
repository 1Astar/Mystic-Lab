import { LunarUtil, Solar } from 'lunar-javascript';
import type { LifeProfileInput } from '../life/types.ts';
import { resolveBirthPlaceLng } from './cities.ts';
import { listHourCandidates, type HourCandidate, type RectifyTimeBand } from './rectify-candidates.ts';
import { filledEvents, type RectifyEvent, type RectifyEventType } from './rectify-events.ts';
import { categorizeTenGod, type TenGodCategory } from './ten-gods.ts';
import { toTrueSolarDate } from './true-solar.ts';

export type RankedHourCandidate = {
  candidate: HourCandidate;
  score: number;
  rationale: string;
  tieGroup: number;
};

const TYPE_PREFER: Record<RectifyEventType, TenGodCategory[]> = {
  study: ['yin', 'shi_shang'],
  career: ['guan_sha', 'cai', 'shi_shang'],
  relation: ['cai', 'guan_sha', 'yin'],
  move: ['bi_jie', 'shi_shang'],
  health: ['guan_sha', 'shi_shang'],
  family: ['yin', 'guan_sha'],
  peak: ['shi_shang', 'guan_sha', 'cai'],
  low: ['guan_sha', 'bi_jie', 'shi_shang'],
  other: ['shi_shang', 'cai', 'guan_sha'],
};

function genderCode(gender: '' | 'female' | 'male'): number {
  // lunar-javascript: 1 男 0 女；未知按女（顺逆差异存在即可复现）
  return gender === 'male' ? 1 : 0;
}

function shiShen(dayGan: string, otherGan: string): string {
  if (!dayGan || !otherGan) return '';
  const table = LunarUtil.SHI_SHEN as Record<string, string>;
  return table[dayGan + otherGan] || '';
}

type LiuHit = { year: number; ganZhi: string; stemGod: string; cat: TenGodCategory | null };

function liunianHitsForProfile(
  profile: LifeProfileInput,
  birthHour: string,
  gender: '' | 'female' | 'male',
  years: number[],
): LiuHit[] {
  const y = Number(profile.birthYear);
  const m = Number(profile.birthMonth);
  const d = Number(profile.birthDay);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return [];

  const hm = birthHour.split(':');
  const hour = Number(hm[0] ?? 12);
  const minute = Number(hm[1] ?? 0);
  const place = resolveBirthPlaceLng(profile.birthPlace);
  const clock = new Date(y, m - 1, d, hour, minute, 0);
  if (Number.isNaN(clock.getTime())) return [];
  const trueSolar = toTrueSolarDate(clock, place.lng);
  const lunar = Solar.fromDate(trueSolar).getLunar();
  const ec = lunar.getEightChar() as unknown as {
    getDayGan: () => string;
    getYun: (gender: number) => {
      getDaYun: () => Array<{
        getStartYear: () => number;
        getEndYear?: () => number;
        getLiuNian: () => Array<{ getYear: () => number; getGanZhi: () => string }>;
      }>;
    };
  };
  const dayGan = ec.getDayGan();
  const yun = ec.getYun(genderCode(gender));
  const daYunList = yun.getDaYun();

  const hits: LiuHit[] = [];
  for (const year of years) {
    for (const dy of daYunList) {
      const start = dy.getStartYear();
      const end = typeof dy.getEndYear === 'function' ? dy.getEndYear() : start + 9;
      if (year < start || year > end) continue;
      const liu = dy.getLiuNian() || [];
      const row = liu.find((n) => n.getYear() === year);
      if (!row) continue;
      const ganZhi = row.getGanZhi();
      const stem = ganZhi.charAt(0);
      const god = shiShen(dayGan, stem);
      hits.push({
        year,
        ganZhi,
        stemGod: god,
        cat: categorizeTenGod(god),
      });
      break;
    }
  }
  return hits;
}

function yearsForEvent(e: RectifyEvent): number[] {
  if (e.yearSlack === 1) return [e.year - 1, e.year, e.year + 1];
  return [e.year];
}

function scoreOne(
  profile: LifeProfileInput,
  gender: '' | 'female' | 'male',
  candidate: HourCandidate,
  events: RectifyEvent[],
): { score: number; rationale: string } {
  let score = 0;
  const bits: string[] = [];

  for (const ev of events) {
    const years = yearsForEvent(ev);
    const hits = liunianHitsForProfile(profile, candidate.birthHour, gender, years);
    if (hits.length === 0) {
      score += 1;
      continue;
    }
    // 取该事件窗口内最高分的一年
    let best = 0;
    let bestHit = hits[0]!;
    const prefer = TYPE_PREFER[ev.type];
    for (const h of hits) {
      let s = 4;
      if (h.cat && prefer.includes(h.cat)) s += 6;
      else if (h.cat) s += 2;
      if (s > best) {
        best = s;
        bestHit = h;
      }
    }
    score += best;
    if (bits.length < 3) {
      bits.push(`${bestHit.year}流年${bestHit.ganZhi}`);
    }
  }

  // 轻微：候选越多，同分越常见——用时柱字码微扰保持稳定排序
  score = score * 100 + candidate.midHour;

  const rationale =
    bits.length > 0
      ? `对照 ${bits.join('、')} 等流年结构`
      : '能排出流年结构，但贴合信号偏弱';

  return { score, rationale };
}

/**
 * 规则打分：事件年 ↔ 流年十神偏好。禁止 LLM。
 * 返回按分数降序；并列时 tieGroup 相同。
 */
export function scoreHourCandidates(
  profile: LifeProfileInput,
  gender: '' | 'female' | 'male',
  band: RectifyTimeBand,
  events: RectifyEvent[],
): RankedHourCandidate[] {
  const filled = filledEvents(events);
  if (filled.length < 3) return [];

  const candidates = listHourCandidates(profile, band);
  const ranked = candidates.map((candidate) => {
    const { score, rationale } = scoreOne(profile, gender, candidate, filled);
    return { candidate, score, rationale, tieGroup: 0 };
  });

  ranked.sort((a, b) => b.score - a.score || a.candidate.midHour - b.candidate.midHour);

  // 分数主段相同视为并列（去掉 midHour 微扰）
  let group = 0;
  for (let i = 0; i < ranked.length; i++) {
    if (i > 0) {
      const prev = Math.floor(ranked[i - 1]!.score / 100);
      const cur = Math.floor(ranked[i]!.score / 100);
      if (cur !== prev) group += 1;
    }
    ranked[i]!.tieGroup = group;
  }

  return ranked;
}
