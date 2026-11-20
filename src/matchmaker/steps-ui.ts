/**
 * 红娘 v2 UI：人池 → 理由 → 场合 → 按年猜 → 揭晓 → 续追
 */
import { openBaziCodexPopup } from '../ui/bazi-codex-popup.ts';
import { castCharacter } from './cast.ts';
import { findInPool, type MatchmakerCharacter } from './characters.ts';
import {
  MATCH_REASONS,
  VENUES,
  getEvent,
  type VenueId,
} from './events.ts';
import { buildGuessChartHint, miniPillarsHtml } from './hints.ts';
import { LIFE_STAGES, timelineHtml } from './life-stages.ts';
import { bindPersonSheetClicks, type ChartSystemTab } from './person-sheet.ts';
import type { MatchmakerStore } from './store.ts';
import { tagLabel } from './tags.ts';
import { tagsFromCasts } from './tags.ts';
import { isTwoGenLegacyPair } from './twogen-sample.ts';
import { coupleYearLuck, type CoupleYearLuck } from './year-luck.ts';

export type { ChartSystemTab };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function avatarTone(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 3)) % 5;
  return h + 1;
}

function ageLine(ch: MatchmakerCharacter): string {
  const y = Number(ch.birthYear);
  if (!Number.isFinite(y) || y < 1900) return '';
  const age = Math.max(18, new Date().getFullYear() - y);
  return `${age}岁上下`;
}

function charCard(
  ch: MatchmakerCharacter,
  selected: boolean,
  rematchAnchor: boolean,
  isMainline: boolean,
): string {
  const id = escapeHtml(ch.id);
  const tone = avatarTone(ch.id);
  const gender = ch.gender === 'female' ? '女' : '男';
  const ageJob = [ageLine(ch), ch.job].filter(Boolean).join(' · ');
  const place = ch.city || ch.birthPlace || '';
  const genTag = ch.lifeTags.find((t) => /^gen:\d+$/.test(t));
  const genN = genTag ? Number(genTag.slice(4)) : 0;
  const genLabel =
    genN >= 2 && !ch.lifeTags.includes('filler')
      ? genN === 2
        ? '二代'
        : `${genN}代`
      : '';
  const chooseLabel = rematchAnchor
    ? '保留此人'
    : selected
      ? '已选中'
      : '选这位';
  return `
  <article class="mm-char mm-tone-${tone}${selected || rematchAnchor ? ' is-selected' : ''}${isMainline ? ' is-mainline' : ''}" data-char-id="${id}" data-toggle-char="${id}" role="button" tabindex="0" aria-pressed="${selected || rematchAnchor}" title="${rematchAnchor ? '换伴侣中 · 此人已保留' : isMainline ? '主线人家 · 点卡片可选中' : '点卡片可选中；点头像/名字/了解看简介'}">
    <div class="mm-person-top">
      <button type="button" class="mm-char-avatar" data-detail-char="${id}" title="了解这个人" aria-label="了解 ${escapeHtml(ch.nickname)}">${escapeHtml(ch.nickname.slice(0, 1))}</button>
      <div class="mm-person-id">
        <div class="mm-char-head">
          <button type="button" class="mm-char-name" data-detail-char="${id}" title="了解这个人">${escapeHtml(ch.nickname)}</button>
          <span class="mm-gender">${gender}</span>
          ${isMainline ? '<span class="mm-picked-badge mm-badge-mainline">主线</span>' : ''}
          ${genLabel ? `<span class="mm-picked-badge mm-badge-soft">${genLabel}</span>` : ''}
        </div>
        ${ageJob ? `<p class="mm-char-meta-line">${escapeHtml(ageJob)}</p>` : ''}
        ${place ? `<p class="mm-char-meta-line">${escapeHtml(place)}</p>` : ''}
      </div>
    </div>
    <blockquote class="mm-char-quote">“${escapeHtml(ch.quote)}”</blockquote>
    <div class="mm-card-actions">
      <button type="button" class="mm-char-link" data-detail-char="${id}">了解这个人</button>
      <button type="button" class="mm-char-choose${selected || rematchAnchor ? ' is-on' : ''}" data-toggle-char="${id}" aria-pressed="${selected || rematchAnchor}">${chooseLabel}</button>
    </div>
  </article>`;
}

