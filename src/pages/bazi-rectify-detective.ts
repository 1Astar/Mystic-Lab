/**
 * 生时校准 v2 · 时光填空题侦探主路径
 * 大框三区：引导条 / 主舞台 / 侦查面板（右侧常驻）
 */
import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import {
  OBJECTIVE_QUESTIONS,
  PERSONALITY_QUESTIONS,
  type DetectiveQuestion,
} from '../bazi/rectify-detective-data.ts';
import { SHICHEN_MID } from '../bazi/rectify-candidates.ts';
import {
  addUserClue,
  canUndoDetectiveStep,
  clearDetectiveDraft,
  emptyDetectiveDraft,
  loadDetectiveDraft,
  rebuildDetectiveEngine,
  saveDetectiveDraft,
  setOpposePick,
  undoDetectiveStep,
  type DetectiveDraft,
  type DetectiveDraftStep,
} from '../bazi/rectify-detective-draft.ts';
import {
  applyDetectiveAnswer,
  detectiveHonestGap,
  detectiveSolarBiasNote,
  getDetectiveBoard,
  isObjectiveComplete,
  isPersonalityComplete,
  rankDetectiveBranches,
  type DetectiveClue,
  type DetectiveEngineState,
} from '../bazi/rectify-detective-engine.ts';
import { buildScriptContrastPack, type LifeScript } from '../bazi/rectify-script-gen.ts';
import { applyUserClueText } from '../bazi/rectify-user-clue.ts';
import { saveRectifyAdoption } from '../bazi/rectify-adoption.ts';
import { formatBirthBrief, loadLifeStore, updateBirthFields } from '../life/storage.ts';
import { parseBirthParts } from '../bazi/parse-birth.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


function nextUnanswered(
  questions: DetectiveQuestion[],
  answers: { questionId: string }[],
): DetectiveQuestion | undefined {
  const done = new Set(answers.map((a) => a.questionId));
  return questions.find((q) => !done.has(q.id));
}

function scriptHtml(script: LifeScript, side: 'left' | 'right' | 'hidden', slim = false): string {
  const majors = script.majors
    .map(
      (m) => `
      <li>
        <span class="bazi-det-script-age">${escapeHtml(m.ageLabel)}</span>
        <strong>${escapeHtml(m.title)}</strong>
        <p>${escapeHtml(m.body)}</p>
      </li>`,
    )
    .join('');
  const micros = slim
    ? ''
    : script.micros
        .slice(0, 6)
        .map(
          (m) => `
      <div class="bazi-det-micro-row">
        <span>${escapeHtml(m.dim)}</span>
        <p>${escapeHtml(m.text)}</p>
      </div>`,
        )
        .join('');
  return `
    <article class="bazi-det-script" data-script-side="${side}">
      <header>
        <p class="bazi-det-script-kicker">${escapeHtml(script.branch)}时 · ${script.confidencePct}%</p>
        <h3>${escapeHtml(script.title)}</h3>
        <p class="bazi-det-script-weather">${escapeHtml(script.weatherMetaphor)}</p>
      </header>
      <ol class="bazi-det-script-majors">${majors}</ol>
      ${micros ? `<div class="bazi-det-script-micros">${micros}</div>` : ''}
      <button type="button" class="life-btn-primary" data-prefer="${escapeHtml(script.branch)}">更像我 · 选这版</button>
    </article>`;
}

