import type { CastResult } from './engine.ts';
import { LINE_LABELS, palaceStageOfHexagram } from './hexagrams.ts';
import { dressHexagram, type LiuQin } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { buildReadingFacts } from './reading-facts.ts';
import type { ShiYingRel } from './wuxing.ts';

/** 点标签打开哪一侧：盘面事实 vs 卦象白话 */
export type PatternOpenTarget = 'dress' | 'xiang';

export type PatternChip = {
  id: string;
  label: string;
  tip: string;
  kind: 'shi' | 'rel' | 'move' | 'struct';
  /** 点击后打开的笔记 Tab */
  open: PatternOpenTarget;
  /** 关联爻（0–5），便于专业排盘高亮 */
  yaoIndex?: number;
  /** 小备注（可选；不再复读八宫阶位） */
  note?: string;
};

export type PatternSummary = {
  chips: PatternChip[];
  /** 八宫阶位一句（整卦属性，只写一次） */
  palaceBrief?: string;
};

/** 六合卦（纳甲常用八个） */
const LIUHE_NAMES = new Set(['泰', '否', '损', '益', '既济', '未济', '恒', '咸']);

/** 六冲卦 = 八纯卦 */
const LIUCHONG_NAMES = new Set(['乾', '坤', '震', '巽', '坎', '离', '艮', '兑']);

const SHI_TIP: Record<LiuQin, string> = {
  妻财: '钱、资源贴着你——谈条件、进账有根，也要防口头承诺。',
  官鬼: '考核、规则、升职加薪压在你身上——在意结果，也易被压力拖累。',
  父母: '文书、信息、靠山贴着你——手续消息重要，也主操心。',
  子孙: '破局点子在你这边——宜主动试；硬求官名时力稍弱。',
  兄弟: '竞争、同辈、分利感贴着你——合作要防被分走。',
};

const REL_TIP: Record<ShiYingRel, string> = {
  比和: '你和外界节奏差不多——好协同，也防一起原地打转。',
  相生: '你和对方不是硬对着干，有借力空间；仍要分清谁真帮你。',
  相克: '你和外界容易顶牛——先降温对齐事实，再谈条件。',
};

