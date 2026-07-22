import type { CastResult } from './engine.ts';
import { LINE_LABELS, upperLowerFromLines, yingLineOf } from './hexagrams.ts';
import {
  composeScene,
  detectSceneDomain,
  type SceneDomain,
} from './scene-map.ts';
import { buildStrategyPack } from './strategy.ts';
import { formatClauseHtml } from './format-clause.ts';
import {
  lineApproxWuXing,
  shiYingRelation,
} from './wuxing.ts';
import { renderXiangVisual } from './xiang-visual.ts';
import { renderHexagramSvg } from '../ui/liuyao/hexagram-view.ts';
import { buildReadingFacts } from './reading-facts.ts';
import {
  bindBianQuiz,
  buildBianQuiz,
  renderBianQuizHtml,
} from './bian-quiz.ts';

export interface FiveStepItem {
  step: 1 | 2 | 3 | 4 | 5;
  title: string;
  lookAt: string;
  body: string[];
}

export function buildFiveSteps(
  cast: CastResult,
  question = '',
  domain?: SceneDomain,
): FiveStepItem[] {
  const d = domain ?? detectSceneDomain(question);
  const { upper, lower } = upperLowerFromLines(cast.primaryLines);
  const scene = composeScene(upper, lower, cast.primary);
  const shiLabel = LINE_LABELS[cast.shiLine - 1]!;
  const yingLabel = LINE_LABELS[cast.yingLine - 1]!;
  const moveCount = cast.changingIndexes.length;
  const moving =
    moveCount === 0 ? null : cast.changingIndexes.map((i) => LINE_LABELS[i]!).join('、');

  const shiWx = lineApproxWuXing(cast.shiLine, upper.id, lower.id);
  const yingWx = lineApproxWuXing(cast.yingLine, upper.id, lower.id);
  const rel = shiYingRelation(shiWx, yingWx);

  return [
    {
      step: 1,
      title: '先找「你」和「外界」的位置',
      lookAt: `世（我）在${shiLabel} · 应（外界）在${yingLabel}`,
      body: [
        '世＝你，应＝对方或环境。金色圈＝世，红色圈＝应。',
        `因为世在${shiLabel}、应在${yingLabel}，所以这一卦先看你们谁在哪一层：世应${rel.rel} → ${rel.verdict}。${rel.tip}`,
      ],
    },
    {
      step: 2,
      title: '看看哪些地方「动」了？（找转机）',
      lookAt: moving ? `${moveCount} 个动爻：${moving}` : '无动爻',
      body: moving
        ? [
            `因为动爻在${moving}，所以这些位置正在「变心」——是你当下最该盯的具体事。`,
            moveCount >= 3
              ? '动爻偏多：事情更复杂，先拆一件一件看。'
              : '动爻少：方向更明确，抓住这几处就够。',
          ]
        : [
            '因为没有「变心」的爻，所以格局相对稳——先把世应与本卦场景看清，不必硬找变。',
            '动爻越多越复杂；动爻越少方向越明确。',
          ],
    },
    {
      step: 3,
      title: '把上下两个卦翻译成生活场景',
      lookAt: `上${upper.nature}（环境）· 下${lower.nature}（自己）`,
      body: [
        '把上卦想成天/环境，下卦想成地/自己，连起来想。',
        d === 'love' ? scene.love : scene.career,
        scene.meaning,
      ],
    },
    {
      step: 4,
      title: '看过程：本卦 → 变卦',
      lookAt: cast.changed
        ? `${cast.primary.name} → ${cast.changed.name}`
        : `${cast.primary.name}（无变）`,
      body: cast.changed
        ? [
            `现在（本卦「${cast.primary.fullName}」）→ 经历变化（动爻）→ 下一幕（变卦「${cast.changed.fullName}」）。`,
            `因为动爻在动，事情从「${cast.primary.keywords[0]}」滑向「${cast.changed.keywords[0]}」。`,
          ]
        : ['无动则无变：时间轴停在本卦。把当前状态看清，比空想结局更有用。'],
    },
    {
      step: 5,
      title: '连回生活：给出可执行策略',
      lookAt: question.trim() || '对照你真正在意的事',
      body: [
        '最后一步才落到生活：不要只拿一句总结交差，要有可执行的策略清单。',
        '下面可点「陪读」问题，帮你把卦象说成人话。',
      ],
    },
  ];
}

