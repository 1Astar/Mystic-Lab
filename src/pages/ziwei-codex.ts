import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import {
  MAJOR_GROUP_LABEL,
  STAR_CATEGORY_LABEL,
  codexStarsByCategory,
  getStarLore,
  majorsByGroup,
  type MajorGroup,
  type StarCard,
  type StarCategory,
} from '../ziwei/stars.ts';
import {
  codexProgress,
  connectionLine,
  isStarUnlocked,
  listCodexEntries,
} from '../ziwei/codex.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const TABS: StarCategory[] = ['major', 'aux', 'mutagen'];

function queryStar(): string {
  try {
    return new URLSearchParams(location.search).get('star')?.trim() ?? '';
  } catch {
    return '';
  }
}

function renderCardTile(
  star: StarCard,
  entries: Map<string, { lastPalace?: string }>,
  size: 'lg' | 'sm',
): string {
  const unlocked = isStarUnlocked(star.id);
  const entry = entries.get(star.id);
  const group =
    star.majorGroup != null ? MAJOR_GROUP_LABEL[star.majorGroup as MajorGroup] : '';
  return `
    <button type="button" class="ziwei-star-card ${size === 'lg' ? 'is-hero' : 'is-side'} ${unlocked ? 'is-lit' : 'is-dim'}" data-open-star="${star.id}">
      <div class="ziwei-star-glyph" aria-hidden="true">${star.id.slice(0, 1)}</div>
      <h2>${escapeHtml(star.title)} <em>${escapeHtml(star.epithet)}</em></h2>
      ${group ? `<p class="ziwei-star-group">${escapeHtml(group)}</p>` : ''}
      <p class="ziwei-star-myth">${escapeHtml(star.myth)}</p>
      ${
        unlocked
          ? `<p class="ziwei-star-link">${escapeHtml(connectionLine(star.id, entry?.lastPalace))}</p>
             <span class="ziwei-star-cta">查看深度解析 ›</span>`
          : `<p class="ziwei-star-locked">尚未点亮 · 排盘遇见后解锁</p>`
      }
    </button>`;
}

function renderDetail(
  star: StarCard,
  entries: Map<string, { lastPalace?: string }>,
): string {
  const unlocked = isStarUnlocked(star.id);
  const entry = entries.get(star.id);
  return `
    <article class="ziwei-star-detail ${unlocked ? 'is-lit' : ''}">
      <button type="button" class="ziwei-detail-back" data-close-detail>← 返回图鉴</button>
      <div class="ziwei-detail-hero">
        <div class="ziwei-star-glyph is-xl" aria-hidden="true">${star.id.slice(0, 1)}</div>
        <h1>${escapeHtml(star.title)} <em>${escapeHtml(star.epithet)}</em></h1>
        <p class="ziwei-star-myth">${escapeHtml(star.myth)}</p>
        ${unlocked ? `<p class="ziwei-star-link">${escapeHtml(connectionLine(star.id, entry?.lastPalace))}</p>` : '<p class="ziwei-star-locked">尚未点亮 · 先去排盘遇见它</p>'}
      </div>
      <section class="ziwei-detail-block">
        <h3>人物画像</h3>
        <p>${escapeHtml(star.portrait)}</p>
      </section>
      <section class="ziwei-detail-block">
        <h3>长在身上的特质</h3>
        <p>${escapeHtml(star.trait)}</p>
      </section>
      <section class="ziwei-detail-block">
        <h3>在生活这面镜子里</h3>
        <p><strong>工作 / 财运</strong>　${escapeHtml(star.mirrorWork)}</p>
        <p><strong>感情</strong>　${escapeHtml(star.mirrorLove)}</p>
      </section>
      <section class="ziwei-detail-block ziwei-detail-counsel">
        <h3>给你的醒言</h3>
        <p>${escapeHtml(star.counsel)}</p>
      </section>
      <p class="ziwei-codex-foot">收集的不是算命符号，而是你的隐藏人格与天赋——像分院帽分出的性格学院。</p>
    </article>`;
}

export function renderZiweiCodex(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page ziwei-page ziwei-codex-page';
  mountEnvBanner(page);
  root.appendChild(page);

  let tab: StarCategory = 'major';
  let detailId = queryStar();
  const entries = new Map(listCodexEntries().map((e) => [e.starId, e]));

  function paint(): void {
    const detail = detailId ? getStarLore(detailId) : undefined;
    if (detail) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回紫微</button>
        ${renderDetail(detail, entries)}
      `;
      page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei'));
      page.querySelector('[data-close-detail]')?.addEventListener('click', () => {
        detailId = '';
        try {
          history.replaceState({}, '', '/ziwei/codex');
        } catch {
          /* ignore */
        }
        paint();
      });
      return;
    }

    const all = codexProgress();
    const tabsHtml = TABS.map((id) => {
      const p = codexProgress(id);
      return `<button type="button" class="ziwei-codex-tab ${tab === id ? 'is-on' : ''}" data-tab="${id}">
        ${STAR_CATEGORY_LABEL[id]}
        <em>${p.collected}/${p.total}</em>
      </button>`;
    }).join('');

    let grid = '';
    if (tab === 'major') {
      grid = `
        <p class="ziwei-codex-hint">六正星 · 绝对核心大卡</p>
        <div class="ziwei-star-grid is-hero-grid">${majorsByGroup('six')
          .map((s) => renderCardTile(s, entries, 'lg'))
          .join('')}</div>
        <p class="ziwei-codex-hint">八正星 · 绝对核心大卡</p>
        <div class="ziwei-star-grid is-hero-grid">${majorsByGroup('eight')
          .map((s) => renderCardTile(s, entries, 'lg'))
          .join('')}</div>`;
    } else {
      const size = tab === 'aux' ? 'sm' : 'lg';
      grid = `
        <p class="ziwei-codex-hint">${STAR_CATEGORY_LABEL[tab]} · ${
          tab === 'mutagen' ? '人生催化剂套装' : '辅助配角卡'
        }</p>
        <div class="ziwei-star-grid ${tab === 'aux' ? 'is-aux-grid' : ''}">${codexStarsByCategory(tab)
          .map((s) => renderCardTile(s, entries, size))
          .join('')}</div>`;
    }

    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回紫微</button>
      <header class="life-header ziwei-header">
        <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
        <h1 class="page-title">星曜图鉴</h1>
        <p class="page-subtitle">收集隐藏人格与天赋 · ${all.collected}/${all.total}</p>
      </header>
      <div class="ziwei-codex-tabs" role="tablist">${tabsHtml}</div>
      ${grid}
    `;

    page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei'));
    page.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.tab as StarCategory;
        if (TABS.includes(next)) {
          tab = next;
          paint();
        }
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-open-star]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.openStar ?? '';
        detailId = id;
        try {
          history.replaceState({}, '', `/ziwei/codex?star=${encodeURIComponent(id)}`);
        } catch {
          /* ignore */
        }
        paint();
      });
    });
  }

  paint();
  return () => stars.remove();
}
