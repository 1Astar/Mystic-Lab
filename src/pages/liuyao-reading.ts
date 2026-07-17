import { navigate } from '../router.ts';
import { wait, prefersReducedMotion } from '../tarot/animations.ts';
import {
  buildCastFromThrows,
  castSixYao,
  rollOneYao,
  type CastResult,
  type YaoThrow,
} from '../liuyao/engine.ts';
import { bindGuideInteractions, renderComposeTeach } from '../liuyao/compose-teach.ts';
import {
  bindResultLayers,
  NOTE_TAG_OPTIONS,
  renderResultLayers,
} from '../liuyao/result-layers.ts';
import { LINE_LABELS } from '../liuyao/hexagrams.ts';
import { buildFourLayerReading } from '../liuyao/interpret.ts';
import {
  collectJournalPrompts,
  mergeReflection,
  renderJournalPromptsHtml,
} from '../liuyao/journal-prompts.ts';
import { saveLiuyaoJournalEntry } from '../liuyao/journal.ts';
import { playLiuyaoSfx, preloadLiuyaoSfx } from '../liuyao/sfx.ts';
import { LIUYAO_ASSETS } from '../liuyao/assets.ts';
import {
  renderFlipTeachBar,
  renderFlipTeachModule,
  showFlipTeachModal,
} from '../liuyao/flip-teach.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mountLiuyaoSfxToggle } from '../ui/liuyao/sfx-toggle.ts';
import {
  renderHexagramSvg,
  renderThreeCoins,
} from '../ui/liuyao/hexagram-view.ts';

