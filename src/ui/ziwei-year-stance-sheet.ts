/**
 * 流年剧情弹层：主线命名 + 接受挑战 / 暂避锋芒 / 稍后再说
 */
import type { PersonProfile } from '../life/types.ts';
import type { PalaceSnap } from '../ziwei/types.ts';
import {
  buildYearMainline,
  choiceLabel,
  deferYearStance,
  getYearStance,
  listYearTips,
  resolveYearJi,
  saveYearStance,
  type YearStanceChoice,
} from '../craft/year-stance.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type YearStanceSheetResult = 'chose' | 'defer' | 'close';

export function openYearStanceSheet(opts: {
  person: PersonProfile;
  year: number;
  palaces?: PalaceSnap[];
  onDone?: (result: YearStanceSheetResult) => void;
}): void {
  document.querySelector('.ziwei-year-stance-sheet')?.remove();

  const ji = resolveYearJi({
    person: opts.person,
    year: opts.year,
    palaces: opts.palaces,
  });
  const hasJi = Boolean(ji?.jiStar);
  const mainline = buildYearMainline(ji?.jiStar ?? '', ji?.jiPalace ?? '');
  const existing = getYearStance(opts.person.id, opts.year);
  const tips = listYearTips({ personId: opts.person.id, year: opts.year });

  const sheet = document.createElement('div');
  sheet.className = 'ziwei-year-stance-sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.innerHTML = `
    <div class="ziwei-ys-backdrop" data-ys-close></div>
    <div class="ziwei-ys-card">
      <p class="ziwei-ys-kicker">${opts.year} · 流年剧情</p>
      <h3 class="ziwei-ys-title">${escapeHtml(mainline.title)}</h3>
      <p class="ziwei-ys-blurb">${escapeHtml(mainline.blurb)}</p>
      ${
        ji?.mutagenLine
          ? `<p class="ziwei-ys-meta">四化｜${escapeHtml(ji.mutagenLine)}</p>`
          : ''
      }
      ${
        existing
          ? `<p class="ziwei-ys-current">当前立场：${escapeHtml(choiceLabel(existing.choice))}（可重选）</p>`
          : ''
      }
      ${
        tips.length
          ? `<ul class="ziwei-ys-tips">${tips
              .map((t) => `<li>${escapeHtml(t.text)}</li>`)
              .join('')}</ul>`
          : ''
      }
      <div class="ziwei-ys-actions">
        ${
          hasJi
            ? `
          <button type="button" class="ziwei-ys-btn is-primary" data-ys-choice="accept">接受挑战</button>
          <button type="button" class="ziwei-ys-btn" data-ys-choice="avoid">暂避锋芒</button>
          ${
            existing
              ? ''
              : `<button type="button" class="ziwei-ys-btn is-ghost" data-ys-defer>稍后再说</button>`
          }
        `
            : `<p class="ziwei-ys-empty">本年无化忌主线，立场选择暂不可用。</p>
               <button type="button" class="ziwei-ys-btn" data-ys-close>知道了</button>`
        }
      </div>
    </div>`;

  const close = (result: YearStanceSheetResult) => {
    sheet.remove();
    opts.onDone?.(result);
  };

  sheet.querySelector('.ziwei-ys-backdrop')?.addEventListener('click', () => close('close'));
  sheet.querySelectorAll<HTMLButtonElement>('[data-ys-close]').forEach((el) => {
    el.addEventListener('click', () => close('close'));
  });
  sheet.querySelector('[data-ys-defer]')?.addEventListener('click', () => {
    deferYearStance(opts.person.id, opts.year);
    close('defer');
  });
  sheet.querySelectorAll<HTMLButtonElement>('[data-ys-choice]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!ji?.jiStar) return;
      const choice = btn.dataset.ysChoice as YearStanceChoice;
      saveYearStance({
        personId: opts.person.id,
        year: opts.year,
        choice,
        mainlineId: mainline.id,
        mainlineTitle: mainline.title,
        jiStar: ji.jiStar,
        jiPalace: ji.jiPalace,
        chosenAt: new Date().toISOString(),
      });
      close('chose');
    });
  });

  document.body.appendChild(sheet);
}
