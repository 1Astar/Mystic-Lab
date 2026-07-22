import type { CastResult } from './engine.ts';
import { LINE_LABELS, upperLowerFromLines, yingLineOf } from './hexagrams.ts';
import { dressHexagram } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { buildReadingFacts, LINE_ROLE } from './reading-facts.ts';
import { LIUQIN_ENERGY } from './energy-lens.ts';
import { buildStrategyPack } from './strategy.ts';
import { formatClauseHtml } from './format-clause.ts';
import { renderHexagramSvg } from '../ui/liuyao/hexagram-view.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { glossLine, glossDaXiang } from './classic-gloss.ts';
import { composeScene } from './scene-map.ts';
import {
  buildShengKeGraph,
  buildCourseShengKeDialogue,
  renderCourseShengKeHtml,
} from './sheng-ke-graph.ts';
import { resolveClassicDossier } from './classic-folder.ts';
import { teachFold } from './flip-teach.ts';
import { renderDressArchiveHtml } from './dress-archive.ts';
import {
  renderEnergyChainHtml,
  renderMovingYaoCards,
  renderGuaXiangCard,
  bindLearnStudio,
} from './learn-studio.ts';
import { buildLearnFaq } from './narrative-learn.ts';

export type CourseStep = 1 | 2 | 3 | 4 | 5;

export type CourseLesson = {
  step: CourseStep;
  shortName: string;
  title: string;
  /** 纯文本方法说明；若有 methodHtml 则优先用 HTML */
  basics: string;
  vernacular: string;
  notePrompt: string;
  /** 输入框下方参考例子 */
  noteHint?: string;
  classicTitle: string;
  classicText: string;
  classicBai: string;
  /** Step 1 等方法论图标卡 */
  methodHtml?: string;
  /** Step 4 等：因果工具区 HTML */
  toolHtml?: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function noteStorageKey(cast: CastResult, step: CourseStep): string {
  return `mystic-ly-course-note:${cast.primary.name}:${cast.changingIndexes.join(',')}:${step}`;
}

const noteMemory = new Map<string, string>();

function storageGet(key: string): string {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key) ?? noteMemory.get(key) ?? '';
    }
  } catch {
    /* ignore */
  }
  return noteMemory.get(key) ?? '';
}

function storageSet(key: string, text: string): void {
  noteMemory.set(key, text);
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, text);
  } catch {
    /* ignore quota */
  }
}

export function loadCourseNote(cast: CastResult, step: CourseStep): string {
  return storageGet(noteStorageKey(cast, step));
}

export function saveCourseNote(cast: CastResult, step: CourseStep, text: string): void {
  storageSet(noteStorageKey(cast, step), text);
}

