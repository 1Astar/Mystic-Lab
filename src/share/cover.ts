import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
import type { LineBit } from '../liuyao/hexagrams.ts';
import { getCardImagePath } from '../tarot/card-images.ts';
import type { ShareSection, ShareSnapshot, ShareVisual } from './types.ts';

export type ShareCoverFace = 'front' | 'back';

export type ShareCoverSnap = Pick<
  ShareSnapshot,
  | 'headline'
  | 'summary'
  | 'questionDisplay'
  | 'visual'
  | 'brandSlogan'
  | 'createdAt'
  | 'system'
> & {
  sections?: ShareSection[];
  includeAi?: boolean;
  aiText?: string;
  deepUrl?: string;
  qrDataUrl?: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function asLineBits(lines: number[] | undefined): LineBit[] | null {
  if (!lines || lines.length !== 6) return null;
  if (!lines.every((b) => b === 0 || b === 1)) return null;
  return lines as LineBit[];
}

function cardSrc(cardId: string): string {
  const path = getCardImagePath(cardId);
  if (typeof location !== 'undefined' && location.origin) {
    return `${location.origin}${path}`;
  }
  return path;
}

/**
 * 分享专用卦象 SVG：描边全部内联。
 * html-to-image 对 CSS class stroke 经常丢，导致预览「空白」。
 */
export function renderShareHexSvg(
  lines: LineBit[],
  changingIndexes: number[] = [],
  compact = false,
): string {
  const w = compact ? 120 : 200;
  const h = compact ? 156 : 260;
  const cx = w / 2;
  const gap = compact ? 22 : 36;
  const startY = compact ? 16 : 28;
  const half = compact ? 36 : 58;
  const yinGap = compact ? 9 : 14;
  const sw = compact ? 5 : 7;
  const rows = lines
    .map((bit, i) => {
      const y = startY + (5 - i) * gap;
      const moving = changingIndexes.includes(i);
      const stroke = moving ? '#e85a45' : bit === 1 ? '#f0dfb0' : '#b8c0cc';
      const glow = moving
        ? `filter="drop-shadow(0 0 6px rgba(232,90,69,0.65))"`
        : '';
      if (bit === 1) {
        return `<line ${glow} x1="${cx - half}" y1="${y}" x2="${cx + half}" y2="${y}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;
      }
      return `<line ${glow} x1="${cx - half}" y1="${y}" x2="${cx - yinGap}" y2="${y}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>
        <line ${glow} x1="${cx + yinGap}" y1="${y}" x2="${cx + half}" y2="${y}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" class="ms-cover-hex-svg-el" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">${rows}</svg>`;
}

function hexFrameHtml(opts: {
  name: string;
  lines: LineBit[];
  changingIndexes?: number[];
  artSrc?: string;
  captionPrefix: string;
}): string {
  const hasArt = Boolean(opts.artSrc);
  const svg = renderShareHexSvg(
    opts.lines,
    opts.changingIndexes ?? [],
    hasArt,
  );
  const art = hasArt
    ? `<img class="ms-cover-hex-art" src="${escapeHtml(opts.artSrc!)}" alt="${escapeHtml(opts.name)}" crossorigin="anonymous" />`
    : '';
  return `
    <div class="ms-cover-hex-col">
      <div class="ms-cover-hex-frame${hasArt ? ' has-art' : ''}">
        ${art}
        <div class="ms-cover-hex-yao">${svg}</div>
      </div>
      <p class="ms-cover-hex-cap">${escapeHtml(opts.captionPrefix)} · ${escapeHtml(opts.name)}</p>
    </div>`;
}

function visualBlock(v: ShareVisual): string {
  switch (v.kind) {
    case 'liuyao': {
      const primary = asLineBits(v.primaryLines);
      const changed = asLineBits(v.changedLines);
      if (primary) {
        return `
          <div class="ms-cover-hex-visual">
            ${hexFrameHtml({
              name: v.primaryName,
              lines: primary,
              changingIndexes: v.changingIndexes,
              artSrc: v.primaryArtSrc,
              captionPrefix: '本',
            })}
            ${
              changed && v.changedName
                ? `<div class="ms-cover-hex-arrow" aria-hidden="true">→</div>
            ${hexFrameHtml({
              name: v.changedName,
              lines: changed,
              artSrc: v.changedArtSrc,
              captionPrefix: '变',
            })}`
                : ''
            }
          </div>`;
      }
      return `
        <div class="ms-cover-hex">
          <p class="ms-cover-hex-main">${escapeHtml(v.primaryName)}</p>
          ${v.changedName ? `<p class="ms-cover-hex-sub">变 · ${escapeHtml(v.changedName)}</p>` : ''}
        </div>`;
    }
    case 'tarot':
      return `<div class="ms-cover-cards">${v.cards
        .slice(0, 5)
        .map((c) => {
          const img = c.cardId
            ? `<img class="ms-cover-card-img${c.reversed ? ' is-reversed' : ''}" src="${escapeHtml(cardSrc(c.cardId))}" alt="${escapeHtml(c.name)}" />`
            : `<span class="ms-cover-card-sym">${escapeHtml(c.symbol || '✦')}</span>`;
          // 有牌面图时只出图，牌名留给背面；封面下方放总体结论
          if (c.cardId) {
            return `<div class="ms-cover-card has-art">${img}</div>`;
          }
          return `
        <div class="ms-cover-card">
          ${img}
          <span class="ms-cover-card-name">${escapeHtml(c.name)}</span>
        </div>`;
        })
        .join('')}</div>`;
    case 'xiaoliuren':
      return `<div class="ms-cover-gods">${v.gods
        .map((g) => `<span class="ms-cover-god">${escapeHtml(g)}</span>`)
        .join('')}</div>
        ${v.label ? `<p class="ms-cover-label">${escapeHtml(v.label)}</p>` : ''}`;
    default: {
      const label =
        'label' in v && v.label
          ? v.label
          : v.kind === 'bazi' && 'pillars' in v
            ? v.pillars
            : '';
      return label
        ? `<p class="ms-cover-label">${escapeHtml(String(label))}</p>`
        : '';
    }
  }
}

function systemLabelOf(system: string): string {
  const map: Record<string, string> = {
    liuyao: '六爻',
    tarot: '塔罗',
    xiaoliuren: '小六壬',
    bazi: '八字',
    life: '人生宇宙',
    meihua: '梅花',
  };
  return map[system] || 'Mystic Lab';
}

function qrRow(snap: ShareCoverSnap): string {
  if (!snap.qrDataUrl) {
    return `<p class="ms-cover-hint">扫码或点开链接 · 看完整解读</p>`;
  }
  return `<div class="ms-cover-qr-row">
    <img class="ms-cover-qr" src="${escapeHtml(snap.qrDataUrl)}" alt="扫码打开" width="240" height="240" />
    <div class="ms-cover-qr-meta">
      <p class="ms-cover-qr-title">扫码看完整解读</p>
      <p class="ms-cover-qr-sub">随心而行 · Mystic Lab</p>
    </div>
  </div>`;
}

function frontInner(snap: ShareCoverSnap, date: string): string {
  return `
    <div class="ms-cover-inner ms-cover-face-front">
      <p class="ms-cover-brand">随心而行</p>
      <p class="ms-cover-sys">${systemLabelOf(snap.system)}</p>
      <p class="ms-cover-slogan">${escapeHtml(snap.brandSlogan || '答案不在牌里，在你心里。')}</p>
      ${visualBlock(snap.visual)}
      <p class="ms-cover-headline${snap.system === 'tarot' ? ' is-conclusion' : ''}">${escapeHtml(snap.headline)}</p>
      ${snap.questionDisplay ? `<p class="ms-cover-q">「${escapeHtml(snap.questionDisplay)}」</p>` : ''}
      ${qrRow(snap)}
      <p class="ms-cover-date">${escapeHtml(date)}</p>
      <p class="ms-cover-foot">点开可翻转 · 背面是完整解读</p>
    </div>`;
}

function backInner(snap: ShareCoverSnap, date: string): string {
  const sections = (snap.sections || []).slice(0, 8);
  const body = sections.length
    ? sections
        .map(
          (s) => `
      <section class="ms-cover-back-sec">
        <h3>${escapeHtml(s.heading)}</h3>
        <p>${escapeHtml(s.body).replace(/\n/g, '<br/>')}</p>
      </section>`,
        )
        .join('')
    : `<p class="ms-cover-summary">${escapeHtml(snap.summary)}</p>`;
  const ai =
    snap.includeAi && snap.aiText
      ? `<section class="ms-cover-back-sec ms-cover-back-ai">
          <h3>深度解读</h3>
          <p>${escapeHtml(snap.aiText).replace(/\n/g, '<br/>')}</p>
        </section>`
      : '';
  return `
    <div class="ms-cover-inner ms-cover-face-back">
      <p class="ms-cover-brand">随心而行</p>
      <p class="ms-cover-sys">${systemLabelOf(snap.system)} · 完整解读</p>
      ${snap.questionDisplay ? `<p class="ms-cover-q">「${escapeHtml(snap.questionDisplay)}」</p>` : ''}
      <p class="ms-cover-headline">${escapeHtml(snap.headline)}</p>
      <div class="ms-cover-back-body">${body}${ai}</div>
      ${qrRow(snap)}
      <p class="ms-cover-date">${escapeHtml(date)}</p>
      <p class="ms-cover-foot">Mystic Lab</p>
    </div>`;
}

export async function makeShareQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#1a1520', light: '#f5efe3' },
  });
}

/** 封面 inner HTML（可单测） */
export function buildShareCoverInnerHtml(
  snap: ShareCoverSnap,
  face: ShareCoverFace = 'front',
): string {
  const date = snap.createdAt
    ? new Date(snap.createdAt).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('zh-CN');
  return face === 'back' ? backInner(snap, date) : frontInner(snap, date);
}

export function buildShareCoverElement(
  snap: ShareCoverSnap,
  face: ShareCoverFace = 'front',
): HTMLElement {
  const el = document.createElement('div');
  el.className = `ms-cover ms-cover-${face}`;
  el.innerHTML = buildShareCoverInnerHtml(snap, face);
  return el;
}

function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  if (!imgs.length) return Promise.resolve();
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        }),
    ),
  ).then(() => undefined);
}

