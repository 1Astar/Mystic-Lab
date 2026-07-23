import type { CodexEncounter } from '../codex/collection.ts';
import { resolveEncounterReplay, resolveJournalReading } from '../journal/replay.ts';
import type { JournalEntry } from '../journal/records.ts';
import { updateJournalReadingSnapshot } from '../journal/records.ts';
import { SPREADS } from '../tarot/spreads.ts';
import { mountQuestionThread, openThreadCardPeek } from './question-thread-panel.ts';
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
  hydratedThread?: boolean;
  onClose: () => void;
};

/** 复原完整抽牌结果场景（串讲 + 点牌弹窗） */
export function mountReadingReplay(container: HTMLElement, options: ReadingReplayOptions): void {
  const { entry, focusCardId, onClose } = options;
  const resolved = resolveJournalReading(entry);
  const reading = resolved.reading;
  const regenerated = options.regenerated ?? resolved.regenerated;
  const hydratedThread = options.hydratedThread ?? resolved.hydratedThread;
  const date = new Date(entry.createdAt).toLocaleString('zh-CN');
  const spreadLabel = SPREADS[entry.spreadType]?.name ?? entry.spreadType;
  const isSynthetic = entry.id.startsWith('j-synthetic-');

  if (hydratedThread && reading.questionThread && !isSynthetic) {
    updateJournalReadingSnapshot(entry.id, reading);
  }

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
      ${hydratedThread ? '<p class="reading-replay-regen">已按你的问题补成「此刻解读」串讲（牌面原文保留）</p>' : ''}
      <div class="reading-replay-thread" id="reading-replay-thread"></div>
      ${
        entry.reflection?.trim()
          ? `<div class="journal-handnote"><span class="journal-handnote-prefix">手札记录：</span>${escapeHtml(entry.reflection.trim())}</div>`
          : ''
      }
      <p class="reading-replay-summary">${escapeHtml(reading.summary)}</p>
      <div id="reading-replay-feedback"></div>
    </div>
  `;

  const threadHost = container.querySelector('#reading-replay-thread') as HTMLElement | null;
  if (threadHost) {
    const ok = mountQuestionThread(threadHost, reading, (i) => {
      const card = reading.cards[i];
      if (!card) return;
      openThreadCardPeek(card, {
        initialTab: 'visual',
        onCardReadingChange: (updated) => {
          reading.cards[i] = updated;
          if (!isSynthetic) updateJournalReadingSnapshot(entry.id, reading);
        },
      });
    });
    if (!ok) threadHost.remove();
  }

  if (focusCardId) {
    const idx = reading.cards.findIndex((c) => c.cardId === focusCardId);
    if (idx >= 0) {
      requestAnimationFrame(() => {
        const card = reading.cards[idx]!;
        openThreadCardPeek(card, { initialTab: 'visual' });
      });
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
      hydratedThread: resolved.hydratedThread,
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
