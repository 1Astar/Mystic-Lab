/**
 * 阅读面选区工具条：选中正文后出「复制 / 追问」。
 */

export type MountLabSelectionAskOpts = {
  /** 限定可选区域（通常为当前页） */
  root: HTMLElement;
  onAsk: (selectedText: string) => void;
  minLength?: number;
  maxLength?: number;
};

const CHIP_ATTR = 'data-lab-sel-ask';

function normalizeSelected(raw: string, maxLength: number): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/** 选区文案 → 追问种子句 */
export function formatSelectionAskSeed(text: string): string {
  const t = text.trim();
  if (!t) return '';
  if (t.length <= 12 && !/[。！？；\n]/.test(t)) return t;
  return `这段话说的是什么意思？\n「${t}」`;
}

function selectionInside(root: HTMLElement, range: Range): boolean {
  const common = range.commonAncestorContainer;
  const el = common.nodeType === Node.ELEMENT_NODE
    ? (common as Element)
    : common.parentElement;
  return Boolean(el && root.contains(el));
}

function isEditableTarget(node: Node | null): boolean {
  const el =
    node?.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node?.parentElement;
  if (!el) return false;
  if (el.closest('input, textarea, [contenteditable="true"], [contenteditable=""]')) {
    return true;
  }
  return false;
}

function clearChip(): void {
  document.querySelectorAll(`[${CHIP_ATTR}]`).forEach((el) => el.remove());
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

function placeChip(rect: DOMRect, text: string, onAsk: () => void): void {
  clearChip();
  const bar = document.createElement('div');
  bar.className = 'lab-sel-ask';
  bar.setAttribute(CHIP_ATTR, '1');
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', '选区操作');
  bar.innerHTML = `
    <button type="button" class="lab-sel-ask-btn" data-sel-copy>复制</button>
    <button type="button" class="lab-sel-ask-btn is-accent" data-sel-ask>追问</button>
  `;

  const top = Math.max(8, rect.top - 44);
  let left = rect.left + rect.width / 2;
  bar.style.top = `${top}px`;
  bar.style.left = `${left}px`;

  bar.addEventListener('mousedown', (e) => {
    // 避免点钮时清掉选区导致拿不到文案
    e.preventDefault();
  });

  bar.querySelector('[data-sel-copy]')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const btn = e.currentTarget as HTMLButtonElement;
    void copyText(text).then((ok) => {
      btn.textContent = ok ? '已复制' : '失败';
      window.setTimeout(() => {
        clearChip();
        window.getSelection()?.removeAllRanges();
      }, ok ? 600 : 900);
    });
  });

  bar.querySelector('[data-sel-ask]')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAsk();
    clearChip();
    window.getSelection()?.removeAllRanges();
  });

  document.body.appendChild(bar);
  const w = bar.offsetWidth;
  left = Math.min(window.innerWidth - w - 8, Math.max(8, left - w / 2));
  bar.style.left = `${left}px`;
  if (rect.top < 52) {
    bar.style.top = `${Math.min(window.innerHeight - 44, rect.bottom + 8)}px`;
  }
}

/** 挂选区追问；返回 dispose */
export function mountLabSelectionAsk(opts: MountLabSelectionAskOpts): () => void {
  const minLength = opts.minLength ?? 2;
  const maxLength = opts.maxLength ?? 280;
  let hideTimer = 0;

  const syncFromSelection = (): void => {
    window.clearTimeout(hideTimer);
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount < 1) {
      clearChip();
      return;
    }
    const range = sel.getRangeAt(0);
    if (!selectionInside(opts.root, range) || isEditableTarget(range.commonAncestorContainer)) {
      clearChip();
      return;
    }
    const text = normalizeSelected(sel.toString(), maxLength);
    if (text.length < minLength) {
      clearChip();
      return;
    }
    const rect = range.getBoundingClientRect();
    if (rect.width < 2 && rect.height < 2) {
      clearChip();
      return;
    }
    placeChip(rect, text, () => opts.onAsk(text));
  };

  const onMouseUp = (): void => {
    // 等浏览器落稳选区
    window.setTimeout(syncFromSelection, 0);
  };
  const onTouchEnd = (): void => {
    window.setTimeout(syncFromSelection, 80);
  };
  const onSelectionChange = (): void => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      hideTimer = window.setTimeout(clearChip, 180);
    }
  };
  const onScroll = (): void => {
    clearChip();
  };
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') clearChip();
  };

  opts.root.addEventListener('mouseup', onMouseUp);
  opts.root.addEventListener('touchend', onTouchEnd, { passive: true });
  document.addEventListener('selectionchange', onSelectionChange);
  window.addEventListener('scroll', onScroll, true);
  window.addEventListener('resize', onScroll);
  window.addEventListener('keydown', onKeyDown);

  return () => {
    window.clearTimeout(hideTimer);
    opts.root.removeEventListener('mouseup', onMouseUp);
    opts.root.removeEventListener('touchend', onTouchEnd);
    document.removeEventListener('selectionchange', onSelectionChange);
    window.removeEventListener('scroll', onScroll, true);
    window.removeEventListener('resize', onScroll);
    window.removeEventListener('keydown', onKeyDown);
    clearChip();
  };
}

export function clearLabSelectionAsk(): void {
  clearChip();
}
