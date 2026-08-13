/**
 * 小六壬深度解读：补充情况 → AI 生成 → 深度解读 / 多轮追问
 * 主存手札 aiSessions（journalId）；对标八字入口 + 六爻落库。
 */
import type { LessonResult } from './engine.ts';
import { buildAiReading } from './interpret.ts';
import { sixGodOneLiner } from './six-gods.ts';
import {
  loadXiaoliurenJournal,
  saveXiaoliurenAiDeepReading,
} from './journal.ts';
import {
  answerXiaoliurenConcept,
  buildXiaoliurenPageFaq,
  openXiaoliurenFollowupChat,
} from './followup-chat.ts';
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
import { isMysticAiEndpointReady } from '../ai/mystic-ai-client.ts';
import { openAiSettingsModal } from '../ui/ai-settings-panel.ts';
import { openLabDeepSheet } from '../ui/lab-deep-sheet.ts';
import {
  EMPTY_PERSONAL_CONTEXT,
  bindPersonalContextCard,
  formatPersonalContextLines,
  hasPersonalContext,
  personalContextFieldsHtml,
  readPersonalContextFrom,
  type PersonalContext,
} from '../liuyao/personal-context.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

export function buildXiaoliurenDeepPrompt(opts: {
  lesson: LessonResult;
  question: string;
  summary?: string;
  ctx: PersonalContext;
}): { system: string; user: string } {
  const god = opts.lesson.result;
  const reading = buildAiReading(opts.question, god);
  const summary = opts.summary?.trim() || sixGodOneLiner(god);
  const personal = hasPersonalContext(opts.ctx);
  const system = [
    '你是小六壬陪读助手：坚定温柔，把六神落课译回用户的现实选择。',
    `落课六神：${god.name}`,
    `一句话：${summary}`,
    `传统含义：${reading.meaning}`,
    `结合问题的本地草稿：${reading.analysis}`,
    `行动建议草稿：${reading.suggestion}`,
    `提醒：${reading.reflection}`,
    '',
    personal
      ? '【深度贴合】用户补充了个人情况。请结合经历、目标、已发生事件与顾虑来回应，不要复述通用六神百科。'
      : '【快速分析】用户跳过了补充。基于原问题与落课做一次清晰、可执行的重述，语气温暖。',
    '先直接回应她真正在问的事，再点出值得注意的变数，最后给一个明天就能做的一小步。',
    '不要每次都套固定四段标题；口语化、分段自然即可。禁止绝对吉凶判决；约 280–420 字。',
  ].join('\n');

  const user = personal
    ? [
        '请结合我的情况，对这次小六壬落课做一次更贴合的深度解读。',
        `原问题：${opts.question.trim() || '（未填写）'}`,
        `落课：${god.name}`,
        ...formatPersonalContextLines(opts.ctx),
      ].join('\n')
    : [
        '请基于原问题与落课六神，直接做一次清晰可执行的分析（我暂未补充更多个人细节）。',
        `原问题：${opts.question.trim() || '（未填写）'}`,
        `落课：${god.name} · ${summary}`,
      ].join('\n');

  return { system, user };
}

/** 手札里最近一次深度解读 */
export function findLatestXiaoliurenDeepReading(
  journalId?: string | null,
): { text: string; sessionId: string; priorTurns: Array<{ role: 'user' | 'assistant'; content: string }> } | null {
  if (!journalId) return null;
  const entry = loadXiaoliurenJournal().find((e) => e.id === journalId);
  const sessions = entry?.aiSessions ?? [];
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i]!;
    const text = s.deepReading?.trim();
    if (!text) continue;
    const priorTurns = s.turns
      .filter((t) => t.content.trim() && !(t.role === 'assistant' && t.content.trim() === text))
      .map((t) => ({ role: t.role, content: t.content }));
    return { text, sessionId: s.id, priorTurns };
  }
  return null;
}

export type OpenXiaoliurenPersonalizeDeepOpts = {
  lesson: LessonResult;
  question: string;
  summary?: string;
  journalId?: string | null;
  openSheetAfter?: boolean;
};

