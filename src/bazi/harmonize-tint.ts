/**
 * 命理调和色：构成色（盘里有什么）+ 调和色（盘需要什么）
 * 依据日主强弱、喜用、寒燥湿润；禁止「木水多就出黄」。
 */
import type { BaziChart } from './cast.ts';
import { dayStrengthOf } from './bazi-facts.ts';
import { baziWxAuraKey, type SeasonLabel, type WuXing } from './elements.ts';
import { scoreChartWx } from './sense-energy.ts';

export type ClimateFeel = '寒' | '暖' | '燥' | '湿' | '平';

export type HarmonizeTint = {
  /** 构成主色（盘面气质） */
  composePrimary: WuXing;
  composeSecondary: WuXing | null;
  /** 调和辅助色（喜用/调候）；可空 */
  accent: WuXing | null;
  accentReason: string;
  dayStrong: boolean;
  climate: ClimateFeel[];
  temperament: string;
  temperamentSub: string;
  mood: string;
  primaryKey: string;
  secondaryKey: string | null;
  accentKey: string | null;
};

const ORDER: WuXing[] = ['木', '火', '土', '金', '水'];

/** 我生者（泄） */
const SHENG_NEXT: Record<WuXing, WuXing> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};

/** 克我者（官杀） */
const KE_ME: Record<WuXing, WuXing> = {
  木: '金',
  火: '水',
  土: '木',
  金: '火',
  水: '土',
};

/** 我克者（财） */
const WO_KE: Record<WuXing, WuXing> = {
  木: '土',
  火: '金',
  土: '水',
  金: '木',
  水: '火',
};

/** 生我者（印） */
const SHENG_ME: Record<WuXing, WuXing> = {
  木: '水',
  火: '木',
  土: '火',
  金: '土',
  水: '金',
};

const COMPOSE_POETRY: Record<WuXing, string> = {
  木: '青',
  火: '朱',
  土: '暖',
  金: '素',
  水: '靛',
};

const COMPOSE_NOUN: Record<WuXing, string> = {
  木: '木',
  火: '火',
  土: '土',
  金: '金',
  水: '水',
};

function isStrong(s: SeasonLabel): boolean {
  return s === '旺' || s === '相';
}

function isWeak(s: SeasonLabel): boolean {
  return s === '休' || s === '囚' || s === '死';
}

/** 月支 → 寒暖燥湿（调候依据） */
export function climateOfMonth(monthBranch: string): ClimateFeel[] {
  if (monthBranch === '寅' || monthBranch === '卯') return ['暖', '湿'];
  if (monthBranch === '巳' || monthBranch === '午') return ['暖', '燥'];
  if (monthBranch === '申' || monthBranch === '酉') return ['燥'];
  if (monthBranch === '亥' || monthBranch === '子') return ['寒', '湿'];
  if (monthBranch === '辰' || monthBranch === '丑') return ['湿'];
  if (monthBranch === '戌' || monthBranch === '未') return ['燥', '暖'];
  return ['平'];
}

function sortedWx(scores: Record<WuXing, number>): WuXing[] {
  return [...ORDER].sort((a, b) => scores[b] - scores[a]);
}

/**
 * 喜用 / 调候辅助色：
 * - 日主偏旺：优先泄（食伤）或克（官杀）；湿重可取土载；寒取火暖
 * - 日主偏弱：优先印生、比助；燥热可取水润
 * 辅助色不得与构成主色相同；仅在「有依据」时启用。
 */
