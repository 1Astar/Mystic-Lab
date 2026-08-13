import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import {
  getStarLore,
} from '../ziwei/stars.ts';
import { type DetailTabId } from '../ziwei/star-profiles.ts';
import { getComboLore } from '../ziwei/combo-lore.ts';
import { PALACE_LORE, getPalaceLore } from '../ziwei/palace-lore.ts';
import {
  comboJourneySummary,
  evaluateCombo,
  listComboJourney,
  listMineCandidateCombos,
  listMineStrongCombos,
} from '../ziwei/combo-journey.ts';
import { claimNewCraftComboToasts } from '../craft/combo-achievements.ts';
import { ICON_EXPLORE_STAR } from '../ui/lab-icons.ts';
import {
  codexProgress,
  isStarUnlocked,
  listCodexEntries,
  meetSummary,
} from '../ziwei/codex.ts';
import {
  ATLAS_TOP_TABS,
  LUCKY_STAR_IDS,
  MUTAGEN_BUCKET_META,
  PALACE_BUCKET_META,
  SHA_STAR_IDS,
  STRUCTURE_BUCKET_META,
  minorStarsInBucket,
  mutagenStarCards,
  starsInBucket,
  type CatalogSection,
  type MutagenBucket,
  type PalaceBucket,
  type StarBucket,
  type StructureBucket,
} from '../ziwei/codex-taxonomy.ts';
import {
  renderBucketGuidePrimerHtml,
  starTaxonomyOverviewGuide,
} from '../ziwei/codex-bucket-guide.ts';
import {
  SHENSHA_THEME_META,
  SHENSHA_THEME_OPEN_MIN,
  SHENSHA_THEME_ORDER,
  SHENSHA_THEME_PIN_OPEN,
  SHENSHA_TONE_META,
  SHENSHA_TONE_ORDER,
  countShenshaByTheme,
  countShenshaByTone,
  listCodexShenshaFlat,
  shenshaBrowseMeta,
  type ShenshaThemeId,
  type ShenshaToneId,
} from '../ziwei/codex-shensha-browse.ts';
import {
  buildShenshaMeetPulsePanel,
  renderShenshaMeetHighlightHtml,
} from '../ziwei/shensha-meet-highlight.ts';
import {
  STAR_KIND_META,
  STAR_KIND_ORDER,
  STAR_MEET_META,
  parseStarMeet,
  starBucketToKind,
  starKindToBucket,
  type StarKindFilter,
  type StarMeetFilter,
} from '../ziwei/codex-star-browse.ts';
import {
  isZiweiCodexFavorite,
  listZiweiCodexFavorites,
  toggleZiweiCodexFavorite,
  ziweiFavButtonLabel,
} from '../ziwei/codex-favorites.ts';
import { getMinorStarLore, type MinorStarLore } from '../ziwei/minor-star-lore.ts';
import { getShenshaLore, type ShenshaLore } from '../ziwei/shensha-lore.ts';
import {
  APP_SHENSHA_SCHOOL,
  SCHOOL_CONTRAST_ROWS,
  SCHOOL_META,
  SCHOOL_OVERVIEW,
  getContrastRow,
  getShenshaSchoolTag,
} from '../ziwei/shensha-school-contrast.ts';
import { getGlossaryByName } from '../ziwei/term-glossary.ts';
import { answerZiweiConcept, recordZiweiConceptMiss } from '../ziwei/concept-ask.ts';
import { ziweiSysTabsHtml } from '../ui/lab-sys-tabs.ts';
import { mountLabFloatActions } from '../ui/lab-float-actions.ts';
import { openLabNotesSheet, loadLabNoteText } from '../ui/lab-notes-sheet.ts';
import { openLabDeepSheet } from '../ui/lab-deep-sheet.ts';
import { draftFromZiwei } from '../share/drafts.ts';
import {
  renderMinorDetailRich,
  renderShenshaDetailRich,
  renderShortMinorCard,
  renderShortShenshaCard,
  renderShortStarCard,
  renderStarDetail,
} from './ziwei-codex-star-ui.ts';
import { getActivePerson } from '../life/storage.ts';
import { castZiweiChart } from '../ziwei/cast.ts';
import {
  indexChartStars,
  type ChartStarHit,
} from '../ziwei/codex-collect.ts';
import {
  listBirthMutagenHits,
  listLimitMutagenHits,
  mutagenHitTitle,
  type CodexMutagenHit,
} from '../ziwei/codex-mutagen-hits.ts';
import type { PersonProfile } from '../life/types.ts';
import type { ZiweiChartView } from '../ziwei/types.ts';
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 图鉴分区；「我的相遇」为独立页 layer=meet */
type CodexLayer = CatalogSection | 'meet';

const STAR_BUCKETS: StarBucket[] = ['major', 'lucky', 'sha', 'aux', 'minor', 'shensha'];
const MUTAGEN_BUCKETS: MutagenBucket[] = ['stars', 'birth', 'limit'];
const STRUCTURE_BUCKETS: StructureBucket[] = ['brightness', 'wuxing', 'soul', 'limits'];

function queryParam(key: string): string {
  try {
    return new URLSearchParams(location.search).get(key)?.trim() ?? '';
  } catch {
    return '';
  }
}

function queryLayer(): CodexLayer {
  const v = queryParam('layer');
  const sheet = queryParam('sheet');
  // 兼容旧深链 sheet=meet / layer=journey
  if (v === 'meet' || v === 'journey' || sheet === 'meet') return 'meet';
  if (v === 'palaces' || v === 'mutagen' || v === 'structure' || v === 'stars') return v;
  return 'stars';
}

/** 我的相遇 · 二级：已收集 / 格局组合 / 收藏 */
type MeetHubTab = 'collected' | 'combos' | 'favorite';

function parseMeetHub(raw: string | null | undefined): MeetHubTab {
  if (raw === 'combos' || raw === 'favorite' || raw === 'collected') return raw;
  if (raw === 'journey') return 'combos';
  return 'collected';
}

function normalizePalaceBucket(raw: string | null | undefined): PalaceBucket {
  if (raw === 'geju') return 'geju';
  if (raw === 'read' || raw === 'sanfang' || raw === 'dui') return 'read';
  return 'twelve';
}

function underlineSubTabsHtml(
  aria: string,
  items: Array<{ id: string; label: string; attr: string }>,
  activeId: string,
  opts?: { variant?: 'underline' | 'segment' },
): string {
  const variant = opts?.variant ?? 'underline';
  const tabsCls =
    variant === 'segment'
      ? 'ziwei-sub-underline-tabs is-segment'
      : 'ziwei-sub-underline-tabs';
  return `
    <div class="${tabsCls}" role="tablist" aria-label="${escapeHtml(aria)}">
      ${items
        .map(
          (it) => `
        <button type="button" class="ziwei-sub-underline-tab ${activeId === it.id ? 'is-on' : ''}" role="tab" aria-selected="${activeId === it.id ? 'true' : 'false'}" ${it.attr}>
          ${escapeHtml(it.label)}
        </button>`,
        )
        .join('')}
    </div>`;
}

function setUrl(opts: {
  star?: string;
  palace?: string;
  combo?: string;
  term?: string;
  minor?: string;
  shensha?: string;
  contrast?: string;
  layer?: CodexLayer;
  bucket?: string;
  meet?: string;
  hub?: MeetHubTab;
}): void {
  try {
    const q = new URLSearchParams();
    const layer = opts.layer ?? 'stars';
    if (layer !== 'stars') q.set('layer', layer);
    if (layer === 'meet') {
      if (opts.hub && opts.hub !== 'collected') q.set('hub', opts.hub);
      if (opts.bucket) q.set('bucket', opts.bucket);
    } else if (opts.bucket) {
      q.set('bucket', opts.bucket);
    }
    if (opts.meet && opts.meet !== 'all') q.set('meet', opts.meet);
    if (opts.star) q.set('star', opts.star);
    if (opts.palace) q.set('palace', opts.palace);
    if (opts.combo) q.set('combo', opts.combo);
    if (opts.term) q.set('term', opts.term);
    if (opts.minor) q.set('minor', opts.minor);
    if (opts.shensha) q.set('shensha', opts.shensha);
    if (opts.contrast) q.set('contrast', opts.contrast);
    const qs = q.toString();
    history.replaceState({}, '', qs ? `/ziwei/tujian?${qs}` : '/ziwei/tujian');
  } catch {
    /* ignore */
  }
}

/* 主星列表/特色/详情 → ziwei-codex-star-ui.ts */

function isAtlasCollected(
  id: string,
  chartHits: Map<string, unknown>,
): boolean {
  return chartHits.has(id) || isStarUnlocked(id);
}

function favBtnHtml(id: string): string {
  const on = isZiweiCodexFavorite(id);
  return `<button type="button" class="ziwei-fav-btn ${on ? 'is-on' : ''}" data-toggle-fav="${escapeHtml(id)}" aria-pressed="${on}">${escapeHtml(ziweiFavButtonLabel(on))}</button>`;
}

function renderMinorDetail(
  m: MinorStarLore,
  chartHits: Map<string, ChartStarHit>,
  hasChart: boolean,
  detailTab: DetailTabId = 'portrait',
): string {
  return renderMinorDetailRich(m, {
    chartHits,
    hasChart,
    detailTab,
    favHtml: favBtnHtml(m.id),
  });
}

function renderShenshaDetail(
  s: ShenshaLore,
  chartHits: Map<string, ChartStarHit>,
  hasChart: boolean,
  detailTab: DetailTabId = 'portrait',
): string {
  const tag = getShenshaSchoolTag(s.id);
  const related = tag?.contrastId ? getContrastRow(tag.contrastId) : undefined;
  const schoolBlock = tag
    ? `<section class="ziwei-detail-block">
        <h3>流派</h3>
        <p><span class="ziwei-school-badge">${escapeHtml(tag.badge)}</span> ${escapeHtml(tag.note)}</p>
        ${
          related
            ? `<p><button type="button" class="ziwei-inline-link" data-open-contrast="${escapeHtml(related.id)}">查看「${escapeHtml(related.topic)}」对照 →</button></p>`
            : `<p><button type="button" class="ziwei-inline-link" data-open-contrast="overview">通行派 × 中州派总对照 →</button></p>`
        }
      </section>`
    : `<section class="ziwei-detail-block">
        <h3>流派</h3>
        <p>多数杂曜两派同安。若名目生疏，先打开<button type="button" class="ziwei-inline-link" data-open-contrast="overview">通行派 × 中州派对照</button>。</p>
      </section>`;
  return renderShenshaDetailRich(s, {
    chartHits,
    hasChart,
    detailTab,
    favHtml: favBtnHtml(s.id),
    schoolBlock,
    footHint: `本 App 排盘默认「${SCHOOL_META[APP_SHENSHA_SCHOOL].title}」。他书/他盘若标中州，以对方标注为准。`,
  });
}

