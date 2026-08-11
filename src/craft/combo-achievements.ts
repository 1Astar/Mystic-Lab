/**
 * 造命 · 图鉴组合成就（纯图鉴集齐 → 雷达加成）
 */
import { listCodexEntries } from '../ziwei/codex.ts';
import { clampBuffMult } from './spirit-buff.ts';
import type { CraftAxisId, CraftAxisScore } from './spirit-roots.ts';

const TOAST_KEY = 'mystic-lab-craft-combo-ach-v1';

export const DI_XING_GAIN_ZHENSHOU = 20;
export const YE_HUO_GUANGYAO_MULT = 1.5;
export const COMBO_FLAT_GAIN = 10;
export const COMBO_FLAT_GAIN_S = 8;
export const COMBO_FLAT_GAIN_LINGYUN = 15;
export const COMBO_FLAT_GAIN_YELI = 12;

export type CraftComboAchId = string;

export type CraftComboFlatGain = { axis: CraftAxisId; gain: number };

export type CraftComboAchievementDef = {
  id: CraftComboAchId;
  title: string;
  members: string[];
  unlockLine: string;
  effectLine: string;
  /** 永久轴加成（流年前）；业火无此项 */
  flatGains?: CraftComboFlatGain[];
  /** 条件爆发类 */
  kind?: 'flat' | 'conditional';
};

const AXIS_LABEL: Record<CraftAxisId, string> = {
  guangyao: '光耀',
  tongbian: '通变',
  wenyang: '温养',
  zhenshou: '镇守',
  lingyun: '灵韵',
  yeli: '业力',
};

function formatFlatEffect(gains: CraftComboFlatGain[]): string {
  return gains.map((g) => `${AXIS_LABEL[g.axis]}永久 +${g.gain}`).join(' · ');
}

function flatAch(input: {
  id: CraftComboAchId;
  title: string;
  members: string[];
  flatGains: CraftComboFlatGain[];
  blurb: string;
}): CraftComboAchievementDef {
  const effectLine = formatFlatEffect(input.flatGains);
  return {
    id: input.id,
    title: input.title,
    members: input.members,
    kind: 'flat',
    flatGains: input.flatGains,
    effectLine,
    unlockLine: `解锁【${input.title}】！${effectLine}——${input.blurb}`,
  };
}

