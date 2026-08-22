/**
 * 紫微深度解读后的多轮追问（对标八字；person 键 + 手札 aiSessions）
 */
import type { PersonProfile } from '../life/types.ts';
import type { ZiweiChartView } from './types.ts';
import {
  appendZiweiAiDeepTurns,
  loadZiweiAiDeepDoc,
  type ZiweiAiDeepTurn,
} from './ai-deep-store.ts';
import { appendZiweiAiTurns } from './journal.ts';
import { answerZiweiConcept, recordZiweiConceptMiss } from './concept-ask.ts';
import { buildZiweiPageFaq } from './page-faq.ts';
import {
  canUseMysticFollow,
  friendlyQuotaCopy,
  loadAiServiceMode,
  recordFollowUse,
} from '../ai/ai-mode.ts';
import { resolveAiRunReady, runChatCompletion } from '../ai/chat-runner.ts';
import { isAiConfigured } from '../ai/settings.ts';
import { openAiSettingsModal } from '../ui/ai-settings-panel.ts';
import {
  openLabConceptPeek,
  tabsFromParagraphs,
} from '../ui/lab-concept-peek.ts';
import {
  bindPersonalContextCard,
  formatPersonalContextLines,
  hasPersonalContext,
  personalContextFieldsHtml,
  readPersonalContextFrom,
} from '../liuyao/personal-context.ts';

