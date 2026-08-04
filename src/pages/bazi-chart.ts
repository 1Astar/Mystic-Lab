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
  LEARN_STEPS,
  parseLearnStep,
  TEN_GOD_PLAIN,
  type LearnStepId,
} from '../bazi/learn-steps.ts';
import {
  EMPTY_PARTNER,
  loadPartner,
  partnerAsProfile,
  savePartner,
  type PartnerBirth,
} from '../bazi/partner.ts';
import { parseBirthParts } from '../bazi/parse-birth.ts';
import { mapBaziEvidence } from '../bazi/bazi-evidence.ts';
import { buildBaziPortrait } from '../bazi/portrait-template.ts';
import {
  formatBirthBrief,
  getActivePerson,
  hasBirthInfo,
  loadLifeStore,
} from '../life/storage.ts';
import type { EvidenceLine } from '../mystic-engine/types.ts';
import { mountBirthDatetimeField } from '../ui/birth-datetime-picker.ts';
import { draftFromBazi } from '../share/drafts.ts';
import { mountInviteCompanionBar } from '../share/invite-bar.ts';

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

function renderGrid(
  chart: BaziChart,
  opts?: { ariaLabel?: string; compact?: boolean },
): string {
  const ariaLabel = opts?.ariaLabel ?? '四柱排盘';
  const compact = opts?.compact ?? false;
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

  const coreRows = `
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
  `;

  const proRows = compact
    ? ''
    : `
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
  `;

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
          ${coreRows}
          ${proRows}
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

function stepFromLocation(): LearnStepId {
  try {
    return parseLearnStep(new URL(location.href).searchParams.get('step'));
  } catch {
    return 2;
  }
}

function setStepInUrl(step: LearnStepId): void {
  try {
    const u = new URL(location.href);
    u.searchParams.set('step', String(step));
    history.replaceState({}, '', `${u.pathname}${u.search}`);
  } catch {
    /* ignore */
  }
}

export function renderBaziChart(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const store = loadLifeStore();
  const person = getActivePerson();
  const ready = hasBirthInfo(store.profile) && Boolean(store.profile.birthYear.trim());

  let liunianYear = new Date().getFullYear();
  let mode: 'natal' | 'hepan' = 'natal';
  let partner = loadPartner();
  let learnStep = stepFromLocation();
  let gridCompact = true;

  const page = document.createElement('div');
  page.className = 'page life-page bazi-chart-page';
  mountEnvBanner(page);

  function paint(): void {
    if (!ready) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 我的命盘</button>
        <header class="life-header">
          <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
          <h1 class="page-title">命盘解析</h1>
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
        <button type="button" class="back-link life-back">← 我的命盘</button>
        <header class="life-header">
          <h1 class="page-title">命盘解析</h1>
          <p class="page-subtitle">${escapeHtml(selfResult.error)}</p>
        </header>
        <button type="button" class="life-btn-primary" data-path="/bazi">回去改出生信息</button>
      `;
      bindNav();
      return;
    }

    const chart = selfResult;
    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/bazi/reading">← 我的命盘</button>
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <p class="home-eyebrow">BIRTH CODE · L2</p>
        <h1 class="page-title">命盘解析</h1>
        <p class="page-subtitle">认识自己的出生密码</p>
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

    if (mode === 'natal') {
      bindLiunian();
      bindLearnSteps();
    }
    if (mode === 'hepan') bindHepanForm();
    page.querySelector('[data-bazi-invite]') &&
      mountInviteCompanionBar(page.querySelector('[data-bazi-invite]')!, {
        unitLabel: '这份排盘',
        system: 'bazi',
        draft: () => {
          const pillarsLabel = chart.pillars
            .filter((p) => !p.empty)
            .map((p) => `${p.title}${p.stem}${p.branch}`)
            .join(' · ');
          return draftFromBazi({
            dayMaster: chart.dayMaster,
            pillarsLabel,
            question: '四柱排盘',
            summary: `日主 ${chart.dayMaster}${chart.dayMasterWx ? ` · ${chart.dayMasterWx}` : ''} · ${pillarsLabel}`,
            sections: [
              {
                heading: '日主',
                body: `${chart.dayMaster}${chart.dayMasterWx ? `（${chart.dayMasterWx}）` : ''}`,
              },
              { heading: '四柱', body: pillarsLabel },
              { heading: '流年', body: String(chart.liunianYear) },
            ],
          });
        },
      });
  }

  function renderLearnNav(): string {
    return `
      <nav class="bazi-learn-steps" aria-label="出生密码五步">
        <p class="bazi-learn-lead">为什么这个时间形成这个命盘？</p>
        <ol class="bazi-learn-list">
          ${LEARN_STEPS.map(
            (s) => `
            <li>
              <button type="button" class="bazi-learn-step ${learnStep === s.id ? 'is-active' : ''}" data-learn-step="${s.id}">
                <span class="bazi-learn-num">${s.id}</span>
                <span>${escapeHtml(s.label)}</span>
              </button>
            </li>`,
          ).join('')}
        </ol>
      </nav>
    `;
  }

  function renderStepBody(chart: BaziChart): string {
    const portrait = buildBaziPortrait(chart, { gender: person.gender });
    if (learnStep === 1) {
      return `
        <section class="bazi-learn-panel" aria-label="出生时间">
          <h2 class="life-route-title">① 出生时间</h2>
          <p>出生简记：${escapeHtml(formatBirthBrief(store.profile))}</p>
          <p>钟表时刻：${escapeHtml(chart.clockLabel)}</p>
          <p>真太阳时：${escapeHtml(chart.trueSolarLabel)}</p>
          <p class="bazi-meta-note">${escapeHtml(chart.place.note)}</p>
          <button type="button" class="life-btn-ghost" data-path="/bazi/rectify">时辰不确定？去校准 ›</button>
        </section>`;
    }
    if (learnStep === 2) {
      return `
        <section class="bazi-learn-panel" aria-label="四柱">
          <h2 class="life-route-title">② 四柱</h2>
          ${renderGrid(chart, { compact: gridCompact })}
          <button type="button" class="life-btn-ghost" id="bazi-grid-toggle">
            ${gridCompact ? '展开专业盘' : '收起专业盘'}
          </button>
        </section>`;
    }
    if (learnStep === 3) {
      const wx = chart.dayMasterWx || '—';
      const strength =
        chart.season.find((s) => s.label === chart.dayMasterWx)?.strength ?? '休';
      return `
        <section class="bazi-learn-panel" aria-label="五行">
          <h2 class="life-route-title">③ 五行</h2>
          <p>日主气质关键词：${escapeHtml(portrait.keyword)}</p>
          <p class="bazi-learn-note">学习名：日主属「${escapeHtml(wx)}」，月令强度「${escapeHtml(strength)}」（仅学习用）。</p>
          ${seasonBlock(chart)}
        </section>`;
    }
    if (learnStep === 4) {
      const gods = chart.pillars
        .filter((p) => !p.empty && p.key !== 'liunian')
        .map((p) => {
          const plain = TEN_GOD_PLAIN[p.stemGod] ?? '关系位';
          return `<li><strong>${escapeHtml(p.title)}</strong> · 学习名「${escapeHtml(p.stemGod)}」→ ${escapeHtml(plain)}</li>`;
        })
        .join('');
      return `
        <section class="bazi-learn-panel" aria-label="十神">
          <h2 class="life-route-title">④ 十神</h2>
          <ul class="bazi-ten-god-list">${gods}</ul>
          <p>事业倾向（白话）：${escapeHtml(portrait.career)}</p>
          <p>关系模式（白话）：${escapeHtml(portrait.relationship)}</p>
        </section>`;
    }
    const evidence = mapBaziEvidence(chart);
    return `
      <section class="bazi-learn-panel" aria-label="人生主题">
        <h2 class="life-route-title">⑤ 人生主题</h2>
        <ul class="bazi-theme-list">
          ${portrait.themes
            .map(
              (t, i) =>
                `<li><button type="button" class="bazi-theme-jump" data-learn-step="${i === 0 ? 3 : i === 1 ? 4 : 2}">${escapeHtml(t)}</button></li>`,
            )
            .join('')}
        </ul>
        ${renderEvidenceBlock(evidence)}
      </section>`;
  }

  function renderEvidenceBlock(lines: EvidenceLine[]): string {
    if (!lines.length) return '';
    return `
      <div class="bazi-evidence bazi-evidence-inline" aria-label="盘面依据">
        <h3 class="life-route-title">盘面依据</h3>
        <ol class="bazi-evidence-list">
          ${lines
            .map(
              (e) => `
            <li>
              <p>${escapeHtml(e.plain)}</p>
              ${
                e.gloss
                  ? `<details class="bazi-evidence-gloss"><summary>学习名 · ${escapeHtml(e.gloss.term)}</summary><p>${escapeHtml(e.gloss.gloss)}</p></details>`
                  : ''
              }
            </li>`,
            )
            .join('')}
        </ol>
      </div>`;
  }

  function renderNatal(chart: BaziChart): string {
    return `
      ${renderLearnNav()}
      ${renderStepBody(chart)}

      <section class="bazi-liunian-bar" aria-label="流年切换">
        <button type="button" class="life-btn-ghost" id="bazi-year-prev" aria-label="上一年">←</button>
        <label class="bazi-year-field">
          <span>流年</span>
          <input type="number" id="bazi-year-input" value="${chart.liunianYear}" min="1900" max="2100" />
        </label>
        <button type="button" class="life-btn-ghost" id="bazi-year-next" aria-label="下一年">→</button>
        <button type="button" class="life-btn-ghost" id="bazi-year-now">今年</button>
      </section>

      <div class="ms-invite-host bazi-share" data-bazi-invite></div>
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
          ${renderGrid(selfNoLn, { ariaLabel: '自己四柱', compact: false })}
          <h3 class="bazi-hepan-heading">${escapeHtml(p.label || '对方')} · ${escapeHtml(partnerChart.dayMaster)}${partnerChart.dayMasterWx}</h3>
          ${renderGrid(partnerChart, { ariaLabel: '对方四柱', compact: false })}
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
          <label class="life-field life-field-full"><span>出生地</span><input name="birthPlace" type="text" placeholder="如 成都" value="${escapeHtml(p.birthPlace)}" /></label>
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

  function bindLearnSteps(): void {
    page.querySelectorAll<HTMLButtonElement>('[data-learn-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        learnStep = parseLearnStep(btn.dataset.learnStep);
        setStepInUrl(learnStep);
        paint();
      });
    });
    page.querySelector('#bazi-grid-toggle')?.addEventListener('click', () => {
      gridCompact = !gridCompact;
      paint();
    });
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
    page.querySelector('.life-back')?.addEventListener('click', (e) => {
      const el = e.currentTarget as HTMLElement;
      const path = el.dataset.path || '/bazi/reading';
      navigate(path);
    });
    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      if (el.classList.contains('life-back')) return;
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
