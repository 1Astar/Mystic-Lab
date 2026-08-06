import { BAZI_ENCYCLOPEDIA } from './codex-encyclopedia-data.ts';
import type { BaziEncyclopediaEntry } from './codex-encyclopedia-types.ts';

export type { BaziEncyclopediaEntry, CodexDetailPane, CodexRelLink } from './codex-encyclopedia-types.ts';
export {
  CODEX_DETAIL_LABELS,
  CODEX_DETAIL_PANES,
} from './codex-encyclopedia-types.ts';

export function getBaziEncyclopedia(id: string): BaziEncyclopediaEntry | undefined {
  return BAZI_ENCYCLOPEDIA[id];
}

export function listBaziEncyclopedia(): BaziEncyclopediaEntry[] {
  return Object.values(BAZI_ENCYCLOPEDIA);
}
