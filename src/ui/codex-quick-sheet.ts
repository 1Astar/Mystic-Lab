import { getCardRoleHint } from '../codex/card-role.ts';
import { TAROT_DECK } from '../tarot/deck.ts';
import { formatCardNameZh } from '../tarot/card-names.ts';
import { cardFaceImageHtml } from '../tarot/card-images.ts';
import { getJourneyStep } from '../knowledge/fool-journey.ts';
import { buildMinorSuitNumberFormula } from '../knowledge/minor-structure.ts';
import {
  getVisualHotspots,
  resolveCardKnowledge,
} from '../knowledge/registry.ts';
import type { QuestionTopic } from '../knowledge/types.ts';
import { navigate } from '../router.ts';
import {
  renderAlertMisreadHtml,
  renderCodexLearnFoldsHtml,
} from './codex-scene-cards.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function keywordTagsHtml(keywords: string[], extraClass = ''): string {
  if (!keywords.length) return '<p class="codex-quick-muted">暂无关键词</p>';
  return `<div class="codex-kw-tags ${extraClass}">${keywords
    .slice(0, 8)
    .map((k) => `<span class="codex-kw-tag">${escapeHtml(k)}</span>`)
    .join('')}</div>`;
}

export type CodexQuickSheetHandle = {
  close: () => void;
};

export type CodexQuickSheetOptions = {
  topic?: QuestionTopic;
  reversed?: boolean;
};

/** 牌义图鉴正文（Tab / 抽屉共用）：上半常驻 + 下半折叠 */
export function renderCodexKnowledgeBody(
  deckId: string,
  options?: CodexQuickSheetOptions,
): string {
  const card = TAROT_DECK.find((c) => c.id === deckId);
  if (!card) {
    return `<div class="result-empty"><p>未找到这张牌的图鉴资料。</p></div>`;
  }

  const knowledge = resolveCardKnowledge(card);
  const role = getCardRoleHint(card);
  const visual = getVisualHotspots(card.id);
  const journey = getJourneyStep(deckId);
  const reversed = options?.reversed ?? false;
  const formula = buildMinorSuitNumberFormula(deckId, {
    suit: card.suit,
    rank: card.rank,
  });

  const focusKw =
    (reversed
      ? knowledge.reversedKeywords ?? knowledge.keywords
      : knowledge.uprightKeywords ?? knowledge.keywords) ?? knowledge.keywords;

  const hotspots = visual?.hotspots ?? [];
  const nameCn = formatCardNameZh(card);
  const markers = hotspots
    .map(
      (h, i) => `
      <button type="button" class="hotspot-marker${i === 0 ? ' is-hint' : ''}" style="left:${h.x}%;top:${h.y}%;" data-meaning="${escapeHtml(h.meaning)}" data-label="${escapeHtml(h.label)}" aria-label="${escapeHtml(h.label)}">
        <span class="hotspot-dot"></span>
        <span class="hotspot-label">${escapeHtml(h.label)}</span>
      </button>`,
    )
    .join('');

  const hotspotStage = hotspots.length
    ? `
      <section class="codex-quick-block codex-hotspot-stage-block">
        <h3>牌面热点 · 点图学习</h3>
        <p class="codex-quick-muted">点牌面光点，看元素在说什么（学看图，不只背定义）。</p>
        <div class="visual-card-stage codex-visual-stage">
          <div class="visual-card-face ${reversed ? 'is-reversed' : ''}" style="--card-color: ${card.color}">
            ${cardFaceImageHtml(card.id, `${nameCn} · ${card.nameEn}`, 'card-face-img card-face-img-visual')}
            <div class="hotspot-layer">${markers}</div>
          </div>
        </div>
        <p class="hotspot-detail" id="hotspot-detail-codex-${escapeHtml(deckId)}">点选牌面光点查看含义</p>
      </section>`
    : `
      <section class="codex-quick-block">
        <h3>牌面热点</h3>
        <p class="codex-quick-muted">这张牌的牌面热点还在整理中。</p>
      </section>`;

  const structureHint =
    card.arcana === 'major' && journey
      ? `<p class="codex-quick-muted">愚人之旅第 ${journey.order} 步 · ${escapeHtml(journey.title)}：${escapeHtml(journey.theme)}</p>`
      : formula
        ? `<p class="codex-quick-formula">${escapeHtml(formula.line)}</p>`
        : `<p class="codex-quick-muted">${escapeHtml(role.formula)}</p>`;

  return `
    <div class="codex-knowledge-body codex-learn-layout">
      <p class="codex-quick-en">${escapeHtml(card.nameEn)} · ${reversed ? '逆位' : '正位'}</p>
      ${keywordTagsHtml(focusKw, reversed ? 'is-reversed' : 'is-upright')}
      <section class="codex-quick-block">
        <h3>一句话理解</h3>
        <p class="codex-one-liner">${escapeHtml(knowledge.oneSentence)}</p>
      </section>
      ${renderAlertMisreadHtml(knowledge)}
      ${hotspotStage}
      ${renderCodexLearnFoldsHtml(knowledge)}
      <section class="codex-quick-block codex-structure-hint">
        <h3>在牌组中的位置</h3>
        ${structureHint}
      </section>
    </div>`;
}