function renderSchoolContrastDetail(contrastId: string): string {
  if (contrastId === 'overview' || !contrastId) {
    const rows = SCHOOL_CONTRAST_ROWS.map(
      (r) => `
      <tr>
        <th scope="row">${escapeHtml(r.topic)}</th>
        <td>${escapeHtml(r.defaultLabel)}</td>
        <td>${escapeHtml(r.zhongzhouLabel)}</td>
        <td>
          <button type="button" class="ziwei-inline-link" data-open-contrast="${escapeHtml(r.id)}">细说</button>
        </td>
      </tr>`,
    ).join('');
    const relatedBtns = ['截路', '空亡', '截空', '劫杀', '岁破', '天使', '天伤']
      .map((id) => {
        const lore = getShenshaLore(id);
        if (!lore) return '';
        return `<button type="button" class="ziwei-term-hot" data-open-shensha="${escapeHtml(id)}">${escapeHtml(id)}</button>`;
      })
      .join('');
    return `
      <article class="ziwei-star-detail is-lit">
        <button type="button" class="ziwei-detail-back" data-close-detail>← 返回图鉴</button>
        <p class="ziwei-kicker">神煞百科 · 流派</p>
        <h2 class="ziwei-remember-name">${escapeHtml(SCHOOL_OVERVIEW.title)}</h2>
        <p class="ziwei-remember-line">${escapeHtml(SCHOOL_OVERVIEW.oneLiner)}</p>
        <section class="ziwei-detail-block">
          <h3>怎么读</h3>
          <pre class="ziwei-learn-body">${escapeHtml(SCHOOL_OVERVIEW.body)}</pre>
        </section>
        <section class="ziwei-detail-block">
          <h3>对照表</h3>
          <div class="ziwei-school-table-wrap">
            <table class="ziwei-school-table">
              <thead>
                <tr><th>议题</th><th>通行派</th><th>中州派</th><th></th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </section>
        <section class="ziwei-detail-block">
          <h3>相关词条</h3>
          <p class="ziwei-combo-costars">${relatedBtns}</p>
        </section>
      </article>`;
  }

  const row = getContrastRow(contrastId);
  if (!row) {
    return `<p class="ziwei-codex-hint">未找到该对照项</p>
      <button type="button" class="ziwei-detail-back" data-close-detail>← 返回</button>`;
  }
  const links = row.relatedIds
    .map((id) => {
      const lore = getShenshaLore(id);
      if (!lore) return '';
      return `<button type="button" class="ziwei-term-hot" data-open-shensha="${escapeHtml(id)}">${escapeHtml(id)} · ${escapeHtml(lore.epithet)}</button>`;
    })
    .join('');
  return `
    <article class="ziwei-star-detail is-lit">
      <button type="button" class="ziwei-detail-back" data-close-detail>← 返回图鉴</button>
      <p class="ziwei-kicker">流派对照</p>
      <h2 class="ziwei-remember-name">${escapeHtml(row.topic)}</h2>
      <section class="ziwei-detail-block">
        <h3>通行派</h3>
        <p>${escapeHtml(row.defaultLabel)}</p>
      </section>
      <section class="ziwei-detail-block">
        <h3>中州派</h3>
        <p>${escapeHtml(row.zhongzhouLabel)}</p>
      </section>
      <section class="ziwei-detail-block">
        <h3>怎么理解</h3>
        <p>${escapeHtml(row.gloss)}</p>
      </section>
      <section class="ziwei-detail-block">
        <h3>相关神煞</h3>
        <p class="ziwei-combo-costars">${links}</p>
      </section>
      <p><button type="button" class="ziwei-inline-link" data-open-contrast="overview">← 回总对照</button></p>
    </article>`;
}

function renderPalaceDetail(id: string): string {
  const p = getPalaceLore(id);
  if (!p) return `<p class="ziwei-codex-hint">未找到该宫位</p>`;
  return `
    <article class="ziwei-star-detail is-lit">
      <button type="button" class="ziwei-detail-back" data-close-sub>← 返回宫位图鉴</button>
      <p class="ziwei-kicker">十二宫 · ${escapeHtml(p.hint)}</p>
      <h2 class="ziwei-remember-name">${escapeHtml(p.title)}</h2>
      <p class="ziwei-remember-line">${escapeHtml(p.oneLiner)}</p>
      <ul class="ziwei-keywords">${p.keywords.map((k) => `<li>${escapeHtml(k)}</li>`).join('')}</ul>
      <section class="ziwei-detail-block"><h3>人生领域</h3><p>${escapeHtml(p.hint)}——${escapeHtml(p.oneLiner)}</p></section>
      <section class="ziwei-detail-block"><h3>核心问题</h3><p>${escapeHtml(p.asks)}</p></section>
      <section class="ziwei-detail-block">
        <h3>常见表现</h3>
        ${p.commonLooks ? `<p>${escapeHtml(p.commonLooks)}</p>` : ''}
        <p><strong>强时</strong>　${escapeHtml(p.strongWhen)}</p>
        <p><strong>留意</strong>　${escapeHtml(p.watchOut)}</p>
      </section>
      <section class="ziwei-detail-block">
        <h3>落星后怎么看</h3>
        <p>${escapeHtml(p.afterStars ?? '先读本宫主星气质，再看对宫与三合会照，最后叠四化。')}</p>
        <p>对宫：${escapeHtml(p.oppositeHint)}</p>
        <p><button type="button" class="ziwei-inline-link" data-open-term="三方四正">三方四正怎么用 →</button></p>
      </section>
    </article>`;
}

function renderComboDetail(id: string, view: ZiweiChartView | null = null): string {
  const c = getComboLore(id);
  if (!c) return `<p class="ziwei-codex-hint">未找到该组合</p>`;
  const ev = evaluateCombo(c, view);
  const statusLabel =
    ev.status === 'complete'
      ? c.rank === 'strong'
        ? '强成格'
        : '已成格'
      : ev.status === 'partial'
        ? `进行中 ${ev.litMembers.length}/${c.members.length}`
        : '尚未成格';
  const family = c.family === 'classic-ge' ? '古典格局' : '星曜组合';
  const members = c.members
    .map((m) => {
      const lit = isStarUnlocked(m) || ev.litMembers.includes(m);
      return `<li class="${lit ? 'is-lit' : 'is-miss'}">
        <button type="button" data-open-star="${escapeHtml(m)}">${escapeHtml(m)}${lit ? ' · 盘上有' : ' · 未入会照'}</button>
      </li>`;
    })
    .join('');
  return `
    <article class="ziwei-star-detail is-lit">
      <button type="button" class="ziwei-detail-back" data-close-sub>← 返回</button>
      <p class="ziwei-kicker">${escapeHtml(family)} · ${escapeHtml(statusLabel)}</p>
      <h2 class="ziwei-remember-name">${escapeHtml(c.title)}</h2>
      <p class="ziwei-remember-line">${escapeHtml(c.oneLiner)}</p>
      <p class="ziwei-codex-hint">${escapeHtml(ev.ruleLine ?? '')}</p>
      <div class="ziwei-journey-bar" aria-hidden="true"><i style="width:${Math.round(ev.progress * 100)}%"></i></div>
      <ul class="ziwei-keywords">${c.keywords.map((k) => `<li>${escapeHtml(k)}</li>`).join('')}</ul>
      <section class="ziwei-detail-block"><h3>成员 / 要件</h3><ul class="ziwei-meet-list ziwei-combo-members">${members}</ul></section>
      <section class="ziwei-detail-block"><h3>气场</h3><p>${escapeHtml(c.vibe)}</p></section>
      <section class="ziwei-detail-block"><h3>优势</h3><p>${escapeHtml(c.strength)}</p></section>
      <section class="ziwei-detail-block"><h3>阴影</h3><p>${escapeHtml(c.shadow)}</p></section>
      <section class="ziwei-detail-block"><h3>怎么用</h3><p>${escapeHtml(c.howToPlay)}</p></section>
      <section class="ziwei-detail-block"><h3>遇四化</h3><p>${escapeHtml(c.mutagenNote)}</p></section>
    </article>`;
}

function renderTermDetail(term: string): string {
  const g = getGlossaryByName(term);
  if (!g) return `<p class="ziwei-codex-hint">词条「${escapeHtml(term)}」尚未收录</p>`;
  return `
    <article class="ziwei-star-detail is-lit">
      <button type="button" class="ziwei-detail-back" data-close-sub>← 返回图鉴</button>
      <p class="ziwei-kicker">命盘规则 / 术语</p>
      <h2 class="ziwei-remember-name">${escapeHtml(g.name)}</h2>
      <p class="ziwei-remember-line">${escapeHtml(g.shortMeaning)}</p>
      <section class="ziwei-detail-block"><h3>传统含义</h3><pre class="ziwei-learn-body">${escapeHtml(g.traditional)}</pre></section>
      <section class="ziwei-detail-block">
        <h3>相关</h3>
        <ul class="ziwei-meet-list">${g.relatedTerms
          .map(
            (t) =>
              `<li><button type="button" data-open-term="${escapeHtml(t)}">${escapeHtml(t)}</button></li>`,
          )
          .join('')}</ul>
      </section>
      <p class="ziwei-codex-hint">完整解释也可在命盘里点对应图层 / 宫位，按你的盘动态展开。</p>
    </article>`;
}

function renderJourneyStepCard(s: import('../ziwei/combo-journey.ts').ComboJourneyStep): string {
  const pct = Math.round(s.progress * 100);
  const badge =
    s.combo.formationRule === 'catalog'
      ? '名录'
      : s.status === 'complete'
        ? s.combo.rank === 'strong'
          ? '强成格'
          : '已成格'
        : s.status === 'partial'
          ? `${s.litMembers.length}/${s.combo.members.length}`
          : '未成格';
  const meta = s.focusPalace
    ? `${s.combo.members.join(' · ')} · 锚 ${s.focusPalace}`
    : s.combo.members.join(' · ');
  const family =
    s.combo.family === 'classic-ge' ? '古典格局' : '星曜组合';
  return `
    <button type="button" class="ziwei-journey-step is-${s.status} is-rank-${s.combo.rank}" data-open-combo="${escapeHtml(s.combo.id)}">
      <span class="ziwei-journey-order">${s.order}</span>
      <span class="ziwei-journey-body">
        <strong>${escapeHtml(s.combo.title)}</strong>
        <em>${escapeHtml(s.combo.oneLiner)}</em>
        <span class="ziwei-journey-meta">${escapeHtml(family)} · ${escapeHtml(meta)}</span>
      </span>
      <span class="ziwei-journey-badge">${escapeHtml(badge)}</span>
      <span class="ziwei-journey-bar" aria-hidden="true"><i style="width:${pct}%"></i></span>
    </button>`;
}

function renderJourneyLayer(view: ZiweiChartView | null): string {
  const strong = listMineStrongCombos(view);
  const candidates = listMineCandidateCombos(view);
  const summary = comboJourneySummary(view);

  const strongHtml = strong.length
    ? `<div class="ziwei-journey-path">${strong.map(renderJourneyStepCard).join('')}</div>`
    : `<p class="ziwei-codex-hint">本盘还没有「强成格」。古典格条件较严——可在图鉴「格局名录」对照全文。</p>`;

  const candHtml = candidates.length
    ? `
    <details class="ziwei-ge-candidates">
      <summary>候选格局 <em>${candidates.length}</em>（软成格 / 进行中）</summary>
      <div class="ziwei-journey-path">${candidates.map(renderJourneyStepCard).join('')}</div>
    </details>`
    : '';

  return `
    <header class="ziwei-meet-head">
      <h2>我的格局</h2>
      <p>强成格 <strong>${strong.length}</strong> · 候选 ${candidates.length} · 词库 ${summary.total}</p>
      <p class="ziwei-journey-next">这里只显示你盘上「有」的：强成格默认展开，其余折进候选。未成格请进图鉴名录。</p>
    </header>
    <h3 class="ziwei-ge-section-title">强成格</h3>
    ${strongHtml}
    ${candHtml}
    <p class="ziwei-codex-hint">口径说明：古典格按专规（拱命 / 夹马 / 并明 / 丹墀）；星曜组合看三方四正。文墨等软件常更宽松，故列表会更长。</p>
    <p class="ziwei-meet-atlas-exit">
      <button type="button" class="ziwei-inline-link" data-layer="palaces" data-palace-bucket="geju">打开图鉴 · 全部格局名录 →</button>
    </p>`;
}

