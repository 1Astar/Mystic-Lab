import { prefersReducedMotion } from '../../tarot/animations.ts';
import { getLiurenPoint } from '../../xiaoliuren/liuren-points.ts';

/** 页面分步入场：背景 → 主视觉 → 标题 → 辅助信息 */
export function mountStaggerEntrance(root: HTMLElement): void {
  const staggerRoot = root.querySelector<HTMLElement>('.xlr-stagger-root') ?? root;

  if (prefersReducedMotion()) {
    staggerRoot.querySelectorAll('.xlr-stagger-item').forEach((el) => {
      (el as HTMLElement).style.opacity = '1';
      (el as HTMLElement).style.transform = 'none';
    });
    staggerRoot.classList.add('xlr-stagger-live');
    return;
  }

  requestAnimationFrame(() => {
    staggerRoot.classList.add('xlr-stagger-live');
  });
}

/** 掌盘：六点依次浮现 */
export function mountPalmPlateMotion(container: HTMLElement): void {
  const plate = container.querySelector('.xlr-palm-plate');
  if (!plate) return;

  plate.classList.add('xlr-palm-live');
  plate.querySelectorAll('.xlr-palm-point-html').forEach((el) => {
    el.classList.add('is-visible');
  });
}

/** 黄历小卡：轻量浮现 */
export function mountHuangliMiniMotion(container: HTMLElement): void {
  const mini = container.querySelector('.xlr-huangli-mini');
  if (!mini) return;
  mini.classList.add('is-visible');
}

/** 黄历纸页：轻量入场 */
export function mountLunarScrollMotion(container: HTMLElement): void {
  const calendar = container.querySelector('.xlr-lunar-calendar');
  if (!calendar) return;

  if (prefersReducedMotion()) {
    calendar.classList.add('is-entered');
    return;
  }

  requestAnimationFrame(() => {
    calendar.classList.add('is-entering');
    window.setTimeout(() => calendar.classList.add('is-entered'), 480);
  });
}

/** 掌盘光点：沿路径 ease-out 移动到下一格 */
export function mountPalmHopMotion(
  container: HTMLElement,
  fromIndex: number,
  toIndex: number,
  durationMs = 780,
): void {
  if (fromIndex === toIndex) return;

  const g = container.querySelector('.xlr-palm-highlight');
  if (!g) return;

  const from = getLiurenPoint(fromIndex);
  const to = getLiurenPoint(toIndex);
  const el = g as SVGGraphicsElement;

  if (prefersReducedMotion()) {
    el.setAttribute('transform', `translate(${to.x}, ${to.y})`);
    return;
  }

  el.setAttribute('transform', `translate(${from.x}, ${from.y})`);
  const start = performance.now();

  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / durationMs);
    const eased = 1 - (1 - t) ** 3;
    const x = from.x + (to.x - from.x) * eased;
    const y = from.y + (to.y - from.y) * eased;
    el.setAttribute('transform', `translate(${x}, ${y})`);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
