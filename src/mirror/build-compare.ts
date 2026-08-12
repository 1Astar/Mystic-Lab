/**
 * 双盘映照 · 规则模板对照（零 LLM）
 * 八字看结构，紫微看人生场景；重叠=稳定主题，差异=观察侧面
 */
import type { BaziChart } from '../bazi/cast.ts';
import type { LuckCycles } from '../bazi/luck-cycles.ts';
import { buildBaziPortrait } from '../bazi/portrait-template.ts';
import { buildEnergyBalance } from '../bazi/sense-energy.ts';
import {
  findDayunForYear,
  findLiunianForYear,
} from '../bazi/sense-shuttle.ts';
import {
  collectTenGodLabels,
  countCategories,
  type TenGodCategory,
} from '../bazi/ten-gods.ts';
import type { PersonProfile } from '../life/types.ts';
import { getPalaceLore } from '../ziwei/palace-lore.ts';
import type { PalaceSnap, ZiweiChartView } from '../ziwei/types.ts';
import { buildMirrorTimeline } from './build-timeline.ts';
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

function majorsOf(palace: PalaceSnap | undefined): string[] {
  return palace?.majors.map((s) => s.name).filter(Boolean) ?? [];
}

function palaceStarBrief(palace: PalaceSnap | undefined): string {
  if (!palace) return '宫位未排入';
  const majors = majorsOf(palace);
  if (majors.length) return `${palace.name}主星：${majors.join('、')}`;
  if (palace.isEmpty) return `${palace.name}空象——场景更靠三方四正借力`;
  const minors = palace.minors.slice(0, 2).map((s) => s.name);
  return minors.length
    ? `${palace.name}无主星，辅星：${minors.join('、')}`
    : `${palace.name}星象偏淡`;
}

