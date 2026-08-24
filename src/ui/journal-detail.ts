import { resolveReadingSeriesForEntry } from '../journal/reading-series.ts';
import type { ReadingResult } from '../interpretation/types.ts';
import type { JournalEntry } from '../journal/records.ts';
import { updateJournalReadingSnapshot } from '../journal/records.ts';
import {
  MAX_TAROT_SUPPLEMENT,
  countJournalSupplements,
} from '../journal/resume.ts';
import { draftFromTarotReading } from '../share/drafts.ts';
import { openTarotDeepReadingEntry } from '../tarot/personalize-deep.ts';
import { SPREADS } from '../tarot/spreads.ts';
import { mountLabFloatShell } from './lab-float-shell.ts';
import { mountQuestionThread } from './question-thread-panel.ts';
import { mountReadingFeedbackPanel } from './reading-feedback-panel.ts';
import { renderReadingStatusBanner } from './reading-status-banner.ts';
import { renderTarotAiSessionsHtml, tarotAiBadgeHtml } from './tarot-ai-sessions.ts';

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
  /** 已完成局：补一张建议/行动牌 */
  onSupplement?: () => void;
};

export function mountJournalDetail(
  container: HTMLElement,
  options: JournalDetailOptions,
): () => void {
  const { entry, regenerated, hydratedThread, onClose, onContinue, onSupplement } =
    options;
  const reading = options.reading;
  const date = new Date(entry.createdAt).toLocaleString('zh-CN');
  const spreadLabel = SPREADS[entry.spreadType]?.name ?? entry.spreadType;
  const isPartial = entry.status === 'partial';
  const canContinue = Boolean(isPartial && onContinue);
  const supplementUsed = countJournalSupplements(entry);
  const supplementLeft = Math.max(0, MAX_TAROT_SUPPLEMENT - supplementUsed);
  const canSupplement = Boolean(!isPartial && onSupplement && supplementLeft > 0);
  const series = resolveReadingSeriesForEntry(entry);
  const hasAi = (entry.aiSessions?.length ?? 0) > 0;
  const seriesMeta =
    series && series.totalEpisodes > 1
      ? `<p class="journal-detail-series">同日连载 · 第 ${series.episodeIndex}/${series.totalEpisodes} 局 · ${escapeHtml(series.themeLabel)}</p>`
      : '';

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
      ${seriesMeta}
      ${tarotAiBadgeHtml(entry.aiSessions?.length ?? 0)}
      ${
        canContinue
          ? '<button type="button" class="btn journal-detail-continue" data-continue>继续完成</button>'
          : ''
      }
      ${
        canSupplement
          ? `<div class="journal-detail-supplement">
          <button type="button" class="btn btn-ghost btn-sm" data-supplement>补一张建议/行动牌</button>
          <p class="supplement-guide-hint">还可补 ${supplementLeft} 张 · 补完会回到抽牌流程</p>
        </div>`
          : ''
      }
      ${
        !isPartial
          ? `<button type="button" class="btn btn-secondary btn-sm journal-detail-deep" data-deep-inline>深度解读</button>`
          : ''
      }
    </header>
    ${regenerated ? '<p class="journal-detail-regen">根据记录重新生成的解读（旧手札无完整快照）</p>' : ''}
    ${hydratedThread ? '<p class="journal-detail-regen">已按你的问题补成「此刻解读」串讲（牌面原文保留）</p>' : ''}
    <div id="journal-detail-status"></div>
    <div class="journal-detail-thread" id="journal-detail-thread"></div>
    <p class="journal-detail-summary">${escapeHtml(reading.summary)}</p>
    ${
      hasAi
        ? `<details class="journal-detail-ai-fold" open>
        <summary>回看 AI 解读</summary>
        ${renderTarotAiSessionsHtml(entry.aiSessions)}
      </details>`
        : ''
    }
    ${
      entry.reflection?.trim()
        ? `<div class="journal-handnote"><span class="journal-handnote-prefix">手札记录：</span>${escapeHtml(entry.reflection.trim())}</div>`
        : ''
    }
    ${reading.learningNote ? `<div class="journal-detail-learning"><h3>学习笔记</h3><p>${escapeHtml(reading.learningNote)}</p></div>` : ''}
    <div id="journal-detail-feedback"></div>
    ${
      canContinue
        ? '<button type="button" class="btn journal-detail-continue" data-continue-bottom>继续完成这局牌阵</button>'
        : ''
    }
  `;

  const statusHost = container.querySelector('#journal-detail-status');
  if (statusHost && !isPartial) {
    statusHost.innerHTML = renderReadingStatusBanner({
      provider: reading.provider,
    });
  }

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

  const openDeep = (): void => {
    openTarotDeepReadingEntry({
      journalId: entry.id,
      question: entry.question,
      spreadType: entry.spreadType,
      cards: entry.cards.map((c) => ({
        name: c.name,
        position: c.position,
        reversed: c.reversed,
      })),
      summary: reading.summary,
      learningNote: reading.learningNote,
      readingSnapshot: reading,
      initialTab: 'deep',
    });
  };

  const disposeFloat =
    !isPartial
      ? mountLabFloatShell(container, {
          system: 'tarot',
          surface: 'reading',
          tujianPath: '/tarot/tujian',
          notesContext: `手札：${entry.question || '塔罗占问'}`,
          draftShare: () =>
            draftFromTarotReading({
              reading,
              question: entry.question,
            }),
          onDeep: openDeep,
        })
      : () => {};

  const close = (): void => {
    disposeFloat();
    document.documentElement.classList.remove('thread-peek-open');
    onClose();
  };

  container.querySelector('.journal-detail-close')?.addEventListener('click', close);
  container.querySelectorAll('[data-continue], [data-continue-bottom]').forEach((el) => {
    el.addEventListener('click', () => onContinue?.());
  });
  container.querySelector('[data-supplement]')?.addEventListener('click', () => {
    onSupplement?.();
  });
  container.querySelector('[data-deep-inline]')?.addEventListener('click', openDeep);

  return close;
}
