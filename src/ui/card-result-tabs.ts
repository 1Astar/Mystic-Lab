import type { CardReading } from '../interpretation/types.ts';
import { getSceneMeaning, getVisualHotspots } from '../knowledge/registry.ts';
import type { QuestionTopic } from '../knowledge/types.ts';
import { getCardById } from '../tarot/deck.ts';

export type ResultTabId = 'reading' | 'visual' | 'codex' | 'encounter';

const TAB_LABELS: Record<ResultTabId, string> = {
  reading: '此刻解读',
  visual: '看懂牌面',
  codex: '牌义图鉴',
  encounter: '我的相遇',
};

const TOPIC_LABELS: Record<QuestionTopic, string> = {
  work: '工作',
  love: '感情',
  study: '学业',
  self: '自我',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatParagraph(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function renderReadingTab(r: CardReading): string {
  const layers = r.interpretationLayers;
  const questions = layers.selfReflection
    .map((q) => `<li>${formatParagraph(q)}</li>`)
    .join('');

  return `
    <div class="result-tab-panel" data-panel="reading">
      <section class="reading-layer reading-layer-base">
        <h4 class="layer-tag">标准牌义</h4>
        <p class="layer-badge">牌义底座 · 知识库</p>
        <p class="reading-block-text">${formatParagraph(layers.standardMeaning)}</p>
      </section>
      <section class="reading-layer reading-layer-context">
        <h4 class="layer-tag">结合你的问题</h4>
        <p class="layer-badge layer-badge-ai">模拟解读 · P3 接 AI</p>
        <p class="reading-block-text">${formatParagraph(layers.contextualReading)}</p>
      </section>
      <section class="reading-layer reading-layer-reflect">
        <h4 class="layer-tag">回到心里</h4>
        <p class="layer-badge">问问自己</p>
        <ul class="reflect-list">${questions}</ul>
      </section>
    </div>`;
}

function renderVisualTab(r: CardReading): string {
  const visual = getVisualHotspots(r.cardId);
  const deckCard = getCardById(r.cardId);
  const cardColor = deckCard?.color ?? 'var(--purple)';
  if (!visual?.hotspots.length) {
    return `
      <div class="result-tab-panel" data-panel="visual">
        <div class="result-empty">
          <p>这张牌的牌面热点正在整理中。</p>
          <p class="result-empty-sub">P2 将支持点击星星、水流等元素，从画面里读懂牌意。</p>
        </div>
      </div>`;
  }

  const markers = visual.hotspots
    .map(
      (h) => `
      <button type="button" class="hotspot-marker" style="left:${h.x}%;top:${h.y}%;" data-meaning="${escapeHtml(h.meaning)}" aria-label="${escapeHtml(h.label)}">
        <span class="hotspot-dot"></span>
        <span class="hotspot-label">${escapeHtml(h.label)}</span>
      </button>`,
    )
    .join('');

  return `
    <div class="result-tab-panel" data-panel="visual">
      <p class="visual-hint">点击牌面元素，看为什么这样理解</p>
      <div class="visual-card-stage">
        <div class="visual-card-face" style="--card-color: ${cardColor}">
          <span class="visual-card-symbol">${escapeHtml(deckCard?.symbol ?? '✦')}</span>
          <div class="hotspot-layer">${markers}</div>
        </div>
      </div>
      <p class="hotspot-detail" id="hotspot-detail-${r.cardId}">点选上方元素查看含义</p>
    </div>`;
}

function renderCodexTab(r: CardReading): string {
  const k = r.selectedCard;
  const reversed = r.orientation === 'reversed';
  const scene = getSceneMeaning(k, r.topic, reversed);

  return `
    <div class="result-tab-panel" data-panel="codex">
      <p class="codex-one-line">${formatParagraph(k.oneSentence)}</p>
      <p class="codex-keywords"><strong>关键词</strong>：${escapeHtml(k.keywords.join('、'))}</p>
      <section class="codex-scene">
        <h4>常见场景 · ${TOPIC_LABELS[r.topic]}</h4>
        <p>${formatParagraph(scene)}</p>
      </section>
      ${k.foolJourney ? `
      <section class="codex-journey-placeholder">
        <h4>愚人之旅 · 占位</h4>
        <p>第 ${k.foolJourney.order} 步 · ${escapeHtml(k.foolJourney.title)}</p>
        <p class="result-empty-sub">${formatParagraph(k.foolJourney.summary)}</p>
      </section>` : ''}
    </div>`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function renderEncounterTab(r: CardReading): string {
  const enc = r.encounterRecord;
  if (!enc) {
    return `
      <div class="result-tab-panel" data-panel="encounter">
        <div class="result-empty">
          <p>尚未记录与这张牌的相遇。</p>
          <p class="result-empty-sub">完成抽牌后，图鉴会自动收录。</p>
        </div>
      </div>`;
  }

  const questionList = enc.questions.length
    ? enc.questions
        .slice(0, 5)
        .map((q) => `<li>${formatParagraph(q)}</li>`)
        .join('')
    : '<li class="result-empty-sub">暂无记录的问题</li>';

  const noteList = enc.notes.length
    ? enc.notes
        .slice(0, 3)
        .map((n) => `<li>${formatParagraph(n)}</li>`)
        .join('')
    : '<li class="result-empty-sub">还没有写手札，可在结果页下方记录感悟</li>';

  return `
    <div class="result-tab-panel" data-panel="encounter">
      <p class="encounter-stat">你已经与<strong>「${escapeHtml(r.cardName)}」</strong>相遇 <strong>${enc.encounterCount}</strong> 次</p>
      <p class="encounter-meta">首次遇见：${formatDate(enc.firstMetAt)}${enc.lastMetAt ? ` · 最近一次：${formatDate(enc.lastMetAt)}` : ''}</p>
      <section class="encounter-block">
        <h4>当时问过什么</h4>
        <ul>${questionList}</ul>
      </section>
      <section class="encounter-block">
        <h4>手札与笔记</h4>
        <ul>${noteList}</ul>
      </section>
    </div>`;
}

const PANEL_RENDERERS: Record<ResultTabId, (r: CardReading) => string> = {
  reading: renderReadingTab,
  visual: renderVisualTab,
  codex: renderCodexTab,
  encounter: renderEncounterTab,
};

export function mountCardResultTabs(
  container: HTMLElement,
  reading: CardReading,
  activeTab: ResultTabId = 'reading',
): void {
  const tabs = (Object.keys(TAB_LABELS) as ResultTabId[]).map(
    (id) => `
    <button type="button" class="result-tab-btn ${id === activeTab ? 'is-active' : ''}" data-tab="${id}" role="tab">
      ${TAB_LABELS[id]}
    </button>`,
  ).join('');

  container.innerHTML = `
    <div class="card-result-tabs" data-card-id="${escapeHtml(reading.cardId)}">
      <div class="result-tab-bar" role="tablist">${tabs}</div>
      <div class="result-tab-panels">
        ${PANEL_RENDERERS[activeTab](reading)}
      </div>
    </div>
  `;

  const root = container.querySelector('.card-result-tabs')!;
  const panelHost = container.querySelector('.result-tab-panels')!;

  root.querySelectorAll<HTMLButtonElement>('.result-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab as ResultTabId;
      root.querySelectorAll('.result-tab-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      panelHost.innerHTML = PANEL_RENDERERS[tab](reading);
      wireHotspotClicks(panelHost, reading.cardId);
    });
  });

  wireHotspotClicks(panelHost, reading.cardId);
}

function wireHotspotClicks(panelHost: Element, cardId: string): void {
  const detail = panelHost.querySelector(`#hotspot-detail-${cardId}`) as HTMLElement | null;
  panelHost.querySelectorAll<HTMLButtonElement>('.hotspot-marker').forEach((btn) => {
    btn.addEventListener('click', () => {
      panelHost.querySelectorAll('.hotspot-marker').forEach((m) => m.classList.remove('is-active'));
      btn.classList.add('is-active');
      if (detail) {
        detail.textContent = btn.dataset.meaning ?? '';
      }
    });
  });
}

export { TAB_LABELS };
