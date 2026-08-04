import { getStarLore, isMajorStar, type MajorStarId } from './stars.ts';
import type {
  AnnualAdvice,
  ComfortNote,
  DecadeAdvice,
  PalaceSnap,
  SoulCombo,
  TheaterPillar,
  ZiweiIntent,
  ZiweiTheater,
} from './types.ts';

/** 大限落入的本命宫 → 生活课题线（对用户不堆宫名） */
const DECADE_THEME: Record<string, string> = {
  命宫: '重塑自我',
  兄弟: '同辈协作',
  夫妻: '亲密关系',
  子女: '创造与表达',
  财帛: '搞钱与资源',
  疾厄: '身心边界',
  迁移: '出走与视野',
  仆役: '人脉与协作',
  官禄: '事业舞台',
  田宅: '根基与资产',
  福德: '内心满足',
  父母: '出处与权威',
};

const PILLAR_DEFS: Array<{
  id: TheaterPillar['id'];
  title: string;
  subtitle: string;
  palaceNames: string[];
  mirrorLabel: string;
}> = [
  {
    id: 'core',
    title: '内核',
    subtitle: '命运的核心驱动力',
    palaceNames: ['命宫', '身宫'],
    mirrorLabel: '内核',
  },
  {
    id: 'career',
    title: '搞钱与事业',
    subtitle: '赚钱的能量',
    palaceNames: ['财帛', '官禄', '田宅'],
    mirrorLabel: '事业财运',
  },
  {
    id: 'bond',
    title: '社交与爱',
    subtitle: '他人能量',
    palaceNames: ['夫妻', '仆役'],
    mirrorLabel: '关系',
  },
  {
    id: 'lesson',
    title: '此生课题',
    subtitle: '今生需要突破的重点',
    palaceNames: ['命宫', '福德', '迁移'],
    mirrorLabel: '课题',
  },
];

export const COMFORT_LINE =
  '命理是统计学的极端概率，不是你的死刑判决书。空宫或化忌不是死刑——它会让你在此处更依赖后天的化科、化禄（运气与贵人）与自己的选择。';

function findPalace(palaces: PalaceSnap[], name: string): PalaceSnap | undefined {
  if (name === '身宫') return palaces.find((p) => p.isBody);
  return palaces.find((p) => p.name === name);
}

function displayPalaceName(name: string, palace: PalaceSnap | undefined): string {
  if (name === '身宫' && palace) return `身宫落在「${palace.name}」这条生命线上`;
  if (name === '仆役') return '交友';
  // 对用户不展示宫位术语时，用生活语言
  const map: Record<string, string> = {
    命宫: '你的内核主场',
    福德: '内心戏与满足感',
    财帛: '赚钱姿势',
    官禄: '事业舞台',
    田宅: '积蓄与根基',
    夫妻: '亲密关系',
    迁移: '走出舒适区',
  };
  return map[name] ?? name;
}

function formatStars(p: PalaceSnap | undefined): string {
  if (!p) return '—';
  if (p.isEmpty || p.majors.length === 0) return '空象';
  return p.majors
    .map((s) => {
      const bits = [s.name];
      if (s.brightness) bits.push(s.brightness);
      if (s.mutagen) bits.push(`化${s.mutagen}`);
      return bits.join('');
    })
    .join('、');
}

function narrativeForPalace(p: PalaceSnap | undefined, role: string): string {
  if (!p) return `${role}信息暂缺。`;
  if (p.isEmpty || p.majors.length === 0) {
    return `${role}呈空象：不是「没有」，而是更依赖流年四化与贵人来补位。`;
  }
  return p.majors
    .map((s) => {
      const lore = getStarLore(s.name);
      if (!lore) return `${s.name}在此发声。`;
      const mutagen =
        s.mutagen === '忌'
          ? '此处要特别留意执念与内耗。'
          : s.mutagen === '禄'
            ? '此处容易有实质收获。'
            : s.mutagen === '权'
              ? '此处给你推动与话语权。'
              : s.mutagen === '科'
                ? '贵人与名声会从这里敲门。'
                : '';
      return `「${lore.id}·${lore.epithet}」：${lore.trait}${mutagen}`;
    })
    .join(' ');
}

