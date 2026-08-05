import { navigate } from '../router.ts';
import {
  HEXAGRAMS,
  linesFromHexagram,
  palaceOfHexagram,
  type Hexagram,
} from '../liuyao/hexagrams.ts';
import { isHexFavorite } from '../liuyao/hex-favorites.ts';
import {
  buildHexGuidePack,
  renderGuideArtHtml,
} from '../liuyao/hex-guide.ts';
import {
  buildVaultOverview,
  getLiuyaoJourneyInsights,
} from '../liuyao/journey.ts';
import { meetLineFor } from '../liuyao/vault.ts';
import { TRIGRAM_ORDER, TRIGRAMS, type TrigramId } from '../liuyao/trigrams.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { liuyaoPageBgStyle } from '../ui/liuyao-hero.ts';

type VaultFilter = 'all' | 'met' | 'favorite';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function artHtml(h: Hexagram): string {
  const pack = buildHexGuidePack(h);
  return renderGuideArtHtml(pack, { className: 'ly-guide-art', alt: h.fullName });
}

/** 列表卡精简爻象（无标签） */
function renderMiniYao(lines: number[]): string {
  const topFirst = [...lines].reverse();
  return `
    <div class="ly-guide-yao-stack" aria-hidden="true">
      ${topFirst
        .map((bit, i) => {
          const yang = bit === 1;
          const tri = i < 3 ? 'is-upper-tri' : 'is-lower-tri';
          return `
          <div class="ly-guide-yao-row ${tri}${yang ? ' is-yang' : ' is-yin'}">
            <span class="ly-guide-yao-ln"></span>
          </div>`;
        })
        .join('')}
      <div class="ly-guide-yao-seam" aria-hidden="true"></div>
    </div>
  `;
}

