/**
 * 红娘「了解此人」：八字 / 紫微与命盘页同一套盘面
 */
import { openBaziCodexPopup } from '../ui/bazi-codex-popup.ts';
import { mountZiweiPlate } from '../ui/ziwei-plate.ts';
import { renderBaziNatalGridHtml } from '../pages/bazi-chart.ts';
import { castCharacter, type MatchmakerCast } from './cast.ts';
import type { MatchmakerCharacter } from './characters.ts';

export type ChartSystemTab = 'bazi' | 'ziwei';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dayMasterBlurb(cast: MatchmakerCast): { title: string; line: string } {
  const stem = cast.dayStem;
  const wx = cast.bazi.dayMasterWx;
  return {
    title: `日主 ${stem}${wx ? ` · ${wx}` : ''}`,
    line: '点金色词看释义（与命盘页同一套四柱表）。',
  };
}

function baziSheetHtml(ch: MatchmakerCharacter, cast: MatchmakerCast): string {
  const dm = dayMasterBlurb(cast);
  return `
    <p class="mm-learn-hint"><strong>${escapeHtml(dm.title)}</strong> — ${escapeHtml(dm.line)}</p>
    <div class="bazi-chart-page mm-bazi-natal" data-sheet-char="${escapeHtml(ch.id)}">
      ${renderBaziNatalGridHtml(cast.bazi, `${ch.nickname}四柱排盘`)}
    </div>
    <p class="mm-muted">红娘线索：日支「${escapeHtml(cast.dayBranch)}」作夫妻宫背景。</p>
    <p class="mm-muted">出生 ${escapeHtml(ch.birthPlace)} · ${escapeHtml(ch.birthYear)}-${escapeHtml(ch.birthMonth)}-${escapeHtml(ch.birthDay)} ${escapeHtml(ch.birthHour)}</p>
  `;
}

function ziweiSheetHtml(ch: MatchmakerCharacter, cast: MatchmakerCast): string {
  const spouse = cast.spousePalace;
  const headline =
    cast.ziwei.theater?.headline ||
    '紫微十二宫与命盘页同一套盘面；点宫、点星打开讲解。';
  return `
    <p class="mm-learn-hint">${escapeHtml(headline)}</p>
    <p class="mm-muted">${escapeHtml(spouse.line)} · 默认可看夫妻宫。</p>
    <div class="ziwei-page mm-ziwei-natal">
      <div class="mm-ziwei-plate-host" data-mm-ziwei-plate data-sheet-char="${escapeHtml(ch.id)}" data-focus-palace="${escapeHtml(spouse.name)}"></div>
    </div>
  `;
}

export type RenderPersonSheetOpts = {
  /** 弹窗顶上已有体系切换时，盘内不再重复 Tab */
  hideTabs?: boolean;
};

export function renderPersonSheet(
  ch: MatchmakerCharacter,
  tab: ChartSystemTab,
  opts?: RenderPersonSheetOpts,
): string {
  const cast = castCharacter(ch);
  if ('error' in cast) {
    return `<p class="mm-muted">${escapeHtml(cast.error)}</p>`;
  }
  const tabs = opts?.hideTabs
    ? ''
    : `
    <div class="mm-sys-capsule mm-chart-tabs" role="tablist" aria-label="盘面体系">
      <button type="button" class="mm-sys-capsule-seg mm-chart-tab${tab === 'bazi' ? ' is-on' : ''}" role="tab" aria-selected="${tab === 'bazi'}" data-mm-chart-tab="bazi" data-sheet-char="${escapeHtml(ch.id)}">八字</button>
      <button type="button" class="mm-sys-capsule-seg mm-chart-tab${tab === 'ziwei' ? ' is-on' : ''}" role="tab" aria-selected="${tab === 'ziwei'}" data-mm-chart-tab="ziwei" data-sheet-char="${escapeHtml(ch.id)}">紫微</button>
    </div>`;
  const body = tab === 'ziwei' ? ziweiSheetHtml(ch, cast) : baziSheetHtml(ch, cast);
  return `<div class="mm-char-sheet" data-sheet-char="${escapeHtml(ch.id)}" data-sheet-tab="${tab}">
    ${tabs}
    ${body}
  </div>`;
}

/** 绑定八字点词 + 挂载原生紫微盘 */
export function bindPersonSheetClicks(
  root: HTMLElement,
  pool: MatchmakerCharacter[],
): void {
  root.querySelectorAll<HTMLElement>('[data-sheet-char] [data-bazi-term]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const term = el.dataset.baziTerm || el.getAttribute('data-bazi-term') || '';
      const sheet = el.closest<HTMLElement>('[data-sheet-char]');
      const id = sheet?.dataset.sheetChar;
      const ch = id ? pool.find((p) => p.id === id) : undefined;
      const cast = ch ? castCharacter(ch) : null;
      const chart = cast && !('error' in cast) ? cast.bazi : null;
      openBaziCodexPopup({ term, chart });
    });
  });

  root.querySelectorAll<HTMLElement>('[data-mm-ziwei-plate]').forEach((host) => {
    const id = host.dataset.sheetChar;
    const ch = id ? pool.find((p) => p.id === id) : undefined;
    if (!ch) return;
    const cast = castCharacter(ch);
    if ('error' in cast) return;
    host.innerHTML = '';
    mountZiweiPlate(host, cast.ziwei, {
      initialPalace: host.dataset.focusPalace || '夫妻宫',
      /** 他人盘：只释义，不出现本人造命试炼/机缘 */
      explainOnly: true,
    });
  });
}