function detailContrastHtml(
  pack: NonNullable<ReturnType<typeof buildScriptContrastPack>>,
  userClueCount: number,
  opposePicks: { pairId: string; side: 'left' | 'right' }[],
): string {
  const pickMap = new Map(opposePicks.map((p) => [p.pairId, p.side]));
  const scenarioRows = pack.scenarioRows
    .map(
      (r) => `
      <tr class="${r.leanLeft ? 'is-lean-left' : r.leanRight ? 'is-lean-right' : ''}">
        <th scope="row">
          <strong>${escapeHtml(r.topic)}</strong>
          ${r.clue ? `<span class="bazi-det-scenario-clue">${escapeHtml(r.clue)}</span>` : ''}
        </th>
        <td>${escapeHtml(r.left)}</td>
        <td>${escapeHtml(r.right)}</td>
      </tr>`,
    )
    .join('');

  const dimRows = pack.contrastTable
    .filter((r) =>
      ['气场天气', '外貌倾向', '性情标签', '家宅气象', '工作气质', '亲密关系'].includes(r.dim),
    )
    .map(
      (r) => `
      <tr>
        <th scope="row">${escapeHtml(r.dim)}</th>
        <td>${escapeHtml(r.left)}</td>
        <td>${escapeHtml(r.right)}</td>
      </tr>`,
    )
    .join('');

  const opposeRows = pack.opposePairs
    .map((p) => {
      const side = pickMap.get(p.id);
      return `
      <li class="bazi-det-oppose-item">
        <p class="bazi-det-oppose-topic">${escapeHtml(p.topic)}</p>
        <div class="bazi-det-oppose-choices">
          <button type="button" class="bazi-det-oppose-btn ${side === 'left' ? 'is-on' : ''}" data-oppose-pair="${escapeHtml(p.id)}" data-oppose-side="left" data-oppose-left="${escapeHtml(pack.left.branch)}" data-oppose-right="${escapeHtml(pack.right.branch)}">
            <em>${escapeHtml(pack.left.branch)}时</em>
            <span>${escapeHtml(p.left)}</span>
          </button>
          <button type="button" class="bazi-det-oppose-btn ${side === 'right' ? 'is-on' : ''}" data-oppose-pair="${escapeHtml(p.id)}" data-oppose-side="right" data-oppose-left="${escapeHtml(pack.left.branch)}" data-oppose-right="${escapeHtml(pack.right.branch)}">
            <em>${escapeHtml(pack.right.branch)}时</em>
            <span>${escapeHtml(p.right)}</span>
          </button>
        </div>
      </li>`;
    })
    .join('');

  const clueHint =
    userClueCount > 0
      ? `已根据你补充的 ${userClueCount} 条细节生成对照；下方还可继续补。`
      : '补一句人生大事或生活细节（如「新闻联播时出生」「小时候常搬家」），对照表会跟着变。';

  return `
    <div class="bazi-det-detail-pane">
      <p class="bazi-det-lead">${escapeHtml(clueHint)}</p>
      <div class="bazi-det-clue-input bazi-det-clue-input--inline">
        <label for="det-script-clue">补充细节</label>
        <div class="bazi-det-clue-row">
          <input id="det-script-clue" type="text" maxlength="200" placeholder="人生大事或生活小事，越具体越好" />
          <button type="button" class="life-btn-ghost" data-submit-clue>补线索</button>
        </div>
      </div>
      ${
        pack.opposePairs.length
          ? `<section class="bazi-det-scenario-block" aria-labelledby="det-oppose-title">
        <h3 id="det-oppose-title" class="bazi-det-detail-heading">性格对照</h3>
        <p class="bazi-det-detail-note">每组点选更像你的一边，会抬高对应时辰权重。</p>
        <ul class="bazi-det-oppose-list">${opposeRows}</ul>
      </section>`
          : ''
      }
      <section class="bazi-det-scenario-block" aria-labelledby="det-scenario-title">
        <h3 id="det-scenario-title" class="bazi-det-detail-heading">情境细节</h3>
        <p class="bazi-det-detail-note">同一行左右必须能问出口、能辨认——来自你补充的内容或默认可对立场景。</p>
        <div class="bazi-det-compare-scroll">
          <table class="bazi-det-compare-table">
            <thead>
              <tr>
                <th scope="col">细节</th>
                <th scope="col">${escapeHtml(pack.left.branch)}时</th>
                <th scope="col">${escapeHtml(pack.right.branch)}时</th>
              </tr>
            </thead>
            <tbody>${scenarioRows || '<tr><td colspan="3">暂无可对照场景，请补充细节。</td></tr>'}</tbody>
          </table>
        </div>
      </section>
      <section class="bazi-det-scenario-block" aria-labelledby="det-dim-title">
        <h3 id="det-dim-title" class="bazi-det-detail-heading">维度画像</h3>
        <div class="bazi-det-compare-scroll">
          <table class="bazi-det-compare-table">
            <thead>
              <tr>
                <th scope="col">维度</th>
                <th scope="col">${escapeHtml(pack.left.branch)}时</th>
                <th scope="col">${escapeHtml(pack.right.branch)}时</th>
              </tr>
            </thead>
            <tbody>${dimRows}</tbody>
          </table>
        </div>
      </section>
      <div class="bazi-det-cta-row">
        <button type="button" class="life-btn-primary" data-prefer="${escapeHtml(pack.left.branch)}">更像 ${escapeHtml(pack.left.branch)}时</button>
        <button type="button" class="life-btn-ghost" data-prefer="${escapeHtml(pack.right.branch)}">更像 ${escapeHtml(pack.right.branch)}时</button>
      </div>
    </div>`;
}

