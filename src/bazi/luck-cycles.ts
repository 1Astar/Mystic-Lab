/**
 * 大运 / 流年小运 / 流月：基于 lunar-javascript Yun API。
 */
import { LunarUtil, Solar } from 'lunar-javascript';
import type { LifeProfileInput } from '../life/types.ts';
import { resolveBirthPlaceLng } from './cities.ts';
import { toTrueSolarDate } from './true-solar.ts';

const LIUYUE_JIEQI = [
  '立春',
  '惊蛰',
  '清明',
  '立夏',
  '芒种',
  '小暑',
  '立秋',
  '白露',
  '寒露',
  '立冬',
  '大雪',
  '小寒',
] as const;

export type LuckPillar = {
  ganZhi: string;
  stem: string;
  branch: string;
  stemGod: string;
  branchGod: string;
};

export type DayunColumn = LuckPillar & {
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
  /** 童限等无干支 */
  empty: boolean;
  current: boolean;
};

export type LiunianColumn = LuckPillar & {
  year: number;
  age: number;
  xiaoYunGanZhi: string;
  current: boolean;
  selected: boolean;
};

export type LiuyueColumn = LuckPillar & {
  index: number;
  jieQi: string;
  /** M/D */
  dateLabel: string;
  current: boolean;
  selected: boolean;
};

export type LuckCycles = {
  dayGan: string;
  dayXunKong: string;
  /** 起运：出生后若干年若干月 */
  qiYunLabel: string;
  /** 交运起始阳历 */
  jiaoYunLabel: string;
  ageNow: number;
  dayun: DayunColumn[];
  liunian: LiunianColumn[];
  liuyue: LiuyueColumn[];
};

function genderCode(gender: '' | 'female' | 'male'): number {
  return gender === 'male' ? 1 : 0;
}

function shiShen(dayGan: string, otherGan: string): string {
  if (!dayGan || !otherGan) return '';
  const table = LunarUtil.SHI_SHEN as Record<string, string>;
  return table[dayGan + otherGan] || '';
}

function splitGz(gz: string): { stem: string; branch: string } {
  if (!gz || gz.length < 2) return { stem: '', branch: '' };
  return { stem: gz.charAt(0), branch: gz.charAt(1) };
}

function pillarOf(dayGan: string, ganZhi: string): LuckPillar {
  const { stem, branch } = splitGz(ganZhi);
  const hideTable = LunarUtil.ZHI_HIDE_GAN as Record<string, string[]>;
  const mainHide = hideTable[branch]?.[0] || '';
  return {
    ganZhi: ganZhi || '',
    stem,
    branch,
    stemGod: shiShen(dayGan, stem),
    branchGod: shiShen(dayGan, mainHide),
  };
}

function jieQiDate(year: number, name: string, index: number): Date | null {
  const tableYear = index === 11 ? year + 1 : year;
  const lunar = Solar.fromYmd(tableYear, 6, 15).getLunar() as unknown as {
    getJieQiTable: () => Record<string, { toYmd?: () => string; getMonth?: () => number; getDay?: () => number }>;
  };
  const solar = lunar.getJieQiTable()?.[name];
  if (!solar) return null;
  if (typeof solar.toYmd === 'function') {
    const [y, m, d] = solar.toYmd().split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
  }
  const m = solar.getMonth?.();
  const d = solar.getDay?.();
  if (m && d) return new Date(tableYear, m - 1, d);
  return null;
}

