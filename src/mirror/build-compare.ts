/**
 * 双盘映照 · 规则模板对照（零 LLM）
 * 八字看结构，紫微看人生场景；重叠=稳定主题，差异=观察侧面
 */
import type { BaziChart } from '../bazi/cast.ts';
import { buildBaziPortrait } from '../bazi/portrait-template.ts';
import { buildEnergyBalance } from '../bazi/sense-energy.ts';
import {
  collectTenGodLabels,
  countCategories,
  type TenGodCategory,
} from '../bazi/ten-gods.ts';
import { getPalaceLore } from '../ziwei/palace-lore.ts';
import type { PalaceSnap, ZiweiChartView } from '../ziwei/types.ts';
import type { MirrorComparePack, MirrorThemeCard, MirrorThemeId } from './types.ts';

const THEME_META: Record<
  MirrorThemeId,
  { title: string; baziLens: string; ziweiLens: string; palaces: string[] }
> = {
  personality: {
    title: '性格',
    baziLens: '日主、五行、十神',
    ziweiLens: '命宫、身宫、主星',
    palaces: ['命宫'],
  },
  career: {
    title: '事业',
    baziLens: '官杀、财星、月令',
    ziweiLens: '官禄宫、迁移宫',
    palaces: ['官禄', '迁移'],
  },
  love: {
    title: '感情',
    baziLens: '财星/官杀、日支',
    ziweiLens: '夫妻宫、福德宫',
    palaces: ['夫妻', '福德'],
  },
  wealth: {
    title: '财富',
    baziLens: '财星、食伤、生克',
    ziweiLens: '财帛宫、田宅宫',
    palaces: ['财帛', '田宅'],
  },
  family: {
    title: '家庭',
    baziLens: '印星、比劫、年柱',
    ziweiLens: '父母宫、兄弟宫',
    palaces: ['父母', '兄弟'],
  },
  health: {
    title: '健康',
    baziLens: '五行失衡、日主强弱',
    ziweiLens: '疾厄宫、福德宫',
    palaces: ['疾厄', '福德'],
  },
};

const CAT_LABEL: Record<TenGodCategory, string> = {
  bi_jie: '比劫',
  shi_shang: '食伤',
  cai: '财星',
  guan_sha: '官杀',
  yin: '印星',
};

function findPalace(view: ZiweiChartView, name: string): PalaceSnap | undefined {
  const key = name.replace(/宫$/, '');
  return view.palaces.find((p) => p.name === name || p.name.replace(/宫$/, '') === key);
}

function palaceStarBrief(palace: PalaceSnap | undefined): string {
  if (!palace) return '宫位未排入';
  const majors = palace.majors.map((s) => s.name).filter(Boolean);
  if (majors.length) return `${palace.name}主星：${majors.join('、')}`;
  if (palace.isEmpty) return `${palace.name}空象——场景更靠三方四正借力`;
  const minors = palace.minors.slice(0, 2).map((s) => s.name);
  return minors.length
    ? `${palace.name}无主星，辅星：${minors.join('、')}`
    : `${palace.name}星象偏淡`;
}

function ziweiAngleFor(view: ZiweiChartView, palaceNames: string[]): {
  angle: string;
  evidence: string[];
} {
  const evidence: string[] = [];
  const bits: string[] = [];
  for (const name of palaceNames) {
    const palace = findPalace(view, name);
    const lore = getPalaceLore(name);
    evidence.push(palaceStarBrief(palace));
    if (lore) {
      evidence.push(`${lore.title}主题：${lore.hint}`);
      bits.push(lore.oneLiner.replace(/——.*/, '').trim());
    }
  }
  const bodyHint =
    view.bodyPalace?.name && view.bodyPalace.name !== view.soulPalace.name
      ? `身宫在${view.bodyPalace.name.replace(/宫$/, '')}，行动落点常偏这里。`
      : '';
  const angle = [bits[0] ?? '从宫位场景看你的人生戏份', bits[1], bodyHint]
    .filter(Boolean)
    .join(' ');
  return { angle, evidence };
}

function topCats(
  counts: Record<TenGodCategory, number>,
  n = 2,
): TenGodCategory[] {
  return (Object.keys(counts) as TenGodCategory[])
    .filter((k) => counts[k] > 0)
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, n);
}

function overlapHint(a: string, b: string): boolean {
  const keys = ['稳定', '洞察', '规划', '创造', '责任', '边界', '积累', '表达', '支持', '节奏'];
  return keys.some((k) => a.includes(k) && b.includes(k));
}

