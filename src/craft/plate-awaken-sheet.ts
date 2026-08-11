/**
 * 盘面星曜：本源 / 试炼 弹层
 */
import { navigate } from '../router.ts';
import { activateStar } from './spirit-activate.ts';
import {
  plateStarKey,
  type PlateAwakenCopy,
  type PlateStarRef,
} from './plate-awaken.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type PlateAwakenSheetResult = 'activate' | 'sanfang' | 'learn' | 'close';

/** 轻量「咚」提示音（无资源文件） */
export function playAwakenChime(): void {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 220;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ctx.destination);
    const t = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.frequency.exponentialRampToValueAtTime(440, t + 0.18);
    o.start(t);
    o.stop(t + 0.4);
  } catch {
    /* ignore */
  }
}

export function openPlateAwakenSheet(opts: {
  ref: PlateStarRef;
  copy: PlateAwakenCopy;
  onDone: (result: PlateAwakenSheetResult) => void;
}): void {
  document.querySelector('.plate-awaken-sheet')?.remove();

  const sheet = document.createElement('div');
  sheet.className = `plate-awaken-sheet is-${opts.copy.theme}${opts.copy.karma ? ' is-karma' : ''}`;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.innerHTML = `
    <div class="plate-awaken-backdrop" data-awaken-close></div>
    <div class="plate-awaken-card">
      <p class="plate-awaken-kicker">${escapeHtml(opts.copy.title)}</p>
      <h3 class="plate-awaken-name">${escapeHtml(
        opts.ref.mutagenCard ? `${opts.ref.star}·${opts.ref.mutagenCard}` : opts.ref.star,
      )}</h3>
      ${opts.copy.karma ? '<span class="plate-awaken-karma-tag">业力</span>' : ''}
      <p class="plate-awaken-body">${escapeHtml(opts.copy.body)}</p>
      ${opts.copy.gainLine ? `<p class="plate-awaken-gain">${escapeHtml(opts.copy.gainLine)}</p>` : ''}
      <div class="plate-awaken-actions">
        ${
          opts.copy.cta === 'activate'
            ? `<button type="button" class="plate-awaken-btn is-primary" data-awaken-activate>${escapeHtml(opts.copy.ctaLabel || '接纳并激活')}</button>`
            : ''
        }
        ${
          opts.copy.cta === 'sanfang'
            ? `<button type="button" class="plate-awaken-btn is-primary" data-awaken-sanfang>${escapeHtml(opts.copy.ctaLabel || '落宫指南')}</button>`
            : ''
        }
        ${
          opts.copy.cta === 'learn'
            ? `<button type="button" class="plate-awaken-btn is-primary" data-awaken-learn>${escapeHtml(opts.copy.ctaLabel || '查看释义')}</button>`
            : ''
        }
        <button type="button" class="plate-awaken-btn" data-awaken-close>关闭</button>
        <button type="button" class="plate-awaken-btn is-ghost" data-awaken-craft>去造命看雷达</button>
      </div>
    </div>`;

  const finish = (r: PlateAwakenSheetResult) => {
    sheet.remove();
    opts.onDone(r);
  };

  sheet.querySelectorAll('[data-awaken-close]').forEach((el) => {
    el.addEventListener('click', () => finish('close'));
  });
  sheet.querySelector('[data-awaken-activate]')?.addEventListener('click', () => {
    const key = plateStarKey(opts.ref);
    const codexId = opts.ref.mutagenCard || opts.ref.star;
    activateStar(key, { starNameForCodex: codexId, palace: opts.ref.palace });
    playAwakenChime();
    finish('activate');
  });
  sheet.querySelector('[data-awaken-sanfang]')?.addEventListener('click', () => finish('sanfang'));
  sheet.querySelector('[data-awaken-learn]')?.addEventListener('click', () => finish('learn'));
  sheet.querySelector('[data-awaken-craft]')?.addEventListener('click', () => {
    sheet.remove();
    navigate('/craft');
  });

  document.body.appendChild(sheet);
}
