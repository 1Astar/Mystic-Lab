import type { CastResult } from '../liuyao/engine.ts';
import type { FourLayerReading } from '../liuyao/interpret.ts';
import { atmosphereSrcFor } from '../liuyao/hex-guide.ts';
import { buildOfflineAnswerPack } from '../mystic-engine/build-pack.ts';
import { getCardById } from '../tarot/deck.ts';
import type { DrawnCard } from '../tarot/engine.ts';
import { cardLabel } from '../tarot/engine.ts';
import type { ReadingResult } from '../interpretation/types.ts';
import type { ShareDraft } from './sheet.ts';

export function draftFromLiuyao(input: {
  cast: CastResult;
  question: string;
  reading?: FourLayerReading;
  castAt?: Date;
  aiText?: string;
}): ShareDraft {
  const pack = buildOfflineAnswerPack({
    question: input.question,
    cast: input.cast,
    castAt: input.castAt ?? new Date(),
    useProfile: false,
  });
  const summary =
    pack.script?.headline ||
    pack.answers[0]?.lean ||
    pack.decision ||
    input.reading?.summary ||
    input.cast.primary.fullName;
  const sections: ShareDraft['sections'] = [];
  if (pack.script?.beats?.length) {
    for (const beat of pack.script.beats) {
      sections.push({ heading: beat.title, body: beat.body });
    }
  } else {
    for (const a of pack.answers.slice(0, 4)) {
      const evidenceText = a.evidence.map((e) => e.plain).filter(Boolean).join('\n');
      sections.push({
        heading: (a.questionSlice || a.intentId || '解读').slice(0, 24),
        body: [a.lean, evidenceText].filter(Boolean).join('\n'),
      });
    }
  }
  if (input.reading?.action) {
    sections.push({ heading: '行动', body: input.reading.action });
  }
  return {
    system: 'liuyao',
    question: input.question,
    /** 封面主句用判词，卦名只出现在卦图旁，避免叠字 */
    headline: String(summary).slice(0, 72),
    summary: String(summary).slice(0, 400),
    sections,
    visual: {
      kind: 'liuyao',
      primaryName: input.cast.primary.fullName,
      changedName: input.cast.changed?.fullName,
      primaryLines: [...input.cast.primaryLines],
      changedLines: input.cast.changed
        ? [...input.cast.changedLines]
        : undefined,
      changingIndexes: [...input.cast.changingIndexes],
      shiLine: input.cast.shiLine,
      yingLine: input.cast.yingLine,
      primaryArtSrc: atmosphereSrcFor(input.cast.primary.kingWen) || undefined,
      changedArtSrc: input.cast.changed
        ? atmosphereSrcFor(input.cast.changed.kingWen) || undefined
        : undefined,
    },
    aiText: input.aiText,
  };
}

export function draftFromTarot(input: {
  cards: DrawnCard[];
  reading: ReadingResult;
  question: string;
}): ShareDraft {
  const sections: ShareDraft['sections'] = [
    { heading: '核心', body: input.reading.summary },
  ];
  if (input.reading.questionThread?.answers?.length) {
    for (const item of input.reading.questionThread.answers.slice(0, 4)) {
      const body = [item.insight, item.action].filter(Boolean).join('\n');
      if (body) {
        sections.push({
          heading: (item.heading || item.question || '解读').slice(0, 24),
          body,
        });
      }
    }
  } else {
    for (const c of input.reading.cards.slice(0, 4)) {
      sections.push({
        heading: c.position || c.cardName,
        body: c.combined || c.interpretationLayers?.contextualReading || c.text,
      });
    }
  }
  if (input.reading.learningNote) {
    sections.push({ heading: '我学到了', body: input.reading.learningNote });
  }
  return {
    system: 'tarot',
    question: input.question,
    headline: (
      input.reading.questionThread?.oneLiner ||
      input.reading.summary ||
      '塔罗'
    ).slice(0, 80),
    summary: input.reading.summary.slice(0, 400),
    sections,
    visual: {
      kind: 'tarot',
      cards: input.cards.map((c) => ({
        name: cardLabel(c),
        position: c.position,
        symbol: c.card.symbol,
        cardId: c.card.id,
        reversed: c.reversed,
      })),
    },
  };
}

/** 从结果快照组装分享（手札 / 复原页） */
export function draftFromTarotReading(input: {
  reading: ReadingResult;
  question: string;
}): ShareDraft {
  const cards: DrawnCard[] = [];
  for (const c of input.reading.cards) {
    const def = getCardById(c.cardId);
    if (!def) continue;
    cards.push({
      card: def,
      reversed: c.orientation === 'reversed',
      position: c.position,
    });
  }
  if (!cards.length) {
    return draftGeneric({
      system: 'tarot',
      headline: '塔罗',
      question: input.question,
      summary: input.reading.summary.slice(0, 400),
    });
  }
  return draftFromTarot({
    cards,
    reading: input.reading,
    question: input.question,
  });
}

export function draftFromXiaoliuren(input: {
  godName: string;
  question: string;
  summary: string;
  sections: { heading: string; body: string }[];
  gods?: string[];
}): ShareDraft {
  return {
    system: 'xiaoliuren',
    question: input.question,
    headline: input.godName,
    summary: input.summary.slice(0, 400),
    sections: input.sections,
    visual: {
      kind: 'xiaoliuren',
      gods: input.gods?.length ? input.gods : [input.godName],
      label: input.godName,
    },
  };
}

export function draftFromBazi(input: {
  dayMaster: string;
  pillarsLabel: string;
  question?: string;
  summary: string;
  sections?: { heading: string; body: string }[];
}): ShareDraft {
  return {
    system: 'bazi',
    question: input.question || '四柱排盘',
    headline: `日主 ${input.dayMaster}`,
    summary: input.summary.slice(0, 400),
    sections: input.sections?.length
      ? input.sections
      : [{ heading: '四柱', body: input.pillarsLabel }],
    visual: {
      kind: 'bazi',
      pillars: input.pillarsLabel,
      label: `日主 ${input.dayMaster}`,
    },
  };
}

export function draftFromZiwei(input: {
  headline: string;
  question?: string;
  summary: string;
  sections?: { heading: string; body: string }[];
}): ShareDraft {
  return draftGeneric({
    system: 'lab',
    headline: input.headline,
    question: input.question || '紫微命盘',
    summary: input.summary,
    sections: input.sections,
    label: input.headline,
  });
}

export function draftGeneric(input: {
  system: ShareDraft['system'];
  headline: string;
  question: string;
  summary: string;
  sections?: { heading: string; body: string }[];
  label?: string;
  brandSlogan?: string;
}): ShareDraft {
  return {
    system: input.system,
    question: input.question,
    headline: input.headline,
    summary: input.summary.slice(0, 400),
    sections: input.sections ?? [{ heading: '摘要', body: input.summary }],
    visual: {
      kind:
        input.system === 'life'
          ? 'life'
          : input.system === 'lab'
            ? 'generic'
            : 'generic',
      label: input.label || input.headline,
    },
    brandSlogan: input.brandSlogan,
  };
}

/** Lab 首页邀请：不带具体卦象 / 不问具体问题 */
export function draftLabInvite(): ShareDraft {
  return draftGeneric({
    system: 'lab',
    headline: '看见你心里的答案',
    question: '',
    summary: '探索内心的答案，遇见更好的自己。',
    sections: [
      {
        heading: '送你一张探索邀请卡',
        body: '我在「随心而行」等你。一起探索问题的答案，也遇见内心的光。',
      },
    ],
    label: 'Mystic Lab',
    brandSlogan: '答案不在牌里，在你心里。',
  });
}
