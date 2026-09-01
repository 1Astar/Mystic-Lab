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
  EVENT_TYPE_OPTIONS,
  MODE_META,
  QUICK_PRESETS,
  TIME_PRECISION_OPTIONS,
  createEmptyEvent,
  eventsReadyForScore,
  filledEvents,
  idealEventGuideHtml,
  minEventsForMode,
  type EventTimePrecision,
  type RectifyEvent,
  type RectifyEventType,
  type RectifyMode,
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
  { band: { kind: 'morning' }, label: '上午', hint: '约 5–11 点 · 卯辰巳' },
  { band: { kind: 'afternoon' }, label: '下午', hint: '约 11–17 点 · 午未申' },
  { band: { kind: 'evening' }, label: '傍晚 / 晚上', hint: '约 17–21 点 · 酉戌（如 18–20）' },
  { band: { kind: 'night' }, label: '夜间', hint: '约 21–5 点 · 亥子丑寅' },
  { band: { kind: 'all' }, label: '完全不知', hint: '12 时辰全试（更难分）' },
];

function bandKey(b: RectifyTimeBand): string {
  if (b.kind === 'branches') return `branches:${b.branches.join(',')}`;
  return b.kind;
}

function ensureQuickEvents(draft: RectifyDraft): RectifyDraft {
  if (draft.mode !== 'quick') return draft;
  if (draft.events.length >= QUICK_PRESETS.length) return draft;
  const events = QUICK_PRESETS.map((p) =>
    createEmptyEvent({ type: p.type, note: p.note, precision: 'ymd' }),
  );
  return { ...draft, events };
}

