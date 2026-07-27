import type { ReadingResult } from '../interpretation/types.ts';
import type { JournalEntry } from '../journal/records.ts';
import { updateJournalReadingSnapshot } from '../journal/records.ts';
import { SPREADS } from '../tarot/spreads.ts';
import { mountQuestionThread } from './question-thread-panel.ts';
import { mountReadingFeedbackPanel } from './reading-feedback-panel.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type JournalDetailOptions = {
  entry: JournalEntry;
  reading: ReadingResult;
  regenerated: boolean;
  /** 旧快照补了按问题串讲 */
  hydratedThread?: boolean;
  onClose: () => void;
  /** 未完成手札：继续抽完 */
  onContinue?: () => void;
};

export function mountJournalDetail(container: HTMLElement, options: JournalDetailOptions): void {
  const { entry, regenerated, hydratedThread, onClose, onContinue } = options;
  const reading = options.reading;
  const date = new Date(entry.createdAt).toLocaleString('zh-CN');
  const spreadLabel = SPREADS[entry.spreadType]?.name ?? entry.spreadType;
  const isPartial = entry.status === 'partial';
  const canContinue = Boolean(isPartial && onContinue);

  // 把补上的串讲写回快照，下次打开直接有
  if (hydratedThread && reading.questionThread) {
    updateJournalReadingSnapshot(entry.id, reading);
  }

  container.className = 'journal-detail';
  container.innerHTML = `
    <button type="button" class="journal-detail-close" aria-label="关闭">✕</button>
    <header class="journal-detail-head">
      <time class="journal-detail-date">${escapeHtml(date)}${isPartial ? ' · 未完成' : ''}</time>
      <h2 class="journal-detail-question">${escapeHtml(entry.question || '（未记录问题）')}</h2>
      <p class="journal-detail-meta">${escapeHtml(spreadLabel)} · ${reading.cards.length} 张牌</p>
      ${
        canContinue
          ? '<button type="button" class="btn journal-detail-continue" data-continue>继续完成</button>'
          : ''
      }
    </header>
    ${regenerated ? '<p class="journal-detail-regen">根据记录重新生成的解读（旧手札无完整快照）</p>' : ''}
    ${hydratedThread ? '<p class="journal-detail-regen">已按你的问题补成「此刻解读」串讲（牌面原文保留）</p>' : ''}
    <div class="journal-detail-thread" id="journal-detail-thread"></div>
    <p class="journal-detail-summary">${escapeHtml(reading.summary)}</p>
    ${
      entry.reflection?.trim()
        ? `<div class="journal-handnote"><span class="journal-handnote-prefix">手札记录：</span>${escapeHtml(entry.reflection.trim())}</div>`
        : ''
    }
    ${reading.learningNote ? `<div class="journal-detail-learning"><h3>学习笔记</h3><p>${escapeHtml(reading.learningNote)}</p></div>` : ''}
    <div id="journal-detail-feedback"></div>
  `;

  const threadHost = container.querySelector('#journal-detail-thread') as HTMLElement | null;
  if (threadHost) {
    const ok = mountQuestionThread(threadHost, reading);
    if (!ok) threadHost.remove();
  }

  const feedbackHost = container.querySelector('#journal-detail-feedback');
  if (feedbackHost && !isPartial) {
    mountReadingFeedbackPanel(feedbackHost as HTMLElement, {
      journalId: entry.id,
      question: entry.question,
      cardIds: entry.cardIds,
      initial: entry.feedback,
    });
  }

  container.querySelector('.journal-detail-close')?.addEventListener('click', onClose);
  container.querySelector('[data-continue]')?.addEventListener('click', () => onContinue?.());
}