function ziweiBundle(view: ZiweiChartView, palaceNames: string[]): {
  angle: string;
  evidence: string[];
  majors: string[];
  palaceTitles: string[];
  loreHints: string[];
} {
  const evidence: string[] = [];
  const majors: string[] = [];
  const palaceTitles: string[] = [];
  const loreHints: string[] = [];
  const bits: string[] = [];

  for (const name of palaceNames) {
    const palace = findPalace(view, name);
    const lore = getPalaceLore(name);
    evidence.push(palaceStarBrief(palace));
    palaceTitles.push(palace?.name.replace(/宫$/, '') || name.replace(/宫$/, ''));
    majors.push(...majorsOf(palace));
    if (lore) {
      evidence.push(`${lore.title}主题：${lore.hint}`);
      if (lore.commonLooks) evidence.push(`常见表现：${lore.commonLooks}`);
      loreHints.push(lore.hint);
      bits.push(lore.oneLiner.replace(/——.*/, '').trim());
    }
  }

  const bodyHint =
    view.bodyPalace?.name && view.bodyPalace.name !== view.soulPalace.name
      ? `身宫在${view.bodyPalace.name.replace(/宫$/, '')}，行动落点常偏这里。`
      : '';

  const majorBit = majors.length ? `主星以${[...new Set(majors)].join('、')}为骨` : '宫星偏淡，更看会照';
  const angle = [`${bits[0] ?? '从宫位场景看你的人生戏份'}（${majorBit}）`, bits[1], bodyHint]
    .filter(Boolean)
    .join(' ');

  return {
    angle,
    evidence,
    majors: [...new Set(majors)],
    palaceTitles: [...new Set(palaceTitles)],
    loreHints,
  };
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

function monthPillarLine(chart: BaziChart): string {
  const month = chart.pillars.find((p) => p.key === 'month');
  if (!month || month.empty) return '月令未排';
  return `月令${month.stem}${month.branch}${month.stemGod ? ` · ${month.stemGod}` : ''}`;
}

function buildShared(opts: {
  id: MirrorThemeId;
  portraitTheme: string;
  dayMaster: string;
  dayMasterWx: string;
  topGodLabels: string[];
  soulMajors: string[];
  palaceTitles: string[];
  loreHints: string[];
  baziHook: string;
}): string {
  const gods = opts.topGodLabels.slice(0, 2).join('、') || '十神结构';
  const stars = opts.soulMajors.slice(0, 2).join('、') || '命宫星象';
  const palaces = opts.palaceTitles.join('、') || '相关宫位';
  const hint = opts.loreHints[0] || '人生场景';

  switch (opts.id) {
    case 'personality':
      return `共同指向：出场方式贴近「${opts.portraitTheme}」。八字用日主${opts.dayMaster || '—'}${opts.dayMasterWx ? `（${opts.dayMasterWx}）` : ''}与${gods}写气质；紫微用命宫${stars}写人设——两边都在回答「别人第一眼读到的你」。`;
    case 'career':
      return `共同指向：事业议题落在「怎么交付、怎么被看见」。八字侧${opts.baziHook}；紫微侧${palaces}（${hint}）——重叠处是你更吃得住的工作姿态，差异处是场景与动力来源不同。`;
    case 'love':
      return `共同指向：亲密关系需要可核对的节奏与边界。八字侧${opts.baziHook}；紫微侧看${palaces}里的${stars || '星象'}——重叠=你反复遇到的相处课题，差异=结构动力 vs 宫位戏份。`;
    case 'wealth':
      return `共同指向：资源要有进账路径与蓄水纪律。八字侧${opts.baziHook}；紫微侧${palaces}写钱与根基如何落地——重叠提醒「值不值」，差异提醒看动力还是看场景。`;
    case 'family':
      return `共同指向：支持系统影响你怎么求助与扛责。八字侧${opts.baziHook}；紫微侧${palaces}写出处与同辈场——先分清滋养与消耗。`;
    case 'health':
      return `共同指向：身心负荷需要仪表盘。八字侧${opts.baziHook}；紫微侧${palaces}把负荷落在具体人生场景——过载时先降速。`;
  }
}

function buildDifferent(opts: {
  baziLens: string;
  ziweiLens: string;
  baziFacts: string[];
  palaceTitles: string[];
  majors: string[];
}): string {
  const baziBit = opts.baziFacts.slice(0, 2).join('；') || opts.baziLens;
  const zwBit = opts.majors.length
    ? `${opts.palaceTitles.join('、')}主星 ${opts.majors.slice(0, 3).join('、')}`
    : `${opts.palaceTitles.join('、') || opts.ziweiLens}（宫星偏淡，重会照）`;
  return `不同角度：八字用「${opts.baziLens}」读结构动力——${baziBit}。紫微用「${opts.ziweiLens}」读人生场景——${zwBit}。不是谁更准，是两台扫描仪。`;
}

function buildSynthesis(opts: {
  id: MirrorThemeId;
  baziAngle: string;
  ziweiAngle: string;
  energyRemedy?: string;
}): string {
  const baziShort = opts.baziAngle.replace(/（[^）]*）/g, '').trim();
  if (opts.id === 'health') {
    return `综合：${opts.energyRemedy || baziShort}；紫微侧把负荷落在疾厄/福德场景里观察——${opts.ziweiAngle}`;
  }
  return `综合：八字说「${baziShort}」；紫微说「${opts.ziweiAngle}」。重叠处当底色，差异处当观察清单。`;
}

function buildTheme(
  id: MirrorThemeId,
  chart: BaziChart,
  view: ZiweiChartView,
  gender: '' | 'female' | 'male',
  luck: LuckCycles | null,
  focusYear: number,
): MirrorThemeCard {
  const meta = THEME_META[id];
  const portrait = buildBaziPortrait(chart, { gender });
  const labels = collectTenGodLabels(chart);
  const counts = countCategories(labels);
  const energy = buildEnergyBalance(chart);
  const zw = ziweiBundle(view, meta.palaces);
  const top = topCats(counts);
  const topGodLabels = top.map((c) => CAT_LABEL[c]);

  let baziAngle = '';
  let baziEvidence: string[] = [];
  let baziHook = '';
  let baziFacts: string[] = [];

  switch (id) {
    case 'personality': {
      baziAngle = `${portrait.personality}（日主${chart.dayMaster || '未明'}${chart.dayMasterWx ? `属${chart.dayMasterWx}` : ''}）`;
      baziEvidence = [
        `日主：${chart.dayMaster || '—'}${chart.dayMasterWx ? ` · ${chart.dayMasterWx}` : ''}`,
        `关键词：${portrait.keyword}`,
        `主题词：${portrait.themes.slice(0, 3).join('、') || '—'}`,
        ...top.map((c) => `十神偏重：${CAT_LABEL[c]}×${counts[c]}`),
        monthPillarLine(chart),
      ];
      baziHook = `日主${chart.dayMaster || '—'}与${topGodLabels.join('、') || '十神'}写气质`;
      baziFacts = baziEvidence.slice(0, 3);
      break;
    }
    case 'career': {
      baziAngle = portrait.career;
      baziEvidence = [
        monthPillarLine(chart),
        ...top.map((c) => `${CAT_LABEL[c]}×${counts[c]}`),
        counts.guan_sha ? `官杀可见，事业压力/职级议题更显` : '官杀不重，更吃自主交付',
        counts.cai ? `财星×${counts.cai}，事业常与资源挂钩` : '财星不重，先看技能变现路径',
      ];
      baziHook = `${monthPillarLine(chart)}；${topGodLabels.join('、') || '十神'}偏重`;
      baziFacts = [monthPillarLine(chart), ...top.map((c) => `${CAT_LABEL[c]}×${counts[c]}`)];
      break;
    }
    case 'love': {
      baziAngle = portrait.relationship;
      baziEvidence = [
        `日支：${chart.dayBranch || '—'}`,
        counts.guan_sha ? `官杀×${counts.guan_sha}` : '官杀不重',
        counts.cai ? `财星×${counts.cai}` : '财星不重',
        counts.yin ? `印星×${counts.yin}（需要被理解）` : '印星不重',
      ];
      baziHook = `日支${chart.dayBranch || '—'}，官杀/财星可见度不同`;
      baziFacts = baziEvidence.slice(0, 3);
      break;
    }
    case 'wealth': {
      baziAngle = portrait.wealth;
      baziEvidence = [
        counts.cai ? `财星×${counts.cai}` : '财星偏少',
        counts.shi_shang ? `食伤×${counts.shi_shang}（靠输出变现）` : '食伤不重',
        counts.bi_jie ? `比劫×${counts.bi_jie}（分财/协作议题）` : '比劫不重',
        monthPillarLine(chart),
      ];
      baziHook = counts.cai
        ? `财星×${counts.cai}${counts.shi_shang ? `、食伤×${counts.shi_shang}` : ''}`
        : '财星偏少，更要设计进账路径';
      baziFacts = baziEvidence.slice(0, 3);
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
        `年柱：${year && !year.empty ? `${year.stem}${year.branch}${year.stemGod ? ` · ${year.stemGod}` : ''}` : '—'}`,
        counts.yin ? `印星×${counts.yin}` : '印星不重',
        counts.bi_jie ? `比劫×${counts.bi_jie}` : '比劫不重',
      ];
      baziHook =
        year && !year.empty
          ? `年柱${year.stem}${year.branch}${year.stemGod ? `（${year.stemGod}）` : ''}`
          : '年柱与印比结构';
      baziFacts = baziEvidence;
      break;
    }
    case 'health': {
      baziAngle = energy.headline;
      baziEvidence = [
        energy.body,
        energy.excess ? `偏旺：${energy.excess}` : '无明显偏旺',
        energy.shortage ? `偏弱：${energy.shortage}` : '无明显偏弱',
        energy.remedy ? `调候提醒：${energy.remedy}` : '',
      ].filter(Boolean);
      baziHook = energy.headline;
      baziFacts = baziEvidence.slice(0, 2);
      break;
    }
  }

  const dayun = luck ? findDayunForYear(luck, focusYear) : null;
  const liu = luck ? findLiunianForYear(luck, focusYear) : null;
  const decade = view.theater.decade;
  const stableNote = `原局底色：日主${chart.dayMaster || '—'}${chart.dayMasterWx ? `·${chart.dayMasterWx}` : ''}；命宫${majorsOf(view.soulPalace).join('、') || '空象'}。四柱与十二宫短期内不会大变。`;
  const changeParts: string[] = [];
  if (dayun && !dayun.empty) {
    changeParts.push(`当前大运 ${dayun.ganZhi}${dayun.stemGod ? `·${dayun.stemGod}` : ''}（${dayun.startYear}–${dayun.endYear}）`);
  } else if (dayun?.empty) {
    changeParts.push('尚未起运/童限，大运点亮仍弱');
  }
  if (liu) {
    changeParts.push(`${focusYear}流年 ${liu.ganZhi}${liu.stemGod ? `·${liu.stemGod}` : ''}`);
  }
  if (decade?.palaceName) {
    changeParts.push(
      `紫微大限落${decade.palaceName.replace(/宫$/, '')}${decade.theme ? `（${decade.theme}）` : ''}`,
    );
  }
  const changeNote = changeParts.length
    ? `会随运限变化：${changeParts.join('；')}——点亮哪条线在变，底色仍看原局。`
    : '大运流年与大限流年会改「哪条线被点亮」——可下拉流年时间轴对照。';

  return {
    id,
    title: meta.title,
    baziLens: meta.baziLens,
    ziweiLens: meta.ziweiLens,
    baziEvidence,
    ziweiEvidence: zw.evidence,
    baziAngle,
    ziweiAngle: zw.angle,
    shared: buildShared({
      id,
      portraitTheme: portrait.themes[0] || portrait.keyword || '自我主轴',
      dayMaster: chart.dayMaster,
      dayMasterWx: chart.dayMasterWx || '',
      topGodLabels,
      soulMajors: id === 'personality' ? majorsOf(view.soulPalace) : zw.majors,
      palaceTitles: zw.palaceTitles,
      loreHints: zw.loreHints,
      baziHook,
    }),
    different: buildDifferent({
      baziLens: meta.baziLens,
      ziweiLens: meta.ziweiLens,
      baziFacts,
      palaceTitles: zw.palaceTitles,
      majors: zw.majors,
    }),
    synthesis: buildSynthesis({
      id,
      baziAngle,
      ziweiAngle: zw.angle,
      energyRemedy: energy.remedy,
    }),
    stableNote,
    changeNote,
  };
}

