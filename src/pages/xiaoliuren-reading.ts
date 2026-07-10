import { navigate } from '../router.ts';
import { wait, prefersReducedMotion } from '../tarot/animations.ts';
import { computeLesson, type LessonResult } from '../xiaoliuren/engine.ts';
import { getChineseHour, sectorPointerAngle, formatClockTime } from '../xiaoliuren/chinese-hour.ts';
import { formatSolarDateTime, solarToLunar, type LunarDate } from '../xiaoliuren/lunar.ts';
import { buildProcessExplanation, buildQuestionReading } from '../xiaoliuren/interpret.ts';
import { saveXiaoliurenJournalEntry, updateXiaoliurenReflection } from '../xiaoliuren/journal.ts';
import { renderSixGodIcon, getSixGodByIndex } from '../xiaoliuren/six-gods.ts';
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
  formatWeekday,
  mountShichenDialAnimation,
  renderShichenDial,
} from '../ui/xiaoliuren/shichen-dial.ts';
import { getHuangliBrief } from '../xiaoliuren/huangli.ts';
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
import { renderShichenTable } from '../ui/xiaoliuren/shichen-table.ts';
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
  let question = '';
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
    learnSubPhase = isLearn() ? 'await-origin' : 'ready';
  }

  let countHopPrev = -1;

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

  function advanceOneHop(): void {
    if (!lesson) return;
    const step = lesson.steps[countStepIndex];
    if (hopCursor >= step.hops.length) {
      completeCurrentStep();
      return;
    }

    const prev = activeHop;
    activeHop = step.hops[hopCursor];
    hopCursor += 1;
    if (!litIndices.includes(activeHop)) {
      litIndices = [...litIndices, activeHop];
    }
    learnSubPhase = 'hopping';
    countHopPrev = prev;
    renderCountStage();
    renderCountActions();

    if (hopCursor >= step.hops.length) {
      window.setTimeout(() => completeCurrentStep(), hopMs() + 200);
    }
  }

  function renderCountStage(): void {
    if (!lesson || !lunar) return;
    const step = lesson.steps[countStepIndex];
    if (!step) return;

    const palmHtml = isLearn()
      ? renderLearnPalm({
          dotIndex: activeHop >= 0 ? activeHop : null,
          litIndices,
          landingIndex: step.landingIndex,
          stepIndex: countStepIndex,
          phase: step.phase,
          learnSubPhase,
        })
      : renderOrbitPlate({
          dotIndex: activeHop >= 0 ? activeHop : null,
          litIndices,
          landingIndex: step.landingIndex,
          stepIndex: countStepIndex,
          showArrows: true,
        });

    stage.innerHTML = `
      ${renderFlowPanel(
        { section: isLearn() ? '掌上起课' : '掌上起课', title: isLearn() ? '学习规则' : '自动掐算' },
        `
          ${renderCountSteps(countStepIndex)}
          <h2 class="xlr-step-title">${step.title}</h2>
          <p class="xlr-step-detail">${step.detail}</p>
          ${palmHtml}
          ${completedTally.length > 0 ? renderStepTally(completedTally) : ''}
          <p class="xlr-step-foot">${isLearn() ? '点击按钮顺数，每一步都会停在当前宫位' : '由你控制节奏，点击顺数一格'}</p>
        `,
        'xlr-flow-count',
      )}
    `;
    mountStageMotion({ prevHop: countHopPrev });
    countHopPrev = activeHop;

    if (isLearn() && learnSubPhase === 'await-origin') {
      mountLearnPalmInteractions(stage, () => {
        learnSubPhase = 'ready';
        litIndices = [0];
        renderCountStage();
        renderCountActions();
      });
    }
  }

  function renderCountActions(): void {
    if (state !== 'count' || !lesson) return;
    actions.innerHTML = '';

    if (isLearn() && learnSubPhase === 'await-origin') return;

    const step = lesson.steps[countStepIndex];

    if (learnSubPhase === 'step-done') {
      if (countStepIndex < lesson.steps.length - 1) {
        appendBtn('进入下一步', () => {
          countStepIndex += 1;
          hopCursor = 0;
          activeHop = -1;
          learnSubPhase = 'ready';
          renderCountStage();
          renderCountActions();
        });
      } else {
        appendBtn('查看落课结果', () => {
          state = 'reveal';
          render();
        });
      }
      return;
    }

    if (hopCursor < step.hops.length) {
      appendBtn(hopCursor === 0 ? '开始顺数' : '顺数一格', () => advanceOneHop());
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
          { section: '起课', title: '选择方式' },
          renderModeSelect(lessonMode),
        );
        stage.querySelectorAll<HTMLButtonElement>('.xlr-mode-card').forEach((card) => {
          card.addEventListener('click', () => {
            lessonMode = card.dataset.mode as LessonMode;
            render();
          });
        });
        {
          const startBtn = document.createElement('button');
          startBtn.type = 'button';
          startBtn.className = 'btn';
          startBtn.textContent = '开始起课';
          startBtn.disabled = !lessonMode;
          startBtn.addEventListener('click', () => {
            if (!lessonMode) return;
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
          renderLunarFlipScroll(getLunarConvertView(at, hour.label), { flipped: lunarFlipped }),
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
            <p class="xlr-hour-memory-lead xlr-stagger-item" style="--si:4">快速记忆：${hour.memoryHint}</p>
            ${renderXlrDivider('xlr-hour-divider')}
            <div class="xlr-stagger-item" style="--si:5">${renderShichenTable(hour.index)}</div>
          `,
          'xlr-flow-hour',
        );
        mountHuangliInteractions(stage, setHuangliOpen);
        appendBtn(isLearn() ? '开始掌上演算' : '开始起课掐算', () => {
          state = 'count';
          countStepIndex = 0;
          hopCursor = 0;
          activeHop = -1;
          litIndices = [];
          completedTally = [];
          learnSubPhase = isLearn() ? 'await-origin' : 'ready';
          renderCountStage();
          renderCountActions();
        });
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
              <p class="xlr-result-summary">${lesson.result.summary}</p>
            </div>
            <p class="xlr-reveal-tally">农历${lunar?.monthLabel} → 落${getSixGodByIndex(lesson.steps[0].landingIndex).name} · 农历${lunar?.dayLabel} → 落${getSixGodByIndex(lesson.steps[1].landingIndex).name} · ${hour.label} → 落${lesson.result.name}</p>
            ${isLearn()
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

        stage.innerHTML = renderFlowPanel(
          { section: '结果解释', title: '理解' },
          `
            <div class="xlr-result-hero">
              ${renderSixGodIcon(lesson.result, 'xlr-result-icon')}
              <h2 class="xlr-result-name">${lesson.result.name}</h2>
              <p class="xlr-result-summary">${lesson.result.summary}</p>
            </div>
            <section class="xlr-result-block">
              <h3>为什么会是这个结果</h3>
              <p>${buildProcessExplanation(lesson.basisLabel, lesson.result.name)}</p>
            </section>
            <section class="xlr-result-block">
              <h3>结合你的问题</h3>
              <p>${question ? buildQuestionReading(question, lesson.result) : '本次未记录具体问题，以下按六神本义解读。'}</p>
            </section>
            <section class="xlr-result-block">
              <h3>行动建议</h3>
              <p>${lesson.result.advice}</p>
            </section>
            <textarea id="xlr-reflection" class="question-input xlr-reflection-input" rows="2" placeholder="写下此刻的感悟（可选）"></textarea>
          `,
          'xlr-flow-result',
        );

        stage.querySelector('#xlr-reflection')?.addEventListener('input', (e) => {
          if (!journalId) return;
          updateXiaoliurenReflection(journalId, (e.target as HTMLTextAreaElement).value);
        });

        appendBtn('手札记录 · 完成', () => navigate('/xiaoliuren/journal'));
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
