import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { saveRectifyAdoption } from '../bazi/rectify-adoption.ts';
import {
  feedbackKey,
  loadRectifyDraft,
  saveRectifyDraft,
  type EventFeedback,
} from '../bazi/rectify-draft.ts';
import { eventLabel, eventsReadyForScore, filledEvents } from '../bazi/rectify-events.ts';
import {
  dualProvisionalAdvice,
  scoreDualHourCandidates,
  type DualRankedHour,
} from '../mirror/dual-rectify-score.ts';
import {
  formatBirthBrief,
  getActivePerson,
  hasBirthInfo,
  loadLifeStore,
  updateBirthFields,
} from '../life/storage.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function matchBlock(
  title: string,
  items: DualRankedHour['ziweiHits'],
  kind: string,
): string {
  if (!items.length) return '';
  return `
    <div class="bazi-rectify-match-block">
      <h4>${escapeHtml(title)}</h4>
      <ul class="bazi-rectify-match-list">
        ${items
          .map(
            (m) => `
          <li class="bazi-rectify-match is-${kind}">
            <strong>${escapeHtml(eventLabel(m.event))}</strong>
            <span>${escapeHtml(m.reason)}</span>
            <div class="bazi-rectify-fb" data-ev="${escapeHtml(m.event.id)}">
              <button type="button" class="bazi-rectify-fb-btn" data-fb="fit">符合</button>
              <button type="button" class="bazi-rectify-fb-btn" data-fb="nofit">不符合</button>
              <button type="button" class="bazi-rectify-fb-btn" data-fb="unsure">不确定</button>
            </div>
          </li>`,
          )
          .join('')}
      </ul>
    </div>`;
}

