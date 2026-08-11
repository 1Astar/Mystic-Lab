/**
 * 通行派（default）vs 中州派（zhongzhou）神煞对照
 * 依据 iztro 安星分支（algorithm），本 App 排盘默认通行派。
 */

export type SchoolId = 'default' | 'zhongzhou';

export type SchoolContrastRow = {
  id: string;
  topic: string;
  defaultLabel: string;
  zhongzhouLabel: string;
  /** 点进图鉴的神煞 id（可多枚） */
  relatedIds: string[];
  gloss: string;
};

/** 本产品排盘当前采用 */
export const APP_SHENSHA_SCHOOL: SchoolId = 'default';

export const SCHOOL_META: Record<
  SchoolId,
  { title: string; blurb: string }
> = {
  default: {
    title: '通行派',
    blurb: '以《紫微斗数全书》系安星为底（iztro algorithm=default）。随心而行排盘目前用这套。',
  },
  zhongzhou: {
    title: '中州派',
    blurb: '中州派安星法（iztro algorithm=zhongzhou）。图鉴收录对照，便于看他盘/他书时不混淆。',
  },
};

export const SCHOOL_OVERVIEW = {
  title: '通行派 × 中州派 · 神煞对照',
  oneLiner: '同盘不同派，神煞名目会差几颗——先认派，再读星。',
  body: [
    '随心而行排盘默认「通行派」：盘上常见「截路」和「空亡」两颗星成对出现。',
    '中州派不用这两颗，改成只安一颗叫「截空」；另有劫杀、大耗等特有安法。',
    '岁前十二里：通行称「大耗」，中州同位置常称「岁破」。',
    '天使 / 天伤：两派安宫诀不同——阴男阳女时，中州会互换疾厄与奴仆落点。',
    '含义相近不等于安宫相同。对照他书时，以该派盘面标注为准，勿混读。',
  ].join('\n'),
};

/** 对照表（图鉴神煞桶置顶） */
export const SCHOOL_CONTRAST_ROWS: SchoolContrastRow[] = [
  {
    id: 'jielu-jiekong',
    topic: '截路空亡 ↔ 截空',
    defaultLabel: '截路 + 空亡（两颗）',
    zhongzhouLabel: '截空（一颗）',
    relatedIds: ['截路', '空亡', '截空'],
    gloss:
      '意思差不多：路被挡住、事不好直通，宜改道。差别在「怎么安星」——通行派用年干推出两颗（截路、空亡）；中州派只安一颗「截空」（阳干落在原截路位，阴干落在原空亡位）。本 App 默认通行派，所以盘上常成对见截路与空亡；读中州盘时改看截空即可。',
  },
  {
    id: 'xunkong',
    topic: '旬空',
    defaultLabel: '有旬空',
    zhongzhouLabel: '有旬空',
    relatedIds: ['旬空'],
    gloss:
      '两派都有「旬空」，但和上面的截路/截空不是同一套名字。看到「空」字先分清：旬空是干支旬里的空，截空/空亡是另一套安宫。',
  },
  {
    id: 'jiesha',
    topic: '劫杀',
    defaultLabel: '不另安杂曜「劫杀」',
    zhongzhouLabel: '安杂曜「劫杀」',
    relatedIds: ['劫杀', '劫煞'],
    gloss:
      '中州会多安一颗杂曜「劫杀」。另外还有将前十二里的「劫煞」——名字像，但属于另一套系统，不要当成同一颗星。',
  },
  {
    id: 'dahao-adj',
    topic: '大耗（杂曜）',
    defaultLabel: '不另安杂曜大耗',
    zhongzhouLabel: '另安杂曜「大耗」',
    relatedIds: ['大耗'],
    gloss: '中州把大耗再安到杂曜位；通行盘上大耗更多见于岁前十二神名。',
  },
  {
    id: 'suipo',
    topic: '岁前：大耗 / 岁破',
    defaultLabel: '岁前神名「大耗」',
    zhongzhouLabel: '同位置名「岁破」',
    relatedIds: ['大耗', '岁破'],
    gloss: '岁前十二同一格：通行叫大耗，中州叫岁破。都是耗散/冲破提醒，先认名再对宫。',
  },
  {
    id: 'longde',
    topic: '龙德',
    defaultLabel: '岁前十二见龙德',
    zhongzhouLabel: '岁前有 + 再作杂曜安出',
    relatedIds: ['龙德'],
    gloss: '龙德两派岁前都有；中州还会按岁前落点再标一枚杂曜龙德，盘面更显眼。',
  },
  {
    id: 'tianshi-tianshang',
    topic: '天使 · 天伤',
    defaultLabel: '疾厄天使、奴仆天伤（常诀）',
    zhongzhouLabel: '阴男阳女时互换两宫',
    relatedIds: ['天使', '天伤'],
    gloss:
      '通行常诀：天使疾厄、天伤奴仆。中州对阴男阳女改为天伤疾厄、天使奴仆。同名星，落宫可能对调。',
  },
];

