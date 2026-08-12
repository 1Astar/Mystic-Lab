/**
 * 真格局 / 完整喜用神
 * - 正格：月令十神；月支见禄/刃则建禄/羊刃优先
 * - 外格切片：专旺五格 + 从儿/财/杀/旺软标（启发式）
 * - 喜用忌：扶抑 / 顺势从势 + 调候
 * 规则推演，非子平全书；合大运再看。软话术，不恐吓。
 */
import type { BaziChart } from './cast.ts';
import { dayStrengthOf } from './bazi-facts.ts';
import {
  climateOfMonth,
  type ClimateFeel,
} from './harmonize-tint.ts';
import { type SeasonLabel, type WuXing } from './elements.ts';
import { scoreChartWx } from './sense-energy.ts';
import {
  collectTenGodLabels,
  countCategories,
  type TenGodCategory,
} from './ten-gods.ts';

/** 我生（食伤） */
const SHI_SHANG: Record<WuXing, WuXing> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};

/** 克我（官杀） */
const GUAN_SHA: Record<WuXing, WuXing> = {
  木: '金',
  火: '水',
  土: '木',
  金: '火',
  水: '土',
};

/** 我克（财） */
const CAI: Record<WuXing, WuXing> = {
  木: '土',
  火: '金',
  土: '水',
  金: '木',
  水: '火',
};

/** 生我（印） */
const YIN: Record<WuXing, WuXing> = {
  木: '水',
  火: '木',
  土: '火',
  金: '土',
  水: '金',
};

const LU: Record<string, string> = {
  甲: '寅',
  乙: '卯',
  丙: '巳',
  丁: '午',
  戊: '巳',
  己: '午',
  庚: '申',
  辛: '酉',
  壬: '亥',
  癸: '子',
};

const YANG_REN: Record<string, string> = {
  甲: '卯',
  乙: '寅',
  丙: '午',
  丁: '巳',
  戊: '午',
  己: '巳',
  庚: '酉',
  辛: '申',
  壬: '子',
  癸: '亥',
};

const PATTERN_FROM_GOD: Record<string, string> = {
  正官: '正官格',
  七杀: '七杀格',
  正财: '正财格',
  偏财: '偏财格',
  食神: '食神格',
  伤官: '伤官格',
  正印: '正印格',
  偏印: '偏印格',
  比肩: '比肩格',
  劫财: '劫财格',
};

/** 专旺五格：月令对口 + 日主同行 */
const ZHUAN_WANG: ReadonlyArray<{
  wx: WuXing;
  name: string;
  months: readonly string[];
}> = [
  { wx: '木', name: '曲直格', months: ['寅', '卯'] },
  { wx: '火', name: '炎上格', months: ['巳', '午'] },
  { wx: '土', name: '稼穑格', months: ['辰', '戌', '丑', '未'] },
  { wx: '金', name: '从革格', months: ['申', '酉'] },
  { wx: '水', name: '润下格', months: ['亥', '子'] },
];

const WX_PLAIN: Record<WuXing, string> = {
  木: '生长与伸展',
  火: '表达与热度',
  土: '承载与落地',
  金: '边界与收口',
  水: '流动与智谋',
};

export type BodyStrengthBand = '身旺' | '身弱' | '中和';

export type PatternMode =
  | 'zheng'
  | 'zhuan_wang'
  | 'cong_er'
  | 'cong_cai'
  | 'cong_sha'
  | 'cong_wang';

export type YongShenItem = {
  wx: WuXing;
  role: '喜用' | '忌神' | '调候';
  why: string;
};

export type PatternYongshenPack = {
  dayMaster: string;
  dayMasterWx: WuXing | '';
  dayStrength: SeasonLabel;
  bodyBand: BodyStrengthBand;
  /** 如「正官格」「曲直格」「从儿格」 */
  patternName: string;
  /** 取格依据一句 */
  patternWhy: string;
  patternMode: PatternMode;
  /** 扶抑 / 专旺顺势 / 从势 */
  method: string;
  yong: YongShenItem[];
  ji: YongShenItem[];
  tiaoHou: YongShenItem[];
  /** 喜用五行（去重，含调候若并入喜用侧） */
  yongWx: WuXing[];
  jiWx: WuXing[];
  headline: string;
  playbook: string;
  boundary: string;
  climate: ClimateFeel[];
};

type PatternHit = {
  name: string;
  why: string;
  mode: PatternMode;
};