export function buildCourseLessons(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): CourseLesson[] {
  const facts = buildReadingFacts(cast, question, castAt);
  const rows = dressHexagram(cast, siZhuFromDate(castAt).dayStem).rows;
  const shi = rows.find((r) => r.isShi);
  const ying = rows.find((r) => r.isYing);
  const shiE = shi ? LIUQIN_ENERGY[shi.liuqin] : null;
  const yingE = ying ? LIUQIN_ENERGY[ying.liuqin] : null;
  const { upper, lower } = upperLowerFromLines(cast.primaryLines);
  const scene = composeScene(upper, lower, cast.primary);
  const corpus = getClassicCorpus(cast.primary.name);
  const pack = buildStrategyPack(cast, facts.domain, question);
  const shiLabel = LINE_LABELS[cast.shiLine - 1]!;
  const yingLabel = LINE_LABELS[cast.yingLine - 1]!;

  const moveLabels =
    cast.changingIndexes.length === 0
      ? null
      : cast.changingIndexes.map((i) => LINE_LABELS[i]!).join('、');
  const moveRoles =
    cast.changingIndexes.length === 0
      ? ''
      : cast.changingIndexes.map((i) => LINE_ROLE[i]!).join('、');

  const shiClassic = corpus?.lineClassics[cast.shiLine - 1] ?? '';
  const yingClassic = corpus?.lineClassics[cast.yingLine - 1] ?? '';

  const moveClassic =
    cast.changingIndexes.length === 0
      ? corpus?.judgment ?? ''
      : cast.changingIndexes
          .map((i) => corpus?.lineClassics[i] ?? '')
          .filter(Boolean)
          .join('\n');
  const moveBai =
    cast.changingIndexes.length === 0
      ? glossDaXiang(cast.primary.name) ?? corpus?.modern ?? ''
      : cast.changingIndexes
          .map((i) => glossLine(cast.primary.name, i) ?? '')
          .filter(Boolean)
          .join('\n');

  const advice = pack.items[0]?.text ?? '先把世应与动爻看清，再选一个可验证的小动作。';

  const skGraph = buildShengKeGraph(rows, question);
  const skTalk = buildCourseShengKeDialogue(skGraph);
  const faqHtml = buildLearnFaq(facts)
    .map(
      (item, i) => `
    <details class="ly-faq-item"${i === 0 ? ' open' : ''}>
      <summary>${escapeHtml(item.q)}</summary>
      <div class="ly-faq-body">${item.a.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}</div>
    </details>`,
    )
    .join('');

  const shiPosHint =
    cast.shiLine <= 2 ? '根基与开端' : cast.shiLine <= 4 ? '过程与门户' : '收尾或高位';
  const yingPosHint =
    cast.yingLine <= 2 ? '根基与开端' : cast.yingLine <= 4 ? '过程与门户' : '收尾或高位';

  const step1Bai = [
    `世在${shiLabel}：对应你当前所处的自我状态——「${shiE?.modern ?? '当下状态'}」，位置偏${shiPosHint}。`,
    `应在${yingLabel}：代表外部环境或你面临的事情——「${yingE?.modern ?? '外部环境'}」，位置偏${yingPosHint}。`,
  ].join('\n');

  return [
    {
      step: 1,
      shortName: '找你的位置',
      title: '找「你」和「外界」的位置',
      basics: '',
      methodHtml: `
        <div class="ly-course-method">
          <p class="ly-course-method-head">🔍 教你找位置：</p>
          <ul class="ly-course-method-list">
            <li><strong>【你】</strong> = 世爻（在${escapeHtml(shiLabel)}，标记金色圈）</li>
            <li><strong>【外界 / 对方】</strong> = 应爻（在${escapeHtml(yingLabel)}，标记红色圈）</li>
          </ul>
        </div>`,
      vernacular: `💡 结合你的问题：你现在处于「${shiE?.modern ?? '当下状态'}」的状态${
        shi ? `（传统属${shi.liuqin}）` : ''
      }。外面环境是「${yingE?.modern ?? '外部环境'}」${
        ying ? `（传统属${ying.liuqin}）` : ''
      }。世应${facts.shiYingRel.rel}，意味着${facts.shiYingRel.verdict}。`,
      notePrompt: '我感觉我现在确实是 / 不是这个状态…',
      noteHint:
        '例如：我确实感觉现在的处境让我很内耗；或者我并没有在打破常规，而是在硬撑。',
      classicTitle: 'Step 1 · 世应对应的爻辞',
      classicText: [
        shiClassic ? `世·${shiLabel}：${shiClassic}` : '',
        yingClassic ? `应·${yingLabel}：${yingClassic}` : '',
      ]
        .filter(Boolean)
        .join('\n') || '本库暂无该卦世应爻辞。',
      classicBai: step1Bai,
    },
    {
      step: 2,
      shortName: '找动爻',
      title: '找「动爻」——什么在变？',
      basics: moveLabels
        ? '卦里不是静止的。变红、闪烁的线叫【动爻】，代表这件事里「正在发生变化」的部分。'
        : '本卦没有动爻：格局相对稳。关键不在突变，而在把世应看清。',
      vernacular: moveLabels
        ? `你这件事的转机在${moveLabels}（偏「${moveRoles}」）。因为这一层在变，整体局势才会跟着松动。`
        : '没有动爻推动变卦——先稳住当下结构，再谈下一步。',
      notePrompt: '我觉得真正在变的，可能是…',
      classicTitle: 'Step 2 · 动爻（或卦辞）原文',
      classicText: moveClassic || '本库暂无动爻原文。',
      classicBai: moveBai || '对照现代：变化层在「沟通 / 节奏 / 资源」中的哪一层。',
      toolHtml: renderMovingYaoCards(cast, facts.domain),
    },
    {
      step: 3,
      shortName: '翻译上下卦',
      title: '翻译上下卦——为什么是这个卦象？',
      basics:
        '六爻分成两半：上面三爻叫上卦（大环境），下面三爻叫下卦（你自己这边）。两者叠合，才是本卦。',
      vernacular: `上卦是${upper.id}·${upper.nature}，暗示环境侧；下卦是${lower.id}·${lower.nature}，暗示你这边。合起来：${
        facts.domain === 'love' ? scene.love : scene.career
      }`,
      notePrompt: '上下卦合在一起，让我想到…',
      classicTitle: 'Step 3 · 卦辞与大象',
      classicText: [
        corpus?.judgment ? `卦辞：${corpus.judgment}` : '',
        corpus?.daXiang ? `大象：${corpus.daXiang}` : '',
      ]
        .filter(Boolean)
        .join('\n') || '本库暂无卦辞。',
      classicBai: glossDaXiang(cast.primary.name) ?? corpus?.modern ?? scene.meaning,
      toolHtml: renderGuaXiangCard(cast),
    },
    {
      step: 4,
      shortName: '能量推演',
      title: '② 能量现状：谁在帮你，谁在拖你？',
      basics: '',
      vernacular: skTalk.dialogue,
      notePrompt: '看完因果图，我觉得谁在帮我、谁在拖我…',
      classicTitle: 'Step 4 · 本变与生克原文',
      classicText: cast.changed
        ? `本卦「${cast.primary.fullName}」→ 变卦「${cast.changed.fullName}」\n${corpus?.judgment ?? ''}`
        : corpus?.judgment ?? cast.primary.gist,
      classicBai: cast.changed
        ? `${cast.primary.gist} → ${cast.changed.gist}`
        : cast.primary.gist,
      toolHtml: `
        ${renderEnergyChainHtml(cast, question, castAt)}
        <p class="ly-deep-step-bridge">${escapeHtml(skTalk.tease)}</p>
        ${renderCourseShengKeHtml(skGraph, { compact: true })}
      `,
    },
    {
      step: 5,
      shortName: '行动与答疑',
      title: '🚀 行动建议 · 边看边问',
      basics: '综合世应、动爻、能量推演，收成一句可执行的建议；卡住就点开下面的问题。',
      vernacular: advice,
      notePrompt: '我这周打算验证的一小步是…',
      classicTitle: 'Step 5 · 教学摘录',
      classicText:
        corpus?.zengshan?.replace(/^《增删卜易》义理摘录（教学整理）：/, '') ||
        '先看用神与世应，再看动变——勿以一词断吉凶。',
      classicBai: `主题「${facts.themeWord}」：${advice}`,
      toolHtml: `
        <section class="ly-deep-faq">
          <p class="ly-layer-guide">边看边问：点开你此刻卡住的问题。</p>
          ${faqHtml}
        </section>
      `,
    },
  ];
}