export function renderLiuyaoReading(root: HTMLElement): () => void {
  let question = '';
  let method: 'coin' | 'random' = 'coin';
  const throws: YaoThrow[] = [];
  let cast: CastResult | null = null;
  let journalSaved = false;
  let castingAnim = false;

  const page = document.createElement('div');
  page.className = 'page ly-reading-page';
  mountEnvBanner(page);

  const topbar = document.createElement('div');
  topbar.className = 'ly-topbar';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回六爻';
  back.addEventListener('click', () => navigate('/liuyao'));
  const actionsHost = document.createElement('div');
  actionsHost.className = 'ly-topbar-actions';
  topbar.append(back, actionsHost);
  mountLiuyaoSfxToggle(actionsHost);

  const stage = document.createElement('div');
  stage.className = 'ly-reading-stage';
  const actions = document.createElement('div');
  actions.className = 'ly-reading-actions';

  page.append(topbar, stage, actions);
  root.appendChild(page);
  preloadLiuyaoSfx();

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

  function renderQuestion(): void {
    clearActions();
    stage.innerHTML = `
      <div class="ly-step ly-step-question">
        <p class="ly-step-kicker">Step 1</p>
        <h1 class="ly-step-title">此刻，你想问什么？</h1>
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
    clearActions();
    stage.innerHTML = `
      <div class="ly-step ly-step-method">
        <p class="ly-step-kicker">Step 2</p>
        <h2 class="ly-step-title">选择起卦方式</h2>
        ${question ? `<p class="ly-question-recap">「${escapeHtml(question)}」</p>` : '<p class="ly-question-recap">未写下问题 · 可先起卦</p>'}
        <div class="ly-method-grid">
          <button type="button" class="ly-method-card is-active" data-m="coin">
            <img class="ly-method-coin" src="/liuyao/coin-obverse.png" alt="" />
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
    clearActions();
    renderCastingUi();
    // 底部不再强制按钮：点铜钱即可；保留文案提示
    const hint = document.createElement('p');
    hint.className = 'ly-cast-hint';
    hint.textContent = '点击铜钱起卦 · 共六次成卦，第七次查看结果';
    actions.appendChild(hint);
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
    // 六爻已成 → 第七次点击进入结果
    if (throws.length >= 6) {
      if (!cast) cast = buildCastFromThrows(throws, 'coin');
      await renderReveal(cast);
      return;
    }
    await throwNext();
  }

  function renderCastingUi(): void {
    const n = throws.length;
    const done = n >= 6;
    const logHtml = throws
      .map(
        (t, i) =>
          `<p class="ly-throw-row">第${i + 1}次 · ${t.kind} · ${t.coins.map((c) => (c === 'reverse' ? '背' : '字')).join(' ')}</p>`,
      )
      .join('');
    const padLines = Array.from({ length: Math.max(0, 6 - throws.length) }, () => 0 as const);
    const changingIndexes = throws
      .map((t, i) => (t.changing ? i : -1))
      .filter((i) => i >= 0);
    const kicker = done
      ? 'Step 3 · 六爻已成'
      : `Step 3 · 第 ${n + 1} / 6 爻`;
    const title = done ? '先翻牌搞懂规则，再查看卦象' : '点击铜钱，落下一子';
    const latest = n > 0 ? throws[n - 1]! : null;
    const teachBlock = done
      ? renderFlipTeachModule(throws)
      : latest
        ? renderFlipTeachBar(latest, n - 1)
        : '';

    stage.innerHTML = `
      <div class="ly-step ly-step-casting">
        <p class="ly-step-kicker">${kicker}</p>
        <h2 class="ly-step-title">${title}</h2>
        <div class="ly-board">
          <img class="ly-board-bg" src="${LIUYAO_ASSETS.baguaBoard}" alt="" aria-hidden="true" />
          <div class="ly-board-glow"></div>
          <div class="ly-board-coins" aria-label="${done ? '点击查看卦象' : '点击摇动铜钱'}">${renderThreeCoins(throws[n - 1]?.coins)}</div>
          <div class="ly-board-hex">${renderHexagramSvg({
            lines: [...throws.map((t) => t.bit), ...padLines],
            changingIndexes,
            revealedCount: n,
            animateIndex: done ? 5 : n - 1,
            compact: true,
          })}</div>
        </div>
        <p class="ly-cast-legend">字＝阴(2) · 背＝阳(3) · 阳画连横 · 阴画断开 · 老阳○/老阴×会变</p>
        ${teachBlock}
        <div class="ly-throw-log">${logHtml}</div>
      </div>
    `;
    bindCoinTap();
    bindFlipTeach();
  }

  function bindFlipTeach(): void {
    stage.querySelectorAll<HTMLElement>('[data-flip-index]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = Number(el.dataset.flipIndex);
        const t = throws[i];
        if (t) showFlipTeachModal(t, i);
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
    clearActions();
    const hint = document.createElement('p');
    hint.className = 'ly-cast-hint';
    hint.textContent =
      throws.length < 6
        ? `已成 ${throws.length} 爻 · 可点「翻牌解谜」再继续摇`
        : '六爻已成 · 可先翻牌学规则，再点铜钱看结果';
    actions.appendChild(hint);
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
      </div>
    `;
    await wait(prefersReducedMotion() ? 100 : 600);
    renderResult(result);
  }

  function renderResult(result: CastResult): void {
    clearActions();
    const reading = buildFourLayerReading(result, question);
    const changingLabels = result.changingIndexes.map((i) => LINE_LABELS[i]!);
    let noteTags: string[] = [];
    let noteDraft = '';

    stage.innerHTML = `
      <div class="ly-step ly-step-result">
        <p class="ly-question-recap">${question ? `你的问题 · ${escapeHtml(question)}` : '未写下具体问题 · 以下按卦象结构推演'}</p>

        <section class="ly-result-panel ly-reading-layer">
          <span class="ly-layer-num">一</span>
          <h3>一句话总结</h3>
          <p>${escapeHtml(reading.summary)}</p>
        </section>
        <section class="ly-result-panel ly-reading-layer">
          <span class="ly-layer-num">二</span>
          <h3>卦象依据</h3>
          <p class="ly-reading-multiline">${escapeHtml(reading.basis).replace(/\n/g, '<br>')}</p>
        </section>
        <section class="ly-result-panel ly-reading-layer">
          <span class="ly-layer-num">三</span>
          <h3>结合你的问题</h3>
          <p class="ly-reading-multiline">${escapeHtml(reading.context).replace(/\n/g, '<br>')}</p>
        </section>
        <section class="ly-result-panel ly-reading-layer">
          <span class="ly-layer-num">四</span>
          <h3>行动建议</h3>
          <p>${escapeHtml(reading.action)}</p>
        </section>

        ${renderResultLayers(result, question)}

        ${renderComposeTeach({
          cast: result,
          question,
        })}

        <section class="ly-result-panel ly-peer-note">
          <h3>同人笔记</h3>
          <p class="ly-layer-guide">写下来，才变成你的六爻日记。系统会自动带入卦象与世应。</p>
          <div class="ly-note-tags">
            ${NOTE_TAG_OPTIONS.map(
              (t) => `<button type="button" class="ly-note-tag" data-tag="${t}">#${t}</button>`,
            ).join('')}
          </div>
          ${renderJournalPromptsHtml()}
          <textarea class="question-input ly-note-draft" rows="3" placeholder="自由补充：还可以写别的感受…"></textarea>
          <p class="ly-note-meta">将保存：${result.primary.fullName}${
            result.changed ? ` → ${result.changed.fullName}` : ''
          } · 世${LINE_LABELS[result.shiLine - 1]} / 应${LINE_LABELS[result.yingLine - 1]}</p>
        </section>
      </div>
    `;

    const guideRoot = stage.querySelector<HTMLElement>('[data-guide-root]');
    if (guideRoot) bindGuideInteractions(guideRoot, result, question);
    const layersApi = bindResultLayers(stage, result, question);

    stage.querySelectorAll<HTMLButtonElement>('.ly-note-tag').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.tag!;
        if (noteTags.includes(tag)) {
          noteTags = noteTags.filter((t) => t !== tag);
          btn.classList.remove('is-on');
        } else {
          noteTags.push(tag);
          btn.classList.add('is-on');
        }
      });
    });
    stage.querySelector('.ly-note-draft')?.addEventListener('input', (e) => {
      noteDraft = (e.target as HTMLTextAreaElement).value;
    });

    appendBtn('保存到我的卦象', () => {
      if (!journalSaved) {
        saveLiuyaoJournalEntry({
          question,
          cast: result,
          reading,
          changingLabels,
          tags: noteTags,
          reflection: mergeReflection(noteDraft, collectJournalPrompts(stage)),
          castAt: layersApi.getCastAt().toISOString(),
        });
        journalSaved = true;
      }
      navigate('/liuyao/journal');
    });
    appendBtn('再占一卦', () => {
      throws.length = 0;
      cast = null;
      renderMethod();
    }, true);
    appendBtn('返回六爻', () => navigate('/liuyao'), true);
  }

  renderQuestion();
  return () => {
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
