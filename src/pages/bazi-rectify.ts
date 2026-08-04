import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import {
  listHourCandidates,
  type RectifyTimeBand,
} from '../bazi/rectify-candidates.ts';
import {
  emptyRectifyDraft,
  loadRectifyDraft,
  saveRectifyDraft,
  type RectifyDraft,
} from '../bazi/rectify-draft.ts';
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPES,
  MIN_EVENTS_FOR_SCORE,
  createEmptyEvent,
  eventsReadyForScore,
  filledEvents,
  type RectifyEvent,
  type RectifyEventType,
} from '../bazi/rectify-events.ts';
import { formatBirthBrief, loadLifeStore } from '../life/storage.ts';
import { parseBirthParts } from '../bazi/parse-birth.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const BAND_OPTIONS: { band: RectifyTimeBand; label: string; hint: string }[] = [
  { band: { kind: 'morning' }, label: '上午', hint: '约卯辰巳 · 5–11 点' },
  { band: { kind: 'afternoon' }, label: '下午', hint: '约午未申 · 11–17 点' },
  { band: { kind: 'evening' }, label: '傍晚', hint: '约酉戌 · 17–21 点' },
  { band: { kind: 'night' }, label: '夜间', hint: '约亥子丑寅 · 21–5 点' },
  { band: { kind: 'all' }, label: '完全不知', hint: '12 个时辰全试（更难分）' },
];

function bandKey(b: RectifyTimeBand): string {
  if (b.kind === 'branches') return `branches:${b.branches.join(',')}`;
  return b.kind;
}

