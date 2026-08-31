/**
 * 命盘时光机：滑杆 + 流年云/大运叠层 + 换运气泡
 */
import {
  isDecadeBubbleStale,
  type DecadeShiftCard,
  type ShuttleFrame,
  type ShuttleRange,
} from '../bazi/sense-shuttle.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cloudGzHtml(
  ganZhi: string,
  hint: string,
  emptyLabel: string,
): string {
  if (!ganZhi) {
    return `<button type="button" class="bazi-shuttle-gz is-empty" data-shuttle-gz="" data-shuttle-hint="" disabled>${escapeHtml(emptyLabel)}</button>`;
  }
  const tip = hint ? ` title="${escapeHtml(hint)}" aria-label="${escapeHtml(`${ganZhi} · ${hint}`)}"` : '';
  return `<button type="button" class="bazi-shuttle-gz" data-shuttle-gz="${escapeHtml(ganZhi)}" data-shuttle-hint="${escapeHtml(hint)}"${tip}>${escapeHtml(ganZhi)}</button>`;
}

export function timeShuttleBoardHtml(
  frame: ShuttleFrame,
  range: ShuttleRange,
  bubble: DecadeShiftCard | null,
): string {
  const dayunLine = frame.dayunEmpty
    ? '季节云 · 童限（起运前）'
    : `季节云 · ${frame.dayunGanZhi}${frame.dayunStemGod ? ` · ${frame.dayunStemGod}` : ''}（${frame.dayunStartYear}–${frame.dayunEndYear}）`;
  const liuLine = frame.liunianGanZhi
    ? `风浪云 · ${frame.liunianGanZhi}（${frame.year}）`
    : `风浪云 · ${frame.year}`;

  return `
    <section class="bazi-shuttle" data-bazi-shuttle aria-label="命盘时光机">
      <header class="bazi-shuttle-head">
        <p class="bazi-sense-kicker">时光机</p>
        <p class="bazi-shuttle-metaphor">${escapeHtml(frame.shipMetaphor)}</p>
      </header>

      <div class="bazi-shuttle-stage" aria-hidden="true">
        <div class="bazi-shuttle-ship">
          <span>本命盘 · 船</span>
          <em>静静铺底，不随滑杆改写</em>
        </div>
        <div class="bazi-shuttle-cloud is-dayun ${frame.dayunEmpty ? 'is-mute' : ''}">
          <span class="bazi-shuttle-cloud-label">${escapeHtml(dayunLine)}</span>
          ${cloudGzHtml(frame.dayunGanZhi, frame.dayunHint, '童限')}
        </div>
        <div class="bazi-shuttle-cloud is-liunian ${frame.isNow ? 'is-glow' : ''}">
          <span class="bazi-shuttle-cloud-label">${escapeHtml(liuLine)}</span>
          ${cloudGzHtml(frame.liunianGanZhi, frame.liunianHint, '—')}
          <strong class="bazi-shuttle-weather-chip">${escapeHtml(frame.weather)}</strong>
        </div>
      </div>

      <div class="bazi-shuttle-forecast">
        <p class="bazi-shuttle-title">${escapeHtml(frame.title)}</p>
        <p class="bazi-shuttle-weather">${escapeHtml(frame.weather)}</p>
        <p class="bazi-shuttle-tone">${escapeHtml(frame.tone)}</p>
        ${
          frame.decadeNote
            ? `<p class="bazi-shuttle-decade">${escapeHtml(frame.decadeNote)}</p>`
            : ''
        }
      </div>

      <label class="bazi-shuttle-slider">
        <span class="bazi-shuttle-slider-label">拉动滑杆 · 时光流转</span>
        <input
          type="range"
          data-shuttle-range
          min="${range.minYear}"
          max="${range.maxYear}"
          value="${frame.year}"
          step="1"
          aria-valuemin="${range.minYear}"
          aria-valuemax="${range.maxYear}"
          aria-valuenow="${frame.year}"
          aria-label="选择年份"
        />
        <span class="bazi-shuttle-year" data-shuttle-year-label>${escapeHtml(frame.yearTag)} · ${frame.age}岁</span>
      </label>

      <p class="bazi-shuttle-hint-live" data-shuttle-hint-live hidden></p>

      <aside class="bazi-shuttle-bubble ${bubble ? 'is-on' : ''}" data-shuttle-bubble ${bubble ? '' : 'hidden'} role="status">
        ${
          bubble
            ? `<p>${escapeHtml(bubble.body)}</p>
               <button type="button" class="bazi-shuttle-bubble-dismiss" data-shuttle-dismiss>知道了</button>`
            : ''
        }
      </aside>
    </section>
  `;
}

