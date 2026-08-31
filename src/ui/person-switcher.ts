import { navigate } from '../router.ts';
import {
  getActivePerson,
  listPersons,
  setActivePersonId,
  upsertPerson,
} from '../life/storage.ts';
import {
  PERSON_RELATION_LABELS,
  SELF_PROFILE_ID,
  createEmptyPerson,
  type PersonProfile,
  type PersonRelation,
} from '../life/types.ts';
import { openLabMeDrawer } from './lab-me-drawer.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type PersonSwitcherOptions = {
  /** 切换后回调（刷新当前页文案） */
  onChange?: (person: PersonProfile) => void;
};

type AddableRelation = Exclude<PersonRelation, 'self'>;

const ADDABLE_RELATIONS: AddableRelation[] = [
  'family',
  'partner',
  'friend',
  'client',
  'other',
];

function portalRoot(): HTMLElement {
  return document.querySelector('#app') || document.body;
}

function findDropdown(host: HTMLElement): HTMLElement | null {
  return (
    host.querySelector<HTMLElement>('[data-person-sheet]') ??
    document.querySelector<HTMLElement>('[data-person-sheet][data-person-sheet-portal]')
  );
}

function findWrap(host: HTMLElement): HTMLElement | null {
  return host.querySelector<HTMLElement>('.person-switcher');
}

function clearPortalStyles(drop: HTMLElement): void {
  drop.style.top = '';
  drop.style.left = '';
  drop.style.width = '';
  drop.removeAttribute('data-person-sheet-portal');
}

function positionPortal(drop: HTMLElement, trigger: HTMLElement): void {
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(300, window.innerWidth - 24);
  const centerX = rect.left + rect.width / 2;
  const left = Math.min(
    Math.max(12 + width / 2, centerX),
    window.innerWidth - 12 - width / 2,
  );
  drop.style.top = `${Math.round(rect.bottom + 6)}px`;
  drop.style.left = `${Math.round(left)}px`;
  drop.style.width = `${width}px`;
}

function closeDropdown(host: HTMLElement): void {
  const drop = findDropdown(host);
  const wrap = findWrap(host);
  if (drop) {
    drop.classList.remove('is-open');
    drop.hidden = true;
    clearPortalStyles(drop);
    // 收回顶栏内，避免下次 mount 残留在 #app
    if (wrap && drop.parentElement !== wrap) {
      wrap.appendChild(drop);
    }
  }
  wrap?.classList.remove('is-open');
  host
    .querySelector<HTMLButtonElement>('[data-person-trigger]')
    ?.setAttribute('aria-expanded', 'false');
  document.querySelector('[data-person-drop-backdrop]')?.remove();
}

function relationOptionsHtml(selected: AddableRelation = 'friend'): string {
  return ADDABLE_RELATIONS.map(
    (r) =>
      `<option value="${r}"${r === selected ? ' selected' : ''}>${escapeHtml(PERSON_RELATION_LABELS[r])}</option>`,
  ).join('');
}

