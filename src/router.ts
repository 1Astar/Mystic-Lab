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
  const result = handler(root);
  if (typeof result === 'function') {
    cleanup = result;
  }
}

export function initRouter(): void {
  window.addEventListener('popstate', render);
  render();
}

export function link(path: string): string {
  return path;
}
