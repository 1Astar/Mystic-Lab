/**
 * 生时校准 v2 · 侦探打分 / 排除引擎（纯规则）
 */
import type { LifeProfileInput } from '../life/types.ts';
import { resolveBirthPlaceLng } from './cities.ts';
import { resolveBranchesForBand } from './rectify-candidates.ts';
import {
  optionById,
  type DetectiveOptionEffect,
  type DetectivePhase,
} from './rectify-detective-data.ts';
import {
  buildShichenDiffProfiles,
  diffProfileByBranch,
  type ShichenDiffProfile,
  type ShichenTraitId,
} from './rectify-shichen-diff.ts';
import type { TenGodCategory } from './ten-gods.ts';

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

const BASE_SCORE = 50;
const HARD_MULT = 0.04;
const BOOST_MATCH = 18;
const BOOST_TRAIT = 12;
const BOOST_CAT = 10;
const ELIMINATE_RATIO = 0.18;

export type DetectiveAnswer = {
  questionId: string;
  optionId: string;
};

export type BranchScores = Record<string, number>;

export type DetectiveClue = {
  questionId: string;
  optionId: string;
  title: string;
  body: string;
  /** 本轮更亮的时辰 */
  highlighted: string[];
  /** 本轮压暗的时辰 */
  dimmed: string[];
};

export type RankedDetectiveBranch = {
  branch: string;
  score: number;
  confidencePct: number;
  profile: ShichenDiffProfile;
};

export type DetectiveBoard = {
  active: string[];
  eliminated: string[];
  /** Top2 分差小则都算 glowing */
  glowing: string[];
};

export type DetectiveEngineState = {
  profileKey: string;
  answers: DetectiveAnswer[];
  scores: BranchScores;
  hardAllowed: Set<string>;
  profiles: ShichenDiffProfile[];
  clues: DetectiveClue[];
};

function profileKey(profile: LifeProfileInput): string {
  return [
    profile.birthYear,
    profile.birthMonth,
    profile.birthDay,
    profile.birthPlace,
  ].join('|');
}

function initScores(): BranchScores {
  const s: BranchScores = {};
  for (const b of BRANCHES) s[b] = BASE_SCORE;
  return s;
}

function initAllowed(): Set<string> {
  return new Set(BRANCHES);
}

function maxScore(scores: BranchScores, allowed: Set<string>): number {
  let m = 0;
  for (const b of allowed) {
    const v = scores[b] ?? 0;
    if (v > m) m = v;
  }
  return m || BASE_SCORE;
}

function applyHardFilter(
  scores: BranchScores,
  allowed: Set<string>,
  keep?: string[],
  exclude?: string[],
): { highlighted: string[]; dimmed: string[] } {
  const dimmed: string[] = [];
  const highlighted: string[] = [];
  if (exclude?.length) {
    for (const b of exclude) {
      if (!allowed.has(b)) continue;
      allowed.delete(b);
      scores[b] = 0;
      dimmed.push(b);
    }
  }
  if (keep?.length) {
    const want = new Set(keep);
    for (const b of [...allowed]) {
      if (!want.has(b)) {
        scores[b] = (scores[b] ?? BASE_SCORE) * HARD_MULT;
        if (scores[b]! < BASE_SCORE * ELIMINATE_RATIO) {
          allowed.delete(b);
          dimmed.push(b);
        }
      } else {
        highlighted.push(b);
      }
    }
  }
  return { highlighted, dimmed };
}

function applyBandFilter(
  scores: BranchScores,
  allowed: Set<string>,
  band: Parameters<typeof resolveBranchesForBand>[0],
): { highlighted: string[]; dimmed: string[] } {
  const branches = resolveBranchesForBand(band);
  if (band.kind === 'all') return { highlighted: [], dimmed: [] };
  return applyHardFilter(scores, allowed, branches);
}

function boostBranches(scores: BranchScores, branches: string[]): string[] {
  const hit: string[] = [];
  for (const b of branches) {
    if (!(b in scores)) continue;
    scores[b] = (scores[b] ?? BASE_SCORE) + BOOST_MATCH;
    hit.push(b);
  }
  return hit;
}

