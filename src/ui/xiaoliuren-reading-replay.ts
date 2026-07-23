import type { XiaoliurenJournalEntry } from '../xiaoliuren/journal.ts';
import { resolveXiaoliurenLesson } from '../xiaoliuren/replay.ts';
import { buildAiReading, buildProcessExplanation } from '../xiaoliuren/interpret.ts';
import { getHuangliBrief } from '../xiaoliuren/huangli.ts';
import { buildGodHuangliBridge } from '../xiaoliuren/god-huangli-bridge.ts';
import { renderSixGodIcon, getSixGodByIndex, sixGodOneLiner } from '../xiaoliuren/six-gods.ts';
import { renderOrbitPlate, renderSixGodsReveal } from './xiaoliuren/hand-plate.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 复原当时起课结果场景（对齐塔罗 reading-replay） */
export function mountXiaoliurenReadingReplay(
  container: HTMLElement,
  entry: XiaoliurenJournalEntry,
  onClose: () => void,
): void {
  const resolved = resolveXiaoliurenLesson(entry);
  const date = new Date(entry.createdAt).toLocaleString('zh-CN');

  if (!resolved) {
    container.className = 'xlr-replay';
    container.innerHTML = `
      <div class="xlr-replay-backdrop" data-replay-close></div>
      <div class="xlr-replay-sheet" role="dialog" aria-modal="true">
        <button type="button" class="xlr-replay-close" data-replay-close aria-label="关闭">✕</button>
        <p class="xlr-replay-kicker">复原当时的起课结果</p>
        <p class="xlr-replay-regen">旧记录缺少时辰信息，无法重建盘面。</p>
        <h2 class="xlr-replay-question">${escapeHtml(entry.question || '（未记录问题）')}</h2>
        <p class="xlr-replay-meta">${escapeHtml(entry.resultName)} · ${escapeHtml(entry.summary)}</p>
      </div>
    `;
    container.querySelectorAll('[data-replay-close]').forEach((el) => {
      el.addEventListener('click', onClose);
    });
    requestAnimationFrame(() => container.classList.add('is-visible'));
    return;
  }

  const { lesson, lunar, hour } = resolved;
  const at = new Date(entry.createdAt);
  const brief = getHuangliBrief(at, hour.label, hour.name);
  const reading = buildAiReading(entry.question, lesson.result);
  const bridge = buildGodHuangliBridge(lesson.result, brief);

  container.className = 'xlr-replay';
  container.innerHTML = `
    <div class="xlr-replay-backdrop" data-replay-close></div>
    <div class="xlr-replay-sheet" role="dialog" aria-modal="true" aria-labelledby="xlr-replay-title">
      <button type="button" class="xlr-replay-close" data-replay-close aria-label="关闭">✕</button>
      <header class="xlr-replay-head">
        <p class="xlr-replay-kicker">复原当时的起课结果</p>
        <time class="xlr-replay-date">${escapeHtml(date)}</time>
        <h2 id="xlr-replay-title" class="xlr-replay-question">${escapeHtml(entry.question || '（未记录问题）')}</h2>
        <p class="xlr-replay-meta">${escapeHtml(entry.solarLabel)} · ${escapeHtml(lunar.label)} · ${escapeHtml(hour.label)}</p>
      </header>

      <div class="xlr-result-hero">
        ${renderSixGodIcon(lesson.result, 'xlr-result-icon')}
        <h2 class="xlr-result-name">${escapeHtml(lesson.result.name)}</h2>
        <p class="xlr-result-summary">${escapeHtml(sixGodOneLiner(lesson.result))}</p>
      </div>
      <p class="xlr-reveal-tally">农历${escapeHtml(lunar.monthLabel)} → 落${escapeHtml(getSixGodByIndex(lesson.steps[0]!.landingIndex).name)} · 农历${escapeHtml(lunar.dayLabel)} → 落${escapeHtml(getSixGodByIndex(lesson.steps[1]!.landingIndex).name)} · ${escapeHtml(hour.label)} → 落${escapeHtml(lesson.result.name)}</p>
      ${renderOrbitPlate({
        dotIndex: lesson.resultIndex,
        litIndices: [0, 1, 2, 3, 4, 5],
        landingIndex: lesson.resultIndex,
      })}
      ${renderSixGodsReveal(lesson.resultIndex)}

      <p class="xlr-result-process">${escapeHtml(buildProcessExplanation(lesson.basisLabel, lesson.result.name))}</p>
      <p class="xlr-result-huangli-bridge">${escapeHtml(bridge)}</p>

      <section class="xlr-result-block xlr-result-layer">
        <h3><span class="xlr-result-layer-no">一</span>传统含义</h3>
        <p>${escapeHtml(reading.meaning)}</p>
      </section>
      <section class="xlr-result-block xlr-result-layer">
        <h3><span class="xlr-result-layer-no">二</span>结合你的问题</h3>
        <p>${escapeHtml(reading.analysis)}</p>
      </section>
      <section class="xlr-result-block xlr-result-layer">
        <h3><span class="xlr-result-layer-no">三</span>现在更适合</h3>
        <p>${escapeHtml(reading.suggestion)}</p>
      </section>
      <section class="xlr-result-block xlr-result-layer">
        <h3><span class="xlr-result-layer-no">四</span>给你的一个提醒</h3>
        <p>${escapeHtml(reading.reflection)}</p>
      </section>
      ${
        entry.reflection
          ? `<section class="xlr-result-block"><h3>当时感想</h3><p>${escapeHtml(entry.reflection)}</p></section>`
          : ''
      }
    </div>
  `;

  container.querySelectorAll('[data-replay-close]').forEach((el) => {
    el.addEventListener('click', onClose);
  });
  requestAnimationFrame(() => container.classList.add('is-visible'));
}

export function openXiaoliurenJournalReplay(
  host: HTMLElement,
  entry: XiaoliurenJournalEntry,
): void {
  host.querySelector('[data-xlr-replay]')?.remove();
  const overlay = document.createElement('div');
  overlay.dataset.xlrReplay = '';
  mountXiaoliurenReadingReplay(overlay, entry, () => {
    overlay.classList.remove('is-visible');
    window.setTimeout(() => overlay.remove(), 220);
  });
  host.appendChild(overlay);
}
