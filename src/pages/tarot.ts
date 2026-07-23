import { detectBrowserEnv } from '../core/browser-env.ts';
import { CameraService } from '../core/camera-service.ts';
import {
  HeldGestureDetector,
  JoinedPalmsDetector,
  PinchDetector,
  SwipeDetector,
} from '../core/gesture-detector.ts';
import { GestureBridge } from '../core/gesture-bridge.ts';
import { createFallbackInput, type FallbackAction } from '../core/fallback-input.ts';
import { createInterpretationProvider, readingCoversDrawn } from '../interpretation/llm-provider.ts';
import type { ReadingResult } from '../interpretation/types.ts';
import { detectQuestionTheme, unlockSingleCard } from '../codex/collection.ts';
import { buildIntuitionCompare } from '../knowledge/intuition-compare.ts';
import {
  backgroundChipGroups,
  intuitionChipGroups,
  textHasChip,
  toggleChipInText,
  type ChipGroup,
} from '../knowledge/pre-reading-chips.ts';
import { mountCardResultTabs } from '../ui/card-result-tabs.ts';
import { showRitualCompleteModal } from '../ui/ritual-complete-modal.ts';
import { showUnlockToast } from '../ui/unlock-toast.ts';
import { saveJournalEntry, updateJournalReflection, upsertJournalProgress } from '../journal/records.ts';
import { mergeReadingBackground } from '../life/profile-context.ts';
import { navigate } from '../router.ts';
import { downloadShareCard } from '../share/card-renderer.ts';
import { renderCardFace, runShuffleAnimation, wait } from '../tarot/animations.ts';
import { renderDeckFanHTML, type DeckFanHandle } from '../ui/tarot-deck-fan.ts';
import {
  ensurePlacements,
  paintSpreadBoard,
  renderSpreadBoardShellHtml,
} from '../ui/spread-board.ts';
import { isFreeArrangeSpread, type SlotLayout } from '../tarot/spread-layout.ts';
import {
  bindProfileContextBar,
  renderProfileContextBarHtml,
} from '../ui/profile-context-bar.ts';
import {
  defaultDrawMode,
  detectInputCapabilities,
  getDrawModeOptions,
  type DrawMode,
} from '../tarot/draw-modes.ts';
import { bindFreeDrawInput, requestMotionPermission } from '../tarot/free-draw-input.ts';
import { bindRitualInput, type RitualInputStep } from '../tarot/ritual-input.ts';
import { drawClarifierCard, type DrawnCard } from '../tarot/engine.ts';
import {
  CUSTOM_SPREAD_MAX,
  CUSTOM_SPREAD_MIN,
  SPREAD_ORDER,
  SPREADS,
  buildCustomPositions,
  buildLearningNote,
  defaultCustomLabels,
  drawSpread,
  getTeachHint,
  resolveActiveSpread,
  setSessionCustomPositions,
  type SpreadType,
} from '../tarot/spreads.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { attachPersonSwitcherToPage } from '../ui/module-person-chrome.ts';
import { createDebugPanel, isDebugMode } from '../ui/debug-panel.ts';
import { createGestureHintBar, type RitualStep } from '../ui/gesture-hint-bar.ts';
import { createGestureStatusBar } from '../ui/gesture-status.ts';
import { stashCrossAskQuestion, takeCrossAskQuestion } from '../journal/cross-ask.ts';
import { mountQuestionCoach, type QuestionCoachHandle } from '../ui/question-coach.ts';
import {
  createAiOptimizeTrigger,
  mountQuestionRewritePanel,
  type QuestionRewritePanelHandle,
} from '../ui/question-rewrite-panel.ts';
import { openQuestionGuideModal, renderQuestionStageBackdrop } from '../ui/question-type-guide.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';

type TarotState =
  | 'landing'
  | 'question'
  | 'spread'
  | 'modeSelect'
  | 'loading'
  | 'ritual'
  | 'shuffle'
  | 'cut'
  | 'draw'
  | 'place'
  | 'flip'
  | 'cardIntuition'
  | 'cardReview'
  | 'result';

