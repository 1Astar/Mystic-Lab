import type { LiuQin, YaoDress } from './najia.ts';
import { LIUSHEN_PLAIN, liuqinOf } from './najia.ts';
import { LINE_ROLE } from './reading-facts.ts';
import type { ShiYingRel, WuXing } from './wuxing.ts';
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
    return '世爻（你）和应爻（外部）相生：你现在和周围环境较有默契，顺水推舟即可；也留意别把力气全交给外界。';
  }
  if (rel === '相克') {
    return '世爻（你）和应爻（外部）相克：内心需求与外部现实有冲突。冲突不是你的错，而是价值观与环境暂不匹配——这不是要你去妥协的信号，而是停下来审视真实需求的信号。不要为了顺应外部环境而内耗自己。';
  }
  return '世爻（你）和应爻（外部）比和：内外节奏接近。适合协同，也防一起原地打转——先对齐「我真正要什么」。';
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
        body: `${via}你目前的能量高度集中在【外部目标的达成】上。这很好，也要小心：过于专注目标可能忽视体感。建议：冲刺的同时，记得察觉内心的疲惫。`,
      });
    } else if (qin === '子孙') {
      items.push({
        title: `能量聚焦 · ${lab}`,
        body: `${via}你现在的状态非常适合【打破旧框架】。若在找工作或转型，灵感往往比标准简历更重要。建议：相信直觉，去尝试那些看似不常规的路。`,
      });
    } else if (qin === '兄弟') {
      items.push({
        title: `能量聚焦 · ${lab}`,
        body: `${via}你身处一个充满竞争和拉扯的圈子。这不一定不好——它代表有很多人在帮你激活状态。建议：善用盟友，但不要被他人的节奏带跑。`,
      });
    } else if (qin === '妻财') {
      items.push({
        title: `能量聚焦 · ${lab}`,
        body: `${via}本卦动变指向【${lab}】。意味着经过这件事，你更可能摸到实实在在的自我价值回报（薪资提升 / 技能变现），这是安全感的来源。建议：把「回报是否对等」写清楚。`,
      });
    } else {
      items.push({
        title: `能量聚焦 · ${lab}`,
        body: `${via}注意力在【安全基地与信息网】——文书、信息、经验盘、支持系统。建议：先把信息与基础盘补齐；暗渠（内推、非公开渠道）往往比明面更关键。`,
      });
    }
  };

  for (const q of opts.changingQin) pushFor(q, '动爻指向：');
  if (opts.changedQin) pushFor(opts.changedQin, '动爻化入：');
  for (const q of opts.strongQin ?? []) pushFor(q, '场上偏旺：');

  if (items.length === 0) {
    items.push({
      title: '能量聚焦 · 先看世应',
      body: '本卦无明显动爻六亲信号。先看世爻（你）与应爻（外部）的互动模式——反映的是内部能量与外部世界如何相处，不是谁压过谁。',
    });
  }
  return items;
}

/** 从装卦结果生成「你的当下能量聚焦表」 */
export function buildEnergyFocusFromDress(
  rows: YaoDress[],
  changingIndexes: number[],
  palaceWx?: WuXing,
): EnergyFocusItem[] {
  const changingQin = changingIndexes
    .map((i) => rows[i]?.liuqin)
    .filter((q): q is LiuQin => Boolean(q));

  let changedQin: LiuQin | null = null;
  if (palaceWx) {
    for (const i of changingIndexes) {
      const r = rows[i];
      if (r?.changing && r.changedWuxing) {
        changedQin = liuqinOf(palaceWx, r.changedWuxing);
        break;
      }
    }
  }

  const counts = new Map<LiuQin, number>();
  for (const r of rows) counts.set(r.liuqin, (counts.get(r.liuqin) ?? 0) + 1);
  const strongQin = [...counts.entries()]
    .filter(([, n]) => n >= 3)
    .map(([q]) => q);

  return buildEnergyFocus({ changingQin, changedQin, strongQin });
}

