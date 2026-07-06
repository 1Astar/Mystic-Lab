import { detectBrowserEnv, type EnvCapability } from '../core/browser-env.ts';

export function createEnvBanner(env: EnvCapability): HTMLElement | null {
  if (env.warnings.length === 0) return null;

  const banner = document.createElement('div');
  banner.className = 'env-banner';
  banner.setAttribute('role', 'alert');

  const text = document.createElement('div');
  text.textContent = env.warnings.join(' ');

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

  banner.append(text, copyBtn);
  return banner;
}

export function mountEnvBanner(root: HTMLElement): void {
  const env = detectBrowserEnv();
  const banner = createEnvBanner(env);
  if (banner) {
    root.prepend(banner);
  }
}

export async function copyPageLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    return false;
  }
}
