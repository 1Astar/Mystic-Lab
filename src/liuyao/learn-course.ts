import type { CastResult } from './engine.ts';
import { LINE_LABELS, upperLowerFromLines, yingLineOf, explainShiYingWhy } from './hexagrams.ts';
import { dressHexagram } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { buildReadingFacts, LINE_ROLE } from './reading-facts.ts';
import { LIUQIN_ENERGY, bindQinDict, openQinDict } from './energy-lens.ts';
import { formatClauseHtml } from './format-clause.ts';
import { renderHexagramSvg } from '../ui/liuyao/hexagram-view.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { glossLine, glossDaXiang } from './classic-gloss.ts';
import { composeScene, renderFoundationBridgeHtml } from './scene-map.ts';
import {
  buildShengKeGraph,
  buildCourseShengKeDialogue,
  renderCourseShengKeHtml,
} from './sheng-ke-graph.ts';
import { resolveClassicDossier } from './classic-folder.ts';
import { teachFold } from './flip-teach.ts';
import {
  renderDressArchiveHtml,
  bindDressArchive,
  closeDressYaoModal,
  selectDressLens,
  highlightDressYaoRow,
} from './dress-archive.ts';
import {
  renderEnergyChainHtml,
  renderMovingYaoCards,
  renderGuaXiangCard,
  bindLearnStudio,
  renderDictFooter,
} from './learn-studio.ts';
import { buildBianQuiz, renderBianQuizHtml, bindBianQuiz } from './bian-quiz.ts';
import { renderAskPanelHtml, bindAskPanel } from './ask-panel.ts';
import { showYaoInlineTip } from './yao-inline-tip.ts';
import { buildFinalLoop } from './final-loop.ts';
import {
  buildPatternSummary,
  renderPatternSummaryHtml,
} from './pattern-summary.ts';
import { renderQuestionBriefingForCast } from './question-briefing.ts';
import {
  renderClassicGuaSwitchHtml,
  bindClassicGuaSwitch,
} from './classic-gua-switch.ts';
import { renderClassicCompendiumForCast } from './classic-compendium.ts';
import { bindGuideDomainTabs } from './hex-guide.ts';
import {
  renderXiangNotesPaneHtml,
  bindXiangNotesPane,
  selectXiangSec,
} from './xiang-notes-pane.ts';
import {
  buildYongFocusPack,
  renderYongFocusHtml,
  yongFocusAsCourseYao,
} from './yong-focus.ts';
import { bindTermGloss } from './term-gloss.ts';
import { navigate } from '../router.ts';

export type CourseStep = 1 | 2 | 3 | 4 | 5 | 6;

export type NoteDrawerTab = 'xiang' | 'dress' | 'books' | 'ask' | 'journal';

/** 点哪学哪：当前 Step → 笔记侧栏默认 Tab（结论在主屏，笔记只放拓展） */
export function noteDrawerTabForStep(step: CourseStep): NoteDrawerTab {
  if (step === 1) return 'books'; // 世应：古书爻辞
  if (step === 2) return 'dress'; // 用神：装卦定位
  if (step === 3) return 'books'; // 动爻：古书原文
  if (step === 4) return 'xiang'; // 取象
  if (step === 5) return 'xiang'; // 本→变 / 生克
  return 'xiang'; // Step 6：策略与分域拓展
}

/** 本步注解对应的爻（有则标出） */
export type CourseYaoFocus = {
  index: number;
  mark: string;
  classic: string;
  bai: string;
  /** 为什么标在这一爻（如八宫定世） */
  why?: string;
  /** 结合问题的生活映射 */
  life?: string;
};