export function renderBaziRectify(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const store = loadLifeStore();
  const ready = Boolean(
    parseBirthParts(store.profile.birthYear, store.profile.birthMonth, store.profile.birthDay, ''),
  );

  let draft: RectifyDraft = loadRectifyDraft() ?? emptyRectifyDraft();
  draft = ensureQuickEvents(draft);
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
        <button type="button" class="back-link life-back" data-path="/profile">← 返回档案</button>
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
          <button type="button" class="life-btn-primary" data-path="/profile">去管理档案</button>
        </section>
      `;
      bindNav();
      return;
    }

    // 入口提示：主路径已迁到侦探流
    const detBanner = `
      <p class="bazi-det-events-note">
        这是「大事件年表」加深校准。
        <button type="button" class="life-btn-ghost" data-path="/bazi/rectify">改走时光填空题主路径 ›</button>
      </p>`;

    const allCand = listHourCandidates(store.profile, draft.band);
    const keptSet = new Set(draft.keptBranches);
    const activeCand =
      draft.keptBranches.length >= 2
        ? allCand.filter((c) => keptSet.has(c.branch))
        : allCand;
    const filled = filledEvents(draft.events).length;
    const need = minEventsForMode(draft.mode);
    const canScore = eventsReadyForScore(draft.events, draft.mode);
    const keptOk =
      draft.keptBranches.length === 0 ||
      (draft.keptBranches.length >= 2 && draft.keptBranches.length <= 4);

    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/profile">← 返回档案</button>
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <p class="home-eyebrow">RECTIFY · 暂定而非绝对</p>
        <h1 class="page-title">生时校准</h1>
        <p class="page-subtitle">先圈时段 → 填大事 → 对比解释力 → 得到暂定时辰</p>
      </header>

      ${detBanner}

      <section class="bazi-rectify-guide" aria-label="怎么用">
        <ol>
          <li>输入大概出生时段（如「只记得晚上」或 18:00–20:00）</li>
          <li>系统给出 2–4 个候选时辰（酉、戌…）</li>
          <li>填写人生大事件，并标明时间精度</li>
          <li>对比每个时辰的命中 / 未命中，采用<strong>暂定时辰</strong></li>
        </ol>
        <p>重点不是「绝对正确」，而是哪个时辰能同时解释更多事件；以后可继续校正。</p>
      </section>

      <p class="bazi-rectify-brief">出生简记：${escapeHtml(formatBirthBrief(store.profile))}</p>

      <section class="bazi-rectify-section" aria-label="校准模式">
        <h2 class="life-route-title">① 选择模式</h2>
        <div class="bazi-rectify-modes" role="radiogroup">
          ${(Object.keys(MODE_META) as RectifyMode[])
            .map((m) => {
              const meta = MODE_META[m];
              const on = draft.mode === m;
              return `
              <button type="button" class="bazi-rectify-mode ${on ? 'is-active' : ''}" data-mode="${m}" aria-pressed="${on}">
                <strong>${escapeHtml(meta.title)}</strong>
                <span>${escapeHtml(meta.blurb)}</span>
              </button>`;
            })
            .join('')}
        </div>
      </section>

      <section class="bazi-rectify-section" aria-label="时辰范围">
        <h2 class="life-route-title">② 大概哪个时段？</h2>
        <p class="life-footnote">例如：18:00–20:00 → 选「傍晚 / 晚上」；只记得晚上也可先选傍晚或夜间。</p>
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
      </section>

      <section class="bazi-rectify-section" aria-label="候选时辰">
        <h2 class="life-route-title">③ 保留候选时辰（2–4 个）</h2>
        <p class="life-footnote">不勾选则用该时段全部候选。建议留下最像的 2–4 个再比。</p>
        <div class="bazi-rectify-keep">
          ${allCand
            .map((c) => {
              const on = keptSet.has(c.branch);
              return `
              <button type="button" class="bazi-rectify-keep-chip ${on ? 'is-on' : ''}" data-keep="${escapeHtml(c.branch)}" aria-pressed="${on}">
                ${escapeHtml(c.label)}
              </button>`;
            })
            .join('')}
        </div>
        <p class="life-footnote">当前参与对照：${activeCand.map((c) => c.branch + '时').join('、') || '无'} · 已选 ${draft.keptBranches.length || '全部'}</p>
      </section>

      <section class="bazi-rectify-section" aria-label="大事件">
        <h2 class="life-route-title">④ 大事件年表</h2>
        ${idealEventGuideHtml()}
        <p class="life-footnote">
          ${
            draft.mode === 'quick'
              ? '快速模式：在预设行填年份即可（可不填的空着）。'
              : draft.mode === 'ongoing'
                ? '持续模式：可只补 1 条新事件后更新可信度。'
                : '深度模式：逐条写清类型、精度与备注。'
          }
          至少填 ${need} 条有效年份（已填 ${filled}）。
        </p>
        <ul class="bazi-rectify-events" id="bazi-rectify-events">
          ${draft.events.map((ev, i) => renderEventRow(ev, i)).join('')}
        </ul>
        ${
          draft.mode !== 'quick'
            ? `<button type="button" class="life-btn-ghost" id="bazi-rectify-add">＋ 加一条</button>`
            : ''
        }
      </section>

      <div class="bazi-rectify-actions">
        <button type="button" class="life-btn-primary" id="bazi-rectify-next" ${canScore && keptOk ? '' : 'disabled'}>
          下一步：对照打分 ›
        </button>
        <button type="button" class="life-btn-ghost" data-path="/profile">返回档案</button>
      </div>
      <p class="life-status" id="bazi-rectify-status" ${canScore && keptOk ? 'hidden' : ''}>
        ${
          !keptOk
            ? '候选请保留 2–4 个，或清空勾选以使用全部'
            : `再补 ${Math.max(0, need - filled)} 条有效年份的事件即可打分`
        }
      </p>
    `;

    bindNav();
    bindModes();
    bindBands();
    bindKeep();
    bindEvents();
    page.querySelector('#bazi-rectify-add')?.addEventListener('click', () => {
      if (draft.events.length >= 24) return;
      draft.events = [...draft.events, createEmptyEvent()];
      persist();
      paint();
    });
    page.querySelector('#bazi-rectify-next')?.addEventListener('click', () => {
      if (!eventsReadyForScore(draft.events, draft.mode)) return;
      if (!keptOk) return;
      persist();
      navigate('/bazi/rectify/result');
    });
  }

  function renderEventRow(ev: RectifyEvent, index: number): string {
    const typeOpts = EVENT_TYPE_OPTIONS.map(
      (t) =>
        `<option value="${t}" ${ev.type === t ? 'selected' : ''}>${escapeHtml(EVENT_TYPE_LABELS[t])}</option>`,
    ).join('');
    // 兼容旧类型不在 OPTIONS 里
    const legacy =
      !EVENT_TYPE_OPTIONS.includes(ev.type) && ev.type
        ? `<option value="${ev.type}" selected>${escapeHtml(EVENT_TYPE_LABELS[ev.type])}</option>`
        : '';
    const precOpts = TIME_PRECISION_OPTIONS.map(
      (p) =>
        `<option value="${p.id}" ${ev.precision === p.id ? 'selected' : ''}>${escapeHtml(p.label)}</option>`,
    ).join('');
    return `
      <li class="bazi-rectify-event" data-index="${index}">
        <label class="life-field">
          <span>年份</span>
          <input type="number" name="year" min="1900" max="2100" value="${ev.year || ''}" placeholder="如 2018" />
        </label>
        <label class="life-field">
          <span>月</span>
          <input type="number" name="month" min="1" max="12" value="${ev.month || ''}" placeholder="选填" />
        </label>
        <label class="life-field">
          <span>日</span>
          <input type="number" name="day" min="1" max="31" value="${ev.day || ''}" placeholder="选填" />
        </label>
        <label class="life-field">
          <span>类型</span>
          <select name="type">${legacy}${typeOpts}</select>
        </label>
        <label class="life-field life-field-full">
          <span>时间精度</span>
          <select name="precision">${precOpts}</select>
        </label>
        <label class="life-field life-field-full">
          <span>备注（可选）</span>
          <input type="text" name="note" maxlength="80" value="${escapeHtml(ev.note)}" placeholder="${draft.mode === 'quick' ? escapeHtml(ev.note || '预设事件') : '一句话即可'}" />
        </label>
        ${
          draft.mode !== 'quick'
            ? `<button type="button" class="life-btn-ghost bazi-rectify-remove" data-remove="${index}" ${draft.events.length <= 1 ? 'disabled' : ''}>删除</button>`
            : ''
        }
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

  function bindModes(): void {
    page.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode as RectifyMode;
        if (mode === draft.mode) return;
        draft.mode = mode;
        if (mode === 'quick') draft = ensureQuickEvents(draft);
        persist();
        paint();
      });
    });
  }

  function bindBands(): void {
    page.querySelectorAll<HTMLButtonElement>('[data-band]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.band as RectifyTimeBand['kind'];
        if (kind === 'branches') return;
        draft.band = { kind };
        draft.keptBranches = [];
        persist();
        paint();
      });
    });
  }

  function bindKeep(): void {
    page.querySelectorAll<HTMLButtonElement>('[data-keep]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const branch = btn.dataset.keep!;
        const set = new Set(draft.keptBranches);
        if (set.has(branch)) set.delete(branch);
        else if (set.size < 4) set.add(branch);
        draft.keptBranches = [...set];
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
        const monthRaw = (row.querySelector('[name="month"]') as HTMLInputElement)?.value ?? '';
        const dayRaw = (row.querySelector('[name="day"]') as HTMLInputElement)?.value ?? '';
        const type = ((row.querySelector('[name="type"]') as HTMLSelectElement)?.value ??
          'other') as RectifyEventType;
        const note = (row.querySelector('[name="note"]') as HTMLInputElement)?.value ?? '';
        const precision = ((row.querySelector('[name="precision"]') as HTMLSelectElement)?.value ??
          'ymd') as EventTimePrecision;
        const year = Number(yearRaw);
        const monthN = Number(monthRaw);
        const dayN = Number(dayRaw);
        next.push({
          ...prev,
          year: Number.isFinite(year) ? year : 0,
          month: Number.isFinite(monthN) && monthN >= 1 && monthN <= 12 ? monthN : undefined,
          day: Number.isFinite(dayN) && dayN >= 1 && dayN <= 31 ? dayN : undefined,
          type,
          note,
          precision,
        });
      });
      draft.events = next;
      persist();
      const filled = filledEvents(draft.events).length;
      const need = minEventsForMode(draft.mode);
      const canScore = eventsReadyForScore(draft.events, draft.mode);
      const keptOk =
        draft.keptBranches.length === 0 ||
        (draft.keptBranches.length >= 2 && draft.keptBranches.length <= 4);
      const nextBtn = page.querySelector<HTMLButtonElement>('#bazi-rectify-next');
      const status = page.querySelector<HTMLElement>('#bazi-rectify-status');
      if (nextBtn) nextBtn.disabled = !(canScore && keptOk);
      if (status) {
        status.hidden = canScore && keptOk;
        status.textContent = !keptOk
          ? '候选请保留 2–4 个，或清空勾选以使用全部'
          : `再补 ${Math.max(0, need - filled)} 条有效年份的事件即可打分`;
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
