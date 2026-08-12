/**
 * 八字衣橱规则包：本命色卡 + 今日/一周穿搭（软建议）
 */
import type { BaziChart } from '../bazi/cast.ts';
import { STEM_WUXING, type WuXing, wuxingClass } from '../bazi/elements.ts';
import { resolveHarmonizeTint } from '../bazi/harmonize-tint.ts';
import {
  buildLiuriDay,
  dateKeyFromDate,
  type LiuriDay,
  weekDates,
} from '../bazi/sense-liuri.ts';
import type { TenGodCategory } from '../bazi/ten-gods.ts';
import { KE_ME, WO_KE, WX_WEAR } from './wx-palette.ts';

export type WardrobeColorChip = {
  wx: WuXing;
  role: 'primary' | 'secondary' | 'accent' | 'soften';
  label: string;
  names: string[];
  cssClass: string;
};

export type WardrobeStyle = {
  materials: string[];
  cuts: string[];
  accessories: string[];
  occasion: string;
  summary: string;
};

export type WardrobeDayOutfit = {
  dateKey: string;
  weekday: string;
  ganZhi: string;
  stemGod: string;
  tag: string;
  tip: string;
  nudgeWx: WuXing | null;
  softenWx: WuXing | null;
  why: string[];
  liuri: LiuriDay;
};

export type WardrobePack = {
  temperament: string;
  temperamentSub: string;
  mood: string;
  dayMaster: string;
  dayMasterWx: WuXing | '';
  chips: WardrobeColorChip[];
  style: WardrobeStyle;
  natalWhy: string[];
  today: WardrobeDayOutfit;
  week: WardrobeDayOutfit[];
};

const CAT_TAG: Record<TenGodCategory, string> = {
  bi_jie: '并肩',
  shi_shang: '表达',
  cai: '结果',
  guan_sha: '压感',
  yin: '蓄力',
};

const CAT_TIP: Record<TenGodCategory, string> = {
  bi_jie: '今天气流偏并肩：主色可大胆一点，避免从头到脚同色闷住。',
  shi_shang: '今天想被看见：主色之外加一小块点缀色，出口更清楚。',
  cai: '今天盯结果：剪裁干净、配色少而准，比堆元素更有用。',
  guan_sha: '今天肩上有压感：结构感上衣 + 柔和主色，少用大块对冲色。',
  yin: '今天想被托住：柔软材质、低对比配色，给自己一点蓄力空间。',
};

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function chip(
  wx: WuXing,
  role: WardrobeColorChip['role'],
  label: string,
): WardrobeColorChip {
  return {
    wx,
    role,
    label,
    names: WX_WEAR[wx].colorNames,
    cssClass: wuxingClass(wx),
  };
}

/** 本命「可以少一点」：偏旺少穿构成主色大块；偏弱少穿克我色大块 */
function resolveSoftenWx(
  tint: ReturnType<typeof resolveHarmonizeTint>,
  dayWx: WuXing | '',
): { wx: WuXing | null; reason: string } {
  if (tint.dayStrong) {
    return {
      wx: tint.composePrimary,
      reason: `日主偏旺，${tint.composePrimary}气已足：大面积可少一点，改作小面积点缀更顺。`,
    };
  }
  if (dayWx) {
    const soft = KE_ME[dayWx];
    if (soft !== tint.composePrimary && soft !== tint.composeSecondary && soft !== tint.accent) {
      return {
        wx: soft,
        reason: `日主偏弱时，大面积${soft}色容易加重「被压」感：可少一点，或只作细节。`,
      };
    }
  }
  if (tint.accent) {
    const soft = WO_KE[tint.accent];
    if (soft !== tint.composePrimary) {
      return {
        wx: soft,
        reason: `调和偏${tint.accent}，大面积${soft}可少一点，免得把调候拉回去。`,
      };
    }
  }
  return { wx: null, reason: '' };
}

