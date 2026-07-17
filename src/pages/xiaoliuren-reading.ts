import { stashCrossAskQuestion, takeCrossAskQuestion } from '../journal/cross-ask.ts';
import { navigate } from '../router.ts';
import { wait, prefersReducedMotion } from '../tarot/animations.ts';
import { computeLesson, type LessonResult } from '../xiaoliuren/engine.ts';
import { getChineseHour, sectorPointerAngle, formatClockTime, formatHourMemory } from '../xiaoliuren/chinese-hour.ts';
import { formatSolarDateTime, solarToLunar, type LunarDate } from '../xiaoliuren/lunar.ts';
import { buildPhaseTeach, renderPhaseTeachCard } from '../xiaoliuren/lesson-copy.ts';
import { buildAiReading, buildProcessExplanation } from '../xiaoliuren/interpret.ts';
import { saveXiaoliurenJournalEntry, updateXiaoliurenReflection } from '../xiaoliuren/journal.ts';
import { renderSixGodIcon, getSixGodByIndex, sixGodOneLiner } from '../xiaoliuren/six-gods.ts';
import {
  renderOrbitPlate,
  renderSixGodsReveal,
} from '../ui/xiaoliuren/hand-plate.ts';
import {
  renderLearnPalm,
  renderStepTally,
  mountLearnPalmInteractions,
  type LearnSubPhase,
} from '../ui/xiaoliuren/learn-palm.ts';
import { renderModeSelect, type LessonMode } from '../ui/xiaoliuren/mode-select.ts';
import {
  mountPracticePalmInteractions,
  practiceExpectedLabel,
  renderPracticePalm,
} from '../ui/xiaoliuren/practice-palm.ts';
import {
  getSkillGateStatus,
  isCorrectPracticeTap,
  isModeUnlocked,
  markLearnClear,
  markPracticeClear,
  practiceWrongHint,
} from '../xiaoliuren/skill-gates.ts';
import {
  formatWeekday,
  mountShichenDialAnimation,
  renderShichenDial,
} from '../ui/xiaoliuren/shichen-dial.ts';
import { getHuangliBrief, getHuangliCalendarLayout } from '../xiaoliuren/huangli.ts';
import { getLunarConvertView } from '../xiaoliuren/lunar-convert.ts';
import { playLunarFlipAnimation, renderLunarFlipScroll } from '../ui/xiaoliuren/lunar-flip.ts';
import {
  mountHuangliInteractions,
  renderHuangliDrawer,
  renderHuangliMiniCard,
} from '../ui/xiaoliuren/huangli-card.ts';
import { renderFlowPanel } from '../ui/xiaoliuren/flow-panel.ts';
import {
  mountHuangliMiniMotion,
  mountLunarScrollMotion,
  mountPalmHopMotion,
  mountPalmPlateMotion,
  mountStaggerEntrance,
} from '../ui/xiaoliuren/motion.ts';
import { renderTimeBadge } from '../ui/xiaoliuren/time-badge.ts';
import { mountShichenTableLore, renderShichenTable } from '../ui/xiaoliuren/shichen-table.ts';
import { buildGodHuangliBridge } from '../xiaoliuren/god-huangli-bridge.ts';
import { renderCountSteps } from '../ui/xiaoliuren/count-steps.ts';
import { renderXlrDivider } from '../ui/xiaoliuren/assets.ts';
import { mountEnvBanner } from '../ui/banner.ts';

type FlowState =
  | 'question'
  | 'modeSelect'
  | 'lunar'
  | 'hour'
  | 'count'
  | 'reveal'
  | 'result';

const HOP_MS_LEARN = 1500;
const HOP_MS_BEGINNER = 1100;

