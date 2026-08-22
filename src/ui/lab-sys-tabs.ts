/** 体系内顶栏：仅解读 / 盘面（探索改右上入口，不做第三 Tab） */

import { navigate } from '../router.ts';

export type LabSysTab = {
  path: string;
  label: string;
  active?: boolean;
};

export function labSysTabsHtml(tabs: LabSysTab[], ariaLabel: string): string {
  return `
    <nav class="lab-sys-tabs" role="navigation" aria-label="${ariaLabel}">
      ${tabs
        .map(
          (t) => `
        <button type="button" class="lab-sys-tab${t.active ? ' is-on' : ''}" data-path="${t.path}">
          ${t.label}
        </button>`,
        )
        .join('')}
    </nav>`;
}

export function bindLabSysTabs(scope: ParentNode): void {
  scope.querySelectorAll<HTMLElement>('.lab-sys-tabs [data-path]').forEach((el) => {
    el.addEventListener('click', () => {
      const path = el.dataset.path;
      if (path) navigate(path);
    });
  });
}

export const BAZI_SYS_TABS = {
  reading: { path: '/bazi/reading', label: '人生地图' },
  chart: { path: '/bazi/reading?mode=chart', label: '完整命盘' },
} as const;

/** 紫微同款：人生地图 | 完整命盘（同页模式切换） */
export function baziViewModeTabsHtml(active: 'theater' | 'chart'): string {
  return `
    <div class="bazi-view-tabs lab-sys-tabs" role="tablist" aria-label="八字导航">
      <button type="button" class="bazi-view-tab lab-sys-tab ${active === 'theater' ? 'is-on' : ''}" data-bazi-view="theater">人生地图</button>
      <button type="button" class="bazi-view-tab lab-sys-tab ${active === 'chart' ? 'is-on' : ''}" data-bazi-view="chart">完整命盘</button>
    </div>`;
}

export const ZIWEI_SYS_TABS = {
  reading: { path: '/ziwei/reading', label: '命盘解读' },
  chart: { path: '/ziwei/chart', label: '完整命盘' },
} as const;

export function baziSysTabsHtml(active: keyof typeof BAZI_SYS_TABS | null): string {
  return labSysTabsHtml(
    (Object.keys(BAZI_SYS_TABS) as (keyof typeof BAZI_SYS_TABS)[]).map((k) => ({
      ...BAZI_SYS_TABS[k],
      active: active !== null && k === active,
    })),
    '八字导航',
  );
}

export function ziweiSysTabsHtml(active: keyof typeof ZIWEI_SYS_TABS | null): string {
  return labSysTabsHtml(
    (Object.keys(ZIWEI_SYS_TABS) as (keyof typeof ZIWEI_SYS_TABS)[]).map((k) => ({
      ...ZIWEI_SYS_TABS[k],
      active: active !== null && k === active,
    })),
    '紫微导航',
  );
}
