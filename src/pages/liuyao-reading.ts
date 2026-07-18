import { navigate } from '../router.ts';
import { wait, prefersReducedMotion } from '../tarot/animations.ts';
import {
  buildCastFromThrows,
  castSixYao,
  rollOneYao,
  type CastResult,
  type YaoThrow,
} from '../liuyao/engine.ts';
import { LINE_LABELS } from '../liuyao/hexagrams.ts';
import { buildFourLayerReading } from '../liuyao/interpret.ts';
import { mergeReflection } from '../liuyao/journal-prompts.ts';
import { saveLiuyaoJournalEntry } from '../liuyao/journal.ts';
import { playLiuyaoSfx, preloadLiuyaoSfx } from '../liuyao/sfx.ts';
import { LIUYAO_ASSETS, preloadLiuyaoCoins } from '../liuyao/assets.ts';
import {
  coinsLabel,
  renderYaoMemoryFold,
  showYaoTeachPopover,
  teachFold,
} from '../liuyao/flip-teach.ts';
import { renderCoinYaoQuickRef } from '../liuyao/yao-kind-guide.ts';
import { getLiuyaoMode, mountLiuyaoModeSwitch } from '../liuyao/mode.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mountLiuyaoResultTabs } from '../ui/liuyao/result-tabs.ts';
import { mountLiuyaoSfxToggle } from '../ui/liuyao/sfx-toggle.ts';
import {
  renderHexagramSvg,
  renderThreeCoins,
} from '../ui/liuyao/hexagram-view.ts';

type Phase = 'question' | 'method' | 'casting' | 'result';

