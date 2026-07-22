import type { LiuyaoJournalEntry } from '../liuyao/journal.ts';
import { journalMetaLine } from '../liuyao/journal.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 复原当时占问：侧栏叠层（用日记四层解读，无需完整 CastResult） */
export function openLiuyaoEncounterReplay(
  host: HTMLElement,
  entry: LiuyaoJournalEntry,
): void {
  host.querySelector('[data-ly-replay]')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'ly-replay';
  overlay.dataset.lyReplay = '';
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

  const close = () => overlay.remove();
  overlay.querySelectorAll('[data-replay-close]').forEach((el) => {
    el.addEventListener('click', close);
  });
  host.appendChild(overlay);
}
