import type { CastResult } from './engine.ts';
import type { SceneDomain } from './scene-map.ts';
import { composeScene } from './scene-map.ts';
import { upperLowerFromLines } from './hexagrams.ts';

export interface StrategyPack {
  sceneTitle: string;
  items: { label: string; text: string }[];
  prompts: { id: string; label: string; reply: string }[];
}

export function buildStrategyPack(
  cast: CastResult,
  domain: SceneDomain,
  question: string,
): StrategyPack {
  const { upper, lower } = upperLowerFromLines(cast.primaryLines);
  const scene = composeScene(upper, lower, cast.primary);
  const hasMove = cast.changingIndexes.length > 0;
  const changed = cast.changed;

  const career = [
    {
      label: '事业启示',
      text: hasMove
        ? `当前像「想动又未完全打通」：${scene.career} 动爻提醒你——该推进的点已经露头，但别一次梭哈。`
        : `结构偏稳：${scene.career} 宜先把边界与节奏定清，再谈大动作。`,
    },
    {
      label: '关系/协作',
      text: '看世应：你与岗位/同事/对方谁在出力、谁在卡位。相生可借力，相克先降温对齐事实。',
    },
    {
      label: '个人成长',
      text: `${cast.primary.keywords.slice(0, 2).join('、')}——练习把冲动换成可验证的小步。`,
    },
    {
      label: '本月策略',
      text: changed
        ? `宜：朝「${changed.keywords[0]}」做小实验。忌：无视动爻、硬用旧方法冲。除非出现绝佳窗口，否则先稳再扩。`
        : '宜静观与整理；不宜大转向。把「下一步」写成一周可验证的动作。',
    },
  ];

  const love = [
    {
      label: '感情启示',
      text: scene.love,
    },
    {
      label: '沟通提醒',
      text: hasMove
        ? '动爻＝关系里正在变心/变温的点：先点名那一层（开始、试探、还是收场），再开口。'
        : '格局不剧烈，适合把没说清的话说清，而不是制造戏剧性转折。',
    },
    {
      label: '个人成长',
      text: '练习：先看世（我要什么），再看应（对方给得出什么），最后才谈结果。',
    },
    {
      label: '本月策略',
      text: changed
        ? `关系可能滑向「${changed.keywords[0]}」：愿不愿意，用一次真诚对话验证，而不是猜。`
        : '宜稳沟通、设边界；忌冷战硬撑或突然摊牌。',
    },
  ];

  const general = [
    {
      label: '局面启示',
      text: scene.meaning,
    },
    {
      label: '内外关系',
      text: '用世应分清：哪些是我能做的，哪些是环境/对方的。',
    },
    {
      label: '变化焦点',
      text: hasMove
        ? `动爻是当下最该盯的具体事；动得越多越复杂，越少方向越清楚。`
        : '无动爻：先把当前结构看懂，比空想未来更有用。',
    },
    {
      label: '本月策略',
      text: changed
        ? `从「${cast.primary.keywords[0]}」走向「${changed.keywords[0]}」：只选一个可验证动作。`
        : '宜整理与等待窗口；忌无必要的大动作。',
    },
  ];

  const items =
    domain === 'career' ? career : domain === 'love' ? love : general;

  const q = question.trim() || '这件事';
  const prompts = [
    {
      id: 'rush',
      label: '是不是我太着急了？',
      reply: `对照本卦「${cast.primary.name}」：${scene.bridge} 若动爻少却心里很急，多半是节奏错位——先把世应看清再加速。`,
    },
    {
      id: 'wait',
      label: '如果我继续忍耐，会更好吗？',
      reply: changed
        ? `变卦指向「${changed.fullName}（${changed.keywords[0]}）」：忍耐要有方向——忍是为了走到变卦，不是原地消耗。`
        : '无变卦时，忍耐＝把本卦结构守住；设一个复查时间点，避免无限期空等。',
    },
    {
      id: 'act',
      label: '我现在该不该主动动一下？',
      reply: hasMove
        ? `有动爻＝场子已经在动。主动可以，但只动「动爻所在那一层」相关的事，别全盘掀桌。关于「${q}」，先做一个最小验证。`
        : `无动爻＝别硬造变化。关于「${q}」，优先观察与对齐，等窗口再推。`,
    },
  ];

  return {
    sceneTitle: question.trim()
      ? `针对「${question.trim()}」的策略清单`
      : '落到生活的策略清单',
    items,
    prompts,
  };
}
