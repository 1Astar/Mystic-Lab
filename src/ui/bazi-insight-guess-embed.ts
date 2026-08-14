/**
 * 洞见 / 运势内嵌猜命盘（半真半假盘）
 */
import { navigate } from '../router.ts';
import {
  pickInsightGuessCard,
  type InsightGuessCard,
  type InsightGuessSurface,
} from '../bazi/guess-insight-embed.ts';
import { guessDayKey } from '../bazi/guess-pack.ts';
import { markGuessAnswer } from '../bazi/learn-store.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const EMBED_STORE = 'mystic-lab-bazi-insight-guess-v1';

type EmbedRec = {
  dayKey: string;
  cardId: string;
  choiceId: string;
  correct: boolean;
};

type EmbedStore = {
  v: 1;
  /** `${dayKey}:${surface}` */
  byKey: Record<string, EmbedRec>;
};

let memoryStore: EmbedStore | null = null;

function loadEmbedStore(): EmbedStore {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(EMBED_STORE);
      if (raw) {
        const p = JSON.parse(raw) as EmbedStore;
        if (p?.v === 1 && p.byKey) return p;
      }
    }
  } catch {
    /* fall through */
  }
  return memoryStore ?? { v: 1, byKey: {} };
}

function saveEmbedStore(store: EmbedStore): void {
  memoryStore = store;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(EMBED_STORE, JSON.stringify(store));
    }
  } catch {
    /* ignore */
  }
}

function recKey(surface: InsightGuessSurface, dayKey: string): string {
  return `${dayKey}:${surface}`;
}

export function getInsightGuessEmbedRecord(
  surface: InsightGuessSurface,
  dayKey = guessDayKey(),
): EmbedRec | null {
  return loadEmbedStore().byKey[recKey(surface, dayKey)] ?? null;
}

export function saveInsightGuessEmbedAnswer(
  surface: InsightGuessSurface,
  card: InsightGuessCard,
  choiceId: string,
  dayKey = guessDayKey(),
): EmbedRec {
  const correct = choiceId === card.answerId;
  const rec: EmbedRec = { dayKey, cardId: card.id, choiceId, correct };
  const store = loadEmbedStore();
  store.byKey[recKey(surface, dayKey)] = rec;
  saveEmbedStore(store);
  markGuessAnswer(`insight-guess:${dayKey}:${surface}`, correct);
  return rec;
}

export function resetInsightGuessEmbedForTests(): void {
  memoryStore = null;
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(EMBED_STORE);
  } catch {
    /* ignore */
  }
}

function resultHtml(card: InsightGuessCard, rec: EmbedRec): string {
  const pick = card.options.find((o) => o.id === rec.choiceId)?.label ?? rec.choiceId;
  return `
    <div class="bazi-insight-guess-result ${rec.correct ? 'is-ok' : 'is-miss'}">
      <p class="bazi-insight-guess-verdict">${rec.correct ? '猜对了' : '再对照一下'}</p>
      <p class="bazi-insight-guess-pick">你选：${escapeHtml(pick)}</p>
      <p class="bazi-insight-guess-explain">${escapeHtml(
        rec.correct ? card.explainCorrect : card.explainWrong,
      )}</p>
    </div>`;
}

export function insightGuessEmbedHtml(
  surface: InsightGuessSurface,
  dayKey = guessDayKey(),
): string {
  const card = pickInsightGuessCard(surface, dayKey);
  if (!card) return '';
  const rec = getInsightGuessEmbedRecord(surface, dayKey);
  const kicker = surface === 'luck' ? '运势小练习' : '洞见小练习';
  return `
    <aside class="bazi-insight-guess" data-insight-guess="${escapeHtml(surface)}" aria-label="${escapeHtml(kicker)}">
      <p class="bazi-insight-guess-kicker">${escapeHtml(kicker)} · 半真半假盘</p>
      <h3 class="bazi-insight-guess-title">${escapeHtml(card.sealedLabel)}</h3>
      <ul class="bazi-insight-guess-chart">
        ${card.fakeChart.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
      </ul>
      <p class="bazi-insight-guess-q">${escapeHtml(card.question)}</p>
      ${
        rec
          ? resultHtml(card, rec)
          : `<div class="bazi-insight-guess-options" role="group">
              ${card.options
                .map(
                  (o) => `
                <button type="button" class="bazi-insight-guess-opt" data-insight-choice="${escapeHtml(o.id)}">
                  ${escapeHtml(o.label)}
                </button>`,
                )
                .join('')}
            </div>`
      }
      <p class="bazi-insight-guess-foot">
        <button type="button" class="bazi-insight-guess-more" data-path="/bazi/guess">去猜命盘盲盒 ›</button>
        <span>学习对照 · 非真人鉴定</span>
      </p>
    </aside>`;
}

export function bindInsightGuessEmbed(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-insight-guess]').forEach((box) => {
    const surface = box.dataset.insightGuess as InsightGuessSurface;
    if (surface !== 'insight' && surface !== 'luck') return;
    const dayKey = guessDayKey();
    const card = pickInsightGuessCard(surface, dayKey);
    if (!card) return;

    box.querySelectorAll<HTMLButtonElement>('[data-insight-choice]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const choiceId = btn.dataset.insightChoice || '';
        if (!choiceId) return;
        const rec = saveInsightGuessEmbedAnswer(surface, card, choiceId, dayKey);
        const host = box.querySelector('.bazi-insight-guess-options');
        if (host) host.outerHTML = resultHtml(card, rec);
      });
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-path="/bazi/guess"]').forEach((btn) => {
    if (!btn.closest('[data-insight-guess]')) return;
    btn.addEventListener('click', () => navigate('/bazi/guess'));
  });
}
