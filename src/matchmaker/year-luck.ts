/**
 * 按故事年取两人的大运 / 流年，并标出红鸾、驿马等红娘可读线索
 */
import { castBaziChart } from '../bazi/cast.ts';
import { buildLuckCycles } from '../bazi/luck-cycles.ts';
import {
  hongLuanBranch,
  liunianHasHongLuan,
  liunianHasTianXi,
  liunianHasYiMa,
} from '../bazi/shensha.ts';
import { findDayunForYear, findLiunianForYear } from '../bazi/sense-shuttle.ts';
import type { MatchmakerCharacter } from './characters.ts';

export type PersonYearLuck = {
  personId: string;
  nickname: string;
  year: number;
  age: number;
  natalYearBranch: string;
  natalDayBranch: string;
  dayunGanZhi: string;
  dayunStemGod: string;
  dayunStartYear: number;
  dayunEndYear: number;
  dayunEmpty: boolean;
  liunianGanZhi: string;
  liunianStemGod: string;
  liunianBranch: string;
  hongLuan: boolean;
  tianXi: boolean;
  yiMa: boolean;
  /** 红娘可读短句 */
  clues: string[];
};

export type CoupleYearLuck = {
  year: number;
  a: PersonYearLuck;
  b: PersonYearLuck;
  meetBoost: boolean;
  travelBoost: boolean;
  /** 为什么偏偏这一年容易遇见 / 有机会 */
  opportunityLine: string;
};

function genderOf(ch: MatchmakerCharacter): '' | 'female' | 'male' {
  return ch.gender === 'female' || ch.gender === 'male' ? ch.gender : '';
}

export function personYearLuck(
  ch: MatchmakerCharacter,
  year: number,
): PersonYearLuck | null {
  const gender = genderOf(ch);
  const chart = castBaziChart(ch, year, { gender, includeLiunian: false });
  if ('error' in chart) return null;
  const luck = buildLuckCycles(ch, gender, year);
  if (!luck) return null;
  const dayun = findDayunForYear(luck, year);
  const liu = findLiunianForYear(luck, year);
  const natalYearBranch = chart.yearBranch;
  const natalDayBranch = chart.dayBranch;
  const liunianBranch = liu?.branch ?? '';
  const hongLuan = liunianHasHongLuan(natalYearBranch, liunianBranch);
  const tianXi = liunianHasTianXi(natalYearBranch, liunianBranch);
  const yiMa = liunianHasYiMa(natalYearBranch, natalDayBranch, liunianBranch);
  const birthYear = Number(ch.birthYear) || year;
  const age = Math.max(1, year - birthYear + 1);
  const dayunGanZhi = dayun && !dayun.empty ? dayun.ganZhi : '';
  const dayunStemGod = dayun && !dayun.empty ? dayun.stemGod : '';
  const clues: string[] = [];
  if (dayunGanZhi) {
    clues.push(
      `大运 ${dayunGanZhi}${dayunStemGod ? `（${dayunStemGod}）` : ''} · ${dayun!.startYear}–${dayun!.endYear}`,
    );
  } else {
    clues.push('大运：起运前或童限，背景还没完全展开');
  }
  if (liu?.ganZhi) {
    clues.push(`流年 ${liu.ganZhi}${liu.stemGod ? `（${liu.stemGod}）` : ''}`);
  }
  if (hongLuan) {
    clues.push(
      `流年逢红鸾（年支${natalYearBranch}起红鸾在${hongLuanBranch(natalYearBranch)}，今年支正见）——容易撞上认识新人的机会`,
    );
  }
  if (tianXi) clues.push('流年逢天喜——喜庆、聚会的气味更浓');
  if (yiMa) clues.push('流年逢驿马——走动、出差、换地儿的线索更响');
  if (/外地|出差|换了工作|跑/.test(`${ch.situation}${ch.wish}${ch.job}`)) {
    clues.push(`经历侧：${ch.situation}`);
  }

  return {
    personId: ch.id,
    nickname: ch.nickname,
    year,
    age,
    natalYearBranch,
    natalDayBranch,
    dayunGanZhi,
    dayunStemGod,
    dayunStartYear: dayun?.startYear ?? year,
    dayunEndYear: dayun?.endYear ?? year,
    dayunEmpty: !dayun || dayun.empty,
    liunianGanZhi: liu?.ganZhi ?? '',
    liunianStemGod: liu?.stemGod ?? '',
    liunianBranch,
    hongLuan,
    tianXi,
    yiMa,
    clues,
  };
}