export function renderFiveStepsHtml(
  steps: FiveStepItem[],
  opts?: { interactive?: boolean; active?: number },
): string {
  const items = steps
    .map((s) => {
      const active = opts?.active === s.step ? ' is-active' : '';
      if (opts?.interactive) {
        return `
      <button type="button" class="ly-step-card ly-tap${active}" data-guide-step="${s.step}">
        <span class="ly-step-badge">Step ${s.step}</span>
        <strong>${s.title}</strong>
        <span class="ly-step-look">${s.lookAt}</span>
      </button>`;
      }
      return `
      <article class="ly-step-card${active}">
        <span class="ly-step-badge">Step ${s.step}</span>
        <strong>${s.title}</strong>
        <span class="ly-step-look">${s.lookAt}</span>
      </article>`;
    })
    .join('');

  return `
    <section class="ly-five-steps" aria-label="读卦五步走">
      <h3 class="ly-five-title">怎么读这一卦</h3>
      <p class="ly-five-lead">找你与外界 → 找转机（动爻）→ 翻译场景 → 看本变 → 连生活</p>
      <div class="ly-five-grid">${items}</div>
    </section>
  `;
}

export function fiveStepExplain(step: FiveStepItem): { title: string; body: string[] } {
  return {
    title: `Step ${step.step} · ${step.title}`,
    body: [step.lookAt, ...step.body],
  };
}

function renderTimeline(cast: CastResult): string {
  const mid =
    cast.changingIndexes.length > 0
      ? cast.changingIndexes.map((i) => LINE_LABELS[i]).join('、')
      : '无动';
  return `
    <div class="ly-timeline" aria-label="本卦到变卦">
      <div class="ly-timeline-node">
        <span class="ly-timeline-kicker">初始</span>
        <strong>${cast.primary.fullName}</strong>
        <span>${cast.primary.keywords[0]}</span>
      </div>
      <div class="ly-timeline-arrow">
        <span>动爻</span>
        <em>${mid}</em>
      </div>
      <div class="ly-timeline-node">
        <span class="ly-timeline-kicker">下一幕</span>
        <strong>${cast.changed ? cast.changed.fullName : '仍在本卦'}</strong>
        <span>${cast.changed ? cast.changed.keywords[0] : '先看清当下'}</span>
      </div>
    </div>
  `;
}

function renderStepPanel(cast: CastResult, step: number, question: string, domain: SceneDomain): string {
  const { upper, lower } = upperLowerFromLines(cast.primaryLines);
  const scene = composeScene(upper, lower, cast.primary);
  const shiWx = lineApproxWuXing(cast.shiLine, upper.id, lower.id);
  const yingWx = lineApproxWuXing(cast.yingLine, upper.id, lower.id);
  const rel = shiYingRelation(shiWx, yingWx);
  const moveCount = cast.changingIndexes.length;
  const changedShi = cast.changed?.shiLine;
  const changedYing = changedShi ? yingLineOf(changedShi) : undefined;

  if (step === 1) {
    return `
      <div class="ly-guide-panel" data-panel="1">
        <p class="ly-guide-talk">找一找卦里的「我」和「外界」。金色圈＝世爻（你），红色圈＝应爻（对方/环境）。</p>
        <div class="ly-guide-hex">${renderHexagramSvg({
          lines: cast.primaryLines,
          shiLine: cast.shiLine,
          yingLine: cast.yingLine,
          changingIndexes: cast.changingIndexes,
          emphasizeShiYing: true,
          showTrigramLabels: true,
        })}</div>
        <p class="ly-guide-verdict">极简结论：世应<strong>${rel.rel}</strong> → ${rel.verdict}</p>
        <p class="ly-guide-tip">${rel.tip}</p>
      </div>
    `;
  }

  if (step === 2) {
    return `
      <div class="ly-guide-panel" data-panel="2">
        <p class="ly-guide-talk">卦里有几个「变心」的爻？它们在哪个位置？这些动爻就是你当下最需要关注的具体事情。</p>
        <div class="ly-guide-pair">
          <div>
            <p class="ly-guide-label">本卦</p>
            ${renderHexagramSvg({
              lines: cast.primaryLines,
              shiLine: cast.shiLine,
              yingLine: cast.yingLine,
              changingIndexes: cast.changingIndexes,
              pulseChanging: true,
              showTrigramLabels: true,
            })}
          </div>
          <div>
            <p class="ly-guide-label">变卦</p>
            ${
              cast.changed
                ? renderHexagramSvg({
                    lines: cast.changedLines,
                    shiLine: changedShi,
                    yingLine: changedYing,
                    changingIndexes: cast.changingIndexes,
                    pulseChanging: true,
                    showTrigramLabels: true,
                  })
                : '<p class="ly-guide-tip">无动爻 → 无变卦</p>'
            }
          </div>
        </div>
        <p class="ly-guide-verdict">${
          moveCount === 0
            ? '动爻 0 个 → 方向先看本卦与世应'
            : `动爻 ${moveCount} 个（${cast.changingIndexes.map((i) => LINE_LABELS[i]).join('、')}）→ ${
                moveCount >= 3 ? '事情更复杂' : '方向更明确'
              }`
        }</p>
        <p class="ly-guide-tip">口诀：动爻越多，事情越复杂；动爻越少，方向越明确。</p>
      </div>
    `;
  }

  if (step === 3) {
    const human =
      domain === 'love'
        ? scene.love
        : domain === 'career'
          ? scene.career
          : `${scene.career} ${scene.love}`;
    const facts = buildReadingFacts(cast, question);
    const primaryDrill = `【本卦实战】上下「${facts.lowerNature}+${facts.upperNature}」→ ${facts.themeWord}。行动指令：先停半步，把边界说清，再决定冲不冲。`;
    const quiz = buildBianQuiz(facts);
    return `
      <div class="ly-guide-panel" data-panel="3">
        <p class="ly-guide-talk">把上卦（天/环境）和下卦（地/自己）连起来想——不要停在符号名。</p>
        ${renderXiangVisual(upper, lower)}
        <p class="ly-guide-verdict">${scene.formula}</p>
        <p class="ly-guide-tip">${human}</p>
        <p class="ly-drill-primary">${primaryDrill}</p>
        ${quiz ? renderBianQuizHtml(quiz) : '<p class="ly-guide-tip">无变卦：本卦实战足够，先把当下看清。</p>'}
      </div>
    `;
  }

  if (step === 4) {
    return `
      <div class="ly-guide-panel" data-panel="4">
        <p class="ly-guide-talk">现在的状态（本卦）→ 经历变化（动爻）→ 未来的结果（变卦）。</p>
        ${renderTimeline(cast)}
        <p class="ly-guide-verdict">${
          cast.changed
            ? `因为动爻在变，事情从「${cast.primary.keywords[0]}」变成「${cast.changed.keywords[0]}」。`
            : '没有动爻推动，时间轴停在本卦。'
        }</p>
      </div>
    `;
  }

  const pack = buildStrategyPack(cast, domain, question);
  return `
    <div class="ly-guide-panel" data-panel="5">
      <p class="ly-guide-talk">最后一步：把卦连回你的生活——给策略，不只给一句总结。</p>
      <h4 class="ly-strategy-title">${pack.sceneTitle}</h4>
      <ul class="ly-strategy-list">
        ${pack.items.map((it) => `<li><strong>${it.label}</strong><span>${formatClauseHtml(it.text)}</span></li>`).join('')}
      </ul>
      <p class="ly-guide-label">陪读一下</p>
      <div class="ly-companion">
        ${pack.prompts
          .map(
            (p) => `
          <button type="button" class="ly-companion-btn" data-companion="${p.id}" data-reply="${encodeURIComponent(p.reply)}">${p.label}</button>
        `,
          )
          .join('')}
      </div>
      <div class="ly-companion-reply" data-companion-reply hidden></div>
    </div>
  `;
}

