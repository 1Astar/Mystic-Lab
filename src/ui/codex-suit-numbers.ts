import {
  COMBINATION_EXAMPLES,
  COURT_NOTE,
  NUMBER_ARCS,
  NUMBER_STAGES,
  SUIT_GROUPS,
  SUIT_NUMBER_INTRO,
  buildLiveSuitNumberBlend,
  type SuitGroup,
} from '../knowledge/minor-structure.ts';
import { cardFaceImageHtml } from '../tarot/card-images.ts';
import { formatCardNameZh } from '../tarot/card-names.ts';
import { TAROT_DECK } from '../tarot/deck.ts';
import { mountSuitNumberQuiz } from './codex-suit-quiz.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type SuitNumbersCallbacks = {
  onSelectCard: (deckId: string) => void;
};

export function mountSuitNumbersGuide(
  container: HTMLElement,
  callbacks: SuitNumbersCallbacks,
): void {
  container.className = 'suit-numbers-guide';
  container.innerHTML = `
    <section class="suit-numbers-intro">
      <h2 class="suit-numbers-title">${escapeHtml(SUIT_NUMBER_INTRO.title)}</h2>
      <p class="suit-numbers-subtitle">${escapeHtml(SUIT_NUMBER_INTRO.subtitle)}</p>
      <p class="suit-numbers-lead">${escapeHtml(SUIT_NUMBER_INTRO.lead)}</p>
    </section>
    <section class="suit-numbers-block">
      <h3>先看牌组：它在讲哪个领域</h3>
      <div class="suit-numbers-suits" role="tablist" aria-label="四个牌组"></div>
      <div class="suit-numbers-suit-panel" role="tabpanel"></div>
    </section>
    <section class="suit-numbers-block">
      <h3>再看数字：它处在什么阶段</h3>
      <p class="suit-numbers-arc-lead">把 1–10 记成一条人生弧，三段就够。</p>
      <div class="suit-numbers-arcs"></div>
    </section>
    <section class="suit-numbers-block suit-numbers-blend-block">
      <h3>当场合成</h3>
      <p class="suit-numbers-blend-hint">选牌组，再点数字——领域 × 阶段立刻成一句。</p>
      <div class="suit-numbers-blend-host"></div>
    </section>
    <section class="suit-numbers-block">
      <h3>组合起来读</h3>
      <p class="suit-numbers-formula">牌名 = 牌组 + 数字 → 领域 × 阶段</p>
      <div class="suit-numbers-examples"></div>
    </section>
    <p class="suit-numbers-court">${escapeHtml(COURT_NOTE)}</p>
    <section class="suit-numbers-block suit-numbers-quiz-block">
      <div class="suit-numbers-quiz-host"></div>
    </section>
  `;

  const quizHost = container.querySelector('.suit-numbers-quiz-host') as HTMLElement;
  mountSuitNumberQuiz(quizHost);

  const suitsHost = container.querySelector('.suit-numbers-suits')!;
  const suitPanel = container.querySelector('.suit-numbers-suit-panel') as HTMLElement;
  const arcsHost = container.querySelector('.suit-numbers-arcs')!;
  const blendHost = container.querySelector('.suit-numbers-blend-host') as HTMLElement;

  let activeSuit: SuitGroup['key'] = SUIT_GROUPS[0]?.key ?? 'wands';
  let activeNum = '5';

  function renderSuitPanel(): void {
    const suit = SUIT_GROUPS.find((s) => s.key === activeSuit) ?? SUIT_GROUPS[0];
    if (!suit) return;
    suitPanel.innerHTML = `
      <p class="suit-numbers-theme">${escapeHtml(suit.theme)}</p>
      <p class="suit-numbers-hint">${escapeHtml(suit.hint)}</p>
    `;
    suitsHost.querySelectorAll<HTMLButtonElement>('.suit-numbers-suit-tab').forEach((btn) => {
      const on = btn.dataset.suit === activeSuit;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function renderNumActive(): void {
    arcsHost.querySelectorAll<HTMLButtonElement>('.suit-num-chip').forEach((btn) => {
      const on = btn.dataset.num === activeNum;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function renderBlend(): void {
    const blend = buildLiveSuitNumberBlend(activeSuit, activeNum);
    if (!blend) {
      blendHost.innerHTML = `<p class="suit-numbers-blend-empty">选一个数字试试。</p>`;
      return;
    }

    const card = TAROT_DECK.find((c) => c.id === blend.deckId);
    const nameCn = card ? formatCardNameZh(card) : blend.nameCn;
    blendHost.innerHTML = `
      <p class="suit-numbers-blend-line">${escapeHtml(blend.line)}</p>
      <button type="button" class="suit-numbers-blend-card" data-deck-id="${escapeHtml(blend.deckId)}">
        <div class="suit-numbers-blend-face">
          ${cardFaceImageHtml(blend.deckId, nameCn, 'suit-blend-img')}
        </div>
        <div class="suit-numbers-blend-meta">
          <strong>${escapeHtml(nameCn)}</strong>
          <span>${escapeHtml(blend.suitLabel)} + ${escapeHtml(blend.num)} · ${escapeHtml(blend.theme)}</span>
        </div>
      </button>
    `;
    blendHost.querySelector<HTMLButtonElement>('.suit-numbers-blend-card')?.addEventListener('click', () => {
      callbacks.onSelectCard(blend.deckId);
    });
  }

  function refresh(): void {
    renderSuitPanel();
    renderNumActive();
    renderBlend();
  }

  for (const suit of SUIT_GROUPS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'suit-numbers-suit-tab';
    btn.role = 'tab';
    btn.dataset.suit = suit.key;
    btn.textContent = suit.label;
    btn.addEventListener('click', () => {
      activeSuit = suit.key;
      refresh();
    });
    suitsHost.appendChild(btn);
  }

  for (const arc of NUMBER_ARCS) {
    const chapter = document.createElement('article');
    chapter.className = 'suit-numbers-arc';
    chapter.innerHTML = `
      <header class="suit-numbers-arc-head">
        <p class="suit-numbers-arc-title">
          <span class="suit-numbers-arc-range">${escapeHtml(arc.range)}</span>
          ${escapeHtml(arc.title)}
        </p>
        <p class="suit-numbers-arc-chain">${escapeHtml(arc.chain)}</p>
        <p class="suit-numbers-arc-blurb">${escapeHtml(arc.blurb)}</p>
      </header>
      <div class="suit-numbers-arc-nums" role="group" aria-label="${escapeHtml(arc.title)}阶段"></div>
    `;
    const numsRow = chapter.querySelector('.suit-numbers-arc-nums')!;
    for (const num of arc.nums) {
      const stage = NUMBER_STAGES.find((n) => n.num === num);
      if (!stage) continue;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'suit-num-chip';
      chip.dataset.num = stage.num;
      chip.innerHTML = `
        <span class="suit-num-chip-n">${escapeHtml(stage.num)}</span>
        <span class="suit-num-chip-anchor">${escapeHtml(stage.anchor)}</span>
        <span class="suit-num-chip-theme">${escapeHtml(stage.theme)}</span>
      `;
      chip.addEventListener('click', () => {
        activeNum = stage.num;
        refresh();
      });
      numsRow.appendChild(chip);
    }
    arcsHost.appendChild(chapter);
  }

  refresh();

  const examplesHost = container.querySelector('.suit-numbers-examples')!;
  for (const ex of COMBINATION_EXAMPLES) {
    const card = TAROT_DECK.find((c) => c.id === ex.deckId);
    const nameCn = card ? formatCardNameZh(card) : ex.nameCn;
    const article = document.createElement('article');
    article.className = 'suit-numbers-example';
    article.innerHTML = `
      <button type="button" class="suit-example-btn" data-deck-id="${escapeHtml(ex.deckId)}">
        <div class="suit-example-face">
          ${cardFaceImageHtml(ex.deckId, nameCn, 'suit-example-img')}
        </div>
        <div class="suit-example-body">
          <h4>${escapeHtml(ex.nameCn)} = ${escapeHtml(ex.suitLabel)} + ${escapeHtml(ex.num)}</h4>
          <p class="suit-example-parts">
            <span>${escapeHtml(ex.suitLabel)} → ${escapeHtml(ex.suitTheme)}</span>
            <span>${escapeHtml(ex.num)} → ${escapeHtml(ex.numTheme)}</span>
          </p>
          <p class="suit-example-reading">${escapeHtml(ex.reading)}</p>
        </div>
      </button>
    `;
    examplesHost.appendChild(article);
  }

  container.querySelectorAll<HTMLButtonElement>('.suit-example-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.deckId;
      if (id) callbacks.onSelectCard(id);
    });
  });
}
