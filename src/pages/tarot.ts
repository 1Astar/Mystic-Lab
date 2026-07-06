import { detectBrowserEnv } from '../core/browser-env.ts';
import { CameraService } from '../core/camera-service.ts';
import {
  HeldGestureDetector,
  HoldDetector,
  JoinedPalmsDetector,
  PinchDetector,
  SwipeDetector,
  VerticalSwipeDetector,
} from '../core/gesture-detector.ts';
import { GestureBridge } from '../core/gesture-bridge.ts';
import { createFallbackInput, type FallbackAction } from '../core/fallback-input.ts';
import { createInterpretationProvider } from '../interpretation/llm-provider.ts';
import type { ReadingResult } from '../interpretation/types.ts';
import { unlockSingleCard } from '../codex/collection.ts';
import { readingBlockHtml } from '../interpretation/contextual-reading.ts';
import { mountCardResultTabs } from '../ui/card-result-tabs.ts';
import { showUnlockToast } from '../ui/unlock-toast.ts';
import { saveJournalEntry } from '../journal/records.ts';
import { navigate } from '../router.ts';
import { downloadShareCard } from '../share/card-renderer.ts';
import { renderCardFace, runShuffleAnimation, wait } from '../tarot/animations.ts';
import {
  defaultDrawMode,
  detectInputCapabilities,
  getDrawModeOptions,
  type DrawMode,
} from '../tarot/draw-modes.ts';
import { bindFreeDrawInput, requestMotionPermission } from '../tarot/free-draw-input.ts';
import { bindRitualInput, type RitualInputStep } from '../tarot/ritual-input.ts';
import type { DrawnCard } from '../tarot/engine.ts';
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
  | 'reading'
  | 'readingZoom'
  | 'confirm'
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
  let ritualInputUnbind: (() => void) | null = null;
  let cardPool: DrawnCard[] = [];
  let drawnCards: DrawnCard[] = [];
  let currentIndex = 0;
  let reading: ReadingResult | null = null;
  let learningNote = '';
  let gestureFallback = !env.canUseGesture;
  let cameraOn = false;
  let isZoomed = false;

  const pinchDetector = new PinchDetector();
  const swipeDetector = new SwipeDetector();
  const verticalSwipe = new VerticalSwipeDetector();
  const holdDetector = new HoldDetector();
  const joinedPalms = new JoinedPalmsDetector();
  const heldPalm = new HeldGestureDetector();
  let wristStableSamples: { x: number; y: number }[] = [];

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
    const ritualStates = ['ritual', 'shuffle', 'cut', 'draw', 'flip', 'reading', 'readingZoom', 'confirm'] as const;
    if (!ritualStates.includes(state as (typeof ritualStates)[number])) {
      return null;
    }
    if (state === 'readingZoom') return 'reading';
    if (state === 'confirm') return 'confirm';
    return state as RitualStep;
  }

  function syncHintBar(): void {
    const step = ritualStep();
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

  let confirmTimer: number | null = null;

  function clearConfirmTimer(): void {
    if (confirmTimer !== null) {
      window.clearTimeout(confirmTimer);
      confirmTimer = null;
    }
  }

  function scheduleConfirmTransition(): void {
    clearConfirmTimer();
    hintBar.setProgress('可向上滑动放大 · 停留 1 秒确认');
    confirmTimer = window.setTimeout(() => {
      if (state === 'reading' || state === 'readingZoom') {
        setState('confirm');
      }
    }, 2800);
  }

  function resetDetectors(): void {
    pinchDetector.reset();
    swipeDetector.reset();
    verticalSwipe.reset();
    holdDetector.reset();
    joinedPalms.reset();
    heldPalm.reset();
    wristStableSamples = [];
  }

  function setState(next: TarotState): void {
    if (next !== 'reading' && next !== 'readingZoom' && next !== 'confirm') {
      clearConfirmTimer();
    }
    state = next;
    resetDetectors();
    debug?.setStatus(next);
    syncHintBar();
    renderStage();
    bindRitualInputs();
  }

  function ritualInputStep(): RitualInputStep | null {
    if (state === 'readingZoom') return 'readingZoom';
    const steps: RitualInputStep[] = ['ritual', 'shuffle', 'cut', 'draw', 'flip', 'reading', 'confirm'];
    return steps.includes(state as RitualInputStep) ? (state as RitualInputStep) : null;
  }

  function ritualInputCallbacks() {
    return {
      onRitualTap: () => void onRitualEnter(),
      onShuffle: () => void onShuffle(),
      onCut: () => void onCut(),
      onDraw: () => void onDraw(),
      onFlip: () => void onFlip(),
      onZoomIn: () => {
        isZoomed = true;
        setState('readingZoom');
      },
      onZoomOut: () => {
        isZoomed = false;
        setState('reading');
      },
      onConfirm: () => void onConfirm(),
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
      if (step === 'flip' || step === 'reading' || step === 'readingZoom' || step === 'confirm') {
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
      draw: '<strong>长按</strong>你想抽的那张牌',
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
      draw: '<strong>画下念头</strong>，或按住松手',
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
            <div class="tarot-orb" aria-hidden="true"></div>
            <h1 class="page-title">随心抽牌</h1>
            <p class="tarot-hint">触屏抽牌 · 牌阵 · 解读</p>
          </div>
        `;
        appendBtn('开始占卜', () => setState('question'));
        break;

      case 'question':
        stage.innerHTML = `
          <h2 class="section-title">你想问什么？</h2>
          <p class="tarot-hint">问题越具体，牌的指引越清晰。</p>
          <textarea id="tarot-question" class="question-input" rows="3" placeholder="例如：我该不该换工作？"></textarea>
        `;
        appendBtn('下一步 · 选择牌阵', () => {
          const input = document.querySelector<HTMLTextAreaElement>('#tarot-question');
          question = input?.value.trim() ?? '';
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

      case 'reading':
        renderReadingStage(false);
        break;

      case 'readingZoom':
        renderReadingStage(true);
        break;

      case 'confirm':
        renderReadingStage(isZoomed);
        hintBar.setProgress('请保持手部稳定…');
        break;

      case 'result':
        renderResult();
        break;
    }
  }

  function renderDrawStage(): void {
    const teach = getTeachHint(spreadType, currentIndex);
    const pos = SPREADS[spreadType].positions[currentIndex];
    const fanCards = [0, 1, 2, 3, 4]
      .map((i) => `<div class="fan-card" style="--fan-i: ${i}">✦</div>`)
      .join('');
    stage.innerHTML = `
      ${drawMode === 'gesture' ? '<div id="camera-slot" class="camera-slot"></div>' : ''}
      ${teach ? `<p class="teach-hint">${teach}</p>` : ''}
      <p class="tarot-hint">第 ${currentIndex + 1} 张 · <strong>${pos.label}</strong></p>
      <p class="tarot-hint">${stepHintHtml('draw')}</p>
      <p class="teach-hint teach-hint-soft">选最吸引你的那张。</p>
      <div class="tarot-fan" id="tarot-fan">${fanCards}</div>
    `;
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

  function renderReadingStage(zoomed: boolean): void {
    const card = currentCard();
    if (!card || !reading?.cards[currentIndex]) return;
    const cardReading = reading.cards[currentIndex];
    stage.innerHTML = `
      ${drawMode === 'gesture' ? '<div id="camera-slot" class="camera-slot"></div>' : ''}
      <div class="reading-view ${zoomed ? 'is-zoomed' : ''}">
        <div class="tarot-slot-single" id="reading-card"></div>
        <div class="reading-text">
          <p class="result-pos">${cardReading.position} · ${cardReading.orientation === 'reversed' ? '逆位' : '正位'}</p>
          ${readingBlockHtml(cardReading)}
        </div>
      </div>
    `;
    const slot = document.getElementById('reading-card')!;
    renderCardFace(slot, card, true);
    syncCameraPlacement();
  }

  function renderResult(): void {
    if (!reading) return;

    actions.innerHTML = '';

    stage.innerHTML = `
      <h2 class="section-title">占问结果</h2>
      <p class="tarot-hint">新牌已收入图鉴 · 每张牌可切换四个视角</p>
      <div class="result-panel" id="result-cards">
        ${reading.cards.map((c) => `
          <div class="result-card-item" data-card-id="${c.cardId}">
            <div class="result-name">${c.position} · ${c.cardName} · ${c.orientation === 'reversed' ? '逆位' : '正位'}</div>
            <div class="result-tabs-host"></div>
          </div>`).join('')}
        <p class="result-summary">${reading.summary}</p>
        <div class="learning-card">
          <h3>写下此刻的感悟</h3>
          <textarea id="result-reflection" class="question-input" rows="3" placeholder="这次占问，你想记住什么？">${learningNote}</textarea>
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

    hintBar.setStep('end');
    fallback.setVisible(false);
    cameraWrap.hidden = true;
    cameraOn = false;
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
    reading = null;
    learningNote = '';
    isZoomed = false;
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

    if ((state === 'reading' || state === 'readingZoom') && wrist) {
      const vs = verticalSwipe.update(wrist);
      if (vs === 'up' && state === 'reading') {
        isZoomed = true;
        setState('readingZoom');
      }
      if (vs === 'down' && state === 'readingZoom') {
        isZoomed = false;
        setState('reading');
      }
      return;
    }

    if (state === 'confirm' && wrist) {
      wristStableSamples.push({ x: wrist.x, y: wrist.y });
      if (wristStableSamples.length > 10) wristStableSamples.shift();
      const stable =
        wristStableSamples.length >= 6 &&
        Math.hypot(
          wristStableSamples[0].x - wrist.x,
          wristStableSamples[0].y - wrist.y,
        ) < 0.03;
      if (holdDetector.update(stable)) void onConfirm();
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
        isZoomed = true;
        setState('readingZoom');
        break;
      case 'zoom_out':
        isZoomed = false;
        setState('reading');
        break;
      case 'confirm': void onConfirm(); break;
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
    if (state !== 'draw') return;
    const card = cardPool[currentIndex];
    if (!card) return;
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

    isZoomed = false;
    setState('reading');
    scheduleConfirmTransition();
  }

  async function onConfirm(): Promise<void> {
    if (state !== 'confirm') return;
    clearConfirmTimer();

    currentIndex++;
    if (currentIndex < cardPool.length) {
      setState('draw');
      return;
    }

    learningNote = buildLearningNote(spreadType, question);
    const provider = createInterpretationProvider();
    reading = await provider.interpret(drawnCards, question, spreadType);
    reading.learningNote = learningNote;
    setState('result');
    saveJournalEntry(question, spreadType, drawnCards, reading, learningNote, '');
  }

  renderStage();

  return () => {
    clearConfirmTimer();
    ritualInputUnbind?.();
    gestureBridge?.stop();
    camera.stop();
    unbindCamera();
    debug?.el.remove();
    hintBar.el.remove();
  };
}
