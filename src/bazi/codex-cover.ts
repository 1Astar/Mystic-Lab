import {
  coverPublicPath,
  getCoverPrompt,
  type CodexCoverPrompt,
} from './codex-cover-prompts.ts';
import { shenshaBadgeSvg } from './codex-shensha-badge-art.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 已落盘的记忆封面路径（仅 webp）；未出图返回 null → 回退 SVG */
export function getCodexCoverSrc(id: string): string | null {
  const p = getCoverPrompt(id);
  if (!p?.assetReady) return null;
  return coverPublicPath(p.slug);
}

export function getCodexCoverMeta(id: string): CodexCoverPrompt | undefined {
  return getCoverPrompt(id);
}

/** 记忆封面 HTML：有图用 img，否则用 fallbackSvg */
export function memoryCoverHtml(id: string, fallbackSvg: string): string {
  const src = getCodexCoverSrc(id);
  if (!src) return fallbackSvg;
  return `<div class="bazi-art-cover" data-cover-id="${escapeHtml(id)}">
    <img src="${escapeHtml(src)}" alt="" loading="lazy" />
  </div>`;
}

/**
 * 神煞详情 / 列表：博物志图谱页（竖幅 webp）
 * 列表不叠字（缩略图会裁掉底栏，叠字会盖在画面上）
 * 详情默认可叠名，落在底栏留白
 * 无图回退 SVG/字标
 */
export function shenshaBadgeArtHtml(
  id: string,
  glyph = '煞',
  opts?: { overlayName?: boolean },
): string {
  const overlayName = opts?.overlayName !== false;
  const meta = getCodexCoverMeta(id);
  const caption = overlayName ? meta?.title?.trim() || '' : '';
  const captionHtml = caption
    ? `<span class="bazi-ss-atlas-caption">${escapeHtml(caption)}</span>`
    : '';
  const src = getCodexCoverSrc(id);
  if (src) {
    return `<div class="bazi-ss-badge-stage bazi-enc-badge is-atlas" data-cover-id="${escapeHtml(id)}">
      <div class="bazi-ss-badge-art" aria-hidden="true"><img src="${escapeHtml(src)}" alt="" loading="lazy" /></div>
      ${captionHtml}
    </div>`;
  }
  const svg = shenshaBadgeSvg(id, { uid: `badge-${id}` });
  if (svg) {
    return `<div class="bazi-ss-badge-stage bazi-enc-badge is-svg" data-cover-id="${escapeHtml(id)}">
      <div class="bazi-ss-badge-art" aria-hidden="true">${svg}</div>
    </div>`;
  }
  return `<div class="bazi-ss-badge-stage bazi-enc-badge" data-cover-id="${escapeHtml(id)}">
    <div class="bazi-ss-badge-glyph" aria-hidden="true">${escapeHtml(glyph)}</div>
  </div>`;
}
