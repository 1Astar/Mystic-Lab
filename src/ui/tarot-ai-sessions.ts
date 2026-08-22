import type { TarotAiSession } from '../journal/records.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 手札详情 / 复原页：回看 AI 深度解读与追问 */
export function renderTarotAiSessionsHtml(sessions: TarotAiSession[] | undefined): string {
  if (!sessions?.length) return '';
  const blocks = sessions
    .map((s) => {
      const title = s.kind === 'deep' ? '深度解读' : '追问';
      const body =
        s.deepReading?.trim() ||
        s.turns
          .filter((t) => t.role === 'assistant')
          .map((t) => t.content)
          .join('\n\n') ||
        '';
      if (!body.trim()) return '';
      const extra =
        s.turns.length > 1
          ? `<details class="tr-replay-ai-turns"><summary>追问记录（${s.turns.length} 条）</summary>${s.turns
              .map(
                (t) =>
                  `<p class="tr-replay-ai-turn is-${t.role}"><strong>${
                    t.role === 'user' ? '你' : '陪读'
                  }</strong> · ${escapeHtml(t.content)}</p>`,
              )
              .join('')}</details>`
          : '';
      return `<section class="tr-replay-ai"><h4>${title}</h4><p class="tr-replay-pre">${escapeHtml(
        body,
      )}</p>${extra}</section>`;
    })
    .filter(Boolean)
    .join('');
  return blocks ? `<div class="tr-replay-ai-wrap">${blocks}</div>` : '';
}

export function tarotAiBadgeHtml(sessionCount: number): string {
  if (!sessionCount) return '';
  return `<p class="tr-journal-ai-badge">含深度解读 · ${sessionCount} 段</p>`;
}
