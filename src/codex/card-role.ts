import { getJourneyChapterForStep, getJourneyStep } from '../knowledge/fool-journey.ts';
import { NUMBER_STAGES, SUIT_GROUPS } from '../knowledge/minor-structure.ts';
import type { CardDefinition } from '../tarot/deck.ts';

export type CardRoleHint = {
  /** 网格牌下的一行短标签 */
  badge: string;
  /** 牌组 × 数字 或 愚人之旅 公式说明 */
  formula: string;
};

const RANK_TO_NUM: Record<string, string> = {
  Ace: '1',
  Two: '2',
  Three: '3',
  Four: '4',
  Five: '5',
  Six: '6',
  Seven: '7',
  Eight: '8',
  Nine: '9',
  Ten: '10',
};

const COURT_THEME: Record<string, string> = {
  Page: '探索与学习',
  Knight: '追求与行动',
  Queen: '滋养与洞察',
  King: '掌控与成熟',
};

function suitMeta(suit: CardDefinition['suit']) {
  return SUIT_GROUPS.find((s) => s.key === suit);
}

function numberMeta(num: string) {
  return NUMBER_STAGES.find((n) => n.num === num);
}

export function getCardRoleHint(card: CardDefinition): CardRoleHint {
  if (card.arcana === 'major') {
    const step = getJourneyStep(card.id);
    const chapter = getJourneyChapterForStep(card.id);
    if (step) {
      const chapterShort = chapter?.title.replace(/^第.+章 · /, '') ?? '愚人之旅';
      return {
        badge: `愚人之旅 · ${step.title}`,
        formula: `第 ${step.order} 站 · ${chapterShort} — ${step.theme}`,
      };
    }
    return {
      badge: '大阿卡那 · 人生原型',
      formula: card.keywords.slice(0, 3).join('、') || '人生课题与内在成长',
    };
  }

  const suit = suitMeta(card.suit);
  const suitLabel = suit?.label ?? '小阿卡那';
  const suitTheme = suit?.theme ?? '';

  const rank = card.rank ?? '';
  const num = RANK_TO_NUM[rank];

  if (num) {
    const stage = numberMeta(num);
    const numTheme = stage?.theme ?? '';
    return {
      badge: `${suitLabel}+${num}`,
      formula: `${suitLabel}（${suitTheme}） + ${num}（${numTheme}）`,
    };
  }

  const courtTheme = COURT_THEME[rank] ?? '人格面向';
  const rankZh =
    rank === 'Page'
      ? '侍从'
      : rank === 'Knight'
        ? '骑士'
        : rank === 'Queen'
          ? '王后'
          : rank === 'King'
            ? '国王'
            : rank;

  return {
    badge: `${suitLabel}·${rankZh}`,
    formula: `${suitLabel}（${suitTheme}） · ${rankZh}（${courtTheme}）`,
  };
}