function buildTheme(
  id: MirrorThemeId,
  chart: BaziChart,
  view: ZiweiChartView,
  gender: '' | 'female' | 'male',
): MirrorThemeCard {
  const meta = THEME_META[id];
  const portrait = buildBaziPortrait(chart, { gender });
  const labels = collectTenGodLabels(chart);
  const counts = countCategories(labels);
  const energy = buildEnergyBalance(chart);
  const zw = ziweiAngleFor(view, meta.palaces);

  let baziAngle = '';
  let baziEvidence: string[] = [];

  switch (id) {
    case 'personality': {
      baziAngle = `${portrait.personality}（日主${chart.dayMaster || '未明'}${chart.dayMasterWx ? `属${chart.dayMasterWx}` : ''}）`;
      baziEvidence = [
        `日主：${chart.dayMaster || '—'}${chart.dayMasterWx ? ` · ${chart.dayMasterWx}` : ''}`,
        `关键词：${portrait.keyword}`,
        ...topCats(counts).map((c) => `十神偏重：${CAT_LABEL[c]}`),
      ];
      break;
    }
    case 'career': {
      baziAngle = portrait.career;
      baziEvidence = [
        `月令十神：${chart.pillars.find((p) => p.key === 'month')?.stemGod || '—'}`,
        ...topCats(counts).map((c) => `${CAT_LABEL[c]}×${counts[c]}`),
      ];
      break;
    }
    case 'love': {
      baziAngle = portrait.relationship;
      baziEvidence = [
        `日支：${chart.dayBranch || '—'}`,
        counts.guan_sha ? `官杀×${counts.guan_sha}` : '官杀不重',
        counts.cai ? `财星×${counts.cai}` : '财星不重',
      ];
      break;
    }
    case 'wealth': {
      baziAngle = portrait.wealth;
      baziEvidence = [
        counts.cai ? `财星×${counts.cai}` : '财星偏少',
        counts.shi_shang ? `食伤×${counts.shi_shang}` : '食伤不重',
      ];
      break;
    }
    case 'family': {
      const year = chart.pillars.find((p) => p.key === 'year');
      baziAngle = counts.yin
        ? '早年与支持系统议题更显眼，印星提醒你如何被滋养、如何自立。'
        : counts.bi_jie
          ? '同辈协作与边界感更敏感，比劫多时常要分清并肩与较劲。'
          : '家庭场更看年柱与整体生克，宜把「支持从哪来」写成可核对的事实。';
      baziEvidence = [
        `年柱：${year && !year.empty ? `${year.stem}${year.branch}` : '—'}`,
        counts.yin ? `印星×${counts.yin}` : '印星不重',
        counts.bi_jie ? `比劫×${counts.bi_jie}` : '比劫不重',
      ];
      break;
    }
    case 'health': {
      baziAngle = energy.headline;
      baziEvidence = [
        energy.body,
        energy.excess ? `偏旺：${energy.excess}` : '无明显偏旺',
        energy.shortage ? `偏弱：${energy.shortage}` : '无明显偏弱',
      ];
      break;
    }
  }

  const sharedBase = overlapHint(baziAngle, zw.angle)
    ? '两套体系都在强调同一条主线：你更适合按自己的节奏把事情做深，而不是被环境推着跑。'
    : '两套体系都在描述「你如何进入世界」——一个从能量结构说，一个从人生场景说。';

  const sharedByTheme: Record<MirrorThemeId, string> = {
    personality: `共同指向：你的出场方式偏「${portrait.themes[0]}」。八字从日主结构写气质，紫微从命宫主星写人设。`,
    career: `共同指向：事业上更吃「洞察、规划与可交付」的组合，不适合长期只做无反馈的重复执行。`,
    love: `共同指向：亲密关系里需要清晰约定与节奏感；含糊承诺最伤你。`,
    wealth: `共同指向：钱与资源要有「进账路径 + 蓄水纪律」，单靠感觉容易漏。`,
    family: `共同指向：家庭与支持系统会影响你怎么求助、怎么扛责；先分清滋养与消耗。`,
    health: `共同指向：身心负荷需要仪表盘——过载时先降速，再谈扩张。`,
  };

  const different = `八字强调：${meta.baziLens}（结构与动力从哪来）。紫微强调：${meta.ziweiLens}（这件事发生在哪些人生场景）。`;

  const synthesisByTheme: Record<MirrorThemeId, string> = {
    personality: `综合：${baziAngle.replace(/（.*?）$/, '')}；同时，${zw.angle}`,
    career: `综合：${baziAngle}；紫微侧看，${zw.angle}`,
    love: `综合：${baziAngle}；紫微侧看，${zw.angle}`,
    wealth: `综合：${baziAngle}；紫微侧看，${zw.angle}`,
    family: `综合：${baziAngle}；紫微侧看，${zw.angle}`,
    health: `综合：${energy.remedy || energy.headline}；紫微侧把负荷落在疾厄/福德场景里观察。`,
  };

  return {
    id,
    title: meta.title,
    baziLens: meta.baziLens,
    ziweiLens: meta.ziweiLens,
    baziEvidence,
    ziweiEvidence: zw.evidence,
    baziAngle,
    ziweiAngle: zw.angle,
    shared: sharedByTheme[id] || sharedBase,
    different,
    synthesis: synthesisByTheme[id],
    stableNote: '原局（八字四柱 / 紫微十二宫）是底色，短期内不会大变。',
    changeNote: '大运流年与大限流年会改「哪条线被点亮」——细节后置到流年对照。',
  };
}

export type BuildMirrorOpts = {
  personName?: string;
  gender?: '' | 'female' | 'male';
};

export function buildMirrorCompare(
  chart: BaziChart,
  view: ZiweiChartView,
  opts?: BuildMirrorOpts,
): MirrorComparePack {
  const gender = opts?.gender ?? '';
  const ids = Object.keys(THEME_META) as MirrorThemeId[];
  const themes = ids.map((id) => buildTheme(id, chart, view, gender));
  const soulStars = view.soulPalace.majors.map((s) => s.name).join('、') || '空象';
  return {
    personName: opts?.personName?.trim() || '你',
    dayMasterBrief: `日主${chart.dayMaster || '—'}${chart.dayMasterWx ? ` · ${chart.dayMasterWx}` : ''}`,
    soulBrief: `命宫${soulStars}${view.soul ? ` · 命主${view.soul}` : ''}`,
    themes,
    headline:
      '八字与紫微像两台扫描仪：重叠部分是稳定主题，差异部分是值得继续观察的人生侧面。',
    generatedAt: new Date().toISOString(),
  };
}

export function getMirrorTheme(
  pack: MirrorComparePack,
  id: string,
): MirrorThemeCard | undefined {
  return pack.themes.find((t) => t.id === id);
}

export const MIRROR_THEME_ORDER = Object.keys(THEME_META) as MirrorThemeId[];
