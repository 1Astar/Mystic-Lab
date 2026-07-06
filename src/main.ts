import './styles/global.css';
import './styles/tarot.css';
import './styles/codex.css';
import { renderCodex } from './pages/codex.ts';
import { renderComingSoon } from './pages/coming-soon.ts';
import { renderDivination } from './pages/divination.ts';
import { renderHome } from './pages/home.ts';
import { renderJournal } from './pages/journal.ts';
import { renderTarot } from './pages/tarot.ts';
import { initRouter, registerRoute } from './router.ts';

registerRoute('/', renderHome);
registerRoute('/divination', renderDivination);
registerRoute('/tarot', renderTarot);
registerRoute('/codex', renderCodex);
registerRoute('/journal', renderJournal);
registerRoute('/xiao-liu-ren', (root) =>
  renderComingSoon(root, '小六壬', '大安 · 留连 · 速喜 · 赤口 · 小吉 · 空亡'),
);
registerRoute('/mei-hua', (root) =>
  renderComingSoon(root, '梅花易数', '动念成卦 · 时间起卦'),
);

initRouter();
