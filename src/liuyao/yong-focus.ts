/**
 * 学习 Step「锁定用神」：按所问取六亲 → 落爻高亮 → 专家三段解读
 */
import type { CastResult } from './engine.ts';
import { dressHexagram, liuqinOf, LIUSHEN_PLAIN, type LiuQin, type YaoDress } from './najia.ts';
import type { WuXing } from './wuxing.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { formatLiuqinShort, LIUQIN_ENERGY } from './energy-lens.ts';
import { LINE_ROLE } from './reading-facts.ts';
import { buildShengKeMap } from './shengke-map.ts';
import { yongLiuQinList } from './yong-shen.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { glossLine } from './classic-gloss.ts';

export type YongFocusPack = {
  topicLabel: string;
  yongQin: LiuQin | null;
  yongModern: string;
  intro: string;
  focusIndexes: number[];
  /** 旁注：核心点位 */
  coreHint: string;
  expertTitle: string;
  /** 🔹 状态 */
  statusText: string;
  /** 🔹 翻译成问题 */
  translateText: string;
  /** 🔹 行动建议 */
  actionText: string;
  /** 笔记用：聚焦爻 */
  primaryRow: YaoDress | null;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 开场用的问题类型短标签 */
export function yongTopicLabel(question: string): string {
  const q = question.trim();
  if (/考试|考研|考证|题目|成绩|分数/.test(q)) return '考试';
  if (/薪|工资|资产|投资|收入|钱|财/.test(q)) return '薪资/资产';
  if (/升职|面试|工作|offer|事业|老板|岗位|求职/.test(q)) return '求职/升职';
  if (/感情|恋爱|分手|复合|对象|婚姻|喜欢/.test(q)) return '感情';
  if (/方向|选择|要不要|该不该|去不去/.test(q)) return '方向';
  if (!q) return '方向';
  return '所问之事';
}

function huaQinOf(row: YaoDress, palaceWx: WuXing): LiuQin | null {
  if (!row.changing || !row.changedWuxing) return null;
  return liuqinOf(palaceWx, row.changedWuxing);
}

function godPlain(name: string): string {
  return LIUSHEN_PLAIN[name as keyof typeof LIUSHEN_PLAIN] ?? '场上氛围的一种标注。';
}

function buildTranslate(
  topic: string,
  yongQin: LiuQin,
  row: YaoDress,
  hua: LiuQin | null,
): string {
  const lab = formatLiuqinShort(yongQin);
  const god = row.liushen;
  const godHint = godPlain(god);
  const huaBit = hua
    ? `本卦的动爻变成了【${formatLiuqinShort(hua)}】。意味着经过这件事，能量会滑向「${LIUQIN_ENERGY[hua].modern}」这一层。`
    : '';

  if (yongQin === '父母') {
    return `你关心的「文书 / 机会 / 信息」落在${row.label}（${lab}）。六神见「${god}」——${godHint}${
      row.changing
        ? ` ${huaBit || '它正在动：机会可能要过一层审核或暗线确认，才会落到实处。'}`
        : ' 先把资料与通道准备好，再等明面信号。'
    }`;
  }
  if (yongQin === '官鬼') {
    return `翻译成你的${topic}问题：「目标 / 岗位 / 考核」这一层就在${row.label}（${lab}）。遇到「${god}」——${godHint}${
      row.changing
        ? ` ${huaBit || '它正在动：结果常要透过隐藏条件或非公开路径才确认。'}`
        : ' 先对齐规则与考核口径，再谈强推。'
    }`;
  }
  if (yongQin === '妻财') {
    return `翻译成你的${topic}问题：能量在${row.label}的【${lab}】。六神「${god}」——${godHint}${
      row.changing
        ? ` ${
            hua
              ? huaBit
              : '它正在动：钱或资源的到位路径可能不在明面渠道。'
          }`
        : ' 先稳住现金流与估值依据，再扩大动作。'
    }`;
  }
  return `你问的是「${topic}」，核心聚焦「${lab}」落在${row.label}（${god}）。${
    row.changing ? huaBit || '这一层正在变。' : '这一层偏静，先当坐标读。'
  }`;
}

function buildAction(
  topic: string,
  yongQin: LiuQin,
  row: YaoDress,
  hua: LiuQin | null,
): string {
  if (row.liushen === '玄武') {
    if (yongQin === '官鬼' || yongQin === '父母') {
      return '先少盯公开渠道的「海量投递」，多问一问前同事、内推群、或你本来就认识的人——玄武偏暗流，机会常在非公开处。';
    }
    if (yongQin === '妻财') {
      return '少被表面报价牵着走；去核对账本、合同细则、或熟人侧写——暗处的数字往往更接近真实回报。';
    }
  }
  if (row.changing && hua === '妻财') {
    return `动而化为【${formatLiuqinShort('妻财')}】：先完成眼前这一层「确认 / 考核」，再谈谈薪与落袋；别跳过中间门。`;
  }
  if (row.changing) {
    return `核心聚焦在动：只推与「${topic}」直接相关的最小一步，并设一个可验证的节点（一周内能看见反馈的那种）。`;
  }
  return `核心聚焦偏静：先把${row.label}这一层的事实清单写清（条件、时间、对方态度），再决定是否加码。`;
}

function buildStatus(row: YaoDress, yongQin: LiuQin, hua: LiuQin | null): string {
  const role = LINE_ROLE[row.index]!;
  const lab = formatLiuqinShort(yongQin);
  let status = `你现在的核心聚焦【${lab}】落在${row.label}。这一爻偏「${role}」。`;
  status += `🔹 它的状态是：遇到了【${row.liushen}】（${godPlain(row.liushen).replace(/。$/, '')}）`;
  if (row.changing) {
    status += hua
      ? `。并且它发动，变成了【${formatLiuqinShort(hua)}】。`
      : '。并且它发动了。';
  } else {
    status += '；目前未发动，以静象先读。';
  }
  return status;
}

export function buildYongFocusPack(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): YongFocusPack {
  const topicLabel = yongTopicLabel(question);
  const dressed = dressHexagram(cast, siZhuFromDate(castAt).dayStem);
  const map = buildShengKeMap(cast, dressed, question);
  const qins = yongLiuQinList(question);
  const yongQin = map.yongQin ?? qins[0] ?? null;
  const yongNode = map.nodes.find((n) => n.role === '用神');
  const primary = yongNode?.row ?? null;

  // 感情等可有两枚候选：尽量各取一爻
  const focusRows: YaoDress[] = [];
  if (primary) focusRows.push(primary);
  for (const q of qins) {
    if (focusRows.length >= 2) break;
    const extra = dressed.rows.find((r) => r.liuqin === q && !focusRows.some((f) => f.index === r.index));
    if (extra && (!primary || extra.index !== primary.index)) focusRows.push(extra);
  }

  const focusIndexes = focusRows.map((r) => r.index);
  const yongModern = yongQin ? formatLiuqinShort(yongQin) : '用神（按所问而定）';
  const tag = primary
    ? `${primary.liushen} + ${formatLiuqinShort(primary.liuqin)}`
    : '';

  if (!yongQin || !primary) {
    return {
      topicLabel,
      yongQin,
      yongModern,
      intro: `针对你问的「${topicLabel}」问题，在六爻里我们最需要关注的代号叫「用神」——不是封建身份标签，而是「本题注意力该放在哪个能量系统」。先把问题写具体一点，才能在卦里把它钉牢。`,
      focusIndexes: [],
      coreHint: '本题用神尚未落到具体爻——先补一句更清楚的所问。',
      expertTitle: '【针对这一爻，专家是怎么看的？】',
      statusText: '用神未定，暂不硬断单爻。',
      translateText: '把问题改成可验证的一句（例如「这份 offer 要不要接」），再回来锁定用神。',
      actionText: '先写清所问，再进下一步看动爻与能量聚焦。',
      primaryRow: null,
    };
  }

  const hua = huaQinOf(primary, dressed.palaceWx);
  const intro = `针对你问的「${topicLabel}」问题，在六爻里，我们最需要关注的代号叫「用神」。本题看「${yongModern}」。我们先找出它。`;

  return {
    topicLabel,
    yongQin,
    yongModern,
    intro,
    focusIndexes,
    coreHint: `这是你这次的核心点位。在【${primary.label}】，带有「${tag}」的标签。`,
    expertTitle: '【针对这一爻，专家是怎么看的？】',
    statusText: buildStatus(primary, yongQin, hua),
    translateText: buildTranslate(topicLabel, yongQin, primary, hua),
    actionText: buildAction(topicLabel, yongQin, primary, hua),
    primaryRow: primary,
  };
}

export function renderYongFocusHtml(pack: YongFocusPack): string {
  return `
    <div class="ly-yong-focus" data-yong-focus>
      <p class="ly-yong-focus-intro">${escapeHtml(pack.intro)}</p>
      <p class="ly-yong-focus-core">${escapeHtml(pack.coreHint)}</p>
      <h4 class="ly-yong-focus-expert">${escapeHtml(pack.expertTitle)}</h4>
      <p class="ly-yong-focus-status">${escapeHtml(pack.statusText)}</p>
      <div class="ly-yong-focus-block">
        <p class="ly-yong-focus-k">🔹 翻译成你的${escapeHtml(pack.topicLabel)}问题</p>
        <p class="ly-yong-focus-v">${escapeHtml(pack.translateText)}</p>
      </div>
      <div class="ly-yong-focus-block">
        <p class="ly-yong-focus-k">🔹 给你的行动建议</p>
        <blockquote class="ly-briefing-quote ly-yong-focus-quote">
          <p>${escapeHtml(pack.actionText)}</p>
        </blockquote>
      </div>
    </div>
  `;
}

/** 供课程笔记抽屉：用神爻 focus */
export function yongFocusAsCourseYao(
  pack: YongFocusPack,
  cast: CastResult,
): { index: number; mark: string; classic: string; bai: string; why?: string; life?: string }[] {
  if (!pack.primaryRow || !pack.yongQin) return [];
  const corpus = getClassicCorpus(cast.primary.name);
  const i = pack.primaryRow.index;
  return [
    {
      index: i,
      mark: `用神·${formatLiuqinShort(pack.yongQin)}`,
      classic: corpus?.lineClassics[i] ?? '',
      bai: glossLine(cast.primary.name, i) ?? pack.translateText,
      why: pack.coreHint,
      life: pack.translateText,
    },
  ];
}