/** 我的卦库：概览 · 旅程 · 内嵌 64 卦（对标塔罗图鉴） */
export function renderLiuyaoVault(root: HTMLElement): () => void {
  const snap = buildVaultOverview();
  const journey = getLiuyaoJourneyInsights(30);
  const meetByName = new Map(snap.meets.map((m) => [m.name, m.count]));
  const page = document.createElement('div');
  page.className = 'page ly-vault-page';
  page.setAttribute('style', liuyaoPageBgStyle('learn'));
  mountEnvBanner(page);

  let filter: VaultFilter = 'met';
  let query = '';
  let palace: TrigramId | 'all' = 'all';

  const pct = snap.total ? Math.round((snap.collected / snap.total) * 100) : 0;
  const palaceRows = snap.palaces
    .map((p) => {
      const w = p.total ? Math.round((p.collected / p.total) * 100) : 0;
      return `
      <li class="ly-vault-suit">
        <span class="ly-vault-suit-label">${escapeHtml(p.label)}</span>
        <span class="ly-vault-suit-count"><strong>${p.collected}</strong>/${p.total}</span>
        <span class="ly-vault-suit-bar" aria-hidden="true"><i style="width:${w}%"></i></span>
      </li>`;
    })
    .join('');

  const journeyHtml = journey.empty
    ? `<p class="ly-vault-journey-empty">完成几次占问后，这里会显示最近 30 次里各宫的出现趋势。</p>`
    : `
      <p class="ly-vault-journey-meta">最近 ${journey.readingCount} 次占问</p>
      <div class="ly-vault-trends">
        ${journey.trends
          .map((t) => {
            const arrow = t.rising ? ' ↑' : '';
            return `
          <div class="ly-vault-trend${t.rising ? ' is-rising' : ''}">
            <p class="ly-vault-trend-head"><strong>${escapeHtml(t.label)}</strong>出现率${arrow}</p>
            <p class="ly-vault-trend-insight">说明你最近关注：${escapeHtml(t.insight)}</p>
          </div>`;
          })
          .join('')}
      </div>`;

  page.innerHTML = `
    <div class="ly-topbar">
      <button type="button" class="back-link" data-back>← 六爻首页</button>
    </div>
    <header class="ly-vault-head">
      <p class="ly-home-eyebrow">MYSTIC LAB · HEX CODEX</p>
      <h1 class="page-title">我的卦库</h1>
      <p class="ly-vault-lead">收集、回看、看见自己与某一卦的反复相遇。</p>
    </header>

    <section class="ly-vault-panel">
      <h2 class="ly-vault-panel-title">已收集概览</h2>
      <p class="ly-vault-progress-meta">已收集 <strong>${snap.collected}</strong> / ${snap.total} 卦 · ${pct}%</p>
      <div class="ly-vault-progress" aria-label="收集进度">
        <div class="ly-vault-progress-bar"><span style="width:${pct}%"></span></div>
      </div>
      <ul class="ly-vault-suits">${palaceRows}</ul>
      ${
        snap.topPalaceLabel
          ? `<p class="ly-vault-sub">最近遇见最多的是：<strong>${escapeHtml(snap.topPalaceLabel)}</strong></p>`
          : ''
      }
      ${
        snap.topThemeLabel
          ? `<p class="ly-vault-sub">你最近最常问的是：<strong>${escapeHtml(snap.topThemeLabel)}</strong></p>`
          : ''
      }
      <p class="ly-vault-meet-tip">${escapeHtml(meetLineFor(snap.mostMet))}${
        snap.mostMet
          ? ` 最近一次：${formatDate(snap.mostMet.lastAt)}${
              snap.mostMet.lastQuestion
                ? ` ·「${escapeHtml(snap.mostMet.lastQuestion.slice(0, 18))}${
                    snap.mostMet.lastQuestion.length > 18 ? '…' : ''
                  }」`
                : ''
            }`
          : ''
      }</p>
    </section>

    <section class="ly-vault-journey" aria-label="你的六爻旅程">
      <h3 class="ly-vault-journey-title">你的六爻旅程</h3>
      ${journeyHtml}
    </section>

    <section class="ly-vault-codex" aria-label="六十四卦">
      <div class="ly-vault-codex-bar">
        <div class="ly-vault-tabs" role="tablist">
          <button type="button" class="ly-vault-tab" data-f="met" role="tab">已遇</button>
          <button type="button" class="ly-vault-tab" data-f="all" role="tab">全部</button>
          <button type="button" class="ly-vault-tab" data-f="favorite" role="tab">收藏</button>
        </div>
        <div class="ly-vault-palace-chips" role="group" aria-label="八宫筛选" data-palace-chips hidden>
          <button type="button" class="ly-vault-palace-chip is-active" data-palace="all">全部宫</button>
          ${TRIGRAM_ORDER.map(
            (id) =>
              `<button type="button" class="ly-vault-palace-chip" data-palace="${id}">${id}宫·${TRIGRAMS[id].nature}</button>`,
          ).join('')}
        </div>
        <label class="ly-vault-search">
          <span class="visually-hidden">查找卦</span>
          <input type="search" data-vault-q placeholder="查找：复 / 地雷复 / 归来" autocomplete="off" />
        </label>
      </div>
      <p class="ly-vault-codex-meta" data-vault-meta></p>
      <div class="ly-hex-grid is-visual" data-vault-grid></div>
    </section>

    <p class="ly-vault-foot-link">
      <button type="button" class="ly-home-secondary" data-path="/liuyao/journal">查看每次起卦记录 ›</button>
    </p>
  `;

  const gridHost = page.querySelector<HTMLElement>('[data-vault-grid]')!;
  const metaEl = page.querySelector<HTMLElement>('[data-vault-meta]')!;
  const searchInput = page.querySelector<HTMLInputElement>('[data-vault-q]')!;

  function filtered(): Hexagram[] {
    const q = query.trim().toLowerCase();
    return HEXAGRAMS.filter((h) => {
      const met = (meetByName.get(h.name) ?? 0) > 0;
      if (filter === 'met' && !met) return false;
      if (filter === 'favorite' && !isHexFavorite(h.name)) return false;
      if (filter === 'all' && palace !== 'all') {
        const p = palaceOfHexagram(h.name);
        if (p !== palace) return false;
      }
      if (!q) return true;
      const hay = `${h.name}${h.fullName}${h.keywords.join('')}${h.gist}`.toLowerCase();
      return hay.includes(q);
    });
  }

  function paintGrid(): void {
    page.querySelectorAll<HTMLButtonElement>('.ly-vault-tab').forEach((btn) => {
      const on = btn.dataset.f === filter;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    const palaceHost = page.querySelector<HTMLElement>('[data-palace-chips]');
    if (palaceHost) {
      const showPalace = filter === 'all';
      palaceHost.hidden = !showPalace;
      if (!showPalace && palace !== 'all') {
        palace = 'all';
      }
      palaceHost.querySelectorAll<HTMLButtonElement>('[data-palace]').forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.palace === palace);
      });
    }

    const rows = filtered();
    const palaceLabel =
      filter === 'all' && palace !== 'all'
        ? ` · ${palace}宫·${TRIGRAMS[palace].nature}`
        : '';
    const baseMeta =
      filter === 'met'
        ? `已遇 ${rows.length} 卦`
        : filter === 'favorite'
          ? `收藏 ${rows.length} 卦`
          : `共 ${rows.length} 卦`;
    metaEl.textContent = `${baseMeta}${palaceLabel}`;

    if (rows.length === 0) {
      const empty =
        filter === 'favorite'
          ? '还没有收藏。点开一卦，右上角 ☆ 可收藏。'
          : filter === 'met'
            ? '还没有遇见的卦。去起一卦，图鉴会开始点亮。'
            : query || palace !== 'all'
              ? '没有匹配的卦，换个宫或关键词试试。'
              : '图鉴空空如也。';
      gridHost.innerHTML = `<div class="ly-vault-empty"><p>${escapeHtml(empty)}</p></div>`;
      return;
    }

    gridHost.innerHTML = rows
      .map((h) => {
        const lines = linesFromHexagram(h) as number[];
        const n = meetByName.get(h.name) ?? 0;
        const metClass = n > 0 ? ' is-met' : ' is-locked';
        const fav = isHexFavorite(h.name) ? ' is-fav' : '';
        return `
          <button type="button" class="ly-hex-card is-visual${metClass}${fav}" data-gua="${escapeHtml(h.name)}" aria-label="${escapeHtml(h.fullName)}">
            <div class="ly-hex-card-art">${artHtml(h)}</div>
            <div class="ly-hex-card-yao">${renderMiniYao(lines)}</div>
            <span class="ly-hex-card-glyph">${escapeHtml(h.fullName)}</span>
          </button>`;
      })
      .join('');

    gridHost.querySelectorAll<HTMLButtonElement>('[data-gua]').forEach((btn) => {
      btn.addEventListener('click', () => {
        navigate(`/liuyao/hexagrams?gua=${encodeURIComponent(btn.dataset.gua!)}`);
      });
    });
  }

  page.querySelector('[data-back]')?.addEventListener('click', () => navigate('/liuyao'));
  page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
    el.addEventListener('click', () => navigate(el.dataset.path!));
  });
  page.querySelectorAll<HTMLButtonElement>('.ly-vault-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      filter = (btn.dataset.f as VaultFilter) || 'all';
      paintGrid();
    });
  });
  page.querySelectorAll<HTMLButtonElement>('[data-palace]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.palace;
      palace = id === 'all' || !id ? 'all' : (id as TrigramId);
      paintGrid();
    });
  });
  searchInput.addEventListener('input', () => {
    query = searchInput.value;
    paintGrid();
  });

  paintGrid();
  root.appendChild(page);
  return () => {};
}
