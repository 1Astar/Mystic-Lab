import type { CastResult } from './engine.ts';
import { buildHexGuidePack, renderGuideXiangSnippetHtml } from './hex-guide.ts';
import {
  buildHexExpandPack,
  renderHexExpandBaiHtml,
} from './hex-expand.ts';
import { dressHexagram, LIUSHEN_PLAIN } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';

export type XiangSec = 'guide' | 'domain';
export type XiangHexSide = 'primary' | 'changed';

const XIANG_SECS: { id: XiangSec; label: string }[] = [
  { id: 'guide', label: '意象' },
  { id: 'domain', label: '分域' },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 六神：逐爻气色 */
export function renderLiushenNotesHtml(
  cast: CastResult,
  castAt = new Date(),
  opts?: { compact?: boolean },
): string {
  const dressed = dressHexagram(cast, siZhuFromDate(castAt).dayStem);
  const rows = [...dressed.rows].reverse();
  const items = rows
    .map((r) => {
      const plain = LIUSHEN_PLAIN[r.liushen] ?? '';
      const marks = [r.isShi ? '世' : '', r.isYing ? '应' : '', r.changing ? '动' : '']
        .filter(Boolean)
        .join('·');
      return `
      <li class="ly-liushen-item">
        <strong>${escapeHtml(r.label)}</strong>
        <span class="ly-liushen-god">${escapeHtml(r.liushen)}</span>
        ${marks ? `<span class="ly-liushen-mark">（${escapeHtml(marks)}）</span>` : ''}
        <span class="ly-liushen-plain">——${escapeHtml(plain)}</span>
      </li>`;
    })
    .join('');

  if (opts?.compact) {
    return `<ul class="ly-liushen-list is-compact" data-liushen-notes>${items}</ul>`;
  }

  return `
    <section class="ly-liushen-notes" data-liushen-notes>
      <p class="ly-layer-guide">六神 · 各爻气色</p>
      <p class="ly-guide-tip">六神看「这一爻带什么气色」。</p>
      <ul class="ly-liushen-list">${items}</ul>
    </section>
  `;
}

function renderGuideHexSwitchHtml(cast: CastResult): string {
  const primaryGuide = buildHexGuidePack(cast.primary);
  const hasChanged = Boolean(cast.changed);
  const changedGuide = cast.changed ? buildHexGuidePack(cast.changed) : null;

  const changedPane = changedGuide
    ? renderGuideXiangSnippetHtml(changedGuide, { linkToGuide: true })
    : `<p class="ly-guide-tip">无动则无变：时间轴停在本卦，先把当下意象看清。</p>`;

  return `
    <section class="ly-gua-switch ly-xiang-hex-switch" data-gua-switch data-xiang-hex-switch>
      <div class="ly-gua-switch-tabs" role="tablist" aria-label="本卦 / 变卦意象切换">
        <button type="button" class="ly-gua-switch-tab is-active" data-gua-side="primary" role="tab" aria-selected="true">
          本卦 · ${escapeHtml(cast.primary.name)}
        </button>
        <button type="button" class="ly-gua-switch-tab" data-gua-side="changed" role="tab" aria-selected="false"${
          hasChanged ? '' : ' disabled title="无动爻则无变卦"'
        }>
          变卦${hasChanged && cast.changed ? ` · ${escapeHtml(cast.changed.name)}` : ''}
        </button>
      </div>
      <div class="ly-gua-switch-pane is-active" data-gua-pane="primary" role="tabpanel">
        ${renderGuideXiangSnippetHtml(primaryGuide, { linkToGuide: true })}
      </div>
      <div class="ly-gua-switch-pane" data-gua-pane="changed" role="tabpanel" hidden>
        ${changedPane}
      </div>
    </section>
  `;
}

/** 卦象解析：意象 / 分域（能量与六神并入专业排盘） */
export function renderXiangNotesPaneHtml(
  cast: CastResult,
  _question: string,
  _castAt = new Date(),
): string {
  const pack = buildHexExpandPack(cast);

  const tabs = XIANG_SECS.map(
    (s, i) => `
      <button type="button" class="ly-xiang-rail-item${i === 0 ? ' is-active' : ''}" data-xiang-sec="${s.id}" role="tab" aria-selected="${i === 0}">
        <span class="ly-xiang-rail-label">${s.label}</span>
      </button>`,
  ).join('');

  return `
    <div class="ly-xiang-notes" data-xiang-notes>
      <nav class="ly-xiang-rail" role="tablist" aria-label="卦象解析分段">
        ${tabs}
      </nav>
      <div class="ly-xiang-sec-pane is-active" data-xiang-pane="guide" role="tabpanel">
        ${renderGuideHexSwitchHtml(cast)}
      </div>
      <div class="ly-xiang-sec-pane" data-xiang-pane="domain" role="tabpanel" hidden>
        ${renderHexExpandBaiHtml(pack)}
      </div>
    </div>
  `;
}

export function selectXiangSec(root: HTMLElement, id: XiangSec): void {
  const host = root.matches('[data-xiang-notes]')
    ? root
    : root.querySelector<HTMLElement>('[data-xiang-notes]');
  if (!host) return;
  host.querySelectorAll('[data-xiang-sec]').forEach((btn) => {
    const on = (btn as HTMLElement).dataset.xiangSec === id;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', String(on));
  });
  host.querySelectorAll('[data-xiang-pane]').forEach((pane) => {
    const on = (pane as HTMLElement).dataset.xiangPane === id;
    pane.classList.toggle('is-active', on);
    (pane as HTMLElement).hidden = !on;
  });
}

/** 意象内切换本卦 / 变卦图鉴 */
export function selectXiangHexSide(root: HTMLElement, side: XiangHexSide): void {
  const host = root.matches('[data-xiang-notes]')
    ? root
    : root.querySelector<HTMLElement>('[data-xiang-notes]');
  const sw = host?.querySelector<HTMLElement>('[data-xiang-hex-switch]');
  if (!sw) return;
  const target = side === 'changed' ? 'changed' : 'primary';
  const changedTab = sw.querySelector<HTMLButtonElement>('[data-gua-side="changed"]');
  if (target === 'changed' && changedTab?.disabled) return;

  sw.querySelectorAll('[data-gua-side]').forEach((el) => {
    const on = (el as HTMLElement).dataset.guaSide === target;
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-selected', String(on));
  });
  sw.querySelectorAll('[data-gua-pane]').forEach((pane) => {
    const on = (pane as HTMLElement).dataset.guaPane === target;
    pane.classList.toggle('is-active', on);
    (pane as HTMLElement).hidden = !on;
  });
}

export function bindXiangNotesPane(root: HTMLElement): void {
  const host = root.matches('[data-xiang-notes]')
    ? root
    : root.querySelector<HTMLElement>('[data-xiang-notes]');
  if (!host || host.dataset.xiangBound === '1') return;
  host.dataset.xiangBound = '1';
  host.addEventListener('click', (e) => {
    const sideBtn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-gua-side]');
    if (sideBtn && host.contains(sideBtn) && !sideBtn.disabled) {
      const side = (sideBtn.dataset.guaSide as XiangHexSide | undefined) ?? 'primary';
      selectXiangHexSide(host, side);
      return;
    }
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-xiang-sec]');
    if (!btn || !host.contains(btn)) return;
    const id = btn.dataset.xiangSec as XiangSec | undefined;
    if (!id) return;
    selectXiangSec(host, id);
  });
}