function isStrong(s: SeasonLabel): boolean {
  return s === '旺' || s === '相';
}

function isWeak(s: SeasonLabel): boolean {
  return s === '休' || s === '囚' || s === '死';
}

export function bodyBandOf(strength: SeasonLabel): BodyStrengthBand {
  if (isStrong(strength)) return '身旺';
  if (isWeak(strength)) return '身弱';
  return '中和';
}

function sumScores(scores: Record<WuXing, number>): number {
  return (Object.values(scores) as number[]).reduce((a, b) => a + b, 0);
}

function resolveZhengPattern(chart: BaziChart): PatternHit {
  const month = chart.pillars.find((p) => p.key === 'month');
  const dm = chart.dayMaster;
  const mb = month && !month.empty ? month.branch : '';
  const msg = month && !month.empty ? month.stemGod.trim() : '';

  if (dm && mb && LU[dm] === mb) {
    return {
      name: '建禄格',
      why: `月支${mb}为日干${dm}之禄地：月令得禄，按建禄格读扶抑。`,
      mode: 'zheng',
    };
  }
  if (dm && mb && YANG_REN[dm] === mb) {
    return {
      name: '羊刃格',
      why: `月支${mb}为日干${dm}之羊刃：锋芒当令，按羊刃格看收放与扶抑。`,
      mode: 'zheng',
    };
  }
  if (msg && PATTERN_FROM_GOD[msg]) {
    return {
      name: PATTERN_FROM_GOD[msg]!,
      why: `月令天干十神为「${msg}」：以月令取格，作正格主轴。`,
      mode: 'zheng',
    };
  }
  return {
    name: '正格 · 月令未明取',
    why: '月令十神未落入常见取格表，先按日主旺衰做扶抑喜用；合大运再细辨。',
    mode: 'zheng',
  };
}

/**
 * 专旺五格启发式：月令对口 + 日主同行 + 本气分明显高于克神。
 * 导出供单测；产品入口走 resolvePatternYongshen。
 */
export function detectZhuanWang(
  chart: BaziChart,
  scores: Record<WuXing, number>,
): PatternHit | null {
  const dmWx = chart.dayMasterWx;
  if (!dmWx) return null;
  const month = chart.pillars.find((p) => p.key === 'month');
  const mb = month && !month.empty ? month.branch : '';
  if (!mb) return null;

  const row = ZHUAN_WANG.find((z) => z.wx === dmWx && z.months.includes(mb));
  if (!row) return null;

  const total = sumScores(scores) || 1;
  const self = scores[dmWx] ?? 0;
  const yinWx = YIN[dmWx];
  const support = self + (scores[yinWx] ?? 0) * 0.6;
  const oppose = scores[GUAN_SHA[dmWx]] ?? 0;
  const share = support / total;

  // 本气（含印助）够浓，克神偏弱
  if (share < 0.38 || self < oppose * 1.35) return null;

  return {
    name: row.name,
    why: `月令${mb}、日主${dmWx}同行，盘面${dmWx}气偏专：按「${row.name}」顺势读（启发式，非破局全书）。`,
    mode: 'zhuan_wang',
  };
}

/**
 * 从格软标：身弱跟最多的克泄耗；身旺跟比劫印势。
 */
export function detectCongGe(
  chart: BaziChart,
  band: BodyStrengthBand,
): PatternHit | null {
  const labels = collectTenGodLabels(chart);
  if (labels.length < 3) return null;
  const counts = countCategories(labels);
  const total = labels.length;
  const ranked = (
    Object.entries(counts) as [TenGodCategory, number][]
  ).sort((a, b) => b[1] - a[1]);
  const [topCat, topN] = ranked[0]!;
  if (topN < 2 || topN / total < 0.4) return null;

  if (band === '身弱') {
    if (topCat === 'shi_shang') {
      return {
        name: '从儿格（软）',
        why: `身弱且食伤类偏多（${topN}/${total}）：先按从儿势顺泄秀，勿硬扶（软标，非真假从全书）。`,
        mode: 'cong_er',
      };
    }
    if (topCat === 'cai') {
      return {
        name: '从财格（软）',
        why: `身弱且财星类偏多（${topN}/${total}）：先按从财势抓结果与交换，少空扛（软标）。`,
        mode: 'cong_cai',
      };
    }
    if (topCat === 'guan_sha') {
      return {
        name: '从杀格（软）',
        why: `身弱且官杀类偏多（${topN}/${total}）：先按从杀势立规矩与交付，少硬刚（软标）。`,
        mode: 'cong_sha',
      };
    }
    return null;
  }

  if (band === '身旺') {
    const follow = counts.bi_jie + counts.yin;
    const leak = counts.shi_shang + counts.cai + counts.guan_sha;
    if (follow >= 3 && follow > leak) {
      return {
        name: '从旺格（软）',
        why: `身旺且比劫/印势压过克泄耗：先按从旺顺势成势，少硬砍（软标，非真从全书）。`,
        mode: 'cong_wang',
      };
    }
  }
  return null;
}

