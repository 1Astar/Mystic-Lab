/**
 * 图鉴认知示意：合冲刑害总览 + 大运流年尺度（教学 SVG，非记忆封面）
 * 文案偏行程/节奏，避「必凶」判决感。
 */

import { LUCK_ATLAS } from './codex-atlas-catalog.ts';
import { relationHelpDetailsHtml } from './codex-relation-help.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 运程图鉴词条：进尺度图标题旁 ?，不另开卡片板块 */
export function luckAtlasHelpHtml(): string {
  return relationHelpDetailsHtml({
    short: '运程词条一览',
    items: LUCK_ATLAS.map((l) => ({ title: l.title, gloss: l.gloss })),
    body: '大运细读可进甲子「作大运时」专区；看切换节奏，不作必凶判决。',
  });
}

/** 合冲刑害四象 · 一眼分清「合拢 / 对穿 / 内耗 / 暗掣」 */
export function renderChongHeXingHaiConceptHtml(opts?: {
  title?: string;
  hint?: string;
}): string {
  const title = opts?.title ?? '合冲刑害 · 行程节奏';
  const hint =
    opts?.hint ??
    '合拢贴近 · 对穿换场 · 刑多内耗 · 害偏暗掣 · 看节奏类型，不看吉凶判决';

  const panel = (
    kind: string,
    label: string,
    caption: string,
    body: string,
  ): string => `
    <figure class="bazi-cx-panel is-${escapeHtml(kind)}" data-cx-kind="${escapeHtml(kind)}">
      <svg class="bazi-cx-svg" viewBox="0 0 96 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect class="bazi-cx-stage" width="96" height="72" rx="10"/>
        ${body}
      </svg>
      <figcaption>
        <strong>${escapeHtml(label)}</strong>
        <span>${escapeHtml(caption)}</span>
      </figcaption>
    </figure>`;

  const he = panel(
    '合',
    '合',
    '贴近 · 气场交叠',
    `
      <circle class="bazi-cx-line" cx="36" cy="36" r="14" fill="none" stroke-width="1.6" opacity="0.9"/>
      <circle class="bazi-cx-line" cx="60" cy="36" r="14" fill="none" stroke-width="1.6" opacity="0.9"/>
      <path class="bazi-cx-soft" d="M42 36 Q48 30 54 36 Q48 42 42 36"/>
      <circle class="bazi-cx-dot" cx="48" cy="36" r="3" opacity="0.65"/>`,
  );

  const chong = panel(
    '冲',
    '冲',
    '对穿 · 换场加速',
    `
      <circle class="bazi-cx-disk bazi-cx-line" cx="28" cy="36" r="11" stroke-width="1.5"/>
      <circle class="bazi-cx-disk bazi-cx-line" cx="68" cy="36" r="11" stroke-width="1.5"/>
      <path class="bazi-cx-line" d="M40 36 H56" fill="none" stroke-width="1.8" stroke-dasharray="3 2.5" opacity="0.9"/>
      <path class="bazi-cx-line" d="M54 31 L60 36 L54 41" fill="none" stroke-width="1.4"/>
      <path class="bazi-cx-line" d="M42 31 L36 36 L42 41" fill="none" stroke-width="1.4"/>`,
  );

  const xing = panel(
    '刑',
    '刑',
    '三角 · 内耗纠结',
    `
      <path class="bazi-cx-line" d="M48 18 L70 54 H26 Z" fill="none" stroke-width="1.4" opacity="0.95"/>
      <circle class="bazi-cx-disk bazi-cx-line" cx="48" cy="24" r="4.5" stroke-width="1.2"/>
      <circle class="bazi-cx-disk bazi-cx-line" cx="64" cy="50" r="4.5" stroke-width="1.2"/>
      <circle class="bazi-cx-disk bazi-cx-line" cx="32" cy="50" r="4.5" stroke-width="1.2"/>`,
  );

  const hai = panel(
    '害',
    '害',
    '侧刺 · 暗中掣肘',
    `
      <circle class="bazi-cx-disk bazi-cx-line" cx="34" cy="36" r="12" stroke-width="1.5"/>
      <circle class="bazi-cx-disk bazi-cx-line" cx="62" cy="36" r="12" stroke-width="1.5"/>
      <path class="bazi-cx-line" d="M42 30 Q52 22 58 32" fill="none" stroke-width="1.5" opacity="0.9"/>
      <path class="bazi-cx-line" d="M55 28 L60 32 L54 34" fill="none" stroke-width="1.2"/>
      <circle class="bazi-cx-dot" cx="48" cy="44" r="2" opacity="0.45"/>`,
  );

  return `
    <section class="bazi-cx-concept" aria-label="${escapeHtml(title)}">
      <header class="bazi-cx-head">
        <h2 class="bazi-codex-section-title">${escapeHtml(title)}</h2>
        <p class="bazi-codex-hint">${escapeHtml(hint)}</p>
      </header>
      <div class="bazi-cx-grid">${he}${chong}${xing}${hai}</div>
    </section>`;
}

