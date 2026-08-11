/** 生时校准 · 暂定时辰采纳（影响八字/紫微排盘，可随时改） */

export type RectifyAdoption = {
  birthHour: string;
  branch: string;
  label: string;
  confidencePct: number;
  confidenceLabel: '较高' | '中等' | '偏低';
  alternatives: Array<{ branch: string; label: string; confidencePct: number }>;
  adoptedAt: string;
  provisional: true;
};

const STORAGE_KEY = 'mystic-lab-bazi-rectify-adoption';

export function loadRectifyAdoption(): RectifyAdoption | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<RectifyAdoption>;
    if (!p.birthHour || !p.branch) return null;
    return {
      birthHour: String(p.birthHour),
      branch: String(p.branch),
      label: String(p.label ?? `${p.branch}时`),
      confidencePct: Number(p.confidencePct) || 0,
      confidenceLabel:
        p.confidenceLabel === '较高' || p.confidenceLabel === '偏低'
          ? p.confidenceLabel
          : '中等',
      alternatives: Array.isArray(p.alternatives)
        ? p.alternatives.map((a) => ({
            branch: String(a.branch),
            label: String(a.label ?? a.branch),
            confidencePct: Number(a.confidencePct) || 0,
          }))
        : [],
      adoptedAt: String(p.adoptedAt ?? new Date().toISOString()),
      provisional: true,
    };
  } catch {
    return null;
  }
}

export function saveRectifyAdoption(a: RectifyAdoption): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
}

export function clearRectifyAdoption(): void {
  localStorage.removeItem(STORAGE_KEY);
}
