import { navigate } from '../router.ts';
import {
  getActivePerson,
  listPersons,
  setActivePersonId,
} from '../life/storage.ts';
import { PERSON_RELATION_LABELS, type PersonProfile } from '../life/types.ts';
import { parseBirthParts } from '../bazi/parse-birth.ts';
import { getTheme, setTheme, type LabTheme } from '../theme/theme.ts';
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

type MeLink = {
  path: string;
  label: string;
  desc: string;
  soon?: boolean;
};

/** 新玩法（主分类，抽屉内直接展示） */
const PLAY_LINKS: MeLink[] = [
  { path: '/life', label: '人生宇宙', desc: '平行 · 选择 · 预测' },
  { path: '/wardrobe', label: '八字衣橱', desc: '幸运色、个人风格、每日穿搭' },
  { path: '/mirror', label: '双盘映照', desc: '八字 × 紫微对比' },
  { path: '/bazi/reading', label: '八字画像', desc: '日主白话速读 · 认识自己' },
];

/** 旅程区 */
const JOURNEY_LINKS: MeLink[] = [
  { path: '/records', label: '我的旅程', desc: '各体系占问记录、收藏与回顾' },
  { path: '/knowledge', label: '知识库', desc: '术语与图鉴合集', soon: true },
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

function linkButtons(links: MeLink[]): string {
  return links
    .map(
      (l) => `
      <button type="button" class="lab-me-global-link${l.soon ? ' is-soon' : ''}"
        data-path="${escapeHtml(l.path)}" ${l.soon ? 'disabled' : ''}>
        <span class="lab-me-global-copy">
          <strong>${escapeHtml(l.label)}</strong>
          <span class="lab-me-global-desc">${escapeHtml(l.desc)}</span>
        </span>
        ${l.soon ? '<em>即将</em>' : ''}
      </button>`,
    )
    .join('');
}

/** Lab：点头像 → 左侧抽屉（角色 + 我的命理 / 新玩法 / 旅程） */
export function openLabMeDrawer(
  host: HTMLElement,
  options?: PersonSwitcherOptions,
): void {
  findDrawer(host)?.remove();

  const active = getActivePerson();
  const people = listPersons();
  const theme = getTheme();

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
        <div class="lab-me-drawer-actions">
          <div class="lab-theme-switch" role="group" aria-label="主题">
            <button type="button" class="lab-theme-chip${theme === 'star' ? ' is-on' : ''}" data-theme-pick="star">星夜</button>
            <button type="button" class="lab-theme-chip${theme === 'moon' ? ' is-on' : ''}" data-theme-pick="moon">月白</button>
          </div>
          <button type="button" class="lab-me-drawer-x" data-close aria-label="关闭">×</button>
        </div>
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
        <div class="lab-me-archive-block">
          <button type="button" class="lab-me-manage" data-manage>管理档案</button>
          <button type="button" class="lab-me-rectify" data-rectify>
            <span class="lab-me-global-copy">
              <strong>生时校准</strong>
              <span class="lab-me-global-desc">时辰不确定时，用大事件反推</span>
            </span>
          </button>
        </div>
      </section>

      <section class="lab-me-section lab-me-section-global" aria-label="新玩法">
        <div class="lab-me-section-head">
          <h4>新玩法</h4>
        </div>
        <nav class="lab-me-global">
          ${linkButtons(PLAY_LINKS)}
        </nav>
      </section>

      <hr class="lab-me-divider" />

      <section class="lab-me-section lab-me-section-global" aria-label="旅程">
        <nav class="lab-me-global">
          ${linkButtons(JOURNEY_LINKS)}
        </nav>
      </section>
    </aside>
  `;

  const finishClose = () => closeDrawer(host);

  drawer.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', finishClose);
  });

  drawer.querySelectorAll<HTMLButtonElement>('[data-theme-pick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pick = btn.dataset.themePick as LabTheme | undefined;
      if (pick !== 'star' && pick !== 'moon') return;
      setTheme(pick);
      drawer.querySelectorAll<HTMLButtonElement>('[data-theme-pick]').forEach((b) => {
        b.classList.toggle('is-on', b.dataset.themePick === pick);
      });
    });
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
  drawer.querySelector('[data-rectify]')?.addEventListener('click', () => {
    finishClose();
    navigate('/bazi/rectify');
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
