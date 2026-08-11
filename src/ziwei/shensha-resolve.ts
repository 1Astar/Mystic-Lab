/**
 * 神煞/杂曜同源解析：图鉴与术语弹窗共用。
 * 优先 SHENSHA_LORE（图鉴神煞桶权威）；缺条再回落 minor-star-lore。
 */
import { getMinorStarLore, type MinorStarLore } from './minor-star-lore.ts';
import { getShenshaLore, type ShenshaLore } from './shensha-lore.ts';

export type DecoStarKind = 'shensha' | 'minor';

export type ResolvedDecoStar = {
  kind: DecoStarKind;
  id: string;
  epithet: string;
  oneLiner: string;
  traditional: string;
  when?: string;
  /** 图鉴深链用 */
  shenshaId?: string;
};

export function resolveDecoStarLore(name: string): ResolvedDecoStar | undefined {
  const key = name.replace(/星$/, '').trim();
  if (!key) return undefined;

  const shensha = getShenshaLore(key);
  if (shensha) {
    return {
      kind: 'shensha',
      id: shensha.id,
      epithet: shensha.epithet,
      oneLiner: shensha.oneLiner,
      traditional: shensha.traditional,
      when: shensha.when,
      shenshaId: shensha.id,
    };
  }

  const minor = getMinorStarLore(key);
  if (minor) {
    return {
      kind: 'minor',
      id: minor.id,
      epithet: minor.epithet,
      oneLiner: minor.oneLiner,
      traditional: minor.traditional,
    };
  }

  return undefined;
}

/** 图鉴详情字段（与 renderShenshaDetail 同源） */
export function shenshaDetailFields(s: ShenshaLore): {
  oneLiner: string;
  traditional: string;
  when: string;
} {
  return {
    oneLiner: s.oneLiner,
    traditional: s.traditional,
    when: s.when,
  };
}

export type { ShenshaLore, MinorStarLore };
