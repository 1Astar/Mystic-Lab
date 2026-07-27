import type { CodexEncounter } from '../codex/collection.ts';
import type { CardReading, ReadingResult } from '../interpretation/types.ts';

export type EncounterPositionKind = 'advice' | 'obstacle' | 'situation' | 'other';

export function encounterPositionKind(spreadLabel: string | undefined): EncounterPositionKind {
  const p = (spreadLabel || '').trim();
  if (p === '建议' || p.includes('建议')) return 'advice';
  if (p === '阻碍' || p.includes('阻碍')) return 'obstacle';
  if (p === '情况' || p.includes('情况')) return 'situation';
  return 'other';
}

/** 回看引导语：建议位用用户指定原文 */
export function encounterReflectPrompt(kind: EncounterPositionKind): string {
  if (kind === 'advice') {
    return '当时的建议你还记得吗？现实中事情最终如何发展了？';
  }
  if (kind === 'obstacle') {
    return '当时指出的阻碍你还记得吗？现实中你有避开或化解吗？';
  }
  if (kind === 'situation') {
    return '当时映照的局面你还记得吗？现实中事情最终如何发展了？';
  }
  return '当时的解读你还记得吗？现实中事情最终如何发展了？';
}

export function encounterGuidanceLabel(kind: EncounterPositionKind): string {
  if (kind === 'advice') return '当时塔罗给的建议';
  if (kind === 'obstacle') return '当时指出的阻碍';
  if (kind === 'situation') return '当时映照的局面';
  return '当时的解读要点';
}

function firstNonEmpty(...parts: Array<string | undefined | null>): string {
  for (const p of parts) {
    const t = p?.trim();
    if (t) return t;
  }
  return '';
}

/** 从单卡解读里抽出位次相关的「当时给的话」 */
export function extractGuidanceFromCardReading(card: CardReading): string {
  const kind = encounterPositionKind(card.position);
  const layers = card.interpretationLayers;
  const qa = layers.questionAnswers ?? [];
  const sections = layers.contextualSections ?? [];

  const adviceSection = sections.find((s) => /建议|行动|策略/.test(s.title))?.body;
  const overviewSection = sections.find((s) => /热点|整体|核心/.test(s.title))?.body;

  if (kind === 'advice') {
    const fromQa = qa.map((a) => a.action).find((a) => a?.trim());
    return firstNonEmpty(
      fromQa,
      layers.answerTendency?.actionTip,
      adviceSection,
      layers.answerTendency?.oneLiner,
      qa[qa.length - 1]?.insight,
      overviewSection,
    );
  }

  if (kind === 'obstacle') {
    const riskQa = qa.find((a) => /风险|防范|阻碍|暗礁/.test(a.question));
    return firstNonEmpty(
      riskQa?.insight,
      riskQa?.action,
      overviewSection,
      layers.standard.reminder,
      layers.answerTendency?.oneLiner,
      qa[0]?.insight,
    );
  }

  if (kind === 'situation') {
    return firstNonEmpty(
      overviewSection,
      qa[0]?.insight,
      layers.answerTendency?.oneLiner,
      layers.standard.oneSentence,
    );
  }

  return firstNonEmpty(
    layers.answerTendency?.oneLiner,
    adviceSection,
    qa[0]?.insight,
    overviewSection,
    layers.standard.oneSentence,
  );
}

/** 从整盘问题串讲里，按牌下标再补一刀（建议/风险问） */
export function extractGuidanceFromThread(
  reading: ReadingResult,
  cardIndex: number,
): string {
  const thread = reading.questionThread;
  if (!thread?.answers.length) return '';
  const card = reading.cards[cardIndex];
  const kind = encounterPositionKind(card?.position);

  const bound = thread.answers.filter((a) => a.cardIndexes.includes(cardIndex));
  if (kind === 'advice') {
    const advice =
      bound.find((a) => a.intent === 'advice') ??
      thread.answers.find((a) => a.intent === 'advice');
    return firstNonEmpty(advice?.action, advice?.insight);
  }
  if (kind === 'obstacle') {
    const risk =
      bound.find((a) => a.intent === 'risk') ??
      thread.answers.find((a) => a.intent === 'risk');
    return firstNonEmpty(risk?.insight, risk?.action);
  }
  const primary = bound[0];
  return firstNonEmpty(primary?.insight, primary?.action, primary?.meaningMap);
}

export function buildEncounterGuidance(reading: ReadingResult, cardIndex: number): string {
  const card = reading.cards[cardIndex];
  if (!card) return '';
  return firstNonEmpty(
    extractGuidanceFromThread(reading, cardIndex),
    extractGuidanceFromCardReading(card),
  );
}

/** 展示用：优先存档 guidance，其次传入的 reading 快照，再次 summary */
export function resolveEncounterGuidance(
  enc: CodexEncounter,
  cardId: string,
  cardName: string,
  readingSnapshot?: ReadingResult | null,
): string {
  if (enc.guidance?.trim()) return enc.guidance.trim();

  if (readingSnapshot?.cards?.length) {
    const idx = readingSnapshot.cards.findIndex((c) => c.cardId === cardId);
    if (idx >= 0) {
      const g = buildEncounterGuidance(readingSnapshot, idx);
      if (g) return g;
    }
  }

  const s = enc.summary?.trim();
  if (s && s !== cardName) return s;
  return '';
}
