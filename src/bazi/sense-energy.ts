import type { BaziChart } from './cast.ts';
import {
  BRANCH_WUXING,
  STEM_WUXING,
  type SeasonLabel,
  type WuXing,
} from './elements.ts';

export type EnergyBar = {
  wx: WuXing;
  score: number;
  /** 0–100 供环/柱 */
  pct: number;
};

export type EnergyBalance = {
  bars: EnergyBar[];
  excess: WuXing | null;
  shortage: WuXing | null;
  headline: string;
  body: string;
  remedy: string;
  /** 气象总喻，如「夏天的雷阵雨」 */
  weatherMeta: string;
};

const STRENGTH_SCORE: Record<SeasonLabel, number> = {
  旺: 5,
  相: 4,
  休: 3,
  囚: 2,
  死: 1,
};

const ORDER: WuXing[] = ['木', '火', '土', '金', '水'];

const EXCESS_PLAIN: Record<WuXing, string> = {
  木: '「生长」能量偏满——想法多、伸展欲强，容易焦虑地想扩张',
  火: '「热度」偏高——容易急躁、思虑过多，外热内耗',
  土: '「承载」偏重——什么都想扛，节奏容易钝、怕变',
  金: '「切割」偏利——标准高、边界硬，也容易刺伤旁人与内心',
  水: '「流动」偏多——思绪散、犹豫多，难落地',
};

const SHORT_PLAIN: Record<WuXing, string> = {
  木: '生命里的「生长感」偏弱——方向感与意义感需要主动补给',
  火: '生命里的「热度」偏弱——表达与可见度需要一点点火',
  土: '生命里的「根基」偏弱——稳定感与落地感需要练习',
  金: '生命里的「边界」偏弱——决断与收口需要练肌肉',
  水: '你的「生命缺雨」——冷静、流动与智慧感需要补水',
};

const REMEDY: Record<WuXing, string> = {
  木: '补木不是去种树就完事：多接触绿色与伸展，给计划留生长空间，少把人掐死在截止日期里。',
  火: '补火：适度表达、晒一点太阳、完成一次被看见的小输出；少熬夜硬撑热度。',
  土: '补土：规律作息、把事写成可勾的清单、走路踩实地；少同时开太多坑。',
  金: '补金：整理边界、断舍离一件事、把话说干净；少用「算了」逃避收口。',
  水: '补水不代表你真要一直喝水，而是提醒你保持冷静、多接触水边环境，甚至穿蓝色系——把情绪从过热里降下来。',
};

function emptyScores(): Record<WuXing, number> {
  return { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
}

function scoreChart(chart: BaziChart): Record<WuXing, number> {
  const scores = emptyScores();
  for (const row of chart.season) {
    scores[row.label] += STRENGTH_SCORE[row.strength] ?? 2;
  }
  for (const p of chart.pillars) {
    if (p.empty || p.key === 'liunian') continue;
    const sw = STEM_WUXING[p.stem];
    const bw = BRANCH_WUXING[p.branch];
    if (sw) scores[sw] += 1.2;
    if (bw) scores[bw] += 1;
  }
  return scores;
}

/**
 * 能量平衡：图形化数据 + 短板调频文案。规则模板，无术语表。
 */
export function buildEnergyBalance(chart: BaziChart): EnergyBalance {
  const raw = scoreChart(chart);
  const vals = ORDER.map((wx) => raw[wx]);
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;

  const bars: EnergyBar[] = ORDER.map((wx) => ({
    wx,
    score: Math.round(raw[wx] * 10) / 10,
    pct: Math.round((raw[wx] / max) * 100),
  }));

  const excess =
    max >= avg + 1.2 ? ORDER.find((wx) => raw[wx] === max) ?? null : null;
  const shortage =
    min <= avg - 0.8 ? ORDER.find((wx) => raw[wx] === min) ?? null : null;

  const parts: string[] = [];
  if (excess) parts.push(`你的八字中${EXCESS_PLAIN[excess]}。`);
  if (shortage) parts.push(`${SHORT_PLAIN[shortage]}。`);
  if (!parts.length) {
    parts.push('五股能量相对均衡，像天气多云转晴——起伏不大，适合稳住节奏微调。');
  }

  const remedyWx = shortage ?? (excess ? counterOf(excess) : '水');
  const headline =
    shortage && excess
      ? `过旺的热 · 缺的雨`
      : shortage
        ? `先补上缺口`
        : excess
          ? `先给过热降温`
          : `能量大体平稳`;

  const weatherMeta = weatherMetaOf(excess, shortage);

  return {
    bars,
    excess,
    shortage,
    headline,
    body: parts.join(''),
    remedy: REMEDY[remedyWx],
    weatherMeta,
  };
}

function weatherMetaOf(excess: WuXing | null, shortage: WuXing | null): string {
  if (excess === '木' && shortage === '金') return '夏天的雷阵雨';
  if (excess === '火' && shortage === '水') return '干热的午后';
  if (excess === '水' && shortage === '土') return '涨潮却难靠岸';
  if (excess === '金' && shortage === '木') return '秋风过劲的晴天';
  if (excess === '土' && shortage === '木') return '厚云压顶的闷热';
  if (shortage === '水') return '缺雨的旱季';
  if (excess === '火') return '外热内燥的天';
  if (!excess && !shortage) return '多云转晴';
  return '一阵说不清的季风';
}

/** 过旺时优先建议补其「泄/耗」侧 */
function counterOf(excess: WuXing): WuXing {
  const map: Record<WuXing, WuXing> = {
    木: '金',
    火: '水',
    土: '木',
    金: '火',
    水: '土',
  };
  return map[excess];
}
