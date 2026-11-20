/**
 * 「怎么看亲密关系」教学 UI（无卡片堆叠：标题 + 盘面 + 操作）
 */
import { openBaziCodexPopup } from '../ui/bazi-codex-popup.ts';
import { renderBaziNatalGridHtml } from '../pages/bazi-chart.ts';
import { mountZiweiPlate } from '../ui/ziwei-plate.ts';
import { castCharacter } from './cast.ts';
import {
  LESSON_PRACTICE_PERSON,
  lessonPerson,
  lessonSceneBlurb,
  spouseStarsLine,
  type IntimacyLessonState,
} from './intimacy-lesson.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderIntimacyLesson(state: IntimacyLessonState): string {
  const ch = lessonPerson(state);
  const cast = castCharacter(ch);
  const err = 'error' in cast ? cast.error : '';
  const name = escapeHtml(ch.nickname);

  const back = `<button type="button" class="life-btn-ghost" data-mm-leave-lesson>← 回人池</button>`;

  if (state.phase === 'intro') {
    return `
    <section class="mm-section mm-lesson" aria-label="怎么看亲密关系">
      <h2 class="mm-section-title">怎么看亲密关系</h2>
      <p class="mm-section-lead">小白最难的不是名词，是顺序：打开整张盘，第一眼看哪？看完这儿，接下来看哪？</p>
      <p class="mm-muted">这节用虚构人物「${name}」带你走一遍。教学题可以答对答错；猜剧情是另一回事。</p>
      <ol class="mm-lesson-order">
        <li>紫微：自己找出<strong>夫妻宫</strong></li>
        <li>看宫里的<strong>主星</strong></li>
        <li>回到一个<strong>具体分歧场景</strong>，对照能留意什么</li>
        <li>八字：认出<strong>日柱</strong>，再找到<strong>日支</strong></li>
        <li>换一张盘，自己再走一遍找宫</li>
      </ol>
      <p class="mm-muted">顺序参考开源紫微「婚姻先看夫妻宫再看主星」的读法；不在这里下吉凶断语。</p>
      <div class="mm-actions">
        <button type="button" class="life-btn-primary" data-mm-lesson-next>开始 · 先找夫妻宫 ›</button>
        ${back}
      </div>
    </section>`;
  }

  if (state.phase === 'ziwei_ask' || state.phase === 'practice_ziwei') {
    const practice = state.phase === 'practice_ziwei';
    return `
    <section class="mm-section mm-lesson" aria-label="找夫妻宫">
      <h2 class="mm-section-title">${practice ? '自练 · ' : ''}点哪里？</h2>
      <p class="mm-section-lead">想看${name}遇到分歧时怎么相处，你在紫微盘上会先点哪里？</p>
      <p class="mm-learn-hint" data-mm-lesson-feedback>在盘上点一个宫。找不到可开提示。</p>
      ${
        err
          ? `<p class="mm-muted">${escapeHtml(err)}</p>`
          : `<div class="ziwei-page mm-ziwei-natal mm-lesson-plate">
               <div class="mm-ziwei-plate-host" data-mm-lesson-ziwei data-sheet-char="${escapeHtml(ch.id)}"></div>
             </div>`
      }
      <div class="mm-actions">
        <button type="button" class="life-btn-ghost" data-mm-lesson-hint>开提示</button>
        ${back}
      </div>
    </section>`;
  }

  if (state.phase === 'ziwei_stars') {
    return `
    <section class="mm-section mm-lesson" aria-label="看主星">
      <h2 class="mm-section-title">找到了 · 看主星</h2>
      <p class="mm-section-lead">第一眼对了：夫妻宫管亲密相处。接下来看宫里主星是谁。</p>
      <p class="mm-lesson-callout">${escapeHtml(spouseStarsLine(ch))}</p>
      ${
        err
          ? ''
          : `<div class="ziwei-page mm-ziwei-natal mm-lesson-plate">
               <div class="mm-ziwei-plate-host" data-mm-lesson-ziwei data-sheet-char="${escapeHtml(ch.id)}" data-focus-palace="夫妻宫"></div>
             </div>`
      }
      <p class="mm-muted">点不懂的星可查图鉴释义；查完仍留在这一步。</p>
      <div class="mm-actions">
        <button type="button" class="life-btn-primary" data-mm-lesson-next>回到分歧场景 ›</button>
        ${back}
      </div>
    </section>`;
  }

  if (state.phase === 'scene') {
    return `
    <section class="mm-section mm-lesson" aria-label="分歧场景">
      <h2 class="mm-section-title">对照场景</h2>
      <p class="mm-section-lead">${escapeHtml(lessonSceneBlurb(ch))}</p>
      <p class="mm-muted">这是<strong>教学</strong>：你在学「先看哪」。若在红娘簿里已经看到吵架，再回来翻盘，动机会更强——但猜「她会不会主动和好」仍是猜剧情，不在这节判对错。</p>
      <div class="mm-actions">
        <button type="button" class="life-btn-primary" data-mm-lesson-next>八字 · 先认日柱 ›</button>
        <button type="button" class="life-btn-ghost" data-bazi-term="夫妻宫">查「夫妻宫」</button>
        ${back}
      </div>
    </section>`;
  }

  if (state.phase === 'bazi_day') {
    const grid =
      'error' in cast
        ? `<p class="mm-muted">${escapeHtml(cast.error)}</p>`
        : `<div class="bazi-chart-page mm-bazi-natal" data-mm-lesson-bazi data-lesson-mode="day">
             ${renderBaziNatalGridHtml(cast.bazi, `${ch.nickname}四柱`)}
           </div>`;
    return `
    <section class="mm-section mm-lesson" aria-label="认日柱">
      <h2 class="mm-section-title">八字路线 · 日柱在哪？</h2>
      <p class="mm-section-lead">点表头「年 / 月 / 日 / 时」——哪一柱是「我自己」？</p>
      <p class="mm-learn-hint" data-mm-lesson-feedback>点对的那一列表头。</p>
      ${grid}
      <div class="mm-actions">
        <button type="button" class="life-btn-ghost" data-mm-lesson-hint>开提示</button>
        ${back}
      </div>
    </section>`;
  }

  if (state.phase === 'bazi_branch') {
    const day =
      'error' in cast
        ? null
        : cast.bazi.pillars.find((p) => p.key === 'day' && !p.empty);
    return `
    <section class="mm-section mm-lesson" aria-label="找日支">
      <h2 class="mm-section-title">日柱里 · 哪颗是夫妻宫背景？</h2>
      <p class="mm-section-lead">日柱已认出。传统八字以<strong>日支</strong>作夫妻宫背景——点下面正确的一侧。</p>
      <p class="mm-learn-hint" data-mm-lesson-feedback>日干是我，日支才是亲密场的地气落点。</p>
      ${
        day
          ? `<div class="mm-lesson-day-pick" role="group" aria-label="日柱干支">
               <button type="button" class="mm-lesson-pick" data-mm-lesson-day-part="stem">
                 <span class="mm-muted">日干</span>
                 <strong>${escapeHtml(day.stem)}</strong>
               </button>
               <button type="button" class="mm-lesson-pick" data-mm-lesson-day-part="branch">
                 <span class="mm-muted">日支</span>
                 <strong>${escapeHtml(day.branch)}</strong>
               </button>
             </div>`
          : `<p class="mm-muted">日柱暂缺。</p>`
      }
      <div class="mm-actions">
        <button type="button" class="life-btn-ghost" data-mm-lesson-hint>开提示</button>
        <button type="button" class="life-btn-ghost" data-bazi-term="日支">查「日支」</button>
        ${back}
      </div>
    </section>`;
  }

  if (state.phase === 'practice_intro') {
    return `
    <section class="mm-section mm-lesson" aria-label="换盘自练">
      <h2 class="mm-section-title">换一张盘 · 自己找</h2>
      <p class="mm-section-lead">刚才是带练。现在换成「${escapeHtml(LESSON_PRACTICE_PERSON.nickname)}」，只问一件事：夫妻宫在哪？</p>
      <div class="mm-actions">
        <button type="button" class="life-btn-primary" data-mm-lesson-next>开始自练 ›</button>
        ${back}
      </div>
    </section>`;
  }

  // done
  return `
  <section class="mm-section mm-lesson" aria-label="本节完成">
    <h2 class="mm-section-title">这节你会了</h2>
    <p class="mm-section-lead">想看亲密关系：紫微第一眼找夫妻宫，再看主星；八字先认日柱，再看日支。下次翻陌生盘，还能用这套顺序。</p>
    <p class="mm-muted">红娘簿里若已看到吵架，更有理由回来翻盘——但「会不会主动和好」仍是猜剧情，揭晓后再聊本局。</p>
    <div class="mm-actions">
      <button type="button" class="life-btn-primary" data-mm-leave-lesson>回人池做媒 ›</button>
    </div>
  </section>`;
}

