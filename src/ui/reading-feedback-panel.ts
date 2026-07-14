import { submitReadingFeedback } from '../ai/reading-feedback-sync.ts';
import type {
  JournalReadingFeedback,
  ReadingFeedbackReason,
  ReadingFeedbackVerdict,
} from '../journal/records.ts';

const REASONS: ReadingFeedbackReason[] = ['解读不准', '问法问题', '牌感不对', '其他'];

export type ReadingFeedbackPanelOptions = {
  journalId: string;
  question: string;
  cardIds: string[];
  focusCardId?: string;
  /** 合成手札不写 localStorage */
  persistLocal?: boolean;
  initial?: JournalReadingFeedback;
  onSaved?: (feedback: JournalReadingFeedback) => void;
};

export function mountReadingFeedbackPanel(
  container: HTMLElement,
  options: ReadingFeedbackPanelOptions,
): void {
  let verdict: ReadingFeedbackVerdict | null = options.initial?.verdict ?? null;
  let reasons = new Set<ReadingFeedbackReason>(options.initial?.reasons ?? []);
  let cardNote = options.initial?.cardNote ?? '';
  let status = '';
  let error = '';
  let loading = false;

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function render(): void {
    const missOpen = verdict === 'miss';
    container.innerHTML = `
      <section class="reading-feedback-panel">
        <h3 class="reading-feedback-title">对这次占问的反馈</h3>
        <div class="reading-feedback-verdicts" role="group" aria-label="呼应程度">
          <button type="button" class="reading-feedback-verdict ${verdict === 'echo' ? 'is-active' : ''}" data-verdict="echo">有呼应</button>
          <button type="button" class="reading-feedback-verdict ${verdict === 'miss' ? 'is-active is-miss' : ''}" data-verdict="miss">不准</button>
        </div>
        ${
          missOpen
            ? `<div class="reading-feedback-reasons">
                <p class="reading-feedback-hint">哪里不准？（可多选）</p>
                <div class="reading-feedback-reason-chips">
                  ${REASONS.map(
                    (r) =>
                      `<button type="button" class="reading-feedback-reason ${reasons.has(r) ? 'is-active' : ''}" data-reason="${escapeHtml(r)}">${escapeHtml(r)}</button>`,
                  ).join('')}
                </div>
              </div>`
            : ''
        }
        <label class="reading-feedback-note-label">
          <span>对这张牌 / 这次解读的细节（选填）</span>
          <textarea class="question-input reading-feedback-note" rows="2" placeholder="例如：某张牌含义对上了，但整体节奏没感觉…">${escapeHtml(cardNote)}</textarea>
        </label>
        <div class="reading-feedback-actions">
          <button type="button" class="btn btn-secondary btn-sm reading-feedback-submit" ${loading || !verdict ? 'disabled' : ''}>
            ${loading ? '提交中…' : '提交反馈'}
          </button>
        </div>
        ${error ? `<p class="reading-feedback-err">${escapeHtml(error)}</p>` : ''}
        ${status ? `<p class="reading-feedback-ok">${escapeHtml(status)}</p>` : ''}
      </section>
    `;

    container.querySelectorAll<HTMLButtonElement>('[data-verdict]').forEach((btn) => {
      btn.addEventListener('click', () => {
        verdict = btn.dataset.verdict as ReadingFeedbackVerdict;
        if (verdict === 'echo') reasons = new Set();
        error = '';
        status = '';
        render();
      });
    });

    container.querySelectorAll<HTMLButtonElement>('[data-reason]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const r = btn.dataset.reason as ReadingFeedbackReason;
        if (reasons.has(r)) reasons.delete(r);
        else reasons.add(r);
        render();
      });
    });

    const noteEl = container.querySelector<HTMLTextAreaElement>('.reading-feedback-note');
    noteEl?.addEventListener('input', () => {
      cardNote = noteEl.value.slice(0, 300);
    });

    container.querySelector('.reading-feedback-submit')?.addEventListener('click', () => {
      void onSubmit();
    });
  }

  async function onSubmit(): Promise<void> {
    if (!verdict) {
      error = '请先选择「有呼应」或「不准」';
      render();
      return;
    }
    if (verdict === 'miss' && reasons.size === 0 && !cardNote.trim()) {
      error = '不准时请至少选一个原因，或写下细节';
      render();
      return;
    }

    loading = true;
    error = '';
    status = '';
    render();

    try {
      const result = await submitReadingFeedback({
        journalId: options.journalId,
        question: options.question,
        cardIds: options.cardIds,
        focusCardId: options.focusCardId,
        verdict,
        reasons: [...reasons],
        cardNote,
        persistLocal: options.persistLocal,
      });
      status = result.starPm.ok
        ? '感谢反馈，已保存并同步 Star PM'
        : result.starPm.message.startsWith('已保存在本机')
          ? '感谢反馈，已保存在本机'
          : result.starPm.message;
      options.onSaved?.(result.feedback);
    } catch (err) {
      error = err instanceof Error ? err.message : '提交失败';
    } finally {
      loading = false;
      render();
    }
  }

  render();
}
