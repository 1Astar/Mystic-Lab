import { LunarUtil, Solar } from 'lunar-javascript';
import type { LifeProfileInput } from '../life/types.ts';
import { resolveBirthPlaceLng } from './cities.ts';
import type { BaziChart } from './cast.ts';
import { categorizeTenGod, type TenGodCategory } from './ten-gods.ts';
import { toTrueSolarDate } from './true-solar.ts';

export type YearForecast = {
  year: number;
  title: string;
  /** 一句年度定调 */
  tone: string;
  weather: string;
  scene: string;
  advice: string;
  /** 宜 · 生活向 */
  dos: string[];
  /** 忌 · 生活向 */
  donts: string[];
  /** 若有十年气运层 */
  decadeNote?: string;
  decadeTitle?: string;
  /** 引导去盘面看流年 */
  chartCta: string;
};

type WeatherPack = {
  weather: string;
  scene: string;
  advice: string;
  tone: string;
  dos: string[];
  donts: string[];
};

const WEATHER: Record<TenGodCategory, WeatherPack> = {
  guan_sha: {
    weather: '猛烈的东风季',
    scene:
      '这阵风会推着你往前走，可能带来职场上的压力、更硬的对手，或不得不扛的责任。',
    advice:
      '风大的时候不要急着逆风起飞，先蹲下找稳住根基的机会——风暴里往往也藏着意外的收成。',
    tone: '今年主调偏「扛压推进」：规则与评价更显眼，宜把责任拆成可核对的小步。',
    dos: [
      '把权责写清楚：谁拍板、谁交付、何时验收。',
      '关键节点先备份再冲；风暴里留退路。',
      '用一次可展示的成果换评价，少空耗。',
    ],
    donts: [
      '别硬顶所有压力；会先耗空再崩。',
      '忌一次性梭哈升职/跳槽窗口。',
      '别把别人的节奏当成你的死线。',
    ],
  },
  cai: {
    weather: '交易窗口的晴热天',
    scene: '资源与机会更容易露面：谈条件、盯结果、看见钱与资源的流动。',
    advice: '窗口来了敢接，也要设止损；别把一次运气当成永久气候。',
    tone: '今年主调偏「结果与资源」：机会会露面，关键是报价与止损。',
    dos: [
      '大额前写止损与核对点，再动手。',
      '把本事报价：别人愿不愿付钱是硬反馈。',
      '小窗口先试一单，再决定加码。',
    ],
    donts: [
      '别把人情借贷当现金流。',
      '忌只谈机会不谈交付。',
      '别把一次好运当成永久气候。',
    ],
  },
  yin: {
    weather: '云层厚重的蓄力天',
    scene: '更适合学习、求助、被托住——信息与贵人感会比硬冲更有用。',
    advice: '别硬刚所有不确定，先把「弄懂再上场」当成这季的护身符。',
    tone: '今年主调偏「蓄力与求援」：弄懂再上场，比硬冲更贴气候。',
    dos: [
      '先补一门会立刻用上的信息或技能。',
      '主动开口找托住你的人与资源。',
      '把「弄懂规则」当成这季护身符。',
    ],
    donts: [
      '别在雾里硬刚所有不确定。',
      '忌闭门硬扛、拒一切协作。',
      '别把学习停在收藏夹，要有出口。',
    ],
  },
  shi_shang: {
    weather: '表达欲抬头的干热天',
    scene: '想法与作品更容易被看见，也容易说得太满或做得太散。',
    advice: '选一个出口专心输出；少同时开播所有频道。',
    tone: '今年主调偏「输出与被看见」：适合亮作品，忌散开太多频道。',
    dos: [
      '选一个出口专心交付可见作品。',
      '公开发表前先给可信的人过一眼。',
      '把表达落成可报价的服务或作品。',
    ],
    donts: [
      '少同时开播所有频道。',
      '忌说得太满、交付跟不上。',
      '别只热情绪、不沉淀成果。',
    ],
  },
  bi_jie: {
    weather: '并排气流的多云天',
    scene: '同侪、搭档与竞争会同时出现——并肩时有力，较劲时也费神。',
    advice: '分清谁是队友谁是赛道；把力气花在可互换的协作上。',
    tone: '今年主调偏「同侪与协作」：并肩有力，也要分清队友与赛道。',
    dos: [
      '找可互换的协作，把力气花在队友上。',
      '约一次对齐会：目标、分工、边界。',
      '用小项目验证默契，再谈长期绑定。',
    ],
    donts: [
      '别把较劲当成唯一动力。',
      '忌独处太久却抱怨没人帮。',
      '别把所有人都当成对手。',
    ],
  },
};