function showCraftComboAchToasts(view: ZiweiChartView | null): void {
  const newly = claimNewCraftComboToasts(view);
  if (!newly.length) return;
  const first = newly[0]!;
  document.querySelector('.unlock-toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'unlock-toast is-craft-ach';
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="unlock-toast-icon">${ICON_EXPLORE_STAR}</span>
    <div class="unlock-toast-text">
      <strong>${escapeHtml(first.unlockLine)}</strong>
      <span>${newly.length > 1 ? `另有 ${newly.length - 1} 项成就已同步` : '加成已写入造命雷达'}</span>
    </div>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  window.setTimeout(() => {
    toast.classList.remove('is-visible');
    window.setTimeout(() => toast.remove(), 400);
  }, 4200);
}

/** 「我的相遇」分类总览：点档名切到本页对应分类 */
function renderMeetKindOverview(
  meet: 'collected' | 'favorite',
  kind: StarKindFilter,
  chartHits: Map<string, import('../ziwei/codex-collect.ts').ChartStarHit>,
): string {
  const favSet = new Set(listZiweiCodexFavorites());
  const passMeet = (id: string): boolean =>
    meet === 'favorite' ? favSet.has(id) : isAtlasCollected(id, chartHits);

  const counts: Record<StarKindFilter, number> = {
    major: starsInBucket('major').filter((s) => passMeet(s.id)).length,
    lucky: starsInBucket('lucky').filter((s) => passMeet(s.id)).length,
    sha: starsInBucket('sha').filter((s) => passMeet(s.id)).length,
    aux: starsInBucket('aux').filter((s) => passMeet(s.id)).length,
    minor: minorStarsInBucket().filter((m) => passMeet(m.id)).length,
    shensha: listCodexShenshaFlat().filter((s) => passMeet(s.id)).length,
  };

  return `
    <section class="ziwei-meet-kind-overview" aria-label="收集分类总览">
      <p class="ziwei-meet-kind-overview-hint">点下方总结切到对应分类 · 仅显示你的收集</p>
      <div class="ziwei-meet-kind-overview-grid" role="group">
        ${STAR_KIND_ORDER.map((id) => {
          const n = counts[id];
          return `
          <button type="button" class="ziwei-meet-kind-overview-card ${kind === id ? 'is-on' : ''}${n ? '' : ' is-empty'}"
            data-meet-kind="${id}" ${n ? '' : 'disabled'}>
            <strong>${escapeHtml(STAR_KIND_META[id].title)}</strong>
            <em>${n}</em>
          </button>`;
        }).join('')}
      </div>
    </section>`;
}

function renderMeetLayer(
  hub: MeetHubTab,
  view: ZiweiChartView | null,
  kind: StarKindFilter,
  map: Map<string, { lastPalace?: string }>,
  chartHits: Map<string, import('../ziwei/codex-collect.ts').ChartStarHit>,
  hasChart: boolean,
  shenshaTheme: ShenshaThemeId | 'all',
  shenshaTone: ShenshaToneId | 'all',
): string {
  const hubTabs = underlineSubTabsHtml(
    '我的相遇',
    [
      { id: 'collected', label: '已收集星曜', attr: 'data-meet-hub="collected"' },
      { id: 'combos', label: '我的格局', attr: 'data-meet-hub="combos"' },
      { id: 'favorite', label: '我的收藏', attr: 'data-meet-hub="favorite"' },
    ],
    hub,
    { variant: 'segment' },
  );

  if (hub === 'combos') {
    return `${hubTabs}${renderJourneyLayer(view)}`;
  }

  const meetFilter: 'collected' | 'favorite' = hub === 'favorite' ? 'favorite' : 'collected';
  const m = meetSummary();
  const hero =
    hub === 'collected'
      ? `
    <header class="ziwei-meet-hero">
      <p class="ziwei-meet-lit-count"><span aria-hidden="true">✨</span> 已点亮 <strong>${m.unlockedCount}</strong> 颗</p>
      <p class="ziwei-meet-hero-sub">你收集到的星曜 · 命盘里的角色卡</p>
    </header>`
      : `
    <header class="ziwei-meet-hero is-compact">
      <p class="ziwei-meet-hero-sub">☆ 收藏的词条会集中在这里，点开可继续对照图鉴。</p>
    </header>`;

  const collectedForHighlight = listCodexShenshaFlat()
    .map((s) => s.id)
    .filter((id) => isAtlasCollected(id, chartHits));
  const pulsePanel =
    meetFilter === 'collected' ? buildShenshaMeetPulsePanel(collectedForHighlight) : null;
  const highlightHtml =
    meetFilter === 'collected'
      ? renderShenshaMeetHighlightHtml(pulsePanel, {
          emptyHint: hasChart
            ? '收集神煞后，这里会用阶段卡与脉搏看板总揽你的相遇底色。'
            : '排盘并收集神煞后，这里会出现你的相遇高光。',
          activeTheme: kind === 'shensha' ? shenshaTheme : 'all',
        })
      : '';

  const atlasExit = `
    <p class="ziwei-meet-atlas-exit">
      <button type="button" class="ziwei-inline-link" data-goto-atlas-kind="${escapeHtml(kind)}">
        在图鉴看「${escapeHtml(STAR_KIND_META[kind].title)}」全部 →
      </button>
    </p>`;

  return `
    ${hubTabs}
    ${hero}
    ${renderMeetKindOverview(meetFilter, kind, chartHits)}
    ${highlightHtml}
    ${renderStarsCatalog(
      meetFilter,
      kind,
      map,
      chartHits,
      hasChart,
      shenshaTheme,
      shenshaTone,
      view,
      { mode: 'mine', nestMeetHighlight: false },
    )}
    ${atlasExit}`;
}

function openStarBucketGuideNotes(): void {
  const pack = starTaxonomyOverviewGuide();
  const person = getActivePerson();
  const draft = loadLabNoteText('ziwei', person.id);

  const reflectHtml = pack.reflect.length
    ? `<aside class="lab-notes-reflect" aria-label="对照提示">
        <p class="lab-notes-reflect-title">可以记一笔</p>
        <ul class="lab-notes-reflect-list">
          ${pack.reflect
            .map(
              (item, i) => `
            <li>
              <button type="button" class="lab-notes-reflect-item" data-guide-reflect-i="${i}">
                ${escapeHtml(item)}
              </button>
            </li>`,
            )
            .join('')}
        </ul>
        <p class="lab-notes-reflect-hint">点一句，写进下方笔记</p>
      </aside>`
    : '';

  openLabNotesSheet({
    system: 'ziwei',
    surface: 'atlas',
    context: pack.context,
    showNotePad: false,
    bodyHtml: `
      <div class="ziwei-notes-learn" data-bucket-guide-root>
        <div class="ly-note-mini-tabs ziwei-notes-tabs" role="tablist" aria-label="分类说明与笔记">
          <button type="button" class="ly-note-mini-tab is-active" data-bucket-notes-tab="guide" role="tab" aria-selected="true">说明</button>
          <button type="button" class="ly-note-mini-tab" data-bucket-notes-tab="notes" role="tab" aria-selected="false">笔记</button>
        </div>
        <div class="ly-note-mini-body">
          <div class="ly-note-tab-panel is-active" data-bucket-notes-pane="guide">
            ${renderBucketGuidePrimerHtml(pack)}
          </div>
          <div class="ly-note-tab-panel" data-bucket-notes-pane="notes" hidden>
            ${reflectHtml}
            <label class="lab-notes-label" for="lab-notes-ta">写下这次想留住的句子、对照与疑问</label>
            <textarea id="lab-notes-ta" class="lab-notes-input" rows="10" maxlength="4000" placeholder="例如：主星是主角，神煞是色调… / 我还想搞清…">${escapeHtml(draft)}</textarea>
            <p class="lab-notes-hint">自动保存在本机，按档案分开；可随时回来续写。</p>
          </div>
        </div>
      </div>`,
    onBodyReady: (body) => {
      const switchTab = (tab: 'guide' | 'notes') => {
        body.querySelectorAll<HTMLButtonElement>('[data-bucket-notes-tab]').forEach((b) => {
          const on = b.dataset.bucketNotesTab === tab;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', String(on));
        });
        body.querySelectorAll<HTMLElement>('[data-bucket-notes-pane]').forEach((pane) => {
          const on = pane.dataset.bucketNotesPane === tab;
          pane.classList.toggle('is-active', on);
          pane.hidden = !on;
        });
        if (tab === 'notes') body.querySelector<HTMLTextAreaElement>('#lab-notes-ta')?.focus();
      };

      body.querySelectorAll<HTMLButtonElement>('[data-bucket-notes-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          switchTab(btn.dataset.bucketNotesTab === 'notes' ? 'notes' : 'guide');
        });
      });

      body.querySelectorAll<HTMLButtonElement>('[data-guide-reflect-i]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const i = Number(btn.dataset.guideReflectI);
          const line = pack.reflect[i];
          const ta = body.querySelector<HTMLTextAreaElement>('#lab-notes-ta');
          if (!line || !ta) return;
          const cur = ta.value.trimEnd();
          ta.value = (cur ? `${cur}\n${line}` : line).slice(0, 4000);
          switchTab('notes');
          ta.focus();
          ta.setSelectionRange(ta.value.length, ta.value.length);
        });
      });
    },
  });
}

