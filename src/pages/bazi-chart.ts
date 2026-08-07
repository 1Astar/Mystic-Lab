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
import {
  birthJieqiNote,
  buildLuckCycles,
  type DayunColumn,
  type LiunianColumn,
  type LiuyueColumn,
  type LuckCycles,
} from '../bazi/luck-cycles.ts';
import { buildBaziPageFaq } from '../bazi/page-faq.ts';
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
import { answerBaziConcept, recordBaziConceptMiss } from '../bazi/concept-ask.ts';
import { answerFromCodexEntity, resolveCodexEntityId } from '../bazi/codex-entity-resolve.ts';
import { openLabConceptPeek } from '../ui/lab-concept-peek.ts';
import { openLabDeepSheet } from '../ui/lab-deep-sheet.ts';
import { mountLabFloatActions } from '../ui/lab-float-actions.ts';
import { baziSysTabsHtml } from '../ui/lab-sys-tabs.ts';
import { mountLabReadingTopbar } from '../ui/lab-reading-chrome.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 可点字段：打开本地释义（用 span，避免嵌在大运按钮内非法） */
function termBtn(term: string, cls = '', inner?: string): string {
  const t = term.trim();
  if (!t || t === '—') return `<span class="${cls}">—</span>`;
  return `<span class="bazi-term ${cls}" role="button" tabindex="0" data-bazi-term="${escapeHtml(t)}">${inner ?? escapeHtml(t)}</span>`;
}

function hideLine(p: PillarCell): string {
  if (p.empty || p.hideGan.length === 0) return '—';
  return p.hideGan
    .map((g, i) => {
      const god = p.hideGods[i] ?? '';
      return `<span class="bazi-hide ${stemWxClass(g)}">${termBtn(g, stemWxClass(g))}${
        god ? termBtn(god, '', `<small>${escapeHtml(god)}</small>`) : ''
      }</span>`;
    })
    .join('');
}

function shenshaLine(p: PillarCell): string {
  if (p.empty || p.shensha.length === 0) return '—';
  return `<div class="bazi-shensha">${p.shensha.map((s) => termBtn(s)).join('')}</div>`;
}

function natalPillars(chart: BaziChart): PillarCell[] {
  return chart.pillars.filter((p) => p.key !== 'liunian');
}

