import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import {
  getStarLore,
  type StarCard,
} from '../ziwei/stars.ts';
import {
  getStarProfile,
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
import {
  CATALOG_SECTIONS,
  MUTAGEN_BUCKET_META,
  PALACE_BUCKET_META,
  STAR_BUCKET_META,
  STRUCTURE_BUCKET_META,
  minorStarsInBucket,
  mutagenStarCards,
  shenshaCodexSections,
  starListKicker,
  starsInBucket,
  type CatalogSection,
  type MutagenBucket,
  type PalaceBucket,
  type StarBucket,
  type StructureBucket,
} from '../ziwei/codex-taxonomy.ts';
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
import { allMutagenNotesForStar } from '../ziwei/star-mutagen-notes.ts';
import { getGlossaryByName } from '../ziwei/term-glossary.ts';
import { ziweiSysTabsHtml } from '../ui/lab-sys-tabs.ts';

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
}): void {
  try {
    const q = new URLSearchParams();
    const layer = opts.layer ?? 'stars';
    if (layer !== 'stars') q.set('layer', layer);
    if (opts.bucket) q.set('bucket', opts.bucket);
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

/** 列表短卡 */
function renderShortStarCard(
  star: StarCard,
  entries: Map<string, { lastPalace?: string }>,
): string {
  const unlocked = isStarUnlocked(star.id);
  const entry = entries.get(star.id);
  const profile = getStarProfile(star.id);
  const kicker = starListKicker(star);
  const keys = (profile?.keywords ?? []).slice(0, 3);
  const keyLine = keys.length
    ? keys.map((k) => escapeHtml(k)).join(' · ')
    : escapeHtml(star.epithet);
  return `
    <button type="button" class="ziwei-codex-short ${unlocked ? 'is-lit' : 'is-dim'}" data-open-star="${star.id}">
      <span class="ziwei-codex-short-name">${escapeHtml(star.title)}</span>
      <span class="ziwei-codex-short-kicker">${escapeHtml(kicker)}</span>
      <span class="ziwei-codex-short-keys">关键词　${keyLine}</span>
      <span class="ziwei-codex-short-cta">${unlocked ? '查看完整图鉴 →' : '尚未点亮 · 仍可预览 →'}</span>
      ${
        unlocked && entry?.lastPalace
          ? `<span class="ziwei-codex-short-meet">${escapeHtml(connectionLine(star.id, entry.lastPalace))}</span>`
          : ''
      }
    </button>`;
}

function renderShortMinorCard(m: MinorStarLore): string {
  return `
    <button type="button" class="ziwei-codex-short is-minor" data-open-minor="${escapeHtml(m.id)}">
      <span class="ziwei-codex-short-name">${escapeHtml(m.id)}</span>
      <span class="ziwei-codex-short-kicker">杂曜｜${escapeHtml(m.epithet)}</span>
      <span class="ziwei-codex-short-keys">${escapeHtml(m.oneLiner)}</span>
      <span class="ziwei-codex-short-cta">查看完整图鉴 →</span>
    </button>`;
}

function renderShortShenshaCard(s: ShenshaLore): string {
  return `
    <button type="button" class="ziwei-codex-short is-shensha" data-open-shensha="${escapeHtml(s.id)}">
      <span class="ziwei-codex-short-name">${escapeHtml(s.id)}</span>
      <span class="ziwei-codex-short-kicker">神煞｜${escapeHtml(s.epithet)}</span>
      <span class="ziwei-codex-short-keys">${escapeHtml(s.oneLiner)}</span>
      <span class="ziwei-codex-short-cta">查看完整图鉴 →</span>
    </button>`;
}

function renderFeaturedStrip(): string {
  return `
    <section class="ziwei-codex-featured" aria-label="特色入口">
      <button type="button" class="ziwei-codex-featured-card" data-open-star="紫微">
        <strong>定盘</strong><span>紫微 · 核心人设</span>
      </button>
      <button type="button" class="ziwei-codex-featured-card" data-open-star="天机">
        <strong>智变</strong><span>天机 · 谋划应变</span>
      </button>
      <button type="button" class="ziwei-codex-featured-card" data-goto-journey>
        <strong>组合旅程</strong><span>点亮搭戏进度</span>
      </button>
      <button type="button" class="ziwei-codex-featured-card" data-goto-meet>
        <strong>我的相遇</strong><span>命盘角色收藏</span>
      </button>
    </section>`;
}

function renderStarDetail(star: StarCard, entries: Map<string, { lastPalace?: string }>): string {
  const unlocked = isStarUnlocked(star.id);
  const entry = entries.get(star.id);
  const p = getStarProfile(star.id);
  const relatedCombos = COMBO_LORE.filter((c) => c.members.includes(star.id));

  const basic = p
    ? `<p>${escapeHtml(p.oneLiner)}</p><p>${escapeHtml(p.metaphor)}</p><p>${escapeHtml(star.myth)}</p>`
    : `<p>${escapeHtml(star.myth)}</p><p>${escapeHtml(star.portrait)}</p>`;

  const trait = p
    ? `
      <p><strong>核心动力</strong>　${escapeHtml(p.trait.drive)}</p>
      <p><strong>天赋优势</strong>　${escapeHtml(p.trait.gift)}</p>
      <p><strong>阴影模式</strong>　${escapeHtml(p.trait.shadow)}</p>
      <p><strong>真正需要</strong>　${escapeHtml(p.trait.need)}</p>`
    : `<p>${escapeHtml(star.trait)}</p>`;

  const love = p ? p.mirror.love : star.mirrorLove;
  const work = p ? p.mirror.work : star.mirrorWork;
  const wealth = p ? p.mirror.wealth : '财富面向随落宫与四化而变；先看财帛、官禄会照。';
  const health = p ? p.mirror.self : star.counsel;

  const palaces = p
    ? p.palaces
        .map(
          (hit) => `
        <section class="ziwei-detail-block">
          <h4>${escapeHtml(hit.title)} <em>${escapeHtml(hit.hint)}</em></h4>
          <p>${escapeHtml(hit.line)}</p>
        </section>`,
        )
        .join('')
    : '<p class="ziwei-codex-hint">落十二宫细读陆续补全；可先回命盘点宫位看动态解释。</p>';

  const youBlock = unlocked
    ? `<p>${escapeHtml(connectionLine(star.id, entry?.lastPalace))}</p>
       <p class="ziwei-codex-hint">回命盘点这颗星或所在宫，可看与当前三方四正的联动（动态组合，不另开几百张卡）。</p>`
    : `<p class="ziwei-star-locked">排盘遇见后，这里会记你与它的相遇。</p>`;

  const comboBlock = relatedCombos.length
    ? `<ul class="ziwei-meet-list">${relatedCombos
        .map(
          (c) =>
            `<li><button type="button" data-open-combo="${escapeHtml(c.id)}">${escapeHtml(c.title)} · ${escapeHtml(c.members.join('·'))}</button></li>`,
        )
        .join('')}</ul>`
    : `<p class="ziwei-codex-hint">暂无预置组合卡。可在命盘里点「三方四正 / 四化」看与当前宫的动态联动。</p>`;

  return `
    <article class="ziwei-star-detail ${unlocked ? 'is-lit' : ''}">
      <button type="button" class="ziwei-detail-back" data-close-detail>← 返回图鉴</button>
      <header class="ziwei-detail-top">
        <p class="ziwei-kicker">星曜图鉴 · ${escapeHtml(starListKicker(star))}</p>
        <h2 class="ziwei-remember-name">${escapeHtml(star.title)}</h2>
        ${
          p?.keywords?.length
            ? `<ul class="ziwei-keywords">${p.keywords.map((k) => `<li>${escapeHtml(k)}</li>`).join('')}</ul>`
            : ''
        }
      </header>
      <section class="ziwei-detail-block"><h3>基本含义</h3>${basic}</section>
      <section class="ziwei-detail-block"><h3>性格表现</h3>${trait}</section>
      <section class="ziwei-detail-block"><h3>感情</h3><p>${escapeHtml(love)}</p></section>
      <section class="ziwei-detail-block"><h3>事业</h3><p>${escapeHtml(work)}</p></section>
      <section class="ziwei-detail-block"><h3>财富</h3><p>${escapeHtml(wealth)}</p></section>
      <section class="ziwei-detail-block"><h3>健康 / 自我状态</h3><p>${escapeHtml(health)}</p></section>
      <section class="ziwei-detail-block"><h3>落十二宫</h3>${palaces}</section>
      <section class="ziwei-detail-block">
        <h3>庙旺状态</h3>
        <p>亮度（庙旺得利平陷）决定发挥顺不顺，不是吉凶判决。</p>
        <p><button type="button" class="ziwei-inline-link" data-open-term="庙旺落陷">查看庙旺落陷 →</button></p>
      </section>
      <section class="ziwei-detail-block">
        <h3>四化变化</h3>
        ${
          star.category === 'mutagen'
            ? `<p>${escapeHtml(star.trait)}</p>`
            : `<ul class="ziwei-mutagen-notes">${allMutagenNotesForStar(star.id)
                .map(
                  (n) =>
                    `<li><strong>化${escapeHtml(n.kind)}</strong>　${escapeHtml(n.text)}</li>`,
                )
                .join('')}</ul>`
        }
        <p><button type="button" class="ziwei-inline-link" data-open-term="四化">查看四化总述 →</button></p>
        <p class="ziwei-codex-hint">落在你盘哪一宫、哪一年干，回命盘点四化飞星图层动态看——不另开几百张卡。</p>
      </section>
      <section class="ziwei-detail-block"><h3>你的命盘中的${escapeHtml(star.title)}</h3>${youBlock}</section>
      <section class="ziwei-detail-block"><h3>相关星曜 / 组合</h3>${comboBlock}</section>
      <section class="ziwei-detail-counsel"><h3>给你的醒言</h3><p>${escapeHtml(p?.counsel ?? star.counsel)}</p></section>
    </article>`;
}

function renderMinorDetail(m: MinorStarLore): string {
  return `
    <article class="ziwei-star-detail is-lit">
      <button type="button" class="ziwei-detail-back" data-close-detail>← 返回图鉴</button>
      <p class="ziwei-kicker">杂曜 · ${escapeHtml(m.epithet)}</p>
      <h2 class="ziwei-remember-name">${escapeHtml(m.id)}</h2>
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
      <h2 class="ziwei-remember-name">${escapeHtml(s.id)}</h2>
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
      <p class="ziwei-kicker">结构 / 术语</p>
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
    <p class="ziwei-codex-hint">只维护少量经典组合；更多联动请回命盘点星 / 宫 / 三方四正做动态解释。</p>
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

function renderStarsCatalog(
  bucket: StarBucket,
  map: Map<string, { lastPalace?: string }>,
): string {
  const tabs = STAR_BUCKETS.map((id) => {
    const meta = STAR_BUCKET_META[id];
    let count = '';
    if (id === 'minor') count = String(minorStarsInBucket().length);
    else if (id === 'shensha')
      count = String(shenshaCodexSections().reduce((n, s) => n + s.items.length, 0));
    else count = String(starsInBucket(id).length);
    return `<button type="button" class="ziwei-codex-tab ${bucket === id ? 'is-on' : ''}" data-star-bucket="${id}">
      ${escapeHtml(meta.title)} <em>${escapeHtml(count)}</em>
    </button>`;
  }).join('');

  let grid = '';
  if (bucket === 'minor') {
    grid = `<div class="ziwei-codex-short-grid">${minorStarsInBucket()
      .map((m) => renderShortMinorCard(m))
      .join('')}</div>`;
  } else if (bucket === 'shensha') {
    const sections = shenshaCodexSections();
    const total = sections.reduce((n, s) => n + s.items.length, 0);
    grid = `
      <button type="button" class="ziwei-codex-short is-shensha is-school" data-open-contrast="overview">
        <span class="ziwei-codex-short-name">通行派 × 中州派</span>
        <span class="ziwei-codex-short-kicker">流派对照｜截空 / 截路等</span>
        <span class="ziwei-codex-short-keys">${escapeHtml(SCHOOL_OVERVIEW.oneLiner)}</span>
        <span class="ziwei-codex-short-cta">查看对照表 →</span>
      </button>
      <p class="ziwei-codex-hint">神煞百科 · 共 ${total} 条。排盘默认「${escapeHtml(SCHOOL_META[APP_SHENSHA_SCHOOL].title)}」；中州特有名目仍收录便于对照。</p>
      ${sections
        .map(
          (sec) => `
        <section class="ziwei-codex-shensha-group" aria-label="${escapeHtml(sec.title)}">
          <header class="ziwei-codex-shensha-head">
            <h3>${escapeHtml(sec.title)} <em>${sec.items.length}</em></h3>
            <p>${escapeHtml(sec.blurb)}</p>
          </header>
          <div class="ziwei-codex-short-grid">${sec.items.map((s) => renderShortShenshaCard(s)).join('')}</div>
        </section>`,
        )
        .join('')}`;
  } else {
    const list = starsInBucket(bucket);
    grid = `<div class="ziwei-codex-short-grid">${list
      .map((s) => renderShortStarCard(s, map))
      .join('')}</div>`;
  }

  return `
    <div class="ziwei-codex-tabs" role="tablist">${tabs}</div>
    <p class="ziwei-codex-hint">${escapeHtml(STAR_BUCKET_META[bucket].blurb)} · 列表只留关键词，点开看完整图鉴</p>
    ${grid}`;
}

function renderPalacesCatalog(bucket: PalaceBucket): string {
  const tabs = PALACE_BUCKETS.map(
    (id) =>
      `<button type="button" class="ziwei-codex-tab ${bucket === id ? 'is-on' : ''}" data-palace-bucket="${id}">
        ${escapeHtml(PALACE_BUCKET_META[id].title)}
      </button>`,
  ).join('');

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

function renderMutagenCatalog(bucket: MutagenBucket, map: Map<string, { lastPalace?: string }>): string {
  const tabs = MUTAGEN_BUCKETS.map(
    (id) =>
      `<button type="button" class="ziwei-codex-tab ${bucket === id ? 'is-on' : ''}" data-mutagen-bucket="${id}">
        ${escapeHtml(MUTAGEN_BUCKET_META[id].title)}
      </button>`,
  ).join('');

  if (bucket === 'stars') {
    return `
      ${tabs}
      <p class="ziwei-codex-hint">禄权科忌 · 催化状态，不是第四套主星</p>
      <div class="ziwei-codex-short-grid">${mutagenStarCards()
        .map((s) => renderShortStarCard(s, map))
        .join('')}</div>`;
  }

  const term = bucket === 'birth' ? '生年四化' : '运限四化';
  const g = getGlossaryByName(term);
  return `
    ${tabs}
    <button type="button" class="ziwei-codex-short is-lit" data-open-term="${term}">
      <span class="ziwei-codex-short-name">${escapeHtml(term)}</span>
      <span class="ziwei-codex-short-kicker">${escapeHtml(MUTAGEN_BUCKET_META[bucket].blurb)}</span>
      <span class="ziwei-codex-short-keys">${escapeHtml(g?.shortMeaning ?? '')}</span>
      <span class="ziwei-codex-short-cta">查看完整图鉴 →</span>
    </button>
    <p class="ziwei-codex-hint">飞入某宫、叠在某主星上的具体句，在命盘点「四化飞星」图层动态生成，避免卡片爆炸。</p>`;
}

function renderStructureCatalog(bucket: StructureBucket): string {
  const tabs = STRUCTURE_BUCKETS.map(
    (id) =>
      `<button type="button" class="ziwei-codex-tab ${bucket === id ? 'is-on' : ''}" data-structure-bucket="${id}">
        ${escapeHtml(STRUCTURE_BUCKET_META[id].title)}
      </button>`,
  ).join('');

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
              <span class="ziwei-codex-short-kicker">结构｜指针</span>
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
  let starBucket: StarBucket = (queryParam('bucket') as StarBucket) || 'major';
  if (!STAR_BUCKETS.includes(starBucket)) starBucket = 'major';
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
    page.querySelectorAll<HTMLButtonElement>('[data-open-star]').forEach((btn) => {
      btn.addEventListener('click', () => {
        detailId = btn.dataset.openStar ?? '';
        clearDetailExcept('star');
        layer = 'stars';
        setUrl({ layer: 'stars', star: detailId, bucket: starBucket });
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-open-minor]').forEach((btn) => {
      btn.addEventListener('click', () => {
        minorId = btn.dataset.openMinor ?? '';
        clearDetailExcept('minor');
        layer = 'stars';
        starBucket = 'minor';
        setUrl({ layer: 'stars', minor: minorId, bucket: 'minor' });
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-open-shensha]').forEach((btn) => {
      btn.addEventListener('click', () => {
        shenshaId = btn.dataset.openShensha ?? '';
        clearDetailExcept('shensha');
        layer = 'stars';
        starBucket = 'shensha';
        setUrl({ layer: 'stars', bucket: 'shensha', shensha: shenshaId });
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-open-contrast]').forEach((btn) => {
      btn.addEventListener('click', () => {
        contrastId = btn.dataset.openContrast ?? 'overview';
        clearDetailExcept('contrast');
        layer = 'stars';
        starBucket = 'shensha';
        setUrl({ layer: 'stars', bucket: 'shensha', contrast: contrastId });
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
        setUrl({ layer, term: termId, bucket: starBucket });
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
      page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei/reading'));
      page.querySelector('[data-close-sub]')?.addEventListener('click', () => {
        termId = '';
        setUrl({ layer, bucket: starBucket });
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
      page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei/reading'));
      page.querySelector('[data-close-detail]')?.addEventListener('click', () => {
        minorId = '';
        setUrl({ layer: 'stars', bucket: 'minor' });
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
      page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei/reading'));
      page.querySelector('[data-close-detail]')?.addEventListener('click', () => {
        contrastId = '';
        setUrl({ layer: 'stars', bucket: 'shensha' });
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
      page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei/reading'));
      page.querySelector('[data-close-detail]')?.addEventListener('click', () => {
        shenshaId = '';
        setUrl({ layer: 'stars', bucket: 'shensha' });
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
        ${renderStarDetail(detail, map)}
      `;
      page.querySelector('.life-back')?.addEventListener('click', () => navigate('/ziwei/reading'));
      page.querySelector('[data-close-detail]')?.addEventListener('click', () => {
        detailId = '';
        setUrl({ layer: 'stars', bucket: starBucket });
        paint();
      });
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
    if (layer === 'stars') body = renderStarsCatalog(starBucket, map);
    else if (layer === 'palaces') body = renderPalacesCatalog(palaceBucket);
    else if (layer === 'mutagen') body = renderMutagenCatalog(mutagenBucket, map);
    else if (layer === 'structure') body = renderStructureCatalog(structureBucket);
    else if (layer === 'journey') body = renderJourneyLayer();
    else body = renderMeetLayer();

    const showFeatured = layer !== 'journey' && layer !== 'meet';

    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回命盘</button>
      <header class="life-header ziwei-header">
        <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
        <h1 class="page-title">星曜图鉴</h1>
        <p class="page-subtitle">基础图鉴 + 命盘动态组合 · ${all.collected}/${all.total}</p>
      </header>
      ${ziweiSysTabsHtml('reading')}
      ${showFeatured ? renderFeaturedStrip() : ''}
      ${
        layer === 'journey' || layer === 'meet'
          ? `<div class="ziwei-layer-tabs">
              <button type="button" class="ziwei-layer-tab" data-layer="stars"><strong>完整图鉴</strong><span>返回分类</span></button>
              <button type="button" class="ziwei-layer-tab ${layer === 'journey' ? 'is-on' : ''}" data-layer="journey"><strong>组合旅程</strong><span>搭戏进度</span></button>
              <button type="button" class="ziwei-layer-tab ${layer === 'meet' ? 'is-on' : ''}" data-layer="meet"><strong>我的相遇</strong><span>收藏</span></button>
            </div>`
          : `<div class="ziwei-layer-tabs">${sectionTabs}</div>`
      }
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
        termId = '';
        minorId = '';
        setUrl({ layer, bucket: starBucket });
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
    page.querySelectorAll<HTMLButtonElement>('[data-star-bucket]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.starBucket as StarBucket;
        if (STAR_BUCKETS.includes(next)) {
          starBucket = next;
          setUrl({ layer: 'stars', bucket: starBucket });
          paint();
        }
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
  }

  paint();
  return () => stars.remove();
}
