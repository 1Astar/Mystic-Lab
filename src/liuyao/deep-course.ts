import type { CastResult } from './engine.ts';
import { detectSceneDomain } from './scene-map.ts';
import { buildLearnFaq } from './narrative-learn.ts';
import { buildReadingFacts } from './reading-facts.ts';
import {
  renderGuaXiangCard,
  renderEnergyChainHtml,
  renderMovingYaoCards,
  bindLearnStudio,
} from './learn-studio.ts';
import { resolveClassicDossier } from './classic-folder.ts';
import { glossDaXiang } from './classic-gloss.ts';
import { formatClauseHtml } from './format-clause.ts';
import { teachFold } from './flip-teach.ts';
import { bindQinDict, renderQinDictHtml } from './energy-lens.ts';
import {
  buildShengKeGraph,
  renderCourseShengKeHtml,
  buildCourseShengKeDialogue,
} from './sheng-ke-graph.ts';
import { dressHexagram } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { renderDressArchiveHtml } from './dress-archive.ts';

export type DeepStep = 1 | 2 | 3 | 4;

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

function renderFaqStep(cast: CastResult, question: string): string {
  const faq = buildLearnFaq(buildReadingFacts(cast, question))
    .map(
      (item, i) => `
    <details class="ly-faq-item"${i === 0 ? ' open' : ''}>
      <summary>${escapeHtml(item.q)}</summary>
      <div class="ly-faq-body">${item.a.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}</div>
    </details>`,
    )
    .join('');
  return `
    <section class="ly-deep-faq">
      <p class="ly-layer-guide">边看边问：点开你此刻卡住的问题。</p>
      ${faq}
    </section>`;
}

export function buildDeepLessons(
  cast: CastResult,
  question: string,
  castAt: Date,
): DeepLesson[] {
  const domain = detectSceneDomain(question);
  const dressed = dressHexagram(cast, siZhuFromDate(castAt).dayStem);
  const sk = buildShengKeGraph(dressed.rows, question);
  const talk = buildCourseShengKeDialogue(sk);

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
        ${renderCourseShengKeHtml(sk, { compact: true })}
        <p class="ly-sk-course-dialogue">${escapeHtml(talk.dialogue)}</p>
      `,
    },
    {
      step: 3,
      shortName: '动爻拆解',
      title: '③ 卦爻辞拆解：哪一支在动？',
      bodyHtml: renderMovingYaoCards(cast, domain),
    },
    {
      step: 4,
      shortName: '边看边问',
      title: '④ 边看边问：把疑惑点开',
      bodyHtml: renderFaqStep(cast, question),
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
      <p class="ly-teach-main-kicker">深度推演 · 四步精读</p>
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
  };

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

function renderClassicPane(cast: CastResult): string {
  const d = resolveClassicDossier(cast.primary.name);
  const daBai = glossDaXiang(cast.primary.name) ?? d.modern;
  return `
    <p class="ly-guide-tip">典故与古籍原话。字眼生僻可先看白话，或回「五步学习」的现代翻译。</p>
    ${
      d.judgment
        ? `<div class="ly-classic-block">
      <p class="ly-classic-zh"><span class="ly-classic-tag">《易经》卦辞</span>${escapeHtml(d.judgment)}</p>
      <p class="ly-classic-bai"><span class="ly-classic-tag is-bai">白话</span>${formatClauseHtml(daBai)}</p>
    </div>`
        : '<p class="ly-guide-tip">本库暂无该卦卦辞。</p>'
    }
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

/** 独立笔记板块：我的笔记 / 典故古籍 / 专业排盘 / 黑话词典 */
export function renderDeepNotesBlockHtml(cast: CastResult, castAt = new Date()): string {
  return `
    <section class="ly-deep-notes ly-result-panel" data-deep-notes data-note-tabs>
      <h3 class="ly-ch-title">📝 笔记与对照</h3>
      <div class="ly-note-mini-tabs" role="tablist" aria-label="笔记分区">
        <button type="button" class="ly-note-mini-tab is-active" data-note-tab="write" role="tab" aria-selected="true">我的笔记</button>
        <button type="button" class="ly-note-mini-tab" data-note-tab="classic" role="tab" aria-selected="false">典故古籍</button>
        <button type="button" class="ly-note-mini-tab" data-note-tab="dress" role="tab" aria-selected="false">专业排盘</button>
        <button type="button" class="ly-note-mini-tab" data-note-tab="dict" role="tab" aria-selected="false">黑话词典</button>
      </div>
      <div class="ly-note-mini-body">
        <div class="ly-note-tab-panel is-active" data-note-pane="write">
          <p class="ly-layer-guide">写下来，才真正变成你的六爻日记。</p>
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
        </div>
        <div class="ly-note-tab-panel" data-note-pane="classic" hidden>
          ${renderClassicPane(cast)}
        </div>
        <div class="ly-note-tab-panel" data-note-pane="dress" hidden>
          ${renderDressArchiveHtml(cast, castAt)}
        </div>
        <div class="ly-note-tab-panel" data-note-pane="dict" hidden>
          <ul class="ly-dict-footer-list">
            <li><strong>父母爻</strong> = 学历、知识、合同、长辈支持、安全基地。</li>
            <li><strong>官鬼爻</strong> = 事业目标、外部竞争、压力、社会规则。</li>
            <li><strong>妻财爻</strong> = 财务回报、资源、你自身的价值底气。</li>
            <li><strong>子孙爻</strong> = 创造力、破局、身体与放松的源泉。</li>
            <li><strong>兄弟爻</strong> = 同侪环境、盟友与竞争拉扯。</li>
          </ul>
          <p class="ly-guide-tip">点标签展开详解。</p>
          ${renderQinDictHtml()}
        </div>
      </div>
    </section>
  `;
}

export function bindDeepNotesBlock(root: HTMLElement): void {
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
}