const MOVE_TIP: Record<LiuQin, string> = {
  兄弟: '竞争或「分你一杯羹」在动——防抢话权、口舌内耗。',
  子孙: '破局力在动，适合试新；求官求名时要防力气泄掉。',
  妻财: '钱/资源这一层在动——进账或破耗更显眼，宜核对书面条款。',
  官鬼: '压力或目标层在动——对准岗、钱、时间，少空慌。',
  父母: '文书、信息在动——手续与消息往往先变，宜盯书面答复。',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 从本卦装卦提炼格局摘要条（每条都能回链到盘面或卦象） */
export function buildPatternSummary(
  cast: CastResult,
  question = '',
  castAt = new Date(),
): PatternSummary {
  const facts = buildReadingFacts(cast, question, castAt);
  const rows = dressHexagram(cast, siZhuFromDate(castAt).dayStem).rows;
  const shi = rows.find((r) => r.isShi);
  const stage = palaceStageOfHexagram(cast.primary.name);
  const chips: PatternChip[] = [];

  if (shi) {
    chips.push({
      id: `shi-${shi.liuqin}`,
      label: `${shi.liuqin}持世`,
      tip: SHI_TIP[shi.liuqin],
      kind: 'shi',
      open: 'dress',
      yaoIndex: shi.index,
    });
  }

  chips.push({
    id: `rel-${facts.shiYingRel.rel}`,
    label: `世应${facts.shiYingRel.rel}`,
    tip: REL_TIP[facts.shiYingRel.rel],
    kind: 'rel',
    open: 'dress',
    yaoIndex: shi?.index,
  });

  const movingByQin = new Map<LiuQin, number>();
  for (const r of rows) {
    if (r.changing && !movingByQin.has(r.liuqin)) movingByQin.set(r.liuqin, r.index);
  }
  for (const [q, idx] of movingByQin) {
    chips.push({
      id: `move-${q}`,
      label: `${q}发动`,
      tip: MOVE_TIP[q],
      kind: 'move',
      open: 'dress',
      yaoIndex: idx,
    });
  }

  const name = cast.primary.name;
  if (LIUHE_NAMES.has(name)) {
    chips.push({
      id: 'struct-liuhe',
      label: '六合卦',
      tip: '合局偏和合、牵绊，易成事也易纠缠。',
      kind: 'struct',
      open: 'xiang',
    });
  } else if (LIUCHONG_NAMES.has(name)) {
    chips.push({
      id: 'struct-liuchong',
      label: '六冲卦',
      tip: '冲局偏动荡、离散，宜快不宜拖。',
      kind: 'struct',
      open: 'xiang',
    });
  }

  if (stage?.stageLabel === '游魂') {
    chips.push({
      id: 'struct-youhun',
      label: '游魂卦',
      tip: '游魂主漂泊、未定；宜先找落脚点。',
      kind: 'struct',
      open: 'xiang',
    });
  } else if (stage?.stageLabel === '归魂') {
    chips.push({
      id: 'struct-guihun',
      label: '归魂卦',
      tip: '归魂主回拢、归位；宜把事收到可验证的一步。',
      kind: 'struct',
      open: 'xiang',
    });
  }

  const palaceBrief = stage
    ? `本卦属${stage.palace}宫「${stage.stageLabel}」· 世在${LINE_LABELS[stage.shiLine - 1]}。八宫阶位用来定「世」落在哪一爻，不是六亲本身。`
    : undefined;

  return { chips, palaceBrief };
}

export function renderPatternSummaryHtml(summary: PatternSummary): string {
  if (!summary.chips.length) return '';
  const n = summary.chips.length;
  const chips = summary.chips
    .map((c) => {
      const yao =
        c.yaoIndex !== undefined ? ` data-pattern-yao="${c.yaoIndex}"` : '';
      const note = c.note
        ? `<span class="ly-pattern-chip-note">${escapeHtml(c.note)}</span>`
        : '';
      return `
      <li>
        <button type="button" class="ly-pattern-chip is-${c.kind}" data-pattern-chip="${escapeHtml(
          c.id,
        )}" data-pattern-open="${c.open}" data-pattern-kind="${c.kind}"${yao} title="${escapeHtml(
          c.tip,
        )}">
          <span class="ly-pattern-chip-label">${escapeHtml(c.label)}</span>
          ${note}
          <p class="ly-pattern-chip-tip"><span class="ly-pattern-chip-say">简单说</span>${escapeHtml(c.tip)}</p>
        </button>
      </li>`;
    })
    .join('');

  return `
    <details class="ly-pattern-summary" data-pattern-summary>
      <summary class="ly-pattern-summary-sum">
        <span class="ly-pattern-summary-kicker">格局摘要</span>
        <span class="ly-pattern-summary-hint">选读 · ${n} 条盘面亮点</span>
      </summary>
      <div class="ly-pattern-summary-body">
        <div class="ly-pattern-primer">
          <p class="ly-pattern-primer-title">先认三个词</p>
          <ul class="ly-pattern-primer-list">
            <li><strong>世</strong>：卦里代表「你」的那一爻。</li>
            <li><strong>应</strong>：代表对方 / 公司 / 外界的那一爻。</li>
            <li><strong>六亲</strong>（官鬼、兄弟等）：事类标签——官鬼≈规则/压力/考核，兄弟≈竞争/分利，妻财≈钱，父母≈文书信息，子孙≈破局点子。</li>
          </ul>
          <p class="ly-pattern-primer-why">为什么要看：先认清「你站哪、对方在哪、哪一类力量在动」，再读下面的白话亮点，就不会不明所以。</p>
          ${
            summary.palaceBrief
              ? `<p class="ly-pattern-palace">${escapeHtml(summary.palaceBrief)}</p>`
              : ''
          }
        </div>
        <p class="ly-pattern-summary-lead">本卦最扎眼的几件事</p>
        <ul class="ly-pattern-chip-list">${chips}</ul>
      </div>
    </details>
  `;
}