type ChatTurn = { role: 'user' | 'assistant'; content: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function chartFactsBlock(view: ZiweiChartView, person: PersonProfile): string[] {
  const soul = view.soulPalace;
  const majors = soul.majors.map((s) => s.name).join('、') || '空象';
  const annual = view.theater.annual;
  return [
    `【盘面】五行局 ${view.fiveElementsClass}；命宫主星 ${majors}；定调：${view.theater.headline}`,
    `【流年】${annual.year}${annual.advice ? ` · ${annual.advice.slice(0, 80)}` : ''}`,
    person.nickname ? `【档案称呼】${person.nickname}` : '',
  ].filter(Boolean);
}

export function buildZiweiFollowupSystemPrompt(input: {
  view: ZiweiChartView;
  person: PersonProfile;
  question: string;
  deepReading?: string;
}): string {
  const deep = input.deepReading?.trim() || '';
  return [
    '你是紫微斗数陪读教练，语气温暖、具体、可执行，禁止绝对吉凶判决。',
    '用户在读完深度解读后继续追问：直接回答这一问，150–280 字，口语化，用「你」；结尾给一个很小的下一步。',
    '不要重复套固定四段标题；可轻点宫位/主星/流年，但用人话。勿整段复述深度解读。',
    '',
    ...chartFactsBlock(input.view, input.person),
    `原问题：${input.question.trim() || '（未填写）'}`,
    deep
      ? `已生成的深度解读（可参考，勿照抄）：\n${deep.slice(0, 1200)}${deep.length > 1200 ? '…' : ''}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildZiweiFollowupPresets(input: {
  view: ZiweiChartView;
  question: string;
}): string[] {
  const majors =
    input.view.soulPalace.majors.map((s) => s.name).join('、') || '命宫主星';
  const year = input.view.theater.annual.year;
  const q = input.question.trim();
  if (/工作|职业|换工作|离职|升职|offer|事业/i.test(q)) {
    return [
      `对照 ${year} 流年，事业上是该冲还是先稳住？`,
      `命宫「${majors}」对我工作节奏最实用的提醒是什么？`,
      '如果只能改一件事，我这周最该先做哪件小事？',
    ];
  }
  if (/感情|恋爱|婚姻|分手|复合|关系/i.test(q)) {
    return [
      '这段关系里，我怎样设边界又不把自己弄更累？',
      `命宫「${majors}」对相处方式有什么提示？`,
      '我这周能做的最小一步是什么？',
    ];
  }
  return [
    `「${input.view.theater.headline}」对我眼下最实用的提醒是什么？`,
    `命宫「${majors}」，我明天能怎么用一小下？`,
    `对照 ${year} 流年，我怎样判断该加码还是该缓？`,
  ];
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

export type OpenZiweiFollowupChatOpts = {
  view: ZiweiChartView;
  person: PersonProfile;
  question: string;
  deepReading: string;
  initialTab?: 'deep' | 'ask';
  seedAsk?: string;
  seedContext?: string;
  answerConcept?: (q: string) => { answer: string; hit: boolean };
};

/** 深度解读 + 多轮追问弹层 */
export function openZiweiFollowupChat(opts: OpenZiweiFollowupChatOpts): void {
  document.querySelector('.ly-follow-chat')?.remove();
  document.querySelector('.lab-deep-sheet')?.remove();

  const deepText = opts.deepReading.trim();
  const doc = loadZiweiAiDeepDoc(opts.person.id);
  const savedTurns = (doc?.turns ?? []).filter(
    (t) => t.content.trim() && !(t.role === 'assistant' && t.content.trim() === deepText),
  );
  const system = buildZiweiFollowupSystemPrompt({
    view: opts.view,
    person: opts.person,
    question: opts.question,
    deepReading: deepText,
  });
  const presets = buildZiweiFollowupPresets({
    view: opts.view,
    question: opts.question,
  });
  const faq = buildZiweiPageFaq(opts.view, { question: opts.question });
  const answerConcept = opts.answerConcept ?? answerZiweiConcept;
  const startTab = opts.initialTab === 'ask' ? 'ask' : 'deep';

  const history: ChatTurn[] = [{ role: 'assistant', content: deepText }];
  for (const t of savedTurns) {
    history.push({ role: t.role, content: t.content });
  }

  const modal = document.createElement('div');
  modal.className = 'ly-follow-chat lab-deep-sheet';
  modal.innerHTML = `
    <button type="button" class="ly-follow-chat-backdrop" data-follow-close aria-label="关闭"></button>
    <div class="ly-follow-chat-sheet" role="dialog" aria-modal="true" aria-labelledby="zw-follow-title">
      <header class="ly-follow-chat-head">
        <div>
          <p class="ly-follow-chat-kicker">深度解读 · 紫微</p>
          <h2 id="zw-follow-title">${escapeHtml(opts.person.nickname || '我')}的命盘</h2>
        </div>
        <button type="button" class="ly-follow-chat-x" data-follow-close aria-label="关闭">×</button>
      </header>
      <div class="ly-deep-sheet-tabs" role="tablist" aria-label="深度解读与边看边问">
        <button type="button" class="ly-deep-sheet-tab${startTab === 'deep' ? ' is-on' : ''}" data-deep-tab="deep" role="tab" aria-selected="${startTab === 'deep'}">深度解读</button>
        <button type="button" class="ly-deep-sheet-tab${startTab === 'ask' ? ' is-on' : ''}" data-deep-tab="ask" role="tab" aria-selected="${startTab === 'ask'}">边看边问</button>
      </div>
      <div class="ly-deep-sheet-pane" data-deep-pane="deep" ${startTab === 'ask' ? 'hidden' : ''}>
        <p class="ly-follow-chat-persona">先看完这一篇，有不清楚的再往下追问；概念题请切「边看边问」</p>
        <section class="ly-follow-deep" data-follow-deep>
          <p class="ly-follow-deep-body">${escapeHtml(deepText).replace(/\n/g, '<br>')}</p>
          <button type="button" class="btn ly-btn-gold btn-sm" data-zw-deep-regen>重新生成</button>
        </section>
        ${
          opts.seedContext
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
        <div class="ly-follow-messages" data-follow-messages data-follow-qa></div>
        ${(() => {
          const modeNow = loadAiServiceMode();
          const modeHint =
            modeNow === 'mystic'
              ? `默认用 Mystic AI · ${friendlyQuotaCopy(modeNow).headline}`
              : isAiConfigured()
                ? '默认用你上次选的 AI Key'
                : '请先配置 AI Key，或改选 Mystic AI';
          const journalHint = doc?.journalId
            ? ' · 已同步到手札，可回看'
            : ' · 追问会保存在本机档案';
          return `<p class="ly-follow-ai-hint">${escapeHtml(modeHint)}${escapeHtml(journalHint)}。${
            modeNow === 'byok' && !isAiConfigured()
              ? ` <button type="button" class="ly-ask-ai-link" data-follow-ai-settings>去配置</button>`
              : ''
          }</p>`;
        })()}
        <details class="ly-follow-ctx-fold" data-follow-ctx-fold>
          <summary>补充情况（选填）· 灰字不用手删 · 点标签跳段</summary>
          ${personalContextFieldsHtml('zwf')}
        </details>
        <form class="ly-follow-composer" data-follow-form>
          <textarea class="question-input ly-follow-ask" data-follow-input rows="2" placeholder="对这篇解读继续追问…"></textarea>
          <button type="submit" class="btn ly-btn-gold" data-follow-send>发送</button>
        </form>
      </div>
      <div class="ly-deep-sheet-pane ly-deep-ask-pane" data-deep-pane="ask" ${startTab === 'deep' ? 'hidden' : ''}>
        <p class="ly-layer-guide">本页常问 · 本地释义</p>
        <div class="ly-ask-faq">
          ${faq
            .map(
              (item, i) => `
            <button type="button" class="ly-faq-link" data-faq-index="${i}">
              <span class="ly-faq-link-mark" aria-hidden="true">▸</span>
              <span class="ly-faq-link-q">${escapeHtml(item.q)}</span>
            </button>`,
            )
            .join('')}
        </div>
        <form class="ly-ask-free" data-zw-ask-form>
          <label class="visually-hidden" for="zw-ask-q">自由提问</label>
          <input id="zw-ask-q" class="question-input" type="text" placeholder="问一个概念，如：命宫是什么" data-zw-ask-input />
          <button type="submit" class="btn btn-sm">查释义</button>
        </form>
      </div>
    </div>
  `;

  const messagesEl = modal.querySelector<HTMLElement>('[data-follow-messages]')!;
  const input = modal.querySelector<HTMLTextAreaElement>('[data-follow-input]')!;
  const form = modal.querySelector<HTMLFormElement>('[data-follow-form]')!;
  const sendBtn = modal.querySelector<HTMLButtonElement>('[data-follow-send]')!;
  const ctxHost = modal.querySelector<HTMLElement>('[data-follow-ctx-fold]')!;

  const paintMessages = () => {
    const visible = history.filter(
      (t, i) => !(i === 0 && t.role === 'assistant' && t.content === deepText),
    );
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

  paintMessages();

  const close = () => {
    modal.classList.remove('is-open');
    setTimeout(() => modal.remove(), 220);
  };

  modal.querySelectorAll('[data-follow-close]').forEach((el) => {
    el.addEventListener('click', close);
  });
  modal.querySelector('[data-follow-ai-settings]')?.addEventListener('click', () => {
    openAiSettingsModal();
  });
  modal.querySelector('[data-zw-deep-regen]')?.addEventListener('click', () => {
    close();
    void import('./personalize-deep.ts').then(({ openZiweiPersonalizeDeep }) => {
      openZiweiPersonalizeDeep({
        view: opts.view,
        person: opts.person,
        question: opts.question,
      });
    });
  });

  modal.querySelectorAll<HTMLButtonElement>('[data-deep-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.deepTab === 'ask' ? 'ask' : 'deep';
      modal.querySelectorAll('[data-deep-tab]').forEach((b) => {
        const on = (b as HTMLElement).dataset.deepTab === tab;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      modal.querySelectorAll<HTMLElement>('[data-deep-pane]').forEach((pane) => {
        const on = pane.dataset.deepPane === tab;
        pane.hidden = !on;
      });
    });
  });

  const openConcept = (q: string, presetA?: string[]) => {
    const hit = answerConcept(q);
    if (!hit.hit) void recordZiweiConceptMiss(q);
    const paras = presetA?.length
      ? presetA
      : hit.answer
          .split(/\n\n+/)
          .map((s) => s.trim())
          .filter(Boolean);
    openLabConceptPeek({
      term: q,
      tabs: tabsFromParagraphs(paras.length ? paras : [hit.answer || '暂无释义']),
    });
  };

  modal.querySelectorAll<HTMLButtonElement>('[data-faq-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.faqIndex);
      const item = faq[i];
      if (!item) return;
      openConcept(item.q, item.a);
    });
  });
  modal.querySelector<HTMLFormElement>('[data-zw-ask-form]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q =
      modal.querySelector<HTMLInputElement>('[data-zw-ask-input]')?.value.trim() || '';
    if (!q) return;
    openConcept(q);
  });

  let seedOnce = opts.seedContext?.trim() || '';

  const runAsk = async (raw: string) => {
    const userAsk = raw.trim();
    if (!userAsk) return;
    const personal = readPersonalContextFrom(ctxHost, 'zwf');
    const personalLines = formatPersonalContextLines(personal);
    let withCtx = seedOnce
      ? `（对照这段：${seedOnce.slice(0, 200)}）\n${userAsk}`
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
      const turns: ZiweiAiDeepTurn[] = [
        { role: 'user', content: userAsk, at: new Date().toISOString() },
        { role: 'assistant', content: answer, at: new Date().toISOString() },
      ];
      appendZiweiAiDeepTurns(opts.person.id, turns);
      const link = loadZiweiAiDeepDoc(opts.person.id);
      if (link?.journalId) {
        appendZiweiAiTurns(link.journalId, link.sessionId, [
          { role: 'user', content: userAsk },
          { role: 'assistant', content: answer },
        ]);
      }
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
