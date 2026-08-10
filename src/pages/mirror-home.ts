import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { attachPersonSwitcherToPage } from '../ui/module-person-chrome.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { castBaziChart } from '../bazi/cast.ts';
import { parseBirthParts } from '../bazi/parse-birth.ts';
import { getActivePerson } from '../life/storage.ts';
import { buildMirrorCompare } from '../mirror/build-compare.ts';
import type { MirrorThemeCard } from '../mirror/types.ts';
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

  let bodyHtml = '';
  if (!canBazi) {
    bodyHtml = `
      <section class="mirror-gate">
        <p>双盘映照需要完整出生信息（至少年月日）。</p>
        <button type="button" class="life-btn-primary" data-path="/profile">去管理档案填写 ›</button>
      </section>`;
  } else if (needGender) {
    bodyHtml = `
      <section class="mirror-gate">
        <p>紫微排盘需要性别（阴阳顺逆）。请先在档案里选择。</p>
        <button type="button" class="life-btn-primary" data-path="/profile">去管理档案 ›</button>
      </section>`;
  } else {
    const chart = castBaziChart(person, new Date().getFullYear(), {
      includeLiunian: false,
      gender: person.gender,
    });
    const ziwei = castZiweiChart(person);
    if ('error' in chart) {
      bodyHtml = `<section class="mirror-gate"><p>${escapeHtml(chart.error)}</p></section>`;
    } else if ('error' in ziwei) {
      bodyHtml = `
        <section class="mirror-gate">
          <p>${escapeHtml(ziwei.error)}</p>
          <button type="button" class="life-btn-primary" data-path="/profile">去管理档案 ›</button>
        </section>`;
    } else {
      const pack = buildMirrorCompare(chart, ziwei, {
        personName: person.nickname,
        gender: person.gender,
      });
      bodyHtml = `
        <section class="mirror-hero-meta" aria-label="双盘摘要">
          <p><strong>${escapeHtml(pack.personName)}</strong> · ${escapeHtml(pack.dayMasterBrief)}</p>
          <p>${escapeHtml(pack.soulBrief)}</p>
          <p class="mirror-headline">${escapeHtml(pack.headline)}</p>
        </section>
        <section class="mirror-theme-grid" aria-label="六大主题对照">
          ${pack.themes.map(themeCardHtml).join('')}
        </section>
        <p class="mirror-footnote">点进主题可看：用了哪些信息、为何相近或不同、稳定底色与会变部分。</p>`;
    }
  }

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

  root.appendChild(page);
  attachPersonSwitcherToPage(page);

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

  return () => {
    stars.remove();
  };
}