/** 结果页 / 学习页：五步引导主界面 */
export function renderComposeTeach(opts: {
  cast: CastResult;
  question?: string;
  activeStep?: number;
}): string {
  const { cast, question = '', activeStep = 1 } = opts;
  const domain = detectSceneDomain(question);
  const steps = buildFiveSteps(cast, question, domain);
  const step = Math.min(5, Math.max(1, activeStep)) as 1 | 2 | 3 | 4 | 5;

  return `
    <section class="ly-result-panel ly-result-compose ly-guide-root" data-guide-root data-question="${encodeURIComponent(question)}">
      <h3>怎么读这一卦</h3>
      ${renderFiveStepsHtml(steps, { interactive: true, active: step })}
      <div class="ly-guide-body" data-guide-body>
        ${renderStepPanel(cast, step, question, domain)}
      </div>
    </section>
  `;
}

/** 绑定五步切换 + 陪读按钮（结果页/学习页共用） */
export function bindGuideInteractions(
  root: HTMLElement,
  cast: CastResult,
  question = '',
): void {
  const domain = detectSceneDomain(question);
  const body = root.querySelector<HTMLElement>('[data-guide-body]');
  const chips = root.querySelectorAll<HTMLElement>('[data-guide-step]');
  if (!body) return;

  const paint = (step: number): void => {
    body.innerHTML = renderStepPanel(cast, step, question, domain);
    chips.forEach((c) => {
      c.classList.toggle('is-active', Number(c.dataset.guideStep) === step);
    });
    bindBianQuiz(body);
    body.querySelectorAll<HTMLButtonElement>('[data-companion]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const reply = decodeURIComponent(btn.dataset.reply ?? '');
        const box = body.querySelector<HTMLElement>('[data-companion-reply]');
        if (!box) return;
        box.hidden = false;
        box.innerHTML = `<p>${reply}</p>`;
      });
    });
  };

  chips.forEach((c) => {
    c.addEventListener('click', () => paint(Number(c.dataset.guideStep)));
  });
  paint(1);
}