/**
 * 把图片转成 data URL，供 html-to-image 画进 canvas。
 * CORS / 拉取失败时返回 undefined（调用方应省略该图，勿回退跨域 URL，否则整页导出失败）。
 */
export async function resolveCorsSafeImageSrc(
  src: string | undefined | null,
): Promise<string | undefined> {
  if (!src) return undefined;
  if (src.startsWith('data:')) return src;
  try {
    const res = await fetch(src, { mode: 'cors' });
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('read failed'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

async function withResolvedArt(snap: ShareCoverSnap): Promise<ShareCoverSnap> {
  if (snap.visual.kind !== 'liuyao') return snap;
  const v = snap.visual;
  const [primaryArtSrc, changedArtSrc] = await Promise.all([
    resolveCorsSafeImageSrc(v.primaryArtSrc),
    resolveCorsSafeImageSrc(v.changedArtSrc),
  ]);
  return {
    ...snap,
    visual: { ...v, primaryArtSrc, changedArtSrc },
  };
}

async function withCoverHost<T>(
  snap: ShareCoverSnap,
  face: ShareCoverFace,
  run: (el: HTMLElement) => Promise<T>,
): Promise<T> {
  const host = document.createElement('div');
  host.style.cssText =
    'position:fixed;left:-9999px;top:0;width:1080px;pointer-events:none;z-index:-1';
  const resolved = await withResolvedArt(snap);
  const el = buildShareCoverElement(resolved, face);
  host.appendChild(el);
  document.body.appendChild(host);
  try {
    await waitForImages(el);
    return await run(el);
  } finally {
    host.remove();
  }
}

function stripLiuyaoArt(snap: ShareCoverSnap): ShareCoverSnap {
  if (snap.visual.kind !== 'liuyao') return snap;
  return {
    ...snap,
    visual: {
      ...snap.visual,
      primaryArtSrc: undefined,
      changedArtSrc: undefined,
    },
  };
}

async function toCoverPng(el: HTMLElement): Promise<string> {
  return toPng(el, {
    width: 1080,
    height: 1920,
    pixelRatio: 1,
    cacheBust: true,
  });
}

export async function renderShareCoverPngDataUrl(
  snap: ShareCoverSnap,
  deepUrl?: string,
  face: ShareCoverFace = 'front',
): Promise<string> {
  const url = deepUrl || snap.deepUrl || '';
  const qrDataUrl = url
    ? snap.qrDataUrl || (await makeShareQrDataUrl(url))
    : snap.qrDataUrl;
  const base = { ...snap, deepUrl: url || undefined, qrDataUrl };
  try {
    return await withCoverHost(base, face, toCoverPng);
  } catch (err) {
    /** 仍失败时去掉氛围图再试一次（只留卦爻 SVG） */
    if (
      base.visual.kind === 'liuyao' &&
      (base.visual.primaryArtSrc || base.visual.changedArtSrc)
    ) {
      return withCoverHost(stripLiuyaoArt(base), face, toCoverPng);
    }
    throw err;
  }
}

export async function renderShareCoverPair(
  snap: ShareCoverSnap,
  deepUrl?: string,
): Promise<{ front: string; back: string; qrDataUrl?: string }> {
  const url = deepUrl || snap.deepUrl || '';
  const qrDataUrl = url ? await makeShareQrDataUrl(url) : snap.qrDataUrl;
  const enriched = { ...snap, deepUrl: url || undefined, qrDataUrl };
  const [front, back] = await Promise.all([
    renderShareCoverPngDataUrl(enriched, url, 'front'),
    renderShareCoverPngDataUrl(enriched, url, 'back'),
  ]);
  return { front, back, qrDataUrl };
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [meta, b64] = dataUrl.split(',');
  const mime = /data:([^;]+)/.exec(meta || '')?.[1] || 'image/png';
  const bin = atob(b64 || '');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

export async function downloadShareCoverPng(
  snap: ShareCoverSnap,
  filename = 'mystic-share.png',
  deepUrl?: string,
  face: ShareCoverFace = 'front',
): Promise<string> {
  const dataUrl = await renderShareCoverPngDataUrl(snap, deepUrl, face);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
  return dataUrl;
}

export async function nativeShareCoverImage(input: {
  dataUrl: string;
  filename: string;
  title: string;
  text?: string;
  url?: string;
}): Promise<'shared' | 'unsupported' | 'cancelled'> {
  const file = dataUrlToFile(input.dataUrl, input.filename);
  const canFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] });
  if (canFiles) {
    try {
      await navigator.share({
        files: [file],
        title: input.title,
        text: input.text,
      });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled';
    }
  }
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && input.url) {
    try {
      await navigator.share({
        title: input.title,
        text: input.text,
        url: input.url,
      });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled';
    }
  }
  return 'unsupported';
}
