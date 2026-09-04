/**
 * 场景库 · 每问入库、按路由聚合，供回归与 playbook 迭代。
 * 本地 localStorage；备份见 journal/backup.ts BACKUP_KEYS。
 */
import { suggestSceneTags } from '../life/scene-tags.ts';
import { detectIntents } from './intent.ts';
import {
  buildPlainDirectAnswer,
  routeQuestion,
  type QuestionRoute,
} from './instant-answer.ts';
import type { IntentId } from './types.ts';

export const SCENE_LIBRARY_STORAGE_KEY = 'mystic-lab-scene-library';

export type MysticSystem =
  | 'tarot'
  | 'liuyao'
  | 'bazi'
  | 'ziwei'
  | 'xiaoliuren'
  | 'meihua'
  | 'unknown';

/** 单次占问事件 */
export type SceneQuestionEvent = {
  id: string;
  at: string;
  system: MysticSystem;
  question: string;
  route: QuestionRoute;
  intentId: IntentId;
  sceneTags: string[];
  directAnswer?: string;
  journalEntryId?: string;
};

/** 聚合后的场景 playbook（同路由 + 主标签） */
export type ScenePlaybook = {
  id: string;
  route: QuestionRoute;
  primaryTag: string;
  title: string;
  askCount: number;
  /** 代表性原问（去重，新问优先） */
  exemplars: string[];
  /** 曾用过的直答句（去重，供回归/润色参考） */
  answerHints: string[];
  systems: MysticSystem[];
  updatedAt: string;
};

export type SceneLibraryStore = {
  version: 1;
  events: SceneQuestionEvent[];
  playbooks: ScenePlaybook[];
};

export type RecordQuestionSceneInput = {
  system: MysticSystem;
  question: string;
  intentId?: IntentId;
  route?: QuestionRoute;
  sceneTags?: string[];
  directAnswer?: string;
  journalEntryId?: string;
  at?: string;
};

const MAX_EVENTS = 400;
const MAX_PLAYBOOKS = 80;
const MAX_EXEMPLARS = 24;
const MAX_ANSWER_HINTS = 12;
const DEDUPE_MS = 60_000;

export const ROUTE_LABELS: Record<QuestionRoute, string> = {
  meta_ux: '产品/流程',
  legal_after_report: '报警后程序',
  threat_harassment: '威胁与人身安全',
  family_dispute_outcome: '家事走向',
  outcome_trajectory: '事情走向',
  timing: '时机应期',
  career_decision: '职场去留',
  love_relationship: '感情关系',
  money_wealth: '财务金钱',
  health_body: '健康身体',
  exam_study: '考试学业',
  anxiety_choice: '纠结抉择',
  general: '开放探索',
};

function normalizeQuestion(q: string): string {
  return q.trim().replace(/\s+/g, ' ').slice(0, 500);
}

function playbookId(route: QuestionRoute, primaryTag: string): string {
  return `${route}::${primaryTag}`;
}

function emptyStore(): SceneLibraryStore {
  return { version: 1, events: [], playbooks: [] };
}

let memoryFallback: SceneLibraryStore | null = null;

function storageAvailable(): boolean {
  return typeof localStorage !== 'undefined';
}

export function loadSceneLibrary(): SceneLibraryStore {
  if (!storageAvailable()) {
    return memoryFallback ?? emptyStore();
  }
  try {
    const raw = localStorage.getItem(SCENE_LIBRARY_STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as SceneLibraryStore;
    if (parsed?.version !== 1 || !Array.isArray(parsed.events) || !Array.isArray(parsed.playbooks)) {
      return emptyStore();
    }
    return parsed;
  } catch {
    return emptyStore();
  }
}

function saveSceneLibrary(store: SceneLibraryStore): void {
  if (!storageAvailable()) {
    memoryFallback = store;
    return;
  }
  localStorage.setItem(
    SCENE_LIBRARY_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      events: store.events.slice(0, MAX_EVENTS),
      playbooks: store.playbooks.slice(0, MAX_PLAYBOOKS),
    }),
  );
}

function isDuplicateEvent(
  events: SceneQuestionEvent[],
  system: MysticSystem,
  question: string,
  at: string,
): boolean {
  const q = normalizeQuestion(question);
  const t = new Date(at).getTime();
  return events.some((e) => {
    if (e.system !== system || normalizeQuestion(e.question) !== q) return false;
    const dt = Math.abs(new Date(e.at).getTime() - t);
    return dt < DEDUPE_MS;
  });
}

function upsertExemplar(list: string[], question: string): string[] {
  const q = normalizeQuestion(question);
  if (!q) return list;
  const next = [q, ...list.filter((x) => normalizeQuestion(x) !== q)];
  return next.slice(0, MAX_EXEMPLARS);
}

