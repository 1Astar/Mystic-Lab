/**
 * 紫微图鉴 · 主星列表卡 / 特色条 / 详情（顶图 + 4 Tab + 宫位芯片）
 */
import { COMBO_LORE } from '../ziwei/combo-lore.ts';
import { getPalaceLore } from '../ziwei/palace-lore.ts';
import {
  collectStateClass,
  collectStateDetailBadge,
  collectStateLabel,
  formatShenshaMeetAtLine,
  resolveCodexCollectState,
  unlockHowToHint,
  type ChartStarHit,
} from '../ziwei/codex-collect.ts';
import { getCodexEntry, isStarUnlocked } from '../ziwei/codex.ts';
import {
  buildCodexInChartView,
  renderInChartSectionHtml,
  ziweiChartJumpQs,
} from '../ziwei/codex-in-chart.ts';
import { starListKicker, LUCKY_STAR_IDS, SHA_STAR_IDS } from '../ziwei/codex-taxonomy.ts';
import {
  craftBonusForStar,
  findWeekQuestForStar,
  questRelateLine,
  yearHuaForStar,
} from '../ziwei/codex-detail-extras.ts';
import { majorStarArtImgHtml, starListThumbInnerHtml } from '../ziwei/star-art.ts';
import { allMutagenNotesForStar } from '../ziwei/star-mutagen-notes.ts';
import {
  DETAIL_TAB_LABEL,
  getStarProfile,
  type DetailTabId,
} from '../ziwei/star-profiles.ts';
import {
  brightnessGradeLabel,
  brightnessSectionTitle,
} from '../ziwei/term-glossary.ts';
import { isZiweiCodexFavorite, ziweiFavButtonLabel } from '../ziwei/codex-favorites.ts';
import type { StarCard } from '../ziwei/stars.ts';
import type { MinorStarLore } from '../ziwei/minor-star-lore.ts';
import type { ShenshaLore } from '../ziwei/shensha-lore.ts';
import {
  sectionsFromMinor,
  sectionsFromShensha,
  type SoftStarSections,
} from '../ziwei/soft-star-sections.ts';
import { getActivePerson } from '../life/storage.ts';
import type { ZiweiChartView } from '../ziwei/types.ts';