function paintListView(
  drop: HTMLElement,
  host: HTMLElement,
  options?: PersonSwitcherOptions,
): void {
  const active = getActivePerson();
  const people = listPersons();

  drop.innerHTML = `
    <div class="person-switch-drop-inner" role="dialog" aria-label="选择这次问谁">
      <header class="person-switch-head">
        <div>
          <p class="person-switch-kicker">这次问谁</p>
          <h3>切换档案</h3>
        </div>
        <button type="button" class="person-switch-add-btn" data-add aria-label="添加他人" title="添加他人">+</button>
      </header>
      <ul class="person-switch-list">
        ${people
          .map((p) => {
            const rel = PERSON_RELATION_LABELS[p.relation];
            const on = p.id === active.id;
            return `
            <li>
              <button type="button" class="person-switch-item${on ? ' is-on' : ''}" data-pick="${escapeHtml(p.id)}">
                <span class="person-switch-avatar">${escapeHtml(p.nickname.slice(0, 1))}</span>
                <span class="person-switch-meta">
                  <strong>${escapeHtml(p.nickname)}</strong>
                  <em>${escapeHtml(rel)}${p.lifeTags.length ? ` · ${p.lifeTags.map((t) => `#${t}`).join(' ')}` : ''}</em>
                </span>
                ${on ? '<span class="person-switch-check">✓</span>' : ''}
              </button>
            </li>`;
          })
          .join('')}
      </ul>
      <div class="person-switch-actions">
        <button type="button" class="person-switch-manage" data-add>+ 添加他人</button>
        <button type="button" class="person-switch-manage is-ghost" data-manage>管理</button>
      </div>
    </div>
  `;

  bindDropdownChrome(drop, host, options);
}

function paintAddView(
  drop: HTMLElement,
  host: HTMLElement,
  options?: PersonSwitcherOptions,
): void {
  drop.innerHTML = `
    <div class="person-switch-drop-inner" role="dialog" aria-label="添加他人">
      <header class="person-switch-head">
        <div>
          <p class="person-switch-kicker">新建档案</p>
          <h3>添加他人</h3>
        </div>
        <button type="button" class="person-switch-x" data-back-list aria-label="返回列表">×</button>
      </header>
      <form class="person-switch-add-form" data-add-form>
        <label class="person-switch-field">
          <span>怎么称呼</span>
          <input name="nickname" type="text" maxlength="8" placeholder="如：豆豆" required autocomplete="nickname" />
        </label>
        <label class="person-switch-field">
          <span>关系</span>
          <select name="relation">${relationOptionsHtml('friend')}</select>
        </label>
        <p class="person-switch-add-hint">出生等信息可稍后在「管理」补全。</p>
        <div class="person-switch-actions">
          <button type="button" class="person-switch-manage" data-back-list>返回</button>
          <button type="submit" class="person-switch-submit">添加并切换</button>
        </div>
      </form>
    </div>
  `;

  drop.querySelectorAll('[data-back-list]').forEach((el) => {
    el.addEventListener('click', () => paintListView(drop, host, options));
  });

  const form = drop.querySelector<HTMLFormElement>('[data-add-form]');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const nickname = String(fd.get('nickname') ?? '').trim().slice(0, 8);
    if (!nickname) return;
    const relationRaw = String(fd.get('relation') ?? 'friend') as AddableRelation;
    const relation: AddableRelation = ADDABLE_RELATIONS.includes(relationRaw)
      ? relationRaw
      : 'friend';
    const person = createEmptyPerson({ nickname, relation });
    upsertPerson(person);
    setActivePersonId(person.id);
    paintTrigger(host);
    options?.onChange?.(person);
    closeDropdown(host);
  });

  requestAnimationFrame(() => {
    form?.querySelector<HTMLInputElement>('input[name="nickname"]')?.focus();
  });
}

function bindDropdownChrome(
  drop: HTMLElement,
  host: HTMLElement,
  options?: PersonSwitcherOptions,
): void {
  drop.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.pick!;
      const store = setActivePersonId(id);
      const person = store.profiles.find((p) => p.id === id)!;
      paintTrigger(host);
      options?.onChange?.(person);
      closeDropdown(host);
    });
  });
  drop.querySelectorAll('[data-add]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      paintAddView(drop, host, options);
    });
  });
  drop.querySelector('[data-manage]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeDropdown(host);
    navigate('/profile');
  });
}

function ensureBackdrop(host: HTMLElement): void {
  document.querySelector('[data-person-drop-backdrop]')?.remove();
  const backdrop = document.createElement('button');
  backdrop.type = 'button';
  backdrop.className = 'person-switch-drop-backdrop';
  backdrop.dataset.personDropBackdrop = '';
  backdrop.setAttribute('aria-label', '关闭档案切换');
  backdrop.addEventListener('click', () => closeDropdown(host));
  portalRoot().appendChild(backdrop);
}

/**
 * 下拉必须挂到 #app（与 backdrop 同层、更高 z-index）。
 * 留在 sticky 顶栏内会被全屏 backdrop 挡住点击。
 */