/** 补充情况 + 生成 AI 解读 */
export function openXiaoliurenPersonalizeDeep(opts: OpenXiaoliurenPersonalizeDeepOpts): void {
  void import('../styles/liuyao.css');
  document.querySelector('.ly-personalize-modal')?.remove();

  const mode = loadAiServiceMode();
  const copy = friendlyQuotaCopy(mode);
  const mysticReady = isMysticAiEndpointReady();

  const modal = document.createElement('div');
  modal.className = 'ly-personalize-modal';
  modal.innerHTML = `
    <button type="button" class="ly-personalize-backdrop" data-p-close aria-label="关闭"></button>
    <div class="ly-personalize-sheet" role="dialog" aria-modal="true" aria-labelledby="xlr-p-title">
      <header class="ly-personalize-head">
        <div>
          <p class="ly-personalize-kicker">深度解读 · 小六壬</p>
          <h2 id="xlr-p-title">想让这次落课更贴合你的实际情况？</h2>
        </div>
        <button type="button" class="ly-personalize-x" data-p-close aria-label="关闭">×</button>
      </header>
      <p class="ly-personalize-sub">选填；不写也能分析。${escapeHtml(copy.headline)}</p>
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
          ${personalContextFieldsHtml('xlr')}
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
          : 'Mystic AI 即将开放。也可先配置自己的 AI Key。';
        if (!isAiConfigured()) openAiSettingsModal();
        return;
      }
      if (ready.reason === 'need_byok') {
        status.textContent = '先接上你的 AI，就能马上分析。';
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
      const { system, user } = buildXiaoliurenDeepPrompt({
        lesson: opts.lesson,
        question: opts.question,
        summary: opts.summary,
        ctx,
      });
      const text = await runChatCompletion(
        [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        { temperature: 0.55 },
      );
      if (modeNow === 'mystic') recordDeepUse();
      const sessionId = opts.journalId
        ? saveXiaoliurenAiDeepReading(opts.journalId, text)
        : null;
      close();
      if (opts.openSheetAfter !== false) {
        openXiaoliurenFollowupChat({
          lesson: opts.lesson,
          question: opts.question,
          summary: opts.summary,
          journalId: opts.journalId,
          aiSessionId: sessionId,
          deepReading: text,
          initialTab: 'deep',
        });
      }
      if (opts.journalId && sessionId) {
        toast('深度解读已写入手札 · 可继续追问');
      } else if (!opts.journalId) {
        toast('深度解读已生成 · 未写入手札');
      } else {
        toast('深度解读已生成 · 可继续追问');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '分析失败';
      status.textContent =
        msg === 'NO_AI' ? '还需要接上 AI，才能分析。' : `没能完成分析：${msg}`;
      submitBtn.disabled = false;
      skipBtn.disabled = false;
      submitBtn.textContent = '结合补充 · 开始分析';
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void runAnalyze(readPersonalContextFrom(form, 'xlr'));
  });
  skipBtn.addEventListener('click', () => {
    void runAnalyze({ ...EMPTY_PERSONAL_CONTEXT });
  });

  document.body.appendChild(modal);
  bindPersonalContextCard(modal);
  requestAnimationFrame(() => modal.classList.add('is-open'));
}

export type OpenXiaoliurenDeepReadingEntryOpts = {
  lesson: LessonResult;
  question: string;
  summary?: string;
  journalId?: string | null;
  initialTab?: 'deep' | 'ask';
  seedQuery?: string;
};

/** 火花入口：有深度解读 → 多轮追问；否则空态可生成；边看边问仍可用 */
export function openXiaoliurenDeepReadingEntry(
  opts: OpenXiaoliurenDeepReadingEntryOpts,
): void {
  void import('../styles/liuyao.css');
  const existing = findLatestXiaoliurenDeepReading(opts.journalId);

  const openPersonalize = () => {
    if (!opts.journalId) {
      toast('未写入手札 · 解读仅保留在本机会话');
    }
    openXiaoliurenPersonalizeDeep({
      lesson: opts.lesson,
      question: opts.question,
      summary: opts.summary,
      journalId: opts.journalId,
    });
  };

  if (existing && opts.initialTab !== 'ask') {
    openXiaoliurenFollowupChat({
      lesson: opts.lesson,
      question: opts.question,
      summary: opts.summary,
      journalId: opts.journalId,
      aiSessionId: existing.sessionId,
      deepReading: existing.text,
      priorTurns: existing.priorTurns,
      initialTab: 'deep',
      seedAsk: opts.seedQuery,
    });
    return;
  }

  if (existing && opts.initialTab === 'ask') {
    openXiaoliurenFollowupChat({
      lesson: opts.lesson,
      question: opts.question,
      summary: opts.summary,
      journalId: opts.journalId,
      aiSessionId: existing.sessionId,
      deepReading: existing.text,
      priorTurns: existing.priorTurns,
      initialTab: 'ask',
      seedAsk: opts.seedQuery,
    });
    return;
  }

  openLabDeepSheet({
    system: 'xiaoliuren',
    title: `「${opts.lesson.result.name}」落课`,
    initialTab: opts.initialTab ?? 'ask',
    seedQuery: opts.seedQuery,
    deepTabLabel: '深度解读',
    deepHint:
      '结合落课六神与你的问题，用 AI 做一次更贴合的解读。生成后可多轮追问。概念题请用「边看边问」。',
    onDeep: openPersonalize,
    presets: buildXiaoliurenPageFaq(opts.lesson, { question: opts.question }),
    answerConcept: answerXiaoliurenConcept,
  });
}

export { answerXiaoliurenConcept, buildXiaoliurenPageFaq } from './followup-chat.ts';
