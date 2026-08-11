/**
 * 猜命盘盲盒：每日一题复习
 */
import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { baziSysTabsHtml } from '../ui/lab-sys-tabs.ts';
import { guessDayKey, pickDailyGuessCard, type GuessCard } from '../bazi/guess-pack.ts';
import {
  getTodayGuessRecord,
  saveGuessAnswer,
  type GuessDayRecord,
} from '../bazi/guess-progress.ts';
import {
  learnStatusLine,
  loadBaziLearn,
  markGuessAnswer,
  resolveBaziLearnTitle,
} from '../bazi/learn-store.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderBaziGuess(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page life-page bazi-guess-page';
  mountEnvBanner(page);

  const dayKey = guessDayKey();
  const card = pickDailyGuessCard(dayKey);
  let record = getTodayGuessRecord(dayKey);

  function paint(): void {
    const title = resolveBaziLearnTitle(loadBaziLearn());
    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/bazi/reading">← 命盘解读</button>
      ${baziSysTabsHtml('reading')}
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <p class="home-eyebrow">DAILY BLIND BOX</p>
        <h1 class="page-title">猜命盘</h1>
        <p class="page-subtitle">用已学特质复习 · 每日一题</p>
        <p class="bazi-learn-badge"><button type="button" class="bazi-learn-badge-btn" data-path="/bazi/learn">${escapeHtml(learnStatusLine())} · 知识树 ›</button></p>
      </header>

      <section class="bazi-guess-card" aria-label="今日盲盒">
        <p class="bazi-sense-kicker">${escapeHtml(dayKey)} · ${escapeHtml(card.kind)}</p>
        <h2 class="bazi-guess-seal">${escapeHtml(record ? card.name : card.sealedLabel)}</h2>
        <ul class="bazi-guess-clues">
          ${card.clues.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
        </ul>
        <p class="bazi-guess-q">${escapeHtml(card.question)}</p>
        ${
          record
            ? resultHtml(card, record)
            : `<div class="bazi-guess-options" role="group" aria-label="选项">
            ${card.options
              .map(
                (o) => `
              <button type="button" class="bazi-guess-opt" data-choice="${escapeHtml(o.id)}">
                ${escapeHtml(o.label)}
              </button>`,
              )
              .join('')}
          </div>`
        }
      </section>

      <p class="bazi-guess-note">题库为学习对照（影视/意象），不是对真人排盘鉴定。称号：${escapeHtml(title.blurb)}</p>
      <div class="bazi-reading-actions">
        <button type="button" class="life-btn-ghost" data-path="/bazi/reading">回命盘解读 ›</button>
        <button type="button" class="life-btn-ghost" data-path="/bazi/tujian">去图鉴 ›</button>
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
        record = saveGuessAnswer(card, choiceId, dayKey);
        markGuessAnswer(`guess:${dayKey}`, record.correct);
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

function resultHtml(card: GuessCard, record: GuessDayRecord): string {
  const picked = card.options.find((o) => o.id === record.choiceId);
  const explain = record.correct ? card.explainCorrect : card.explainWrong;
  return `
    <div class="bazi-guess-result ${record.correct ? 'is-ok' : 'is-miss'}">
      <p class="bazi-guess-verdict">${record.correct ? '猜对了' : '差一点点'}</p>
      <p class="bazi-guess-pick">你选：${escapeHtml(picked?.label || record.choiceId)}</p>
      <p class="bazi-guess-explain">${escapeHtml(explain)}</p>
      <p class="bazi-guess-xp">${
        record.correct ? '答对记入学习轨' : '看完解释也算复习'
      } · 明日换题</p>
    </div>`;
}
