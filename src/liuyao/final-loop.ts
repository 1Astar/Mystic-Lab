import type { CastResult } from './engine.ts';
import { LINE_LABELS, upperLowerFromLines } from './hexagrams.ts';
import { buildReadingFacts } from './reading-facts.ts';
import { dressHexagram, type LiuQin, type YaoDress } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { LIUQIN_ENERGY, formatLiuqinShort } from './energy-lens.ts';
import { buildStrategyPack } from './strategy.ts';
import { composeScene, type SceneDomain } from './scene-map.ts';
import type { ShiYingRel } from './wuxing.ts';

export type FinalLoopStep = {
  tag: string;
  body: string;
};

export type FinalLoopAction = {
  label: string;
  text: string;
};

export type FinalLoop = {
  /** 【Step1】…【Step4】卦象依据（Step5 直接落到「结合问题 / 行动建议」，不写教学 prompt） */
  steps: FinalLoopStep[];
  /** 结合问题 */
  questionBody: string;
  /** 行动建议清单 */
  actions: FinalLoopAction[];
  conclusion: string;
  action: string;
  /** 压成一句，给顶部 gist / 此刻解读「一句话」 */
  oneLiner: string;
  /** 兼容旧字段（测试 / 旧 UI） */
  relationLabel: string;
  relationBody: string;
  focusLabel: string;
  focusBody: string;
  trajectoryLabel: string;
  trajectoryBody: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nlToBr(s: string): string {
  return escapeHtml(s).replace(/\n/g, '<br>');
}

function findQin(rows: YaoDress[], qin: LiuQin): YaoDress | undefined {
  return rows.find((r) => r.liuqin === qin);
}

function qinStateHint(row: YaoDress | undefined, qin: LiuQin): string {
  if (!row) return '';
  const short = formatLiuqinShort(qin);
  const e = LIUQIN_ENERGY[qin];
  if (row.changing) {
    return `同时，${short}（${row.label}）正在发动——「${e.modern}」这一层变化很显眼，要优先对上。`;
  }
  return `同时，相关的「${e.modern}」（${short}）目前偏安静/偏低，容易被挑刺或拖后腿，宜先补这一层。`;
}

function buildStep1(cast: CastResult, rel: ShiYingRel, verdict: string): FinalLoopStep {
  const shiLabel = LINE_LABELS[cast.shiLine - 1]!;
  const yingLabel = LINE_LABELS[cast.yingLine - 1]!;
  return {
    tag: '【Step1 世应】',
    body: `世在${shiLabel}（我），应在${yingLabel}（外界）。${rel}→${verdict}。`,
  };
}

function buildStep2(cast: CastResult): FinalLoopStep {
  const n = cast.changingIndexes.length;
  if (n === 0) {
    return {
      tag: '【Step2 动爻】',
      body: '无动爻：格局相对稳，关键不在突变，而在把世应与用神所在层看清。',
    };
  }
  const labels = cast.changingIndexes.map((i) => LINE_LABELS[i]!).join('、');
  return {
    tag: '【Step2 动爻】',
    body: `${n} 个变心爻：${labels}。`,
  };
}

function buildStep3(cast: CastResult): FinalLoopStep {
  const { upper, lower } = upperLowerFromLines(cast.primaryLines);
  const scene = composeScene(upper, lower, cast.primary);
  const head = `上${upper.nature}（${upper.id}）+ 下${lower.nature}（${lower.id}）→ ${cast.primary.fullName} ${cast.primary.gist}`;
  const career = [
    `若偏事务：下面是「${scene.careerLower}」，上面是「${scene.careerUpper}」。`,
    `合在一起看——${scene.themeWords}正在成为主旋律。`,
    `问自己：${scene.careerAsk}`,
  ].join('\n');
  const love = [
    `若偏关系：下卦像你这边的底色（${scene.loveLower}），上卦像关系场/对方侧（${scene.loveUpper}）。`,
    `合在一起——${scene.themeWords}。`,
    `问自己：${scene.loveAsk}`,
  ].join('\n');
  return {
    tag: '【Step3 取象】',
    body: `${head}\n${career}\n\n${love}`,
  };
}

function buildStep4(cast: CastResult): FinalLoopStep {
  if (!cast.changed) {
    return {
      tag: '【Step4 过程】',
      body: `${cast.primary.fullName}（无动则无变）——时间轴停在本卦。`,
    };
  }
  return {
    tag: '【Step4 过程】',
    body: `${cast.primary.fullName} →（动爻）→ ${cast.changed.fullName}`,
  };
}

function buildFocusBody(
  shi: YaoDress | undefined,
  rows: YaoDress[],
  changing: YaoDress[],
  domain: SceneDomain,
): string {
  const parts: string[] = [];
  if (shi) {
    const e = LIUQIN_ENERGY[shi.liuqin];
    parts.push(
      `${formatLiuqinShort(shi.liuqin)}持世（${shi.label}），说明你现在主调偏「${e.modern}」——${e.blurb}`,
    );
  } else {
    parts.push('世爻未落到装卦行，先回到 Step 1 把世应点亮。');
  }

  if (changing.length) {
    const labels = changing.map((r) => `${r.label}${formatLiuqinShort(r.liuqin)}`).join('、');
    parts.push(`动爻落在 ${labels}，这是当下最该盯的变化点。`);
  } else {
    parts.push('本卦无动爻，重点不在「哪里在变」，而在持世与用神所在层是否站稳。');
  }

  if (domain === 'career') {
    const fu = findQin(rows, '父母');
    if (fu && !fu.isShi) parts.push(qinStateHint(fu, '父母'));
  } else if (domain === 'love') {
    const cai = findQin(rows, '妻财');
    if (cai && !cai.isShi) parts.push(qinStateHint(cai, '妻财'));
  } else {
    const fu = findQin(rows, '父母');
    if (fu && !fu.isShi && (fu.changing || shi?.liuqin === '兄弟')) {
      parts.push(qinStateHint(fu, '父母'));
    }
  }

  return parts
    .filter(Boolean)
    .map((p) => (/[。！？]$/.test(p) ? p : `${p}。`))
    .join('');
}

function buildTrajectoryBody(cast: CastResult, skSummary: string): string {
  if (!cast.changed) {
    return `无动则无变——时间轴停在本卦「${cast.primary.fullName}」。${skSummary}事情更宜先把当下结构看清，再谈下一幕。`;
  }
  const from = cast.primary.keywords[0] ?? cast.primary.name;
  const to = cast.changed.keywords[0] ?? cast.changed.name;
  const scatter =
    /散|涣|剥|困|否|蹇|阻滞|耗/.test(
      `${skSummary}${from}${to}${cast.primary.name}${cast.changed.name}`,
    )
      ? '卦象整体偏「散/阻」的味道，若核心信息再受挫，事情容易走散或落空。'
      : `趋势从「${from}」滑向「${to}」，变卦是方向感，不是死判决。`;
  return `因为动爻在推，事情从本卦「${cast.primary.fullName}」走向变卦「${cast.changed.fullName}」。${scatter}${skSummary ? `（生克侧：${skSummary}）` : ''}`;
}

function buildConclusion(
  facts: ReturnType<typeof buildReadingFacts>,
  shi: YaoDress | undefined,
  cast: CastResult,
): string {
  const edge =
    facts.shiYingRel.rel === '相生'
      ? '内外有顺势可借'
      : facts.shiYingRel.rel === '相克'
        ? '内外磨合成本偏高'
        : '内外节奏接近但推力不强';
  const shiBit = shi
    ? `持世偏「${LIUQIN_ENERGY[shi.liuqin].modern}」`
    : '世位主调需再确认';
  const path = cast.changed
    ? `变局指向「${cast.changed.keywords[0]}」`
    : `局面仍停在「${facts.themeWord}」`;
  const risk =
    facts.domain === 'career'
      ? '文书/信息/手续类细节往往比报价或姿态更先决。'
      : facts.domain === 'love'
        ? '先对齐彼此真实需求，再谈升温或表态。'
        : '先减干扰、做小验证，再加大投入。';
  return `虽然${edge}，且${shiBit}，但${path}——${risk}`;
}

function buildQuestionBody(question: string, conclusion: string): string {
  const q = question.trim();
  if (!q) {
    return `你还没写下具体问题。先对照上面五步看结构，再补一句「我真正在问什么」，结论才落得准。\n\n${conclusion}`;
  }
  return `对照你问的「${q}」：${conclusion}`;
}

function buildActions(
  cast: CastResult,
  domain: SceneDomain,
  question: string,
): FinalLoopAction[] {
  const pack = buildStrategyPack(cast, domain, question);
  return pack.items.map((it) => ({ label: it.label, text: it.text }));
}

function buildOneLiner(conclusion: string, action: string): string {
  const shortAction = action.split('。')[0] ?? action;
  const shortConc = conclusion.replace(/——.+$/, '').trim();
  const merged = `${shortConc}。建议：${shortAction}。`;
  return merged.length > 72 ? `${merged.slice(0, 70)}…` : merged;
}

function relationNoun(domain: SceneDomain): string {
  if (domain === 'love') return '你们的关系';
  if (domain === 'career') return '你与岗位/对方的状态';
  return '你与外界的状态';
}

/** 五步收束：卦象依据 Step1–4 → 结合问题 → 行动建议 → 一句话 */
export function buildFinalLoop(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): FinalLoop {
  const facts = buildReadingFacts(cast, question, castAt);
  const rows = dressHexagram(cast, siZhuFromDate(castAt).dayStem).rows;
  const shi = rows.find((r) => r.isShi);
  const changing = rows.filter((r) => r.changing);

  const steps = [
    buildStep1(cast, facts.shiYingRel.rel, facts.shiYingRel.verdict),
    buildStep2(cast),
    buildStep3(cast),
    buildStep4(cast),
  ];

  const conclusion = buildConclusion(facts, shi, cast);
  const actions = buildActions(cast, facts.domain, question);
  const action =
    actions.find((a) => a.label.includes('策略'))?.text ??
    actions[0]?.text ??
    '选一个本周可验证的小动作，先验证再加码。';
  const questionBody = buildQuestionBody(question, conclusion);
  const oneLiner = buildOneLiner(conclusion, action);

  const relationBody = steps[0]!.body;
  const focusBody = buildFocusBody(shi, rows, changing, facts.domain);
  const trajectoryBody = buildTrajectoryBody(cast, facts.shengKe.summary);

  return {
    steps,
    questionBody,
    actions,
    conclusion,
    action,
    oneLiner,
    relationLabel: `${relationNoun(facts.domain)}（关联 Step 1）`,
    relationBody,
    focusLabel: '关注的核心点（关联 Step 2）',
    focusBody,
    trajectoryLabel: '事情的发展轨迹（关联 Step 4）',
    trajectoryBody,
  };
}

export function renderFinalLoopHtml(loop: FinalLoop): string {
  const stepsHtml = loop.steps
    .map(
      (s) => `
      <div class="ly-final-loop-block ly-final-basis-step">
        <p class="ly-final-loop-label">${escapeHtml(s.tag)}</p>
        <p class="ly-final-loop-body">${nlToBr(s.body)}</p>
      </div>`,
    )
    .join('');

  const actionsHtml = loop.actions
    .map(
      (a) => `
      <li class="ly-final-action-item">
        <strong>${escapeHtml(a.label)}</strong>
        <span>${escapeHtml(a.text)}</span>
      </li>`,
    )
    .join('');

  return `
    <section class="ly-final-loop" data-final-loop>
      <h4 class="ly-final-loop-title">卦象依据</h4>
      <div class="ly-final-basis">${stepsHtml}</div>
      <div class="ly-final-loop-block is-conclusion">
        <p class="ly-final-loop-label">结合问题</p>
        <p class="ly-final-loop-body">${nlToBr(loop.questionBody)}</p>
      </div>
      <div class="ly-final-loop-block is-action">
        <p class="ly-final-loop-label">行动建议</p>
        <ul class="ly-final-action-list">${actionsHtml}</ul>
      </div>
    </section>
  `;
}
