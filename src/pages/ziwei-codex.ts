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
  DETAIL_TAB_LABEL,
  getStarProfile,
  type DetailTabId,
} from '../ziwei/star-profiles.ts';
import { COMBO_LORE, getComboLore } from '../ziwei/combo-lore.ts';
import { PALACE_LORE, getPalaceLore } from '../ziwei/palace-lore.ts';
import {
  comboJourneySummary,
  evaluateCombo,
  listComboJourney,
} from '../ziwei/combo-journey.ts';
import {
  codexProgress,
  connectionLine,
  isStarUnlocked,
  listCodexEntries,
  meetSummary,
} from '../ziwei/codex.ts';
import { ziweiSysTabsHtml } from '../ui/lab-sys-tabs.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type CodexLayer = 'stars' | 'palaces' | 'combos' | 'journey' | 'meet';

const LAYERS: Array<{ id: CodexLayer; title: string; blurb: string }> = [
  { id: 'stars', title: '角色卡', blurb: '星曜原型 · 人格海报' },
  { id: 'palaces', title: '宫廷宇宙', blurb: '十二场景 · 人生舞台' },
  { id: 'combos', title: '星曜关系网', blurb: '组合说明书' },
  { id: 'journey', title: '组合旅程', blurb: '我点亮了哪些' },
  { id: 'meet', title: '我的相遇', blurb: '人生角色收藏' },
];

const STAR_TABS: StarCategory[] = ['major', 'aux', 'mutagen'];
const DETAIL_TABS: DetailTabId[] = ['portrait', 'trait', 'mirror', 'you'];

function queryStar(): string {
  try {
    return new URLSearchParams(location.search).get('star')?.trim() ?? '';
  } catch {
    return '';
  }
}

function queryPalace(): string {
  try {
    return new URLSearchParams(location.search).get('palace')?.trim() ?? '';
  } catch {
    return '';
  }
}

function queryCombo(): string {
  try {
    return new URLSearchParams(location.search).get('combo')?.trim() ?? '';
  } catch {
    return '';
  }
}

function queryLayer(): CodexLayer {
  try {
    const v = new URLSearchParams(location.search).get('layer')?.trim();
    if (
      v === 'palaces' ||
      v === 'combos' ||
      v === 'journey' ||
      v === 'meet' ||
      v === 'stars'
    )
      return v;
  } catch {
    /* ignore */
  }
  return 'stars';
}

