/**
 * 八字 · 生命结构面板
 */
import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { castBaziChart } from '../bazi/cast.ts';
import { buildLifeStructure } from '../bazi/life-structure.ts';
import {
  patternYongshenCardHtml,
  resolvePatternYongshen,
} from '../bazi/pattern-yongshen.ts';
import { buildLuckCycles } from '../bazi/luck-cycles.ts';
import { getActivePerson, hasBirthInfo, loadLifeStore } from '../life/storage.ts';
import { baziSysTabsHtml } from '../ui/lab-sys-tabs.ts';
import { attachPersonSwitcherToPage } from '../ui/module-person-chrome.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderBaziStructure(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page life-page bazi-structure-page';
  mountEnvBanner(page);

  const store = loadLifeStore();
  const person = getActivePerson();

  if (!hasBirthInfo(store.profile)) {
    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/bazi">← 八字</button>
      ${baziSysTabsHtml('reading')}
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <p class="home-eyebrow">STRUCTURE</p>
        <h1 class="page-title">生命结构</h1>
      </header>
      <section class="mirror-gate">
        <p>需要出生信息，才能生成长期结构档案。</p>
        <button type="button" class="life-btn-primary" data-path="/bazi?edit=1">去填写 ›</button>
      </section>`;
  } else {
    const chart = castBaziChart(person, new Date().getFullYear(), {
      includeLiunian: false,
      gender: person.gender,
    });
    if ('error' in chart) {
      page.innerHTML = `
        <button type="button" class="back-link life-back" data-path="/bazi">← 八字</button>
        <section class="mirror-gate"><p>${escapeHtml(chart.error)}</p></section>`;
    } else {
      const luck = buildLuckCycles(person, person.gender, new Date().getFullYear());
      const pack = buildLifeStructure(chart, {
        person,
        gender: person.gender,
        luck,
      });
      const patternYong = resolvePatternYongshen(chart);
      const bars = pack.bars
        .map(
          (b) => `
        <div class="ls-bar ${b.cssClass}${b.dayMaster ? ' is-day' : ''}">
          <div class="ls-bar-head">
            <strong class="${b.cssClass}">${escapeHtml(b.wx)}</strong>
            <em>${escapeHtml(b.softLabel)}</em>
            <span>${escapeHtml(b.growth)}</span>
          </div>
          <div class="ls-bar-track" role="progressbar" aria-valuenow="${b.pct}" aria-valuemin="0" aria-valuemax="100">
            <i style="width:${b.pct}%"></i>
          </div>
          <p>${escapeHtml(b.tip)}</p>
        </div>`,
        )
        .join('');

      const stage = pack.stage
        ? `
        <section class="ls-card" aria-label="人生阶段">
          <p class="ls-kicker">人生阶段 · 大运</p>
          <h2 class="ls-h2">${escapeHtml(pack.stage.title)}</h2>
          <p class="ls-meta">${escapeHtml(pack.stage.range)}</p>
          <p class="ls-body">${escapeHtml(pack.stage.topic)}</p>
          <details class="ls-why">
            <summary>为什么</summary>
            <ul>${pack.stage.why.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}</ul>
          </details>
        </section>`
        : `
        <section class="ls-card">
          <p class="ls-kicker">人生阶段 · 大运</p>
          <p class="ls-body">暂未能排出当前大运（可在档案补性别后更准）。</p>
        </section>`;

      page.innerHTML = `
        <button type="button" class="back-link life-back" data-path="/bazi">← 八字</button>
        ${baziSysTabsHtml('reading')}
        <header class="life-header">
          <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
          <p class="home-eyebrow">STRUCTURE</p>
          <h1 class="page-title">生命结构</h1>
          <p class="page-subtitle">长期底色 · 像一份 RPG 属性，不是缺什么清单</p>
          <p class="ls-dm">${escapeHtml(pack.dayMasterLine)}</p>
        </header>

        <section class="ls-card ls-hero" aria-label="一句定位">
          <p class="ls-kicker">一句定位</p>
          <h2 class="ls-headline">${escapeHtml(pack.headline)}</h2>
        </section>

        ${patternYongshenCardHtml(patternYong)}

        <section class="ls-card" aria-label="五行属性">
          <p class="ls-kicker">五行属性</p>
          <p class="ls-lead">偏旺 / 可多用 / 底色 / 蓄力 —— 不说「缺什么」。</p>
          <div class="ls-bars">${bars}</div>
        </section>

        <section class="ls-card" aria-label="结构短文">
          <p class="ls-kicker">结构速读</p>
          <div class="ls-blocks">
            <article>
              <h3>性格倾向</h3>
              <p>${escapeHtml(pack.personality)}</p>
            </article>
            <article>
              <h3>优势模式</h3>
              <p>${escapeHtml(pack.strength)}</p>
            </article>
            <article>
              <h3>适合环境</h3>
              <p>${escapeHtml(pack.environment)}</p>
            </article>
          </div>
          <details class="ls-why">
            <summary>为什么 · 本命依据</summary>
            <ul>${pack.natalWhy.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}</ul>
          </details>
        </section>

        ${stage}

        <p class="ls-foot">造命「五行磁场」与这里同源。可去 <button type="button" class="ls-inline-link" data-path="/craft">造命</button> 看养成；或 <button type="button" class="ls-inline-link" data-path="/bazi/reading">命盘解读</button>。</p>`;
    }
  }

  root.appendChild(page);
  attachPersonSwitcherToPage(page, {
    onChange: () => navigate('/bazi/structure'),
  });

  page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
    el.addEventListener('click', () => {
      const path = el.dataset.path;
      if (path) navigate(path);
    });
  });

  return () => stars.remove();
}
