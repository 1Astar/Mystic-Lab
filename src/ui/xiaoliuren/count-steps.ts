/** 掌上演算 · 三步进度 1/3 2/3 3/3 */
const STEPS = [
  { id: 0, label: '从月起' },
  { id: 1, label: '再数日' },
  { id: 2, label: '数时辰' },
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