export function renderMirrorRectifyResult(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const store = loadLifeStore();
  const person = getActivePerson();
  const ready = hasBirthInfo(store.profile) && Boolean(store.profile.birthYear.trim());
  let draft = loadRectifyDraft();

  const page = document.createElement('div');
  page.className = 'page life-page mirror-page mirror-rectify-page';
  mountEnvBanner(page);

  function bindNav(): void {
    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
  }

  function bindFeedback(): void {
    page.querySelectorAll<HTMLElement>('.mirror-dual-card[data-branch]').forEach((card) => {
      const branch = card.dataset.branch!;
      card.querySelectorAll<HTMLButtonElement>('[data-fb]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const row = btn.closest<HTMLElement>('.bazi-rectify-fb');
          const evId = row?.dataset.ev;
          const fb = btn.dataset.fb as EventFeedback;
          if (!evId || !draft) return;
          const key = feedbackKey(branch, evId);
          if (draft.feedback[key] === fb) delete draft.feedback[key];
          else draft.feedback[key] = fb;
          draft.updatedAt = new Date().toISOString();
          saveRectifyDraft(draft);
          paint();
        });
      });
    });
  }

  function bindAdopt(ranked: DualRankedHour[]): void {
    page.querySelectorAll<HTMLButtonElement>('[data-adopt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const branch = btn.dataset.adopt;
        const row = ranked.find((r) => r.candidate.branch === branch);
        if (!row) return;
        const person = getActivePerson() ?? loadLifeStore().profiles[0];
        if (!person) return;
        updateBirthFields({
          birthYear: person.birthYear,
          birthMonth: person.birthMonth,
          birthDay: person.birthDay,
          birthHour: row.candidate.birthHour,
          birthPlace: person.birthPlace,
          birthTimeAccuracy: 'uncertain',
          birthTimeSource: 'family_rough',
        });
        saveRectifyAdoption({
          birthHour: row.candidate.birthHour,
          branch: row.candidate.branch,
          label: row.candidate.label,
          confidencePct: row.combinedPct,
          confidenceLabel: row.combinedLabel,
          alternatives: ranked.slice(1, 4).map((r) => ({
            branch: r.candidate.branch,
            label: r.candidate.label,
            confidencePct: r.combinedPct,
          })),
          adoptedAt: new Date().toISOString(),
          provisional: true,
        });
        const status = page.querySelector<HTMLElement>('#mirror-dual-status');
        if (status) {
          status.hidden = false;
          status.textContent = `已暂用采用 ${row.candidate.label}（综合 ${row.combinedPct}%）。可回双盘映照查看。`;
        }
      });
    });
  }

  function paint(): void {
    draft = loadRectifyDraft();
    if (!ready || !person.gender) {
      page.innerHTML = `
        <button type="button" class="back-link life-back" data-path="/mirror/rectify">← 返回</button>
        <header class="life-header">
          <h1 class="page-title">双盘校准结果</h1>
          <p class="page-subtitle">需要出生年月日与性别</p>
        </header>
        <button type="button" class="life-btn-primary" data-path="/profile">去管理档案</button>`;
      bindNav();
      return;
    }
    if (!draft || !eventsReadyForScore(draft.events, draft.mode)) {
      page.innerHTML = `
        <button type="button" class="back-link life-back" data-path="/mirror/rectify">← 返回</button>
        <header class="life-header">
          <h1 class="page-title">双盘校准结果</h1>
          <p class="page-subtitle">请先完成时段与大事件</p>
        </header>
        <button type="button" class="life-btn-primary" data-path="/bazi/rectify">去填写事件</button>`;
      bindNav();
      return;
    }

    const ranked = scoreDualHourCandidates(
      store.profile,
      person.gender,
      draft.band,
      draft.events,
      {
        mode: draft.mode,
        keptBranches: draft.keptBranches,
        feedback: draft.feedback,
      },
    );
    const top = ranked[0];
    const advice = dualProvisionalAdvice(ranked);
    const filled = filledEvents(draft.events);

    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/mirror/rectify">← 双盘校准</button>
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
        <p class="home-eyebrow">DUAL RECTIFY · 结果</p>
        <h1 class="page-title">双盘校准结果</h1>
        <p class="page-subtitle">${escapeHtml(formatBirthBrief(store.profile))}</p>
      </header>

      <section class="mirror-hero-meta">
        <p>对照你填的 ${filled.length} 件大事：每个候选时辰分别排八字与紫微，看<strong>八字解释力</strong>、<strong>紫微解释力</strong>与<strong>综合可信度</strong>。不是绝对答案。</p>
        <p>${escapeHtml(advice)}</p>
      </section>

      ${
        top
          ? `<section class="mirror-dual-top" aria-label="综合首选">
              <article class="mirror-dual-card is-top" data-branch="${escapeHtml(top.candidate.branch)}">
                <h2>${escapeHtml(top.candidate.label)}</h2>
                <p class="mirror-dual-meters">
                  <span>八字 ${top.bazi.confidencePct}% · ${escapeHtml(top.bazi.confidenceLabel)}</span>
                  <span>紫微 ${top.ziweiPct}% · ${escapeHtml(top.ziweiLabel)}</span>
                  <span class="is-combined">综合 ${top.combinedPct}% · ${escapeHtml(top.combinedLabel)}</span>
                </p>
                <p>时柱 ${escapeHtml(top.candidate.hourPillar)}</p>
                <p>${escapeHtml(top.dualSummary)}</p>
                <div class="bazi-rectify-actions">
                  <button type="button" class="life-btn-primary" data-adopt="${escapeHtml(top.candidate.branch)}">采用为暂定时辰</button>
                  <button type="button" class="life-btn-ghost" data-path="/mirror">回双盘映照</button>
                  <button type="button" class="life-btn-ghost" data-path="/bazi/rectify">改事件</button>
                </div>
              </article>
            </section>`
          : `<p class="life-status">未能排出候选，请放宽时段或检查出生日期。</p>`
      }

      <section class="mirror-dual-list" aria-label="各时辰双盘解释力">
        <h2 class="life-route-title">各时辰对照</h2>
        <ol class="bazi-rectify-rank">
          ${ranked
            .map((r, i) => {
              return `
              <li class="mirror-dual-card bazi-rectify-rank-item ${i === 0 ? 'is-top' : ''}" data-branch="${escapeHtml(r.candidate.branch)}">
                <h3>${i + 1}. ${escapeHtml(r.candidate.label)}</h3>
                <p class="mirror-dual-meters">
                  <span>八字 ${r.bazi.confidencePct}%</span>
                  <span>紫微 ${r.ziweiPct}%</span>
                  <span class="is-combined">综合 ${r.combinedPct}%</span>
                </p>
                <p>${escapeHtml(r.bazi.summary)}</p>
                <p>${escapeHtml(r.ziweiSummary)}</p>
                ${matchBlock('八字命中', r.bazi.hits, 'hit')}
                ${matchBlock('紫微命中', r.ziweiHits, 'hit')}
                ${matchBlock('八字偏弱', r.bazi.weaks, 'weak')}
                ${matchBlock('紫微偏弱', r.ziweiWeaks, 'weak')}
                ${matchBlock('八字难解释', r.bazi.misses, 'miss')}
                ${matchBlock('紫微难解释', r.ziweiMisses, 'miss')}
                <div class="bazi-rectify-actions">
                  <button type="button" class="life-btn-ghost" data-adopt="${escapeHtml(r.candidate.branch)}">采用此时辰</button>
                </div>
              </li>`;
            })
            .join('')}
        </ol>
      </section>
      <p class="life-footnote" id="mirror-dual-status" hidden></p>
    `;

    page.querySelectorAll<HTMLElement>('.mirror-dual-card[data-branch]').forEach((card) => {
      const branch = card.dataset.branch!;
      card.querySelectorAll<HTMLElement>('.bazi-rectify-fb').forEach((row) => {
        const evId = row.dataset.ev!;
        const cur = draft!.feedback[feedbackKey(branch, evId)];
        row.querySelectorAll<HTMLButtonElement>('[data-fb]').forEach((b) => {
          b.classList.toggle('is-on', b.dataset.fb === cur);
        });
      });
    });

    bindNav();
    bindFeedback();
    bindAdopt(ranked);
  }

  root.appendChild(page);
  paint();

  return () => {
    stars.remove();
  };
}
