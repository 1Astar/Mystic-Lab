/**
 * 剧本导演：场景 × 三指标 → 四段剧本（定心丸 / 现状真相 / 具体动作 / 底线）
 * 条件触发，不是枚举说明书。
 */
import type { CastResult } from '../liuyao/engine.ts';
import { extractCoreMetrics, type CoreMetrics } from './script-metrics.ts';
import { detectScriptScene, type ScriptScene } from './script-scene.ts';

export type ScriptBeat = {
  id: 'calm' | 'truth' | 'action' | 'boundary';
  title: string;
  body: string;
};

export type ScriptPlay = {
  scene: ScriptScene;
  metrics: CoreMetrics;
  /** 一句话定性（锚定盘面，禁止瞎编） */
  headline: string;
  beats: ScriptBeat[];
};

function qSnippet(question: string, max = 28): string {
  const t = question.trim().replace(/\s+/g, '');
  if (!t) return '你问的这件事';
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function calmByPace(m: CoreMetrics, scene: ScriptScene, question: string): string {
  const snip = qSnippet(question, 16);
  if (m.pace === 'slow_then_stop' || m.pace === 'slow') {
    if (scene === 'interview') {
      return `别急。关于「${snip}」，急不来往往不是你的能力问题，而是对方流程本来就慢（本卦偏「${m.primaryName}」）。先稳住心态，按步骤推进。`;
    }
    if (scene === 'reunion') {
      return `别急着逼一个结果。关系里的「${m.primaryName}」主调是慢慢来——不是你不够好，是节奏容不得硬推。`;
    }
    return `别急。本卦偏「${m.primaryName}」：急不得也停不得的节奏，先把心态放稳，再谈下一步。`;
  }
  if (m.pace === 'stop') {
    return `可以先松一口气：眼下更适合守住边界，而不是加码硬冲。停不是失败，是护住自己。`;
  }
  return `先深呼吸。就「${snip}」而言，卦象是动态参考不是判决书——把注意力放回你能核对、能行动的那一件事上。`;
}

function truthInterview(m: CoreMetrics): string {
  const bits: string[] = [];
  if (m.tugOfWar) {
    bits.push(
      `盘面同时出现「暗动」与「月破」：一边可能有隐蔽推力（内部或许有人想帮你、还没挑明），一边外部环境/流程又在拦着——典型拉锯。所以结果会反复，不是一次定音。`,
    );
  } else if (m.hasAnDong) {
    bits.push(`有「暗动」迹象：表上安静，暗处可能有人在推动或犹豫，别只看表面沉默。`);
  } else if (m.hasYuePo) {
    bits.push(`有「月破」迹象：流程或外部环境偏脆，容易中断、拖期、或突然觉得「还差一点点」。`);
  }
  if (m.shiYingRel === '相克') {
    bits.push(`世应相克：你这边的需求与对方（公司/面试官）节奏暂不匹配，磁场不是一拍即合，才需要反复沟通来补。`);
  } else if (m.shiYingRel === '相生') {
    bits.push(`世应有生扶：双方并非完全拧巴，但仍要靠你主动把缺口补上，别干等默契自己长出来。`);
  }
  if (m.pace === 'slow_then_stop') {
    bits.push(
      `卦名从「${m.primaryName}」走向「${m.changedName}」：慢推进之后，可能遇到明确的停/守——既要争取，也要接受「最终可能不成」。`,
    );
  }
  if (!bits.length) {
    bits.push(`对方还没给你一击必中的信号；局面需要你用可核对的动作去探，而不是解读空气。`);
  }
  return bits.join('\n\n');
}

function truthReunion(m: CoreMetrics): string {
  const bits: string[] = [];
  if (m.tugOfWar) {
    bits.push(`暗动×月破：对方内心可能有回拉，现实里又有阻碍——会反复，不是你想象的「一夜回心」。`);
  }
  if (m.pace === 'slow_then_stop' || m.pace === 'stop') {
    bits.push(`走向偏停/守：复合窗口若有，也窄；硬追容易把自己耗干。`);
  }
  if (m.shiYingRel === '相克') {
    bits.push(`世应相克：你想靠近的方式，和对方能给的节奏打架——先对齐一件可核对的事，再谈复合叙事。`);
  }
  if (!bits.length) {
    bits.push(`眼下更像「探温度」而不是「收结局」；对方状态要用行动试，不靠脑补。`);
  }
  return bits.join('\n\n');
}

function truthQuit(m: CoreMetrics): string {
  const bits: string[] = [];
  if (m.tugOfWar) {
    bits.push(`拉锯象：留下有牵挂，走也有推力——最忌无限拖延、两边耗。`);
  }
  if (m.pace === 'slow_then_stop' || m.pace === 'stop') {
    bits.push(`走向偏停：该停则停时，守住边界比继续内耗式推进更重要。`);
  }
  if (m.shiYingRel === '相克') {
    bits.push(`你与外部环境（岗位/关系）有冲突感：冲突是信号，不是要你无底线妥协。`);
  }
  if (!bits.length) {
    bits.push(`去留关键在「可核对的底线」：期限、条件、对方回应质量——写下来再决定。`);
  }
  return bits.join('\n\n');
}

function truthFallback(m: CoreMetrics, question: string): string {
  const loveish = /感情|恋爱|喜欢|对象|男朋友|女朋友|复合|他|她/.test(question);
  const bits: string[] = loveish
    ? [
        `就你问的「${qSnippet(question)}」：先看关系里的主矛盾（回应质量与边界），不撒网解释每一爻。`,
      ]
    : [
        `就你问的「${qSnippet(question)}」：先看盘面主矛盾，不撒网解释每一爻。`,
      ];
  if (m.tugOfWar) {
    bits.push(
      loveish
        ? `暗动与月破同现 → 拉锯：对方可能有回拉，现实又有阻碍，沟通会反复。`
        : `暗动与月破同现 → 拉锯：有推力也有拦阻，过程会反复。`,
    );
  }
  if (m.changedName) {
    bits.push(
      loveish
        ? `本卦「${m.primaryName}」→ 变「${m.changedName}」：关系节奏在变，宜用变卦的柔进方式推进，少死磕旧法。`
        : `本卦「${m.primaryName}」→ 变「${m.changedName}」：用变卦的节奏推进，少死磕本卦旧法。`,
    );
  } else {
    bits.push(`本卦「${m.primaryName}」、暂无变：局面相对稳，先核对落点再加码。`);
  }
  return bits.join('\n\n');
}

function actionInterview(m: CoreMetrics, question: string): string {
  const q = qSnippet(question);
  if (m.tugOfWar || m.hasYuePo || m.pace === 'slow_then_stop') {
    return `不要再傻等「${q}」的音信。今晚或明天就主动发一封简短跟进（可给 HR/面试官）：感谢对方时间，并写一句——「如果我的材料还有需要补充的（作品集、项目数据、意向说明），我可以马上发您。」用书面补上那个可能被「月破」撕开的缺口。`;
  }
  return `针对「${q}」：本周只做一件可打勾的试探——发一封跟进或补一份材料，把口头承诺落到邮件里。`;
}

function actionReunion(_m: CoreMetrics, question: string): string {
  return `关于「${qSnippet(question)}」：本周只发一次低压力、可回可不回的试探（短讯/关心一件具体事），不审判、不逼复合时间表。若对方不接，就停——这就是盘面要你核对的回应质量。`;
}

function actionQuit(_m: CoreMetrics, question: string): string {
  return `把「${qSnippet(question)}」写成三行：留下的底线 / 离开的触发条件 / 截止日期。本周只推进能打勾的一步（谈一次、或投一份简历），禁止无限拉扯。`;
}

function actionFallback(question: string): string {
  return `就「${qSnippet(question)}」：用一句话写下你最想确认的一点，本周只推一个低成本探针（问一句 / 试一天 / 看一份材料），对照结果再决定加码或撤。`;
}

function boundaryInterview(m: CoreMetrics): string {
  if (m.pace === 'slow_then_stop' || m.pace === 'stop' || m.tugOfWar) {
    return `如果跟进后对方仍杳无音信超过 3 天（或明确拖延且不给书面节点），建议不再追问，把精力挪到下一家。守住职业尊严：能推进，但靠反复沟通与补材料——不是无限妥协。该停则停。`;
  }
  return `给对方一个可核对的答复期限；逾期未果就启动 Plan B，不把自我价值绑死在这一次结果上。`;
}

function boundaryReunion(m: CoreMetrics): string {
  return m.pace === 'stop' || m.pace === 'slow_then_stop'
    ? `若试探无回应或再次伤害边界，停止追加投入。停是护住自己，不是惩罚对方。`
    : `设定自己的联系上限（例如一周一次）；超过就收回注意力，避免在拉锯里耗干。`;
}

function boundaryQuit(_m: CoreMetrics): string {
  return `该停则停：守住边界比继续推进更重要。期限一到就执行你写好的触发条件——留下或离开，都要干净，不内耗式耗着。`;
}

function boundaryFallback(m: CoreMetrics): string {
  return m.pace === 'stop' || m.pace === 'slow_then_stop'
    ? `若探针后仍无增量信息，停止加码。守住你的时间与尊严。`
    : `探针有结果再加码；没有结果就撤，别用空想填空。`;
}

function headlineFor(scene: ScriptScene, m: CoreMetrics): string {
  if (scene === 'interview') {
    if (m.tugOfWar || m.pace === 'slow_then_stop') {
      return '能推进，但靠反复沟通与补材料，不是一次定音；同时准备好该停则停。';
    }
    if (m.pace === 'stop') return '眼下更宜守住边界，别把希望压在一击必中上。';
    return '有推进空间，但要用可核对的动作去换回应，别干等。';
  }
  if (scene === 'reunion') {
    if (m.tugOfWar) return '有回拉也有阻碍——会反复；用一次低压力试探核对，不逼结局。';
    if (m.pace === 'stop' || m.pace === 'slow_then_stop') {
      return '窗口偏窄：宜轻探，随时准备停，护住自己。';
    }
    return '先探温度，再谈复合叙事。';
  }
  if (scene === 'quit_stay') {
    if (m.tugOfWar || m.pace === 'slow_then_stop' || m.pace === 'stop') {
      return '该停则停，守住边界比继续推进更重要；把去留写成可核对的条件。';
    }
    return '去留可以谈，但必须有期限与底线，禁止无限拉扯。';
  }
  if (m.tugOfWar) return '局面偏拉锯：有推力也有拦阻，宜小步核对。';
  if (m.pace === 'slow_then_stop') {
    return `从「${m.primaryName}」到「${m.changedName}」：慢，且可能急刹车——边推进边留后手。`;
  }
  return `当前主调偏「${m.primaryName}」：先观后动，用一件事验证。`;
}

export function buildScriptPlay(input: {
  question: string;
  cast: CastResult;
  castAt?: Date;
}): ScriptPlay {
  const castAt = input.castAt ?? new Date();
  const scene = detectScriptScene(input.question);
  const metrics = extractCoreMetrics(input.cast, input.question, castAt);
  const headline = headlineFor(scene, metrics);

  let truth: string;
  let action: string;
  let boundary: string;
  if (scene === 'interview') {
    truth = truthInterview(metrics);
    action = actionInterview(metrics, input.question);
    boundary = boundaryInterview(metrics);
  } else if (scene === 'reunion') {
    truth = truthReunion(metrics);
    action = actionReunion(metrics, input.question);
    boundary = boundaryReunion(metrics);
  } else if (scene === 'quit_stay') {
    truth = truthQuit(metrics);
    action = actionQuit(metrics, input.question);
    boundary = boundaryQuit(metrics);
  } else {
    truth = truthFallback(metrics, input.question);
    action = actionFallback(input.question);
    boundary = boundaryFallback(metrics);
  }

  const calm = calmByPace(metrics, scene, input.question);

  return {
    scene,
    metrics,
    headline,
    beats: [
      { id: 'calm', title: '给你的核心定心丸', body: calm },
      { id: 'truth', title: '现状真相', body: truth },
      { id: 'action', title: '今晚/明天的具体动作', body: action },
      { id: 'boundary', title: '你的底线与防备', body: boundary },
    ],
  };
}
