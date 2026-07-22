import { navigate } from '../router.ts';
import {
  buildVaultOverview,
  getLiuyaoJourneyInsights,
} from '../liuyao/journey.ts';
import { meetLineFor } from '../liuyao/vault.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { liuyaoPageBgStyle } from '../ui/liuyao-hero.ts';

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

/** 我的卦库总馆：收集概览 · 六爻旅程 · 图鉴入口 */
export function renderLiuyaoVault(root: HTMLElement): () => void {
  const snap = buildVaultOverview();
  const journey = getLiuyaoJourneyInsights(30);
  const page = document.createElement('div');
  page.className = 'page ly-vault-page';
  page.setAttribute('style', liuyaoPageBgStyle('learn'));
  mountEnvBanner(page);

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
    ? `<p class="ly-guide-tip">完成几次占问并保存后，这里会显示最近各宫出现趋势。</p>`
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

    <section class="ly-vault-panel">
      <h2 class="ly-vault-panel-title">你的六爻旅程</h2>
      ${journeyHtml}
    </section>

    <nav class="ly-vault-grid" aria-label="卦库分区">
      <button type="button" class="ly-vault-card" data-path="/liuyao/hexagrams">
        <span class="ly-vault-card-kicker">收集</span>
        <strong>64卦图鉴</strong>
        <p>点进单卦看 HEX CARD；右侧笔记含「我的相遇」。</p>
      </button>
      <button type="button" class="ly-vault-card" data-path="/liuyao/growth">
        <span class="ly-vault-card-kicker">回看</span>
        <strong>成长档案</strong>
        <p>相遇排行与时间线，半年后再遇同一卦更有沉浸感。</p>
      </button>
      <button type="button" class="ly-vault-card" data-path="/liuyao/concepts">
        <span class="ly-vault-card-kicker">进阶</span>
        <strong>核心概念</strong>
        <p>世应 · 六亲 · 动变 · 互错综。</p>
      </button>
    </nav>
    <p class="ly-vault-foot-link">
      <button type="button" class="ly-home-secondary" data-path="/liuyao/journal">查看每次起卦记录 ›</button>
    </p>
  `;

  page.querySelector('[data-back]')?.addEventListener('click', () => navigate('/liuyao'));
  page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
    el.addEventListener('click', () => navigate(el.dataset.path!));
  });

  root.appendChild(page);
  return () => {};
}
