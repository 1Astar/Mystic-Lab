/**
 * 跨体系「深度解读」悬浮窗（深度解读 | 边看边问）
 * 边看边问：常问点开独立释义弹窗（小 tab）；自由提问同理。
 */
import '../styles/lab-deep-sheet.css';
import { navigate } from '../router.ts';
import { ICON_SPARK } from './lab-icons.ts';
import {
  openLabConceptPeek,
  tabsFromParagraphs,
  type LabConceptTab,
} from './lab-concept-peek.ts';

export type LabDeepSystem = 'bazi' | 'ziwei' | 'liuyao' | 'tarot' | 'xiaoliuren';

const DEEP_FALLBACK_PATH: Record<LabDeepSystem, string> = {
  bazi: '/bazi/reading?mode=chart',
  ziwei: '/ziwei/reading?mode=chart',
  liuyao: '/liuyao/reading',
  tarot: '/tarot/reading',
  xiaoliuren: '/xiaoliuren/reading',
};

export type LabAskPreset = {
  q: string;
  a: string[];
  /** 弹窗标题，缺省用问句 */
  title?: string;
  /** 弹窗小 tab；缺省由 a 分段生成 */
  tabs?: LabConceptTab[];
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPresetsHtml(presets: LabAskPreset[]): string {
  if (!presets.length) return '';
  const items = presets
    .map(
      (item, i) => `
    <button type="button" class="ly-faq-link" data-faq-index="${i}">
      <span class="ly-faq-link-mark" aria-hidden="true">▸</span>
      <span class="ly-faq-link-q">${escapeHtml(item.q)}</span>
    </button>`,
    )
    .join('');
  return `
    <div class="ly-ask-section">
      <p class="ly-layer-guide">本页常问</p>
      <div class="ly-ask-faq">${items}</div>
    </div>`;
}

export type LabDeepSheetOpts = {
  system: LabDeepSystem;
  title: string;
  answerConcept: (q: string) => { answer: string; hit: boolean };
  /** 第三层：四柱 + 大运流年个性化（有词条时优先于整盘跳转） */
  answerDeep?: (q: string) => { answer: string; hit: boolean };
  onMiss?: (q: string) => void;
  onDeep?: () => void;
  deepHint?: string;
  /** 深度 Tab 文案，缺省「深度解读」 */
  deepTabLabel?: string;
  /** 深度 Tab 自定义内容（如出生密码五步）；缺省为空态+开始按钮 */
  deepPaneHtml?: string;
  /** 深度 Tab 挂载后绑事件 / 二次渲染 */
  onDeepPaneReady?: (pane: HTMLElement) => void;
  /** 按当前盘面生成的常问 */
  presets?: LabAskPreset[];
  /** 默认打开边看边问 */
  initialTab?: 'deep' | 'ask';
  /** 打开后自动填入并回答 */
  seedQuery?: string;
  /** 看完整百科（可选） */
  onOpenAtlas?: (term: string) => void;
};

/** @deprecated 改用 mountLabFloatActions */
export function mountLabDeepFab(
  _host: HTMLElement,
  opts: { label?: string; onOpen: () => void },
): () => void {
  document.querySelectorAll('[data-lab-deep-fab]').forEach((el) => el.remove());
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'ly-ai-side-fab is-icon lab-deep-fab';
  fab.dataset.labDeepFab = '1';
  fab.title = opts.label ?? '深度解读';
  fab.setAttribute('aria-label', opts.label ?? '深度解读');
  fab.innerHTML = ICON_SPARK;
  fab.addEventListener('click', () => opts.onOpen());
  (document.querySelector('#app') || document.body).appendChild(fab);
  return () => fab.remove();
}

function openPresetPeek(
  item: LabAskPreset,
  opts: LabDeepSheetOpts,
  reopenAsk: (seed?: string) => void,
): void {
  const tabs =
    item.tabs?.length ? item.tabs : tabsFromParagraphs(item.a);
  openLabConceptPeek({
    term: item.title?.trim() || item.q,
    tabs,
    sourceHint: '本页常问 · 本地词条',
    onOpenAsk: (term) => reopenAsk(term),
    onOpenAtlas: opts.onOpenAtlas,
  });
}

export function openLabDeepSheet(opts: LabDeepSheetOpts): void {
  document.querySelector('.lab-deep-sheet')?.remove();

  const startTab = opts.initialTab ?? 'ask';
  const presets = opts.presets ?? [];
  const deepTabLabel = opts.deepTabLabel ?? '深度解读';
  const deepPaneInner = opts.deepPaneHtml
    ? opts.deepPaneHtml
    : `<section class="ly-follow-deep-empty">
          <p>${escapeHtml(opts.deepHint ?? '结合你的盘面与情况，做一次更贴合的解读。概念题请切到「边看边问」。')}</p>
          <button type="button" class="btn ly-btn-gold btn-sm" data-deep-run>开始深度解读</button>
        </section>`;

  const modal = document.createElement('div');
  modal.className = 'ly-follow-chat lab-deep-sheet is-open';
  modal.innerHTML = `
    <button type="button" class="ly-follow-chat-backdrop" data-deep-close aria-label="关闭"></button>
    <div class="ly-follow-chat-sheet" role="dialog" aria-modal="true">
      <header class="ly-follow-chat-head">
        <div>
          <p class="ly-follow-chat-kicker">深度解读</p>
          <h2>${escapeHtml(opts.title)}</h2>
        </div>
        <button type="button" class="ly-follow-chat-x" data-deep-close aria-label="关闭">×</button>
      </header>
      <div class="ly-deep-sheet-tabs" role="tablist">
        <button type="button" class="ly-deep-sheet-tab${startTab === 'deep' ? ' is-on' : ''}" data-deep-tab="deep">${escapeHtml(deepTabLabel)}</button>
        <button type="button" class="ly-deep-sheet-tab${startTab === 'ask' ? ' is-on' : ''}" data-deep-tab="ask">边看边问</button>
      </div>
      <div class="ly-deep-sheet-pane${opts.deepPaneHtml ? ' is-custom-deep' : ''}" data-deep-pane="deep" ${startTab === 'ask' ? 'hidden' : ''}>
        ${deepPaneInner}
      </div>
      <div class="ly-deep-sheet-pane ly-deep-ask-pane" data-deep-pane="ask" ${startTab === 'deep' ? 'hidden' : ''}>
        <section class="ly-ask-panel">
          <p class="ly-ask-ai-hint">概念追问优先本地词库，不耗 AI；点常问会开释义弹窗。</p>
          ${renderPresetsHtml(presets)}
          <div class="ly-ask-section">
            <p class="ly-layer-guide">我还想问</p>
            <textarea class="question-input ly-ask-input" data-lab-ask-input rows="5" placeholder="例如：什么是食神？华盖是什么意思？"></textarea>
            <button type="button" class="btn ly-btn-gold btn-sm ly-ask-send" data-lab-ask-send>提问</button>
          </div>
        </section>
      </div>
    </div>
  `;

  const close = () => {
    modal.classList.remove('is-open');
    setTimeout(() => modal.remove(), 220);
  };

  const reopenAsk = (seed?: string) => {
    openLabDeepSheet({
      ...opts,
      initialTab: 'ask',
      seedQuery: seed,
    });
  };

  modal.querySelectorAll('[data-deep-close]').forEach((el) => {
    el.addEventListener('click', close);
  });

  modal.querySelectorAll<HTMLButtonElement>('[data-deep-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.deepTab === 'ask' ? 'ask' : 'deep';
      modal.querySelectorAll<HTMLButtonElement>('[data-deep-tab]').forEach((b) => {
        b.classList.toggle('is-on', b.dataset.deepTab === tab);
      });
      modal.querySelectorAll<HTMLElement>('[data-deep-pane]').forEach((pane) => {
        pane.hidden = pane.dataset.deepPane !== tab;
      });
    });
  });

  modal.querySelectorAll<HTMLButtonElement>('[data-faq-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.faqIndex);
      const item = presets[i];
      if (!item) return;
      openPresetPeek(item, opts, reopenAsk);
    });
  });

  const input = modal.querySelector<HTMLTextAreaElement>('[data-lab-ask-input]')!;
  let lastAsk = opts.seedQuery?.trim() || '';

  const showDeepAnswer = (answer: string, term: string) => {
    const pane = modal.querySelector<HTMLElement>('[data-deep-pane="deep"]');
    if (!pane) return;
    const parts = answer.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
    pane.innerHTML = `
      <section class="ly-follow-deep-result">
        <p class="ly-layer-guide">${escapeHtml(term || '深度解析')}</p>
        ${parts
          .map(
            (p) =>
              `<p class="ly-deep-para">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`,
          )
          .join('')}
        <button type="button" class="btn ly-btn-gold btn-sm" data-deep-whole>去命盘解读</button>
      </section>`;
    pane.hidden = false;
    modal.querySelectorAll<HTMLButtonElement>('[data-deep-tab]').forEach((b) => {
      b.classList.toggle('is-on', b.dataset.deepTab === 'deep');
    });
    modal.querySelectorAll<HTMLElement>('[data-deep-pane]').forEach((p) => {
      p.hidden = p.dataset.deepPane !== 'deep';
    });
    pane.querySelector('[data-deep-whole]')?.addEventListener('click', () => {
      if (opts.onDeep) {
        opts.onDeep();
        return;
      }
      close();
      navigate(DEEP_FALLBACK_PATH[opts.system]);
    });
  };

  modal.querySelector('[data-deep-run]')?.addEventListener('click', () => {
    const q = (input.value.trim() || lastAsk || opts.seedQuery || '').trim();
    if (opts.answerDeep && q.length >= 1) {
      const got = opts.answerDeep(q);
      if (got.hit && got.answer.trim()) {
        showDeepAnswer(got.answer, q);
        return;
      }
    }
    if (opts.onDeep) {
      opts.onDeep();
      return;
    }
    close();
    navigate(DEEP_FALLBACK_PATH[opts.system]);
  });

  const send = () => {
    const q = input.value.trim();
    if (q.length < 2) return;
    lastAsk = q;
    const got = opts.answerConcept(q);
    if (!got.hit) opts.onMiss?.(q);
    const parts = got.answer.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    openLabConceptPeek({
      term: q,
      tabs: parts.length > 1 ? tabsFromParagraphs(parts) : [{ id: 'main', label: '释义', body: got.answer }],
      sourceHint: got.hit ? '本地概念 · 未调用 AI' : '词库暂无 · 已记下待补',
      onOpenAsk: (term) => {
        input.value = term;
        input.focus();
      },
      onOpenAtlas: opts.onOpenAtlas,
    });
  };
  modal.querySelector('[data-lab-ask-send]')?.addEventListener('click', send);
  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') send();
  });

  document.body.appendChild(modal);

  const deepPane = modal.querySelector<HTMLElement>('[data-deep-pane="deep"]');
  if (deepPane) opts.onDeepPaneReady?.(deepPane);

  if (opts.seedQuery?.trim()) {
    input.value = opts.seedQuery.trim();
    send();
  }
}
