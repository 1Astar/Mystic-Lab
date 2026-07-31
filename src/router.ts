export type RouteHandler = (
  root: HTMLElement,
) => void | (() => void) | Promise<void | (() => void)>;

const routes = new Map<string, RouteHandler>();

export function registerRoute(path: string, handler: RouteHandler): void {
  routes.set(path, handler);
}

export function navigate(path: string): void {
  if (path !== location.pathname) {
    history.pushState({}, '', path);
  }
  void render();
}

let cleanup: (() => void) | null = null;
let renderSeq = 0;

/** 懒加载期间的占位；真正渲染前必须清掉（许多页面用 appendChild） */
export function paintRouteLoading(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page route-loading" style="padding:48px 24px;color:#e8e2d5;background:#08090d;min-height:40vh;display:grid;place-items:center;opacity:0.72;font-family:system-ui,sans-serif">
      <p style="margin:0;font-size:0.9rem;letter-spacing:0.08em">载入中…</p>
    </div>
  `;
}

export async function render(): Promise<void> {
  const root = document.querySelector<HTMLElement>('#app');
  if (!root) return;

  const seq = ++renderSeq;

  if (cleanup) {
    cleanup();
    cleanup = null;
  }

  // 与历史行为一致：先清空。同步页（如首页）直接 append；勿先画全屏「载入中」
  root.innerHTML = '';
  const path = location.pathname.replace(/\/$/, '') || '/';

  // 分享深页 /s/:id
  if (path.startsWith('/s/')) {
    const id = decodeURIComponent(path.slice(3));
    const { renderShareView } = await import('./pages/share-view.ts');
    try {
      const result = await renderShareView(root, id);
      if (seq !== renderSeq) return;
      if (typeof result === 'function') cleanup = result;
    } catch (err) {
      if (seq !== renderSeq) return;
      const msg = err instanceof Error ? err.message : String(err);
      root.innerHTML = `<div class="page" style="padding:24px;color:#e8e2d5"><h1>分享页加载失败</h1><p>${msg}</p></div>`;
    }
    return;
  }

  const handler = routes.get(path) ?? routes.get('/')!;

  try {
    const result = await handler(root);
    if (seq !== renderSeq) return;
    if (typeof result === 'function') {
      cleanup = result;
    }
  } catch (err) {
    if (seq !== renderSeq) return;
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
  window.addEventListener('popstate', () => {
    void render();
  });
  void render();
}

export function link(path: string): string {
  return path;
}
