export type RewriteFeedbackSource = 'question' | 'result';

export type RewriteFeedbackReason =
  | '太空泛'
  | '仍太封闭'
  | '偏题'
  | '太长'
  | '不够具体'
  | '其他';

export type RewriteCandidate = {
  label: string;
  question: string;
};

export type QuestionRewriteFeedback = {
  id: string;
  at: string;
  source: RewriteFeedbackSource;
  originalQuestion: string;
  candidates: RewriteCandidate[];
  reasons: RewriteFeedbackReason[];
  note: string;
};

const STORAGE_KEY = 'mystic-lab-question-rewrite-feedback';
const MAX_STORE = 30;
const PROMPT_LIMIT = 5;

function loadAll(): QuestionRewriteFeedback[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QuestionRewriteFeedback[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(items: QuestionRewriteFeedback[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_STORE)));
}

export function listRewriteFeedback(): QuestionRewriteFeedback[] {
  return loadAll();
}

export function recentFeedbackForPrompt(limit = PROMPT_LIMIT): QuestionRewriteFeedback[] {
  return loadAll().slice(0, limit);
}

export function formatFeedbackForPrompt(items: QuestionRewriteFeedback[]): string {
  if (items.length === 0) return '';
  return items
    .map((f, i) => {
      const reasons = f.reasons.join('、') || '未标注';
      const note = f.note.trim() ? `；补充：${f.note.trim()}` : '';
      const samples = f.candidates.map((c) => c.question).join(' / ');
      return `${i + 1}. 原问「${f.originalQuestion}」→ 候选「${samples}」被评为：${reasons}${note}`;
    })
    .join('\n');
}

export function saveRewriteFeedbackLocal(
  input: Omit<QuestionRewriteFeedback, 'id' | 'at'> & { at?: string },
): QuestionRewriteFeedback {
  const entry: QuestionRewriteFeedback = {
    id: `qrf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    at: input.at ?? new Date().toISOString(),
    source: input.source,
    originalQuestion: input.originalQuestion,
    candidates: input.candidates,
    reasons: input.reasons,
    note: input.note.trim(),
  };
  const next = [entry, ...loadAll()].slice(0, MAX_STORE);
  saveAll(next);
  return entry;
}

export function exportRewriteFeedbackJson(): string {
  return JSON.stringify(loadAll(), null, 2);
}
