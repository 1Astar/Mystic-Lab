/**
 * 塔罗深度解读：补充情况 → AI 生成 → 深度解读 / 多轮追问（对齐六爻 journalId 挂载）
 */
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
import {
  getJournalEntryById,
  saveTarotAiDeepReading,
} from '../journal/records.ts';
import { openAiSettingsModal } from '../ui/ai-settings-panel.ts';
import { openLabDeepSheet } from '../ui/lab-deep-sheet.ts';
import {
  EMPTY_PERSONAL_CONTEXT,
  hasPersonalContext,
  bindPersonalContextCard,
  personalContextFieldsHtml,
  readPersonalContextFrom,
  type PersonalContext,
} from '../liuyao/personal-context.ts';
import {
  buildTarotDeepPrompt,
  spreadLabel,
  type TarotReadingContext,
} from './deep-prompt.ts';
import { openTarotFollowupChat } from './followup-chat.ts';

export type { TarotCardSnap, TarotReadingContext } from './deep-prompt.ts';
export {
  buildTarotDeepPrompt,
  buildTarotFollowupPresets,
  buildTarotFollowupSystemPrompt,
} from './deep-prompt.ts';

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

/** 手札里最近一次深度解读 */
export function findLatestTarotDeepReading(
  journalId?: string | null,
): { text: string; sessionId: string } | null {
  if (!journalId) return null;
  const entry = getJournalEntryById(journalId);
  const sessions = entry?.aiSessions ?? [];
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i]!;
    const text = s.deepReading?.trim();
    if (text) return { text, sessionId: s.id };
  }
  return null;
}

export type OpenTarotPersonalizeDeepOpts = TarotReadingContext & {
  journalId?: string | null;
  openSheetAfter?: boolean;
};

/** 补充情况 + 生成 AI 解读 */
export function openTarotPersonalizeDeep(opts: OpenTarotPersonalizeDeepOpts): void {
  document.querySelector('.ly-personalize-modal')?.remove();

  const mode = loadAiServiceMode();
  const copy = friendlyQuotaCopy(mode);
  const mysticReady = isMysticAiEndpointReady();

  const modal = document.createElement('div');
  modal.className = 'ly-personalize-modal';
  modal.innerHTML = `
    <button type="button" class="ly-personalize-backdrop" data-p-close aria-label="关闭"></button>
    <div class="ly-personalize-sheet" role="dialog" aria-modal="true" aria-labelledby="tr-p-title">
      <header class="ly-personalize-head">
        <div>
          <p class="ly-personalize-kicker">深度解读 · 塔罗</p>
          <h2 id="tr-p-title">想让这次抽牌更贴合你的实际情况？</h2>
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
          ${personalContextFieldsHtml('tr')}
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
      const { system, user } = buildTarotDeepPrompt(opts, ctx);
      const text = await runChatCompletion(
        [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        { temperature: 0.55 },
      );
      if (modeNow === 'mystic') recordDeepUse();
      const sessionId = opts.journalId
        ? saveTarotAiDeepReading(opts.journalId, text)
        : null;
      close();
      if (opts.openSheetAfter !== false) {
        openTarotFollowupChat({
          ...opts,
          journalId: opts.journalId,
          aiSessionId: sessionId,
          initialAssistant: text,
          initialTab: 'deep',
        });
      }
      toast(
        opts.journalId
          ? '深度解读已写入手札 · 可继续追问'
          : '深度解读已生成 · 可继续追问',
      );
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
    void runAnalyze(readPersonalContextFrom(form, 'tr'));
  });
  skipBtn.addEventListener('click', () => {
    void runAnalyze({ ...EMPTY_PERSONAL_CONTEXT });
  });

  document.body.appendChild(modal);
  bindPersonalContextCard(modal);
  requestAnimationFrame(() => modal.classList.add('is-open'));
}

export type OpenTarotDeepReadingEntryOpts = TarotReadingContext & {
  journalId?: string | null;
  initialTab?: 'deep' | 'ask';
  seedQuery?: string;
};

function readingCtxFromOpts(opts: OpenTarotDeepReadingEntryOpts): TarotReadingContext {
  return {
    question: opts.question,
    spreadType: opts.spreadType,
    cards: opts.cards,
    summary: opts.summary,
    learningNote: opts.learningNote,
    readingSnapshot: opts.readingSnapshot,
  };
}

/** 火花入口：有深度解读 → 多轮追问；否则空态可生成；边看边问仍可用 */
export function openTarotDeepReadingEntry(opts: OpenTarotDeepReadingEntryOpts): void {
  const existing = findLatestTarotDeepReading(opts.journalId);
  const ctx = readingCtxFromOpts(opts);

  if (existing) {
    openTarotFollowupChat({
      ...ctx,
      journalId: opts.journalId,
      aiSessionId: existing.sessionId,
      initialAssistant: existing.text,
      initialTab: opts.initialTab === 'ask' ? 'ask' : 'deep',
      seedAsk: opts.seedQuery,
    });
    return;
  }

  if (opts.initialTab === 'ask') {
    openTarotFollowupChat({
      ...ctx,
      journalId: opts.journalId,
      initialTab: 'ask',
      seedAsk: opts.seedQuery,
    });
    return;
  }

  openLabDeepSheet({
    system: 'tarot',
    title: spreadLabel(opts.spreadType),
    initialTab: 'ask',
    seedQuery: opts.seedQuery,
    deepTabLabel: '深度解读',
    deepHint:
      '结合问题、牌阵与正逆位，用 AI 做一次更贴合的解读。生成后可多轮追问，并写入本局手札。',
    onDeep: () => {
      openTarotPersonalizeDeep({
        ...ctx,
        journalId: opts.journalId,
      });
    },
    answerConcept: (q) => ({
      answer: `关于「${q}」：可对照本局牌阵位置与正逆位；词库暂无精确条时，可点「深度解读」用 AI 追问，或记到笔记。`,
      hit: false,
    }),
  });
}
