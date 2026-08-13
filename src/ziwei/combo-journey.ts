/**
 * 星曜组合：根据本命盘「三方四正会照」识别成格
 * 完整 = 成员同处一三方四正；进行中 = 部分会照；未启程 = 无会照/无盘
 */
import { COMBO_LORE, type ComboLore } from './combo-lore.ts';
import { evaluateComboFormation } from './combo-formation.ts';
import type { ZiweiChartView } from './types.ts';

export type ComboJourneyStatus = 'complete' | 'partial' | 'locked';

export type ComboJourneyStep = {
  combo: ComboLore;
  status: ComboJourneyStatus;
  litMembers: string[];
  missingMembers: string[];
  progress: number; // 0–1
  order: number;
  ruleLine?: string;
  focusPalace?: string;
};

export function evaluateCombo(
  combo: ComboLore,
  view?: ZiweiChartView | null,
): Omit<ComboJourneyStep, 'combo' | 'order'> {
  const ev = evaluateComboFormation(combo.members, view ?? null, {
    rule: combo.formationRule ?? 'sanfang',
  });
  return {
    status: ev.status,
    litMembers: ev.litMembers,
    missingMembers: ev.missingMembers,
    progress: ev.progress,
    ruleLine: ev.ruleLine,
    focusPalace: ev.focusPalace,
  };
}

export function listComboJourney(view?: ZiweiChartView | null): ComboJourneyStep[] {
  const steps = COMBO_LORE.map((combo, i) => ({
    combo,
    order: i + 1,
    ...evaluateCombo(combo, view),
  }));
  const rank = (s: ComboJourneyStatus) =>
    s === 'complete' ? 0 : s === 'partial' ? 1 : 2;
  return steps.sort((a, b) => {
    const d = rank(a.status) - rank(b.status);
    if (d !== 0) return d;
    return b.progress - a.progress || a.order - b.order;
  });
}

/** 我的格局：强成格（展开） */
export function listMineStrongCombos(view?: ZiweiChartView | null): ComboJourneyStep[] {
  return listComboJourney(view).filter(
    (s) => s.status === 'complete' && s.combo.rank === 'strong',
  );
}

/** 我的格局：候选（软成格 + 进行中），折叠 */
export function listMineCandidateCombos(view?: ZiweiChartView | null): ComboJourneyStep[] {
  return listComboJourney(view).filter((s) => {
    if (s.status === 'locked') return false;
    if (s.status === 'partial') return true;
    return s.status === 'complete' && s.combo.rank === 'soft';
  });
}

export function comboJourneySummary(view?: ZiweiChartView | null): {
  complete: number;
  partial: number;
  total: number;
  next?: ComboJourneyStep;
} {
  const steps = listComboJourney(view);
  const complete = steps.filter((s) => s.status === 'complete').length;
  const partial = steps.filter((s) => s.status === 'partial').length;
  const next =
    steps.find((s) => s.status === 'partial') ??
    steps.find((s) => s.status === 'locked');
  return { complete, partial, total: steps.length, next };
}

export function isComboComplete(
  comboId: string,
  view?: ZiweiChartView | null,
): boolean {
  const combo = COMBO_LORE.find((c) => c.id === comboId);
  if (!combo) return false;
  return evaluateCombo(combo, view).status === 'complete';
}

/** 供测试：用假盘成员宫位表不够时，仍可用「无盘+空」；成格请用 evaluateComboFormation */
export function evaluateComboAgainst(
  combo: ComboLore,
  _starIds: string[],
  view?: ZiweiChartView | null,
): ReturnType<typeof evaluateCombo> {
  return evaluateCombo(combo, view ?? null);
}

export { isStarUnlocked } from './codex.ts';
