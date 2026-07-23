import type { CastResult } from './engine.ts';
import { palaceStageOfHexagram } from './hexagrams.ts';
import { dressHexagram, type LiuQin } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { buildReadingFacts } from './reading-facts.ts';
import type { ShiYingRel } from './wuxing.ts';

export type PatternChip = {
  id: string;
  label: string;
  tip: string;
  kind: 'shi' | 'rel' | 'move' | 'struct';
};

export type PatternSummary = {
  chips: PatternChip[];
};

/** 六合卦（纳甲常用八个） */
const LIUHE_NAMES = new Set(['泰', '否', '损', '益', '既济', '未济', '恒', '咸']);

/** 六冲卦 = 八纯卦 */
const LIUCHONG_NAMES = new Set(['乾', '坤', '震', '巽', '坎', '离', '艮', '兑']);

const SHI_TIP: Record<LiuQin, string> = {
  妻财: '求财、经营偏有根；男测婚恋也常看此。父母、家宅类事宜先核对细节。',
  官鬼: '功名、压力、规则在身；求职升迁常盯这一层，也防压力压身。',
  父母: '文书、信息、靠山在身；考试手续偏利，也主操心牵挂。',
  子孙: '创意、破局、松快在身；宜主动破局，求官求名则力稍弱。',
  兄弟: '竞争、耗散、同辈在身；合作要防分利，理财宜守。',
};

const REL_TIP: Record<ShiYingRel, string> = {
  比和: '内外同频，易协同，也防一起原地打转。',
  相生: '内外较顺，有借力空间；仍要分清谁出力、谁卡位。',
  相克: '内外冲撞，易见摩擦、牵制；先降温对齐事实。',
};

const MOVE_TIP: Record<LiuQin, string> = {
  兄弟: '竞争或破财之象显眼，防分利、口舌与无效消耗。',
  子孙: '破局力在动，适合试新；求官求名时要防泄气。',
  妻财: '钱财/资源层在动，进账或破耗都更显眼，宜核对进出。',
  官鬼: '压力、目标或病灾层在动，宜对准具体事项，少空慌。',
  父母: '文书、信息、家宅层在动，手续与消息往往先变。',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 从本卦装卦提炼格局摘要条 */
export function buildPatternSummary(
  cast: CastResult,
  question = '',
  castAt = new Date(),
): PatternSummary {
  const facts = buildReadingFacts(cast, question, castAt);
  const rows = dressHexagram(cast, siZhuFromDate(castAt).dayStem).rows;
  const shi = rows.find((r) => r.isShi);
  const chips: PatternChip[] = [];

  if (shi) {
    chips.push({
      id: `shi-${shi.liuqin}`,
      label: `${shi.liuqin}持世`,
      tip: SHI_TIP[shi.liuqin],
      kind: 'shi',
    });
  }

  chips.push({
    id: `rel-${facts.shiYingRel.rel}`,
    label: `世应${facts.shiYingRel.rel}`,
    tip: `${facts.shiYingRel.verdict}——${REL_TIP[facts.shiYingRel.rel]}`,
    kind: 'rel',
  });

  const movingQin = new Set<LiuQin>();
  for (const r of rows) {
    if (r.changing) movingQin.add(r.liuqin);
  }
  for (const q of movingQin) {
    chips.push({
      id: `move-${q}`,
      label: `${q}发动`,
      tip: MOVE_TIP[q],
      kind: 'move',
    });
  }

  const name = cast.primary.name;
  if (LIUHE_NAMES.has(name)) {
    chips.push({
      id: 'struct-liuhe',
      label: '六合卦',
      tip: '合局偏和合、牵绊，易成事也易纠缠；合作、感情常看这一层。',
      kind: 'struct',
    });
  } else if (LIUCHONG_NAMES.has(name)) {
    chips.push({
      id: 'struct-liuchong',
      label: '六冲卦',
      tip: '冲局偏动荡、离散，宜快不宜拖；拖久易散。',
      kind: 'struct',
    });
  }

  const stage = palaceStageOfHexagram(name);
  if (stage?.stageLabel === '游魂') {
    chips.push({
      id: 'struct-youhun',
      label: '游魂卦',
      tip: '游魂主漂泊、未定；宜先找落脚点，再谈扩张。',
      kind: 'struct',
    });
  } else if (stage?.stageLabel === '归魂') {
    chips.push({
      id: 'struct-guihun',
      label: '归魂卦',
      tip: '归魂主回拢、归位；宜回收精力，把事收到可验证的一步。',
      kind: 'struct',
    });
  }

  return { chips };
}

export function renderPatternSummaryHtml(summary: PatternSummary): string {
  if (!summary.chips.length) return '';
  const chips = summary.chips
    .map(
      (c) => `
      <li class="ly-pattern-chip is-${c.kind}" title="${escapeHtml(c.tip)}">
        <span class="ly-pattern-chip-label">${escapeHtml(c.label)}</span>
        <span class="ly-pattern-chip-tip">${escapeHtml(c.tip)}</span>
      </li>`,
    )
    .join('');

  return `
    <section class="ly-pattern-summary" data-pattern-summary aria-label="格局摘要">
      <p class="ly-pattern-summary-kicker">格局摘要</p>
      <ul class="ly-pattern-chip-list">${chips}</ul>
    </section>
  `;
}
