/**
 * 解卦 · 综合论断
 * 吉凶成败 / 发展趋势 / 应期推断 / 具体细节
 * 硬规则：趋势性、参考性，禁止绝对吉凶判决。
 * 不复读整段问题；文案保持可读厚度。
 */
import type { CastResult } from '../liuyao/engine.ts';
import { LINE_LABELS } from '../liuyao/hexagrams.ts';
import { LINE_ROLE, buildReadingFacts } from '../liuyao/reading-facts.ts';
import { dressHexagram, LIUSHEN_PLAIN } from '../liuyao/najia.ts';
import { siZhuFromDate } from '../liuyao/ganzhi.ts';
import type { BoardSignals } from './board-signals.ts';
import { paceLabel } from './board-signals.ts';

export type OutcomeLean = 'favorable' | 'blocked' | 'mixed' | 'neutral';

export type ScriptSynthesis = {
  /** 吉凶成败（倾向，非判决） */
  outcome: { lean: OutcomeLean; label: string; text: string };
  /** 发展趋势 */
  trend: string;
  /** 应期推断 */
  timing: string;
  /** 具体细节（爻位/六亲/六神等象义） */
  details: string;
  /** 表达原则提示 */
  disclaimer: string;
};

function decideOutcome(s: BoardSignals): ScriptSynthesis['outcome'] {
  if (s.tugOfWar) {
    return {
      lean: 'mixed',
      label: '走平 · 偏拉锯',
      text: `倾向「能推进也有拦阻」，成败未一次定音——属走平偏拉锯。宜小步核对后再加码，别把一次拉扯当成终局判决。`,
    };
  }
  if (s.bareQuit && (s.pace === 'stop' || s.yongWeak || s.pace === 'slow_then_stop')) {
    return {
      lean: 'blocked',
      label: '偏阻 · 宜先守边界',
      text: `更偏「先停、先写清条件」，不是催你立刻一刀切成功离开，也不是断定必须留下。先把底线与期限写清楚，比硬冲更重要。`,
    };
  }
  if (s.yongWeak || s.pace === 'stop' || (s.hasJi && !s.hasYuan && s.yongWeak)) {
    return {
      lean: 'blocked',
      label: '偏阻 · 宜补条件',
      text: `关键点力气不足或走向偏停，短期「硬成」概率偏低。宜先补条件、减干扰，再评估能否成——不是否定你，是提醒先把地基补上。`,
    };
  }
  if (s.yongStrong && s.shiYingRel === '相生' && !s.yongKong) {
    return {
      lean: 'favorable',
      label: '偏顺 · 可推进',
      text: `用神有气且世应较合拍，倾向「有机会推进」。仍需可核对动作去兑现，不是稳赢判决；窗口在，要你去接。`,
    };
  }
  if (s.yongStrong || (s.hasYuan && !s.yongWeak)) {
    return {
      lean: 'favorable',
      label: '偏可成 · 要兑现',
      text: `有助力或用神不弱，倾向「有做成空间」。窗口在，仍取决于你是否把口头变成书面/行动；别空等好兆头自己落地。`,
    };
  }
  if (s.shiYingRel === '相克') {
    return {
      lean: 'mixed',
      label: '走平 · 内外拧',
      text: `你与外界节奏有冲突，成败取决于能否对齐一件可核对的事。暂判走平，不宜一次下死结论；先找那个能对齐的点。`,
    };
  }
  return {
    lean: 'neutral',
    label: '偏平 · 先观后动',
    text: `尚未出现一边倒的成/败信号，倾向「先观后动」——用一件小事验证，再决定加码或停。`,
  };
}

function buildTrend(s: BoardSignals): string {
  const bits: string[] = [];
  bits.push(`过程节奏：${paceLabel(s.pace)}。`);
  if (s.changedName) {
    bits.push(
      `关键节点：从「${s.primaryName}」走向「${s.changedName}」——变卦侧是下一幕的主调，宜按变卦方式推进，少死磕本卦旧法。`,
    );
  } else {
    bits.push(
      `关键节点：暂无变卦，局面相对稳；节点在「你核对到的那一次回应」，而不是幻想中的大翻转。`,
    );
  }
  if (s.hasYuan) bits.push(`可能助力：${s.yuanTip || '有原神生扶用神，可借资源/信息。'}`);
  if (s.hasJi) bits.push(`可能阻碍：${s.jiTip || '有忌神拖累，宜先减干扰。'}`);
  if (s.tugOfWar) {
    bits.push('拉锯段：暗处推力与月令冲散同在，过程会反复，属正常波动不是终局。');
  }
  if (s.yongKong) {
    bits.push('空亡段：关键点偏虚，兑现可能偏慢，中间易出现「看起来有、落不实」的节点。');
  }
  return bits.join('\n\n');
}