export const CRAFT_COMBO_ACHIEVEMENTS: CraftComboAchievementDef[] = [
  // —— 核心 / 已上线 ——
  {
    id: 'di_xing',
    title: '帝星格局',
    members: ['紫微', '天府', '天相'],
    unlockLine: '解锁【帝星格局】！雷达图中【镇守】属性获得额外 +20 天赋加成。',
    effectLine: '镇守永久 +20',
    kind: 'flat',
    flatGains: [{ axis: 'zhenshou', gain: DI_XING_GAIN_ZHENSHOU }],
  },
  {
    id: 'ye_huo',
    title: '业火淬炼',
    members: ['擎羊', '陀罗', '火星', '铃星'],
    unlockLine:
      '解锁【业火淬炼】！当【业力】属性处于最高值时，你的【光耀】属性获得额外 +50% 爆发。',
    effectLine: '业力最高时 · 光耀有效分 ×1.5',
    kind: 'conditional',
  },
  flatAch({
    id: 'sha_po_lang',
    title: '杀破狼',
    members: ['七杀', '破军', '贪狼'],
    flatGains: [
      { axis: 'tongbian', gain: COMBO_FLAT_GAIN },
      { axis: 'yeli', gain: COMBO_FLAT_GAIN },
    ],
    blurb: '适合开荒与改局',
  }),
  flatAch({
    id: 'ji_yue',
    title: '机月同梁',
    members: ['天机', '太阴', '天同', '天梁'],
    flatGains: [
      { axis: 'tongbian', gain: COMBO_FLAT_GAIN },
      { axis: 'wenyang', gain: COMBO_FLAT_GAIN },
    ],
    blurb: '策略与协调成型',
  }),
  flatAch({
    id: 'ri_yue',
    title: '日月',
    members: ['太阳', '太阴'],
    flatGains: [
      { axis: 'guangyao', gain: COMBO_FLAT_GAIN },
      { axis: 'wenyang', gain: COMBO_FLAT_GAIN },
    ],
    blurb: '一放一收的轴线',
  }),
  flatAch({
    id: 'sha_fu',
    title: '七杀天府',
    members: ['七杀', '天府'],
    flatGains: [
      { axis: 'zhenshou', gain: COMBO_FLAT_GAIN },
      { axis: 'yeli', gain: COMBO_FLAT_GAIN },
    ],
    blurb: '能冲也能守',
  }),
  flatAch({
    id: 'lu_quan',
    title: '禄权科忌',
    members: ['化禄', '化权', '化科', '化忌'],
    flatGains: [{ axis: 'lingyun', gain: COMBO_FLAT_GAIN_LINGYUN }],
    blurb: '四化催化剂齐备',
  }),

  // —— 紫府 / 府相 ——
  flatAch({
    id: 'zi_fu',
    title: '紫微天府',
    members: ['紫微', '天府'],
    flatGains: [{ axis: 'zhenshou', gain: COMBO_FLAT_GAIN_S }],
    blurb: '王座加库藏的轻量稳盘',
  }),
  flatAch({
    id: 'fu_xiang',
    title: '府相',
    members: ['天府', '天相'],
    flatGains: [
      { axis: 'zhenshou', gain: COMBO_FLAT_GAIN_S },
      { axis: 'wenyang', gain: COMBO_FLAT_GAIN_S },
    ],
    blurb: '库藏与体面同在',
  }),

  // —— 贵人辅星 ——
  flatAch({
    id: 'fu_bi',
    title: '左辅右弼',
    members: ['左辅', '右弼'],
    flatGains: [{ axis: 'zhenshou', gain: COMBO_FLAT_GAIN }],
    blurb: '贵人成全、场面托底',
  }),
  flatAch({
    id: 'kui_yue',
    title: '天魁天钺',
    members: ['天魁', '天钺'],
    flatGains: [{ axis: 'lingyun', gain: COMBO_FLAT_GAIN }],
    blurb: '贵气与机遇并至',
  }),
  flatAch({
    id: 'chang_qu',
    title: '昌曲',
    members: ['文昌', '文曲'],
    flatGains: [
      { axis: 'tongbian', gain: COMBO_FLAT_GAIN },
      { axis: 'lingyun', gain: COMBO_FLAT_GAIN_S },
    ],
    blurb: '文才与表达成双',
  }),
  flatAch({
    id: 'jun_chen',
    title: '君臣辅弼',
    members: ['紫微', '左辅', '右弼'],
    flatGains: [
      { axis: 'zhenshou', gain: 12 },
      { axis: 'lingyun', gain: COMBO_FLAT_GAIN_S },
    ],
    blurb: '主轴有人辅佐',
  }),

  // —— 煞组拆分 ——
  flatAch({
    id: 'yang_tuo',
    title: '羊陀',
    members: ['擎羊', '陀罗'],
    flatGains: [{ axis: 'yeli', gain: COMBO_FLAT_GAIN_YELI }],
    blurb: '锋利与纠缠的试炼入门',
  }),
  flatAch({
    id: 'huo_ling',
    title: '火铃',
    members: ['火星', '铃星'],
    flatGains: [{ axis: 'yeli', gain: COMBO_FLAT_GAIN_YELI }],
    blurb: '爆发与躁动的试炼入门',
  }),
  flatAch({
    id: 'kong_jie',
    title: '空劫',
    members: ['地空', '地劫'],
    flatGains: [
      { axis: 'yeli', gain: COMBO_FLAT_GAIN },
      { axis: 'tongbian', gain: COMBO_FLAT_GAIN_S },
    ],
    blurb: '抽离与破妄的眼界',
  }),

  // —— 名局小品 ——
  flatAch({
    id: 'ji_liang',
    title: '机梁',
    members: ['天机', '天梁'],
    flatGains: [{ axis: 'tongbian', gain: COMBO_FLAT_GAIN }],
    blurb: '谋划加荫护',
  }),
  flatAch({
    id: 'lian_tan',
    title: '廉贪',
    members: ['廉贞', '贪狼'],
    flatGains: [
      { axis: 'tongbian', gain: COMBO_FLAT_GAIN_S },
      { axis: 'yeli', gain: COMBO_FLAT_GAIN_S },
    ],
    blurb: '欲望与气场的张力',
  }),
  flatAch({
    id: 'wu_tan',
    title: '武贪',
    members: ['武曲', '贪狼'],
    flatGains: [
      { axis: 'lingyun', gain: COMBO_FLAT_GAIN_S },
      { axis: 'yeli', gain: COMBO_FLAT_GAIN_S },
    ],
    blurb: '财星遇欲望，敢要也敢拿',
  }),
  flatAch({
    id: 'zi_tan',
    title: '紫贪',
    members: ['紫微', '贪狼'],
    flatGains: [
      { axis: 'guangyao', gain: COMBO_FLAT_GAIN_S },
      { axis: 'tongbian', gain: COMBO_FLAT_GAIN_S },
    ],
    blurb: '帝座遇桃花与开创欲',
  }),
  flatAch({
    id: 'ri_liang',
    title: '阳梁',
    members: ['太阳', '天梁'],
    flatGains: [
      { axis: 'guangyao', gain: COMBO_FLAT_GAIN_S },
      { axis: 'wenyang', gain: COMBO_FLAT_GAIN_S },
    ],
    blurb: '照耀加荫护',
  }),
  flatAch({
    id: 'wu_xiang',
    title: '武相',
    members: ['武曲', '天相'],
    flatGains: [
      { axis: 'zhenshou', gain: COMBO_FLAT_GAIN_S },
      { axis: 'lingyun', gain: COMBO_FLAT_GAIN_S },
    ],
    blurb: '刚金遇印星，能成事也体面',
  }),
  flatAch({
    id: 'tan_zi',
    title: '贪巨',
    members: ['贪狼', '巨门'],
    flatGains: [
      { axis: 'tongbian', gain: COMBO_FLAT_GAIN_S },
      { axis: 'zhenshou', gain: COMBO_FLAT_GAIN_S },
    ],
    blurb: '欲望与口才/洞察对撞',
  }),
];