function renderStarsCatalog(
  meet: StarMeetFilter,
  kind: StarKindFilter,
  map: Map<string, { lastPalace?: string }>,
  chartHits: Map<string, import('../ziwei/codex-collect.ts').ChartStarHit>,
  hasChart: boolean,
  shenshaTheme: ShenshaThemeId | 'all' = 'all',
  shenshaTone: ShenshaToneId | 'all' = 'all',
  view: import('../ziwei/types.ts').ZiweiChartView | null = null,
  opts: { mode: 'atlas' | 'mine'; nestMeetHighlight?: boolean } = { mode: 'atlas' },
): string {
  const favSet = new Set(listZiweiCodexFavorites());
  const passMeet = (id: string): boolean => {
    if (meet === 'all') return true;
    if (meet === 'favorite') return favSet.has(id);
    return isAtlasCollected(id, chartHits);
  };

  const kindCounts: Record<StarKindFilter, number> = {
    major: starsInBucket('major').filter((s) => passMeet(s.id)).length,
    lucky: starsInBucket('lucky').filter((s) => passMeet(s.id)).length,
    sha: starsInBucket('sha').filter((s) => passMeet(s.id)).length,
    aux: starsInBucket('aux').filter((s) => passMeet(s.id)).length,
    minor: minorStarsInBucket().filter((m) => passMeet(m.id)).length,
    shensha: listCodexShenshaFlat().filter((s) => passMeet(s.id)).length,
  };
  const kindChips = `
    <div class="ziwei-star-kind-rail">
      <p class="ziwei-swipe-hint" aria-hidden="true">(← 左右滑动可查看更多 →)</p>
      <div class="ziwei-star-kind-chips is-scroll" role="group" aria-label="星曜分类">
        ${STAR_KIND_ORDER.map(
          (id) => `<button type="button" class="ziwei-star-kind-chip ${kind === id ? 'is-on' : ''}" data-star-kind="${id}">
            ${escapeHtml(STAR_KIND_META[id].title)} <em>${kindCounts[id]}</em>
          </button>`,
        ).join('')}
        <button type="button" class="ziwei-codex-help is-overview" data-bucket-guide="overview" title="主星、神煞、杂曜怎么分？" aria-label="星曜分类说明（打开笔记）">?</button>
      </div>
    </div>`;

  let body = '';
  if (kind === 'major') {
    const list = starsInBucket('major').filter((s) => passMeet(s.id));
    body = list.length
      ? `<div class="ziwei-codex-short-grid">${list.map((s) => renderShortStarCard(s, map, chartHits, hasChart, view)).join('')}</div>`
      : `<p class="ziwei-codex-hint">${
          meet === 'favorite'
            ? '还没有收藏主星。点开详情里的☆可收藏。'
            : meet === 'collected'
              ? hasChart
                ? '这盘还没有已收集的主星，可切到「全部」浏览十四主星。'
                : '排盘或解锁后，已收集会出现在这里。'
              : '暂无条目。'
        }</p>`;
  } else if (kind === 'lucky' || kind === 'sha' || kind === 'aux') {
    const title =
      kind === 'lucky' ? '六吉星' : kind === 'sha' ? '六煞星' : '辅曜';
    const list = starsInBucket(kind).filter((s) => passMeet(s.id));
    body = list.length
      ? `<div class="ziwei-codex-short-grid">${list.map((s) => renderShortStarCard(s, map, chartHits, hasChart, view)).join('')}</div>`
      : `<p class="ziwei-codex-hint">${
          meet === 'favorite'
            ? `还没有收藏${title}。点开详情☆可收藏。`
            : meet === 'collected'
              ? `还没有已收集的${title}，可切「星曜」百科浏览。`
              : '暂无条目。'
        }</p>`;
  } else if (kind === 'minor') {
    const items = minorStarsInBucket().filter((m) => passMeet(m.id));
    body = items.length
      ? `<div class="ziwei-codex-short-grid">${items.map((m) => renderShortMinorCard(m, chartHits, hasChart, view)).join('')}</div>`
      : `<p class="ziwei-codex-hint">${
          meet === 'favorite'
            ? '还没有收藏杂曜。点开详情☆可收藏。'
            : meet === 'collected'
              ? '还没有已收集的杂曜。'
              : '暂无条目。'
        }</p>`;
  } else {
    const scopedIds =
      meet === 'favorite'
        ? new Set(listCodexShenshaFlat().map((s) => s.id).filter((id) => favSet.has(id)))
        : meet === 'collected'
          ? new Set(
              listCodexShenshaFlat()
                .map((s) => s.id)
                .filter((id) => isAtlasCollected(id, chartHits)),
            )
          : new Set(listCodexShenshaFlat().map((s) => s.id));

    const themeScope = meet === 'all' ? undefined : scopedIds;
    const themeCounts = countShenshaByTheme(themeScope);
    const themeTotal = SHENSHA_THEME_ORDER.reduce((n, id) => n + (themeCounts[id] || 0), 0);
    const themeChips = `
      <div class="ziwei-shensha-theme-rail">
        <p class="ziwei-swipe-hint" aria-hidden="true">(← 左右滑动可查看更多 →)</p>
        <div class="ziwei-shensha-theme-chips is-scroll" role="group" aria-label="人生议题">
          <button type="button" class="ziwei-shensha-theme-chip ${shenshaTheme === 'all' ? 'is-on' : ''}" data-shensha-theme="all">全部议题 <em>${themeTotal}</em></button>
          ${SHENSHA_THEME_ORDER.map((id) => {
            const n = themeCounts[id];
            if (!n && meet !== 'all') return '';
            return `<button type="button" class="ziwei-shensha-theme-chip ${shenshaTheme === id ? 'is-on' : ''}" data-shensha-theme="${id}">
              ${escapeHtml(SHENSHA_THEME_META[id].title)}${n ? ` <em>${n}</em>` : ''}
            </button>`;
          }).join('')}
        </div>
      </div>`;

    const list = listCodexShenshaFlat().filter((s) => {
      if (!scopedIds.has(s.id)) return false;
      const meta = shenshaBrowseMeta(s.id);
      if (shenshaTheme !== 'all' && meta.theme !== shenshaTheme) return false;
      if (shenshaTone !== 'all' && meta.tone !== shenshaTone) return false;
      return true;
    });

    const byTheme = new Map<ShenshaThemeId, typeof list>();
    for (const s of list) {
      const t = shenshaBrowseMeta(s.id).theme;
      const arr = byTheme.get(t) ?? [];
      arr.push(s);
      byTheme.set(t, arr);
    }

    const cardHtml = (s: (typeof list)[number]): string => {
      const b = shenshaBrowseMeta(s.id);
      return renderShortShenshaCard(s, chartHits, hasChart, {
        tone: b.tone,
        themeLabel: SHENSHA_THEME_META[b.theme].title,
        view,
      });
    };

    const openSection = (tid: ShenshaThemeId, items: typeof list): string => {
      const meta = SHENSHA_THEME_META[tid];
      return `
        <section class="ziwei-codex-shensha-group is-open" aria-label="${escapeHtml(meta.title)}">
          <header class="ziwei-codex-shensha-head">
            <h3>${escapeHtml(meta.title)} <em>${items.length}</em></h3>
            <p>${escapeHtml(meta.blurb)}</p>
          </header>
          <div class="ziwei-codex-short-grid">${items.map(cardHtml).join('')}</div>
        </section>`;
    };

    const foldSection = (tid: ShenshaThemeId, items: typeof list): string => {
      const meta = SHENSHA_THEME_META[tid];
      return `
        <details class="ziwei-codex-shensha-group is-fold">
          <summary class="ziwei-codex-shensha-head is-fold-summary">
            <h3>${escapeHtml(meta.title)} <em>${items.length}</em></h3>
            <p>${escapeHtml(meta.blurb)}</p>
            <span class="ziwei-codex-shensha-fold-hint" aria-hidden="true"></span>
          </summary>
          <div class="ziwei-codex-short-grid">${items.map(cardHtml).join('')}</div>
        </details>`;
    };

    const sectionsHtml =
      shenshaTheme === 'all'
        ? (() => {
            const openParts: string[] = [];
            const foldParts: string[] = [];
            const flowItems: typeof list = [];
            for (const tid of SHENSHA_THEME_ORDER) {
              const items = byTheme.get(tid);
              if (!items?.length) continue;
              const pin = (SHENSHA_THEME_PIN_OPEN as readonly string[]).includes(tid);
              if (pin || items.length >= SHENSHA_THEME_OPEN_MIN) {
                openParts.push(openSection(tid, items));
              } else if (items.length === 1) {
                flowItems.push(...items);
              } else {
                foldParts.push(foldSection(tid, items));
              }
            }
            const flowHtml = flowItems.length
              ? `
        <section class="ziwei-codex-shensha-group is-flow" aria-label="其余议题">
          <header class="ziwei-codex-shensha-head is-flow-head">
            <h3>其余议题 <em>${flowItems.length}</em></h3>
            <p>条目较少，顺延浏览 · 也可用上方胶囊直达</p>
          </header>
          <div class="ziwei-codex-short-grid is-flow-grid">${flowItems.map(cardHtml).join('')}</div>
          <p class="ziwei-codex-hint">病、青龙、亡神、大耗等均在词库；若未出现在本列表，请切上方议题胶囊或「全部」，或回图鉴神煞查完整十二神。</p>
        </section>`
              : '';
            return `${openParts.join('')}${foldParts.join('')}${flowHtml}`;
          })()
        : `<div class="ziwei-codex-short-grid">${list.map(cardHtml).join('')}</div>`;

    const empty =
      list.length === 0
        ? `<p class="ziwei-codex-hint">${
            meet === 'favorite'
              ? '还没有收藏神煞。点开详情☆可收藏。'
              : meet === 'collected'
                ? hasChart
                  ? '这盘还没有已收集的神煞色调，可切「全部」浏览。'
                  : '排盘后，已收集会列出盘上的神煞色调。'
                : shenshaTone !== 'all'
                  ? '这个议题下没有该色调条目，换一个色调或议题试试。'
                  : '这个议题下暂时没有条目，换一个试试。'
          }</p>`
        : '';

    const toneCounts = countShenshaByTone({
      ids: scopedIds,
      theme: shenshaTheme,
    });
    const toneTotal = SHENSHA_TONE_ORDER.reduce((n, id) => n + (toneCounts[id] || 0), 0) || 1;
    const toneDots: Record<ShenshaToneId, string> = {
      support: '🟢',
      neutral: '⚪',
      caution: '🔴',
    };
    /** 色调总览：图例 + 比例条（可点筛选） */
    const toneChips = `
      <div class="ziwei-shensha-tone-overview" role="group" aria-label="色调筛选">
        <p class="ziwei-shensha-tone-caption">色调总览：</p>
        <div class="ziwei-shensha-tone-legend is-pipe">
          ${SHENSHA_TONE_ORDER.map((id, i) => {
            const n = toneCounts[id] ?? 0;
            const sep = i > 0 ? `<span class="ziwei-shensha-tone-pipe" aria-hidden="true">|</span>` : '';
            return `${sep}<button type="button" class="ziwei-shensha-tone-stat is-tone-${id} ${shenshaTone === id ? 'is-on' : ''}" data-shensha-tone="${id}">
              <span aria-hidden="true">${toneDots[id]}</span> ${escapeHtml(SHENSHA_TONE_META[id].short)} <em>${n}</em> 颗
            </button>`;
          }).join('')}
          <span class="ziwei-shensha-tone-pipe" aria-hidden="true">|</span>
          <button type="button" class="ziwei-shensha-tone-stat is-all ${shenshaTone === 'all' ? 'is-on' : ''}" data-shensha-tone="all">全部</button>
        </div>
        <div class="ziwei-shensha-tone-bar" aria-hidden="true">
          ${SHENSHA_TONE_ORDER.map((id) => {
            const n = toneCounts[id] ?? 0;
            const pct = Math.max(0, Math.round((n / toneTotal) * 100));
            return pct ? `<i class="is-tone-${id}" style="width:${pct}%"></i>` : '';
          }).join('')}
        </div>
      </div>`;

    const nestHighlight = opts.nestMeetHighlight !== false;
    const collectedForHighlight = listCodexShenshaFlat()
      .map((s) => s.id)
      .filter((id) => isAtlasCollected(id, chartHits));
    const pulsePanel =
      nestHighlight && opts.mode === 'mine' && meet === 'collected'
        ? buildShenshaMeetPulsePanel(collectedForHighlight)
        : null;
    const highlightHtml =
      nestHighlight && opts.mode === 'mine' && meet === 'collected'
        ? renderShenshaMeetHighlightHtml(pulsePanel, {
            emptyHint: hasChart
              ? '收集神煞后，这里会用阶段卡与脉搏看板总揽你的相遇底色。'
              : '排盘并收集神煞后，这里会出现你的相遇高光。',
            activeTheme: shenshaTheme === 'all' ? 'all' : shenshaTheme,
          })
        : '';

    body = `
      ${highlightHtml}
      ${themeChips}
      ${toneChips}
      ${empty}
      ${sectionsHtml}
      <section class="ziwei-codex-shensha-group ziwei-codex-school-foot" aria-label="流派对照">
        <p class="ziwei-codex-hint">若对照他书/他盘神煞名目有出入，可看流派差异（非入门必读）。</p>
        <button type="button" class="ziwei-codex-short is-shensha is-school" data-open-contrast="overview">
          <span class="ziwei-codex-short-name">通行派 × 中州派</span>
          <span class="ziwei-codex-short-kicker">可选｜流派对照</span>
          <span class="ziwei-codex-short-keys">${escapeHtml(SCHOOL_OVERVIEW.oneLiner)}</span>
          <span class="ziwei-codex-short-cta">查看对照表 →</span>
        </button>
      </section>`;
  }

  const hint =
    opts.mode === 'atlas'
      ? escapeHtml(STAR_KIND_META[kind].blurb)
      : `${escapeHtml(STAR_MEET_META[meet].blurb)} · ${escapeHtml(STAR_KIND_META[kind].blurb)}`;

  return `
    <p class="ziwei-codex-hint">${hint}</p>
    ${kindChips}
    ${body}`;
}


