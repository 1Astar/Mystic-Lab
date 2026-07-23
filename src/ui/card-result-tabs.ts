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
  const tags =
    r.interpretationLayers.actionTags?.length
      ? r.interpretationLayers.actionTags
      : r.keywords;
  const kwTags = tags
    .map((k) => `<span class="hero-kw-tag${r.interpretationLayers.actionTags?.length ? ' is-action' : ''}">${escapeHtml(k)}</span>`)
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



function contextualSourceDot(r: CardReading): string {
  let tip: string;
  let kind: 'ai' | 'builtin' | 'fallback';
  if (r.interpretationProvider === 'llm') {
    tip = 'AI 解读 · 已结合你的问题';
    kind = 'ai';
  } else if (isAiConfigured()) {
    tip = '内置解读 · AI 暂不可用，已用规则结合问题作答';
    kind = 'fallback';
  } else {
    tip = '内置解读 · 已结合你的问题（无需配置 AI）';
    kind = 'builtin';
  }
  return `<span class="source-dot source-dot-${kind}" title="${escapeHtml(tip)}" aria-label="${escapeHtml(tip)}"></span>`;
}

function followUpSourceDot(provider: 'llm' | 'mock'): string {
  const tip = provider === 'llm' ? 'AI 追问解读' : '内置追问解读';
  const kind = provider === 'llm' ? 'ai' : 'builtin';
  return `<span class="source-dot source-dot-${kind}" title="${escapeHtml(tip)}" aria-label="${escapeHtml(tip)}"></span>`;
}

function renderAnswerTendency(r: CardReading): string {
  const t = r.interpretationLayers.answerTendency;
  if (!t) return '';

  return `
      <section class="reading-layer-card reading-layer-answer">
        <h4 class="layer-tag">你的答案倾向</h4>
        <p class="answer-tendency-oneliner"><span class="answer-tendency-label">一句话答案</span>${formatParagraph(t.oneLiner)}</p>
        <p class="answer-tendency-action"><span class="answer-tendency-label">关键提醒</span>${formatParagraph(t.actionTip)}</p>
      </section>`;
}

function renderQuestionAnswers(r: CardReading): string {
  const answers = r.interpretationLayers.questionAnswers;
  if (!answers?.length) return '';
  const cards = answers
    .map(
      (a, i) => `
      <article class="qa-answer-card">
        <h5 class="qa-answer-q"><span class="qa-answer-n">${i + 1}</span>${escapeHtml(a.question)}</h5>
        <p class="qa-answer-insight"><span class="qa-answer-label">牌面洞察</span>${formatParagraph(a.insight)}</p>
        ${
          a.action
            ? `<p class="qa-answer-action"><span class="qa-answer-label">行动</span>${formatParagraph(a.action)}</p>`
            : ''
        }
      </article>`,
    )
    .join('');
  return `
      <section class="reading-layer-card reading-layer-qa">
        <h4 class="layer-tag">针对你的问题逐条回答 ${contextualSourceDot(r)}</h4>
        <p class="layer-badge">指哪打哪 · 先看结论再看行动</p>
        ${cards}
        <p class="qa-codex-hint">想了解牌面更详细的背景故事？可切到「牌义图鉴」。</p>
      </section>`;
}

function renderUserIntuition(r: CardReading): string {
  const tip = r.userIntuition?.trim();
  if (!tip) return '';
  const compare = r.intuitionCompare?.trim();
  return `
      <section class="reading-layer-card reading-layer-intuition">
        <h4 class="layer-tag">你的第一直觉</h4>
        <p class="intuition-echo">${formatParagraph(tip)}</p>
        ${
          compare
            ? `<div class="intuition-compare">
          <p class="intuition-compare-label">直觉 × 解读</p>
          <p class="intuition-compare-body">${formatParagraph(compare)}</p>
        </div>`
            : ''
        }
      </section>`;
}

function accordionBlock(title: string, body: string, open: boolean): string {
  if (!body.trim()) return '';
  return `
    <details class="reading-accordion"${open ? ' open' : ''}>
      <summary class="reading-accordion-summary">
        <span class="reading-accordion-title">${escapeHtml(title)}</span>
        <span class="reading-accordion-hint" aria-hidden="true"></span>
      </summary>
      <div class="reading-accordion-body">${body}</div>
    </details>`;
}

