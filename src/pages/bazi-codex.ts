import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import {
  baziCodexProgress,
  isBaziCodexUnlocked,
  listBaziCodexEntries,
  listMetCodexTags,
  wuxingUnlockHint,
} from '../bazi/codex.ts';
import {
  ALL_STEM_BRANCH,
  BRANCH_LORE,
  STEM_LORE,
  WUXING_LORE,
  WUXING_ORDER,
  branchesOfWuxing,
  stemsOfWuxing,
  type StemBranchLore,
} from '../bazi/codex-lore.ts';
import {
  artFrameHtml,
  stemBranchArtSvg,
  wuxingArtSvg,
} from '../bazi/codex-art.ts';
import {
  SHENSHA_CARDS,
  TENGOD_CARDS,
  getStarCard,
  shenshaCardId,
  staticTagsForBranch,
  staticTagsForStem,
  tengodCardId,
  type CodexTag,
  type StarCardLore,
} from '../bazi/codex-tags.ts';
import { getShenshaVisual } from '../bazi/codex-shensha-visual.ts';
import { wuxingClass, type WuXing } from '../bazi/elements.ts';
import { SYSTEM_POSITION } from '../lab/system-positioning.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type Tab = 'wuxing' | 'ganzhi' | 'star';

export function renderBaziCodex(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page life-page bazi-codex-page';
  mountEnvBanner(page);
  root.appendChild(page);

  let tab: Tab = 'wuxing';
  let detailId: string | null = null;
  const entries = () => new Map(listBaziCodexEntries().map((e) => [e.id, e]));

  function paint(): void {
    const map = entries();
    const all = baziCodexProgress();
    const wxP = baziCodexProgress('wuxing');
    const gzP = baziCodexProgress('stem-branch');
    const starP = baziCodexProgress('star');

    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回八字</button>
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <h1 class="page-title">五行图鉴</h1>
        <p class="page-subtitle">${SYSTEM_POSITION.bazi} · 已点亮 ${all.collected}/${all.total}</p>
      </header>

      <div class="bazi-codex-tabs" role="tablist">
        <button type="button" class="bazi-codex-tab ${tab === 'wuxing' ? 'is-on' : ''}" data-tab="wuxing">
          五行能量 <em>${wxP.collected}/${wxP.total}</em>
        </button>
        <button type="button" class="bazi-codex-tab ${tab === 'ganzhi' ? 'is-on' : ''}" data-tab="ganzhi">
          天干地支 <em>${gzP.collected}/${gzP.total}</em>
        </button>
        <button type="button" class="bazi-codex-tab ${tab === 'star' ? 'is-on' : ''}" data-tab="star">
          星煞图谱 <em>${starP.collected}/${starP.total}</em>
        </button>
      </div>

      ${
        tab === 'wuxing'
          ? renderWuxingGrid(map)
          : tab === 'ganzhi'
            ? renderGanzhiGrid()
            : renderStarAtlas()
      }
      ${detailId ? renderDetail(detailId, map) : ''}
    `;

    page.querySelector('.life-back')?.addEventListener('click', () => navigate('/bazi'));
    page.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.tab;
        tab = next === 'ganzhi' ? 'ganzhi' : next === 'star' ? 'star' : 'wuxing';
        detailId = null;
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-codex-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.codexId ?? '';
        detailId = detailId === id ? null : id;
        paint();
      });
    });
    page.querySelector('[data-codex-close]')?.addEventListener('click', () => {
      detailId = null;
      paint();
    });
    page.querySelectorAll<HTMLButtonElement>('[data-jump-gz]').forEach((btn) => {
      btn.addEventListener('click', () => {
        tab = 'ganzhi';
        detailId = btn.dataset.jumpGz ?? null;
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-open-star]').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const id = btn.dataset.openStar ?? '';
        if (!id) return;
        tab = 'star';
        detailId = id;
        paint();
      });
    });
  }

  paint();
  return () => stars.remove();
}

function renderWuxingGrid(map: Map<string, { reason?: string }>): string {
  return `
    <p class="bazi-codex-hint">偏旺 / 偏弱 / 缺 时点亮 · 卡面隐约藏着下属天干</p>
    <div class="bazi-wx-grid bazi-art-grid">
      ${WUXING_ORDER.map((wx) => {
        const lore = WUXING_LORE[wx];
        const lit = isBaziCodexUnlocked(wx);
        const reason = map.get(wx)?.reason;
        return artFrameHtml({
          lit,
          svg: wuxingArtSvg(wx),
          title: escapeHtml(lore.title),
          sub: escapeHtml(lore.epithet),
          badge: lit ? escapeHtml(reason ?? '已点亮') : '未点亮',
          extraClass: `bazi-art-wx-card ${wuxingClass(wx)}`,
          dataId: wx,
        });
      }).join('')}
    </div>`;
}

function renderGanzhiGrid(): string {
  const stemHtml = STEM_LORE.map((s) =>
    artFrameHtml({
      lit: isBaziCodexUnlocked(s.id),
      svg: stemBranchArtSvg(s),
      title: escapeHtml(s.title),
      sub: escapeHtml(s.epithet),
      badge: isBaziCodexUnlocked(s.id) ? undefined : '未点亮',
      extraClass: `bazi-art-gz-card ${wuxingClass(s.wuxing)}`,
      dataId: s.id,
    }),
  ).join('');
  const branchHtml = BRANCH_LORE.map((b) =>
    artFrameHtml({
      lit: isBaziCodexUnlocked(b.id),
      svg: stemBranchArtSvg(b),
      title: escapeHtml(b.title),
      sub: escapeHtml(b.epithet),
      badge: isBaziCodexUnlocked(b.id) ? undefined : '未点亮',
      extraClass: `bazi-art-gz-card ${wuxingClass(b.wuxing)}`,
      dataId: b.id,
    }),
  ).join('');
  return `
    <p class="bazi-codex-hint">抽象流线意象 · 点亮后高亮微光 · 神煞在「星煞图谱」</p>
    <section class="bazi-gz-section">
      <h2 class="bazi-codex-section-title">天干 · 天空的力量</h2>
      <div class="bazi-gz-grid bazi-art-grid">${stemHtml}</div>
    </section>
    <section class="bazi-gz-section">
      <h2 class="bazi-codex-section-title">地支 · 大地的实体</h2>
      <div class="bazi-gz-grid bazi-art-grid">${branchHtml}</div>
    </section>`;
}

function renderStarAtlas(): string {
  const auspicious = SHENSHA_CARDS.filter((c) => c.zone === 'auspicious');
  const mixed = SHENSHA_CARDS.filter((c) => c.zone === 'mixed');
  return `
    <p class="bazi-codex-hint">排盘遇见后点亮独立卡片 · 点开看三层释义</p>
    <section class="bazi-gz-section">
      <h2 class="bazi-codex-section-title">吉星区</h2>
      <div class="bazi-star-grid">${auspicious.map(starCardHtml).join('')}</div>
    </section>
    <section class="bazi-gz-section">
      <h2 class="bazi-codex-section-title">凶星 / 中性星区</h2>
      <div class="bazi-star-grid">${mixed.map(starCardHtml).join('')}</div>
    </section>
    <section class="bazi-gz-section">
      <h2 class="bazi-codex-section-title">传统十神</h2>
      <div class="bazi-star-grid">${TENGOD_CARDS.map(starCardHtml).join('')}</div>
    </section>`;
}

function starCardHtml(card: StarCardLore): string {
  const lit = isBaziCodexUnlocked(card.id);
  const visual = card.kind === 'shensha' ? getShenshaVisual(card.name) : undefined;
  if (visual) {
    return `
    <button type="button" class="bazi-ss-card is-visual ${visual.light === 'warm' ? 'is-warm' : 'is-cold'} ${lit ? 'is-lit' : 'is-dim'}" data-codex-id="${escapeHtml(card.id)}">
      <div class="bazi-ss-card-art" aria-hidden="true">
        <img src="${escapeHtml(visual.src)}" alt="" loading="lazy" />
      </div>
      <div class="bazi-ss-card-veil">
        <strong>${escapeHtml(card.modern)}</strong>
        <em>${escapeHtml(card.name)}</em>
        ${lit ? '<span class="bazi-wx-badge">已收集</span>' : '<span class="bazi-wx-badge is-lock">未收集</span>'}
      </div>
    </button>`;
  }
  return `
    <button type="button" class="bazi-star-card ${card.kind === 'shensha' ? 'is-shensha' : 'is-tengod'} ${lit ? 'is-lit' : 'is-dim'}" data-codex-id="${escapeHtml(card.id)}">
      <span class="bazi-star-glyph" aria-hidden="true">${escapeHtml(card.glyph)}</span>
      <strong>${escapeHtml(card.modern)}</strong>
      <em>${escapeHtml(card.name)}</em>
      ${lit ? '<span class="bazi-wx-badge">已收集</span>' : '<span class="bazi-wx-badge is-lock">未收集</span>'}
    </button>`;
}

function renderDetail(id: string, map: Map<string, { reason?: string }>): string {
  if (WUXING_ORDER.includes(id as WuXing)) {
    return renderWuxingDetail(id as WuXing, map.get(id)?.reason);
  }
  const star = getStarCard(id);
  if (star) return renderStarDetail(star);
  const item = ALL_STEM_BRANCH.find((x) => x.id === id);
  if (!item) return '';
  return renderGanzhiDetail(item);
}

function renderWuxingDetail(wx: WuXing, reason?: string): string {
  const lore = WUXING_LORE[wx];
  const lit = isBaziCodexUnlocked(wx);
  const kids = [...stemsOfWuxing(wx), ...branchesOfWuxing(wx)];
  const kidsHtml = kids
    .map((k) => {
      const on = isBaziCodexUnlocked(k.id);
      return `<button type="button" class="bazi-wx-child ${on ? 'is-lit' : ''}" data-jump-gz="${k.id}">${escapeHtml(k.title)}${on ? '' : ' · 未亮'}</button>`;
    })
    .join('');

  return `
    <div class="bazi-codex-sheet" role="dialog" aria-modal="true">
      <div class="bazi-codex-panel ${wuxingClass(wx)}">
        <button type="button" class="bazi-codex-close" data-codex-close>关闭</button>
        <div class="bazi-detail-art ${lit ? 'is-lit' : 'is-dim'}">${wuxingArtSvg(wx)}${lit ? '' : '<span class="bazi-art-seal"></span>'}</div>
        <p class="bazi-codex-kicker">${escapeHtml(lore.epithet)}</p>
        <h2>${escapeHtml(lore.title)}</h2>
        ${
          lit
            ? `<p class="bazi-codex-reason">${escapeHtml(wuxingUnlockHint(wx, reason))}</p>
               <p>${escapeHtml(lore.portrait)}</p>
               <p>${escapeHtml(lore.meaning)}</p>
               <p class="bazi-codex-muted">${escapeHtml(lore.bodyHint)}</p>
               <section class="bazi-codex-remedy">
                 <h3>你的补${escapeHtml(wx)}方案</h3>
                 <ul>
                   <li><strong>颜色</strong> · ${escapeHtml(lore.remedy.color)}</li>
                   <li><strong>方位</strong> · ${escapeHtml(lore.remedy.direction)}</li>
                   <li><strong>饮食</strong> · ${escapeHtml(lore.remedy.food)}</li>
                   <li><strong>情绪</strong> · ${escapeHtml(lore.remedy.mood)}</li>
                 </ul>
               </section>
               <section class="bazi-codex-children">
                 <h3>下属天干地支</h3>
                 <div class="bazi-wx-child-row">${kidsHtml}</div>
               </section>`
            : `<p class="bazi-codex-locked">尚未点亮。排盘出现偏旺、偏弱或缺口时，对应五行会解锁。</p>`
        }
      </div>
    </div>`;
}

function renderTagChips(tags: CodexTag[], locked: boolean): string {
  if (!tags.length) return '';
  const shensha = tags.filter((t) => t.kind === 'shensha');
  const tengods = tags.filter((t) => t.kind === 'tengod');
  const block = (title: string, list: CodexTag[]) => {
    if (!list.length) return '';
    return `
      <section class="bazi-codex-tags">
        <h3>${escapeHtml(title)}</h3>
        <div class="bazi-tag-row">
          ${list
            .map((t) => {
              const openId =
                t.kind === 'shensha' ? shenshaCardId(t.name) : tengodCardId(t.name);
              const cls = [
                'bazi-tag-chip',
                t.kind === 'shensha' ? 'is-shensha' : 'is-tengod',
                t.met ? 'is-met' : '',
                locked ? 'is-teaser' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return `<button type="button" class="${cls}" data-open-star="${escapeHtml(openId)}" ${locked ? 'disabled' : ''}>
                <strong>${escapeHtml(t.modern)}</strong>
                <em>${escapeHtml(t.name)}</em>
                ${t.met ? '<span class="bazi-tag-met">盘中</span>' : ''}
              </button>`;
            })
            .join('')}
        </div>
      </section>`;
  };
  return `${block('常见神煞搭配', shensha)}${block('传统十神', tengods)}`;
}

function renderGanzhiDetail(item: StemBranchLore): string {
  const lit = isBaziCodexUnlocked(item.id);
  const parent = WUXING_LORE[item.wuxing];
  const met = listMetCodexTags();
  const tags =
    item.kind === 'stem'
      ? staticTagsForStem(item.id, met)
      : staticTagsForBranch(item.id, met);
  return `
    <div class="bazi-codex-sheet" role="dialog" aria-modal="true">
      <div class="bazi-codex-panel ${wuxingClass(item.wuxing)}">
        <button type="button" class="bazi-codex-close" data-codex-close>关闭</button>
        <div class="bazi-detail-art ${lit ? 'is-lit' : 'is-dim'}">${stemBranchArtSvg(item)}${lit ? '' : '<span class="bazi-art-seal"></span>'}</div>
        <p class="bazi-codex-kicker">${item.kind === 'stem' ? '天干' : '地支'} · ${escapeHtml(parent.title)}</p>
        <h2>${escapeHtml(item.title)}</h2>
        <p class="bazi-codex-epithet">${escapeHtml(item.epithet)}</p>
        ${
          lit
            ? `<p>${escapeHtml(item.portrait)}</p>
               ${renderTagChips(tags, false)}`
            : `<p class="bazi-codex-locked">尚未点亮。在命盘四柱中遇见「${escapeHtml(item.id)}」后解锁。</p>
               ${renderTagChips(tags.slice(0, 4), true)}`
        }
      </div>
    </div>`;
}

function renderStarDetail(card: StarCardLore): string {
  const lit = isBaziCodexUnlocked(card.id);
  const zoneLabel =
    card.zone === 'auspicious' ? '吉星' : card.zone === 'mixed' ? '凶星 / 中性' : '十神';
  const visual = card.kind === 'shensha' ? getShenshaVisual(card.name) : undefined;
  const art = visual
    ? `<div class="bazi-ss-detail-art ${visual.light === 'warm' ? 'is-warm' : 'is-cold'} ${lit ? 'is-lit' : 'is-dim'}">
         <img src="${escapeHtml(visual.src)}" alt="${escapeHtml(card.name)}" />
         ${lit ? '' : '<span class="bazi-art-seal"></span>'}
       </div>`
    : `<div class="bazi-star-detail-head">
         <span class="bazi-star-detail-glyph" aria-hidden="true">${escapeHtml(card.glyph)}</span>
         <div>
           <h2>${escapeHtml(card.modern)}</h2>
           <p class="bazi-tag-classic">传统名 · ${escapeHtml(card.name)}</p>
         </div>
       </div>`;

  const museum = visual
    ? `<p class="bazi-ss-museum">
         <span>意象提取：${escapeHtml(visual.motif)}</span>
         <span>字面意：${escapeHtml(visual.literal)}</span>
       </p>`
    : '';

  return `
    <div class="bazi-codex-sheet" role="dialog" aria-modal="true">
      <div class="bazi-codex-panel bazi-star-detail ${card.kind === 'shensha' ? 'is-shensha' : 'is-tengod'} ${visual ? (visual.light === 'warm' ? 'is-warm' : 'is-cold') : ''}">
        <button type="button" class="bazi-codex-close" data-codex-close>关闭</button>
        <p class="bazi-codex-kicker">${zoneLabel}</p>
        ${art}
        ${visual ? `<h2>${escapeHtml(card.modern)}</h2><p class="bazi-tag-classic">传统名 · ${escapeHtml(card.name)}</p>` : ''}
        ${
          lit
            ? `<section class="bazi-tag-layer">
                 <h3>第一印象</h3>
                 <p>${escapeHtml(card.impression)}</p>
               </section>
               <section class="bazi-tag-layer">
                 <h3>它长什么样？藏在哪？</h3>
                 <p>${escapeHtml(card.where)}</p>
               </section>
               <section class="bazi-tag-layer is-trap">
                 <h3>拿到这张卡，千万要小心</h3>
                 <p>${escapeHtml(card.trap)}</p>
               </section>
               ${museum}`
            : `<p class="bazi-codex-locked">尚未收集。在命盘中遇见「${escapeHtml(card.name)}」后点亮这张独立卡片。</p>
               <p class="bazi-codex-muted">点亮后可查看三层释义：印象、位置、副作用。</p>
               ${museum}`
        }
      </div>
    </div>`;
}
