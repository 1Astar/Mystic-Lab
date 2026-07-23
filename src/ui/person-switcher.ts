import { navigate } from '../router.ts';
import {
  getActivePerson,
  listPersons,
  setActivePersonId,
} from '../life/storage.ts';
import {
  PERSON_RELATION_LABELS,
  SELF_PROFILE_ID,
  type PersonProfile,
} from '../life/types.ts';

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

function findPersonSheet(host: HTMLElement): HTMLElement | null {
  const page = host.closest('.page') ?? document.body;
  return (
    page.querySelector<HTMLElement>('[data-person-sheet]') ??
    document.querySelector<HTMLElement>('[data-person-sheet]')
  );
}

function closeSheet(host: HTMLElement): void {
  const sheet = findPersonSheet(host);
  if (!sheet) return;
  sheet.classList.remove('is-open');
  window.setTimeout(() => sheet.remove(), 220);
}

function openSheet(host: HTMLElement, options?: PersonSwitcherOptions): void {
  findPersonSheet(host)?.remove();
  const active = getActivePerson();
  const people = listPersons();

  const sheet = document.createElement('div');
  sheet.className = 'person-switch-sheet';
  sheet.dataset.personSheet = '';
  sheet.innerHTML = `
    <div class="person-switch-backdrop" data-close></div>
    <div class="person-switch-panel" role="dialog" aria-label="选择这次问谁">
      <header class="person-switch-head">
        <div>
          <p class="person-switch-kicker">这次问谁</p>
          <h3>档案</h3>
        </div>
        <button type="button" class="person-switch-x" data-close aria-label="关闭">×</button>
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
        <button type="button" class="btn btn-ghost btn-sm" data-manage>管理档案</button>
        <button type="button" class="btn btn-sm" data-add>添加他人</button>
      </div>
    </div>
  `;

  const finishClose = () => closeSheet(host);
  sheet.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', finishClose);
  });
  sheet.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.pick!;
      const store = setActivePersonId(id);
      const person = store.profiles.find((p) => p.id === id)!;
      paintTrigger(host);
      options?.onChange?.(person);
      finishClose();
    });
  });
  sheet.querySelector('[data-manage]')?.addEventListener('click', () => {
    finishClose();
    navigate('/profile');
  });
  sheet.querySelector('[data-add]')?.addEventListener('click', () => {
    finishClose();
    try {
      sessionStorage.setItem('mystic-lab-profile-open-new', '1');
    } catch {
      /* ignore */
    }
    navigate('/profile');
  });

  // 挂到最近的 page，避免被 overflow 裁切
  const page = host.closest('.page') ?? document.body;
  page.appendChild(sheet);
  requestAnimationFrame(() => sheet.classList.add('is-open'));
}

function paintTrigger(host: HTMLElement): void {
  const person = getActivePerson();
  const btn = host.querySelector<HTMLButtonElement>('[data-person-trigger]');
  if (!btn) return;
  if (btn.classList.contains('lab-avatar-btn')) {
    btn.textContent = person.nickname.slice(0, 1) || '我';
    btn.setAttribute('aria-label', `当前档案：${person.nickname}，点击切换`);
    btn.title = person.nickname;
    return;
  }
  btn.textContent = `${person.nickname} ▾`;
  btn.setAttribute('aria-label', `当前所问对象：${person.nickname}，点击切换`);
}

/**
 * 各板块右上角：当前人名 ▾ → 选这次问谁
 * host 建议为已有 topbar-actions 容器
 */
export function mountPersonSwitcher(
  host: HTMLElement,
  options?: PersonSwitcherOptions,
): { refresh: () => void } {
  host.querySelector('[data-person-switcher]')?.remove();

  const wrap = document.createElement('div');
  wrap.className = 'person-switcher';
  wrap.dataset.personSwitcher = '';
  wrap.innerHTML = `
    <button type="button" class="person-switch-trigger" data-person-trigger></button>
  `;
  host.prepend(wrap);
  paintTrigger(host);

  wrap.querySelector('[data-person-trigger]')?.addEventListener('click', () => {
    openSheet(host, options);
  });

  return { refresh: () => paintTrigger(host) };
}

/** 主页顶栏：头像切换档案 +「+」添加 */
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
    <button type="button" class="lab-avatar-add" data-person-add aria-label="添加档案">+</button>
  `;
  host.appendChild(wrap);
  paintTrigger(host);

  wrap.querySelector('[data-person-trigger]')?.addEventListener('click', () => {
    openSheet(host, options);
  });
  wrap.querySelector('[data-person-add]')?.addEventListener('click', () => {
    try {
      sessionStorage.setItem('mystic-lab-profile-open-new', '1');
    } catch {
      /* ignore */
    }
    navigate('/profile');
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
