import { navigate } from '../router.ts';
import { stashCrossAskQuestion } from '../journal/cross-ask.ts';
import {
  LAB_ASK_PLACEHOLDERS,
  adviseSystemsForQuestion,
} from '../pages/lab-ask-recommend.ts';

export interface LabGuideItem {
  focus: string;
  why: string;
  system: string;
}

/** 怎么选：先看人 / 看事，再落到体系（自己也算「人」） */
export const LAB_SYSTEM_GUIDE: LabGuideItem[] = [
  {
    focus: '看人：心里乱、迷茫、关系张力',
    why: '照潜意识与关系场，适合和自己对话。',
    system: '塔罗',
  },
  {
    focus: '看事：这事怎么走、阻力在哪',
    why: '一事一问，看局势画面与下一步——塔罗也能看事。',
    system: '塔罗',
  },
  {
    focus: '看人：人品、感情气场、合不合',
    why: '定方向、看缘分，不必卡精确日期。',
    system: '梅花',
  },
  {
    focus: '看事：谈薪、offer、官司等具体事',
    why: '细节与应期更清楚，适合郑重求问。',
    system: '六爻',
  },
  {
    focus: '看事：出门、面试、临时吉凶',
    why: '适合临时起意、先拿个倾向。',
    system: '小六壬',
  },
];

type SystemKey = 'liuyao' | 'meihua' | 'tarot' | 'xiaoliuren';

const TAG: Record<SystemKey, { label: string; className: string }> = {
  liuyao: { label: '六爻', className: 'is-ly' },
  meihua: { label: '梅花', className: 'is-mei' },
  tarot: { label: '塔罗', className: 'is-tarot' },
  xiaoliuren: { label: '小六壬', className: 'is-xlr' },
};

/** 四体系一页看懂：优势 + 适合谁（开屏重点） */
export const LAB_PICK_CARDS: Array<{
  key: SystemKey;
  metaphor: string;
  strength: string;
  forYou: string;
  notFor: string;
}> = [
  {
    key: 'tarot',
    metaphor: '镜子 · 心理投射',
    strength: '情感与关系，也能看一事一局的局势',
    forYou: '你想看见画面：自己、关系，或这事怎么走',
    notFor: '别用来硬问「几月几号成」这类应期',
  },
  {
    key: 'xiaoliuren',
    metaphor: '指南针 · 临时定向',
    strength: '出门、面试、约会前的即时吉凶倾向',
    forYou: '你只想先拿个心理准备，不必展开长篇',
    notFor: '别问一生运势、长期宿命',
  },
  {
    key: 'liuyao',
    metaphor: '西医 · 精密定量',
    strength: '谈薪、offer、求财、官司等具体事',
    forYou: '你较真，想要细节和大致时间',
    notFor: '别问「我一生如何」这种大面',
  },
  {
    key: 'meihua',
    metaphor: '中医 · 整体气机',
    strength: '人品、感情走向、最近状态',
    forYou: '你想先定大方向，不怕抽象一点',
    notFor: '别追问精确到几月几号',
  },
];

/** 深层对照（选读，默认折叠） */
export const LAB_COGNITIVE_MAP = {
  metaphors: LAB_PICK_CARDS.map((c) => ({
    key: c.key,
    line: c.metaphor,
  })),
  worldview: [
    {
      key: 'liuyao' as const,
      world: '天道运行',
      logic: '干支与五行生克；重时间刻度。',
    },
    {
      key: 'meihua' as const,
      world: '天人合一',
      logic: '象与心念同步；万物皆可成卦。',
    },
    {
      key: 'tarot' as const,
      world: '共时性',
      logic: '原型意象显化潜意识。',
    },
    {
      key: 'xiaoliuren' as const,
      world: '时位交汇',
      logic: '掌诀宫位；看当下这一问的吉凶倾向。',
    },
  ],
  fit: LAB_PICK_CARDS.map((c) => ({
    key: c.key,
    best: c.strength,
    avoid: c.notFor,
  })),
  scenes: LAB_SYSTEM_GUIDE.map((g) => ({
    when: g.focus,
    pick: g.system,
    why: g.why,
  })),
  closing:
    '不是谁更准，而是谁更贴当下的问题——镜子看自己，指南针看眼前，显微镜看细节，望远镜看大势。',
};

