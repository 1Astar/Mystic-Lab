import { LunarUtil, Solar } from 'lunar-javascript';
import type { LifeProfileInput } from '../life/types.ts';
import { resolveBirthPlaceLng, type PlaceResolve } from './cities.ts';
import {
  BRANCH_WUXING,
  STEM_WUXING,
  seasonStrength,
  type SeasonLabel,
  type WuXing,
} from './elements.ts';
import { parseBirthParts } from './parse-birth.ts';
import { diShiOf, nayinOf, xunKongOf, ziZuoOf } from './pillar-meta.ts';
import { describeBranchRelations } from './relations.ts';
import { shenshaForBranch } from './shensha.ts';
import { toTrueSolarDate } from './true-solar.ts';

export type PillarCell = {
  key: 'year' | 'month' | 'day' | 'hour' | 'liunian';
  title: string;
  stemGod: string;
  stem: string;
  branch: string;
  hideGan: string[];
  hideGods: string[];
  nayin: string;
  xunKong: string;
  diShi: string;
  ziZuo: string;
  shensha: string[];
  empty?: boolean;
};

export type BaziChart = {
  pillars: PillarCell[];
  dayMaster: string;
  dayMasterWx: WuXing | '';
  dayBranch: string;
  yearBranch: string;
  relations: string[];
  season: { label: WuXing; strength: SeasonLabel }[];
  place: PlaceResolve;
  clockLabel: string;
  trueSolarLabel: string;
  hasHour: boolean;
  liunianYear: number;
  birthYear: number;
};

type EightCharLike = {
  getYear: () => string;
  getMonth: () => string;
  getDay: () => string;
  getTime: () => string;
  getYearShiShenGan: () => string;
  getMonthShiShenGan: () => string;
  getDayShiShenGan: () => string;
  getTimeShiShenGan: () => string;
  getYearHideGan: () => string[];
  getMonthHideGan: () => string[];
  getDayHideGan: () => string[];
  getTimeHideGan: () => string[];
  getYearShiShenZhi: () => string[];
  getMonthShiShenZhi: () => string[];
  getDayShiShenZhi: () => string[];
  getTimeShiShenZhi: () => string[];
  getYearNaYin: () => string;
  getMonthNaYin: () => string;
  getDayNaYin: () => string;
  getTimeNaYin: () => string;
  getYearXunKong: () => string;
  getMonthXunKong: () => string;
  getDayXunKong: () => string;
  getTimeXunKong: () => string;
  getYearDiShi: () => string;
  getMonthDiShi: () => string;
  getDayDiShi: () => string;
  getTimeDiShi: () => string;
  getDayGan: () => string;
  getDayZhi: () => string;
  getYearZhi: () => string;
};

function splitGz(gz: string): { stem: string; branch: string } {
  return { stem: gz.charAt(0) || '—', branch: gz.charAt(1) || '—' };
}

function shiShen(dayGan: string, otherGan: string): string {
  if (!dayGan || !otherGan) return '—';
  const table = LunarUtil.SHI_SHEN as Record<string, string>;
  return table[dayGan + otherGan] || '—';
}

function hideGanOf(branch: string): string[] {
  const table = LunarUtil.ZHI_HIDE_GAN as Record<string, string[]>;
  return table[branch] ? [...table[branch]] : [];
}

function hideGodsOf(dayGan: string, branch: string): string[] {
  return hideGanOf(branch).map((g) => shiShen(dayGan, g));
}

function emptyPillar(key: PillarCell['key'], title: string): PillarCell {
  return {
    key,
    title,
    stemGod: '—',
    stem: '—',
    branch: '—',
    hideGan: [],
    hideGods: [],
    nayin: '—',
    xunKong: '—',
    diShi: '—',
    ziZuo: '—',
    shensha: [],
    empty: true,
  };
}

function decorateShensha(
  pillar: PillarCell,
  dayStem: string,
  yearBranch: string,
  dayBranch: string,
): PillarCell {
  if (pillar.empty) return pillar;
  return {
    ...pillar,
    shensha: shenshaForBranch({
      branch: pillar.branch,
      dayStem,
      yearBranch,
      dayBranch,
    }),
  };
}

function liunianPillar(
  dayGan: string,
  year: number,
  yearBranch: string,
  dayBranch: string,
): PillarCell {
  const lunar = Solar.fromYmdHms(year, 6, 15, 12, 0, 0).getLunar();
  const gz =
    typeof lunar.getYearInGanZhiExact === 'function'
      ? lunar.getYearInGanZhiExact()
      : lunar.getYearInGanZhi();
  const { stem, branch } = splitGz(gz);
  const cell: PillarCell = {
    key: 'liunian',
    title: '流年',
    stemGod: shiShen(dayGan, stem),
    stem,
    branch,
    hideGan: hideGanOf(branch),
    hideGods: hideGodsOf(dayGan, branch),
    nayin: nayinOf(gz),
    xunKong: xunKongOf(gz),
    diShi: diShiOf(dayGan, branch),
    ziZuo: ziZuoOf(stem, branch),
    shensha: [],
  };
  return decorateShensha(cell, dayGan, yearBranch, dayBranch);
}