export function renderEnergyFocusHtml(items: EnergyFocusItem[]): string {
  return `
    <section class="ly-energy-focus" data-energy-focus>
      <h4>你的当下能量聚焦表</h4>
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

export type YaoAskCard = {
  title: string;
  position: string;
  state: string;
  relate: string;
  classicNote: string;
};

function positionPower(index: number): string {
  if (index <= 1) return '属于底部的力量（代表根基 / 情绪与开端）';
  if (index <= 3) return '属于中段的力量（代表过渡 / 门户与拉扯）';
  return '属于顶部的力量（代表结果 / 目标与收束）';
}

function domainTopic(domain?: SceneDomain): string {
  if (domain === 'career') return '求职 / 工作';
  if (domain === 'love') return '感情 / 关系';
  if (domain === 'life') return '资源 / 钱财';
  return '你当下关心的事';
}

function stateLine(row: YaoDress): string {
  const energy = LIUQIN_ENERGY[row.liuqin];
  if (row.changing) {
    return `这里有强烈的改变欲望，正在向外扩张——「${energy.modern}」这一层正在变心${
      row.changedBranch ? `，走向 ${row.changedBranch}${row.changedWuxing ?? ''}` : ''
    }。`;
  }
  if (row.isShi) {
    return `这一层相对稳，是你当前站立的能量位置——主调是「${energy.modern}」。`;
  }
  if (row.isYing) {
    return `外部环境在这一层对你作用，主调是「${energy.modern}」。`;
  }
  return `这一层暂作背景参照，主调是「${energy.modern}」。`;
}

function relateLine(row: YaoDress, domain?: SceneDomain): string {
  const energy = LIUQIN_ENERGY[row.liuqin];
  const topic = domainTopic(domain);
  if (domain === 'career' && row.liuqin === '官鬼') {
    return `结合你的问题（${topic}）：放在这里，意味着你很想把内心想法付诸行动，在外部规则中找到突破口。${energy.blurb}`;
  }
  if (domain === 'career' && row.liuqin === '妻财') {
    return `结合你的问题（${topic}）：这一层指向实际回报与自我价值确认（薪资、项目落地、可掌控资源）。`;
  }
  if (domain === 'career' && row.liuqin === '兄弟') {
    return `结合你的问题（${topic}）：你正处在向外探索、想打破现状的阶段，同侪与竞争会激活你，也可能带走节奏。`;
  }
  if (row.isShi) {
    return `结合你的问题（${topic}）：这是你的内部状态落点——${energy.blurb}`;
  }
  if (row.isYing) {
    return `结合你的问题（${topic}）：这是外部环境对你的作用点——${energy.blurb}`;
  }
  return `结合你的问题（${topic}）：${energy.blurb}`;
}

function classicAttr(row: YaoDress): string {
  const bits = [
    `${row.liuqin}爻`,
    row.liushen,
    row.changing
      ? row.changedBranch
        ? `动化 ${row.changedBranch}${row.changedWuxing ?? ''}`
        : '动爻'
      : '',
  ].filter(Boolean);
  return `传统属性：${bits.join('，')}`;
}

export function buildYaoAskCard(row: YaoDress, opts?: { domain?: SceneDomain }): YaoAskCard {
  return {
    title: `第 ${row.index + 1} 爻 · 能量解析（${row.label}）`,
    position: `🧭 它的位置：${positionPower(row.index)}。`,
    state: `💪 它的状态：${stateLine(row)}`,
    relate: `📌 ${relateLine(row, opts?.domain)}`,
    classicNote: classicAttr(row),
  };
}

export function renderYaoAskCardHtml(card: YaoAskCard): string {
  return `
    <article class="ly-yao-ask-card" data-yao-ask-card>
      <p class="ly-yao-ask-head">${card.title}</p>
      <p>${card.position}</p>
      <p>${card.state}</p>
      <p>${card.relate}</p>
      <p class="ly-classic-note">（${card.classicNote}）</p>
    </article>
  `;
}

export type CoreParseBlock = {
  kicker: string;
  body: string;
  classicNote: string;
};

/** 核心要素解析：世 / 应 / 动（生活翻译在前，传统注在后） */
export function buildCoreParseBlocks(
  rows: YaoDress[],
  opts?: { domain?: SceneDomain; shiYingTip?: string },
): CoreParseBlock[] {
  const shi = rows.find((r) => r.isShi);
  const ying = rows.find((r) => r.isYing);
  const moving = rows.filter((r) => r.changing);
  const blocks: CoreParseBlock[] = [];
  const domain = opts?.domain;

  if (shi) {
    const e = LIUQIN_ENERGY[shi.liuqin];
    let body = relateLine(shi, domain);
    if (shi.liuqin === '兄弟') {
      body =
        '你目前正处于一个【向外探索的阶段】，凭借过往的经验和底牌，有强烈的意愿去打破现状。' +
        (domain === 'career' ? '结合求职：同侪场会推你行动，也别被别人的节奏带走。' : '');
    } else if (shi.liuqin === '官鬼') {
      body = `你目前的能量高度集中在【外部目标 / 规则】上——${e.blurb}`;
    } else if (shi.liuqin === '妻财') {
      body = `你当下更站在【物质根基与自我价值】一侧——${e.blurb}`;
    } else if (shi.liuqin === '子孙') {
      body = `你当下更适合【打破旧框架、信任直觉】——${e.blurb}`;
    } else {
      body = `你当下站在【安全基地 / 信息网】一侧——${e.blurb}`;
    }
    blocks.push({
      kicker: '🔹 你的状态（世爻）',
      body,
      classicNote: `传统卦象标记为 ${shi.liuqin}爻 · ${shi.liushen} · ${shi.label}`,
    });
  }

  if (ying) {
    const e = LIUQIN_ENERGY[ying.liuqin];
    let body = `你现在所处的环境，主调是「${e.modern}」。${e.blurb}`;
    if (ying.liuqin === '妻财') {
      body =
        '你现在所处的环境，正在向你释放实际资源和利益的机会。但要注意，这种利益可能带有隐藏条件。';
    } else if (ying.liuqin === '官鬼') {
      body =
        '外部环境正以【目标 / 规则 / 压力】的方式与你互动。机会与考核往往绑在一起，先分清哪些是你的边界。';
    } else if (ying.liuqin === '兄弟') {
      body =
        '外部环境偏【同侪与竞争】。有人激活你，也可能拉扯你的节奏——善用盟友，别被带跑。';
    }
    if (ying.liushen === '玄武') {
      body += ' 六神偏玄武：信息或机会可能不那么明面，留心暗流与隐藏条件。';
    } else if (ying.liushen === '朱雀') {
      body += ' 六神偏朱雀：言论、面试表达、信息交换会更显眼。';
    }
    if (opts?.shiYingTip) {
      body += ` ${opts.shiYingTip}`;
    }
    blocks.push({
      kicker: '🔹 外部环境（应爻）',
      body,
      classicNote: `传统卦象标记为 ${ying.liushen}+${ying.liuqin}爻 · ${ying.label}`,
    });
  }

  if (moving.length === 0) {
    blocks.push({
      kicker: '🔹 变化的焦点（动爻）',
      body: '本卦没有动爻：格局相对稳，关键不在「突变」，而在把世应看清、把下一步写成可验证的小动作。',
      classicNote: '传统：无动则无变',
    });
  } else {
    const m = moving[0]!;
    const e = LIUQIN_ENERGY[m.liuqin];
    let body = `事情的关键变化点落在「${e.modern}」这一层。`;
    if (m.liuqin === '妻财' || (m.changedBranch && m.liuqin === '父母')) {
      body =
        '事情的关键变化点，在于你即将获得（或重新谈判）实际的物质回报 / 认可（如薪资提升、项目落地、技能变现）。';
    } else if (m.liuqin === '官鬼') {
      body =
        '事情的关键变化点，在于外部目标 / 规则正在松动或重组——岗位、考核、评价框架可能出现新窗口。';
    } else if (m.liuqin === '子孙') {
      body =
        '事情的关键变化点，在于破局与创造力被激活——适合试非常规路径，而不是只堆标准动作。';
    } else if (m.liuqin === '兄弟') {
      body =
        '事情的关键变化点，在于同侪圈层或竞争关系正在变——可能出现新盟友，也可能被别人的节奏推着走。';
    } else {
      body =
        '事情的关键变化点，在于信息网 / 安全基地正在变——文书、内推、隐藏考核或基础盘需要你主动补齐。';
    }
    if (moving.length > 1) {
      body += `（另有 ${moving.length - 1} 处动爻，变化面更大，宜拆开一件件看。）`;
    }
    const classic =
      moving.length === 1
        ? `传统卦象标记为 ${m.label}${m.liuqin}动${
            m.changedBranch ? `化 ${m.changedBranch}${m.changedWuxing ?? ''}` : ''
          }`
        : `传统：动爻 ${moving.map((r) => r.label + r.liuqin).join('、')}`;
    blocks.push({
      kicker: '🔹 变化的焦点（动爻）',
      body,
      classicNote: classic,
    });
  }

  return blocks;
}

export function renderCoreParseHtml(blocks: CoreParseBlock[]): string {
  return `
    <section class="ly-core-parse">
      <h3>核心要素 · 点开看</h3>
      ${blocks
        .map(
          (b) => `
        <details class="ly-core-parse-item">
          <summary>${b.kicker}</summary>
          <p>${b.body}</p>
          <p class="ly-classic-note">（注：${b.classicNote}）</p>
        </details>`,
        )
        .join('')}
    </section>
  `;
}

/** 传统排盘导语（进阶参考，非主解读） */
export function renderClassicPlateIntroHtml(): string {
  return `
    <section class="ly-classic-plate-intro">
      <h3>📖 传统易学专业排盘（进阶参考）</h3>
      <p>上面你已经看懂了生活层面的翻译。下面这份表格，是易学研究者用来断卦的原始源代码。</p>
      <p>你会发现，这和我们平时说的「情绪、资源、目标」是一一对应的：</p>
      <ul class="ly-qin-map">
        <li><strong>官鬼</strong> = 外部目标与压力</li>
        <li><strong>妻财</strong> = 物质基础与自我价值</li>
        <li><strong>父母</strong> = 知识、信息与安全感</li>
        <li><strong>子孙</strong> = 创造力与内在本源</li>
        <li><strong>兄弟</strong> = 同侪环境与盟友圈</li>
      </ul>
      <p class="ly-guide-tip">跟着『六爻学习地图』走，不久之后你就能看懂这份表格，享受自己去推理的乐趣。</p>
    </section>
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

export type QinDictEntry = {
  qin: LiuQin;
  /** 短标签：父母 / 官鬼 */
  tag: string;
  modernTitle: string;
  modern: string;
  classic: string;
  /** 取象四门 */
  people: string;
  place: string;
  affair: string;
  mindset: string;
};

export const LIUQIN_DICT: Record<LiuQin, QinDictEntry> = {
  父母: {
    qin: '父母',
    tag: '父母',
    modernTitle: '安全基地 / 信息网',
    modern:
      '代表你的知识储备、学习能力、过往经验、基础盘（家庭支持、社保、合同文书、考题信息）。',
    classic: '传统释：父母、师长、房屋、文书',
    people: '父母、师长、长辈、文书主管、房东、信任的靠山',
    place: '家、学校、办公室、档案馆、房产、照顾长辈的场域',
    affair: '文书、合同、学业考试、房产事务、资讯与照顾',
    mindset: '求安稳、依赖支持、责任感、文书焦虑',
  },
  官鬼: {
    qin: '官鬼',
    tag: '官鬼',
    modernTitle: '目标系统 / 外部规则',
    modern:
      '代表你追求的目标（职位、项目）、外部施加的压力（KPI、行业环境），以及社会评价体系的框架。',
    classic: '传统释：丈夫、领导、官非、灾祸',
    people: '领导、考官、对手、约束你的人、关键客户',
    place: '公司、考场、医院、评审场、高压场合',
    affair: '考核升迁、项目交付、官司诉讼、疾病压力、KPI',
    mindset: '被审视、进取心、压力感、较劲与边界',
  },
  妻财: {
    qin: '妻财',
    tag: '妻财',
    modernTitle: '物质根基 / 自我价值',
    modern:
      '代表你能掌控的实际资源（金钱、技能）、自我价值的回报，以及让你感到稳定和安全的生活基础。',
    classic: '传统释：妻子、仆人、财富、欲望',
    people: '财务相关人、付钱的客户、你所养之人、物质交换对象',
    place: '市场、交易场、家庭财务角落、资源池',
    affair: '薪资报酬、买卖投资、资产配置、技能变现',
    mindset: '安全感、价值感、占有欲、怕失去的底气',
  },
  子孙: {
    qin: '子孙',
    tag: '子孙',
    modernTitle: '内在创造力 / 破局点',
    modern:
      '代表你的创造力、灵感、打破常规的能力、健康的身体，以及能让你放松和愉悦的源泉。',
    classic: '传统释：儿女、下属、晚辈',
    people: '子女、下属、晚辈、医生、技艺导师、解压搭子',
    place: '工作室、诊室、工作室、放松空间、技艺练习场',
    affair: '技艺创作、享乐休息、破局解压、疗愈照顾',
    mindset: '轻松、创造力、喜悦、想卸压的冲动',
  },
  兄弟: {
    qin: '兄弟',
    tag: '兄弟',
    modernTitle: '同侪环境 / 盟友圈',
    modern:
      '代表你的同代人、所处社交圈层的状态、竞争关系，以及你在群体中的合作与拉扯。',
    classic: '传统释：兄弟、朋友、竞争者',
    people: '朋友、同侪、合伙人、竞争者',
    place: '社交圈、同辈场合、合伙场域、群体拉扯的场',
    affair: '合伙协作、竞争分杯、争抢资源、耗财往来',
    mindset: '比较心、同盟感、消耗感、怕被分走',
  },
};

function escapeQinHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 人物 / 场所 / 事务 / 心态 四门取象 */
export function renderQinFacetsHtml(d: QinDictEntry): string {
  const rows: [string, string][] = [
    ['人物', d.people],
    ['场所', d.place],
    ['事务', d.affair],
    ['心态', d.mindset],
  ];
  return `
    <dl class="ly-qin-facets">
      ${rows
        .map(
          ([k, v]) => `
        <div class="ly-qin-facet">
          <dt>${escapeQinHtml(k)}</dt>
          <dd>${escapeQinHtml(v)}</dd>
        </div>`,
        )
        .join('')}
    </dl>
  `;
}

export function renderQinDictPanelHtml(d: QinDictEntry): string {
  return `
    <p class="ly-qin-dict-title"><strong>${escapeQinHtml(d.tag)}</strong>（${escapeQinHtml(
      d.modernTitle,
    )}）</p>
    <p class="ly-qin-dict-blurb">${escapeQinHtml(d.modern)}</p>
    ${renderQinFacetsHtml(d)}
    <p class="ly-classic-note">${escapeQinHtml(d.classic)}</p>
  `;
}

export type InferenceLine = {
  title: string;
  body: string;
  classicNote?: string;
};

export type InternalInference = {
  lines: InferenceLine[];
  confluence: string;
};

function domainMatter(domain: SceneDomain): string {
  if (domain === 'career') return '求职 / 工作';
  if (domain === 'love') return '感情 / 关系';
  if (domain === 'life') return '资源 / 钱财';
  return '你当前关注的事情';
}

export function buildInternalInference(opts: {
  domain: SceneDomain;
  yongRow?: YaoDress | null;
  yongQin?: LiuQin | null;
  yuanRow?: YaoDress | null;
  jiRow?: YaoDress | null;
}): InternalInference {
  const matter = domainMatter(opts.domain);
  const lines: InferenceLine[] = [];

  if (opts.yongRow && opts.yongQin) {
    const e = LIUQIN_ENERGY[opts.yongQin];
    lines.push({
      title: '目标节点（用神）',
      body: `代表你当前关注的事情（比如${matter}），在这个卦里落在 ${opts.yongRow.label}（${formatLiuqinShort(opts.yongQin)}）。${e.blurb}`,
      classicNote: `用神在${opts.yongRow.label}${opts.yongQin}爻${opts.yongRow.branch}${opts.yongRow.wuxing}`,
    });
  } else {
    lines.push({
      title: '目标节点（用神）',
      body: `本题关注「${matter}」，但用神尚未直接落到具体爻。先把问题写具体，或结合世应与动爻看。`,
    });
  }

  if (opts.yuanRow) {
    const q = opts.yuanRow.liuqin;
    const moving = opts.yuanRow.changing;
    lines.push({
      title: '补给系统（元神）',
      body: moving
        ? `目前有一股强烈的「${LIUQIN_ENERGY[q].modern}」能量正在转化为你的动力，滋养你的核心聚焦。`
        : `场上有「${LIUQIN_ENERGY[q].modern}」可作为补给，虽未大动，仍值得借力。`,
      classicNote: `元神在${opts.yuanRow.label}${q}${moving ? '发动' : ''}，生助用神`,
    });
  } else {
    lines.push({
      title: '补给系统（元神）',
      body: '本卦未见明显补给。动力更多要靠你自己对齐世应、做小步验证。',
      classicNote: '元神未现',
    });
  }

  if (opts.jiRow) {
    const q = opts.jiRow.liuqin;
    const moving = opts.jiRow.changing;
    lines.push({
      title: '潜在阻力（忌神）',
      body: moving
        ? `要注意：「${LIUQIN_ENERGY[q].modern}」这一层正在动，可能分心或拖慢你问的事。`
        : `但要注意，在事情的相关层（${opts.jiRow.label}），有「${LIUQIN_ENERGY[q].modern}」在静静拉扯你，可能会让你分心。`,
      classicNote: `忌神在${opts.jiRow.label}${q}${moving ? '发动' : '（静/暗处牵制）'}`,
    });
  } else {
    lines.push({
      title: '潜在阻力（忌神）',
      body: '本卦忌神不明显，干扰项相对少，可更专注目标节点本身。',
      classicNote: '忌神未现',
    });
  }

  const yuanOn = Boolean(opts.yuanRow?.changing);
  const jiOn = Boolean(opts.jiRow?.changing);
  let confluence: string;
  if (yuanOn && !jiOn) {
    confluence =
      '因为源动力偏强，直接盖过了潜在的静阻力，所以尽管有点小拉扯，事情仍更可能朝你有利的方向松动——记得把助力用在可验证的一小步上。';
  } else if (!yuanOn && jiOn) {
    confluence =
      '阻力侧更活跃，助力不够明朗。建议先减干扰（忌神那一层），再谈大推进，避免硬冲内耗。';
  } else if (yuanOn && jiOn) {
    confluence =
      '助力与阻力同时在动。先保目标节点不被拖垮，再借元神之助推进——有生有克时，顺序比速度重要。';
  } else if (opts.yongRow) {
    confluence =
      '生克都不喧哗。少做复杂推演，先用世应与动爻定下一步，把注意力放在用神所在层。';
  } else {
    confluence = '先回到核心要素，把用神锚定后再看助力与阻力。';
  }

  return { lines, confluence };
}

export function renderInternalInferenceHtml(inf: InternalInference): string {
  const body = inf.lines
    .map(
      (l) => `
      <div class="ly-infer-line">
        <p><strong>${l.title}：</strong>${l.body}</p>
        ${l.classicNote ? `<p class="ly-classic-note">（注：传统断语为：${l.classicNote}）</p>` : ''}
      </div>`,
    )
    .join('');
  return `
    <details class="ly-infer-fold">
      <summary>🔍 内部推演过程（点击展开查看）</summary>
      <div class="ly-infer-body">
        ${body}
        <p class="ly-infer-confluence"><strong>最终交汇：</strong>${inf.confluence}</p>
      </div>
    </details>
  `;
}

export function renderQinDictHtml(): string {
  const order: LiuQin[] = ['父母', '官鬼', '妻财', '子孙', '兄弟'];
  const tags = order
    .map((q) => {
      const d = LIUQIN_DICT[q];
      return `<button type="button" class="ly-qin-dict-tag" data-qin-dict="${q}" aria-pressed="false" title="${escapeQinHtml(
        d.modernTitle,
      )}">${escapeQinHtml(d.tag)}</button>`;
    })
    .join('');
  return `
    <section class="ly-qin-dict" data-qin-dict-root>
      <h4>六亲词典</h4>
      <p class="ly-guide-tip">点「父母 / 官鬼…」立刻看人物 · 场所 · 事务 · 心态。</p>
      <div class="ly-qin-dict-tags">${tags}</div>
      <div class="ly-qin-dict-panel" data-qin-dict-panel hidden></div>
    </section>
  `;
}

/** 打开指定六亲的四门取象面板（笔记侧栏 / 点爻联动） */
export function openQinDict(root: HTMLElement, qin: LiuQin): boolean {
  const host = root.querySelector<HTMLElement>('[data-qin-dict-root]');
  const panel = host?.querySelector<HTMLElement>('[data-qin-dict-panel]');
  const d = LIUQIN_DICT[qin];
  if (!host || !panel || !d) return false;

  host.querySelectorAll('[data-qin-dict]').forEach((b) => {
    const on = (b as HTMLElement).dataset.qinDict === qin;
    b.setAttribute('aria-pressed', String(on));
  });
  panel.hidden = false;
  panel.innerHTML = renderQinDictPanelHtml(d);
  host.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  return true;
}

export function bindQinDict(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-qin-dict-root]').forEach((host) => {
    if (host.dataset.bound === '1') return;
    host.dataset.bound = '1';
    const panel = host.querySelector<HTMLElement>('[data-qin-dict-panel]');
    host.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-qin-dict]');
      if (!btn || !host.contains(btn)) return;
      const q = btn.dataset.qinDict as LiuQin;
      const d = LIUQIN_DICT[q];
      if (!d) return;
      const on = btn.getAttribute('aria-pressed') === 'true';
      host.querySelectorAll('[data-qin-dict]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      if (on) {
        if (panel) {
          panel.hidden = true;
          panel.innerHTML = '';
        }
        return;
      }
      btn.setAttribute('aria-pressed', 'true');
      if (panel) {
        panel.hidden = false;
        panel.innerHTML = renderQinDictPanelHtml(d);
      }
    });
  });

  if (root.dataset.qinDictDelegated === '1') return;
  root.dataset.qinDictDelegated = '1';
  root.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLElement>('[data-open-qin-dict]');
    if (!chip || !root.contains(chip)) return;
    if (chip.hasAttribute('data-qin-dict')) return;
    const q = chip.dataset.openQinDict as LiuQin;
    if (!LIUQIN_DICT[q]) return;
    e.preventDefault();
    openQinDict(root, q);
  });
}
