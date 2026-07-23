import {
  encountersForHex,
  formatEncounterAt,
  getHexMeetStat,
  meetBannerForHex,
} from './journey.ts';
import type { Hexagram } from './hexagrams.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 「我的相遇」面板 HTML（图鉴笔记 / 右侧抽屉共用） */
export function renderHexEncounterPanelHtml(hex: Hexagram, sediment = ''): string {
  const stat = getHexMeetStat(hex.name);
  const list = encountersForHex(hex.name);
  const banner = meetBannerForHex(hex);
  const latest = list[0];
  const countLabel = stat ? `${stat.count} 次` : '0 次';
  const lastQ = latest?.question?.trim() || '（暂无）';
  const lastTendency =
    latest?.reading?.summary?.trim() ||
    latest?.summary?.trim() ||
    '（完成占问并保存后，答案倾向会记录在这里）';

  const history =
    list.length === 0
      ? `<p class="ly-guide-tip">暂无历史占问。起卦后点「保存到我的卦象」，相遇会留在这里。</p>`
      : `<div class="ly-enc-list">${list
          .map(
            (e) => `
        <button type="button" class="ly-enc-item" data-enc-id="${escapeHtml(e.id)}">
          <time>${escapeHtml(formatEncounterAt(e.castAt || e.createdAt))}</time>
          <p>问：${escapeHtml(e.question || '（未写问题）')}</p>
          <p class="ly-enc-state">${escapeHtml(e.primaryFullName)}${
            e.changedFullName ? ` → ${escapeHtml(e.changedFullName)}` : ' · 无变'
          }</p>
          <span class="ly-enc-open">复原当时结果 →</span>
        </button>`,
          )
          .join('')}</div>`;

  return `
    <div class="ly-enc-panel" data-hex-encounter data-hex="${escapeHtml(hex.name)}">
      <p class="ly-enc-banner">${escapeHtml(banner)}</p>
      <div class="ly-enc-stats">
        <p><span class="ly-enc-stat-k">抽到次数</span><strong>${escapeHtml(countLabel)}</strong></p>
        <p><span class="ly-enc-stat-k">最近一次问题</span>${escapeHtml(lastQ)}</p>
        <p><span class="ly-enc-stat-k">最近一次答案倾向</span>${escapeHtml(lastTendency)}</p>
      </div>
      <p class="ly-layer-guide">历史占问记录</p>
      ${history}
      <p class="ly-layer-guide" style="margin-top:14px">我的感想</p>
      <label class="ly-course-note-field">
        <span>写下对这一卦的感想…</span>
        <textarea class="question-input" rows="4" data-enc-note placeholder="第一次遇见的感觉、半年后再遇时的对照…">${escapeHtml(
          sediment,
        )}</textarea>
      </label>
      <button type="button" class="btn ly-enc-save" data-enc-save>保存感想</button>
    </div>
  `;
}

export function bindHexEncounterPanel(
  root: HTMLElement,
  opts: {
    onSaveNote: (text: string) => void;
    onRestore: (journalId: string) => void;
  },
): void {
  const host = root.querySelector<HTMLElement>('[data-hex-encounter]');
  if (!host || host.dataset.bound === '1') return;
  host.dataset.bound = '1';

  host.querySelectorAll<HTMLButtonElement>('[data-enc-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.encId;
      if (id) opts.onRestore(id);
    });
  });

  const ta = host.querySelector<HTMLTextAreaElement>('[data-enc-note]');
  const save = () => {
    if (ta) opts.onSaveNote(ta.value);
  };
  host.querySelector('[data-enc-save]')?.addEventListener('click', () => {
    save();
    const btn = host.querySelector<HTMLButtonElement>('[data-enc-save]');
    if (btn) {
      const prev = btn.textContent;
      btn.textContent = '已保存';
      setTimeout(() => {
        btn.textContent = prev;
      }, 1200);
    }
  });
  ta?.addEventListener('blur', save);
}
