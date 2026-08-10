/**
 * 跨体系「深度学习」抽屉（对齐六爻卦象精读入口）
 * 按体系 + 当前档案本地保存。
 */
import { getActivePerson } from '../life/storage.ts';

export type LabNotesSystem = 'bazi' | 'ziwei' | 'liuyao' | 'tarot' | 'xiaoliuren';

const STORAGE_PREFIX = 'mystic-lab.reading-notes.';

const SYSTEM_LABEL: Record<LabNotesSystem, string> = {
  bazi: '八字',
  ziwei: '紫微',
  liuyao: '六爻',
  tarot: '塔罗',
  xiaoliuren: '小六壬',
};

function storageKey(system: LabNotesSystem, personId: string): string {
  return `${STORAGE_PREFIX}${system}.${personId}`;
}

function loadNote(system: LabNotesSystem, personId: string): string {
  try {
    return localStorage.getItem(storageKey(system, personId)) ?? '';
  } catch {
    return '';
  }
}

function saveNote(system: LabNotesSystem, personId: string, text: string): void {
  try {
    const key = storageKey(system, personId);
    if (!text.trim()) localStorage.removeItem(key);
    else localStorage.setItem(key, text);
  } catch {
    /* ignore */
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type OpenLabNotesSheetOpts = {
  system: LabNotesSystem;
  /** 副标题，如命盘摘要 */
  context?: string;
  /**
   * 主区自定义内容（如八字出生密码五步）。
   * 提供后替换默认整页笔记；笔记区改为底部折叠。
   */
  bodyHtml?: string;
  onBodyReady?: (body: HTMLElement, sheet: HTMLElement) => void;
  /** 有 bodyHtml 时是否仍显示学习笔记；默认 true */
  showNotePad?: boolean;
};

/** 悬浮笔按钮打开的「深度学习」面板 */
export function openLabNotesSheet(opts: OpenLabNotesSheetOpts): void {
  document.querySelector('.lab-notes-sheet')?.remove();

  const person = getActivePerson();
  const draft = loadNote(opts.system, person.id);
  const sysLabel = SYSTEM_LABEL[opts.system];
  const custom = Boolean(opts.bodyHtml);
  const showPad = opts.showNotePad !== false;

  const defaultPad = `
        <label class="lab-notes-label" for="lab-notes-ta">写下这次想留住的句子、对照与疑问</label>
        <textarea id="lab-notes-ta" class="lab-notes-input" rows="10" maxlength="4000" placeholder="例如：今天最对味的一句是… / 想验证的一件小事…">${escapeHtml(draft)}</textarea>
        <p class="lab-notes-hint">自动保存在本机，按档案分开；可随时回来续写。</p>`;

  const foldedPad = showPad
    ? `<details class="lab-notes-pad">
        <summary>学习笔记</summary>
        <label class="lab-notes-label" for="lab-notes-ta">写下这次想留住的句子、对照与疑问</label>
        <textarea id="lab-notes-ta" class="lab-notes-input is-compact" rows="6" maxlength="4000" placeholder="例如：今天最对味的一句是…">${escapeHtml(draft)}</textarea>
        <p class="lab-notes-hint">自动保存在本机，按档案分开。</p>
      </details>`
    : '';

  const sheet = document.createElement('div');
  sheet.className = 'lab-notes-sheet is-open';
  sheet.innerHTML = `
    <button type="button" class="lab-notes-backdrop" data-notes-close aria-label="关闭"></button>
    <div class="lab-notes-panel" role="dialog" aria-modal="true" aria-label="深度学习">
      <header class="lab-notes-head">
        <div>
          <p class="lab-notes-kicker">深度学习 · ${escapeHtml(sysLabel)}</p>
          <h2>${escapeHtml(person.nickname || '自己')}</h2>
          ${opts.context ? `<p class="lab-notes-context">${escapeHtml(opts.context)}</p>` : ''}
        </div>
        <button type="button" class="lab-notes-x" data-notes-close aria-label="关闭">×</button>
      </header>
      <div class="lab-notes-body">
        ${
          custom
            ? `<div class="lab-notes-custom" data-notes-custom>${opts.bodyHtml}</div>${foldedPad}`
            : defaultPad
        }
      </div>
      <footer class="lab-notes-foot">
        <button type="button" class="life-btn-ghost" data-notes-close>关闭</button>
        <button type="button" class="life-btn-primary" data-notes-save>保存</button>
      </footer>
    </div>
  `;

  const close = () => {
    const ta = sheet.querySelector<HTMLTextAreaElement>('#lab-notes-ta');
    if (ta) saveNote(opts.system, person.id, ta.value);
    sheet.classList.remove('is-open');
    window.setTimeout(() => sheet.remove(), 220);
  };

  sheet.querySelectorAll('[data-notes-close]').forEach((el) => {
    el.addEventListener('click', close);
  });
  sheet.querySelector('[data-notes-save]')?.addEventListener('click', () => {
    const ta = sheet.querySelector<HTMLTextAreaElement>('#lab-notes-ta');
    if (ta) saveNote(opts.system, person.id, ta.value);
    close();
  });

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      window.removeEventListener('keydown', onKey);
    }
  };
  window.addEventListener('keydown', onKey);

  (document.querySelector('#app') || document.body).appendChild(sheet);

  const customHost = sheet.querySelector<HTMLElement>('[data-notes-custom]');
  if (customHost && opts.onBodyReady) {
    opts.onBodyReady(customHost, sheet);
  }

  requestAnimationFrame(() => {
    sheet.classList.add('is-visible');
    if (!custom) {
      sheet.querySelector<HTMLTextAreaElement>('#lab-notes-ta')?.focus();
    }
  });
}
