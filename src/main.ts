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
import { renderLabHome } from './pages/lab-home.ts';
import { renderMeihuaHome } from './pages/meihua-home.ts';
import { renderTarot } from './pages/tarot.ts';
import { renderTarotHome } from './pages/tarot-home.ts';
import { renderXiaoliurenHome } from './pages/xiaoliuren-home.ts';
import { initRouter, navigate, registerRoute } from './router.ts';
import { mountAppVersion } from './ui/app-version.ts';

registerRoute('/', renderLabHome);
registerRoute('/tarot', renderTarotHome);
registerRoute('/tarot/reading', renderTarot);
registerRoute('/codex', renderCodex);
registerRoute('/codex/fool-journey', renderCodexFoolJourney);
registerRoute('/codex/suit-numbers', renderCodexSuitNumbers);
registerRoute('/journal', renderJournal);
registerRoute('/xiaoliuren', renderXiaoliurenHome);
registerRoute('/meihua', renderMeihuaHome);
registerRoute('/records', (root) =>
  renderGlobalPlaceholder(root, '我的手札', '查看所有占问记录'),
);
registerRoute('/knowledge', (root) =>
  renderGlobalPlaceholder(root, '知识库', '学习不同占问体系'),
);

// 旧路径兼容
registerRoute('/divination', () => {
  navigate('/tarot/reading');
});
registerRoute('/xiao-liu-ren', () => {
  navigate('/xiaoliuren');
});
registerRoute('/mei-hua', () => {
  navigate('/meihua');
});

initRouter();
mountAppVersion();