export function renderPoolStep(store: MatchmakerStore): string {
  const selected = new Set(store.selectedIds);
  const isTutorial = store.mode === 'tutorial';
  const isTwoGen = store.mode === 'twogen';
  const isGen2Lens = store.matchLens === 'gen2';
  const rematch = store.rematch;
  const anchorId = rematch?.anchorId ?? null;
  const anchorName =
    (anchorId &&
      (findInPool(store.pool, anchorId) ?? store.roster.find((c) => c.id === anchorId))
        ?.nickname) ||
    '此人';
  const title = rematch
    ? `给${escapeHtml(anchorName)}换伴侣`
    : isGen2Lens
      ? '为二代做媒'
      : isTutorial
        ? '教程关 · 四人样例'
        : isTwoGen
          ? '两代小样 · 今天来的人'
          : '这一批人';
  const lead = rematch
    ? '保留此人的出生与性格，另选一位牵线。当前故事已清空覆盖重开。'
    : isGen2Lens
      ? '近失线的孩子已成年。二代有自己的见面节奏；可牵晚芽与清禾，也可另选。'
      : isTutorial
        ? '点卡片或「选这位」入选；点头像/名字/「了解这个人」看简介与盘。凑满两位再牵线。'
        : isTwoGen
          ? '这一批里可能碰到父辈差点约成后的下一代。要专门为他们做媒，再点下面的入口。'
          : '点卡片或「选这位」入选；点头像/名字/「了解这个人」看简介。挑两位牵线。';
  const hint = rematch
    ? '<p class="mm-learn-hint">点另一位候选人；牵红线后旧线不会保留。</p>'
    : isGen2Lens
      ? '<p class="mm-learn-hint">父辈阿晚与清砚的近失在红娘簿；家谱里可翻「没约成」。</p>'
      : isTutorial
        ? '<p class="mm-learn-hint">建议：阿橙 + 木言 → 茶馆。先把两人盘看明白再牵。</p>'
        : isTwoGen
          ? '<p class="mm-learn-hint">标了「二代」的，是簿里记下的下一代——先看盘也行，专门做媒再点入口。</p>'
          : '';
  const topActions = rematch
    ? `<button type="button" class="life-btn-ghost" data-mm-leave-rematch>结束换伴侣</button>
       <button type="button" class="life-btn-ghost" data-mm-refresh-pool>刷新</button>`
    : isTutorial
      ? `<button type="button" class="life-btn-ghost" data-mm-free-pool>离开教程 · 随机再来一批</button>`
      : isTwoGen
        ? `<button type="button" class="life-btn-ghost" data-mm-view-ledger>红娘簿</button>
         ${
           isGen2Lens
             ? `<button type="button" class="life-btn-ghost" data-mm-leave-gen2>离开二代做媒</button>`
             : `<button type="button" class="life-btn-primary" data-mm-enter-gen2>继续为二代做媒 ›</button>`
         }
         <button type="button" class="life-btn-ghost" data-mm-free-pool>离开小样 · 随机再来一批</button>`
        : `<button type="button" class="life-btn-primary" data-mm-create-char>自创一位</button>
         <button type="button" class="life-btn-ghost" data-mm-tengod-lesson>为什么辛是正官</button>
         <button type="button" class="life-btn-ghost" data-mm-intimacy-lesson>怎么看亲密关系</button>
         <button type="button" class="life-btn-ghost" data-mm-refresh-pool>刷新</button>
         <button type="button" class="life-btn-ghost" data-mm-tutorial-pool>教程关：四人样例</button>
         <button type="button" class="life-btn-ghost" data-mm-twogen-pool>两代小样</button>`;
  const rematchBanner = anchorId
    ? `<aside class="mm-rematch-banner" aria-live="polite">
        <p class="mm-sub" style="margin:0">给${escapeHtml(anchorName)}换伴侣</p>
        <p class="mm-muted" style="margin:4px 0 0">已覆盖旧线。保留出生与性格，另选一位再牵。</p>
        <button type="button" class="life-btn-ghost" data-mm-leave-rematch>结束换伴侣</button>
      </aside>`
    : '';
  const mainline =
    store.mainlineId != null
      ? findInPool(store.pool, store.mainlineId) ??
        store.roster.find((c) => c.id === store.mainlineId)
      : undefined;
  const mainlineBanner =
    mainline && !anchorId
      ? `<aside class="mm-mainline-banner" aria-live="polite">
          <p class="mm-sub" style="margin:0">正在追 · ${escapeHtml(mainline.nickname)}</p>
          <p class="mm-muted" style="margin:4px 0 0">生辰与经历会留着。换伴侣只换对方，好对照「如果遇见另一个人」。也可「自创一位」带着念头养人。</p>
        </aside>`
      : '';
  return `
  <section class="mm-section" aria-label="候选人">
    <h2 class="mm-section-title">${title}</h2>
    <p class="mm-section-lead">${lead}</p>
    ${hint}
    ${mainlineBanner}
    ${rematchBanner}
    <div class="mm-actions mm-actions-top">
      ${topActions}
    </div>
    <div class="mm-char-grid">
      ${store.pool
        .map((c) =>
          charCard(
            c,
            selected.has(c.id),
            c.id === anchorId,
            c.id === store.mainlineId,
          ),
        )
        .join('')}
    </div>
    <p class="mm-muted">已选 ${selected.size}/2${
      anchorId ? ` · 换伴侣中` : ''
    }${mainline && !anchorId ? ` · 主线 ${escapeHtml(mainline.nickname)}` : ''}${isGen2Lens ? ' · 二代做媒' : ''}</p>
    <div class="mm-actions">
      <button type="button" class="life-btn-primary" data-mm-to-reason ${selected.size === 2 ? '' : 'disabled'}>牵红线 ›</button>
    </div>
  </section>`;
}