function boostByTraits(
  scores: BranchScores,
  profiles: ShichenDiffProfile[],
  traits: ShichenTraitId[],
): string[] {
  const hit: string[] = [];
  for (const p of profiles) {
    if (traits.some((t) => p.behaviorTraitIds.includes(t))) {
      scores[p.branch] = (scores[p.branch] ?? BASE_SCORE) + BOOST_TRAIT;
      hit.push(p.branch);
    }
  }
  return [...new Set(hit)];
}

function boostByCats(
  scores: BranchScores,
  profiles: ShichenDiffProfile[],
  cats: TenGodCategory[],
): string[] {
  const hit: string[] = [];
  for (const p of profiles) {
    if (cats.some((c) => p.tenGodCats.includes(c))) {
      scores[p.branch] = (scores[p.branch] ?? BASE_SCORE) + BOOST_CAT;
      hit.push(p.branch);
    }
  }
  return [...new Set(hit)];
}

function buildClueBody(
  hint: string,
  highlighted: string[],
  dimmed: string[],
  profiles: ShichenDiffProfile[],
): string {
  const parts: string[] = [`线索确认：你选了【${hint}】。`];
  if (highlighted.length) {
    const labels = highlighted
      .slice(0, 4)
      .map((b) => {
        const p = diffProfileByBranch(profiles, b);
        return p ? `${b}时（${p.stemGod || '时柱'}）` : `${b}时`;
      })
      .join('、');
    parts.push(`在八字里，这会让【${labels}】等候选更亮。`);
  }
  if (dimmed.length) {
    parts.push(`另有 ${dimmed.slice(0, 6).join('、')}时 暂压暗，我们继续往下测……`);
  }
  if (!highlighted.length && !dimmed.length) {
    parts.push('这一题只做轻微微调，我们继续往下测……');
  }
  return parts.join('');
}

export function createDetectiveEngine(profile: LifeProfileInput): DetectiveEngineState | null {
  const profiles = buildShichenDiffProfiles(profile);
  if (!profiles.length) return null;
  return {
    profileKey: profileKey(profile),
    answers: [],
    scores: initScores(),
    hardAllowed: initAllowed(),
    profiles,
    clues: [],
  };
}

function runEffect(
  state: DetectiveEngineState,
  eff: DetectiveOptionEffect,
  meta: { questionId: string; optionId: string; title: string; recordAnswer: boolean },
): { state: DetectiveEngineState; clue: DetectiveClue } {
  const scores = { ...state.scores };
  const allowed = new Set(state.hardAllowed);

  let highlighted: string[] = [];
  let dimmed: string[] = [];

  if (eff.band) {
    const bandRes = applyBandFilter(scores, allowed, eff.band);
    highlighted = [...highlighted, ...bandRes.highlighted];
    dimmed = [...dimmed, ...bandRes.dimmed];
  }
  const hard = applyHardFilter(scores, allowed, eff.keepBranches, eff.excludeBranches);
  highlighted = [...highlighted, ...hard.highlighted];
  dimmed = [...dimmed, ...hard.dimmed];

  if (eff.boostBranches?.length) {
    highlighted = [...highlighted, ...boostBranches(scores, eff.boostBranches)];
  }
  if (eff.boostTraits?.length) {
    highlighted = [
      ...highlighted,
      ...boostByTraits(scores, state.profiles, eff.boostTraits),
    ];
  }
  if (eff.boostTenGodCats?.length) {
    highlighted = [
      ...highlighted,
      ...boostByCats(scores, state.profiles, eff.boostTenGodCats),
    ];
  }

  const clue: DetectiveClue = {
    questionId: meta.questionId,
    optionId: meta.optionId,
    title: meta.title,
    body: buildClueBody(
      eff.clueHint,
      [...new Set(highlighted)],
      [...new Set(dimmed)],
      state.profiles,
    ),
    highlighted: [...new Set(highlighted)],
    dimmed: [...new Set(dimmed)],
  };

  const next: DetectiveEngineState = {
    ...state,
    answers: meta.recordAnswer
      ? [...state.answers, { questionId: meta.questionId, optionId: meta.optionId }]
      : state.answers,
    scores,
    hardAllowed: allowed,
    clues: [...state.clues, clue],
  };
  return { state: next, clue };
}