function renderGrid(
  chart: BaziChart,
  opts?: { ariaLabel?: string; natalOnly?: boolean },
): string {
  const ariaLabel = opts?.ariaLabel ?? '四柱排盘';
  const cols = opts?.natalOnly === false ? chart.pillars : natalPillars(chart);
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
    ${row('干神', (p) => (p.empty ? '—' : termBtn(p.stemGod, 'bazi-god')))}
    ${row(
      '天干',
      (p) => (p.empty ? '—' : termBtn(p.stem, `bazi-stem ${stemWxClass(p.stem)}`)),
      'bazi-row-main',
    )}
    ${row(
      '地支',
      (p) => (p.empty ? '—' : termBtn(p.branch, `bazi-branch ${branchWxClass(p.branch)}`)),
      'bazi-row-main',
    )}
  `;

  const proRows = `
    ${row('藏干', (p) => `<div class="bazi-hide-list">${hideLine(p)}</div>`)}
    ${row(
      '支神',
      (p) =>
        `<div class="bazi-zhishen">${
          p.empty || p.hideGods.length === 0
            ? '—'
            : p.hideGods.map((g) => termBtn(g)).join('')
        }</div>`,
    )}
    ${row('纳音', (p) => (p.empty ? '—' : termBtn(p.nayin, 'bazi-meta-cell')))}
    ${row('空亡', (p) => (p.empty ? '—' : termBtn(p.xunKong, 'bazi-meta-cell')))}
    ${row('地势', (p) => (p.empty ? '—' : termBtn(p.diShi, 'bazi-meta-cell')))}
    ${row('自坐', (p) => (p.empty ? '—' : termBtn(p.ziZuo, 'bazi-meta-cell')))}
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

function shortGod(god: string): string {
  const map: Record<string, string> = {
    偏印: '印',
    正印: '印',
    七杀: '杀',
    正官: '官',
    偏财: '财',
    正财: '才',
    食神: '食',
    伤官: '伤',
    比肩: '比',
    劫财: '劫',
  };
  return map[god] || god;
}

function godPair(stem: string, stemGod: string, branch: string, branchGod: string): string {
  if (!stem) return '—';
  return `<span class="bazi-luck-gz">${termBtn(stem, stemWxClass(stem), `<b class="${stemWxClass(stem)}">${escapeHtml(stem)}</b>`)}<em>${escapeHtml(shortGod(stemGod))}</em></span>
    <span class="bazi-luck-gz">${termBtn(branch, branchWxClass(branch), `<b class="${branchWxClass(branch)}">${escapeHtml(branch)}</b>`)}<em>${escapeHtml(shortGod(branchGod))}</em></span>`;
}

function seasonBlock(chart: BaziChart): string {
  const seasonHtml = chart.season
    .map(
      (s) =>
        `<button type="button" class="bazi-season-chip ${wuxingClass(s.label)}" data-bazi-term="${escapeHtml(s.label)}"><b>${escapeHtml(s.label)}</b>${escapeHtml(s.strength)}</button>`,
    )
    .join('');
  return `
    <section class="bazi-relations" aria-label="地支关系">
      <p class="bazi-relations-line">${
        chart.relations.length
          ? escapeHtml(chart.relations.join(' · '))
          : '地支暂无明显合冲刑害'
      }</p>
    </section>
    <section class="bazi-season" aria-label="月令旺衰">
      <div class="bazi-season-row" role="list">${seasonHtml}</div>
    </section>
  `;
}

function renderDayunCol(c: DayunColumn): string {
  const ageLabel =
    c.startAge === c.endAge ? `${c.startAge}岁` : `${c.startAge}~${c.endAge}岁`;
  return `
    <button type="button" class="bazi-luck-col ${c.current ? 'is-current' : ''}" data-luck-year="${c.startYear}" ${c.empty ? 'disabled' : ''}>
      <span class="bazi-luck-year">${c.startYear}</span>
      <span class="bazi-luck-age">${escapeHtml(ageLabel)}</span>
      ${
        c.empty
          ? '<span class="bazi-luck-empty">童限</span>'
          : godPair(c.stem, c.stemGod, c.branch, c.branchGod)
      }
    </button>`;
}

function renderLiunianCol(c: LiunianColumn): string {
  return `
    <button type="button" class="bazi-luck-col ${c.selected ? 'is-selected' : ''} ${c.current ? 'is-current' : ''}" data-luck-year="${c.year}">
      <span class="bazi-luck-year">${c.year}</span>
      ${godPair(c.stem, c.stemGod, c.branch, c.branchGod)}
      <span class="bazi-luck-xiao">${c.xiaoYunGanZhi ? escapeHtml(c.xiaoYunGanZhi) : '—'}</span>
    </button>`;
}

function renderLiuyueCol(c: LiuyueColumn, selected: boolean): string {
  return `
    <button type="button" class="bazi-luck-col ${selected ? 'is-selected' : ''} ${c.current ? 'is-current' : ''}" data-luck-yue="${c.index}">
      <span class="bazi-luck-jieqi">${escapeHtml(c.jieQi)}</span>
      <span class="bazi-luck-date">${escapeHtml(c.dateLabel)}</span>
      ${godPair(c.stem, c.stemGod, c.branch, c.branchGod)}
    </button>`;
}

function renderLuckBoard(luck: LuckCycles, selectedLiuyue: number | null): string {
  const yue =
    selectedLiuyue != null
      ? luck.liuyue.find((c) => c.index === selectedLiuyue)
      : luck.liuyue.find((c) => c.current) ?? luck.liuyue[0];
  const yueNote = yue
    ? `流月 · ${yue.jieQi}${yue.dateLabel ? `（${yue.dateLabel}）` : ''} · ${yue.ganZhi}${yue.stemGod ? `（${yue.stemGod}）` : ''}`
    : '';
  return `
    <section class="bazi-luck" aria-label="大运流年流月">
      <header class="bazi-luck-meta">
        <p>${escapeHtml(luck.qiYunLabel)}${luck.jiaoYunLabel ? ` · ${escapeHtml(luck.jiaoYunLabel)}` : ''}</p>
        <p>
          ${luck.dayXunKong ? `<span>空亡（日）${escapeHtml(luck.dayXunKong)}</span>` : ''}
          <span>${luck.ageNow}岁</span>
        </p>
      </header>

      <div class="bazi-luck-row" aria-label="大运">
        <div class="bazi-luck-label" aria-hidden="true">大运</div>
        <div class="bazi-luck-scroller" data-luck-scroll="dayun">
          ${luck.dayun.map(renderDayunCol).join('')}
        </div>
      </div>

      <div class="bazi-luck-row" aria-label="流年小运">
        <div class="bazi-luck-label" aria-hidden="true">流年小运</div>
        <div class="bazi-luck-scroller" data-luck-scroll="liunian">
          ${luck.liunian.map(renderLiunianCol).join('')}
        </div>
      </div>

      <div class="bazi-luck-row" aria-label="流月">
        <div class="bazi-luck-label" aria-hidden="true">流月</div>
        <div class="bazi-luck-scroller" data-luck-scroll="liuyue">
          ${luck.liuyue.map((c) => renderLiuyueCol(c, selectedLiuyue === c.index || (selectedLiuyue == null && c.current))).join('')}
        </div>
      </div>
      ${yueNote ? `<p class="bazi-luck-note">${escapeHtml(yueNote)}</p>` : ''}
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

  let store = loadLifeStore();
  let person = getActivePerson();
  const ready = () => hasBirthInfo(store.profile) && Boolean(store.profile.birthYear.trim());

  let liunianYear = new Date().getFullYear();
  let mode: 'natal' | 'hepan' = 'natal';
  let partner = loadPartner();
  let learnStep = stepFromLocation();
  let selectedLiuyue: number | null = null;
  let disposeFloat: (() => void) | null = null;

  const page = document.createElement('div');
  page.className = 'page life-page bazi-chart-page';
  mountEnvBanner(page);

  function paint(): void {
    disposeFloat?.();
    disposeFloat = null;
    store = loadLifeStore();
    person = getActivePerson();

    if (!ready()) {
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
          <button type="button" class="life-btn-primary" data-path="/bazi?edit=1">去填写</button>
        </section>
      `;
      bindNav();
      return;
    }

    const selfResult = castBaziChart(store.profile, liunianYear, {
      gender: person.gender,
    });
    if ('error' in selfResult) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 我的命盘</button>
        <header class="life-header">
          <h1 class="page-title">命盘解析</h1>
          <p class="page-subtitle">${escapeHtml(selfResult.error)}</p>
        </header>
        <button type="button" class="life-btn-primary" data-path="/bazi?edit=1">回去改出生信息</button>
      `;
      bindNav();
      return;
    }

    const chart = selfResult;
    page.innerHTML = `
      <button type="button" class="back-link life-back">← Lab</button>
      ${baziSysTabsHtml('chart')}

      <nav class="bazi-mode-tabs" role="tablist" aria-label="盘面模式">
        <button type="button" role="tab" class="bazi-mode-tab ${mode === 'natal' ? 'is-active' : ''}" data-mode="natal" aria-selected="${mode === 'natal'}">
          <strong>生辰</strong>
          <span>本命四柱</span>
        </button>
        <button type="button" role="tab" class="bazi-mode-tab ${mode === 'hepan' ? 'is-active' : ''}" data-mode="hepan" aria-selected="${mode === 'hepan'}">
          <strong>合盘</strong>
          <span>两人对照</span>
        </button>
      </nav>

      ${mode === 'natal' ? renderNatal(chart) : renderHepan(chart)}
    `;

    bindNav();
    mountLabReadingTopbar(page, {
      backPath: '/',
      backLabel: '← Lab',
      tujianPath: '/bazi/tujian',
      person: {
        onChange: () => paint(),
      },
      draftShare: () => {
        const pillarsLabel = natalPillars(chart)
          .filter((p) => !p.empty)
          .map((p) => `${p.title}${p.stem}${p.branch}`)
          .join(' · ');
        return draftFromBazi({
          dayMaster: chart.dayMaster,
          pillarsLabel,
          question: '四柱排盘',
          summary: `日主 ${chart.dayMaster}${chart.dayMasterWx ? ` · ${chart.dayMasterWx}` : ''} · ${pillarsLabel}`,
          sections: [{ heading: '盘面', body: pillarsLabel }],
        });
      },
    });

    disposeFloat = mountLabFloatActions(page, {
      tujianPath: '/bazi/tujian',
      draftShare: () => {
        const pillarsLabel = natalPillars(chart)
          .filter((p) => !p.empty)
          .map((p) => `${p.title}${p.stem}${p.branch}`)
          .join(' · ');
        return draftFromBazi({
          dayMaster: chart.dayMaster,
          pillarsLabel,
          question: '四柱排盘',
          summary: `日主 ${chart.dayMaster}${chart.dayMasterWx ? ` · ${chart.dayMasterWx}` : ''} · ${pillarsLabel}`,
          sections: [
            { heading: '四柱', body: pillarsLabel },
            { heading: '流年', body: String(chart.liunianYear) },
          ],
        });
      },
      onDeep: () => {
        openLabDeepSheet({
          system: 'bazi',
          title: `${person.nickname || '我'}的命盘`,
          initialTab: 'ask',
          presets: buildBaziPageFaq(chart),
          answerConcept: answerBaziConcept,
          onMiss: (q) => {
            void recordBaziConceptMiss(q);
          },
          deepHint: '结合四柱与当前流年，做一次更贴合的解读。概念题请用「边看边问」。',
          onDeep: () => navigate('/bazi/reading'),
        });
      },
    });

    page.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        mode = btn.dataset.mode === 'hepan' ? 'hepan' : 'natal';
        paint();
      });
    });

    bindTerms(chart, buildLuckCycles(store.profile, person.gender, liunianYear));

    if (mode === 'natal') {
      bindLiunian();
      bindLuck();
      bindLearnSteps();
      scrollLuckIntoView();
    }
    if (mode === 'hepan') bindHepanForm();
  }

  function bindTerms(chart: BaziChart, luck: LuckCycles | null): void {
    const openAsk = (term: string) => {
      openLabDeepSheet({
        system: 'bazi',
        title: `${person.nickname || '我'}的命盘`,
        initialTab: 'ask',
        seedQuery: term,
        presets: buildBaziPageFaq(chart),
        answerConcept: answerBaziConcept,
        onMiss: (q) => {
          void recordBaziConceptMiss(q);
        },
        deepHint: '结合四柱与当前流年，做一次更贴合的解读。',
        onDeep: () => navigate('/bazi/reading'),
      });
    };

    page.querySelectorAll<HTMLElement>('[data-bazi-term]').forEach((el) => {
      const open = (ev: Event) => {
        ev.preventDefault();
        ev.stopPropagation();
        const term = el.getAttribute('data-bazi-term')?.trim() ?? '';
        if (!term) return;
        openLabConceptPeek({
          term,
          answerConcept: (q) => {
            const from = answerFromCodexEntity(q, {
              chart,
              luck,
              depth: 'chart',
            });
            if (from.hit) return { answer: from.answer, hit: true };
            return answerBaziConcept(q);
          },
          onMiss: (q) => {
            void recordBaziConceptMiss(q);
          },
          onOpenAsk: openAsk,
          onOpenAtlas: (t) => {
            const id = resolveCodexEntityId(t);
            if (id) {
              try {
                sessionStorage.setItem('mystic-lab-open-codex-id', id);
              } catch {
                /* ignore */
              }
            }
            navigate('/bazi/tujian');
          },
          sourceHint: '图鉴知识库 · 命盘相关摘要',
        });
      };
      el.addEventListener('click', open);
      el.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') open(ev);
      });
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
          ${renderGrid(chart)}
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
    const jieqi = birthJieqiNote(store.profile);
    const luck = buildLuckCycles(store.profile, person.gender, liunianYear);
    return `
      <section class="bazi-meta bazi-natal-meta" aria-label="出生节气">
        <p>${jieqi ? escapeHtml(jieqi) : escapeHtml(formatBirthBrief(store.profile))}</p>
        <p class="bazi-meta-note">真太阳时 ${escapeHtml(chart.trueSolarLabel)} · ${escapeHtml(chart.place.note)}</p>
      </section>

      ${renderGrid(chart)}

      ${seasonBlock(chart)}
      ${luck ? renderLuckBoard(luck, selectedLiuyue) : '<p class="life-status">暂无法排出大运流年（需性别与完整出生信息）</p>'}

      <section class="bazi-liunian-bar" aria-label="流年切换">
        <button type="button" class="life-btn-ghost" id="bazi-year-prev" aria-label="上一年">←</button>
        <label class="bazi-year-field">
          <span>流年</span>
          <input type="number" id="bazi-year-input" value="${chart.liunianYear}" min="1900" max="2100" />
        </label>
        <button type="button" class="life-btn-ghost" id="bazi-year-next" aria-label="下一年">→</button>
        <button type="button" class="life-btn-ghost" id="bazi-year-now">今年</button>
      </section>

      <details class="bazi-learn-fold">
        <summary>出生密码五步（学习）</summary>
        ${renderLearnNav()}
        ${renderStepBody(chart)}
      </details>
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
          ${renderGrid(selfNoLn, { ariaLabel: '自己四柱' })}
          <h3 class="bazi-hepan-heading">${escapeHtml(p.label || '对方')} · ${escapeHtml(partnerChart.dayMaster)}${partnerChart.dayMasterWx}</h3>
          ${renderGrid(partnerChart, { ariaLabel: '对方四柱' })}
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
  }

  function bindLuck(): void {
    page.querySelectorAll<HTMLButtonElement>('[data-luck-year]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const n = Number(btn.dataset.luckYear);
        if (Number.isFinite(n) && n >= 1900 && n <= 2100) {
          liunianYear = Math.floor(n);
          selectedLiuyue = null;
          paint();
        }
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-luck-yue]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const n = Number(btn.dataset.luckYue);
        if (Number.isFinite(n)) {
          selectedLiuyue = Math.floor(n);
          paint();
        }
      });
    });
  }

  function scrollLuckIntoView(): void {
    requestAnimationFrame(() => {
      page.querySelectorAll<HTMLElement>('[data-luck-scroll]').forEach((scroller) => {
        const target =
          scroller.querySelector<HTMLElement>('.is-selected') ||
          scroller.querySelector<HTMLElement>('.is-current');
        if (!target) return;
        const left = target.offsetLeft - scroller.clientWidth / 2 + target.clientWidth / 2;
        scroller.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
      });
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
    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      if (el.classList.contains('life-back') || el.closest('.lab-reading-chrome')) return;
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
  }

  paint();
  root.appendChild(page);
  return () => {
    disposeFloat?.();
    stars.remove();
    document.querySelector('.birth-dt-sheet')?.remove();
    document.querySelector('[data-lab-float-dock]')?.remove();
  };
}