function renderElementMappings(
  mappings: NonNullable<CardReading['interpretationLayers']['elementMappings']>,
): string {
  if (!mappings.length) return '';
  return mappings
    .map(
      (m) => `
        <div class="element-mapping-item">
          <h6 class="element-mapping-title">${escapeHtml(m.title)}</h6>
          ${
            m.originalMeaning
              ? `<p class="element-mapping-original"><span class="element-mapping-label">牌面原意</span>${escapeHtml(m.originalMeaning)}</p>`
              : ''
          }
          <p class="element-mapping-scene"><span class="element-mapping-label">场景映射</span>${formatParagraph(m.body)}</p>
        </div>`,
    )
    .join('');
}

function renderFollowUpAnswers(
  answers: NonNullable<CardReading['interpretationLayers']['followUpAnswers']>,
): string {
  if (!answers.length) return '';
  return answers
    .map(
      (a) => `
    <section class="reading-layer-card reading-layer-followup">
      <h4 class="layer-tag">追问解读 ${followUpSourceDot(a.provider)}</h4>
      <p class="context-question-echo">追问：${escapeHtml(a.question)}</p>
      ${a.sections
        .map(
          (s) => `
        <div class="context-section">
          <h5 class="context-section-title">${escapeHtml(s.title)}</h5>
          <p class="reading-block-text">${formatParagraph(s.body)}</p>
        </div>`,
        )
        .join('')}
      ${a.elementMappings?.length ? `<div class="element-mapping-block">${renderElementMappings(a.elementMappings)}</div>` : ''}
    </section>`,
    )
    .join('');
}

const BRIDGE_ACTION_FOLLOWUP = '我该付出什么样的行动来弥合？';

function renderFollowUpChips(followUps: string[] | undefined): string {
  if (!followUps?.length) return '';
  return `
    <div class="followup-chip-row">
      ${followUps
        .map(
          (q) =>
            `<button type="button" class="followup-chip" data-followup-q="${escapeHtml(q)}">🔍 ${escapeHtml(q)}</button>`,
        )
        .join('')}
    </div>
    <p class="followup-status" hidden></p>`;
}

