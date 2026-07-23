import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import {
  branchWxClass,
  castBaziChart,
  compareHepan,
  stemWxClass,
  type BaziChart,
  type PillarCell,
} from '../bazi/cast.ts';
import { wuxingClass } from '../bazi/elements.ts';
import {
  EMPTY_PARTNER,
  loadPartner,
  partnerAsProfile,
  savePartner,
  type PartnerBirth,
} from '../bazi/partner.ts';
import { parseBirthParts } from '../bazi/parse-birth.ts';
import { formatBirthBrief, hasBirthInfo, loadLifeStore } from '../life/storage.ts';
import { mountBirthDatetimeField } from '../ui/birth-datetime-picker.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hideLine(p: PillarCell): string {
  if (p.empty || p.hideGan.length === 0) return '—';
  return p.hideGan
    .map((g, i) => {
      const god = p.hideGods[i] ?? '';
      return `<span class="bazi-hide ${stemWxClass(g)}">${escapeHtml(g)}${god ? `<small>${escapeHtml(god)}</small>` : ''}</span>`;
    })
    .join('');
}

function shenshaLine(p: PillarCell): string {
  if (p.empty || p.shensha.length === 0) return '—';
  return `<div class="bazi-shensha">${p.shensha.map((s) => `<span>${escapeHtml(s)}</span>`).join('')}</div>`;
}

function renderGrid(chart: BaziChart, ariaLabel = '四柱排盘'): string {
  const cols = chart.pillars;
  const head = cols
    .map(
      (p) =>
        `<th scope="col" class="bazi-col-${p.key}">${escapeHtml(p.title)}${p.key === 'liunian' ? `<em>${chart.liunianYear}</em>` : ''}</th>`,
    )
    .join('');

  const row = (label: string, cell: (p: PillarCell) => string, cls = '') => `
    <tr class="${cls}">
      <th scope="row">${label}</th>
      ${cols.map((p) => `<td class="bazi-col-${p.key}">${cell(p)}</td>`).join('')}
    </tr>`;

  return `
    <div class="bazi-grid-wrap">
      <table class="bazi-grid" aria-label="${escapeHtml(ariaLabel)}">
        <thead>
          <tr>
            <th scope="col" class="bazi-row-label"></th>
            ${head}
          </tr>
        </thead>
        <tbody>
          ${row('干神', (p) => `<span class="bazi-god">${escapeHtml(p.empty ? '—' : p.stemGod)}</span>`)}
          ${row(
            '天干',
            (p) => `<span class="bazi-stem ${stemWxClass(p.stem)}">${escapeHtml(p.stem)}</span>`,
            'bazi-row-main',
          )}
          ${row(
            '地支',
            (p) => `<span class="bazi-branch ${branchWxClass(p.branch)}">${escapeHtml(p.branch)}</span>`,
            'bazi-row-main',
          )}
          ${row('藏干', (p) => `<div class="bazi-hide-list">${hideLine(p)}</div>`)}
          ${row(
            '支神',
            (p) =>
              `<div class="bazi-zhishen">${
                p.empty || p.hideGods.length === 0
                  ? '—'
                  : p.hideGods.map((g) => `<span>${escapeHtml(g)}</span>`).join('')
              }</div>`,
          )}
          ${row('纳音', (p) => `<span class="bazi-meta-cell">${escapeHtml(p.empty ? '—' : p.nayin)}</span>`)}
          ${row('空亡', (p) => `<span class="bazi-meta-cell">${escapeHtml(p.empty ? '—' : p.xunKong)}</span>`)}
          ${row('地势', (p) => `<span class="bazi-meta-cell">${escapeHtml(p.empty ? '—' : p.diShi)}</span>`)}
          ${row('自坐', (p) => `<span class="bazi-meta-cell">${escapeHtml(p.empty ? '—' : p.ziZuo)}</span>`)}
          ${row('神煞', (p) => shenshaLine(p), 'bazi-row-shensha')}
        </tbody>
      </table>
    </div>
  `;
}

function seasonBlock(chart: BaziChart): string {
  const seasonHtml = chart.season
    .map(
      (s) =>
        `<span class="bazi-season-chip ${wuxingClass(s.label)}"><b>${escapeHtml(s.label)}</b>${escapeHtml(s.strength)}</span>`,
    )
    .join('');
  return `
    <section class="bazi-relations" aria-label="地支关系">
      <h2 class="life-route-title">地支</h2>
      <p>${
        chart.relations.length
          ? escapeHtml(chart.relations.join(' · '))
          : '地支暂无明显合冲刑害'
      }</p>
    </section>
    <section class="bazi-season" aria-label="月令旺衰">
      <h2 class="life-route-title">月令五行</h2>
      <div class="bazi-season-row">${seasonHtml}</div>
    </section>
  `;
}

