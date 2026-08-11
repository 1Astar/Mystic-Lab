/**
 * 解读总览 · 能量天平：五球大小=天性，颜色=月令旺衰；点/拖交互。
 */
import type { EnergyBalance, EnergyBar } from '../bazi/sense-energy.ts';
import { energyLeverTip } from '../bazi/sense-energy.ts';
import { wuxingClass, type SeasonLabel, type WuXing } from '../bazi/elements.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function strengthClass(s: SeasonLabel): string {
  switch (s) {
    case '旺':
      return 'is-wang';
    case '相':
      return 'is-xiang';
    case '休':
      return 'is-xiu';
    case '囚':
      return 'is-qiu';
    case '死':
      return 'is-si';
    default:
      return 'is-xiu';
  }
}

/** 球视觉直径 rem：由天性 pct 映射 */
function orbSizeRem(pct: number): number {
  return 1.65 + (Math.max(8, pct) / 100) * 1.55;
}

export function energyBalanceBoardHtml(energy: EnergyBalance): string {
  const orbs = energy.bars
    .map((b, i) => {
      const size = orbSizeRem(b.pct);
      return `
      <button type="button"
        class="bazi-energy-orb ${wuxingClass(b.wx)} ${strengthClass(b.strength)}"
        data-energy-orb="${i}"
        data-wx="${escapeHtml(b.wx)}"
        style="--orb-size:${size.toFixed(2)}rem"
        aria-label="${escapeHtml(b.wx)} · 月令${escapeHtml(b.strength)} · 点看季节，上拖试杠杆">
        <span class="bazi-energy-orb-core" aria-hidden="true"></span>
        <span class="bazi-energy-orb-label">${escapeHtml(b.wx)}</span>
      </button>`;
    })
    .join('');

  return `
    <div class="bazi-energy-balance" data-energy-balance>
      <p class="bazi-energy-balance-hint">${escapeHtml(energy.balanceHint)}</p>
      <div class="bazi-energy-orbs" role="group" aria-label="五行能量天平">${orbs}</div>
      <p class="bazi-energy-live" data-energy-live hidden></p>
      <button type="button" class="bazi-energy-reset" data-energy-reset hidden>回到本盘</button>
    </div>`;
}