function buildStyle(
  tint: ReturnType<typeof resolveHarmonizeTint>,
): WardrobeStyle {
  const keys = [tint.composePrimary, tint.composeSecondary, tint.accent].filter(
    Boolean,
  ) as WuXing[];
  const materials = uniq(keys.flatMap((w) => WX_WEAR[w].materials)).slice(0, 4);
  const cuts = uniq(keys.flatMap((w) => WX_WEAR[w].cuts)).slice(0, 3);
  const accessories = uniq(keys.flatMap((w) => WX_WEAR[w].accessories)).slice(
    0,
    3,
  );
  const occasion =
    WX_WEAR[tint.accent ?? tint.composePrimary].occasion;
  const summary = [
    `气质「${tint.temperament}」：材质偏${materials.slice(0, 2).join('、')}`,
    `剪裁走${cuts[0] || '干净线'}`,
    accessories[0] ? `配饰可试${accessories[0]}` : '',
  ]
    .filter(Boolean)
    .join('；');
  return { materials, cuts, accessories, occasion, summary };
}

function dayOutfitFromLiuri(
  chart: BaziChart,
  tint: ReturnType<typeof resolveHarmonizeTint>,
  softenWx: WuXing | null,
  d: Date,
): WardrobeDayOutfit {
  const liuri = buildLiuriDay(chart, d);
  const cat = liuri.cat;
  const tag = cat ? CAT_TAG[cat] : '平日';
  let tip = cat ? CAT_TIP[cat] : '今天信号偏淡：按本命主色与材质走就好。';
  let nudgeWx: WuXing | null = tint.accent ?? tint.composePrimary;
  let daySoften = softenWx;

  if (cat === 'shi_shang') {
    nudgeWx = tint.accent ?? tint.composeSecondary ?? tint.composePrimary;
  } else if (cat === 'yin') {
    nudgeWx = tint.composePrimary;
    daySoften = softenWx;
  } else if (cat === 'guan_sha') {
    nudgeWx = tint.composePrimary;
    tip += softenWx
      ? ` 大块${softenWx}可再收一收。`
      : '';
  } else if (cat === 'cai') {
    nudgeWx = tint.accent ?? tint.composePrimary;
  } else if (cat === 'bi_jie') {
    nudgeWx = tint.composePrimary;
  }

  const dayStemWx = STEM_WUXING[liuri.ganZhi.charAt(0)] as WuXing | undefined;
  const why = [
    `流日${liuri.ganZhi}${liuri.stemGod && liuri.stemGod !== '—' ? ` · ${liuri.stemGod}` : ''}`,
    liuri.climate,
    dayStemWx ? `流日干属${dayStemWx}，可与本命色呼应或小面积混搭。` : '',
  ].filter(Boolean);

  return {
    dateKey: liuri.dateKey,
    weekday: liuri.weekday,
    ganZhi: liuri.ganZhi,
    stemGod: liuri.stemGod,
    tag,
    tip,
    nudgeWx,
    softenWx: daySoften,
    why,
    liuri,
  };
}

export function buildWardrobePack(
  chart: BaziChart,
  anchor = new Date(),
): WardrobePack {
  const tint = resolveHarmonizeTint(chart);
  const { wx: softenWx, reason: softenReason } = resolveSoftenWx(
    tint,
    chart.dayMasterWx || '',
  );

  const chips: WardrobeColorChip[] = [
    chip(tint.composePrimary, 'primary', '主推'),
  ];
  if (tint.composeSecondary) {
    chips.push(chip(tint.composeSecondary, 'secondary', '次推'));
  }
  if (tint.accent) {
    chips.push(chip(tint.accent, 'accent', '点缀'));
  }
  if (softenWx) {
    chips.push(chip(softenWx, 'soften', '可以少一点'));
  }

  const natalWhy = [
    `构成：${tint.composePrimary}${tint.composeSecondary ? '＋' + tint.composeSecondary : ''}（盘面气质）`,
    tint.accentReason || (tint.accent ? `调和：${tint.accent}` : '调和：暂不叠加额外色'),
    softenReason,
    `气候感：${tint.climate.join('、') || '平'} · 情绪底色：${tint.mood}`,
  ].filter(Boolean);

  const style = buildStyle(tint);
  const today = dayOutfitFromLiuri(chart, tint, softenWx, anchor);
  const week = weekDates(anchor).map((d) =>
    dayOutfitFromLiuri(chart, tint, softenWx, d),
  );

  return {
    temperament: tint.temperament,
    temperamentSub: tint.temperamentSub,
    mood: tint.mood,
    dayMaster: chart.dayMaster,
    dayMasterWx: chart.dayMasterWx || '',
    chips,
    style,
    natalWhy,
    today,
    week,
  };
}

export function todayDateKey(d = new Date()): string {
  return dateKeyFromDate(d);
}