function setUrl(opts: {
  star?: string;
  palace?: string;
  combo?: string;
  layer?: CodexLayer;
}): void {
  try {
    const q = new URLSearchParams();
    const layer = opts.layer ?? 'stars';
    if (layer !== 'stars') q.set('layer', layer);
    if (opts.star) q.set('star', opts.star);
    if (opts.palace) q.set('palace', opts.palace);
    if (opts.combo) q.set('combo', opts.combo);
    const qs = q.toString();
    history.replaceState({}, '', qs ? `/ziwei/codex?${qs}` : '/ziwei/codex');
  } catch {
    /* ignore */
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
  const profile = getStarProfile(star.id);
  const thumb =
    profile?.artSrc != null
      ? `<div class="ziwei-star-thumb ${unlocked ? 'is-lit' : 'is-dim'}" aria-hidden="true"><img src="${escapeHtml(profile.artSrc)}" alt="" /></div>`
      : `<div class="ziwei-star-glyph" aria-hidden="true">${star.id.slice(0, 1)}</div>`;
  return `
    <button type="button" class="ziwei-star-card ${size === 'lg' ? 'is-hero' : 'is-side'} ${unlocked ? 'is-lit' : 'is-dim'}" data-open-star="${star.id}">
      ${thumb}
      <h2>${escapeHtml(star.title)} <em>${escapeHtml(star.epithet)}</em></h2>
      ${group ? `<p class="ziwei-star-group">${escapeHtml(group)}</p>` : ''}
      <p class="ziwei-star-myth">${escapeHtml(profile?.oneLiner ?? star.myth)}</p>
      ${
        unlocked
          ? `<p class="ziwei-star-link">${escapeHtml(connectionLine(star.id, entry?.lastPalace))}</p>
             <span class="ziwei-star-cta">打开角色卡 ›</span>`
          : `<p class="ziwei-star-locked">尚未点亮 · 排盘遇见后解锁</p>`
      }
    </button>`;
}

function renderPortraitTab(star: StarCard, unlocked: boolean): string {
  const p = getStarProfile(star.id)!;
  const art = p.artSrc
    ? `<img class="ziwei-detail-art" src="${escapeHtml(p.artSrc)}" alt="" />
       <div class="ziwei-art-sparks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>`
    : `<div class="ziwei-star-glyph is-xl" aria-hidden="true">${star.id.slice(0, 1)}</div>`;
  return `
    <div class="ziwei-tab-panel">
      <div class="ziwei-remember-hero ${unlocked ? 'is-lit' : 'is-locked'}">
        ${
          unlocked
            ? art
            : `<div class="ziwei-remember-mystery"><span>?</span></div>`
        }
      </div>
      <h2 class="ziwei-remember-name">${unlocked ? escapeHtml(star.title) : '?'}</h2>
      <p class="ziwei-remember-line">${escapeHtml(
        unlocked ? p.oneLiner : '尚未收录 · 排盘遇见后点亮人格海报',
      )}</p>
      ${
        unlocked
          ? `<ul class="ziwei-keywords">${p.keywords
              .map((k) => `<li>${escapeHtml(k)}</li>`)
              .join('')}</ul>
             <p class="ziwei-metaphor">${escapeHtml(p.metaphor)}</p>
             <p class="ziwei-tab-foot">六爻记场，紫微记人 —— 这颗星像什么样的人 / 力量。</p>`
          : ''
      }
    </div>`;
}

function renderTraitTab(star: StarCard): string {
  const t = getStarProfile(star.id)!.trait;
  const rows: Array<[string, string]> = [
    ['核心动力', t.drive],
    ['天赋优势', t.gift],
    ['阴影模式', t.shadow],
    ['真正需要什么', t.need],
  ];
  return `
    <div class="ziwei-tab-panel">
      <p class="ziwei-codex-hint">看本质：不是优缺点清单，是长在身上的惯性。</p>
      ${rows
        .map(
          ([k, v]) => `
        <section class="ziwei-detail-block">
          <h3>${escapeHtml(k)}</h3>
          <p>${escapeHtml(v)}</p>
        </section>`,
        )
        .join('')}
    </div>`;
}

function renderMirrorTab(star: StarCard): string {
  const m = getStarProfile(star.id)!.mirror;
  const rows: Array<[string, string]> = [
    ['工作', m.work],
    ['感情', m.love],
    ['财运', m.wealth],
    ['人际 / 社交', m.social],
    ['自我状态', m.self],
  ];
  return `
    <div class="ziwei-tab-panel">
      <p class="ziwei-codex-hint">这颗星放在你身上，会体现成什么？</p>
      ${rows
        .map(
          ([k, v]) => `
        <section class="ziwei-detail-block">
          <h3>${escapeHtml(k)}</h3>
          <p>${escapeHtml(v)}</p>
        </section>`,
        )
        .join('')}
    </div>`;
}

function renderYouTab(
  star: StarCard,
  entry: { lastPalace?: string } | undefined,
  unlocked: boolean,
): string {
  const p = getStarProfile(star.id)!;
  const litId = entry?.lastPalace?.replace(/宫$/, '') ?? '';
  const litHit =
    p.palaces.find((h) => h.palaceId === litId || h.title.includes(litId)) ??
    null;
  const focus = p.palaces.slice(0, 3);
  const inChart = unlocked
    ? litHit
      ? `<section class="ziwei-detail-block is-lit-palace">
          <h3>当前点亮 · ${escapeHtml(litHit.title)} <em>${escapeHtml(litHit.hint)}</em></h3>
          <p>${escapeHtml(litHit.line)}</p>
        </section>
        <p class="ziwei-codex-hint">常见落点怎么读（现代语感）</p>
        ${focus
          .map(
            (hit) => `
        <section class="ziwei-detail-block">
          <h3>${escapeHtml(hit.title)} <em>${escapeHtml(hit.hint)}</em></h3>
          <p>${escapeHtml(hit.line)}</p>
        </section>`,
          )
          .join('')}`
      : `<p class="ziwei-codex-hint">你已点亮此星。常见落点：</p>
        ${p.palaces
          .map(
            (hit) => `
        <section class="ziwei-detail-block">
          <h3>${escapeHtml(hit.title)} <em>${escapeHtml(hit.hint)}</em></h3>
          <p>${escapeHtml(hit.line)}</p>
        </section>`,
          )
          .join('')}`
    : `<p class="ziwei-star-locked">排盘遇见后，这里会告诉你：它落在哪一宫、对你意味着什么。</p>`;

  return `
    <div class="ziwei-tab-panel">
      ${inChart}
      <section class="ziwei-detail-counsel">
        <h3>给你的醒言</h3>
        <p>${escapeHtml(p.counsel)}</p>
      </section>
    </div>`;
}

function renderDetail(
  star: StarCard,
  entries: Map<string, { lastPalace?: string }>,
  detailTab: DetailTabId,
): string {
  const unlocked = isStarUnlocked(star.id);
  const entry = entries.get(star.id);
  const tabs = DETAIL_TABS.map(
    (id) =>
      `<button type="button" class="ziwei-detail-tab ${detailTab === id ? 'is-on' : ''}" data-detail-tab="${id}">${DETAIL_TAB_LABEL[id]}</button>`,
  ).join('');
  let panel = '';
  if (detailTab === 'portrait') panel = renderPortraitTab(star, unlocked);
  else if (detailTab === 'trait') panel = renderTraitTab(star);
  else if (detailTab === 'mirror') panel = renderMirrorTab(star);
  else panel = renderYouTab(star, entry, unlocked);

  return `
    <article class="ziwei-star-detail ${unlocked ? 'is-lit' : ''}">
      <button type="button" class="ziwei-detail-back" data-close-detail>← 返回星系档案</button>
      <header class="ziwei-detail-top">
        <p class="ziwei-kicker">星系档案 · ${escapeHtml(star.title)}</p>
        ${
          unlocked
            ? `<p class="ziwei-star-link">${escapeHtml(connectionLine(star.id, entry?.lastPalace))}</p>`
            : '<p class="ziwei-star-locked">尚未点亮 · 先去排盘遇见它</p>'
        }
      </header>
      <div class="ziwei-detail-tabs" role="tablist">${tabs}</div>
      ${panel}
    </article>`;
}

function renderPalacePlaceholder(): string {
  return `
    <p class="ziwei-codex-hint">十二场景 · 人生戏的舞台（点开看正文）</p>
    <div class="ziwei-layer-grid">
      ${PALACE_LORE.map(
        (p) => `
        <button type="button" class="ziwei-layer-card" data-open-palace="${escapeHtml(p.id)}">
          <strong>${escapeHtml(p.title)}</strong>
          <span>${escapeHtml(p.hint)}</span>
          <em>${escapeHtml(p.oneLiner)}</em>
        </button>`,
      ).join('')}
    </div>`;
}

function renderComboPlaceholder(): string {
  return `
    <p class="ziwei-codex-hint">搭戏组合 · 角色怎么互相当对手戏</p>
    <div class="ziwei-layer-grid">
      ${COMBO_LORE.map(
        (c) => `
        <button type="button" class="ziwei-layer-card" data-open-combo="${escapeHtml(c.id)}">
          <strong>${escapeHtml(c.title)}</strong>
          <span>${escapeHtml(c.oneLiner)}</span>
          <em>${escapeHtml(c.members.join(' · '))}</em>
        </button>`,
      ).join('')}
    </div>`;
}

function renderPalaceDetail(id: string): string {
  const p = getPalaceLore(id);
  if (!p) return `<p class="ziwei-codex-hint">未找到该场景</p>`;
  return `
    <article class="ziwei-star-detail is-lit">
      <button type="button" class="ziwei-detail-back" data-close-sub>← 返回十二场景</button>
      <p class="ziwei-kicker">${escapeHtml(p.title)} · ${escapeHtml(p.hint)}</p>
      <h2 class="ziwei-remember-name">${escapeHtml(p.title)}</h2>
      <p class="ziwei-remember-line">${escapeHtml(p.oneLiner)}</p>
      <ul class="ziwei-keywords">${p.keywords.map((k) => `<li>${escapeHtml(k)}</li>`).join('')}</ul>
      <section class="ziwei-detail-block"><h3>这一宫在问什么</h3><p>${escapeHtml(p.asks)}</p></section>
      <section class="ziwei-detail-block"><h3>什么时候最强</h3><p>${escapeHtml(p.strongWhen)}</p></section>
      <section class="ziwei-detail-block"><h3>要小心什么</h3><p>${escapeHtml(p.watchOut)}</p></section>
      <section class="ziwei-detail-block"><h3>对宫怎么看</h3><p>${escapeHtml(p.oppositeHint)}</p></section>
    </article>`;
}

function renderComboDetail(id: string): string {
  const c = getComboLore(id);
  if (!c) return `<p class="ziwei-codex-hint">未找到该组合</p>`;
  const ev = evaluateCombo(c);
  const statusLabel =
    ev.status === 'complete'
      ? '已点亮整组'
      : ev.status === 'partial'
        ? `进行中 ${ev.litMembers.length}/${c.members.length}`
        : '尚未启程';
  const members = c.members
    .map((m) => {
      const lit = isStarUnlocked(m);
      return `<li class="${lit ? 'is-lit' : 'is-miss'}">
        <button type="button" data-open-star="${escapeHtml(m)}">${escapeHtml(m)}${lit ? ' · 已有' : ' · 未点亮'}</button>
      </li>`;
    })
    .join('');
  return `
    <article class="ziwei-star-detail is-lit">
      <button type="button" class="ziwei-detail-back" data-close-sub>← 返回</button>
      <p class="ziwei-kicker">搭戏 · ${escapeHtml(c.title)} · ${escapeHtml(statusLabel)}</p>
      <h2 class="ziwei-remember-name">${escapeHtml(c.title)}</h2>
      <p class="ziwei-remember-line">${escapeHtml(c.oneLiner)}</p>
      <div class="ziwei-journey-bar" aria-hidden="true"><i style="width:${Math.round(ev.progress * 100)}%"></i></div>
      <ul class="ziwei-keywords">${c.keywords.map((k) => `<li>${escapeHtml(k)}</li>`).join('')}</ul>
      <section class="ziwei-detail-block"><h3>成员清单</h3><ul class="ziwei-meet-list ziwei-combo-members">${members}</ul></section>
      <section class="ziwei-detail-block"><h3>气场</h3><p>${escapeHtml(c.vibe)}</p></section>
      <section class="ziwei-detail-block"><h3>优势</h3><p>${escapeHtml(c.strength)}</p></section>
      <section class="ziwei-detail-block"><h3>阴影</h3><p>${escapeHtml(c.shadow)}</p></section>
      <section class="ziwei-detail-block"><h3>怎么演</h3><p>${escapeHtml(c.howToPlay)}</p></section>
      <section class="ziwei-detail-block"><h3>遇四化</h3><p>${escapeHtml(c.mutagenNote)}</p></section>
    </article>`;
}

function renderJourneyLayer(): string {
  const summary = comboJourneySummary();
  const steps = listComboJourney();
  const nextLine = summary.next
    ? summary.next.status === 'partial'
      ? `下一站：继续集齐「${summary.next.combo.title}」（还差 ${summary.next.missingMembers.join('、')}）`
      : `下一站：去排盘遇见「${summary.next.combo.members[0]}」以开启「${summary.next.combo.title}」`
    : '全部组合已点亮整组——你可以在搭戏探索里回看。';

  const cards = steps
    .map((s) => {
      const pct = Math.round(s.progress * 100);
      const badge =
        s.status === 'complete'
          ? '已点亮'
          : s.status === 'partial'
            ? `${s.litMembers.length}/${s.combo.members.length}`
            : '未启程';
      return `
        <button type="button" class="ziwei-journey-step is-${s.status}" data-open-combo="${escapeHtml(s.combo.id)}">
          <span class="ziwei-journey-order">${s.order}</span>
          <span class="ziwei-journey-body">
            <strong>${escapeHtml(s.combo.title)}</strong>
            <em>${escapeHtml(s.combo.oneLiner)}</em>
            <span class="ziwei-journey-meta">${escapeHtml(s.combo.members.join(' · '))}</span>
          </span>
          <span class="ziwei-journey-badge">${escapeHtml(badge)}</span>
          <span class="ziwei-journey-bar" aria-hidden="true"><i style="width:${pct}%"></i></span>
        </button>`;
    })
    .join('');

  return `
    <header class="ziwei-meet-head">
      <h2>组合旅程</h2>
      <p>对标塔罗愚人旅程 · 已成组 <strong>${summary.complete}</strong> / ${summary.total} · 进行中 ${summary.partial}</p>
      <p class="ziwei-journey-next">${escapeHtml(nextLine)}</p>
    </header>
    <p class="ziwei-codex-hint">排盘点亮成员星后，这里会自动点亮组合。点开可看差哪几颗。</p>
    <div class="ziwei-journey-path">${cards}</div>`;
}

function renderMeetLayer(): string {
  const m = meetSummary();
  const majors =
    m.majorIds.length > 0
      ? m.majorIds.map((id) => `<li><button type="button" data-open-star="${id}">${escapeHtml(id)}</button></li>`).join('')
      : '<li class="is-empty">还没有点亮主星 · 先去排盘</li>';
  const palaces =
    m.strongPalaces.length > 0
      ? m.strongPalaces
          .map(
            (p) =>
              `<li><button type="button" data-open-palace="${escapeHtml(p)}">${escapeHtml(p)}</button></li>`,
          )
          .join('')
      : '<li class="is-empty">排盘后显示你落星最多的场景</li>';
  const viewed =
    m.viewedIds.length > 0
      ? m.viewedIds.map((id) => `<li><button type="button" data-open-star="${id}">${escapeHtml(id)}</button></li>`).join('')
      : '<li class="is-empty">打开过的星会记在这里</li>';

  return `
    <header class="ziwei-meet-head">
      <h2>我的命盘相遇</h2>
      <p>你的人生角色收藏夹 · 已点亮 ${m.unlockedCount} 颗</p>
    </header>
    <section class="ziwei-meet-block">
      <h3>命里有哪些主星</h3>
      <ul class="ziwei-meet-list">${majors}</ul>
    </section>
    <section class="ziwei-meet-block">
      <h3>哪些宫最强</h3>
      <ul class="ziwei-meet-list">${palaces}</ul>
    </section>
    <section class="ziwei-meet-block">
      <h3>我已看过哪些星</h3>
      <ul class="ziwei-meet-list">${viewed}</ul>
    </section>
    <section class="ziwei-meet-block">
      <h3>组合旅程</h3>
      <p class="ziwei-codex-hint">看你命盘点亮了哪些搭戏组合。</p>
      <ul class="ziwei-meet-list">
        <li><button type="button" data-goto-journey>打开组合旅程 ›</button></li>
      </ul>
    </section>
    <section class="ziwei-meet-block is-soon">
      <h3>我最常回看的主题</h3>
      <p class="ziwei-codex-hint">回看次数统计即将接入。</p>
    </section>`;
}

export function renderZiweiCodex(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page ziwei-page ziwei-codex-page';
  mountEnvBanner(page);
  root.appendChild(page);

  let layer: CodexLayer = queryLayer();
  let starTab: StarCategory = 'major';
  let detailId = queryStar();
  let palaceId = queryPalace();
  let comboId = queryCombo();
  let detailTab: DetailTabId = 'portrait';
  const entries = () => new Map(listCodexEntries().map((e) => [e.starId, e]));

  function bindOpeners(): void {
    page.querySelectorAll<HTMLButtonElement>('[data-open-star]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.openStar ?? '';
        detailId = id;
        palaceId = '';
        comboId = '';
        detailTab = 'portrait';
        layer = 'stars';
        setUrl({ layer: 'stars', star: id });
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-open-palace]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.openPalace ?? '';
        palaceId = id;
        detailId = '';
        comboId = '';
        layer = 'palaces';
        setUrl({ layer: 'palaces', palace: id });
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-open-combo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.openCombo ?? '';
        comboId = id;
        detailId = '';
        palaceId = '';
        if (layer !== 'journey' && layer !== 'combos') layer = 'combos';
        setUrl({ layer, combo: id });
        paint();
      });
    });
  }

  function paint(): void {
    const map = entries();
    if (palaceId && getPalaceLore(palaceId)) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回紫微</button>
        ${renderPalaceDetail(palaceId)}
      `;
      page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei/reading'));
      page.querySelector('[data-close-sub]')?.addEventListener('click', () => {
        palaceId = '';
        setUrl({ layer: 'palaces' });
        paint();
      });
      bindOpeners();
      return;
    }
    if (comboId && getComboLore(comboId)) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回紫微</button>
        ${renderComboDetail(comboId)}
      `;
      page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei/reading'));
      page.querySelector('[data-close-sub]')?.addEventListener('click', () => {
        comboId = '';
        setUrl({ layer });
        paint();
      });
      bindOpeners();
      return;
    }

    const detail = detailId ? getStarLore(detailId) : undefined;
    if (detail) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回紫微</button>
        ${renderDetail(detail, map, detailTab)}
      `;
      page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei/reading'));
      page.querySelector('[data-close-detail]')?.addEventListener('click', () => {
        detailId = '';
        setUrl({ layer });
        paint();
      });
      page.querySelectorAll<HTMLButtonElement>('[data-detail-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.detailTab as DetailTabId;
          if (DETAIL_TABS.includes(id)) {
            detailTab = id;
            paint();
          }
        });
      });
      return;
    }

    const all = codexProgress();
    const layerTabs = LAYERS.map(
      (L) => `
      <button type="button" class="ziwei-layer-tab ${layer === L.id ? 'is-on' : ''}" data-layer="${L.id}">
        <strong>${escapeHtml(L.title)}</strong>
        <span>${escapeHtml(L.blurb)}</span>
      </button>`,
    ).join('');

    let body = '';
    if (layer === 'stars') {
      const tabsHtml = STAR_TABS.map((id) => {
        const p = codexProgress(id);
        return `<button type="button" class="ziwei-codex-tab ${starTab === id ? 'is-on' : ''}" data-star-tab="${id}">
          ${STAR_CATEGORY_LABEL[id]}
          <em>${p.collected}/${p.total}</em>
        </button>`;
      }).join('');
      let grid = '';
      if (starTab === 'major') {
        grid = `
          <p class="ziwei-codex-hint">六正星 · 绝对核心大卡</p>
          <div class="ziwei-star-grid is-hero-grid">${majorsByGroup('six')
            .map((s) => renderCardTile(s, map, 'lg'))
            .join('')}</div>
          <p class="ziwei-codex-hint">八正星 · 绝对核心大卡</p>
          <div class="ziwei-star-grid is-hero-grid">${majorsByGroup('eight')
            .map((s) => renderCardTile(s, map, 'lg'))
            .join('')}</div>`;
      } else {
        const size = starTab === 'aux' ? 'sm' : 'lg';
        grid = `
          <p class="ziwei-codex-hint">${STAR_CATEGORY_LABEL[starTab]}</p>
          <div class="ziwei-star-grid ${starTab === 'aux' ? 'is-aux-grid' : ''}">${codexStarsByCategory(
            starTab,
          )
            .map((s) => renderCardTile(s, map, size))
            .join('')}</div>`;
      }
      body = `<div class="ziwei-codex-tabs" role="tablist">${tabsHtml}</div>${grid}`;
    } else if (layer === 'palaces') {
      body = renderPalacePlaceholder();
    } else if (layer === 'combos') {
      body = renderComboPlaceholder();
    } else if (layer === 'journey') {
      body = renderJourneyLayer();
    } else {
      body = renderMeetLayer();
    }

    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回命盘</button>
      <header class="life-header ziwei-header">
        <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
        <h1 class="page-title">星系档案</h1>
        <p class="page-subtitle">角色卡 · 宫廷宇宙 · 关系网 · ${all.collected}/${all.total}</p>
      </header>
      ${ziweiSysTabsHtml('reading')}
      <div class="ziwei-layer-tabs">${layerTabs}</div>
      ${body}
    `;

    page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei/reading'));
    page.querySelectorAll<HTMLElement>('.lab-sys-tabs [data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-layer]').forEach((btn) => {
      btn.addEventListener('click', () => {
        layer = (btn.dataset.layer as CodexLayer) || 'stars';
        detailId = '';
        palaceId = '';
        comboId = '';
        setUrl({ layer });
        paint();
      });
    });
    page.querySelector('[data-goto-journey]')?.addEventListener('click', () => {
      layer = 'journey';
      detailId = '';
      palaceId = '';
      comboId = '';
      setUrl({ layer: 'journey' });
      paint();
    });
    page.querySelectorAll<HTMLButtonElement>('[data-star-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.starTab as StarCategory;
        if (STAR_TABS.includes(next)) {
          starTab = next;
          paint();
        }
      });
    });
    bindOpeners();
  }

  paint();
  return () => stars.remove();
}