function renderCourseVisual(cast: CastResult, step: CourseStep): string {
  const shi = cast.shiLine;
  const ying = cast.yingLine;
  const changing = cast.changingIndexes;
  const changedShi = cast.changed?.shiLine;
  const changedYing = changedShi ? yingLineOf(changedShi) : undefined;

  if (step === 1) {
    return `
      <div class="ly-course-visual">
        ${renderHexagramSvg({
          lines: cast.primaryLines,
          shiLine: shi,
          yingLine: ying,
          changingIndexes: [],
          emphasizeShiYing: true,
          dimOthers: true,
          focusIndexes: [shi - 1, ying - 1],
          showTrigramLabels: false,
        })}
        <p class="ly-course-visual-hint">全灰里只亮：世（你）与应（外界）</p>
      </div>`;
  }

  if (step === 2) {
    return `
      <div class="ly-course-visual">
        ${renderHexagramSvg({
          lines: cast.primaryLines,
          shiLine: shi,
          yingLine: ying,
          changingIndexes: changing,
          pulseChanging: changing.length > 0,
          dimOthers: changing.length > 0,
          focusIndexes: changing,
          emphasizeShiYing: false,
        })}
        <p class="ly-course-visual-hint">${
          changing.length ? '动爻闪烁 = 正在变的部分' : '无动爻：先稳住结构'
        }</p>
      </div>`;
  }

  if (step === 3) {
    const { upper, lower } = upperLowerFromLines(cast.primaryLines);
    return `
      <div class="ly-course-visual">
        ${renderHexagramSvg({
          lines: cast.primaryLines,
          shiLine: shi,
          yingLine: ying,
          changingIndexes: changing,
          showTrigramLabels: true,
        })}
        <p class="ly-course-visual-hint">上${upper.id}·${upper.nature}　下${lower.id}·${lower.nature}</p>
      </div>`;
  }

  if (step === 4) {
    return `
      <div class="ly-course-visual ly-course-visual-pair">
        <div>
          <p class="ly-guide-label">本卦</p>
          ${renderHexagramSvg({
            lines: cast.primaryLines,
            shiLine: shi,
            yingLine: ying,
            changingIndexes: changing,
            pulseChanging: true,
            compact: true,
          })}
        </div>
        <span class="ly-course-arrow" aria-hidden="true">→</span>
        <div>
          <p class="ly-guide-label">变卦</p>
          ${
            cast.changed
              ? renderHexagramSvg({
                  lines: cast.changedLines,
                  shiLine: changedShi,
                  yingLine: changedYing,
                  compact: true,
                })
              : '<p class="ly-guide-tip">无变</p>'
          }
        </div>
      </div>`;
  }

  return `
    <div class="ly-course-visual">
      ${renderHexagramSvg({
        lines: cast.primaryLines,
        shiLine: shi,
        yingLine: ying,
        changingIndexes: changing,
        pulseChanging: true,
        emphasizeShiYing: true,
        showTrigramLabels: true,
      })}
      <p class="ly-course-gold">${escapeHtml(cast.primary.gist)}</p>
    </div>`;
}

