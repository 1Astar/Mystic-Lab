/**
 * 八字第一节：十神从哪来（点日干 → 点辛 → 换盘自判）
 * 无卡片堆叠：标题 + 盘面 + 操作
 */
import { openBaziCodexPopup } from '../ui/bazi-codex-popup.ts';
import { renderBaziNatalGridHtml } from '../pages/bazi-chart.ts';
import { castCharacter } from './cast.ts';
import {
  explainXinVsDay,
  practiceOptions,
  TENGOD_GUIDE_DAY,
  TENGOD_PRACTICE,
  TENGOD_PRACTICE_DAY,
  TENGOD_TARGET_STEM,
  tengodLessonPerson,
  type TengodLessonState,
} from './tengod-lesson.ts';
import { setLessonFeedback } from './intimacy-lesson-ui.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function backBtn(): string {
  return `<button type="button" class="life-btn-ghost" data-mm-leave-lesson>← 回人池</button>`;
}

function baziGridHtml(
  state: TengodLessonState,
  hideGods: boolean,
): string {
  const ch = tengodLessonPerson(state);
  const cast = castCharacter(ch);
  if ('error' in cast) {
    return `<p class="mm-muted">${escapeHtml(cast.error)}</p>`;
  }
  const hideCls = hideGods ? ' mm-lesson-hide-gods' : '';
  return `<div class="bazi-chart-page mm-bazi-natal mm-lesson-plate${hideCls}" data-mm-lesson-bazi data-lesson-mode="tengod">
    ${renderBaziNatalGridHtml(cast.bazi, `${ch.nickname}四柱`)}
  </div>`;
}

export function renderTengodLesson(state: TengodLessonState): string {
  const ch = tengodLessonPerson(state);
  const name = escapeHtml(ch.nickname);

  if (state.phase === 'intro') {
    return `
    <section class="mm-section mm-lesson" aria-label="十神从哪来">
      <h2 class="mm-section-title">为什么这个辛被标成正官？</h2>
      <p class="mm-section-lead">图鉴会告诉你「正官是什么」。这节课让你下次再看见标签，知道它是怎么认出来的。</p>
      <ol class="mm-lesson-order">
        <li>先点<strong>日干</strong>（盘上的自己）</li>
        <li>再点盘里的<strong>辛</strong></li>
        <li>展开：用日干去认辛 → 才标成正官</li>
        <li>换一张也有辛、但日干不同的盘，自己判断标签会不会变</li>
      </ol>
      <p class="mm-muted">带练盘：「${name}」· 日主甲 · 时干见辛。</p>
      <div class="mm-actions">
        <button type="button" class="life-btn-primary" data-mm-lesson-next>开始 · 先点日干 ›</button>
        ${backBtn()}
      </div>
    </section>`;
  }

  if (state.phase === 'tap_day') {
    return `
    <section class="mm-section mm-lesson" aria-label="点日干">
      <h2 class="mm-section-title">第一步 · 点日干</h2>
      <p class="mm-section-lead">十神相对「自己」才成立。先在天干行里点出日干——这盘是「${TENGOD_GUIDE_DAY}」。</p>
      <p class="mm-learn-hint" data-mm-lesson-feedback>点天干「${TENGOD_GUIDE_DAY}」（日柱那一列）。</p>
      ${baziGridHtml(state, true)}
      <div class="mm-actions">
        <button type="button" class="life-btn-ghost" data-mm-lesson-hint>开提示</button>
        ${backBtn()}
      </div>
    </section>`;
  }

  if (state.phase === 'tap_xin') {
    return `
    <section class="mm-section mm-lesson" aria-label="点辛">
      <h2 class="mm-section-title">第二步 · 点盘上的辛</h2>
      <p class="mm-section-lead">日干「${TENGOD_GUIDE_DAY}」已认到。再点天干「${TENGOD_TARGET_STEM}」——正是被标成正官的那一颗。</p>
      <p class="mm-learn-hint" data-mm-lesson-feedback>在天干行里找「${TENGOD_TARGET_STEM}」。</p>
      ${baziGridHtml(state, true)}
      <div class="mm-actions">
        <button type="button" class="life-btn-ghost" data-mm-lesson-hint>开提示</button>
        ${backBtn()}
      </div>
    </section>`;
  }

  if (state.phase === 'reveal') {
    const explained = explainXinVsDay(TENGOD_GUIDE_DAY);
    const lines = explained.lines
      .map((line) => `<li>${escapeHtml(line)}</li>`)
      .join('');
    return `
    <section class="mm-section mm-lesson" aria-label="展开认法">
      <h2 class="mm-section-title">认出来了 · ${escapeHtml(explained.god)}</h2>
      <p class="mm-section-lead">不是辛自己写着「正官」，是<strong>用日干去认辛</strong>才得到这个标签。</p>
      <ol class="mm-lesson-order">${lines}</ol>
      ${baziGridHtml(state, false)}
      <p class="mm-muted">想查「正官是什么」→ 图鉴；这里记的是「标签从哪来」。</p>
      <div class="mm-actions">
        <button type="button" class="life-btn-ghost" data-bazi-term="正官">查「正官」</button>
        <button type="button" class="life-btn-primary" data-mm-lesson-next>换一张盘 · 自己判 ›</button>
        ${backBtn()}
      </div>
    </section>`;
  }

  if (state.phase === 'practice_intro') {
    return `
    <section class="mm-section mm-lesson" aria-label="换盘自练">
      <h2 class="mm-section-title">换盘 · 标签会变吗？</h2>
      <p class="mm-section-lead">这张是「${escapeHtml(TENGOD_PRACTICE.nickname)}」：盘上仍有「${TENGOD_TARGET_STEM}」，但日干换成了「${TENGOD_PRACTICE_DAY}」。</p>
      <p class="mm-muted">问：时干的辛，还会标成正官吗？用新的日干再认一次。</p>
      <div class="mm-actions">
        <button type="button" class="life-btn-primary" data-mm-lesson-next>开始自判 ›</button>
        ${backBtn()}
      </div>
    </section>`;
  }

  if (state.phase === 'practice_guess') {
    const opts = practiceOptions()
      .map(
        (g) =>
          `<button type="button" class="mm-lesson-guess" data-mm-tengod-guess="${escapeHtml(g)}">${escapeHtml(g)}</button>`,
      )
      .join('');
    return `
    <section class="mm-section mm-lesson" aria-label="自判十神">
      <h2 class="mm-section-title">自判 · 日干${TENGOD_PRACTICE_DAY}见辛</h2>
      <p class="mm-section-lead">十神标签先藏起。用日干「${TENGOD_PRACTICE_DAY}」去认天干「${TENGOD_TARGET_STEM}」——会标成哪一个？</p>
      <p class="mm-learn-hint" data-mm-lesson-feedback>选一个十神名。答错可开提示。</p>
      ${baziGridHtml(state, true)}
      <div class="mm-lesson-guesses" role="group" aria-label="十神选项">${opts}</div>
      <div class="mm-actions">
        <button type="button" class="life-btn-ghost" data-mm-lesson-hint>开提示</button>
        ${backBtn()}
      </div>
    </section>`;
  }

  // done
  const explained = explainXinVsDay(TENGOD_PRACTICE_DAY);
  return `
  <section class="mm-section mm-lesson" aria-label="本节完成">
    <h2 class="mm-section-title">这节你会了</h2>
    <p class="mm-section-lead">同一颗辛：甲日→正官，乙日→${escapeHtml(explained.god)}。标签跟着日干走，不是字面上钉死的。</p>
    <p class="mm-muted">下次再看见「正官」：先确认日干是谁，再问「相对日干，这颗干是什么」。释义仍回图鉴。</p>
    <div class="mm-actions">
      <button type="button" class="life-btn-ghost" data-bazi-term="正官">再查「正官」</button>
      <button type="button" class="life-btn-ghost" data-bazi-term="七杀">查「七杀」</button>
      <button type="button" class="life-btn-primary" data-mm-leave-lesson>回人池做媒 ›</button>
    </div>
  </section>`;
}