export type LessonUiHandlers = {
  onPalaceTap: (palaceName: string) => void;
  onHint: () => void;
};

/** 挂载盘面，并在找宫阶段拦截宫格点击做教学判分 */
export function mountIntimacyLessonPlate(
  root: HTMLElement,
  state: IntimacyLessonState,
  handlers: LessonUiHandlers,
): () => void {
  const ch = lessonPerson(state);
  const cast = castCharacter(ch);
  const cleanups: Array<() => void> = [];

  root.querySelectorAll<HTMLElement>('[data-mm-lesson-ziwei]').forEach((host) => {
    if ('error' in cast) return;
    host.innerHTML = '';
    const focus = host.dataset.focusPalace;
    const handle = mountZiweiPlate(host, cast.ziwei, {
      initialPalace: focus || undefined,
      explainOnly: true,
    });
    cleanups.push(() => handle.destroy());

    if (state.phase === 'ziwei_ask' || state.phase === 'practice_ziwei') {
      const onCapture = (e: Event) => {
        const t = e.target as HTMLElement | null;
        const cell = t?.closest?.('[data-plate-palace]') as HTMLElement | null;
        if (!cell || !host.contains(cell)) return;
        e.preventDefault();
        e.stopPropagation();
        handlers.onPalaceTap(cell.dataset.platePalace || '');
      };
      host.addEventListener('click', onCapture, true);
      cleanups.push(() => host.removeEventListener('click', onCapture, true));
    }
  });

  root.querySelectorAll<HTMLElement>('[data-bazi-term]').forEach((el) => {
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

export function setLessonFeedback(root: HTMLElement, text: string, soft = false): void {
  const el = root.querySelector<HTMLElement>('[data-mm-lesson-feedback]');
  if (!el) return;
  el.textContent = text;
  el.classList.toggle('is-soft-hint', soft);
}