function buildPillar(
  def: (typeof PILLAR_DEFS)[number],
  palaces: PalaceSnap[],
): TheaterPillar {
  const resolved = def.palaceNames.map((n) => ({
    key: n,
    palace: findPalace(palaces, n),
  }));
  let body: string;
  if (def.id === 'lesson') {
    const soul = findPalace(palaces, '命宫');
    const lead = soul?.majors[0] ? getStarLore(soul.majors[0].name) : undefined;
    const hasJi = palaces.some((p) => p.majors.some((s) => s.mutagen === '忌'));
    const hasEmpty = palaces.some((p) => p.isEmpty);
    body = [
      lead
        ? `此生主调靠近「${lead.epithet}」气质的${lead.id}：${lead.counsel}`
        : '此生主调更像海绵——环境与选择会深深塑造你。',
      hasJi
        ? '盘中有化忌落点：那里不是死刑，是你的修炼场——慢、柔、止损。'
        : '把「想成为的人」写成可验证的小实验，比一次定终身更重要。',
      hasEmpty
        ? '有空象宫位：后天贵人与流年四化会在那里补课。'
        : '你的课题不在缺星，而在如何驾驭已点亮的人格。',
      ...resolved.map(({ key, palace }) =>
        narrativeForPalace(palace, displayPalaceName(key, palace)),
      ),
    ].join('\n\n');
  } else {
    body = resolved
      .map(({ key, palace }) =>
        narrativeForPalace(palace, displayPalaceName(key, palace)),
      )
      .join('\n\n');
  }

  const traditional = resolved
    .map(({ key, palace }) => {
      const label = key === '仆役' ? '交友宫' : key === '身宫' ? `身宫→${palace?.name ?? '?'}` : key;
      const stemBranch = palace
        ? `${palace.heavenlyStem}${palace.earthlyBranch}`
        : '—';
      const minors =
        palace?.minors.map((m) => m.name).slice(0, 4).join('、') || '—';
      return `${label}（${stemBranch}）：主星 ${formatStars(palace)}；辅星 ${minors}`;
    })
    .join('\n');

  const hasRisk = resolved.some(
    ({ palace }) =>
      Boolean(palace?.isEmpty) ||
      Boolean(palace?.majors.some((s) => s.mutagen === '忌')),
  );

  return {
    id: def.id,
    title: def.title,
    subtitle: def.subtitle,
    palaceNames: def.palaceNames.map((n) => (n === '仆役' ? '交友' : n)),
    body,
    traditional,
    hasRisk,
  };
}

function buildHeadline(opts: {
  soulPalace: PalaceSnap;
  bodyPalace: PalaceSnap;
  intent: ZiweiIntent;
}): string {
  const majors = opts.soulPalace.majors.map((s) => s.name);
  const lead = majors[0] ? getStarLore(majors[0]) : undefined;
  const bodyHint =
    opts.bodyPalace.name !== '命宫'
      ? `你的行动戏份更多落在「${displayPalaceName(opts.bodyPalace.name, opts.bodyPalace)}」。`
      : '内外戏份叠在一起，更要学会切换节奏。';
  const trait = lead
    ? `你的隐藏人格底色是「${lead.id}·${lead.epithet}」——${lead.myth}`
    : '你的内核像一块海绵：环境与流年对你影响更大。';
  const intentLine =
    opts.intent === 'horizon'
      ? '接下来三年，先收集自己的天赋卡，再决定哪条旷野值得反复走。'
      : '先看清你已点亮的人格卡：你不是缺星，是缺一张读自己的地图。';
  return `${trait}${bodyHint}${intentLine}`;
}

