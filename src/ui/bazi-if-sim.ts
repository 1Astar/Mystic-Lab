/**
 * 运势「如果」模拟 UI
 */
import type { IfScenario } from '../bazi/sense-if.ts';
import {
  learnStatusLine,
  loadBaziLearn,
  markLearnInteraction,
  resolveBaziLearnTitle,
} from '../bazi/learn-store.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function ifSimHtml(scenarios: IfScenario[]): string {
  if (!scenarios.length) return '';
  const buttons = scenarios
    .map(
      (s, i) => `
      <button type="button" class="bazi-if-chip" data-if-i="${i}" aria-expanded="false">
        如果 · ${escapeHtml(s.ifLabel.replace(/^如果/, '').trim())}
      </button>`,
    )
    .join('');

  return `
    <section class="bazi-if-sim" data-if-sim aria-label="如果模拟">
      <p class="bazi-sense-kicker">如果模拟</p>
      <p class="bazi-if-lead">点一条反面路径，看气候会怎么反噬——知其然，也知其所以然。</p>
      <div class="bazi-if-chips">${buttons}</div>
      <div class="bazi-if-panel" data-if-panel hidden>
        <p class="bazi-if-q" data-if-q></p>
        <p class="bazi-if-outcome" data-if-outcome></p>
        <p class="bazi-if-logic" data-if-logic></p>
      </div>
    </section>`;
}

export function mountIfSim(root: HTMLElement, scenarios: IfScenario[]): () => void {
  const host = root.querySelector<HTMLElement>('[data-if-sim]');
  if (!host || !scenarios.length) return () => {};

  const panel = host.querySelector<HTMLElement>('[data-if-panel]');
  const qEl = host.querySelector<HTMLElement>('[data-if-q]');
  const outEl = host.querySelector<HTMLElement>('[data-if-outcome]');
  const logicEl = host.querySelector<HTMLElement>('[data-if-logic]');
  const chips = [...host.querySelectorAll<HTMLButtonElement>('[data-if-i]')];
  let openI: number | null = null;

  const refreshBadge = (): void => {
    root.querySelectorAll<HTMLElement>('[data-learn-badge], .bazi-learn-badge-btn').forEach((el) => {
      el.textContent = `${learnStatusLine()} · 知识树 ›`;
      el.title = resolveBaziLearnTitle(loadBaziLearn()).blurb;
    });
  };

  const show = (i: number): void => {
    const s = scenarios[i];
    if (!s || !panel || !qEl || !outEl || !logicEl) return;
    const same = openI === i && !panel.hidden;
    if (same) {
      panel.hidden = true;
      openI = null;
      chips.forEach((c) => c.setAttribute('aria-expanded', 'false'));
      chips.forEach((c) => c.classList.remove('is-on'));
      return;
    }
    openI = i;
    panel.hidden = false;
    qEl.textContent = s.question;
    outEl.textContent = s.outcome;
    logicEl.textContent = `底层逻辑 · ${s.logic}`;
    chips.forEach((c, j) => {
      const on = j === i;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    markLearnInteraction('if:forecast');
    refreshBadge();
  };

  const cleanups: Array<() => void> = [];
  chips.forEach((btn, i) => {
    const fn = () => show(i);
    btn.addEventListener('click', fn);
    cleanups.push(() => btn.removeEventListener('click', fn));
  });

  return () => cleanups.forEach((fn) => fn());
}
