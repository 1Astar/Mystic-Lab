/**
 * 图鉴 · 生年/运限四化落点（本命盘动态列表）
 */
import type { PersonProfile } from '../life/types.ts';
import { collectMutagenFlow } from './learn-explain.ts';
import { resolveHoroscopeLimits } from './horoscope-limits.ts';
import {
  MUTAGEN_LABELS,
  mutagenKindHint,
  starHomePalace,
  type MutagenKind,
} from './mutagen-format.ts';
import type { ZiweiChartView } from './types.ts';

export type CodexMutagenHit = {
  kind: MutagenKind;
  label: string;
  star: string;
  palace: string;
  scope: 'birth' | 'year' | 'decade';
  scopeLabel: string;
  hint: string;
};

function row(
  kind: MutagenKind,
  star: string,
  palace: string,
  scope: CodexMutagenHit['scope'],
  scopeLabel: string,
): CodexMutagenHit {
  return {
    kind,
    label: `化${kind}`,
    star,
    palace,
    scope,
    scopeLabel,
    hint: mutagenKindHint(kind),
  };
}

function fromStarList(
  stars: string[] | undefined,
  palaces: ZiweiChartView['palaces'],
  scope: 'year' | 'decade',
  scopeLabel: string,
): CodexMutagenHit[] {
  if (!stars?.length) return [];
  return stars
    .map((star, i) => {
      const kind = MUTAGEN_LABELS[i];
      if (!kind || !star) return null;
      return row(kind, star, starHomePalace(palaces, star), scope, scopeLabel);
    })
    .filter((x): x is CodexMutagenHit => Boolean(x));
}

/** 本命生年四化：化禄·星·宫 */
export function listBirthMutagenHits(view: ZiweiChartView): CodexMutagenHit[] {
  return collectMutagenFlow(view.palaces).map((f) =>
    row(f.mutagen as MutagenKind, f.star, f.palace, 'birth', '生年'),
  );
}

/** 运限：今年流年 + 当前大限 */
export function listLimitMutagenHits(
  person: PersonProfile,
  view: ZiweiChartView,
  year = new Date().getFullYear(),
): { year: CodexMutagenHit[]; decade: CodexMutagenHit[]; yearNum: number } {
  const snap = resolveHoroscopeLimits(person, { year });
  return {
    yearNum: year,
    year: fromStarList(snap?.yearMutagen, view.palaces, 'year', `${year}流年`),
    decade: fromStarList(
      snap?.decadeMutagen,
      view.palaces,
      'decade',
      snap?.decadePalace ? `大限·${snap.decadePalace.replace(/宫$/, '')}` : '大限',
    ),
  };
}

export function mutagenHitTitle(h: CodexMutagenHit): string {
  const bits = [h.label, h.star];
  if (h.palace) bits.push(h.palace.replace(/宫$/, '') + '宫');
  return bits.join(' · ');
}
