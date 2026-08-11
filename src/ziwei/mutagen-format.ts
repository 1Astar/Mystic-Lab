/**
 * 四化字符串：禄权科忌 + 可选落宫
 */
import type { PalaceSnap } from './types.ts';

export const MUTAGEN_LABELS = ['禄', '权', '科', '忌'] as const;

export type MutagenKind = (typeof MUTAGEN_LABELS)[number];

export type MutagenPiece = {
  star: string;
  kind: MutagenKind;
  palace?: string;
};

function shortPalace(name: string): string {
  return name.replace(/宫$/, '');
}

export function starHomePalace(
  palaces: PalaceSnap[],
  star: string,
): string {
  const hit = palaces.find((p) =>
    [...p.majors, ...p.minors, ...p.adjectives].some((s) => s.name === star),
  );
  return hit?.name ?? '';
}

/** 仅「天同化禄 · 天机化权」 */
export function formatMutagenLine(stars: string[] | undefined): string {
  if (!stars?.length) return '';
  return stars
    .map((s, i) => `${s}化${MUTAGEN_LABELS[i] ?? ''}`)
    .filter((s) => !s.endsWith('化'))
    .join(' · ');
}

/** 「天同化禄→财帛 · …」供解读展示 */
export function formatMutagenWithPalaces(
  stars: string[] | undefined,
  palaces: PalaceSnap[],
  sep = ' · ',
): string {
  if (!stars?.length) return '';
  return stars
    .map((star, i) => {
      const kind = MUTAGEN_LABELS[i];
      if (!kind) return '';
      const palace = starHomePalace(palaces, star);
      return palace
        ? `${star}化${kind}→${shortPalace(palace)}`
        : `${star}化${kind}`;
    })
    .filter(Boolean)
    .join(sep);
}

export function parseMutagenLine(line: string): MutagenPiece[] {
  if (!line.trim()) return [];
  return line
    .split(/\s*[·、]\s*/)
    .map((chunk) => {
      const m = chunk.trim().match(/^(.+?)化([禄权科忌])(?:→(.+))?$/);
      if (!m) return null;
      const palaceRaw = m[3]?.trim();
      return {
        star: m[1]!.trim(),
        kind: m[2] as MutagenKind,
        palace: palaceRaw ? (palaceRaw.endsWith('宫') ? palaceRaw : `${palaceRaw}宫`) : undefined,
      };
    })
    .filter((x): x is MutagenPiece => Boolean(x));
}

export function mutagenKindHint(kind: MutagenKind): string {
  if (kind === '禄') return '机会与获得感';
  if (kind === '权') return '责任与拍板';
  if (kind === '科') return '表现与求教';
  return '复盘与防硬刚';
}
