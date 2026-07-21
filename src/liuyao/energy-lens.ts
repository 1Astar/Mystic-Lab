import type { LiuQin, YaoDress } from './najia.ts';
import { LIUSHEN_PLAIN } from './najia.ts';
import { LINE_ROLE } from './reading-facts.ts';
import type { ShiYingRel } from './wuxing.ts';
import type { SceneDomain } from './scene-map.ts';

/** 六亲 → 能量 / 资源场（解读区统一「现代名（传统）」） */
export type LiuqinEnergy = {
  classic: LiuQin;
  modern: string;
  /** 现代名（传统） */
  label: string;
  blurb: string;
};

export const LIUQIN_ENERGY: Record<LiuQin, LiuqinEnergy> = {
  官鬼: {
    classic: '官鬼',
    modern: '目标系统 / 外部规则',
    label: '目标系统 / 外部规则（官鬼）',
    blurb:
      '你追求的目标（职位、项目）、外部压力（KPI、行业规则），以及社会评价体系的框架。',
  },
  妻财: {
    classic: '妻财',
    modern: '物质根基 / 自我价值',
    label: '物质根基 / 自我价值（妻财）',
    blurb:
      '你能掌控的实际资源（金钱、技能）、自我价值的回报，以及让你感到稳定的生活基础。',
  },
  子孙: {
    classic: '子孙',
    modern: '内在创造力 / 破局点',
    label: '内在创造力 / 破局点（子孙）',
    blurb:
      '创造力、灵感、打破常规的能力、身体与放松愉悦的源泉——能帮你破局的那股力。',
  },
  父母: {
    classic: '父母',
    modern: '安全基地 / 信息网',
    label: '安全基地 / 信息网（父母）',
    blurb:
      '知识储备、学习能力、过往经验、基础盘（家庭支持、社保、合同文书、考题信息）。',
  },
  兄弟: {
    classic: '兄弟',
    modern: '同侪环境 / 盟友圈',
    label: '同侪环境 / 盟友圈（兄弟）',
    blurb:
      '同代人与社交圈层、竞争与合作、群体中的拉扯——别人如何激活或带走你的节奏。',
  },
};

export function formatLiuqinLabel(qin: LiuQin): string {
  return LIUQIN_ENERGY[qin].label;
}

export function formatLiuqinShort(qin: LiuQin): string {
  const e = LIUQIN_ENERGY[qin];
  return `${e.modern}（${e.classic}）`;
}

/** 从「父母爻」「官鬼爻 / 妻财」等字符串抽出六亲并格式化 */
export function formatYongLabel(yongName: string): string {
  const order: LiuQin[] = ['父母', '官鬼', '妻财', '子孙', '兄弟'];
  const hits = order.filter((q) => yongName.includes(q));
  if (hits.length === 0) return yongName;
  return hits.map((q) => formatLiuqinShort(q)).join(' / ');
}

export function shiYingEnergyTip(rel: ShiYingRel): string {
  if (rel === '相生') {
    return '世（你）与应（外部）相生：内部能量与外部世界较有默契，可顺水推舟，也留意别把力气全交给外界。';
  }
  if (rel === '相克') {
    return '世（你）与应（外部）相克：内心需求与外部现实有冲突。冲突不是你的错，而是价值观与环境暂不匹配——这是停下来审视真实需求的信号，不必为了顺应环境而内耗自己。';
  }
  return '世（你）与应（外部）比和：内外节奏接近。适合协同，也防一起原地打转——先对齐「我真正要什么」。';
}

export type EnergyFocusItem = {
  title: string;
  body: string;
};

/** 当下能量聚焦：不谈谁克死谁，谈注意力放哪 */
export function buildEnergyFocus(opts: {
  changingQin: LiuQin[];
  changedQin?: LiuQin | null;
  strongQin?: LiuQin[];
}): EnergyFocusItem[] {
  const items: EnergyFocusItem[] = [];
  const seen = new Set<string>();

  const pushFor = (qin: LiuQin, via: string) => {
    const key = qin;
    if (seen.has(key)) return;
    seen.add(key);
    const lab = formatLiuqinShort(qin);
    if (qin === '官鬼') {
      items.push({
        title: `能量聚焦 · ${lab}`,
        body: `${via}你目前的注意力高度集中在【外部目标的达成】上。很好，也要小心：过于专注目标可能忽视体感。建议：冲刺的同时，记得察觉内心的疲惫，划清工作与休息边界。`,
      });
    } else if (qin === '子孙') {
      items.push({
        title: `能量聚焦 · ${lab}`,
        body: `${via}你现在的状态适合【打破旧框架】。若在求职或转型，灵感往往比标准简历更关键。建议：相信直觉，去试那些看似不常规、但让你有生命力的路。`,
      });
    } else if (qin === '兄弟') {
      items.push({
        title: `能量聚焦 · ${lab}`,
        body: `${via}你身处一个充满竞争与拉扯的同侪场。这不一定不好——它能激活状态。建议：善用盟友，但不要被他人的节奏带跑。`,
      });
    } else if (qin === '妻财') {
      items.push({
        title: `能量聚焦 · ${lab}`,
        body: `${via}能量落在【物质根基与自我价值回报】上。经过这件事，你更可能摸到实实在在的安全感来源（薪资、技能变现、可掌控资源）。建议：把「回报是否对等」写清楚，而不是只谈情怀。`,
      });
    } else {
      items.push({
        title: `能量聚焦 · ${lab}`,
        body: `${via}注意力在【安全基地与信息网】——文书、信息、经验盘、支持系统。建议：先把信息与基础盘补齐，再谈冒进；暗渠（内推、非公开渠道）往往比明面更关键。`,
      });
    }
  };

  for (const q of opts.changingQin) pushFor(q, '动爻指向：');
  if (opts.changedQin) pushFor(opts.changedQin, '动爻化入：');
  for (const q of opts.strongQin ?? []) pushFor(q, '场上偏旺：');

  if (items.length === 0) {
    items.push({
      title: '能量聚焦 · 先看世应',
      body: '本卦无明显动爻六亲信号。先看世（你）与应（外部）的互动模式，把注意力放在「我能动的一层」上。',
    });
  }
  return items;
}

