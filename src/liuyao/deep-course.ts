import type { CastResult } from './engine.ts';
import { detectSceneDomain } from './scene-map.ts';
import {
  renderGuaXiangCard,
  renderEnergyChainHtml,
  renderMovingYaoCards,
  bindLearnStudio,
  renderDictFooter,
} from './learn-studio.ts';
import { resolveClassicDossier } from './classic-folder.ts';
import { teachFold } from './flip-teach.ts';
import { bindQinDict } from './energy-lens.ts';
import {
  buildShengKeGraph,
  renderCourseShengKeHtml,
  buildCourseShengKeDialogue,
} from './sheng-ke-graph.ts';
import { dressHexagram } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { renderDressArchiveHtml, bindDressArchive, showDressYaoCard } from './dress-archive.ts';
import {
  renderClassicGuaSwitchHtml,
  bindClassicGuaSwitch,
} from './classic-gua-switch.ts';
import { renderClassicCompendiumForCast } from './classic-compendium.ts';
import { bindGuideDomainTabs } from './hex-guide.ts';
import {
  renderXiangNotesPaneHtml,
  bindXiangNotesPane,
} from './xiang-notes-pane.ts';
import { bindTermGloss } from './term-gloss.ts';
import { renderAskPanelHtml, bindAskPanel } from './ask-panel.ts';

export type DeepStep = 1 | 2 | 3;

