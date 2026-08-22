/**
 * 塔罗深度解读后的多轮追问（对齐六爻 followup-chat；挂入手札 aiSessions）
 */
import {
  canUseMysticFollow,
  friendlyQuotaCopy,
  loadAiServiceMode,
  recordFollowUse,
} from '../ai/ai-mode.ts';
import { resolveAiRunReady, runChatCompletion } from '../ai/chat-runner.ts';
import { isAiConfigured } from '../ai/settings.ts';
import { appendTarotAiTurns } from '../journal/records.ts';
import { openAiSettingsModal } from '../ui/ai-settings-panel.ts';
import {
  bindPersonalContextCard,
  formatPersonalContextLines,
  hasPersonalContext,
  personalContextFieldsHtml,
  readPersonalContextFrom,
} from '../liuyao/personal-context.ts';
import {
  buildTarotFollowupPresets,
  buildTarotFollowupSystemPrompt,
  type TarotReadingContext,
} from './deep-prompt.ts';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function chatFollowup(
  system: string,
  history: ChatTurn[],
  userAsk: string,
): Promise<string> {
  const mode = loadAiServiceMode();
  const ready = resolveAiRunReady({
    kind: 'follow',
    mysticFollowOk: canUseMysticFollow(),
  });
  if (!ready.ok) {
    if (ready.reason === 'need_byok') throw new Error('NO_AI');
    if (ready.reason === 'mystic_soon') {
      throw new Error(friendlyQuotaCopy(mode).detail);
    }
    throw new Error(friendlyQuotaCopy(mode).headline);
  }
  const text = await runChatCompletion(
    [
      { role: 'system', content: system },
      ...history.map((t) => ({ role: t.role, content: t.content })),
      { role: 'user', content: userAsk },
    ],
    { temperature: 0.55 },
  );
  if (mode === 'mystic') recordFollowUse();
  return text;
}

function toast(msg: string): void {
  const el = document.createElement('div');
  el.className = 'ly-follow-toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-on'));
  setTimeout(() => {
    el.classList.remove('is-on');
    setTimeout(() => el.remove(), 1600);
  }, 1600);
}

export type OpenTarotFollowupChatOpts = TarotReadingContext & {
  /** 手札 id：有则落库 */
  journalId?: string | null;
  /** 已有 AI session（深度解读后继续聊） */
  aiSessionId?: string | null;
  seedAsk?: string;
  seedContext?: string;
  /** 直接展示的深度解读（不另调模型） */
  initialAssistant?: string;
  /** 打开时默认 Tab：深度解读 | 边看边问 */
  initialTab?: 'deep' | 'ask';
};

