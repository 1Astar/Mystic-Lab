import type { ReadingResult } from '../interpretation/types.ts';
import type { JournalEntry } from '../journal/records.ts';
import { SPREADS } from '../tarot/spreads.ts';
import { mountCardResultTabs } from './card-result-tabs.ts';
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
  onClose: () => void;
};

export function mountJournalDetail(container: HTMLElement, options: JournalDetailOptions): void {
  const { entry, reading, regenerated, onClose } = options;
  const date = new Date(entry.createdAt).toLocaleString('zh-CN');
  const spreadLabel = SPREADS[entry.spreadType]?.name ?? entry.spreadType;
  const isPartial = entry.status === 'partial';

  container.className = 'journal-detail';
  container.innerHTML = `
    <button type="button" class="journal-detail-close" aria-label="关闭">✕</button>
    <header class="journal-detail-head">
      <time class="journal-detail-date">${escapeHtml(date)}${isPartial ? ' · 未完成' : ''}</time>
      <h2 class="journal-detail-question">${escapeHtml(entry.question || '（未记录问题）')}</h2>
      <p class="journal-detail-meta">${escapeHtml(spreadLabel)} · ${reading.cards.length} 张牌</p>
    </header>
    ${regenerated ? '<p class="journal-detail-regen">根据记录重新生成的解读（旧手札无完整快照）</p>' : ''}
    <div class="journal-detail-cards" id="journal-detail-cards"></div>
    <p class="journal-detail-summary">${escapeHtml(reading.summary)}</p>
    ${reading.learningNote ? `<div class="journal-detail-learning"><h3>学习笔记</h3><p>${escapeHtml(reading.learningNote)}</p></div>` : ''}
    ${entry.reflection ? `<div class="journal-detail-reflection"><h3>后来的感悟</h3><p>${escapeHtml(entry.reflection)}</p></div>` : ''}
    <div id="journal-detail-feedback"></div>
  `;

  const cardsHost = container.querySelector('#journal-detail-cards');
  if (cardsHost) {
    for (const cardReading of reading.cards) {
      const item = document.createElement('div');
      item.className = 'journal-detail-card-item';
      const host = document.createElement('div');
      host.className = 'result-tabs-host';
      item.appendChild(host);
      cardsHost.appendChild(item);
      mountCardResultTabs(host, cardReading);
    }
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
}
