/**
 * 图鉴神煞浏览轴：相遇（盘中有/全部）+ 人生议题 + 色调（护持/中性/提醒）
 * 不用长生/将前等「系别」当导航。
 */
import { getShenshaLore, type ShenshaLore } from './shensha-lore.ts';
import { shenshaCodexSections } from './codex-taxonomy.ts';

export type ShenshaMeetFilter = 'in_chart' | 'all';

export type ShenshaThemeId =
  | 'patron'
  | 'romance'
  | 'talent'
  | 'career'
  | 'fortune'
  | 'void'
  | 'friction'
  | 'health'
  | 'solitude'
  | 'flow';

/** 色调：护持 / 中性 / 提醒（避免吉凶判决口吻） */
export type ShenshaToneId = 'support' | 'neutral' | 'caution';

export const SHENSHA_MEET_META: Record<
  ShenshaMeetFilter,
  { title: string; blurb: string }
> = {
  in_chart: { title: '盘中有', blurb: '你这盘点亮过的神煞色调' },
  all: { title: '全部', blurb: '按人生议题浏览 · 辅助色调勿单断' },
};

export const SHENSHA_THEME_META: Record<
  ShenshaThemeId,
  { title: string; blurb: string }
> = {
  patron: { title: '贵人托举', blurb: '提携、化解、被看见' },
  romance: { title: '桃花喜缘', blurb: '喜庆、吸引、情感波动' },
  talent: { title: '才艺灵性', blurb: '文采、审美、玄学感' },
  career: { title: '名位担当', blurb: '台面、统领、文书规则' },
  fortune: { title: '福禄资源', blurb: '口福、荫庇、膳养' },
  void: { title: '耗散空亡', blurb: '虚延、走漏、要补地基' },
  friction: { title: '刑耗警示', blurb: '刚猛、是非、争抢提醒' },
  health: { title: '身心关照', blurb: '作息、情绪、检修窗口' },
  solitude: { title: '独处清高', blurb: '独立、清减、少热闹' },
  flow: { title: '奔走消长', blurb: '换场、歇息、领域阶段感' },
};

export const SHENSHA_THEME_ORDER: ShenshaThemeId[] = [
  'patron',
  'romance',
  'talent',
  'career',
  'fortune',
  'void',
  'friction',
  'health',
  'solitude',
  'flow',
];

export const SHENSHA_TONE_META: Record<
  ShenshaToneId,
  { title: string; short: string }
> = {
  support: { title: '护持色', short: '护持' },
  neutral: { title: '中性色', short: '中性' },
  caution: { title: '提醒色', short: '提醒' },
};

type BrowseMeta = { theme: ShenshaThemeId; tone: ShenshaToneId };

