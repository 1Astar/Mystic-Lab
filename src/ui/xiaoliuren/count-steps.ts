/** 掌上演算 · 三步进度 */
const STEPS = [
  { id: 0, label: '从月起' },
  { id: 1, label: '从日起' },
  { id: 2, label: '从时起' },
] as const;

export function renderCountSteps(activeIndex: number): string {
  const badge = `<span class="xlr-count-step-badge">${activeIndex + 1}<em>/3</em></span>`;
  const items = STEPS.map((s) => {
    const state =
      s.id < activeIndex ? ' is-done' : s.id === activeIndex ? ' is-active' : '';
    return `<span class="xlr-count-step${state}">${s.label}</span>`;
  }).join('');

  return `
    <div class="xlr-count-steps" aria-label="三步起课">
      ${badge}
      <div class="xlr-count-step-track">${items}</div>
    </div>
  `;
}