export function renderReasonStep(store: MatchmakerStore): string {
  const names = store.selectedIds
    .map((id) => findInPool(store.pool, id)?.nickname ?? id)
    .join(' × ');
  const pairLinks = store.selectedIds
    .map((id) => {
      const ch = findInPool(store.pool, id);
      if (!ch) return '';
      return `<button type="button" class="mm-char-detail-btn" data-detail-char="${escapeHtml(ch.id)}">了解 ${escapeHtml(ch.nickname)}</button>`;
    })
    .join(' · ');
  const legacyHint =
    store.mode === 'twogen' && isTwoGenLegacyPair(store.selectedIds)
      ? `<p class="mm-learn-hint">他们的父辈二十年前差点约成——可点「红娘簿」翻看近失记录。</p>
         <p class="mm-char-tools"><button type="button" class="mm-char-detail-btn" data-mm-view-ledger>打开红娘簿</button></p>`
      : '';
  return `
  <section class="mm-section" aria-label="撮合理由">
    <h2 class="mm-section-title">你为什么觉得她们配</h2>
    <p class="mm-section-lead">正在撮合：${escapeHtml(names)}。可再弹窗看盘，再选一句判断。</p>
    ${legacyHint}
    <p class="mm-char-tools">${pairLinks}</p>
    <div class="mm-venue-list">
      ${MATCH_REASONS.map(
        (r) => `
        <button type="button" class="mm-venue${store.reasonId === r.id ? ' is-on' : ''}" data-pick-reason="${escapeHtml(r.id)}">
          <strong>${escapeHtml(r.label)}</strong>
        </button>`,
      ).join('')}
    </div>
    ${hepanPreview(store)}
    <div class="mm-actions">
      <button type="button" class="life-btn-ghost" data-mm-back-pool>← 回去选人</button>
      <button type="button" class="life-btn-primary" data-mm-to-venue ${store.reasonId ? '' : 'disabled'}>安排见面 ›</button>
    </div>
  </section>`;
}