export type BuildMirrorOpts = {
  personName?: string;
  gender?: '' | 'female' | 'male';
  /** 档案：用于流年轴 */
  person?: PersonProfile;
  luck?: LuckCycles | null;
  focusYear?: number;
  timelineRadius?: number;
  nowYear?: number;
};

export function buildMirrorCompare(
  chart: BaziChart,
  view: ZiweiChartView,
  opts?: BuildMirrorOpts,
): MirrorComparePack {
  const gender = opts?.gender ?? '';
  const focusYear = opts?.focusYear ?? opts?.nowYear ?? new Date().getFullYear();
  const luck = opts?.luck ?? null;
  const ids = Object.keys(THEME_META) as MirrorThemeId[];
  const themes = ids.map((id) => buildTheme(id, chart, view, gender, luck, focusYear));
  const soulStars = view.soulPalace.majors.map((s) => s.name).join('、') || '空象';

  const birthYear = chart.birthYear || Number(opts?.person?.birthYear) || focusYear;
  const timeline =
    opts?.person && gender
      ? buildMirrorTimeline({
          person: opts.person,
          gender,
          birthYear,
          centerYear: focusYear,
          radius: opts.timelineRadius ?? 3,
          nowYear: opts.nowYear ?? focusYear,
        })
      : [];

  return {
    personName: opts?.personName?.trim() || '你',
    dayMasterBrief: `日主${chart.dayMaster || '—'}${chart.dayMasterWx ? ` · ${chart.dayMasterWx}` : ''}`,
    soulBrief: `命宫${soulStars}${view.soul ? ` · 命主${view.soul}` : ''}`,
    themes,
    timeline,
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