type DeepLesson = {
  step: DeepStep;
  shortName: string;
  title: string;
  bodyHtml: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildDeepLessons(
  cast: CastResult,
  question: string,
  castAt: Date,
): DeepLesson[] {
  const domain = detectSceneDomain(question);
  const dressed = dressHexagram(cast, siZhuFromDate(castAt).dayStem);
  const sk = buildShengKeGraph(dressed.rows, question);
  const talk = buildCourseShengKeDialogue(sk, question);

  return [
    {
      step: 1,
      shortName: '卦象意象',
      title: '① 卦象解析：这个卦在说什么场景？',
      bodyHtml: renderGuaXiangCard(cast),
    },
    {
      step: 2,
      shortName: '能量推演',
      title: '② 能量现状：谁在帮你，谁在拖你？',
      bodyHtml: `
        ${renderEnergyChainHtml(cast, question, castAt)}
        <p class="ly-deep-step-bridge">${escapeHtml(talk.tease)}</p>
        ${renderCourseShengKeHtml(sk, { compact: true, question })}
        <p class="ly-sk-course-dialogue">${escapeHtml(talk.dialogue)}</p>
      `,
    },
    {
      step: 3,
      shortName: '动爻拆解',
      title: '③ 卦爻辞拆解：哪一支在动？',
      bodyHtml: renderMovingYaoCards(cast, domain),
    },
  ];
}

function renderDeepStepPanel(lesson: DeepLesson): string {
  return `
    <div class="ly-deep-step" data-deep-step="${lesson.step}">
      <p class="ly-course-progress">${lesson.step} / 4 · ${escapeHtml(lesson.shortName)}</p>
      <h3 class="ly-course-title">${escapeHtml(lesson.title)}</h3>
      <div class="ly-deep-step-body">${lesson.bodyHtml}</div>
    </div>
  `;
}

/** 深度推演：逐步教学 */
export function renderDeepCourseHtml(
  cast: CastResult,
  question: string,
  castAt: Date,
): string {
  const lessons = buildDeepLessons(cast, question, castAt);
  const first = lessons[0]!;
  return `
    <section class="ly-course ly-deep-course" data-deep-course data-deep-index="0">
      <p class="ly-teach-main-kicker">深度推演 · 三步精读</p>
      <div class="ly-course-body" data-deep-body>
        ${renderDeepStepPanel(first)}
      </div>
      <nav class="ly-course-nav" aria-label="深度推演导航">
        <button type="button" class="ly-course-nav-btn" data-deep-prev disabled>← 上一步</button>
        <button type="button" class="ly-course-nav-btn ly-course-nav-next" data-deep-next>下一步 →</button>
      </nav>
    </section>
  `;
}

export function bindDeepCourse(
  root: HTMLElement,
  cast: CastResult,
  question: string,
  castAt: Date,
): void {
  const course = root.querySelector<HTMLElement>('[data-deep-course]');
  if (!course) return;
  const lessons = buildDeepLessons(cast, question, castAt);
  let index = 0;
  const body = course.querySelector<HTMLElement>('[data-deep-body]');
  const prevBtn = course.querySelector<HTMLButtonElement>('[data-deep-prev]');
  const nextBtn = course.querySelector<HTMLButtonElement>('[data-deep-next]');

  const paint = () => {
    const lesson = lessons[index]!;
    course.dataset.deepIndex = String(index);
    if (body) body.innerHTML = renderDeepStepPanel(lesson);
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) {
      nextBtn.textContent = index >= lessons.length - 1 ? '完成 ✓' : '下一步 →';
    }
    bindLearnStudio(course);
    course.querySelectorAll<SVGGElement>('.ly-sk-node').forEach((g) => {
      g.style.cursor = 'pointer';
    });
  };

  const openSkInNotes = (idx: number) => {
    const notes = root.querySelector<HTMLElement>('[data-deep-notes]');
    if (!notes) return;
    notes.querySelectorAll<HTMLButtonElement>('[data-note-tab]').forEach((tab) => {
      const on = tab.dataset.noteTab === 'dress';
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', String(on));
    });
    notes.querySelectorAll<HTMLElement>('[data-note-pane]').forEach((pane) => {
      const on = pane.dataset.notePane === 'dress';
      pane.classList.toggle('is-active', on);
      pane.hidden = !on;
    });
    showDressYaoCard(notes, cast, question, idx, castAt);
    notes.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  course.addEventListener('click', (e) => {
    const sk = (e.target as Element).closest<SVGGElement>('.ly-sk-node');
    if (!sk || !course.contains(sk)) return;
    e.stopPropagation();
    const idx = Number(sk.getAttribute('data-sk-line'));
    if (Number.isFinite(idx)) openSkInNotes(idx);
  });

  prevBtn?.addEventListener('click', () => {
    if (index <= 0) return;
    index -= 1;
    paint();
  });
  nextBtn?.addEventListener('click', () => {
    if (index >= lessons.length - 1) return;
    index += 1;
    paint();
  });
  paint();
}

function renderClassicPane(cast: CastResult, question: string): string {
  const d = resolveClassicDossier(cast.primary.name);
  return `
    <p class="ly-guide-tip">古人怎么说：用上方切换本卦辞 / 变卦辞。字眼生僻可先看白话；工作感情等分域见「卦象解析」。</p>
    ${renderClassicGuaSwitchHtml(cast)}
    ${renderClassicCompendiumForCast(cast, question)}
    ${
      d.zengshan
        ? teachFold(
            '《增删卜易》摘录',
            `<p>${escapeHtml(
              d.zengshan.replace(/^《增删卜易》义理摘录（教学整理）：/, ''),
            )}</p>`,
          )
        : ''
    }
  `;
}

/** 独立笔记：结果→为什么→怎么算→古人→个人沉淀 */
export function renderDeepNotesBlockHtml(
  cast: CastResult,
  castAt = new Date(),
  question = '',
): string {
  return `
    <section class="ly-deep-notes ly-result-panel" data-deep-notes data-note-tabs>
      <h3 class="ly-ch-title">📝 解读笔记</h3>
      <div class="ly-note-mini-tabs" role="tablist" aria-label="解读笔记分区">
        <button type="button" class="ly-note-mini-tab is-active" data-note-tab="xiang" role="tab" aria-selected="true">卦象解析</button>
        <button type="button" class="ly-note-mini-tab" data-note-tab="dress" role="tab" aria-selected="false">专业排盘</button>
        <button type="button" class="ly-note-mini-tab" data-note-tab="classic" role="tab" aria-selected="false">古籍解析</button>
        <button type="button" class="ly-note-mini-tab" data-note-tab="ask" role="tab" aria-selected="false">边看边问</button>
        <button type="button" class="ly-note-mini-tab" data-note-tab="journal" role="tab" aria-selected="false">个人沉淀</button>
      </div>
      <div class="ly-note-mini-body">
        <div class="ly-note-tab-panel is-active" data-note-pane="xiang">
          ${renderXiangNotesPaneHtml(cast, question, castAt)}
        </div>
        <div class="ly-note-tab-panel" data-note-pane="dress" hidden>
          <p class="ly-guide-tip">怎么算：六亲六神装卦与点爻注解。</p>
          ${renderDressArchiveHtml(cast, castAt, question)}
        </div>
        <div class="ly-note-tab-panel" data-note-pane="classic" hidden>
          ${renderClassicPane(cast, question)}
        </div>
        <div class="ly-note-tab-panel" data-note-pane="ask" hidden>
          ${renderAskPanelHtml(cast, question, castAt)}
        </div>
        <div class="ly-note-tab-panel" data-note-pane="journal" hidden>
          <p class="ly-layer-guide">个人沉淀 · 写下来，才真正变成你的六爻日记。</p>
          <label class="ly-study-note-field">
            <span>我的直觉感受：</span>
            <textarea class="question-input" rows="2" data-study-note="feel" placeholder="第一眼的感觉…"></textarea>
          </label>
          <label class="ly-study-note-field">
            <span>卦象中最触动我的一句话：</span>
            <textarea class="question-input" rows="2" data-study-note="touch" placeholder="哪一句戳到你…"></textarea>
          </label>
          <label class="ly-study-note-field">
            <span>我的疑惑 / 几天后回看：</span>
            <textarea class="question-input" rows="2" data-study-note="reflect" placeholder="预留回看空位…"></textarea>
          </label>
          ${renderDictFooter()}
        </div>
      </div>
    </section>
  `;
}

export function bindDeepNotesBlock(
  root: HTMLElement,
  cast?: CastResult,
  question = '',
  castAt = new Date(),
): void {
  const host = root.querySelector<HTMLElement>('[data-deep-notes]');
  if (!host) return;
  const tabs = host.querySelectorAll<HTMLButtonElement>('[data-note-tab]');
  const panes = host.querySelectorAll<HTMLElement>('[data-note-pane]');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.noteTab!;
      tabs.forEach((t) => {
        const on = t.dataset.noteTab === id;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
      });
      panes.forEach((p) => {
        const on = p.dataset.notePane === id;
        p.classList.toggle('is-active', on);
        p.hidden = !on;
      });
    });
  });

  bindQinDict(host);
  bindClassicGuaSwitch(host);
  bindGuideDomainTabs(host);
  bindXiangNotesPane(host);
  bindTermGloss(host);
  if (cast) {
    bindAskPanel(host, cast, question, castAt);
    bindDressArchive(host, cast, question, castAt);
  }
}