/** 显式标定；未列出的走启发式 */
const BY_ID: Record<string, BrowseMeta> = {
  // 贵人托举
  解神: { theme: 'patron', tone: 'support' },
  年解: { theme: 'patron', tone: 'support' },
  三台: { theme: 'patron', tone: 'support' },
  八座: { theme: 'patron', tone: 'support' },
  恩光: { theme: 'patron', tone: 'support' },
  天贵: { theme: 'patron', tone: 'support' },
  台辅: { theme: 'patron', tone: 'support' },
  天德: { theme: 'patron', tone: 'support' },
  月德: { theme: 'patron', tone: 'support' },
  龙德: { theme: 'patron', tone: 'support' },
  天使: { theme: 'patron', tone: 'support' },
  青龙: { theme: 'patron', tone: 'support' },
  文昌贵人: { theme: 'patron', tone: 'support' },
  // 桃花喜缘
  红鸾: { theme: 'romance', tone: 'support' },
  天喜: { theme: 'romance', tone: 'support' },
  天姚: { theme: 'romance', tone: 'neutral' },
  咸池: { theme: 'romance', tone: 'neutral' },
  沐浴: { theme: 'romance', tone: 'neutral' },
  喜神: { theme: 'romance', tone: 'support' },
  // 才艺灵性
  龙池: { theme: 'talent', tone: 'support' },
  凤阁: { theme: 'talent', tone: 'support' },
  天才: { theme: 'talent', tone: 'support' },
  天巫: { theme: 'talent', tone: 'neutral' },
  华盖: { theme: 'talent', tone: 'neutral' },
  博士: { theme: 'talent', tone: 'support' },
  奏书: { theme: 'talent', tone: 'neutral' },
  文卷: { theme: 'talent', tone: 'neutral' },
  // 名位担当
  天官: { theme: 'career', tone: 'support' },
  封诰: { theme: 'career', tone: 'support' },
  将星: { theme: 'career', tone: 'support' },
  攀鞍: { theme: 'career', tone: 'support' },
  将军: { theme: 'career', tone: 'support' },
  力士: { theme: 'career', tone: 'neutral' },
  冠带: { theme: 'career', tone: 'neutral' },
  临官: { theme: 'career', tone: 'support' },
  帝旺: { theme: 'career', tone: 'neutral' },
  官府: { theme: 'career', tone: 'caution' },
  官符: { theme: 'career', tone: 'caution' },
  // 福禄资源
  天福: { theme: 'fortune', tone: 'support' },
  天厨: { theme: 'fortune', tone: 'support' },
  天寿: { theme: 'fortune', tone: 'support' },
  // 耗散空亡
  天空: { theme: 'void', tone: 'caution' },
  旬空: { theme: 'void', tone: 'caution' },
  截路: { theme: 'void', tone: 'caution' },
  截空: { theme: 'void', tone: 'caution' },
  空亡: { theme: 'void', tone: 'caution' },
  大耗: { theme: 'void', tone: 'caution' },
  岁破: { theme: 'void', tone: 'caution' },
  小耗: { theme: 'void', tone: 'caution' },
  天虚: { theme: 'void', tone: 'caution' },
  破碎: { theme: 'void', tone: 'caution' },
  亡神: { theme: 'void', tone: 'caution' },
  绝: { theme: 'void', tone: 'caution' },
  墓: { theme: 'void', tone: 'neutral' },
  死: { theme: 'void', tone: 'caution' },
  // 刑耗警示
  劫杀: { theme: 'friction', tone: 'caution' },
  劫煞: { theme: 'friction', tone: 'caution' },
  天刑: { theme: 'friction', tone: 'caution' },
  阴煞: { theme: 'friction', tone: 'caution' },
  天伤: { theme: 'friction', tone: 'caution' },
  灾煞: { theme: 'friction', tone: 'caution' },
  天煞: { theme: 'friction', tone: 'caution' },
  指背: { theme: 'friction', tone: 'caution' },
  白虎: { theme: 'friction', tone: 'caution' },
  贯索: { theme: 'friction', tone: 'caution' },
  伏兵: { theme: 'friction', tone: 'caution' },
  晦气: { theme: 'friction', tone: 'caution' },
  // 身心关照
  天月: { theme: 'health', tone: 'caution' },
  病: { theme: 'health', tone: 'caution' },
  病符: { theme: 'health', tone: 'caution' },
  天哭: { theme: 'health', tone: 'caution' },
  丧门: { theme: 'health', tone: 'caution' },
  吊客: { theme: 'health', tone: 'caution' },
  月煞: { theme: 'health', tone: 'caution' },
  衰: { theme: 'health', tone: 'neutral' },
  // 独处清高
  孤辰: { theme: 'solitude', tone: 'neutral' },
  寡宿: { theme: 'solitude', tone: 'neutral' },
  // 奔走消长
  蜚廉: { theme: 'flow', tone: 'neutral' },
  飞廉: { theme: 'flow', tone: 'neutral' },
  岁驿: { theme: 'flow', tone: 'neutral' },
  息神: { theme: 'flow', tone: 'neutral' },
  斗君: { theme: 'flow', tone: 'neutral' },
  岁建: { theme: 'flow', tone: 'neutral' },
  长生: { theme: 'flow', tone: 'support' },
  胎: { theme: 'flow', tone: 'neutral' },
  养: { theme: 'flow', tone: 'support' },
};