function hepanPreview(store: MatchmakerStore): string {
  if (store.selectedIds.length !== 2) return '';
  const a = findInPool(store.pool, store.selectedIds[0]!);
  const b = findInPool(store.pool, store.selectedIds[1]!);
  if (!a || !b) return '';
  const ca = castCharacter(a);
  const cb = castCharacter(b);
  if ('error' in ca || 'error' in cb) return '';
  const tags = tagsFromCasts(ca, cb);
  return `
  <div class="mm-hepan-preview">
    <h3 class="mm-sub">盘面线索（供你判断，不替你决定结局）</h3>
    <div class="mm-day-row">
      <div class="mm-day-cell"><strong>${escapeHtml(a.nickname)}</strong><p class="mm-day-gz"><span class="mm-mark-stem">${escapeHtml(ca.dayStem)}</span><span class="mm-mark-branch is-hi">${escapeHtml(ca.dayBranch)}</span></p></div>
      <div class="mm-day-cell"><strong>${escapeHtml(b.nickname)}</strong><p class="mm-day-gz"><span class="mm-mark-stem">${escapeHtml(cb.dayStem)}</span><span class="mm-mark-branch is-hi">${escapeHtml(cb.dayBranch)}</span></p></div>
    </div>
    <p class="mm-relation">${escapeHtml(tags.hepan.note)}</p>
    <p class="mm-relation">${
      tags.hepan.dayRelation.length
        ? tags.hepan.dayRelation
            .map(
              (l) =>
                `<button type="button" class="mm-term-link" data-bazi-term="${l.includes('冲') ? '六冲' : l.includes('合') ? '六合' : '地支六冲'}">${escapeHtml(l)}</button>`,
            )
            .join(' · ')
        : '日支无直接合冲刑害'
    }</p>
    <p class="mm-muted">标签：${tags.tags.map((t) => escapeHtml(tagLabel(t))).join(' · ')}</p>
  </div>`;
}

function yearLuckPeekHtml(year: number, luck: CoupleYearLuck | null): string {
  if (!luck) return '';
  const row = (p: CoupleYearLuck['a']) => {
    const marks = [
      p.hongLuan ? '红鸾' : '',
      p.tianXi ? '天喜' : '',
      p.yiMa ? '驿马' : '',
    ]
      .filter(Boolean)
      .join(' · ');
    return `<div class="mm-day-cell">
      <strong>${escapeHtml(p.nickname)} · ${p.year}</strong>
      <p class="mm-muted">大运 ${escapeHtml(p.dayunGanZhi || '—')}${p.dayunStemGod ? `（${escapeHtml(p.dayunStemGod)}）` : ''}</p>
      <p class="mm-muted">流年 ${escapeHtml(p.liunianGanZhi || '—')}${p.liunianStemGod ? `（${escapeHtml(p.liunianStemGod)}）` : ''}</p>
      ${marks ? `<p class="mm-learn-hint">${escapeHtml(marks)}</p>` : '<p class="mm-muted">无红鸾/驿马硬标记</p>'}
    </div>`;
  };
  return `
  <details class="mm-chart-peek" data-mm-year-luck>
    <summary>看 ${year} 年 · 大运与流年</summary>
    <p class="mm-learn-hint">${escapeHtml(luck.opportunityLine)}</p>
    <div class="mm-day-row">${row(luck.a)}${row(luck.b)}</div>
    <p class="mm-muted">红鸾给「认识新人」的机会加权；驿马给走动、多留一晚找场合。成不成仍由她们走出来。</p>
    <p class="mm-muted">
      <button type="button" class="mm-term-link" data-bazi-term="红鸾">红鸾</button>
      ·
      <button type="button" class="mm-term-link" data-bazi-term="驿马">驿马</button>
    </p>
  </details>`;
}