/** 外格优先于正格；未命中再月令正格 */
export function resolvePatternHit(chart: BaziChart): PatternHit {
  const scores = scoreChartWx(chart);
  const band = bodyBandOf(dayStrengthOf(chart));
  const zhuan = detectZhuanWang(chart, scores);
  if (zhuan) return zhuan;
  const cong = detectCongGe(chart, band);
  if (cong) return cong;
  return resolveZhengPattern(chart);
}

function uniqWx(items: YongShenItem[]): WuXing[] {
  const seen = new Set<WuXing>();
  const out: WuXing[] = [];
  for (const it of items) {
    if (seen.has(it.wx)) continue;
    seen.add(it.wx);
    out.push(it.wx);
  }
  return out;
}

function yongJiForMode(
  dmWx: WuXing,
  band: BodyStrengthBand,
  mode: PatternMode,
): { yong: YongShenItem[]; ji: YongShenItem[]; method: string } {
  if (mode === 'zhuan_wang') {
    return {
      method: '专旺顺势（切片）· 泄秀为用',
      yong: [
        {
          wx: dmWx,
          role: '喜用',
          why: '专旺顺本气：把这一行的专长做满',
        },
        {
          wx: SHI_SHANG[dmWx],
          role: '喜用',
          why: '专旺宜泄秀：输出成可见成果',
        },
        {
          wx: YIN[dmWx],
          role: '喜用',
          why: '印星助专旺生发，宜学习托底',
        },
      ],
      ji: [
        {
          wx: GUAN_SHA[dmWx],
          role: '忌神',
          why: '专旺忌强克：少硬砍本气',
        },
        {
          wx: CAI[dmWx],
          role: '忌神',
          why: '专旺再猛耗，易散局；宜小步',
        },
      ],
    };
  }

  if (mode === 'cong_er') {
    return {
      method: '从儿势（软标）· 顺泄秀',
      yong: [
        {
          wx: SHI_SHANG[dmWx],
          role: '喜用',
          why: '从儿：食伤五行为主轴，表达与作品优先',
        },
        {
          wx: CAI[dmWx],
          role: '喜用',
          why: '食伤生财：把输出换成结果',
        },
      ],
      ji: [
        {
          wx: YIN[dmWx],
          role: '忌神',
          why: '从儿忌印夺食：少用「规矩压创意」硬扶',
        },
        {
          wx: dmWx,
          role: '忌神',
          why: '少靠比劫硬扛，顺着才轻松',
        },
      ],
    };
  }

  if (mode === 'cong_cai') {
    return {
      method: '从财势（软标）· 顺交换',
      yong: [
        {
          wx: CAI[dmWx],
          role: '喜用',
          why: '从财：资源与结果五行为主轴',
        },
        {
          wx: SHI_SHANG[dmWx],
          role: '喜用',
          why: '食伤生财：用表达推进交换',
        },
      ],
      ji: [
        {
          wx: dmWx,
          role: '忌神',
          why: '从财忌比劫争财：少硬抢',
        },
        {
          wx: YIN[dmWx],
          role: '忌神',
          why: '印多易滞财势，宜轻托',
        },
      ],
    };
  }

  if (mode === 'cong_sha') {
    return {
      method: '从杀势（软标）· 顺规矩',
      yong: [
        {
          wx: GUAN_SHA[dmWx],
          role: '喜用',
          why: '从杀：官杀五行立规矩、交付与挑战',
        },
        {
          wx: CAI[dmWx],
          role: '喜用',
          why: '财滋杀：用资源养责任',
        },
      ],
      ji: [
        {
          wx: YIN[dmWx],
          role: '忌神',
          why: '从杀忌印化杀过度：少用逃避式托底',
        },
        {
          wx: dmWx,
          role: '忌神',
          why: '少靠比劫硬刚权威',
        },
      ],
    };
  }

  if (mode === 'cong_wang') {
    return {
      method: '从旺势（软标）· 顺成势',
      yong: [
        {
          wx: dmWx,
          role: '喜用',
          why: '从旺：比劫同行成势',
        },
        {
          wx: YIN[dmWx],
          role: '喜用',
          why: '印星生扶，扩大势能',
        },
      ],
      ji: [
        {
          wx: GUAN_SHA[dmWx],
          role: '忌神',
          why: '从旺忌强克：少硬砍旺势',
        },
        {
          wx: CAI[dmWx],
          role: '忌神',
          why: '过耗易散从旺之势',
        },
      ],
    };
  }

  // 正格扶抑
  if (band === '身旺') {
    return {
      method: '扶抑法 · 月令取格',
      yong: [
        {
          wx: SHI_SHANG[dmWx],
          role: '喜用',
          why: '身旺宜泄：食伤五行帮你把力转化为表达与成果',
        },
        {
          wx: GUAN_SHA[dmWx],
          role: '喜用',
          why: '身旺宜克：官杀五行修剪锋芒，立规矩',
        },
        {
          wx: CAI[dmWx],
          role: '喜用',
          why: '身旺宜耗：财星五行疏导资源与结果',
        },
      ],
      ji: [
        {
          wx: YIN[dmWx],
          role: '忌神',
          why: '身旺再猛生扶，易闷胀难收',
        },
        {
          wx: dmWx,
          role: '忌神',
          why: '身旺比劫再叠，易争抢内耗',
        },
      ],
    };
  }
  if (band === '身弱') {
    return {
      method: '扶抑法 · 月令取格',
      yong: [
        {
          wx: YIN[dmWx],
          role: '喜用',
          why: '身弱宜生：印星五行托住根基与学习感',
        },
        {
          wx: dmWx,
          role: '喜用',
          why: '身弱宜助：比劫五行并肩，先站稳再出手',
        },
      ],
      ji: [
        {
          wx: GUAN_SHA[dmWx],
          role: '忌神',
          why: '身弱再加重压，易喘不过气',
        },
        {
          wx: SHI_SHANG[dmWx],
          role: '忌神',
          why: '身弱再泄秀，易散力难成器',
        },
        {
          wx: CAI[dmWx],
          role: '忌神',
          why: '身弱再耗财，宜小步别梭哈',
        },
      ],
    };
  }
  return {
    method: '扶抑法 · 月令取格',
    yong: [
      {
        wx: SHI_SHANG[dmWx],
        role: '喜用',
        why: '中和可轻用食伤：表达落地',
      },
      {
        wx: YIN[dmWx],
        role: '喜用',
        why: '中和可轻用印星：托底学习',
      },
    ],
    ji: [
      {
        wx: GUAN_SHA[dmWx],
        role: '忌神',
        why: '中和时过重官杀易绷；宜控压',
      },
    ],
  };
}