/** 传统书籍注解：卦辞 / 大象 / 增删 / 六爻爻辞 */
function renderBooksAnnotationHtml(cast: CastResult): string {
  const d = resolveClassicDossier(cast.primary.name);
  const corpus = getClassicCorpus(cast.primary.name);
  const daBai = glossDaXiang(cast.primary.name) ?? d.modern;
  const lines = (corpus?.lineClassics ?? [])
    .map((text, i) => {
      if (!text) return '';
      const bai = glossLine(cast.primary.name, i) ?? '';
      return `
        <div class="ly-classic-block">
          <p class="ly-classic-zh"><span class="ly-classic-tag">${LINE_LABELS[i]}</span>${escapeHtml(text)}</p>
          ${
            bai
              ? `<p class="ly-classic-bai"><span class="ly-classic-tag is-bai">白话</span>${formatClauseHtml(bai)}</p>`
              : ''
          }
        </div>`;
    })
    .filter(Boolean)
    .join('');

  return `
    <div class="ly-drawer-books" data-drawer-books>
      <p class="ly-guide-tip">传统书籍注解。生僻字先看白话，再对照左侧现代说法。</p>
      ${
        d.judgment
          ? `<div class="ly-classic-block">
        <p class="ly-classic-zh"><span class="ly-classic-tag">《易经》卦辞</span>${escapeHtml(d.judgment)}</p>
        <p class="ly-classic-bai"><span class="ly-classic-tag is-bai">白话</span>${formatClauseHtml(daBai)}</p>
      </div>`
          : '<p class="ly-guide-tip">本库暂无该卦卦辞。</p>'
      }
      ${
        corpus?.daXiang
          ? `<div class="ly-classic-block">
        <p class="ly-classic-zh"><span class="ly-classic-tag">大象</span>${escapeHtml(corpus.daXiang)}</p>
      </div>`
          : ''
      }
      ${
        d.zengshan
          ? teachFold(
              '《增删卜易》摘录',
              `<p>${escapeHtml(d.zengshan.replace(/^《增删卜易》义理摘录（教学整理）：/, ''))}</p>`,
            )
          : ''
      }
      ${lines ? `<p class="ly-layer-guide">六爻爻辞</p>${lines}` : ''}
    </div>
  `;
}

