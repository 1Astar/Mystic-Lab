import {
  type BirthSolarValue,
  type CalendarMode,
  birthFieldsFromValue,
  clampBirthSolar,
  daysInLunarMonth,
  daysInSolarMonth,
  defaultBirthSolar,
  formatBirthDatetimeSummary,
  formatBirthTriggerLabel,
  hourWheelLabel,
  lunarDayLabelInMonth,
  lunarMonthsInYear,
  lunarToSolar,
  resolveInitialValue,
  solarToLunar,
} from '../bazi/birth-datetime.ts';

const ITEM_H = 40;
const YEAR_MIN = 1900;
const YEAR_MAX = 2100;

type WheelOption = { value: number; label: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildYearOptions(): WheelOption[] {
  const out: WheelOption[] = [];
  for (let y = YEAR_MIN; y <= YEAR_MAX; y++) out.push({ value: y, label: `${y}年` });
  return out;
}

function buildSolarMonthOptions(): WheelOption[] {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${String(i + 1).padStart(2, '0')}月`,
  }));
}

function buildHourOptions(): WheelOption[] {
  return Array.from({ length: 24 }, (_, h) => ({
    value: h,
    label: hourWheelLabel(h),
  }));
}

function buildMinuteOptions(): WheelOption[] {
  return Array.from({ length: 60 }, (_, m) => ({
    value: m,
    label: `${String(m).padStart(2, '0')}分`,
  }));
}

function fillWheel(el: HTMLElement, options: WheelOption[], selected: number): void {
  const pad = `<div class="birth-dt-wheel-pad" aria-hidden="true"></div>`.repeat(2);
  el.innerHTML =
    pad +
    options
      .map(
        (o) =>
          `<div class="birth-dt-wheel-item" data-value="${o.value}">${escapeHtml(o.label)}</div>`,
      )
      .join('') +
    pad;
  const idx = Math.max(
    0,
    options.findIndex((o) => o.value === selected),
  );
  el.dataset.selected = String(options[idx]?.value ?? selected);
  requestAnimationFrame(() => {
    el.scrollTop = idx * ITEM_H;
  });
}

function readWheel(el: HTMLElement): number {
  const idx = Math.round(el.scrollTop / ITEM_H);
  const items = el.querySelectorAll<HTMLElement>('.birth-dt-wheel-item');
  const item = items[Math.min(items.length - 1, Math.max(0, idx))];
  return Number(item?.dataset.value ?? el.dataset.selected ?? 0);
}

function snapWheel(el: HTMLElement): number {
  const idx = Math.round(el.scrollTop / ITEM_H);
  el.scrollTop = idx * ITEM_H;
  const value = readWheel(el);
  el.dataset.selected = String(value);
  return value;
}

export type OpenBirthDatetimePickerOptions = {
  initial?: BirthSolarValue | null;
  onConfirm: (value: BirthSolarValue) => void;
};

export function openBirthDatetimePicker(opts: OpenBirthDatetimePickerOptions): void {
  document.querySelector('.birth-dt-sheet')?.remove();

  let solar = clampBirthSolar(opts.initial ?? defaultBirthSolar());
  let mode: CalendarMode = 'solar';
  let lunar = solarToLunar(solar);

  const sheet = document.createElement('div');
  sheet.className = 'birth-dt-sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.innerHTML = `
    <div class="birth-dt-backdrop" data-birth-dt-close></div>
    <div class="birth-dt-panel">
      <div class="birth-dt-toolbar">
        <button type="button" class="birth-dt-tool" data-birth-dt-close>取消</button>
        <div class="birth-dt-mode" role="tablist" aria-label="历法">
          <button type="button" class="birth-dt-mode-btn is-active" data-mode="solar">公历</button>
          <button type="button" class="birth-dt-mode-btn" data-mode="lunar">农历</button>
        </div>
        <button type="button" class="birth-dt-tool birth-dt-tool-ok" data-birth-dt-ok>完成</button>
      </div>
      <p class="birth-dt-summary" id="birth-dt-summary"></p>
      <div class="birth-dt-wheels" aria-label="滑动选择">
        <div class="birth-dt-highlight" aria-hidden="true"></div>
        <div class="birth-dt-wheel" data-col="year"></div>
        <div class="birth-dt-wheel" data-col="month"></div>
        <div class="birth-dt-wheel" data-col="day"></div>
        <div class="birth-dt-wheel" data-col="hour"></div>
        <div class="birth-dt-wheel" data-col="minute"></div>
      </div>
    </div>
  `;

  document.body.appendChild(sheet);
  requestAnimationFrame(() => sheet.classList.add('is-visible'));

  const summaryEl = sheet.querySelector<HTMLElement>('#birth-dt-summary')!;
  const yearEl = sheet.querySelector<HTMLElement>('[data-col="year"]')!;
  const monthEl = sheet.querySelector<HTMLElement>('[data-col="month"]')!;
  const dayEl = sheet.querySelector<HTMLElement>('[data-col="day"]')!;
  const hourEl = sheet.querySelector<HTMLElement>('[data-col="hour"]')!;
  const minuteEl = sheet.querySelector<HTMLElement>('[data-col="minute"]')!;

  const timers = new WeakMap<HTMLElement, number>();

  function syncSummary(): void {
    summaryEl.textContent = formatBirthDatetimeSummary(solar, mode);
  }

  function rebuildDayWheel(): void {
    const options: WheelOption[] =
      mode === 'solar'
        ? Array.from({ length: daysInSolarMonth(solar.year, solar.month) }, (_, i) => ({
            value: i + 1,
            label: `${i + 1}日`,
          }))
        : Array.from({ length: daysInLunarMonth(lunar.year, lunar.month) }, (_, i) => ({
            value: i + 1,
            label: lunarDayLabelInMonth(lunar.year, lunar.month, i + 1),
          }));
    const selected =
      mode === 'solar'
        ? Math.min(solar.day, options.length)
        : Math.min(lunar.day, options.length);
    fillWheel(dayEl, options, selected);
  }

  function rebuildMonthWheel(): void {
    if (mode === 'solar') {
      fillWheel(monthEl, buildSolarMonthOptions(), solar.month);
      return;
    }
    const months = lunarMonthsInYear(lunar.year);
    const selected =
      months.find((m) => m.month === lunar.month)?.month ?? months[0]?.month ?? 1;
    fillWheel(
      monthEl,
      months.map((m) => ({ value: m.month, label: m.label })),
      selected,
    );
    lunar.month = selected;
  }

  function rebuildAll(): void {
    const yearSelected = mode === 'solar' ? solar.year : lunar.year;
    fillWheel(yearEl, buildYearOptions(), yearSelected);
    rebuildMonthWheel();
    rebuildDayWheel();
    fillWheel(hourEl, buildHourOptions(), solar.hour);
    fillWheel(minuteEl, buildMinuteOptions(), solar.minute);
    syncSummary();
  }

  function applyFromWheels(): void {
    const year = readWheel(yearEl);
    const month = readWheel(monthEl);
    const day = readWheel(dayEl);
    const hour = readWheel(hourEl);
    const minute = readWheel(minuteEl);

    if (mode === 'solar') {
      const maxDay = daysInSolarMonth(year, month);
      solar = clampBirthSolar({
        year,
        month,
        day: Math.min(day, maxDay),
        hour,
        minute,
      });
      lunar = solarToLunar(solar);
      if (day > maxDay) rebuildDayWheel();
    } else {
      const maxDay = daysInLunarMonth(year, month);
      const d = Math.min(day, maxDay);
      lunar = { year, month, day: d };
      solar = lunarToSolar(year, month, d, hour, minute);
      if (day > maxDay) rebuildDayWheel();
    }
    syncSummary();
  }

  function onWheelScroll(el: HTMLElement): void {
    const prev = timers.get(el);
    if (prev) window.clearTimeout(prev);
    timers.set(
      el,
      window.setTimeout(() => {
        snapWheel(el);
        const col = el.dataset.col;
        if (col === 'year') {
          if (mode === 'lunar') {
            lunar.year = readWheel(yearEl);
            rebuildMonthWheel();
            rebuildDayWheel();
          } else {
            solar.year = readWheel(yearEl);
            rebuildDayWheel();
          }
        } else if (col === 'month') {
          rebuildDayWheel();
        }
        applyFromWheels();
      }, 80),
    );
  }

  [yearEl, monthEl, dayEl, hourEl, minuteEl].forEach((el) => {
    el.addEventListener('scroll', () => onWheelScroll(el), { passive: true });
  });

  sheet.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.mode as CalendarMode;
      if (next === mode) return;
      mode = next;
      sheet.querySelectorAll('.birth-dt-mode-btn').forEach((b) => {
        b.classList.toggle('is-active', b.getAttribute('data-mode') === mode);
      });
      if (mode === 'lunar') lunar = solarToLunar(solar);
      else lunar = solarToLunar(solar);
      rebuildAll();
    });
  });

  const close = (): void => {
    sheet.classList.remove('is-visible');
    window.setTimeout(() => sheet.remove(), 280);
  };

  sheet.querySelectorAll('[data-birth-dt-close]').forEach((el) => {
    el.addEventListener('click', close);
  });

  sheet.querySelector('[data-birth-dt-ok]')?.addEventListener('click', () => {
    applyFromWheels();
    opts.onConfirm(clampBirthSolar(solar));
    close();
  });

  rebuildAll();
}

export type MountBirthDatetimeFieldOptions = {
  host: HTMLElement;
  /** 插入位置：替换该节点 */
  replaceEl: HTMLElement;
  namePrefix?: string;
  initialYear?: string;
  initialMonth?: string;
  initialDay?: string;
  initialHour?: string;
  onChange?: (fields: ReturnType<typeof birthFieldsFromValue>) => void;
};

export function mountBirthDatetimeField(opts: MountBirthDatetimeFieldOptions): {
  getFields: () => ReturnType<typeof birthFieldsFromValue>;
  setFromStrings: (y: string, m: string, d: string, h: string) => void;
} {
  const initial = resolveInitialValue(
    opts.initialYear ?? '',
    opts.initialMonth ?? '',
    opts.initialDay ?? '',
    opts.initialHour ?? '',
  );
  const hasInitial = Boolean(
    opts.initialYear?.trim() && opts.initialMonth?.trim() && opts.initialDay?.trim(),
  );
  let value: BirthSolarValue | null = hasInitial ? initial : null;

  const wrap = document.createElement('div');
  wrap.className = 'birth-dt-field-wrap';
  wrap.innerHTML = `
    <label class="life-field life-field-full">
      <span>出生时间</span>
      <button type="button" class="birth-dt-trigger">
        ${escapeHtml(formatBirthTriggerLabel(value))}
      </button>
    </label>
    <input type="hidden" name="birthYear" value="${escapeHtml(value ? String(value.year) : '')}" />
    <input type="hidden" name="birthMonth" value="${escapeHtml(value ? String(value.month) : '')}" />
    <input type="hidden" name="birthDay" value="${escapeHtml(value ? String(value.day) : '')}" />
    <input type="hidden" name="birthHour" value="${escapeHtml(value ? birthFieldsFromValue(value).birthHour : '')}" />
  `;

  opts.replaceEl.replaceWith(wrap);

  const trigger = wrap.querySelector<HTMLButtonElement>('.birth-dt-trigger')!;
  const yearInput = wrap.querySelector<HTMLInputElement>('input[name="birthYear"]')!;
  const monthInput = wrap.querySelector<HTMLInputElement>('input[name="birthMonth"]')!;
  const dayInput = wrap.querySelector<HTMLInputElement>('input[name="birthDay"]')!;
  const hourInput = wrap.querySelector<HTMLInputElement>('input[name="birthHour"]')!;

  function writeInputs(next: BirthSolarValue | null): void {
    value = next;
    if (!next) {
      yearInput.value = '';
      monthInput.value = '';
      dayInput.value = '';
      hourInput.value = '';
      trigger.textContent = formatBirthTriggerLabel(null);
      return;
    }
    const fields = birthFieldsFromValue(next);
    yearInput.value = fields.birthYear;
    monthInput.value = fields.birthMonth;
    dayInput.value = fields.birthDay;
    hourInput.value = fields.birthHour;
    trigger.textContent = formatBirthTriggerLabel(next);
    opts.onChange?.(fields);
  }

  trigger.addEventListener('click', () => {
    openBirthDatetimePicker({
      initial: value ?? defaultBirthSolar(),
      onConfirm: (v) => writeInputs(v),
    });
  });

  return {
    getFields: () =>
      value
        ? birthFieldsFromValue(value)
        : { birthYear: '', birthMonth: '', birthDay: '', birthHour: '' },
    setFromStrings: (y, m, d, h) => {
      const parsed = resolveInitialValue(y, m, d, h);
      writeInputs(y.trim() && m.trim() && d.trim() ? parsed : null);
    },
  };
}