function buildSoulCombo(soulPalace: PalaceSnap): SoulCombo {
  const majors = soulPalace.majors.map((s) => s.name);
  const lead = majors[0] ?? '';
  const co = majors.slice(1);
  const leadLore = lead ? getStarLore(lead) : undefined;
  const coLore = co.map((n) => getStarLore(n)).filter(Boolean);

  let line: string;
  if (!lead) {
    line =
      '你的内核主场呈空象：人格更像海绵，贵人与流年会帮你「点亮」主星感。';
  } else if (co.length === 0) {
    line = `你的内核主星是【${lead}】。${leadLore?.trait ?? ''}单星坐镇时，性格主调更纯粹，也更容易把「${leadLore?.epithet ?? lead}」演到极致。`;
  } else if (lead === '紫微' && co.includes('破军')) {
    line =
      '你的命宫是【紫微】，并且同宫有【破军】。紫微是帝王，破军是将军，这意味着你是一个极具开创精神、凡事亲力亲为的将相之才。你容易在颠覆旧事物的过程中获得巨大的成就感。';
  } else if (lead === '贪狼' && co.includes('紫微')) {
    line =
      '【紫微】与【贪狼】同宫：帝王坐镇却带着灵狐的欲望与交际——你既能定调全局，又天生会把场面玩热。注意欲与权的边界。';
  } else {
    const coNames = co.map((n) => `【${n}】`).join('、');
    const coHint = coLore
      .map((l) => l!.epithet)
      .join('×');
    line = `你的内核主星是【${lead}】，同宫还有${coNames}（${coHint}）。${leadLore?.epithet ?? lead}气质为主，${co.join('、')}在侧翼加戏——这是你的「组合技」人格，不是单一标签。`;
  }

  return { leadStar: lead, coStars: co, line };
}

function buildComfort(palaces: PalaceSnap[], pillars: TheaterPillar[]): ComfortNote[] {
  const notes: ComfortNote[] = [];
  const emptyOnes = palaces.filter((p) => p.isEmpty).map((p) => p.name);
  if (emptyOnes.length > 0) {
    notes.push({
      trigger: `空象：${emptyOnes.slice(0, 3).join('、')}${emptyOnes.length > 3 ? '…' : ''}`,
      line: COMFORT_LINE,
    });
  }
  const ji = palaces.filter((p) => p.majors.some((s) => s.mutagen === '忌'));
  if (ji.length > 0 && notes.length === 0) {
    notes.push({
      trigger: `化忌触及：${ji.map((p) => p.name).slice(0, 3).join('、')}`,
      line: COMFORT_LINE,
    });
  }
  if (pillars.some((p) => p.hasRisk) && notes.length === 0) {
    notes.push({ trigger: '盘面有压力位', line: COMFORT_LINE });
  }
  return notes;
}

type HoroscopeYearly = {
  mutagen?: string[];
  palaceNames?: string[];
  heavenlyStem?: string;
  earthlyBranch?: string;
};

type HoroscopeDecadal = HoroscopeYearly & {
  index?: number;
  name?: string;
};