export type YaoAskCard = {
  headline: string;
  roleLine: string;
  relate: string;
  aux?: string;
};

export function buildYaoAskCard(row: YaoDress, opts?: { domain?: SceneDomain }): YaoAskCard {
  const role = LINE_ROLE[row.index]!;
  const energy = LIUQIN_ENERGY[row.liuqin];
  const flags = [
    row.isShi ? '世＝你' : '',
    row.isYing ? '应＝外部' : '',
    row.changing ? '动爻' : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const headline = `${row.label} · ${row.branch}${row.wuxing} · ${formatLiuqinShort(row.liuqin)} · ${row.liushen}${
    flags ? `（${flags}）` : ''
  }`;

  const roleLine = `爻位理解：这是「${role}」一层。`;

  let relate = `与你相关：${energy.blurb}`;
  if (row.isShi) {
    relate = `与你相关：这一爻是世（你）——你的内部能量落在「${role}」。${energy.blurb}`;
  } else if (row.isYing) {
    relate = `与你相关：这一爻是应（外部）——环境/对方对你的作用点在「${role}」。${energy.blurb}`;
  }

  const auxParts: string[] = [];
  if (row.changing) {
    auxParts.push(
      row.changedBranch
        ? `辅助：此爻动了，从${row.branch}${row.wuxing}走向${row.changedBranch}${row.changedWuxing ?? ''}——这一层的起点已有变数。`
        : '辅助：此爻动了，代表这一层正在变心，是当下最该盯的具体点。',
    );
  }
  auxParts.push(`六神气色：${row.liushen}——${LIUSHEN_PLAIN[row.liushen]}`);
  if (opts?.domain === 'career' && row.liuqin === '官鬼') {
    auxParts.push('对照本题：求职/考核时，这一层常对应岗位、规则与外部评价。');
  }

  return {
    headline,
    roleLine,
    relate,
    aux: auxParts.join(' '),
  };
}

export function renderYaoAskCardHtml(card: YaoAskCard): string {
  return `
    <article class="ly-yao-ask-card" data-yao-ask-card>
      <p class="ly-yao-ask-head">${card.headline}</p>
      <p>${card.roleLine}</p>
      <p>${card.relate}</p>
      ${card.aux ? `<p class="ly-guide-tip">${card.aux}</p>` : ''}
    </article>
  `;
}

/** 用神锚点授课块（仅学习模式） */
export function renderYongShenTeachHtml(opts: {
  domain: SceneDomain;
  yongLabel: string;
  yongWhy: string;
  row?: YaoDress | null;
  highlightIndexes: number[];
}): string {
  const { domain, yongLabel, yongWhy, row, highlightIndexes } = opts;
  const domainHint =
    domain === 'career'
      ? '求职 / 升职 / 考核'
      : domain === 'love'
        ? '感情 / 关系'
        : domain === 'life'
          ? '钱财 / 生活资源'
          : '你当下真正在意的事';

  const pos =
    highlightIndexes.length > 0
      ? `关键点位：第 ${highlightIndexes.map((i) => i + 1).join('、')} 爻（高亮）。`
      : '关键点位：本题用神尚未直接落到具体爻，先看世应与动爻。';

  let teach = '';
  if (row) {
    const energy = LIUQIN_ENERGY[row.liuqin];
    teach = `
      <div class="ly-yong-teach-body">
        <p>【针对这一爻，怎么看？】</p>
        <p>你的用神「${yongLabel}」落在${row.label}。爻位偏「${LINE_ROLE[row.index]}」。六神是${row.liushen}（${LIUSHEN_PLAIN[row.liushen]}）。</p>
        <p>🔹 状态：${
          row.changing
            ? `它发动了${
                row.changedBranch
                  ? `，可能滑向与「${row.changedBranch}${row.changedWuxing ?? ''}」相关的一层`
                  : ''
              }——这一层正在变。`
            : '它暂时安静，作背景参照。'
        }</p>
        <p>🔹 译成你的问题：把「${energy.modern}」放进「${domainHint}」里想——${energy.blurb}</p>
        <p class="ly-guide-tip">🔹 行动：只动与这一层相关的最小一步；别一次梭哈整盘人生。</p>
      </div>`;
  }

  return `
    <section class="ly-yong-teach" data-yong-teach>
      <p class="ly-guide-label">问题锚点 · 用神</p>
      <p>针对你问的「${domainHint}」，六爻里最需要盯的代号叫<strong>用神</strong>。本题倾向：<strong>${yongLabel}</strong>。</p>
      <p class="ly-guide-tip">${yongWhy}</p>
      <p>${pos}</p>
      ${teach}
    </section>
  `;
}

export function renderEnergyFocusHtml(items: EnergyFocusItem[]): string {
  return `
    <section class="ly-energy-focus">
      <h4>你的当下能量聚焦</h4>
      <p class="ly-layer-guide">不谈谁克死谁，只谈：注意力与能量，现在该放在哪个系统上。</p>
      <ul class="ly-energy-focus-list">
        ${items
          .map(
            (it) => `
          <li>
            <strong>${it.title}</strong>
            <span>${it.body}</span>
          </li>`,
          )
          .join('')}
      </ul>
    </section>
  `;
}
