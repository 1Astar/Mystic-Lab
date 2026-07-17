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
import { mountCardResultTabs } from '../ui/card-result-tabs.ts';
import { showRitualCompleteModal } from '../ui/ritual-complete-modal.ts';
import { showUnlockToast } from '../ui/unlock-toast.ts';
import { saveJournalEntry, updateJournalReflection, upsertJournalProgress } from '../journal/records.ts';
import { navigate } from '../router.ts';
import { downloadShareCard } from '../share/card-renderer.ts';
import { renderCardFace, runShuffleAnimation, wait } from '../tarot/animations.ts';
import { renderDeckFanHTML, type DeckFanHandle } from '../ui/tarot-deck-fan.ts';
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
  SPREADS,
  buildLearningNote,
  drawSpread,
  getTeachHint,
  type SpreadType,
} from '../tarot/spreads.ts';
import { mountEnvBanner } from '../ui/banner.ts';
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
  | 'flip'
  | 'preReading'
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
  let reading: ReadingResult | null = null;
  let learningNote = '';
  let questionBackground = '';
  let backgroundPromptDone = false;
  let gestureFallback = !env.canUseGesture;
  let cameraOn = false;
  let supplementCount = 0;
  const MAX_SUPPLEMENT = 2;
  /** 当前牌解读的后台 Promise（直觉页期间预跑） */
  let pendingInterpret: Promise<void> | null = null;

  const pinchDetector = new PinchDetector();
  const swipeDetector = new SwipeDetector();
  const joinedPalms = new JoinedPalmsDetector();
  const heldPalm = new HeldGestureDetector();
  let deckFan: DeckFanHandle | null = null;

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
  document.body.appendChild(hintBar.el);

  function ritualStep(): RitualStep | null {
    const ritualStates = ['ritual', 'shuffle', 'cut', 'draw', 'flip'] as const;
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
    if (state === 'cardReview' || state === 'result' || state === 'preReading' || state === 'cardIntuition') {
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
    if (next === 'cardReview' || next === 'result' || next === 'preReading' || next === 'cardIntuition') {
      pauseCameraForReview();
    }
    syncHintBar();
    renderStage();
    bindRitualInputs();
    if (
      drawMode === 'gesture' &&
      ['draw', 'flip', 'shuffle', 'cut'].includes(next) &&
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
      return;
    }
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

  function stepHintHtml(step: 'shuffle' | 'cut' | 'draw' | 'flip'): string {
    const touch: Record<string, string> = {
      shuffle: '<strong>滑动或画圈</strong>洗牌',
      cut: '<strong>横划</strong>切牌',
      draw: '<strong>左右滑动</strong>选牌 · <strong>上滑或长按</strong>抽出',
      flip: '<strong>上滑</strong>翻开牌面',
    };
    const gesture: Record<string, string> = {
      shuffle: '<strong>手掌收起</strong>并轻晃',
      cut: '<strong>左右挥手</strong>切牌',
      draw: '<strong>左右挥手</strong>浏览牌堆 · <strong>拇指食指捏合</strong>抽牌（也可点/上滑牌堆）',
      flip: '<strong>手掌上翻</strong>，翻开牌面',
    };
    const free: Record<string, string> = {
      shuffle: '摇一摇，或<strong>画一个圈</strong>',
      cut: '再摇一次，或<strong>横划一条线</strong>',
      draw: '<strong>左右滑动</strong>选牌 · <strong>上滑或长按</strong>抽出',
      flip: '<strong>上滑</strong>翻开牌面',
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
          for (const spread of Object.values(SPREADS)) {
            const card = document.createElement('div');
            card.className = `spread-option-wrap ${spread.type === spreadType ? 'is-selected' : ''}`;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'spread-option';
            btn.innerHTML = `
              <strong>${spread.name}</strong>
              <span class="spread-light">${spread.lightHint}</span>
            `;
            btn.addEventListener('click', () => {
              spreadType = spread.type;
              list.querySelectorAll('.spread-option-wrap').forEach((el) => el.classList.remove('is-selected'));
              card.classList.add('is-selected');
            });

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
            list.appendChild(card);
          }
        }
        appendBtn('← 返回修改问题', () => setState('question'), 'btn btn-ghost');
        appendBtn('下一步 · 选择抽牌方式', () => setState('modeSelect'));
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

      case 'flip':
        renderFlipStage(false);
        break;

      case 'preReading':
        renderPreReadingStage();
        break;

      case 'cardIntuition':
        renderCardIntuitionStage();
        break;

      case 'cardReview':
        renderCardReviewStage();
        break;

      case 'result':
        renderResult();
        break;
    }
  }

  function renderDrawStage(): void {
    const teach = getTeachHint(spreadType, currentIndex);
    const spreadPos = SPREADS[spreadType].positions[currentIndex];
    const poolCard = cardPool[currentIndex];
    const posLabel = poolCard?.position ?? spreadPos?.label ?? `第 ${currentIndex + 1} 张`;
    stage.innerHTML = renderDeckFanHTML();
    const main = stage.querySelector('#tarot-draw-main');
    if (main) {
      main.innerHTML = `
        ${drawMode === 'gesture' ? '<div id="camera-slot" class="camera-slot"></div>' : ''}
        ${teach ? `<p class="teach-hint">${teach}</p>` : ''}
        <p class="tarot-hint">第 ${currentIndex + 1} 张 · <strong>${posLabel}</strong></p>
        <p class="tarot-hint">${stepHintHtml('draw')}</p>
        <p class="teach-hint teach-hint-soft">${
          drawMode === 'gesture'
            ? '摄像头前左右挥手浏览底部牌堆；捏合抽出。也可手指在牌堆上左右滑或点击抽取。'
            : '在底部牌堆左右滑动浏览，点击选中牌或上滑/长按抽出。'
        }</p>
      `;
    }
    syncCameraPlacement();
  }

  function renderFlipStage(revealed: boolean): void {
    const card = currentCard();
    if (!card) return;
    const slot = document.createElement('div');
    slot.className = 'tarot-slot-single';
    renderCardFace(slot, card, revealed);
    stage.innerHTML = `
      ${drawMode === 'gesture' ? '<div id="camera-slot" class="camera-slot"></div>' : ''}
      <p class="tarot-hint">${stepHintHtml('flip')}</p>
    `;
    stage.appendChild(slot);
    syncCameraPlacement();
  }

  function renderPreReadingStage(): void {
    actions.innerHTML = '';
    stage.innerHTML = `
      <div class="pre-reading-stage">
        <h2 class="section-title">开始解读之前</h2>
        <p class="tarot-hint">问题：<strong>${escapePreReading(question || '（未填写）')}</strong></p>
        <p class="teach-hint teach-hint-soft">补充一句当下情况（可选），解读会更贴你的处境；也可直接跳过。</p>
        <label class="pre-reading-label" for="pre-reading-bg">例如：刚离职 / 已面了 3 家 / 有 offer 在等</label>
        <textarea id="pre-reading-bg" class="question-input" rows="3" placeholder="可选：一句话背景…">${escapePreReading(questionBackground)}</textarea>
      </div>
    `;
    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'btn btn-ghost';
    skipBtn.textContent = '跳过，直接解读';
    skipBtn.addEventListener('click', () => {
      questionBackground = '';
      backgroundPromptDone = true;
      void finishFlipInterpret();
    });
    const goBtn = document.createElement('button');
    goBtn.type = 'button';
    goBtn.className = 'btn';
    goBtn.textContent = '开始解读';
    goBtn.addEventListener('click', () => {
      const el = document.getElementById('pre-reading-bg') as HTMLTextAreaElement | null;
      questionBackground = el?.value.trim() ?? '';
      backgroundPromptDone = true;
      void finishFlipInterpret();
    });
    actions.append(skipBtn, goBtn);
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

  function renderCardIntuitionStage(): void {
    const card = currentCard();
    if (!card) return;
    const orient = card.reversed ? '逆位' : '正位';
    actions.innerHTML = '';
    stage.innerHTML = `
      <div class="card-intuition-stage">
        <h2 class="section-title">你的第一直觉</h2>
        <p class="tarot-hint">牌已翻开 · 先听自己，再听解读</p>
        <p class="intuition-card-meta"><strong>${escapePreReading(card.card.nameZh)}</strong> · ${orient}</p>
        <label class="pre-reading-label" for="card-intuition-input">看到这张牌，你心里第一个念头是什么？</label>
        <textarea id="card-intuition-input" class="question-input" rows="4" placeholder="例如：有点紧、像在防守、不太敢亮出自己…"></textarea>
        <p class="intuition-status" hidden>正在生成解读…</p>
      </div>
    `;

    const finish = (text: string) => {
      void goToReviewAfterIntuition(text);
    };

    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'btn btn-ghost';
    skipBtn.textContent = '跳过，直接看解读';
    skipBtn.addEventListener('click', () => finish(''));

    const goBtn = document.createElement('button');
    goBtn.type = 'button';
    goBtn.className = 'btn';
    goBtn.textContent = '写下后看解读';
    goBtn.addEventListener('click', () => {
      const el = document.getElementById('card-intuition-input') as HTMLTextAreaElement | null;
      finish(el?.value ?? '');
    });

    actions.append(skipBtn, goBtn);
  }

  function renderCardReviewStage(): void {
    const cardReading = reading?.cards[currentIndex];
    if (!cardReading) return;

    const hasMore = currentIndex < cardPool.length - 1;
    const acceptLabel = hasMore ? '收下此解读 · 继续抽牌' : '收下此解读 · 完成占问';

    stage.innerHTML = `
      <div class="card-review-stage">
        <p class="card-review-lead">牌已翻开 · 慢慢读，答案在你心里</p>
        <div class="card-review-tabs" id="card-review-tabs"></div>
      </div>
    `;

    actions.innerHTML = '';
    const acceptBtn = document.createElement('button');
    acceptBtn.type = 'button';
    acceptBtn.className = 'btn card-review-accept';
    acceptBtn.textContent = acceptLabel;
    acceptBtn.addEventListener('click', () => void onAcceptCard());
    actions.appendChild(acceptBtn);

    const canSupplement =
      supplementCount < MAX_SUPPLEMENT && currentIndex === cardPool.length - 1;
    if (canSupplement) {
      const theme = supplementThemeLabel(question);
      const supplementBtn = document.createElement('button');
      supplementBtn.type = 'button';
      supplementBtn.className = 'btn btn-ghost card-review-supplement';
      supplementBtn.textContent = '补一张建议/行动牌';
      supplementBtn.addEventListener('click', () => void onRequestSupplement());
      actions.appendChild(supplementBtn);
      const hint = document.createElement('p');
      hint.className = 'supplement-guide-hint';
      hint.textContent = `如果这轮还不够清晰，可针对【${theme}】再补一张建议牌或行动牌`;
      actions.appendChild(hint);
    }

    const host = document.getElementById('card-review-tabs');
    if (host) {
      mountCardResultTabs(host, cardReading, 'reading', {
        onCardReadingChange: (updated) => {
          if (!reading) return;
          reading.cards[currentIndex] = updated;
          if (updated.interpretationProvider === 'llm') {
            reading.provider = 'llm';
          }
          savePartialProgress();
        },
      });
    }
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

    actions.innerHTML = '';
    stage.innerHTML = `
      <h2 class="section-title">占问结果</h2>
      <p class="tarot-hint">每张牌可切换四个视角 · 新牌已收入图鉴</p>
      <div class="result-panel" id="result-cards">
        ${reading.cards.map((c) => `
          <div class="result-card-item" data-card-id="${c.cardId}">
            <div class="result-tabs-host"></div>
          </div>`).join('')}
        <p class="result-summary">${reading.summary}</p>
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

    stage.querySelectorAll('.result-card-item').forEach((item, i) => {
      const host = item.querySelector('.result-tabs-host') as HTMLElement;
      const cardReading = reading!.cards[i];
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
    });

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
    actions.appendChild(resultActions);

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
    supplementCount = 0;
    reading = null;
    learningNote = '';
    questionBackground = '';
    backgroundPromptDone = false;
    currentJournalId = null;
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
    supplementCount = 0;
    reading = null;
    learningNote = '';
    questionBackground = '';
    backgroundPromptDone = false;
    currentJournalId = null;
    questionRewrite?.destroy();
    questionRewrite = null;
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
          const ritualActive = ['ritual', 'shuffle', 'cut', 'draw', 'flip'].includes(state);
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
    if (state === 'flip' && gesture === 'Open_Palm') void onFlip();
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
    setState('draw');
  }

  async function onDraw(): Promise<void> {
    if (state !== 'draw' || drawLock) return;
    const card = cardPool[currentIndex];
    if (!card) return;
    drawLock = true;
    drawnCards.push(card);

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
    setState('flip');
  }

  async function onFlip(): Promise<void> {
    if (state !== 'flip') return;
    const slot = stage.querySelector('.tarot-slot-single');
    if (slot) {
      slot.classList.add('is-flipping');
      await wait(500);
      const card = currentCard();
      if (card) renderCardFace(slot as HTMLElement, card, true);
    }

    if (!reading) {
      reading = { cards: [], summary: '', provider: 'static' };
    }

    if (!backgroundPromptDone) {
      setState('preReading');
      return;
    }

    await finishFlipInterpret();
  }

  async function startInterpretForCurrentCard(): Promise<void> {
    const card = currentCard();
    if (!card) return;
    const provider = createInterpretationProvider();
    const single = await provider.interpret([card], question, spreadType, {
      background: questionBackground,
    });
    if (!reading) {
      reading = { cards: [], summary: '', provider: single.provider };
    }
    const prev = reading.cards[currentIndex];
    reading.cards[currentIndex] = {
      ...single.cards[0],
      userIntuition: prev?.userIntuition,
      intuitionCompare: prev?.intuitionCompare,
    };
    reading.provider = single.provider;
    reading.questionBackground = questionBackground || undefined;
  }

  /** 翻牌后：后台跑解读，先进直觉页 */
  async function finishFlipInterpret(): Promise<void> {
    pendingInterpret = startInterpretForCurrentCard().catch((err) => {
      console.warn('[tarot] interpret failed', err);
    });
    setState('cardIntuition');
    void pendingInterpret.then(() => savePartialProgress());
  }

  async function goToReviewAfterIntuition(raw: string): Promise<void> {
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
      if (!reading?.cards[currentIndex]) {
        await startInterpretForCurrentCard();
      }
      const tip = raw.trim();
      if (reading?.cards[currentIndex]) {
        const base = reading.cards[currentIndex];
        reading.cards[currentIndex] = {
          ...base,
          userIntuition: tip || undefined,
          intuitionCompare: tip ? buildIntuitionCompare(base, tip) : undefined,
        };
      }
      setState('cardReview');
      savePartialProgress();
    } catch (err) {
      console.warn('[tarot] intuition → review failed', err);
      buttons.forEach((b) => {
        b.disabled = false;
      });
      if (status) {
        status.textContent = '解读生成失败，请再试一次或跳过';
      }
    }
  }

  async function onRequestSupplement(): Promise<void> {
    if (state !== 'cardReview' || supplementCount >= MAX_SUPPLEMENT) return;
    const excludeIds = drawnCards.map((d) => d.card.id);
    const clarifier = drawClarifierCard(excludeIds);
    if (!clarifier) return;
    cardPool.push(clarifier);
    supplementCount++;
    currentIndex++;
    savePartialProgress();
    setState('draw');
  }

  async function onAcceptCard(): Promise<void> {
    if (state !== 'cardReview') return;

    currentIndex++;
    if (currentIndex < cardPool.length) {
      savePartialProgress();
      setState('draw');
      return;
    }

    learningNote = buildLearningNote(spreadType, question);
    const cardIds = drawnCards.map((d) => d.card.id);
    if (readingCoversDrawn(reading, cardIds) && reading) {
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
    } else {
      const prevCards = reading?.cards ?? [];
      const provider = createInterpretationProvider();
      reading = await provider.interpret(drawnCards, question, spreadType, {
        background: questionBackground,
      });
      reading.cards = reading.cards.map((c, i) => ({
        ...c,
        userIntuition: prevCards[i]?.userIntuition ?? c.userIntuition,
        intuitionCompare: prevCards[i]?.intuitionCompare ?? c.intuitionCompare,
      }));
      reading.learningNote = learningNote;
    }
    currentJournalId = ensureJournalSaved();

    showRitualCompleteModal(reading, () => setState('result'));
  }

  renderStage();
  syncHintBar();

  window.addEventListener('pagehide', onPageHide);

  return () => {
    savePartialProgress();
    window.removeEventListener('pagehide', onPageHide);
    questionCoach?.destroy();
    questionRewrite?.destroy();
    ritualInputUnbind?.();
    gestureBridge?.stop();
    camera.stop();
    unbindCamera();
    debug?.el.remove();
    hintBar.el.remove();
  };
}