export type TengodLessonUiHandlers = {
  onStemTap: (stem: string) => void;
  onGuess: (god: string) => void;
  onHint: () => void;
};

/** 挂载：点天干判分；图鉴词可查 */
export function mountTengodLessonPlate(
  root: HTMLElement,
  state: TengodLessonState,
  handlers: TengodLessonUiHandlers,
): () => void {
  const ch = tengodLessonPerson(state);
  const cast = castCharacter(ch);
  const cleanups: Array<() => void> = [];

  if (state.phase === 'tap_day' || state.phase === 'tap_xin') {
    const host = root.querySelector<HTMLElement>('[data-mm-lesson-bazi]');
    if (host) {
      const onCapture = (e: Event) => {
        const t = e.target as HTMLElement | null;
        const stemEl = t?.closest?.('.bazi-stem[data-bazi-term]') as HTMLElement | null;
        if (!stemEl || !host.contains(stemEl)) return;
        e.preventDefault();
        e.stopPropagation();
        handlers.onStemTap((stemEl.dataset.baziTerm || '').trim());
      };
      host.addEventListener('click', onCapture, true);
      cleanups.push(() => host.removeEventListener('click', onCapture, true));
    }
  }

  root.querySelectorAll<HTMLElement>('[data-mm-tengod-guess]').forEach((el) => {
    const onClick = () => handlers.onGuess(el.dataset.mmTengodGuess || '');
    el.addEventListener('click', onClick);
    cleanups.push(() => el.removeEventListener('click', onClick));
  });

  root.querySelectorAll<HTMLElement>('[data-bazi-term]').forEach((el) => {
    if (el.classList.contains('bazi-stem')) return;
    const onClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const term = el.dataset.baziTerm || '';
      const chart = 'error' in cast ? null : cast.bazi;
      openBaziCodexPopup({ term, chart });
    };
    el.addEventListener('click', onClick);
    cleanups.push(() => el.removeEventListener('click', onClick));
  });

  return () => cleanups.forEach((fn) => fn());
}

export { setLessonFeedback };

export function tengodHintText(state: TengodLessonState): string {
  if (state.phase === 'tap_day') {
    return `提示：日柱天干——表头「日」下面那一格，是「${TENGOD_GUIDE_DAY}」。`;
  }
  if (state.phase === 'tap_xin') {
    return `提示：时柱天干是「${TENGOD_TARGET_STEM}」。`;
  }
  if (state.phase === 'practice_guess') {
    return `提示：日干已是「${TENGOD_PRACTICE_DAY}」。${TENGOD_PRACTICE_DAY}见辛 → 七杀，不是正官。`;
  }
  return '按步骤点盘上的字。';
}