/** 运程尺度：原局 ← 大运十年带 ← 流年点 ← 流月细点 */
export function renderLuckScaleConceptHtml(opts?: {
  title?: string;
  hint?: string;
  /** 排盘运程板用：更矮、少标题层级 */
  compact?: boolean;
  /** SVG 渐变 id 前缀，避免同页重复 */
  uid?: string;
  /** 当前大运干支（可选标注） */
  dayunGz?: string;
  /** 当前流年（如 2026） */
  liunianYear?: number | string;
  /** 当前流月节气名 */
  liuyueJie?: string;
}): string {
  const compact = Boolean(opts?.compact);
  const title = opts?.title ?? (compact ? '尺度示意' : '大运 · 流年 · 流月');
  const hint =
    opts?.hint ??
    (compact
      ? '下方横滑看大运 / 流年 / 流月 · 运岁点醒原局，看切换节奏'
      : '十年一段主题 · 一年点醒原局 · 月作细触发 · 看切换节奏，不看必凶判决');
  const uid = (opts?.uid ?? (compact ? 'lk-chart' : 'lk-codex')).replace(
    /[^a-zA-Z0-9_-]/g,
    '',
  );

  const yearFocus = 6;
  const yearTicks = Array.from({ length: 10 }, (_, i) => {
    const x = 78 + i * 18;
    const isFocus = i === yearFocus;
    if (!isFocus) {
      return `<circle class="bazi-lk-year" cx="${x}" cy="58" r="3.2"/>`;
    }
    const label = opts?.liunianYear != null ? String(opts.liunianYear) : '流年';
    return `<circle class="bazi-lk-year is-on" cx="${x}" cy="58" r="5.5"/>
         <text class="bazi-lk-caption is-accent" x="${x}" y="78" text-anchor="middle" font-size="7">${escapeHtml(label)}</text>`;
  }).join('');

  const monthFocus = 2;
  const monthTicks = [0, 1, 2, 3, 4]
    .map((i) => {
      const x = 168 + i * 9;
      const on = i === monthFocus;
      return `<circle class="bazi-lk-month${on ? ' is-on' : ''}" cx="${x}" cy="96" r="${on ? 3.2 : 2}"/>`;
    })
    .join('');

  const monthCaption =
    opts?.liuyueJie != null && String(opts.liuyueJie).trim()
      ? `流月 · ${escapeHtml(String(opts.liuyueJie))}`
      : '流月 · 细触发';
  const dayunCaption =
    opts?.dayunGz != null && String(opts.dayunGz).trim()
      ? `大运 · ${escapeHtml(String(opts.dayunGz))}（约十年）`
      : '大运 · 约十年一段主题';

  const head = compact
    ? `<header class="bazi-lk-head is-compact">
        <p class="bazi-lk-compact-line"><strong>${escapeHtml(title)}</strong> · ${escapeHtml(hint)}</p>
      </header>`
    : `<header class="bazi-lk-head">
        <div class="bazi-br-title-row">
          <h2 class="bazi-codex-section-title">${escapeHtml(title)}</h2>
          ${luckAtlasHelpHtml()}
        </div>
        <p class="bazi-codex-hint">${escapeHtml(hint)} · 标题旁 ? 看词条</p>
      </header>`;

  return `
    <section class="bazi-lk-concept${compact ? ' is-compact' : ''}" aria-label="${escapeHtml(title)}">
      ${head}
      <div class="bazi-lk-stage">
        <svg class="bazi-lk-svg" viewBox="0 0 320 118" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="原局到大运流年流月的尺度示意">
          <defs>
            <linearGradient id="${uid}-band" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop class="bazi-lk-band-a" offset="0%" stop-opacity="0.95"/>
              <stop class="bazi-lk-band-b" offset="55%" stop-opacity="1"/>
              <stop class="bazi-lk-band-c" offset="100%" stop-opacity="0.9"/>
            </linearGradient>
            <marker id="${uid}-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path class="bazi-lk-arrow" d="M0 0 L6 3 L0 6 Z" opacity="0.85"/>
            </marker>
          </defs>
          <rect class="bazi-lk-natal" x="10" y="28" width="52" height="52" rx="8"/>
          <text class="bazi-lk-caption is-strong" x="36" y="50" text-anchor="middle" font-size="10" font-weight="600">原局</text>
          <text class="bazi-lk-caption" x="36" y="64" text-anchor="middle" font-size="7">四柱</text>
          <path class="bazi-lk-link" d="M66 54 H74" fill="none" stroke-width="1.6" marker-end="url(#${uid}-arrow)" opacity="0.9"/>
          <text class="bazi-lk-caption is-cool" x="70" y="46" text-anchor="middle" font-size="6.5">点醒</text>
          <rect class="bazi-lk-band" x="78" y="36" width="174" height="44" rx="10" fill="url(#${uid}-band)"/>
          <text class="bazi-lk-caption is-cool" x="165" y="28" text-anchor="middle" font-size="8">${dayunCaption}</text>
          ${yearTicks}
          <path class="bazi-lk-link" d="M186 70 V88" fill="none" stroke-width="1" stroke-dasharray="2 2" opacity="0.55"/>
          <text class="bazi-lk-caption is-cool" x="186" y="112" text-anchor="middle" font-size="7">${monthCaption}</text>
          ${monthTicks}
          <circle class="bazi-lk-gate" cx="78" cy="58" r="4" fill="none" stroke-width="1.2"/>
          <text class="bazi-lk-caption is-accent" x="78" y="18" text-anchor="middle" font-size="6.5">起/交运</text>
        </svg>
      </div>
    </section>`;
}

