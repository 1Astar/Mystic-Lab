/** 深度解读 / 追问：一卡四段 · 灰字提示不用手删 · 点标签跳到对应段 */

export type PersonalContext = {
  experience: string;
  goal: string;
  events: string;
  worry: string;
};

export const EMPTY_PERSONAL_CONTEXT: PersonalContext = {
  experience: '',
  goal: '',
  events: '',
  worry: '',
};

export const PERSONAL_CONTEXT_HINTS = {
  experience: '比如：在这家公司待了多久、做过什么…',
  goal: '你最想达成的结果是什么？',
  events: '最近已经发生、影响判断的事…',
  worry: '你最怕什么、最卡住的是什么？',
} as const;

const FIELD_META = [
  { key: 'experience' as const, label: '经历', hint: PERSONAL_CONTEXT_HINTS.experience },
  { key: 'goal' as const, label: '目标', hint: PERSONAL_CONTEXT_HINTS.goal },
  { key: 'events' as const, label: '已发生', hint: PERSONAL_CONTEXT_HINTS.events },
  { key: 'worry' as const, label: '顾虑', hint: PERSONAL_CONTEXT_HINTS.worry },
];

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** 一卡：可点标签 + 四段可写区（placeholder 灰字，写入即消） */
export function personalContextFieldsHtml(prefix = 'p'): string {
  const tags = FIELD_META.map(
    (f) =>
      `<button type="button" class="ly-personalize-soft-tag is-tap" data-ctx-jump="${f.key}" title="${escapeAttr(f.hint)}">${f.label}</button>`,
  ).join('');

  const blocks = FIELD_META.map(
    (f) => `
      <div class="ly-ctx-block" data-ctx-block="${f.key}">
        <p class="ly-ctx-label">【${f.label}】</p>
        <div
          class="ly-ctx-edit is-empty"
          contenteditable="true"
          role="textbox"
          data-ctx-key="${f.key}"
          data-placeholder="${escapeAttr(f.hint)}"
          aria-label="${f.label}"
        ></div>
      </div>`,
  ).join('');

  return `
    <div class="ly-personalize-context-card" data-personal-context data-ctx-prefix="${prefix}">
      <p class="ly-personalize-soft-line">
        <span class="ly-personalize-soft-lead">点一下跳到对应段 · 灰字不用手删</span>
        ${tags}
      </p>
      <div class="ly-ctx-blocks">${blocks}</div>
    </div>`;
}

function editText(el: HTMLElement): string {
  return (el.innerText || '').replace(/\u200b/g, '').trim();
}

function syncEmptyClass(el: HTMLElement): void {
  el.classList.toggle('is-empty', !editText(el));
}

/** 绑定灰字占位同步 + 点标签聚焦 */
export function bindPersonalContextCard(root: ParentNode): void {
  const card = root.querySelector<HTMLElement>('[data-personal-context]');
  if (!card || card.dataset.ctxBound === '1') return;
  card.dataset.ctxBound = '1';

  card.querySelectorAll<HTMLElement>('.ly-ctx-edit').forEach((el) => {
    const sync = () => syncEmptyClass(el);
    el.addEventListener('input', sync);
    el.addEventListener('blur', sync);
    el.addEventListener('focus', () => {
      card.querySelectorAll('.ly-ctx-block').forEach((b) => b.classList.remove('is-focus'));
      el.closest('.ly-ctx-block')?.classList.add('is-focus');
    });
    sync();
  });

  card.querySelectorAll<HTMLButtonElement>('[data-ctx-jump]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.ctxJump;
      const edit = card.querySelector<HTMLElement>(`.ly-ctx-edit[data-ctx-key="${key}"]`);
      if (!edit) return;
      card.querySelectorAll('.ly-ctx-block').forEach((b) => b.classList.remove('is-focus'));
      edit.closest('.ly-ctx-block')?.classList.add('is-focus');
      edit.focus();
      /** 光标移到末尾，方便直接写 */
      const range = document.createRange();
      range.selectNodeContents(edit);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
  });
}

export function readPersonalContextFrom(
  root: ParentNode,
  _prefix = 'p',
): PersonalContext {
  const card =
    root.querySelector<HTMLElement>('[data-personal-context]') ??
    (root as HTMLElement);
  const read = (key: keyof PersonalContext) => {
    const el = card.querySelector<HTMLElement>(`.ly-ctx-edit[data-ctx-key="${key}"]`);
    return el ? editText(el) : '';
  };
  return {
    experience: read('experience'),
    goal: read('goal'),
    events: read('events'),
    worry: read('worry'),
  };
}

export function hasPersonalContext(ctx: PersonalContext): boolean {
  return Boolean(
    ctx.experience.trim() ||
      ctx.goal.trim() ||
      ctx.events.trim() ||
      ctx.worry.trim(),
  );
}

export function formatPersonalContextLines(ctx: PersonalContext): string[] {
  if (!hasPersonalContext(ctx)) return [];
  return [
    `我的经历：${ctx.experience.trim() || '（未写）'}`,
    `当前目标：${ctx.goal.trim() || '（未写）'}`,
    `已发生事件：${ctx.events.trim() || '（未写）'}`,
    `我的真实顾虑：${ctx.worry.trim() || '（未写）'}`,
  ];
}
