import { BAZI_ENCYCLOPEDIA as CORE_ENCYCLOPEDIA } from './codex-encyclopedia-data.ts';
import { buildAtlasShellEncyclopedia } from './codex-atlas-catalog.ts';
import type { BaziEncyclopediaEntry } from './codex-encyclopedia-types.ts';

export type { BaziEncyclopediaEntry, CodexDetailPane, CodexRelLink } from './codex-encyclopedia-types.ts';
export {
  CODEX_DETAIL_LABELS,
  CODEX_DETAIL_PANES,
} from './codex-encyclopedia-types.ts';

/** 核心完整词条优先，骨架壳不覆盖已有正文 */
export const BAZI_ENCYCLOPEDIA: Record<string, BaziEncyclopediaEntry> = {
  ...buildAtlasShellEncyclopedia(),
  ...CORE_ENCYCLOPEDIA,
};

export const BAZI_ENCYCLOPEDIA_IDS = Object.keys(BAZI_ENCYCLOPEDIA);

export function getBaziEncyclopedia(id: string): BaziEncyclopediaEntry | undefined {
  return BAZI_ENCYCLOPEDIA[id];
}

export function listBaziEncyclopedia(): BaziEncyclopediaEntry[] {
  return Object.values(BAZI_ENCYCLOPEDIA);
}

export function listBaziEncyclopediaByKind(
  kind: BaziEncyclopediaEntry['kind'],
): BaziEncyclopediaEntry[] {
  return listBaziEncyclopedia().filter((e) => e.kind === kind);
}

/** 知识库骨架条目：默认可浏览（不靠点亮） */
export function isAtlasLibraryKind(kind: BaziEncyclopediaEntry['kind']): boolean {
  return kind === 'nayin' || kind === 'jiazi' || kind === 'relation' || kind === 'luck';
}
