/**
 * 八字页氛围：构成色（主/次）+ 调和辅助色（喜用/调候）
 * + 流年干支轻混（仅外观，不改解读正文）
 */
import type { BaziChart } from './cast.ts';
import { STEM_WUXING, baziWxAuraKey } from './elements.ts';
import { resolveHarmonizeTint, type HarmonizeTint } from './harmonize-tint.ts';

const WX_VAR: Record<string, string> = {
  mu: '--wx-mu',
  huo: '--wx-huo',
  tu: '--wx-tu',
  jin: '--wx-jin',
  shui: '--wx-shui',
};

const AURA_VARS = [
  '--bazi-aura',
  '--bazi-aura-2',
  '--bazi-aura-accent',
  '--bazi-aura-flow',
  '--bazi-aura-ink',
  '--bazi-aura-ink-2',
  '--bazi-aura-ink-accent',
  '--bazi-aura-ink-flow',
] as const;

export type { HarmonizeTint };

/** 流年柱天干 → 外观气运色键（无流年柱则 null） */
export function resolveLiunianFlowKey(
  chart: BaziChart | null | undefined,
): string | null {
  const ln = chart?.pillars?.find((p) => p.key === 'liunian');
  if (!ln || ln.empty || !ln.stem) return null;
  const wx = STEM_WUXING[ln.stem];
  return wx ? baziWxAuraKey(wx) : null;
}

function clearInlineAura(el: HTMLElement): void {
  for (const v of AURA_VARS) el.style.removeProperty(v);
  delete el.dataset.baziWx;
  delete el.dataset.baziWx2;
  delete el.dataset.baziWxAccent;
  delete el.dataset.baziWxFlow;
  delete el.dataset.baziTemperament;
}

/** 清除八字页染色 */
export function clearBaziChartAura(el: HTMLElement): void {
  clearInlineAura(el);
}

/**
 * 按构成色 + 调和色染盘；若有流年柱则轻混当年干支色（外观）。
 */
export function applyBaziChartAura(
  el: HTMLElement,
  chart: BaziChart | null | undefined,
): HarmonizeTint | null {
  if (!chart?.pillars?.length) {
    clearBaziChartAura(el);
    return null;
  }

  const tint = resolveHarmonizeTint(chart);
  if (!tint.primaryKey) {
    clearBaziChartAura(el);
    return null;
  }

  const pVar = `var(${WX_VAR[tint.primaryKey]})`;
  const sKey = tint.secondaryKey;
  const sVar = sKey ? `var(${WX_VAR[sKey]})` : pVar;
  const aKey = tint.accentKey;
  const aVar = aKey ? `var(${WX_VAR[aKey]})` : 'transparent';
  const fKey = resolveLiunianFlowKey(chart);
  const fVar = fKey ? `var(${WX_VAR[fKey]})` : null;

  el.dataset.baziWx = tint.primaryKey;
  if (sKey) el.dataset.baziWx2 = sKey;
  else delete el.dataset.baziWx2;
  if (aKey) el.dataset.baziWxAccent = aKey;
  else delete el.dataset.baziWxAccent;
  if (fKey) el.dataset.baziWxFlow = fKey;
  else delete el.dataset.baziWxFlow;
  el.dataset.baziTemperament = tint.temperament;

  const moon =
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'moon';
  const pPct = moon ? 11 : 16;
  const sPct = moon ? 9 : 12;
  const aPct = moon ? 5 : 7;
  const fPct = moon ? 7 : 10;

  el.style.setProperty('--bazi-aura-ink', pVar);
  el.style.setProperty('--bazi-aura-ink-2', sVar);
  el.style.setProperty('--bazi-aura-ink-accent', aKey ? aVar : pVar);
  el.style.setProperty(
    '--bazi-aura',
    `color-mix(in srgb, ${pVar} ${pPct}%, transparent)`,
  );
  el.style.setProperty(
    '--bazi-aura-2',
    sKey ? `color-mix(in srgb, ${sVar} ${sPct}%, transparent)` : 'transparent',
  );
  el.style.setProperty(
    '--bazi-aura-accent',
    aKey ? `color-mix(in srgb, ${aVar} ${aPct}%, transparent)` : 'transparent',
  );

  if (fVar) {
    el.style.setProperty('--bazi-aura-ink-flow', fVar);
    el.style.setProperty(
      '--bazi-aura-flow',
      `color-mix(in srgb, ${fVar} ${fPct}%, transparent)`,
    );
  } else {
    el.style.removeProperty('--bazi-aura-ink-flow');
    el.style.removeProperty('--bazi-aura-flow');
  }

  return tint;
}