function portalDropdown(drop: HTMLElement, trigger: HTMLElement): void {
  drop.dataset.personSheetPortal = '';
  positionPortal(drop, trigger);
  portalRoot().appendChild(drop);
}

function openDropdown(host: HTMLElement, options?: PersonSwitcherOptions): void {
  const wrap = findWrap(host);
  const drop = findDropdown(host);
  const trigger = host.querySelector<HTMLButtonElement>('[data-person-trigger]');
  if (!wrap || !drop || !trigger) return;

  if (drop.classList.contains('is-open')) {
    closeDropdown(host);
    return;
  }

  paintListView(drop, host, options);
  drop.hidden = false;
  wrap.classList.add('is-open');
  ensureBackdrop(host);
  portalDropdown(drop, trigger);
  trigger.setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => {
    // 仍在打开态时再播入场；关闭途中勿加回 is-open
    if (!drop.hidden) drop.classList.add('is-open');
  });
}

function paintTrigger(host: HTMLElement): void {
  const person = getActivePerson();
  const btn = host.querySelector<HTMLButtonElement>('[data-person-trigger]');
  if (!btn) return;
  if (btn.classList.contains('lab-avatar-btn')) {
    btn.textContent = person.nickname.slice(0, 1) || '我';
    btn.setAttribute('aria-label', `当前档案：${person.nickname}，点击打开`);
    btn.title = person.nickname;
    return;
  }
  btn.innerHTML = `<span class="person-switch-name">${escapeHtml(person.nickname)}</span><span class="person-switch-caret" aria-hidden="true">▾</span>`;
  btn.setAttribute('aria-label', `当前所问对象：${person.nickname}，点击切换`);
}

function cleanupOrphanSheets(): void {
  document.querySelectorAll('[data-person-sheet-portal]').forEach((el) => el.remove());
  document.querySelector('[data-person-drop-backdrop]')?.remove();
}

/**
 * 顶栏居中：当前人名 ▾ → 下拉切换 / 添加他人
 */
export function mountPersonSwitcher(
  host: HTMLElement,
  options?: PersonSwitcherOptions,
): { refresh: () => void } {
  closeDropdown(host);
  host.querySelector('[data-person-switcher]')?.remove();
  cleanupOrphanSheets();

  const wrap = document.createElement('div');
  wrap.className = 'person-switcher';
  wrap.dataset.personSwitcher = '';
  wrap.innerHTML = `
    <button type="button" class="person-switch-trigger" data-person-trigger aria-haspopup="listbox" aria-expanded="false"></button>
    <div class="person-switch-dropdown" data-person-sheet hidden></div>
  `;
  host.prepend(wrap);
  paintTrigger(host);

  const trigger = wrap.querySelector<HTMLButtonElement>('[data-person-trigger]');
  trigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    openDropdown(host, options);
  });

  return {
    refresh: () => {
      paintTrigger(host);
    },
  };
}

/** 主页顶栏：头像 → 左侧「我」抽屉（角色 · 旅程等） */
export function mountPersonAvatarChrome(
  host: HTMLElement,
  options?: PersonSwitcherOptions,
): { refresh: () => void } {
  host.querySelector('[data-person-switcher]')?.remove();

  const wrap = document.createElement('div');
  wrap.className = 'lab-avatar-chrome';
  wrap.dataset.personSwitcher = '';
  wrap.innerHTML = `
    <button type="button" class="lab-avatar-btn" data-person-trigger></button>
  `;
  host.appendChild(wrap);
  paintTrigger(host);

  wrap.querySelector('[data-person-trigger]')?.addEventListener('click', () => {
    openLabMeDrawer(host, {
      ...options,
      onChange: (person) => {
        paintTrigger(host);
        options?.onChange?.(person);
      },
    });
  });

  return { refresh: () => paintTrigger(host) };
}

/** 确保有自己档案（供测试 / 迁移） */
export function ensureSelfExists(): void {
  const people = listPersons();
  if (!people.some((p) => p.id === SELF_PROFILE_ID)) {
    setActivePersonId(SELF_PROFILE_ID);
  }
}