export function applyDetectiveAnswer(
  state: DetectiveEngineState,
  questionId: string,
  optionId: string,
): { state: DetectiveEngineState; clue: DetectiveClue | null } {
  const picked = optionById(questionId, optionId);
  if (!picked) return { state, clue: null };
  return runEffect(state, picked.option.effect, {
    questionId,
    optionId,
    title: picked.question.stepTitle,
    recordAnswer: true,
  });
}

/** 自由文本 / 用户线索等非题库 effect */
export function applyFreeformEffect(
  state: DetectiveEngineState,
  eff: DetectiveOptionEffect,
  meta: { questionId: string; optionId: string; title: string },
): { state: DetectiveEngineState; clue: DetectiveClue } {
  return runEffect(state, eff, { ...meta, recordAnswer: false });
}

function splitActiveBranches(state: DetectiveEngineState): {
  active: string[];
  eliminated: string[];
} {
  const max = maxScore(state.scores, state.hardAllowed);
  const threshold = max * ELIMINATE_RATIO;
  const active: string[] = [];
  const eliminated: string[] = [];
  for (const b of BRANCHES) {
    if (!state.hardAllowed.has(b) || (state.scores[b] ?? 0) < threshold) {
      eliminated.push(b);
    } else {
      active.push(b);
    }
  }
  return { active, eliminated };
}

export function rankDetectiveBranches(state: DetectiveEngineState): RankedDetectiveBranch[] {
  const { active } = splitActiveBranches(state);
  const allowed = new Set(active);
  const rows = state.profiles
    .filter((p) => allowed.has(p.branch))
    .map((p) => ({
      branch: p.branch,
      score: state.scores[p.branch] ?? 0,
      profile: p,
    }))
    .sort((a, b) => b.score - a.score);

  const sum = rows.reduce((s, r) => s + r.score, 0) || 1;
  return rows.map((r) => ({
    ...r,
    confidencePct: Math.round((r.score / sum) * 100),
  }));
}

export function getDetectiveBoard(state: DetectiveEngineState): DetectiveBoard {
  const { active, eliminated } = splitActiveBranches(state);
  const ranked = rankDetectiveBranches(state);
  const top = ranked[0];
  const second = ranked[1];
  const glowing: string[] = [];
  if (top) glowing.push(top.branch);
  if (second && top && top.score - second.score <= BOOST_MATCH) {
    glowing.push(second.branch);
  }
  return { active, eliminated, glowing };
}

export function detectivePhaseProgress(
  state: DetectiveEngineState,
  phase: DetectivePhase,
): { answered: number; total: number } {
  const ids = new Set(
    state.answers.map((a) => a.questionId).filter((id) => id.startsWith(phase === 'objective' ? 'obj' : 'per')),
  );
  const total = phase === 'objective' ? 3 : 5;
  return { answered: ids.size, total };
}

export function isObjectiveComplete(state: DetectiveEngineState): boolean {
  const { answered, total } = detectivePhaseProgress(state, 'objective');
  return answered >= total;
}

export function isPersonalityComplete(state: DetectiveEngineState): boolean {
  const { answered, total } = detectivePhaseProgress(state, 'personality');
  return answered >= total;
}

/** 诚实区间：Top1 与 Top2 分差描述 */
export function detectiveHonestGap(state: DetectiveEngineState): string {
  const ranked = rankDetectiveBranches(state);
  const top = ranked[0];
  const second = ranked[1];
  if (!top) return '暂无可用候选';
  if (!second) return `暂倾向 ${top.branch}时（${top.confidencePct}%）`;
  const gap = top.confidencePct - second.confidencePct;
  if (gap <= 8) {
    return `最接近 ${top.branch}时 与 ${second.branch}时，建议进入剧本对照`;
  }
  return `暂倾向 ${top.branch}时（${top.confidencePct}%），次选 ${second.branch}时`;
}

/** 真太阳时校正状态（产品文案：只陈述，不教学） */
export function detectiveSolarBiasNote(birthPlace: string): string {
  const place = resolveBirthPlaceLng(birthPlace);
  if (!place.matched) {
    return '未填可识别出生地时，按时区标准钟点估算时辰。';
  }
  return place.note;
}