function buildTiming(s: BoardSignals, cast: CastResult): string {
  const move =
    cast.changingIndexes.length > 0
      ? `动在${cast.changingIndexes.map((i) => LINE_LABELS[i]).join('、')}`
      : '暂无明动';
  const bits: string[] = [
    `应期宜作「窗口参考」，不是钉死某天：当前${move}；月令支「${s.monthBranch}」、日支「${s.dayBranch}」。`,
  ];

  if (s.yongKong) {
    bits.push(
      '用神落空亡：兑现常偏慢，窗口多在空亡出空、或你补齐书面条件之后，而不是本周内硬等到。',
    );
  }
  if (s.pace === 'slow' || s.pace === 'slow_then_stop') {
    bits.push(
      '节奏偏慢：更可能落在「补材料/谈清之后的下一档时间」（数日到一两周），不宜按「今晚必有结果」估。',
    );
  }
  if (s.pace === 'stop') {
    bits.push(
      '走向偏停：近窗宜守与核对；真正变化多在你执行底线/触发条件之后，而不是继续空等同一节点。',
    );
  }
  if (s.tugOfWar) {
    bits.push('拉锯局：一次沟通很少结案；可把「跟进后 3 天内有无书面节点」当作近窗探针。');
  }
  if (s.hasMoving && s.changedName) {
    bits.push(
      '变爻生效感：关注动爻对应事务有回应、或月/日与动爻地支发生合冲时，局面更易显化（仍须对照现实动作）。',
    );
  }
  if (!s.hasMoving && !s.yongKong) {
    bits.push(
      '静卦：应期更看你主动探针的日期——本周做一个可打勾动作，用对方回应日当作近窗锚点。',
    );
  }
  bits.push('提醒：应期随你的行动与对方流程而移动；没有动作，时间推断只是空壳。');
  return bits.join('\n\n');
}

function buildDetails(
  s: BoardSignals,
  cast: CastResult,
  castAt: Date,
): string {
  const facts = buildReadingFacts(cast, s.question, castAt);
  const sz = siZhuFromDate(castAt);
  const dressed = dressHexagram(cast, sz.dayStem);
  const shi = dressed.rows.find((r) => r.isShi);
  const ying = dressed.rows.find((r) => r.isYing);
  const yongRow =
    facts.yong.matchedLine != null
      ? dressed.rows.find((r) => r.index === facts.yong.matchedLine)
      : undefined;

  const bits: string[] = [];
  bits.push(
    `用神象：「${s.yongName}」${
      yongRow
        ? `落在${yongRow.label}（${LINE_ROLE[yongRow.index] ?? ''}），六亲${yongRow.liuqin}，六神${yongRow.liushen}（${LIUSHEN_PLAIN[yongRow.liushen]}）`
        : '尚未精确落到表上某一爻，先按问题层理解'
    }。`,
  );
  if (shi) {
    bits.push(
      `你（世）在${shi.label}：六亲${shi.liuqin} · 六神${shi.liushen}（${LIUSHEN_PLAIN[shi.liushen]}）——偏「${LINE_ROLE[shi.index]}」这一层的状态。`,
    );
  }
  if (ying) {
    bits.push(
      `外界（应）在${ying.label}：六亲${ying.liuqin} · 六神${ying.liushen}（${LIUSHEN_PLAIN[ying.liushen]}）——对方/岗位/环境落在这一层。`,
    );
  }
  if (s.shiYingRel === '相克') {
    bits.push('世应相克：方式上容易各说各话；细节里多看「信息不对称、节奏不合」，少归因人格审判。');
  } else if (s.shiYingRel === '相生') {
    bits.push('世应相生：有配合空间；细节里多看「如何把默契写成可核对条款」。');
  }
  if (cast.changingIndexes.length) {
    const roles = cast.changingIndexes
      .map((i) => `${LINE_LABELS[i]}（${LINE_ROLE[i]}）`)
      .join('、');
    bits.push(`动变落点：${roles}——变化更可能从这些位置的事务冒出来（沟通、决策、收束等）。`);
  }
  return bits.join('\n\n');
}

export function buildSynthesis(
  s: BoardSignals,
  cast: CastResult,
  castAt = new Date(),
): ScriptSynthesis {
  return {
    outcome: decideOutcome(s),
    trend: buildTrend(s),
    timing: buildTiming(s, cast),
    details: buildDetails(s, cast, castAt),
    disclaimer:
      '以上为趋势与参考，不是绝对吉凶判决。请结合你能核对的现实动作使用；拿不准时，优先守住边界与可逆的一小步。',
  };
}
