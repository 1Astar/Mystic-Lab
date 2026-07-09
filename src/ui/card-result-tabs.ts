import type { CardReading } from '../interpretation/types.ts';

import { isAiConfigured } from '../ai/settings.ts';

import { getSceneMeaning, getVisualHotspots, getVisualOverview } from '../knowledge/registry.ts';

import type { QuestionTopic } from '../knowledge/types.ts';

import { getCardById } from '../tarot/deck.ts';
import { cardFaceImageHtml } from '../tarot/card-images.ts';



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



function stripReminderPrefix(text: string): string {
  return text
    .replace(/^（逆位时）/, '')
    .replace(/^逆位提醒[：:]\s*/, '')
    .replace(/^正位提醒[：:]\s*/, '');
}



export function renderCardHero(r: CardReading): string {

  const deckCard = getCardById(r.cardId);
  const cardColor = deckCard?.color ?? 'var(--purple)';
  const orient = r.orientation === 'reversed' ? '逆位' : '正位';
  const alt = `${r.selectedCard.nameCn} · ${r.selectedCard.nameEn}`;
  const kwTags = r.keywords
    .map((k) => `<span class="hero-kw-tag">${escapeHtml(k)}</span>`)
    .join('');

  return `
    <header class="result-card-hero">
      <p class="result-hero-pos">${escapeHtml(r.position)} · ${orient}</p>
      <div class="result-hero-visual">
        <div class="tarot-card has-art is-revealed ${r.orientation === 'reversed' ? 'is-reversed' : ''} is-hero" style="--card-color: ${cardColor}">
          <div class="tarot-card-inner">
            <div class="tarot-card-front is-hero-face">
              ${cardFaceImageHtml(r.cardId, alt, 'card-face-img card-face-img-hero')}
            </div>
          </div>
        </div>
      </div>

      <h3 class="result-hero-name-cn">${escapeHtml(r.selectedCard.nameCn)}</h3>

      <p class="result-hero-name-en">${escapeHtml(r.selectedCard.nameEn)}</p>

      <div class="result-hero-keywords">${kwTags}</div>

    </header>`;

}



function contextualBadge(r: CardReading): string {
  if (r.interpretationProvider === 'llm') {
    return '<p class="layer-badge layer-badge-ai">AI 解读</p>';
  }
  if (isAiConfigured()) {
    return '<p class="layer-badge layer-badge-ai">规则解读 · AI 调用失败，已回退</p>';
  }
  return '<p class="layer-badge layer-badge-ai">规则解读 · 未配置 AI</p>';
}

function renderAnswerTendency(r: CardReading): string {
  const t = r.interpretationLayers.answerTendency;
  if (!t) return '';

  return `
      <section class="reading-layer-card reading-layer-answer">
        <h4 class="layer-tag">你的答案倾向</h4>
        <div class="answer-tendency-grid">
          <p class="answer-tendency-field"><span class="answer-tendency-label">整体判断</span><span class="answer-tendency-value">${escapeHtml(t.overall)}</span></p>
          <p class="answer-tendency-field"><span class="answer-tendency-label">结果倾向</span><span class="answer-tendency-value">${escapeHtml(t.tendency)}</span></p>
        </div>
        <p class="answer-tendency-oneliner"><span class="answer-tendency-label">一句话答案</span>${formatParagraph(t.oneLiner)}</p>
        <p class="answer-tendency-action"><span class="answer-tendency-label">关键提醒</span>${formatParagraph(t.actionTip)}</p>
      </section>`;
}

function renderReadingTab(r: CardReading): string {
  const { standard, contextualReading, contextualSections, selfReflection } = r.interpretationLayers;
  const reminderLabel = r.orientation === 'reversed' ? '逆位提醒' : '正位提醒';
  const questions = selfReflection
    .map((q) => `<li>${formatParagraph(q)}</li>`)
    .join('');

  const contextBody = contextualSections?.length
    ? contextualSections
        .map(
          (s) => `
        <div class="context-section">
          <h5 class="context-section-title">${escapeHtml(s.title)}</h5>
          <p class="reading-block-text">${formatParagraph(s.body)}</p>
        </div>`,
        )
        .join('')
    : `<p class="reading-block-text">${formatParagraph(contextualReading)}</p>`;

  const questionEcho = r.question
    ? `<p class="context-question-echo">你正在问：${escapeHtml(r.question)}</p>`
    : '';

  return `
    <div class="result-tab-panel" data-panel="reading">
      <section class="reading-layer-card">
        <h4 class="layer-tag">这张牌在说什么</h4>
        <div class="std-meaning-block">
          <p class="std-field"><span class="std-label">关键词</span><span class="std-value">${escapeHtml(standard.keywords.join('、'))}</span></p>
          <p class="std-field"><span class="std-label">一句话理解</span><span class="std-value">${formatParagraph(standard.oneSentence)}</span></p>
          <p class="std-field"><span class="std-label">${reminderLabel}</span><span class="std-value">${formatParagraph(stripReminderPrefix(standard.reminder))}</span></p>
        </div>
      </section>
      ${renderAnswerTendency(r)}
      <section class="reading-layer-card reading-layer-context">
        <h4 class="layer-tag">结合你的问题</h4>
        ${contextualBadge(r)}
        ${questionEcho}
        ${contextBody}
      </section>
      <section class="reading-layer-card reading-layer-reflect">
        <h4 class="layer-tag">给你的一个提问</h4>
        <p class="layer-badge">回到心里</p>
        <ul class="reflect-list">${questions}</ul>
      </section>
    </div>`;
}