function renderPalacesCatalog(bucket: PalaceBucket, view: ZiweiChartView | null = null): string {
  const tabs = underlineSubTabsHtml(
    '宫位分类',
    [
      { id: 'twelve', label: '十二宫', attr: 'data-palace-bucket="twelve"' },
      { id: 'geju', label: '格局名录', attr: 'data-palace-bucket="geju"' },
      { id: 'read', label: '读宫规则', attr: 'data-palace-bucket="read"' },
    ],
    bucket,
  );

  if (bucket === 'twelve') {
    return `
      ${tabs}
      <p class="ziwei-codex-hint">十二宫 · 人生领域；点开看核心问题与落星读法</p>
      <div class="ziwei-codex-short-grid">
        ${PALACE_LORE.map(
          (p) => `
          <button type="button" class="ziwei-codex-short" data-open-palace="${escapeHtml(p.id)}">
            <span class="ziwei-codex-short-name">${escapeHtml(p.title)}</span>
            <span class="ziwei-codex-short-kicker">十二宫｜${escapeHtml(p.hint)}</span>
            <span class="ziwei-codex-short-keys">${escapeHtml(p.keywords.slice(0, 3).join(' · '))}</span>
            <span class="ziwei-codex-short-cta">查看完整图鉴 →</span>
          </button>`,
        ).join('')}
      </div>
      <div class="ziwei-palace-mode-tabs" role="group" aria-label="回命盘">
        <button type="button" class="ziwei-palace-mode-tab" data-goto-chart="mode=chart">本命盘</button>
        <button type="button" class="ziwei-palace-mode-tab" data-goto-chart="mode=chart&year=${new Date().getFullYear()}">流年盘</button>
      </div>`;
  }

  if (bucket === 'geju') {
    const steps = listComboJourney(view);
    const classic = steps.filter((s) => s.combo.family === 'classic-ge');
    const ji = classic.filter((s) => (s.combo.tone ?? 'ji') !== 'xiong');
    const xiong = classic.filter((s) => s.combo.tone === 'xiong');
    const combos = steps.filter((s) => s.combo.family === 'star-combo');
    return `
      ${tabs}
      <p class="ziwei-codex-hint">完整格局词库 · ${classic.length} 古典格 + ${combos.length} 星曜组合。点开看释义；「我的格局」只显示盘上已成格的。</p>
      <h3 class="ziwei-ge-section-title">古典吉格 · ${ji.length}</h3>
      <div class="ziwei-journey-path">${ji.map(renderJourneyStepCard).join('')}</div>
      <h3 class="ziwei-ge-section-title">古典凶格 / 警示 · ${xiong.length}</h3>
      <div class="ziwei-journey-path">${xiong.map(renderJourneyStepCard).join('')}</div>
      <h3 class="ziwei-ge-section-title">星曜组合 · ${combos.length}</h3>
      <div class="ziwei-journey-path">${combos.map(renderJourneyStepCard).join('')}</div>`;
  }

  // read：原「三方四正」「对宫」合并（词条本身在命盘图层更完整）
  const sanfang = getGlossaryByName('三方四正');
  const dui = getGlossaryByName('对宫');
  return `
    ${tabs}
    <p class="ziwei-codex-hint">${escapeHtml(PALACE_BUCKET_META.read.blurb)} · 读宫镜头词条；具体到你的盘请回命盘点宫看动态标线。</p>
    <div class="ziwei-codex-short-grid">
      <button type="button" class="ziwei-codex-short is-lit" data-open-term="三方四正">
        <span class="ziwei-codex-short-name">三方四正</span>
        <span class="ziwei-codex-short-kicker">宫位关系｜读宫主镜头</span>
        <span class="ziwei-codex-short-keys">${escapeHtml(sanfang?.shortMeaning ?? '')}</span>
        <span class="ziwei-codex-short-cta">查看完整图鉴 →</span>
      </button>
      <button type="button" class="ziwei-codex-short is-lit" data-open-term="对宫">
        <span class="ziwei-codex-short-name">对宫</span>
        <span class="ziwei-codex-short-kicker">宫位关系｜正对对照</span>
        <span class="ziwei-codex-short-keys">${escapeHtml(dui?.shortMeaning ?? '')}</span>
        <span class="ziwei-codex-short-cta">查看完整图鉴 →</span>
      </button>
    </div>
    <p class="ziwei-codex-hint">回完整命盘点宫，会按当前宫动态标出对宫与三合。</p>`;
}

function renderMutagenHitCard(h: CodexMutagenHit): string {
  const title = mutagenHitTitle(h);
  const chartQs = new URLSearchParams({ mode: 'chart' });
  if (h.palace) chartQs.set('palace', h.palace);
  if (h.star) chartQs.set('star', h.star);
  return `
    <div class="ziwei-codex-short is-lit ziwei-mutagen-hit">
      <span class="ziwei-codex-short-name">${escapeHtml(title)}</span>
      <span class="ziwei-codex-short-kicker">${escapeHtml(h.scopeLabel)}｜${escapeHtml(h.hint)}</span>
      <span class="ziwei-codex-short-keys">${escapeHtml(h.label)} 落在 ${escapeHtml(h.star)}${
        h.palace ? ` · ${escapeHtml(h.palace)}` : ''
      }</span>
      <span class="ziwei-mutagen-hit-actions">
        <button type="button" class="ziwei-inline-link" data-open-term="${escapeHtml(h.label)}">看词条 →</button>
        <button type="button" class="ziwei-inline-link" data-goto-chart="${escapeHtml(chartQs.toString())}">看命盘 →</button>
      </span>
    </div>`;
}

function renderMutagenCatalog(
  bucket: MutagenBucket,
  map: Map<string, { lastPalace?: string }>,
  chartHits: Map<string, import('../ziwei/codex-collect.ts').ChartStarHit>,
  hasChart: boolean,
  person: PersonProfile,
  view: ZiweiChartView | null,
): string {
  const tabs = underlineSubTabsHtml(
    '四化分类',
    MUTAGEN_BUCKETS.map((id) => ({
      id,
      label: MUTAGEN_BUCKET_META[id].title,
      attr: `data-mutagen-bucket="${id}"`,
    })),
    bucket,
  );

  if (bucket === 'stars') {
    return `
      ${tabs}
      <p class="ziwei-codex-hint">禄权科忌 · 催化状态，不是第四套主星</p>
      <div class="ziwei-codex-short-grid">${mutagenStarCards()
        .map((s) => renderShortStarCard(s, map, chartHits, hasChart, view))
        .join('')}</div>`;
  }

  const term = bucket === 'birth' ? '生年四化' : '运限四化';
  const g = getGlossaryByName(term);
  const glossaryCard = `
    <button type="button" class="ziwei-codex-short is-lit" data-open-term="${term}">
      <span class="ziwei-codex-short-name">${escapeHtml(term)}</span>
      <span class="ziwei-codex-short-kicker">${escapeHtml(MUTAGEN_BUCKET_META[bucket].blurb)}</span>
      <span class="ziwei-codex-short-keys">${escapeHtml(g?.shortMeaning ?? '')}</span>
      <span class="ziwei-codex-short-cta">总述词条 →</span>
    </button>`;

  if (!view || !hasChart) {
    return `
      ${tabs}
      ${glossaryCard}
      <p class="ziwei-codex-hint">排盘后这里会列出你盘上的四化落点（化禄 · 星 · 宫）。</p>`;
  }

  if (bucket === 'birth') {
    const hits = listBirthMutagenHits(view);
    return `
      ${tabs}
      <p class="ziwei-codex-hint">你的本命四化 · 点词条看含义，点命盘看落宫</p>
      ${glossaryCard}
      <div class="ziwei-codex-short-grid" style="margin-top:10px">
        ${
          hits.length
            ? hits.map(renderMutagenHitCard).join('')
            : `<p class="ziwei-codex-hint">本盘暂未读出生年四化落点，可先打开「四化星」看禄权科忌。</p>`
        }
      </div>`;
  }

  const { year, decade, yearNum } = listLimitMutagenHits(person, view);
  return `
    ${tabs}
    <p class="ziwei-codex-hint">运限叠在生年之上 · ${yearNum}流年与当前大限</p>
    ${glossaryCard}
    <h3 class="ziwei-palace-chips-title">${yearNum}流年四化</h3>
    <div class="ziwei-codex-short-grid">
      ${
        year.length
          ? year.map(renderMutagenHitCard).join('')
          : `<p class="ziwei-codex-hint">今年流年四化暂未排出。</p>`
      }
    </div>
    <h3 class="ziwei-palace-chips-title">大限四化</h3>
    <div class="ziwei-codex-short-grid">
      ${
        decade.length
          ? decade.map(renderMutagenHitCard).join('')
          : `<p class="ziwei-codex-hint">当前大限四化暂未排出（童限/未起运时可能为空）。</p>`
      }
    </div>`;
}

function renderStructureCatalog(bucket: StructureBucket): string {
  const tabs = underlineSubTabsHtml(
    '命盘规则分类',
    STRUCTURE_BUCKETS.map((id) => ({
      id,
      label: STRUCTURE_BUCKET_META[id].title,
      attr: `data-structure-bucket="${id}"`,
    })),
    bucket,
  );

  if (bucket === 'soul') {
    return `
      ${tabs}
      <div class="ziwei-codex-short-grid">
        ${['命主', '身主', '身宫']
          .map((term) => {
            const g = getGlossaryByName(term);
            return `
            <button type="button" class="ziwei-codex-short" data-open-term="${term}">
              <span class="ziwei-codex-short-name">${escapeHtml(term)}</span>
              <span class="ziwei-codex-short-kicker">规则｜指针</span>
              <span class="ziwei-codex-short-keys">${escapeHtml(g?.shortMeaning ?? '')}</span>
              <span class="ziwei-codex-short-cta">查看完整图鉴 →</span>
            </button>`;
          })
          .join('')}
      </div>`;
  }

  if (bucket === 'limits') {
    return `
      ${tabs}
      <div class="ziwei-codex-short-grid">
        ${['大限', '流年', '流月']
          .map((term) => {
            const g = getGlossaryByName(term);
            return `
            <button type="button" class="ziwei-codex-short" data-open-term="${term}">
              <span class="ziwei-codex-short-name">${escapeHtml(term)}</span>
              <span class="ziwei-codex-short-kicker">时间叠层</span>
              <span class="ziwei-codex-short-keys">${escapeHtml(g?.shortMeaning ?? '')}</span>
              <span class="ziwei-codex-short-cta">查看完整图鉴 →</span>
            </button>`;
          })
          .join('')}
      </div>`;
  }

  if (bucket === 'brightness') {
    const levels = ['庙', '旺', '得', '利', '平', '陷'];
    return `
      ${tabs}
      <button type="button" class="ziwei-codex-short is-lit" data-open-term="庙旺落陷">
        <span class="ziwei-codex-short-name">庙旺落陷</span>
        <span class="ziwei-codex-short-kicker">发挥亮度总述</span>
        <span class="ziwei-codex-short-keys">${escapeHtml(getGlossaryByName('庙旺落陷')?.shortMeaning ?? '')}</span>
        <span class="ziwei-codex-short-cta">查看完整图鉴 →</span>
      </button>
      <p class="ziwei-codex-hint"><button type="button" class="ziwei-inline-link" data-goto-luoxian>🔍 看看我命盘里哪颗星落陷了？</button></p>
      <div class="ziwei-codex-short-grid" style="margin-top:10px">
        ${levels
          .map((term) => {
            const g = getGlossaryByName(term);
            return `
            <button type="button" class="ziwei-codex-short" data-open-term="${term}">
              <span class="ziwei-codex-short-name">${escapeHtml(term)}</span>
              <span class="ziwei-codex-short-kicker">亮度</span>
              <span class="ziwei-codex-short-keys">${escapeHtml(g?.shortMeaning ?? '')}</span>
              <span class="ziwei-codex-short-cta">查看 →</span>
            </button>`;
          })
          .join('')}
      </div>`;
  }

  const term = STRUCTURE_BUCKET_META[bucket].term ?? '五行局';
  const g = getGlossaryByName(term);
  return `
    ${tabs}
    <button type="button" class="ziwei-codex-short is-lit" data-open-term="${term}">
      <span class="ziwei-codex-short-name">${escapeHtml(term)}</span>
      <span class="ziwei-codex-short-kicker">${escapeHtml(STRUCTURE_BUCKET_META[bucket].blurb)}</span>
      <span class="ziwei-codex-short-keys">${escapeHtml(g?.shortMeaning ?? '')}</span>
      <span class="ziwei-codex-short-cta">查看完整图鉴 →</span>
    </button>`;
}

