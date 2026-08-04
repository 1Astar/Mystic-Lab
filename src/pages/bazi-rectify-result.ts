import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { loadRectifyDraft } from '../bazi/rectify-draft.ts';
import { eventsReadyForScore, EVENT_TYPE_LABELS, filledEvents } from '../bazi/rectify-events.ts';
import { scoreHourCandidates } from '../bazi/rectify-score.ts';
import {
  formatBirthBrief,
  getActivePerson,
  hasBirthInfo,
  loadLifeStore,
  updateBirthFields,
} from '../life/storage.ts';

const HYPOTHESIS_KEY = 'mystic-lab-bazi-rectify-hypothesis';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function saveHypothesis(birthHour: string): void {
  try {
    sessionStorage.setItem(HYPOTHESIS_KEY, birthHour);
  } catch {
    /* ignore */
  }
}

export function renderBaziRectifyResult(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const store = loadLifeStore();
  const person = getActivePerson();
  const ready = hasBirthInfo(store.profile) && Boolean(store.profile.birthYear.trim());
  const draft = loadRectifyDraft();

  const page = document.createElement('div');
  page.className = 'page life-page bazi-rectify-page';
  mountEnvBanner(page);

  function paint(): void {
    if (!ready) {
      page.innerHTML = `
        <button type="button" class="back-link life-back" data-path="/bazi">← 返回八字</button>
        <header class="life-header">
          <h1 class="page-title">校准结果</h1>
          <p class="page-subtitle">需要先填写出生年月日</p>
        </header>
        <button type="button" class="life-btn-primary" data-path="/bazi">去填写</button>
      `;
      bindNav();
      return;
    }

    if (!draft || !eventsReadyForScore(draft.events)) {
      page.innerHTML = `
        <button type="button" class="back-link life-back" data-path="/bazi/rectify">← 回到校准</button>
        <header class="life-header">
          <h1 class="page-title">校准结果</h1>
          <p class="page-subtitle">请先完成时段与至少 3 条大事件</p>
        </header>
        <button type="button" class="life-btn-primary" data-path="/bazi/rectify">去填写事件</button>
      `;
      bindNav();
      return;
    }

    const ranked = scoreHourCandidates(
      store.profile,
      person.gender,
      draft.band,
      draft.events,
    );
    const top = ranked[0];
    const topScore = top ? Math.floor(top.score / 100) : 0;
    const tied = ranked.filter((r) => r.tieGroup === 0);
    const eventsBrief = filledEvents(draft.events)
      .slice(0, 4)
      .map((e) => `${e.year}${EVENT_TYPE_LABELS[e.type]}`)
      .join('、');

    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/bazi/rectify">← 改事件</button>
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <p class="home-eyebrow">RECTIFY · 规则打分</p>
        <h1 class="page-title">校准结果</h1>
        <p class="page-subtitle">${escapeHtml(formatBirthBrief(store.profile))}</p>
      </header>

      ${
        top
          ? `
        <section class="bazi-rectify-section">
          <h2 class="life-route-title">推荐时辰</h2>
          <article class="bazi-rectify-rank-item is-top">
            <h3>${escapeHtml(top.candidate.label)}</h3>
            <p>时柱 ${escapeHtml(top.candidate.hourPillar)} · 匹配分 ${topScore}${
              tied.length > 1 ? ` · 与 ${tied.length - 1} 个时辰并列靠前` : ''
            }</p>
            <p>${escapeHtml(top.rationale)}</p>
            <p class="life-footnote">对照事件：${escapeHtml(eventsBrief)}</p>
            <div class="bazi-rectify-actions">
              <button type="button" class="life-btn-primary" data-apply="${escapeHtml(top.candidate.birthHour)}">采用并重算命盘</button>
              <button type="button" class="life-btn-ghost" data-hypo="${escapeHtml(top.candidate.birthHour)}">先存为假设</button>
            </div>
          </article>
        </section>`
          : `<p class="life-status">未能排出候选，请放宽时段或检查出生日期。</p>`
      }

      <section class="bazi-rectify-section" aria-label="全部候选">
        <h2 class="life-route-title">全部排序</h2>
        <ol class="bazi-rectify-rank">
          ${ranked
            .map((r, i) => {
              const s = Math.floor(r.score / 100);
              return `
              <li class="bazi-rectify-rank-item ${i === 0 ? 'is-top' : ''}">
                <h3>${i + 1}. ${escapeHtml(r.candidate.label)}</h3>
                <p>时柱 ${escapeHtml(r.candidate.hourPillar)} · 分 ${s}</p>
                <p>${escapeHtml(r.rationale)}</p>
                <button type="button" class="life-btn-ghost" data-apply="${escapeHtml(r.candidate.birthHour)}">采用此时辰</button>
              </li>`;
            })
            .join('')}
        </ol>
      </section>
      <p class="life-footnote" id="bazi-rectify-result-status" hidden></p>
    `;

    bindNav();
    const status = page.querySelector<HTMLElement>('#bazi-rectify-result-status');
    page.querySelectorAll<HTMLButtonElement>('[data-apply]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const hour = btn.dataset.apply ?? '';
        if (!hour) return;
        updateBirthFields({
          birthYear: store.profile.birthYear,
          birthMonth: store.profile.birthMonth,
          birthDay: store.profile.birthDay,
          birthHour: hour,
          birthPlace: store.profile.birthPlace,
        });
        if (status) {
          status.hidden = false;
          status.textContent = `已写入出生时 ${hour}，正在打开命盘…`;
        }
        navigate('/bazi/reading');
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-hypo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const hour = btn.dataset.hypo ?? '';
        if (!hour) return;
        saveHypothesis(hour);
        if (status) {
          status.hidden = false;
          status.textContent = `已记下假设时辰 ${hour}（未改档案）。可稍后再采用。`;
        }
      });
    });
  }

  function bindNav(): void {
    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
  }

  paint();
  root.appendChild(page);
  return () => {
    stars.remove();
  };
}
