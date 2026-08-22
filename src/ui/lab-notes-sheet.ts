/**
 * 跨体系笔记抽屉：体系=笔记本；界面类型=自动标签；用户可自打标签。
 */
import { getActivePerson } from '../life/storage.ts';

export type LabNotesSystem = 'bazi' | 'ziwei' | 'liuyao' | 'tarot' | 'xiaoliuren';

/** 界面类型 → 自动标签 */
export type LabNotesSurface = 'reading' | 'chart' | 'atlas' | 'learn';

const STORAGE_PREFIX = 'mystic-lab.reading-notes.';
const MAX_USER_TAGS = 12;
const MAX_TAG_LEN = 16;

const SYSTEM_LABEL: Record<LabNotesSystem, string> = {
  bazi: '八字',
  ziwei: '紫微',
  liuyao: '六爻',
  tarot: '塔罗',
  xiaoliuren: '小六壬',
};

export const SURFACE_LABEL: Record<LabNotesSurface, string> = {
  reading: '解读',
  chart: '盘面',
  atlas: '图鉴',
  learn: '学习',
};

const SURFACE_SWITCH_ORDER: readonly LabNotesSurface[] = [
  'atlas',
  'reading',
  'chart',
  'learn',
];

function surfaceContextLine(
  system: LabNotesSystem,
  surface: LabNotesSurface | undefined,
): string {
  const sys = SYSTEM_LABEL[system];
  if (!surface) return `${sys}笔记`;
  return `${sys}${SURFACE_LABEL[surface]}`;
}

/** 笔记来源芯片：默认可在图鉴/解读/盘面之间切换（同本笔记，只改来源标记） */
export function notesSurfaceChips(
  surface: LabNotesSurface | undefined,
  accumulated: LabNotesSurface[],
): LabNotesSurface[] {
  const seen = new Set<LabNotesSurface>(accumulated);
  if (surface) seen.add(surface);
  return SURFACE_SWITCH_ORDER.filter(
    (t) => t !== 'learn' || seen.has('learn') || surface === 'learn',
  );
}

export type NoteDocV1 = {
  v: 1;
  text: string;
  autoTags: LabNotesSurface[];
  userTags: string[];
  updatedAt: string;
};

function storageKey(system: LabNotesSystem, personId: string): string {
  return `${STORAGE_PREFIX}${system}.${personId}`;
}

function isSurface(v: unknown): v is LabNotesSurface {
  return v === 'reading' || v === 'chart' || v === 'atlas' || v === 'learn';
}

/** 规范化用户标签：去空白、限长、去重保留顺序 */
export function normalizeUserTag(raw: string): string | null {
  const t = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_TAG_LEN);
  return t ? t : null;
}

export function mergeUserTags(prev: string[], next: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of [...prev, ...next]) {
    const t = normalizeUserTag(raw);
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= MAX_USER_TAGS) break;
  }
  return out;
}

function parseNoteDoc(raw: string | null): NoteDocV1 {
  if (!raw) {
    return { v: 1, text: '', autoTags: [], userTags: [], updatedAt: '' };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<NoteDocV1>;
    if (parsed && typeof parsed === 'object' && parsed.v === 1 && typeof parsed.text === 'string') {
      const autoTags = Array.isArray(parsed.autoTags)
        ? [...new Set(parsed.autoTags.filter(isSurface))]
        : [];
      const userTags = Array.isArray(parsed.userTags)
        ? mergeUserTags([], parsed.userTags.filter((t): t is string => typeof t === 'string'))
        : [];
      return {
        v: 1,
        text: parsed.text,
        autoTags,
        userTags,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
      };
    }
  } catch {
    /* plain text legacy */
  }
  return { v: 1, text: raw, autoTags: [], userTags: [], updatedAt: '' };
}

export function loadLabNoteDoc(system: LabNotesSystem, personId: string): NoteDocV1 {
  try {
    return parseNoteDoc(localStorage.getItem(storageKey(system, personId)));
  } catch {
    return { v: 1, text: '', autoTags: [], userTags: [], updatedAt: '' };
  }
}

export function loadLabNoteText(system: LabNotesSystem, personId: string): string {
  return loadLabNoteDoc(system, personId).text;
}