export function renderBaziRectify(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const store = loadLifeStore();
  const ready = Boolean(
    parseBirthParts(store.profile.birthYear, store.profile.birthMonth, store.profile.birthDay, ''),
  );

  let draft: RectifyDraft = loadRectifyDraft() ?? emptyRectifyDraft();
  if (draft.events.length === 0) {
    draft = {
      ...draft,
      events: [createEmptyEvent(), createEmptyEvent(), createEmptyEvent()],
    };
  }

  const page = document.createElement('div');
  page.className = 'page life-page bazi-rectify-page';
  mountEnvBanner(page);

  function persist(): void {
    draft = { ...draft, updatedAt: new Date().toISOString() };
    saveRectifyDraft(draft);
  }

  function paint(): void {
    if (!ready) {
      page.innerHTML = `
        <button type="button" class="back-link life-back" data-path="/bazi">← 返回八字</button>
        <header class="life-header">
          <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
          <h1 class="page-title">生时校准</h1>
          <p class="page-subtitle">需要先填写出生年月日</p>
        </header>
        <section class="life-profile-gate">
          <div>
            <p class="life-card-kicker">还不能校准</p>
            <p class="life-gate-brief">年月日确定后，才能用大事件反推时辰。</p>
          </div>
          <button type="button" class="life-btn-primary" data-path="/bazi">去填写</button>
        </section>
      `;
      bindNav();
      return;
    }

    const candCount = listHourCandidates(store.profile, draft.band).length;
    const filled = filledEvents(draft.events).length;
    const canScore = eventsReadyForScore(draft.events);

    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/bazi">← 返回八字</button>
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <p class="home-eyebrow">RECTIFY · 规则优先</p>
        <h1 class="page-title">生时校准</h1>
        <p class="page-subtitle">用大事件反推更可能的时辰 · 不靠 AI 猜</p>
      </header>

      <p class="bazi-rectify-brief">出生简记：${escapeHtml(formatBirthBrief(store.profile))}</p>

      <section class="bazi-rectify-section" aria-label="时辰范围">
        <h2 class="life-route-title">① 大概哪个时段？</h2>
        <div class="bazi-rectify-bands" role="radiogroup">
          ${BAND_OPTIONS.map((opt) => {
            const active = bandKey(opt.band) === bandKey(draft.band);
            return `
              <button type="button" class="bazi-rectify-band ${active ? 'is-active' : ''}" data-band="${escapeHtml(opt.band.kind)}" aria-pressed="${active ? 'true' : 'false'}">
                <strong>${escapeHtml(opt.label)}</strong>
                <span>${escapeHtml(opt.hint)}</span>
              </button>`;
          }).join('')}
        </div>
        <p class="life-footnote">当前候选时柱约 ${candCount} 个</p>
      </section>

      <section class="bazi-rectify-section" aria-label="大事件">
        <h2 class="life-route-title">② 大事件年表</h2>
        <p class="life-footnote">至少填 ${MIN_EVENTS_FOR_SCORE} 条（已填 ${filled}）。年份可勾 ±1。</p>
        <ul class="bazi-rectify-events" id="bazi-rectify-events">
          ${draft.events.map((ev, i) => renderEventRow(ev, i)).join('')}
        </ul>
        <button type="button" class="life-btn-ghost" id="bazi-rectify-add">＋ 加一条</button>
      </section>

      <div class="bazi-rectify-actions">
        <button type="button" class="life-btn-primary" id="bazi-rectify-next" ${canScore ? '' : 'disabled'}>
          下一步：规则打分 ›
        </button>
        <button type="button" class="life-btn-ghost" data-path="/bazi">返回</button>
      </div>
      <p class="life-status" id="bazi-rectify-status" ${canScore ? 'hidden' : ''}>
        再补 ${Math.max(0, MIN_EVENTS_FOR_SCORE - filled)} 条有效年份的事件即可打分
      </p>
    `;

    bindNav();
    bindBands();
    bindEvents();
    page.querySelector('#bazi-rectify-add')?.addEventListener('click', () => {
      if (draft.events.length >= 20) return;
      draft.events = [...draft.events, createEmptyEvent()];
      persist();
      paint();
    });
    page.querySelector('#bazi-rectify-next')?.addEventListener('click', () => {
      if (!eventsReadyForScore(draft.events)) return;
      persist();
      navigate('/bazi/rectify/result');
    });
  }

  function renderEventRow(ev: RectifyEvent, index: number): string {
    const typeOpts = EVENT_TYPES.map(
      (t) =>
        `<option value="${t}" ${ev.type === t ? 'selected' : ''}>${escapeHtml(EVENT_TYPE_LABELS[t])}</option>`,
    ).join('');
    return `
      <li class="bazi-rectify-event" data-index="${index}">
        <label class="life-field">
          <span>年份</span>
          <input type="number" name="year" min="1900" max="2100" value="${ev.year || ''}" placeholder="如 2018" />
        </label>
        <label class="life-field">
          <span>类型</span>
          <select name="type">${typeOpts}</select>
        </label>
        <label class="life-field bazi-rectify-slack">
          <span>±1 年</span>
          <input type="checkbox" name="slack" ${ev.yearSlack === 1 ? 'checked' : ''} />
        </label>
        <label class="life-field life-field-full">
          <span>备注（可选）</span>
          <input type="text" name="note" maxlength="80" value="${escapeHtml(ev.note)}" placeholder="一句话即可" />
        </label>
        <button type="button" class="life-btn-ghost bazi-rectify-remove" data-remove="${index}" ${draft.events.length <= 1 ? 'disabled' : ''}>删除</button>
      </li>`;
  }

  function bindNav(): void {
    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
  }

  function bindBands(): void {
    page.querySelectorAll<HTMLButtonElement>('[data-band]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.band as RectifyTimeBand['kind'];
        if (kind === 'branches') return;
        draft.band = { kind };
        persist();
        paint();
      });
    });
  }

  function bindEvents(): void {
    const list = page.querySelector('#bazi-rectify-events');
    if (!list) return;

    const syncFromDom = (): void => {
      const rows = list.querySelectorAll<HTMLElement>('.bazi-rectify-event');
      const next: RectifyEvent[] = [];
      rows.forEach((row, i) => {
        const prev = draft.events[i] ?? createEmptyEvent();
        const yearRaw = (row.querySelector('[name="year"]') as HTMLInputElement)?.value ?? '';
        const type = ((row.querySelector('[name="type"]') as HTMLSelectElement)?.value ??
          'other') as RectifyEventType;
        const note = (row.querySelector('[name="note"]') as HTMLInputElement)?.value ?? '';
        const slack = (row.querySelector('[name="slack"]') as HTMLInputElement)?.checked ? 1 : 0;
        const year = Number(yearRaw);
        next.push({
          ...prev,
          year: Number.isFinite(year) ? year : 0,
          type,
          note,
          yearSlack: slack,
        });
      });
      draft.events = next;
      persist();
      const filled = filledEvents(draft.events).length;
      const canScore = eventsReadyForScore(draft.events);
      const nextBtn = page.querySelector<HTMLButtonElement>('#bazi-rectify-next');
      const status = page.querySelector<HTMLElement>('#bazi-rectify-status');
      if (nextBtn) nextBtn.disabled = !canScore;
      if (status) {
        status.hidden = canScore;
        status.textContent = canScore
          ? ''
          : `再补 ${Math.max(0, MIN_EVENTS_FOR_SCORE - filled)} 条有效年份的事件即可打分`;
      }
    };

    list.addEventListener('change', syncFromDom);
    list.addEventListener('input', syncFromDom);
    list.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.remove);
        if (!Number.isFinite(i) || draft.events.length <= 1) return;
        draft.events = draft.events.filter((_, idx) => idx !== i);
        persist();
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
