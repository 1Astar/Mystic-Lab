import { detectBrowserEnv, type EnvCapability } from '../core/browser-env.ts';

const DISMISS_KEY = 'mystic.envBanner.dismissed';

function warningsFingerprint(warnings: string[]): string {
  return warnings.join('\n');
}

function isEnvBannerDismissed(fingerprint: string): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === fingerprint;
  } catch {
    return false;
  }
}

function dismissEnvBanner(fingerprint: string): void {
  try {
    localStorage.setItem(DISMISS_KEY, fingerprint);
  } catch {
    /* ignore quota / private mode */
  }
}

export function createEnvBanner(env: EnvCapability): HTMLElement | null {
  if (env.warnings.length === 0) return null;

  const fingerprint = warningsFingerprint(env.warnings);
  if (isEnvBannerDismissed(fingerprint)) return null;

  const banner = document.createElement('div');
  banner.className = 'env-banner';
  banner.setAttribute('role', 'alert');

  const text = document.createElement('div');
  text.className = 'env-banner-text';
  text.textContent = env.warnings.join(' ');

  const actions = document.createElement('div');
  actions.className = 'env-banner-actions';

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.textContent = '复制链接';
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copyBtn.textContent = '已复制';
      setTimeout(() => {
        copyBtn.textContent = '复制链接';
      }, 2000);
    } catch {
      copyBtn.textContent = '复制失败';
    }
  });

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'env-banner-close';
  closeBtn.setAttribute('aria-label', '关闭提示');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => {
    dismissEnvBanner(fingerprint);
    banner.remove();
  });

  actions.append(copyBtn, closeBtn);
  banner.append(text, actions);
  return banner;
}

export function mountEnvBanner(
  root: HTMLElement,
  opts?: { forCameraGesture?: boolean },
): void {
  // 默认不挂环境横幅；摄像头提示请用 syncCameraGestureBanner
  if (!opts?.forCameraGesture) return;
  syncCameraGestureBanner(root, true);
}

/** 仅在塔罗「手势抽卡」模式下展示去浏览器提示；切走即移除 */
export function syncCameraGestureBanner(root: HTMLElement, enabled: boolean): void {
  root.querySelectorAll('.env-banner[data-camera-gesture]').forEach((el) => el.remove());
  if (!enabled) return;
  const env = detectBrowserEnv();
  const banner = createEnvBanner(env);
  if (!banner) return;
  banner.dataset.cameraGesture = '1';
  root.prepend(banner);
}

export async function copyPageLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    return false;
  }
}
