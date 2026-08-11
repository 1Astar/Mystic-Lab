/**
 * 八字知识树 · 等级页
 * 升级路径置顶；称号旅程 / 成就墙分 Tab，默认折叠
 */
import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { baziSysTabsHtml } from '../ui/lab-sys-tabs.ts';
import {
  buildLearnAchievements,
  countUnlockedAchievements,
} from '../bazi/learn-achievements.ts';
import { buildLearnTreeView, learnTreeProgressPct } from '../bazi/learn-tree.ts';

type ShowcaseTab = 'titles' | 'achievements' | null;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderBaziLearn(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page life-page bazi-learn-page';
  mountEnvBanner(page);

  const view = buildLearnTreeView();
  const pct = learnTreeProgressPct(view.state);
  const collected = view.knowledgeRows.filter((r) => r.collected).length;
  const achievements = buildLearnAchievements(view.state);
  const achCount = countUnlockedAchievements(view.state);
  let selectedAchId = achievements.find((a) => !a.unlocked)?.id ?? achievements[0]?.id ?? '';
  /** 默认折叠：不展开任一 Tab */
  let showcaseTab: ShowcaseTab = null;

  function selectedAch() {
    return achievements.find((a) => a.id === selectedAchId) ?? achievements[0]!;
  }

  function gatesHtml(): string {
    return `
      <section class="bazi-learn-gates" aria-label="升级路径">
        <p class="bazi-sense-kicker">升级路径</p>
        <p class="bazi-learn-gates-lead">先看怎么升；未完成项右侧可直接跳转去做。称号墙与成就墙在下方折叠里。</p>
        ${view.gates
          .map(
            (g) => `
          <article class="bazi-learn-gate${g.reached ? ' is-reached' : ''}${g.current ? ' is-current' : ''}">
            <header>
              <h3>${escapeHtml(g.label)}</h3>
              <em>${g.reached ? '已达成' : '未达成'}${g.current ? ' · 当前' : ''}</em>
            </header>
            <p class="bazi-learn-gate-blurb">${escapeHtml(g.blurb)}</p>
            <p class="bazi-learn-gate-howto"><strong>怎么升：</strong>${escapeHtml(g.howto)}</p>
            <ul>
              ${g.checks
                .map(
                  (c) => `
                <li class="${c.done ? 'is-done' : ''}">
                  <div class="bazi-learn-check-main">
                    <span class="bazi-learn-check-mark" aria-hidden="true">${c.done ? '✓' : '○'}</span>
                    <div class="bazi-learn-check-copy">
                      <strong>${escapeHtml(c.label)}</strong>
                      <em class="bazi-learn-check-detail">${escapeHtml(c.detail)}</em>
                      <p class="bazi-learn-check-howto">${escapeHtml(c.howto)}</p>
                    </div>
                  </div>
                  ${
                    c.action
                      ? `<button type="button" class="bazi-learn-check-go" data-path="${escapeHtml(c.action.path)}">${escapeHtml(c.action.label)}</button>`
                      : ''
                  }
                </li>`,
                )
                .join('')}
            </ul>
          </article>`,
          )
          .join('')}
      </section>`;
  }

  function titleJourneyBodyHtml(): string {
    return `
      <p class="bazi-learn-journey-lead">三张仪式卡：本命学习路上的印记。灰态可点「去做」。</p>
      <div class="bazi-learn-title-rail" role="list">
        ${view.gates
          .map((g, i) => {
            const seal = g.id === 'chugui' ? '窥' : g.id === 'zhiming' ? '命' : '演';
            const status = g.reached
              ? g.current
                ? '已达成 · 当前'
                : '已达成'
              : '未达成';
            const primary =
              g.checks.find((c) => !c.done && c.action)?.action ??
              g.checks[0]?.action ??
              { label: '去解读 ›', path: '/bazi/reading' };
            return `
            <article class="bazi-learn-title-card${g.reached ? ' is-reached' : ''}${g.current ? ' is-current' : ''}" role="listitem">
              <div class="bazi-learn-title-seal" aria-hidden="true"><span>${seal}</span></div>
              <p class="bazi-learn-title-step">第 ${i + 1} 阶</p>
              <h3>${escapeHtml(g.label)}</h3>
              <em class="bazi-learn-title-status">${escapeHtml(status)}</em>
              <p class="bazi-learn-title-blurb">${escapeHtml(g.blurb)}</p>
              <p class="bazi-learn-title-howto">${escapeHtml(g.howto)}</p>
              ${
                g.current
                  ? `<div class="bazi-learn-title-meter" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>`
                  : ''
              }
              <button type="button" class="bazi-learn-title-go" data-path="${escapeHtml(primary.path)}">${escapeHtml(primary.label)}</button>
            </article>`;
          })
          .join('')}
      </div>`;
  }

  function achievementWallBodyHtml(): string {
    const sel = selectedAch();
    return `
      <p class="bazi-learn-ach-lead">小徽章挂已有行为 · 已点亮 ${achCount.unlocked} / ${achCount.total}</p>
      <div class="bazi-learn-ach-grid" role="list">
        ${achievements
          .map(
            (a) => `
          <button type="button"
            class="bazi-learn-ach-badge${a.unlocked ? ' is-on' : ''}${a.id === selectedAchId ? ' is-selected' : ''}"
            data-ach-id="${escapeHtml(a.id)}"
            role="listitem"
            aria-pressed="${a.id === selectedAchId}"
            aria-label="${escapeHtml(a.label)}${a.unlocked ? ' · 已点亮' : ' · 未点亮'}">
            <span class="bazi-learn-ach-glyph" aria-hidden="true">${escapeHtml(a.glyph)}</span>
            <strong>${escapeHtml(a.label)}</strong>
            <em>${a.unlocked ? '已点亮' : '未点亮'}</em>
          </button>`,
          )
          .join('')}
      </div>
      <aside class="bazi-learn-ach-peek" data-ach-peek>
        <p class="bazi-learn-ach-peek-title">${escapeHtml(sel.label)}</p>
        <p class="bazi-learn-ach-peek-body">${escapeHtml(sel.unlocked ? sel.unlockedHint : sel.lockedHint)}</p>
        <button type="button" class="bazi-learn-check-go" data-path="${escapeHtml(sel.action.path)}">${escapeHtml(sel.action.label)}</button>
      </aside>`;
  }

  function showcaseHtml(): string {
    const openTitles = showcaseTab === 'titles';
    const openAch = showcaseTab === 'achievements';
    return `
      <section class="bazi-learn-showcase" aria-label="称号与成就">
        <p class="bazi-sense-kicker">称号与成就</p>
        <p class="bazi-learn-showcase-lead">点 Tab 展开；再点同一 Tab 可收起。默认折叠，先专心看上方升级路径。</p>
        <div class="bazi-learn-showcase-tabs" role="tablist" aria-label="称号或成就">
          <button type="button" role="tab" class="bazi-learn-showcase-tab${openTitles ? ' is-on' : ''}"
            data-showcase-tab="titles" aria-selected="${openTitles}" id="learn-tab-titles">
            称号旅程
          </button>
          <button type="button" role="tab" class="bazi-learn-showcase-tab${openAch ? ' is-on' : ''}"
            data-showcase-tab="achievements" aria-selected="${openAch}" id="learn-tab-ach">
            成就墙 · ${achCount.unlocked}/${achCount.total}
          </button>
        </div>
        <div class="bazi-learn-showcase-panel${openTitles ? ' is-open' : ''}"
          role="tabpanel" data-showcase-panel="titles" ${openTitles ? '' : 'hidden'}
          aria-labelledby="learn-tab-titles">
          ${titleJourneyBodyHtml()}
        </div>
        <div class="bazi-learn-showcase-panel${openAch ? ' is-open' : ''}"
          role="tabpanel" data-showcase-panel="achievements" ${openAch ? '' : 'hidden'}
          aria-labelledby="learn-tab-ach">
          ${achievementWallBodyHtml()}
        </div>
        ${
          showcaseTab == null
            ? `<p class="bazi-learn-showcase-folded">已折叠。点上方「称号旅程」或「成就墙」展开。</p>`
            : ''
        }
      </section>`;
  }

  function bindPaths(scope: ParentNode = page): void {
    scope.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
  }

  function bindAchBadges(): void {
    page.querySelectorAll<HTMLButtonElement>('[data-ach-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedAchId = btn.dataset.achId || selectedAchId;
        const peek = page.querySelector('[data-ach-peek]');
        const sel = selectedAch();
        if (peek) {
          peek.innerHTML = `
            <p class="bazi-learn-ach-peek-title">${escapeHtml(sel.label)}</p>
            <p class="bazi-learn-ach-peek-body">${escapeHtml(sel.unlocked ? sel.unlockedHint : sel.lockedHint)}</p>
            <button type="button" class="bazi-learn-check-go" data-path="${escapeHtml(sel.action.path)}">${escapeHtml(sel.action.label)}</button>`;
          bindPaths(peek);
        }
        page.querySelectorAll<HTMLButtonElement>('[data-ach-id]').forEach((b) => {
          const on = b.dataset.achId === selectedAchId;
          b.classList.toggle('is-selected', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
    });
  }

  function paint(): void {
    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/bazi/reading">← 命盘解读</button>
      ${baziSysTabsHtml('reading')}
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <p class="home-eyebrow">LEARNING TREE</p>
        <h1 class="page-title">等级与成就</h1>
        <p class="page-subtitle">先看升级路径 · 称号 / 成就可折叠</p>
      </header>

      <section class="bazi-learn-hero" aria-label="当前称号">
        <p class="bazi-sense-kicker">当前称号</p>
        <h2 class="bazi-learn-title">${escapeHtml(view.title.label)}</h2>
        <p class="bazi-learn-blurb">${escapeHtml(view.title.blurb)}</p>
        <div class="bazi-learn-meter" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <span style="width:${pct}%"></span>
        </div>
        <p class="bazi-learn-stats">
          XP ${view.state.xp} · 知识点 ${collected} · 猜对 ${view.state.guessWins} · 互动 ${view.state.interactionIds.length} · 成就 ${achCount.unlocked}/${achCount.total}
        </p>
        <p class="bazi-learn-next">${escapeHtml(view.nextHint)}</p>
      </section>

      ${gatesHtml()}
      ${showcaseHtml()}

      <section class="bazi-learn-knowledge" aria-label="知识点">
        <p class="bazi-sense-kicker">知识点库</p>
        <p class="bazi-learn-know-lead">怎么收集：命盘解读 → 段落下【为什么这么解？】→【收入知识库】。点亮一格算 1 个知识点。</p>
        <button type="button" class="life-btn-ghost bazi-learn-inline-go" data-path="/bazi/reading">去解读收集 ›</button>
        <ul class="bazi-learn-know-list">
          ${view.knowledgeRows
            .map(
              (r) => `
            <li class="${r.collected ? 'is-on' : ''}">
              <span>${r.collected ? '●' : '○'}</span>
              ${escapeHtml(r.label)}
            </li>`,
            )
            .join('')}
        </ul>
      </section>

      <div class="bazi-reading-actions">
        <button type="button" class="life-btn-primary" data-path="/bazi/reading">去解读 ›</button>
        <button type="button" class="life-btn-ghost" data-path="/bazi/guess">猜命盘 ›</button>
        <button type="button" class="life-btn-ghost" data-path="/bazi/week">脑内天气 ›</button>
        <button type="button" class="life-btn-ghost" data-path="/bazi">命盘时光机 ›</button>
      </div>
    `;

    bindPaths();
    bindAchBadges();

    page.querySelectorAll<HTMLButtonElement>('[data-showcase-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.showcaseTab === 'achievements' ? 'achievements' : 'titles';
        showcaseTab = showcaseTab === next ? null : next;
        paint();
      });
    });
  }

  paint();
  root.appendChild(page);
  return () => {
    stars.remove();
  };
}
