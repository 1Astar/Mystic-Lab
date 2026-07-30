import './styles/global.css';
import './styles/emblems.css';
import './styles/module-themes.css';
import './styles/birth-datetime.css';
import './styles/profile-bar.css';
import { renderLabHome } from './pages/lab-home.ts';
import {
  initRouter,
  navigate,
  paintRouteLoading,
  registerRoute,
  type RouteHandler,
} from './router.ts';
import { mountAppVersion } from './ui/app-version.ts';

function lazy(
  loader: () => Promise<{ default?: RouteHandler } | Record<string, unknown>>,
  exportName: string,
  styles: Array<() => Promise<unknown>> = [],
): RouteHandler {
  return async (root) => {
    paintRouteLoading(root);
    await Promise.all(styles.map((s) => s()));
    const mod = await loader();
    const renderFn = (mod as Record<string, unknown>)[exportName] as RouteHandler | undefined;
    if (typeof renderFn !== 'function') {
      throw new Error(`lazy route missing export: ${exportName}`);
    }
    // 页面多用 appendChild，先清掉「载入中」占位
    root.innerHTML = '';
    return renderFn(root);
  };
}

const tarotStyles = [
  () => import('./styles/tarot.css'),
  () => import('./styles/codex.css'),
];
const xiaoliurenStyles = [() => import('./styles/xiaoliuren.css')];
const liuyaoStyles = [() => import('./styles/liuyao.css')];
const lifeStyles = [() => import('./styles/life.css')];
const baziStyles = [() => import('./styles/bazi.css')];

registerRoute('/', renderLabHome);

registerRoute(
  '/tarot',
  lazy(() => import('./pages/tarot-home.ts'), 'renderTarotHome', tarotStyles),
);
registerRoute(
  '/tarot/reading',
  lazy(() => import('./pages/tarot.ts'), 'renderTarot', tarotStyles),
);
registerRoute(
  '/tarot/tujian',
  lazy(() => import('./pages/codex.ts'), 'renderCodex', tarotStyles),
);
registerRoute(
  '/tarot/tujian/fool-journey',
  lazy(() => import('./pages/codex-fool-journey.ts'), 'renderCodexFoolJourney', tarotStyles),
);
registerRoute(
  '/tarot/tujian/suit-numbers',
  lazy(() => import('./pages/codex-suit-numbers.ts'), 'renderCodexSuitNumbers', tarotStyles),
);
registerRoute(
  '/journal',
  lazy(() => import('./pages/journal.ts'), 'renderJournal', tarotStyles),
);

registerRoute(
  '/xiaoliuren',
  lazy(() => import('./pages/xiaoliuren-home.ts'), 'renderXiaoliurenHome', xiaoliurenStyles),
);
registerRoute(
  '/xiaoliuren/reading',
  lazy(() => import('./pages/xiaoliuren-reading.ts'), 'renderXiaoliurenReading', xiaoliurenStyles),
);
registerRoute(
  '/xiaoliuren/codex',
  lazy(() => import('./pages/xiaoliuren-codex.ts'), 'renderXiaoliurenCodex', xiaoliurenStyles),
);
registerRoute(
  '/xiaoliuren/journal',
  lazy(() => import('./pages/xiaoliuren-journal.ts'), 'renderXiaoliurenJournal', xiaoliurenStyles),
);
registerRoute(
  '/xiaoliuren/hour-guide',
  lazy(() => import('./pages/xiaoliuren-hour-guide.ts'), 'renderXiaoliurenHourGuide', xiaoliurenStyles),
);
registerRoute(
  '/xiaoliuren/palm-journey',
  lazy(() => import('./pages/xiaoliuren-palm-journey.ts'), 'renderXiaoliurenPalmJourney', xiaoliurenStyles),
);
registerRoute(
  '/xiaoliuren/depth',
  lazy(() => import('./pages/xiaoliuren-depth.ts'), 'renderXiaoliurenDepth', xiaoliurenStyles),
);
registerRoute(
  '/xiaoliuren/kungfu',
  lazy(() => import('./pages/xiaoliuren-kungfu.ts'), 'renderXiaoliurenKungfu', xiaoliurenStyles),
);

registerRoute(
  '/meihua',
  lazy(() => import('./pages/meihua-home.ts'), 'renderMeihuaHome'),
);

registerRoute(
  '/bazi',
  lazy(() => import('./pages/bazi-home.ts'), 'renderBaziHome', baziStyles),
);
registerRoute(
  '/bazi/chart',
  lazy(() => import('./pages/bazi-chart.ts'), 'renderBaziChart', baziStyles),
);

registerRoute(
  '/life',
  lazy(() => import('./pages/life-home.ts'), 'renderLifeHome', lifeStyles),
);
registerRoute(
  '/profile',
  lazy(() => import('./pages/life-profile.ts'), 'renderLifeProfile', lifeStyles),
);
registerRoute('/life/profile', () => {
  navigate('/profile');
});
registerRoute(
  '/life/parallel',
  lazy(() => import('./pages/life-parallel.ts'), 'renderLifeParallel', lifeStyles),
);
registerRoute(
  '/life/simulate',
  lazy(() => import('./pages/life-simulate.ts'), 'renderLifeSimulate', lifeStyles),
);
registerRoute(
  '/life/forecast',
  lazy(() => import('./pages/life-forecast.ts'), 'renderLifeForecast', lifeStyles),
);