const FALLBACK: YearForecast = {
  year: new Date().getFullYear(),
  title: '今年的天气还在成形',
  tone: '线索还不够清晰：先稳住脚步，用小验证观察风向。',
  weather: '薄雾天',
  scene: '线索还不够清晰，先把脚步放稳，观察风向再动。',
  advice: '少做一次性豪赌，多做可回看的小验证。',
  dos: ['每周做一件可回看的小验证。', '先观察再加码。'],
  donts: ['少做一次性豪赌。', '别在雾里梭哈大决定。'],
  chartCta: '想核对落点？去命盘解析看流年列 ›',
};

function genderCode(gender: '' | 'female' | 'male'): number {
  return gender === 'male' ? 1 : 0;
}

function shiShen(dayGan: string, otherGan: string): string {
  if (!dayGan || !otherGan) return '';
  const table = LunarUtil.SHI_SHEN as Record<string, string>;
  return table[dayGan + otherGan] || '';
}

function catFromGod(label: string): TenGodCategory | null {
  return categorizeTenGod(label);
}

function decadeWeather(cat: TenGodCategory | null): string | undefined {
  if (!cat) return undefined;
  const map: Record<TenGodCategory, string> = {
    guan_sha: '这十年大气候偏「强风压境」——责任与压力会反复到访。',
    cai: '这十年大气候偏「丰收窗口」——结果与资源更常被点名。',
    yin: '这十年大气候偏「厚云蓄力」——学习与被托住是主旋律。',
    shi_shang: '这十年大气候偏「晴热表达」——输出与被看见更关键。',
    bi_jie: '这十年大气候偏「并排气流」——人脉与竞争会缠在一起。',
  };
  return map[cat];
}

/**
 * 从档案取当前大运干支神（规则，依赖 lunar-javascript）。
 */
export function currentDayunGod(
  profile: LifeProfileInput,
  gender: '' | 'female' | 'male',
  year: number,
): { ganZhi: string; stemGod: string; cat: TenGodCategory | null } | null {
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
  const lunar = Solar.fromDate(trueSolar).getLunar();
  const ec = lunar.getEightChar() as unknown as {
    getDayGan: () => string;
    getYun: (g: number) => {
      getDaYun: () => Array<{
        getStartYear: () => number;
        getEndYear?: () => number;
        getGanZhi?: () => string;
      }>;
    };
  };
  const dayGan = ec.getDayGan();
  const list = ec.getYun(genderCode(gender)).getDaYun() || [];
  for (const dy of list) {
    const start = dy.getStartYear();
    const end = typeof dy.getEndYear === 'function' ? dy.getEndYear() : start + 9;
    if (year < start || year > end) continue;
    const ganZhi =
      typeof dy.getGanZhi === 'function' ? dy.getGanZhi() : '';
    const stem = ganZhi.charAt(0);
    const stemGod = shiShen(dayGan, stem);
    return { ganZhi, stemGod, cat: catFromGod(stemGod) };
  }
  return null;
}

/**
 * 年度天气预报：流年十神 → 生活场景。不写七杀等术语。
 */
export function buildYearForecast(
  chart: BaziChart,
  profile: LifeProfileInput,
  opts?: { gender?: '' | 'female' | 'male'; year?: number },
): YearForecast {
  const year = opts?.year ?? chart.liunianYear ?? new Date().getFullYear();
  const gender = opts?.gender ?? '';
  const chartCta = '想核对落点？去命盘解析看流年列 ›';

  const liu = chart.pillars.find((p) => p.key === 'liunian' && !p.empty);
  let cat = liu ? catFromGod(liu.stemGod) : null;

  const dayun = currentDayunGod(profile, gender, year);
  if (!cat && dayun) cat = dayun.cat;

  if (!cat) {
    return { ...FALLBACK, year, chartCta };
  }

  const pack = WEATHER[cat];
  const decadeNote = dayun ? decadeWeather(dayun.cat) : undefined;

  return {
    year,
    title: `${year} · 你的年度天气预报`,
    tone: pack.tone,
    weather: pack.weather,
    scene: pack.scene,
    advice: pack.advice,
    dos: pack.dos,
    donts: pack.donts,
    decadeNote,
    decadeTitle: decadeNote ? '这段大运的大气候' : undefined,
    chartCta,
  };
}
