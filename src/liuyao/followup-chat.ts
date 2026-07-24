/**
 * 结果页追问 AI：固定陪读人设 + 预设快问 + 聊天弹层
 */
import type { CastResult } from './engine.ts';
import { detectSceneDomain } from './scene-map.ts';
import { buildDirectReading } from './direct-reading.ts';
import { isAiConfigured, loadAiSettings } from '../ai/settings.ts';
import { openAiSettingsModal } from '../ui/ai-settings-panel.ts';
import { answerAndStoreAsk } from './ask-answer.ts';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 风水涣变巽 / 风水涣（无变） */
export function hexChangeLabel(cast: CastResult): string {
  if (cast.changed) {
    const short =
      cast.changed.fullName === cast.changed.name || cast.changed.name.length === 1
        ? cast.changed.fullName
        : cast.changed.name;
    return `${cast.primary.fullName}变${short}`;
  }
  return cast.primary.fullName;
}

/** 定死的前置上下文（按本卦名注入） */
export function buildFollowupSystemPrompt(cast: CastResult, question: string): string {
  const label = hexChangeLabel(cast);
  const direct = buildDirectReading(cast, question);
  return [
    `你知道这个卦叫「${label}」。`,
    '你是一个懂女性主义、懂现代职业规划的陪读——不是算命摊判官，也不替用户做人生决定。',
    '说话像靠谱朋友：先给可执行建议，再轻轻对照卦象；避免恐吓、宿命论、性别刻板印象。',
    '若涉及去留/薪资/权力不对等：优先谈边界、书面确认、两手准备与身体感受，不鼓励为「忍」而自我消耗。',
    `用户原占问题：${question.trim() || '（未填写）'}`,
    `本卦：${cast.primary.fullName}（${cast.primary.keywords.join('、')}）；变卦：${cast.changed?.fullName ?? '无'}（${cast.changed?.keywords.join('、') ?? '—'}）；动爻：${cast.changingIndexes.length ? cast.changingIndexes.map((i) => ['初', '二', '三', '四', '五', '上'][i] + '爻').join('、') : '无'}。`,
    `系统已给的核心判词：${direct.verdict}`,
    '回答用「你」；150–280 字为宜；可分点；结尾可给一个很小的下一步。',
  ].join('\n');
}

export function buildFollowupPresets(cast: CastResult, question: string): string[] {
  const domain = detectSceneDomain(question);
  const changed = cast.changed?.name ?? cast.primary.name;
  const money = question.match(/(\d+\s*[kK]|[\d一二三四五六七八九十百]+万?)/)?.[1];

  if (domain === 'career' || /留|离职|薪|转正|offer|工作/.test(question)) {
    const salary = money ? money.replace(/\s/g, '') : '目标薪资';
    return [
      `如果我非要留下来争取${salary}，最好的策略是什么？`,
      '如果我现在投简历，大概要多久能拿到合适的 Offer？',
      `卦象说变卦是${changed}，是不是代表我留下来会被人拿捏？`,
    ];
  }
  if (domain === 'love') {
    return [
      '如果我还想继续这段关系，最稳妥的沟通方式是什么？',
      '卦象里「变」的部分，是不是在提醒我对方态度不稳？',
      '我怎样设边界，又不把自己弄得更累？',
    ];
  }
  return [
    `对照「${hexChangeLabel(cast)}」，我现在最该先做哪一件小事？`,
    '如果局势继续拖着，我怎样判断该加码还是该撤？',
    `变卦偏「${changed}」，对我意味着什么？会不会被拖着走？`,
  ];
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

async function chatFollowup(
  system: string,
  history: ChatTurn[],
  userAsk: string,
): Promise<string> {
  if (!isAiConfigured()) {
    throw new Error('NO_AI');
  }
  const settings = loadAiSettings();
  const baseUrl = settings.baseUrl.replace(/\/$/, '');
  const messages = [
    { role: 'system', content: system },
    ...history.map((t) => ({ role: t.role, content: t.content })),
    { role: 'user', content: userAsk },
  ];
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: 0.55,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`AI 请求失败 (${res.status})`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim() ?? '';
  if (!text) throw new Error('AI 返回为空');
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
    setTimeout(() => el.remove(), 280);
  }, 1600);
}