function buildOpportunityLine(a: PersonYearLuck, b: PersonYearLuck, year: number): string {
  const hongNames = [a, b].filter((p) => p.hongLuan).map((p) => p.nickname);
  const maNames = [a, b].filter((p) => p.yiMa).map((p) => p.nickname);
  const parts: string[] = [`${year}年`];
  if (hongNames.length) {
    parts.push(`${hongNames.join('、')}流年列见红鸾，盘上给「出现认识新人的机会」加权`);
  }
  if (maNames.length) {
    parts.push(`${maNames.join('、')}流年驿马，生活里更容易多留一晚、多跑一趟`);
  }
  if (!hongNames.length && !maNames.length) {
    parts.push('这一年没有硬红鸾/驿马标记，机会更多来自场合与你牵的线');
  }
  return `${parts.join('。')}。`;
}

export function coupleYearLuck(
  a: MatchmakerCharacter,
  b: MatchmakerCharacter,
  year: number,
): CoupleYearLuck | null {
  const pa = personYearLuck(a, year);
  const pb = personYearLuck(b, year);
  if (!pa || !pb) return null;
  return {
    year,
    a: pa,
    b: pb,
    meetBoost: pa.hongLuan || pb.hongLuan || pa.tianXi || pb.tianXi,
    travelBoost: pa.yiMa || pb.yiMa,
    opportunityLine: buildOpportunityLine(pa, pb, year),
  };
}

/**
 * 选定故事起点年：优先两人成年后、且至少一人流年逢红鸾的年份；否则取较年长者约 26 岁那年。
 */
export function pickStoryStartYear(
  a: MatchmakerCharacter,
  b: MatchmakerCharacter,
  opts?: { preferFrom?: number; preferTo?: number },
): number {
  const byA = Number(a.birthYear) || 1995;
  const byB = Number(b.birthYear) || 1995;
  const older = Math.min(byA, byB);
  const younger = Math.max(byA, byB);
  const from = opts?.preferFrom ?? younger + 22;
  const to = opts?.preferTo ?? older + 38;
  let best: number | null = null;
  let bestScore = -1;
  for (let y = from; y <= to; y++) {
    const luck = coupleYearLuck(a, b, y);
    if (!luck) continue;
    const ageA = luck.a.age;
    const ageB = luck.b.age;
    if (ageA < 20 || ageB < 20 || ageA > 42 || ageB > 42) continue;
    let score = 0;
    if (luck.meetBoost) score += 5;
    if (luck.a.hongLuan || luck.b.hongLuan) score += 3;
    if (luck.travelBoost) score += 2;
    if (ageA >= 24 && ageA <= 32) score += 1;
    if (ageB >= 24 && ageB <= 32) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = y;
    }
  }
  if (best != null) return best;
  return younger + 26;
}

/** 谁更像「这一年在走动」——驿马优先，其次经历文案 */
export function pickTraveler(
  a: MatchmakerCharacter,
  b: MatchmakerCharacter,
  luck: CoupleYearLuck,
): MatchmakerCharacter {
  if (luck.a.yiMa && !luck.b.yiMa) return a;
  if (luck.b.yiMa && !luck.a.yiMa) return b;
  const score = (ch: MatchmakerCharacter) => {
    let s = 0;
    if (/外地|出差|跑|换了工作|驻/.test(`${ch.situation}${ch.wish}${ch.job}`)) s += 3;
    if (/事业|闯/.test(ch.wish)) s += 1;
    return s;
  };
  return score(a) >= score(b) ? a : b;
}

/** 谁更像「这一年容易撞上新人」——红鸾优先 */
export function pickHongLuanFocus(
  a: MatchmakerCharacter,
  b: MatchmakerCharacter,
  luck: CoupleYearLuck,
): MatchmakerCharacter {
  if (luck.a.hongLuan && !luck.b.hongLuan) return a;
  if (luck.b.hongLuan && !luck.a.hongLuan) return b;
  return a;
}
