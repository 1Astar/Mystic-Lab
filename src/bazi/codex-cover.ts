import {
  coverPublicPath,
  getCoverPrompt,
  type CodexCoverPrompt,
} from './codex-cover-prompts.ts';

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