export function buildAnnual(opts: {
  year: number;
  question: string;
  dateStr: string;
  nextYearDateStr: string;
  astrolabe: { horoscope: (date: string) => { yearly?: HoroscopeYearly } };
  palaces: PalaceSnap[];
}): AnnualAdvice {
  const yearly = opts.astrolabe.horoscope(opts.dateStr).yearly;
  const nextY = opts.astrolabe.horoscope(opts.nextYearDateStr).yearly;
  const mutagen = yearly?.mutagen ?? [];
  const labels = ['禄', '权', '科', '忌'] as const;
  const mutagenLine =
    mutagen.length > 0
      ? mutagen.map((name, i) => `${name}化${labels[i] ?? ''}`).join('、')
      : '流年四化暂缺';

  const focus: string[] = [];
  for (const starName of mutagen) {
    const hit = opts.palaces.find(
      (p) =>
        p.majors.some((s) => s.name === starName) ||
        p.minors.some((s) => s.name === starName),
    );
    if (hit && !focus.includes(hit.name)) focus.push(hit.name);
  }
  const soulOfYear = yearly?.palaceNames?.[4];
  if (soulOfYear && !focus.includes(soulOfYear)) focus.unshift(soulOfYear);

  const q = opts.question.trim() || '我今年适合换工作吗？';
  const hasJob = /工作|换|跳槽|职业|事业|官|升/.test(q);
  const hasLove = /感情|恋爱|结婚|分手|关系/.test(q);
  const jiStar = mutagen[3];
  const luStar = mutagen[0];

  let advice = `今年干支氛围偏「${yearly?.heavenlyStem ?? ''}${yearly?.earthlyBranch ?? ''}」。`;
  if (hasJob) {
    advice +=
      focus.includes('官禄') || focus.includes('迁移')
        ? '事业与旷野线被点亮：适合主动试探新岗位，但别一次梭哈。'
        : '换工作可以想，但先把「为何要换」写清楚，再动。';
  } else if (hasLove) {
    advice +=
      focus.includes('夫妻') || focus.includes('仆役')
        ? '关系议题会被放大：沟通比承诺更重要。'
        : '感情不必强求结果，先稳住自己的节律。';
  } else {
    advice += `把注意力放在 ${focus.slice(0, 2).join('、') || '内核'} 相关的生活议题上。`;
  }
  if (luStar) advice += `流年禄在${luStar}，那里更容易有实质推进。`;
  if (jiStar) advice += `流年忌在${jiStar}，那里适合复盘，不适合硬刚。`;

  const nextMut = nextY?.mutagen ?? [];
  const nextLine =
    nextMut.length > 0
      ? nextMut.map((name, i) => `${name}化${labels[i] ?? ''}`).join('、')
      : '四化待推';
  const forecastGuide = [
    `【${opts.year + 1} 年风向标】干支偏「${nextY?.heavenlyStem ?? ''}${nextY?.earthlyBranch ?? ''}」。`,
    `下一年四化：${nextLine}。`,
    nextMut[0] ? `化禄在${nextMut[0]}：那里适合播种与收获，可主动推进。` : '',
    nextMut[1] ? `化权在${nextMut[1]}：那里需要你站到前面拍板。` : '',
    nextMut[2] ? `化科在${nextMut[2]}：名声与贵人线索，适合展示与求教。` : '',
    nextMut[3]
      ? `化忌在${nextMut[3]}：防坑指南——此处降预期、少硬刚、多复盘；把执念写成可结束的清单。`
      : '整体防坑：别一次梭哈，留 30% 弹性给意外。',
    '记住：流年是风向，不是判决。你可以借风，也可以收帆。',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    year: opts.year,
    question: q,
    mutagenLine,
    focusPalaces: focus,
    advice,
    traditional: [
      `流年：${opts.year}（${yearly?.heavenlyStem ?? ''}${yearly?.earthlyBranch ?? ''}）`,
      `四化：${mutagenLine}`,
      `关注：${focus.join('、') || '—'}`,
    ].join('\n'),
    forecastGuide,
  };
}

