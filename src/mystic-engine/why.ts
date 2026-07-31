import type { CastResult } from '../liuyao/engine.ts';
import { formatHexShortWithPinyin, formatHexWithPinyin } from '../liuyao/hex-pinyin.ts';
import { getBoardLens, QIN_MODERN } from '../liuyao/board-lens.ts';
import { fillVoiceTemplate, getHexVoice } from '../liuyao/hex-voice.ts';
import type { LiuQin } from '../liuyao/najia.ts';
import type { SceneDomain } from '../liuyao/scene-map.ts';
import type { WhyItem } from './types.ts';
import { toneFlags } from './tone.ts';

/** 白话 + 传统六亲 */
function modernWithClassic(qin: LiuQin): string {
  return `${QIN_MODERN[qin]}（${qin}）`;
}

function composeBody(item: Omit<WhyItem, 'body'>): string {
  const lines = [item.hook, ...(item.points ?? [])];
  if (item.tip) lines.push(item.tip);
  return lines.filter(Boolean).join('\n');
}

function whyItem(partial: Omit<WhyItem, 'body'>): WhyItem {
  return { ...partial, body: composeBody(partial) };
}

function qBit(question: string, max = 16): string {
  const t = question.trim().replace(/\s+/g, '');
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

type AskKind =
  | 'quit'
  | 'interview'
  | 'salary'
  | 'career'
  | 'love'
  | 'wealth'
  | 'open';

function askKind(domain: SceneDomain, question: string): AskKind {
  if (/离职|裸辞|要不要走|去留|辞职/i.test(question)) return 'quit';
  if (/面试|offer|求职|补材料|hr/i.test(question)) return 'interview';
  if (/薪|工资|涨薪|谈薪|转正.*k|多少钱/i.test(question)) return 'salary';
  if (domain === 'love' || /感情|恋爱|分手|对象|结婚|复合|喜欢/i.test(question)) return 'love';
  if (domain === 'wealth' || /投资|理财|股票|回款|现金流/i.test(question)) return 'wealth';
  if (domain === 'career' || /工作|职场|升职|项目|老板|领导|同事/i.test(question))
    return 'career';
  return 'open';
}

/**
 * 现状 / 转机 / 走向：贴问题写，少套「满脑子目标工资」一类通用职场模板。
 */
export function buildWhyItems(
  cast: CastResult,
  domain: SceneDomain,
  question = '',
  castAt = new Date(),
): WhyItem[] {
  const lens = getBoardLens(cast, castAt);
  const { soft, flow, open, cut } = toneFlags(cast);
  const softFlow = soft || flow;
  const kind = askKind(domain, question);
  const q = qBit(question);
  const pVoice = getHexVoice(cast.primary.name);
  const cVoice = cast.changed ? getHexVoice(cast.changed.name) : undefined;
  const from = cast.primary.keywords[0] ?? cast.primary.name;
  const to = cast.changed?.keywords[0] ?? cast.changed?.name;
  const frame = pVoice?.frame ?? from;

  const shiGloss = {
    term: '世爻',
    gloss: '代表「你自己」：立场、压力与在意的落点。',
  };
  const dongGloss = {
    term: '动爻',
    gloss: '正在变的爻。无动＝局面暂时稳；有动＝过程从这里开始拉扯。',
  };
  const bianGloss = {
    term: '变卦',
    gloss: '动爻变化后的结果卦：描述走向，不是死刑判决。',
  };

  const shiLine = `你这边（世）落在${lens.shi.position}，气质偏「${modernWithClassic(lens.shi.qin)}」。`;

  let statusHook: string;
  let statusTip: string | undefined;

  switch (kind) {
    case 'quit':
      statusHook = q
        ? `问的是去留时机。眼下你站在「要不要动」的边上——本卦偏「${frame}」，人已经很累了，但还没把底线写清。`
        : `去留卡在边上。本卦偏「${frame}」：累是真的，但先把「留下还能接受什么」写清，再谈走。`;
      statusTip = cut
        ? '该走时一次写清交接与期限，比反复内耗更干净。'
        : softFlow
          ? '先别硬刚摊牌；把压力翻成期限与 Plan B，再决定动不动。'
          : '先写三行：留下底线 / 必须走的触发 / 最晚哪天定——再行动。';
      break;
    case 'interview':
      statusHook = `求职/面试这一局，你盯的是回应与节点。本卦偏「${frame}」——急着定音很正常，盘面却更像「边补边等」。`;
      statusTip = softFlow
        ? '沉默不等于否决；用一封短跟进或补材料换可核对节点。'
        : '把口头好感落到邮件/材料上，再估窗口。';
      break;
    case 'salary':
      statusHook = `谈的是钱与认可。本卦偏「${frame}」：你在意落点没错，但别把自我价值全绑在这一次数字上。`;
      statusTip = '先问清标准与时间表，口头一律落到书面。';
      break;
    case 'career':
      statusHook = q
        ? `你问的是工作这一局。本卦偏「${frame}」——压力真实，但别把整个人都押在这一次结果上。`
        : `工作这一局，本卦偏「${frame}」——压力真实，先看清自己站哪，再谈外面怎么变。`;
      statusTip = softFlow
        ? '先把可核对的一小步写清，少一次情绪摊牌。'
        : '把最堵的一件事落到期限与选项上，再行动。';
      break;
    case 'love':
      statusHook = `关系里你很在意对方会不会给回应。本卦偏「${frame}」——主见强，拉扯感也会跟着上来。`;
      statusTip = softFlow
        ? '宜一次低压力试探，少一次摊牌定终身。'
        : '先对齐一件可核对的事，再谈叙事。';
      break;
    case 'wealth':
      statusHook = `钱与安全感占了很大带宽。本卦偏「${frame}」——数字紧绷时，先保底线比空想涨跌更护自己。`;
      statusTip = '先写清风险上限与现金流，再谈加码。';
      break;
    default:
      statusHook = pVoice
        ? `眼下主调偏「${frame}」——${fillVoiceTemplate(pVoice.metaphorSolo, from, to)}`
        : `眼下主调偏「${frame}」：先认清自己站哪，再谈外面怎么变。`;
      statusTip = '把最堵的一件事写清楚，比空想终局更有用。';
  }

  const items: WhyItem[] = [
    whyItem({
      title: '眼下',
      badgeTerm: shiGloss,
      badgeNote: lens.shi.position,
      hook: statusHook,
      points: [shiLine],
      tip: statusTip,
    }),
  ];

  if (lens.moving.length === 0) {
    items.push(
      whyItem({
        title: '变在哪',
        badgeTerm: dongGloss,
        badgeNote: '静',
        hook: '这盘暂无明显动爻——不是没戏，是「先核对，再谈翻盘」。急着找爆点，反而看不清。',
        points: ['稳局里把可核对条件谈清，往往就是转机的起点。'],
        tip:
          kind === 'quit'
            ? '去留先写条件与日期，再决定动不动。'
            : '把可核对条件看清，再决定下一步。',
      }),
    );
  } else {
    const points: string[] = [
      `动在${lens.moving.join('、')}：过程多半会拉扯几下，别指望一次定音。`,
    ];
    if (lens.hasInfoNoise) {
      points.push(
        kind === 'interview' || kind === 'salary'
          ? '口舌与杂音偏多——面试说法、薪资口头一律以书面为准。'
          : '口舌与杂音偏多——口头不算数，以可核对信息为准。',
      );
    } else if (softFlow) {
      points.push('沟通成本会偏高：反复确认比一次硬顶更稳。');
    }
    if (
      lens.caifu &&
      (kind === 'salary' || kind === 'wealth' || kind === 'quit' || kind === 'career')
    ) {
      points.push(
        `钱/安全感这一层落在${lens.caifu.position}${lens.caifu.role ? `（${lens.caifu.role}）` : ''}——数字与底线要单独核对。`,
      );
    }

    items.push(
      whyItem({
        title: '变在哪',
        badgeTerm: dongGloss,
        badgeNote: lens.moving.join('、'),
        hook: '转机不在「突然好运」，而在拉扯里你有没有拿到新的可核对信息。',
        points: points.slice(0, 2),
        tip: softFlow
          ? '留后路、小步确认；熬过拉扯才到站。'
          : cut
            ? '抓住变点定调，少拖泥带水。'
            : '用可核对的一小步验证，再决定加码或停。',
      }),
    );
  }

  if (cast.changed) {
    const cLabel = formatHexWithPinyin(cast.changed.name, cast.changed.fullName);
    const toKw = cast.changed.keywords.slice(0, 2).join('、') || cast.changed.name;
    const short = formatHexShortWithPinyin(cast.changed.name);
    let tip: string;
    let hook: string;
    const points: string[] = [`下一幕朝「${cLabel}」偏「${toKw}」。`];

    if (open && (kind === 'interview' || kind === 'salary')) {
      hook = '走向偏能聚拢资源——前提是熬过前面那阵补材料/谈清的磨。';
      tip = '丰盛要落在纸上才算；画饼与条款分开看。';
    } else if (open) {
      hook = cVoice
        ? `走向偏「${cVoice.asChanged}」：有机会聚拢，仍要可核对动作落袋。`
        : `走向偏「${toKw}」：条件有机会聚拢，仍要落袋。`;
      tip = '感觉会好 ≠ 已经到手。';
    } else if (softFlow) {
      hook = `走向偏「${toKw}」：能落地，但过程会反复；熬过才到站。`;
      tip = '两手准备，随时可撤。';
    } else if (cut) {
      hook = `走向偏「${toKw}」：定调之后把精力留给下一局。`;
      tip =
        kind === 'quit'
          ? '交接与底线一次写清，定了就走。'
          : '边界一次写清，定了就执行。';
    } else if (cVoice) {
      hook = `走向偏「${cVoice.asChanged}」：${fillVoiceTemplate(cVoice.metaphorSolo, from, toKw)}`;
      tip = cVoice.mapAskChanged.replace(/^对应你的问题：/, '');
      points.push(`变卦主调「${cVoice.frame}」——下一小步核对，不要一次梭哈。`);
    } else {
      hook = `走向偏「${toKw}」：用下一小步核对，而不是一次梭哈。`;
      tip = '方向感不是判决——小步验证再加码。';
    }

    items.push(
      whyItem({
        title: '走向',
        badgeTerm: bianGloss,
        badgeHex: {
          kind: 'changed',
          name: cast.changed.name,
          label: short,
        },
        hook,
        points: points.slice(0, 2),
        tip,
      }),
    );
  } else {
    items.push(
      whyItem({
        title: '走向',
        badgeTerm: bianGloss,
        badgeNote: '暂稳',
        hook: pVoice
          ? `暂无变卦，底气仍在「${frame}」——先谈清可核对条件，再谈翻盘。`
          : '暂无变卦。底气来自清单与期限，不来自空想。',
        points: [
          pVoice
            ? fillVoiceTemplate(pVoice.metaphorSolo, from)
            : '把底线写下来，比空想终局更护自己。',
        ],
        tip: '稳局里也要有动作：写清底线，再决定加码或停。',
      }),
    );
  }

  return items;
}