export type CraftComboAchStatus = 'complete' | 'partial' | 'locked';

export type CraftComboAchState = {
  def: CraftComboAchievementDef;
  status: CraftComboAchStatus;
  litMembers: string[];
  missingMembers: string[];
  progress: number;
  bonusActive: boolean;
  conditionalActive: boolean;
};

type ToastStore = {
  toasted: string[];
  updatedAt: string;
};

function unlockedSet(ids?: Iterable<string>): Set<string> {
  if (ids) return new Set(ids);
  return new Set(listCodexEntries().map((e) => e.starId));
}

export function evaluateCraftComboAch(
  def: CraftComboAchievementDef,
  unlocked?: Set<string>,
): Omit<CraftComboAchState, 'def' | 'bonusActive' | 'conditionalActive'> {
  const set = unlocked ?? unlockedSet();
  const litMembers = def.members.filter((m) => set.has(m));
  const missingMembers = def.members.filter((m) => !set.has(m));
  const progress =
    def.members.length === 0 ? 0 : litMembers.length / def.members.length;
  let status: CraftComboAchStatus = 'locked';
  if (progress >= 1) status = 'complete';
  else if (progress > 0) status = 'partial';
  return { status, litMembers, missingMembers, progress };
}

export function listCraftComboAchievements(
  unlocked?: Set<string>,
): CraftComboAchState[] {
  const set = unlocked ?? unlockedSet();
  return CRAFT_COMBO_ACHIEVEMENTS.map((def) => {
    const ev = evaluateCraftComboAch(def, set);
    return {
      def,
      ...ev,
      bonusActive: ev.status === 'complete' && def.kind !== 'conditional',
      conditionalActive: false,
    };
  });
}

export function craftComboProgress(unlocked?: Set<string>): {
  complete: number;
  total: number;
  pct: number;
  states: CraftComboAchState[];
} {
  const states = listCraftComboAchievements(unlocked);
  const complete = states.filter((s) => s.status === 'complete').length;
  const total = states.length;
  return {
    complete,
    total,
    pct: total === 0 ? 0 : Math.round((complete / total) * 100),
    states,
  };
}

function loadToastStore(): ToastStore {
  try {
    const raw = localStorage.getItem(TOAST_KEY);
    if (!raw) return { toasted: [], updatedAt: new Date().toISOString() };
    const p = JSON.parse(raw) as Partial<ToastStore>;
    return {
      toasted: Array.isArray(p.toasted) ? p.toasted.map(String) : [],
      updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
    };
  } catch {
    return { toasted: [], updatedAt: new Date().toISOString() };
  }
}

function saveToastStore(store: ToastStore): void {
  localStorage.setItem(
    TOAST_KEY,
    JSON.stringify({ ...store, updatedAt: new Date().toISOString() }),
  );
}