export function renderTarot(root: HTMLElement): () => void {
  const env = detectBrowserEnv();
  const inputCaps = detectInputCapabilities(env);
  const camera = new CameraService();
  let gestureBridge: GestureBridge | null = null;

  const prefilledQuestion = takeCrossAskQuestion();
  let state: TarotState = prefilledQuestion ? 'question' : 'landing';
  let question = prefilledQuestion;
  let spreadType: SpreadType = 'past-present-future';
  let customLabels: string[] = defaultCustomLabels(3);
  let drawMode: DrawMode = defaultDrawMode(inputCaps);
  let motionEnabled = false;
  let questionCoach: QuestionCoachHandle | null = null;
  let questionRewrite: QuestionRewritePanelHandle | null = null;
  let drawLock = false;
  let currentJournalId: string | null = null;
  let ritualInputUnbind: (() => void) | null = null;
  let cardPool: DrawnCard[] = [];
  let drawnCards: DrawnCard[] = [];
  let currentIndex = 0;
  /** 各阵位是否已翻开（全翻流程） */
  let revealedFlags: boolean[] = [];
  /** 直觉焦点：null=整阵，数字=牌下标 */
  let intuitionFocus: number | null = null;
  /** 结果页切换：overall | 牌下标 */
  let resultView: 'overall' | number = 'overall';
  let reading: ReadingResult | null = null;
  let learningNote = '';
  let questionBackground = '';
  let backgroundPromptDone = false;
  let gestureFallback = !env.canUseGesture;
  let cameraOn = false;
  let supplementCount = 0;
  const MAX_SUPPLEMENT = 2;
  /** 当前牌解读的后台 Promise（保留字段；全翻后统一 interpret） */
  let pendingInterpret: Promise<void> | null = null;

  const pinchDetector = new PinchDetector();
  const swipeDetector = new SwipeDetector();
  const joinedPalms = new JoinedPalmsDetector();
  const heldPalm = new HeldGestureDetector();
  let deckFan: DeckFanHandle | null = null;
  let boardPlacements: SlotLayout[] = [];
  let boardDragUnbind: (() => void) | null = null;
  /** 手势摆阵：食指瞄准的空位下标 */
  let placeAimSlot: number | null = null;
  let placeGhost: { x: number; y: number } | null = null;

  const unbindCamera = camera.bindLifecycle();
  const hintBar = createGestureHintBar();
  const gestureStatus = createGestureStatusBar();
  const fallback = createFallbackInput(handleFallback);

  const page = document.createElement('div');
  page.className = 'page tarot-page';
  mountEnvBanner(page);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回塔罗';
  back.addEventListener('click', () => navigate('/tarot'));

  const stage = document.createElement('div');
  stage.className = 'tarot-stage';

  const actions = document.createElement('div');
  actions.className = 'tarot-actions';

  const cameraWrap = document.createElement('div');
  cameraWrap.className = 'camera-wrap';
  cameraWrap.hidden = true;

  let debug: ReturnType<typeof createDebugPanel> | null = null;
  if (isDebugMode()) {
    debug = createDebugPanel();
    document.body.appendChild(debug.el);
  }

  page.append(back, stage, actions, gestureStatus.el, fallback.el, cameraWrap);
  root.appendChild(page);
  attachPersonSwitcherToPage(page);
  document.body.appendChild(hintBar.el);

  function ritualStep(): RitualStep | null {
    const ritualStates = ['ritual', 'shuffle', 'cut', 'draw', 'place', 'flip'] as const;
    if (!ritualStates.includes(state as (typeof ritualStates)[number])) {
      return null;
    }
    return state as RitualStep;
  }

  function pauseCameraForReview(): void {
    cameraWrap.hidden = true;
    gestureStatus.el.hidden = true;
    gestureBridge?.stop();
    if (cameraOn) {
      camera.stop();
      cameraOn = false;
    }
  }

  function syncHintBar(): void {
    if (state === 'cardReview' || state === 'result' || state === 'cardIntuition') {
      hintBar.setStep(null);
      fallback.setVisible(false);
      gestureStatus.el.hidden = true;
      return;
    }
    if (['landing', 'question', 'spread', 'modeSelect', 'loading'].includes(state)) {
      hintBar.setStep(null);
      fallback.setVisible(false);
      gestureStatus.el.hidden = true;
      page.classList.remove('is-ritual-active');
      return;
    }
    page.classList.add('is-ritual-active');
    const step = ritualStep();
    if (drawMode !== 'gesture' || !cameraOn) {
      gestureStatus.el.hidden = true;
    }
    hintBar.setStep(step, drawMode);
    // 手势仪式全程提供辅助按钮（与提示文案一致）；勿仅在失败时显示
    const showAssist = step !== null && drawMode === 'gesture';
    fallback.setStep(showAssist ? step : null);
    fallback.setVisible(showAssist);
    if (gestureFallback && cameraOn) {
      fallback.setHint('手势模型未就绪，请用下方按钮；或轻触屏幕继续');
    } else if (gestureFallback) {
      fallback.setHint('手势识别不可用，请用下方按钮完成仪式');
    } else {
      fallback.setHint('也可使用下方辅助按钮完成当前步骤');
    }
    syncCameraPlacement();
    if (!cameraOn) gestureStatus.el.hidden = true;
  }

  function syncCameraPlacement(): void {
    if (!cameraOn) {
      cameraWrap.classList.remove('camera-wrap-inline');
      if (cameraWrap.parentElement !== page) {
        page.appendChild(cameraWrap);
      }
      return;
    }
    const slot = stage.querySelector('#camera-slot');
    if (slot) {
      cameraWrap.classList.add('camera-wrap-inline');
      slot.appendChild(cameraWrap);
      cameraWrap.hidden = false;
      const video = camera.getVideo();
      if (video && !cameraWrap.contains(video)) {
        camera.attachPreview(cameraWrap);
      }
    }
  }

  function resetDetectors(): void {
    pinchDetector.reset();
    swipeDetector.reset();
    joinedPalms.reset();
    heldPalm.reset();
  }

  function setState(next: TarotState): void {
    state = next;
    if (next === 'draw') drawLock = false;
    resetDetectors();
    debug?.setStatus(next);
    if (next === 'cardReview' || next === 'result' || next === 'cardIntuition') {
      pauseCameraForReview();
    }
    syncHintBar();
    renderStage();
    bindRitualInputs();
    if (
      drawMode === 'gesture' &&
      ['draw', 'place', 'flip', 'shuffle', 'cut'].includes(next) &&
      !cameraOn
    ) {
      void resumeGestureRitual();
    }
  }

  function ritualInputStep(): RitualInputStep | null {
    const steps: RitualInputStep[] = ['ritual', 'shuffle', 'cut', 'draw', 'flip'];
    return steps.includes(state as RitualInputStep) ? (state as RitualInputStep) : null;
  }

  function ritualInputCallbacks() {
    return {
      onRitualTap: () => void onRitualEnter(),
      onShuffle: () => void onShuffle(),
      onCut: () => void onCut(),
      onDraw: () => void onDraw(),
      onFlip: () => void onFlip(),
      onZoomIn: () => {},
      onZoomOut: () => {},
      onConfirm: () => {},
      onProgress: (text: string) => hintBar.setProgress(text),
      onDeckFanReady: (fan: DeckFanHandle | null) => {
        deckFan = fan;
      },
    };
  }

  function bindRitualInputs(): void {
    ritualInputUnbind?.();
    ritualInputUnbind = null;

    const step = ritualInputStep();
    if (!step) return;

    const callbacks = ritualInputCallbacks();

    if (drawMode === 'touch') {
      ritualInputUnbind = bindRitualInput(stage, step, callbacks);
      return;
    }

    if (drawMode === 'free') {
      if (step === 'flip') {
        ritualInputUnbind = bindRitualInput(stage, step, callbacks);
      } else {
        ritualInputUnbind = bindFreeDrawInput(stage, step, callbacks, motionEnabled);
      }
      return;
    }

    if (drawMode === 'gesture') {
      if (
        step === 'ritual' ||
        step === 'shuffle' ||
        step === 'cut' ||
        step === 'draw' ||
        step === 'flip'
      ) {
        ritualInputUnbind = bindRitualInput(stage, step, callbacks);
      }
      // place：手势瞄准，触屏可点空位放下
      if (state === 'place') {
        bindPlaceSlotTaps();
      }
      return;
    }
  }

  function bindPlaceSlotTaps(): void {
    const prev = ritualInputUnbind;
    const free = isFreeArrangeSpread(spreadType);
    const slots = [...stage.querySelectorAll<HTMLElement>('.spread-board-slot.is-empty')].filter(
      (el) => free || Number(el.dataset.slotIndex) === currentIndex,
    );
    const onTap = (e: Event) => {
      const slot = (e.currentTarget as HTMLElement).dataset.slotIndex;
      const idx = Number(slot);
      if (!Number.isFinite(idx)) return;
      placeAimSlot = idx;
      void onPlaceDrop();
    };
    slots.forEach((el) => el.addEventListener('click', onTap));
    ritualInputUnbind = () => {
      prev?.();
      slots.forEach((el) => el.removeEventListener('click', onTap));
    };
  }

  function ritualHintText(): string {
    if (drawMode === 'gesture') {
      return '星尘聚拢，牌堆浮起 · 轻触继续，或张掌保持 1 秒';
    }
    if (drawMode === 'free') {
      return '星尘聚拢，牌堆浮起 · 轻触继续';
    }
    return '星尘聚拢，牌堆浮起 · 轻触继续';
  }

  function stepHintHtml(step: 'shuffle' | 'cut' | 'draw' | 'flip' | 'place'): string {
    const touch: Record<string, string> = {
      shuffle: '<strong>滑动或画圈</strong>洗牌',
      cut: '<strong>横划</strong>切牌',
      draw: '<strong>左右滑动</strong>选牌 · <strong>上滑或长按</strong>抽出',
      place: '<strong>点空位</strong>放下这张牌',
      flip: '<strong>逐张点击</strong>翻开，或点下方<strong>全部翻开</strong>',
    };
    const gesture: Record<string, string> = {
      shuffle: '<strong>手掌收起</strong>并轻晃',
      cut: '<strong>左右挥手</strong>切牌',
      draw: '<strong>左右挥手</strong>浏览牌堆 · <strong>拇指食指捏合</strong>抽起',
      place: '<strong>食指指向</strong>阵位 · <strong>捏合或张掌</strong>放下（也可点空位）',
      flip: '<strong>逐张点击</strong>翻开，或点下方<strong>全部翻开</strong>',
    };
    const free: Record<string, string> = {
      shuffle: '摇一摇，或<strong>画一个圈</strong>',
      cut: '再摇一次，或<strong>横划一条线</strong>',
      draw: '<strong>左右滑动</strong>选牌 · <strong>上滑或长按</strong>抽出',
      place: '<strong>点空位</strong>放下这张牌',
      flip: '<strong>逐张点击</strong>翻开，或点下方<strong>全部翻开</strong>',
    };
    const map = drawMode === 'gesture' ? gesture : drawMode === 'free' ? free : touch;
    return map[step] ?? '';
  }

  function currentCard(): DrawnCard | null {
    return drawnCards[currentIndex] ?? null;
  }

  function renderStage(): void {
    actions.innerHTML = '';

    switch (state) {
      case 'landing':
        stage.innerHTML = `
          <div class="tarot-hero">
            ${mysticEmblemHtml('tarot', 'lg')}
            <h1 class="page-title">随心抽牌</h1>
            <p class="tarot-hint">触屏抽牌 · 牌阵 · 解读</p>
          </div>
        `;
        appendBtn('开始占卜', () => setState('question'));
        break;

      case 'question':
        questionCoach?.destroy();
        questionCoach = null;
        questionRewrite?.destroy();
        questionRewrite = null;
        stage.innerHTML = `
          <div class="question-stage">
            ${renderQuestionStageBackdrop()}
            <div class="question-main">
              <div class="question-head">
                <h2 class="section-title">你想问什么？</h2>
                <div class="question-head-actions">
                  <span class="question-ai-optimize-slot"></span>
                  <button type="button" class="question-guide-trigger">怎么问更好？</button>
                </div>
              </div>
              <textarea id="tarot-question" class="question-input" rows="3" placeholder="例如：找工作的阻碍和机会分别是什么？"></textarea>
              <div id="question-coach-host"></div>
            </div>
          </div>
        `;
        {
          const input = document.querySelector<HTMLTextAreaElement>('#tarot-question')!;
          const pickExample = (text: string) => {
            input.value = text;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.focus();
          };
          document.querySelector('.question-guide-trigger')?.addEventListener('click', () => {
            openQuestionGuideModal(pickExample);
          });
          const host = document.getElementById('question-coach-host')!;
          questionCoach = mountQuestionCoach(host, (q) => {
            question = q;
          });
          questionCoach.bindInput(input);
          if (question) input.value = question;

          questionRewrite = mountQuestionRewritePanel({
            source: 'question',
            getQuestion: () => input.value.trim() || question,
            onApply: (q) => {
              input.value = q;
              question = q;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.focus();
            },
          });
          const aiSlot = document.querySelector('.question-ai-optimize-slot');
          aiSlot?.appendChild(
            createAiOptimizeTrigger(() => {
              questionRewrite?.open();
            }),
          );
        }
        appendBtn('下一步 · 选择牌阵', () => {
          const input = document.querySelector<HTMLTextAreaElement>('#tarot-question');
          const coached = questionCoach?.getActiveQuestion().trim();
          question = coached || input?.value.trim() || '';
          setState('spread');
        });
        break;

      case 'spread':
        stage.innerHTML = `<h2 class="section-title">选择牌阵</h2><div class="spread-list" id="spread-list"></div>`;
        {
          const list = document.getElementById('spread-list')!;
          const customEditorHost = document.createElement('div');
          customEditorHost.className = 'custom-spread-editor';
          customEditorHost.hidden = spreadType !== 'custom';

          const renderCustomEditor = () => {
            const count = customLabels.length;
            customEditorHost.innerHTML = `
              <p class="custom-spread-lead">选张数，并为每个位置起名（怎么摆由你定义）</p>
              <div class="custom-spread-count" role="group" aria-label="抽牌张数">
                <button type="button" class="btn btn-ghost btn-sm" data-count-dec aria-label="减少">−</button>
                <span class="custom-spread-count-val">${count} 张</span>
                <button type="button" class="btn btn-ghost btn-sm" data-count-inc aria-label="增加">+</button>
              </div>
              <ol class="custom-spread-positions">
                ${customLabels
                  .map(
                    (label, i) => `
                  <li>
                    <label class="pre-reading-label" for="custom-pos-${i}">第 ${i + 1} 张</label>
                    <input id="custom-pos-${i}" class="question-input custom-pos-input" type="text" maxlength="16" value="${escapePreReading(label)}" data-pos-index="${i}" />
                  </li>`,
                  )
                  .join('')}
              </ol>
            `;
            customEditorHost
              .querySelector('[data-count-dec]')
              ?.addEventListener('click', () => {
                if (customLabels.length <= CUSTOM_SPREAD_MIN) return;
                readCustomLabelsFromDom();
                customLabels = customLabels.slice(0, -1);
                renderCustomEditor();
              });
            customEditorHost
              .querySelector('[data-count-inc]')
              ?.addEventListener('click', () => {
                if (customLabels.length >= CUSTOM_SPREAD_MAX) return;
                readCustomLabelsFromDom();
                customLabels = [...customLabels, `位置 ${customLabels.length + 1}`];
                renderCustomEditor();
              });
          };

          const readCustomLabelsFromDom = () => {
            const inputs = customEditorHost.querySelectorAll<HTMLInputElement>('.custom-pos-input');
            if (!inputs.length) return;
            customLabels = [...inputs].map((el, i) => el.value.trim() || `位置 ${i + 1}`);
          };

          const selectSpread = (type: SpreadType, wrap: HTMLElement) => {
            spreadType = type;
            list.querySelectorAll('.spread-option-wrap').forEach((el) => {
              el.classList.remove('is-selected');
            });
            wrap.classList.add('is-selected');
            customEditorHost.hidden = type !== 'custom';
            if (type === 'custom') renderCustomEditor();
          };

          for (const type of SPREAD_ORDER) {
            const spread = SPREADS[type];
            const card = document.createElement('div');
            card.className = `spread-option-wrap ${spread.type === spreadType ? 'is-selected' : ''}`;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'spread-option';
            btn.innerHTML = `
              <strong>${spread.name}</strong>
              <span class="spread-light">${spread.lightHint}</span>
              <em>${spread.description}</em>
            `;
            btn.addEventListener('click', () => selectSpread(spread.type, card));

            const moreToggle = document.createElement('button');
            moreToggle.type = 'button';
            moreToggle.className = 'spread-more-toggle';
            moreToggle.textContent = '? 了解更多';
            const moreBox = document.createElement('p');
            moreBox.className = 'spread-more';
            moreBox.hidden = true;
            moreBox.textContent = spread.moreHint;
            moreToggle.addEventListener('click', (e) => {
              e.stopPropagation();
              moreBox.hidden = !moreBox.hidden;
              moreToggle.textContent = moreBox.hidden ? '? 了解更多' : '收起';
            });

            card.append(btn, moreToggle, moreBox);
            if (type === 'custom') {
              card.appendChild(customEditorHost);
              if (spreadType === 'custom') renderCustomEditor();
            }
            list.appendChild(card);
          }
        }
        appendBtn('← 返回修改问题', () => setState('question'), 'btn btn-ghost');
        appendBtn('下一步 · 选择抽牌方式', () => {
          if (spreadType === 'custom') {
            const inputs = stage.querySelectorAll<HTMLInputElement>('.custom-pos-input');
            customLabels = [...inputs].map((el, i) => el.value.trim() || `位置 ${i + 1}`);
            if (customLabels.length < CUSTOM_SPREAD_MIN) {
              customLabels = defaultCustomLabels(3);
            }
            setSessionCustomPositions(buildCustomPositions(customLabels));
          } else {
            setSessionCustomPositions(null);
          }
          boardPlacements = ensurePlacements(resolveActiveSpread(spreadType), null);
          setState('modeSelect');
        });
        break;

      case 'modeSelect':
        stage.innerHTML = `
          <h2 class="section-title">选择你的抽牌方式</h2>
          <p class="tarot-hint">根据设备为你准备了不同仪式，可随时在图鉴回看。</p>
          <div class="draw-mode-list" id="draw-mode-list"></div>
        `;
        {
          const list = document.getElementById('draw-mode-list')!;
          for (const opt of getDrawModeOptions(inputCaps)) {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = `draw-mode-option ${drawMode === opt.mode ? 'is-selected' : ''}`;
            item.disabled = !opt.available;
            item.innerHTML = `
              <span class="draw-mode-icon">${opt.icon}</span>
              <span class="draw-mode-text">
                <strong>${opt.title}</strong>
                <span>${opt.available ? opt.desc : (opt.unavailableReason ?? '不可用')}</span>
              </span>
            `;
            if (opt.available) {
              item.addEventListener('click', () => {
                drawMode = opt.mode;
                list.querySelectorAll('.draw-mode-option').forEach((el) => el.classList.remove('is-selected'));
                item.classList.add('is-selected');
              });
            }
            list.appendChild(item);
          }
        }
        appendBtn('开始仪式', () => void startRitualWithMode());
        break;

      case 'loading':
        stage.innerHTML = `
          <div class="tarot-loading">
            <div class="spinner"></div>
            <p>正在唤醒牌灵…</p>
          </div>
        `;
        break;

      case 'ritual':
        stage.innerHTML = `
          <div class="ritual-enter">
            ${drawMode === 'gesture' ? '<div id="camera-slot" class="camera-slot"></div>' : ''}
            <div class="stardust" aria-hidden="true"></div>
            <p class="tarot-gesture-icon">✨</p>
            <p class="tarot-hint">${ritualHintText()}</p>
            <p class="ritual-tap-hint">轻触继续</p>
            <div class="tarot-deck is-floating" id="tarot-deck"></div>
          </div>
        `;
        syncCameraPlacement();
        break;

      case 'shuffle':
        stage.innerHTML = `
          ${drawMode === 'gesture' ? '<div id="camera-slot" class="camera-slot"></div>' : ''}
          <p class="tarot-hint">${stepHintHtml('shuffle')}</p>
          <p class="teach-hint teach-hint-soft">让问题慢慢沉下来。</p>
          <div class="tarot-deck" id="tarot-deck"></div>
        `;
        syncCameraPlacement();
        break;

      case 'cut':
        stage.innerHTML = `
          ${drawMode === 'gesture' ? '<div id="camera-slot" class="camera-slot"></div>' : ''}
          <p class="tarot-hint">${stepHintHtml('cut')}</p>
          <p class="teach-hint teach-hint-soft">把混乱切开，再轻轻合并。</p>
          <div class="tarot-deck is-cutting" id="tarot-deck"></div>
        `;
        syncCameraPlacement();
        break;

      case 'draw':
        renderDrawStage();
        break;

      case 'place':
        renderPlaceStage();
        break;

      case 'flip':
        renderFlipStage();
        break;

      case 'cardIntuition':
        renderCardIntuitionStage();
        break;

      case 'cardReview':
        // 旧路径保留：补牌等场景不再使用，直接进结果
        renderResult();
        break;

      case 'result':
        renderResult();
        break;
    }
  }

  function renderDrawStage(): void {
    renderBoardStage('draw');
  }

  function renderPlaceStage(): void {
    placeAimSlot = currentIndex;
    placeGhost = boardPlacements[currentIndex]
      ? { ...boardPlacements[currentIndex]! }
      : { x: 50, y: 48 };
    renderBoardStage('place');
    syncPlaceAimUi();
  }

  function allRevealed(): boolean {
    return (
      drawnCards.length > 0 &&
      revealedFlags.length >= drawnCards.length &&
      revealedFlags.slice(0, drawnCards.length).every(Boolean)
    );
  }

  function renderFlipStage(): void {
    renderBoardStage('flip');
    actions.innerHTML = '';
    if (!allRevealed()) {
      hintBar.setStep(ritualStep(), drawMode);
      appendBtn('全部翻开', () => void onFlipAll(), 'btn');
      return;
    }
    hintBar.setStep(null);
    fallback.setVisible(false);
    const lead = document.createElement('p');
    lead.className = 'teach-hint teach-hint-soft';
    lead.textContent = '先一眼看全盘，再写下直觉或直接进入解读。';
    actions.appendChild(lead);
    if (backgroundPromptDone) {
      appendBtn('看解读', () => void finishAfterReveal(), 'btn');
    } else {
      appendBtn('写下直觉', () => setState('cardIntuition'), 'btn');
      appendBtn('跳过，直接看解读', () => void finishAfterReveal(), 'btn btn-ghost');
    }
  }

  function renderBoardStage(phase: 'draw' | 'place' | 'flip'): void {
    boardDragUnbind?.();
    boardDragUnbind = null;

    const base = resolveActiveSpread(spreadType);
    const needSlots = Math.max(base.positions.length, cardPool.length, currentIndex + 1);
    const positions =
      needSlots <= base.positions.length
        ? base.positions
        : [
            ...base.positions,
            ...Array.from({ length: needSlots - base.positions.length }, (_, i) => ({
              key: `clarifier-${i + 1}`,
              label: cardPool[base.positions.length + i]?.position || '补牌',
              labelEn: 'Clarifier',
              meaning: '补充视角',
              teachBefore: '补一张，看清还缺的那一角。',
            })),
          ];
    const spread = { ...base, positions };
    boardPlacements = ensurePlacements(spread, boardPlacements);
    const teach = getTeachHint(spreadType, currentIndex);
    const spreadPos = spread.positions[currentIndex];
    const poolCard = cardPool[currentIndex];
    const posLabel = poolCard?.position ?? spreadPos?.label ?? `第 ${currentIndex + 1} 张`;
    const free = isFreeArrangeSpread(spreadType);
    const revealedCount = revealedFlags.filter(Boolean).length;

    stage.innerHTML = renderDeckFanHTML();
    const main = stage.querySelector('#tarot-draw-main');
    if (main) {
      const phaseHint =
        phase === 'draw'
          ? stepHintHtml('draw')
          : phase === 'place'
            ? stepHintHtml('place')
            : stepHintHtml('flip');
      const soft =
        phase === 'draw'
          ? free
            ? '抽出后用手势或手指把牌摆到阵上。'
            : '抽出后把牌放到对应阵位；全部落阵后再一起翻开。'
          : phase === 'place'
            ? free
              ? '食指在阵上移动选位置，捏合或张掌放下；也可直接点空位。'
              : '食指指向高亮空位，捏合或张掌放下；也可直接点空位。'
            : allRevealed()
              ? '全盘已开 · 先看一眼整体关系。'
              : `已翻开 ${revealedCount}/${drawnCards.length} · 点牌翻开，或全部翻开。`;
      const gestureSoft =
        drawMode === 'gesture'
          ? phase === 'draw'
            ? '左右挥手浏览牌堆；捏合抽起这张牌。'
            : phase === 'place'
              ? '食指指向阵位，捏合或张掌放下。'
              : soft
          : soft;

      const progressHint =
        phase === 'flip'
          ? `<p class="tarot-hint">全盘 ${drawnCards.length} 张 · ${allRevealed() ? '已全部翻开' : `翻开中 ${revealedCount}/${drawnCards.length}`}</p>`
          : `<p class="tarot-hint">第 ${currentIndex + 1}/${spread.positions.length} 张 · <strong>${posLabel}</strong></p>`;

      main.innerHTML = `
        ${drawMode === 'gesture' ? '<div id="camera-slot" class="camera-slot"></div>' : ''}
        ${teach && phase !== 'flip' ? `<p class="teach-hint">${teach}</p>` : ''}
        ${progressHint}
        ${renderSpreadBoardShellHtml(spread, spreadType, boardPlacements, currentIndex, phase)}
        <p class="tarot-hint">${phaseHint}</p>
        <p class="teach-hint teach-hint-soft">${gestureSoft}</p>
      `;
    }

    const fanWrap = stage.querySelector('.tarot-fan-wrap');
    if (fanWrap) {
      fanWrap.classList.toggle('is-dimmed', phase === 'flip' || phase === 'place');
      (fanWrap as HTMLElement).hidden = phase === 'flip';
    }

    boardDragUnbind = paintSpreadBoard(stage, {
      spread,
      spreadType,
      drawn: drawnCards,
      currentIndex,
      phase,
      revealedFlags,
      placements: boardPlacements,
      onPlacementChange: (index, pos) => {
        boardPlacements = boardPlacements.map((p, i) => (i === index ? pos : p));
      },
    });

    if (phase === 'place') {
      const canvas = stage.querySelector('.spread-board-canvas');
      const ghost = document.createElement('div');
      ghost.className = 'spread-place-ghost';
      ghost.dataset.placeGhost = '';
      const card = currentCard();
      if (canvas && card) {
        renderCardFace(ghost, card, false);
        canvas.appendChild(ghost);
      }
    }

    syncCameraPlacement();
  }

  function syncPlaceAimUi(): void {
    const canvas = stage.querySelector('.spread-board-canvas') as HTMLElement | null;
    const ghost = stage.querySelector<HTMLElement>('[data-place-ghost]');
    stage.querySelectorAll('.spread-board-slot').forEach((el) => {
      el.classList.toggle(
        'is-aimed',
        Number((el as HTMLElement).dataset.slotIndex) === placeAimSlot,
      );
    });
    if (!ghost || !canvas || !placeGhost) return;
    ghost.style.left = `${placeGhost.x}%`;
    ghost.style.top = `${placeGhost.y}%`;
    ghost.classList.toggle('is-ready', placeAimSlot === currentIndex || isFreeArrangeSpread(spreadType));
  }

  function nearestEmptySlot(xPct: number, yPct: number): number | null {
    const spread = resolveActiveSpread(spreadType);
    let best: number | null = null;
    let bestDist = Infinity;
    for (let i = 0; i < spread.positions.length; i += 1) {
      if (i < currentIndex) continue; // already filled earlier
      if (i > currentIndex && drawnCards[i]) continue;
      // empty slots: i >= currentIndex without card shown; prefer any empty from currentIndex onward that isn't filled
      const filled = i < currentIndex;
      if (filled) continue;
      // only allow current next for fixed; free can aim any remaining
      if (!isFreeArrangeSpread(spreadType) && i !== currentIndex) continue;
      const p = boardPlacements[i] ?? { x: 50, y: 50 };
      const d = Math.hypot(p.x - xPct, p.y - yPct);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return bestDist <= 22 ? best : currentIndex;
  }

  function escapePreReading(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function supplementThemeLabel(q: string): string {
    if (/面试|应聘|offer|求职|复试/i.test(q)) return '面试求职';
    const labels = {
      work: '工作方向',
      love: '感情关系',
      study: '学业成长',
      self: '自我状态',
    } as const;
    return labels[detectQuestionTheme(q)];
  }

  function renderChipGroupsHtml(
    groups: ChipGroup[],
    field: 'bg' | 'feel',
  ): string {
    return groups
      .map(
        (g) => `
      <div class="pre-chip-group" data-chip-field="${field}">
        <p class="pre-chip-group-label">${escapePreReading(g.label)}</p>
        <div class="pre-chip-row" role="group" aria-label="${escapePreReading(g.label)}">
          ${g.chips
            .map(
              (c) =>
                `<button type="button" class="pre-chip" data-chip="${escapePreReading(c)}">${escapePreReading(c)}</button>`,
            )
            .join('')}
        </div>
      </div>`,
      )
      .join('');
  }

  function syncChipActiveState(
    root: HTMLElement,
    field: 'bg' | 'feel',
    text: string,
  ): void {
    root.querySelectorAll<HTMLButtonElement>(`.pre-chip-group[data-chip-field="${field}"] .pre-chip`).forEach((btn) => {
      const chip = btn.dataset.chip ?? '';
      btn.classList.toggle('is-active', textHasChip(text, chip));
    });
  }

  function bindChipGroups(
    root: HTMLElement,
    field: 'bg' | 'feel',
    input: HTMLTextAreaElement,
  ): void {
    root.querySelectorAll<HTMLButtonElement>(`.pre-chip-group[data-chip-field="${field}"] .pre-chip`).forEach((btn) => {
      btn.addEventListener('click', () => {
        const chip = btn.dataset.chip ?? '';
        if (!chip) return;
        input.value = toggleChipInText(input.value, chip);
        syncChipActiveState(root, field, input.value);
        input.focus();
      });
    });
    input.addEventListener('input', () => {
      syncChipActiveState(root, field, input.value);
    });
    syncChipActiveState(root, field, input.value);
  }

  /** 全翻后：一眼全盘 → 一句直觉（可标焦点牌或整阵） */
  function renderCardIntuitionStage(): void {
    const showBackground = !backgroundPromptDone;
    const bgGroups = backgroundChipGroups(question);
    const feelGroups = intuitionChipGroups(question);
    intuitionFocus = intuitionFocus ?? null;

    const focusChips = [
      `<button type="button" class="pre-chip intuition-focus-chip${intuitionFocus == null ? ' is-active' : ''}" data-focus="all">整阵</button>`,
      ...drawnCards.map((c, i) => {
        const label = c.position || `第 ${i + 1} 张`;
        const active = intuitionFocus === i ? ' is-active' : '';
        return `<button type="button" class="pre-chip intuition-focus-chip${active}" data-focus="${i}">${escapePreReading(label)}</button>`;
      }),
    ].join('');

    actions.innerHTML = '';
    stage.innerHTML = `
      <div class="card-intuition-stage">
        <h2 class="section-title">全盘翻开 · 先听自己</h2>
        <p class="tarot-hint">先一眼看过全阵，再写一句直觉；也可点选焦点牌。</p>
        <div class="intuition-board-mini" data-intuition-board></div>
        <div class="intuition-focus-row" role="group" aria-label="直觉焦点">${focusChips}</div>

        ${
          showBackground
            ? `<section class="pre-block" data-pre-block="bg">
          <h3 class="pre-block-title">当下情况 <span class="pre-optional">可选</span></h3>
          <p class="teach-hint teach-hint-soft">补充一句处境，解读会更贴你；点选或手写都行。</p>
          ${renderProfileContextBarHtml('tarot-profile')}
          ${renderChipGroupsHtml(bgGroups, 'bg')}
          <label class="pre-reading-label" for="pre-reading-bg">也可以自己写</label>
          <textarea id="pre-reading-bg" class="question-input" rows="2" placeholder="例如：刚离职 / 已面了 3 家…">${escapePreReading(questionBackground)}</textarea>
        </section>`
            : ''
        }

        <section class="pre-block" data-pre-block="feel">
          <h3 class="pre-block-title">你的第一直觉 <span class="pre-optional">可选</span></h3>
          <p class="teach-hint teach-hint-soft">对焦点牌或整阵，心里第一个念头是什么？</p>
          ${renderChipGroupsHtml(feelGroups, 'feel')}
          <label class="pre-reading-label" for="card-intuition-input">也可以自己写</label>
          <textarea id="card-intuition-input" class="question-input" rows="3" placeholder="例如：整阵偏紧、中间那张在防守…"></textarea>
        </section>

        <p class="intuition-status" hidden>正在生成解读…</p>
      </div>
    `;

    const boardHost = stage.querySelector<HTMLElement>('[data-intuition-board]');
    if (boardHost) {
      boardHost.innerHTML = drawnCards
        .map((card, i) => {
          const orient = card.reversed ? '逆' : '正';
          return `<div class="intuition-mini-card" data-mini="${i}" title="${escapePreReading(card.position || String(i + 1))}">
            <div class="intuition-mini-face" data-mini-face="${i}"></div>
            <span class="intuition-mini-label">${escapePreReading(card.position || String(i + 1))} · ${orient}</span>
          </div>`;
        })
        .join('');
      drawnCards.forEach((card, i) => {
        const face = boardHost.querySelector<HTMLElement>(`[data-mini-face="${i}"]`);
        if (face) renderCardFace(face, card, true);
      });
    }

    stage.querySelectorAll<HTMLButtonElement>('.intuition-focus-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const raw = btn.dataset.focus;
        intuitionFocus = raw === 'all' || raw == null ? null : Number(raw);
        stage.querySelectorAll('.intuition-focus-chip').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });

    let profileBar: ReturnType<typeof bindProfileContextBar> | null = null;
    const bgEl = document.getElementById('pre-reading-bg') as HTMLTextAreaElement | null;
    if (showBackground && bgEl) {
      profileBar = bindProfileContextBar(stage, {
        idPrefix: 'tarot-profile',
        onChange: (use) => {
          if (use) bgEl.value = mergeReadingBackground(bgEl.value, true);
          syncChipActiveState(stage, 'bg', bgEl.value);
        },
      });
      if (profileBar.getUseProfile() && !bgEl.value.trim()) {
        bgEl.value = profileBar.getContextText();
      }
      bindChipGroups(stage, 'bg', bgEl);
    }

    const feelEl = document.getElementById(
      'card-intuition-input',
    ) as HTMLTextAreaElement | null;
    if (feelEl) bindChipGroups(stage, 'feel', feelEl);

    const commitBackground = (raw: string, useProfile: boolean) => {
      questionBackground = mergeReadingBackground(raw.trim(), useProfile);
      backgroundPromptDone = true;
    };

    const finish = (intuitionText: string, skipAll: boolean) => {
      if (showBackground) {
        if (skipAll) {
          commitBackground('', Boolean(profileBar?.getUseProfile()));
        } else {
          commitBackground(bgEl?.value ?? '', Boolean(profileBar?.getUseProfile()));
        }
      }
      void goToResultAfterIntuition(skipAll ? '' : intuitionText);
    };

    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'btn btn-ghost';
    skipBtn.textContent = '跳过，直接看解读';
    skipBtn.addEventListener('click', () => finish('', true));

    const goBtn = document.createElement('button');
    goBtn.type = 'button';
    goBtn.className = 'btn';
    goBtn.textContent = '写下后看解读';
    goBtn.addEventListener('click', () => finish(feelEl?.value ?? '', false));

    actions.append(skipBtn, goBtn);
  }

  function ensureJournalSaved(): string | null {
    if (!reading || drawnCards.length === 0) return currentJournalId;
    learningNote = learningNote || buildLearningNote(spreadType, question);
    const entry = saveJournalEntry(
      question,
      spreadType,
      drawnCards,
      reading,
      learningNote,
      '',
      currentJournalId,
    );
    currentJournalId = entry.id;
    return entry.id;
  }

  function savePartialProgress(): void {
    if (drawnCards.length === 0 || !question) return;
    if (state === 'result') return;

    const entry = upsertJournalProgress(
      currentJournalId,
      question,
      spreadType,
      drawnCards,
      reading,
      'partial',
      cardPool.length,
    );
    currentJournalId = entry.id;
  }

  const onPageHide = (): void => savePartialProgress();

  function renderResult(): void {
    if (!reading) return;

    questionRewrite?.destroy();
    questionRewrite = null;

    const journalId = ensureJournalSaved();
    if (resultView !== 'overall' && typeof resultView === 'number') {
      if (resultView < 0 || resultView >= reading.cards.length) resultView = 'overall';
    }

    const switcherBtns = [
      `<button type="button" class="reading-switch-btn${resultView === 'overall' ? ' is-active' : ''}" data-view="overall">整体</button>`,
      ...reading.cards.map((c, i) => {
        const label = c.position || c.cardName || `牌 ${i + 1}`;
        return `<button type="button" class="reading-switch-btn${resultView === i ? ' is-active' : ''}" data-view="${i}">${escapePreReading(label)}</button>`;
      }),
    ].join('');

    actions.innerHTML = '';
    stage.innerHTML = `
      <h2 class="section-title">占问结果</h2>
      <p class="tarot-hint">先看整体，再按位置切换细读 · 新牌已收入图鉴</p>
      <nav class="reading-switcher" aria-label="解读切换">${switcherBtns}</nav>
      <div class="result-panel" id="result-cards">
        <div id="reading-switch-panel"></div>
        <div class="learning-card">
          <h3>写下此刻的感悟</h3>
          <textarea id="result-reflection" class="question-input" rows="3" placeholder="这次占问，你想记住什么？"></textarea>
        </div>
        <div class="result-rewrite-block">
          <button type="button" class="result-rewrite-trigger">
            对结果有疑问？可能是问法不对 — 让 AI 帮你改问
          </button>
        </div>
      </div>
    `;

    const paintPanel = (): void => {
      const panel = document.getElementById('reading-switch-panel');
      if (!panel || !reading) return;
      stage.querySelectorAll('.reading-switch-btn').forEach((btn) => {
        const v = (btn as HTMLElement).dataset.view;
        const active =
          v === 'overall' ? resultView === 'overall' : Number(v) === resultView;
        btn.classList.toggle('is-active', active);
      });

      if (resultView === 'overall') {
        const tip = reading.userIntuition?.trim();
        const focusNote =
          tip && reading.intuitionFocusIndex != null
            ? `（焦点：${reading.cards[reading.intuitionFocusIndex]?.position ?? '该牌'}）`
            : tip
              ? '（整阵）'
              : '';
        panel.innerHTML = `
          <div class="reading-overall">
            ${
              tip
                ? `<p class="overall-intuition"><span class="overall-intuition-label">你的直觉${focusNote}</span>${escapePreReading(tip)}</p>`
                : ''
            }
            <p class="result-summary">${escapePreReading(reading.summary)}</p>
            <div class="overall-jumps" role="list">
              ${reading.cards
                .map((c, i) => {
                  const one =
                    c.interpretationLayers.answerTendency?.oneLiner?.trim() ||
                    c.interpretationLayers.standard.oneSentence;
                  const hot =
                    c.interpretationLayers.contextualSections?.find(
                      (s) =>
                        s.title.includes('热点') ||
                        s.title.includes('整体') ||
                        s.title.includes('核心'),
                    )?.body;
                  const line = hot?.trim() || one;
                  return `<button type="button" class="overall-card-jump" data-jump="${i}">
                    <span class="overall-pos">${escapePreReading(c.position)}</span>
                    <strong class="overall-name">${escapePreReading(c.cardName)}</strong>
                    <span class="overall-line">${escapePreReading(line)}</span>
                  </button>`;
                })
                .join('')}
            </div>
          </div>`;
        panel.querySelectorAll<HTMLButtonElement>('.overall-card-jump').forEach((btn) => {
          btn.addEventListener('click', () => {
            resultView = Number(btn.dataset.jump);
            paintPanel();
          });
        });
      } else {
        const i = resultView;
        const cardReading = reading.cards[i];
        panel.innerHTML = `<div class="result-card-item" data-card-id="${cardReading?.cardId ?? ''}"><div class="result-tabs-host"></div></div>`;
        const host = panel.querySelector('.result-tabs-host') as HTMLElement | null;
        if (host && cardReading) {
          mountCardResultTabs(host, cardReading, 'reading', {
            onCardReadingChange: (updated) => {
              if (!reading) return;
              reading.cards[i] = updated;
              if (updated.interpretationProvider === 'llm') {
                reading.provider = 'llm';
              }
              ensureJournalSaved();
            },
          });
        }
      }
    };

    stage.querySelectorAll<HTMLButtonElement>('.reading-switch-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.view;
        resultView = v === 'overall' || v == null ? 'overall' : Number(v);
        paintPanel();
      });
    });
    paintPanel();

    const reflectionEl = document.getElementById('result-reflection') as HTMLTextAreaElement | null;
    if (reflectionEl && journalId) {
      reflectionEl.addEventListener('input', () => {
        updateJournalReflection(journalId, reflectionEl.value.trim());
      });
    }

    questionRewrite = mountQuestionRewritePanel({
      source: 'result',
      getQuestion: () => question,
      onApply: (q) => {
        question = q;
      },
      onRestartWithQuestion: (q) => restartWithQuestion(q),
    });
    stage.querySelector('.result-rewrite-trigger')?.addEventListener('click', () => {
      questionRewrite?.open();
    });

    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'btn';
    shareBtn.textContent = '保存心意卡片';
    shareBtn.addEventListener('click', () => void downloadShareCard(drawnCards, reading!, question));

    const codexBtn = document.createElement('button');
    codexBtn.type = 'button';
    codexBtn.className = 'btn btn-secondary';
    codexBtn.textContent = '查看图鉴';
    codexBtn.addEventListener('click', () => navigate('/tarot/tujian'));

    const journalBtn = document.createElement('button');
    journalBtn.type = 'button';
    journalBtn.className = 'btn btn-ghost';
    journalBtn.textContent = '查看手札';
    journalBtn.addEventListener('click', () => navigate('/journal'));

    const crossBtn = document.createElement('button');
    crossBtn.type = 'button';
    crossBtn.className = 'btn btn-secondary';
    crossBtn.textContent = '也用小六壬看一眼';
    crossBtn.addEventListener('click', () => {
      stashCrossAskQuestion(question);
      navigate('/xiaoliuren/reading');
    });

    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'btn btn-ghost';
    retryBtn.textContent = '再占一次';
    retryBtn.addEventListener('click', () => resetSession());

    const resultActions = document.createElement('div');
    resultActions.className = 'result-actions';
    resultActions.append(shareBtn, codexBtn, journalBtn, crossBtn, retryBtn);

    if (supplementCount < MAX_SUPPLEMENT) {
      const theme = supplementThemeLabel(question);
      const supplementBtn = document.createElement('button');
      supplementBtn.type = 'button';
      supplementBtn.className = 'btn btn-ghost';
      supplementBtn.textContent = '补一张建议/行动牌';
      supplementBtn.addEventListener('click', () => void onRequestSupplement());
      resultActions.appendChild(supplementBtn);
      const hint = document.createElement('p');
      hint.className = 'supplement-guide-hint';
      hint.textContent = `如果还不够清晰，可针对【${theme}】再补一张`;
      actions.appendChild(resultActions);
      actions.appendChild(hint);
    } else {
      actions.appendChild(resultActions);
    }

    hintBar.setStep(null);
    fallback.setVisible(false);
    cameraWrap.hidden = true;
    gestureStatus.el.hidden = true;
  }

  function appendBtn(label: string, onClick: () => void, className = 'btn'): void {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    actions.appendChild(btn);
  }


  function resetSession(): void {
    drawnCards = [];
    cardPool = [];
    currentIndex = 0;
    revealedFlags = [];
    intuitionFocus = null;
    resultView = 'overall';
    supplementCount = 0;
    reading = null;
    learningNote = '';
    questionBackground = '';
    backgroundPromptDone = false;
    currentJournalId = null;
    setSessionCustomPositions(null);
    boardPlacements = [];
    boardDragUnbind?.();
    boardDragUnbind = null;
    questionRewrite?.destroy();
    questionRewrite = null;
    drawMode = defaultDrawMode(inputCaps);
    motionEnabled = false;
    gestureBridge?.stop();
    gestureBridge = null;
    camera.stop();
    cameraOn = false;
    gestureFallback = !env.canUseGesture;
    setState('landing');
  }

  /** 结果页采用新问法后，保留问题并回到选牌阵 */
  function restartWithQuestion(nextQuestion: string): void {
    question = nextQuestion.trim();
    drawnCards = [];
    cardPool = [];
    currentIndex = 0;
    revealedFlags = [];
    intuitionFocus = null;
    resultView = 'overall';
    supplementCount = 0;
    reading = null;
    learningNote = '';
    questionBackground = '';
    backgroundPromptDone = false;
    currentJournalId = null;
    setSessionCustomPositions(null);
    boardPlacements = [];
    boardDragUnbind?.();
    boardDragUnbind = null;
    drawMode = defaultDrawMode(inputCaps);
    motionEnabled = false;
    gestureBridge?.stop();
    gestureBridge = null;
    camera.stop();
    cameraOn = false;
    gestureFallback = !env.canUseGesture;
    setState(question ? 'spread' : 'question');
  }

  async function startRitualWithMode(): Promise<void> {
    const selected = getDrawModeOptions(inputCaps).find((o) => o.mode === drawMode);
    if (!selected?.available) {
      drawMode = defaultDrawMode(inputCaps);
    }

    if (drawMode === 'gesture') {
      await beginGestureRitual();
      return;
    }

    if (drawMode === 'free' && inputCaps.hasMotion) {
      motionEnabled = await requestMotionPermission();
    }

    cardPool = drawSpread(spreadType);
    gestureFallback = false;
    cameraOn = false;
    setState('ritual');
  }

  async function startGesturePipeline(video: HTMLVideoElement): Promise<boolean> {
    if (!env.canUseGesture) {
      gestureFallback = true;
      return false;
    }
    try {
      gestureBridge?.stop();
      gestureBridge = new GestureBridge({
        onGesture: handleNamedGesture,
        onFrame: handleFrame,
        onUpdate: (ev) => {
          const ritualActive = ['ritual', 'shuffle', 'cut', 'draw', 'place', 'flip'].includes(state);
          if (!ritualActive) return;
          gestureStatus.update(ev.handCount, ev.gesture, ev.confidence, true);
          if (state === 'ritual' && ev.recognized) {
            if (heldPalm.update(ev.recognized, ['Open_Palm', 'ILoveYou'])) {
              void onRitualEnter();
            }
          }
          debug?.update({
            gesture: ev.gesture ?? '无',
            handCount: ev.handCount,
            fps: ev.fps,
            confidence: ev.confidence,
          });
        },
        onError: (msg, stage) => {
          gestureFallback = true;
          const hint =
            stage === 'wasm'
              ? '（WASM 运行库）'
              : stage === 'model'
                ? '（模型文件）'
                : '';
          gestureStatus.setMessage(`手势加载失败${hint}：${msg}`);
          syncHintBar();
        },
      });
      await gestureBridge.init();
      gestureBridge.start(video);
      gestureFallback = false;
      return true;
    } catch (err) {
      gestureFallback = true;
      const msg = err instanceof Error ? err.message : '手势初始化失败';
      gestureStatus.setMessage(`手势模型加载失败：${msg}`);
      syncHintBar();
      return false;
    }
  }

  async function resumeGestureRitual(): Promise<void> {
    if (drawMode !== 'gesture' || env.shouldBlockCamera || cameraOn) return;

    gestureStatus.setMessage('正在恢复摄像头与手势…');
    const camResult = await camera.start(cameraWrap);
    if (!camResult.ok) {
      gestureFallback = true;
      cameraOn = false;
      syncHintBar();
      bindRitualInputs();
      return;
    }

    cameraOn = true;
    cameraWrap.hidden = false;
    await startGesturePipeline(camResult.video);
    syncCameraPlacement();
    syncHintBar();
    bindRitualInputs();
  }

  async function beginGestureRitual(): Promise<void> {
    if (env.shouldBlockCamera) {
      drawMode = 'touch';
      cardPool = drawSpread(spreadType);
      gestureFallback = false;
      setState('ritual');
      return;
    }

    setState('loading');
    const camResult = await camera.start(cameraWrap);
    if (!camResult.ok) {
      drawMode = 'touch';
      gestureFallback = false;
      cardPool = drawSpread(spreadType);
      setState('loading');
      stage.innerHTML = `
        <div class="error-box">${camResult.message}</div>
        <p class="tarot-hint" style="margin-top:12px">已为你切换为触屏抽牌</p>
      `;
      appendBtn('触屏模式继续', () => {
        camera.stop();
        cameraOn = false;
        setState('ritual');
      });
      return;
    }

    cameraWrap.hidden = false;
    cameraOn = true;
    cardPool = drawSpread(spreadType);
    gestureStatus.setMessage('正在加载手势模型…');

    if (env.canUseGesture) {
      await startGesturePipeline(camResult.video);
    } else {
      gestureFallback = true;
      gestureStatus.setMessage('当前环境不支持手势识别，请用触屏或辅助按钮');
    }

    setState('ritual');
  }

  function handleNamedGesture(gesture: string | null): void {
    if (state === 'ritual' && (gesture === 'Open_Palm' || gesture === 'ILoveYou')) {
      void onRitualEnter();
    }
    if (state === 'shuffle' && gesture === 'Closed_Fist') void onShuffle();
    if (state === 'place' && gesture === 'Open_Palm') void onPlaceDrop();
    if (state === 'result' && gesture === 'Open_Palm') hintBar.setStep('end');
  }

  function handleFrame(payload: import('../core/gesture-worker.ts').GestureResultPayload): void {
    const hand = payload.landmarks?.[0] ?? null;
    const wrist = hand?.[0] ?? null;

    if (state === 'ritual' && joinedPalms.update(payload.landmarks)) {
      void onRitualEnter();
      return;
    }

    if (state === 'cut' && wrist) {
      const dir = swipeDetector.update(wrist);
      if (dir === 'left' || dir === 'right') void onCut();
      return;
    }

    if (state === 'place' && hand) {
      const tip = hand[8];
      if (tip) {
        // 镜像：摄像头右 → 屏幕左
        const x = (1 - tip.x) * 100;
        const y = tip.y * 100;
        placeGhost = {
          x: Math.min(92, Math.max(8, x)),
          y: Math.min(90, Math.max(10, y)),
        };
        placeAimSlot = nearestEmptySlot(placeGhost.x, placeGhost.y);
        syncPlaceAimUi();
        if (placeAimSlot === currentIndex || isFreeArrangeSpread(spreadType)) {
          hintBar.setProgress('对准了 · 捏合或张掌放下');
        } else {
          hintBar.setProgress('把食指移向高亮阵位');
        }
      }
      const pinch = pinchDetector.update(hand);
      if (pinch === 'pinching') {
        hintBar.setProgress('放下中…');
        return;
      }
      if (pinch === 'confirmed') {
        void onPlaceDrop();
      }
      return;
    }

    if (state === 'draw' && hand) {
      const pinch = pinchDetector.update(hand);
      if (pinch === 'pinching') {
        hintBar.setProgress('捏合中…保持稳定');
        swipeDetector.reset();
        return;
      }
      if (pinch === 'confirmed') {
        void onDraw();
        return;
      }
      // 摄像头画面镜像：手腕右移 ≈ 屏幕上左滑 → 下一张
      const dir = swipeDetector.update(wrist);
      if (dir === 'left') {
        deckFan?.shiftSelection(1);
        hintBar.setProgress('继续挥手浏览牌堆');
      } else if (dir === 'right') {
        deckFan?.shiftSelection(-1);
        hintBar.setProgress('继续挥手浏览牌堆');
      }
      return;
    }
  }

  function handleFallback(action: FallbackAction): void {
    switch (action) {
      case 'ritual': void onRitualEnter(); break;
      case 'shuffle': void onShuffle(); break;
      case 'cut': void onCut(); break;
      case 'draw': void onDraw(); break;
      case 'place': void onPlaceDrop(); break;
      case 'flip': void onFlip(); break;
      case 'zoom_in':
      case 'zoom_out':
      case 'confirm':
      case 'end': break;
    }
  }

  async function onRitualEnter(): Promise<void> {
    if (state !== 'ritual') return;
    setState('shuffle');
  }

  async function onShuffle(): Promise<void> {
    if (state !== 'shuffle') return;
    const deck = document.getElementById('tarot-deck');
    if (deck) await runShuffleAnimation(deck);
    setState('cut');
  }

  async function onCut(): Promise<void> {
    if (state !== 'cut') return;
    await wait(600);
    currentIndex = 0;
    drawnCards = [];
    revealedFlags = [];
    setState('draw');
  }

  /** 落阵后：继续抽下一张，或进入全翻 */
  function advanceAfterPlaced(): void {
    revealedFlags = drawnCards.map((_, i) => revealedFlags[i] ?? false);
    if (currentIndex < cardPool.length - 1) {
      currentIndex++;
      setState('draw');
      return;
    }
    // 补牌路径：仅新牌未翻；首轮全部未翻
    if (backgroundPromptDone) {
      revealedFlags = drawnCards.map((_, i) => i < currentIndex);
    } else {
      revealedFlags = drawnCards.map(() => false);
    }
    setState('flip');
  }

  async function onDraw(): Promise<void> {
    if (state !== 'draw' || drawLock) return;
    const card = cardPool[currentIndex];
    if (!card) return;
    drawLock = true;
    drawnCards.push(card);
    revealedFlags = drawnCards.map((_, i) => revealedFlags[i] ?? false);

    if (!currentJournalId) {
      const draft = upsertJournalProgress(
        null,
        question,
        spreadType,
        drawnCards,
        reading,
        'partial',
        cardPool.length,
      );
      currentJournalId = draft.id;
    }

    const unlock = unlockSingleCard(card, question, card.card.nameZh, currentJournalId);
    showUnlockToast(unlock);

    hintBar.setProgress('抽牌成功');
    await wait(400);
    // 手势模式：先摆阵；触屏/随心：直接落位后继续抽或进入全翻
    if (drawMode === 'gesture') {
      setState('place');
    } else {
      advanceAfterPlaced();
    }
  }

  async function onPlaceDrop(): Promise<void> {
    if (state !== 'place') return;
    const target =
      placeAimSlot != null &&
      (isFreeArrangeSpread(spreadType) || placeAimSlot === currentIndex)
        ? placeAimSlot
        : currentIndex;

    if (isFreeArrangeSpread(spreadType) && placeGhost) {
      boardPlacements = boardPlacements.map((p, i) =>
        i === currentIndex ? { x: placeGhost!.x, y: placeGhost!.y } : p,
      );
    } else if (boardPlacements[target]) {
      boardPlacements = boardPlacements.map((p, i) =>
        i === currentIndex ? { ...boardPlacements[target]! } : p,
      );
    }

    placeAimSlot = null;
    placeGhost = null;
    hintBar.setProgress('已放到阵位');
    advanceAfterPlaced();
  }

  function resolveFlipTargetIndex(): number {
    const raw = stage.dataset.flipTarget;
    delete stage.dataset.flipTarget;
    if (raw != null && raw !== '') {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0 && n < drawnCards.length && !revealedFlags[n]) {
        return n;
      }
    }
    return revealedFlags.findIndex((r, i) => i < drawnCards.length && !r);
  }

  async function revealCardAt(index: number): Promise<void> {
    if (index < 0 || index >= drawnCards.length || revealedFlags[index]) return;
    const host = stage.querySelector<HTMLElement>(`[data-card-host="${index}"]`);
    if (host) {
      host.classList.add('is-flipping');
      await wait(420);
      const card = drawnCards[index];
      if (card) renderCardFace(host, card, true);
      host.querySelector('.tarot-card')?.classList.add('is-board-card');
      host.classList.remove('is-flipping', 'tarot-slot-single', 'is-revealable');
    }
    revealedFlags = revealedFlags.map((r, i) => (i === index ? true : r));
  }

  async function onFlip(): Promise<void> {
    if (state !== 'flip' || allRevealed()) return;
    const idx = resolveFlipTargetIndex();
    if (idx < 0) return;
    await revealCardAt(idx);
    renderFlipStage();
    bindRitualInputs();
  }

  async function onFlipAll(): Promise<void> {
    if (state !== 'flip') return;
    for (let i = 0; i < drawnCards.length; i += 1) {
      if (!revealedFlags[i]) await revealCardAt(i);
    }
    renderFlipStage();
    bindRitualInputs();
  }

  async function interpretAllDrawn(): Promise<void> {
    const provider = createInterpretationProvider();
    const next = await provider.interpret(drawnCards, question, spreadType, {
      background: questionBackground,
    });
    const prevCards = reading?.cards ?? [];
    reading = {
      ...next,
      userIntuition: reading?.userIntuition,
      intuitionFocusIndex: reading?.intuitionFocusIndex,
      questionBackground: questionBackground || next.questionBackground,
      cards: next.cards.map((c, i) => ({
        ...c,
        userIntuition: prevCards[i]?.userIntuition ?? c.userIntuition,
        intuitionCompare: prevCards[i]?.intuitionCompare ?? c.intuitionCompare,
      })),
    };
  }

  async function finalizeReadingSummary(): Promise<void> {
    learningNote = learningNote || buildLearningNote(spreadType, question);
    if (!reading) return;
    const cardIds = drawnCards.map((d) => d.card.id);
    if (!readingCoversDrawn(reading, cardIds)) {
      await interpretAllDrawn();
    }
    if (!reading) return;
    reading = {
      ...reading,
      learningNote,
      questionBackground: questionBackground || reading.questionBackground,
      summary:
        reading.summary ||
        (drawnCards.length === 1
          ? `「${reading.cards[0]?.cardName ?? ''}」已加入你的图鉴。答案不在牌里，在你心里。`
          : `「${reading.cards.map((c) => c.cardName).join('、')}」共同描绘这次占问的脉络。新牌已解锁图鉴，可随时回看。`),
    };
  }

  function applySpreadIntuition(tip: string): void {
    if (!reading) return;
    const trimmed = tip.trim();
    reading.userIntuition = trimmed || undefined;
    reading.intuitionFocusIndex =
      intuitionFocus != null && Number.isFinite(intuitionFocus) ? intuitionFocus : undefined;
    if (!trimmed) return;
    const focusIdx =
      reading.intuitionFocusIndex != null && reading.cards[reading.intuitionFocusIndex]
        ? reading.intuitionFocusIndex
        : 0;
    const base = reading.cards[focusIdx];
    if (!base) return;
    reading.cards[focusIdx] = {
      ...base,
      userIntuition: trimmed,
      intuitionCompare: buildIntuitionCompare(base, trimmed),
    };
  }

  /** 全翻后（跳过直觉或补牌后）→ 结果 */
  async function finishAfterReveal(): Promise<void> {
    const isSupplement = Boolean(reading?.cards.length && backgroundPromptDone);
    actions.querySelectorAll('button').forEach((b) => {
      (b as HTMLButtonElement).disabled = true;
    });
    try {
      await interpretAllDrawn();
      if (!isSupplement) {
        backgroundPromptDone = true;
        applySpreadIntuition('');
      }
      await finalizeReadingSummary();
      currentJournalId = ensureJournalSaved();
      if (isSupplement) {
        resultView = Math.max(0, drawnCards.length - 1);
        setState('result');
        return;
      }
      resultView = 'overall';
      showRitualCompleteModal(reading!, () => setState('result'));
    } catch (err) {
      console.warn('[tarot] finish after reveal failed', err);
      actions.querySelectorAll('button').forEach((b) => {
        (b as HTMLButtonElement).disabled = false;
      });
    }
  }

  async function goToResultAfterIntuition(raw: string): Promise<void> {
    const status = document.querySelector<HTMLElement>('.intuition-status');
    const buttons = actions.querySelectorAll<HTMLButtonElement>('button');
    buttons.forEach((b) => {
      b.disabled = true;
    });
    if (status) {
      status.hidden = false;
      status.textContent = '正在生成解读…';
    }
    try {
      if (pendingInterpret) {
        await pendingInterpret;
        pendingInterpret = null;
      }
      await interpretAllDrawn();
      applySpreadIntuition(raw);
      await finalizeReadingSummary();
      currentJournalId = ensureJournalSaved();
      resultView = 'overall';
      showRitualCompleteModal(reading!, () => setState('result'));
    } catch (err) {
      console.warn('[tarot] intuition → result failed', err);
      buttons.forEach((b) => {
        b.disabled = false;
      });
      if (status) {
        status.textContent = '解读生成失败，请再试一次或跳过';
      }
    }
  }

  async function onRequestSupplement(): Promise<void> {
    if (state !== 'result' || supplementCount >= MAX_SUPPLEMENT) return;
    const excludeIds = drawnCards.map((d) => d.card.id);
    const clarifier = drawClarifierCard(excludeIds);
    if (!clarifier) return;
    cardPool.push(clarifier);
    supplementCount++;
    currentIndex = drawnCards.length;
    savePartialProgress();
    setState('draw');
  }

  renderStage();
  syncHintBar();

  window.addEventListener('pagehide', onPageHide);

  return () => {
    savePartialProgress();
    window.removeEventListener('pagehide', onPageHide);
    questionCoach?.destroy();
    questionRewrite?.destroy();
    boardDragUnbind?.();
    ritualInputUnbind?.();
    gestureBridge?.stop();
    camera.stop();
    unbindCamera();
    debug?.el.remove();
    hintBar.el.remove();
  };
}
