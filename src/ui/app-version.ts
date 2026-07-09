import { APP_NAME, APP_VERSION } from '../core/version.ts';

export function mountAppVersion(): void {
  if (document.querySelector('.app-version')) return;

  const footer = document.createElement('footer');
  footer.className = 'app-version';
  footer.setAttribute('aria-label', '应用版本');
  footer.innerHTML = `
    <span class="app-version-copy">© 刘星雨 Starry Product Lab</span>
    <span class="app-version-sep">·</span>
    <span>${APP_NAME}</span>
    <span class="app-version-num">v${APP_VERSION}</span>`;
  document.body.appendChild(footer);
}
