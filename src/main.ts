import './styles/global.css';
import './styles/emblems.css';
import './styles/module-themes.css';
import './styles/tarot.css';
import './styles/codex.css';
import { renderCodex } from './pages/codex.ts';
import { renderCodexFoolJourney } from './pages/codex-fool-journey.ts';
import { renderCodexSuitNumbers } from './pages/codex-suit-numbers.ts';
import { renderGlobalPlaceholder } from './pages/global-placeholder.ts';
import { renderJournal } from './pages/journal.ts';
import { renderJourney } from './pages/journey.ts';
import { renderLabHome } from './pages/lab-home.ts';
import { renderMeihuaHome } from './pages/meihua-home.ts';
import { renderLiuyaoHome } from './pages/liuyao-home.ts';
import { renderLiuyaoReading } from './pages/liuyao-reading.ts';
import { renderLiuyaoLearn } from './pages/liuyao-learn.ts';
import { renderLiuyaoBagua } from './pages/liuyao-bagua.ts';
import { renderLiuyaoHexagrams } from './pages/liuyao-hexagrams.ts';
import { renderLiuyaoConcepts } from './pages/liuyao-concepts.ts';
import { renderLiuyaoLearnBoard } from './pages/liuyao-learn-board.ts';
import { renderLiuyaoClassic } from './pages/liuyao-classic.ts';
import { renderLiuyaoJournal } from './pages/liuyao-journal.ts';
import { renderTarot } from './pages/tarot.ts';
import { renderTarotHome } from './pages/tarot-home.ts';
import './styles/xiaoliuren.css';
import './styles/liuyao.css';
import { renderXiaoliurenCodex } from './pages/xiaoliuren-codex.ts';
import { renderXiaoliurenHourGuide } from './pages/xiaoliuren-hour-guide.ts';
import { renderXiaoliurenJournal } from './pages/xiaoliuren-journal.ts';
import { renderXiaoliurenReading } from './pages/xiaoliuren-reading.ts';
import { renderXiaoliurenPalmJourney } from './pages/xiaoliuren-palm-journey.ts';
import { renderXiaoliurenDepth } from './pages/xiaoliuren-depth.ts';
import { renderXiaoliurenHome } from './pages/xiaoliuren-home.ts';
import { initRouter, navigate, registerRoute } from './router.ts';
import { mountAppVersion } from './ui/app-version.ts';

registerRoute('/', renderLabHome);
registerRoute('/tarot', renderTarotHome);
registerRoute('/tarot/reading', renderTarot);
registerRoute('/tarot/tujian', renderCodex);
registerRoute('/tarot/tujian/fool-journey', renderCodexFoolJourney);
registerRoute('/tarot/tujian/suit-numbers', renderCodexSuitNumbers);
registerRoute('/journal', renderJournal);
registerRoute('/xiaoliuren', renderXiaoliurenHome);
registerRoute('/xiaoliuren/reading', renderXiaoliurenReading);
registerRoute('/xiaoliuren/codex', renderXiaoliurenCodex);
registerRoute('/xiaoliuren/journal', renderXiaoliurenJournal);
registerRoute('/xiaoliuren/hour-guide', renderXiaoliurenHourGuide);
registerRoute('/xiaoliuren/palm-journey', renderXiaoliurenPalmJourney);
registerRoute('/xiaoliuren/depth', renderXiaoliurenDepth);
registerRoute('/meihua', renderMeihuaHome);
registerRoute('/liuyao', renderLiuyaoHome);
registerRoute('/liuyao/reading', renderLiuyaoReading);
registerRoute('/liuyao/learn', renderLiuyaoLearn);
registerRoute('/liuyao/learn/board', renderLiuyaoLearnBoard);
registerRoute('/liuyao/classic', renderLiuyaoClassic);
registerRoute('/liuyao/bagua', renderLiuyaoBagua);
registerRoute('/liuyao/hexagrams', renderLiuyaoHexagrams);
registerRoute('/liuyao/concepts', renderLiuyaoConcepts);
registerRoute('/liuyao/journal', renderLiuyaoJournal);
registerRoute('/records', renderJourney);
registerRoute('/knowledge', (root) =>
  renderGlobalPlaceholder(root, '知识库', '学习不同占问体系'),
);

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
