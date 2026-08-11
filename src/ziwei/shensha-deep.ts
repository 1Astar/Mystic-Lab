/**
 * 深度神煞：加厚讲法 + 映射人生四要素 / 流年焦点
 */
import { getPalaceLore } from './palace-lore.ts';
import { getShenshaLore } from './shensha-lore.ts';
import type { DeepShenshaHit } from './shensha-policy.ts';
import { pickDeepShenshaHighlights } from './shensha-policy.ts';
import type {
  DeepShenshaNote,
  PillarId,
  ZiweiChartView,
} from './types.ts';

/** 宫 → 人生四要素（身宫另加 core） */
const PALACE_TO_PILLARS: Record<string, PillarId[]> = {
  命宫: ['core', 'lesson'],
  财帛: ['career'],
  官禄: ['career'],
  田宅: ['career'],
  夫妻: ['bond'],
  仆役: ['bond'],
  福德: ['lesson'],
  迁移: ['lesson'],
  疾厄: ['core'],
  父母: ['career', 'lesson'],
  子女: ['bond', 'lesson'],
  兄弟: ['bond'],
};

const PILLAR_TITLE: Record<PillarId, string> = {
  core: '内核',
  career: '搞钱与事业',
  bond: '社交与爱',
  lesson: '此生课题',
};

/** 宫的生活说法（短） */
const PALACE_LIFE: Record<string, string> = {
  命宫: '自我主场',
  夫妻: '亲密关系',
  仆役: '交友协作',
  官禄: '事业舞台',
  财帛: '赚钱姿势',
  田宅: '根基资产',
  福德: '内心满足',
  迁移: '出走视野',
  疾厄: '身心边界',
  父母: '出处权威',
  子女: '创造表达',
  兄弟: '同辈伙伴',
};

export function pillarsForPalace(palaceName: string, isBody = false): PillarId[] {
  const set = new Set<PillarId>(PALACE_TO_PILLARS[palaceName] ?? []);
  if (isBody) set.add('core');
  if (!set.size) set.add('lesson');
  return [...set];
}