/**
 * 解析格局 + 喜用忌（正格扶抑 + 外格切片）
 */
export function resolvePatternYongshen(chart: BaziChart): PatternYongshenPack {
  const dmWx = chart.dayMasterWx;
  const strength = dayStrengthOf(chart);
  const band = bodyBandOf(strength);
  const pattern = resolvePatternHit(chart);
  const month = chart.pillars.find((p) => p.key === 'month');
  const climate = climateOfMonth(month && !month.empty ? month.branch : '');
  const scores = scoreChartWx(chart);

  const tiaoHou: YongShenItem[] = [];
  let yong: YongShenItem[] = [];
  let ji: YongShenItem[] = [];
  let method = '扶抑法 · 月令取格';

  if (dmWx) {
    const pack = yongJiForMode(dmWx, band, pattern.mode);
    yong = pack.yong;
    ji = pack.ji;
    method = pack.method;
  }

  if (climate.includes('寒')) {
    tiaoHou.push({
      wx: '火',
      role: '调候',
      why: '月令偏寒，取火暖局',
    });
  }
  if (climate.includes('燥')) {
    tiaoHou.push({
      wx: '水',
      role: '调候',
      why: '月令偏燥，取水润局',
    });
  }
  if (climate.includes('湿') && scores['水'] >= scores['土']) {
    tiaoHou.push({
      wx: '土',
      role: '调候',
      why: '湿气偏重，取土载水',
    });
  }

  const yongMerged = [...yong, ...tiaoHou.map((t) => ({ ...t, role: '喜用' as const }))];
  const yongSet = new Set(uniqWx(yongMerged));
  const jiFiltered = ji.filter((j) => !yongSet.has(j.wx));

  const yongWx = uniqWx(yongMerged);
  const jiWx = uniqWx(jiFiltered);
  const yongLine = yongWx.map((w) => `${w}（${WX_PLAIN[w]}）`).join(' · ') || '—';

  let playbook: string;
  if (pattern.mode === 'zhuan_wang') {
    playbook = `专旺局做事：把本气做满再泄秀成成果；少硬克硬砍。喜用优先：${yongLine}。`;
  } else if (pattern.mode.startsWith('cong_')) {
    const tip =
      pattern.mode === 'cong_er'
        ? '顺着表达与作品'
        : pattern.mode === 'cong_cai'
          ? '顺着交换与结果'
          : pattern.mode === 'cong_sha'
            ? '顺着规矩与交付'
            : '顺着成势与并肩';
    playbook = `${pattern.name.replace('（软）', '')}：${tip}，少逆势硬扶。喜用优先：${yongLine}。`;
  } else if (band === '身旺') {
    playbook = `这十年段做事：多用「泄、克、耗」——输出、立规矩、抓结果；少叠加只会让你更满的生扶。喜用优先：${yongLine}。`;
  } else if (band === '身弱') {
    playbook = `这十年段做事：先托底再亮剑——学习、并肩、小步验证；少硬扛与空耗。喜用优先：${yongLine}。`;
  } else {
    playbook = `力量中和：表达与托底轮换用，调候优先听月令。喜用参考：${yongLine}。`;
  }

  return {
    dayMaster: chart.dayMaster,
    dayMasterWx: dmWx,
    dayStrength: strength,
    bodyBand: band,
    patternName: pattern.name,
    patternWhy: pattern.why,
    patternMode: pattern.mode,
    method,
    yong: yongMerged,
    ji: jiFiltered,
    tiaoHou,
    yongWx,
    jiWx,
    headline: `${pattern.name} · ${band}（月令「${strength}」）`,
    playbook,
    boundary:
      '规则推演：正格扶抑 + 专旺五格/从格软标；未含化气全书与真假从破局细则。合大运流年与现实核对，勿单凭喜用断吉凶。',
    climate,
  };
}