/** 知识大卡抽屉（兼容旧入口） */
export function openCodexQuickSheet(
  deckId: string,
  options?: CodexQuickSheetOptions,
): CodexQuickSheetHandle {
  document.querySelector('.codex-quick-sheet')?.remove();

  const card = TAROT_DECK.find((c) => c.id === deckId);
  if (!card) {
    return { close: () => {} };
  }

  const nameCn = formatCardNameZh(card);
  const sheet = document.createElement('div');
  sheet.className = 'codex-quick-sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-labelledby', 'codex-quick-title');
  sheet.innerHTML = `
    <div class="codex-quick-sheet-backdrop" data-close></div>
    <div class="codex-quick-sheet-panel">
      <div class="codex-quick-sheet-handle" aria-hidden="true"></div>
      <header class="codex-quick-sheet-head">
        <div class="codex-quick-face">${cardFaceImageHtml(card.id, nameCn, 'codex-quick-img')}</div>
        <div>
          <p class="codex-quick-kicker">牌义图鉴 · 知识大卡</p>
          <h2 id="codex-quick-title" class="codex-quick-title">${escapeHtml(nameCn)}</h2>
        </div>
        <button type="button" class="codex-quick-close" aria-label="关闭" data-close>×</button>
      </header>
      <div class="codex-quick-sheet-body">
        ${renderCodexKnowledgeBody(deckId, options)}
      </div>
      <footer class="codex-quick-sheet-foot">
        <button type="button" class="btn btn-ghost" data-full>打开完整图鉴</button>
        <button type="button" class="btn" data-close>继续看解读</button>
      </footer>
    </div>
  `;

  const close = (): void => {
    sheet.classList.remove('is-visible');
    window.setTimeout(() => sheet.remove(), 280);
    document.removeEventListener('keydown', onKey);
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') close();
  };

  sheet.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', close);
  });
  sheet.querySelector('[data-full]')?.addEventListener('click', () => {
    close();
    navigate('/tarot/tujian');
  });

  document.body.appendChild(sheet);
  requestAnimationFrame(() => sheet.classList.add('is-visible'));
  document.addEventListener('keydown', onKey);

  // 绑定牌面热点点击
  const detail = sheet.querySelector(`#hotspot-detail-codex-${deckId}`) as HTMLElement | null;
  sheet.querySelectorAll<HTMLButtonElement>('.hotspot-marker').forEach((btn) => {
    btn.addEventListener('click', () => {
      sheet.querySelectorAll('.hotspot-marker').forEach((m) => m.classList.remove('is-active', 'is-hint'));
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
  const first = sheet.querySelector<HTMLButtonElement>('.hotspot-marker');
  if (first && detail) {
    first.classList.add('is-active');
    const label = first.dataset.label ?? '';
    const meaning = first.dataset.meaning ?? '';
    detail.innerHTML = label
      ? `<strong>${escapeHtml(label)}</strong>：${escapeHtml(meaning)}`
      : escapeHtml(meaning);
  }

  return { close };
}
