/**
 * 「想让这次解读更贴合你的情况？」
 * 底部按钮打开补充表单；可跳过直接分析，或填完再分析。
 */
import type { CastResult } from './engine.ts';
import { buildFollowupSystemPrompt, hexChangeLabel, openFollowupChat } from './followup-chat.ts';
import { buildOfflineAnswerPack } from '../mystic-engine/build-pack.ts';
import {
  canUseMysticDeep,
  friendlyQuotaCopy,
  loadAiServiceMode,
  recordDeepUse,
  saveAiServiceMode,
  type AiServiceMode,
} from '../ai/ai-mode.ts';
import { resolveAiRunReady, runChatCompletion } from '../ai/chat-runner.ts';
import { isAiConfigured } from '../ai/settings.ts';
import { openAiSettingsModal } from '../ui/ai-settings-panel.ts';
import { isMysticAiEndpointReady } from '../ai/mystic-ai-client.ts';

export type PersonalContext = {
  experience: string;
  goal: string;
  events: string;
  worry: string;
};

const EMPTY_CTX: PersonalContext = {
  experience: '',
  goal: '',
  events: '',
  worry: '',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildDeepPrompt(
  cast: CastResult,
  question: string,
  ctx: PersonalContext,
): { system: string; user: string } {
  const pack = buildOfflineAnswerPack({ question, cast, useProfile: false });
  const base = buildFollowupSystemPrompt(cast, question);
  const hasPersonal = Boolean(
    ctx.experience.trim() || ctx.goal.trim() || ctx.events.trim() || ctx.worry.trim(),
  );
  const system = [
    base,
    '',
    hasPersonal
      ? '【深度贴合模式】用户补充了个人情况。必须结合经历、目标、已发生事件与顾虑重写判断，不要复述通用卦意百科。'
      : '【快速分析】用户跳过了补充。基于原问题与盘面做一次清晰、可执行的重述，语气温暖。',
    '结构：先直接回应问题 → 说明为什么 → 一个可执行下一步 → 什么时候该停。',
    '禁止绝对吉凶判决；篇幅 280–420 字。',
    `离线一句话定调（仅作参考）：${pack.verdict.headline}`,
  ].join('\n');

  const user = hasPersonal
    ? [
        '请结合我的情况，对这卦做一次更贴合的深度解读。',
        `原问题：${question.trim() || '（未填写）'}`,
        `我的经历：${ctx.experience.trim() || '（未写）'}`,
        `当前目标：${ctx.goal.trim() || '（未写）'}`,
        `已发生事件：${ctx.events.trim() || '（未写）'}`,
        `我的真实顾虑：${ctx.worry.trim() || '（未写）'}`,
      ].join('\n')
    : [
        '请基于原问题与卦象，直接做一次清晰可执行的分析（我暂未补充更多个人细节）。',
        `原问题：${question.trim() || '（未填写）'}`,
      ].join('\n');

  return { system, user };
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
  }, 1800);
}