export function renderXiaoliurenReading(root: HTMLElement): () => void {
  let state: FlowState = 'question';
  let lessonMode: LessonMode | null = null;
  let question = takeCrossAskQuestion().slice(0, 80);
  let at = new Date();
  let lunar: LunarDate | null = null;
  let hour = getChineseHour(at);
  let lesson: LessonResult | null = null;
  let countStepIndex = 0;
  let hopCursor = 0;
  let activeHop = -1;
  let litIndices: number[] = [];
  let completedTally: { label: string; landingIndex: number }[] = [];
  let journalId: string | null = null;
  let huangliOpen = false;
  let lunarFlipped = false;
  let learnSubPhase: LearnSubPhase = 'ready';
  let autoPlayToken = 0;
  let practiceFeedback: string | null = null;
  let countHopPrev = -1;
  let skillGateMarked = false;

  const page = document.createElement('div');
  page.className = 'page xlr-reading-page xlr-xuan-page';
  mountEnvBanner(page);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回小六壬';
  back.addEventListener('click', () => navigate('/xiaoliuren'));

  const stage = document.createElement('div');
  stage.className = 'xlr-reading-stage';
  const drawerHost = document.createElement('div');
  drawerHost.className = 'xlr-huangli-host';
  const actions = document.createElement('div');
  actions.className = 'xlr-reading-actions';

  page.append(back, stage, drawerHost, actions);
  root.appendChild(page);

  const isLearn = () => lessonMode === 'learn';
  const isPractice = () => lessonMode === 'practice';
  const isQuick = () => lessonMode === 'beginner';
  const hopMs = () => (prefersReducedMotion() ? 120 : isLearn() ? HOP_MS_LEARN : HOP_MS_BEGINNER);

  function getHuangli() {
    return getHuangliBrief(at, hour.label, hour.name);
  }

  function setHuangliOpen(open: boolean): void {
    huangliOpen = open;
    document.body.classList.toggle('xlr-huangli-lock', open);
    renderDrawer();
  }

  function renderDrawer(): void {
    drawerHost.innerHTML = renderHuangliDrawer(getHuangli(), huangliOpen);
    mountHuangliInteractions(drawerHost, setHuangliOpen);
  }

  function appendBtn(label: string, onClick: () => void, ghost = false): void {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = ghost ? 'btn btn-ghost' : 'btn';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    actions.appendChild(btn);
  }

  function resetSessionData(): void {
    autoPlayToken += 1;
    at = new Date();
    hour = getChineseHour(at);
    lunar = solarToLunar(at);
    lesson = computeLesson(lunar, hour);
    countStepIndex = 0;
    hopCursor = 0;
    activeHop = -1;
    litIndices = [];
    completedTally = [];
    journalId = null;
    lunarFlipped = false;
    practiceFeedback = null;
    skillGateMarked = false;
    learnSubPhase = isLearn() ? 'await-origin' : 'ready';
  }

  function mountStageMotion(opts?: { prevHop?: number }): void {
    mountStaggerEntrance(stage);
    if (state === 'question') mountHuangliMiniMotion(stage);
    if (state === 'lunar') mountLunarScrollMotion(stage);
    if (state === 'hour') mountShichenDialAnimation(stage);
    if (state === 'count') {
      mountPalmPlateMotion(stage);
      if (
        opts?.prevHop !== undefined &&
        opts.prevHop >= 0 &&
        activeHop >= 0 &&
        opts.prevHop !== activeHop
      ) {
        mountPalmHopMotion(stage, opts.prevHop, activeHop, hopMs());
      }
    }
  }

  function tallyLabelForStep(stepIdx: number): string {
    const step = lesson!.steps[stepIdx];
    if (step.phase === 'month') return `农历${lunar!.monthLabel}`;
    if (step.phase === 'day') return `农历${lunar!.dayLabel}`;
    return hour.label;
  }

  function completeCurrentStep(): void {
    if (!lesson || !lunar) return;
    const step = lesson.steps[countStepIndex];
    activeHop = step.landingIndex;
    if (!litIndices.includes(activeHop)) {
      litIndices = [...litIndices, activeHop];
    }

    const label = tallyLabelForStep(countStepIndex);
    completedTally = [
      ...completedTally.filter((t) => t.label !== label),
      { label, landingIndex: step.landingIndex },
    ];
    learnSubPhase = 'step-done';
    renderCountStage();
    renderCountActions();
  }

  function showAutoPlayTip(text: string): void {
    actions.innerHTML = '';
    const tip = document.createElement('p');
    tip.className = 'xlr-step-foot';
    tip.textContent = text;
    actions.appendChild(tip);
  }

  /** 新手模式：当前步亮点自动顺数，播完停在本步落位 */
  async function runLearnStepSpin(): Promise<void> {
    if (!lesson || !isLearn() || state !== 'count') return;
    const token = ++autoPlayToken;
    const step = lesson.steps[countStepIndex];
    if (!step) return;

    learnSubPhase = 'hopping';
    showAutoPlayTip('亮点顺数中…');
    renderCountStage();

    while (hopCursor < step.hops.length) {
      await wait(hopMs());
      if (token !== autoPlayToken || state !== 'count') return;
      const prev = activeHop;
      activeHop = step.hops[hopCursor];
      hopCursor += 1;
      if (!litIndices.includes(activeHop)) {
        litIndices = [...litIndices, activeHop];
      }
      countHopPrev = prev;
      learnSubPhase = 'hopping';
      renderCountStage();
    }

    await wait(hopMs() + 200);
    if (token !== autoPlayToken || state !== 'count') return;
    completeCurrentStep();
  }

  /** 快速模式：亮点沿六宫自动旋转掐算 */
  async function runQuickSpin(): Promise<void> {
    if (!lesson || !isQuick()) return;
    const token = ++autoPlayToken;
    showAutoPlayTip('亮点旋转掐算中…');

    for (let si = 0; si < lesson.steps.length; si++) {
      if (token !== autoPlayToken || state !== 'count') return;
      countStepIndex = si;
      const step = lesson.steps[si];
      activeHop = step.hops[0] ?? step.fromIndex;
      hopCursor = Math.min(1, step.hops.length);
      litIndices = activeHop >= 0 ? [...new Set([...litIndices, activeHop])] : [...litIndices];
      countHopPrev = activeHop;
      learnSubPhase = 'hopping';
      renderCountStage();

      for (let hi = 1; hi < step.hops.length; hi++) {
        await wait(hopMs());
        if (token !== autoPlayToken || state !== 'count') return;
        const prev = activeHop;
        activeHop = step.hops[hi];
        hopCursor = hi + 1;
        if (!litIndices.includes(activeHop)) litIndices = [...litIndices, activeHop];
        countHopPrev = prev;
        learnSubPhase = 'hopping';
        renderCountStage();
      }

      await wait(hopMs() + 180);
      if (token !== autoPlayToken || state !== 'count') return;
      const label = tallyLabelForStep(si);
      completedTally = [
        ...completedTally.filter((t) => t.label !== label),
        { label, landingIndex: step.landingIndex },
      ];
      activeHop = step.landingIndex;
      learnSubPhase = 'step-done';
      renderCountStage();
      await wait(prefersReducedMotion() ? 200 : 650);
    }

    if (token !== autoPlayToken || state !== 'count') return;
    state = 'reveal';
    render();
  }

  function armOriginAndReady(): void {
    litIndices = [0];
    activeHop = 0;
    hopCursor = 1;
    countHopPrev = 0;
    void runLearnStepSpin();
  }

  function handlePracticeTap(index: number): void {
    if (!lesson || !isPractice() || state !== 'count') return;
    if (learnSubPhase === 'step-done') return;
    const step = lesson.steps[countStepIndex];
    if (!step || hopCursor >= step.hops.length) return;

    if (!isCorrectPracticeTap(step.hops, hopCursor, index)) {
      practiceFeedback = practiceWrongHint(practiceExpectedLabel(step.hops, hopCursor));
      renderCountStage();
      renderCountActions();
      return;
    }

    const prev = activeHop;
    activeHop = index;
    hopCursor += 1;
    if (!litIndices.includes(index)) litIndices = [...litIndices, index];
    countHopPrev = prev;
    learnSubPhase = 'hopping';
    practiceFeedback =
      hopCursor >= step.hops.length
        ? `点对了 · 本步落「${getSixGodByIndex(step.landingIndex).name}」`
        : '点对了，继续顺时针下一格';

    if (hopCursor >= step.hops.length) {
      completeCurrentStep();
      return;
    }
    renderCountStage();
    renderCountActions();
  }

  function renderCountStage(): void {
    if (!lesson || !lunar) return;
    const step = lesson.steps[countStepIndex];
    if (!step) return;

    const teach =
      isLearn()
        ? buildPhaseTeach(step.phase, lunar, hour, lesson.steps)
        : null;

    const palmHtml = isLearn()
      ? renderLearnPalm({
          dotIndex: activeHop >= 0 ? activeHop : null,
          litIndices,
          landingIndex: step.landingIndex,
          stepIndex: countStepIndex,
          phase: step.phase,
          learnSubPhase,
        })
      : isPractice()
        ? renderPracticePalm({
            dotIndex: activeHop >= 0 ? activeHop : null,
            litIndices,
            landingIndex: step.landingIndex,
            stepIndex: countStepIndex,
            phase: step.phase,
            count: step.count,
            hopCursor,
            feedback: practiceFeedback,
          })
        : renderOrbitPlate({
            dotIndex: activeHop >= 0 ? activeHop : null,
            litIndices,
            landingIndex: step.landingIndex,
            stepIndex: countStepIndex,
            showArrows: true,
          });

    const showTeachCard =
      isLearn() &&
      teach &&
      (learnSubPhase === 'await-origin' ||
        learnSubPhase === 'ready' ||
        learnSubPhase === 'step-done' ||
        (learnSubPhase === 'hopping' && hopCursor <= 1));

    const foot = isLearn()
      ? learnSubPhase === 'await-origin'
        ? '可先点食指下节「1 大安」，或直接点下方开始顺数'
        : learnSubPhase === 'hopping'
          ? step.phase === 'month'
            ? '光点正从大安顺时针移动，寻找本月落位'
            : '亮点从上一步落点继续顺数'
          : learnSubPhase === 'step-done'
            ? countStepIndex < (lesson?.steps.length ?? 0) - 1
              ? `本步落到「${getSixGodByIndex(step.landingIndex).name}」· 下一步从这里继续数，不重回大安`
              : '月→日→时三步落定，可查看最终六神'
            : '亮点将沿 1→2→3→4→5→6 顺时针顺数'
      : isPractice()
        ? learnSubPhase === 'step-done'
          ? countStepIndex < (lesson?.steps.length ?? 0) - 1
            ? `本步落到「${getSixGodByIndex(step.landingIndex).name}」· 点下方继续下一步`
            : '三步全对，可查看最终六神'
          : '编号已隐藏 · 在掌上自己顺数'
        : '亮点自动旋转掐算中';

    stage.innerHTML = `
      ${renderFlowPanel(
        {
          section: '掌上起课',
          title: isLearn()
            ? teach?.title ?? '学习规则'
            : isPractice()
              ? '空白掌操练'
              : '自动掐算',
        },
        `
          ${renderCountSteps(countStepIndex)}
          <h2 class="xlr-step-title">${step.title}</h2>
          <p class="xlr-step-detail">${step.detail}</p>
          ${showTeachCard ? renderPhaseTeachCard(teach!, { showMoon: step.phase === 'month' }) : ''}
          ${palmHtml}
          ${completedTally.length > 0 ? renderStepTally(completedTally) : ''}
          <p class="xlr-step-foot">${foot}</p>
        `,
        'xlr-flow-count',
      )}
    `;
    mountStageMotion({ prevHop: countHopPrev });
    countHopPrev = activeHop;

    if (isLearn() && learnSubPhase === 'await-origin') {
      mountLearnPalmInteractions(stage, () => armOriginAndReady());
    }
    if (isPractice() && learnSubPhase !== 'step-done') {
      mountPracticePalmInteractions(stage, handlePracticeTap);
    }
  }

  function renderCountActions(): void {
    if (state !== 'count' || !lesson) return;
    // 快速模式自动旋转时不渲染手动按钮
    if (isQuick() && autoPlayToken > 0) {
      return;
    }
    actions.innerHTML = '';

    if (isLearn() && learnSubPhase === 'await-origin') {
      appendBtn('开始顺数', () => armOriginAndReady());
      return;
    }

    if (isPractice() && learnSubPhase !== 'step-done') {
      const tip = document.createElement('p');
      tip.className = 'xlr-step-foot';
      tip.textContent = '在掌图上点宫位；点对才前进。';
      actions.appendChild(tip);
      return;
    }

    const step = lesson.steps[countStepIndex];

    if (learnSubPhase === 'step-done') {
      if (countStepIndex < lesson.steps.length - 1) {
        const next = lesson.steps[countStepIndex + 1];
        const fromName = getSixGodByIndex(step.landingIndex).name;
        const nextLabel = next.phase === 'day' ? '从日起' : '从时起';
        appendBtn(`从「${fromName}」继续 · ${nextLabel}`, () => {
          countStepIndex += 1;
          const cur = lesson!.steps[countStepIndex];
          if (isPractice()) {
            hopCursor = 0;
            activeHop = step.landingIndex;
            practiceFeedback = null;
            learnSubPhase = 'ready';
            renderCountStage();
            renderCountActions();
            return;
          }
          hopCursor = cur.hops.length > 0 ? 1 : 0;
          activeHop = cur.hops[0] ?? cur.fromIndex;
          countHopPrev = activeHop;
          if (activeHop >= 0 && !litIndices.includes(activeHop)) {
            litIndices = [...litIndices, activeHop];
          }
          void runLearnStepSpin();
        });
      } else {
        appendBtn('查看落课结果', () => {
          state = 'reveal';
          render();
        });
      }
      return;
    }

    // 自动顺数进行中不展示手动按钮
    if (learnSubPhase === 'hopping') return;

    if (isLearn() && hopCursor < step.hops.length) {
      appendBtn(hopCursor <= 1 && activeHop === step.fromIndex ? '开始顺数' : '顺数一格', () => {
        void runLearnStepSpin();
      });
    }
  }

  function render(): void {
    actions.innerHTML = '';

    switch (state) {
      case 'question':
        {
          const lunarBrief = solarToLunar(at);
          stage.innerHTML = renderFlowPanel(
            { section: '提问', title: '明确问题' },
            `
              <h2 class="xlr-flow-heading xlr-stagger-item" style="--si:2">你想问什么？</h2>
              <p class="xlr-flow-hint xlr-stagger-item" style="--si:3">小六壬适合问短期趋势：今天顺不顺，眼前这一步怎么走。</p>
              <textarea id="xlr-question" class="question-input xlr-question-input xlr-stagger-item" style="--si:4" rows="3" maxlength="80" placeholder="例如：今天适合主动推进这件事吗？"></textarea>
              ${renderTimeBadge(hour.label, formatClockTime(at), formatSolarDateTime(at).slice(0, 10), lunarBrief.label)}
              ${renderHuangliMiniCard(getHuangli())}
            `,
            'xlr-flow-question',
          );
          mountHuangliInteractions(stage, setHuangliOpen);
          const input = stage.querySelector<HTMLTextAreaElement>('#xlr-question')!;
          if (question) input.value = question;
        }
        appendBtn('下一步 · 选择起课方式', () => {
          const input = stage.querySelector<HTMLTextAreaElement>('#xlr-question');
          question = input?.value.trim() ?? '';
          state = 'modeSelect';
          render();
        });
        break;

      case 'modeSelect':
        stage.innerHTML = renderFlowPanel(
          { section: '起课', title: '通关学技能' },
          renderModeSelect(lessonMode, getSkillGateStatus()),
        );
        stage.querySelectorAll<HTMLButtonElement>('.xlr-mode-card').forEach((card) => {
          card.addEventListener('click', () => {
            if (card.dataset.unlocked !== '1') return;
            lessonMode = card.dataset.mode as LessonMode;
            render();
          });
        });
        {
          const startBtn = document.createElement('button');
          startBtn.type = 'button';
          startBtn.className = 'btn';
          startBtn.textContent = '开始起课';
          startBtn.disabled = !lessonMode || !isModeUnlocked(lessonMode);
          startBtn.addEventListener('click', () => {
            if (!lessonMode || !isModeUnlocked(lessonMode)) return;
            resetSessionData();
            state = 'lunar';
            render();
          });
          actions.appendChild(startBtn);
        }
        break;

      case 'lunar':
        stage.innerHTML = renderFlowPanel(
          { section: '翻黄历', title: '认识时间' },
          renderLunarFlipScroll(
            getLunarConvertView(at, hour.label),
            getHuangliCalendarLayout(at, hour.label, hour.name),
            { flipped: lunarFlipped, hourRangeLabel: hour.rangeLabel },
          ),
          'xlr-flow-lunar',
        );
        mountHuangliInteractions(stage, setHuangliOpen);
        if (!lunarFlipped) {
          void playLunarFlipAnimation(stage, wait, prefersReducedMotion()).then(() => {
            lunarFlipped = true;
            render();
          });
        } else {
          appendBtn('下一步 · 确认时辰', () => {
            state = 'hour';
            render();
          });
        }
        break;

      case 'hour':
        stage.innerHTML = renderFlowPanel(
          { section: '识时辰', title: '十二时辰' },
          `
            <p class="xlr-hour-lead xlr-stagger-item" style="--si:2">当前 <strong>${formatClockTime(at)}</strong> 落在 <strong>${hour.label}</strong></p>
            ${renderShichenDial({
              activeIndex: hour.index,
              clockDeg: sectorPointerAngle(at),
              timeLabel: formatClockTime(at),
              hourLabel: hour.label,
              lunarLabel: lunar?.label,
              weekday: formatWeekday(at),
              animateEnter: true,
              size: 'flow',
            })}
            <p class="xlr-hour-memory-lead xlr-stagger-item" style="--si:4">快速记忆：${formatHourMemory(hour)}</p>
            ${renderXlrDivider('xlr-hour-divider')}
            <div class="xlr-stagger-item" style="--si:5">${renderShichenTable(hour.index)}</div>
          `,
          'xlr-flow-hour',
        );
        mountHuangliInteractions(stage, setHuangliOpen);
        mountShichenTableLore(stage);
        appendBtn(
          isLearn() ? '开始掌上演算' : isPractice() ? '开始空白掌操练' : '开始旋转掐算',
          () => {
            state = 'count';
            countStepIndex = 0;
            completedTally = [];
            litIndices = [];
            practiceFeedback = null;
            if (isLearn()) {
              hopCursor = 0;
              activeHop = -1;
              learnSubPhase = 'await-origin';
              renderCountStage();
              renderCountActions();
            } else if (isPractice()) {
              hopCursor = 0;
              activeHop = -1;
              countHopPrev = -1;
              learnSubPhase = 'ready';
              renderCountStage();
              renderCountActions();
            } else {
              hopCursor = 0;
              activeHop = -1;
              countHopPrev = -1;
              learnSubPhase = 'ready';
              renderCountStage();
              void runQuickSpin();
            }
          },
        );
        break;

      case 'count':
        renderCountStage();
        renderCountActions();
        break;

      case 'reveal':
        if (!lesson) break;
        stage.innerHTML = renderFlowPanel(
          { section: '六神落位', title: '看到过程' },
          `
            <div class="xlr-result-hero">
              ${renderSixGodIcon(lesson.result, 'xlr-result-icon')}
              <h2 class="xlr-result-name">${lesson.result.name}</h2>
              <p class="xlr-result-summary">${sixGodOneLiner(lesson.result)}</p>
            </div>
            <p class="xlr-reveal-tally">农历${lunar?.monthLabel} → 落${getSixGodByIndex(lesson.steps[0].landingIndex).name} · 农历${lunar?.dayLabel} → 落${getSixGodByIndex(lesson.steps[1].landingIndex).name} · ${hour.label} → 落${lesson.result.name}</p>
            ${isLearn() || isPractice()
              ? renderLearnPalm({
                  dotIndex: lesson.resultIndex,
                  litIndices: [0, 1, 2, 3, 4, 5],
                  landingIndex: lesson.resultIndex,
                  learnSubPhase: 'ready',
                })
              : renderOrbitPlate({
                  dotIndex: lesson.resultIndex,
                  litIndices: [0, 1, 2, 3, 4, 5],
                  landingIndex: lesson.resultIndex,
                })}
            ${isPractice() ? '<p class="xlr-practice-clear-note">空白掌三步全对 · 计入通关进度</p>' : ''}
            ${renderSixGodsReveal(lesson.resultIndex)}
          `,
          'xlr-flow-reveal',
        );
        appendBtn('查看解读与建议', () => {
          state = 'result';
          render();
        });
        break;

      case 'result':
        if (!lesson || !lunar) break;
        journalId = journalId ?? saveXiaoliurenJournalEntry({
          question,
          solarLabel: formatSolarDateTime(at),
          lunar,
          hour,
          lesson,
        }).id;

        if (!skillGateMarked) {
          skillGateMarked = true;
          if (isLearn()) markLearnClear();
          if (isPractice()) markPracticeClear();
        }

        {
          const reading = buildAiReading(question, lesson.result);
          const bridge = buildGodHuangliBridge(lesson.result, getHuangli());
          const reflectPrompt = `推演结果：【${lesson.result.name}】。结合上面的提醒，你觉得今天最好怎么做？`;
          stage.innerHTML = renderFlowPanel(
            { section: '结果解释', title: '五段理解' },
            `
              <div class="xlr-result-hero">
                ${renderSixGodIcon(lesson.result, 'xlr-result-icon')}
                <h2 class="xlr-result-name">${lesson.result.name}</h2>
                <p class="xlr-result-summary">${sixGodOneLiner(lesson.result)}</p>
              </div>
              <p class="xlr-result-process">${buildProcessExplanation(lesson.basisLabel, lesson.result.name)}</p>
              <p class="xlr-result-huangli-bridge">${bridge}</p>
              ${
                question
                  ? `<p class="xlr-result-q"><span>你的问题</span>${reading.question}<em>· ${reading.typeLabel}</em></p>`
                  : ''
              }
              <section class="xlr-result-block xlr-result-layer" data-layer="1">
                <h3><span class="xlr-result-layer-no">一</span>传统含义</h3>
                <p>${reading.meaning}</p>
              </section>
              <section class="xlr-result-block xlr-result-layer" data-layer="2">
                <h3><span class="xlr-result-layer-no">二</span>结合你的问题</h3>
                <p>${reading.analysis}</p>
              </section>
              <section class="xlr-result-block xlr-result-layer" data-layer="3">
                <h3><span class="xlr-result-layer-no">三</span>现在更适合</h3>
                <p>${reading.suggestion}</p>
              </section>
              <section class="xlr-result-block xlr-result-layer" data-layer="4">
                <h3><span class="xlr-result-layer-no">四</span>给你的一个提醒</h3>
                <p>${reading.reflection}</p>
              </section>
              <section class="xlr-result-reflect" data-layer="5">
                <h3><span class="xlr-result-layer-no">五</span>轻反思（写入手札）</h3>
                <p class="xlr-result-reflect-lead">${reflectPrompt}</p>
                <textarea id="xlr-reflection" class="question-input xlr-reflection-input" rows="3" placeholder="写一句就好，例如：先不催、先确认一件事…" required></textarea>
                <p class="xlr-result-reflect-hint" hidden>写完这句，才能完成手札。</p>
              </section>
            `,
            'xlr-flow-result',
          );

          const reflectEl = stage.querySelector<HTMLTextAreaElement>('#xlr-reflection');
          const reflectHint = stage.querySelector<HTMLElement>('.xlr-result-reflect-hint');
          const journalBtn = document.createElement('button');
          journalBtn.type = 'button';
          journalBtn.className = 'btn';
          journalBtn.textContent = '手札记录 · 完成';
          journalBtn.disabled = true;
          journalBtn.setAttribute('aria-disabled', 'true');

          const syncReflectGate = (): void => {
            const text = reflectEl?.value.trim() ?? '';
            const ready = text.length > 0;
            journalBtn.disabled = !ready;
            journalBtn.setAttribute('aria-disabled', ready ? 'false' : 'true');
            if (reflectHint) reflectHint.hidden = ready;
            if (journalId && reflectEl) updateXiaoliurenReflection(journalId, text);
          };

          reflectEl?.addEventListener('input', syncReflectGate);
          syncReflectGate();
          journalBtn.addEventListener('click', () => {
            if (journalBtn.disabled) return;
            navigate('/xiaoliuren/journal');
          });
          actions.appendChild(journalBtn);
        }

        appendBtn('也用塔罗看一眼', () => {
          stashCrossAskQuestion(question);
          navigate('/tarot/reading');
        }, true);
        appendBtn('再占一次', () => {
          state = 'question';
          lessonMode = null;
          litIndices = [];
          completedTally = [];
          render();
        }, true);
        break;
    }

    if (state !== 'count') mountStageMotion();
    renderDrawer();
  }

  render();
  return () => {
    document.body.classList.remove('xlr-huangli-lock');
  };
}