/** @deprecated */
export const LIUYAO_MEIHUA_COMPARE = {
  metaphor: LAB_PICK_CARDS.map((c) => `${TAG[c.key].label}${c.metaphor}`).join('；'),
  tip: LAB_COGNITIVE_MAP.closing,
  points: [],
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tagHtml(key: SystemKey): string {
  const t = TAG[key];
  return `<span class="lab-guide-tag ${t.className}">${escapeHtml(t.label)}</span>`;
}

function renderPickCardsHtml(): string {
  return LAB_PICK_CARDS.map(
    (c) => `
    <article class="lab-guide-pick">
      <header class="lab-guide-pick-head">
        ${tagHtml(c.key)}
        <span class="lab-guide-pick-meta">${escapeHtml(c.metaphor)}</span>
      </header>
      <p class="lab-guide-pick-strength"><span>优势</span>${escapeHtml(c.strength)}</p>
      <p class="lab-guide-pick-fit"><span>适合你若</span>${escapeHtml(c.forYou)}</p>
      <p class="lab-guide-pick-not"><span>不太适合</span>${escapeHtml(c.notFor)}</p>
    </article>`,
  ).join('');
}

function renderDeepHtml(): string {
  const map = LAB_COGNITIVE_MAP;
  const worldview = map.worldview
    .map(
      (w) =>
        `<p class="lab-guide-deep-line">${tagHtml(w.key)}<strong>${escapeHtml(w.world)}</strong> ${escapeHtml(w.logic)}</p>`,
    )
    .join('');

  return `
    <details class="lab-guide-deep">
      <summary>还想再了解一点（世界观）</summary>
      <div class="lab-guide-deep-body">
        <p class="lab-guide-compare-h">世界观</p>
        ${worldview}
        <p class="lab-guide-compare-tip">${escapeHtml(map.closing)}</p>
      </div>
    </details>
  `;
}

function renderAskJourneyHtml(): string {
  return `
    <section class="lab-ask lab-guide-ask" aria-label="开启占学之旅">
      <p class="lab-guide-section-label">开启占学之旅</p>
      <div class="lab-ask-shell">
        <div class="lab-ask-sparkles" data-ask-sparkles aria-hidden="true"></div>
        <form class="lab-ask-form" data-ask-form>
          <label class="visually-hidden" for="lab-guide-ask-input">你的问题</label>
          <div class="lab-ask-row">
            <input
              id="lab-guide-ask-input"
              class="lab-ask-input"
              type="text"
              name="question"
              maxlength="120"
              autocomplete="off"
              placeholder="${escapeHtml(LAB_ASK_PLACEHOLDERS[0])}"
              data-ask-input
            />
            <button type="submit" class="lab-ask-submit" aria-label="开始">→</button>
          </div>
        </form>
        <div class="lab-ask-result" data-ask-result hidden>
          <p class="lab-ask-advice" data-ask-advice></p>
          <div class="lab-ask-chips" data-ask-chips></div>
          <p class="lab-ask-result-hint">也可以关掉弹层，点首页入口自由选。</p>
        </div>
      </div>
    </section>
  `;
}

function fillAskSparkles(host: HTMLElement): void {
  host.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('span');
    s.className = 'lab-ask-spark';
    s.style.left = `${8 + Math.random() * 84}%`;
    s.style.top = `${12 + Math.random() * 76}%`;
    s.style.animationDelay = `${Math.random() * 2.8}s`;
    s.style.animationDuration = `${2.2 + Math.random() * 2.4}s`;
    host.appendChild(s);
  }
}

