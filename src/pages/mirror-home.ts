import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { attachPersonSwitcherToPage } from '../ui/module-person-chrome.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { castBaziChart } from '../bazi/cast.ts';
import { buildLuckCycles } from '../bazi/luck-cycles.ts';
import { parseBirthParts } from '../bazi/parse-birth.ts';
import { getActivePerson } from '../life/storage.ts';
import { buildMirrorCompare } from '../mirror/build-compare.ts';
import type { MirrorThemeCard, MirrorYearRow } from '../mirror/types.ts';
import { castZiweiChart } from '../ziwei/cast.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function themeCardHtml(t: MirrorThemeCard): string {
  return `
    <button type="button" class="mirror-theme-card" data-theme="${escapeHtml(t.id)}">
      <header class="mirror-theme-card-head">
        <strong>${escapeHtml(t.title)}</strong>
        <span>八字 · ${escapeHtml(t.baziLens)}</span>
        <span>紫微 · ${escapeHtml(t.ziweiLens)}</span>
      </header>
      <p class="mirror-theme-shared">${escapeHtml(t.shared)}</p>
      <p class="mirror-theme-synthesis">${escapeHtml(t.synthesis)}</p>
      <em class="mirror-theme-more">看证据与差异 ›</em>
    </button>`;
}

function timelineHtml(rows: MirrorYearRow[], selectedYear: number): string {
  if (!rows.length) return '';
  const selected = rows.find((r) => r.year === selectedYear) ?? rows.find((r) => r.current) ?? rows[0]!;
  const chips = rows
    .map(
      (r) => `
      <button type="button" class="mirror-year-chip ${r.year === selected.year ? 'is-on' : ''}" data-year="${r.year}" aria-pressed="${r.year === selected.year}">
        <strong>${r.year}</strong>
        <span>${escapeHtml(r.ziweiChip || '流年')}</span>
      </button>`,
    )
    .join('');
  return `
    <section class="mirror-timeline" aria-label="流年时间轴">
      <header class="mirror-timeline-head">
        <h2>流年时间轴</h2>
        <p>同一年：八字大运/流年动力 × 紫微流年命宫场景</p>
      </header>
      <div class="mirror-year-rail" role="list">${chips}</div>
      <article class="mirror-year-detail" data-year-detail>
        <p class="mirror-year-age">${selected.year} · 虚岁约 ${selected.age}</p>
        <div class="mirror-year-split">
          <div>
            <h3>八字</h3>
            <p>${escapeHtml(selected.baziDayun)}</p>
            <p>${escapeHtml(selected.baziLiunian)}</p>
          </div>
          <div>
            <h3>紫微</h3>
            <p>流年命 · ${escapeHtml(selected.ziweiPalace.replace(/宫$/, '') || '—')}（${escapeHtml(selected.ziweiChip)}）</p>
            <p>${escapeHtml(selected.ziweiMutagen || '四化待读')}</p>
          </div>
        </div>
        <p class="mirror-year-compare">${escapeHtml(selected.compare)}</p>
      </article>
    </section>`;
}

export function renderMirrorHome(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const person = getActivePerson();
  const page = document.createElement('div');
  page.className = 'page life-page mirror-page';
  mountEnvBanner(page);

  const canBazi = Boolean(
    parseBirthParts(person.birthYear, person.birthMonth, person.birthDay, person.birthHour),
  );
  const needGender = !person.gender;
  const nowYear = new Date().getFullYear();
  let selectedYear = nowYear;

  const rebuildBody = (): string => {
    if (!canBazi) {
      return `
      <section class="mirror-gate">
        <p>双盘映照需要完整出生信息（至少年月日）。</p>
        <button type="button" class="life-btn-primary" data-path="/profile">去管理档案填写 ›</button>
      </section>`;
    }
    if (needGender) {
      return `
      <section class="mirror-gate">
        <p>紫微排盘需要性别（阴阳顺逆）。请先在档案里选择。</p>
        <button type="button" class="life-btn-primary" data-path="/profile">去管理档案 ›</button>
      </section>`;
    }
    const chart = castBaziChart(person, selectedYear, {
      includeLiunian: false,
      gender: person.gender,
    });
    const ziwei = castZiweiChart(person);
    if ('error' in chart) {
      return `<section class="mirror-gate"><p>${escapeHtml(chart.error)}</p></section>`;
    }
    if ('error' in ziwei) {
      return `
        <section class="mirror-gate">
          <p>${escapeHtml(ziwei.error)}</p>
          <button type="button" class="life-btn-primary" data-path="/profile">去管理档案 ›</button>
        </section>`;
    }
    const luck = buildLuckCycles(person, person.gender, selectedYear);
    const pack = buildMirrorCompare(chart, ziwei, {
      personName: person.nickname,
      gender: person.gender,
      person,
      luck,
      focusYear: selectedYear,
      nowYear,
      timelineRadius: 3,
    });
    return `
        <section class="mirror-hero-meta" aria-label="双盘摘要">
          <p><strong>${escapeHtml(pack.personName)}</strong> · ${escapeHtml(pack.dayMasterBrief)}</p>
          <p>${escapeHtml(pack.soulBrief)}</p>
          <p class="mirror-headline">${escapeHtml(pack.headline)}</p>
        </section>
        ${timelineHtml(pack.timeline, selectedYear)}
        <section class="mirror-theme-grid" aria-label="六大主题对照">
          ${pack.themes.map(themeCardHtml).join('')}
        </section>
        <p class="mirror-footnote">点进主题可看：用了哪些信息、为何相近或不同、稳定底色与会变部分。</p>
        <p class="mirror-rectify-cta">
          <button type="button" class="life-btn-ghost" data-path="/mirror/rectify">多时辰双盘校准 ›</button>
          <span class="mirror-footnote">候选时辰分别排盘，用事件看八字/紫微哪边更贴</span>
        </p>`;
  };

  const paint = () => {
    const bodyHtml = rebuildBody();
    page.innerHTML = `
    <button type="button" class="back-link life-back" data-path="/">← 返回 Mystic Lab</button>
    <header class="life-header">
      <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
      <p class="home-eyebrow">DUAL MIRROR</p>
      <h1 class="page-title">双盘映照</h1>
      <p class="page-subtitle">八字看结构，紫微看人生场景，两套体系一起看你。</p>
      <p class="bazi-home-person">当前角色 · ${escapeHtml(person.nickname)}</p>
    </header>
    ${bodyHtml}
  `;
    bind();
    attachPersonSwitcherToPage(page);
  };

  const bind = () => {
    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach((btn) => {
      btn.addEventListener('click', () => {
        navigate(`/mirror/theme?id=${encodeURIComponent(btn.dataset.theme || '')}`);
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-year]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const y = Number(btn.dataset.year);
        if (!Number.isFinite(y) || y === selectedYear) return;
        selectedYear = y;
        paint();
      });
    });
  };

  root.appendChild(page);
  paint();

  return () => {
    stars.remove();
  };
}
