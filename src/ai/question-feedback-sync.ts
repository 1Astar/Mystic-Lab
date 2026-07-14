import {
  formatFeedbackForPrompt,
  recentFeedbackForPrompt,
  saveRewriteFeedbackLocal,
  type QuestionRewriteFeedback,
  type RewriteCandidate,
  type RewriteFeedbackReason,
  type RewriteFeedbackSource,
} from './question-feedback.ts';
import {
  isStarPmCaptureConfigured,
  loadAiSettings,
  type AiSettings,
} from './settings.ts';

export type RewriteFeedbackResult = {
  local: QuestionRewriteFeedback;
  starPm: { ok: boolean; message: string };
};

export async function submitRewriteFeedback(input: {
  source: RewriteFeedbackSource;
  originalQuestion: string;
  candidates: RewriteCandidate[];
  reasons: RewriteFeedbackReason[];
  note: string;
}): Promise<RewriteFeedbackResult> {
  const local = saveRewriteFeedbackLocal(input);
  const settings = loadAiSettings();

  if (!isStarPmCaptureConfigured(settings)) {
    return {
      local,
      starPm: {
        ok: false,
        message: '已保存在本机；配置 Star PM 后可同步到收件箱',
      },
    };
  }

  try {
    await postToStarPm(local, settings);
    return { local, starPm: { ok: true, message: '已同步到 Star PM 收件箱' } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '同步失败';
    return {
      local,
      starPm: { ok: false, message: `已本机保存；Star PM：${msg}` },
    };
  }
}

async function postToStarPm(entry: QuestionRewriteFeedback, settings: AiSettings): Promise<void> {
  const base = settings.starPmBaseUrl.trim().replace(/\/$/, '');
  const titleBase = entry.originalQuestion.trim().slice(0, 40);
  const title = `[问法反馈] ${titleBase}${entry.originalQuestion.length > 40 ? '…' : ''}`;
  const summary = `${entry.reasons.join('、') || '不满意'} · 来自${entry.source === 'question' ? '提问页' : '结果页'}`;

  const res = await fetch(`${base}/api/ideas/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ideas-capture-secret': settings.starPmCaptureSecret.trim(),
    },
    body: JSON.stringify({
      title,
      type: '内容想法',
      relatedProjectId: 'proj-moonpie',
      summary,
      priority: 'P2',
      suggestedNextStep: '对照反馈改 question-coach 规则或改问 prompt',
      source: 'Mystic Lab',
      rawThought: [
        `来源页: ${entry.source}`,
        `时间: ${entry.at}`,
        `原问题: ${entry.originalQuestion}`,
        `原因: ${entry.reasons.join('、') || '无'}`,
        `补充: ${entry.note || '无'}`,
        `候选:`,
        ...entry.candidates.map((c, i) => `${i + 1}. [${c.label}] ${c.question}`),
        '',
        '--- JSON ---',
        JSON.stringify(entry, null, 2),
      ].join('\n'),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 100)}` : ''}`);
  }
}

export function buildNegativeMemoryBlock(): string {
  return formatFeedbackForPrompt(recentFeedbackForPrompt());
}