export function renderBaziRectifyDetective(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const store = loadLifeStore();
  const ready = Boolean(
    parseBirthParts(store.profile.birthYear, store.profile.birthMonth, store.profile.birthDay, ''),
  );

  let draft: DetectiveDraft = loadDetectiveDraft() ?? emptyDetectiveDraft();
  let state: DetectiveEngineState | null = ready
    ? rebuildDetectiveEngine(store.profile, draft)
    : null;
  let lastClue: DetectiveClue | null = state?.clues.at(-1) ?? null;
  let scriptView: 'left' | 'right' | 'hidden' = 'left';
  let scriptContentTab: 'story' | 'detail' = 'detail';

  const page = document.createElement('div');
  page.className = 'page life-page bazi-rectify-page bazi-det-page';
  mountEnvBanner(page);

  function persist(): void {
    draft = { ...draft, updatedAt: new Date().toISOString() };
    saveDetectiveDraft(draft);
  }

  function setStep(step: DetectiveDraftStep): void {
    draft = { ...draft, step };
    persist();
    paint();
  }

  /** 顶栏切换：已走过的可回；未完成前置时剧本/结果先锁住 */
  function canVisitStep(step: DetectiveDraftStep): boolean {
    if (step === 'welcome' || step === 'objective') return true;
    const order: DetectiveDraftStep[] = [
      'welcome',
      'objective',
      'personality',
      'script',
      'result',
    ];
    const curIdx = order.indexOf(draft.step);
    const targetIdx = order.indexOf(step);
    if (targetIdx >= 0 && targetIdx <= curIdx) return true;

    const hasObj = draft.answers.some((a) => a.questionId.startsWith('obj'));
    const hasPer = draft.answers.some((a) => a.questionId.startsWith('per'));
    const objDone = state ? isObjectiveComplete(state) : false;
    const perDone = state ? isPersonalityComplete(state) : false;

    if (step === 'personality') return hasObj || objDone;
    if (step === 'script') return hasPer || perDone;
    if (step === 'result') {
      return Boolean(draft.preferredBranch) || (hasPer && state != null && rankDetectiveBranches(state).length > 0);
    }
    return false;
  }

  function boardHtml(): string {
    if (!state) return '';
    const board = getDetectiveBoard(state);
    const elim = new Set(board.eliminated);
    const glow = new Set(board.glowing);
    /** 午在上（正午）、子在下（夜半），更有钟面时间感 */
    const chips = SHICHEN_MID.map((meta, i) => {
      const b = meta.branch;
      const slot = (i + 6) % 12; // 午→0 置顶
      const cls = [
        'bazi-det-chip',
        elim.has(b) ? 'is-dim' : 'is-active',
        glow.has(b) ? 'is-glow' : '',
      ]
        .filter(Boolean)
        .join(' ');
      const range = meta.clockRange.replace(/点/g, '');
      return `<span class="${cls}" style="--i:${slot}" data-branch="${b}">
        <em>${b}</em>
        <small>${escapeHtml(range)}</small>
      </span>`;
    }).join('');
    return `
      <div class="bazi-det-clock" aria-label="十二时辰日晷">
        <div class="bazi-det-clock-face">
          <span class="bazi-det-clock-hub" aria-hidden="true">日晷</span>
          ${chips}
        </div>
      </div>
      <details class="bazi-det-extra"${lastClue ? ' open' : ''}>
        <summary>补充细节 · 线索</summary>
        <p class="bazi-det-gap">${escapeHtml(detectiveHonestGap(state))}</p>
        <p class="bazi-det-gap bazi-det-solar-note">${escapeHtml(detectiveSolarBiasNote(store.profile.birthPlace))}</p>
        ${
          lastClue
            ? `<div class="bazi-det-clue-pop" role="status">
                <strong>${escapeHtml(lastClue.title)}</strong>
                <p>${escapeHtml(lastClue.body)}</p>
              </div>`
            : `<p class="bazi-det-panel-hint">答一题，这里会亮起线索。</p>`
        }
      </details>`;
  }

  function paint(): void {
    if (!ready) {
      page.innerHTML = `
        <button type="button" class="back-link life-back" data-path="/profile">← 返回档案</button>
        <header class="life-header">
          <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
          <h1 class="page-title">时光填空题</h1>
          <p class="page-subtitle">需要先填写出生年月日</p>
        </header>
        <section class="life-profile-gate">
          <div>
            <p class="life-card-kicker">还不能开案</p>
            <p class="life-gate-brief">年月日确定后，才能按当日各时辰差异做侦探校准。</p>
          </div>
          <button type="button" class="life-btn-primary" data-path="/profile">去管理档案</button>
        </section>`;
      bindCommon();
      return;
    }

    const brief = formatBirthBrief(store.profile);
    const stage = draft.step;

    let stageHtml = '';
    if (stage === 'welcome') {
      stageHtml = `
        <section class="bazi-det-stage">
          <p class="bazi-det-kicker">生时校准 · 侦探流</p>
          <h2 class="life-route-title">只差临门一脚？做个小小的「时光填空题」</h2>
          <p class="bazi-det-lead">
            我们不先问「几点生的」。你会先答几道粗筛与性格题；系统用你<strong>当天十二时辰的真实排盘差异</strong>亮起或压暗候选，再生成两套人生剧本让你辨认。
          </p>
          <ul class="bazi-det-bullets">
            <li>规则引擎定名次，AI 不改排名</li>
            <li>玩中学：每答一题弹出线索</li>
            <li>旧的「大事件年表」校准仍可作加深</li>
          </ul>
          <div class="bazi-det-cta-row">
            <button type="button" class="life-btn-primary" data-go="objective">开始填空</button>
            <button type="button" class="life-btn-ghost" data-path="/bazi/rectify/events">改用事件年表加深 ›</button>
          </div>
        </section>`;
    } else if (stage === 'objective' || stage === 'personality') {
      const bank = stage === 'objective' ? OBJECTIVE_QUESTIONS : PERSONALITY_QUESTIONS;
      const q = nextUnanswered(bank, draft.answers);
      if (!q) {
        // 自动跳步
        if (stage === 'objective') {
          draft = { ...draft, step: 'personality' };
          persist();
          paint();
          return;
        }
        draft = { ...draft, step: 'script' };
        persist();
        paint();
        return;
      }
      const answered = bank.filter((x) => draft.answers.some((a) => a.questionId === x.id)).length;
      stageHtml = `
        <section class="bazi-det-stage">
          <p class="bazi-det-kicker">${escapeHtml(q.stepTitle)} · ${answered + 1}/${bank.length}</p>
          <h2 class="life-route-title">${escapeHtml(q.title)}</h2>
          ${q.subtitle ? `<p class="bazi-det-lead">${escapeHtml(q.subtitle)}</p>` : ''}
          <div class="bazi-det-options" role="list">
            ${q.options
              .map(
                (o) => `
              <button type="button" class="bazi-det-option" data-q="${escapeHtml(q.id)}" data-o="${escapeHtml(o.id)}">
                <strong>${escapeHtml(o.label)}</strong>
                ${o.hint ? `<span>${escapeHtml(o.hint)}</span>` : ''}
              </button>`,
              )
              .join('')}
          </div>
          <details class="bazi-det-clue-fold">
            <summary>补充细节（可选）</summary>
            <div class="bazi-det-clue-input">
              <label for="det-user-clue">写一句给我们反查</label>
              <div class="bazi-det-clue-row">
                <input id="det-user-clue" type="text" maxlength="200" placeholder="例如：小时候经常搬家 / 新闻联播开始时出生" />
                <button type="button" class="life-btn-ghost" data-submit-clue>补线索</button>
              </div>
            </div>
          </details>
          ${
            canUndoDetectiveStep(draft)
              ? `<div class="bazi-det-cta-row"><button type="button" class="life-btn-ghost" data-undo-step>← 返回上一步</button></div>`
              : ''
          }
        </section>`;
    } else if (stage === 'script') {
      if (!state) {
        stageHtml = `<section class="bazi-det-stage"><p>引擎未就绪</p></section>`;
      } else {
        const ranked = rankDetectiveBranches(state);
        const pack = buildScriptContrastPack(
          store.profile,
          ranked,
          draft.userClues.map((c) => c.text),
        );
        if (!pack) {
          stageHtml = `
            <section class="bazi-det-stage">
              <h2 class="life-route-title">候选还不够对照</h2>
              <p class="bazi-det-lead">请再答几道性格题，或补充细节线索。</p>
              <div class="bazi-det-cta-row">
                <button type="button" class="life-btn-ghost" data-undo-step>← 返回上一步</button>
                <button type="button" class="life-btn-primary" data-go="personality">继续答题</button>
              </div>
            </section>`;
        } else {
          const show =
            scriptView === 'hidden' && pack.hidden
              ? pack.hidden
              : scriptView === 'right'
                ? pack.right
                : pack.left;
          const side =
            scriptView === 'hidden' && pack.hidden
              ? 'hidden'
              : scriptView === 'right'
                ? 'right'
                : 'left';
          stageHtml = `
            <section class="bazi-det-stage">
              <p class="bazi-det-kicker">剧本对照</p>
              <h2 class="life-route-title">哪一版人生更像你？</h2>
              <div class="bazi-det-content-tabs" role="tablist" aria-label="剧本内容">
                <button type="button" class="bazi-det-content-tab ${scriptContentTab === 'detail' ? 'is-on' : ''}" data-script-content="detail" role="tab" aria-selected="${scriptContentTab === 'detail'}">细节对照</button>
                <button type="button" class="bazi-det-content-tab ${scriptContentTab === 'story' ? 'is-on' : ''}" data-script-content="story" role="tab" aria-selected="${scriptContentTab === 'story'}">人生故事</button>
              </div>
              ${
                scriptContentTab === 'detail'
                  ? detailContrastHtml(pack, draft.userClues.length, draft.opposePicks)
                  : `
              <p class="bazi-det-lead">先看人生大走向；要认具体细节请切「细节对照」。</p>
              <div class="bazi-det-script-tabs">
                <button type="button" class="bazi-det-tab ${scriptView === 'left' ? 'is-on' : ''}" data-script-view="left">${escapeHtml(pack.left.branch)}时</button>
                <button type="button" class="bazi-det-tab ${scriptView === 'right' ? 'is-on' : ''}" data-script-view="right">${escapeHtml(pack.right.branch)}时</button>
                ${
                  pack.hidden
                    ? `<button type="button" class="bazi-det-tab ${scriptView === 'hidden' ? 'is-on' : ''}" data-script-view="hidden">${draft.revealHiddenScript ? escapeHtml(pack.hidden.branch) + '时' : '还有一版'}</button>`
                    : ''
                }
              </div>
              ${scriptHtml(show, side, true)}`
              }
              <div class="bazi-det-cta-row">
                <button type="button" class="life-btn-ghost" data-undo-step>← 返回上一步</button>
                <button type="button" class="life-btn-ghost" data-go="result">先看结果 ›</button>
              </div>
            </section>`;
        }
      }
    } else {
      // result
      const ranked = state ? rankDetectiveBranches(state) : [];
      const preferred =
        ranked.find((r) => r.branch === draft.preferredBranch) ?? ranked[0];
      stageHtml = `
        <section class="bazi-det-stage">
          <p class="bazi-det-kicker">魔法时刻</p>
          <h2 class="life-route-title">${preferred ? `暂倾向 ${escapeHtml(preferred.branch)}时` : '暂无定论'}</h2>
          ${
            preferred
              ? `<p class="bazi-det-lead">${escapeHtml(preferred.profile.weatherMetaphor)} · 时柱 ${escapeHtml(preferred.profile.hourPillar)} · 可信度约 ${preferred.confidencePct}%</p>
                 <p class="bazi-det-lead">${escapeHtml(detectiveHonestGap(state!))}</p>
                 <div class="bazi-det-cta-row">
                   <button type="button" class="life-btn-primary" data-adopt="${escapeHtml(preferred.branch)}">采用为暂定时辰</button>
                   <button type="button" class="life-btn-ghost" data-undo-step>← 返回上一步</button>
                   <button type="button" class="life-btn-ghost" data-go="script">再对照剧本</button>
                   <button type="button" class="life-btn-ghost" data-path="/bazi/rectify/events">用大事件加深校准 ›</button>
                 </div>
                 <p class="life-footnote">采用后会写入档案时辰（可随时改）。名次由规则引擎给出，未用 AI 改排名。</p>`
              : `<button type="button" class="life-btn-primary" data-go="objective">重新开案</button>`
          }
          <button type="button" class="life-btn-ghost" data-reset>清空本案草稿</button>
        </section>`;
    }

    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/bazi">← 八字</button>
      <div class="bazi-det-shell">
        <aside class="bazi-det-panel" aria-label="侦查板">
          <p class="bazi-det-panel-title">侦查板 · 日晷</p>
          ${boardHtml()}
        </aside>
        <header class="bazi-det-guide">
          <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'sm')}</div>
          <div>
            <p class="bazi-det-brief">${escapeHtml(brief)}</p>
            <nav class="bazi-det-steps" aria-label="进度">
              ${(
                [
                  ['welcome', '欢迎'],
                  ['objective', '粗筛'],
                  ['personality', '性格'],
                  ['script', '剧本'],
                  ['result', '结果'],
                ] as const
              )
                .map(([id, label]) => {
                  const on = stage === id;
                  const unlocked = canVisitStep(id);
                  return `<button type="button" class="bazi-det-step ${on ? 'is-on' : ''} ${unlocked ? '' : 'is-locked'}" data-nav-step="${id}" ${unlocked ? '' : 'disabled'} aria-current="${on ? 'step' : 'false'}">${label}</button>`;
                })
                .join('')}
            </nav>
          </div>
        </header>
        <div class="bazi-det-main">${stageHtml}</div>
      </div>`;

    bindCommon();
    bindStage();
  }

  function bindCommon(): void {
    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-nav-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const step = btn.dataset.navStep as DetectiveDraftStep | undefined;
        if (!step || !canVisitStep(step)) return;
        setStep(step);
      });
    });
    page.querySelector('[data-reset]')?.addEventListener('click', () => {
      clearDetectiveDraft();
      draft = emptyDetectiveDraft();
      state = rebuildDetectiveEngine(store.profile, draft);
      lastClue = null;
      scriptView = 'left';
      scriptContentTab = 'detail';
      paint();
    });
    page.querySelector('[data-undo-step]')?.addEventListener('click', () => {
      if (!canUndoDetectiveStep(draft)) return;
      draft = undoDetectiveStep(draft);
      saveDetectiveDraft(draft);
      state = rebuildDetectiveEngine(store.profile, draft);
      lastClue = state?.clues.at(-1) ?? null;
      scriptView = 'left';
      scriptContentTab = 'detail';
      paint();
    });
  }

  function bindStage(): void {
    page.querySelectorAll<HTMLButtonElement>('[data-go]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const go = btn.dataset.go as DetectiveDraftStep | undefined;
        if (!go) return;
        if (go === 'personality' && state && !isObjectiveComplete(state)) {
          setStep('objective');
          return;
        }
        if (go === 'script' && state && !isPersonalityComplete(state)) {
          // 允许提前进剧本，但诚实提示已在 gap
        }
        setStep(go);
      });
    });

    page.querySelectorAll<HTMLButtonElement>('[data-q]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!state) return;
        const qid = btn.dataset.q ?? '';
        const oid = btn.dataset.o ?? '';
        const res = applyDetectiveAnswer(state, qid, oid);
        state = res.state;
        lastClue = res.clue;
        draft = {
          ...draft,
          answers: state.answers,
          updatedAt: new Date().toISOString(),
        };
        if (draft.step === 'objective' && isObjectiveComplete(state)) {
          draft = { ...draft, step: 'personality' };
        } else if (draft.step === 'personality' && isPersonalityComplete(state)) {
          draft = { ...draft, step: 'script' };
        }
        persist();
        paint();
      });
    });

    page.querySelector('[data-submit-clue]')?.addEventListener('click', () => {
      if (!state) return;
      const input =
        page.querySelector<HTMLInputElement>('#det-user-clue') ??
        page.querySelector<HTMLInputElement>('#det-script-clue');
      const text = input?.value?.trim() ?? '';
      if (!text) return;
      const res = applyUserClueText(state, text, {
        birthYear: store.profile.birthYear,
        birthMonth: store.profile.birthMonth,
        birthDay: store.profile.birthDay,
        birthPlace: store.profile.birthPlace,
      });
      state = res.state;
      lastClue = res.clue;
      draft = addUserClue(draft, text, res.parsed.matched);
      if (input) input.value = '';
      if (draft.step === 'script') scriptContentTab = 'detail';
      paint();
    });

    page.querySelectorAll<HTMLButtonElement>('[data-oppose-pair]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!state) return;
        const pairId = btn.dataset.opposePair ?? '';
        const side = btn.dataset.opposeSide as 'left' | 'right' | undefined;
        const leftBranch = btn.dataset.opposeLeft ?? '';
        const rightBranch = btn.dataset.opposeRight ?? '';
        if (!pairId || (side !== 'left' && side !== 'right') || !leftBranch || !rightBranch) return;
        draft = setOpposePick(draft, { pairId, side, leftBranch, rightBranch });
        state = rebuildDetectiveEngine(store.profile, draft);
        lastClue = state?.clues.at(-1) ?? lastClue;
        scriptContentTab = 'detail';
        paint();
      });
    });

    page.querySelectorAll<HTMLButtonElement>('[data-script-content]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.scriptContent as 'story' | 'detail' | undefined;
        if (!tab) return;
        scriptContentTab = tab;
        paint();
      });
    });

    page.querySelectorAll<HTMLButtonElement>('[data-script-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.scriptView as 'left' | 'right' | 'hidden';
        scriptView = v;
        if (v === 'hidden') {
          draft = { ...draft, revealHiddenScript: true };
          persist();
        }
        paint();
      });
    });

    page.querySelectorAll<HTMLButtonElement>('[data-prefer]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const b = btn.dataset.prefer ?? '';
        draft = { ...draft, preferredBranch: b, step: 'result' };
        persist();
        paint();
      });
    });

    page.querySelectorAll<HTMLButtonElement>('[data-adopt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!state) return;
        const branch = btn.dataset.adopt ?? '';
        const ranked = rankDetectiveBranches(state);
        const row = ranked.find((r) => r.branch === branch) ?? ranked[0];
        if (!row) return;
        updateBirthFields({
          birthYear: store.profile.birthYear,
          birthMonth: store.profile.birthMonth,
          birthDay: store.profile.birthDay,
          birthHour: row.profile.birthHour,
          birthPlace: store.profile.birthPlace,
        });
        const alts = ranked.slice(0, 3).filter((r) => r.branch !== row.branch);
        saveRectifyAdoption({
          birthHour: row.profile.birthHour,
          branch: row.branch,
          label: row.profile.label,
          confidencePct: row.confidencePct,
          confidenceLabel:
            row.confidencePct >= 40 ? '较高' : row.confidencePct >= 25 ? '中等' : '偏低',
          alternatives: alts.map((a) => ({
            branch: a.branch,
            label: a.profile.label,
            confidencePct: a.confidencePct,
          })),
          adoptedAt: new Date().toISOString(),
          provisional: true,
        });
        navigate('/bazi/reading');
      });
    });
  }

  root.appendChild(page);
  paint();

  return () => {
    stars.remove();
    page.remove();
  };
}