export function renderBaziChart(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const store = loadLifeStore();
  const ready = hasBirthInfo(store.profile) && Boolean(store.profile.birthYear.trim());

  let liunianYear = new Date().getFullYear();
  let mode: 'natal' | 'hepan' = 'natal';
  let partner = loadPartner();

  const page = document.createElement('div');
  page.className = 'page life-page bazi-chart-page';
  mountEnvBanner(page);

  function paint(): void {
    if (!ready) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回八字</button>
        <header class="life-header">
          <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
          <h1 class="page-title">四柱排盘</h1>
          <p class="page-subtitle">需要先填写出生年月日</p>
        </header>
        <section class="life-profile-gate">
          <div>
            <p class="life-card-kicker">还不能排盘</p>
            <p class="life-gate-brief">回到八字首页填写出生信息。</p>
          </div>
          <button type="button" class="life-btn-primary" data-path="/bazi">去填写</button>
        </section>
      `;
      bindNav();
      return;
    }

    const selfResult = castBaziChart(store.profile, liunianYear);
    if ('error' in selfResult) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回八字</button>
        <header class="life-header">
          <h1 class="page-title">四柱排盘</h1>
          <p class="page-subtitle">${escapeHtml(selfResult.error)}</p>
        </header>
        <button type="button" class="life-btn-primary" data-path="/bazi">回去改出生信息</button>
      `;
      bindNav();
      return;
    }

    const chart = selfResult;
    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回八字</button>
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <p class="home-eyebrow">BAZI CHART</p>
        <h1 class="page-title">四柱排盘</h1>
        <p class="page-subtitle">日主 ${escapeHtml(chart.dayMaster)}${chart.dayMasterWx ? ` · ${escapeHtml(chart.dayMasterWx)}` : ''}</p>
      </header>

      <nav class="bazi-mode-tabs" aria-label="盘面模式">
        <button type="button" class="bazi-mode-tab ${mode === 'natal' ? 'is-active' : ''}" data-mode="natal">生辰</button>
        <button type="button" class="bazi-mode-tab ${mode === 'hepan' ? 'is-active' : ''}" data-mode="hepan">合盘</button>
      </nav>

      ${mode === 'natal' ? renderNatal(chart) : renderHepan(chart)}
    `;

    bindNav();
    page.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        mode = btn.dataset.mode === 'hepan' ? 'hepan' : 'natal';
        paint();
      });
    });

    if (mode === 'natal') bindLiunian();
    if (mode === 'hepan') bindHepanForm();
  }

  function renderNatal(chart: BaziChart): string {
    return `
      <section class="bazi-meta" aria-label="排盘说明">
        <p>出生简记：${escapeHtml(formatBirthBrief(store.profile))}</p>
        <p>钟表时刻：${escapeHtml(chart.clockLabel)}</p>
        <p>真太阳时：${escapeHtml(chart.trueSolarLabel)}</p>
        <p class="bazi-meta-note">${escapeHtml(chart.place.note)}</p>
      </section>

      <section class="bazi-liunian-bar" aria-label="流年切换">
        <button type="button" class="life-btn-ghost" id="bazi-year-prev" aria-label="上一年">←</button>
        <label class="bazi-year-field">
          <span>流年</span>
          <input type="number" id="bazi-year-input" value="${chart.liunianYear}" min="1900" max="2100" />
        </label>
        <button type="button" class="life-btn-ghost" id="bazi-year-next" aria-label="下一年">→</button>
        <button type="button" class="life-btn-ghost" id="bazi-year-now">今年</button>
      </section>

      ${renderGrid(chart)}
      ${seasonBlock(chart)}
    `;
  }

  function renderHepan(selfChart: BaziChart): string {
    const p = partner;
    const partnerReady = Boolean(
      parseBirthParts(p.birthYear, p.birthMonth, p.birthDay, p.birthHour),
    );
    let partnerBlock = '';
    let compareBlock = '';

    if (partnerReady) {
      const partnerChart = castBaziChart(partnerAsProfile(p), liunianYear, {
        includeLiunian: false,
      });
      if (!('error' in partnerChart)) {
        const cmp = compareHepan(selfChart, partnerChart);
        compareBlock = `
          <section class="bazi-hepan-compare" aria-label="合盘对照">
            <h2 class="life-route-title">日主对照</h2>
            <p>${escapeHtml(cmp.note)}</p>
            <p class="bazi-hepan-day">
              日支：${escapeHtml(cmp.dayRelation.length ? cmp.dayRelation.join(' · ') : '无明显合冲刑害')}
            </p>
          </section>
        `;
        const selfNoLn: BaziChart = {
          ...selfChart,
          pillars: selfChart.pillars.filter((c) => c.key !== 'liunian'),
        };
        partnerBlock = `
          <h3 class="bazi-hepan-heading">自己 · ${escapeHtml(selfChart.dayMaster)}${selfChart.dayMasterWx}</h3>
          ${renderGrid(selfNoLn, '自己四柱')}
          <h3 class="bazi-hepan-heading">${escapeHtml(p.label || '对方')} · ${escapeHtml(partnerChart.dayMaster)}${partnerChart.dayMasterWx}</h3>
          ${renderGrid(partnerChart, '对方四柱')}
        `;
      } else {
        partnerBlock = `<p class="life-status">${escapeHtml(partnerChart.error)}</p>`;
      }
    }

    return `
      <section class="bazi-meta" aria-label="合盘说明">
        <p>填写对方出生信息，对照双方日主、十神与日支关系。</p>
      </section>

      <form class="life-form bazi-partner-form" id="bazi-partner-form">
        <fieldset class="life-fieldset">
          <legend>对方出生信息</legend>
          <label class="life-field life-field-full"><span>称呼</span><input name="label" type="text" placeholder="对方" value="${escapeHtml(p.label)}" /></label>
          <div id="bazi-partner-dt-slot" class="life-birth-row"></div>
          <label class="life-field life-field-full"><span>出生地点</span><input name="birthPlace" type="text" placeholder="如 成都" value="${escapeHtml(p.birthPlace)}" /></label>
        </fieldset>
        <div class="life-form-actions">
          <button type="submit" class="life-btn-primary">保存并合盘</button>
          <button type="button" class="life-btn-ghost" id="bazi-partner-clear">清空对方</button>
        </div>
        <p class="life-status" id="bazi-partner-status" hidden></p>
      </form>

      ${compareBlock}
      ${partnerBlock}
    `;
  }

  function bindLiunian(): void {
    page.querySelector('#bazi-year-prev')?.addEventListener('click', () => {
      liunianYear -= 1;
      paint();
    });
    page.querySelector('#bazi-year-next')?.addEventListener('click', () => {
      liunianYear += 1;
      paint();
    });
    page.querySelector('#bazi-year-now')?.addEventListener('click', () => {
      liunianYear = new Date().getFullYear();
      paint();
    });
    const yearInput = page.querySelector<HTMLInputElement>('#bazi-year-input');
    yearInput?.addEventListener('change', () => {
      const n = Number(yearInput.value);
      if (Number.isFinite(n) && n >= 1900 && n <= 2100) {
        liunianYear = Math.floor(n);
        paint();
      }
    });
  }

  function bindHepanForm(): void {
    const form = page.querySelector<HTMLFormElement>('#bazi-partner-form');
    const statusEl = page.querySelector<HTMLElement>('#bazi-partner-status');
    const slot = page.querySelector<HTMLElement>('#bazi-partner-dt-slot');
    if (form && slot) {
      mountBirthDatetimeField({
        host: form,
        replaceEl: slot,
        initialYear: partner.birthYear,
        initialMonth: partner.birthMonth,
        initialDay: partner.birthDay,
        initialHour: partner.birthHour,
      });
    }
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const g = (name: string) =>
        (form.elements.namedItem(name) as HTMLInputElement | null)?.value?.trim() ?? '';
      const next: PartnerBirth = {
        label: g('label') || '对方',
        birthYear: g('birthYear'),
        birthMonth: g('birthMonth'),
        birthDay: g('birthDay'),
        birthHour: g('birthHour'),
        birthPlace: g('birthPlace'),
      };
      if (!parseBirthParts(next.birthYear, next.birthMonth, next.birthDay, next.birthHour)) {
        if (statusEl) {
          statusEl.hidden = false;
          statusEl.textContent = '请选择对方完整出生时间。';
        }
        return;
      }
      partner = next;
      savePartner(partner);
      paint();
    });
    page.querySelector('#bazi-partner-clear')?.addEventListener('click', () => {
      partner = { ...EMPTY_PARTNER };
      savePartner(partner);
      paint();
    });
  }

  function bindNav(): void {
    page.querySelector('.life-back')?.addEventListener('click', () => navigate('/bazi'));
    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
  }

  paint();
  root.appendChild(page);
  return () => {
    stars.remove();
    document.querySelector('.birth-dt-sheet')?.remove();
  };
}
