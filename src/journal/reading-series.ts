import { detectQuestionTheme, type QuestionTheme } from '../codex/collection.ts';
import { ensureSceneTags } from '../life/scene-tags.ts';
import type { JournalEntry } from './records.ts';
import { loadJournalEntries } from './records.ts';

const THEME_LABEL: Record<QuestionTheme, string> = {
  work: '职场',
  love: '感情',
  study: '学业',
  self: '个人成长',
};

export type ReadingSeriesEpisode = {
  entryId: string;
  createdAt: string;
  question: string;
  cardSummary: string;
};

export type ReadingSeriesContext = {
  dayKey: string;
  theme: QuestionTheme;
  themeLabel: string;
  episodeIndex: number;
  totalEpisodes: number;
  priorEpisodes: ReadingSeriesEpisode[];
  /** 开场连载提示（有上集/下集时非空） */
  lead: string;
  /** 综合结论前缀 */
  synthesisPrefix: string;
  hasNext?: boolean;
  nextEpisode?: ReadingSeriesEpisode;
};

const RELATED_THRESHOLD = 4;

export function localDayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function truncate(s: string, n: number): string {
  const t = s.trim();
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

function formatTimeShort(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function tokenizeQuestion(q: string): Set<string> {
  const tokens = new Set<string>();
  const cleaned = q.replace(/[？?！!。，,\s]+/g, ' ').trim();
  for (const m of cleaned.matchAll(/[\u4e00-\u9fff]{2,}/g)) {
    tokens.add(m[0]);
  }
  for (const m of cleaned.matchAll(/[a-zA-Z]{3,}/gi)) {
    tokens.add(m[0].toLowerCase());
  }
  return tokens;
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let hit = 0;
  for (const t of a) if (b.has(t)) hit++;
  return hit / Math.max(a.size, b.size);
}

function sceneTagOverlap(a: string[] | undefined, b: string[] | undefined): number {
  const sa = new Set(a ?? []);
  const sb = new Set(b ?? []);
  let n = 0;
  for (const t of sa) if (sb.has(t)) n++;
  return n;
}

export function scoreRelatedReading(
  question: string,
  subjectId: string | undefined,
  sceneTags: string[] | undefined,
  other: JournalEntry,
): number {
  if (other.status === 'partial') return 0;
  const themeA = detectQuestionTheme(question);
  const themeB = detectQuestionTheme(other.question);
  let score = 0;
  if (themeA === themeB) score += 3;
  score +=
    sceneTagOverlap(
      sceneTags ?? ensureSceneTags(question),
      other.sceneTags ?? ensureSceneTags(other.question),
    ) * 2;
  if (subjectId && other.subjectId && subjectId === other.subjectId) score += 2;
  const qSim = overlapScore(tokenizeQuestion(question), tokenizeQuestion(other.question));
  if (qSim >= 0.35) score += 3;
  else if (qSim >= 0.15) score += 1;
  const qa = question.trim();
  const qb = other.question.trim();
  if (qa.length >= 6 && qb.length >= 6) {
    const sliceA = qa.slice(0, Math.min(12, qa.length));
    const sliceB = qb.slice(0, Math.min(12, qb.length));
    if (qb.includes(sliceA) || qa.includes(sliceB)) score += 2;
  }
  return score;
}

function episodeFromEntry(entry: JournalEntry): ReadingSeriesEpisode {
  return {
    entryId: entry.id,
    createdAt: entry.createdAt,
    question: entry.question,
    cardSummary:
      entry.cards.map((c) => c.name).join('、') || truncate(entry.summary, 24),
  };
}

function buildLead(
  themeLabel: string,
  episodeIndex: number,
  priorEpisodes: ReadingSeriesEpisode[],
  hasNext: boolean,
): string {
  if (episodeIndex <= 1 && priorEpisodes.length === 0) return '';

  const prev = priorEpisodes[priorEpisodes.length - 1];
  const priorLabel = priorEpisodes.length === 1 ? '上集' : `前 ${priorEpisodes.length} 局`;
  let lead = `今天关于「${themeLabel}」的第 ${episodeIndex} 局——接上${priorLabel}`;
  if (prev) {
    lead += `（${formatTimeShort(prev.createdAt)} 曾问「${truncate(prev.question, 20)}」，牌面 ${prev.cardSummary}）`;
  }
  lead += '。建议沿「延续 / 转折 / 新线索」三条线读，别孤立单张。';
  if (hasNext) {
    lead += '（同一天后面还有相关局，也可对照下集。）';
  }
  return lead;
}

function buildSynthesisPrefix(priorEpisodes: ReadingSeriesEpisode[]): string {
  if (!priorEpisodes.length) return '';
  const prev = priorEpisodes[priorEpisodes.length - 1]!;
  return `【连载】相较今天早些时候（${prev.cardSummary}），这一局更宜回答「事情有没有动」「新牌是在补强还是推翻上一局的担心」。`;
}

export type ResolveSeriesInput = {
  question: string;
  at: string;
  entryId?: string | null;
  subjectId?: string;
  sceneTags?: string[];
  entries?: JournalEntry[];
};

export function findRelatedSameDayEntries(input: ResolveSeriesInput): JournalEntry[] {
  const dayKey = localDayKey(input.at);
  const tags = input.sceneTags ?? ensureSceneTags(input.question);
  const all = (input.entries ?? loadJournalEntries()).filter(
    (e) => e.status !== 'partial' && localDayKey(e.createdAt) === dayKey,
  );
  return all
    .filter((e) => e.id !== input.entryId)
    .filter(
      (e) =>
        scoreRelatedReading(input.question, input.subjectId, tags, e) >=
        RELATED_THRESHOLD,
    )
    .sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
}

/** 当场占问：找今天更早的相关局，作为「下集」承接 */
export function resolveReadingSeries(
  input: ResolveSeriesInput,
): ReadingSeriesContext | null {
  const related = findRelatedSameDayEntries(input);
  if (related.length === 0) return null;

  const theme = detectQuestionTheme(input.question);
  const priorEpisodes = related.map(episodeFromEntry);
  const episodeIndex = priorEpisodes.length + 1;
  const lead = buildLead(THEME_LABEL[theme], episodeIndex, priorEpisodes, false);
  if (!lead) return null;

  return {
    dayKey: localDayKey(input.at),
    theme,
    themeLabel: THEME_LABEL[theme],
    episodeIndex,
    totalEpisodes: episodeIndex,
    priorEpisodes,
    lead,
    synthesisPrefix: buildSynthesisPrefix(priorEpisodes),
  };
}

/** 手札回看：在同日集群里定位上集/下集 */
export function resolveReadingSeriesForEntry(
  entry: JournalEntry,
  entries?: JournalEntry[],
): ReadingSeriesContext | null {
  const dayKey = localDayKey(entry.createdAt);
  const all = (entries ?? loadJournalEntries()).filter(
    (e) => e.status !== 'partial' && localDayKey(e.createdAt) === dayKey,
  );
  const tags = entry.sceneTags ?? ensureSceneTags(entry.question);

  const cluster = all
    .filter((e) => {
      if (e.id === entry.id) return true;
      return (
        scoreRelatedReading(entry.question, entry.subjectId, tags, e) >=
          RELATED_THRESHOLD ||
        scoreRelatedReading(e.question, e.subjectId, e.sceneTags, entry) >=
          RELATED_THRESHOLD
      );
    })
    .sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  if (cluster.length < 2) return null;
  const idx = cluster.findIndex((e) => e.id === entry.id);
  if (idx < 0) return null;

  const theme = detectQuestionTheme(entry.question);
  const priorEpisodes = cluster.slice(0, idx).map(episodeFromEntry);
  const nextEntry = cluster[idx + 1];
  const hasNext = idx < cluster.length - 1;
  const episodeIndex = idx + 1;
  const totalEpisodes = cluster.length;

  let lead = buildLead(THEME_LABEL[theme], episodeIndex, priorEpisodes, hasNext);
  if (episodeIndex === 1 && hasNext && nextEntry) {
    const next = episodeFromEntry(nextEntry);
    lead = `今天关于「${THEME_LABEL[theme]}」的第一局——后面 ${formatTimeShort(next.createdAt)} 你还问了「${truncate(next.question, 20)}」（${next.cardSummary}），可把两局当上集与下集连读。`;
  }

  return {
    dayKey,
    theme,
    themeLabel: THEME_LABEL[theme],
    episodeIndex,
    totalEpisodes,
    priorEpisodes,
    lead,
    synthesisPrefix: buildSynthesisPrefix(priorEpisodes),
    hasNext,
    nextEpisode: nextEntry ? episodeFromEntry(nextEntry) : undefined,
  };
}
