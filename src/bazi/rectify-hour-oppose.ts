/**
 * 生时校准 · Top2 时辰对立人格（用户二选一，回写引擎）
 * 纯规则：基于当日时柱差异，不做西洋上升/推运。
 */
import type { ShichenDiffProfile, ShichenTraitId } from './rectify-shichen-diff.ts';

export type HourOpposePair = {
  id: string;
  /** 表头，可问出口 */
  topic: string;
  left: string;
  right: string;
};

function has(p: ShichenDiffProfile, id: ShichenTraitId): boolean {
  return p.behaviorTraitIds.includes(id);
}

function weatherHead(p: ShichenDiffProfile): string {
  return p.weatherMetaphor.split('/')[0]?.trim() || `${p.branch}时`;
}

function stamp(p: ShichenDiffProfile, text: string): string {
  return `${text}（${p.branch}时 · ${p.hourPillar}）`;
}

function line(
  id: string,
  topic: string,
  left: ShichenDiffProfile,
  right: ShichenDiffProfile,
  pick: (p: ShichenDiffProfile) => string,
): HourOpposePair | null {
  let L = pick(left);
  let R = pick(right);
  if (L === R) {
    L = stamp(left, L);
    R = stamp(right, R);
  }
  if (L === R) return null;
  return { id, topic, left: L, right: R };
}

function socialFace(p: ShichenDiffProfile): string {
  if (has(p, 'talk') || has(p, 'charm')) {
    return '熟人局里容易成话题中心，爱带动气氛、被看见';
  }
  if (has(p, 'study') || has(p, 'sensitive')) {
    return '半生不熟时先观察，熟了才多说话；不抢焦点';
  }
  if (has(p, 'lead')) {
    return '不一定话最多，但拍板、定调时常在；要体面';
  }
  return `${weatherHead(p)}底色：社交不极端外放，也不极端躲开`;
}

function underPressure(p: ShichenDiffProfile): string {
  if (has(p, 'action') || ['午', '巳', '寅'].includes(p.branch)) {
    return '压力一上来就想立刻行动或说开；闲不住';
  }
  if (has(p, 'sensitive') || ['亥', '子', '酉'].includes(p.branch)) {
    return '表面还能撑，心里反复推演；需要独处消化';
  }
  if (has(p, 'steady') || p.tenGodCats.includes('guan_sha')) {
    return '先扛场面、把该做的做完，情绪往后放';
  }
  return `压力下偏${weatherHead(p)}节奏：先稳住再想下一步`;
}

function decisionStyle(p: ShichenDiffProfile): string {
  if (has(p, 'lead') || p.tenGodCats.includes('bi_jie')) {
    return '主见硬，不太容易被一句话说服；要逻辑和面子';
  }
  if (has(p, 'money') || p.tenGodCats.includes('cai')) {
    return '先算账、看回报与资源；少空谈理想口号';
  }
  if (has(p, 'study') || p.tenGodCats.includes('yin')) {
    return '先查资料、做功课，再下决定；怕糊弄';
  }
  if (has(p, 'talk') || p.tenGodCats.includes('shi_shang')) {
    return '想法多，常靠说清楚/写清楚推动局面';
  }
  return `决策口气随时干「${p.stemGod || '—'}」：不极端冲动也不极端拖`;
}

function afterConflict(p: ShichenDiffProfile): string {
  if (has(p, 'talk') || p.tenGodCats.includes('shi_shang')) {
    return '吵完更爱把话说透或发长消息；气消得相对快';
  }
  if (has(p, 'sensitive') || p.vsDay.kind === '害') {
    return '表面停战，心里记很久；要对方先给台阶';
  }
  if (has(p, 'lead')) {
    return '很难先认错；更常等对方服软或用行动代替道歉';
  }
  return '冲突后先冷处理，隔一阵再谈规则与边界';
}

function workDrive(p: ShichenDiffProfile): string {
  if (has(p, 'money') || p.tenGodCats.includes('cai')) {
    return '做事更看现实回报与资源整合';
  }
  if (p.tenGodCats.includes('guan_sha') || has(p, 'steady')) {
    return '更扛得住责任与考核；求稳、怕翻车';
  }
  if (has(p, 'talk') || has(p, 'charm')) {
    return '机会常来自表达、展示与人脉，而非死磕窄赛道';
  }
  if (has(p, 'lead') || has(p, 'action')) {
    return '不甘人后，想自己说了算；讨厌被管死';
  }
  return `${weatherHead(p)}气场下找定位，起伏正常`;
}

/**
 * Top2 时辰 → 3～6 组可二选一的对立人格。
 * 左右文案相同则丢弃该组。
 */
export function buildHourOpposePairs(
  left: ShichenDiffProfile,
  right: ShichenDiffProfile,
): HourOpposePair[] {
  if (left.branch === right.branch) return [];

  const candidates: Array<HourOpposePair | null> = [
    line('social', '熟人局里你更像', left, right, socialFace),
    line('pressure', '压力来时你更像', left, right, underPressure),
    line('decide', '做决定时你更像', left, right, decisionStyle),
    line('conflict', '吵完/翻脸后你更像', left, right, afterConflict),
    line('work', '做事驱动力更像', left, right, workDrive),
    line(
      'weather',
      '别人形容你更像',
      left,
      right,
      (p) => `${p.weatherMetaphor} · 时干「${p.stemGod || '—'}」`,
    ),
  ];

  if (left.vsDay.kind !== right.vsDay.kind) {
    candidates.push(
      line('bond', '亲密关系里你更像', left, right, (p) => {
        if (p.vsDay.kind === '冲') return '关系里易有拉锯、分合感，话不投机时硬碰硬';
        if (p.vsDay.kind === '合') return '关系更易黏合、互相成全';
        if (p.vsDay.kind === '害') return '敏感点多，一句语气就能炸';
        return '关系线无极端冲合，更看大运流年';
      }),
    );
  }

  return candidates.filter((r): r is HourOpposePair => r != null).slice(0, 6);
}
