/**
 * 造命 · 八字大运/流年/流月十神 → 限时词条（弱叠乘）
 * 紫微四化仍是主行动词条；八字侧乘子弱于同层紫微，流月弱于流年。
 */
import { buildLuckCycles, type LuckPillar } from '../bazi/luck-cycles.ts';
import {
  categorizeTenGod,
  type TenGodCategory,
} from '../bazi/ten-gods.ts';
import type { PersonProfile } from '../life/types.ts';
import type { MutagenKind } from '../ziwei/mutagen-format.ts';
import {
  CRAFT_AXES,
  type CraftAxisId,
} from './spirit-roots.ts';
import type { BuffEffect, BuffScope, YearBuffEntry } from './spirit-buff.ts';

export type BaziBuffLayer = 'dayun' | 'liunian' | 'liuyue';

/** 相对 1.0 的偏移；大运 < 流年，流月最弱 */
export const BAZI_BUFF_DELTA: Record<BaziBuffLayer, number> = {
  dayun: 0.08,
  liunian: 0.1,
  liuyue: 0.06,
};

type CatPack = {
  axis: CraftAxisId;
  secondary: CraftAxisId;
  /** UI 借用禄权科忌色感：官杀偏考验 */
  kind: MutagenKind;
  adviceBoost: string;
  adviceSoft: string;
};

const CAT_PACK: Record<TenGodCategory, CatPack> = {
  guan_sha: {
    axis: 'zhenshou',
    secondary: 'guangyao',
    kind: '忌',
    adviceBoost: '规则与责任更显眼，宜把交付拆小步核对。',
    adviceSoft: '评价压过来时，先守边界再冲。',
  },
  cai: {
    axis: 'guangyao',
    secondary: 'tongbian',
    kind: '禄',
    adviceBoost: '结果与资源窗口更开，报价前先写止损。',
    adviceSoft: '机会露面时小步试单，少梭哈。',
  },
  yin: {
    axis: 'wenyang',
    secondary: 'lingyun',
    kind: '科',
    adviceBoost: '学习与求助更有用，弄懂再上场。',
    adviceSoft: '雾里少硬刚，先托底再亮剑。',
  },
  shi_shang: {
    axis: 'tongbian',
    secondary: 'lingyun',
    kind: '权',
    adviceBoost: '表达与作品易被看见，选一个出口专心交付。',
    adviceSoft: '少同时开播所有频道，把话说满前先落地。',
  },
  bi_jie: {
    axis: 'guangyao',
    secondary: 'yeli',
    kind: '禄',
    adviceBoost: '并肩与竞速同在，宜协作也防争抢。',
    adviceSoft: '借力时留清分工，少内耗空转。',
  },
};

function axisLabel(id: CraftAxisId): string {
  return CRAFT_AXES.find((a) => a.id === id)?.label ?? id;
}

function formatEffects(effects: BuffEffect[]): string {
  return effects
    .map((e) => {
      const pct = Math.round((e.mult - 1) * 100);
      const sign = pct >= 0 ? `+${pct}%` : `${pct}%`;
      return `${axisLabel(e.axis)}${sign}`;
    })
    .join(' · ');
}

function layerWord(layer: BaziBuffLayer): string {
  if (layer === 'liuyue') return '流月';
  if (layer === 'dayun') return '大运';
  return '流年';
}

function layerScope(layer: BaziBuffLayer): BuffScope {
  return layer === 'liuyue' ? 'month' : 'year';
}

/**
 * 公历月 → 节气流月下标（立春起寅：2月≈0 … 1月≈11）
 */
export function calendarMonthToLiuyueIndex(month: number): number {
  const m = Math.min(12, Math.max(1, Math.floor(month)));
  return m === 1 ? 11 : m - 2;
}

export function effectsForBaziTenGod(
  god: string,
  layer: BaziBuffLayer,
): { effects: BuffEffect[]; advice: string; kind: MutagenKind } | null {
  const cat = categorizeTenGod(god);
  if (!cat) return null;
  const pack = CAT_PACK[cat];
  const delta = BAZI_BUFF_DELTA[layer];
  const effects: BuffEffect[] = [
    { axis: pack.axis, mult: 1 + delta },
    { axis: pack.secondary, mult: 1 + delta * 0.5 },
  ];
  const when = layerWord(layer);
  const advice =
    cat === 'guan_sha'
      ? `${when}八字气候·${god}：${pack.adviceSoft}`
      : `${when}八字气候·${god}：${pack.adviceBoost}`;
  return { effects, advice, kind: pack.kind };
}

function entryFromPillar(
  pillar: LuckPillar,
  layer: BaziBuffLayer,
  idKey: string,
): YearBuffEntry | null {
  const god = pillar.stemGod?.trim();
  if (!god || god === '—' || god === '日主') return null;
  const built = effectsForBaziTenGod(god, layer);
  if (!built) return null;
  const gz = pillar.ganZhi || `${pillar.stem}${pillar.branch}`;
  return {
    id: `bazi-${layer}-${idKey}-${god}`,
    title: `${layerWord(layer)}·${god}${gz ? `（${gz}）` : ''}`,
    kind: built.kind,
    star: god,
    effects: built.effects,
    effectLabel: formatEffects(built.effects),
    advice: built.advice,
    scope: layerScope(layer),
    lane: 'bazi',
    baziLayer: layer,
  };
}

/**
 * 从运程排出八字大运 / 流年 / 流月十神词条。
 * 乘子：流年 > 大运 > 流月（见 BAZI_BUFF_DELTA）。
 */
export function buildBuffEntriesFromBazi(
  person: PersonProfile,
  year: number,
  month: number,
  opts?: { layers?: BaziBuffLayer[] },
): YearBuffEntry[] {
  const layers = opts?.layers ?? ['dayun', 'liunian', 'liuyue'];
  const luck = buildLuckCycles(person, person.gender, year);
  if (!luck) return [];

  const out: YearBuffEntry[] = [];

  if (layers.includes('dayun')) {
    const dy = luck.dayun.find((c) => c.current && !c.empty) ??
      luck.dayun.find((c) => !c.empty && year >= c.startYear && year <= c.endYear);
    if (dy?.stemGod) {
      const e = entryFromPillar(dy, 'dayun', `${dy.startYear}-${dy.endYear}`);
      if (e) out.push(e);
    }
  }

  if (layers.includes('liunian')) {
    const ln =
      luck.liunian.find((c) => c.selected) ??
      luck.liunian.find((c) => c.year === year);
    if (ln?.stemGod) {
      const e = entryFromPillar(ln, 'liunian', String(year));
      if (e) out.push(e);
    }
  }

  if (layers.includes('liuyue')) {
    const idx = calendarMonthToLiuyueIndex(month);
    const ly = luck.liuyue[idx];
    if (ly?.stemGod) {
      const e = entryFromPillar(ly, 'liuyue', `${year}m${month}`);
      if (e) out.push(e);
    }
  }

  return out;
}