function atlasTopTabsHtml(active: CatalogSection | null): string {
  return `
    <div class="ziwei-atlas-top-tabs" role="tablist" aria-label="图鉴分类">
      ${ATLAS_TOP_TABS.map(
        (L) => `
      <button type="button" class="ziwei-atlas-tab ${active === L.id ? 'is-on' : ''}" data-layer="${L.id}">
        ${escapeHtml(L.title)}
      </button>`,
      ).join('')}
    </div>`;
}

/**
 * 多级吸顶：顶栏四大分类（宫位格局/星曜/四化断事/命盘规则）始终完整显示；
 * 其下上级收成面包屑，当前级完整横滑。点面包屑可临时展开改选。
 */
function assembleZiweiStickyNav(page: HTMLElement): void {
  const layer = page.querySelector<HTMLElement>('.ziwei-atlas-top-tabs');
  if (!layer || layer.closest('.ziwei-codex-sticky-stack')) return;

  const stack = document.createElement('div');
  stack.className = 'ziwei-codex-sticky-stack';
  stack.setAttribute('role', 'navigation');
  stack.setAttribute('aria-label', '图鉴分级导航');
  layer.replaceWith(stack);
  stack.appendChild(layer);
  layer.classList.add('is-pinned-level');

  const hoist = (sel: string, level: string): void => {
    const el = page.querySelector(sel);
    if (!el || el.closest('.ziwei-codex-sticky-stack')) return;
    const row = document.createElement('div');
    row.className = `ziwei-codex-sticky-row is-${level}`;
    el.replaceWith(row);
    row.appendChild(el);
    stack.appendChild(row);
  };

  hoist('.ziwei-sub-underline-tabs', 'l2');
  hoist('.ziwei-meet-underline-tabs', 'l2');
  hoist('.ziwei-star-kind-rail', 'l3');
  hoist('.ziwei-shensha-theme-rail', 'l4');
  hoist('.ziwei-shensha-tone-overview', 'l5');
  hoist('.ziwei-codex-tabs', 'l2');

  const navSel =
    '.ziwei-sub-underline-tabs, .ziwei-meet-underline-tabs, .ziwei-codex-tabs, .ziwei-star-kind-chips, .ziwei-shensha-theme-chips, .ziwei-shensha-tone-overview';

  const scrollInto = (row: HTMLElement): void => {
    const scroller =
      row.querySelector<HTMLElement>('.ziwei-star-kind-chips') ??
      row.querySelector<HTMLElement>('.ziwei-shensha-theme-chips') ??
      row.querySelector<HTMLElement>(navSel) ??
      (row.classList.contains('ziwei-atlas-top-tabs') ? row : null);
    if (!scroller) return;
    if (
      scroller.classList.contains('ziwei-atlas-top-tabs') ||
      scroller.classList.contains('ziwei-shensha-tone-overview') ||
      scroller.classList.contains('is-fullrow')
    ) {
      return;
    }
    ensureScrollEndSpacer(scroller);
    scrollChildIntoScroller(
      scroller,
      scroller.querySelector('.is-on, .ziwei-atlas-tab.is-on, .ziwei-sub-underline-tab.is-on'),
    );
  };

  scrollInto(layer);

  /** 顶栏以下的分级才参与面包屑折叠 */
  const rest = ([...stack.children] as HTMLElement[]).filter((el) => el !== layer);
  if (rest.length <= 1) {
    rest.forEach((row) => {
      row.classList.add('is-current-level');
      scrollInto(row);
    });
    return;
  }

  /** 神煞：议题轨 + 色调总览两级常显；上级收成面包屑 */
  const hasTone = Boolean(stack.querySelector('.ziwei-shensha-tone-overview'));
  const currentCount = hasTone ? 2 : 1;
  const parents = rest.slice(0, -currentCount);
  const currents = rest.slice(-currentCount);
  currents.forEach((row) => row.classList.add('is-current-level'));

  if (!parents.length) {
    currents.forEach(scrollInto);
    return;
  }

  const crumbLabel = (row: HTMLElement): string => {
    const on =
      row.querySelector<HTMLElement>('.ziwei-atlas-tab.is-on') ||
      row.querySelector<HTMLElement>('.ziwei-sub-underline-tab.is-on') ||
      row.querySelector<HTMLElement>('.ziwei-meet-underline-tab.is-on .ziwei-meet-underline-label') ||
      row.querySelector<HTMLElement>('.ziwei-codex-tab.is-on') ||
      row.querySelector<HTMLElement>('.ziwei-star-kind-chip.is-on') ||
      row.querySelector<HTMLElement>('.ziwei-star-kind-tab.is-on') ||
      row.querySelector<HTMLElement>('.ziwei-shensha-tone-stat.is-on') ||
      row.querySelector<HTMLElement>('.ziwei-shensha-theme-chip.is-on');
    if (!on) return '…';
    const clone = on.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('em, span.ziwei-meet-underline-ico').forEach((n) => n.remove());
    return (clone.textContent || '').replace(/\s+/g, ' ').trim() || '…';
  };

  const trail = document.createElement('div');
  trail.className = 'ziwei-codex-crumb-trail';
  trail.setAttribute('aria-label', '上级路径');
  parents.forEach((row, i) => {
    row.classList.add('is-parent-level');
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'ziwei-codex-crumb-sep';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '›';
      trail.appendChild(sep);
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ziwei-codex-crumb';
    btn.dataset.expandLevel = String(i);
    btn.textContent = crumbLabel(row);
    btn.title = '点此展开改选';
    trail.appendChild(btn);
  });
  /** 面包屑插在顶栏下方，不挡四大分类 */
  stack.insertBefore(trail, layer.nextSibling);

  const collapseParents = (): void => {
    parents.forEach((r) => r.classList.remove('is-expanded'));
    trail.querySelectorAll('.ziwei-codex-crumb').forEach((c) => c.classList.remove('is-open'));
  };

  trail.querySelectorAll<HTMLButtonElement>('.ziwei-codex-crumb').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.expandLevel);
      const row = parents[idx];
      if (!row) return;
      const already = row.classList.contains('is-expanded');
      collapseParents();
      if (already) return;
      row.classList.add('is-expanded');
      btn.classList.add('is-open');
      scrollInto(row);
    });
  });

  currents.forEach(scrollInto);
}

function ensureScrollEndSpacer(scroller: HTMLElement): void {
  if (scroller.querySelector(':scope > .ziwei-sticky-end-spacer')) return;
  const spacer = document.createElement('span');
  spacer.className = 'ziwei-sticky-end-spacer';
  spacer.setAttribute('aria-hidden', 'true');
  scroller.appendChild(spacer);
}

function scrollChildIntoScroller(scroller: HTMLElement, child: Element | null): void {
  if (!(child instanceof HTMLElement)) return;
  const cRect = scroller.getBoundingClientRect();
  const tRect = child.getBoundingClientRect();
  scroller.scrollLeft += tRect.left - cRect.left - (cRect.width - tRect.width) / 2;
}

/** 落十二宫：左右箭头 + 鼠标拖拽；触摸仍走原生横向滑动 */
function bindPalaceChipRail(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-palace-chip-rail]').forEach((rail) => {
    const track = rail.querySelector<HTMLElement>('.ziwei-palace-chips');
    if (!track) return;
    const prev = rail.querySelector<HTMLButtonElement>('[data-palace-chip-nav="-1"]');
    const next = rail.querySelector<HTMLButtonElement>('[data-palace-chip-nav="1"]');

    const syncNav = () => {
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      const atStart = track.scrollLeft <= 2;
      const atEnd = track.scrollLeft >= max - 2;
      if (prev) prev.disabled = max <= 0 || atStart;
      if (next) next.disabled = max <= 0 || atEnd;
    };

    const step = () => Math.max(120, Math.round(track.clientWidth * 0.72));

    prev?.addEventListener('click', () => {
      track.scrollBy({ left: -step(), behavior: 'smooth' });
    });
    next?.addEventListener('click', () => {
      track.scrollBy({ left: step(), behavior: 'smooth' });
    });
    track.addEventListener('scroll', syncNav, { passive: true });

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.classList.add('is-dragging');
      try {
        track.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    });
    track.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startScroll - dx;
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      if (!moved) return;
      const suppress = (ev: Event) => {
        ev.preventDefault();
        ev.stopPropagation();
        track.removeEventListener('click', suppress, true);
      };
      track.addEventListener('click', suppress, true);
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    scrollChildIntoScroller(track, track.querySelector('.ziwei-palace-chip.is-on'));
    requestAnimationFrame(() => {
      syncNav();
      requestAnimationFrame(syncNav);
    });
  });
}

