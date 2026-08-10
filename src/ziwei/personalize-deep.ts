/**
 * 紫微深度解读：补充情况 → AI 生成 → 在深度解读面板展示
 */
import type { PersonProfile } from '../life/types.ts';
import type { ZiweiChartView } from './types.ts';
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
  formatPersonalContextLines,
  hasPersonalContext,
  bindPersonalContextCard,
  personalContextFieldsHtml,
  readPersonalContextFrom,
  type PersonalContext,
} from '../liuyao/personal-context.ts';
import { answerZiweiConcept, recordZiweiConceptMiss } from './concept-ask.ts';
import { buildZiweiPageFaq } from './page-faq.ts';

const STORAGE_PREFIX = 'mystic-lab.ziwei-ai-deep.';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function storageKey(personId: string): string {
  return `${STORAGE_PREFIX}${personId}`;
}

export function loadZiweiAiDeepReading(personId: string): string | null {
  try {
    const t = localStorage.getItem(storageKey(personId))?.trim();
    return t || null;
  } catch {
    return null;
  }
}

export function saveZiweiAiDeepReading(personId: string, text: string): void {
  try {
    if (!text.trim()) localStorage.removeItem(storageKey(personId));
    else localStorage.setItem(storageKey(personId), text.trim());
  } catch {
    /* ignore */
  }
}

function buildDeepPrompt(
  view: ZiweiChartView,
  person: PersonProfile,
  question: string,
  ctx: PersonalContext,
): { system: string; user: string } {
  const soul = view.soulPalace;
  const majors = soul.majors.map((s) => s.name).join('、') || '空象';
  const annual = view.theater.annual;
  const system = [
    '你是紫微斗数陪读教练，语气温暖、具体、可执行，禁止绝对吉凶判决。',
    '依据用户命盘要点与问题作答；先回应真正在问的事，再点出变量，最后给一个明天可做的一小步。',
    '约 280–420 字，口语化分段，不要套死板四段标题。',
    hasPersonalContext(ctx)
      ? '用户补充了个人情况，请贴合经历/目标/已发生/顾虑，勿复述百科。'
      : '用户未补充细节，基于问题与盘面做清晰可执行分析。',
    '',
    `【盘面】五行局 ${view.fiveElementsClass}；命宫主星 ${majors}；定调：${view.theater.headline}`,
    `【流年】${annual.year}${annual.advice ? ` · ${annual.advice.slice(0, 80)}` : ''}`,
    person.nickname ? `【档案称呼】${person.nickname}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const user = hasPersonalContext(ctx)
    ? [
        '请结合我的情况，对紫微命盘做一次更贴合的深度解读。',
        `原问题：${question.trim() || '（未填写，请按命盘与流年主题解读）'}`,
        ...formatPersonalContextLines(ctx),
      ].join('\n')
    : [
        '请基于问题与命盘，直接做一次清晰可执行的深度解读（我暂未补充更多个人细节）。',
        `原问题：${question.trim() || '（未填写，请按命盘与流年主题解读）'}`,
      ].join('\n');

  return { system, user };
}

function resultHtml(text: string): string {
  const parts = text
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return `
    <section class="ly-follow-deep-result">
      <p class="ly-layer-guide">AI 深度解读</p>
      ${parts
        .map((p) => `<p class="ly-deep-para">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
        .join('')}
      <button type="button" class="btn ly-btn-gold btn-sm" data-zw-deep-regen>重新生成</button>
    </section>`;
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

export type OpenZiweiPersonalizeDeepOpts = {
  view: ZiweiChartView;
  person: PersonProfile;
  question: string;
  /** 生成后打开深度解读面板；默认 true */
  openSheetAfter?: boolean;
};

/** 补充情况 + 生成 AI 解读 */
export function openZiweiPersonalizeDeep(opts: OpenZiweiPersonalizeDeepOpts): void {
  document.querySelector('.ly-personalize-modal')?.remove();

  const mode = loadAiServiceMode();
  const copy = friendlyQuotaCopy(mode);
  const mysticReady = isMysticAiEndpointReady();

  const modal = document.createElement('div');
  modal.className = 'ly-personalize-modal';
  modal.innerHTML = `
    <button type="button" class="ly-personalize-backdrop" data-p-close aria-label="关闭"></button>
    <div class="ly-personalize-sheet" role="dialog" aria-modal="true" aria-labelledby="zw-p-title">
      <header class="ly-personalize-head">
        <div>
          <p class="ly-personalize-kicker">深度解读 · 紫微</p>
          <h2 id="zw-p-title">想让这次解读更贴合你的实际情况？</h2>
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
          ${personalContextFieldsHtml('zw')}
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
      const { system, user } = buildDeepPrompt(opts.view, opts.person, opts.question, ctx);
      const text = await runChatCompletion(
        [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        { temperature: 0.55 },
      );
      if (modeNow === 'mystic') recordDeepUse();
      saveZiweiAiDeepReading(opts.person.id, text);
      close();
      if (opts.openSheetAfter !== false) {
        openZiweiDeepReadingEntry({
          view: opts.view,
          person: opts.person,
          question: opts.question,
          initialTab: 'deep',
        });
      }
      toast('深度解读已生成');
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
    void runAnalyze(readPersonalContextFrom(form, 'zw'));
  });
  skipBtn.addEventListener('click', () => {
    void runAnalyze({ ...EMPTY_PERSONAL_CONTEXT });
  });

  document.body.appendChild(modal);
  bindPersonalContextCard(modal);
  requestAnimationFrame(() => modal.classList.add('is-open'));
}

export type OpenZiweiDeepReadingEntryOpts = {
  view: ZiweiChartView;
  person: PersonProfile;
  question: string;
  initialTab?: 'deep' | 'ask';
};

/** 火花按钮入口：有缓存则展示；否则空态可生成；边看边问仍可用 */
export function openZiweiDeepReadingEntry(opts: OpenZiweiDeepReadingEntryOpts): void {
  const existing = loadZiweiAiDeepReading(opts.person.id);
  const startDeep = opts.initialTab ?? (existing ? 'deep' : 'ask');

  openLabDeepSheet({
    system: 'ziwei',
    title: `${opts.person.nickname || '我'}的命盘`,
    initialTab: startDeep,
    deepTabLabel: '深度解读',
    deepHint: '结合十二宫与当下问题，用 AI 做一次更贴合的解读。概念题请用「边看边问」。',
    deepPaneHtml: existing
      ? resultHtml(existing)
      : undefined,
    onDeepPaneReady: (pane) => {
      pane.querySelector('[data-zw-deep-regen]')?.addEventListener('click', () => {
        openZiweiPersonalizeDeep({
          view: opts.view,
          person: opts.person,
          question: opts.question,
        });
      });
    },
    onDeep: () => {
      openZiweiPersonalizeDeep({
        view: opts.view,
        person: opts.person,
        question: opts.question,
      });
    },
    presets: buildZiweiPageFaq(opts.view, { question: opts.question }),
    answerConcept: answerZiweiConcept,
    onMiss: (q) => {
      void recordZiweiConceptMiss(q);
    },
  });
}