export function resolveAccentWx(
  chart: BaziChart,
  composePrimary: WuXing,
  composeSecondary: WuXing | null,
  scores: Record<WuXing, number>,
): { accent: WuXing | null; reason: string } {
  const dm = chart.dayMasterWx;
  if (!dm) return { accent: null, reason: '' };

  const strength = dayStrengthOf(chart);
  const strong = isStrong(strength);
  const weak = isWeak(strength);
  const month = chart.pillars.find((p) => p.key === 'month');
  const climate = climateOfMonth(month && !month.empty ? month.branch : '');
  const avg =
    ORDER.reduce((a, w) => a + scores[w], 0) / ORDER.length;

  const candidates: Array<{ wx: WuXing; reason: string; w: number }> = [];

  if (strong) {
    candidates.push({
      wx: SHENG_NEXT[dm],
      reason: '日主偏旺，取食伤泄秀为调和',
      w: 3,
    });
    candidates.push({
      wx: KE_ME[dm],
      reason: '日主偏旺，取官杀修剪为调和',
      w: 2.4,
    });
    candidates.push({
      wx: WO_KE[dm],
      reason: '日主偏旺，取财星疏导为调和',
      w: 2.2,
    });
  } else if (weak) {
    candidates.push({
      wx: SHENG_ME[dm],
      reason: '日主偏弱，取印星生扶为调和',
      w: 3,
    });
    candidates.push({
      wx: dm,
      reason: '日主偏弱，取比劫帮身为调和',
      w: 2.2,
    });
  }

  if (climate.includes('寒')) {
    candidates.push({ wx: '火', reason: '月令偏寒，取火暖局为调候', w: 3.2 });
  }
  if (climate.includes('燥') && climate.includes('暖')) {
    candidates.push({ wx: '水', reason: '月令燥暖，取水润局为调候', w: 3.2 });
  } else if (climate.includes('燥')) {
    candidates.push({ wx: '水', reason: '月令偏燥，取水润局为调候', w: 2.8 });
  }
  if (climate.includes('湿') && scores['水'] >= avg) {
    candidates.push({
      wx: '土',
      reason: '水湿偏重，取土载水为调和',
      w: 3.4,
    });
  }
  if (composePrimary === '木' && composeSecondary === '水' && strong) {
    candidates.push({
      wx: '土',
      reason: '木水偏旺而湿润，取土堤束水、培木为调和',
      w: 3.6,
    });
  }
  if (composePrimary === '水' && composeSecondary === '木' && strong) {
    candidates.push({
      wx: '土',
      reason: '水木相生偏满，取土止水培木为调和',
      w: 3.5,
    });
  }

  candidates.sort((a, b) => b.w - a.w);
  for (const c of candidates) {
    if (c.wx === composePrimary) continue;
    if (c.wx === composeSecondary) continue;
    // 调和色在盘中不宜已经过旺
    if (scores[c.wx] >= avg + 1.5 && c.wx !== '土') continue;
    return { accent: c.wx, reason: c.reason };
  }
  return { accent: null, reason: '' };
}

function buildTemperament(
  primary: WuXing,
  secondary: WuXing | null,
  accent: WuXing | null,
  climate: ClimateFeel[],
): { title: string; sub: string; mood: string } {
  const wet = climate.includes('湿');
  const dry = climate.includes('燥');
  const cold = climate.includes('寒');

  let title = '';
  if (primary === '木' && secondary === '水') title = wet ? '青木临水' : '水木相生';
  else if (primary === '水' && secondary === '木') title = '水木相生';
  else if (primary === '土' && secondary === '金') title = dry ? '燥土藏金' : '厚土生金';
  else if (primary === '金' && secondary === '水') title = '金水相涵';
  else if (primary === '火' && secondary === '土') title = '火土相生';
  else if (primary === '木' && secondary === '火') title = '木火通明';
  else if (secondary) {
    title = `${COMPOSE_POETRY[primary]}${COMPOSE_NOUN[primary]}会${COMPOSE_NOUN[secondary]}`;
  } else {
    title = `${COMPOSE_POETRY[primary]}${COMPOSE_NOUN[primary]}独秀`;
  }

  if (accent === '土' && (primary === '木' || primary === '水')) {
    title = primary === '木' ? '青木临水' : title;
  }

  const moodBits: string[] = [];
  if (primary === '木' || secondary === '木') moodBits.push('生长');
  if (primary === '水' || secondary === '水') moodBits.push('流动');
  if (primary === '火' || secondary === '火') moodBits.push('明朗');
  if (primary === '土' || secondary === '土') moodBits.push('承载');
  if (primary === '金' || secondary === '金') moodBits.push('收束');
  if (wet) moodBits.push('湿润');
  if (dry) moodBits.push('清燥');
  if (cold) moodBits.push('清寒');
  if (moodBits.includes('生长') && moodBits.includes('流动')) {
    moodBits.push('敏感');
  }

  const mood = [...new Set(moodBits)].slice(0, 4).join('、') || '平和';

  let sub = `构成：${primary}`;
  if (secondary) sub += `＋${secondary}`;
  if (accent) sub += ` · 调和：${accent}`;
  else sub += ' · 调和：暂不叠加';

  return { title, sub, mood };
}