export function renderVenueStep(store: MatchmakerStore): string {
  return `
  <section class="mm-section" aria-label="见面场合">
    <h2 class="mm-section-title">你只负责牵线</h2>
    <p class="mm-section-lead">你先安排一次场合；她们可能约两次都没约上。真正见面要等故事年里的运程机会——你管不了结局。</p>
    <div class="mm-venue-list">
      ${VENUES.map(
        (v) => `
        <button type="button" class="mm-venue${store.venueId === v.id ? ' is-on' : ''}" data-pick-venue="${escapeHtml(v.id)}">
          <strong>${escapeHtml(v.title)}</strong>
          <span>${escapeHtml(v.blurb)}</span>
        </button>`,
      ).join('')}
    </div>
    <div class="mm-actions">
      <button type="button" class="life-btn-ghost" data-mm-back-reason>← 理由</button>
      <button type="button" class="life-btn-primary" data-mm-start-story ${store.venueId ? '' : 'disabled'}>牵线，等回信 ›</button>
    </div>
  </section>`;
}

export function renderGuessStep(store: MatchmakerStore): string {
  const ev = store.activeEvent;
  if (!ev) return `<p class="mm-muted">没有进行中的事件。</p>`;
  const def = getEvent(ev.eventId);
  if (!def) return `<p class="mm-muted">事件缺失。</p>`;
  const a = findInPool(store.pool, store.selectedIds[0] ?? '');
  const b = findInPool(store.pool, store.selectedIds[1] ?? '');
  const year = ev.storyYear || store.couple?.startYear || new Date().getFullYear();
  const yearLuck = a && b ? coupleYearLuck(a, b, year) : null;
  const history = store.couple?.history ?? [];
  const scene =
    def.scene && a && b
      ? def
          .scene({
            a,
            b,
            year,
            yearLuck,
            venueId: store.couple?.venueId ?? 'cafe',
            history,
          })
          .split(/\n\n+/)
          .map((p) => `<p>${escapeHtml(p)}</p>`)
          .join('')
      : '';

  const historyPeek =
    history.length > 0
      ? `<details class="mm-chart-peek">
        <summary>回看前面发生的事</summary>
        <ul class="mm-learn-list">
          ${history
            .map(
              (h) =>
                `<li>${h.year ? `${h.year} · ` : ''}${escapeHtml(h.summary)}${
                  h.reviewClues
                    ? ` — ${escapeHtml(h.reviewClues.aftermath)}`
                    : ''
                }</li>`,
            )
            .join('')}
        </ul>
      </details>`
      : '';

  let chartPeek = '';
  if (a && b) {
    const ca = castCharacter(a);
    const cb = castCharacter(b);
    if (!('error' in ca) && !('error' in cb)) {
      const preferId = ev.eventId === 'year-turn' ? a.id : undefined;
      const hint = buildGuessChartHint(a, b, ca, cb, preferId);
      const focusCast = hint.focusPersonId === a.id ? ca : cb;
      chartPeek = `
      <details class="mm-chart-peek" data-mm-chart-hint>
        <summary>看两人的盘</summary>
        <p class="mm-learn-hint">${escapeHtml(hint.layer1)}</p>
        <p class="mm-muted">${escapeHtml(hint.focusName)} 四柱</p>
        <div class="mm-pillars">${miniPillarsHtml(focusCast, hint.highlightKeys)}</div>
        <details class="mm-hint-layer2">
          <summary>再点一层：这是什么意思</summary>
          <p class="mm-relation"><strong>${escapeHtml(hint.layer2Title)}</strong></p>
          <p class="mm-muted">${escapeHtml(hint.layer2Body)}</p>
          <p class="mm-muted">${escapeHtml(hint.habitLine)}</p>
          <p class="mm-muted">
            <button type="button" class="mm-term-link" data-bazi-term="${escapeHtml(hint.term)}">打开图鉴 · ${escapeHtml(hint.term)}</button>
          </p>
        </details>
        <p class="mm-muted" style="margin-top:12px">${escapeHtml(a.nickname)} × ${escapeHtml(b.nickname)} 日柱对照</p>
        <div class="mm-day-row">
          <div class="mm-day-cell"><strong>${escapeHtml(a.nickname)}</strong><p class="mm-day-gz"><span class="mm-mark-stem">${escapeHtml(ca.dayStem)}</span><span class="mm-mark-branch is-hi">${escapeHtml(ca.dayBranch)}</span></p></div>
          <div class="mm-day-cell"><strong>${escapeHtml(b.nickname)}</strong><p class="mm-day-gz"><span class="mm-mark-stem">${escapeHtml(cb.dayStem)}</span><span class="mm-mark-branch is-hi">${escapeHtml(cb.dayBranch)}</span></p></div>
        </div>
      </details>`;
    }
  }

  const luckPeek = a && b ? yearLuckPeekHtml(year, yearLuck) : '';
  const timeline = timelineHtml(
    store.couple?.history.map((h) => h.eventId) ?? [],
    ev.eventId,
    escapeHtml,
  );

  return `
  <section class="mm-section" aria-label="猜选择">
    ${timeline}
    <p class="mm-kicker">${year} 年 · 你只能猜，管不了</p>
    <h2 class="mm-section-title">${escapeHtml(def.title)}</h2>
    <div class="mm-letter mm-scene">${scene}</div>
    <p class="mm-section-lead">${escapeHtml(def.prompt)}</p>
    ${luckPeek}
    ${chartPeek}
    ${historyPeek}
    <div class="mm-venue-list">
      ${def.choices
        .map(
          (c) => `
        <button type="button" class="mm-venue${ev.playerGuessId === c.id ? ' is-on' : ''}" data-pick-guess="${escapeHtml(c.id)}">
          <strong>${escapeHtml(c.label)}</strong>
        </button>`,
        )
        .join('')}
    </div>
    <div class="mm-actions">
      <button type="button" class="life-btn-primary" data-mm-reveal ${ev.playerGuessId ? '' : 'disabled'}>揭晓她们做了什么 ›</button>
    </div>
  </section>`;
}

