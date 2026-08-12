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
} from '../ziwei/combo-journey.ts';
import {
  claimNewCraftComboToasts,
  listCraftComboAchievements,
} from '../craft/combo-achievements.ts';
import { ICON_EXPLORE_STAR } from '../ui/lab-icons.ts';
import {
  codexProgress,
  isStarUnlocked,
  listCodexEntries,
  meetSummary,
} from '../ziwei/codex.ts';
import {
  CATALOG_SECTIONS,
  MUTAGEN_BUCKET_META,
  PALACE_BUCKET_META,
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
  SHENSHA_THEME_ORDER,
  SHENSHA_TONE_META,
  countShenshaByTheme,
  listCodexShenshaFlat,
  shenshaBrowseMeta,
  type ShenshaThemeId,
} from '../ziwei/codex-shensha-browse.ts';
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
  renderFeaturedStrip,
  renderShortMinorCard,
  renderShortShenshaCard,
  renderShortStarCard,
  renderStarDetail,
} from './ziwei-codex-star-ui.ts';
import { getActivePerson } from '../life/storage.ts';
import { castZiweiChart } from '../ziwei/cast.ts';
import { indexChartStars } from '../ziwei/codex-collect.ts';
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

/** 顶栏特色 + 图鉴分区；journey/meet 仍为整页 */
type CodexLayer = CatalogSection | 'journey' | 'meet';