function renderStepPanel(lesson: CourseLesson, cast: CastResult, castAt: Date): string {
  const note = loadCourseNote(cast, lesson.step);
  return `
    <div class="ly-course-step" data-course-step="${lesson.step}">
      <p class="ly-course-progress">${lesson.step} / 5 · ${escapeHtml(lesson.shortName)}</p>
      <h3 class="ly-course-title">${escapeHtml(lesson.title)}</h3>
      <div class="ly-course-visual-slot" data-course-visual>${renderCourseVisual(cast, lesson.step)}</div>
      <div class="ly-course-teach">
        ${
          lesson.methodHtml
            ? lesson.methodHtml
            : lesson.basics
              ? `<p class="ly-course-basics">${escapeHtml(lesson.basics)}</p>`
              : ''
        }
      </div>
      ${lesson.toolHtml ?? ''}
      <div class="ly-course-teach">
        <p class="ly-course-vernacular">${formatClauseHtml(lesson.vernacular)}</p>
      </div>
      <button type="button" class="ly-course-bookmark" data-course-note-open aria-label="打开原文与笔记">
        📖<br />原文<br />与笔记
      </button>
      <aside class="ly-course-drawer" data-course-drawer hidden>
        <div class="ly-course-drawer-backdrop" data-course-drawer-close></div>
        <div class="ly-course-drawer-panel">
          <header class="ly-course-drawer-head">
            <h4>原文与笔记 · Step ${lesson.step}</h4>
            <button type="button" class="ly-course-drawer-x" data-course-drawer-close aria-label="关闭">×</button>
          </header>
          <div class="ly-note-mini-tabs" role="tablist" aria-label="笔记抽屉分区">
            <button type="button" class="ly-note-mini-tab is-active" data-drawer-tab="note" role="tab" aria-selected="true">本步笔记</button>
            <button type="button" class="ly-note-mini-tab" data-drawer-tab="books" role="tab" aria-selected="false">书籍注解</button>
            <button type="button" class="ly-note-mini-tab" data-drawer-tab="dress" role="tab" aria-selected="false">专业排盘</button>
          </div>
          <div class="ly-note-mini-body">
            <div class="ly-note-tab-panel is-active" data-drawer-pane="note">
              <div class="ly-course-classic">
                <p class="ly-guide-tip">${escapeHtml(lesson.classicTitle)}</p>
                <p class="ly-classic-zh">${escapeHtml(lesson.classicText).replace(/\n/g, '<br>')}</p>
                <p class="ly-classic-bai"><span class="ly-classic-tag is-bai">白话翻译</span>${formatClauseHtml(
                  lesson.classicBai,
                ).replace(/\n/g, '<br>')}</p>
              </div>
              <label class="ly-course-note-field">
                <span>你的笔记</span>
                <textarea class="question-input" rows="4" data-course-note data-step="${lesson.step}" placeholder="${escapeHtml(
                  lesson.notePrompt,
                )}">${escapeHtml(note)}</textarea>
                ${
                  lesson.noteHint
                    ? `<span class="ly-course-note-hint">${escapeHtml(lesson.noteHint)}</span>`
                    : ''
                }
              </label>
            </div>
            <div class="ly-note-tab-panel" data-drawer-pane="books" hidden>
              ${renderBooksAnnotationHtml(cast)}
            </div>
            <div class="ly-note-tab-panel" data-drawer-pane="dress" hidden>
              ${renderDressArchiveHtml(cast, castAt)}
            </div>
          </div>
        </div>
      </aside>
    </div>
  `;
}

/** 边算边学：五步交互课程壳 */
export function renderLearnCourseHtml(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): string {
  const lessons = buildCourseLessons(cast, question, castAt);
  const first = lessons[0]!;
  return `
    <section class="ly-course" data-learn-course data-course-index="0">
      <div class="ly-course-body" data-course-body>
        ${renderStepPanel(first, cast, castAt)}
      </div>
      <nav class="ly-course-nav" aria-label="课程导航">
        <button type="button" class="ly-course-nav-btn" data-course-prev disabled>← 上一步</button>
        <button type="button" class="ly-course-nav-btn ly-course-nav-note" data-course-note-open>
          📝 原文与笔记<span class="ly-course-note-dot" aria-hidden="true"></span>
        </button>
        <button type="button" class="ly-course-nav-btn ly-course-nav-next" data-course-next>下一步 →</button>
      </nav>
    </section>
  `;
}

