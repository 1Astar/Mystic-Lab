export type LabTheme = 'star' | 'moon';

export const LAB_THEME_STORAGE_KEY = 'mystic-lab-theme';

const THEMES: LabTheme[] = ['star', 'moon'];

export function isLabTheme(value: unknown): value is LabTheme {
  return value === 'star' || value === 'moon';
}

export function getTheme(): LabTheme {
  try {
    const raw = localStorage.getItem(LAB_THEME_STORAGE_KEY);
    if (isLabTheme(raw)) return raw;
  } catch {
    /* ignore */
  }
  return 'star';
}

export function applyTheme(theme: LabTheme): void {
  const next = THEMES.includes(theme) ? theme : 'star';
  document.documentElement.dataset.theme = next;
  document.documentElement.style.colorScheme = next === 'moon' ? 'light' : 'dark';
}

export function setTheme(theme: LabTheme): LabTheme {
  const next = THEMES.includes(theme) ? theme : 'star';
  try {
    localStorage.setItem(LAB_THEME_STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  applyTheme(next);
  return next;
}

/** 启动时调用：读本地偏好并落到 html[data-theme]，避免首屏闪色 */
export function initTheme(): LabTheme {
  const theme = getTheme();
  applyTheme(theme);
  return theme;
}