registerRoute(
  '/liuyao',
  lazy(() => import('./pages/liuyao-home.ts'), 'renderLiuyaoHome', liuyaoStyles),
);
registerRoute(
  '/liuyao/reading',
  lazy(() => import('./pages/liuyao-reading.ts'), 'renderLiuyaoReading', liuyaoStyles),
);
registerRoute(
  '/liuyao/learn',
  lazy(() => import('./pages/liuyao-learn.ts'), 'renderLiuyaoLearn', liuyaoStyles),
);
registerRoute(
  '/liuyao/learn/board',
  lazy(() => import('./pages/liuyao-learn-board.ts'), 'renderLiuyaoLearnBoard', liuyaoStyles),
);
registerRoute(
  '/liuyao/classic',
  lazy(() => import('./pages/liuyao-classic.ts'), 'renderLiuyaoClassic', liuyaoStyles),
);
registerRoute(
  '/liuyao/bagua',
  lazy(() => import('./pages/liuyao-bagua.ts'), 'renderLiuyaoBagua', liuyaoStyles),
);
registerRoute(
  '/liuyao/hexagrams',
  lazy(() => import('./pages/liuyao-hexagrams.ts'), 'renderLiuyaoHexagrams', liuyaoStyles),
);
registerRoute(
  '/liuyao/hexagrams/notes',
  lazy(() => import('./pages/liuyao-hex-notes.ts'), 'renderLiuyaoHexNotes', liuyaoStyles),
);
registerRoute(
  '/liuyao/concepts',
  lazy(() => import('./pages/liuyao-concepts.ts'), 'renderLiuyaoConcepts', liuyaoStyles),
);
registerRoute(
  '/liuyao/journal',
  lazy(() => import('./pages/liuyao-journal.ts'), 'renderLiuyaoJournal', liuyaoStyles),
);
registerRoute(
  '/liuyao/vault',
  lazy(() => import('./pages/liuyao-vault.ts'), 'renderLiuyaoVault', liuyaoStyles),
);
registerRoute(
  '/liuyao/growth',
  lazy(() => import('./pages/liuyao-growth.ts'), 'renderLiuyaoGrowth', liuyaoStyles),
);

registerRoute(
  '/records',
  lazy(() => import('./pages/journey.ts'), 'renderJourney'),
);
registerRoute('/knowledge', async (root) => {
  const { renderGlobalPlaceholder } = await import('./pages/global-placeholder.ts');
  return renderGlobalPlaceholder(root, '知识库', '学习不同占问体系');
});

// 旧路径兼容
registerRoute('/codex', () => {
  navigate('/tarot/tujian');
});
registerRoute('/codex/fool-journey', () => {
  navigate('/tarot/tujian/fool-journey');
});
registerRoute('/codex/suit-numbers', () => {
  navigate('/tarot/tujian/suit-numbers');
});
registerRoute('/divination', () => {
  navigate('/tarot/reading');
});
registerRoute('/xiao-liu-ren', () => {
  navigate('/xiaoliuren');
});
registerRoute('/mei-hua', () => {
  navigate('/meihua');
});
registerRoute('/liu-yao', () => {
  navigate('/liuyao');
});

initRouter();
mountAppVersion();

function paintBootError(err: unknown): void {
  const root = document.querySelector<HTMLElement>('#app');
  if (!root) return;
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error && err.stack ? err.stack : '';
  root.innerHTML = `
    <div class="page" style="padding:24px;color:#e8e2d5;background:#08090d;min-height:100vh;font-family:system-ui,sans-serif">
      <h1 style="font-size:1.1rem;margin:0 0 12px">页面加载失败</h1>
      <p style="opacity:0.8;font-size:0.9rem;word-break:break-word;margin:0 0 8px">${msg.replace(/</g, '&lt;')}</p>
      ${stack ? `<pre style="opacity:0.45;font-size:0.7rem;overflow:auto;max-height:40vh;white-space:pre-wrap">${stack.replace(/</g, '&lt;')}</pre>` : ''}
      <p style="margin-top:16px;opacity:0.55;font-size:0.8rem">若刚改过代码：硬刷新一次（Ctrl+Shift+R）。本地请用 <strong>https://</strong> 打开，或运行 <code>npm run dev:http</code>。</p>
      <button type="button" id="boot-reload" style="margin-top:16px;padding:10px 16px;border-radius:999px;border:1px solid #c7a45b;background:#c7a45b;color:#111;cursor:pointer">刷新重试</button>
    </div>
  `;
  root.querySelector('#boot-reload')?.addEventListener('click', () => location.reload());
}

window.addEventListener('error', (e) => {
  paintBootError(e.error ?? e.message);
});
window.addEventListener('unhandledrejection', (e) => {
  paintBootError(e.reason);
});

if (import.meta.hot) {
  import.meta.hot.accept();
}