/** 完整调和色解析 */
export function resolveHarmonizeTint(chart: BaziChart): HarmonizeTint {
  const scores = scoreChartWx(chart);
  const ranked = sortedWx(scores);
  const primary = ranked[0]!;
  const second = ranked[1]!;
  const useSecond =
    Boolean(second) &&
    scores[second] >= scores[primary] * 0.68 &&
    scores[second] >= scores[primary] - 3;

  const composeSecondary = useSecond ? second : null;
  const strength = dayStrengthOf(chart);
  const month = chart.pillars.find((p) => p.key === 'month');
  const climate = climateOfMonth(month && !month.empty ? month.branch : '');
  const { accent, reason } = resolveAccentWx(
    chart,
    primary,
    composeSecondary,
    scores,
  );
  const { title, sub, mood } = buildTemperament(
    primary,
    composeSecondary,
    accent,
    climate,
  );

  return {
    composePrimary: primary,
    composeSecondary,
    accent,
    accentReason: reason,
    dayStrong: isStrong(strength),
    climate,
    temperament: title,
    temperamentSub: sub,
    mood,
    primaryKey: baziWxAuraKey(primary),
    secondaryKey: composeSecondary ? baziWxAuraKey(composeSecondary) : null,
    accentKey: accent ? baziWxAuraKey(accent) : null,
  };
}

const SCENE_BY_WX: Record<WuXing, string> = {
  木: '远景有薄雾中的幼林与藤蔓生长结构，枝叶层层向上伸展',
  水: '近景有静河、雾气与潮汐纹理，水面映着冷青天光',
  火: '天际有柔和霞光与一轮低饱和日轮，光斑如薄纱而非烈焰',
  土: '中景有低缓岩层与夯土台地，结构沉稳如建筑基座',
  金: '局部有晶体切面、冷月光与秩序感的金属线条，勿兵器血腥',
};

/**
 * 豆包 / 文生图用：命理肖像抽象场景（深色底＋低饱和东方色）
 */
export function buildDoubaoPortraitPrompt(chart: BaziChart): string {
  const tint = resolveHarmonizeTint(chart);
  const pillars = chart.pillars
    .filter((p) => !p.empty && p.key !== 'liunian')
    .map((p) => `${p.stem}${p.branch}`)
    .join('');

  const scenes = [tint.composePrimary, tint.composeSecondary, tint.accent]
    .filter(Boolean)
    .map((w) => SCENE_BY_WX[w as WuXing]);

  const accentLine = tint.accent
    ? `画面边缘以少量「${tint.accent}」色作调和点缀（依据：${tint.accentReason}），面积很小，不可抢主色。`
    : '不要额外加入无依据的黄色或金色。';

  return [
    `你是东方意象插画师。根据八字「${pillars}」日主${chart.dayMaster}${chart.dayMasterWx}，绘制一张「个人命理肖像」抽象图。`,
    `命盘气质：${tint.temperament}（${tint.mood}）。`,
    `主色构成：${tint.composePrimary}${tint.composeSecondary ? '＋' + tint.composeSecondary : ''}——深色底＋低饱和东方色，青绿/靛蓝/朱砂/暖赭/银白按主色取用，禁止大面积高饱和荧光色。`,
    accentLine,
    `意象层：${scenes.join('；')}。`,
    '构图：竖版手机壁纸感，上暗下沉，中心有一枚柔光命盘能量核；无文字、无logo、无人脸写实照片。',
    '风格：水墨矿物颜料×当代东方抽象，纸纤维与薄雾，远看是气氛近看有结构。',
  ].join('\n');
}