export function renderLiuyaoReading(root: HTMLElement): () => void {
  let question = '';
  let method: 'coin' | 'random' = 'coin';
  const throws: YaoThrow[] = [];
  let cast: CastResult | null = null;
  let journalSaved = false;
  let castingAnim = false;
  let phase: Phase = 'question';
  let lastResult: CastResult | null = null;

  const page = document.createElement('div');
  page.className = 'page ly-reading-page';
  mountEnvBanner(page);

  const topbar = document.createElement('div');
  topbar.className = 'ly-topbar';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回六爻';
  back.addEventListener('click', () => goBack());
  const actionsHost = document.createElement('div');
  actionsHost.className = 'ly-topbar-actions';
  topbar.append(back, actionsHost);
  mountLiuyaoSfxToggle(actionsHost);

  const modeBar = document.createElement('div');
  modeBar.className = 'ly-mode-bar';
  mountLiuyaoModeSwitch(modeBar, {
    onChange: () => refreshForMode(),
  });

  const stage = document.createElement('div');
  stage.className = 'ly-reading-stage';
  const actions = document.createElement('div');
  actions.className = 'ly-reading-actions';

  page.append(topbar, modeBar, stage, actions);
  root.appendChild(page);
  preloadLiuyaoSfx();
  preloadLiuyaoCoins();

  function isLearn(): boolean {
    return getLiuyaoMode() === 'learn';
  }

  function syncBackLabel(): void {
    back.textContent = phase === 'question' ? '← 返回六爻' : '← 返回上一步';
  }

  function goBack(): void {
    if (phase === 'question') {
      navigate('/liuyao');
      return;
    }
    if (phase === 'method') {
      renderQuestion();
      return;
    }
    if (phase === 'casting') {
      throws.length = 0;
      cast = null;
      renderMethod();
      return;
    }
    if (phase === 'result') {
      throws.length = 0;
      cast = null;
      lastResult = null;
      journalSaved = false;
      renderMethod();
    }
  }

  function refreshForMode(): void {
    page.classList.toggle('is-learn-mode', isLearn());
    if (phase === 'question') renderQuestion();
    else if (phase === 'method') renderMethod();
    else if (phase === 'casting') {
      renderCastingUi();
      syncCastActions();
    } else if (phase === 'result' && lastResult) renderResult(lastResult);
  }

  function clearActions(): void {
    actions.innerHTML = '';
  }

  function appendBtn(label: string, onClick: () => void, ghost = false): void {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = ghost ? 'btn btn-ghost' : 'btn ly-btn-gold';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    actions.appendChild(btn);
  }

  function syncCastActions(): void {
    clearActions();
    if (throws.length >= 6) {
      appendBtn('排盘', () => void revealFromBoard());
    }
  }

  async function revealFromBoard(): Promise<void> {
    if (castingAnim || throws.length < 6) return;
    if (!cast) cast = buildCastFromThrows(throws, 'coin');
    await renderReveal(cast);
  }

  function renderQuestion(): void {
    phase = 'question';
    syncBackLabel();
    clearActions();
    stage.innerHTML = `
      <div class="ly-step ly-step-question">
        <p class="ly-step-kicker">Step 1${isLearn() ? ' · 学习' : ''}</p>
        <h1 class="ly-step-title">此刻，你想问什么？</h1>
        ${
          isLearn()
            ? teachFold(
                '学习模式说明',
                `<p class="ly-inline-note is-plain">摇钱、成爻、解卦时会出现可点开的规则标注，帮你认清字背、世应与动爻。</p>`,
              )
            : ''
        }
        <p class="ly-step-hint">可写可不写。写下问题，解释会更贴你的情境；也可以先起卦再想。</p>
        <textarea class="question-input ly-question-input" rows="3" maxlength="120" placeholder="例如：我要不要接受这个 offer？（可选）">${question}</textarea>
      </div>
    `;
    const input = stage.querySelector('textarea')!;
    input.addEventListener('input', () => {
      question = input.value.slice(0, 120);
    });
    appendBtn('下一步 · 选择起卦方式', () => {
      question = input.value.trim();
      renderMethod();
    });
  }

  function renderMethod(): void {
    phase = 'method';
    syncBackLabel();
    clearActions();
    stage.innerHTML = `
      <div class="ly-step ly-step-method">
        <p class="ly-step-kicker">Step 2${isLearn() ? ' · 学习' : ''}</p>
        <h2 class="ly-step-title">选择起卦方式</h2>
        ${question ? `<p class="ly-question-recap">「${escapeHtml(question)}」</p>` : '<p class="ly-question-recap">未写下问题 · 可先起卦</p>'}
        ${
          isLearn()
            ? teachFold(
                '铜钱计分规则',
                `<p class="ly-inline-note is-plain">字=2（阴）、背=3（阳）。三钱相加得 6–9，对应少阴少阳老阴老阳。</p>`,
              )
            : ''
        }
        <div class="ly-method-grid">
          <button type="button" class="ly-method-card is-active" data-m="coin">
            <img class="ly-method-coin" src="${LIUYAO_ASSETS.coinObverse}" alt="" width="40" height="40" decoding="async" fetchpriority="high" />
            <strong>铜钱起卦</strong>
            <span>握摇六次，逐爻生成</span>
          </button>
          <button type="button" class="ly-method-card" data-m="random">
            <span class="ly-method-icon">✦</span>
            <strong>随机起卦</strong>
            <span>快速体验完整卦象</span>
          </button>
          <button type="button" class="ly-method-card is-soon" disabled>
            <span class="ly-method-icon">☽</span>
            <strong>时间起卦</strong>
            <span class="tag">稍后开放</span>
          </button>
        </div>
      </div>
    `;
    stage.querySelectorAll<HTMLButtonElement>('.ly-method-card[data-m]').forEach((card) => {
      card.addEventListener('click', () => {
        method = card.dataset.m as 'coin' | 'random';
        stage.querySelectorAll('.ly-method-card').forEach((c) => c.classList.remove('is-active'));
        card.classList.add('is-active');
      });
    });
    appendBtn('开始起卦', () => startCasting(), false);
    appendBtn('修改问题', () => renderQuestion(), true);
  }

  async function startCasting(): Promise<void> {
    throws.length = 0;
    cast = null;
    lastResult = null;
    journalSaved = false;
    if (method === 'random') {
      cast = castSixYao('random');
      playLiuyaoSfx('shake');
      await wait(prefersReducedMotion() ? 80 : 400);
      playLiuyaoSfx('drop');
      await wait(prefersReducedMotion() ? 60 : 200);
      await renderReveal(cast);
      return;
    }
    phase = 'casting';
    clearActions();
    renderCastingUi();
    syncCastActions();
  }

  function bindCoinTap(): void {
    const coins = stage.querySelector<HTMLElement>('.ly-board-coins');
    if (!coins) return;
    coins.classList.add('ly-coins-tappable');
    coins.setAttribute('role', 'button');
    coins.tabIndex = 0;
    const onTap = () => void onCoinTap();
    coins.addEventListener('click', onTap);
    coins.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onTap();
      }
    });
  }

  async function onCoinTap(): Promise<void> {
    if (castingAnim) return;
    if (throws.length >= 6) {
      await revealFromBoard();
      return;
    }
    await throwNext();
  }

  function renderCastingUi(): void {
    phase = 'casting';
    syncBackLabel();
    const n = throws.length;
    const done = n >= 6;
    const padLines = Array.from({ length: Math.max(0, 6 - throws.length) }, () => 0 as const);
    const changingIndexes = throws
      .map((t, i) => (t.changing ? i : -1))
      .filter((i) => i >= 0);
    const kicker = done
      ? `Step 3 · 六爻已成${isLearn() ? ' · 学习' : ''}`
      : `Step 3 · 第 ${n + 1} / 6 爻${isLearn() ? ' · 学习' : ''}`;
    const title = done ? '六爻已成' : '点击铜钱，落下一子';
    const teachBlock =
      isLearn() && done ? renderYaoMemoryFold(throws) : '';
    const showYaoHints = isLearn();

    stage.innerHTML = `
      <div class="ly-step ly-step-casting">
        <p class="ly-step-kicker">${kicker}</p>
        <p class="ly-cast-hint-top">点击铜钱起卦 · 共六次成卦；</p>
        <h2 class="ly-step-title">${title}</h2>
        ${
          showYaoHints
            ? `<p class="ly-cast-hint-sub">点爻线可看字背怎么变成这一画</p>`
            : ''
        }
        <div class="ly-board">
          <img class="ly-board-bg" src="${LIUYAO_ASSETS.baguaBoard}" alt="" aria-hidden="true" />
          <div class="ly-board-glow"></div>
          <div class="ly-board-coins" aria-label="${done ? '点击排盘或下方按钮' : '点击摇动铜钱'}">${renderThreeCoins(throws[n - 1]?.coins)}</div>
          <div class="ly-board-hex">${renderHexagramSvg({
            lines: [...throws.map((t) => t.bit), ...padLines],
            changingIndexes,
            revealedCount: n,
            animateIndex: done ? undefined : n - 1,
            compact: true,
            kindLabels: showYaoHints ? throws.map((t) => t.kind) : undefined,
            coinLabels: showYaoHints ? throws.map((t) => coinsLabel(t.coins)) : undefined,
            teachable: showYaoHints,
          })}</div>
        </div>
        ${teachFold(
          '为什么第一次在最下面？',
          `<p class="ly-cast-order-note">六爻按传统由下往上长：第一次落在最底（初爻＝根基／开端），第六次到最顶（上爻＝收束／结果）。像树从根长到梢，不是从上往下画。</p>`,
        )}
        ${
          isLearn()
            ? teachFold('字背与爻画速查', renderCoinYaoQuickRef())
            : ''
        }
        ${teachBlock}
      </div>
    `;
    bindCoinTap();
    bindYaoTeach();
  }

  /** 点爻线 / 底部回看芯片 → 旁侧教学卡（不挡整屏） */
  function bindYaoTeach(): void {
    stage.querySelectorAll<HTMLElement | SVGElement>('[data-flip-index]').forEach((el) => {
      const open = (e: Event) => {
        e.stopPropagation();
        const i = Number(el.getAttribute('data-flip-index'));
        const t = throws[i];
        if (!t) return;
        showYaoTeachPopover(t, i, el.getBoundingClientRect());
      };
      el.addEventListener('click', open);
      el.addEventListener('keydown', (e) => {
        const ke = e as KeyboardEvent;
        if (ke.key === 'Enter' || ke.key === ' ') {
          ke.preventDefault();
          open(e);
        }
      });
    });
  }

  async function throwNext(): Promise<void> {
    if (castingAnim || throws.length >= 6) return;
    castingAnim = true;
    const coinWrap = stage.querySelector('.ly-board-coins');
    coinWrap?.classList.add('ly-coins-shaking', 'ly-coins-flipping');
    playLiuyaoSfx('shake');
    const delay = prefersReducedMotion() ? 80 : 700;
    await wait(delay);
    const t = rollOneYao();
    throws.push(t);
    coinWrap?.classList.remove('ly-coins-shaking');
    coinWrap?.classList.add('ly-coins-drop');
    playLiuyaoSfx('drop');
    await wait(prefersReducedMotion() ? 60 : 320);
    coinWrap?.classList.remove('ly-coins-drop', 'ly-coins-flipping');
    renderCastingUi();
    castingAnim = false;
    syncCastActions();
  }

  async function renderReveal(result: CastResult): Promise<void> {
    clearActions();
    playLiuyaoSfx('form');
    stage.innerHTML = `
      <div class="ly-step ly-step-reveal">
        <p class="ly-step-kicker">天地响应</p>
        <h2 class="ly-step-title">卦象生成</h2>
        <div class="ly-reveal-board">
          ${renderHexagramSvg({
            lines: result.primaryLines,
            shiLine: result.shiLine,
            yingLine: result.yingLine,
            changingIndexes: result.changingIndexes,
          })}
        </div>
        <p class="ly-reveal-name">${result.primary.fullName}</p>
        ${result.changed ? `<p class="ly-reveal-changed">变卦 · ${result.changed.fullName}</p>` : ''}
        ${
          isLearn()
            ? teachFold(
                '世应与动爻',
                `<p class="ly-inline-note is-plain">世在${LINE_LABELS[result.shiLine - 1]}（我），应在${LINE_LABELS[result.yingLine - 1]}（外界）。${
                  result.changingIndexes.length
                    ? `动爻：${result.changingIndexes.map((i) => LINE_LABELS[i]).join('、')}。`
                    : '本卦无动爻。'
                }</p>`,
              )
            : ''
        }
      </div>
    `;
    await wait(prefersReducedMotion() ? 100 : 600);
    renderResult(result);
  }

  function renderResult(result: CastResult): void {
    phase = 'result';
    lastResult = result;
    syncBackLabel();
    clearActions();
    const reading = buildFourLayerReading(result, question);
    const changingLabels = result.changingIndexes.map((i) => LINE_LABELS[i]!);
    const learn = isLearn();

    stage.innerHTML = `
      <div class="ly-step ly-step-result">
        <p class="ly-question-recap">${question ? `你的问题 · ${escapeHtml(question)}` : '未写下具体问题 · 以下按卦象结构推演'}</p>
        <div class="ly-result-shell" data-result-shell></div>
      </div>
    `;

    const shell = stage.querySelector<HTMLElement>('[data-result-shell]')!;
    const tabsApi = mountLiuyaoResultTabs(shell, {
      cast: result,
      reading,
      question,
      learn,
    });

    appendBtn('保存到我的卦象', () => {
      if (!journalSaved) {
        saveLiuyaoJournalEntry({
          question,
          cast: result,
          reading,
          changingLabels,
          tags: tabsApi.getNoteTags(),
          reflection: mergeReflection(tabsApi.getNoteDraft(), tabsApi.collectPrompts()),
          castAt: tabsApi.getCastAt().toISOString(),
        });
        journalSaved = true;
      }
      navigate('/liuyao/journal');
    });
    appendBtn('再占一卦', () => {
      throws.length = 0;
      cast = null;
      lastResult = null;
      renderMethod();
    }, true);
    appendBtn('返回六爻', () => navigate('/liuyao'), true);
  }

  page.classList.toggle('is-learn-mode', isLearn());
  renderQuestion();
  return () => {
    document.querySelector('.ly-yao-pop')?.remove();
    document.querySelector('.ly-flip-modal')?.remove();
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
