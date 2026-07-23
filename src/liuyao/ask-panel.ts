import type { CastResult } from './engine.ts';
import { buildLearnFaq, type LearnFaqItem } from './narrative-learn.ts';
import { buildReadingFacts } from './reading-facts.ts';
import { listPromotedAsks, voteAskUseful, voteAskUnclear } from './ask-vault.ts';
import { answerAndStoreAsk } from './ask-answer.ts';
import { syncAskToStarPm } from './ask-sync.ts';
import { openAiSettingsModal } from '../ui/ai-settings-panel.ts';
import { isAiConfigured } from '../ai/settings.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderFaqDetails(items: LearnFaqItem[], openFirst = true): string {
  return items
    .map((item, i) => {
      const body = item.a
        .map((p) =>
          p.includes('\n')
            ? `<div class="ly-faq-pre">${escapeHtml(p).replace(/\n/g, '<br>')}</div>`
            : `<p>${escapeHtml(p)}</p>`,
        )
        .join('');
      return `
    <details class="ly-faq-item"${openFirst && i === 0 ? ' open' : ''}>
      <summary>${escapeHtml(item.q)}</summary>
      <div class="ly-faq-body">${body}</div>
    </details>`;
    })
    .join('');
}

/** 边看边问面板 HTML */
export function renderAskPanelHtml(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): string {
  const facts = buildReadingFacts(cast, question, castAt);
  const dynamic = buildLearnFaq(facts);
  const promoted = listPromotedAsks(cast.primary.name);
  const promotedHtml = promoted.length
    ? promoted
        .map((e) => {
          const unclear =
            e.unclearVotes > e.usefulVotes
              ? `<p class="ly-ask-flag">仍有人觉得难懂</p>`
              : '';
          return `
      <details class="ly-faq-item">
        <summary>${escapeHtml(e.q)} <span class="ly-ask-badge">常问</span></summary>
        <div class="ly-faq-body">
          <p>${escapeHtml(e.a).replace(/\n/g, '<br>')}</p>
          ${unclear}
        </div>
      </details>`;
        })
        .join('')
    : '';

  return `
    <section class="ly-ask-panel" data-ask-panel data-ask-hex="${escapeHtml(cast.primary.name)}">
      <p class="ly-guide-tip">卡住了就问。常问来自教学整理与大家反复问过的好问题。</p>
      <div class="ly-ask-section">
        <p class="ly-layer-guide">常问</p>
        <div class="ly-ask-faq" data-ask-faq>
          ${renderFaqDetails(dynamic, true)}
          ${promotedHtml}
        </div>
      </div>
      <div class="ly-ask-section">
        <p class="ly-layer-guide">我还想问</p>
        <textarea class="question-input ly-ask-input" data-ask-input rows="2" placeholder="例如：五爻发动对我求职意味着什么？"></textarea>
        <button type="button" class="btn ly-btn-gold btn-sm ly-ask-send" data-ask-send>提问</button>
        ${
          isAiConfigured()
            ? ''
            : `<p class="ly-ask-ai-hint">未配置 AI 时用规则短答。<button type="button" class="ly-ask-ai-link" data-ask-ai-settings>去配置 AI</button></p>`
        }
        <div class="ly-ask-result" data-ask-result hidden></div>
      </div>
    </section>
  `;
}

function renderResultBox(
  answer: string,
  entryId: string,
  hint?: string,
  syncMsg?: string,
): string {
  return `
    <div class="ly-ask-answer-card" data-ask-entry="${escapeHtml(entryId)}">
      <p class="ly-ask-answer-text">${escapeHtml(answer).replace(/\n/g, '<br>')}</p>
      ${hint ? `<p class="ly-ask-hint">${escapeHtml(hint)}</p>` : ''}
      ${syncMsg ? `<p class="ly-ask-sync">${escapeHtml(syncMsg)}</p>` : ''}
      <div class="ly-ask-votes">
        <button type="button" class="btn btn-ghost btn-sm" data-ask-vote="useful">有用</button>
        <button type="button" class="btn btn-ghost btn-sm" data-ask-vote="unclear">不太懂</button>
      </div>
      <p class="ly-ask-vote-status" data-ask-vote-status hidden></p>
    </div>
  `;
}

export function bindAskPanel(
  root: HTMLElement,
  cast: CastResult,
  question: string,
  castAt = new Date(),
): void {
  const host = root.querySelector<HTMLElement>('[data-ask-panel]');
  if (!host || host.dataset.askBound === '1') return;
  host.dataset.askBound = '1';

  const input = host.querySelector<HTMLTextAreaElement>('[data-ask-input]');
  const send = host.querySelector<HTMLButtonElement>('[data-ask-send]');
  const result = host.querySelector<HTMLElement>('[data-ask-result]');

  host.querySelector('[data-ask-ai-settings]')?.addEventListener('click', () => {
    openAiSettingsModal();
  });

  const runAsk = async () => {
    if (!input || !result || !send) return;
    const userAsk = input.value.trim();
    if (!userAsk) return;
    send.disabled = true;
    send.textContent = '回答中…';
    result.hidden = false;
    result.innerHTML = `<p class="ly-ask-hint">正在整理回答…</p>`;
    try {
      const res = await answerAndStoreAsk({ cast, question, userAsk, castAt });
      const sync = await syncAskToStarPm(res.entry);
      result.innerHTML = renderResultBox(
        res.answer,
        res.entry.id,
        res.hint,
        sync.starPm.message,
      );
      wireVotes(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '提问失败';
      result.innerHTML = `<p class="ly-ask-err">${escapeHtml(msg)}</p>`;
    } finally {
      send.disabled = false;
      send.textContent = '提问';
    }
  };

  send?.addEventListener('click', () => {
    void runAsk();
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void runAsk();
    }
  });
}

function wireVotes(resultHost: HTMLElement): void {
  const card = resultHost.querySelector<HTMLElement>('[data-ask-entry]');
  if (!card) return;
  const id = card.dataset.askEntry!;
  const status = card.querySelector<HTMLElement>('[data-ask-vote-status]');
  card.querySelectorAll<HTMLButtonElement>('[data-ask-vote]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.askVote;
      const entry =
        kind === 'useful' ? voteAskUseful(id) : kind === 'unclear' ? voteAskUnclear(id) : null;
      if (!entry || !status) return;
      status.hidden = false;
      status.textContent =
        kind === 'useful'
          ? `已记「有用」· 累计 ${entry.usefulVotes}（常问需问满 5 次且有用 3 次）`
          : `已记「不太懂」· 累计 ${entry.unclearVotes}`;
      card.querySelectorAll<HTMLButtonElement>('[data-ask-vote]').forEach((b) => {
        b.disabled = true;
      });
      if (entry.source === 'promoted') {
        void syncAskToStarPm(entry);
      }
    });
  });
}