export function renderZiweiCodex(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page ziwei-page ziwei-codex-page';
  mountEnvBanner(page);
  root.appendChild(page);

  let layer: CodexLayer = queryLayer();
  const rawBucket = queryParam('bucket') || '';
  let starKind: StarKindFilter = STAR_BUCKETS.includes(rawBucket as StarBucket)
    ? starBucketToKind(rawBucket as StarBucket)
    : 'major';
  let starMeet: StarMeetFilter = parseStarMeet(queryParam('meet'));
  let meetHub: MeetHubTab = parseMeetHub(queryParam('hub'));
  if (queryParam('layer') === 'journey') meetHub = 'combos';
  let palaceBucket: PalaceBucket = normalizePalaceBucket(
    rawBucket === 'twelve' ||
      rawBucket === 'geju' ||
      rawBucket === 'read' ||
      rawBucket === 'sanfang' ||
      rawBucket === 'dui'
      ? rawBucket
      : 'twelve',
  );
  let mutagenBucket: MutagenBucket = MUTAGEN_BUCKETS.includes(rawBucket as MutagenBucket)
    ? (rawBucket as MutagenBucket)
    : 'stars';
  let structureBucket: StructureBucket = STRUCTURE_BUCKETS.includes(rawBucket as StructureBucket)
    ? (rawBucket as StructureBucket)
    : 'brightness';

  let detailId = queryParam('star');
  let palaceId = queryParam('palace');
  let comboId = queryParam('combo');
  let termId = queryParam('term');
  let minorId = queryParam('minor');
  let shenshaId = queryParam('shensha');
  let contrastId = queryParam('contrast');
  let detailTab: DetailTabId = 'portrait';
  let palaceFocus = '';
  let shenshaTheme: ShenshaThemeId | 'all' = 'all';
  let shenshaTone: ShenshaToneId | 'all' = 'all';
  /** 从「我的相遇」点进详情后，关闭详情回到相遇页 */
  let returnToMeet = false;

  function chartContext(): {
    chartHits: ReturnType<typeof indexChartStars>;
    hasChart: boolean;
    personId: string;
    person: PersonProfile;
    view: ZiweiChartView | null;
  } {
    const person = getActivePerson();
    const view = castZiweiChart(person, {
      intent: 'map',
      year: new Date().getFullYear(),
    });
    if ('error' in view) {
      return {
        chartHits: new Map(),
        hasChart: false,
        personId: person.id,
        person,
        view: null,
      };
    }
    return {
      chartHits: indexChartStars(view),
      hasChart: true,
      personId: person.id,
      person,
      view,
    };
  }

  if (!queryParam('meet') && chartContext().hasChart) starMeet = 'collected';

  function bindLuoxianJump(): void {
    page.querySelector('[data-goto-luoxian]')?.addEventListener('click', () => {
      navigate('/ziwei/reading?mode=chart&status=%E9%99%B7');
    });
  }

  function bindChartJumps(): void {
    page.querySelectorAll<HTMLButtonElement>('[data-goto-chart]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const qs = btn.dataset.gotoChart ?? 'mode=chart';
        navigate(`/ziwei/reading?${qs}`);
      });
    });
  }

  const activeAtlasLabel = (): string =>
    detailId ||
    palaceId ||
    comboId ||
    termId ||
    minorId ||
    shenshaId ||
    contrastId ||
    '';

  const disposeFloat = mountLabFloatActions(page, {
    system: 'ziwei',
    surface: 'atlas',
    atlasMode: true,
    answerConcept: answerZiweiConcept,
    onNotes: () => {
      const label = activeAtlasLabel();
      openLabNotesSheet({
        system: 'ziwei',
        surface: 'atlas',
        context: label ? `图鉴 · ${label}` : '紫微图鉴',
      });
    },
    draftShare: () => {
      const label = activeAtlasLabel();
      return draftFromZiwei({
        headline: label ? `图鉴 · ${label}` : '紫微图鉴',
        question: '紫微图鉴',
        summary: label
          ? `正在对照「${label}」。`
          : '在紫微图鉴里对照星曜、宫位与神煞。',
      });
    },
    onDeep: () => {
      const label = activeAtlasLabel();
      openLabDeepSheet({
        system: 'ziwei',
        title: label ? `追问 · ${label}` : '图鉴追问',
        initialTab: 'ask',
        seedQuery: label || undefined,
        answerConcept: answerZiweiConcept,
        onMiss: (q) => {
          void recordZiweiConceptMiss(q);
        },
        deepHint: '结合图鉴词条追问；概念优先本地词库。',
      });
    },
  });

  const entries = () => new Map(listCodexEntries().map((e) => [e.starId, e]));

  function clearDetailExcept(keep: 'star' | 'palace' | 'combo' | 'term' | 'minor' | 'shensha' | 'contrast'): void {
    if (keep !== 'star') detailId = '';
    if (keep !== 'palace') palaceId = '';
    if (keep !== 'combo') comboId = '';
    if (keep !== 'term') termId = '';
    if (keep !== 'minor') minorId = '';
    if (keep !== 'shensha') shenshaId = '';
    if (keep !== 'contrast') contrastId = '';
  }

  function scrubLegacyMeetSheets(): void {
    document.querySelectorAll('.ziwei-meet-sheet').forEach((el) => el.remove());
  }

  function leaveDetailToCatalog(): void {
    detailId = '';
    palaceId = '';
    comboId = '';
    termId = '';
    minorId = '';
    shenshaId = '';
    contrastId = '';
    detailTab = 'portrait';
    palaceFocus = '';
    if (returnToMeet) {
      returnToMeet = false;
      layer = 'meet';
      setUrl({ layer: 'meet', hub: meetHub });
      paint();
      return;
    }
    if (layer === 'palaces' || layer === 'mutagen' || layer === 'structure') {
      setUrl({ layer });
      paint();
      return;
    }
    layer = 'stars';
    setUrl({ layer: 'stars', bucket: starKindToBucket(starKind), meet: starMeet });
    paint();
  }

  function bindDetailUpBack(): void {
    page.querySelectorAll('.life-back, [data-close-detail], [data-close-sub]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        leaveDetailToCatalog();
      });
    });
  }

  /** 四大顶栏：随时可跳回最大分类 */
  function bindAtlasTopTabs(): void {
    page.querySelectorAll<HTMLButtonElement>('.ziwei-atlas-top-tabs [data-layer]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = (btn.dataset.layer as CodexLayer) || 'stars';
        if (next !== 'stars' && next !== 'palaces' && next !== 'mutagen' && next !== 'structure') return;
        returnToMeet = false;
        layer = next;
        detailId = '';
        palaceId = '';
        comboId = '';
        termId = '';
        minorId = '';
        shenshaId = '';
        contrastId = '';
        const bucket =
          layer === 'stars'
            ? starKindToBucket(starKind)
            : layer === 'palaces'
              ? palaceBucket
              : layer === 'mutagen'
                ? mutagenBucket
                : structureBucket;
        setUrl({ layer, bucket, meet: 'all' });
        paint();
      });
    });
  }

  function openDetailFromMeet(kind: 'star' | 'minor' | 'shensha' | 'contrast' | 'palace' | 'combo' | 'term'): void {
    if (layer === 'meet') returnToMeet = true;
    scrubLegacyMeetSheets();
    if (kind === 'star' || kind === 'minor' || kind === 'shensha' || kind === 'contrast') {
      layer = 'stars';
    } else if (kind === 'palace') {
      layer = 'palaces';
    }
  }

  function bindMeetPageControls(root: ParentNode): void {
    const applyMeetKind = (next: StarKindFilter, theme?: string, tone?: string) => {
      starKind = next;
      if (next !== 'shensha') {
        shenshaTone = 'all';
        shenshaTheme = 'all';
      } else {
        if (theme === 'all' || (theme && (SHENSHA_THEME_ORDER as string[]).includes(theme))) {
          shenshaTheme = theme as ShenshaThemeId | 'all';
        }
        if (tone === 'all' || (tone && (SHENSHA_TONE_ORDER as string[]).includes(tone))) {
          shenshaTone = tone as ShenshaToneId | 'all';
        }
      }
      setUrl({
        layer: 'meet',
        hub: meetHub,
        bucket: starKindToBucket(starKind),
      });
      paint();
      requestAnimationFrame(() => {
        page
          .querySelector('.ziwei-star-kind-rail, .ziwei-star-kind-chips')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    root.querySelectorAll<HTMLButtonElement>('[data-meet-hub]').forEach((btn) => {
      btn.addEventListener('click', () => {
        meetHub = parseMeetHub(btn.dataset.meetHub);
        setUrl({ layer: 'meet', hub: meetHub, bucket: starKindToBucket(starKind) });
        paint();
      });
    });
    root.querySelectorAll<HTMLButtonElement>('[data-bucket-guide]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openStarBucketGuideNotes();
      });
    });
    root.querySelector('[data-back-meet]')?.addEventListener('click', () => {
      returnToMeet = false;
      layer = 'stars';
      setUrl({ layer: 'stars', bucket: starKindToBucket(starKind), meet: 'all' });
      paint();
    });
    root.querySelectorAll<HTMLButtonElement>('[data-meet-kind]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.meetKind as StarKindFilter;
        if (!(STAR_KIND_ORDER as string[]).includes(next)) return;
        applyMeetKind(next, btn.dataset.shenshaTheme, btn.dataset.shenshaTone);
      });
    });
    root.querySelectorAll<HTMLButtonElement>('[data-star-kind]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.starKind as StarKindFilter;
        if (!(STAR_KIND_ORDER as string[]).includes(next)) return;
        applyMeetKind(next);
      });
    });
    root.querySelectorAll<HTMLButtonElement>('[data-shensha-theme]').forEach((btn) => {
      if (btn.dataset.meetKind) return; // already handled via meet-kind
      btn.addEventListener('click', () => {
        const next = btn.dataset.shenshaTheme ?? 'all';
        if (next === 'all' || (SHENSHA_THEME_ORDER as string[]).includes(next)) {
          starKind = 'shensha';
          shenshaTheme =
            next !== 'all' && shenshaTheme === next
              ? 'all'
              : (next as ShenshaThemeId | 'all');
          setUrl({ layer: 'meet', hub: meetHub, bucket: 'shensha' });
          paint();
        }
      });
    });
    root.querySelectorAll<HTMLButtonElement>('[data-shensha-tone]').forEach((btn) => {
      if (btn.dataset.meetKind) return;
      btn.addEventListener('click', () => {
        const next = btn.dataset.shenshaTone ?? 'all';
        if (next === 'all' || (SHENSHA_TONE_ORDER as string[]).includes(next)) {
          starKind = 'shensha';
          shenshaTone = next as ShenshaToneId | 'all';
          setUrl({ layer: 'meet', hub: meetHub, bucket: 'shensha' });
          paint();
        }
      });
    });
    root.querySelectorAll<HTMLButtonElement>('[data-goto-atlas-kind]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = (btn.dataset.gotoAtlasKind as StarKindFilter) || starKind;
        const focusShensha = btn.dataset.gotoAtlasShensha?.trim() || '';
        returnToMeet = false;
        layer = 'stars';
        starKind = (STAR_KIND_ORDER as string[]).includes(next) ? next : 'major';
        if (focusShensha && getShenshaLore(focusShensha)) {
          shenshaId = focusShensha;
          clearDetailExcept('shensha');
          setUrl({
            layer: 'stars',
            bucket: starKindToBucket(starKind),
            meet: 'all',
            shensha: focusShensha,
          });
        } else {
          shenshaId = '';
          setUrl({ layer: 'stars', bucket: starKindToBucket(starKind), meet: 'all' });
        }
        paint();
      });
    });
  }

  function bindOpeners(root: ParentNode = page): void {
    if (root === page) {
      bindLuoxianJump();
      bindChartJumps();
    } else {
      root.querySelectorAll<HTMLButtonElement>('[data-goto-chart]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const qs = btn.dataset.gotoChart ?? 'mode=chart';
          navigate(`/ziwei/reading?${qs}`);
        });
      });
    }
    root.querySelectorAll<HTMLButtonElement>('[data-toggle-fav]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.toggleFav ?? '';
        if (!id) return;
        toggleZiweiCodexFavorite(id);
        paint();
      });
    });
    root.querySelectorAll<HTMLButtonElement>('[data-open-star]').forEach((btn) => {
      btn.addEventListener('click', () => {
        detailId = btn.dataset.openStar ?? '';
        detailTab = 'portrait';
        palaceFocus = '';
        const lore = getStarLore(detailId);
        if (lore?.category === 'major') starKind = 'major';
        else if ((LUCKY_STAR_IDS as readonly string[]).includes(detailId)) starKind = 'lucky';
        else if ((SHA_STAR_IDS as readonly string[]).includes(detailId)) starKind = 'sha';
        else starKind = 'aux';
        clearDetailExcept('star');
        openDetailFromMeet('star');
        setUrl({ layer: 'stars', star: detailId, bucket: starKindToBucket(starKind), meet: starMeet });
        paint();
      });
    });
    root.querySelectorAll<HTMLButtonElement>('[data-open-minor]').forEach((btn) => {
      btn.addEventListener('click', () => {
        minorId = btn.dataset.openMinor ?? '';
        clearDetailExcept('minor');
        openDetailFromMeet('minor');
        starKind = 'minor';
        setUrl({ layer: 'stars', minor: minorId, bucket: starKindToBucket(starKind), meet: starMeet });
        paint();
      });
    });
    root.querySelectorAll<HTMLButtonElement>('[data-open-shensha]').forEach((btn) => {
      btn.addEventListener('click', () => {
        shenshaId = btn.dataset.openShensha ?? '';
        clearDetailExcept('shensha');
        openDetailFromMeet('shensha');
        starKind = 'shensha';
        setUrl({ layer: 'stars', bucket: starKindToBucket(starKind), meet: starMeet, shensha: shenshaId });
        paint();
      });
    });
    root.querySelectorAll<HTMLButtonElement>('[data-open-contrast]').forEach((btn) => {
      btn.addEventListener('click', () => {
        contrastId = btn.dataset.openContrast ?? 'overview';
        clearDetailExcept('contrast');
        openDetailFromMeet('contrast');
        starKind = 'shensha';
        setUrl({ layer: 'stars', bucket: starKindToBucket(starKind), meet: starMeet, contrast: contrastId });
        paint();
      });
    });
    root.querySelectorAll<HTMLButtonElement>('[data-open-palace]').forEach((btn) => {
      btn.addEventListener('click', () => {
        palaceId = btn.dataset.openPalace ?? '';
        clearDetailExcept('palace');
        openDetailFromMeet('palace');
        setUrl({ layer: 'palaces', palace: palaceId });
        paint();
      });
    });
    root.querySelectorAll<HTMLButtonElement>('[data-open-combo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        comboId = btn.dataset.openCombo ?? '';
        clearDetailExcept('combo');
        openDetailFromMeet('combo');
        setUrl({ layer, combo: comboId, bucket: starKindToBucket(starKind) });
        paint();
      });
    });
    root.querySelectorAll<HTMLButtonElement>('[data-open-term]').forEach((btn) => {
      btn.addEventListener('click', () => {
        termId = btn.dataset.openTerm ?? '';
        clearDetailExcept('term');
        openDetailFromMeet('term');
        setUrl({ layer, term: termId, bucket: starKindToBucket(starKind), meet: starMeet });
        paint();
      });
    });
  }

  function paint(): void {
    scrubLegacyMeetSheets();
    const map = entries();

    if (termId && getGlossaryByName(termId)) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回</button>
        ${atlasTopTabsHtml(layer === 'meet' ? null : (layer as CatalogSection))}
        ${renderTermDetail(termId)}
      `;
      bindDetailUpBack();
      bindAtlasTopTabs();
      bindOpeners();
      return;
    }

    if (minorId && getMinorStarLore(minorId)) {
      const { chartHits, hasChart } = chartContext();
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回</button>
        ${atlasTopTabsHtml('stars')}
        ${renderMinorDetail(getMinorStarLore(minorId)!, chartHits, hasChart, detailTab)}
      `;
      bindDetailUpBack();
      bindAtlasTopTabs();
      bindOpeners();
      page.querySelectorAll<HTMLButtonElement>('[data-detail-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          detailTab = (btn.dataset.detailTab as DetailTabId) || 'portrait';
          paint();
        });
      });
      return;
    }

    if (contrastId) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回</button>
        ${atlasTopTabsHtml('stars')}
        ${renderSchoolContrastDetail(contrastId)}
      `;
      bindDetailUpBack();
      bindAtlasTopTabs();
      bindOpeners();
      return;
    }

    if (shenshaId && getShenshaLore(shenshaId)) {
      const { chartHits, hasChart } = chartContext();
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回</button>
        ${atlasTopTabsHtml('stars')}
        ${renderShenshaDetail(getShenshaLore(shenshaId)!, chartHits, hasChart, detailTab)}
      `;
      bindDetailUpBack();
      bindAtlasTopTabs();
      bindOpeners();
      page.querySelectorAll<HTMLButtonElement>('[data-detail-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          detailTab = (btn.dataset.detailTab as DetailTabId) || 'portrait';
          paint();
        });
      });
      return;
    }

    if (palaceId && getPalaceLore(palaceId)) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回</button>
        ${atlasTopTabsHtml('palaces')}
        ${renderPalaceDetail(palaceId)}
      `;
      bindDetailUpBack();
      bindAtlasTopTabs();
      bindOpeners();
      return;
    }

    if (comboId && getComboLore(comboId)) {
      const { view } = chartContext();
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回</button>
        ${atlasTopTabsHtml('palaces')}
        ${renderComboDetail(comboId, view)}
      `;
      bindDetailUpBack();
      bindAtlasTopTabs();
      bindOpeners();
      return;
    }

    const { chartHits, hasChart, personId, person, view } = chartContext();

    const detail = detailId ? getStarLore(detailId) : undefined;
    if (detail) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回</button>
        ${atlasTopTabsHtml('stars')}
        ${renderStarDetail(detail, {
          entries: map,
          chartHits,
          hasChart,
          detailTab,
          palaceFocus,
          personId,
          view,
        })}
      `;
      bindDetailUpBack();
      bindAtlasTopTabs();
      page.querySelectorAll<HTMLButtonElement>('[data-detail-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          detailTab = (btn.dataset.detailTab as DetailTabId) || 'portrait';
          paint();
        });
      });
      page.querySelectorAll<HTMLButtonElement>('[data-palace-chip]').forEach((btn) => {
        btn.addEventListener('click', () => {
          palaceFocus = btn.dataset.palaceChip ?? '';
          detailTab = 'you';
          paint();
        });
      });
      bindPalaceChipRail(page);
      page.querySelectorAll<HTMLButtonElement>('[data-unlock-tip]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const tip = btn.parentElement?.querySelector<HTMLElement>('.ziwei-detail-unlock-tip');
          if (!tip) return;
          const open = tip.hasAttribute('hidden');
          if (open) tip.removeAttribute('hidden');
          else tip.setAttribute('hidden', '');
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
          btn.classList.toggle('is-open', open);
        });
      });
      bindLuoxianJump();
      bindOpeners();
      return;
    }

    if (layer === 'meet') {
      page.innerHTML = `
        <button type="button" class="back-link" data-back-meet>← 返回图鉴</button>
        <header class="life-header ziwei-header ziwei-meet-page-head">
          <p class="ziwei-kicker">个人收藏</p>
          <h1 class="page-title">我的相遇</h1>
          <p class="page-subtitle">已收集 · 格局组合 · 收藏</p>
        </header>
        ${ziweiSysTabsHtml(null)}
        ${atlasTopTabsHtml(null)}
        <div class="ziwei-meet-page-body">
          ${renderMeetLayer(
            meetHub,
            view,
            starKind,
            map,
            chartHits,
            hasChart,
            shenshaTheme,
            shenshaTone,
          )}
        </div>
      `;
      assembleZiweiStickyNav(page);
      page.querySelectorAll<HTMLElement>('.lab-sys-tabs [data-path]').forEach((el) => {
        el.addEventListener('click', () => {
          const path = el.dataset.path;
          if (path) navigate(path);
        });
      });
      bindAtlasTopTabs();
      bindMeetPageControls(page);
      bindOpeners();
      showCraftComboAchToasts(view);
      return;
    }

    const all = codexProgress();

    const meetEntry = `
      <button type="button" class="ziwei-meet-entry" data-open-meet>
        <span class="ziwei-meet-entry-kicker">个人收藏</span>
        <strong class="ziwei-meet-entry-title">我的相遇</strong>
        <span class="ziwei-meet-entry-desc">已收集星曜 · 格局组合 · 我的收藏</span>
        <span class="ziwei-meet-entry-cta" aria-hidden="true">→</span>
      </button>`;

    let body = '';
    if (layer === 'stars') {
      body = renderStarsCatalog(
        'all',
        starKind,
        map,
        chartHits,
        hasChart,
        shenshaTheme,
        shenshaTone,
        view,
        { mode: 'atlas' },
      );
    } else if (layer === 'palaces') body = renderPalacesCatalog(palaceBucket, view);
    else if (layer === 'mutagen')
      body = renderMutagenCatalog(mutagenBucket, map, chartHits, hasChart, person, view);
    else body = renderStructureCatalog(structureBucket);

    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回紫微</button>
      <header class="life-header ziwei-header">
        <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
        <h1 class="page-title">星曜图鉴</h1>
        <p class="page-subtitle">全图鉴 ${all.collected}/${all.total}</p>
      </header>
      ${ziweiSysTabsHtml(null)}
      ${meetEntry}
      ${atlasTopTabsHtml(layer as CatalogSection)}
      ${body}
    `;
    assembleZiweiStickyNav(page);
    bindLuoxianJump();
    bindChartJumps();

    page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei'));
    page.querySelectorAll<HTMLElement>('.lab-sys-tabs [data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
    page.querySelector('[data-open-meet]')?.addEventListener('click', () => {
      meetHub = 'collected';
      layer = 'meet';
      setUrl({ layer: 'meet', hub: meetHub });
      paint();
    });
    bindAtlasTopTabs();
    page.querySelectorAll<HTMLButtonElement>('[data-star-kind]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.starKind as StarKindFilter;
        if ((STAR_KIND_ORDER as string[]).includes(next)) {
          starKind = next;
          layer = 'stars';
          if (next !== 'shensha') shenshaTone = 'all';
          setUrl({
            layer: 'stars',
            bucket: starKindToBucket(starKind),
            meet: 'all',
          });
          paint();
        }
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-shensha-theme]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.shenshaTheme ?? 'all';
        if (next === 'all' || (SHENSHA_THEME_ORDER as string[]).includes(next)) {
          shenshaTheme =
            next !== 'all' && shenshaTheme === next
              ? 'all'
              : (next as ShenshaThemeId | 'all');
          paint();
        }
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-shensha-tone]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.shenshaTone ?? 'all';
        if (next === 'all' || (SHENSHA_TONE_ORDER as string[]).includes(next)) {
          shenshaTone = next as ShenshaToneId | 'all';
          paint();
        }
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-bucket-guide]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openStarBucketGuideNotes();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-palace-bucket]').forEach((btn) => {
      btn.addEventListener('click', () => {
        palaceBucket = normalizePalaceBucket(btn.dataset.palaceBucket);
        layer = 'palaces';
        setUrl({ layer: 'palaces', bucket: palaceBucket });
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-mutagen-bucket]').forEach((btn) => {
      btn.addEventListener('click', () => {
        mutagenBucket = (btn.dataset.mutagenBucket as MutagenBucket) || 'stars';
        layer = 'mutagen';
        setUrl({ layer: 'mutagen', bucket: mutagenBucket });
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-structure-bucket]').forEach((btn) => {
      btn.addEventListener('click', () => {
        structureBucket = (btn.dataset.structureBucket as StructureBucket) || 'brightness';
        layer = 'structure';
        setUrl({ layer: 'structure', bucket: structureBucket });
        paint();
      });
    });
    bindOpeners();
    showCraftComboAchToasts(view);
  }

  paint();
  return () => {
    scrubLegacyMeetSheets();
    disposeFloat();
    stars.remove();
  };
}
