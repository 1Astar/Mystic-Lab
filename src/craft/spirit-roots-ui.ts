import {
  CRAFT_AXES,
  radarGuidePoints,
  radarLabelPos,
  radarPolygonPoints,
  type SpiritRootPanel,
} from './spirit-roots.ts';
import type { YearBuffPack } from './spirit-buff.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buffEntryList(entries: YearBuffPack['entries'], emptyNote: string): string {
  if (entries.length === 0) {
    return `<p class="life-footnote">${escapeHtml(emptyNote)}</p>`;
  }
  return `<ul class="craft-buff-list">${entries
    .map(
      (e) => `
        <li class="craft-buff-row ${e.kind === '忌' ? 'is-challenge' : ''}">
          <div class="craft-buff-main">
            <strong>${escapeHtml(e.title)}</strong>
            <span>${escapeHtml(e.effectLabel)}</span>
          </div>
          <p class="craft-buff-advice">${escapeHtml(e.advice)}</p>
        </li>`,
    )
    .join('')}</ul>`;
}

function yearBuffHtml(buff: YearBuffPack, tips: string[] = []): string {
  const monthEntries = buff.monthEntries ?? [];
  const prevMonth = buff.month <= 1 ? 12 : buff.month - 1;
  const nextMonth = buff.month >= 12 ? 1 : buff.month + 1;
  const prevMonthYear = buff.month <= 1 ? buff.year - 1 : buff.year;
  const nextMonthYear = buff.month >= 12 ? buff.year + 1 : buff.year;

  const tipHtml = tips.length
    ? `<ul class="craft-year-tips" aria-label="流年锦囊">${tips
        .map((t) => `<li>${escapeHtml(t)}</li>`)
        .join('')}</ul>`
    : '';

  return `
    <div class="craft-year-buff" aria-label="限时词条 · 流年×流月">
      <div class="craft-buff-head">
        <h3 class="craft-panel-h3">限时词条</h3>
        <div class="craft-buff-year">
          <button type="button" class="craft-act-btn" data-buff-year="${buff.year - 1}">‹ ${buff.year - 1}</button>
          <strong>${buff.year}${buff.yearGZ ? ` · ${escapeHtml(buff.yearGZ)}` : ''}</strong>
          <button type="button" class="craft-act-btn" data-buff-year="${buff.year + 1}">${buff.year + 1} ›</button>
        </div>
      </div>
      <p class="life-footnote">永久分不变；有效分 = 永久 × 流年 × 流月（夹紧）。${escapeHtml(buff.mutagenLine)}</p>

      <div class="craft-buff-section" aria-label="流年四化">
        <h4 class="craft-buff-h4">流年</h4>
        ${buffEntryList(buff.entries, '本年四化未能排出，请核对生辰。')}
      </div>

      <div class="craft-buff-section" aria-label="流月四化">
        <div class="craft-buff-month-head">
          <h4 class="craft-buff-h4">流月</h4>
          <div class="craft-buff-month">
            <button type="button" class="craft-act-btn" data-buff-month="${prevMonth}" data-buff-month-year="${prevMonthYear}">‹ ${prevMonth}月</button>
            <strong>${buff.month}月${buff.monthGZ ? ` · ${escapeHtml(buff.monthGZ)}` : ''}</strong>
            <button type="button" class="craft-act-btn" data-buff-month="${nextMonth}" data-buff-month-year="${nextMonthYear}">${nextMonth}月 ›</button>
          </div>
        </div>
        ${buffEntryList(monthEntries, '本月四化未能排出，请核对生辰。')}
      </div>

      ${tipHtml}
      ${buff.baziHint ? `<p class="craft-buff-bazi">${escapeHtml(buff.baziHint)}</p>` : ''}
    </div>`;
}

