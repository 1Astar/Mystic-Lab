import type { CodexEncounter } from '../codex/collection.ts';
import { resolveEncounterReplay, resolveJournalReading } from '../journal/replay.ts';
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

export type ReadingReplayOptions = {
  entry: JournalEntry;
  focusCardId?: string;
  regenerated?: boolean;
  onClose: () => void;
};

/** 复原完整抽牌结果场景（可交互四 Tab + 反馈） */
export function mountReadingReplay(container: HTMLElement, options: ReadingReplayOptions): void {
  const { entry, focusCardId, onClose } = options;
  const { reading, regenerated } = resolveJournalReading(entry);
  const date = new Date(entry.createdAt).toLocaleString('zh-CN');
  const spreadLabel = SPREADS[entry.spreadType]?.name ?? entry.spreadType;
  const isSynthetic = entry.id.startsWith('j-synthetic-');

  container.className = 'reading-replay';
  container.innerHTML = `
    <div class="reading-replay-backdrop" data-close></div>
    <div class="reading-replay-sheet" role="dialog" aria-modal="true" aria-labelledby="reading-replay-title">
      <button type="button" class="reading-replay-close" aria-label="关闭">✕</button>
      <header class="reading-replay-head">
        <p class="reading-replay-kicker">复原当时的抽牌结果</p>
        <time class="reading-replay-date">${escapeHtml(date)}</time>
        <h2 id="reading-replay-title" class="reading-replay-question">${escapeHtml(entry.question || '（未记录问题）')}</h2>
        <p class="reading-replay-meta">${escapeHtml(spreadLabel)} · ${reading.cards.length} 张牌</p>
      </header>
      ${
        regenerated || isSynthetic
          ? `<p class="reading-replay-regen">根据记录重建的解读${isSynthetic ? '（仅找到单张相遇，完整牌阵未关联到手札）' : '（旧记录无完整快照）'}</p>`
          : ''
      }
      <div class="reading-replay-cards" id="reading-replay-cards"></div>
      <p class="reading-replay-summary">${escapeHtml(reading.summary)}</p>
      <div id="reading-replay-feedback"></div>
    </div>
  `;

  const cardsHost = container.querySelector('#reading-replay-cards');
  if (cardsHost) {
    for (const cardReading of reading.cards) {
      const item = document.createElement('div');
      item.className = 'reading-replay-card-item';
      if (focusCardId && cardReading.cardId === focusCardId) {
        item.classList.add('is-focus');
      }
      const host = document.createElement('div');
      host.className = 'result-tabs-host';
      item.appendChild(host);
      cardsHost.appendChild(item);
      mountCardResultTabs(host, cardReading);
    }
  }

  const feedbackHost = container.querySelector('#reading-replay-feedback');
  if (feedbackHost) {
    mountReadingFeedbackPanel(feedbackHost as HTMLElement, {
      journalId: entry.id,
      question: entry.question,
      cardIds: entry.cardIds,
      focusCardId,
      persistLocal: !isSynthetic,
      initial: entry.feedback,
    });
  }

  const close = (): void => onClose();
  container.querySelector('.reading-replay-close')?.addEventListener('click', close);
  container.querySelector('[data-close]')?.addEventListener('click', close);
  requestAnimationFrame(() => container.classList.add('is-visible'));
}

export function openEncounterReplay(
  host: HTMLElement,
  cardId: string,
  encounter: CodexEncounter,
): void {
  host.querySelector('.reading-replay')?.remove();
  try {
    const resolved = resolveEncounterReplay(cardId, encounter);
    const overlay = document.createElement('div');
    mountReadingReplay(overlay, {
      entry: resolved.entry,
      focusCardId: cardId,
      regenerated: resolved.regenerated,
      onClose: () => {
        overlay.classList.remove('is-visible');
        window.setTimeout(() => overlay.remove(), 220);
      },
    });
    host.appendChild(overlay);
  } catch {
    /* ignore */
  }
}
