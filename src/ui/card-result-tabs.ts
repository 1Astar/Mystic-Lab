import type { CardReading } from '../interpretation/types.ts';
import { isAiConfigured } from '../ai/settings.ts';
import { getVisualHotspots, getVisualOverview } from '../knowledge/registry.ts';
import { getCardById } from '../tarot/deck.ts';
import { cardFaceImageHtml } from '../tarot/card-images.ts';
import { loadJournalEntries } from '../journal/records.ts';
import {
  encounterGuidanceLabel,
  encounterPositionKind,
  encounterReflectPrompt,
  resolveEncounterGuidance,
} from '../knowledge/encounter-guidance.ts';export type ResultTabId = 'reading' | 'visual' | 'codex' | 'encounter';

const TAB_LABELS: Record<ResultTabId, string> = {
  reading: '此刻解读',
  visual: '看懂牌面',
  codex: '牌义图鉴',
  encounter: '我的相遇',
};

const TAB_ORDER: ResultTabId[] = ['reading', 'visual', 'codex', 'encounter'];

function isResultTabId(v: string): v is ResultTabId {
  return (TAB_ORDER as string[]).includes(v);
}

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

function renderAnswerTendencyLead(r: CardReading): string {
  const t = r.interpretationLayers.answerTendency;
  if (!t?.oneLiner?.trim()) return '';
  // 只保留高度概括结论；落地行动交给「行动指南」/逐条问答
  const short = t.overall?.trim() || t.tendency?.trim() || '';
  return `
      <div class="reading-lead-conclusion">
        ${short ? `<p class="reading-lead-tag">${escapeHtml(short)}</p>` : ''}
        <p class="reading-lead-body">${formatParagraph(t.oneLiner)}</p>
      </div>`;
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
            ? `<p class="qa-answer-action"><span class="qa-answer-label">可执行</span>${formatParagraph(a.action)}</p>`
            : ''
        }
      </article>`,
    )
    .join('');
  return `
      <section class="reading-layer-card reading-layer-qa">
        <h4 class="layer-tag">针对你的问题 ${contextualSourceDot(r)}</h4>
        <p class="layer-badge">指哪打哪 · 行动导向</p>
        ${cards}
        <p class="qa-codex-hint">想了解牌面更详细的背景故事？切到「牌义图鉴」Tab</p>
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
        <span class="reading-accordion-chevron" aria-hidden="true"></span>
      </summary>
      <div class="reading-accordion-body">${body}</div>
    </details>`;
}

function renderElementMappings(
  mappings: NonNullable<CardReading['interpretationLayers']['elementMappings']>,
  question = '',
): string {
  if (!mappings.length) return '';
  return mappings
    .map((m) => {
      const body = sanitizeElementMappingBody(m.body, question);
      return `
        <div class="element-mapping-item">
          <h6 class="element-mapping-title">${escapeHtml(m.title)}</h6>
          ${
            m.originalMeaning
              ? `<p class="element-mapping-original"><span class="element-mapping-label">牌面原意</span>${escapeHtml(m.originalMeaning)}</p>`
              : ''
          }
          <p class="element-mapping-scene"><span class="element-mapping-label">场景映射</span>${formatParagraph(body)}</p>
        </div>`;
    })
    .join('');
}

/** 去掉「对照你的问题」复读，以及把整段子问题列表塞进映射的脏数据 */
function sanitizeElementMappingBody(body: string, question: string): string {
  let text = body.trim();
  text = text.replace(/^对照你的问题[「「][^」」]*[」」][：:]\s*/u, '');
  text = text.replace(/^对照[「「][^」」]*[」」][：:]\s*/u, '');

  const parts = question
    ? question
        .split(/[\n；;]+/)
        .map((p) => p.replace(/^\s*\d+[\.．、)\）]\s*/, '').trim())
        .filter((p) => p.length >= 4)
    : [];
  if (parts.length >= 2) {
    const hit = parts.filter((p) => text.includes(p.slice(0, Math.min(10, p.length)))).length;
    if (hit >= Math.min(3, parts.length)) {
      const lines = text
        .split(/\n+/)
        .map((l) => l.trim())
        .filter(Boolean)
        .filter((l) => {
          if (/^对照你的问题/.test(l)) return false;
          if (/^\d+[\.．、]/.test(l) && parts.some((p) => l.includes(p.slice(0, 8)))) {
            return false;
          }
          return true;
        });
      if (lines.length) text = lines.join('\n');
    }
  }
  return text.trim() || body.trim();
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
      ${a.elementMappings?.length ? `<div class="element-mapping-block">${renderElementMappings(a.elementMappings, a.question)}</div>` : ''}
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
    contextualReading,
    contextualSections,
    selfReflection,
    followUps,
    followUpAnswers,
    answerTendency,
  } = r.interpretationLayers;
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

  const step2Body = restSections
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
      : `<p class="layer-badge">牌面元素映射 →「看懂牌面」；百科知识 →「牌义图鉴」</p>`);

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

  const hasQa = Boolean(r.interpretationLayers.questionAnswers?.length);
  const contextBody = hasQa
    ? ''
    : `${accordionBlock('① 情境补充', step2Body, false)}${accordionBlock('② 行动指南', step3Body, true)}`;

  return `
    <div class="result-tab-panel" data-panel="reading">
      ${renderUserIntuition(r)}
      ${
        hasQa
          ? renderQuestionAnswers(r)
          : `<section class="reading-layer-card reading-layer-context">
        <h4 class="layer-tag">结合你的问题 ${contextualSourceDot(r)}</h4>
        ${questionEcho}
        ${bgEcho}
        ${renderAnswerTendencyLead(r)}
        ${contextBody}
      </section>`
      }
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
      <button type="button" class="codex-story-cta" data-goto-tab="codex">
        想学这张牌的百科与结构？切到【牌义图鉴】→
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
  const questionEcho = (() => {
    const q = r.question?.trim();
    if (!q) return '';
    const pos = r.position?.trim();
    const posBit = pos ? ` · 本张位次「${pos}」` : '';
    // 多子问不在热点区再复述整串问题
    if (q.includes('\n') || /[；;]/.test(q) || q.length > 48) {
      return `<p class="context-question-echo">结合本题与位次解读本张牌${escapeHtml(posBit)}（子问题见「此刻解读」，此处不重复罗列）</p>`;
    }
    return `<p class="context-question-echo">你正在问：${escapeHtml(q)}${escapeHtml(posBit)}</p>`;
  })();
  const bgEcho = r.readingContext.background?.trim()
    ? `<p class="context-background-echo">补充背景：${escapeHtml(r.readingContext.background.trim())}</p>`
    : '';

  const hotspotAnswer = overviewSection
    ? `
      <section class="visual-hotspot-answer reading-layer-card">
        <h4 class="layer-tag">热点整体解读 · 结合位次 ${contextualSourceDot(r)}</h4>
        ${questionEcho}
        ${bgEcho}
        <p class="reading-block-text">${formatParagraph(overviewSection.body)}</p>
      </section>`
    : questionBridge
      ? `
      <section class="visual-hotspot-answer reading-layer-card">
        <h4 class="layer-tag">热点整体解读 · 结合位次</h4>
        ${questionEcho}
        <p class="reading-block-text">${formatParagraph(questionBridge)}</p>
      </section>`
      : '';

  if (!visual?.hotspots.length) {
    return `
      <div class="result-tab-panel" data-panel="visual">
        ${hotspotAnswer || `<div class="result-empty"><p>这张牌的牌面热点还在整理中。</p></div>`}
        <button type="button" class="codex-story-cta" data-goto-tab="codex">
          切到【牌义图鉴】看百科与结构 →
        </button>
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

  const mappings = r.interpretationLayers.elementMappings;
  const mappingBlock =
    mappings?.length
      ? `<section class="visual-mapping-block reading-layer-card">
        <h4 class="layer-tag">牌面元素 · 场景映射</h4>
        <p class="visual-hint">问题只在上方出现一次；下面按元素翻译到你的场景。</p>
        <div class="element-mapping-block">${renderElementMappings(mappings, r.question)}</div>
      </section>`
      : '';

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
      ${mappingBlock}
      <section class="visual-elements-block">
        <h4 class="visual-section-title">牌面元素</h4>
        <p class="visual-hint">也可直接看下方列表；点列表或牌面光点都会更新说明</p>
        <ul class="visual-elements-list">${elementList}</ul>
      </section>
      <button type="button" class="codex-story-cta" data-goto-tab="codex">
        关键词 · 愚人之旅 / 牌组×数字 → 切到【牌义图鉴】
      </button>
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
        .map((e) => {
          const kind = encounterPositionKind(e.spreadLabel);
          const snap = e.journalId
            ? loadJournalEntries().find((j) => j.id === e.journalId)?.readingSnapshot
            : undefined;
          const guidance = resolveEncounterGuidance(
            {
              at: e.at,
              question: e.question,
              summary: e.summary ?? '',
              reversed: e.reversed,
              spreadLabel: e.spreadLabel,
              journalId: e.journalId,
              guidance: e.guidance,
            },
            r.cardId,
            r.cardName,
            snap,
          );
          return `
        <div class="encounter-timeline-item">
          <time>${formatDateTime(e.at)}</time>
          <p>${e.question ? `问：${escapeHtml(e.question)}` : '（未记录问题）'}</p>
          <p class="encounter-timeline-meta">${escapeHtml(e.spreadLabel)} · ${e.reversed ? '逆位' : '正位'}</p>
          ${
            guidance
              ? `<div class="encounter-guidance">
                  <p class="encounter-guidance-label">${escapeHtml(encounterGuidanceLabel(kind))}</p>
                  <p class="encounter-guidance-body">${formatParagraph(guidance)}</p>
                </div>`
              : ''
          }
          <p class="encounter-reflect">${escapeHtml(encounterReflectPrompt(kind))}</p>
        </div>`;
        })
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



function renderCodexTab(r: CardReading): string {
  // 同步渲染占位；mount 时用真实正文替换（避免循环依赖体积）
  return `
    <div class="result-tab-panel" data-panel="codex" data-codex-host="${escapeHtml(r.cardId)}">
      <p class="codex-tab-loading">加载牌义图鉴…</p>
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
  /** 隐藏「此刻解读」（整盘串讲已覆盖时用） */
  hideReadingTab?: boolean;
};