/** 打开追问聊天弹层 */
export function openFollowupChat(opts: {
  cast: CastResult;
  question: string;
  castAt?: Date;
  seedAsk?: string;
  seedContext?: string;
}): void {
  document.querySelector('.ly-follow-chat')?.remove();

  const { cast, question } = opts;
  const castAt = opts.castAt ?? new Date();
  const system = buildFollowupSystemPrompt(cast, question);
  const presets = buildFollowupPresets(cast, question);
  const label = hexChangeLabel(cast);
  const history: ChatTurn[] = [];

  const modal = document.createElement('div');
  modal.className = 'ly-follow-chat';
  modal.innerHTML = `
    <button type="button" class="ly-follow-chat-backdrop" data-follow-close aria-label="关闭"></button>
    <div class="ly-follow-chat-sheet" role="dialog" aria-modal="true" aria-labelledby="ly-follow-title">
      <header class="ly-follow-chat-head">
        <div>
          <p class="ly-follow-chat-kicker">追问陪读</p>
          <h2 id="ly-follow-title">「${escapeHtml(label)}」</h2>
        </div>
        <button type="button" class="ly-follow-chat-x" data-follow-close aria-label="关闭">×</button>
      </header>
      <p class="ly-follow-chat-persona">懂女性主义 · 懂现代职业规划 · 陪你把卦译回现实</p>
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
      <div class="ly-follow-messages" data-follow-messages></div>
      ${
        isAiConfigured()
          ? ''
          : `<p class="ly-follow-ai-hint">未配置 AI 时用规则短答。<button type="button" class="ly-ask-ai-link" data-follow-ai-settings>去配置</button></p>`
      }
      <form class="ly-follow-composer" data-follow-form>
        <textarea class="question-input" data-follow-input rows="2" placeholder="继续追问…"></textarea>
        <button type="submit" class="btn ly-btn-gold" data-follow-send>发送</button>
      </form>
    </div>
  `;

  const messagesEl = modal.querySelector<HTMLElement>('[data-follow-messages]')!;
  const input = modal.querySelector<HTMLTextAreaElement>('[data-follow-input]')!;
  const form = modal.querySelector<HTMLFormElement>('[data-follow-form]')!;
  const sendBtn = modal.querySelector<HTMLButtonElement>('[data-follow-send]')!;

  const paintMessages = () => {
    messagesEl.innerHTML = history
      .map(
        (t) => `
      <div class="ly-follow-bubble is-${t.role}">
        <p>${escapeHtml(t.content).replace(/\n/g, '<br>')}</p>
      </div>`,
      )
      .join('');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

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

  let seedOnce = opts.seedContext?.trim() || '';

  const runAsk = async (raw: string) => {
    const userAsk = raw.trim();
    if (!userAsk) return;
    const withCtx = seedOnce
      ? `（对照这段解读：${seedOnce.slice(0, 200)}）\n${userAsk}`
      : userAsk;
    seedOnce = '';

    history.push({ role: 'user', content: userAsk });
    paintMessages();
    input.value = '';
    sendBtn.disabled = true;
    sendBtn.textContent = '…';

    const thinking = document.createElement('div');
    thinking.className = 'ly-follow-bubble is-assistant is-thinking';
    thinking.innerHTML = '<p>陪读正在想…</p>';
    messagesEl.appendChild(thinking);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      let answer: string;
      if (isAiConfigured()) {
        try {
          answer = await chatFollowup(system, history.slice(0, -1), withCtx);
        } catch {
          const fallback = await answerAndStoreAsk({
            cast,
            question,
            userAsk: withCtx,
            castAt,
          });
          answer = fallback.answer;
        }
      } else {
        const fallback = await answerAndStoreAsk({
          cast,
          question,
          userAsk: withCtx,
          castAt,
        });
        answer = fallback.hint ? `${fallback.answer}\n\n（${fallback.hint}）` : fallback.answer;
      }
      thinking.remove();
      history.push({ role: 'assistant', content: answer });
      paintMessages();
    } catch (err) {
      thinking.remove();
      history.pop();
      paintMessages();
      const msg = err instanceof Error ? err.message : '提问失败';
      toast(msg === 'NO_AI' ? '请先配置 AI' : msg);
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
      void runAsk(btn.textContent ?? '');
    });
  });

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('is-open'));
  if (opts.seedAsk) void runAsk(opts.seedAsk);
  else input.focus();
}

function blockText(el: HTMLElement): string {
  return (el.innerText || el.textContent || '').replace(/\s+\n/g, '\n').trim();
}

/** 滑动露出「复制 / 追问」；也可点浮动按钮 */
export function bindFollowupGestures(
  root: HTMLElement,
  opts: { cast: CastResult; question: string; castAt?: Date },
): void {
  if (root.dataset.followBound === '1') return;
  root.dataset.followBound = '1';

  const targets = root.querySelectorAll<HTMLElement>(
    '[data-briefing-section], .ly-briefing-quote, .ly-quick-verdict-quote, .ly-result-panel',
  );

  targets.forEach((el) => {
    if (el.dataset.swipeReady === '1') return;
    el.dataset.swipeReady = '1';
    el.classList.add('ly-swipe-ask');

    const actions = document.createElement('div');
    actions.className = 'ly-swipe-ask-actions';
    actions.innerHTML = `
      <button type="button" class="ly-swipe-ask-btn" data-swipe-copy>复制</button>
      <button type="button" class="ly-swipe-ask-btn is-ask" data-swipe-ask>追问 AI</button>
    `;
    el.appendChild(actions);

    let startX = 0;
    let startY = 0;
    let open = false;

    const setOpen = (v: boolean) => {
      open = v;
      el.classList.toggle('is-swiped', v);
    };

    el.addEventListener(
      'touchstart',
      (e) => {
        const t = e.changedTouches[0];
        if (!t) return;
        startX = t.clientX;
        startY = t.clientY;
      },
      { passive: true },
    );

    el.addEventListener(
      'touchend',
      (e) => {
        const t = e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        if (dx < 0) setOpen(true);
        else setOpen(false);
      },
      { passive: true },
    );

    actions.querySelector('[data-swipe-copy]')?.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const ok = await copyText(blockText(el));
      toast(ok ? '已复制' : '复制失败');
      setOpen(false);
    });

    actions.querySelector('[data-swipe-ask]')?.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const ctx = blockText(el);
      openFollowupChat({
        cast: opts.cast,
        question: opts.question,
        castAt: opts.castAt,
        seedContext: ctx,
      });
      setOpen(false);
    });
  });

  if (!root.querySelector('[data-follow-fab]')) {
    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'ly-follow-fab';
    fab.dataset.followFab = '1';
    fab.textContent = '追问 AI';
    fab.addEventListener('click', () => {
      openFollowupChat({
        cast: opts.cast,
        question: opts.question,
        castAt: opts.castAt,
      });
    });
    root.appendChild(fab);
  }
}
