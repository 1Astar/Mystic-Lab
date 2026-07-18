export type RouteHandler = (root: HTMLElement) => void | Promise<void> | (() => void);

const routes = new Map<string, RouteHandler>();

export function registerRoute(path: string, handler: RouteHandler): void {
  routes.set(path, handler);
}

export function navigate(path: string): void {
  if (path !== location.pathname) {
    history.pushState({}, '', path);
  }
  render();
}

let cleanup: (() => void) | null = null;

export function render(): void {
  const root = document.querySelector<HTMLElement>('#app');
  if (!root) return;

  if (cleanup) {
    cleanup();
    cleanup = null;
  }

  root.innerHTML = '';
  const path = location.pathname.replace(/\/$/, '') || '/';
  const handler = routes.get(path) ?? routes.get('/')!;
  try {
    const result = handler(root);
    if (typeof result === 'function') {
      cleanup = result;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[router]', path, err);
    root.innerHTML = `
      <div class="page" style="padding:24px;color:#e8e2d5;background:#08090d;min-height:100vh">
        <h1 style="font-size:1.1rem;margin-bottom:12px">页面加载失败</h1>
        <p style="opacity:0.75;font-size:0.9rem;word-break:break-word">${msg}</p>
        <p style="margin-top:16px;opacity:0.55;font-size:0.8rem">路径：${path}</p>
        <button type="button" class="btn" style="margin-top:20px" id="router-reload">刷新重试</button>
      </div>
    `;
    root.querySelector('#router-reload')?.addEventListener('click', () => location.reload());
  }
}

export function initRouter(): void {
  window.addEventListener('popstate', render);
  render();
}

export function link(path: string): string {
  return path;
}