function inferBrowseMeta(s: ShenshaLore): BrowseMeta {
  const hit = BY_ID[s.id];
  if (hit) return hit;
  const blob = `${s.epithet}${s.oneLiner}${s.traditional}${s.when}`;
  if (/桃花|喜|鸾|魅|情欲|沐浴/.test(blob)) return { theme: 'romance', tone: 'neutral' };
  if (/贵|解|恩|德|托|贵人|化解/.test(blob)) return { theme: 'patron', tone: 'support' };
  if (/才|文|艺|华盖|巫|博士/.test(blob)) return { theme: 'talent', tone: 'neutral' };
  if (/官|将|台|封|权|奏/.test(blob)) return { theme: 'career', tone: 'neutral' };
  if (/福|厨|禄|寿|膳/.test(blob)) return { theme: 'fortune', tone: 'support' };
  if (/空|耗|虚|破|截|亡|绝|墓/.test(blob)) return { theme: 'void', tone: 'caution' };
  if (/煞|刑|劫|虎|灾|伤|暗|争|索|符/.test(blob)) return { theme: 'friction', tone: 'caution' };
  if (/病|哭|丧|吊|月|疾|身/.test(blob)) return { theme: 'health', tone: 'caution' };
  if (/孤|寡|清|独/.test(blob)) return { theme: 'solitude', tone: 'neutral' };
  if (/驿|奔|流|息|长生|胎|养|冠|临|帝旺|衰|死/.test(blob))
    return { theme: 'flow', tone: 'neutral' };
  return { theme: 'flow', tone: 'neutral' };
}

export function shenshaBrowseMeta(id: string): BrowseMeta {
  const lore = getShenshaLore(id);
  if (lore) return inferBrowseMeta(lore);
  return BY_ID[id] ?? { theme: 'flow', tone: 'neutral' };
}

export function listCodexShenshaFlat(): ShenshaLore[] {
  const seen = new Set<string>();
  const out: ShenshaLore[] = [];
  for (const sec of shenshaCodexSections()) {
    for (const item of sec.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

export function filterShenshaForBrowse(opts: {
  meet: ShenshaMeetFilter;
  theme: ShenshaThemeId | 'all';
  inChartIds: Set<string>;
}): ShenshaLore[] {
  let list = listCodexShenshaFlat();
  if (opts.meet === 'in_chart') {
    list = list.filter((s) => opts.inChartIds.has(s.id));
  }
  if (opts.theme !== 'all') {
    list = list.filter((s) => shenshaBrowseMeta(s.id).theme === opts.theme);
  }
  return list.sort((a, b) => {
    const ta = shenshaBrowseMeta(a.id);
    const tb = shenshaBrowseMeta(b.id);
    const themeOrd =
      SHENSHA_THEME_ORDER.indexOf(ta.theme) - SHENSHA_THEME_ORDER.indexOf(tb.theme);
    if (themeOrd !== 0) return themeOrd;
    const toneOrd =
      (['support', 'neutral', 'caution'] as ShenshaToneId[]).indexOf(ta.tone) -
      (['support', 'neutral', 'caution'] as ShenshaToneId[]).indexOf(tb.tone);
    if (toneOrd !== 0) return toneOrd;
    return a.id.localeCompare(b.id, 'zh');
  });
}

export function countShenshaByTheme(inChartIds?: Set<string>): Record<ShenshaThemeId, number> {
  const base = Object.fromEntries(SHENSHA_THEME_ORDER.map((t) => [t, 0])) as Record<
    ShenshaThemeId,
    number
  >;
  for (const s of listCodexShenshaFlat()) {
    if (inChartIds && !inChartIds.has(s.id)) continue;
    base[shenshaBrowseMeta(s.id).theme] += 1;
  }
  return base;
}