function formatMd(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

type DaYunLike = {
  getStartYear: () => number;
  getEndYear?: () => number;
  getStartAge?: () => number;
  getEndAge?: () => number;
  getGanZhi?: () => string;
  getLiuNian: () => Array<{
    getYear: () => number;
    getGanZhi: () => string;
    getAge?: () => number;
    getLiuYue?: () => Array<{ getGanZhi: () => string; getIndex?: () => number }>;
  }>;
  getXiaoYun?: () => Array<{ getYear: () => number; getGanZhi: () => string }>;
};

type YunLike = {
  getStartYear: () => number;
  getStartMonth: () => number;
  getStartDay: () => number;
  getStartHour?: () => number;
  getStartSolar?: () => { toYmd?: () => string; toYmdHms?: () => string };
  getDaYun: () => DaYunLike[];
};

/** 出生相对节气说明（仿参考盘顶栏） */
export function birthJieqiNote(profile: LifeProfileInput): string | null {
  const y = Number(profile.birthYear);
  const m = Number(profile.birthMonth);
  const d = Number(profile.birthDay);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const hm = (profile.birthHour || '12:00').split(/[:：]/);
  const hour = Number(hm[0] ?? 12);
  const minute = Number(hm[1] ?? 0);
  const place = resolveBirthPlaceLng(profile.birthPlace);
  const clock = new Date(y, m - 1, d, hour, minute, 0);
  if (Number.isNaN(clock.getTime())) return null;
  const trueSolar = toTrueSolarDate(clock, place.lng);
  const lunar = Solar.fromDate(trueSolar).getLunar() as unknown as {
    getPrevJieQi: (whole?: boolean) => {
      getName: () => string;
      getSolar: () => { toYmdHms?: () => string; toYmd?: () => string };
    };
  };
  const prev = lunar.getPrevJieQi(true);
  const name = prev.getName();
  const jqSolar = prev.getSolar();
  const jqStr = jqSolar.toYmdHms?.() ?? jqSolar.toYmd?.() ?? '';
  const jqDate = jqStr ? new Date(jqStr.replace(/-/g, '/')) : null;
  if (!jqDate || Number.isNaN(jqDate.getTime())) {
    return `出生节气：近${name}`;
  }
  const diffMs = trueSolar.getTime() - jqDate.getTime();
  const after = diffMs >= 0;
  const abs = Math.abs(diffMs);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const when = after ? '后' : '前';
  return `出生节气：出生于${name}(${jqStr.slice(0, 16)})${when}${days}天${hours}小时`;
}

/**
 * 排出大运 / 流年小运 / 流月，供命盘页横滑运程区。
 */
export function buildLuckCycles(
  profile: LifeProfileInput,
  gender: '' | 'female' | 'male',
  selectedYear: number,
  opts?: { now?: Date },
): LuckCycles | null {
  const y = Number(profile.birthYear);
  const m = Number(profile.birthMonth);
  const d = Number(profile.birthDay);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;

  const hm = (profile.birthHour || '12:00').split(/[:：]/);
  const hour = Number(hm[0] ?? 12);
  const minute = Number(hm[1] ?? 0);
  const place = resolveBirthPlaceLng(profile.birthPlace);
  const clock = new Date(y, m - 1, d, hour, minute, 0);
  if (Number.isNaN(clock.getTime())) return null;

  const now = opts?.now ?? new Date();
  const trueSolar = toTrueSolarDate(clock, place.lng);
  const lunar = Solar.fromDate(trueSolar).getLunar();
  const ec = lunar.getEightChar() as unknown as {
    getDayGan: () => string;
    getDayXunKong?: () => string;
    getYun: (g: number) => YunLike;
  };

  const dayGan = ec.getDayGan();
  const dayXunKong = typeof ec.getDayXunKong === 'function' ? ec.getDayXunKong() : '';
  const yun = ec.getYun(genderCode(gender));
  const daList = yun.getDaYun() || [];

  const qiYunLabel = `起运：出生后${yun.getStartYear()}年${yun.getStartMonth()}个月${yun.getStartDay()}天`;
  const startSolar = yun.getStartSolar?.();
  const jiaoYunLabel = startSolar?.toYmdHms?.()
    ? `交运：${startSolar.toYmdHms()}`
    : startSolar?.toYmd?.()
      ? `交运：${startSolar.toYmd()}`
      : '';

  const birthYear = y;
  const ageNow = Math.max(1, now.getFullYear() - birthYear);
  const yearNow = now.getFullYear();

  const dayun: DayunColumn[] = daList.map((dy) => {
    const startYear = dy.getStartYear();
    const endYear =
      typeof dy.getEndYear === 'function' ? dy.getEndYear() : startYear + 9;
    const ganZhi = typeof dy.getGanZhi === 'function' ? dy.getGanZhi() || '' : '';
    const empty = !ganZhi;
    const base = empty
      ? { ganZhi: '', stem: '', branch: '', stemGod: '', branchGod: '' }
      : pillarOf(dayGan, ganZhi);
    return {
      ...base,
      startYear,
      endYear,
      startAge: typeof dy.getStartAge === 'function' ? dy.getStartAge() : startYear - birthYear + 1,
      endAge: typeof dy.getEndAge === 'function' ? dy.getEndAge() : endYear - birthYear + 1,
      empty,
      current: selectedYear >= startYear && selectedYear <= endYear,
    };
  });

  const activeDy =
    daList.find((dy) => {
      const start = dy.getStartYear();
      const end = typeof dy.getEndYear === 'function' ? dy.getEndYear() : start + 9;
      return selectedYear >= start && selectedYear <= end;
    }) ??
    daList.find((dy) => {
      const start = dy.getStartYear();
      const end = typeof dy.getEndYear === 'function' ? dy.getEndYear() : start + 9;
      return yearNow >= start && yearNow <= end;
    }) ??
    daList[1] ??
    daList[0];

  const liunian: LiunianColumn[] = [];
  if (activeDy) {
    const xiaoMap = new Map<number, string>();
    for (const xy of activeDy.getXiaoYun?.() || []) {
      xiaoMap.set(xy.getYear(), xy.getGanZhi());
    }
    for (const ln of activeDy.getLiuNian() || []) {
      const year = ln.getYear();
      const ganZhi = ln.getGanZhi();
      const p = pillarOf(dayGan, ganZhi);
      liunian.push({
        ...p,
        year,
        age: typeof ln.getAge === 'function' ? ln.getAge() : year - birthYear + 1,
        xiaoYunGanZhi: xiaoMap.get(year) || '',
        current: year === yearNow,
        selected: year === selectedYear,
      });
    }
  }

  const selectedLiu =
    (activeDy?.getLiuNian() || []).find((n) => n.getYear() === selectedYear) ??
    (activeDy?.getLiuNian() || []).find((n) => n.getYear() === yearNow);

  const liuyue: LiuyueColumn[] = [];
  if (selectedLiu && typeof selectedLiu.getLiuYue === 'function') {
    const months = selectedLiu.getLiuYue() || [];
    const liuYear = selectedLiu.getYear();
    const nowTime = now.getTime();
    for (let i = 0; i < months.length; i++) {
      const row = months[i]!;
      const jieQi = LIUYUE_JIEQI[i] ?? `月${i + 1}`;
      const start = jieQiDate(liuYear, jieQi, i);
      const nextName = LIUYUE_JIEQI[i + 1];
      const end = nextName
        ? jieQiDate(liuYear, nextName, i + 1)
        : jieQiDate(liuYear + 1, '立春', 0);
      const p = pillarOf(dayGan, row.getGanZhi());
      const current =
        !!start &&
        !!end &&
        nowTime >= start.getTime() &&
        nowTime < end.getTime() &&
        liuYear === yearNow;
      liuyue.push({
        ...p,
        index: i,
        jieQi,
        dateLabel: start ? formatMd(start) : '',
        current,
        selected: false,
      });
    }
  }

  return {
    dayGan,
    dayXunKong,
    qiYunLabel,
    jiaoYunLabel,
    ageNow,
    dayun,
    liunian,
    liuyue,
  };
}