function bindAskJourney(overlay: HTMLElement, close: () => void): () => void {
  const sparklesHost = overlay.querySelector<HTMLElement>('[data-ask-sparkles]');
  if (sparklesHost) fillAskSparkles(sparklesHost);

  const input = overlay.querySelector<HTMLInputElement>('[data-ask-input]');
  const form = overlay.querySelector<HTMLFormElement>('[data-ask-form]');
  const resultEl = overlay.querySelector<HTMLElement>('[data-ask-result]');
  const adviceEl = overlay.querySelector<HTMLElement>('[data-ask-advice]');
  const chipsEl = overlay.querySelector<HTMLElement>('[data-ask-chips]');
  if (!input || !form || !resultEl || !adviceEl || !chipsEl) {
    return () => undefined;
  }

  let placeholderIdx = 0;
  const placeholderTimer = window.setInterval(() => {
    if (document.activeElement === input || input.value.trim()) return;
    placeholderIdx = (placeholderIdx + 1) % LAB_ASK_PLACEHOLDERS.length;
    input.placeholder = LAB_ASK_PLACEHOLDERS[placeholderIdx]!;
  }, 3200);

  const stashIfAny = () => {
    const q = input.value.trim();
    if (q) stashCrossAskQuestion(q);
  };

  const paintRecommendations = (question: string) => {
    const advice = adviseSystemsForQuestion(question);
    adviceEl.textContent = advice.message;
    chipsEl.innerHTML = '';
    for (const rec of advice.options) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lab-ask-chip';
      btn.innerHTML = `<span class="lab-ask-chip-title">${escapeHtml(rec.title)}</span><span class="lab-ask-chip-reason">${escapeHtml(rec.lens)}</span>`;
      btn.addEventListener('click', () => {
        stashIfAny();
        close();
        navigate(rec.path);
      });
      chipsEl.appendChild(btn);
    }
    resultEl.hidden = false;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) {
      input.focus();
      input.placeholder = '先写一句你的困惑……';
      return;
    }
    stashCrossAskQuestion(q);
    paintRecommendations(q);
  });

  return () => window.clearInterval(placeholderTimer);
}

/** 不知道从哪里开始：开屏先看懂该用什么 */
export function showLabGuideModal(items: LabGuideItem[] = LAB_SYSTEM_GUIDE): void {
  document.querySelector('.lab-guide-modal')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'lab-guide-modal';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'lab-guide-modal-title');

  const scenes = items
    .map(
      (g) => `
    <li>
      <button type="button" class="lab-guide-scene" data-system="${escapeHtml(g.system)}">
        <span class="lab-guide-scene-q">${escapeHtml(g.focus)}</span>
        <span class="lab-guide-scene-a">用 ${escapeHtml(g.system)}</span>
      </button>
      <p class="lab-guide-scene-why">${escapeHtml(g.why)}</p>
    </li>
  `,
    )
    .join('');

  overlay.innerHTML = `
    <div class="lab-guide-modal-backdrop"></div>
    <div class="lab-guide-modal-card">
      <header class="lab-guide-modal-header">
        <div>
          <h2 id="lab-guide-modal-title" class="lab-guide-modal-title">我该用哪一种？</h2>
          <p class="lab-guide-modal-desc">先写一句困惑，或按场景 / 优势自己选。</p>
        </div>
        <button type="button" class="lab-guide-modal-close" aria-label="关闭">×</button>
      </header>

      ${renderAskJourneyHtml()}

      <p class="lab-guide-section-label">按场景速选</p>
      <ul class="lab-guide-scenes" aria-label="场景速选">${scenes}</ul>

      <p class="lab-guide-section-label">四种优势一览</p>
      <div class="lab-guide-picks" aria-label="体系优势">${renderPickCardsHtml()}</div>

      ${renderDeepHtml()}
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-visible'));

  let disposeAsk: () => void = () => undefined;

  const close = (): void => {
    disposeAsk();
    overlay.classList.remove('is-visible');
    window.setTimeout(() => overlay.remove(), 280);
  };

  disposeAsk = bindAskJourney(overlay, close);

  overlay.querySelector('.lab-guide-modal-close')?.addEventListener('click', close);
  overlay.querySelector('.lab-guide-modal-backdrop')?.addEventListener('click', close);

  overlay.querySelectorAll<HTMLButtonElement>('.lab-guide-scene').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sys = btn.dataset.system;
      const card = [...overlay.querySelectorAll('.lab-guide-pick')].find((el) =>
        el.textContent?.includes(sys ?? ''),
      );
      card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      card?.classList.add('is-flash');
      window.setTimeout(() => card?.classList.remove('is-flash'), 900);
    });
  });
}