/** 某神煞的流派标注（详情页用） */
export type ShenshaSchoolTag = {
  school: SchoolId | 'both' | 'alias';
  badge: string;
  note: string;
  contrastId?: string;
};

const TAGS: Record<string, ShenshaSchoolTag> = {
  截路: {
    school: 'default',
    badge: '通行派',
    note: '通行盘里常和「空亡」成对出现。中州派不安这颗，改看「截空」。意思：路不太顺，宜改道。',
    contrastId: 'jielu-jiekong',
  },
  空亡: {
    school: 'default',
    badge: '通行派',
    note: '通行盘里常和「截路」成对（按年干推）。不要和「旬空」「截空」混成同一个。',
    contrastId: 'jielu-jiekong',
  },
  截空: {
    school: 'zhongzhou',
    badge: '中州派',
    note: '中州特有：用一颗「截空」代替通行的截路+空亡。本 App 默认盘通常看不到；读中州盘时看这条。',
    contrastId: 'jielu-jiekong',
  },
  旬空: {
    school: 'both',
    badge: '两派皆有',
    note: '和截路/截空不是同一套。两派都安。',
    contrastId: 'xunkong',
  },
  劫杀: {
    school: 'zhongzhou',
    badge: '中州派',
    note: '中州杂曜。将前还有「劫煞」——名字像，系统不同，别直接等同。',
    contrastId: 'jiesha',
  },
  劫煞: {
    school: 'both',
    badge: '将前十二',
    note: '将前神，两派岁/将系皆见。中州另有杂曜「劫杀」。',
    contrastId: 'jiesha',
  },
  岁破: {
    school: 'zhongzhou',
    badge: '中州派·岁前',
    note: '岁前十二中，通行同格叫「大耗」。',
    contrastId: 'suipo',
  },
  大耗: {
    school: 'both',
    badge: '名同派异',
    note: '通行：岁前神名。中州：岁前改称岁破，另可安杂曜大耗。',
    contrastId: 'suipo',
  },
  龙德: {
    school: 'both',
    badge: '岁前为主',
    note: '两派岁前皆有；中州还会作杂曜再标一次。',
    contrastId: 'longde',
  },
  天使: {
    school: 'both',
    badge: '安宫有差',
    note: '中州阴男阳女时与天伤互换疾厄/奴仆。',
    contrastId: 'tianshi-tianshang',
  },
  天伤: {
    school: 'both',
    badge: '安宫有差',
    note: '中州阴男阳女时与天使互换疾厄/奴仆。',
    contrastId: 'tianshi-tianshang',
  },
};

export function getShenshaSchoolTag(name: string): ShenshaSchoolTag | undefined {
  const key = name.replace(/星$/, '').trim();
  return TAGS[key];
}

export function getContrastRow(id: string): SchoolContrastRow | undefined {
  return SCHOOL_CONTRAST_ROWS.find((r) => r.id === id);
}

export function listContrastRelated(name: string): SchoolContrastRow[] {
  const key = name.replace(/星$/, '').trim();
  return SCHOOL_CONTRAST_ROWS.filter((r) => r.relatedIds.includes(key));
}
