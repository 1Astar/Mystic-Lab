/**
 * 组合旅程：根据图鉴点亮识别「我有哪些搭戏组合」
 * 完整 = 成员全亮；进行中 = 部分点亮；未启程 = 0
 */
import { COMBO_LORE, type ComboLore } from './combo-lore.ts';
import { isStarUnlocked, listCodexEntries } from './codex.ts';

export type ComboJourneyStatus = 'complete' | 'partial' | 'locked';

export type ComboJourneyStep = {
  combo: ComboLore;
  status: ComboJourneyStatus;
  litMembers: string[];
  missingMembers: string[];
  progress: number; // 0–1
  order: number;
};

export function evaluateCombo(
  combo: ComboLore,
  unlocked?: Set<string>,
): Omit<ComboJourneyStep, 'combo' | 'order'> {
  const set =
    unlocked ?? new Set(listCodexEntries().map((e) => e.starId));
  const litMembers = combo.members.filter((m) => set.has(m));
  const missingMembers = combo.members.filter((m) => !set.has(m));
  const progress =
    combo.members.length === 0 ? 0 : litMembers.length / combo.members.length;
  let status: ComboJourneyStatus = 'locked';
  if (progress >= 1) status = 'complete';
  else if (progress > 0) status = 'partial';
  return { status, litMembers, missingMembers, progress };
}

export function listComboJourney(): ComboJourneyStep[] {
  const unlocked = new Set(listCodexEntries().map((e) => e.starId));
  const steps = COMBO_LORE.map((combo, i) => ({
    combo,
    order: i + 1,
    ...evaluateCombo(combo, unlocked),
  }));
  const rank = (s: ComboJourneyStatus) =>
    s === 'complete' ? 0 : s === 'partial' ? 1 : 2;
  return steps.sort((a, b) => {
    const d = rank(a.status) - rank(b.status);
    if (d !== 0) return d;
    return b.progress - a.progress || a.order - b.order;
  });
}

export function comboJourneySummary(): {
  complete: number;
  partial: number;
  total: number;
  next?: ComboJourneyStep;
} {
  const steps = listComboJourney();
  const complete = steps.filter((s) => s.status === 'complete').length;
  const partial = steps.filter((s) => s.status === 'partial').length;
  const next =
    steps.find((s) => s.status === 'partial') ??
    steps.find((s) => s.status === 'locked');
  return { complete, partial, total: steps.length, next };
}

export function isComboComplete(comboId: string): boolean {
  const combo = COMBO_LORE.find((c) => c.id === comboId);
  if (!combo) return false;
  return evaluateCombo(combo).status === 'complete';
}

/** 供测试：不读 localStorage */
export function evaluateComboAgainst(
  combo: ComboLore,
  starIds: string[],
): ReturnType<typeof evaluateCombo> {
  return evaluateCombo(combo, new Set(starIds));
}

// re-export for callers that only need unlock check
export { isStarUnlocked };
