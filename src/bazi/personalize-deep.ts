/**
 * 八字深度解读：补充情况 → AI 生成 → 深度解读 / 多轮追问（对齐紫微入口 + 六爻追问）
 */
import type { PersonProfile } from '../life/types.ts';
import type { BaziChart } from './cast.ts';
import type { LuckCycles } from './luck-cycles.ts';
import { buildBaziDeepPrompt } from './deep-prompt.ts';
import { answerBaziConcept, recordBaziConceptMiss } from './concept-ask.ts';
import { buildBaziPageFaq } from './page-faq.ts';
import {
  loadBaziAiDeepReading,
  saveBaziAiDeepReading,
} from './ai-deep-store.ts';
import { openBaziFollowupChat } from './followup-chat.ts';
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

export type OpenBaziPersonalizeDeepOpts = {
  chart: BaziChart;
  person: PersonProfile;
  question: string;
  luck?: LuckCycles | null;
  headline?: string;
  /** 概念答问可覆盖（排盘页带 luck 深答） */
  answerConcept?: (q: string) => { answer: string; hit: boolean };
  answerDeep?: (q: string) => { answer: string; hit: boolean };
  openSheetAfter?: boolean;
};

/** 补充情况 + 生成 AI 解读 */
export function openBaziPersonalizeDeep(opts: OpenBaziPersonalizeDeepOpts): void {
  document.querySelector('.ly-personalize-modal')?.remove();

  const mode = loadAiServiceMode();
  const copy = friendlyQuotaCopy(mode);
  const mysticReady = isMysticAiEndpointReady();

  const modal = document.createElement('div');
  modal.className = 'ly-personalize-modal';
  modal.innerHTML = `
    <button type="button" class="ly-personalize-backdrop" data-p-close aria-label="关闭"></button>
    <div class="ly-personalize-sheet" role="dialog" aria-modal="true" aria-labelledby="bz-p-title">
      <header class="ly-personalize-head">
        <div>
          <p class="ly-personalize-kicker">深度解读 · 八字</p>
          <h2 id="bz-p-title">想让这次解读更贴合你的实际情况？</h2>
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
          ${personalContextFieldsHtml('bz')}
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
      const { system, user } = buildBaziDeepPrompt({
        chart: opts.chart,
        person: opts.person,
        question: opts.question,
        ctx,
        luck: opts.luck,
        headline: opts.headline,
      });
      const text = await runChatCompletion(
        [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        { temperature: 0.55 },
      );
      if (modeNow === 'mystic') recordDeepUse();
      saveBaziAiDeepReading(opts.person.id, text);
      close();
      if (opts.openSheetAfter !== false) {
        openBaziDeepReadingEntry({
          chart: opts.chart,
          person: opts.person,
          question: opts.question,
          luck: opts.luck,
          headline: opts.headline,
          answerConcept: opts.answerConcept,
          answerDeep: opts.answerDeep,
          initialTab: 'deep',
        });
      }
      toast('深度解读已生成 · 可继续追问');
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
    void runAnalyze(readPersonalContextFrom(form, 'bz'));
  });
  skipBtn.addEventListener('click', () => {
    void runAnalyze({ ...EMPTY_PERSONAL_CONTEXT });
  });

  document.body.appendChild(modal);
  bindPersonalContextCard(modal);
  requestAnimationFrame(() => modal.classList.add('is-open'));
}

export type OpenBaziDeepReadingEntryOpts = {
  chart: BaziChart;
  person: PersonProfile;
  question: string;
  luck?: LuckCycles | null;
  headline?: string;
  initialTab?: 'deep' | 'ask';
  seedQuery?: string;
  answerConcept?: (q: string) => { answer: string; hit: boolean };
  answerDeep?: (q: string) => { answer: string; hit: boolean };
};

/** 火花入口：有深度解读 → 多轮追问；否则空态可生成；边看边问仍可用 */
export function openBaziDeepReadingEntry(opts: OpenBaziDeepReadingEntryOpts): void {
  const existing = loadBaziAiDeepReading(opts.person.id);
  const answerConcept = opts.answerConcept ?? answerBaziConcept;

  const openPersonalize = () => {
    openBaziPersonalizeDeep({
      chart: opts.chart,
      person: opts.person,
      question: opts.question,
      luck: opts.luck,
      headline: opts.headline,
      answerConcept: opts.answerConcept,
      answerDeep: opts.answerDeep,
    });
  };

  if (existing && opts.initialTab !== 'ask') {
    openBaziFollowupChat({
      chart: opts.chart,
      person: opts.person,
      question: opts.question,
      luck: opts.luck,
      headline: opts.headline,
      deepReading: existing,
      initialTab: 'deep',
      seedAsk: opts.seedQuery,
      answerConcept: opts.answerConcept,
      answerDeep: opts.answerDeep,
    });
    return;
  }

  if (existing && opts.initialTab === 'ask') {
    openBaziFollowupChat({
      chart: opts.chart,
      person: opts.person,
      question: opts.question,
      luck: opts.luck,
      headline: opts.headline,
      deepReading: existing,
      initialTab: 'ask',
      seedAsk: opts.seedQuery,
      answerConcept: opts.answerConcept,
      answerDeep: opts.answerDeep,
    });
    return;
  }

  openLabDeepSheet({
    system: 'bazi',
    title: `${opts.person.nickname || '我'}的命盘`,
    initialTab: opts.initialTab ?? 'ask',
    seedQuery: opts.seedQuery,
    deepTabLabel: '深度解读',
    deepHint:
      '结合四柱、日主强弱与大运流年，用 AI 做一次更贴合的解读。生成后可多轮追问。概念题请用「边看边问」。',
    onDeep: openPersonalize,
    presets: buildBaziPageFaq(opts.chart, { question: opts.question }),
    answerConcept,
    answerDeep: opts.answerDeep,
    onMiss: (q) => {
      void recordBaziConceptMiss(q);
    },
  });
}

/** 供测试 / 其他模块复用 */
export { loadBaziAiDeepReading, saveBaziAiDeepReading } from './ai-deep-store.ts';