function renderReadingTab(r: CardReading): string {
  const {
    standard,
    contextualReading,
    contextualSections,
    selfReflection,
    elementMappings,
    followUps,
    followUpAnswers,
    answerTendency,
  } = r.interpretationLayers;
  const reminderLabel = r.orientation === 'reversed' ? '逆位提醒' : '正位提醒';
  const questions = selfReflection
    .map((q) => `<li>${formatParagraph(q)}</li>`)
    .join('');

  const overviewSection = contextualSections?.find(
    (s) => s.title.includes('热点') || s.title.includes('核心') || s.title.includes('整体'),
  );
  const otherSections = (contextualSections ?? []).filter((s) => s !== overviewSection);
  const adviceSections = otherSections.filter(
    (s) => s.title.includes('建议') || s.title.includes('疏导') || s.title.includes('行动'),
  );
  const restSections = otherSections.filter((s) => !adviceSections.includes(s));

  const step2Body = elementMappings?.length
    ? `<div class="element-mapping-block">${renderElementMappings(elementMappings)}</div>`
    : restSections
        .map(
          (s) => `
        <div class="context-section">
          <h5 class="context-section-title">${escapeHtml(s.title)}</h5>
          <p class="reading-block-text">${formatParagraph(s.body)}</p>
        </div>`,
        )
        .join('') ||
      (!overviewSection && contextualReading
        ? `<p class="reading-block-text">${formatParagraph(contextualReading)}</p>`
        : '');

  const step3Body = adviceSections.length
    ? adviceSections
        .map(
          (s) => `
          <h5 class="context-section-title">${escapeHtml(s.title)}</h5>
          <p class="reading-block-text">${formatParagraph(s.body)}</p>`,
        )
        .join('')
    : '';

  const chipList = [...(followUps ?? [])];
  if (
    answerTendency?.actionTip?.trim() &&
    !chipList.includes(BRIDGE_ACTION_FOLLOWUP)
  ) {
    chipList.unshift(BRIDGE_ACTION_FOLLOWUP);
  }

  const followUpBody = `
      ${renderFollowUpAnswers(followUpAnswers ?? [])}
      ${
        chipList.length
          ? `<p class="layer-badge">同牌深化 · 点选后重新解读</p>${renderFollowUpChips(chipList)}`
          : ''
      }`;

  const questionEcho = r.question
    ? `<p class="context-question-echo">你正在问：${escapeHtml(r.question)}</p>`
    : '';
  const bgEcho = r.readingContext.background?.trim()
    ? `<p class="context-background-echo">补充背景：${escapeHtml(r.readingContext.background.trim())}</p>`
    : '';

  // 热点整体解读迁到「看懂牌面」；此刻解读直接摊开现实状况与行动
  const contextBody = `${accordionBlock('① 现实状况 · 结合你的问题', step2Body, true)}${accordionBlock('② 行动指南', step3Body, true)}`;
  const hotspotHint = overviewSection
    ? `<p class="layer-badge reading-hotspot-jump">结合问题的「热点整体解读」已放到 Tab「看懂牌面」</p>`
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
      ${renderUserIntuition(r)}
      ${renderQuestionAnswers(r)}
      ${renderAnswerTendency(r)}
      <section class="reading-layer-card reading-layer-context">
        <h4 class="layer-tag">结合你的问题 · 补充拆解 ${contextualSourceDot(r)}</h4>
        ${questionEcho}
        ${bgEcho}
        ${hotspotHint}
        ${contextBody}
      </section>
      ${
        followUpBody.trim()
          ? `<section class="reading-layer-card reading-layer-followup-wrap">${accordionBlock(
              '继续追问',
              `<div class="reading-layer-followup-chips">${followUpBody}</div>`,
              false,
            )}</section>`
          : ''
      }
      <section class="reading-layer-card reading-layer-reflect">
        <h4 class="layer-tag">给你的一个提问</h4>
        <p class="layer-badge">回到心里</p>
        <ul class="reflect-list">${questions}</ul>
      </section>
      <button type="button" class="codex-story-cta" data-codex-sheet="${escapeHtml(r.cardId)}">
        这张牌有什么故事？前往【图鉴】查看它的愚人之旅 →
      </button>
    </div>`;
}

function renderVisualTab(r: CardReading): string {
  const visual = getVisualHotspots(r.cardId);
  const deckCard = getCardById(r.cardId);
  const cardColor = deckCard?.color ?? 'var(--purple)';
  const overview = getVisualOverview(r.cardId) ?? r.selectedCard.oneSentence;
  const questionBridge = r.interpretationLayers.visualQuestionBridge;
  const overviewSection = r.interpretationLayers.contextualSections?.find(
    (s) => s.title.includes('热点') || s.title.includes('核心') || s.title.includes('整体'),
  );
  const questionEcho = r.question
    ? `<p class="context-question-echo">你正在问：${escapeHtml(r.question)}</p>`
    : '';
  const bgEcho = r.readingContext.background?.trim()
    ? `<p class="context-background-echo">补充背景：${escapeHtml(r.readingContext.background.trim())}</p>`
    : '';

  const hotspotAnswer = overviewSection
    ? `
      <section class="visual-hotspot-answer reading-layer-card">
        <h4 class="layer-tag">热点整体解读 · 结合你的问题 ${contextualSourceDot(r)}</h4>
        ${questionEcho}
        ${bgEcho}
        <p class="reading-block-text">${formatParagraph(overviewSection.body)}</p>
      </section>`
    : questionBridge
      ? `
      <section class="visual-hotspot-answer reading-layer-card">
        <h4 class="layer-tag">热点整体解读 · 结合你的问题</h4>
        ${questionEcho}
        <p class="reading-block-text">${formatParagraph(questionBridge)}</p>
      </section>`
      : '';

  if (!visual?.hotspots.length) {
    return `
      <div class="result-tab-panel" data-panel="visual">
        ${hotspotAnswer || `<div class="result-empty"><p>这张牌的牌面热点还在整理中。</p></div>`}
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

  return `
    <div class="result-tab-panel" data-panel="visual">
      ${hotspotAnswer}
      <div class="visual-card-stage">
        <div class="visual-card-face ${r.orientation === 'reversed' ? 'is-reversed' : ''}" style="--card-color: ${cardColor}">
          ${cardFaceImageHtml(r.cardId, `${r.selectedCard.nameCn} · ${r.selectedCard.nameEn}`, 'card-face-img card-face-img-visual')}
          <div class="hotspot-layer">${markers}</div>
        </div>
      </div>
      <p class="hotspot-detail" id="hotspot-detail-${r.cardId}">点选牌面光点查看含义</p>
      <section class="visual-overview-block">
        <h4 class="visual-section-title">整牌画面</h4>
        <p class="visual-overview-text">${formatParagraph(overview)}</p>
      </section>
      <section class="visual-elements-block">
        <h4 class="visual-section-title">牌面元素</h4>
        <p class="visual-hint">也可直接看下方列表；点列表或牌面光点都会更新说明</p>
        <ul class="visual-elements-list">${elementList}</ul>
      </section>
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



export type CardResultTabsOptions = {
  /** 追问后更新牌解读（写入 reading / 手札快照） */
  onCardReadingChange?: (reading: CardReading) => void;
};

export function mountCardResultTabs(
  container: HTMLElement,
  reading: CardReading,
  activeTab: ResultTabId = 'reading',
  options?: CardResultTabsOptions,
): void {
  let current = reading;

  const renderShell = (tab: ResultTabId): void => {
    const tabs = (Object.keys(TAB_LABELS) as ResultTabId[])
      .map((id) => {
        const hotspotDot =
          id === 'visual' && current.hasVisualHotspots
            ? '<span class="tab-hotspot-dot" aria-hidden="true"></span>'
            : '';
        return `
    <button type="button" class="result-tab-btn ${id === tab ? 'is-active' : ''}" data-tab="${id}" role="tab" aria-selected="${id === tab}">
      ${TAB_LABELS[id]}${hotspotDot}
    </button>`;
      })
      .join('');

    container.innerHTML = `
    <div class="card-result-tabs" data-card-id="${escapeHtml(current.cardId)}">
      ${renderCardHero(current)}
      <div class="result-tab-bar" role="tablist">${tabs}</div>
      <div class="result-tab-panels">
        ${PANEL_RENDERERS[tab](current)}
      </div>
    </div>
  `;

    const root = container.querySelector('.card-result-tabs')!;
    const panelHost = container.querySelector('.result-tab-panels')!;

    root.querySelectorAll<HTMLButtonElement>('.result-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.tab as ResultTabId;
        root.querySelectorAll('.result-tab-btn').forEach((b) => {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
        panelHost.innerHTML = PANEL_RENDERERS[next](current);
        wireHotspotClicks(panelHost, current.cardId);
        wireFollowUpChips(panelHost);
        wireCodexStoryCta(panelHost);
      });
    });

    wireHotspotClicks(panelHost, current.cardId);
    wireFollowUpChips(panelHost);
    wireCodexStoryCta(panelHost);
  };

  const wireCodexStoryCta = (panelHost: Element): void => {
    panelHost.querySelectorAll<HTMLButtonElement>('[data-codex-sheet]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.codexSheet?.trim();
        if (!id) return;
        void import('./codex-quick-sheet.ts').then(({ openCodexQuickSheet }) => {
          openCodexQuickSheet(id);
        });
      });
    });
  };

  const wireFollowUpChips = (panelHost: Element): void => {
    const chips = panelHost.querySelectorAll<HTMLButtonElement>('.followup-chip');
    const status = panelHost.querySelector<HTMLElement>('.followup-status');
    chips.forEach((btn) => {
      btn.addEventListener('click', () => {
        void (async () => {
          const q = btn.dataset.followupQ?.trim();
          if (!q) return;
          chips.forEach((c) => {
            c.disabled = true;
          });
          if (status) {
            status.hidden = false;
            status.textContent = '正在结合同牌元素深化追问…';
          }
          try {
            const { interpretCardFollowUp } = await import(
              '../interpretation/llm-provider.ts'
            );
            current = await interpretCardFollowUp(current, q);
            options?.onCardReadingChange?.(current);
            renderShell('reading');
          } catch {
            if (status) {
              status.textContent = '追问失败，请稍后再试';
            }
            chips.forEach((c) => {
              c.disabled = false;
            });
          }
        })();
      });
    });
  };

  renderShell(activeTab);
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


