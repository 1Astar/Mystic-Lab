/**
 * 自创主线人物：粗填念头 / 细填生辰
 */
import {
  generateCharacterFromDraft,
  type CustomCharacterDraft,
} from './generate.ts';
import type { MatchmakerCharacter } from './characters.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type OpenCreateCharacterOpts = {
  usedNames?: Set<string>;
  onCreated: (ch: MatchmakerCharacter) => void;
  onClose?: () => void;
};

let active: HTMLDialogElement | null = null;

function readDraft(form: HTMLFormElement): CustomCharacterDraft {
  const fd = new FormData(form);
  const ageRaw = String(fd.get('age') ?? '').trim();
  const yearRaw = String(fd.get('birthYear') ?? '').trim();
  const genderRaw = String(fd.get('gender') ?? '').trim();
  return {
    nickname: String(fd.get('nickname') ?? '').trim() || undefined,
    gender:
      genderRaw === 'female' || genderRaw === 'male' ? genderRaw : undefined,
    age: ageRaw ? Number(ageRaw) : undefined,
    birthYear: yearRaw || undefined,
    birthMonth: String(fd.get('birthMonth') ?? '').trim() || undefined,
    birthDay: String(fd.get('birthDay') ?? '').trim() || undefined,
    birthHour: String(fd.get('birthHour') ?? '').trim() || undefined,
    birthPlace: String(fd.get('birthPlace') ?? '').trim() || undefined,
  };
}

export function openCreateCharacterDialog(opts: OpenCreateCharacterOpts): void {
  document.querySelector('.mm-create-dialog')?.remove();
  const dialog = document.createElement('dialog');
  dialog.className = 'mm-person-dialog mm-create-dialog';
  dialog.setAttribute('aria-labelledby', 'mm-create-dialog-title');
  document.body.appendChild(dialog);
  active = dialog;

  dialog.innerHTML = `
    <div class="mm-dialog-inner">
      <header class="mm-dialog-head">
        <div>
          <h2 class="mm-dialog-title" id="mm-create-dialog-title">自创一位</h2>
          <p class="mm-dialog-meta">带着念头来玩：先填年龄或出生年，其余可补齐；想细抠再展开生辰。</p>
        </div>
        <button type="button" class="life-btn-ghost" data-mm-create-close aria-label="关闭">关闭</button>
      </header>
      <form class="mm-create-form" data-mm-create-form>
        <label class="mm-create-field">
          <span>开局大约几岁</span>
          <input name="age" type="number" min="16" max="80" inputmode="numeric" placeholder="例如 25" />
        </label>
        <label class="mm-create-field">
          <span>或出生年</span>
          <input name="birthYear" type="number" min="1940" max="2010" inputmode="numeric" placeholder="例如 2001" />
        </label>
        <label class="mm-create-field">
          <span>出生地</span>
          <input name="birthPlace" type="text" maxlength="12" placeholder="例如 厦门（可空）" />
        </label>
        <label class="mm-create-field">
          <span>性别</span>
          <select name="gender">
            <option value="">系统随机</option>
            <option value="female">女</option>
            <option value="male">男</option>
          </select>
        </label>
        <label class="mm-create-field">
          <span>昵称</span>
          <input name="nickname" type="text" maxlength="8" placeholder="可空，系统起名" />
        </label>
        <details class="mm-create-details">
          <summary>细填生辰（月日时）</summary>
          <div class="mm-create-fine">
            <label class="mm-create-field">
              <span>月</span>
              <input name="birthMonth" type="number" min="1" max="12" inputmode="numeric" placeholder="可空" />
            </label>
            <label class="mm-create-field">
              <span>日</span>
              <input name="birthDay" type="number" min="1" max="28" inputmode="numeric" placeholder="可空" />
            </label>
            <label class="mm-create-field">
              <span>时分</span>
              <input name="birthHour" type="text" placeholder="如 10:00" />
            </label>
          </div>
        </details>
        <p class="mm-create-err" data-mm-create-err hidden></p>
        <div class="mm-dialog-footer">
          <button type="submit" class="life-btn-primary">养起来 · 定为主线</button>
          <button type="button" class="life-btn-ghost" data-mm-create-close>取消</button>
        </div>
      </form>
    </div>`;

  const form = dialog.querySelector<HTMLFormElement>('[data-mm-create-form]')!;
  const errEl = dialog.querySelector<HTMLElement>('[data-mm-create-err]')!;

  const close = (): void => dialog.close();

  dialog.querySelectorAll<HTMLElement>('[data-mm-create-close]').forEach((btn) => {
    btn.addEventListener('click', close);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errEl.hidden = true;
    errEl.textContent = '';
    const draft = readDraft(form);
    const result = generateCharacterFromDraft(
      draft,
      Math.random,
      opts.usedNames ?? new Set(),
    );
    if ('error' in result) {
      errEl.hidden = false;
      errEl.textContent = result.error;
      return;
    }
    opts.onCreated(result);
    dialog.close();
  });

  dialog.addEventListener('close', () => {
    dialog.remove();
    if (active === dialog) active = null;
    opts.onClose?.();
  });

  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

export function closeCreateCharacterDialog(): void {
  active?.close();
}