export function saveLabNote(
  system: LabNotesSystem,
  personId: string,
  text: string,
  surface?: LabNotesSurface,
  userTags?: string[],
): void {
  try {
    const key = storageKey(system, personId);
    const prev = loadLabNoteDoc(system, personId);
    const autoTags = [...prev.autoTags];
    if (surface && !autoTags.includes(surface)) autoTags.push(surface);
    const tags = userTags !== undefined ? mergeUserTags([], userTags) : prev.userTags;
    if (!text.trim() && !autoTags.length && !tags.length) {
      localStorage.removeItem(key);
      return;
    }
    const doc: NoteDocV1 = {
      v: 1,
      text,
      autoTags,
      userTags: tags,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(doc));
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

function autoTagsHtml(
  surface: LabNotesSurface | undefined,
  accumulated: LabNotesSurface[],
): string {
  const chips = notesSurfaceChips(surface, accumulated);
  if (!chips.length) return '';
  const buttons = chips
    .map((t) => {
      const current = t === surface;
      return `<button
        type="button"
        class="lab-notes-tag is-auto${current ? ' is-current' : ''}"
        data-notes-surface="${t}"
        aria-pressed="${current ? 'true' : 'false'}"
        title="标记这次笔记来自「${escapeHtml(SURFACE_LABEL[t])}」"
      >${escapeHtml(SURFACE_LABEL[t])}</button>`;
    })
    .join('');
  return `
    <div class="lab-notes-surface" data-notes-surface-row>
      <div class="lab-notes-tags is-auto" role="group" aria-label="笔记来源">${buttons}</div>
      <p class="lab-notes-surface-hint">同一本笔记 · 点选标记这次从哪打开（不是跳转页面）</p>
    </div>`;
}

function userTagsEditorHtml(userTags: string[]): string {
  const chips = userTags
    .map(
      (t) => `
      <span class="lab-notes-tag is-user">
        <span>${escapeHtml(t)}</span>
        <button type="button" class="lab-notes-tag-x" data-tag-remove="${escapeHtml(t)}" aria-label="删除标签 ${escapeHtml(t)}">×</button>
      </span>`,
    )
    .join('');
  return `
    <div class="lab-notes-user-tags" data-user-tags>
      <div class="lab-notes-tags is-user" data-user-tag-list aria-label="我的标签">
        ${chips}
      </div>
      <form class="lab-notes-tag-form" data-tag-form>
        <input
          type="text"
          class="lab-notes-tag-input"
          data-tag-input
          maxlength="${MAX_TAG_LEN}"
          placeholder="自打标签，如：流年 / 合盘"
          aria-label="添加笔记标签"
        />
        <button type="submit" class="lab-notes-tag-add" ${userTags.length >= MAX_USER_TAGS ? 'disabled' : ''}>添加</button>
      </form>
      <p class="lab-notes-tag-hint">最多 ${MAX_USER_TAGS} 个；界面标签自动带，自定义标签可随时删。</p>
    </div>`;
}

export type OpenLabNotesSheetOpts = {
  system: LabNotesSystem;
  /** 当前界面 → 写入自动标签 */
  surface?: LabNotesSurface;
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
  /** bodyHtml 模式下笔记折叠区是否默认展开 */
  notePadOpen?: boolean;
  /** 说明卡片，嵌在笔记输入上方（引导边看边记） */
  primerHtml?: string;
  /** 对照提示（显示在笔记上方；点一行可写入输入框） */
  reflect?: {
    title: string;
    items: string[];
  };
};

/** 悬浮笔按钮打开的笔记面板 */
export function openLabNotesSheet(opts: OpenLabNotesSheetOpts): void {
  document.querySelector('.lab-notes-sheet')?.remove();

  const person = getActivePerson();
  const doc = loadLabNoteDoc(opts.system, person.id);
  const sysLabel = SYSTEM_LABEL[opts.system];
  const custom = Boolean(opts.bodyHtml);
  const showPad = opts.showNotePad !== false;
  let userTags = [...doc.userTags];
  let activeSurface: LabNotesSurface | undefined = opts.surface;
  let contextLine =
    opts.context?.trim() || surfaceContextLine(opts.system, activeSurface);

  const reflectHtml =
    opts.reflect?.items?.length
      ? `<aside class="lab-notes-reflect" aria-label="对照提示">
          <p class="lab-notes-reflect-title">${escapeHtml(opts.reflect.title)}</p>
          <ul class="lab-notes-reflect-list">
            ${opts.reflect.items
              .map(
                (item, i) => `
              <li>
                <button type="button" class="lab-notes-reflect-item" data-reflect-i="${i}">
                  ${escapeHtml(item)}
                </button>
              </li>`,
              )
              .join('')}
          </ul>
          <p class="lab-notes-reflect-hint">点一句，写进下方笔记</p>
        </aside>`
      : '';

  const primerHtml = opts.primerHtml
    ? `<div class="lab-notes-primer" data-notes-primer>${opts.primerHtml}</div>`
    : '';

  const defaultPad = `
        ${primerHtml}
        ${reflectHtml}
        <label class="lab-notes-label" for="lab-notes-ta">写下这次想留住的句子、对照与疑问</label>
        <textarea id="lab-notes-ta" class="lab-notes-input" rows="10" maxlength="4000" placeholder="例如：今天最对味的一句是… / 想验证的一件小事…">${escapeHtml(doc.text)}</textarea>
        <p class="lab-notes-hint">自动保存在本机；按体系分本，界面标签自动带，也可自打标签。</p>`;

  const padOpenAttr = opts.notePadOpen ? ' open' : '';
  const foldedPad = showPad
    ? `<details class="lab-notes-pad"${padOpenAttr}>
        <summary>笔记</summary>
        ${primerHtml}
        ${reflectHtml}
        <label class="lab-notes-label" for="lab-notes-ta">写下这次想留住的句子、对照与疑问</label>
        <textarea id="lab-notes-ta" class="lab-notes-input is-compact" rows="6" maxlength="4000" placeholder="例如：今天最对味的一句是…">${escapeHtml(doc.text)}</textarea>
        <p class="lab-notes-hint">自动保存在本机；按体系分本，可自打标签。</p>
      </details>`
    : '';

  const sheet = document.createElement('div');
  sheet.className = 'lab-notes-sheet is-open';
  sheet.innerHTML = `
    <button type="button" class="lab-notes-backdrop" data-notes-close aria-label="关闭"></button>
    <div class="lab-notes-panel" role="dialog" aria-modal="true" aria-label="笔记">
      <header class="lab-notes-head">
        <div>
          <p class="lab-notes-kicker">笔记 · ${escapeHtml(sysLabel)}</p>
          <h2>${escapeHtml(person.nickname || '自己')}</h2>
          ${autoTagsHtml(activeSurface, doc.autoTags)}
          <p class="lab-notes-context" data-notes-context>${escapeHtml(contextLine)}</p>
        </div>
        <button type="button" class="lab-notes-x" data-notes-close aria-label="关闭">×</button>
      </header>
      <div class="lab-notes-body">
        ${userTagsEditorHtml(userTags)}
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

  const paintUserTags = (): void => {
    const host = sheet.querySelector<HTMLElement>('[data-user-tags]');
    if (!host) return;
    const keepFocus = document.activeElement === sheet.querySelector('[data-tag-input]');
    host.outerHTML = userTagsEditorHtml(userTags);
    bindUserTagControls();
    if (keepFocus) {
      sheet.querySelector<HTMLInputElement>('[data-tag-input]')?.focus();
    }
  };

  const bindUserTagControls = (): void => {
    sheet.querySelectorAll<HTMLButtonElement>('[data-tag-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.tagRemove ?? '';
        userTags = userTags.filter((t) => t !== tag);
        paintUserTags();
      });
    });
    const form = sheet.querySelector<HTMLFormElement>('[data-tag-form]');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = sheet.querySelector<HTMLInputElement>('[data-tag-input]');
      if (!input) return;
      const next = normalizeUserTag(input.value);
      if (!next) return;
      userTags = mergeUserTags(userTags, [next]);
      input.value = '';
      paintUserTags();
    });
  };

  const persist = () => {
    const ta = sheet.querySelector<HTMLTextAreaElement>('#lab-notes-ta');
    const text = ta?.value ?? loadLabNoteText(opts.system, person.id);
    saveLabNote(opts.system, person.id, text, activeSurface, userTags);
  };

  const paintSurfaceRow = (): void => {
    const host = sheet.querySelector<HTMLElement>('[data-notes-surface-row]');
    if (host) host.outerHTML = autoTagsHtml(activeSurface, doc.autoTags);
    const ctx = sheet.querySelector<HTMLElement>('[data-notes-context]');
    if (ctx) {
      // 用户未自带 context 时，随来源切换；有自带 context 则保留原文，仅改 chip
      if (!opts.context?.trim()) {
        contextLine = surfaceContextLine(opts.system, activeSurface);
        ctx.textContent = contextLine;
      }
    }
    bindSurfaceControls();
  };

  const bindSurfaceControls = (): void => {
    sheet.querySelectorAll<HTMLButtonElement>('[data-notes-surface]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.notesSurface;
        if (!isSurface(next) || next === activeSurface) return;
        activeSurface = next;
        if (!doc.autoTags.includes(next)) doc.autoTags.push(next);
        paintSurfaceRow();
      });
    });
  };

  const close = () => {
    persist();
    sheet.classList.remove('is-open');
    window.setTimeout(() => sheet.remove(), 220);
  };

  sheet.querySelectorAll('[data-notes-close]').forEach((el) => {
    el.addEventListener('click', close);
  });
  sheet.querySelector('[data-notes-save]')?.addEventListener('click', () => {
    persist();
    close();
  });
  bindUserTagControls();
  bindSurfaceControls();

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      window.removeEventListener('keydown', onKey);
    }
  };
  window.addEventListener('keydown', onKey);

  (document.querySelector('#app') || document.body).appendChild(sheet);

  const appendReflectLine = (line: string): void => {
    const ta = sheet.querySelector<HTMLTextAreaElement>('#lab-notes-ta');
    if (!ta) return;
    const cur = ta.value.trimEnd();
    const next = cur ? `${cur}\n${line}` : line;
    ta.value = next.slice(0, 4000);
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  };

  sheet.querySelectorAll<HTMLButtonElement>('[data-reflect-i]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.reflectI);
      const line = opts.reflect?.items[i];
      if (line) appendReflectLine(line);
    });
  });

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