/** 词条详情/列表用的迷你概念图（rel: / luck:） */
export function conceptThumbSvg(id: string, opts?: { uid?: string }): string {
  const uid = (opts?.uid ?? id).replace(/[^a-zA-Z0-9_-]/g, '');
  if (id.startsWith('luck:')) return luckThumbSvg(id.slice(5), uid);
  if (id.startsWith('rel:')) return relThumbSvg(id.slice(4), uid);
  return '';
}

function svgMini(uid: string, inner: string): string {
  return `<svg class="bazi-art-svg bazi-art-concept" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
    <radialGradient id="${uid}-bg" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#141828"/><stop offset="100%" stop-color="#07080e"/>
    </radialGradient>
  </defs><rect width="80" height="80" fill="url(#${uid}-bg)"/>${inner}</svg>`;
}

function luckThumbSvg(name: string, uid: string): string {
  switch (name) {
    case '大运':
      return svgMini(
        uid,
        `<rect x="12" y="32" width="56" height="16" rx="6" fill="none" stroke="#8ab0d8" stroke-width="1.4"/>
         <circle cx="24" cy="40" r="3" fill="#6a7a98"/><circle cx="40" cy="40" r="4" fill="#f0d78a" opacity="0.85"/><circle cx="56" cy="40" r="3" fill="#6a7a98"/>`,
      );
    case '流年':
      return svgMini(
        uid,
        `<circle cx="40" cy="40" r="10" fill="none" stroke="#f0d78a" stroke-width="1.5"/>
         <circle cx="40" cy="40" r="4" fill="#f0d78a" opacity="0.8"/>`,
      );
    case '流月':
      return svgMini(
        uid,
        `<circle cx="28" cy="40" r="2.5" fill="#4a5870"/><circle cx="40" cy="40" r="3.5" fill="#a8c8e8"/><circle cx="52" cy="40" r="2.5" fill="#4a5870"/>`,
      );
    case '小运':
      return svgMini(
        uid,
        `<path d="M20 48 Q40 22 60 48" fill="none" stroke="#8ab0d8" stroke-width="1.4" opacity="0.8"/>
         <circle cx="40" cy="34" r="3" fill="#a8c8e8" opacity="0.7"/>`,
      );
    case '起运':
    case '交运':
      return svgMini(
        uid,
        `<path d="M18 40 H34" stroke="#6a7a98" stroke-width="1.3"/><circle cx="40" cy="40" r="6" fill="none" stroke="#d4b56a" stroke-width="1.5"/>
         <path d="M46 40 H62" stroke="#8ab0d8" stroke-width="1.3"/>`,
      );
    case '原局触发':
      return svgMini(
        uid,
        `<defs><marker id="${uid}-m" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5 Z" fill="#8ab0d8"/></marker></defs>
         <rect x="14" y="28" width="22" height="24" rx="4" fill="none" stroke="#c9a86a" stroke-width="1.3"/>
         <path d="M40 40 H48" stroke="#8ab0d8" stroke-width="1.4" marker-end="url(#${uid}-m)"/>
         <circle cx="58" cy="40" r="8" fill="none" stroke="#8ab0d8" stroke-width="1.3"/>`,
      );
    case '宫位影响':
      return svgMini(
        uid,
        `<rect x="16" y="18" width="20" height="14" rx="2" fill="none" stroke="#c9a86a" stroke-width="1"/><rect x="44" y="18" width="20" height="14" rx="2" fill="none" stroke="#c9a86a" stroke-width="1"/>
         <rect x="16" y="48" width="20" height="14" rx="2" fill="none" stroke="#8ab0d8" stroke-width="1"/><rect x="44" y="48" width="20" height="14" rx="2" fill="none" stroke="#8ab0d8" stroke-width="1"/>`,
      );
    default:
      return svgMini(
        uid,
        `<rect x="14" y="34" width="52" height="12" rx="5" fill="none" stroke="#8ab0d8" stroke-width="1.3"/>`,
      );
  }
}

