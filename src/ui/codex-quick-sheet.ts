import { getCardRoleHint } from '../codex/card-role.ts';
import { TAROT_DECK } from '../tarot/deck.ts';
import { formatCardNameZh } from '../tarot/card-names.ts';
import { cardFaceImageHtml } from '../tarot/card-images.ts';
import { getJourneyStep } from '../knowledge/fool-journey.ts';
import {
  getVisualHotspots,
  getVisualOverview,
  resolveCardKnowledge,
} from '../knowledge/registry.ts';
import { navigate } from '../router.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type CodexQuickSheetHandle = {
  close: () => void;
};

/** 半屏图鉴浮窗：边占边学，不离开当前解读 */
export function openCodexQuickSheet(deckId: string): CodexQuickSheetHandle {
  document.querySelector('.codex-quick-sheet')?.remove();

  const card = TAROT_DECK.find((c) => c.id === deckId);
  if (!card) {
    return { close: () => {} };
  }

  const knowledge = resolveCardKnowledge(card);
  const role = getCardRoleHint(card);
  const nameCn = formatCardNameZh(card);
  const overview = getVisualOverview(card.id) ?? knowledge.oneSentence;
  const visual = getVisualHotspots(card.id);
  const journey = getJourneyStep(deckId);

  const hotspots = visual?.hotspots.slice(0, 3) ?? [];
  const hotspotHtml = hotspots.length
    ? `<ul class="codex-quick-hotspots">${hotspots
        .map(
          (h) =>
            `<li><strong>${escapeHtml(h.label)}</strong>：${escapeHtml(h.meaning)}</li>`,
        )
        .join('')}</ul>`
    : '';

  const journeyHtml = journey
    ? `<section class="codex-quick-block">
        <h3>愚人之旅 · ${escapeHtml(journey.title)}</h3>
        <p>${escapeHtml(journey.theme)}</p>
      </section>`
    : '';

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
          <h2 id="codex-quick-title" class="codex-quick-title">${escapeHtml(nameCn)}</h2>
          <p class="codex-quick-en">${escapeHtml(card.nameEn)}</p>
          <p class="codex-quick-kws">${escapeHtml(knowledge.keywords.slice(0, 5).join(' · '))}</p>
        </div>
        <button type="button" class="codex-quick-close" aria-label="关闭" data-close>×</button>
      </header>
      <div class="codex-quick-sheet-body">
        <section class="codex-quick-block">
          <h3>一句话牌义</h3>
          <p>${escapeHtml(knowledge.oneSentence)}</p>
        </section>
        <section class="codex-quick-block">
          <h3>在牌组中的位置</h3>
          <p>${escapeHtml(role.formula)}</p>
        </section>
        <section class="codex-quick-block">
          <h3>牌面故事</h3>
          <p>${escapeHtml(overview)}</p>
          ${hotspotHtml}
        </section>
        ${journeyHtml}
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

  return { close };
}
