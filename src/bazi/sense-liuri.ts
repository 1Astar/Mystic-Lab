/**
 * 流日相对日主：十神 → 心态气候白话（周度脑内天气用）
 */
import { Solar } from 'lunar-javascript';
import type { BaziChart } from './cast.ts';
import { stemTenGod } from './cast.ts';
import { categorizeTenGod, type TenGodCategory } from './ten-gods.ts';

export type LiuriDay = {
  dateKey: string;
  weekday: string;
  ganZhi: string;
  stemGod: string;
  cat: TenGodCategory | null;
  /** 一句气候 */
  climate: string;
  /** 可能心态 */
  moodHint: string;
  /** 对照提示 */
  matchHint: string;
};

const WEEKDAY = ['日', '一', '二', '三', '四', '五', '六'];

const CAT_CLIMATE: Record<TenGodCategory, { climate: string; moodHint: string; matchHint: string }> =
  {
    bi_jie: {
      climate: '比肩/劫财日 · 同侪气流',
      moodHint: '容易想并肩、较劲，或找人一起扛；也易比较内耗。',
      matchHint: '若你这天特别想躺平或特别想跟人硬杠，都可能对上「比劫」色。',
    },
    shi_shang: {
      climate: '食伤日 · 表达出口',
      moodHint: '脑子里点子多，想输出、想被看见；也易散开太多频道。',
      matchHint: '若你这天特别想搞大事或话特别多，常对上「食伤」出口欲。',
    },
    cai: {
      climate: '财星日 · 结果窗口',
      moodHint: '更盯结果、资源、划算不划算；也易焦虑「抓不抓得住」。',
      matchHint: '若你这天算账、谈条件、纠结机会，可能对上「财」窗口。',
    },
    guan_sha: {
      climate: '官杀日 · 责任压感',
      moodHint: '评价与规则更显眼，想把事做对；也易被压力推着走。',
      matchHint: '若你这天肩上沉、怕被盯，或突然想扛大责，常对上「官杀」。',
    },
    yin: {
      climate: '印星日 · 蓄力求援',
      moodHint: '更想弄懂、求助、被托住；硬冲会觉得空。',
      matchHint: '若你这天极度想躺平补信息、或只想被理解，可能对上「印」。',
    },
  };

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function dateKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 公历日 → 流日干支与相对日主十神 */
export function buildLiuriDay(chart: BaziChart, d: Date): LiuriDay {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const solar = Solar.fromYmd(y, m, day);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar() as unknown as {
    getDay: () => string;
    getDayGan: () => string;
  };
  const ganZhi = ec.getDay() || `${ec.getDayGan()}—`;
  const dayStem = ganZhi.charAt(0);
  const stemGod = stemTenGod(chart.dayMaster, dayStem);
  const cat = categorizeTenGod(stemGod);
  const pack = cat
    ? CAT_CLIMATE[cat]
    : {
        climate: '流日信号偏淡',
        moodHint: '这天没有特别尖的十神色，适合按自己的节奏过。',
        matchHint: '对不上也正常——先记心态，再看有没有别的触发。',
      };

  return {
    dateKey: dateKeyFromDate(d),
    weekday: WEEKDAY[d.getDay()] ?? '—',
    ganZhi,
    stemGod,
    cat,
    climate: pack.climate,
    moodHint: pack.moodHint,
    matchHint: pack.matchHint,
  };
}

/** 本周一 00:00 起的 7 天 */
export function mondayOfWeek(d = new Date()): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

export function weekDates(anchor = new Date()): Date[] {
  const mon = mondayOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}
