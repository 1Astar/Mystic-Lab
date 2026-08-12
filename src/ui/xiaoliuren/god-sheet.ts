import {
  getSixGodById,
  renderSixGodIcon,
  SIX_GODS,
  type SixGod,
  type SixGodId,
} from '../../xiaoliuren/six-gods.ts';

type GodTabId = 'know' | 'scene' | 'use';

const GOD_TABS: { id: GodTabId; label: string }[] = [
  { id: 'know', label: '认识' },
  { id: 'scene', label: '场景' },
  { id: 'use', label: '用法' },
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function listLine(items: string[]): string {
  return items.map(escapeHtml).join(' · ');
}

function field(label: string, value: string): string {
  return `<div class="xlr-god-modal-field"><dt>${escapeHtml(label)}</dt><dd>${value}</dd></div>`;
}

function renderTabPanels(god: SixGod): string {
  return `
    <div class="xlr-god-modal-panel" data-tab="know" hidden>
      <dl class="xlr-god-modal-fields">
        ${field('故事象征', escapeHtml(god.story))}
        ${field('象征', escapeHtml(god.symbolism))}
        ${field('为什么叫', escapeHtml(god.whyName))}
        ${field('为什么代表', escapeHtml(god.whyMeaning))}
      </dl>
    </div>
    <div class="xlr-god-modal-panel" data-tab="scene" hidden>
      <dl class="xlr-god-modal-fields">
        ${field('感情', escapeHtml(god.emotion))}
        ${field('工作', escapeHtml(god.career))}
        ${field('旅行', escapeHtml(god.travel))}
        ${field('财富', escapeHtml(god.wealth))}
        ${field('自我', escapeHtml(god.self))}
      </dl>
    </div>
    <div class="xlr-god-modal-panel" data-tab="use" hidden>
      <dl class="xlr-god-modal-fields">
        ${field('适合', listLine(god.positive))}
        ${field('提醒', listLine(god.warning))}
        ${field('容易误读', escapeHtml(god.misread))}
        ${field('对应行动', escapeHtml(god.action))}
      </dl>
    </div>
  `;
}

function renderModalBody(god: SixGod): string {
  return `
    <header class="xlr-god-modal-head">
      ${renderSixGodIcon(god, 'xlr-god-modal-icon')}
      <h2 id="xlr-god-modal-title" class="xlr-god-modal-name">${escapeHtml(god.name)}</h2>
      <p class="xlr-god-modal-keywords">${god.keywords.map((k) => `<span>${escapeHtml(k)}</span>`).join('')}</p>
      <p class="xlr-god-modal-oneliner">${escapeHtml(god.oneLiner)}</p>
    </header>
    <div class="xlr-god-modal-tabs" role="tablist" aria-label="六神说明分类">
      ${GOD_TABS.map(
        (t, i) => `
        <button type="button" class="xlr-god-modal-tab${i === 0 ? ' is-active' : ''}" role="tab" data-tab="${t.id}" aria-selected="${i === 0 ? 'true' : 'false'}">${t.label}</button>`,
      ).join('')}
    </div>
    <div class="xlr-god-modal-panels">
      ${renderTabPanels(god)}
    </div>
  `;
}

function activateTab(root: HTMLElement, tabId: GodTabId): void {
  root.querySelectorAll<HTMLButtonElement>('.xlr-god-modal-tab').forEach((btn) => {
    const on = btn.dataset.tab === tabId;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  root.querySelectorAll<HTMLElement>('.xlr-god-modal-panel').forEach((panel) => {
    panel.hidden = panel.dataset.tab !== tabId;
  });
}

function neighborGodId(id: SixGodId, delta: number): SixGodId {
  const idx = SIX_GODS.findIndex((g) => g.id === id);
  const next = (idx + delta + SIX_GODS.length) % SIX_GODS.length;
  return SIX_GODS[next]!.id;
}

/** 首页徽章 / 深链：居中弹窗 + 分类小 tab */
export function openSixGodSheet(host: HTMLElement, godId: SixGodId): void {
  host.querySelector('.xlr-god-sheet')?.remove();

  let currentId = godId;
  const sheet = document.createElement('div');
  sheet.className = 'xlr-god-sheet';
  sheet.setAttribute('role', 'presentation');

  const paint = () => {
    const god = getSixGodById(currentId);
    const dialog = sheet.querySelector('.xlr-god-sheet-panel');
    if (!dialog) return;
    dialog.className = `xlr-god-sheet-panel xlr-codex-${god.tone}`;
    dialog.innerHTML = `
      <button type="button" class="xlr-god-sheet-close" aria-label="关闭">✕</button>
      <p class="xlr-god-sheet-kicker">六神 · ${god.order}/6</p>
      <div class="xlr-god-sheet-body">
        ${renderModalBody(god)}
      </div>
      <div class="xlr-god-modal-nav">
        <button type="button" class="xlr-god-modal-nav-btn" data-nav="-1">上一位</button>
        <button type="button" class="xlr-god-modal-nav-btn" data-nav="1">下一位</button>
      </div>
    `;

    activateTab(dialog as HTMLElement, 'know');

    dialog.querySelector('.xlr-god-sheet-close')?.addEventListener('click', close);
    dialog.querySelectorAll<HTMLButtonElement>('.xlr-god-modal-tab').forEach((btn) => {
      btn.addEventListener('click', () => activateTab(dialog as HTMLElement, btn.dataset.tab as GodTabId));
    });
    dialog.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = Number(btn.dataset.nav) || 0;
        currentId = neighborGodId(currentId, delta);
        paint();
      });
    });
  };

  sheet.innerHTML = `
    <button type="button" class="xlr-god-sheet-backdrop" aria-label="关闭"></button>
    <aside class="xlr-god-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="xlr-god-modal-title"></aside>
  `;

  const close = () => {
    sheet.classList.remove('is-open');
    window.setTimeout(() => sheet.remove(), 200);
  };

  sheet.querySelector('.xlr-god-sheet-backdrop')?.addEventListener('click', close);
  host.appendChild(sheet);
  paint();
  requestAnimationFrame(() => sheet.classList.add('is-open'));
}

export function parseGodIdFromSearch(search = window.location.search): SixGodId | null {
  const raw = new URLSearchParams(search).get('god');
  if (!raw) return null;
  return SIX_GODS.some((g) => g.id === raw) ? (raw as SixGodId) : null;
}