export function renderRevealStep(store: MatchmakerStore): string {
  const r = store.lastReveal;
  const pair = store.selectedIds.map((id) => findInPool(store.pool, id));
  if (!r || !pair[0] || !pair[1]) return `<p class="mm-muted">没有回信。</p>`;
  const paras = r.letterBody
    .split(/\n\n+/)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('');
  const guessLine =
    r.guessCorrect === null
      ? ''
      : r.guessCorrect
        ? '<p class="mm-learn-hint">你的猜测与本局一致。</p>'
        : '<p class="mm-learn-hint">你猜错了——这正是「我觉得你俩挺配，怎么就过成这样了」的时候。</p>';

  const analyses = (r.choiceAnalyses ?? [])
    .map((c) => {
      const on = c.id === r.actualChoiceId;
      return `<details class="mm-analysis${on ? ' is-actual' : ''}" ${on ? 'open' : ''}>
        <summary>${escapeHtml(c.label)}${on ? ' · 本局' : ''}</summary>
        <p class="mm-muted">${escapeHtml(c.body)}</p>
      </details>`;
    })
    .join('');

  const review = r.reviewClues
    ? `<div class="mm-review-clues">
        <h3 class="mm-sub">回看三行</h3>
        <ol class="mm-learn-list">
          <li><strong>运程机会</strong> — ${escapeHtml(r.reviewClues.fortune)}</li>
          <li><strong>为什么这么选</strong> — ${escapeHtml(r.reviewClues.choiceWhy)}</li>
          <li><strong>后来影响</strong> — ${escapeHtml(r.reviewClues.aftermath)}</li>
        </ol>
      </div>`
    : '';

  const yearTag = r.storyYear ? `${r.storyYear} 年 · ` : '';
  const timeline = timelineHtml(
    store.couple?.history.map((h) => h.eventId) ?? [],
    store.activeEvent?.eventId ?? store.couple?.history.at(-1)?.eventId ?? null,
    escapeHtml,
  );

  return `
  <section class="mm-section" aria-label="回信">
    ${timeline}
    <p class="mm-kicker">${yearTag}回信 · ${escapeHtml(r.kind)}${r.twistHint ? ` · ${escapeHtml(r.twistHint)}` : ''}</p>
    <h2 class="mm-section-title">${escapeHtml(r.letterTitle)}</h2>
    <div class="mm-letter">${paras}</div>
    ${guessLine}
    <h3 class="mm-sub">双方心声</h3>
    <p class="mm-voice"><strong>${escapeHtml(pair[0].nickname)}</strong>：${escapeHtml(r.voiceA)}</p>
    <p class="mm-voice"><strong>${escapeHtml(pair[1].nickname)}</strong>：${escapeHtml(r.voiceB)}</p>
    ${review}
    ${
      analyses
        ? `<h3 class="mm-sub">三个选项怎么读</h3>
           <p class="mm-learn-hint">本局发生的那条默认展开。</p>
           ${analyses}`
        : ''
    }
    <details class="mm-chart-peek">
      <summary>看看这次的线索</summary>
      <ul class="mm-learn-list">
        ${r.learnBullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
      </ul>
      <p class="mm-muted">
        <button type="button" class="mm-term-link" data-bazi-term="红鸾">红鸾</button>
        ·
        <button type="button" class="mm-term-link" data-bazi-term="比肩">比肩</button>
        ·
        <button type="button" class="mm-term-link" data-bazi-term="六冲">六冲</button>
      </p>
    </details>
    <p class="mm-muted">信任 ${store.couple?.trust ?? 0} · 张力 ${store.couple?.tension ?? 0}</p>
    <div class="mm-actions">
      <button type="button" class="life-btn-primary" data-mm-follow>继续追这对 ›</button>
      <button type="button" class="life-btn-ghost" data-mm-new-pair>另牵一对 ›</button>
    </div>
    ${rematchActionsHtml(pair[0], pair[1], store.mainlineId)}
  </section>`;
}

