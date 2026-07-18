import type { CardReading } from '../interpretation/types.ts';

function clip(text: string, max = 72): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).replace(/[，。、；：\s]+$/, '')}…`;
}

function readingAnchor(r: CardReading): string {
  const t = r.interpretationLayers.answerTendency;
  if (t?.oneLiner?.trim()) return clip(t.oneLiner, 90);
  const overview = r.interpretationLayers.contextualSections?.find(
    (s) => s.title.includes('热点') || s.title.includes('整体') || s.title.includes('核心'),
  );
  if (overview?.body?.trim()) return clip(overview.body, 90);
  return clip(r.interpretationLayers.standard.oneSentence, 90);
}

function shareSignal(intuition: string, keywords: string[]): boolean {
  const tip = intuition.toLowerCase();
  return keywords.some((k) => k.length >= 2 && tip.includes(k.toLowerCase()));
}

/**
 * 生成「第一直觉 ↔ 牌面解读」对照短文。无直觉时返回 undefined。
 */
export function buildIntuitionCompare(r: CardReading, intuition: string): string | undefined {
  const tip = intuition.trim();
  if (!tip) return undefined;

  const anchor = readingAnchor(r);
  const kws = r.interpretationLayers.standard.keywords.slice(0, 4);
  const aligned = shareSignal(tip, kws);
  const action = r.interpretationLayers.answerTendency?.actionTip?.trim();

  const alignLine = aligned
    ? `你的直觉里已经碰到牌面关键词（${kws.slice(0, 2).join('、')}）附近的感觉——这很值得留住。`
    : `你的直觉标出的是此刻的感受，牌面标出的是可核对的提醒——两者不必谁对谁错。`;

  const actionLine = action
    ? `若要对齐：可以看关键提醒——${clip(action, 60)}`
    : '若要对齐：问问自己，直觉里卡住的那一点，和牌面提醒是否在说同一件事。';

  return [
    `你写下：「${clip(tip, 48)}」。`,
    `解读更贴近：「${anchor}」。`,
    alignLine,
    actionLine,
  ].join('');
}