function relThumbSvg(name: string, uid: string): string {
  if (name.includes('合') || name === '六合' || name === '三合' || name === '半合' || name === '三会' || name === '天干五合') {
    return svgMini(
      uid,
      `<circle cx="30" cy="40" r="12" fill="none" stroke="#c9a86a" stroke-width="1.4"/><circle cx="50" cy="40" r="12" fill="none" stroke="#d4b56a" stroke-width="1.4"/>`,
    );
  }
  if (name.includes('冲')) {
    return svgMini(
      uid,
      `<circle cx="26" cy="40" r="9" fill="none" stroke="#8ab0d8" stroke-width="1.3"/><circle cx="54" cy="40" r="9" fill="none" stroke="#8ab0d8" stroke-width="1.3"/>
       <path d="M36 40 H44" stroke="#a8c8e8" stroke-width="1.5" stroke-dasharray="2 2"/>`,
    );
  }
  if (name.includes('刑')) {
    return svgMini(
      uid,
      `<path d="M40 22 L58 54 H22 Z" fill="none" stroke="#d4a06a" stroke-width="1.3"/>`,
    );
  }
  if (name.includes('害') || name.includes('穿')) {
    return svgMini(
      uid,
      `<circle cx="30" cy="40" r="10" fill="none" stroke="#c898b0" stroke-width="1.3"/><circle cx="52" cy="40" r="10" fill="none" stroke="#c898b0" stroke-width="1.3"/>
       <path d="M36 32 Q44 26 50 34" fill="none" stroke="#d8a8c0" stroke-width="1.3"/>`,
    );
  }
  if (name.includes('破')) {
    return svgMini(
      uid,
      `<rect x="24" y="28" width="32" height="24" rx="3" fill="none" stroke="#a89870" stroke-width="1.3" stroke-dasharray="3 2"/>
       <path d="M30 50 L50 30" stroke="#c9a86a" stroke-width="1.2" opacity="0.7"/>`,
    );
  }
  if (name.includes('生')) {
    return svgMini(
      uid,
      `<path d="M28 48 Q40 24 52 48" fill="none" stroke="#6ecf88" stroke-width="1.4"/><circle cx="40" cy="30" r="3" fill="#6ecf88" opacity="0.6"/>`,
    );
  }
  if (name.includes('克')) {
    return svgMini(
      uid,
      `<path d="M28 28 L52 52 M52 28 L28 52" stroke="#ff7a6e" stroke-width="1.4" opacity="0.7"/>`,
    );
  }
  return svgMini(
    uid,
    `<circle cx="40" cy="40" r="14" fill="none" stroke="#8ab0d8" stroke-width="1.3"/>`,
  );
}

/** 详情顶图：包一层与记忆封面同级的舞台 */
export function conceptDetailArtHtml(id: string): string {
  const svg = conceptThumbSvg(id, { uid: `det-${id}` });
  if (!svg) return '';
  return `<div class="bazi-art-cover is-concept" data-cover-id="${escapeHtml(id)}">${svg}</div>`;
}
