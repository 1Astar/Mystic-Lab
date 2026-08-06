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
  tengodArtSvg,
  wuxingArtSvg,
} from '../bazi/codex-art.ts';
import { memoryCoverHtml, getCodexCoverSrc } from '../bazi/codex-cover.ts';
import { renderRelationsAtlasHtml } from '../bazi/codex-relations-atlas.ts';
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
import { renderWuxingShengKeMapHtml } from '../bazi/codex-wuxing-map.ts';
import { getBaziEncyclopedia } from '../bazi/codex-encyclopedia.ts';
import { wuxingClass, type WuXing } from '../bazi/elements.ts';
import { SYSTEM_POSITION } from '../lab/system-positioning.ts';
import {
  bindBaziCodexDetail,
  renderBaziCodexDetailHtml,
} from '../ui/bazi-codex-detail.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type Tab = 'wuxing' | 'stem' | 'branch' | 'tengod' | 'shensha' | 'relation';

const TAB_ORDER: Tab[] = ['wuxing', 'stem', 'branch', 'tengod', 'shensha', 'relation'];

function parseTab(raw: string | undefined): Tab {
  if (raw && (TAB_ORDER as string[]).includes(raw)) return raw as Tab;
  return 'wuxing';
}

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

  function openEntry(id: string): void {
    if (!id) return;
    const enc = getBaziEncyclopedia(id);
    if (enc) {
      if (enc.kind === 'wuxing') tab = 'wuxing';
      else if (enc.kind === 'stem') tab = 'stem';
      else if (enc.kind === 'branch') tab = 'branch';
      else if (enc.kind === 'tengod') tab = 'tengod';
      else if (enc.kind === 'shensha') tab = 'shensha';
    } else if (WUXING_ORDER.includes(id as WuXing)) {
      tab = 'wuxing';
    } else if (STEM_LORE.some((s) => s.id === id)) {
      tab = 'stem';
    } else if (BRANCH_LORE.some((b) => b.id === id)) {
      tab = 'branch';
    } else if (id.startsWith('tg:')) {
      tab = 'tengod';
    } else if (id.startsWith('ss:')) {
      tab = 'shensha';
    }
    detailId = id;
    paint();
  }

  function paint(): void {
    const map = entries();
    const all = baziCodexProgress();
    const wxP = baziCodexProgress('wuxing');
    const stemP = baziCodexProgress('stem');
    const branchP = baziCodexProgress('branch');
    const tgP = baziCodexProgress('tengod');
    const ssP = baziCodexProgress('shensha');

    const tabBtn = (id: Tab, label: string, p?: { collected: number; total: number }) => `
      <button type="button" class="bazi-codex-tab ${tab === id ? 'is-on' : ''}" data-tab="${id}">
        ${label}${p ? ` <em>${p.collected}/${p.total}</em>` : ''}
      </button>`;

    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回八字</button>
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <h1 class="page-title">八字图鉴</h1>
        <p class="page-subtitle">${SYSTEM_POSITION.bazi} · 已点亮 ${all.collected}/${all.total}</p>
      </header>

      <div class="bazi-codex-tabs" role="tablist">
        ${tabBtn('wuxing', '五行关系', wxP)}
        ${tabBtn('stem', '十天干', stemP)}
        ${tabBtn('branch', '十二地支', branchP)}
        ${tabBtn('tengod', '十神', tgP)}
        ${tabBtn('shensha', '星煞', ssP)}
        ${tabBtn('relation', '生克图')}
      </div>

      ${
        tab === 'wuxing'
          ? renderWuxingTab(map)
          : tab === 'stem'
            ? renderStemGrid()
            : tab === 'branch'
              ? renderBranchGrid()
              : tab === 'tengod'
                ? renderTengodGrid()
                : tab === 'shensha'
                  ? renderShenshaAtlas()
                  : renderRelationsAtlasHtml()
      }
      ${detailId ? renderDetail(detailId, map) : ''}
    `;

    page.querySelector('.life-back')?.addEventListener('click', () => navigate('/bazi'));
    page.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        tab = parseTab(btn.dataset.tab);
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
    // SVG 生克图节点（circle 上的 data-codex-id）
    page.querySelectorAll<SVGCircleElement>('.bazi-sk-hit[data-codex-id]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-codex-id') ?? '';
        detailId = detailId === id ? null : id;
        paint();
      });
    });
    page.querySelector('[data-codex-close]')?.addEventListener('click', () => {
      detailId = null;
      paint();
    });
    page.querySelectorAll<HTMLButtonElement>('[data-open-star]').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openEntry(btn.dataset.openStar ?? '');
      });
    });
    page.querySelectorAll<HTMLElement>('[data-open-entry]').forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openEntry(el.dataset.openEntry ?? el.getAttribute('data-open-entry') ?? '');
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-jump-gz]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openEntry(btn.dataset.jumpGz ?? '');
      });
    });

    if (detailId) {
      bindBaziCodexDetail(page);
    }
  }

  paint();
  return () => stars.remove();
}

function renderWuxingTab(map: Map<string, { reason?: string }>): string {
  return `
    ${renderWuxingShengKeMapHtml()}
    <p class="bazi-codex-hint">偏旺 / 偏弱 / 缺 时点亮主卡</p>
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

function renderStemGrid(): string {
  return `
    <p class="bazi-codex-hint">元素气质之象 · 四柱遇见后点亮</p>
    <div class="bazi-gz-grid bazi-art-grid">
      ${STEM_LORE.map((s) =>
        artFrameHtml({
          lit: isBaziCodexUnlocked(s.id),
          svg: memoryCoverHtml(s.id, stemBranchArtSvg(s)),
          title: escapeHtml(s.title),
          sub: escapeHtml(s.epithet),
          badge: isBaziCodexUnlocked(s.id) ? undefined : '未点亮',
          extraClass: `bazi-art-gz-card ${wuxingClass(s.wuxing)}`,
          dataId: s.id,
        }),
      ).join('')}
    </div>`;
}

function renderBranchGrid(): string {
  return `
    <p class="bazi-codex-hint">时序与藏气之象 · 四柱遇见后点亮</p>
    <div class="bazi-gz-grid bazi-art-grid">
      ${BRANCH_LORE.map((b) =>
        artFrameHtml({
          lit: isBaziCodexUnlocked(b.id),
          svg: memoryCoverHtml(b.id, stemBranchArtSvg(b)),
          title: escapeHtml(b.title),
          sub: escapeHtml(b.epithet),
          badge: isBaziCodexUnlocked(b.id) ? undefined : '未点亮',
          extraClass: `bazi-art-gz-card ${wuxingClass(b.wuxing)}`,
          dataId: b.id,
        }),
      ).join('')}
    </div>`;
}

function renderTengodGrid(): string {
  return `
    <p class="bazi-codex-hint">人生角色之象 · 排盘遇见后点亮</p>
    <div class="bazi-gz-grid bazi-art-grid">
      ${TENGOD_CARDS.map((c) =>
        artFrameHtml({
          lit: isBaziCodexUnlocked(c.id),
          svg: memoryCoverHtml(c.id, tengodArtSvg(c.name)),
          title: escapeHtml(c.name),
          sub: escapeHtml(c.modern),
          badge: isBaziCodexUnlocked(c.id) ? undefined : '未点亮',
          extraClass: 'bazi-art-tg-card',
          dataId: c.id,
        }),
      ).join('')}
    </div>`;
}

function renderShenshaAtlas(): string {
  const auspicious = SHENSHA_CARDS.filter((c) => c.zone === 'auspicious');
  const mixed = SHENSHA_CARDS.filter((c) => c.zone === 'mixed');
  return `
    <p class="bazi-codex-hint">排盘神煞遇见后点亮独立卡</p>
    <section class="bazi-gz-section">
      <h2 class="bazi-codex-section-title">吉星区</h2>
      <div class="bazi-star-grid">${auspicious.map(starCardHtml).join('')}</div>
    </section>
    <section class="bazi-gz-section">
      <h2 class="bazi-codex-section-title">凶星 / 中性星区</h2>
      <div class="bazi-star-grid">${mixed.map(starCardHtml).join('')}</div>
    </section>`;
}

function starCardHtml(card: StarCardLore): string {
  const lit = isBaziCodexUnlocked(card.id);
  const visual = card.kind === 'shensha' ? getShenshaVisual(card.name) : undefined;
  /** 接入只用 webp 封面，不用旧 png */
  const imgSrc = getCodexCoverSrc(card.id);
  if (imgSrc) {
    const warm =
      visual?.light === 'warm' ||
      (!visual && card.zone === 'auspicious');
    return `
    <button type="button" class="bazi-ss-card is-visual ${warm ? 'is-warm' : 'is-cold'} ${lit ? 'is-lit' : 'is-dim'}" data-codex-id="${escapeHtml(card.id)}">
      <div class="bazi-ss-card-art" aria-hidden="true">
        <img src="${escapeHtml(imgSrc)}" alt="" loading="lazy" />
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

function detailArt(id: string): string {
  if (WUXING_ORDER.includes(id as WuXing)) {
    return memoryCoverHtml(id, wuxingArtSvg(id as WuXing, { uid: `det-wx-${id}` }));
  }
  const gz = [...STEM_LORE, ...BRANCH_LORE].find((x) => x.id === id);
  if (gz) {
    return memoryCoverHtml(id, stemBranchArtSvg(gz, { uid: `det-gz-${id}` }));
  }
  const star = getStarCard(id);
  if (star) {
    if (star.kind === 'tengod') {
      return memoryCoverHtml(
        id,
        tengodArtSvg(star.name, { uid: `det-tg-${star.name}` }),
      );
    }
    const cover = memoryCoverHtml(id, '');
    if (cover) return cover;
    return `<span class="bazi-star-detail-glyph bazi-enc-glyph">${escapeHtml(star.glyph)}</span>`;
  }
  return '';
}

function unlockHintFor(id: string, reason?: string): string {
  if (WUXING_ORDER.includes(id as WuXing)) {
    return wuxingUnlockHint(id as WuXing, reason);
  }
  const star = getStarCard(id);
  if (star) return `尚未收集。在命盘中遇见「${star.name}」后点亮。`;
  const gz = [...STEM_LORE, ...BRANCH_LORE].find((x) => x.id === id);
  if (gz) return `尚未点亮。在命盘四柱中遇见「${gz.id}」后解锁。`;
  return '尚未点亮。';
}

function memoryExtra(id: string, lit: boolean): string {
  if (WUXING_ORDER.includes(id as WuXing) && lit) {
    const wx = id as WuXing;
    const lore = WUXING_LORE[wx];
    const kids = [...stemsOfWuxing(wx), ...branchesOfWuxing(wx)];
    const kidsHtml = kids
      .map((k) => {
        const on = isBaziCodexUnlocked(k.id);
        return `<button type="button" class="bazi-wx-child ${on ? 'is-lit' : ''}" data-jump-gz="${k.id}">${escapeHtml(k.title)}${on ? '' : ' · 未亮'}</button>`;
      })
      .join('');
    return `
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
      </section>`;
  }
  const item = [...STEM_LORE, ...BRANCH_LORE].find((x) => x.id === id) as
    | StemBranchLore
    | undefined;
  if (item) {
    const met = listMetCodexTags();
    const tags =
      item.kind === 'stem'
        ? staticTagsForStem(item.id, met)
        : staticTagsForBranch(item.id, met);
    return renderTagChips(tags, !lit);
  }
  const star = getStarCard(id);
  if (star?.kind === 'shensha') {
    const visual = getShenshaVisual(star.name);
    if (visual) {
      return `<p class="bazi-ss-museum">
        <span>意象提取：${escapeHtml(visual.motif)}</span>
        <span>字面意：${escapeHtml(visual.literal)}</span>
      </p>`;
    }
  }
  return '';
}

function renderDetail(id: string, map: Map<string, { reason?: string }>): string {
  if (!getBaziEncyclopedia(id)) return '';
  const lit = isBaziCodexUnlocked(id);
  const reason = map.get(id)?.reason;
  return renderBaziCodexDetailHtml(id, {
    artHtml: detailArt(id),
    lit,
    unlockHint: unlockHintFor(id, reason),
    memoryExtraHtml: memoryExtra(id, lit),
  });
}