function formatDt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function castBaziChart(
  profile: LifeProfileInput,
  liunianYear: number,
  opts?: { includeLiunian?: boolean },
): BaziChart | { error: string } {
  const includeLiunian = opts?.includeLiunian !== false;
  const parts = parseBirthParts(
    profile.birthYear,
    profile.birthMonth,
    profile.birthDay,
    profile.birthHour,
  );
  if (!parts) {
    return { error: '请填写完整的出生年、月、日后再排盘。' };
  }

  const place = resolveBirthPlaceLng(profile.birthPlace);
  const clock = new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    0,
  );
  if (Number.isNaN(clock.getTime())) {
    return { error: '出生日期无效，请检查年月日。' };
  }

  const trueSolar = toTrueSolarDate(clock, place.lng);
  const lunar = Solar.fromDate(trueSolar).getLunar();
  const ec = lunar.getEightChar() as EightCharLike;
  const dayGan = ec.getDayGan();
  const dayBranch = ec.getDayZhi();
  const yearBranch = ec.getYearZhi();

  const yearGz = ec.getYear();
  const monthGz = ec.getMonth();
  const dayGz = ec.getDay();
  const timeGz = ec.getTime();

  const y = splitGz(yearGz);
  const m = splitGz(monthGz);
  const d = splitGz(dayGz);
  const t = splitGz(timeGz);

  let pillars: PillarCell[] = [
    decorateShensha(
      {
        key: 'year',
        title: '年柱',
        stemGod: ec.getYearShiShenGan(),
        stem: y.stem,
        branch: y.branch,
        hideGan: [...ec.getYearHideGan()],
        hideGods: [...ec.getYearShiShenZhi()],
        nayin: ec.getYearNaYin(),
        xunKong: ec.getYearXunKong(),
        diShi: ec.getYearDiShi(),
        ziZuo: ziZuoOf(y.stem, y.branch),
        shensha: [],
      },
      dayGan,
      yearBranch,
      dayBranch,
    ),
    decorateShensha(
      {
        key: 'month',
        title: '月柱',
        stemGod: ec.getMonthShiShenGan(),
        stem: m.stem,
        branch: m.branch,
        hideGan: [...ec.getMonthHideGan()],
        hideGods: [...ec.getMonthShiShenZhi()],
        nayin: ec.getMonthNaYin(),
        xunKong: ec.getMonthXunKong(),
        diShi: ec.getMonthDiShi(),
        ziZuo: ziZuoOf(m.stem, m.branch),
        shensha: [],
      },
      dayGan,
      yearBranch,
      dayBranch,
    ),
    decorateShensha(
      {
        key: 'day',
        title: '日柱',
        stemGod: '日主',
        stem: d.stem,
        branch: d.branch,
        hideGan: [...ec.getDayHideGan()],
        hideGods: [...ec.getDayShiShenZhi()],
        nayin: ec.getDayNaYin(),
        xunKong: ec.getDayXunKong(),
        diShi: ec.getDayDiShi(),
        ziZuo: ziZuoOf(d.stem, d.branch),
        shensha: [],
      },
      dayGan,
      yearBranch,
      dayBranch,
    ),
  ];

  if (parts.hasHour) {
    pillars.push(
      decorateShensha(
        {
          key: 'hour',
          title: '时柱',
          stemGod: ec.getTimeShiShenGan(),
          stem: t.stem,
          branch: t.branch,
          hideGan: [...ec.getTimeHideGan()],
          hideGods: [...ec.getTimeShiShenZhi()],
          nayin: ec.getTimeNaYin(),
          xunKong: ec.getTimeXunKong(),
          diShi: ec.getTimeDiShi(),
          ziZuo: ziZuoOf(t.stem, t.branch),
          shensha: [],
        },
        dayGan,
        yearBranch,
        dayBranch,
      ),
    );
  } else {
    pillars.push(emptyPillar('hour', '时柱'));
  }

  if (includeLiunian) {
    pillars.push(liunianPillar(dayGan, liunianYear, yearBranch, dayBranch));
  }

  const relationBranches = pillars.filter((p) => !p.empty).map((p) => p.branch);
  const strength = seasonStrength(m.branch);
  const season = (['木', '火', '土', '金', '水'] as WuXing[]).map((label) => ({
    label,
    strength: strength[label],
  }));

  return {
    pillars,
    dayMaster: dayGan,
    dayMasterWx: STEM_WUXING[dayGan] ?? '',
    dayBranch,
    yearBranch,
    relations: describeBranchRelations(relationBranches),
    season,
    place,
    clockLabel: `${formatDt(clock)}（${parts.hourLabel}）`,
    trueSolarLabel: formatDt(trueSolar),
    hasHour: parts.hasHour,
    liunianYear,
    birthYear: parts.year,
  };
}

export type HepanCompare = {
  selfToPartner: string;
  partnerToSelf: string;
  dayRelation: string[];
  note: string;
};

export function compareHepan(self: BaziChart, partner: BaziChart): HepanCompare {
  const selfToPartner = shiShen(self.dayMaster, partner.dayMaster);
  const partnerToSelf = shiShen(partner.dayMaster, self.dayMaster);
  const dayRelation = describeBranchRelations([self.dayBranch, partner.dayBranch]);
  const note = `你日主${self.dayMaster}看对方为「${selfToPartner}」；对方日主${partner.dayMaster}看你为「${partnerToSelf}」。`;
  return { selfToPartner, partnerToSelf, dayRelation, note };
}

export function stemWxClass(stem: string): string {
  const wx = STEM_WUXING[stem];
  if (!wx) return '';
  return `wx-${wx === '木' ? 'mu' : wx === '火' ? 'huo' : wx === '土' ? 'tu' : wx === '金' ? 'jin' : 'shui'}`;
}

export function branchWxClass(branch: string): string {
  const wx = BRANCH_WUXING[branch];
  if (!wx) return '';
  return `wx-${wx === '木' ? 'mu' : wx === '火' ? 'huo' : wx === '土' ? 'tu' : wx === '金' ? 'jin' : 'shui'}`;
}
