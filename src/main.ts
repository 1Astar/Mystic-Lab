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
import './styles/xiaoliuren.css';
import { renderXiaoliurenCodex } from './pages/xiaoliuren-codex.ts';
import { renderXiaoliurenHourGuide } from './pages/xiaoliuren-hour-guide.ts';
import { renderXiaoliurenJournal } from './pages/xiaoliuren-journal.ts';
import { renderXiaoliurenReading } from './pages/xiaoliuren-reading.ts';
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
registerRoute('/meihua', renderMeihuaHome);
registerRoute('/records', (root) =>
  renderGlobalPlaceholder(root, '我的手札', '查看所有占问记录'),
);
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

initRouter();
mountAppVersion();
