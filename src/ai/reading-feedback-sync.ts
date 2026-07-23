import {
  isStarPmCaptureConfigured,
  loadAiSettings,
  type AiSettings,
} from './settings.ts';
import type {
  JournalReadingFeedback,
  ReadingFeedbackReason,
  ReadingFeedbackVerdict,
} from '../journal/records.ts';
import { updateJournalFeedback } from '../journal/records.ts';

export type ReadingFeedbackSubmitInput = {
  journalId: string;
  question: string;
  cardIds: string[];
  focusCardId?: string;
  verdict: ReadingFeedbackVerdict;
  reasons: ReadingFeedbackReason[];
  cardNote: string;
  usefulness?: JournalReadingFeedback['usefulness'];
  mood?: JournalReadingFeedback['mood'];
  /** 合成手札不落库，只走 Star PM / 回调 */
  persistLocal?: boolean;
};

export type ReadingFeedbackSubmitResult = {
  feedback: JournalReadingFeedback;
  starPm: { ok: boolean; message: string };
};

export async function submitReadingFeedback(
  input: ReadingFeedbackSubmitInput,
): Promise<ReadingFeedbackSubmitResult> {
  const feedback: JournalReadingFeedback = {
    verdict: input.verdict,
    reasons: input.verdict === 'miss' ? input.reasons : [],
    cardNote: input.cardNote.trim(),
    focusCardId: input.focusCardId,
    usefulness: input.usefulness,
    mood: input.mood,
    at: new Date().toISOString(),
  };

  if (input.persistLocal !== false && !input.journalId.startsWith('j-synthetic-')) {
    updateJournalFeedback(input.journalId, feedback);
  }

  const settings = loadAiSettings();
  if (!isStarPmCaptureConfigured(settings)) {
    return {
      feedback,
      starPm: {
        ok: false,
        message: '已保存在本机；配置 Star PM 后可同步到收件箱',
      },
    };
  }

  try {
    await postReadingFeedbackToStarPm(input, feedback, settings);
    return { feedback, starPm: { ok: true, message: '已同步到 Star PM 收件箱' } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '同步失败';
    return {
      feedback,
      starPm: { ok: false, message: `已本机保存；Star PM：${msg}` },
    };
  }
}

async function postReadingFeedbackToStarPm(
  input: ReadingFeedbackSubmitInput,
  feedback: JournalReadingFeedback,
  settings: AiSettings,
): Promise<void> {
  const base = settings.starPmBaseUrl.trim().replace(/\/$/, '');
  const titleBase = input.question.trim().slice(0, 36);
  const verdictLabel = feedback.verdict === 'echo' ? '有呼应' : '不准';
  const title = `[占问反馈·${verdictLabel}] ${titleBase}${input.question.length > 36 ? '…' : ''}`;

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
      summary: `${verdictLabel}${feedback.reasons.length ? ` · ${feedback.reasons.join('、')}` : ''}`,
      priority: 'P2',
      suggestedNextStep: '对照反馈优化解读规则、问法教练或牌感文案',
      source: 'Mystic Lab',
      rawThought: [
        `结论: ${verdictLabel}`,
        `原因: ${feedback.reasons.join('、') || '无'}`,
        `有用度: ${feedback.usefulness ? `${feedback.usefulness}/5` : '未评'}`,
        `心情: ${feedback.mood ?? '未标'}`,
        `牌细节: ${feedback.cardNote || '无'}`,
        `焦点牌: ${feedback.focusCardId || '整次'}`,
        `问题: ${input.question}`,
        `牌组: ${input.cardIds.join(', ')}`,
        `手札: ${input.journalId}`,
        `时间: ${feedback.at}`,
      ].join('\n'),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 100)}` : ''}`);
  }
}
