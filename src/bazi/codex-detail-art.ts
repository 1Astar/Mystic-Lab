/**
 * 图鉴详情顶图（盘面弹窗 / 图鉴页共用）
 */
import { BRANCH_LORE, STEM_LORE, WUXING_ORDER } from './codex-lore.ts';
import type { WuXing } from './elements.ts';
import { memoryCoverHtml, shenshaBadgeArtHtml } from './codex-cover.ts';
import { getBaziEncyclopedia } from './codex-encyclopedia.ts';
import { getStarCard } from './codex-tags.ts';
import {
  stemBranchArtSvg,
  tengodArtSvg,
  wuxingArtSvg,
} from './codex-art.ts';
import { nayinArtSvg } from './codex-nayin-art.ts';
import { conceptDetailArtHtml } from './codex-concept-diagrams.ts';
import { NAYIN_ATLAS, nayinId } from './codex-atlas-catalog.ts';
import { nayinOf } from './pillar-meta.ts';

const NAYIN_BY_ID = Object.fromEntries(
  NAYIN_ATLAS.map((n) => [nayinId(n.name), n.name]),
) as Record<string, string>;

export function codexDetailArtHtml(id: string): string {
  if (id.startsWith('luck:') || id.startsWith('rel:')) {
    return conceptDetailArtHtml(id);
  }
  if (WUXING_ORDER.includes(id as WuXing)) {
    return memoryCoverHtml(id, wuxingArtSvg(id as WuXing, { uid: `det-wx-${id}` }));
  }
  const gz = [...STEM_LORE, ...BRANCH_LORE].find((x) => x.id === id);
  if (gz) {
    return memoryCoverHtml(id, stemBranchArtSvg(gz, { uid: `det-gz-${id}` }));
  }
  const nayinName = NAYIN_BY_ID[id];
  if (nayinName) {
    const idx = NAYIN_ATLAS.findIndex((n) => n.name === nayinName);
    return memoryCoverHtml(
      id,
      nayinArtSvg(nayinName, { uid: `det-ny${idx >= 0 ? idx : 'x'}` }),
    );
  }

  const enc = getBaziEncyclopedia(id);
  if (enc?.kind === 'jiazi' && enc.title.length >= 2) {
    const ny = nayinOf(enc.title);
    const idx = NAYIN_ATLAS.findIndex((n) => n.name === ny);
    return memoryCoverHtml(
      id,
      nayinArtSvg(ny || '海中金', { uid: `det-jz${idx >= 0 ? idx : 'x'}` }),
    );
  }

  const star = getStarCard(id);
  if (star) {
    if (star.kind === 'tengod') {
      return memoryCoverHtml(
        id,
        tengodArtSvg(star.name, { uid: `det-tg-${star.name}` }),
      );
    }
    return shenshaBadgeArtHtml(id, star.glyph);
  }

  if (enc?.kind === 'shensha') {
    return shenshaBadgeArtHtml(id, enc.title.slice(0, 1));
  }
  return '';
}
