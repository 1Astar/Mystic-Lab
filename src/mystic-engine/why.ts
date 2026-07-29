import type { CastResult } from '../liuyao/engine.ts';
import { formatHexShortWithPinyin, formatHexWithPinyin } from '../liuyao/hex-pinyin.ts';
import { getBoardLens, QIN_MODERN } from '../liuyao/board-lens.ts';
import { fillVoiceTemplate, getHexVoice } from '../liuyao/hex-voice.ts';
import type { LiuQin } from '../liuyao/najia.ts';
import type { SceneDomain } from '../liuyao/scene-map.ts';
import type { WhyItem } from './types.ts';
import { toneFlags } from './tone.ts';

/** 白话 + 传统六亲，方便和古籍/师傅接轨 */
function modernWithClassic(qin: LiuQin): string {
  return `${QIN_MODERN[qin]}（${qin}）`;
}

function composeBody(item: Omit<WhyItem, 'body'>): string {
  const lines = [item.hook, ...(item.points ?? [])];
  if (item.tip) lines.push(`建议：${item.tip}`);
  return lines.filter(Boolean).join('\n');
}

function whyItem(partial: Omit<WhyItem, 'body'>): WhyItem {
  return { ...partial, body: composeBody(partial) };
}

function isCareerish(domain: SceneDomain, question: string): boolean {
  return domain === 'career' || /离职|薪|求职|工作|转正|offer|面试|老板|同事/i.test(question);
}

function isWealthish(domain: SceneDomain, question: string): boolean {
  return domain === 'wealth' || /投资|理财|股票|花钱|回款|现金流/i.test(question);
}

function isLoveish(domain: SceneDomain, question: string): boolean {
  return domain === 'love' || /感情|恋爱|分手|对象|结婚|喜欢/i.test(question);
}