export type CourseLesson = {
  step: CourseStep;
  shortName: string;
  /** 面包屑短名：寻己 / 找转机… */
  crumbName: string;
  /** 当前步大标题：查灵魂·世应（找你和外界） */
  crumbAnno: string;
  /** 当前步小灰字：我站在哪里？… */
  crumbHint: string;
  title: string;
  /** 卡片副标题：本步一眼事实（如世在四爻） */
  lookAt: string;
  /** 纯文本方法说明；若有 methodHtml 则优先用 HTML */
  basics: string;
  vernacular: string;
  notePrompt: string;
  /** 输入框下方参考例子 */
  noteHint?: string;
  classicTitle: string;
  classicText: string;
  classicBai: string;
  /** 本步对应的爻注解（世/应/动/用神等） */
  yaoFocus?: CourseYaoFocus[];
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

function methodBlock(why: string, how: string): string {
  return `
    <div class="ly-course-method">
      <p class="ly-course-method-label">📚 这一步为什么要做</p>
      <p class="ly-course-basics">${escapeHtml(why)}</p>
      <p class="ly-course-method-label">🔍 怎么分析</p>
      <p class="ly-course-basics">${escapeHtml(how)}</p>
    </div>`;
}

function applyLead(question: string): string {
  const q = question.trim();
  return q ? `结合你问的「${q.length > 36 ? `${q.slice(0, 36)}…` : q}」` : '结合你关心的事';
}

function formatYaoFocusChip(f: CourseYaoFocus): string {
  const label = LINE_LABELS[f.index]!;
  return `<span class="ly-classic-tag ly-yao-focus-tag">${escapeHtml(label)}</span><span class="ly-yao-focus-mark">${escapeHtml(f.mark)}</span>`;
}

function renderYaoFocusBar(focus: CourseYaoFocus[] | undefined): string {
  if (!focus?.length) return '';
  const chips = focus.map(formatYaoFocusChip).join('<span class="ly-yao-focus-sep">·</span>');
  return `<p class="ly-course-yao-focus">本步注解对应：${chips}</p>`;
}

function renderYaoClassicBlocks(focus: CourseYaoFocus[] | undefined, fallbackTitle: string, fallbackText: string, fallbackBai: string): string {
  if (focus?.length) {
    const blocks = focus
      .map((f) => {
        const label = LINE_LABELS[f.index]!;
        const classic = f.classic || '（本库暂无该爻原文）';
        const bai = f.bai || '对照现代：这一爻在你问题里对应哪一层？';
        return `
          <div class="ly-classic-block" data-course-yao-block="${f.index}">
            <p class="ly-classic-zh"><span class="ly-classic-tag">${escapeHtml(label)}</span><span class="ly-yao-focus-mark">${escapeHtml(f.mark)}</span>${escapeHtml(classic)}</p>
            ${
              f.why
                ? `<p class="ly-course-yao-why"><span class="ly-classic-tag">为何是它</span>${escapeHtml(f.why)}</p>`
                : ''
            }
            ${
              f.life
                ? `<p class="ly-course-yao-life"><span class="ly-classic-tag is-bai">结合问题</span>${formatClauseHtml(f.life)}</p>`
                : ''
            }
            <p class="ly-classic-bai"><span class="ly-classic-tag is-bai">白话翻译</span>${formatClauseHtml(bai)}</p>
          </div>`;
      })
      .join('');
    return `<p class="ly-guide-tip">${escapeHtml(fallbackTitle)}</p>${blocks}`;
  }
  return `
    <p class="ly-guide-tip">${escapeHtml(fallbackTitle)}</p>
    <p class="ly-classic-zh">${escapeHtml(fallbackText).replace(/\n/g, '<br>')}</p>
    <p class="ly-classic-bai"><span class="ly-classic-tag is-bai">白话翻译</span>${formatClauseHtml(
      fallbackBai,
    ).replace(/\n/g, '<br>')}</p>`;
}

function makeYaoFocus(
  index: number,
  mark: string,
  corpus: ReturnType<typeof getClassicCorpus>,
  guaName: string,
): CourseYaoFocus {
  return {
    index,
    mark,
    classic: corpus?.lineClassics[index] ?? '',
    bai: glossLine(guaName, index) ?? '',
  };
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
  const loop = buildFinalLoop(cast, question, castAt);
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

  const skGraph = buildShengKeGraph(rows, question);
  const skTalk = buildCourseShengKeDialogue(skGraph, question);

  const shiPosHint =
    cast.shiLine <= 2 ? '根基与开端' : cast.shiLine <= 4 ? '过程与门户' : '收尾或高位';
  const yingPosHint =
    cast.yingLine <= 2 ? '根基与开端' : cast.yingLine <= 4 ? '过程与门户' : '收尾或高位';

  const { shiWhy, yingWhy } = explainShiYingWhy(
    cast.primary.name,
    cast.shiLine,
    cast.yingLine,
  );
  const shiLife = `你现在处于「${shiE?.modern ?? '当下状态'}」的状态${
    shi ? `（传统属${shi.liuqin}）` : ''
  }，位置偏${shiPosHint}。世应${facts.shiYingRel.rel}，意味着${facts.shiYingRel.verdict}。`;
  const yingLife = `外面环境是「${yingE?.modern ?? '外部环境'}」${
    ying ? `（传统属${ying.liuqin}）` : ''
  }，位置偏${yingPosHint}。${facts.shiYingRel.tip}`;

  const step1Focus = [
    {
      ...makeYaoFocus(cast.shiLine - 1, '世·你', corpus, cast.primary.name),
      why: shiWhy,
      life: shiLife,
    },
    {
      ...makeYaoFocus(cast.yingLine - 1, '应·外界', corpus, cast.primary.name),
      why: yingWhy,
      life: yingLife,
    },
  ];
  // 同爻既是世又是应时去重
  const step1Unique = step1Focus.filter(
    (f, i, arr) => arr.findIndex((x) => x.index === f.index) === i,
  );

  const yongPack = buildYongFocusPack(cast, question, castAt);
  const stepYongFocus = yongFocusAsCourseYao(yongPack, cast);

  const stepMoveFocus =
    cast.changingIndexes.length > 0
      ? cast.changingIndexes.map((i) => makeYaoFocus(i, '动爻', corpus, cast.primary.name))
      : undefined;

  const step4Focus = stepMoveFocus;

  const step1Bai = [
    `世在${shiLabel}：对应你当前所处的自我状态——「${shiE?.modern ?? '当下状态'}」，位置偏${shiPosHint}。`,
    `应在${yingLabel}：代表外部环境或你面临的事情——「${yingE?.modern ?? '外部环境'}」，位置偏${yingPosHint}。`,
  ].join('\n');

  const moveCount = cast.changingIndexes.length;
  const bianQuiz = buildBianQuiz(facts);
  const energyFold = teachFold(
    '进阶 · 谁在帮你、谁在拖你（用/元/忌）',
    renderEnergyChainHtml(cast, question, castAt),
  );

  return [
    {
      step: 1,
      shortName: '世应',
      crumbName: '寻己',
      crumbAnno: '查灵魂·世应（找你和外界）',
      crumbHint: '我站在哪里？我是谁？我和外部关系怎样？',
      title: '查灵魂 · 世应',
      lookAt: `世（我）在${shiLabel} · 应（外界）在${yingLabel}`,
      basics: '',
      methodHtml: methodBlock(
        '断卦先认「谁是我、谁是外界」。世爻代表你，应爻代表对方/岗位/环境。找不准这两点，后面的动爻、用神都会漂。',
        '在卦图上找金色圈（世）与红色圈（应）；看它们落在第几爻、六亲是什么，再判断世应相生还是相克。',
      ),
      vernacular: `${applyLead(question)}：${loop.steps[0]!.body} 你现在偏「${shiE?.modern ?? '当下状态'}」，外面偏「${yingE?.modern ?? '外部环境'}」——世应${facts.shiYingRel.rel}，${facts.shiYingRel.verdict}。${facts.shiYingRel.tip}`,
      notePrompt: '我感觉我现在确实是 / 不是这个状态…',
      noteHint:
        '例如：我确实感觉现在的处境让我很内耗；或者我并没有在打破常规，而是在硬撑。',
      classicTitle: `Step 1 · 点爻看注解（${shiLabel} / ${yingLabel}）`,
      classicText: [
        shiClassic ? `世·${shiLabel}：${shiClassic}` : '',
        yingClassic ? `应·${yingLabel}：${yingClassic}` : '',
      ]
        .filter(Boolean)
        .join('\n') || '本库暂无该卦世应爻辞。',
      classicBai: step1Bai,
      yaoFocus: step1Unique,
    },
    {
      step: 2,
      shortName: '用神',
      crumbName: '锁用神',
      crumbAnno: '锁定用神·本题核心爻',
      crumbHint: '你问的事，在卦里用哪一爻代表？',
      title: '锁定用神 · 本题核心点',
      lookAt: yongPack.primaryRow
        ? `用神「${yongPack.yongModern}」在${yongPack.primaryRow.label}`
        : `用神倾向「${yongPack.yongModern}」`,
      basics: '',
      methodHtml: methodBlock(
        '用神不是封建身份标签，而是「本题注意力该放在哪个能量系统」：求职看目标/考核，文书看信息网，薪资看物质根基。',
        '按所问取六亲 → 在装卦表里落到具体爻 → 只高亮这一两爻，看六神与是否发动，再翻译成你的问题。',
      ),
      vernacular: `${applyLead(question)}：${yongPack.intro} ${yongPack.translateText}`,
      notePrompt: '我觉得真正该盯的，是这一爻，因为…',
      noteHint: '例如：原来我一直在看公开招聘，但卦提醒我机会在暗线。',
      classicTitle: yongPack.primaryRow
        ? `Step 2 · 用神爻注解（${yongPack.primaryRow.label}）`
        : 'Step 2 · 用神待定',
      classicText: stepYongFocus[0]?.classic || '本库暂无该爻原文。',
      classicBai: stepYongFocus[0]?.bai || yongPack.translateText,
      yaoFocus: stepYongFocus,
      toolHtml: renderYongFocusHtml(yongPack),
    },
    {
      step: 3,
      shortName: '动爻',
      crumbName: '找转机',
      crumbAnno: '找转机·动爻',
      crumbHint: '哪里在动？哪个位置在变？变化发生在哪里？',
      title: '抓重点 · 动爻',
      lookAt: moveLabels ? `${moveCount} 个动爻：${moveLabels}` : '无动爻',
      basics: '',
      methodHtml: methodBlock(
        '卦不是静止照片。变红、闪烁的线叫动爻，代表这件事里「正在发生变化」的部分——转机往往就在这里。',
        '数清有几根动爻、落在哪一爻、六亲是什么；再看它们是否推着本卦走向变卦。无动则先稳住结构，不必硬找变。',
      ),
      vernacular: moveLabels
        ? `${applyLead(question)}：${loop.steps[1]!.body} 转机偏「${moveRoles}」这一层——因为这一层在变，整体局势才会跟着松动。`
        : `${applyLead(question)}：${loop.steps[1]!.body}`,
      notePrompt: '我觉得真正在变的，可能是…',
      classicTitle: moveLabels
        ? `Step 3 · 动爻注解（${moveLabels}）`
        : 'Step 3 · 无动爻 · 对照卦辞',
      classicText: moveClassic || '本库暂无动爻原文。',
      classicBai: moveBai || '对照现代：变化层在「沟通 / 节奏 / 资源」中的哪一层。',
      yaoFocus: stepMoveFocus,
      toolHtml: renderMovingYaoCards(cast, facts.domain),
    },
    {
      step: 4,
      shortName: '取象',
      crumbName: '看根基',
      crumbAnno: '看根基·结构 + 实际合一',
      crumbHint: '上下卦叠成什么场？落到你问的事，先抓哪一问？',
      title: '看根基 · 取象翻译',
      lookAt: `上${upper.nature}（环境）· 下${lower.nature}（自己）`,
      basics: '',
      methodHtml: methodBlock(
        '六爻分成两半：上卦像大环境，下卦像你自己这边。两者叠合，才是本卦的「场」——先懂场，再谈对策。',
        '认出上卦、下卦的八卦象与五行，用一句生活场景把它们合起来；再对照分域里的工作 / 感情，问自己此刻最卡在哪一问。',
      ),
      vernacular: `${applyLead(question)}：${loop.steps[2]!.body}`,
      notePrompt: '上下卦合在一起，让我想到…',
      classicTitle: 'Step 4 · 卦辞与大象（整卦，非单爻）',
      classicText: [
        corpus?.judgment ? `卦辞：${corpus.judgment}` : '',
        corpus?.daXiang ? `大象：${corpus.daXiang}` : '',
      ]
        .filter(Boolean)
        .join('\n') || '本库暂无卦辞。',
      classicBai: glossDaXiang(cast.primary.name) ?? corpus?.modern ?? scene.meaning,
      toolHtml: `
        ${renderGuaXiangCard(cast)}
        ${renderFoundationBridgeHtml(scene, facts.domain)}
      `,
    },
    {
      step: 5,
      shortName: '本→变',
      crumbName: '看演变',
      crumbAnno: '看过程·本→变（本卦变变卦）',
      crumbHint: '从本卦走向变卦，方向怎么改？',
      title: '看过程 · 本 → 变',
      lookAt: cast.changed
        ? `${cast.primary.name} → ${cast.changed.name}`
        : `${cast.primary.name}（无变）`,
      basics: '',
      methodHtml: methodBlock(
        '本卦是当下底色，动爻是推手，变卦是可能滑向的下一幕。分清「现在」和「走向」，才不会把方向感当成死刑判决。',
        '对照本卦全名与关键词 → 看动爻如何推动 → 读变卦关键词与生克谁在帮谁拖。无动则停在本卦，先把结构看清。',
      ),
      vernacular: cast.changed
        ? `${applyLead(question)}：${loop.steps[3]!.body} 事情从「${cast.primary.keywords[0]}」滑向「${cast.changed.keywords[0]}」。${skTalk.dialogue}`
        : `${applyLead(question)}：${loop.steps[3]!.body}`,
      notePrompt: '我觉得事情接下来更像…',
      classicTitle: cast.changed
        ? `Step 5 · 本「${cast.primary.name}」→ 变「${cast.changed.name}」`
        : 'Step 5 · 无变 · 对照本卦',
      classicText: cast.changed
        ? `本卦：${corpus?.judgment ?? cast.primary.gist}\n变卦关键词：${cast.changed.keywords.join('、')}`
        : corpus?.judgment ?? cast.primary.gist,
      classicBai: cast.changed
        ? `从「${cast.primary.keywords[0]}」到「${cast.changed.keywords[0]}」——变卦是方向感。`
        : glossDaXiang(cast.primary.name) ?? '',
      yaoFocus: step4Focus,
      toolHtml: `
        ${renderCourseShengKeHtml(skGraph, { question })}
        <p class="ly-guide-tip">${escapeHtml(skTalk.tease)}</p>
        ${energyFold}
        ${
          bianQuiz
            ? renderBianQuizHtml(bianQuiz)
            : '<p class="ly-guide-tip">无变卦：先把本卦与世应看清，再谈下一幕。</p>'
        }
      `,
    },
    {
      step: 6,
      shortName: '策略',
      crumbName: '入生活',
      crumbAnno: '入生活·策略（行动建议）',
      crumbHint: '这一卦落到现实里，我接下来怎么做？',
      title: '连生活 · 策略',
      lookAt: question.trim() || '对照你真正在意的事',
      basics: '',
      methodHtml: methodBlock(
        '前面五步是「为什么」；这一步把结论收成可执行的一小步，避免停在概念里。',
        '回看世应与用神 → 确认变卦方向 → 写清本周可验证的动作与底线（现金流、文书、边界）。',
      ),
      vernacular: `${applyLead(question)}：${loop.conclusion} 建议：${loop.action}`,
      notePrompt: '我这周打算验证的一小步是…',
      classicTitle: 'Step 6 · 教学摘录（整卦总览）',
      classicText:
        corpus?.zengshan?.replace(/^《增删卜易》义理摘录（教学整理）：/, '') ||
        '先看用神与世应，再看动变——勿以一词断吉凶。',
      classicBai: `一句话：${loop.oneLiner}`,
      toolHtml: `
        ${renderQuestionBriefingForCast(cast, question, castAt)}
        ${renderPatternSummaryHtml(buildPatternSummary(cast, question, castAt))}
      `,
    },
  ];
}

function renderCourseVisual(
  cast: CastResult,
  step: CourseStep,
  question = '',
  castAt = new Date(),
): string {
  const shi = cast.shiLine;
  const ying = cast.yingLine;
  const changing = cast.changingIndexes;
  const changedShi = cast.changed?.shiLine;
  const changedYing = changedShi ? yingLineOf(changedShi) : undefined;

  if (step === 1) {
    return `
      <div class="ly-course-visual ly-hex-inline-host" data-ask-hex>
        ${renderHexagramSvg({
          lines: cast.primaryLines,
          shiLine: shi,
          yingLine: ying,
          changingIndexes: [],
          emphasizeShiYing: true,
          dimOthers: true,
          focusIndexes: [shi - 1, ying - 1],
          showTrigramLabels: false,
          showAskButtons: true,
        })}
        <p class="ly-course-visual-hint">点爻：旁注装卦与含义（世/应会先亮）</p>
      </div>`;
  }

  if (step === 2) {
    const yong = buildYongFocusPack(cast, question, castAt);
    return `
      <div class="ly-course-visual ly-hex-inline-host" data-ask-hex data-yong-visual>
        ${renderHexagramSvg({
          lines: cast.primaryLines,
          shiLine: shi,
          yingLine: ying,
          changingIndexes: cast.changingIndexes,
          highlightIndexes: yong.focusIndexes,
          dimOthers: yong.focusIndexes.length > 0,
          focusIndexes: yong.focusIndexes,
          emphasizeShiYing: false,
          showAskButtons: true,
          askIndexes: yong.focusIndexes.length ? yong.focusIndexes : undefined,
        })}
        <p class="ly-course-visual-hint">金色光圈 = 本题用神；其余爻先压暗</p>
      </div>`;
  }

  if (step === 3) {
    return `
      <div class="ly-course-visual ly-hex-inline-host" data-ask-hex>
        ${renderHexagramSvg({
          lines: cast.primaryLines,
          shiLine: shi,
          yingLine: ying,
          changingIndexes: changing,
          pulseChanging: changing.length > 0,
          dimOthers: changing.length > 0,
          focusIndexes: changing,
          emphasizeShiYing: false,
          showAskButtons: true,
          askIndexes: changing.length ? changing : undefined,
        })}
        <p class="ly-course-visual-hint">${
          changing.length ? '点动爻看旁注' : '无动爻：点爻看旁注'
        }</p>
      </div>`;
  }

  if (step === 4) {
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

  if (step === 5) {
    return `
      <div class="ly-course-visual ly-course-visual-pair" aria-label="本卦到变卦">
        <div class="ly-course-pair-col">
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
        <div class="ly-course-pair-col">
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

/** 古籍原文：本/变卦辞切换 + 传统断语（分域解析改在卦象解析） */
function renderBooksAnnotationHtml(cast: CastResult, question: string): string {
  const d = resolveClassicDossier(cast.primary.name);

  return `
    <div class="ly-drawer-books" data-drawer-books>
      <p class="ly-guide-tip">古人怎么说：用上方切换本卦辞 / 变卦辞。生僻字先看白话；工作感情等分域见「卦象解析」。</p>
      ${renderClassicGuaSwitchHtml(cast)}
      ${renderClassicCompendiumForCast(cast, question)}
      ${
        d.zengshan
          ? teachFold(
              '《增删卜易》摘录',
              `<p>${escapeHtml(d.zengshan.replace(/^《增删卜易》义理摘录（教学整理）：/, ''))}</p>`,
            )
          : ''
      }
    </div>
  `;
}

function renderCourseTrailHtml(lessons: CourseLesson[], activeIndex: number): string {
  const active = lessons[activeIndex] ?? lessons[0]!;
  const items = lessons
    .map((lesson, i) => {
      const state = i < activeIndex ? 'is-done' : i === activeIndex ? 'is-now' : 'is-todo';
      const sep =
        i < lessons.length - 1
          ? `<li class="ly-course-crumb-sep" aria-hidden="true">→</li>`
          : '';
      return `
        <li class="ly-course-crumb ${state}" data-course-jump="${i}">
          <button type="button" class="ly-course-crumb-btn" aria-current="${
            i === activeIndex ? 'step' : 'false'
          }" title="${escapeHtml(lesson.crumbAnno)} · ${escapeHtml(lesson.lookAt)}">
            <span class="ly-course-crumb-n">${lesson.step}</span>
            <span class="ly-course-crumb-name">${escapeHtml(lesson.crumbName)}</span>
          </button>
        </li>
        ${sep}`;
    })
    .join('');

  return `
    <nav class="ly-course-trail" data-course-trail aria-label="六步学习链路">
      <ol class="ly-course-trail-list">${items}</ol>
      <div class="ly-course-trail-tip" data-course-trail-tip>
        <p class="ly-course-trail-anno" data-course-trail-anno>${escapeHtml(active.crumbAnno)}</p>
        <p class="ly-course-trail-hint" data-course-trail-hint>${escapeHtml(active.crumbHint)}</p>
      </div>
    </nav>
  `;
}

function syncCourseTrail(
  course: HTMLElement,
  activeIndex: number,
  lessons?: CourseLesson[],
): void {
  course.querySelectorAll<HTMLElement>('[data-course-jump]').forEach((el) => {
    const i = Number(el.dataset.courseJump);
    el.classList.remove('is-done', 'is-now', 'is-todo');
    if (i < activeIndex) el.classList.add('is-done');
    else if (i === activeIndex) el.classList.add('is-now');
    else el.classList.add('is-todo');
    const btn = el.querySelector('.ly-course-crumb-btn');
    btn?.setAttribute('aria-current', i === activeIndex ? 'step' : 'false');
  });
  const lesson = lessons?.[activeIndex];
  if (!lesson) return;
  const anno = course.querySelector('[data-course-trail-anno]');
  const hint = course.querySelector('[data-course-trail-hint]');
  if (anno) anno.textContent = lesson.crumbAnno;
  if (hint) hint.textContent = lesson.crumbHint;
}

function studyNoteStorageKey(cast: CastResult, field: string): string {
  return `mystic-ly-study-note:${cast.primary.name}:${cast.changingIndexes.join(',')}:${field}`;
}

function loadStudyNote(cast: CastResult, field: string): string {
  return storageGet(studyNoteStorageKey(cast, field));
}

function saveStudyNote(cast: CastResult, field: string, text: string): void {
  storageSet(studyNoteStorageKey(cast, field), text);
}

/** 为什么：卦象解析（意象 / 分域；能量与六神在专业排盘） */
function renderDrawerXiangPaneHtml(
  cast: CastResult,
  question: string,
  castAt: Date,
): string {
  return renderXiangNotesPaneHtml(cast, question, castAt);
}

function renderDrawerNotePaneHtml(lesson: CourseLesson | null, cast: CastResult): string {
  const feel = loadStudyNote(cast, 'feel');
  const touch = loadStudyNote(cast, 'touch');
  const reflect = loadStudyNote(cast, 'reflect');
  const stepBlock = lesson
    ? `
      ${renderYaoFocusBar(lesson.yaoFocus)}
      <div class="ly-course-classic">
        ${renderYaoClassicBlocks(
          lesson.yaoFocus,
          lesson.classicTitle,
          lesson.classicText,
          lesson.classicBai,
        )}
      </div>
      <label class="ly-course-note-field">
        <span>本步笔记 · Step ${lesson.step}</span>
        <textarea class="question-input" rows="3" data-course-note data-step="${lesson.step}" placeholder="${escapeHtml(
          lesson.notePrompt,
        )}">${escapeHtml(loadCourseNote(cast, lesson.step))}</textarea>
        ${
          lesson.noteHint
            ? `<span class="ly-course-note-hint">${escapeHtml(lesson.noteHint)}</span>`
            : ''
        }
      </label>`
    : `<p class="ly-guide-tip">切到「六步学习」后，这里会带上当前步骤的原文与本步笔记。</p>`;

  return `
    <div data-drawer-note-inner>
      ${stepBlock}
      <p class="ly-layer-guide">个人沉淀 · 整卦日记（写下来，才变成你的六爻记录）</p>
      <label class="ly-course-note-field">
        <span>我的直觉感受</span>
        <textarea class="question-input" rows="2" data-study-note="feel" placeholder="第一眼的感觉…">${escapeHtml(feel)}</textarea>
      </label>
      <label class="ly-course-note-field">
        <span>最触动我的一句话</span>
        <textarea class="question-input" rows="2" data-study-note="touch" placeholder="哪一句戳到你…">${escapeHtml(touch)}</textarea>
      </label>
      <label class="ly-course-note-field">
        <span>疑惑 / 几天后回看</span>
        <textarea class="question-input" rows="2" data-study-note="reflect" placeholder="预留回看空位…">${escapeHtml(reflect)}</textarea>
      </label>
      ${renderDictFooter()}
    </div>
  `;
}

/** 结果页共用侧栏：结果→为什么→怎么算→古人→个人沉淀 */
export function renderLearnNotesShellHtml(
  cast: CastResult,
  question: string,
  castAt = new Date(),
  lesson?: CourseLesson | null,
): string {
  const stepLesson = lesson ?? buildCourseLessons(cast, question, castAt)[0] ?? null;
  const title = stepLesson
    ? `解读笔记 · Step ${stepLesson.step}`
    : '解读笔记';
  return `
    <div class="ly-learn-notes" data-learn-notes>
      <button type="button" class="ly-course-bookmark" data-course-note-open aria-label="打开解读笔记">
        📖<br />解读<br />笔记
      </button>
      <aside class="ly-course-drawer" data-course-drawer hidden>
        <div class="ly-course-drawer-backdrop" data-course-drawer-close></div>
        <div class="ly-course-drawer-panel">
          <header class="ly-course-drawer-head">
            <h4 data-drawer-title>${escapeHtml(title)}</h4>
            <button type="button" class="ly-course-drawer-x" data-course-drawer-close aria-label="关闭">×</button>
          </header>
          <div class="ly-note-mini-tabs" role="tablist" aria-label="解读笔记分区">
            <button type="button" class="ly-note-mini-tab is-active" data-drawer-tab="xiang" role="tab" aria-selected="true">卦象解析</button>
            <button type="button" class="ly-note-mini-tab" data-drawer-tab="dress" role="tab" aria-selected="false">专业排盘</button>
            <button type="button" class="ly-note-mini-tab" data-drawer-tab="books" role="tab" aria-selected="false">古籍解析</button>
            <button type="button" class="ly-note-mini-tab" data-drawer-tab="ask" role="tab" aria-selected="false">边看边问</button>
            <button type="button" class="ly-note-mini-tab" data-drawer-tab="journal" role="tab" aria-selected="false">个人沉淀</button>
          </div>
          <div class="ly-note-mini-body">
            <div class="ly-note-tab-panel is-active" data-drawer-pane="xiang">
              ${renderDrawerXiangPaneHtml(cast, question, castAt)}
            </div>
            <div class="ly-note-tab-panel" data-drawer-pane="dress" hidden>
              <p class="ly-guide-tip">怎么算：六亲六神装卦与点爻注解。</p>
              ${renderDressArchiveHtml(cast, castAt, question)}
            </div>
            <div class="ly-note-tab-panel" data-drawer-pane="books" hidden>
              ${renderBooksAnnotationHtml(cast, question)}
            </div>
            <div class="ly-note-tab-panel" data-drawer-pane="ask" hidden>
              ${renderAskPanelHtml(cast, question, castAt)}
            </div>
            <div class="ly-note-tab-panel" data-drawer-pane="journal" hidden>
              ${renderDrawerNotePaneHtml(stepLesson, cast)}
            </div>
          </div>
        </div>
      </aside>
    </div>
  `;
}

function renderStepPanel(
  lesson: CourseLesson,
  cast: CastResult,
  castAt: Date,
  question: string,
): string {
  return `
    <div class="ly-course-step" data-course-step="${lesson.step}">
      <h3 class="ly-course-title">${escapeHtml(lesson.title)}</h3>
      <p class="ly-course-lookat">${escapeHtml(lesson.lookAt)}</p>
      ${renderYaoFocusBar(lesson.yaoFocus)}
      <div class="ly-course-visual-slot" data-course-visual>${renderCourseVisual(
        cast,
        lesson.step,
        question,
        castAt,
      )}</div>
      ${
        lesson.methodHtml || lesson.basics
          ? `<div class="ly-course-teach">
        ${
          lesson.methodHtml
            ? lesson.methodHtml
            : `<p class="ly-course-basics">${escapeHtml(lesson.basics)}</p>`
        }
      </div>`
          : ''
      }
      ${
        lesson.vernacular
          ? `<div class="ly-course-apply">
        <p class="ly-course-apply-label">🎯 结合你的问题</p>
        <p class="ly-course-vernacular">${formatClauseHtml(lesson.vernacular)}</p>
      </div>`
          : ''
      }
      ${lesson.toolHtml ?? ''}
    </div>
  `;
}

/** 边算边学：六步交互课程壳 */
export function renderLearnCourseHtml(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): string {
  const lessons = buildCourseLessons(cast, question, castAt);
  const first = lessons[0]!;
  return `
    <section class="ly-course" data-learn-course data-course-index="0">
      ${renderCourseTrailHtml(lessons, 0)}
      <div class="ly-course-body" data-course-body>
        ${renderStepPanel(first, cast, castAt, question)}
      </div>
      <nav class="ly-course-nav" aria-label="课程导航">
        <button type="button" class="ly-course-nav-btn" data-course-prev disabled>← 上一步</button>
        <button type="button" class="ly-course-nav-btn ly-course-nav-note" data-course-note-open>
          📝 解读笔记<span class="ly-course-note-dot" aria-hidden="true"></span>
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
  const notes = root.querySelector<HTMLElement>('[data-learn-notes]') ?? course;
  const lessons = buildCourseLessons(cast, question, castAt);
  let index = 0;

  const body = course.querySelector<HTMLElement>('[data-course-body]');
  const prevBtn = course.querySelector<HTMLButtonElement>('[data-course-prev]');
  const nextBtn = course.querySelector<HTMLButtonElement>('[data-course-next]');

  const persistCurrentNote = () => {
    const ta = notes.querySelector<HTMLTextAreaElement>('[data-course-note]');
    if (!ta) return;
    const step = Number(ta.dataset.step) as CourseStep;
    saveCourseNote(cast, step, ta.value);
  };

  const persistStudyNotes = () => {
    notes.querySelectorAll<HTMLTextAreaElement>('[data-study-note]').forEach((ta) => {
      const field = ta.dataset.studyNote;
      if (field) saveStudyNote(cast, field, ta.value);
    });
  };

  const syncDrawerForStep = (lesson: CourseLesson) => {
    persistStudyNotes();
    const title = notes.querySelector('[data-drawer-title]');
    if (title) title.textContent = `解读笔记 · Step ${lesson.step}`;
    const pane = notes.querySelector<HTMLElement>('[data-drawer-pane="journal"]');
    if (pane) pane.innerHTML = renderDrawerNotePaneHtml(lesson, cast);
    notes.querySelector<HTMLTextAreaElement>('[data-course-note]')?.addEventListener('input', (e) => {
      const ta = e.target as HTMLTextAreaElement;
      const step = Number(ta.dataset.step) as CourseStep;
      saveCourseNote(cast, step, ta.value);
      refreshNotePending();
    });
    notes.querySelectorAll<HTMLTextAreaElement>('[data-study-note]').forEach((ta) => {
      ta.addEventListener('input', () => {
        const field = ta.dataset.studyNote;
        if (field) saveStudyNote(cast, field, ta.value);
      });
    });
    bindQinDict(notes);
    bindClassicGuaSwitch(notes);
    bindGuideDomainTabs(notes);
    bindXiangNotesPane(notes);
    bindAskPanel(notes, cast, question, castAt);
    bindTermGloss(notes);
    refreshNotePending();
  };

  type DrawerTab = NoteDrawerTab;

  const drawerTabForStep = noteDrawerTabForStep;

  const focusLinesForStep = (step: CourseStep): number[] => {
    if (step === 1) return [cast.shiLine - 1, cast.yingLine - 1];
    if (step === 2) return buildYongFocusPack(cast, question, castAt).focusIndexes;
    if (step === 3) return [...cast.changingIndexes];
    return [];
  };

  const selectDrawerTab = (tab: DrawerTab) => {
    notes.querySelectorAll('[data-drawer-tab]').forEach((btn) => {
      const on = (btn as HTMLElement).dataset.drawerTab === tab;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', String(on));
    });
    notes.querySelectorAll('[data-drawer-pane]').forEach((pane) => {
      const on = (pane as HTMLElement).dataset.drawerPane === tab;
      pane.classList.toggle('is-active', on);
      (pane as HTMLElement).hidden = !on;
    });
  };

  const highlightBookLines = (indexes: number[]) => {
    notes.querySelectorAll('[data-book-line]').forEach((el) => {
      const i = Number((el as HTMLElement).dataset.bookLine);
      const on = indexes.includes(i);
      el.classList.toggle('is-book-focus', on);
    });
    const first = indexes
      .map((i) => notes.querySelector<HTMLElement>(`[data-book-line="${i}"]`))
      .find(Boolean);
    first?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const rows = dressHexagram(cast, siZhuFromDate(castAt).dayStem).rows;
  const domain = buildReadingFacts(cast, question, castAt).domain;

  const openDrawer = (opts?: {
    focusYaoIndex?: number;
    tab?: DrawerTab;
    showDressCard?: boolean;
    /** 不传则按当前 Step 联动 */
    step?: CourseStep;
  }) => {
    const drawer = notes.querySelector<HTMLElement>('[data-course-drawer]');
    if (drawer) {
      drawer.hidden = false;
      drawer.dataset.seen = '1';
    }
    notes.classList.add('is-drawer-open');
    course.classList.add('is-drawer-open');

    const step = opts?.step ?? lessons[index]!.step;
    const tab = opts?.tab ?? drawerTabForStep(step);
    selectDrawerTab(tab);

    notes.querySelectorAll('[data-course-yao-block]').forEach((block) => {
      const on =
        opts?.focusYaoIndex !== undefined &&
        tab === 'journal' &&
        Number((block as HTMLElement).dataset.courseYaoBlock) === opts.focusYaoIndex;
      block.classList.toggle('is-yao-active', on);
    });

    if (opts?.focusYaoIndex !== undefined && tab === 'journal') {
      const target = notes.querySelector<HTMLElement>(
        `[data-course-yao-block="${opts.focusYaoIndex}"]`,
      );
      target?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    if (tab === 'books') {
      const focus =
        opts?.focusYaoIndex !== undefined
          ? [opts.focusYaoIndex]
          : focusLinesForStep(step);
      highlightBookLines(focus);
    } else {
      notes.querySelectorAll('[data-book-line]').forEach((el) => {
        el.classList.remove('is-book-focus');
      });
    }

    if (opts?.showDressCard && opts.focusYaoIndex !== undefined) {
      // 笔记侧栏内高亮装卦行即可，不弹居中爻卡（否则 body 锁滚 + 全屏罩会挡住主界面滑动）
      highlightDressYaoRow(notes, opts.focusYaoIndex);
      const row = rows.find((r) => r.index === opts.focusYaoIndex);
      if (row) openQinDict(notes, row.liuqin);
    }
  };

  bindQinDict(root);
  root.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLElement>('[data-open-qin-dict]');
    if (!chip || !root.contains(chip) || chip.hasAttribute('data-qin-dict')) return;
    if (!chip.dataset.openQinDict) return;
    // 点爻旁 / 实盘卡芯片 → 拉开专业排盘，词典由 bindQinDict 同步打开
    openDrawer({ tab: 'dress' });
  });

  const refreshNotePending = () => {
    const lesson = lessons[index]!;
    const note = loadCourseNote(cast, lesson.step).trim();
    const seen = notes.querySelector('[data-course-drawer]')?.getAttribute('data-seen') === '1';
    const pending = seen && note.length === 0;
    notes.classList.toggle('is-note-pending', pending);
    course.classList.toggle('is-note-pending', pending);
    root.querySelectorAll('[data-course-note-open]').forEach((btn) => {
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
    persistStudyNotes();
    closeDressYaoModal(notes);
    const drawer = notes.querySelector<HTMLElement>('[data-course-drawer]');
    if (drawer) drawer.hidden = true;
    notes.classList.remove('is-drawer-open');
    course.classList.remove('is-drawer-open');
    refreshNotePending();
  };

  const openFromPatternChip = (patternChip: HTMLElement) => {
    const open = patternChip.dataset.patternOpen === 'xiang' ? 'xiang' : 'dress';
    const yaoRaw = patternChip.dataset.patternYao;
    const yaoIndex =
      yaoRaw !== undefined && yaoRaw !== '' ? Number(yaoRaw) : Number.NaN;
    if (open === 'dress' && Number.isFinite(yaoIndex)) {
      openDrawer({ tab: 'dress', focusYaoIndex: yaoIndex, showDressCard: true });
    } else {
      openDrawer({ tab: open });
    }
    if (open === 'xiang') {
      const host = notes.querySelector<HTMLElement>('[data-xiang-notes]');
      if (host) {
        const kind = patternChip.dataset.patternKind;
        selectXiangSec(host, kind === 'struct' ? 'domain' : 'guide');
      }
    }
  };

  const wireStepUi = () => {
    bindLearnStudio(course);
    bindBianQuiz(course);
    const archive = notes.querySelector<HTMLElement>('[data-dress-archive]');
    if (archive) archive.dataset.bound = '';
    bindDressArchive(notes, cast, question, castAt);
    course.querySelectorAll<SVGGElement>('.ly-sk-node').forEach((g) => {
      g.style.cursor = 'pointer';
    });
  };

  course.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const patternChip = t.closest<HTMLElement>('[data-pattern-chip]');
    if (patternChip && course.contains(patternChip)) {
      e.preventDefault();
      e.stopPropagation();
      openFromPatternChip(patternChip);
      return;
    }
    const sk = t.closest<SVGGElement>('.ly-sk-node');
    if (sk && course.contains(sk)) {
      e.stopPropagation();
      const idx = Number(sk.getAttribute('data-sk-line'));
      if (Number.isFinite(idx)) {
        openDrawer({ focusYaoIndex: idx, tab: 'dress', showDressCard: true });
      }
      return;
    }
    const ask = t.closest<SVGElement>('[data-ask-line]');
    if (ask && course.contains(ask)) {
      e.stopPropagation();
      const idx = Number(ask.getAttribute('data-ask-line'));
      const row = rows.find((r) => r.index === idx);
      const host =
        ask.closest<HTMLElement>('[data-ask-hex]') ??
        ask.closest<HTMLElement>('.ly-hex-inline-host');
      if (row && host) {
        showYaoInlineTip(host, row, { domain });
      }
      // 爻旁注解已含六神/六亲/能量，不再同步开笔记抽屉
      return;
    }
    const hexHost = t.closest<HTMLElement>('[data-ask-hex], .ly-hex-inline-host');
    if (hexHost && course.contains(hexHost)) {
      e.stopPropagation();
      openDrawer({ tab: 'dress' });
      return;
    }
    if (t.closest('[data-course-note-open]')) {
      openDrawer();
      return;
    }
  });

  // 结果页顶部「格局摘要」也在 root 内，统一跳转专业排盘 / 卦象解析
  root.addEventListener('click', (e) => {
    const patternChip = (e.target as HTMLElement).closest<HTMLElement>('[data-pattern-chip]');
    if (!patternChip || !root.contains(patternChip)) return;
    if (course.contains(patternChip) || notes.contains(patternChip)) return; // 已由 course/notes 处理
    e.preventDefault();
    openFromPatternChip(patternChip);
  });

  notes.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const pathLink = t.closest<HTMLElement>('[data-path]');
    if (pathLink && notes.contains(pathLink) && pathLink.dataset.path) {
      e.preventDefault();
      navigate(pathLink.dataset.path);
      return;
    }
    const patternChip = t.closest<HTMLElement>('[data-pattern-chip]');
    if (patternChip && notes.contains(patternChip)) {
      e.preventDefault();
      openFromPatternChip(patternChip);
      return;
    }
    if (t.closest('[data-course-note-open]')) {
      if (notes.classList.contains('is-drawer-open') && t.closest('.ly-course-bookmark')) {
        closeDrawer();
      } else {
        openDrawer();
      }
      return;
    }
    if (t.closest('[data-course-drawer-close]')) {
      closeDrawer();
      return;
    }
    const drawerTab = t.closest<HTMLElement>('[data-drawer-tab]');
    if (drawerTab) {
      const id = drawerTab.dataset.drawerTab as DrawerTab;
      selectDrawerTab(id);
    }
  });

  /** 此刻解读等处的「打开解读笔记」——不在 notes/course 内，需单独委托 */
  root.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-course-note-open]');
    if (!btn || !root.contains(btn)) return;
    if (notes.contains(btn) || course.contains(btn)) return;
    openDrawer();
  });

  const paint = () => {
    persistCurrentNote();
    persistStudyNotes();
    const lesson = lessons[index]!;
    course.dataset.courseIndex = String(index);
    if (body) body.innerHTML = renderStepPanel(lesson, cast, castAt, question);
    syncDrawerForStep(lesson);
    syncCourseTrail(course, index, lessons);
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) {
      nextBtn.textContent = index >= lessons.length - 1 ? '完成 ✓' : '下一步 →';
    }
    wireStepUi();

    // 第 2 步用神：自动打开专业排盘对照装卦
    if (lesson.step === 2) {
      const yongIdx = buildYongFocusPack(cast, question, castAt).focusIndexes[0];
      selectDressLens(notes, 'energy');
      openDrawer({
        tab: 'dress',
        focusYaoIndex: Number.isFinite(yongIdx) ? yongIdx : undefined,
        showDressCard: Number.isFinite(yongIdx),
      });
    } else if (notes.classList.contains('is-drawer-open')) {
      selectDrawerTab(drawerTabForStep(lesson.step));
      if (drawerTabForStep(lesson.step) === 'books') {
        highlightBookLines(focusLinesForStep(lesson.step));
      }
    }

    opts?.onStepChange?.(lesson.step);
  };

  course.addEventListener('click', (e) => {
    const jump = (e.target as HTMLElement).closest<HTMLElement>('[data-course-jump]');
    if (jump && course.contains(jump) && !jump.closest('[data-course-drawer]')) {
      const next = Number(jump.dataset.courseJump);
      if (Number.isFinite(next) && next !== index && next >= 0 && next < lessons.length) {
        index = next;
        paint();
      }
    }
  });

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

/** 收集六步笔记，写入日记 */
export function collectCourseNotes(cast: CastResult): string {
  const parts: string[] = [];
  for (let s = 1; s <= 6; s++) {
    const v = loadCourseNote(cast, s as CourseStep).trim();
    if (v) parts.push(`Step ${s}：${v}`);
  }
  return parts.join('\n');
}
