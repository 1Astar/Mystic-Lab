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
import { createInterpretationProvider } from '../interpretation/llm-provider.ts';
import type { ReadingResult } from '../interpretation/types.ts';
import { unlockSingleCard } from '../codex/collection.ts';
import { mountCardResultTabs } from '../ui/card-result-tabs.ts';
import { showRitualCompleteModal } from '../ui/ritual-complete-modal.ts';
import { showUnlockToast } from '../ui/unlock-toast.ts';
import { saveJournalEntry, updateJournalReflection, upsertJournalProgress } from '../journal/records.ts';
import { navigate } from '../router.ts';
import { downloadShareCard } from '../share/card-renderer.ts';
import { renderCardFace, runShuffleAnimation, wait } from '../tarot/animations.ts';
import { renderDeckFanHTML } from '../ui/tarot-deck-fan.ts';
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
import { mountQuestionCoach, type QuestionCoachHandle } from '../ui/question-coach.ts';
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
  | 'cardReview'
  | 'result';

export function renderTarot(root: HTMLElement): () => void {
  const env = detectBrowserEnv();
  const inputCaps = detectInputCapabilities(env);
  const camera = new CameraService();
  let gestureBridge: GestureBridge | null = null;

  let state: TarotState = 'landing';
  let question = '';
  let spreadType: SpreadType = 'past-present-future';
  let drawMode: DrawMode = defaultDrawMode(inputCaps);
  let motionEnabled = false;
  let questionCoach: QuestionCoachHandle | null = null;
  let drawLock = false;
  let currentJournalId: string | null = null;
  let ritualInputUnbind: (() => void) | null = null;
  let cardPool: DrawnCard[] = [];
  let drawnCards: DrawnCard[] = [];
  let currentIndex = 0;
  let reading: ReadingResult | null = null;
  let learningNote = '';
  let gestureFallback = !env.canUseGesture;
  let cameraOn = false;
  let supplementCount = 0;
  const MAX_SUPPLEMENT = 2;

  const pinchDetector = new PinchDetector();
  const swipeDetector = new SwipeDetector();
  const joinedPalms = new JoinedPalmsDetector();
  const heldPalm = new HeldGestureDetector();

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
  back.textContent = '← 返回占问';
  back.addEventListener('click', () => navigate('/divination'));

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
    if (state === 'cardReview' || state === 'result') {
      hintBar.setStep(null);
      fallback.setVisible(false);
      gestureStatus.el.hidden = true;
      return;
    }
    if (['landing', 'question', 'spread', 'modeSelect', 'loading'].includes(state)) {
      hintBar.setStep(null);
      fallback.setVisible(false);
      gestureStatus.el.hidden = true;
      return;
    }
    const step = ritualStep();
    if (drawMode !== 'gesture' || !cameraOn) {
      gestureStatus.el.hidden = true;
    }
    hintBar.setStep(step, drawMode);
    const showAssist = step !== null && drawMode === 'gesture' && gestureFallback;
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
    if (next === 'cardReview' || next === 'result') {
      pauseCameraForReview();
    }
    syncHintBar();
    renderStage();
    bindRitualInputs();
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

    if (drawMode === 'gesture' && step === 'ritual') {
      ritualInputUnbind = bindRitualInput(stage, 'ritual', callbacks);
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
      draw: '<strong>拇指食指捏合</strong>，保持 0.3 秒',
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
        stage.innerHTML = `
          <div class="question-stage">
            ${renderQuestionStageBackdrop()}
            <div class="question-main">
              <div class="question-head">
                <h2 class="section-title">你想问什么？</h2>
                <button type="button" class="question-guide-trigger">怎么问更好？</button>
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
        <p class="teach-hint teach-hint-soft">在底部牌堆左右滑动浏览，选中后上滑或长按抽出。</p>
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
      const supplementBtn = document.createElement('button');
      supplementBtn.type = 'button';
      supplementBtn.className = 'btn btn-ghost card-review-supplement';
      supplementBtn.textContent = '还想补一张？';
      supplementBtn.addEventListener('click', () => void onRequestSupplement());
      actions.appendChild(supplementBtn);
    }

    const host = document.getElementById('card-review-tabs');
    if (host) {
      mountCardResultTabs(host, cardReading);
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
      </div>
    `;

    stage.querySelectorAll('.result-card-item').forEach((item, i) => {
      const host = item.querySelector('.result-tabs-host') as HTMLElement;
      const cardReading = reading!.cards[i];
      if (host && cardReading) {
        mountCardResultTabs(host, cardReading);
      }
    });

    const reflectionEl = document.getElementById('result-reflection') as HTMLTextAreaElement | null;
    if (reflectionEl && journalId) {
      reflectionEl.addEventListener('input', () => {
        updateJournalReflection(journalId, reflectionEl.value.trim());
      });
    }

    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'btn';
    shareBtn.textContent = '保存心意卡片';
    shareBtn.addEventListener('click', () => void downloadShareCard(drawnCards, reading!, question));

    const codexBtn = document.createElement('button');
    codexBtn.type = 'button';
    codexBtn.className = 'btn btn-secondary';
    codexBtn.textContent = '查看图鉴';
    codexBtn.addEventListener('click', () => navigate('/codex'));

    const journalBtn = document.createElement('button');
    journalBtn.type = 'button';
    journalBtn.className = 'btn btn-ghost';
    journalBtn.textContent = '查看手札';
    journalBtn.addEventListener('click', () => navigate('/journal'));

    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'btn btn-ghost';
    retryBtn.textContent = '再占一次';
    retryBtn.addEventListener('click', () => resetSession());

    const resultActions = document.createElement('div');
    resultActions.className = 'result-actions';
    resultActions.append(shareBtn, codexBtn, journalBtn, retryBtn);
    actions.appendChild(resultActions);

    hintBar.setStep(null);
    fallback.setVisible(false);
    cameraWrap.hidden = true;
    gestureStatus.el.hidden = true;
  }

  function appendBtn(label: string, onClick: () => void): void {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
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
    currentJournalId = null;
    drawMode = defaultDrawMode(inputCaps);
    motionEnabled = false;
    gestureBridge?.stop();
    gestureBridge = null;
    camera.stop();
    cameraOn = false;
    gestureFallback = !env.canUseGesture;
    setState('landing');
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
      try {
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
        gestureBridge.start(camResult.video);
        gestureFallback = false;
      } catch (err) {
        gestureFallback = true;
        const msg = err instanceof Error ? err.message : '手势初始化失败';
        gestureStatus.setMessage(`手势模型加载失败：${msg}`);
      }
    } else {
      gestureFallback = true;
      gestureStatus.setMessage('当前环境不支持手势识别，请用辅助按钮');
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
      if (pinch === 'pinching') hintBar.setProgress('捏合中…保持稳定');
      if (pinch === 'confirmed') void onDraw();
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

    const unlock = unlockSingleCard(card, question, card.card.nameZh);
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

    const card = currentCard();
    if (card) {
      const provider = createInterpretationProvider();
      const single = await provider.interpret([card], question, spreadType);
      reading.cards[currentIndex] = single.cards[0];
    }

    setState('cardReview');
    savePartialProgress();
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
    const provider = createInterpretationProvider();
    reading = await provider.interpret(drawnCards, question, spreadType);
    reading.learningNote = learningNote;
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
    ritualInputUnbind?.();
    gestureBridge?.stop();
    camera.stop();
    unbindCamera();
    debug?.el.remove();
    hintBar.el.remove();
  };
}