export type MountTimeShuttleOpts = {
  range: ShuttleRange;
  /** 拖动时只刷旁白，不重绘整页 */
  buildFrame: (year: number) => ShuttleFrame;
  /** 松手 / 确定后同步盘面与运程 */
  onCommitYear: (year: number) => void;
  /** 首次拖动滑杆 */
  onShuttleInteract?: () => void;
  /** 换大运气泡出现时 */
  onDecadeBubble?: (card: DecadeShiftCard) => void;
  onBubbleDismiss?: () => void;
  /** 当前是否应展示气泡（prev 为上一帧大运天干十神） */
  resolveBubble?: (frame: ShuttleFrame, prevDayunGod: string) => DecadeShiftCard | null;
  initialPrevDayunGod?: string;
  /** 首屏已写入 HTML 的换运气泡（用于过期判定） */
  initialBubble?: DecadeShiftCard | null;
};

export function mountTimeShuttleBoard(
  root: HTMLElement,
  initial: ShuttleFrame,
  opts: MountTimeShuttleOpts,
): () => void {
  const hostEl = root.querySelector<HTMLElement>('[data-bazi-shuttle]');
  if (!hostEl) return () => {};
  const host: HTMLElement = hostEl;

  const rangeInput = host.querySelector<HTMLInputElement>('[data-shuttle-range]');
  const yearLabel = host.querySelector<HTMLElement>('[data-shuttle-year-label]');
  const hintLive = host.querySelector<HTMLElement>('[data-shuttle-hint-live]');
  const bubbleEl = host.querySelector<HTMLElement>('[data-shuttle-bubble]');

  let frame = initial;
  let prevDayunGod =
    opts.initialPrevDayunGod ?? (initial.dayunEmpty ? '' : initial.dayunStemGod);
  let activeBubble: DecadeShiftCard | null = opts.initialBubble ?? null;
  let interacted = false;
  let longPressTimer = 0;

  function patchForecast(f: ShuttleFrame): void {
    const title = host.querySelector('.bazi-shuttle-title');
    const weather = host.querySelector('.bazi-shuttle-weather');
    const tone = host.querySelector('.bazi-shuttle-tone');
    const decade = host.querySelector('.bazi-shuttle-decade');
    const chip = host.querySelector('.bazi-shuttle-weather-chip');
    if (title) title.textContent = f.title;
    if (weather) weather.textContent = f.weather;
    if (tone) tone.textContent = f.tone;
    if (chip) chip.textContent = f.weather;
    if (decade) {
      if (f.decadeNote) decade.textContent = f.decadeNote;
      else decade.remove();
    } else if (f.decadeNote) {
      const box = host.querySelector('.bazi-shuttle-forecast');
      if (box) {
        const p = document.createElement('p');
        p.className = 'bazi-shuttle-decade';
        p.textContent = f.decadeNote;
        box.appendChild(p);
      }
    }
    if (yearLabel) yearLabel.textContent = `${f.yearTag} · ${f.age}岁`;

    const dayunCloud = host.querySelector('.bazi-shuttle-cloud.is-dayun');
    const liuCloud = host.querySelector('.bazi-shuttle-cloud.is-liunian');
    if (dayunCloud) {
      dayunCloud.classList.toggle('is-mute', f.dayunEmpty);
      const lab = dayunCloud.querySelector('.bazi-shuttle-cloud-label');
      if (lab) {
        lab.textContent = f.dayunEmpty
          ? '季节云 · 童限（起运前）'
          : `季节云 · ${f.dayunGanZhi}${f.dayunStemGod ? ` · ${f.dayunStemGod}` : ''}（${f.dayunStartYear}–${f.dayunEndYear}）`;
      }
    }
    if (liuCloud) {
      liuCloud.classList.toggle('is-glow', f.isNow);
      const lab = liuCloud.querySelector('.bazi-shuttle-cloud-label');
      if (lab) {
        lab.textContent = f.liunianGanZhi
          ? `风浪云 · ${f.liunianGanZhi}（${f.year}）`
          : `风浪云 · ${f.year}`;
      }
    }

    host.querySelectorAll<HTMLElement>('[data-shuttle-gz]').forEach((btn, i) => {
      const isDayun = i === 0;
      const gz = isDayun ? f.dayunGanZhi : f.liunianGanZhi;
      const hint = isDayun ? f.dayunHint : f.liunianHint;
      if (!gz) {
        btn.textContent = isDayun ? '童限' : '—';
        btn.classList.add('is-empty');
        btn.removeAttribute('data-shuttle-hint');
        btn.removeAttribute('title');
        return;
      }
      btn.classList.remove('is-empty');
      btn.textContent = gz;
      btn.dataset.shuttleGz = gz;
      btn.dataset.shuttleHint = hint;
      btn.title = hint;
      btn.setAttribute('aria-label', hint ? `${gz} · ${hint}` : gz);
    });
  }

  function showBubble(card: DecadeShiftCard | null): void {
    if (!bubbleEl) return;
    if (!card) {
      activeBubble = null;
      bubbleEl.hidden = true;
      bubbleEl.classList.remove('is-on');
      bubbleEl.innerHTML = '';
      return;
    }
    activeBubble = card;
    bubbleEl.hidden = false;
    bubbleEl.classList.add('is-on');
    bubbleEl.innerHTML = `<p>${escapeHtml(card.body)}</p>
      <button type="button" class="bazi-shuttle-bubble-dismiss" data-shuttle-dismiss>知道了</button>`;
    bubbleEl.querySelector('[data-shuttle-dismiss]')?.addEventListener('click', () => {
      showBubble(null);
      opts.onBubbleDismiss?.();
    });
    opts.onDecadeBubble?.(card);
  }

  function syncBubble(next: ShuttleFrame): void {
    if (!opts.resolveBubble) return;
    const card = opts.resolveBubble(next, prevDayunGod);
    if (card) {
      showBubble(card);
      return;
    }
    // 未弹出新卡时：若当前大运十神已对不上旧气泡的「切到」，清掉过期旁白
    if (isDecadeBubbleStale(activeBubble, next.dayunStemGod, next.dayunEmpty)) {
      showBubble(null);
      opts.onBubbleDismiss?.();
    }
  }

  function onYearLive(year: number): void {
    frame = opts.buildFrame(year);
    patchForecast(frame);
    if (rangeInput) rangeInput.setAttribute('aria-valuenow', String(year));

    syncBubble(frame);
    if (!frame.dayunEmpty && frame.dayunStemGod) {
      prevDayunGod = frame.dayunStemGod;
    }
  }

  function showHint(text: string): void {
    if (!hintLive) return;
    if (!text) {
      hintLive.hidden = true;
      hintLive.textContent = '';
      return;
    }
    hintLive.hidden = false;
    hintLive.textContent = text;
  }

  const onInput = () => {
    if (!rangeInput) return;
    if (!interacted) {
      interacted = true;
      opts.onShuttleInteract?.();
    }
    onYearLive(Number(rangeInput.value));
  };

  const onChange = () => {
    if (!rangeInput) return;
    const y = Number(rangeInput.value);
    onYearLive(y);
    opts.onCommitYear(y);
  };

  rangeInput?.addEventListener('input', onInput);
  rangeInput?.addEventListener('change', onChange);

  const onGzPointer = (ev: Event) => {
    const t = (ev.target as HTMLElement | null)?.closest?.('[data-shuttle-gz]') as
      | HTMLElement
      | null;
    if (!t) return;
    const hint = t.dataset.shuttleHint || '';
    const gz = t.dataset.shuttleGz || t.textContent || '';
    if (hint) showHint(`${gz} · ${hint}`);
  };

  host.addEventListener('click', (ev) => {
    const dismiss = (ev.target as HTMLElement | null)?.closest?.('[data-shuttle-dismiss]');
    if (dismiss) {
      showBubble(null);
      opts.onBubbleDismiss?.();
      return;
    }
    onGzPointer(ev);
  });

  host.addEventListener('pointerdown', (ev) => {
    const t = (ev.target as HTMLElement | null)?.closest?.('[data-shuttle-gz]') as
      | HTMLElement
      | null;
    if (!t) return;
    window.clearTimeout(longPressTimer);
    longPressTimer = window.setTimeout(() => onGzPointer(ev), 420);
  });
  host.addEventListener('pointerup', () => window.clearTimeout(longPressTimer));
  host.addEventListener('pointercancel', () => window.clearTimeout(longPressTimer));

  bubbleEl?.querySelector('[data-shuttle-dismiss]')?.addEventListener('click', () => {
    showBubble(null);
    opts.onBubbleDismiss?.();
  });

  // 首屏若 HTML 里挂着过期换运旁白，立刻清掉
  if (isDecadeBubbleStale(activeBubble, initial.dayunStemGod, initial.dayunEmpty)) {
    showBubble(null);
    opts.onBubbleDismiss?.();
  }

  return () => {
    window.clearTimeout(longPressTimer);
    rangeInput?.removeEventListener('input', onInput);
    rangeInput?.removeEventListener('change', onChange);
  };
}
