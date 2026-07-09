import { getTarotJourneyInsights } from '../codex/journey-insights.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function mountCodexJourneyPanel(container: HTMLElement): void {
  const insights = getTarotJourneyInsights(30);

  container.className = 'codex-journey-panel';

  if (insights.empty) {
    container.innerHTML = `
      <h3 class="codex-journey-title">你的塔罗旅程</h3>
      <p class="codex-journey-empty">完成几次占问后，这里会显示最近 30 次里各牌组的出现趋势。</p>
    `;
    return;
  }

  const trendHtml = insights.trends
    .map((t) => {
      const arrow = t.rising ? ' ↑' : '';
      return `
        <div class="codex-journey-trend ${t.rising ? 'is-rising' : ''}">
          <p class="codex-journey-trend-head">
            <strong>${escapeHtml(t.label)}</strong>出现率${arrow}
          </p>
          <p class="codex-journey-trend-insight">说明你最近关注：${escapeHtml(t.insight)}</p>
        </div>
      `;
    })
    .join('');

  container.innerHTML = `
    <h3 class="codex-journey-title">你的塔罗旅程</h3>
    <p class="codex-journey-meta">最近 ${insights.readingCount} 次占问</p>
    <div class="codex-journey-trends">${trendHtml}</div>
  `;
}
