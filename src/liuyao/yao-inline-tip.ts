import type { YaoDress } from './najia.ts';
import { LIUSHEN_PLAIN } from './najia.ts';
import {
  buildYaoAskCard,
  LIUQIN_ENERGY,
  LIUQIN_DICT,
  formatLiuqinShort,
  renderQinFacetsHtml,
} from './energy-lens.ts';
import type { SceneDomain } from './scene-map.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 初爻：白虎 · 官鬼巳火 · 应 */
export function formatYaoInlineHead(row: YaoDress): string {
  const marks = [
    row.isShi ? '世' : '',
    row.isYing ? '应' : '',
    row.changing ? '动' : '',
  ].filter(Boolean);
  const mark = marks.length ? ` · ${marks.join('/')}` : '';
  return `${row.label}：${row.liushen} · ${row.liuqin}${row.branch}${row.wuxing}${mark}`;
}

/** @deprecated 保留给测试；界面用结构化 tip */
export function buildYaoInlineNote(row: YaoDress, domain?: SceneDomain): string {
  const ask = buildYaoAskCard(row, { domain });
  const relate = ask.relate.replace(/^📌\s*/, '');
  const god = LIUSHEN_PLAIN[row.liushen];
  return `${god}。${relate}`;
}

function formatRelateBody(body: string): string {
  const text = body.trim();
  // 短顿号串（如「迟滞、田土、纠缠」）拆成多行；长句保持一段
  const chunks = text.split('、').map((s) => s.trim()).filter(Boolean);
  if (chunks.length >= 3 && chunks.every((c) => c.length <= 12)) {
    return chunks.map((c) => `<p class="ly-yao-inline-body">${escapeHtml(c)}</p>`).join('');
  }
  const sentences = text
    .split(/(?<=[。！？])/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length > 1) {
    return sentences.map((s) => `<p class="ly-yao-inline-body">${escapeHtml(s)}</p>`).join('');
  }
  return `<p class="ly-yao-inline-body">${escapeHtml(text)}</p>`;
}

function formatRelateBlocks(relate: string): string {
  const cleaned = relate.replace(/^📌\s*/, '').trim();
  const m = cleaned.match(/^结合你的问题（([^）]+)）：\s*(.+)$/);
  if (m) {
    return `
      <p class="ly-yao-inline-sec">结合你的问题</p>
      <p class="ly-yao-inline-topic">「${escapeHtml(m[1]!)}」</p>
      ${formatRelateBody(m[2]!)}
    `;
  }
  return formatRelateBody(cleaned);
}

export function renderYaoInlineTipHtml(row: YaoDress, domain?: SceneDomain): string {
  const marks = [
    row.isShi ? '世·我' : '',
    row.isYing ? '应·外' : '',
    row.changing ? '动爻' : '',
  ].filter(Boolean);
  const energy = LIUQIN_ENERGY[row.liuqin];
  const dict = LIUQIN_DICT[row.liuqin];
  const god = LIUSHEN_PLAIN[row.liushen];
  const ask = buildYaoAskCard(row, { domain });
  const branchLine = `${row.branch}${row.wuxing}${
    row.changedBranch ? ` → ${row.changedBranch}${row.changedWuxing ?? ''}` : ''
  }`;

  return `
    <div class="ly-yao-inline-tip-inner">
      <p class="ly-yao-inline-head">${escapeHtml(row.label)}：${escapeHtml(row.liushen)} · ${escapeHtml(
        row.liuqin,
      )}${escapeHtml(row.branch)}${escapeHtml(row.wuxing)}</p>
      ${
        marks.length
          ? `<p class="ly-yao-inline-marks">${marks.map((m) => `<span>${escapeHtml(m)}</span>`).join('')}</p>`
          : ''
      }
      <p class="ly-yao-inline-kw">${escapeHtml(god)}</p>
      <ul class="ly-yao-inline-meta">
        <li>
          <span>六亲</span>
          <button type="button" class="ly-qin-chip" data-open-qin-dict="${escapeHtml(
            row.liuqin,
          )}" title="打开六亲词典">${escapeHtml(formatLiuqinShort(row.liuqin))}</button>
        </li>
        <li><span>地支</span>${escapeHtml(branchLine)}</li>
        <li><span>能量</span>${escapeHtml(energy.modern)}</li>
      </ul>
      ${dict ? renderQinFacetsHtml(dict) : ''}
      ${formatRelateBlocks(ask.relate)}
    </div>
  `;
}