/** 打开「贴合你」收集 + 深度解读 */
export function openPersonalizeDeep(opts: {
  cast: CastResult;
  question: string;
  castAt?: Date;
}): void {
  document.querySelector('.ly-personalize-modal')?.remove();

  const mode = loadAiServiceMode();
  const copy = friendlyQuotaCopy(mode);
  const mysticReady = isMysticAiEndpointReady();

  const modal = document.createElement('div');
  modal.className = 'ly-personalize-modal';
  modal.innerHTML = `
    <button type="button" class="ly-personalize-backdrop" data-p-close aria-label="关闭"></button>
    <div class="ly-personalize-sheet" role="dialog" aria-modal="true" aria-labelledby="ly-p-title">
      <header class="ly-personalize-head">
        <div>
          <p class="ly-personalize-kicker">✨ 更贴合你</p>
          <h2 id="ly-p-title">补充一点情况</h2>
        </div>
        <button type="button" class="ly-personalize-x" data-p-close aria-label="关闭">×</button>
      </header>
      <p class="ly-personalize-sub">选填；也可以跳过，直接分析。${escapeHtml(copy.headline)}</p>
      <div class="ly-personalize-modes" role="radiogroup" aria-label="AI 模式">
        <label class="ly-personalize-mode ${mode === 'mystic' ? 'is-on' : ''}">
          <input type="radio" name="aiMode" value="mystic" ${mode === 'mystic' ? 'checked' : ''} />
          <span>使用 Mystic AI${mysticReady ? '' : '（即将开放）'}</span>
        </label>
        <label class="ly-personalize-mode ${mode === 'byok' ? 'is-on' : ''}">
          <input type="radio" name="aiMode" value="byok" ${mode === 'byok' ? 'checked' : ''} />
          <span>使用我的 AI Key</span>
        </label>
      </div>
      <form class="ly-personalize-form" data-p-form>
        <label class="ly-personalize-field">
          <span>你的经历 <em>选填</em></span>
          <textarea name="experience" rows="2" placeholder="比如：在这家公司待了多久、做过什么…"></textarea>
        </label>
        <label class="ly-personalize-field">
          <span>当前目标 <em>选填</em></span>
          <textarea name="goal" rows="2" placeholder="你最想达成的结果是什么？"></textarea>
        </label>
        <label class="ly-personalize-field">
          <span>已发生事件 <em>选填</em></span>
          <textarea name="events" rows="2" placeholder="最近已经发生、影响判断的事…"></textarea>
        </label>
        <label class="ly-personalize-field">
          <span>你的真实顾虑 <em>选填</em></span>
          <textarea name="worry" rows="2" placeholder="你最怕什么、最卡住的是什么？"></textarea>
        </label>
        <p class="ly-personalize-status" data-p-status hidden></p>
        <div class="ly-personalize-actions">
          <button type="submit" class="btn ly-btn-gold" data-p-submit>结合补充 · 开始分析</button>
          <button type="button" class="ly-personalize-skip" data-p-skip>跳过补充，直接分析</button>
        </div>
      </form>
    </div>
  `;

  const close = () => {
    modal.classList.remove('is-open');
    setTimeout(() => modal.remove(), 220);
  };

  modal.querySelectorAll('[data-p-close]').forEach((el) => {
    el.addEventListener('click', close);
  });

  modal.querySelectorAll<HTMLInputElement>('input[name="aiMode"]').forEach((input) => {
    input.addEventListener('change', () => {
      const next = input.value === 'mystic' ? 'mystic' : 'byok';
      saveAiServiceMode(next);
      modal.querySelectorAll('.ly-personalize-mode').forEach((lab) => {
        lab.classList.toggle('is-on', lab.querySelector('input')?.value === next);
      });
    });
  });

  const form = modal.querySelector<HTMLFormElement>('[data-p-form]')!;
  const status = modal.querySelector<HTMLElement>('[data-p-status]')!;
  const submitBtn = modal.querySelector<HTMLButtonElement>('[data-p-submit]')!;
  const skipBtn = modal.querySelector<HTMLButtonElement>('[data-p-skip]')!;

  const runAnalyze = async (ctx: PersonalContext) => {
    const selectedMode = (form.querySelector('input[name="aiMode"]:checked') as HTMLInputElement | null)
      ?.value as AiServiceMode | undefined;
    if (selectedMode) saveAiServiceMode(selectedMode);

    const modeNow = loadAiServiceMode();
    const ready = resolveAiRunReady({
      kind: 'deep',
      mysticDeepOk: canUseMysticDeep(),
    });

    if (!ready.ok) {
      status.hidden = false;
      if (ready.reason === 'mystic_soon') {
        status.textContent = isAiConfigured()
          ? 'Mystic AI 即将开放。检测到你已有自己的 Key，可改选「使用我的 AI Key」再试。'
          : 'Mystic AI 即将开放。普通用户稍后一点就用；你也可以先配置自己的 AI Key。';
        if (!isAiConfigured()) {
          openAiSettingsModal();
        }
        return;
      }
      if (ready.reason === 'need_byok') {
        status.textContent = '先接上你的 AI，就能马上重新分析。';
        openAiSettingsModal();
        return;
      }
      status.textContent = friendlyQuotaCopy(modeNow).detail;
      return;
    }

    submitBtn.disabled = true;
    skipBtn.disabled = true;
    submitBtn.textContent = '分析中…';
    status.hidden = false;
    status.textContent = ctx === EMPTY_CTX || !(ctx.experience || ctx.goal || ctx.events || ctx.worry)
      ? '正在分析…'
      : '正在结合你的情况重新分析…';

    try {
      const { system, user } = buildDeepPrompt(opts.cast, opts.question, ctx);
      const text = await runChatCompletion(
        [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        { temperature: 0.55 },
      );
      if (modeNow === 'mystic') recordDeepUse();
      close();
      const label = hexChangeLabel(opts.cast);
      openFollowupChat({
        cast: opts.cast,
        question: opts.question,
        castAt: opts.castAt,
        seedAsk: '基于刚才的深度解读，我想再确认一点…',
        seedContext: `【贴合你·深度解读｜${label}】\n${text}`,
      });
      toast(friendlyQuotaCopy().headline);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '分析失败';
      status.textContent =
        msg === 'NO_AI' ? '还需要接上 AI，才能重新分析。' : `没能完成分析：${msg}`;
      submitBtn.disabled = false;
      skipBtn.disabled = false;
      submitBtn.textContent = '结合补充 · 开始分析';
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    void runAnalyze({
      experience: String(fd.get('experience') ?? ''),
      goal: String(fd.get('goal') ?? ''),
      events: String(fd.get('events') ?? ''),
      worry: String(fd.get('worry') ?? ''),
    });
  });

  skipBtn.addEventListener('click', () => {
    void runAnalyze({ ...EMPTY_CTX });
  });

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('is-open'));
}

/** 底部主 CTA：文案 + 按钮，对齐旧版「深度解读 | 问问AI」 */
export function bindPersonalizeFab(
  root: HTMLElement,
  opts: { cast: CastResult; question: string; castAt?: Date },
): void {
  root.querySelector('[data-follow-fab]')?.remove();
  root.querySelector('[data-personalize-fab-wrap]')?.remove();
  if (root.querySelector('[data-personalize-fab]')) return;

  const wrap = document.createElement('div');
  wrap.className = 'ly-personalize-cta-wrap';
  wrap.dataset.personalizeFabWrap = '1';
  wrap.innerHTML = `
    <p class="ly-personalize-cta-lead">✨ 想让这次解读更贴合你的情况？</p>
    <button type="button" class="ly-follow-fab ly-personalize-fab" data-personalize-fab>
      深度解读 | 问问AI
    </button>
  `;
  wrap.querySelector('[data-personalize-fab]')?.addEventListener('click', () => {
    openPersonalizeDeep(opts);
  });
  root.appendChild(wrap);
}

/** @deprecated 引导卡已改为底部按钮；保留空实现以免旧调用报错 */
export function renderPersonalizeGuideHtml(): string {
  return '';
}

export function bindPersonalizeGuide(
  host: HTMLElement,
  opts: { cast: CastResult; question: string; castAt?: Date },
): void {
  bindPersonalizeFab(host, opts);
  host.querySelector('[data-personalize-open]')?.addEventListener('click', () => {
    openPersonalizeDeep(opts);
  });
}