function firstSentences(text: string, max = 2): string {
  const parts = text
    .replace(/\n+/g, ' ')
    .split(/(?<=[。！？])/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.slice(0, max).join('') || text.slice(0, 80);
}

function useTip(name: string, palace: string): string {
  const life = PALACE_LIFE[palace] ?? palace;
  if (/红鸾|天喜|天姚|咸池/.test(name)) {
    return `用在「${life}」时：先看边界与节奏，别把气色当成必须成交的承诺。`;
  }
  if (/孤辰|寡宿|华盖/.test(name)) {
    return `用在「${life}」时：允许独处与精简社交，质量重于热闹。`;
  }
  if (/截路|截空|空亡|旬空|天空|天虚/.test(name)) {
    return `用在「${life}」时：先把交付物写清楚、地基补实，再谈加速。`;
  }
  if (/天刑|阴煞|劫杀|劫煞|白虎|灾煞|贯索|官符/.test(name)) {
    return `用在「${life}」时：规则谈清、证据优先，少硬刚升级。`;
  }
  if (/天伤|天哭|天月|病符|丧门|吊客/.test(name)) {
    return `用在「${life}」时：先护身心与情绪出口，神煞是提醒不是判决。`;
  }
  if (/天德|月德|天使|解神|年解/.test(name)) {
    return `用在「${life}」时：留缓冲与求助通道，化解优先于硬扛。`;
  }
  if (/将星|攀鞍|大耗|岁破/.test(name)) {
    return `用在「${life}」时：权责与资源账一起看，动中求进也要留蓄水池。`;
  }
  return `用在「${life}」时：只作色调，叠在本宫主星与三方四正上读，不单独吓人。`;
}

function annualHookFor(
  hit: DeepShenshaHit,
  focusPalaces: string[],
  yearSoulPalace?: string,
): string | undefined {
  const inFocus = focusPalaces.includes(hit.palace);
  const yearSoul = yearSoulPalace === hit.palace;
  if (!inFocus && !yearSoul) return undefined;
  const life = PALACE_LIFE[hit.palace] ?? hit.palace;
  if (yearSoul) {
    return `流年命宫落在「${life}」：今年读自己时，把「${hit.name}」当字幕叠上去——主戏仍是主星与四化。`;
  }
  return `流年焦点扫到「${life}」：今年相关议题里，「${hit.name}」的色调会更显眼，宜对照复盘而非恐慌。`;
}

export function enrichDeepShenshaNote(
  hit: DeepShenshaHit,
  opts: {
    isBodyPalace?: boolean;
    focusPalaces?: string[];
    yearSoulPalace?: string;
  } = {},
): DeepShenshaNote {
  const lore = getShenshaLore(hit.name);
  const palaceLore = getPalaceLore(hit.palace);
  const pillarIds = pillarsForPalace(hit.palace, Boolean(opts.isBodyPalace));
  const life = PALACE_LIFE[hit.palace] ?? hit.palace;
  const scene = palaceLore?.hint ? `${life}（${palaceLore.hint}）` : life;
  const traditional = lore?.traditional
    ? firstSentences(lore.traditional, 2)
    : hit.oneLiner;
  const tip = useTip(hit.name, hit.palace);
  const pillarLabels = pillarIds.map((id) => PILLAR_TITLE[id]);

  const body = [
    `落在「${scene}」。`,
    traditional,
    tip,
    `更贴近人生线：${pillarLabels.join('、')}。`,
  ].join('');

  const line = hit.why;
  const annualHook = annualHookFor(
    hit,
    opts.focusPalaces ?? [],
    opts.yearSoulPalace,
  );

  return {
    name: hit.name,
    palace: hit.palace,
    epithet: hit.epithet,
    line,
    body,
    pillarIds,
    pillarLabels,
    annualHook,
  };
}

/** 从盘面筛重点并加厚（可叠流年焦点） */
export function buildDeepShenshaNotes(
  view: Pick<ZiweiChartView, 'palaces' | 'soulPalace' | 'bodyPalace'>,
  opts: {
    limit?: number;
    focusPalaces?: string[];
    yearSoulPalace?: string;
  } = {},
): DeepShenshaNote[] {
  const hits = pickDeepShenshaHighlights(view, opts.limit ?? 5);
  const bodyName = view.bodyPalace.name;
  return hits.map((h) =>
    enrichDeepShenshaNote(h, {
      isBodyPalace: h.palace === bodyName && view.bodyPalace.isBody,
      focusPalaces: opts.focusPalaces,
      yearSoulPalace: opts.yearSoulPalace,
    }),
  );
}

export function shenshaNotesForPillar(
  notes: DeepShenshaNote[],
  pillarId: PillarId,
  max = 2,
): DeepShenshaNote[] {
  return notes.filter((n) => n.pillarIds.includes(pillarId)).slice(0, max);
}

export function formatShenshaForPillarBody(notes: DeepShenshaNote[]): string {
  if (!notes.length) return '';
  return [
    '神煞重点（叠色，不改主戏）：',
    ...notes.map((n) => `· ${n.name}（${n.palace}）：${n.body}`),
  ].join('\n');
}

export function formatAnnualShenshaLine(notes: DeepShenshaNote[]): string {
  const hooked = notes.filter((n) => n.annualHook).slice(0, 2);
  if (hooked.length) {
    return hooked.map((n) => n.annualHook!).join('');
  }
  // 无直接焦点命中时，仍给一条最重的本命神煞提醒
  const top = notes[0];
  if (!top) return '';
  return `本命神煞可对照「${top.name}·${top.epithet}」落${top.palace}：流年再吵，也先认清这层底色。`;
}

export { PILLAR_TITLE };