/**
 * 现状 / 转机 / 底气：层次结构 + 完整文案（术语点二字、卦名可进精读）
 * 优先吃判词卡，避免非事业问被职场话术盖住。
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
  const career = isCareerish(domain, question);
  const wealth = isWealthish(domain, question);
  const love = isLoveish(domain, question);
  const pVoice = getHexVoice(cast.primary.name);
  const cVoice = cast.changed ? getHexVoice(cast.changed.name) : undefined;
  const from = cast.primary.keywords[0] ?? cast.primary.name;
  const to = cast.changed?.keywords[0] ?? cast.changed?.name;

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
    gloss: '动爻变化后的结果卦：描述走向与底气，不是死刑判决。',
  };

  const frame = pVoice?.frame ?? from;
  let statusHook: string;
  let statusPoint2: string;
  let statusTip: string;

  if (career) {
    statusHook =
      '你现在满脑子都是「我的目标是什么」「工资多少」「外面的规则怎么样」。你非常有主见，但这也意味着你承受着很大的职场压力。';
    statusPoint2 = '这种压力多半来自「想掌控自己的职业生涯」，不是你矫情。';
    statusTip = cut
      ? '这种压力是正常的，说明你渴望掌控自己的路；果断定调（含离职）往往是释放压力的正当途径。'
      : softFlow
        ? '压力正常。先别用蛮力硬刚——把压力翻译成清单与期限，比自我消耗更护自己。'
        : '压力正常，说明你很在意落点；把「在意」写成可核对的底线再行动。';
  } else if (love) {
    statusHook = `关系里你很在意自己的落点与对方回应。本卦主调偏「${frame}」——主见强，拉扯感也会跟着上来。`;
    statusPoint2 = '先把最堵的一件事说清楚，比空想「他到底怎么想」更护自己。';
    statusTip = softFlow
      ? '压力正常。宜柔进沟通，少一次摊牌定终身。'
      : '压力正常。深呼吸，先对齐一件可核对的事。';
  } else if (wealth) {
    statusHook = `钱与安全感占了很大带宽。本卦主调偏「${frame}」——主见强，也容易为数字紧绷。`;
    statusPoint2 = '先把现金流与风险上限写清，比空想涨跌更护自己。';
    statusTip = '压力正常。先保底线，再谈加码或出手。';
  } else {
    statusHook = pVoice
      ? `你很在意自己的落点。本卦主调偏「${frame}」——${fillVoiceTemplate(pVoice.metaphorSolo, from, to)}`
      : '你很在意自己的落点与外界规则，主见强，压力也跟着堆上来。';
    statusPoint2 = '先把最堵的一件事写清楚，比空想终局更护自己。';
    statusTip = pVoice
      ? pVoice.decision.split('\n')[0] ?? '压力正常。先把最堵的一件事写清楚。'
      : '压力正常。深呼吸，先把最堵的一件事写清楚。';
  }

  const items: WhyItem[] = [
    whyItem({
      title: '你的现状',
      badgeTerm: shiGloss,
      badgeNote: lens.shi.position,
      hook: statusHook,
      points: [
        `此刻气质偏「${modernWithClassic(lens.shi.qin)}」——先认清自己站在哪，再谈外面怎么变。`,
        statusPoint2,
      ],
      tip: statusTip,
    }),
  ];

  if (lens.moving.length === 0) {
    items.push(
      whyItem({
        title: '你的转机',
        badgeTerm: dongGloss,
        badgeNote: '无',
        hook: pVoice
          ? `不是突变局。局面暂稳，主调仍是「${frame}」——先把现状与底线看清，再决定加码还是撤。`
          : '不是突变局。局面暂时稳着，先把现状、底线与可核对条件看清，再决定加码还是撤。',
        points: [
          '无动不等于没戏，而是「先核对事实，再谈翻盘」。',
          '不必硬找爆点；稳局里把可核对条件谈清，才是转机的起点。',
        ],
        tip: pVoice?.mapAsk.replace(/^对应你的问题：/, '') ?? '把可核对条件看清，再决定下一步——急着变，反而看不清。',
      }),
    );
  } else {
    const points: string[] = [
      `卦象里有${lens.moving.length > 1 ? '两处以上' : '一处'}在变（${lens.moving.join('、')}），说明过程往往不是「一步到位」，可能会有拉扯或反复。`,
    ];
    if (pVoice) {
      points.push(`变点仍贴着本卦主调「${frame}」——${fillVoiceTemplate(pVoice.metaphorSolo, from, to)}`);
    }
    if (lens.caifu) {
      const base =
        lens.caifu.role.includes('基础') || lens.caifu.position === '初爻';
      const caifuLabel = modernWithClassic('妻财');
      points.push(
        `你的「${caifuLabel}」落在${lens.caifu.position}${lens.caifu.role ? `（${lens.caifu.role}）` : ''}。`,
      );
      if (base) {
        points.push(
          career || wealth
            ? '初爻偏起步与现状——换轨后的前一段时间，现金流和安全感可能先紧一阵，这很常见，不等于长期不行。'
            : '初爻偏起步与现状——安全感可能先紧一阵，常见，不等于长期不行。',
        );
      } else if (career || wealth) {
        points.push(
          `钱与自我价值这一层（传统称妻财）会更显眼：谈薪、到账、安全感都要单独核对。`,
        );
      } else {
        points.push('物质根基 / 自我价值这一层会更显眼：该核对的数字与边界，单独列出来。');
      }
    }
    if (lens.hasInfoNoise) {
      points.push(
        career
          ? '场上信息与口舌杂音偏多——你可能会遇到「薪资谈不拢、面试官说法前后不一、或听到心烦的行业流言」。口头不算数，以书面为准。'
          : '场上信息与口舌杂音偏多——口头不算数，以可核对信息 / 书面为准。',
      );
    } else if (softFlow) {
      points.push('沟通成本会偏高：反复确认比一次硬顶更稳。');
    }

    items.push(
      whyItem({
        title: '你的转机',
        badgeTerm: dongGloss,
        badgeNote: lens.moving.join('、'),
        hook: '过程往往不是一步到位——拉扯里才见转机，别把反复当成死刑。',
        points,
        tip: softFlow
          ? '留后路、小步确认，别指望一次谈死；熬过拉扯才到站。'
          : cut
            ? '抓住变点定调，少拖泥带水；定了就把精力留给下一局。'
            : pVoice
              ? pVoice.decision.split('\n').slice(0, 2).join('；')
              : '用可核对的一小步验证方向，再决定加码还是停。',
      }),
    );
  }

  if (cast.changed) {
    const cLabel = formatHexWithPinyin(cast.changed.name, cast.changed.fullName);
    const toKw = cast.changed.keywords.slice(0, 2).join('、') || cast.changed.name;
    const short = formatHexShortWithPinyin(cast.changed.name);
    let tip: string;
    let hook: string;
    const points: string[] = [
      `事情最终朝「${cLabel}」走——关键词偏「${toKw}」。`,
    ];

    if (open && career) {
      hook =
        '这是偏丰盛的走向：只要熬过最初那段起步震荡，后面更有机会等到比较理想的 Offer 与收入。';
      tip = '丰盛要落在纸上才算——画饼与合同条款分开核对，口头承诺一律留痕。';
      points.push('偏丰盛走向，但要书面落袋；别把「感觉会好」当成已经到手。');
    } else if (open) {
      hook = cVoice
        ? `走向偏「${cVoice.asChanged}」：资源与条件有机会聚拢，仍要用可核对动作落袋。`
        : `走向偏「${toKw}」：条件有机会聚拢，仍要用可核对动作落袋。`;
      tip = '感觉会好不等于已经到手——关键承诺留痕。';
      points.push(cVoice ? fillVoiceTemplate(cVoice.metaphorSolo, from, toKw) : '偏通达走向，仍要一步一核对。');
    } else if (softFlow) {
      hook = `走向偏「${toKw}」：结果往往能落地，但过程像风一样反复；熬过拉扯才到站。`;
      tip = '适合两手准备，随时可撤；柔进比硬刚更护自己。';
      points.push('反复磨人，不等于绝路——把缓冲与 Plan B 留好。');
    } else if (cut) {
      hook = `走向偏「${toKw}」：定调之后，把精力留给下一局，少拖泥带水。`;
      tip = career
        ? '交接与底线一次写清，定了就走，别反复自我消耗。'
        : '边界与决定一次写清，定了就执行，别反复自我消耗。';
      points.push('果断之后，重点是落地与下一局，而不是回看旧盘。');
    } else if (cVoice) {
      hook = `走向偏「${cVoice.asChanged}」：${fillVoiceTemplate(cVoice.metaphorSolo, from, toKw)}`;
      tip = cVoice.mapAskChanged.replace(/^对应你的问题：/, '');
      points.push(`变卦主调「${cVoice.frame}」——用下一小步核对，而不是一次梭哈。`);
    } else {
      hook = `走向偏「${toKw}」：用下一小步核对，而不是一次梭哈。`;
      tip = '方向感不是死刑判决——小步验证，再决定加码还是停。';
      points.push('先验证，再加码；忌情绪化一把梭。');
    }

    items.push(
      whyItem({
        title: '你的底气',
        badgeTerm: bianGloss,
        badgeHex: {
          kind: 'changed',
          name: cast.changed.name,
          label: short,
        },
        hook,
        points,
        tip,
      }),
    );
  } else {
    items.push(
      whyItem({
        title: '你的底气',
        badgeTerm: bianGloss,
        badgeNote: '无',
        hook: pVoice
          ? `局面暂稳，底气仍在「${frame}」——先把可核对条件谈清，再谈翻盘。`
          : '局面暂稳。先把可核对条件谈清，再谈翻盘；底气来自清单，不来自空想。',
        points: [
          '无变卦时，先把本卦结构与世应看清即可。',
          pVoice
            ? fillVoiceTemplate(pVoice.metaphorSolo, from)
            : '把底线写下来，比空想终局更护自己。',
        ],
        tip: pVoice
          ? pVoice.decision.split('\n').slice(0, 2).join('；')
          : '把底线写下来，再决定加码还是停——稳局里也要有动作。',
      }),
    );
  }

  return items;
}
