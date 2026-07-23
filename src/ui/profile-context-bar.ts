import { navigate } from '../router.ts';
import {
  getLabProfileSnapshot,
  loadUseProfilePref,
  saveUseProfilePref,
} from '../life/profile-context.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type ProfileContextBarHandle = {
  /** 当前是否选用档案 */
  getUseProfile: () => boolean;
  /** 档案原文（可写入背景框） */
  getContextText: () => string;
  ready: boolean;
};

/** 占问页可挂载的「选用档案」条 */
export function renderProfileContextBarHtml(idPrefix = 'lab-profile'): string {
  const snap = getLabProfileSnapshot();
  if (!snap.ready) {
    return `
      <div class="lab-profile-bar is-empty" data-profile-bar>
        <p class="lab-profile-bar-text">还没有可用档案。为「${escapeHtml(snap.displayName)}」补全现状后，解读可带上对方信息。</p>
        <button type="button" class="lab-profile-bar-link" data-go-profile>去完善档案 ›</button>
      </div>`;
  }

  const prefer = loadUseProfilePref(true);
  return `
    <div class="lab-profile-bar" data-profile-bar>
      <label class="lab-profile-bar-check">
        <input type="checkbox" id="${idPrefix}-use" ${prefer ? 'checked' : ''} />
        <span>带上「${escapeHtml(snap.displayName)}」的档案参与解读</span>
      </label>
      <p class="lab-profile-bar-brief">${escapeHtml(snap.brief)}${
        snap.portrait?.stageTitle
          ? ` · ${escapeHtml(snap.portrait.stageTitle)}`
          : ''
      }</p>
      <button type="button" class="lab-profile-bar-link" data-go-profile>编辑档案 ›</button>
    </div>`;
}

export function bindProfileContextBar(
  root: HTMLElement,
  options?: {
    idPrefix?: string;
    onChange?: (use: boolean) => void;
  },
): ProfileContextBarHandle {
  const idPrefix = options?.idPrefix ?? 'lab-profile';
  const snap = getLabProfileSnapshot();
  const box = root.querySelector<HTMLInputElement>(`#${idPrefix}-use`);

  root.querySelectorAll('[data-go-profile]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('/profile');
    });
  });

  box?.addEventListener('change', () => {
    const on = Boolean(box.checked);
    saveUseProfilePref(on);
    options?.onChange?.(on);
  });

  return {
    ready: snap.ready,
    getUseProfile: () => (snap.ready ? Boolean(box?.checked) : false),
    getContextText: () => snap.readingContext,
  };
}