/** 打开追问聊天弹层；若带 initialAssistant，则以「深度解读」为主，下方可继续追问 */
export function openTarotFollowupChat(opts: OpenTarotFollowupChatOpts): void {
  document.querySelector('.ly-follow-chat')?.remove();
  document.querySelector('.lab-deep-sheet')?.remove();

  const system = buildTarotFollowupSystemPrompt({
    ...opts,
    deepReading: opts.initialAssistant?.trim() || '',
  });
  const presets = buildTarotFollowupPresets(opts);
  const deepText = opts.initialAssistant?.trim() || '';
  const isDeepMode = Boolean(deepText);
  const startTab = opts.initialTab === 'ask' ? 'ask' : 'deep';
  const history: ChatTurn[] = [];
  let aiSessionId = opts.aiSessionId ?? null;
  const titleCards =
    opts.cards
      .slice(0, 3)
      .map((c) => c.name)
      .join(' · ') || '塔罗';

  const modal = document.createElement('div');
  modal.className = 'ly-follow-chat lab-deep-sheet';
  modal.innerHTML = `
    <button type="button" class="ly-follow-chat-backdrop" data-follow-close aria-label="关闭"></button>
    <div class="ly-follow-chat-sheet" role="dialog" aria-modal="true" aria-labelledby="tr-follow-title">
      <header class="ly-follow-chat-head">
        <div>
          <p class="ly-follow-chat-kicker">深度解读 · 塔罗</p>
          <h2 id="tr-follow-title">${escapeHtml(titleCards)}</h2>
        </div>
        <button type="button" class="ly-follow-chat-x" data-follow-close aria-label="关闭">×</button>
      </header>
      <div class="ly-deep-sheet-tabs" role="tablist" aria-label="深度解读与边看边问">
        <button type="button" class="ly-deep-sheet-tab${startTab === 'deep' ? ' is-on' : ''}" data-deep-tab="deep" role="tab" aria-selected="${startTab === 'deep'}">深度解读</button>
        <button type="button" class="ly-deep-sheet-tab${startTab === 'ask' ? ' is-on' : ''}" data-deep-tab="ask" role="tab" aria-selected="${startTab === 'ask'}">边看边问</button>
      </div>
      <div class="ly-deep-sheet-pane" data-deep-pane="deep" ${startTab === 'ask' ? 'hidden' : ''}>
      <p class="ly-follow-chat-persona">${
        isDeepMode
          ? '先看完这一篇，有不清楚的再往下追问；概念题可切到「边看边问」'
          : '陪你把牌译回现实 · 坚定温柔；想生成贴合解读请点下方按钮'
      }</p>
      ${
        isDeepMode
          ? `<section class="ly-follow-deep" data-follow-deep>
              <p class="ly-follow-deep-body">${escapeHtml(deepText).replace(/\n/g, '<br>')}</p>
              <button type="button" class="btn ly-btn-gold btn-sm" data-tr-deep-regen>重新生成</button>
            </section>`
          : `<section class="ly-follow-deep-empty">
              <p>还没有深度解读。可先去「边看边问」记概念，或生成一篇贴合你的解读。</p>
              <button type="button" class="btn ly-btn-gold btn-sm" data-follow-make-deep>生成深度解读</button>
            </section>`
      }
      ${
        opts.seedContext && !isDeepMode
          ? `<p class="ly-follow-seed-ctx">已附上选中内容：${escapeHtml(opts.seedContext.slice(0, 80))}${opts.seedContext.length > 80 ? '…' : ''}</p>`
          : ''
      }
      <div class="ly-follow-presets" data-follow-presets>
        ${presets
          .map(
            (q) =>
              `<button type="button" class="ly-follow-preset" data-follow-preset>${escapeHtml(q)}</button>`,
          )
          .join('')}
      </div>
      <div class="ly-follow-messages" data-follow-messages ${isDeepMode ? 'data-follow-qa' : ''}></div>
      ${(() => {
        const modeNow = loadAiServiceMode();
        const modeHint =
          modeNow === 'mystic'
            ? `默认用 Mystic AI · ${friendlyQuotaCopy(modeNow).headline}`
            : isAiConfigured()
              ? '默认用你上次选的 AI Key'
              : '请先配置 AI Key，或改选 Mystic AI';
        const journalHint = opts.journalId
          ? isDeepMode
            ? '解读与追问都会写入本局手札。'
            : '对话会写入本局手札，可在记录里回看。'
          : '';
        return `<p class="ly-follow-ai-hint">${escapeHtml(modeHint)}${
          journalHint ? ` · ${escapeHtml(journalHint)}` : ''
        }${
          modeNow === 'byok' && !isAiConfigured()
            ? ` <button type="button" class="ly-ask-ai-link" data-follow-ai-settings>去配置</button>`
            : ''
        }</p>`;
      })()}
      <details class="ly-follow-ctx-fold" data-follow-ctx-fold>
        <summary>补充情况（选填）· 灰字不用手删 · 点标签跳段</summary>
        ${personalContextFieldsHtml('trf')}
      </details>
      <form class="ly-follow-composer" data-follow-form>
        <textarea class="question-input ly-follow-ask" data-follow-input rows="2" placeholder="${
          isDeepMode ? '对这篇解读继续追问…' : '继续追问…'
        }"></textarea>
        <button type="submit" class="btn ly-btn-gold" data-follow-send>发送</button>
      </form>
      </div>
      <div class="ly-deep-sheet-pane ly-deep-ask-pane" data-deep-pane="ask" ${startTab === 'deep' ? 'hidden' : ''}>
        <p class="ly-layer-guide">本页常问 · 本地提示</p>
        <div class="ly-ask-faq">
          ${[
            { q: '正位和逆位有什么不同？', a: '正位更像能量顺流展开；逆位常提示阻滞、内化或需要先看见的阴影面。同一张牌两种取向，都是镜子，不是判决。' },
            { q: '牌阵位置代表什么？', a: '位置是问题的透镜：同一张牌在「过去」与「建议」含义不同。先读位置再读牌，会更贴你的提问。' },
            { q: '解读不准怎么办？', a: '先看问法是否够具体，再对照你当下真实处境。牌是隐喻，不是剧本；不准时，改问或补一张澄清牌往往更有用。' },
          ]
            .map(
              (item, i) => `
            <button type="button" class="ly-faq-link" data-faq-index="${i}">
              <span class="ly-faq-link-mark" aria-hidden="true">▸</span>
              <span class="ly-faq-link-q">${escapeHtml(item.q)}</span>
            </button>`,
            )
            .join('')}
        </div>
        <form class="ly-ask-free" data-tr-ask-form>
          <label class="visually-hidden" for="tr-ask-q">自由提问</label>
          <input id="tr-ask-q" class="question-input" type="text" placeholder="问一个概念，如：逆位是什么" data-tr-ask-input />
          <button type="submit" class="btn btn-sm">查释义</button>
        </form>
        <p class="ly-follow-ai-hint" data-tr-ask-answer hidden></p>
      </div>
    </div>
  `;

  const faqItems = [
    {
      q: '正位和逆位有什么不同？',
      a: '正位更像能量顺流展开；逆位常提示阻滞、内化或需要先看见的阴影面。同一张牌两种取向，都是镜子，不是判决。',
    },
    {
      q: '牌阵位置代表什么？',
      a: '位置是问题的透镜：同一张牌在「过去」与「建议」含义不同。先读位置再读牌，会更贴你的提问。',
    },
    {
      q: '解读不准怎么办？',
      a: '先看问法是否够具体，再对照你当下真实处境。牌是隐喻，不是剧本；不准时，改问或补一张澄清牌往往更有用。',
    },
  ];

  const messagesEl = modal.querySelector<HTMLElement>('[data-follow-messages]')!;
  const input = modal.querySelector<HTMLTextAreaElement>('[data-follow-input]')!;
  const form = modal.querySelector<HTMLFormElement>('[data-follow-form]')!;
  const sendBtn = modal.querySelector<HTMLButtonElement>('[data-follow-send]')!;
  const ctxHost = modal.querySelector<HTMLElement>('[data-follow-ctx-fold]')!;
  const askAnswer = modal.querySelector<HTMLElement>('[data-tr-ask-answer]')!;

  const paintMessages = () => {
    const visible = isDeepMode
      ? history.filter((t, i) => !(i === 0 && t.role === 'assistant' && t.content === deepText))
      : history;
    messagesEl.innerHTML = visible
      .map(
        (t) => `
      <div class="ly-follow-bubble is-${t.role}">
        <p>${escapeHtml(t.content).replace(/\n/g, '<br>')}</p>
      </div>`,
      )
      .join('');
    messagesEl.hidden = visible.length === 0;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const persistTurns = (turns: ChatTurn[]) => {
    if (!opts.journalId || !turns.length) return;
    const sid = appendTarotAiTurns(
      opts.journalId,
      aiSessionId,
      turns.map((t) => ({ role: t.role, content: t.content })),
    );
    if (sid) aiSessionId = sid;
  };

  if (deepText) {
    history.push({ role: 'assistant', content: deepText });
  }
  paintMessages();

  const close = () => {
    modal.classList.remove('is-open');
    setTimeout(() => modal.remove(), 220);
  };

  const openPersonalize = () => {
    close();
    void import('./personalize-deep.ts').then(({ openTarotPersonalizeDeep }) => {
      openTarotPersonalizeDeep({
        ...opts,
        journalId: opts.journalId,
      });
    });
  };

  modal.querySelectorAll('[data-follow-close]').forEach((el) => {
    el.addEventListener('click', close);
  });
  modal.querySelector('[data-follow-ai-settings]')?.addEventListener('click', () => {
    openAiSettingsModal();
  });
  modal.querySelector('[data-follow-make-deep]')?.addEventListener('click', openPersonalize);
  modal.querySelector('[data-tr-deep-regen]')?.addEventListener('click', openPersonalize);

  modal.querySelectorAll<HTMLButtonElement>('[data-deep-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.deepTab === 'ask' ? 'ask' : 'deep';
      modal.querySelectorAll('[data-deep-tab]').forEach((b) => {
        const on = (b as HTMLElement).dataset.deepTab === tab;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      modal.querySelectorAll<HTMLElement>('[data-deep-pane]').forEach((pane) => {
        pane.hidden = pane.dataset.deepPane !== tab;
      });
    });
  });

  const showAsk = (q: string, a: string) => {
    askAnswer.hidden = false;
    askAnswer.innerHTML = `<strong>${escapeHtml(q)}</strong><br>${escapeHtml(a)}`;
  };

  modal.querySelectorAll<HTMLButtonElement>('[data-faq-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.faqIndex);
      const item = faqItems[i];
      if (!item) return;
      showAsk(item.q, item.a);
    });
  });
  modal.querySelector<HTMLFormElement>('[data-tr-ask-form]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = modal.querySelector<HTMLInputElement>('[data-tr-ask-input]')?.value.trim() || '';
    if (!q) return;
    const hit = faqItems.find((f) => f.q.includes(q) || q.includes(f.q.slice(0, 4)));
    showAsk(
      q,
      hit?.a ??
        `关于「${q}」：可对照本局牌阵位置与正逆位；本地词库暂无精确条时，可切回深度解读用 AI 追问，或记到笔记。`,
    );
  });

  let seedOnce = opts.seedContext?.trim() || '';

  const runAsk = async (raw: string) => {
    const userAsk = raw.trim();
    if (!userAsk) return;
    const personal = readPersonalContextFrom(ctxHost, 'trf');
    const personalLines = formatPersonalContextLines(personal);
    let withCtx = seedOnce
      ? `（对照这段解读：${seedOnce.slice(0, 200)}）\n${userAsk}`
      : userAsk;
    if (hasPersonalContext(personal)) {
      withCtx = `${withCtx}\n\n【我补充的情况】\n${personalLines.join('\n')}`;
    }
    seedOnce = '';

    history.push({ role: 'user', content: userAsk });
    paintMessages();
    input.value = '';
    sendBtn.disabled = true;
    sendBtn.textContent = '…';

    const thinking = document.createElement('div');
    thinking.className = 'ly-follow-bubble is-assistant is-thinking';
    thinking.innerHTML = '<p>陪读正在想…</p>';
    messagesEl.hidden = false;
    messagesEl.appendChild(thinking);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const answer = await chatFollowup(system, history.slice(0, -1), withCtx);
      thinking.remove();
      history.push({ role: 'assistant', content: answer });
      paintMessages();
      persistTurns([
        { role: 'user', content: userAsk },
        { role: 'assistant', content: answer },
      ]);
    } catch (err) {
      thinking.remove();
      history.pop();
      paintMessages();
      const msg = err instanceof Error ? err.message : '追问失败';
      if (msg === 'NO_AI') {
        toast('还需要接上 AI，才能追问。');
        openAiSettingsModal();
      } else {
        toast(msg);
      }
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = '发送';
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void runAsk(input.value);
  });
  modal.querySelectorAll<HTMLButtonElement>('[data-follow-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      void runAsk(btn.textContent || '');
    });
  });

  document.body.appendChild(modal);
  bindPersonalContextCard(modal);
  requestAnimationFrame(() => modal.classList.add('is-open'));

  const seedAsk = opts.seedAsk?.trim();
  if (seedAsk && startTab === 'deep') {
    input.value = seedAsk;
    input.focus();
  }
}