function followHouseholdBtn(ch: MatchmakerCharacter, mainlineId: string | null): string {
  if (mainlineId === ch.id) {
    return `<span class="mm-mainline-pill">正在追 · ${escapeHtml(ch.nickname)}</span>`;
  }
  return `<button type="button" class="life-btn-ghost" data-mm-follow-household="${escapeHtml(ch.id)}">追这户人家 · ${escapeHtml(ch.nickname)}</button>`;
}

function rematchActionsHtml(
  a: MatchmakerCharacter | undefined,
  b: MatchmakerCharacter | undefined,
  mainlineId: string | null = null,
): string {
  if (!a || !b) return '';
  return `<div class="mm-actions mm-rematch-actions">
    <button type="button" class="life-btn-ghost" data-mm-rematch="${escapeHtml(a.id)}">给${escapeHtml(a.nickname)}换伴侣</button>
    <button type="button" class="life-btn-ghost" data-mm-rematch="${escapeHtml(b.id)}">给${escapeHtml(b.nickname)}换伴侣</button>
  </div>
  <div class="mm-actions mm-follow-actions">
    ${followHouseholdBtn(a, mainlineId)}
    ${followHouseholdBtn(b, mainlineId)}
  </div>
  <p class="mm-muted">换伴侣会清空当前故事并覆盖重开，只保留所选之人的同一份生辰。「追这户」把 TA 定成主线。</p>`;
}