export function mountEnergyBalanceBoard(
  root: HTMLElement,
  energy: EnergyBalance,
  opts?: { onLeverCommit?: () => void },
): () => void {
  const host = root.querySelector<HTMLElement>('[data-energy-balance]');
  if (!host) return () => {};

  const live = host.querySelector<HTMLElement>('[data-energy-live]');
  const resetBtn = host.querySelector<HTMLButtonElement>('[data-energy-reset]');
  const orbs = [...host.querySelectorAll<HTMLButtonElement>('[data-energy-orb]')];

  let selected: number | null = null;
  let trialWx: WuXing | null = null;
  let leverCommitted = false;
  let drag:
    | {
        i: number;
        startY: number;
        moved: boolean;
        boost: number;
      }
    | null = null;

  const showLive = (text: string, mode: 'season' | 'lever'): void => {
    if (!live) return;
    live.hidden = false;
    live.classList.toggle('is-lever', mode === 'lever');
    live.classList.toggle('is-season', mode === 'season');
    live.textContent = text;
  };

  const hideLive = (): void => {
    if (!live) return;
    live.hidden = true;
    live.textContent = '';
  };

  const setResetVisible = (on: boolean): void => {
    if (resetBtn) resetBtn.hidden = !on;
  };

  const clearTrialVisual = (): void => {
    orbs.forEach((btn) => {
      btn.classList.remove('is-trial', 'is-hurt');
      btn.style.removeProperty('--orb-boost');
    });
  };

  const applyTrialVisual = (raised: WuXing, boost: number): void => {
    clearTrialVisual();
    const hurt = energy.bars.find((b) => {
      const map: Record<WuXing, WuXing> = {
        木: '土',
        火: '金',
        土: '水',
        金: '木',
        水: '火',
      };
      return b.wx === map[raised];
    });
    orbs.forEach((btn) => {
      const wx = btn.dataset.wx as WuXing | undefined;
      if (wx === raised) {
        btn.classList.add('is-trial');
        btn.style.setProperty('--orb-boost', String(1 + boost * 0.35));
      }
      if (hurt && wx === hurt.wx) {
        btn.classList.add('is-hurt');
        btn.style.setProperty('--orb-boost', String(Math.max(0.72, 1 - boost * 0.22)));
      }
    });
  };

  const resetTrial = (): void => {
    trialWx = null;
    clearTrialVisual();
    setResetVisible(false);
    if (selected != null) {
      const bar = energy.bars[selected];
      if (bar) showLive(bar.seasonTip, 'season');
      else hideLive();
    } else {
      hideLive();
    }
  };

  const selectOrb = (i: number): void => {
    selected = i;
    orbs.forEach((btn, j) => btn.classList.toggle('is-on', j === i));
    const bar = energy.bars[i];
    if (!bar) return;
    if (trialWx) {
      showLive(energyLeverTip(trialWx), 'lever');
      setResetVisible(true);
    } else {
      showLive(bar.seasonTip, 'season');
    }
  };

  const onPointerDown = (e: PointerEvent, i: number): void => {
    const btn = orbs[i];
    if (!btn) return;
    btn.setPointerCapture(e.pointerId);
    drag = { i, startY: e.clientY, moved: false, boost: 0 };
    selectOrb(i);
  };

  const onPointerMove = (e: PointerEvent): void => {
    if (!drag) return;
    const dy = drag.startY - e.clientY;
    if (Math.abs(dy) > 6) drag.moved = true;
    if (!drag.moved) return;
    const boost = Math.min(1, Math.max(0, dy / 72));
    drag.boost = boost;
    const bar = energy.bars[drag.i];
    if (!bar) return;
    trialWx = bar.wx;
    applyTrialVisual(bar.wx, boost);
    showLive(energyLeverTip(bar.wx), 'lever');
    setResetVisible(true);
    if (!leverCommitted && boost >= 0.2) {
      leverCommitted = true;
      opts?.onLeverCommit?.();
    }
  };

  const onPointerUp = (e: PointerEvent): void => {
    if (!drag) return;
    const { i, moved, boost } = drag;
    drag = null;
    const btn = orbs[i];
    btn?.releasePointerCapture(e.pointerId);
    if (!moved) {
      // 纯点击：季节解释
      const bar = energy.bars[i];
      if (bar && !trialWx) showLive(bar.seasonTip, 'season');
      return;
    }
    if (boost < 0.12) {
      resetTrial();
      selectOrb(i);
      return;
    }
    const bar = energy.bars[i];
    if (!bar) return;
    trialWx = bar.wx;
    applyTrialVisual(bar.wx, Math.max(0.35, boost));
    showLive(energyLeverTip(bar.wx), 'lever');
    setResetVisible(true);
    if (!leverCommitted) {
      leverCommitted = true;
      opts?.onLeverCommit?.();
    }
  };

  const cleanups: Array<() => void> = [];

  orbs.forEach((btn, i) => {
    const down = (e: PointerEvent) => onPointerDown(e, i);
    const move = (e: PointerEvent) => onPointerMove(e);
    const up = (e: PointerEvent) => onPointerUp(e);
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointermove', move);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    cleanups.push(() => {
      btn.removeEventListener('pointerdown', down);
      btn.removeEventListener('pointermove', move);
      btn.removeEventListener('pointerup', up);
      btn.removeEventListener('pointercancel', up);
    });
  });

  const onReset = (): void => resetTrial();
  resetBtn?.addEventListener('click', onReset);
  if (resetBtn) cleanups.push(() => resetBtn.removeEventListener('click', onReset));

  return () => {
    cleanups.forEach((fn) => fn());
  };
}

/** 供测试：导出球尺寸映射 */
export function __orbSizeRemForTest(pct: number): number {
  return orbSizeRem(pct);
}

export type { EnergyBar };
