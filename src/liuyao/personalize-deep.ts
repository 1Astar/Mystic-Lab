/**
 * 深度解读入口（侧边 FAB）：
 * - 尚无解读 → 单框补充情况 → 生成
 * - 已有解读 → 直接打开结果 + 可追问
 */
import type { CastResult } from './engine.ts';
import { buildFollowupSystemPrompt, openFollowupChat } from './followup-chat.ts';
import { buildOfflineAnswerPack } from '../mystic-engine/build-pack.ts';
import { ICON_SPARK } from '../ui/lab-icons.ts';
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
import { loadLiuyaoJournal, saveLiuyaoAiDeepReading } from './journal.ts';
import {
  EMPTY_PERSONAL_CONTEXT,
  formatPersonalContextLines,
  hasPersonalContext,
  bindPersonalContextCard,
  personalContextFieldsHtml,
  readPersonalContextFrom,
  type PersonalContext,
} from './personal-context.ts';

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
  const personal = hasPersonalContext(ctx);
  const system = [
    base,
    '',
    personal
      ? '【深度贴合】用户补充了个人情况。请结合经历、目标、已发生事件与顾虑来回应，不要复述通用卦意百科。'
      : '【快速分析】用户跳过了补充。基于原问题与盘面做一次清晰、可执行的重述，语气温暖。',
    '先直接回应她真正在问的事，再点出值得注意的变数，最后给一个明天就能做的一小步。',
    '不要每次都套固定四段标题；口语化、分段自然即可。禁止绝对吉凶判决；约 280–420 字。',
    `离线一句话定调（仅作参考，勿照抄）：${pack.verdict.headline}`,
  ].join('\n');

  const user = personal
    ? [
        '请结合我的情况，对这卦做一次更贴合的深度解读。',
        `原问题：${question.trim() || '（未填写）'}`,
        ...formatPersonalContextLines(ctx),
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

/** 手札里最近一次深度解读 */
export function findLatestDeepReading(
  journalId?: string | null,
): { text: string; sessionId: string } | null {
  if (!journalId) return null;
  const entry = loadLiuyaoJournal().find((e) => e.id === journalId);
  const sessions = entry?.aiSessions ?? [];
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i]!;
    const text = s.deepReading?.trim();
    if (text) return { text, sessionId: s.id };
  }
  return null;
}

/** 打开深度解读：补充情况 + 生成解读 + 可追问 */
export function openPersonalizeDeep(opts: {
  cast: CastResult;
  question: string;
  castAt?: Date;
  journalId?: string | null;
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
          <p class="ly-personalize-kicker">深度解读</p>
          <h2 id="ly-p-title">想让这卦更贴合你的实际情况？</h2>
        </div>
        <button type="button" class="ly-personalize-x" data-p-close aria-label="关闭">×</button>
      </header>
      <p class="ly-personalize-sub">选填；灰字是提示，开写就消，点上方标签可跳到对应段。不写也能分析。${escapeHtml(copy.headline)}</p>
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
        <div class="ly-personalize-field ly-personalize-field-merged">
          <span>补充情况 <em>选填</em></span>
          ${personalContextFieldsHtml('p')}
        </div>
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
    const selectedMode = (
      form.querySelector('input[name="aiMode"]:checked') as HTMLInputElement | null
    )?.value as AiServiceMode | undefined;
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
        if (!isAiConfigured()) openAiSettingsModal();
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
    status.textContent = hasPersonalContext(ctx)
      ? '正在结合你的情况重新分析…'
      : '正在分析…';

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
      const sessionId = opts.journalId
        ? saveLiuyaoAiDeepReading(opts.journalId, text)
        : null;
      openFollowupChat({
        cast: opts.cast,
        question: opts.question,
        castAt: opts.castAt,
        journalId: opts.journalId,
        aiSessionId: sessionId,
        initialAssistant: text,
      });
      toast(opts.journalId ? '深度解读已写入 · 可继续追问' : '深度解读已生成 · 可继续追问');
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
    void runAnalyze(readPersonalContextFrom(form, 'p'));
  });

  skipBtn.addEventListener('click', () => {
    void runAnalyze({ ...EMPTY_PERSONAL_CONTEXT });
  });

  document.body.appendChild(modal);
  bindPersonalContextCard(modal);
  requestAnimationFrame(() => {
    modal.classList.add('is-open');
  });
}

/** 有深度解读则直接展示；否则打开悬浮窗（可先边看边问，再生成深度） */
export function openDeepReadingEntry(opts: {
  cast: CastResult;
  question: string;
  castAt?: Date;
  journalId?: string | null;
}): void {
  const existing = findLatestDeepReading(opts.journalId);
  if (existing) {
    openFollowupChat({
      cast: opts.cast,
      question: opts.question,
      castAt: opts.castAt,
      journalId: opts.journalId,
      aiSessionId: existing.sessionId,
      initialAssistant: existing.text,
    });
    return;
  }
  openFollowupChat({
    cast: opts.cast,
    question: opts.question,
    castAt: opts.castAt,
    journalId: opts.journalId,
    initialTab: 'ask',
  });
}

/** 结果页右侧 AI 入口 */
export function bindPersonalizeFab(
  root: HTMLElement,
  opts: { cast: CastResult; question: string; castAt?: Date; journalId?: string | null },
): void {
  root.querySelector('[data-follow-fab]')?.remove();
  root.querySelector('[data-personalize-fab-wrap]')?.remove();
  document.querySelectorAll('[data-ly-ai-fab]').forEach((el) => el.remove());

  const hasDeep = Boolean(findLatestDeepReading(opts.journalId));
  const hint = hasDeep
    ? '查看深度解读，还可继续追问'
    : '想让这卦更贴合你的实际情况？';
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'ly-ai-side-fab is-icon';
  fab.dataset.lyAiFab = '1';
  fab.dataset.personalizeFab = '1';
  fab.title = hint;
  fab.setAttribute('aria-label', hint);
  fab.innerHTML = ICON_SPARK;
  fab.addEventListener('click', () => {
    openDeepReadingEntry(opts);
  });

  const app = document.querySelector('#app') || document.body;
  app.appendChild(fab);
}

/** @deprecated 引导卡已改为 FAB */
export function renderPersonalizeGuideHtml(): string {
  return '';
}

export function bindPersonalizeGuide(
  host: HTMLElement,
  opts: { cast: CastResult; question: string; castAt?: Date; journalId?: string | null },
): void {
  bindPersonalizeFab(host, opts);
  host.querySelector('[data-personalize-open]')?.addEventListener('click', () => {
    openDeepReadingEntry(opts);
  });
}