export function buildDecade(opts: {
  dateStr: string;
  astrolabe: { horoscope: (date: string) => { decadal?: HoroscopeDecadal } };
  palaces: PalaceSnap[];
}): DecadeAdvice {
  const labels = ['禄', '权', '科', '忌'] as const;
  const h = opts.astrolabe.horoscope(opts.dateStr);
  const d = h.decadal;
  const idx = typeof d?.index === 'number' ? d.index : -1;
  const palace =
    idx >= 0 && idx < opts.palaces.length ? opts.palaces[idx] : undefined;
  const range = palace?.decadalRange;
  const ageFrom = range?.[0] ?? 0;
  const ageTo = range?.[1] ?? 0;
  const palaceName = palace?.name ?? '';
  const theme = DECADE_THEME[palaceName] ?? (palaceName ? '人生主场' : '酝酿中');
  const majorStars = palace?.majors.map((s) => s.name) ?? [];
  const mutagen = d?.mutagen ?? [];
  const mutagenLine =
    mutagen.length > 0
      ? mutagen.map((name, i) => `${name}化${labels[i] ?? ''}`).join('、')
      : '大限四化暂缺';

  const labelName = String(d?.name ?? '大限');
  const started = idx >= 0 && Boolean(palace);

  const starHint =
    majorStars.length > 0
      ? majorStars
          .map((n) => {
            const lore = getStarLore(n);
            return lore ? `「${lore.id}·${lore.epithet}」` : `「${n}」`;
          })
          .join('、')
      : '空象（更依赖大限四化与贵人补位）';

  let lead: string;
  if (!started || !palace) {
    lead =
      '大限尚未正式开跑（或仍在童限酝酿）：先养身体与安全感，不必急着给人生下定论。起运后，课题线会更清晰。';
  } else {
    lead = `你正走在「${theme}」这十年（约虚岁 ${ageFrom}–${ageTo}）。大限主场由 ${starHint} 定调——把注意力放在这条线上，比同时追十二条人生线更省力。`;
  }

  const guide = [
    started
      ? `【十年课题】主线是「${theme}」。这不是判决，是这十年反复出现的功课与机会场。`
      : '【十年课题】起运前以养成为主：睡眠、身体、小范围试错。',
    majorStars.length
      ? `主场星曜：${majorStars.join('、')}。${majorStars
          .map((n) => getStarLore(n)?.counsel)
          .filter(Boolean)
          .slice(0, 2)
          .join(' ')}`
      : '主场空象：用大限四化当导航，少自我贴负面标签。',
    `大限四化：${mutagenLine}。`,
    mutagen[0] ? `化禄在${mutagen[0]}：这十年的「容易到手」处，可主动推进。` : '',
    mutagen[1] ? `化权在${mutagen[1]}：适合你站到前面拍板、扛责。` : '',
    mutagen[2] ? `化科在${mutagen[2]}：名声与贵人线索，展示与求教都有用。` : '',
    mutagen[3]
      ? `化忌在${mutagen[3]}：十年级防坑——此处降预期、少硬刚、多复盘；把执念拆成可结束的小实验。`
      : '防坑：别把十年目标压进一年完成，留弹性给换赛道。',
    '大限是长镜头，流年是短镜头：先对准十年主线，再用流年做微调。',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    started,
    label: labelName,
    ageFrom,
    ageTo,
    theme,
    palaceName,
    majorStars,
    mutagenLine,
    lead,
    guide,
    traditional: [
      `${labelName}${started ? ` ${ageFrom}–${ageTo} 岁` : ''}`,
      `大限命宫落：${palaceName || '—'}（${d?.heavenlyStem ?? ''}${d?.earthlyBranch ?? ''}）`,
      `主星：${majorStars.join('、') || '空'}`,
      `四化：${mutagenLine}`,
    ].join('\n'),
  };
}

export function buildTheater(opts: {
  palaces: PalaceSnap[];
  soulPalace: PalaceSnap;
  bodyPalace: PalaceSnap;
  soulStarName: string;
  bodyStarName: string;
  fiveElementsClass: string;
  intent: ZiweiIntent;
  year: number;
  question: string;
  horoscopeDate: string;
  astrolabe: {
    horoscope: (date: string) => {
      yearly?: HoroscopeYearly;
      decadal?: HoroscopeDecadal;
    };
  };
}): ZiweiTheater {
  const pillars = PILLAR_DEFS.map((d) => buildPillar(d, opts.palaces));
  const headline = buildHeadline({
    soulPalace: opts.soulPalace,
    bodyPalace: opts.bodyPalace,
    intent: opts.intent,
  });
  const comfort = buildComfort(opts.palaces, pillars);
  const annual = buildAnnual({
    year: opts.year,
    question: opts.question,
    dateStr: opts.horoscopeDate,
    nextYearDateStr: `${opts.year + 1}-6-15`,
    astrolabe: opts.astrolabe,
    palaces: opts.palaces,
  });
  const decade = buildDecade({
    dateStr: opts.horoscopeDate,
    astrolabe: opts.astrolabe,
    palaces: opts.palaces,
  });
  const soulCombo = buildSoulCombo(opts.soulPalace);

  const lit = new Set<MajorStarId>();
  for (const p of opts.palaces) {
    for (const s of p.majors) {
      if (isMajorStar(s.name)) lit.add(s.name);
    }
  }

  const spotlightStar =
    soulCombo.leadStar ||
    opts.soulPalace.majors[0]?.name ||
    [...lit][0] ||
    '紫微';

  return {
    headline,
    pillars,
    comfort,
    annual,
    decade,
    litMajorStars: [...lit],
    soulCombo,
    spotlightStar,
  };
}