function renderVisualTab(r: CardReading): string {

  const visual = getVisualHotspots(r.cardId);

  const deckCard = getCardById(r.cardId);

  const cardColor = deckCard?.color ?? 'var(--purple)';

  const overview = getVisualOverview(r.cardId) ?? r.selectedCard.oneSentence;
  const questionBridge = r.interpretationLayers.visualQuestionBridge;

  if (!visual?.hotspots.length) {

    return `

      <div class="result-tab-panel" data-panel="visual">

        <div class="result-empty">

          <p>这张牌的牌面热点还在整理中。</p>

          <p class="result-empty-sub">78 张牌热点已全部上线，若仍看到此提示请刷新页面。</p>

        </div>

      </div>`;

  }



  const markers = visual.hotspots

    .map(

      (h, i) => `

      <button type="button" class="hotspot-marker${i === 0 ? ' is-hint' : ''}" style="left:${h.x}%;top:${h.y}%;" data-meaning="${escapeHtml(h.meaning)}" data-label="${escapeHtml(h.label)}" aria-label="${escapeHtml(h.label)}">

        <span class="hotspot-dot"></span>

        <span class="hotspot-label">${escapeHtml(h.label)}</span>

      </button>`,

    )

    .join('');



  const elementList = visual.hotspots
    .map((h) => `<li><strong>${escapeHtml(h.label)}</strong>：${escapeHtml(h.meaning)}</li>`)
    .join('');

  const bridgeBlock = questionBridge
    ? `<section class="visual-bridge-block"><h4 class="visual-section-title">回到你的问题</h4><p class="visual-bridge-text">${formatParagraph(questionBridge)}</p></section>`
    : '';

  return `

    <div class="result-tab-panel" data-panel="visual">

      <section class="visual-overview-block">
        <h4 class="visual-section-title">整牌总览</h4>
        <p class="visual-overview-text">${formatParagraph(overview)}</p>
      </section>

      <section class="visual-elements-block">
        <h4 class="visual-section-title">牌面元素</h4>
        <p class="visual-hint">点击牌面光点查看；也可直接看下方列表</p>
        <ul class="visual-elements-list">${elementList}</ul>
      </section>

      <div class="visual-card-stage">
        <div class="visual-card-face ${r.orientation === 'reversed' ? 'is-reversed' : ''}" style="--card-color: ${cardColor}">
          ${cardFaceImageHtml(r.cardId, `${r.selectedCard.nameCn} · ${r.selectedCard.nameEn}`, 'card-face-img card-face-img-visual')}
          <div class="hotspot-layer">${markers}</div>
        </div>
      </div>

      <p class="hotspot-detail" id="hotspot-detail-${r.cardId}">点选上方元素查看含义</p>

      ${bridgeBlock}

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

      </section>` : `

      <section class="codex-journey-placeholder">

        <h4>愚人之旅 · 占位</h4>

        <p class="result-empty-sub">完整 78 张牌的愚人之旅地图将在 P4 开放。</p>

      </section>`}

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



function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const timeline = enc.timeline?.length
    ? enc.timeline
        .map(
          (e) => `
        <div class="encounter-timeline-item">
          <time>${formatDateTime(e.at)}</time>
          <p>${e.question ? `问：${escapeHtml(e.question)}` : '（未记录问题）'}</p>
          <p class="encounter-timeline-meta">${escapeHtml(e.spreadLabel)} · ${e.reversed ? '逆位' : '正位'}</p>
        </div>`,
        )
        .join('')
    : '<p class="result-empty-sub">暂无相遇记录</p>';

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
        <h4>相遇记录</h4>
        <div class="encounter-timeline">${timeline}</div>
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

    (id) => {

      const hotspotDot = id === 'visual' && reading.hasVisualHotspots
        ? '<span class="tab-hotspot-dot" aria-hidden="true"></span>'
        : '';

      return `

    <button type="button" class="result-tab-btn ${id === activeTab ? 'is-active' : ''}" data-tab="${id}" role="tab" aria-selected="${id === activeTab}">

      ${TAB_LABELS[id]}${hotspotDot}

    </button>`;

    },

  ).join('');



  container.innerHTML = `

    <div class="card-result-tabs" data-card-id="${escapeHtml(reading.cardId)}">

      ${renderCardHero(reading)}

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

      root.querySelectorAll('.result-tab-btn').forEach((b) => {

        b.classList.remove('is-active');

        b.setAttribute('aria-selected', 'false');

      });

      btn.classList.add('is-active');

      btn.setAttribute('aria-selected', 'true');

      panelHost.innerHTML = PANEL_RENDERERS[tab](reading);

      wireHotspotClicks(panelHost, reading.cardId);

    });

  });



  wireHotspotClicks(panelHost, reading.cardId);

}



function wireHotspotClicks(panelHost: Element, cardId: string): void {

  const detail = panelHost.querySelector(`#hotspot-detail-${cardId}`) as HTMLElement | null;

  const markers = panelHost.querySelectorAll<HTMLButtonElement>('.hotspot-marker');

  markers.forEach((btn) => {

    btn.addEventListener('click', () => {

      panelHost.querySelectorAll('.hotspot-marker').forEach((m) => m.classList.remove('is-active', 'is-hint'));

      btn.classList.add('is-active');

      if (detail) {

        const label = btn.dataset.label ?? '';

        const meaning = btn.dataset.meaning ?? '';

        detail.innerHTML = label

          ? `<strong>${escapeHtml(label)}</strong>：${escapeHtml(meaning)}`

          : escapeHtml(meaning);

      }

    });

  });

  const first = markers[0];

  if (first && detail) {

    first.classList.add('is-active');

    const label = first.dataset.label ?? '';

    const meaning = first.dataset.meaning ?? '';

    detail.innerHTML = label

      ? `<strong>${escapeHtml(label)}</strong>：${escapeHtml(meaning)}`

      : escapeHtml(meaning);

  }

}



export { TAB_LABELS };


