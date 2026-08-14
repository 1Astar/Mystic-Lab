/**
 * Lab 轻练习页：每日盲盒（对标八字猜盘交互）
 */
import { navigate } from '../router.ts';
import { mountEnvBanner } from './banner.ts';
import { mysticEmblemHtml, type MysticEmblemKind } from './mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import {
  createLightGuessStore,
  lightGuessDayKey,
  pickDailyLightGuess,
  type LightGuessCard,
  type LightGuessDayRecord,
} from '../lab/light-guess.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type LabGuessPageOpts = {
  emblem: MysticEmblemKind;
  title: string;
  subtitle: string;
  backPath: string;
  backLabel: string;
  tujianPath: string;
  tujianLabel: string;
  storageKey: string;
  cards: LightGuessCard[];
  note: string;
  /** 可选顶栏 HTML（如体系 tabs） */
  tabsHtml?: string;
};

export function mountLabGuessPage(root: HTMLElement, opts: LabGuessPageOpts): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page life-page lab-guess-page';
  mountEnvBanner(page);

  const dayKey = lightGuessDayKey();
  const card = pickDailyLightGuess(opts.cards, dayKey);
  const store = createLightGuessStore(opts.storageKey);
  let record = store.getTodayRecord(dayKey);

  function paint(): void {
    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="${escapeHtml(opts.backPath)}">${escapeHtml(opts.backLabel)}</button>
      ${opts.tabsHtml ?? ''}
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml(opts.emblem, 'md')}</div>
        <p class="home-eyebrow">DAILY BLIND BOX</p>
        <h1 class="page-title">${escapeHtml(opts.title)}</h1>
        <p class="page-subtitle">${escapeHtml(opts.subtitle)}</p>
      </header>

      <section class="lab-guess-card" aria-label="今日盲盒">
        <p class="lab-guess-kicker">${escapeHtml(dayKey)} · ${escapeHtml(card.kind)}</p>
        <h2 class="lab-guess-seal">${escapeHtml(record ? card.name : card.sealedLabel)}</h2>
        <ul class="lab-guess-clues">
          ${card.clues.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
        </ul>
        <p class="lab-guess-q">${escapeHtml(card.question)}</p>
        ${
          record
            ? resultHtml(card, record)
            : `<div class="lab-guess-options" role="group" aria-label="选项">
            ${card.options
              .map(
                (o) => `
              <button type="button" class="lab-guess-opt" data-choice="${escapeHtml(o.id)}">
                ${escapeHtml(o.label)}
              </button>`,
              )
              .join('')}
          </div>`
        }
      </section>

      <p class="lab-guess-note">${escapeHtml(opts.note)}</p>
      <div class="bazi-reading-actions">
        <button type="button" class="life-btn-ghost" data-path="${escapeHtml(opts.backPath)}">返回 ›</button>
        <button type="button" class="life-btn-ghost" data-path="${escapeHtml(opts.tujianPath)}">${escapeHtml(opts.tujianLabel)}</button>
      </div>
    `;

    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });

    page.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const choiceId = btn.dataset.choice || '';
        if (!choiceId || record) return;
        record = store.saveAnswer(card, choiceId, dayKey);
        paint();
      });
    });
  }

  paint();
  root.appendChild(page);
  return () => {
    stars.remove();
  };
}

function resultHtml(card: LightGuessCard, record: LightGuessDayRecord): string {
  const picked = card.options.find((o) => o.id === record.choiceId);
  const explain = record.correct ? card.explainCorrect : card.explainWrong;
  return `
    <div class="lab-guess-result ${record.correct ? 'is-ok' : 'is-miss'}">
      <p class="lab-guess-verdict">${record.correct ? '猜对了' : '差一点点'}</p>
      <p class="lab-guess-pick">你选：${escapeHtml(picked?.label || record.choiceId)}</p>
      <p class="lab-guess-explain">${escapeHtml(explain)}</p>
      <p class="lab-guess-xp">${
        record.correct ? '答对也算复习到位' : '看完解释也算复习'
      } · 明日换题</p>
    </div>`;
}