/** 灵根图谱卡片 HTML（造命首页） */
export function spiritRootCardHtml(panel: SpiritRootPanel): string {
  const values = panel.axes.map((a) => a.value);
  const scaleMax = Math.max(100, ...values, 1);
  const poly = radarPolygonPoints(values, 100, 100, 72, scaleMax);
  const guide = radarGuidePoints(100, 100, 72, 6);
  const labels = CRAFT_AXES.map((def, i) => {
    const axis = panel.axes[i]!;
    const pos = radarLabelPos(i);
    const litClass = axis.lit ? 'is-lit' : 'is-dim';
    return `<text class="craft-radar-label ${litClass}" x="${pos.x.toFixed(1)}" y="${pos.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(def.label)}</text>`;
  }).join('');

  const bars = panel.axes
    .map((a) => {
      const pct = Math.min(100, Math.round((a.value / scaleMax) * 100));
      const src = a.sources.length ? a.sources.join(' · ') : '定盘未计入';
      const perm = a.permanentValue ?? a.value;
      const mult = a.buffMult ?? 1;
      const buffNote =
        Math.abs(mult - 1) > 0.001
          ? ` · 永久 ${perm} ×${mult.toFixed(2)} → 有效 ${a.value}`
          : ` · ${a.value}`;
      return `
        <div class="craft-axis-row ${a.lit ? 'is-lit' : 'is-dim'}" role="button" tabindex="0" data-craft-axis="${escapeHtml(a.id)}" aria-label="${escapeHtml(a.label)}属性来源">
          <div class="craft-axis-meta">
            <strong>${escapeHtml(a.label)}${Math.abs(mult - 1) > 0.001 ? ' <em class="craft-buff-flag">限时</em>' : ''}</strong>
            <span>${escapeHtml(a.sub)}${buffNote}</span>
          </div>
          <div class="craft-axis-bar" role="progressbar" aria-valuenow="${a.value}" aria-valuemin="0" aria-valuemax="${scaleMax}">
            <i style="width:${pct}%"></i>
          </div>
          <p class="craft-axis-src">${escapeHtml(src)}</p>
        </div>`;
    })
    .join('');

  const wuxing =
    panel.wuxing.length === 0
      ? ''
      : `
    <div class="craft-wuxing" aria-label="五行磁场">
      <h3 class="craft-panel-h3">五行磁场</h3>
      <p class="life-footnote">${escapeHtml(panel.dayMasterLine)} · 与八字「生命结构」同源 · <button type="button" class="craft-inline-link" data-path="/bazi/structure">查看档案 ›</button></p>
      <div class="craft-wuxing-grid">
        ${panel.wuxing
          .map(
            (w) => `
          <div class="craft-wx-cell ${w.dayMaster ? 'is-day' : ''}">
            <span>${escapeHtml(w.el)}</span>
            <div class="craft-wx-bar"><i style="width:${w.pct}%"></i></div>
          </div>`,
          )
          .join('')}
      </div>
    </div>`;

  const majors =
    panel.soulMajors.length > 0
      ? panel.soulMajors.join(' · ')
      : '命宫主星暂未落入常见映射表';

  const ach = panel.comboAchievements ?? [];
  const achHtml =
    ach.length === 0
      ? ''
      : `<div class="craft-combo-achs" aria-label="图鉴组合成就">
        <h3 class="craft-panel-h3">图鉴组合成就</h3>
        <ul class="craft-combo-ach-list">${ach
          .map((s) => {
            const badge =
              s.status === 'complete'
                ? s.conditionalActive
                  ? '爆发中'
                  : '已解锁'
                : s.status === 'partial'
                  ? `${s.litMembers.length}/${s.def.members.length}`
                  : '未集齐';
            return `<li class="craft-combo-ach is-${s.status}${s.conditionalActive ? ' is-burst' : ''}">
              <strong>${escapeHtml(s.def.title)}</strong>
              <span class="craft-combo-ach-badge">${escapeHtml(badge)}</span>
              <p>${escapeHtml(s.def.effectLine)}</p>
              <em>${escapeHtml(s.def.members.join(' · '))}</em>
            </li>`;
          })
          .join('')}</ul>
        <p class="life-footnote">在紫微图鉴集齐成员即可解锁；去组合旅程查看进度。</p>
      </div>`;

  return `
    <section class="craft-spirit-card" aria-label="灵根图谱">
      <header class="craft-spirit-head">
        <p class="craft-spirit-kicker">SPIRIT ROOTS</p>
        <h2 class="craft-spirit-title">灵根图谱</h2>
        <p class="craft-spirit-sub">灵魂印记 · ${escapeHtml(panel.tagline)}</p>
        <p class="life-footnote">命宫 ${escapeHtml(majors)} · 轴 ${panel.litCount}/6</p>
      </header>
      <div class="craft-radar-wrap">
        <svg class="craft-radar" viewBox="0 0 200 200" role="img" aria-label="六维天赋雷达">
          <polygon class="craft-radar-guide" points="${guide}" />
          <polygon class="craft-radar-fill ${panel.litCount ? 'is-lit' : ''}" points="${poly}" />
          ${labels}
        </svg>
      </div>
      <div class="craft-axis-list-head">
        <h3 class="craft-panel-h3">六维属性</h3>
        <button
          type="button"
          class="craft-axis-help"
          data-craft-axis-help
          aria-label="为什么有的轴没有数值"
          title="为什么有的轴没有数值"
        >?</button>
      </div>
      <div class="craft-axis-list">${bars}</div>
      ${achHtml}
      ${panel.yearBuff ? yearBuffHtml(panel.yearBuff, panel.yearTips) : ''}
      ${wuxing}
    </section>`;
}
