/** 长页一键回顶：滚过阈值后显示 */

const THRESHOLD_PX = 420;

export type ScrollTopFabOpts = {
  /** 滚动容器，默认 window */
  scroller?: HTMLElement | Window;
  threshold?: number;
};

export function clearScrollTopFab(): void {
  document.querySelectorAll('[data-lab-scroll-top]').forEach((el) => el.remove());
}

export function mountScrollTopFab(opts: ScrollTopFabOpts = {}): () => void {
  clearScrollTopFab();

  const scroller = opts.scroller ?? window;
  const threshold = opts.threshold ?? THRESHOLD_PX;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'lab-scroll-top';
  btn.dataset.labScrollTop = '1';
  btn.title = '回到顶部';
  btn.setAttribute('aria-label', '回到顶部');
  btn.hidden = true;
  btn.innerHTML = `
    <svg class="lab-ico" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 19V6"/>
      <path d="m6 11 6-6 6 6"/>
    </svg>
  `;

  const getY = () => {
    if (scroller === window) return window.scrollY || document.documentElement.scrollTop;
    return (scroller as HTMLElement).scrollTop;
  };

  const sync = () => {
    btn.hidden = getY() < threshold;
  };

  btn.addEventListener('click', () => {
    if (scroller === window) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      (scroller as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  const target: HTMLElement | Window = scroller;
  target.addEventListener('scroll', sync, { passive: true });
  sync();

  const app = document.querySelector('#app') || document.body;
  app.appendChild(btn);

  return () => {
    target.removeEventListener('scroll', sync);
    btn.remove();
  };
}