export function renderFollowStep(store: MatchmakerStore): string {
  const c = store.couple;
  if (!c) return `<p class="mm-muted">没有在追的一对。</p>`;
  const a =
    findInPool(store.pool, c.idA) ?? store.roster.find((p) => p.id === c.idA);
  const b =
    findInPool(store.pool, c.idB) ?? store.roster.find((p) => p.id === c.idB);
  const reason = MATCH_REASONS.find((r) => r.id === c.reasonId)?.label ?? '';
  const ids = c.history.map((h) => h.eventId);
  const nextId = LIFE_STAGES.find((s) => !ids.includes(s.id))?.id ?? null;
  const nextDef = nextId ? getEvent(nextId) : null;
  const nextStage = LIFE_STAGES.find((s) => s.id === nextId);
  const nextLabel = nextDef
    ? `${nextStage?.label ?? ''} · ${nextDef.title}`
    : '故事告一段落';

  return `
  <section class="mm-section" aria-label="续追">
    <h2 class="mm-section-title">${escapeHtml(a?.nickname ?? '')} × ${escapeHtml(b?.nickname ?? '')}</h2>
    <p class="mm-section-lead">你当初的判断：${escapeHtml(reason)}。故事从 ${c.startYear} 年起算。固定骨架九段；段内年份与场合由两人运程加权。</p>
    ${timelineHtml(ids, nextId, escapeHtml)}
    <h3 class="mm-sub">年表</h3>
    <ul class="mm-learn-list">
      ${
        c.history
          .map((h) => {
            const stage = LIFE_STAGES.find((s) => s.id === h.eventId)?.label ?? '';
            const clue = h.reviewClues
              ? `<span class="mm-muted"> — ${escapeHtml(h.reviewClues.fortune.slice(0, 36))}${h.reviewClues.fortune.length > 36 ? '…' : ''}</span>`
              : '';
            return `<li><strong>${h.year || c.startYear}</strong> · ${escapeHtml(stage)} · ${escapeHtml(h.summary)}${clue}</li>`;
          })
          .join('') || '<li>还没有揭晓的事件</li>'
      }
    </ul>
    <p class="mm-muted">下一站：${escapeHtml(nextLabel)} · 信任 ${c.trust} · 张力 ${c.tension}</p>
    <div class="mm-actions">
      <button type="button" class="life-btn-primary" data-mm-next-event ${nextDef ? '' : 'disabled'}>${
        nextDef ? `进入「${nextStage?.label ?? '下一段'}」 ›` : '已完结'
      }</button>
      <button type="button" class="life-btn-ghost" data-mm-new-pair>回去选人 ›</button>
    </div>
    ${rematchActionsHtml(a, b, store.mainlineId)}
  </section>`;
}

export function tryPlayHintHtml(): string {
  return `
  <aside class="mm-tryplay" aria-label="怎么玩">
    <p class="mm-tryplay-title">九段人生</p>
    <ol>
      <li>开局已有主线；可自创或「追这户」。想学顺序点「怎么看亲密关系」。</li>
      <li>教学题可对错；猜剧情只猜——两套题分开。</li>
      <li>换伴侣只换对方，主线同一份生辰。</li>
    </ol>
  </aside>`;
}

/** 绑定点词：人池/理由里的完整盘走 person-sheet；其余学词仍浅 peek */
export function bindLearnClicks(root: HTMLElement, pool: MatchmakerCharacter[] = []): void {
  bindPersonSheetClicks(root, pool);
  root.querySelectorAll<HTMLElement>('[data-bazi-term]').forEach((el) => {
    if (el.closest('[data-sheet-char]')) return;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openBaziCodexPopup({ term: el.dataset.baziTerm || '六冲' });
    });
  });
}

export type { VenueId };