const STAR_BUCKETS: StarBucket[] = ['major', 'lucky', 'sha', 'aux', 'minor', 'shensha'];
const PALACE_BUCKETS: PalaceBucket[] = ['twelve', 'sanfang', 'dui'];
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
  if (
    v === 'palaces' ||
    v === 'mutagen' ||
    v === 'structure' ||
    v === 'journey' ||
    v === 'meet' ||
    v === 'stars' ||
    v === 'combos'
  ) {
    if (v === 'combos') return 'stars';
    return v;
  }
  return 'stars';
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
}): void {
  try {
    const q = new URLSearchParams();
    const layer = opts.layer ?? 'stars';
    if (layer !== 'stars') q.set('layer', layer);
    if (opts.bucket) q.set('bucket', opts.bucket);
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

function renderMinorDetail(m: MinorStarLore): string {
  return `
    <article class="ziwei-star-detail is-lit">
      <button type="button" class="ziwei-detail-back" data-close-detail>← 返回图鉴</button>
      <p class="ziwei-kicker">杂曜 · ${escapeHtml(m.epithet)}</p>
      <div class="ziwei-detail-title-row">
        <h2 class="ziwei-remember-name">${escapeHtml(m.id)}</h2>
        ${favBtnHtml(m.id)}
      </div>
      <p class="ziwei-remember-line">${escapeHtml(m.oneLiner)}</p>
      <section class="ziwei-detail-block"><h3>基本含义</h3><pre class="ziwei-learn-body">${escapeHtml(m.traditional)}</pre></section>
      <section class="ziwei-detail-block">
        <h3>怎么用</h3>
        <p>杂曜力轻。回命盘点它所在宫，先看主星，再叠这层色调；点三方四正看联动。</p>
      </section>
    </article>`;
}

function renderShenshaDetail(s: ShenshaLore): string {
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

  return `
    <article class="ziwei-star-detail is-lit">
      <button type="button" class="ziwei-detail-back" data-close-detail>← 返回图鉴</button>
      <p class="ziwei-kicker">神煞 · ${escapeHtml(s.epithet)}${tag ? ` · ${escapeHtml(tag.badge)}` : ''}</p>
      <div class="ziwei-detail-title-row">
        <h2 class="ziwei-remember-name">${escapeHtml(s.id)}</h2>
        ${favBtnHtml(s.id)}
      </div>
      <p class="ziwei-remember-line">${escapeHtml(s.oneLiner)}</p>
      <section class="ziwei-detail-block"><h3>基本含义</h3><pre class="ziwei-learn-body">${escapeHtml(s.traditional)}</pre></section>
      <section class="ziwei-detail-block"><h3>何时用到</h3><p>${escapeHtml(s.when)}</p></section>
      ${schoolBlock}
      <p class="ziwei-codex-hint">本 App 排盘默认「${escapeHtml(SCHOOL_META[APP_SHENSHA_SCHOOL].title)}」。他书/他盘若标中州，以对方标注为准。</p>
    </article>`;
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
      <p class="ziwei-kicker">组合 · ${escapeHtml(statusLabel)}</p>
      <h2 class="ziwei-remember-name">${escapeHtml(c.title)}</h2>
      <p class="ziwei-remember-line">${escapeHtml(c.oneLiner)}</p>
      <div class="ziwei-journey-bar" aria-hidden="true"><i style="width:${Math.round(ev.progress * 100)}%"></i></div>
      <ul class="ziwei-keywords">${c.keywords.map((k) => `<li>${escapeHtml(k)}</li>`).join('')}</ul>
      <section class="ziwei-detail-block"><h3>成员</h3><ul class="ziwei-meet-list ziwei-combo-members">${members}</ul></section>
      <section class="ziwei-detail-block"><h3>气场</h3><p>${escapeHtml(c.vibe)}</p></section>
      <section class="ziwei-detail-block"><h3>优势</h3><p>${escapeHtml(c.strength)}</p></section>
      <section class="ziwei-detail-block"><h3>阴影</h3><p>${escapeHtml(c.shadow)}</p></section>
      <section class="ziwei-detail-block"><h3>怎么演</h3><p>${escapeHtml(c.howToPlay)}</p></section>
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

function renderCraftComboAchSection(): string {
  const states = listCraftComboAchievements();
  const cards = states
    .map((s) => {
      const pct = Math.round(s.progress * 100);
      const badge =
        s.status === 'complete'
          ? '已解锁'
          : s.status === 'partial'
            ? `${s.litMembers.length}/${s.def.members.length}`
            : '未集齐';
      return `
        <div class="ziwei-craft-ach is-${s.status}">
          <div class="ziwei-craft-ach-head">
            <strong>${escapeHtml(s.def.title)}</strong>
            <span>${escapeHtml(badge)}</span>
          </div>
          <p>${escapeHtml(s.def.effectLine)}</p>
          <p class="ziwei-journey-meta">${escapeHtml(s.def.members.join(' · '))}</p>
          <div class="ziwei-journey-bar" aria-hidden="true"><i style="width:${pct}%"></i></div>
        </div>`;
    })
    .join('');
  return `
    <section class="ziwei-craft-ach-block" aria-label="造命组合成就">
      <h3>造命组合成就</h3>
      <p class="ziwei-codex-hint">图鉴集齐成员即可强化造命雷达（帝星 / 业火）。</p>
      <div class="ziwei-craft-ach-grid">${cards}</div>
    </section>`;
}

function renderJourneyLayer(): string {
  const summary = comboJourneySummary();
  const steps = listComboJourney();
  const nextLine = summary.next
    ? summary.next.status === 'partial'
      ? `下一站：继续集齐「${summary.next.combo.title}」（还差 ${summary.next.missingMembers.join('、')}）`
      : `下一站：去排盘遇见「${summary.next.combo.members[0]}」以开启「${summary.next.combo.title}」`
    : '全部组合已点亮整组——可在成员星详情里回看相关组合。';

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
      <p>已成组 <strong>${summary.complete}</strong> / ${summary.total} · 进行中 ${summary.partial}</p>
      <p class="ziwei-journey-next">${escapeHtml(nextLine)}</p>
    </header>
    ${renderCraftComboAchSection()}
    <p class="ziwei-codex-hint">只维护少量经典组合；更多联动请回命盘点星 / 宫 / 三方四正做动态解释。</p>
    <div class="ziwei-journey-path">${cards}</div>`;
}

function showCraftComboAchToasts(): void {
  const newly = claimNewCraftComboToasts();
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
      <h2>我的相遇</h2>
      <p>人生角色收藏 · 已点亮 ${m.unlockedCount} 颗</p>
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
      <ul class="ziwei-meet-list">
        <li><button type="button" data-goto-journey>打开组合旅程 ›</button></li>
      </ul>
    </section>`;
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
): string {
  const favSet = new Set(listZiweiCodexFavorites());
  const passMeet = (id: string): boolean => {
    if (meet === 'all') return true;
    if (meet === 'favorite') return favSet.has(id);
    return isAtlasCollected(id, chartHits);
  };

  const meetTabs = (['collected', 'all', 'favorite'] as StarMeetFilter[])
    .map((id) => {
      let n = 0;
      if (id === 'favorite') n = favSet.size;
      else if (id === 'collected') {
        const ids = new Set<string>([
          ...starsInBucket('major').map((s) => s.id),
          ...starsInBucket('lucky').map((s) => s.id),
          ...starsInBucket('sha').map((s) => s.id),
          ...starsInBucket('aux').map((s) => s.id),
          ...minorStarsInBucket().map((m) => m.id),
          ...listCodexShenshaFlat().map((s) => s.id),
        ]);
        n = [...ids].filter((x) => isAtlasCollected(x, chartHits)).length;
      } else {
        n =
          starsInBucket('major').length +
          starsInBucket('lucky').length +
          starsInBucket('sha').length +
          starsInBucket('aux').length +
          minorStarsInBucket().length +
          listCodexShenshaFlat().length;
      }
      return `<button type="button" class="ziwei-codex-tab ${meet === id ? 'is-on' : ''}" data-star-meet="${id}">
      ${escapeHtml(STAR_MEET_META[id].title)} <em>${n}</em>
    </button>`;
    })
    .join('');

  const kindChips = `
    <div class="ziwei-star-kind-chips is-fullrow" role="group" aria-label="星曜类型">
      ${STAR_KIND_ORDER.map(
        (id) => `<button type="button" class="ziwei-shensha-theme-chip ${kind === id ? 'is-on' : ''}" data-star-kind="${id}">
          ${escapeHtml(STAR_KIND_META[id].title)}
        </button>`,
      ).join('')}
      <button type="button" class="ziwei-codex-help is-overview" data-bucket-guide="overview" title="主星、神煞、杂曜怎么分？" aria-label="星曜分类说明（打开笔记）">?</button>
    </div>`;

  let body = '';
  if (kind === 'major') {
    const list = starsInBucket('major').filter((s) => passMeet(s.id));
    body = list.length
      ? `<div class="ziwei-codex-short-grid">${list.map((s) => renderShortStarCard(s, map, chartHits, hasChart)).join('')}</div>`
      : `<p class="ziwei-codex-hint">${
          meet === 'favorite'
            ? '还没有收藏主星。点开详情里的☆可收藏。'
            : meet === 'collected'
              ? hasChart
                ? '这盘还没有已收集的主星，可切到「全部」浏览十四主星。'
                : '排盘或解锁后，已收集会出现在这里。'
              : '暂无条目。'
        }</p>`;
  } else if (kind === 'support') {
    const blocks: Array<{ title: string; bucket: StarBucket | 'minor' }> = [
      { title: '吉星', bucket: 'lucky' },
      { title: '煞星', bucket: 'sha' },
      { title: '辅曜', bucket: 'aux' },
      { title: '杂曜', bucket: 'minor' },
    ];
    const sections = blocks
      .map((b) => {
        if (b.bucket === 'minor') {
          const items = minorStarsInBucket().filter((m) => passMeet(m.id));
          if (!items.length) return '';
          return `
        <section class="ziwei-codex-shensha-group" aria-label="${escapeHtml(b.title)}">
          <header class="ziwei-codex-shensha-head"><h3>${escapeHtml(b.title)} <em>${items.length}</em></h3></header>
          <div class="ziwei-codex-short-grid">${items.map((m) => renderShortMinorCard(m, chartHits, hasChart)).join('')}</div>
        </section>`;
        }
        const items = starsInBucket(b.bucket).filter((s) => passMeet(s.id));
        if (!items.length) return '';
        return `
        <section class="ziwei-codex-shensha-group" aria-label="${escapeHtml(b.title)}">
          <header class="ziwei-codex-shensha-head"><h3>${escapeHtml(b.title)} <em>${items.length}</em></h3></header>
          <div class="ziwei-codex-short-grid">${items.map((s) => renderShortStarCard(s, map, chartHits, hasChart)).join('')}</div>
        </section>`;
      })
      .join('');
    body =
      sections ||
      `<p class="ziwei-codex-hint">${
        meet === 'favorite'
          ? '还没有收藏配角星。点开详情☆可收藏。'
          : meet === 'collected'
            ? '还没有已收集的配角星，可切「全部」浏览。'
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
    const themeChips = `
      <div class="ziwei-shensha-theme-chips" role="group" aria-label="人生议题">
        <button type="button" class="ziwei-shensha-theme-chip ${shenshaTheme === 'all' ? 'is-on' : ''}" data-shensha-theme="all">全部议题</button>
        ${SHENSHA_THEME_ORDER.map((id) => {
          const n = themeCounts[id];
          if (!n && meet !== 'all') return '';
          return `<button type="button" class="ziwei-shensha-theme-chip ${shenshaTheme === id ? 'is-on' : ''}" data-shensha-theme="${id}">
            ${escapeHtml(SHENSHA_THEME_META[id].title)}${n ? ` <em>${n}</em>` : ''}
          </button>`;
        }).join('')}
      </div>`;

    const list = listCodexShenshaFlat().filter((s) => {
      if (!scopedIds.has(s.id)) return false;
      if (shenshaTheme !== 'all' && shenshaBrowseMeta(s.id).theme !== shenshaTheme) return false;
      return true;
    });

    const byTheme = new Map<ShenshaThemeId, typeof list>();
    for (const s of list) {
      const t = shenshaBrowseMeta(s.id).theme;
      const arr = byTheme.get(t) ?? [];
      arr.push(s);
      byTheme.set(t, arr);
    }

    const sectionsHtml =
      shenshaTheme === 'all'
        ? SHENSHA_THEME_ORDER.map((tid) => {
            const items = byTheme.get(tid);
            if (!items?.length) return '';
            const meta = SHENSHA_THEME_META[tid];
            return `
        <section class="ziwei-codex-shensha-group" aria-label="${escapeHtml(meta.title)}">
          <header class="ziwei-codex-shensha-head">
            <h3>${escapeHtml(meta.title)} <em>${items.length}</em></h3>
            <p>${escapeHtml(meta.blurb)}</p>
          </header>
          <div class="ziwei-codex-short-grid">${items
            .map((s) => {
              const b = shenshaBrowseMeta(s.id);
              return renderShortShenshaCard(s, chartHits, hasChart, {
                tone: b.tone,
                themeLabel: SHENSHA_THEME_META[b.theme].title,
              });
            })
            .join('')}</div>
        </section>`;
          }).join('')
        : `<div class="ziwei-codex-short-grid">${list
            .map((s) => {
              const b = shenshaBrowseMeta(s.id);
              return renderShortShenshaCard(s, chartHits, hasChart, {
                tone: b.tone,
                themeLabel: SHENSHA_THEME_META[b.theme].title,
              });
            })
            .join('')}</div>`;

    const empty =
      list.length === 0
        ? `<p class="ziwei-codex-hint">${
            meet === 'favorite'
              ? '还没有收藏神煞。点开详情☆可收藏。'
              : meet === 'collected'
                ? hasChart
                  ? '这盘还没有已收集的神煞色调，可切「全部」浏览。'
                  : '排盘后，已收集会列出盘上的神煞色调。'
                : '这个议题下暂时没有条目，换一个试试。'
          }</p>`
        : '';

    const toneLegend = `<p class="ziwei-shensha-tone-legend" aria-label="色调图例">
      <span class="is-tone-support">${escapeHtml(SHENSHA_TONE_META.support.short)}</span>
      <span class="is-tone-neutral">${escapeHtml(SHENSHA_TONE_META.neutral.short)}</span>
      <span class="is-tone-caution">${escapeHtml(SHENSHA_TONE_META.caution.short)}</span>
      <em>色调是气氛提示，不是吉凶判决</em>
    </p>`;

    body = `
      ${themeChips}
      ${toneLegend}
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

  return `
    <div class="ziwei-codex-tabs is-fullrow" role="tablist" aria-label="收集状态">${meetTabs}</div>
    <p class="ziwei-codex-hint">${escapeHtml(STAR_MEET_META[meet].blurb)} · ${escapeHtml(STAR_KIND_META[kind].blurb)}</p>
    ${kindChips}
    ${body}`;
}


function renderPalacesCatalog(bucket: PalaceBucket): string {
  const tabs = `<div class="ziwei-codex-tabs" role="tablist" aria-label="宫位分类">
    ${PALACE_BUCKETS.map(
      (id) =>
        `<button type="button" class="ziwei-codex-tab ${bucket === id ? 'is-on' : ''}" data-palace-bucket="${id}">
        ${escapeHtml(PALACE_BUCKET_META[id].title)}
      </button>`,
    ).join('')}
  </div>`;

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
      </div>`;
  }

  const term = bucket === 'sanfang' ? '三方四正' : '对宫';
  const g = getGlossaryByName(term);
  return `
    ${tabs}
    <p class="ziwei-codex-hint">${escapeHtml(PALACE_BUCKET_META[bucket].blurb)}</p>
    <button type="button" class="ziwei-codex-short is-lit" data-open-term="${term}">
      <span class="ziwei-codex-short-name">${escapeHtml(term)}</span>
      <span class="ziwei-codex-short-kicker">宫位关系</span>
      <span class="ziwei-codex-short-keys">${escapeHtml(g?.shortMeaning ?? '')}</span>
      <span class="ziwei-codex-short-cta">查看完整图鉴 →</span>
    </button>
    <p class="ziwei-codex-hint">具体到你的盘：回完整命盘点宫，会按当前宫动态标出对宫与三合。</p>`;
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
  const tabs = `<div class="ziwei-codex-tabs" role="tablist" aria-label="四化分类">
    ${MUTAGEN_BUCKETS.map(
      (id) =>
        `<button type="button" class="ziwei-codex-tab ${bucket === id ? 'is-on' : ''}" data-mutagen-bucket="${id}">
        ${escapeHtml(MUTAGEN_BUCKET_META[id].title)}
      </button>`,
    ).join('')}
  </div>`;

  if (bucket === 'stars') {
    return `
      ${tabs}
      <p class="ziwei-codex-hint">禄权科忌 · 催化状态，不是第四套主星</p>
      <div class="ziwei-codex-short-grid">${mutagenStarCards()
        .map((s) => renderShortStarCard(s, map, chartHits, hasChart))
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
  const tabs = `<div class="ziwei-codex-tabs" role="tablist" aria-label="命盘规则分类">
    ${STRUCTURE_BUCKETS.map(
      (id) =>
        `<button type="button" class="ziwei-codex-tab ${bucket === id ? 'is-on' : ''}" data-structure-bucket="${id}">
        ${escapeHtml(STRUCTURE_BUCKET_META[id].title)}
      </button>`,
    ).join('')}
  </div>`;

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

export function renderZiweiCodex(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page ziwei-page ziwei-codex-page';
  mountEnvBanner(page);
  root.appendChild(page);

  let layer: CodexLayer = queryLayer();
  const rawBucket = (queryParam('bucket') as StarBucket) || 'major';
  let starKind: StarKindFilter = STAR_BUCKETS.includes(rawBucket)
    ? starBucketToKind(rawBucket)
    : 'major';
  let starMeet: StarMeetFilter = parseStarMeet(queryParam('meet'));
  let palaceBucket: PalaceBucket = 'twelve';
  let mutagenBucket: MutagenBucket = 'stars';
  let structureBucket: StructureBucket = 'brightness';

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

  function bindOpeners(): void {
    page.querySelectorAll<HTMLButtonElement>('[data-toggle-fav]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.toggleFav ?? '';
        if (!id) return;
        toggleZiweiCodexFavorite(id);
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-open-star]').forEach((btn) => {
      btn.addEventListener('click', () => {
        detailId = btn.dataset.openStar ?? '';
        detailTab = 'portrait';
        palaceFocus = '';
        const lore = getStarLore(detailId);
        starKind = lore?.category === 'major' ? 'major' : 'support';
        clearDetailExcept('star');
        layer = 'stars';
        setUrl({ layer: 'stars', star: detailId, bucket: starKindToBucket(starKind), meet: starMeet });
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-open-minor]').forEach((btn) => {
      btn.addEventListener('click', () => {
        minorId = btn.dataset.openMinor ?? '';
        clearDetailExcept('minor');
        layer = 'stars';
        starKind = 'support';
        setUrl({ layer: 'stars', minor: minorId, bucket: starKindToBucket(starKind), meet: starMeet });
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-open-shensha]').forEach((btn) => {
      btn.addEventListener('click', () => {
        shenshaId = btn.dataset.openShensha ?? '';
        clearDetailExcept('shensha');
        layer = 'stars';
        starKind = 'shensha';
        setUrl({ layer: 'stars', bucket: starKindToBucket(starKind), meet: starMeet, shensha: shenshaId });
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-open-contrast]').forEach((btn) => {
      btn.addEventListener('click', () => {
        contrastId = btn.dataset.openContrast ?? 'overview';
        clearDetailExcept('contrast');
        layer = 'stars';
        starKind = 'shensha';
        setUrl({ layer: 'stars', bucket: starKindToBucket(starKind), meet: starMeet, contrast: contrastId });
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-open-palace]').forEach((btn) => {
      btn.addEventListener('click', () => {
        palaceId = btn.dataset.openPalace ?? '';
        clearDetailExcept('palace');
        layer = 'palaces';
        setUrl({ layer: 'palaces', palace: palaceId });
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-open-combo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        comboId = btn.dataset.openCombo ?? '';
        clearDetailExcept('combo');
        if (layer !== 'journey') layer = 'journey';
        setUrl({ layer, combo: comboId });
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-open-term]').forEach((btn) => {
      btn.addEventListener('click', () => {
        termId = btn.dataset.openTerm ?? '';
        clearDetailExcept('term');
        setUrl({ layer, term: termId, bucket: starKindToBucket(starKind), meet: starMeet });
        paint();
      });
    });
  }

  function paint(): void {
    const map = entries();

    if (termId && getGlossaryByName(termId)) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回紫微</button>
        ${renderTermDetail(termId)}
      `;
      page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei'));
      page.querySelector('[data-close-sub]')?.addEventListener('click', () => {
        termId = '';
        setUrl({ layer, bucket: starKindToBucket(starKind), meet: starMeet });
        paint();
      });
      bindOpeners();
      return;
    }

    if (minorId && getMinorStarLore(minorId)) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回紫微</button>
        ${renderMinorDetail(getMinorStarLore(minorId)!)}
      `;
      page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei'));
      page.querySelector('[data-close-detail]')?.addEventListener('click', () => {
        minorId = '';
        starKind = 'support';
        setUrl({ layer: 'stars', bucket: starKindToBucket(starKind), meet: starMeet });
        paint();
      });
      bindOpeners();
      return;
    }

    if (contrastId) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回紫微</button>
        ${renderSchoolContrastDetail(contrastId)}
      `;
      page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei'));
      page.querySelector('[data-close-detail]')?.addEventListener('click', () => {
        contrastId = '';
        starKind = 'shensha';
        setUrl({ layer: 'stars', bucket: starKindToBucket(starKind), meet: starMeet });
        paint();
      });
      bindOpeners();
      return;
    }

    if (shenshaId && getShenshaLore(shenshaId)) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回紫微</button>
        ${renderShenshaDetail(getShenshaLore(shenshaId)!)}
      `;
      page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei'));
      page.querySelector('[data-close-detail]')?.addEventListener('click', () => {
        shenshaId = '';
        starKind = 'shensha';
        setUrl({ layer: 'stars', bucket: starKindToBucket(starKind), meet: starMeet });
        paint();
      });
      bindOpeners();
      return;
    }

    if (palaceId && getPalaceLore(palaceId)) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回紫微</button>
        ${renderPalaceDetail(palaceId)}
      `;
      page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei'));
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
      page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei'));
      page.querySelector('[data-close-sub]')?.addEventListener('click', () => {
        comboId = '';
        setUrl({ layer });
        paint();
      });
      bindOpeners();
      return;
    }

    const { chartHits, hasChart, personId, person, view } = chartContext();

    const detail = detailId ? getStarLore(detailId) : undefined;
    if (detail) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回紫微</button>
        ${renderStarDetail(detail, {
          entries: map,
          chartHits,
          hasChart,
          detailTab,
          palaceFocus,
          personId,
        })}
      `;
      page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei'));
      page.querySelector('[data-close-detail]')?.addEventListener('click', () => {
        detailId = '';
        detailTab = 'portrait';
        palaceFocus = '';
        setUrl({ layer: 'stars', bucket: starKindToBucket(starKind), meet: starMeet });
        paint();
      });
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

    const all = codexProgress();
    const sectionTabs = CATALOG_SECTIONS.map(
      (L) => `
      <button type="button" class="ziwei-layer-tab ${layer === L.id ? 'is-on' : ''}" data-layer="${L.id}">
        <strong>${escapeHtml(L.title)}</strong>
        <span>${escapeHtml(L.blurb)}</span>
      </button>`,
    ).join('');

    let body = '';
    if (layer === 'stars') body = renderStarsCatalog(starMeet, starKind, map, chartHits, hasChart, shenshaTheme);
    else if (layer === 'palaces') body = renderPalacesCatalog(palaceBucket);
    else if (layer === 'mutagen')
      body = renderMutagenCatalog(mutagenBucket, map, chartHits, hasChart, person, view);
    else if (layer === 'structure') body = renderStructureCatalog(structureBucket);
    else if (layer === 'journey') body = renderJourneyLayer();
    else body = renderMeetLayer();

    const showFeatured = layer !== 'journey' && layer !== 'meet';

    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回紫微</button>
      <header class="life-header ziwei-header">
        <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
        <h1 class="page-title">星曜图鉴</h1>
        <p class="page-subtitle">基础图鉴 + 命盘动态组合 · ${all.collected}/${all.total}</p>
      </header>
      ${ziweiSysTabsHtml(null)}
      ${showFeatured ? renderFeaturedStrip() : ''}
      ${
        layer === 'journey' || layer === 'meet'
          ? `<div class="ziwei-layer-tabs ziwei-layer-tabs-caps">
              <button type="button" class="ziwei-layer-tab" data-layer="stars"><strong>完整图鉴</strong><span>返回分类</span></button>
              <button type="button" class="ziwei-layer-tab ${layer === 'journey' ? 'is-on' : ''}" data-layer="journey"><strong>组合旅程</strong><span>搭戏进度</span></button>
              <button type="button" class="ziwei-layer-tab ${layer === 'meet' ? 'is-on' : ''}" data-layer="meet"><strong>我的相遇</strong><span>收藏</span></button>
            </div>`
          : `<div class="ziwei-layer-tabs ziwei-layer-tabs-caps">${sectionTabs}</div>`
      }
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
    page.querySelectorAll<HTMLButtonElement>('[data-layer]').forEach((btn) => {
      btn.addEventListener('click', () => {
        layer = (btn.dataset.layer as CodexLayer) || 'stars';
        detailId = '';
        palaceId = '';
        comboId = '';
        termId = '';
        minorId = '';
        setUrl({ layer, bucket: starKindToBucket(starKind), meet: starMeet });
        paint();
      });
    });
    page.querySelector('[data-goto-journey]')?.addEventListener('click', () => {
      layer = 'journey';
      detailId = '';
      palaceId = '';
      comboId = '';
      termId = '';
      minorId = '';
      setUrl({ layer: 'journey' });
      paint();
    });
    page.querySelector('[data-goto-meet]')?.addEventListener('click', () => {
      layer = 'meet';
      detailId = '';
      palaceId = '';
      comboId = '';
      termId = '';
      minorId = '';
      setUrl({ layer: 'meet' });
      paint();
    });
    page.querySelectorAll<HTMLButtonElement>('[data-star-meet]').forEach((btn) => {
      btn.addEventListener('click', () => {
        starMeet = parseStarMeet(btn.dataset.starMeet);
        setUrl({ layer: 'stars', bucket: starKindToBucket(starKind), meet: starMeet });
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-star-kind]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.starKind as StarKindFilter;
        if ((STAR_KIND_ORDER as string[]).includes(next)) {
          starKind = next;
          setUrl({ layer: 'stars', bucket: starKindToBucket(starKind), meet: starMeet });
          paint();
        }
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-shensha-theme]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.shenshaTheme ?? 'all';
        if (next === 'all' || (SHENSHA_THEME_ORDER as string[]).includes(next)) {
          shenshaTheme = next as ShenshaThemeId | 'all';
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
        palaceBucket = (btn.dataset.palaceBucket as PalaceBucket) || 'twelve';
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-mutagen-bucket]').forEach((btn) => {
      btn.addEventListener('click', () => {
        mutagenBucket = (btn.dataset.mutagenBucket as MutagenBucket) || 'stars';
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-structure-bucket]').forEach((btn) => {
      btn.addEventListener('click', () => {
        structureBucket = (btn.dataset.structureBucket as StructureBucket) || 'brightness';
        paint();
      });
    });
    bindOpeners();
    showCraftComboAchToasts();
  }

  paint();
  return () => {
    disposeFloat();
    stars.remove();
  };
}