/** 卡片 HTML（解读 / 结构 / 盘面） */
export function patternYongshenCardHtml(
  pack: PatternYongshenPack,
  opts?: { compact?: boolean },
): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const yongChips = pack.yongWx
    .map((w) => `<span class="py-chip is-yong">${escape(w)}</span>`)
    .join('');
  const jiChips = pack.jiWx
    .map((w) => `<span class="py-chip is-ji">${escape(w)}</span>`)
    .join('');

  if (opts?.compact) {
    return `
      <p class="py-compact" aria-label="格局喜用">
        <strong>${escape(pack.patternName)}</strong>
        · ${escape(pack.bodyBand)}
        · 喜用 ${escape(pack.yongWx.join('、') || '—')}
        · 忌 ${escape(pack.jiWx.join('、') || '—')}
      </p>`;
  }

  return `
    <section class="py-card" aria-label="格局与喜用神">
      <p class="py-kicker">格局 · 喜用</p>
      <h2 class="py-title">${escape(pack.headline)}</h2>
      <p class="py-method">${escape(pack.method)} · 日主 ${escape(pack.dayMaster)}${pack.dayMasterWx ? escape(pack.dayMasterWx) : ''}</p>
      <p class="py-why">${escape(pack.patternWhy)}</p>
      <div class="py-row">
        <span class="py-label">喜用</span>
        <div class="py-chips">${yongChips || '<span class="py-chip">—</span>'}</div>
      </div>
      <div class="py-row">
        <span class="py-label">忌神</span>
        <div class="py-chips">${jiChips || '<span class="py-chip">—</span>'}</div>
      </div>
      ${
        pack.tiaoHou.length
          ? `<p class="py-tiao">调候：${escape(pack.tiaoHou.map((t) => `${t.wx}（${t.why}）`).join('；'))}</p>`
          : ''
      }
      <p class="py-play">${escape(pack.playbook)}</p>
      <p class="py-boundary">${escape(pack.boundary)}</p>
    </section>`;
}
