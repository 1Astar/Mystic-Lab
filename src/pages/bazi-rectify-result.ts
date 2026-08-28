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
  provisionalAdvice,
  scoreHourCandidates,
  type RankedHourCandidate,
} from '../bazi/rectify-score.ts';
import {
  buildOfflineNarrate,
  generateRectifyNarrate,
  loadCachedNarrate,
  cacheKeyForNarrate,
  openRectifyAiSettings,
} from '../bazi/rectify-personalize.ts';
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

function renderMatchList(
  title: string,
  items: RankedHourCandidate['hits'],
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

export function renderBaziRectifyResult(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const store = loadLifeStore();
  const person = getActivePerson();
  const ready = hasBirthInfo(store.profile) && Boolean(store.profile.birthYear.trim());
  let draft = loadRectifyDraft();

  const page = document.createElement('div');
  page.className = 'page life-page bazi-rectify-page';
  mountEnvBanner(page);

  function paint(): void {
    draft = loadRectifyDraft();
    if (!ready) {
      page.innerHTML = `
        <button type="button" class="back-link life-back" data-path="/profile">← 返回档案</button>
        <header class="life-header">
          <h1 class="page-title">校准结果</h1>
          <p class="page-subtitle">需要先填写出生年月日</p>
        </header>
        <button type="button" class="life-btn-primary" data-path="/profile">去管理档案</button>
      `;
      bindNav();
      return;
    }

    if (!draft || !eventsReadyForScore(draft.events, draft.mode)) {
      page.innerHTML = `
        <button type="button" class="back-link life-back" data-path="/bazi/rectify/events">← 回到校准</button>
        <header class="life-header">
          <h1 class="page-title">校准结果</h1>
          <p class="page-subtitle">请先完成时段与大事件</p>
        </header>
        <button type="button" class="life-btn-primary" data-path="/bazi/rectify/events">去填写事件</button>
      `;
      bindNav();
      return;
    }

    const ranked = scoreHourCandidates(
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
    const advice = provisionalAdvice(ranked);
    const filled = filledEvents(draft.events);

    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/bazi/rectify/events">← 改事件 / 时段</button>
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <p class="home-eyebrow">RECTIFY · 暂定结论</p>
        <h1 class="page-title">校准结果</h1>
        <p class="page-subtitle">${escapeHtml(formatBirthBrief(store.profile))}</p>
      </header>

      <section class="bazi-rectify-guide">
        <p>以下不是绝对答案，而是「哪个时辰更能解释你填的 ${filled.length} 件大事」。可点「符合 / 不符合 / 不确定」修正评分。</p>
        <p>排名与百分比由<strong>规则引擎</strong>决定；可再生成 <strong>AI 个性化解说</strong>（不改写结论）。</p>
      </section>

      ${
        top
          ? `
        <section class="bazi-rectify-section">
          <h2 class="life-route-title">暂定时辰建议</h2>
          <article class="bazi-rectify-rank-item is-top" data-branch="${escapeHtml(top.candidate.branch)}">
            <h3>${escapeHtml(top.candidate.label)} · ${top.confidencePct}%</h3>
            <p>时柱 ${escapeHtml(top.candidate.hourPillar)} · 可信度 <strong>${escapeHtml(top.confidenceLabel)}</strong></p>
            <p>${escapeHtml(top.summary)}</p>
            <p class="life-footnote">${escapeHtml(advice)}</p>
            <div class="bazi-rectify-actions">
              <button type="button" class="life-btn-primary" data-adopt="${escapeHtml(top.candidate.branch)}">采用为暂定时辰</button>
              <button type="button" class="life-btn-ghost" data-path="/mirror/rectify/result">看双盘对照打分 ›</button>
              <button type="button" class="life-btn-ghost" data-path="/bazi/rectify/events">继续补充事件</button>
            </div>
          </article>
        </section>

        <section class="bazi-rectify-section" aria-label="AI 个性化解说">
          <h2 class="life-route-title">个性化解说</h2>
          <p class="life-footnote">引擎打底 · AI 用人话讲差异（不会改名次）</p>
          <div id="bazi-rectify-ai-body" class="bazi-rectify-ai-body">
            <p class="bazi-rectify-ai-placeholder">点下方生成，把命中/未命中讲成你的故事。</p>
          </div>
          <div class="bazi-rectify-actions">
            <button type="button" class="life-btn-primary" id="bazi-rectify-ai-run">生成 AI 解说</button>
            <button type="button" class="life-btn-ghost" id="bazi-rectify-ai-offline">只用规则摘要</button>
          </div>
          <p class="life-status" id="bazi-rectify-ai-status" hidden></p>
        </section>`
          : `<p class="life-status">未能排出候选，请放宽时段或检查出生日期。</p>`
      }

      <section class="bazi-rectify-section" aria-label="候选对照">
        <h2 class="life-route-title">各时辰解释力</h2>
        <ol class="bazi-rectify-rank">
          ${ranked
            .map((r, i) => {
              return `
              <li class="bazi-rectify-rank-item ${i === 0 ? 'is-top' : ''}" data-branch="${escapeHtml(r.candidate.branch)}">
                <h3>${i + 1}. ${escapeHtml(r.candidate.label)} · ${r.confidencePct}%</h3>
                <p>时柱 ${escapeHtml(r.candidate.hourPillar)} · ${escapeHtml(r.confidenceLabel)}</p>
                <p>${escapeHtml(r.summary)}</p>
                ${
                  r.supportReasons.length
                    ? `<p class="life-footnote">支持理由：${escapeHtml(r.supportReasons.slice(0, 2).join('；'))}</p>`
                    : ''
                }
                ${renderMatchList('命中事件', r.hits, 'hit')}
                ${renderMatchList('偏弱', r.weaks, 'weak')}
                ${renderMatchList('未命中 / 难解释', r.misses, 'miss')}
                <div class="bazi-rectify-actions">
                  <button type="button" class="life-btn-ghost" data-adopt="${escapeHtml(r.candidate.branch)}">采用此时辰</button>
                </div>
              </li>`;
            })
            .join('')}
        </ol>
      </section>
      <p class="life-footnote" id="bazi-rectify-result-status" hidden></p>
    `;

    // paint feedback selected state
    page.querySelectorAll<HTMLElement>('.bazi-rectify-rank-item[data-branch]').forEach((card) => {
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
    bindAiNarrate(ranked, filled);

    const status = page.querySelector<HTMLElement>('#bazi-rectify-result-status');
    void status;
  }

  function paintAiBody(text: string, via: string): void {
    const body = page.querySelector<HTMLElement>('#bazi-rectify-ai-body');
    if (!body) return;
    const paras = text
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    body.innerHTML = `
      <p class="life-footnote">来源：${
        via === 'ai' ? 'AI 解说' : via === 'cache' ? 'AI 缓存' : '规则摘要'
      }</p>
      ${paras.map((p) => `<p class="bazi-rectify-ai-para">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('')}
    `;
  }

  function bindAiNarrate(ranked: RankedHourCandidate[], filled: ReturnType<typeof filledEvents>): void {
    const input = {
      personName: person.nickname,
      birthBrief: formatBirthBrief(store.profile),
      events: filled,
      ranked,
    };
    const key = cacheKeyForNarrate(input);
    const cached = loadCachedNarrate(key);
    if (cached) paintAiBody(cached, 'cache');

    const status = page.querySelector<HTMLElement>('#bazi-rectify-ai-status');
    const runBtn = page.querySelector<HTMLButtonElement>('#bazi-rectify-ai-run');
    const offlineBtn = page.querySelector<HTMLButtonElement>('#bazi-rectify-ai-offline');

    offlineBtn?.addEventListener('click', () => {
      paintAiBody(buildOfflineNarrate(input), 'offline');
      if (status) {
        status.hidden = false;
        status.textContent = '已显示规则摘要（未调用 AI）。';
      }
    });

    runBtn?.addEventListener('click', async () => {
      if (!runBtn || !ranked.length) return;
      runBtn.disabled = true;
      if (status) {
        status.hidden = false;
        status.textContent = '正在生成个性化解说…';
      }
      const res = await generateRectifyNarrate(input, { force: true });
      runBtn.disabled = false;
      if (!res.ok) {
        if (status) {
          status.hidden = false;
          status.textContent = res.reason;
        }
        paintAiBody(buildOfflineNarrate(input), 'offline');
        if (res.needSettings) {
          const go = confirm(`${res.reason}\n\n要打开 AI 配置吗？`);
          if (go) openRectifyAiSettings();
        }
        return;
      }
      paintAiBody(res.text, res.via);
      if (status) {
        status.hidden = false;
        status.textContent =
          res.via === 'ai'
            ? 'AI 解说已生成（未改动引擎排名）。'
            : res.via === 'cache'
              ? '已载入缓存解说。'
              : '已用规则摘要。';
      }
    });
  }

  function bindFeedback(): void {
    page.querySelectorAll<HTMLElement>('.bazi-rectify-rank-item[data-branch]').forEach((card) => {
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

  function bindAdopt(ranked: RankedHourCandidate[]): void {
    const status = page.querySelector<HTMLElement>('#bazi-rectify-result-status');
    page.querySelectorAll<HTMLButtonElement>('[data-adopt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const branch = btn.dataset.adopt ?? '';
        const row = ranked.find((r) => r.candidate.branch === branch);
        if (!row) return;
        updateBirthFields({
          birthYear: store.profile.birthYear,
          birthMonth: store.profile.birthMonth,
          birthDay: store.profile.birthDay,
          birthHour: row.candidate.birthHour,
          birthPlace: store.profile.birthPlace,
          birthTimeAccuracy: 'uncertain',
          birthTimeSource: 'family_rough',
        });
        saveRectifyAdoption({
          birthHour: row.candidate.birthHour,
          branch: row.candidate.branch,
          label: row.candidate.label,
          confidencePct: row.confidencePct,
          confidenceLabel: row.confidenceLabel,
          alternatives: ranked
            .filter((r) => r.candidate.branch !== branch)
            .slice(0, 3)
            .map((r) => ({
              branch: r.candidate.branch,
              label: r.candidate.label,
              confidencePct: r.confidencePct,
            })),
          adoptedAt: new Date().toISOString(),
          provisional: true,
        });
        if (status) {
          status.hidden = false;
          status.textContent = `已采用暂定时辰 ${row.candidate.label}（可信度${row.confidenceLabel}），正在打开命盘…`;
        }
        navigate('/bazi/reading');
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
