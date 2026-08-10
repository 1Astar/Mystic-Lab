/**
 * 图鉴详情顶图（盘面弹窗 / 图鉴页共用）
 */
import { BRANCH_LORE, STEM_LORE, WUXING_ORDER } from './codex-lore.ts';
import type { WuXing } from './elements.ts';
import { memoryCoverHtml, shenshaBadgeArtHtml } from './codex-cover.ts';
import { getStarCard } from './codex-tags.ts';
import {
  stemBranchArtSvg,
  tengodArtSvg,
  wuxingArtSvg,
} from './codex-art.ts';

export function codexDetailArtHtml(id: string): string {
  if (WUXING_ORDER.includes(id as WuXing)) {
    return memoryCoverHtml(id, wuxingArtSvg(id as WuXing, { uid: `det-wx-${id}` }));
  }
  const gz = [...STEM_LORE, ...BRANCH_LORE].find((x) => x.id === id);
  if (gz) {
    return memoryCoverHtml(id, stemBranchArtSvg(gz, { uid: `det-gz-${id}` }));
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
  return '';
}
