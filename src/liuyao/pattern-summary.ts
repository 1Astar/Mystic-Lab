import type { CastResult } from './engine.ts';
import { palaceStageOfHexagram } from './hexagrams.ts';
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
  /** 小备注，如「官鬼（二世）」 */
  note?: string;
};

export type PatternSummary = {
  chips: PatternChip[];
};

/** 六合卦（纳甲常用八个） */
const LIUHE_NAMES = new Set(['泰', '否', '损', '益', '既济', '未济', '恒', '咸']);

/** 六冲卦 = 八纯卦 */
const LIUCHONG_NAMES = new Set(['乾', '坤', '震', '巽', '坎', '离', '艮', '兑']);

const SHI_TIP: Record<LiuQin, string> = {
  妻财: '简单说：钱、资源这件事贴着你——谈条件、进账有根，也要防被「口头承诺」糊弄。',
  官鬼: '简单说：考核、规则、升职加薪压在你身上——你很在意结果，也容易被压力拖累。',
  父母: '简单说：文书、信息、靠山贴着你——手续消息重要，也主操心牵挂。',
  子孙: '简单说：破局点子、敢试的一小步在你这边——宜主动试，硬求官名时力稍弱。',
  兄弟: '简单说：竞争、同辈、分利感贴着你——合作要防被分走，理财宜守。',
};

const REL_TIP: Record<ShiYingRel, string> = {
  比和: '简单说：你和外界节奏差不多——好协同，也防一起原地打转。',
  相生: '简单说：你和公司/对方不是硬对着干，有借力空间；但仍要分清谁真帮你、谁卡着位置不松手。',
  相克: '简单说：你和外界容易顶牛、互相牵制——先降温对齐事实，再谈条件。',
};

const MOVE_TIP: Record<LiuQin, string> = {
  兄弟: '简单说：竞争或「分你一杯羹」的力量在动——防抢话权、口舌拉扯、把精力耗在无效内耗上。',
  子孙: '简单说：破局力在动，适合试新；若你正求官求名，要防力气泄掉。',
  妻财: '简单说：钱/资源这一层在动——进账或破耗都会更显眼，宜核对进出与书面条款。',
  官鬼: '简单说：压力或目标层在动——对准具体事项（岗、钱、时间），少空慌。',
  父母: '简单说：文书、信息这一层在动——手续与消息往往先变，宜盯书面答复。',
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
  /** 八宫阶位备注：二世 →「官鬼（二世卦）」 */
  const stageNote = (qin: string) => {
    if (!stage) return undefined;
    const lab = stage.stageLabel;
    if (lab === '本宫' || lab === '游魂' || lab === '归魂') return `${qin}（${lab}）`;
    return `${qin}（${lab}卦）`;
  };
  const chips: PatternChip[] = [];

  if (shi) {
    chips.push({
      id: `shi-${shi.liuqin}`,
      label: `${shi.liuqin}持世`,
      tip: SHI_TIP[shi.liuqin],
      kind: 'shi',
      open: 'dress',
      yaoIndex: shi.index,
      note: stageNote(shi.liuqin),
    });
  }

  chips.push({
    id: `rel-${facts.shiYingRel.rel}`,
    label: `世应${facts.shiYingRel.rel}`,
    tip: REL_TIP[facts.shiYingRel.rel],
    kind: 'rel',
    open: 'dress',
    yaoIndex: shi?.index,
    note: stageNote('世应'),
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
      note: stageNote(q),
    });
  }

  const name = cast.primary.name;
  if (LIUHE_NAMES.has(name)) {
    chips.push({
      id: 'struct-liuhe',
      label: '六合卦',
      tip: '合局偏和合、牵绊，易成事也易纠缠；合作、感情常看这一层。',
      kind: 'struct',
      open: 'xiang',
    });
  } else if (LIUCHONG_NAMES.has(name)) {
    chips.push({
      id: 'struct-liuchong',
      label: '六冲卦',
      tip: '冲局偏动荡、离散，宜快不宜拖；拖久易散。',
      kind: 'struct',
      open: 'xiang',
    });
  }

  if (stage?.stageLabel === '游魂') {
    chips.push({
      id: 'struct-youhun',
      label: '游魂卦',
      tip: '游魂主漂泊、未定；宜先找落脚点，再谈扩张。',
      kind: 'struct',
      open: 'xiang',
    });
  } else if (stage?.stageLabel === '归魂') {
    chips.push({
      id: 'struct-guihun',
      label: '归魂卦',
      tip: '归魂主回拢、归位；宜回收精力，把事收到可验证的一步。',
      kind: 'struct',
      open: 'xiang',
    });
  }

  return { chips };
}

export function renderPatternSummaryHtml(summary: PatternSummary): string {
  if (!summary.chips.length) return '';
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
          <span class="ly-pattern-chip-tip">${escapeHtml(c.tip)}</span>
        </button>
      </li>`;
    })
    .join('');

  return `
    <section class="ly-pattern-summary" data-pattern-summary aria-label="格局摘要">
      <p class="ly-pattern-summary-kicker">格局摘要</p>
      <p class="ly-pattern-summary-lead">这卦最扎眼的三件事（术语标签 · 下面是白话）</p>
      <ul class="ly-pattern-chip-list">${chips}</ul>
    </section>
  `;
}
