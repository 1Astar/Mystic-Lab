/**
 * 杂曜 / 神煞详情：从短词条展开为与主星同构的四栏素材
 */
import type { MinorStarLore } from './minor-star-lore.ts';
import type { ShenshaLore } from './shensha-lore.ts';

export type SoftStarSections = {
  kicker: string;
  title: string;
  oneLiner: string;
  metaphor: string;
  keywords: string[];
  trait: { drive: string; gift: string; shadow: string; need: string };
  mirror: {
    work: string;
    love: string;
    wealth: string;
    social: string;
    self: string;
  };
  traditional: string;
  howTo: string;
  when?: string;
};

function splitTraditional(traditional: string): { head: string; rest: string } {
  const parts = traditional
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return { head: parts[0] ?? traditional, rest: parts.slice(1).join(' ') };
}

export function sectionsFromMinor(m: MinorStarLore): SoftStarSections {
  const { head, rest } = splitTraditional(m.traditional);
  return {
    kicker: `杂曜 · ${m.epithet}`,
    title: m.id,
    oneLiner: m.oneLiner,
    metaphor: `${m.epithet} · 细部色调（力轻于主辅星）`,
    keywords: [m.epithet, '色调', '提醒', m.id].slice(0, 4),
    trait: {
      drive: `在「${m.epithet}」这层色调里行动与感受。`,
      gift: head,
      shadow: '单独夸张杂曜，会盖过主星真正的戏。',
      need: '先读主星与三方，再叠这层提醒。',
    },
    mirror: {
      work: rest || `工作场景里，${m.epithet}是加分/提醒，不是主剧本。`,
      love: `亲密关系里留意「${m.epithet}」带来的气氛偏移。`,
      wealth: '财运仍看财帛主星与四化；杂曜只作细部提示。',
      social: m.oneLiner,
      self: `独处时更易察觉「${m.epithet}」这层感觉。`,
    },
    traditional: m.traditional,
    howTo: '杂曜力轻。先看主星，再叠这层色调；回命盘点三方四正看联动。',
  };
}

export function sectionsFromShensha(s: ShenshaLore): SoftStarSections {
  const { head, rest } = splitTraditional(s.traditional);
  return {
    kicker: `神煞 · ${s.epithet}`,
    title: s.id,
    oneLiner: s.oneLiner,
    metaphor: `${s.epithet} · 议题色调（${s.when}）`,
    keywords: [s.epithet, ...(s.aliases ?? []), s.when].filter(Boolean).slice(0, 4),
    trait: {
      drive: `议题被「${s.epithet}」染色时，人会怎么动。`,
      gift: head,
      shadow: '把神煞当判决书，而不是氛围字幕。',
      need: '对照落宫与主星，问「这层色调提醒我什么」。',
    },
    mirror: {
      work: rest || `事业宫见此煞：把「${s.epithet}」当议程提醒。`,
      love: `感情宫见此：气氛偏「${s.epithet}」，沟通比硬扛有用。`,
      wealth: '钱财仍看禄马与财帛主星；神煞标风险/机遇色。',
      social: s.oneLiner,
      self: s.when ? `何时用到：${s.when}` : `先认出「${s.epithet}」，再决定借力或收帆。`,
    },
    traditional: s.traditional,
    howTo: '神煞是色调不是主角。落哪宫，哪领域更易显这层议题；仍以主星定性格。',
    when: s.when,
  };
}
