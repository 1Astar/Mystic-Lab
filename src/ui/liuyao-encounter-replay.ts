import type { LiuyaoJournalEntry } from '../liuyao/journal.ts';
import { journalMetaLine } from '../liuyao/journal.ts';
import {
  resolveLiuyaoCast,
  resolveLiuyaoLearnMode,
} from '../liuyao/replay.ts';
import { mountLiuyaoResultTabs } from './liuyao/result-tabs.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mountTextFallback(
  overlay: HTMLElement,
  entry: LiuyaoJournalEntry,
  onClose: () => void,
): void {
  overlay.className = 'ly-replay';
  overlay.innerHTML = `
    <div class="ly-replay-backdrop" data-replay-close></div>
    <aside class="ly-replay-panel" role="dialog" aria-label="复原当时结果">
      <header class="ly-replay-head">
        <div>
          <p class="ly-replay-kicker">复原当时的占问结果</p>
          <h3>${escapeHtml(entry.primaryFullName)}</h3>
          <p class="ly-replay-meta">${escapeHtml(journalMetaLine(entry))}</p>
        </div>
        <button type="button" class="ly-replay-x" data-replay-close aria-label="关闭">×</button>
      </header>
      <div class="ly-replay-body">
        <p class="ly-replay-regen">旧记录无法重建完整盘面，仅展示当时四层解读。</p>
        <p class="ly-replay-q"><strong>问</strong> · ${escapeHtml(entry.question || '（未写问题）')}</p>
        ${
          entry.changedFullName
            ? `<p class="ly-guide-tip">变卦 · ${escapeHtml(entry.changedFullName)}${
                entry.changingLabels.length
                  ? ` · 动爻 ${escapeHtml(entry.changingLabels.join('、'))}`
                  : ''
              }</p>`
            : '<p class="ly-guide-tip">无动则无变 · 时间轴停在本卦</p>'
        }
        <section class="ly-replay-layer">
          <h4>一句话</h4>
          <p>${escapeHtml(entry.reading.summary || entry.summary)}</p>
        </section>
        <section class="ly-replay-layer">
          <h4>依据</h4>
          <p class="ly-replay-pre">${escapeHtml(entry.reading.basis || '—')}</p>
        </section>
        <section class="ly-replay-layer">
          <h4>情境</h4>
          <p class="ly-replay-pre">${escapeHtml(entry.reading.context || '—')}</p>
        </section>
        <section class="ly-replay-layer">
          <h4>行动</h4>
          <p class="ly-replay-pre">${escapeHtml(entry.reading.action || '—')}</p>
        </section>
        ${
          entry.reflection
            ? `<section class="ly-replay-layer"><h4>当时感想</h4><p>${escapeHtml(entry.reflection)}</p></section>`
            : ''
        }
      </div>
    </aside>
  `;
  overlay.querySelectorAll('[data-replay-close]').forEach((el) => {
    el.addEventListener('click', onClose);
  });
}

/** 复原当时占问场景（完整卦象结果页，对齐塔罗 reading-replay） */
export function mountLiuyaoReadingReplay(
  container: HTMLElement,
  entry: LiuyaoJournalEntry,
  onClose: () => void,
): void {
  const resolved = resolveLiuyaoCast(entry);
  if (!resolved) {
    mountTextFallback(container, entry, onClose);
    requestAnimationFrame(() => container.classList.add('is-visible'));
    return;
  }

  const { cast, regenerated } = resolved;
  const date = new Date(entry.castAt ?? entry.createdAt).toLocaleString('zh-CN');
  const learn = resolveLiuyaoLearnMode(entry);

  container.className = 'ly-replay ly-replay--sheet';
  container.innerHTML = `
    <div class="ly-replay-backdrop" data-replay-close></div>
    <div class="ly-replay-sheet" role="dialog" aria-modal="true" aria-labelledby="ly-replay-title">
      <button type="button" class="ly-replay-sheet-close" data-replay-close aria-label="关闭">✕</button>
      <header class="ly-replay-sheet-head">
        <p class="ly-replay-kicker">复原当时的占问结果</p>
        <time class="ly-replay-date">${escapeHtml(date)}</time>
        <h2 id="ly-replay-title" class="ly-replay-question">${escapeHtml(entry.question || '（未记录问题）')}</h2>
        <p class="ly-replay-meta">${escapeHtml(journalMetaLine(entry))}</p>
        ${
          regenerated
            ? '<p class="ly-replay-regen">根据卦名与动爻重建的盘面（旧记录无完整快照）</p>'
            : ''
        }
      </header>
      <div class="ly-replay-result-host" data-ly-replay-host></div>
      ${
        entry.reflection
          ? `<p class="ly-replay-reflection"><strong>当时感想</strong> · ${escapeHtml(entry.reflection)}</p>`
          : ''
      }
    </div>
  `;

  const host = container.querySelector<HTMLElement>('[data-ly-replay-host]');
  if (host) {
    mountLiuyaoResultTabs(host, {
      cast,
      reading: entry.reading,
      question: entry.question,
      learn,
      castAt: new Date(entry.castAt ?? entry.createdAt),
      initialTags: entry.tags,
      initialNoteDraft: entry.reflection,
    });
  }

  container.querySelectorAll('[data-replay-close]').forEach((el) => {
    el.addEventListener('click', onClose);
  });
  requestAnimationFrame(() => container.classList.add('is-visible'));
}

/** 复原当时占问：叠层打开完整结果场景 */
export function openLiuyaoEncounterReplay(
  host: HTMLElement,
  entry: LiuyaoJournalEntry,
): void {
  host.querySelector('[data-ly-replay]')?.remove();

  const overlay = document.createElement('div');
  overlay.dataset.lyReplay = '';
  mountLiuyaoReadingReplay(overlay, entry, () => {
    overlay.classList.remove('is-visible');
    window.setTimeout(() => overlay.remove(), 220);
  });
  host.appendChild(overlay);
}