export function bindLearnCourse(
  root: HTMLElement,
  cast: CastResult,
  question: string,
  castAt = new Date(),
  opts?: { onStepChange?: (step: CourseStep) => void },
): void {
  const course = root.querySelector<HTMLElement>('[data-learn-course]');
  if (!course) return;
  const lessons = buildCourseLessons(cast, question, castAt);
  let index = 0;

  const body = course.querySelector<HTMLElement>('[data-course-body]');
  const prevBtn = course.querySelector<HTMLButtonElement>('[data-course-prev]');
  const nextBtn = course.querySelector<HTMLButtonElement>('[data-course-next]');

  const persistCurrentNote = () => {
    const ta = course.querySelector<HTMLTextAreaElement>('[data-course-note]');
    if (!ta) return;
    const step = Number(ta.dataset.step) as CourseStep;
    saveCourseNote(cast, step, ta.value);
  };

  const openDrawer = () => {
    const drawer = course.querySelector<HTMLElement>('[data-course-drawer]');
    if (drawer) {
      drawer.hidden = false;
      drawer.dataset.seen = '1';
    }
    course.classList.add('is-drawer-open');
    course.querySelectorAll('.ly-course-bookmark').forEach((el) => {
      (el as HTMLElement).hidden = true;
    });
  };

  const refreshNotePending = () => {
    const lesson = lessons[index]!;
    const note = loadCourseNote(cast, lesson.step).trim();
    const seen = course.querySelector('[data-course-drawer]')?.getAttribute('data-seen') === '1';
    const pending = seen && note.length === 0;
    course.classList.toggle('is-note-pending', pending);
    course.querySelectorAll('[data-course-note-open]').forEach((btn) => {
      btn.classList.toggle('is-note-pending', pending);
      if (pending) {
        btn.setAttribute('title', '你有未写完的笔记，点这里继续');
      } else {
        btn.removeAttribute('title');
      }
    });
  };

  const closeDrawer = () => {
    persistCurrentNote();
    const drawer = course.querySelector<HTMLElement>('[data-course-drawer]');
    if (drawer) drawer.hidden = true;
    course.classList.remove('is-drawer-open');
    course.querySelectorAll('.ly-course-bookmark').forEach((el) => {
      (el as HTMLElement).hidden = false;
    });
    refreshNotePending();
  };

  const wireStepUi = () => {
    course.querySelector<HTMLTextAreaElement>('[data-course-note]')?.addEventListener('input', (e) => {
      const ta = e.target as HTMLTextAreaElement;
      const step = Number(ta.dataset.step) as CourseStep;
      saveCourseNote(cast, step, ta.value);
      refreshNotePending();
    });
    bindLearnStudio(course);
    refreshNotePending();
  };

  course.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-course-note-open]')) {
      openDrawer();
      return;
    }
    if (t.closest('[data-course-drawer-close]')) {
      closeDrawer();
      return;
    }
    const drawerTab = t.closest<HTMLElement>('[data-drawer-tab]');
    if (drawerTab) {
      const id = drawerTab.dataset.drawerTab!;
      course.querySelectorAll('[data-drawer-tab]').forEach((btn) => {
        const on = (btn as HTMLElement).dataset.drawerTab === id;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', String(on));
      });
      course.querySelectorAll('[data-drawer-pane]').forEach((pane) => {
        const on = (pane as HTMLElement).dataset.drawerPane === id;
        pane.classList.toggle('is-active', on);
        (pane as HTMLElement).hidden = !on;
      });
    }
  });

  const paint = () => {
    persistCurrentNote();
    const lesson = lessons[index]!;
    course.dataset.courseIndex = String(index);
    if (body) body.innerHTML = renderStepPanel(lesson, cast, castAt);
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) {
      nextBtn.textContent = index >= lessons.length - 1 ? '完成 ✓' : '下一步 →';
    }
    course.classList.remove('is-drawer-open');
    wireStepUi();
    opts?.onStepChange?.(lesson.step);
  };

  prevBtn?.addEventListener('click', () => {
    if (index <= 0) return;
    index -= 1;
    paint();
  });

  nextBtn?.addEventListener('click', () => {
    if (index >= lessons.length - 1) {
      persistCurrentNote();
      return;
    }
    index += 1;
    paint();
  });

  paint();
}

/** 收集五步笔记，写入日记 */
export function collectCourseNotes(cast: CastResult): string {
  const parts: string[] = [];
  for (let s = 1; s <= 5; s++) {
    const v = loadCourseNote(cast, s as CourseStep).trim();
    if (v) parts.push(`Step ${s}：${v}`);
  }
  return parts.join('\n');
}