export function mountCardResultTabs(
  container: HTMLElement,
  reading: CardReading,
  activeTab: ResultTabId | string = 'reading',
  options?: CardResultTabsOptions,
): void {
  let current = reading;
  const tabOrder = options?.hideReadingTab
    ? (TAB_ORDER.filter((id) => id !== 'reading') as ResultTabId[])
    : TAB_ORDER;
  const startTab: ResultTabId = isResultTabId(activeTab)
    ? tabOrder.includes(activeTab)
      ? activeTab
      : tabOrder[0]!
    : tabOrder[0]!;

  const fillCodexPanel = (panelHost: Element): void => {
    const host = panelHost.querySelector<HTMLElement>('[data-codex-host]');
    if (!host) return;
    void import('./codex-quick-sheet.ts').then(({ renderCodexKnowledgeBody }) => {
      host.innerHTML = `
        <section class="reading-layer-card codex-tab-card">
          <h4 class="layer-tag">牌义图鉴 · 学会看牌</h4>
          ${renderCodexKnowledgeBody(current.cardId, {
            topic: current.topic,
            reversed: current.orientation === 'reversed',
          })}
          <button type="button" class="btn btn-ghost codex-full-link" data-full-codex>打开完整图鉴</button>
        </section>`;
      host.querySelector('[data-full-codex]')?.addEventListener('click', () => {
        void import('../router.ts').then(({ navigate }) => navigate('/tarot/tujian'));
      });
      wireHotspotClicks(host, current.cardId);
    });
  };

  const renderShell = (tab: ResultTabId): void => {
    const tabs = tabOrder
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
    <div class="card-result-tabs${tabOrder.length === 4 ? ' is-four-tabs' : ' is-three-tabs'}" data-card-id="${escapeHtml(current.cardId)}">
      ${renderCardHero(current)}
      <div class="result-tab-bar" role="tablist">${tabs}</div>
      <div class="result-tab-panels">
        ${PANEL_RENDERERS[tab](current)}
      </div>
    </div>
  `;

    const root = container.querySelector('.card-result-tabs')!;
    const panelHost = container.querySelector('.result-tab-panels')!;

    const switchTab = (next: ResultTabId): void => {
      root.querySelectorAll('.result-tab-btn').forEach((b) => {
        const btn = b as HTMLButtonElement;
        const on = btn.dataset.tab === next;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panelHost.innerHTML = PANEL_RENDERERS[next](current);
      wireHotspotClicks(panelHost, current.cardId);
      wireFollowUpChips(panelHost);
      wireGotoCodex(panelHost);
      if (next === 'codex') fillCodexPanel(panelHost);
    };

    root.querySelectorAll<HTMLButtonElement>('.result-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.tab;
        if (next && isResultTabId(next)) switchTab(next);
      });
    });

    const wireGotoCodex = (scope: Element): void => {
      scope.querySelectorAll<HTMLButtonElement>('[data-goto-tab="codex"]').forEach((btn) => {
        btn.addEventListener('click', () => switchTab('codex'));
      });
    };

    wireHotspotClicks(panelHost, current.cardId);
    wireFollowUpChips(panelHost);
    wireGotoCodex(panelHost);
    if (tab === 'codex') fillCodexPanel(panelHost);
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

  renderShell(startTab);
}



function wireHotspotClicks(panelHost: Element, cardId: string): void {
  const detail =
    (panelHost.querySelector(`#hotspot-detail-codex-${cardId}`) as HTMLElement | null) ||
    (panelHost.querySelector(`#hotspot-detail-${cardId}`) as HTMLElement | null) ||
    (panelHost.querySelector('.hotspot-detail') as HTMLElement | null);

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


