import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { attachPersonSwitcherToPage } from '../ui/module-person-chrome.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { mountBirthDatetimeField } from '../ui/birth-datetime-picker.ts';
import {
  formatBirthBrief,
  hasBirthInfo,
  loadLifeStore,
  updateBirthFields,
} from '../life/storage.ts';
import { parseBirthParts } from '../bazi/parse-birth.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function canCast(p: {
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour: string;
}): boolean {
  return Boolean(parseBirthParts(p.birthYear, p.birthMonth, p.birthDay, p.birthHour));
}

export function renderBaziHome(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  let store = loadLifeStore();
  const p = store.profile;
  let castReady = canCast(p);

  const page = document.createElement('div');
  page.className = 'page life-page bazi-home-page';
  mountEnvBanner(page);

  function renderEntries(): string {
    return `
    <section class="life-route" aria-label="八字">
      <nav class="life-entry-list" aria-label="功能">
        <button type="button" class="life-entry ${castReady ? '' : 'is-soon'}" data-path="/bazi/chart" data-open="${castReady ? '1' : '0'}" ${castReady ? '' : 'disabled'}>
          <span class="life-entry-icon" aria-hidden="true">🀄</span>
          <span class="life-entry-text">
            <strong>四柱排盘</strong>
            <span>本命四柱 + 流年旁列</span>
          </span>
          ${castReady ? '<span class="life-entry-chevron" aria-hidden="true">›</span>' : '<em class="tag">需出生日期</em>'}
        </button>
        <button type="button" class="life-entry is-soon" disabled>
          <span class="life-entry-icon" aria-hidden="true">五行</span>
          <span class="life-entry-text">
            <strong>日主与五行</strong>
            <span>日干五行 · 旺衰倾向 · 喜用</span>
          </span>
          <em class="tag">即将开放</em>
        </button>
        <button type="button" class="life-entry is-soon" disabled>
          <span class="life-entry-icon" aria-hidden="true">十神</span>
          <span class="life-entry-text">
            <strong>十神结构</strong>
            <span>比劫食伤才官印</span>
          </span>
          <em class="tag">即将开放</em>
        </button>
        <button type="button" class="life-entry is-soon" disabled>
          <span class="life-entry-icon" aria-hidden="true">📜</span>
          <span class="life-entry-text">
            <strong>八字手札</strong>
            <span>排盘记录与对照笔记</span>
          </span>
          <em class="tag">即将开放</em>
        </button>
      </nav>
    </section>`;
  }

  page.innerHTML = `
    <button type="button" class="back-link life-back">← 返回 Mystic Lab</button>
    <header class="life-header">
      <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
      <p class="home-eyebrow">MYSTIC LAB</p>
      <h1 class="page-title">八字</h1>
      <p class="page-subtitle">四柱排盘 · 日主五行 · 十神叙事</p>
    </header>

    <form class="life-form" id="bazi-birth-form" aria-label="出生信息">
      <fieldset class="life-fieldset">
        <legend>出生信息</legend>
        <p class="life-footnote" id="bazi-birth-sync" ${hasBirthInfo(p) ? '' : 'hidden'}>
          ${hasBirthInfo(p) ? `当前：${escapeHtml(formatBirthBrief(p))}` : ''}
        </p>
        <div id="bazi-birth-dt-slot" class="life-birth-row"></div>
        <label class="life-field life-field-full"><span>出生地点</span><input name="birthPlace" type="text" placeholder="如 成都" value="${escapeHtml(p.birthPlace)}" /></label>
      </fieldset>
      <div class="life-form-actions">
        <button type="submit" class="life-btn-primary" id="bazi-birth-save">保存</button>
        <button type="button" class="life-btn-ghost" data-path="/profile">打开档案 ›</button>
        <button type="button" class="life-btn-primary" id="bazi-to-chart" data-path="/bazi/chart" ${castReady ? '' : 'disabled'}>去排盘 ›</button>
      </div>
      <p class="life-status" id="bazi-birth-status" hidden></p>
    </form>

    <div id="bazi-entries">${renderEntries()}</div>
  `;

  const form = page.querySelector<HTMLFormElement>('#bazi-birth-form')!;
  const statusEl = page.querySelector<HTMLElement>('#bazi-birth-status')!;
  const syncHint = page.querySelector<HTMLElement>('#bazi-birth-sync')!;
  const entriesEl = page.querySelector<HTMLElement>('#bazi-entries')!;
  const toChart = page.querySelector<HTMLButtonElement>('#bazi-to-chart')!;
  const slot = page.querySelector<HTMLElement>('#bazi-birth-dt-slot')!;

  mountBirthDatetimeField({
    host: form,
    replaceEl: slot,
    initialYear: p.birthYear,
    initialMonth: p.birthMonth,
    initialDay: p.birthDay,
    initialHour: p.birthHour,
  });

  function refreshCastGate(): void {
    castReady = canCast(store.profile);
    toChart.disabled = !castReady;
    entriesEl.innerHTML = renderEntries();
    bindPathClicks(entriesEl);
  }

  function bindPathClicks(scope: ParentNode = page): void {
    scope.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        if ((el as HTMLButtonElement).disabled) return;
        if (el.dataset.open === '0') return;
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
  }

  page.querySelector('.life-back')?.addEventListener('click', () => navigate('/'));
  bindPathClicks();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const g = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | null)?.value?.trim() ?? '';
    const birth = {
      birthYear: g('birthYear'),
      birthMonth: g('birthMonth'),
      birthDay: g('birthDay'),
      birthHour: g('birthHour'),
      birthPlace: g('birthPlace'),
    };
    if (!birth.birthYear && !birth.birthMonth && !birth.birthDay) {
      statusEl.hidden = false;
      statusEl.textContent = '请先选择出生时间。';
      return;
    }
    store = updateBirthFields(birth);
    syncHint.hidden = false;
    syncHint.textContent = `当前：${formatBirthBrief(store.profile)}`;
    statusEl.hidden = false;
    statusEl.textContent = canCast(store.profile)
      ? '已保存。'
      : '已保存。排盘还需完整年月日。';
    refreshCastGate();
  });

  root.appendChild(page);
  attachPersonSwitcherToPage(page);
  return () => {
    stars.remove();
    document.querySelector('.birth-dt-sheet')?.remove();
  };
}