/** 与 hexagram-view 行距对齐，返回 tip 垂直中心百分比 */
export function lineTipTopPercent(index: number, compact = false): number {
  const gap = compact ? 14 : 18;
  const startY = compact ? 12 : 14;
  const h = compact ? 100 : 130;
  const y = startY + (5 - index) * gap;
  return Math.max(8, Math.min(92, (y / h) * 100));
}

const outsideClosers = new WeakMap<HTMLElement, (e: Event) => void>();

function unbindOutsideClose(host: HTMLElement): void {
  const prev = outsideClosers.get(host);
  if (prev) {
    document.removeEventListener('pointerdown', prev, true);
    outsideClosers.delete(host);
  }
}

function bindOutsideClose(host: HTMLElement): void {
  unbindOutsideClose(host);
  const onOutside = (e: Event) => {
    const t = e.target as Element | null;
    if (!t) return;
    // 点在本卦宿主内的爻 / tip 上：不关（交给爻点击切换）
    if (t.closest?.('[data-yao-inline-tip]')) return;
    if (host.contains(t) && t.closest?.('[data-ask-line], .ly-yao-ask, .ly-yao-hit')) return;
    // 点笔记侧栏：注解保持悬浮，两边同时看
    if (t.closest?.('[data-course-drawer], [data-learn-notes], .ly-course-drawer-panel')) return;
    hideYaoInlineTip(host);
  };
  outsideClosers.set(host, onOutside);
  // 延后绑定，避免本次点爻立刻被关掉
  window.setTimeout(() => {
    if (outsideClosers.get(host) === onOutside) {
      document.addEventListener('pointerdown', onOutside, true);
    }
  }, 0);
}

/** 在爻旁悬浮注解；再次点同一爻关闭 */
export function showYaoInlineTip(
  host: HTMLElement,
  row: YaoDress,
  opts?: { compact?: boolean; domain?: SceneDomain },
): void {
  host.classList.add('ly-hex-inline-host');
  let tip = host.querySelector<HTMLElement>('[data-yao-inline-tip]');
  if (!tip) {
    tip = document.createElement('aside');
    tip.className = 'ly-yao-inline-tip';
    tip.dataset.yaoInlineTip = '';
    host.appendChild(tip);
  }

  if (tip.dataset.openIndex === String(row.index) && !tip.hidden) {
    hideYaoInlineTip(host);
    return;
  }

  tip.dataset.openIndex = String(row.index);
  tip.style.setProperty('--tip-top', `${lineTipTopPercent(row.index, opts?.compact)}%`);
  tip.innerHTML = renderYaoInlineTipHtml(row, opts?.domain);
  tip.hidden = false;
  host.classList.add('is-tip-open');

  host.querySelectorAll('.ly-yao-row').forEach((el) => {
    const on = el.getAttribute('data-line') === String(row.index);
    el.classList.toggle('is-tip-open', on);
  });

  bindOutsideClose(host);
  host.dispatchEvent(
    new CustomEvent('ly-yao-tip-open', {
      bubbles: true,
      detail: { index: row.index },
    }),
  );
}

export function hideYaoInlineTip(host: HTMLElement): void {
  unbindOutsideClose(host);
  const tip = host.querySelector<HTMLElement>('[data-yao-inline-tip]');
  if (tip) {
    tip.hidden = true;
    tip.removeAttribute('data-open-index');
  }
  host.classList.remove('is-tip-open');
  host.querySelectorAll('.ly-yao-row.is-tip-open').forEach((el) => {
    el.classList.remove('is-tip-open');
  });
}