function upsertHint(list: string[], hint: string | undefined): string[] {
  const h = hint?.trim();
  if (!h) return list;
  const next = [h, ...list.filter((x) => x !== h)];
  return next.slice(0, MAX_ANSWER_HINTS);
}

function upsertPlaybook(
  playbooks: ScenePlaybook[],
  input: {
    route: QuestionRoute;
    primaryTag: string;
    question: string;
    system: MysticSystem;
    directAnswer?: string;
    at: string;
  },
): ScenePlaybook[] {
  const id = playbookId(input.route, input.primaryTag);
  const title = `${ROUTE_LABELS[input.route]} · ${input.primaryTag}`;
  const idx = playbooks.findIndex((p) => p.id === id);
  if (idx < 0) {
    const created: ScenePlaybook = {
      id,
      route: input.route,
      primaryTag: input.primaryTag,
      title,
      askCount: 1,
      exemplars: upsertExemplar([], input.question),
      answerHints: upsertHint([], input.directAnswer),
      systems: [input.system],
      updatedAt: input.at,
    };
    return [created, ...playbooks].slice(0, MAX_PLAYBOOKS);
  }
  const prev = playbooks[idx]!;
  const systems = prev.systems.includes(input.system)
    ? prev.systems
    : [...prev.systems, input.system].slice(0, 6);
  const updated: ScenePlaybook = {
    ...prev,
    askCount: prev.askCount + 1,
    exemplars: upsertExemplar(prev.exemplars, input.question),
    answerHints: upsertHint(prev.answerHints, input.directAnswer),
    systems,
    updatedAt: input.at,
  };
  const next = [...playbooks];
  next.splice(idx, 1);
  return [updated, ...next].slice(0, MAX_PLAYBOOKS);
}

/** 每问必调：写入事件 + 更新聚合 playbook */
export function recordQuestionScene(input: RecordQuestionSceneInput): SceneQuestionEvent | null {
  const question = normalizeQuestion(input.question);
  if (!question || question.length < 2) return null;

  const at = input.at ?? new Date().toISOString();
  const intents = detectIntents(question);
  const intentId = input.intentId ?? intents[0]?.id ?? 'open_explore';
  const route = input.route ?? routeQuestion(question, intentId);
  const sceneTags = input.sceneTags?.length
    ? input.sceneTags
    : suggestSceneTags(question);
  const primaryTag = sceneTags[0] ?? '决策';
  const directAnswer =
    input.directAnswer?.trim() ||
    buildPlainDirectAnswer(question, { intentId }) ||
    undefined;

  const store = loadSceneLibrary();
  if (isDuplicateEvent(store.events, input.system, question, at)) {
    return null;
  }

  const event: SceneQuestionEvent = {
    id: `sq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    at,
    system: input.system,
    question,
    route,
    intentId,
    sceneTags,
    directAnswer,
    journalEntryId: input.journalEntryId,
  };

  store.events = [event, ...store.events].slice(0, MAX_EVENTS);
  store.playbooks = upsertPlaybook(store.playbooks, {
    route,
    primaryTag,
    question,
    system: input.system,
    directAnswer,
    at,
  });
  saveSceneLibrary(store);
  return event;
}

/** 按路由取 playbook（解读时可查同类 exemplar） */
export function findPlaybooksForRoute(route: QuestionRoute, limit = 3): ScenePlaybook[] {
  return loadSceneLibrary()
    .playbooks.filter((p) => p.route === route)
    .sort((a, b) => b.askCount - a.askCount)
    .slice(0, limit);
}

/** 导出 JSON（调试 / 回归集生成） */
export function exportSceneLibraryJson(): string {
  return JSON.stringify(loadSceneLibrary(), null, 2);
}

/** 与 exemplar 简单相似（共享前缀或子串 ≥6 字） */
export function questionSimilarity(a: string, b: string): boolean {
  const x = normalizeQuestion(a);
  const y = normalizeQuestion(b);
  if (x === y) return true;
  const probe = Math.min(12, x.length, y.length);
  for (let len = probe; len >= 6; len--) {
    const slice = x.slice(0, len);
    if (y.includes(slice) || x.includes(y.slice(0, len))) return true;
  }
  return false;
}

/** 找最相近的 exemplar（供后续 LLM / 规则增强） */
export function findNearestExemplar(
  route: QuestionRoute,
  question: string,
): { playbook: ScenePlaybook; exemplar: string } | null {
  const playbooks = findPlaybooksForRoute(route, 5);
  for (const pb of playbooks) {
    for (const ex of pb.exemplars) {
      if (questionSimilarity(question, ex)) {
        return { playbook: pb, exemplar: ex };
      }
    }
  }
  return null;
}

/** 测试用：清空内存/本地场景库 */
export function resetSceneLibraryForTests(): void {
  memoryFallback = emptyStore();
  if (storageAvailable()) {
    localStorage.removeItem(SCENE_LIBRARY_STORAGE_KEY);
  }
}