export type CodexCardViewOpts = {
  hasChart: boolean;
  view?: ZiweiChartView | null;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ariaForCollectState(title: string, state: string): string {
  if (state === 'pending') return `${title} · 待觉醒`;
  if (state === 'met') return `${title} · 相遇待激活`;
  if (state === 'activated') return `${title} · 已激活`;
  if (state === 'absent') return `${title} · 未入命盘`;
  return title;
}

/** 金标题 + 正文分行 + 分隔线（生活/性格等板块） */
function stackSections(rows: Array<{ title: string; body: string }>): string {
  return `<div class="ziwei-detail-stack">${rows
    .map(
      (r) => `
    <section class="ziwei-detail-stack-item">
      <h4>${escapeHtml(r.title)}</h4>
      <p>${escapeHtml(r.body)}</p>
    </section>`,
    )
    .join('')}</div>`;
}

function thumbToneForStar(star: StarCard): 'major' | 'lucky' | 'sha' | 'aux' {
  if (star.category === 'major') return 'major';
  if ((LUCKY_STAR_IDS as readonly string[]).includes(star.id)) return 'lucky';
  if ((SHA_STAR_IDS as readonly string[]).includes(star.id)) return 'sha';
  return 'aux';
}

export function renderShortStarCard(
  star: StarCard,
  entries: Map<string, { lastPalace?: string }>,
  chartHits: Map<string, ChartStarHit>,
  hasChart: boolean,
  view?: ZiweiChartView | null,
): string {
  const entry = entries.get(star.id);
  const profile = getStarProfile(star.id);
  const kicker = starListKicker(star);
  const keys = (profile?.keywords ?? []).slice(0, 3);
  const keyLine = keys.length
    ? keys.map((k) => escapeHtml(k)).join(' · ')
    : escapeHtml(star.epithet);
  const state = resolveCodexCollectState(star.id, chartHits, { hasChart, view });
  const stateCls = collectStateClass(state);
  const hit = chartHits.get(star.id);
  const inner = starListThumbInnerHtml(star.id, {
    tone: thumbToneForStar(star),
    alt: star.title,
  });
  const lock =
    state === 'pending'
      ? `<i class="ziwei-codex-thumb-lock" aria-hidden="true">🔒</i>`
      : '';
  const thumbBlock = `<span class="ziwei-codex-short-thumb ${stateCls}">${inner}${lock}${
    state === 'activated' ? '<i class="ziwei-codex-thumb-sheen" aria-hidden="true"></i>' : ''
  }</span>`;
  const statusLine =
    state === 'absent' || state === 'met'
      ? `<span class="ziwei-codex-short-status">${escapeHtml(collectStateLabel(state))}</span>`
      : state === 'activated'
        ? `<span class="ziwei-codex-short-status is-activated">${escapeHtml(collectStateLabel(state))}</span>`
        : '';
  const meetHit: ChartStarHit | undefined =
    hit ??
    (entry?.lastPalace
      ? { palace: entry.lastPalace, meetSource: 'natal' }
      : undefined);
  const meetLine =
    (state === 'activated' || state === 'met')
      ? formatShenshaMeetAtLine(meetHit)
      : null;
  const meetBit = meetLine
    ? `<span class="ziwei-codex-short-meet">${escapeHtml(meetLine)}</span>`
    : '';
  return `
    <button type="button" class="ziwei-codex-short ${stateCls}" data-open-star="${star.id}" aria-label="${escapeHtml(ariaForCollectState(star.title, state))}">
      ${statusLine}
      <span class="ziwei-codex-short-row">
        ${thumbBlock}
        <span class="ziwei-codex-short-copy">
          <span class="ziwei-codex-short-name">${escapeHtml(star.title)}</span>
          <span class="ziwei-codex-short-kicker">${escapeHtml(kicker)}</span>
          <span class="ziwei-codex-short-keys">${keyLine}</span>
          ${meetBit}
        </span>
      </span>
    </button>`;
}

export function renderShortMinorCard(
  m: MinorStarLore,
  chartHits: Map<string, ChartStarHit>,
  hasChart: boolean,
  view?: ZiweiChartView | null,
): string {
  const state = resolveCodexCollectState(m.id, chartHits, { hasChart, view });
  const stateCls = collectStateClass(state);
  const hit = chartHits.get(m.id);
  const inner = starListThumbInnerHtml(m.id, { tone: 'minor', alt: m.id });
  const lock =
    state === 'pending'
      ? `<i class="ziwei-codex-thumb-lock" aria-hidden="true">🔒</i>`
      : '';
  const meetBit =
    (state === 'activated' || state === 'met') && hit
      ? `<span class="ziwei-codex-short-meet">${escapeHtml(formatShenshaMeetAtLine(hit) ?? '')}</span>`
      : '';
  const statusLine =
    state === 'absent' || state === 'met'
      ? `<span class="ziwei-codex-short-status">${escapeHtml(collectStateLabel(state))}</span>`
      : state === 'activated'
        ? `<span class="ziwei-codex-short-status is-activated">${escapeHtml(collectStateLabel(state))}</span>`
        : '';
  return `
    <button type="button" class="ziwei-codex-short is-minor ${stateCls}" data-open-minor="${escapeHtml(m.id)}" aria-label="${escapeHtml(ariaForCollectState(m.id, state))}">
      ${statusLine}
      <span class="ziwei-codex-short-row">
        <span class="ziwei-codex-short-thumb is-minor ${stateCls}">${inner}${lock}${
          state === 'activated' ? '<i class="ziwei-codex-thumb-sheen" aria-hidden="true"></i>' : ''
        }</span>
        <span class="ziwei-codex-short-copy">
          <span class="ziwei-codex-short-name">${escapeHtml(m.id)}</span>
          <span class="ziwei-codex-short-kicker">杂曜｜${escapeHtml(m.epithet)}</span>
          <span class="ziwei-codex-short-keys">${escapeHtml(m.oneLiner)}</span>
          ${meetBit}
        </span>
      </span>
    </button>`;
}

export function renderShortShenshaCard(
  s: ShenshaLore,
  chartHits: Map<string, ChartStarHit>,
  hasChart: boolean,
  opts?: {
    tone?: 'support' | 'neutral' | 'caution';
    themeLabel?: string;
    view?: ZiweiChartView | null;
  },
): string {
  const state = resolveCodexCollectState(s.id, chartHits, {
    hasChart,
    view: opts?.view,
  });
  const stateCls = collectStateClass(state);
  const tone = opts?.tone ?? 'neutral';
  const toneCls = `is-tone-${tone}`;
  const themeBit = opts?.themeLabel
    ? `<span class="ziwei-codex-short-theme">${escapeHtml(opts.themeLabel)}</span>`
    : '';
  const meetHit = chartHits.get(s.id);
  const meetLine =
    state === 'activated' || state === 'met'
      ? formatShenshaMeetAtLine(meetHit)
      : null;
  const meetBit = meetLine
    ? `<span class="ziwei-codex-short-meet">${escapeHtml(meetLine)}</span>`
    : '';
  const statusLine =
    state === 'absent' || state === 'met'
      ? `<span class="ziwei-codex-short-status">${escapeHtml(collectStateLabel(state))}</span>`
      : state === 'activated'
        ? `<span class="ziwei-codex-short-status is-activated">${escapeHtml(collectStateLabel(state))}</span>`
        : '';
  const inner = starListThumbInnerHtml(s.id, { tone: 'shensha', alt: s.id });
  const lock =
    state === 'pending'
      ? `<i class="ziwei-codex-thumb-lock" aria-hidden="true">🔒</i>`
      : '';
  return `
    <button type="button" class="ziwei-codex-short is-shensha ${stateCls} ${toneCls}" data-open-shensha="${escapeHtml(s.id)}" aria-label="${escapeHtml(ariaForCollectState(s.id, state))}">
      ${statusLine}
      <span class="ziwei-codex-short-row">
        <span class="ziwei-codex-short-thumb is-shensha ${stateCls}">${inner}${lock}${
          state === 'activated' ? '<i class="ziwei-codex-thumb-sheen" aria-hidden="true"></i>' : ''
        }</span>
        <span class="ziwei-codex-short-copy">
          <span class="ziwei-codex-short-name">${escapeHtml(s.id)}</span>
          <span class="ziwei-codex-short-kicker">神煞｜${escapeHtml(s.epithet)}${
            opts?.tone
              ? ` · ${escapeHtml(opts.tone === 'support' ? '护持' : opts.tone === 'caution' ? '提醒' : '中性')}`
              : ''
          }</span>
          ${themeBit}
          <span class="ziwei-codex-short-keys">${escapeHtml(s.oneLiner)}</span>
          ${meetBit}
        </span>
      </span>
    </button>`;
}

export type StarDetailOpts = {
  entries: Map<string, { lastPalace?: string }>;
  chartHits: Map<string, ChartStarHit>;
  hasChart: boolean;
  detailTab: DetailTabId;
  palaceFocus: string;
  personId: string;
  view?: ZiweiChartView | null;
};

export function renderStarDetail(star: StarCard, opts: StarDetailOpts): string {
  const { entries, chartHits, hasChart, detailTab, palaceFocus, personId, view } = opts;
  const entry = entries.get(star.id);
  const p = getStarProfile(star.id);
  const hit = chartHits.get(star.id);
  const state = resolveCodexCollectState(star.id, chartHits, { hasChart, view });
  const person = getActivePerson();
  const yearHua = yearHuaForStar(person, star.id);
  const quest = findWeekQuestForStar(star.id, personId || person.id);
  const craft = craftBonusForStar(star.id, hit);
  const relatedCombos = COMBO_LORE.filter((c) => c.members.includes(star.id));

  const artInner =
    p?.artSrc
      ? `<img src="${escapeHtml(p.artSrc)}" alt="${escapeHtml(star.title)}" loading="eager" decoding="async" />`
      : majorStarArtImgHtml(star.id, { className: 'ziwei-detail-hero-img', alt: star.title });
  const art = artInner ? `<div class="ziwei-detail-hero">${artInner}</div>` : '';

  const statusBadge = yearHua
    ? `<p class="ziwei-detail-status is-year-hua">📅 ${escapeHtml(yearHua.label)}</p>`
    : state === 'pending'
      ? `<div class="ziwei-detail-status-row">
          <button type="button" class="ziwei-detail-lock" data-unlock-tip aria-expanded="false" aria-label="待觉醒，点查看如何解锁">🔒</button>
          <p class="ziwei-detail-unlock-tip" hidden>${escapeHtml(unlockHowToHint(star.id, state, { hasChart }))}</p>
        </div>`
      : state === 'absent'
        ? `<div class="ziwei-detail-status-row">
            <button type="button" class="ziwei-detail-lock is-absent" data-unlock-tip aria-expanded="false" aria-label="未入命盘，点查看说明">🌫️</button>
            <p class="ziwei-detail-unlock-tip" hidden>${escapeHtml(unlockHowToHint(star.id, state, { hasChart }))}</p>
          </div>`
        : state === 'met'
          ? `<p class="ziwei-detail-status is-met">${escapeHtml(collectStateDetailBadge(state, hit))}</p>
             <p><button type="button" class="ziwei-inline-link ziwei-goto-chart-cta" data-goto-chart="${escapeHtml(ziweiChartJumpQs({ star: star.id, palace: hit?.palace }))}">回盘面试炼 / 激活 →</button></p>`
          : `<p class="ziwei-detail-status is-${state}">${escapeHtml(collectStateDetailBadge(state, hit))}</p>`;

  const questBanner = quest
    ? `<a class="ziwei-detail-quest" href="/craft/quest">${escapeHtml(`📌 本周任务关联：${questRelateLine(quest, star.id)}`)}</a>`
    : '';

  const craftBadge = craft
    ? `<span class="ziwei-detail-craft">⚡ 命格加成：${escapeHtml(craft.axisLabel)} +${craft.value}</span>`
    : '';

  const tabs = (Object.keys(DETAIL_TAB_LABEL) as DetailTabId[])
    .map(
      (id) =>
        `<button type="button" class="ziwei-detail-tab ${detailTab === id ? 'is-on' : ''}" data-detail-tab="${id}" role="tab" aria-selected="${detailTab === id}">${escapeHtml(DETAIL_TAB_LABEL[id])}</button>`,
    )
    .join('');

  let tabBody = '';
  if (detailTab === 'portrait') {
    tabBody = p
      ? `<p>${escapeHtml(p.oneLiner)}</p><p class="ziwei-metaphor">${escapeHtml(p.metaphor)}</p><p>${escapeHtml(star.myth)}</p>`
      : `<p>${escapeHtml(star.myth)}</p><p>${escapeHtml(star.portrait)}</p>`;
  } else if (detailTab === 'trait') {
    tabBody = p
      ? stackSections([
          { title: '核心动力', body: p.trait.drive },
          { title: '天赋优势', body: p.trait.gift },
          { title: '阴影模式', body: p.trait.shadow },
          { title: '真正需要', body: p.trait.need },
        ])
      : `<p>${escapeHtml(star.trait)}</p>`;
  } else if (detailTab === 'mirror') {
    const love = p ? p.mirror.love : star.mirrorLove;
    const work = p ? p.mirror.work : star.mirrorWork;
    const wealth = p ? p.mirror.wealth : '财富面向随落宫与四化而变；先看财帛、官禄会照。';
    const health = p ? p.mirror.self : star.counsel;
    const social = p?.mirror.social;
    const mirrorRows = [
      { title: '感情', body: love },
      { title: '事业', body: work },
      { title: '财富', body: wealth },
      ...(social ? [{ title: '社交', body: social }] : []),
      { title: '健康 / 自我状态', body: health },
    ];
    tabBody = stackSections(mirrorRows);
  } else {
    const unlocked =
      isStarUnlocked(star.id) || state === 'activated' || state === 'met';
    const chartHit: ChartStarHit | undefined =
      hit ?? (entry?.lastPalace ? { palace: entry.lastPalace } : undefined);
    const youBlock = unlocked
      ? renderInChartSectionHtml(
          buildCodexInChartView(star.id, chartHit, 'major', {
            hasChart,
            yearHua,
          }),
          escapeHtml,
        )
      : `<p class="ziwei-star-locked">排盘遇见后，这里会记你与它的相遇。</p>
         <p><button type="button" class="ziwei-inline-link ziwei-goto-chart-cta" data-goto-chart="${escapeHtml(ziweiChartJumpQs({}))}">打开完整命盘 →</button></p>`;

    const encEntry = getCodexEntry(star.id) ?? entry;
    const rawEnc =
      encEntry && typeof encEntry === 'object' && 'encounters' in encEntry
        ? (encEntry as { encounters?: Array<{ at: string; question?: string; palace?: string; summary?: string }> })
            .encounters
        : undefined;
    const encounters = Array.isArray(rawEnc) ? rawEnc : [];
    const firstEnc = encounters.length
      ? [...encounters].sort((a, b) => a.at.localeCompare(b.at))[0]
      : null;
    const meetTimeline =
      unlocked && encounters.length > 0
        ? `<section class="ziwei-enc-block" aria-label="牌面相遇时间线">
        <div class="ziwei-enc-first">
          <h3 class="ziwei-enc-first-label">第一次相遇</h3>
          <time class="ziwei-enc-first-date">${escapeHtml(new Date(firstEnc!.at).toLocaleString('zh-CN'))}</time>
          <p class="ziwei-enc-first-q">你问：${escapeHtml(firstEnc!.question || '（排盘遇见）')}</p>
          ${firstEnc!.palace ? `<p class="ziwei-enc-palace">落${escapeHtml(firstEnc!.palace)}</p>` : ''}
          ${firstEnc!.summary ? `<p class="ziwei-enc-summary">${escapeHtml(firstEnc!.summary)}</p>` : ''}
          ${
            encounters.length > 1
              ? `<p class="ziwei-enc-more">此后又与这颗星相遇 <strong>${encounters.length - 1}</strong> 次</p>`
              : ''
          }
        </div>
        <h3 class="ziwei-enc-timeline-title">相遇时间线</h3>
        <ol class="ziwei-enc-timeline">${encounters
          .map(
            (e) => `
          <li class="ziwei-enc-item">
            <time class="ziwei-enc-time">${escapeHtml(new Date(e.at).toLocaleString('zh-CN'))}</time>
            <p class="ziwei-enc-q">问：${escapeHtml(e.question || '（排盘遇见）')}</p>
            ${e.palace ? `<p class="ziwei-enc-palace">落${escapeHtml(e.palace)}</p>` : ''}
            ${(e.summary ?? '').trim() ? `<p class="ziwei-enc-summary">${escapeHtml(e.summary ?? '')}</p>` : ''}
          </li>`,
          )
          .join('')}</ol>
      </section>`
        : '';

    const palaceList = p?.palaces ?? [];
    const focusId =
      palaceFocus ||
      palaceList.find((h) => h.palaceId === hit?.palace)?.palaceId ||
      palaceList[0]?.palaceId ||
      '';
    const chips = palaceList
      .map((h) => {
        const on = h.palaceId === focusId || h.title === focusId;
        return `<button type="button" class="ziwei-palace-chip ${on ? 'is-on' : ''}" data-palace-chip="${escapeHtml(h.palaceId)}">${escapeHtml(h.title.replace(/宫$/, ''))}</button>`;
      })
      .join('');
    const focused = palaceList.find((h) => h.palaceId === focusId || h.title === focusId) ?? palaceList[0];
    let palacePane = `<p class="ziwei-codex-hint">落十二宫细读陆续补全；可先回命盘点宫位看动态解释。</p>`;
    if (focused) {
      const lore = getPalaceLore(focused.palaceId) ?? getPalaceLore(focused.title);
      const extras = [
        lore?.asks ? { title: '读这宫可问', body: lore.asks } : null,
        lore?.commonLooks ? { title: '常见场面', body: lore.commonLooks } : null,
        lore?.watchOut ? { title: '留意', body: lore.watchOut } : null,
      ].filter(Boolean) as Array<{ title: string; body: string }>;
      palacePane = `
        <section class="ziwei-palace-pane" id="ziwei-palace-${escapeHtml(focused.palaceId)}" data-palace-section="${escapeHtml(focused.palaceId)}">
          <h4 class="ziwei-palace-pane-title">${escapeHtml(focused.title)} <em>${escapeHtml(focused.hint)}</em></h4>
          <p class="ziwei-palace-pane-line">${escapeHtml(focused.line)}</p>
          ${extras.length ? stackSections(extras) : ''}
        </section>`;
    }

    const comboBlock = relatedCombos.length
      ? `<ul class="ziwei-meet-list">${relatedCombos
          .map(
            (c) =>
              `<li><button type="button" data-open-combo="${escapeHtml(c.id)}">${escapeHtml(c.title)} · ${escapeHtml(c.members.join('·'))}</button></li>`,
          )
          .join('')}</ul>`
      : `<p class="ziwei-codex-hint">暂无预置组合卡。可在命盘里点「三方四正 / 四化」看动态联动。</p>`;

    const brightTitle = brightnessSectionTitle(star.id);
    const gradeLabel = brightnessGradeLabel(star.id);
    const moreBlock = `
      <details class="ziwei-detail-more">
        <summary>更多 · ${escapeHtml(brightTitle.replace('状态', ''))} · 四化 · 组合</summary>
        <section class="ziwei-detail-block">
          <h3>${escapeHtml(brightTitle)}</h3>
          <p>亮度（${escapeHtml(gradeLabel)}）决定发挥顺不顺，不是吉凶判决。${
            hit?.brightness ? `你盘里此星：${escapeHtml(hit.brightness)}。` : ''
          }</p>
          <p><button type="button" class="ziwei-inline-link" data-open-term="庙旺落陷">查看庙旺落陷 →</button></p>
          <p><button type="button" class="ziwei-inline-link" data-goto-luoxian>🔍 看看我命盘里哪颗星落陷了？</button></p>
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
        </section>
        <section class="ziwei-detail-block"><h3>相关组合</h3>${comboBlock}</section>
      </details>`;

    tabBody = `
      ${youBlock}
      ${meetTimeline}
      <h3 class="ziwei-palace-chips-title">落十二宫</h3>
      <p class="ziwei-codex-hint">点宫位标签展开对应内容 · 两侧箭头可翻页</p>
      <div class="ziwei-palace-chips-rail" data-palace-chip-rail>
        <button type="button" class="ziwei-palace-chips-nav is-prev" data-palace-chip-nav="-1" aria-label="上一组宫位">‹</button>
        <div class="ziwei-palace-chips" role="tablist" aria-label="十二宫">${chips}</div>
        <button type="button" class="ziwei-palace-chips-nav is-next" data-palace-chip-nav="1" aria-label="下一组宫位">›</button>
      </div>
      ${palacePane}
      ${moreBlock}`;
  }

  const counsel = escapeHtml(p?.counsel ?? star.counsel);

  return `
    <article class="ziwei-star-detail is-${state}">
      <button type="button" class="ziwei-detail-back" data-close-detail>← 返回图鉴</button>
      ${art}
      <header class="ziwei-detail-top">
        <p class="ziwei-kicker">星曜图鉴 · ${escapeHtml(starListKicker(star))}</p>
        <div class="ziwei-detail-title-row">
          <h2 class="ziwei-remember-name">${escapeHtml(star.title)}</h2>
          <button type="button" class="ziwei-fav-btn ${isZiweiCodexFavorite(star.id) ? 'is-on' : ''}" data-toggle-fav="${escapeHtml(star.id)}" aria-pressed="${isZiweiCodexFavorite(star.id)}">${escapeHtml(ziweiFavButtonLabel(isZiweiCodexFavorite(star.id)))}</button>
          ${statusBadge}
          ${craftBadge}
        </div>
        ${
          p?.keywords?.length
            ? `<ul class="ziwei-keywords">${p.keywords.map((k) => `<li>${escapeHtml(k)}</li>`).join('')}</ul>`
            : ''
        }
        ${questBanner}
      </header>
      <div class="ziwei-detail-tabs" role="tablist">${tabs}</div>
      <section class="ziwei-detail-tab-panel" data-tab-panel>${tabBody}</section>
      <section class="ziwei-detail-counsel"><h3>给你的箴言</h3><p>${counsel}</p></section>
    </article>`;
}

function renderSoftTabBody(
  sections: SoftStarSections,
  detailTab: DetailTabId,
  inChartHtml: string,
): string {
  if (detailTab === 'portrait') {
    return `<p>${escapeHtml(sections.oneLiner)}</p>
      <p class="ziwei-metaphor">${escapeHtml(sections.metaphor)}</p>
      <pre class="ziwei-learn-body">${escapeHtml(sections.traditional)}</pre>`;
  }
  if (detailTab === 'trait') {
    return stackSections([
      { title: '核心动力', body: sections.trait.drive },
      { title: '天赋 / 作用', body: sections.trait.gift },
      { title: '阴影模式', body: sections.trait.shadow },
      { title: '真正需要', body: sections.trait.need },
    ]);
  }
  if (detailTab === 'mirror') {
    return stackSections([
      { title: '感情', body: sections.mirror.love },
      { title: '事业', body: sections.mirror.work },
      { title: '财富', body: sections.mirror.wealth },
      { title: '社交', body: sections.mirror.social },
      { title: '健康 / 自我状态', body: sections.mirror.self },
      { title: '怎么用', body: sections.howTo },
      ...(sections.when ? [{ title: '何时用到', body: sections.when }] : []),
    ]);
  }
  return (
    inChartHtml ||
    `<p class="ziwei-star-locked">排盘遇见后，这里会记你与它的相遇。</p>`
  );
}

export type SoftDetailOpts = {
  chartHits: Map<string, ChartStarHit>;
  hasChart: boolean;
  detailTab: DetailTabId;
  favHtml: string;
  schoolBlock?: string;
  footHint?: string;
};

function renderSoftStarShell(
  sections: SoftStarSections,
  openAttr: string,
  opts: SoftDetailOpts,
  kind: 'minor' | 'shensha',
): string {
  const hit = opts.chartHits.get(sections.title);
  const state = resolveCodexCollectState(sections.title, opts.chartHits, {
    hasChart: opts.hasChart,
  });
  const inChart = renderInChartSectionHtml(
    buildCodexInChartView(sections.title, hit, kind, { hasChart: opts.hasChart }),
    escapeHtml,
  );
  const tabs = (Object.keys(DETAIL_TAB_LABEL) as DetailTabId[])
    .map(
      (id) =>
        `<button type="button" class="ziwei-detail-tab ${opts.detailTab === id ? 'is-on' : ''}" data-detail-tab="${id}" role="tab" aria-selected="${opts.detailTab === id}">${escapeHtml(DETAIL_TAB_LABEL[id])}</button>`,
    )
    .join('');
  const tabBody = renderSoftTabBody(sections, opts.detailTab, inChart);
  const meetLine =
    state === 'activated' || state === 'met'
      ? formatShenshaMeetAtLine(hit)
      : null;
  const status =
    meetLine
      ? `<p class="ziwei-detail-status is-${state}">${escapeHtml(meetLine)}</p>`
      : state === 'absent'
        ? `<p class="ziwei-detail-status is-absent">${escapeHtml(collectStateDetailBadge(state))}</p>`
        : '';
  return `
    <article class="ziwei-star-detail is-lit" ${openAttr}>
      <button type="button" class="ziwei-detail-back" data-close-detail>← 返回图鉴</button>
      <header class="ziwei-detail-top">
        <p class="ziwei-kicker">${escapeHtml(sections.kicker)}</p>
        <div class="ziwei-detail-title-row">
          <h2 class="ziwei-remember-name">${escapeHtml(sections.title)}</h2>
          ${opts.favHtml}
          ${status}
        </div>
        <ul class="ziwei-keywords">${sections.keywords.map((k) => `<li>${escapeHtml(k)}</li>`).join('')}</ul>
      </header>
      <div class="ziwei-detail-tabs" role="tablist">${tabs}</div>
      <section class="ziwei-detail-tab-panel" data-tab-panel>${tabBody}</section>
      ${opts.schoolBlock ?? ''}
      ${opts.footHint ? `<p class="ziwei-codex-hint">${escapeHtml(opts.footHint)}</p>` : ''}
      <section class="ziwei-detail-counsel"><h3>给你的箴言</h3><p>${escapeHtml(sections.howTo)}</p></section>
    </article>`;
}

/** 杂曜详情 · 与主星同款四栏 */
export function renderMinorDetailRich(m: MinorStarLore, opts: SoftDetailOpts): string {
  return renderSoftStarShell(sectionsFromMinor(m), `data-soft-kind="minor"`, opts, 'minor');
}

/** 神煞详情 · 与主星同款四栏 */
export function renderShenshaDetailRich(s: ShenshaLore, opts: SoftDetailOpts): string {
  return renderSoftStarShell(sectionsFromShensha(s), `data-soft-kind="shensha"`, opts, 'shensha');
}