export function claimNewCraftComboToasts(
  unlocked?: Set<string>,
): CraftComboAchievementDef[] {
  const store = loadToastStore();
  const newly: CraftComboAchievementDef[] = [];
  for (const def of CRAFT_COMBO_ACHIEVEMENTS) {
    const ev = evaluateCraftComboAch(def, unlocked);
    if (ev.status !== 'complete') continue;
    if (store.toasted.includes(def.id)) continue;
    newly.push(def);
    store.toasted.push(def.id);
  }
  if (newly.length) saveToastStore(store);
  return newly;
}

export function applyFlatComboBonuses(
  axes: CraftAxisScore[],
  unlocked?: Set<string>,
): CraftAxisScore[] {
  const set = unlocked ?? unlockedSet();
  const bag = new Map(
    axes.map((a) => [a.id, { value: a.value, sources: [...a.sources], lit: a.lit }]),
  );

  for (const def of CRAFT_COMBO_ACHIEVEMENTS) {
    if (def.kind === 'conditional' || !def.flatGains?.length) continue;
    if (evaluateCraftComboAch(def, set).status !== 'complete') continue;
    const src = `成就·${def.title}`;
    for (const g of def.flatGains) {
      const row = bag.get(g.axis);
      if (!row) continue;
      row.value += g.gain;
      row.lit = true;
      if (!row.sources.includes(src)) row.sources.push(src);
    }
  }

  return axes.map((a) => {
    const row = bag.get(a.id)!;
    return {
      ...a,
      value: row.value,
      lit: row.lit,
      sources: row.sources,
    };
  });
}

/** @deprecated 使用 applyFlatComboBonuses */
export function applyDiXingFlatBonus(
  axes: CraftAxisScore[],
  unlocked?: Set<string>,
): CraftAxisScore[] {
  return applyFlatComboBonuses(axes, unlocked);
}

export function applyYeHuoConditionalBurst(
  axes: CraftAxisScore[],
  unlocked?: Set<string>,
): {
  axes: CraftAxisScore[];
  active: boolean;
} {
  const set = unlocked ?? unlockedSet();
  const ye = CRAFT_COMBO_ACHIEVEMENTS.find((a) => a.id === 'ye_huo')!;
  if (evaluateCraftComboAch(ye, set).status !== 'complete') {
    return { axes, active: false };
  }
  const yeli = axes.find((a) => a.id === 'yeli');
  if (!yeli) return { axes, active: false };
  const max = Math.max(...axes.map((a) => a.value));
  if (yeli.value < max) return { axes, active: false };

  const next = axes.map((a) => {
    if (a.id !== 'guangyao') return a;
    const permanent = a.permanentValue ?? a.value;
    const yearMult = a.buffMult ?? 1;
    const mult = clampBuffMult(yearMult * YE_HUO_GUANGYAO_MULT);
    const src = '成就·业火淬炼';
    return {
      ...a,
      buffMult: mult,
      value: Math.round(permanent * mult),
      lit: true,
      sources: a.sources.includes(src) ? a.sources : [...a.sources, src],
    };
  });
  return { axes: next, active: true };
}

export function enrichCraftComboStates(
  axes: CraftAxisScore[],
  opts?: { unlocked?: Set<string>; yeHuoActive?: boolean },
): CraftComboAchState[] {
  const yeActive =
    opts?.yeHuoActive ??
    axes.some((a) => a.id === 'guangyao' && a.sources.includes('成就·业火淬炼'));
  return listCraftComboAchievements(opts?.unlocked).map((s) => ({
    ...s,
    conditionalActive: s.def.id === 'ye_huo' ? yeActive : false,
  }));
}

export function craftAwakenProgressHtml(): string {
  const { complete, total, pct } = craftComboProgress();
  const label =
    complete >= total
      ? '角色觉醒进度 · 组合成就已齐'
      : `角色觉醒进度 · 组合成就 ${complete}/${total}`;
  return `
    <button type="button" class="ziwei-awaken-progress" data-path="/ziwei/tujian?layer=journey">
      <div class="ziwei-awaken-progress-meta">
        <strong>${label}</strong>
        <span>图鉴集齐组合可强化造命雷达 ›</span>
      </div>
      <div class="ziwei-awaken-progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <i style="width:${pct}%"></i>
      </div>
    </button>`;
}
