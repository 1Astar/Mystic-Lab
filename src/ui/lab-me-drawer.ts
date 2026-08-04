import { navigate } from '../router.ts';
import {
  getActivePerson,
  listPersons,
  setActivePersonId,
} from '../life/storage.ts';
import { PERSON_RELATION_LABELS, type PersonProfile } from '../life/types.ts';
import { parseBirthParts } from '../bazi/parse-birth.ts';
import type { PersonSwitcherOptions } from './person-switcher.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function canCastPerson(p: PersonProfile): boolean {
  return Boolean(parseBirthParts(p.birthYear, p.birthMonth, p.birthDay, p.birthHour));
}

/** 选角色后进八字：可排盘 → 摘要，否则补出生信息（体系入口在 Lab 首页） */
export function resolveBaziPathForPerson(p: PersonProfile): string {
  return canCastPerson(p) ? '/bazi/reading' : '/bazi';
}

function paintHostAvatar(host: HTMLElement, person: PersonProfile): void {
  const trigger = host.querySelector<HTMLButtonElement>('[data-person-trigger]');
  if (!trigger) return;
  trigger.textContent = person.nickname.slice(0, 1) || '我';
  trigger.title = person.nickname;
  trigger.setAttribute('aria-label', `当前档案：${person.nickname}，点击打开`);
}

const GLOBAL_LINKS: { path: string; label: string; soon?: boolean }[] = [
  { path: '/records', label: '我的旅程' },
  { path: '/life', label: '人生宇宙' },
  { path: '/knowledge', label: '知识库', soon: true },
];

function findDrawer(host: HTMLElement): HTMLElement | null {
  const page = host.closest('.page') ?? document.body;
  return (
    page.querySelector<HTMLElement>('[data-lab-me-drawer]') ??
    document.querySelector<HTMLElement>('[data-lab-me-drawer]')
  );
}

function closeDrawer(host: HTMLElement): void {
  const drawer = findDrawer(host);
  if (!drawer) return;
  drawer.classList.remove('is-open');
  window.setTimeout(() => drawer.remove(), 240);
}

function goAddPerson(host: HTMLElement): void {
  closeDrawer(host);
  try {
    sessionStorage.setItem('mystic-lab-profile-open-new', '1');
  } catch {
    /* ignore */
  }
  navigate('/profile');
}

/** Lab：点头像 → 左侧抽屉（角色 + 旅程 / 人生宇宙 / 知识库） */
export function openLabMeDrawer(
  host: HTMLElement,
  options?: PersonSwitcherOptions,
): void {
  findDrawer(host)?.remove();

  const active = getActivePerson();
  const people = listPersons();

  const drawer = document.createElement('div');
  drawer.className = 'lab-me-drawer';
  drawer.dataset.labMeDrawer = '';
  drawer.innerHTML = `
    <div class="lab-me-drawer-backdrop" data-close></div>
    <aside class="lab-me-drawer-panel" role="dialog" aria-label="我">
      <header class="lab-me-drawer-head">
        <div>
          <p class="lab-me-drawer-kicker">MYSTIC LAB</p>
          <h3>我</h3>
        </div>
        <button type="button" class="lab-me-drawer-x" data-close aria-label="关闭">×</button>
      </header>

      <section class="lab-me-section" aria-label="选择角色">
        <div class="lab-me-section-head">
          <h4>选择角色</h4>
          <button type="button" class="lab-me-add" data-add-role aria-label="添加角色">+</button>
        </div>
        <ul class="lab-me-role-list">
          ${people
            .map((p) => {
              const rel = PERSON_RELATION_LABELS[p.relation];
              const on = p.id === active.id;
              return `
              <li>
                <button type="button" class="lab-me-role${on ? ' is-on' : ''}" data-pick="${escapeHtml(p.id)}">
                  <span class="lab-me-role-avatar">${escapeHtml(p.nickname.slice(0, 1))}</span>
                  <span class="lab-me-role-meta">
                    <strong>${escapeHtml(p.nickname)}</strong>
                    <em>${escapeHtml(rel)}</em>
                  </span>
                  ${on ? '<span class="lab-me-role-check" aria-hidden="true">✓</span>' : ''}
                </button>
              </li>`;
            })
            .join('')}
        </ul>
        <button type="button" class="lab-me-manage" data-manage>管理档案</button>
      </section>

      <section class="lab-me-section lab-me-section-global" aria-label="更多">
        <nav class="lab-me-global">
          ${GLOBAL_LINKS.map(
            (l) => `
            <button type="button" class="lab-me-global-link${l.soon ? ' is-soon' : ''}"
              data-path="${escapeHtml(l.path)}" ${l.soon ? 'disabled' : ''}>
              ${escapeHtml(l.label)}
              ${l.soon ? '<em>即将</em>' : ''}
            </button>`,
          ).join('')}
        </nav>
      </section>
    </aside>
  `;

  const finishClose = () => closeDrawer(host);

  drawer.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', finishClose);
  });

  drawer.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.pick!;
      const store = setActivePersonId(id);
      const person = store.profiles.find((p) => p.id === id)!;
      options?.onChange?.(person);
      paintHostAvatar(host, person);
      drawer.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach((b) => {
        const on = b.dataset.pick === id;
        b.classList.toggle('is-on', on);
        const check = b.querySelector('.lab-me-role-check');
        if (on && !check) {
          b.insertAdjacentHTML(
            'beforeend',
            '<span class="lab-me-role-check" aria-hidden="true">✓</span>',
          );
        } else if (!on) check?.remove();
      });
    });
  });

  drawer.querySelector('[data-add-role]')?.addEventListener('click', () => goAddPerson(host));
  drawer.querySelector('[data-manage]')?.addEventListener('click', () => {
    finishClose();
    navigate('/profile');
  });

  drawer.querySelectorAll<HTMLButtonElement>('[data-path]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const path = btn.dataset.path;
      if (!path) return;
      finishClose();
      navigate(path);
    });
  });

  const page = host.closest('.page') ?? document.body;
  page.appendChild(drawer);
  requestAnimationFrame(() => drawer.classList.add('is-open'));
}
