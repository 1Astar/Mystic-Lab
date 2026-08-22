/**
 * 排盘神煞扩展计算（相对 SHENSHA_ATLAS 补真实落柱）
 * 规则取通行查表；与 shensha.ts 核心表并存，由 shenshaForBranch 汇总。
 */
import { changShengOf, nayinOf, xunKongOf } from './pillar-meta.ts';

const BRANCH_ORDER = [
  '子',
  '丑',
  '寅',
  '卯',
  '辰',
  '巳',
  '午',
  '未',
  '申',
  '酉',
  '戌',
  '亥',
] as const;

const STEM_HE: Record<string, string> = {
  甲: '己',
  己: '甲',
  乙: '庚',
  庚: '乙',
  丙: '辛',
  辛: '丙',
  丁: '壬',
  壬: '丁',
  戊: '癸',
  癸: '戊',
};

const BRANCH_LIU_HE: Record<string, string> = {
  子: '丑',
  丑: '子',
  寅: '亥',
  亥: '寅',
  卯: '戌',
  戌: '卯',
  辰: '酉',
  酉: '辰',
  巳: '申',
  申: '巳',
  午: '未',
  未: '午',
};

/** 月支 → 解神（正月申顺行） */
const JIE_SHEN: Record<string, string> = {
  寅: '申',
  卯: '酉',
  辰: '戌',
  巳: '亥',
  午: '子',
  未: '丑',
  申: '寅',
  酉: '卯',
  戌: '辰',
  亥: '巳',
  子: '午',
  丑: '未',
};

/** 月支 → 天医（前一位） */
function tianYiYiOfMonth(monthBranch: string): string {
  const i = BRANCH_ORDER.indexOf(monthBranch as (typeof BRANCH_ORDER)[number]);
  if (i < 0) return '';
  return BRANCH_ORDER[(i + 11) % 12]!;
}

const GUO_YIN: Record<string, string> = {
  甲: '戌',
  乙: '亥',
  丙: '丑',
  丁: '寅',
  戊: '丑',
  己: '寅',
  庚: '辰',
  辛: '巳',
  壬: '未',
  癸: '申',
};

const XUE_TANG: Record<string, string> = {
  甲: '亥',
  乙: '午',
  丙: '寅',
  丁: '酉',
  戊: '寅',
  己: '酉',
  庚: '巳',
  辛: '子',
  壬: '申',
  癸: '卯',
};

const CI_GUAN: Record<string, string> = {
  甲: '寅',
  乙: '巳',
  丙: '申',
  丁: '亥',
  戊: '申',
  己: '亥',
  庚: '巳',
  辛: '申',
  壬: '亥',
  癸: '寅',
};

const TIAN_GUAN: Record<string, string> = {
  甲: '未',
  乙: '辰',
  丙: '巳',
  丁: '寅',
  戊: '卯',
  己: '子',
  庚: '亥',
  辛: '申',
  壬: '酉',
  癸: '午',
};

/** 流霞（日干） */
const LIU_XIA: Record<string, string> = {
  甲: '酉',
  乙: '戌',
  丙: '未',
  丁: '申',
  戊: '巳',
  己: '午',
  庚: '辰',
  辛: '卯',
  壬: '亥',
  癸: '寅',
};

/** 血刃（日干） */
const XUE_REN: Record<string, string> = {
  甲: '卯',
  乙: '辰',
  丙: '午',
  丁: '未',
  戊: '午',
  己: '未',
  庚: '酉',
  辛: '戌',
  壬: '子',
  癸: '丑',
};

/** 截路空亡（日干 → 两支） */
const JIE_LU: Record<string, string[]> = {
  甲: ['申', '酉'],
  己: ['申', '酉'],
  乙: ['午', '未'],
  庚: ['午', '未'],
  丙: ['辰', '巳'],
  辛: ['辰', '巳'],
  丁: ['寅', '卯'],
  壬: ['寅', '卯'],
  戊: ['子', '丑'],
  癸: ['子', '丑'],
};

/** 五鬼（日干） */
const WU_GUI: Record<string, string> = {
  甲: '辰',
  乙: '巳',
  丙: '申',
  丁: '酉',
  戊: '亥',
  己: '子',
  庚: '寅',
  辛: '卯',
  壬: '巳',
  癸: '午',
};

/** 阴差阳错日 */
const YIN_CHA_YANG_CUO = new Set([
  '丙子',
  '丁丑',
  '戊寅',
  '辛卯',
  '壬辰',
  '癸巳',
  '丙午',
  '丁未',
  '戊申',
  '辛酉',
  '壬戌',
  '癸亥',
]);

const KUI_GANG = new Set(['庚辰', '庚戌', '壬辰', '戊戌']);

const JIN_SHEN_DAYS = new Set(['甲子', '甲午', '己卯', '己酉']);
const TUI_SHEN_DAYS = new Set(['庚子', '庚午', '癸卯', '癸酉']);

const TIAN_MA = new Set(['寅', '申', '巳', '亥']);

/** 月支 → 天德（干或支） */
const TIAN_DE_BY_MONTH: Record<string, string> = {
  寅: '丁',
  卯: '申',
  辰: '壬',
  巳: '辛',
  午: '亥',
  未: '甲',
  申: '癸',
  酉: '寅',
  戌: '丙',
  亥: '乙',
  子: '巳',
  丑: '庚',
};

/** 月支 → 月德天干 */
const YUE_DE_BY_MONTH: Record<string, string> = {
  寅: '丙',
  午: '丙',
  戌: '丙',
  申: '壬',
  子: '壬',
  辰: '壬',
  亥: '甲',
  卯: '甲',
  未: '甲',
  巳: '庚',
  酉: '庚',
  丑: '庚',
};

/** 日干 → 仓廪库支 */
const CANG_LIN_KU: Record<string, string> = {
  甲: '未',
  乙: '未',
  丙: '戌',
  丁: '戌',
  戊: '戌',
  己: '戌',
  庚: '丑',
  辛: '丑',
  壬: '辰',
  癸: '辰',
};

function branchFrom(base: string, delta: number): string {
  const i = BRANCH_ORDER.indexOf(base as (typeof BRANCH_ORDER)[number]);
  if (i < 0) return '';
  return BRANCH_ORDER[(i + delta + 12) % 12]!;
}

function seasonTianShe(monthBranch: string): string {
  if (['寅', '卯', '辰'].includes(monthBranch)) return '戊寅';
  if (['巳', '午', '未'].includes(monthBranch)) return '甲午';
  if (['申', '酉', '戌'].includes(monthBranch)) return '戊申';
  if (['亥', '子', '丑'].includes(monthBranch)) return '甲子';
  return '';
}

function nayinWx(nayin: string): string {
  if (!nayin || nayin === '—') return '';
  const last = nayin.slice(-1);
  return ['金', '木', '水', '火', '土'].includes(last) ? last : '';
}

export type ExtraShenshaOpts = {
  branch: string;
  stem: string;
  dayStem: string;
  yearBranch: string;
  dayBranch: string;
  monthBranch: string;
  yearStem?: string;
  yearNayin?: string;
  dayGz?: string;
  /** 已算出的基础神煞名（用于 alias） */
  baseNames: ReadonlySet<string>;
};

/** 追加扩展神煞到 out */
export function appendExtraShensha(out: string[], opts: ExtraShenshaOpts): void {
  const {
    branch,
    stem,
    dayStem,
    yearBranch,
    dayBranch,
    monthBranch,
    yearStem = '',
    yearNayin = '',
    baseNames,
  } = opts;
  const dayGz = opts.dayGz || `${dayStem}${dayBranch}`;

  // —— 月令类 ——
  if (monthBranch) {
    const tianDe = TIAN_DE_BY_MONTH[monthBranch];
    if (tianDe) {
      const heStem = STEM_HE[tianDe];
      const heBranch = BRANCH_LIU_HE[tianDe];
      if ((heStem && stem === heStem) || (heBranch && branch === heBranch)) {
        out.push('天德合');
      }
    }
    const yueDe = YUE_DE_BY_MONTH[monthBranch];
    if (yueDe) {
      const he = STEM_HE[yueDe];
      if (he && stem === he) out.push('月德合');
    }
    if (tianYiYiOfMonth(monthBranch) === branch) out.push('天医');
    if (JIE_SHEN[monthBranch] === branch) out.push('解神');
    const she = seasonTianShe(monthBranch);
    if (she && dayGz === she) out.push('天赦');
  }

  // —— 日干落支类 ——
  if (GUO_YIN[dayStem] === branch) out.push('国印');
  if (XUE_TANG[dayStem] === branch) out.push('学堂');
  if (CI_GUAN[dayStem] === branch) out.push('词馆');
  if (TIAN_GUAN[dayStem] === branch) out.push('天官');
  if (LIU_XIA[dayStem] === branch) out.push('流霞');
  if (XUE_REN[dayStem] === branch) out.push('血刃');
  if (WU_GUI[dayStem] === branch) out.push('五鬼');
  if ((JIE_LU[dayStem] ?? []).includes(branch)) out.push('截路空亡');

  // 飞刃 = 羊刃冲位
  const yangRenBranch = (
    {
      甲: '卯',
      乙: '寅',
      丙: '午',
      丁: '巳',
      戊: '午',
      己: '巳',
      庚: '酉',
      辛: '申',
      壬: '子',
      癸: '亥',
    } as Record<string, string>
  )[dayStem];
  if (yangRenBranch && branchFrom(yangRenBranch, 6) === branch) out.push('飞刃');

  // —— 年支十二神类补 ——
  if (branchFrom(yearBranch, 2) === branch) out.push('丧门');
  if (branchFrom(yearBranch, 5) === branch) out.push('死符');
  if (branchFrom(yearBranch, 11) === branch) out.push('病符');
  if (branchFrom(yearBranch, 3) === branch) out.push('披麻');
  if (branchFrom(yearBranch, 6) === branch) out.push('大耗');
  // 元辰：先按岁前一位（常见阳男阴女口径之一）
  if (branchFrom(yearBranch, -1) === branch || branchFrom(yearBranch, 1) === branch) {
    out.push('元辰');
  }
  // 勾绞：岁±3
  if (branchFrom(yearBranch, 3) === branch || branchFrom(yearBranch, -3) === branch) {
    out.push('勾绞');
    out.push('绞煞');
  }

  // 孤辰 / 寡宿分列
  const guMap: Record<string, { gu: string; gua: string }> = {
    寅: { gu: '巳', gua: '丑' },
    卯: { gu: '巳', gua: '丑' },
    辰: { gu: '巳', gua: '丑' },
    巳: { gu: '申', gua: '辰' },
    午: { gu: '申', gua: '辰' },
    未: { gu: '申', gua: '辰' },
    申: { gu: '亥', gua: '未' },
    酉: { gu: '亥', gua: '未' },
    戌: { gu: '亥', gua: '未' },
    亥: { gu: '寅', gua: '戌' },
    子: { gu: '寅', gua: '戌' },
    丑: { gu: '寅', gua: '戌' },
  };
  const gp = guMap[yearBranch];
  if (gp?.gu === branch) out.push('孤辰');
  if (gp?.gua === branch) out.push('寡宿');

  // 隔角：寅巳申亥见丑辰未戌 等——用年支后一位丑类
  // 通行：寅见丑、卯见辰… 简化为年支库墓邻
  if (branchFrom(yearBranch, -1) === branch) {
    // already 元辰; 隔角另用三合库？
  }
  // 隔角：以年支起，见「库」前一位——用 寅巳申亥 → 丑，卯午酉子 → 辰，辰未戌丑 → 未？ 
  // 简化通行：年支对宫的前一位
  if (branchFrom(yearBranch, 5) === branch) {
    // overlap 死符 — use 隔角 as year+4 官符位? skip duplicate
  }
  // 隔角：寅卯辰年见丑，巳午未见辰，申酉戌见未，亥子丑见戌
  const geJiao: Record<string, string> = {
    寅: '丑',
    卯: '丑',
    辰: '丑',
    巳: '辰',
    午: '辰',
    未: '辰',
    申: '未',
    酉: '未',
    戌: '未',
    亥: '戌',
    子: '戌',
    丑: '戌',
  };
  if (geJiao[yearBranch] === branch) out.push('隔角');

  // 天马
  if (TIAN_MA.has(branch) && baseNames.has('驿马')) out.push('天马');
  if (TIAN_MA.has(branch) && (yearBranch === branch || dayBranch === branch)) {
    // 寅申巳亥本身也可标天马（四生）
    if (!out.includes('天马')) out.push('天马');
  }

  // 马头带剑：本柱同时驿马+羊刃，或驿马且见血刃/飞刃
  if (baseNames.has('驿马') && (baseNames.has('羊刃') || out.includes('飞刃') || out.includes('血刃'))) {
    out.push('马头带剑');
  }

  // 天罗地网（年命纳音）
  const ywx = nayinWx(yearNayin || (yearStem ? nayinOf(`${yearStem}${yearBranch}`) : ''));
  if (ywx === '火' && (branch === '戌' || branch === '亥')) {
    out.push('天罗');
    out.push('天罗地网');
  }
  if ((ywx === '水' || ywx === '土') && (branch === '辰' || branch === '巳')) {
    out.push('地网');
    out.push('天罗地网');
  }

  // 空亡 / 旬空（日柱旬空）
  const xk = xunKongOf(dayGz);
  if (xk && xk !== '—' && xk.includes(branch)) {
    out.push('空亡');
    out.push('旬空');
  }

  // 日柱类（标在日支所在柱）
  if (branch === dayBranch) {
    if (KUI_GANG.has(dayGz)) out.push('魁罡');
    if (YIN_CHA_YANG_CUO.has(dayGz)) out.push('阴差阳错');
    if (JIN_SHEN_DAYS.has(dayGz)) out.push('进神');
    if (TUI_SHEN_DAYS.has(dayGz)) out.push('退神');
  }
  // 十二长生主题（按日干对支）
  const stage = changShengOf(dayStem, branch);
  if (stage === '长生') out.push('长生');
  if (stage === '沐浴') out.push('沐浴');
  if (stage === '帝旺') out.push('帝旺');
  if (stage === '养') out.push('养神');
  if (stage === '胎') out.push('胎神');
  if (stage === '墓') out.push('墓库');

  // 三奇贵人：柱干属天上/地下/人中三奇之一（整盘是否成局另议）
  if (['甲', '戊', '庚', '乙', '丙', '丁', '壬', '癸', '辛'].includes(stem)) {
    out.push('三奇贵人');
  }

  // 风流：与桃花同落（通行对照入口）
  if (baseNames.has('桃花') || baseNames.has('咸池')) out.push('风流');

  // 文曲：常与文昌同宫或对宫——简化为文昌冲位
  if (baseNames.has('文昌')) {
    // already on 文昌 branch; 文曲用日干另一套：甲巳同源? 用 文昌对冲
  }
  const wenQu: Record<string, string> = {
    甲: '亥',
    乙: '子',
    丙: '寅',
    丁: '卯',
    戊: '寅',
    己: '卯',
    庚: '巳',
    辛: '午',
    壬: '申',
    癸: '酉',
  };
  if (wenQu[dayStem] === branch) out.push('文曲');

  // 台阁：学堂同见或国印邻——简化学堂同支
  if (baseNames.has('学堂') || XUE_TANG[dayStem] === branch) {
    if (XUE_TANG[dayStem] === branch) out.push('台阁');
  }

  // 权星 ≈ 将星
  if (baseNames.has('将星')) out.push('权星');

  // 紫微：简化为日支帝旺
  if (stage === '帝旺' && branch === dayBranch) out.push('紫微');

  // 仓廪：日干之库
  if (CANG_LIN_KU[dayStem] === branch) {
    out.push('仓廪');
    out.push('富星');
  }

  // 挂剑 ≈ 白虎
  if (baseNames.has('白虎')) out.push('挂剑');

  // 六厄：申子辰→卯，寅午戌→酉，巳酉丑→午，亥卯未→子（灾煞之冲？）
  // 用三合：申子辰见卯
  const liuE: Record<string, string> = {
    子: '卯',
    辰: '卯',
    申: '卯',
    寅: '酉',
    午: '酉',
    戌: '酉',
    巳: '午',
    酉: '午',
    丑: '午',
    亥: '子',
    卯: '子',
    未: '子',
  };
  if (liuE[yearBranch] === branch || liuE[dayBranch] === branch) out.push('六厄');

  // —— Alias / 复合入口（真实落点已有基础星）——
  if (baseNames.has('桃花') || baseNames.has('咸池')) out.push('咸池桃花');
  if (baseNames.has('红鸾') || baseNames.has('天喜')) out.push('天喜红鸾');
  if (baseNames.has('学堂') || out.includes('学堂') || out.includes('词馆')) out.push('词馆学堂');
  if (baseNames.has('羊刃')) out.push('羊刃（凶读）');
  if (baseNames.has('华盖') && baseNames.has('驿马')) out.push('华盖（驿）');
  if (baseNames.has('驿马')) out.push('动态');

  // 童子：简化——日支见寅卯未亥等且月令春季？ 慎断版：日干甲乙见寅卯午未
  if (['甲', '乙'].includes(dayStem) && ['寅', '卯', '午', '未'].includes(branch)) {
    out.push('童子');
  }
  if (['戊', '己'].includes(dayStem) && ['辰', '戌', '丑', '未'].includes(branch)) {
    out.push('童子');
  }
}

/** 本模块能产出的神煞名（含 alias） */
export const EXTRA_SHENSHA_NAMES: readonly string[] = [
  '天德合',
  '月德合',
  '天医',
  '解神',
  '天赦',
  '国印',
  '学堂',
  '词馆',
  '天官',
  '流霞',
  '血刃',
  '五鬼',
  '截路空亡',
  '飞刃',
  '丧门',
  '死符',
  '病符',
  '披麻',
  '大耗',
  '元辰',
  '勾绞',
  '绞煞',
  '孤辰',
  '寡宿',
  '隔角',
  '天马',
  '马头带剑',
  '天罗',
  '地网',
  '天罗地网',
  '空亡',
  '旬空',
  '魁罡',
  '阴差阳错',
  '进神',
  '退神',
  '长生',
  '沐浴',
  '帝旺',
  '养神',
  '胎神',
  '墓库',
  '文曲',
  '台阁',
  '权星',
  '紫微',
  '仓廪',
  '富星',
  '挂剑',
  '六厄',
  '三奇贵人',
  '风流',
  '咸池桃花',
  '天喜红鸾',
  '词馆学堂',
  '羊刃（凶读）',
  '华盖（驿）',
  '动态',
  '童子',
];

const STEM_ORDER_LOOKUP = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;

function stemMapLookupLines(map: Record<string, string>): string[] {
  const byBranch = new Map<string, string[]>();
  for (const stem of STEM_ORDER_LOOKUP) {
    const br = map[stem];
    if (!br) continue;
    const list = byBranch.get(br) ?? [];
    list.push(stem);
    byBranch.set(br, list);
  }
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const stem of STEM_ORDER_LOOKUP) {
    const br = map[stem];
    if (!br || seen.has(br)) continue;
    seen.add(br);
    lines.push(`${byBranch.get(br)!.join('、')}日 → ${br}`);
  }
  return lines;
}

function monthBranchLookupLines(map: Record<string, string>, label: string): string[] {
  return BRANCH_ORDER.map((b) => {
    const hit = map[b];
    return hit ? `${b}月 → ${hit}（${label}）` : '';
  }).filter(Boolean);
}

/** 图鉴查法表：学堂 */
export function xueTangLookupLines(): string[] {
  return stemMapLookupLines(XUE_TANG);
}

/** 图鉴查法表：词馆 */
export function ciGuanLookupLines(): string[] {
  return stemMapLookupLines(CI_GUAN);
}

/** 图鉴查法表：文曲 */
export function wenQuLookupLines(): string[] {
  return stemMapLookupLines({
    甲: '亥',
    乙: '子',
    丙: '寅',
    丁: '卯',
    戊: '寅',
    己: '卯',
    庚: '巳',
    辛: '午',
    壬: '申',
    癸: '酉',
  });
}

/** 图鉴查法表：国印 */
export function guoYinLookupLines(): string[] {
  return stemMapLookupLines(GUO_YIN);
}

/** 图鉴查法表：解神 */
export function jieShenLookupLines(): string[] {
  return monthBranchLookupLines(JIE_SHEN, '解神');
}

/** 图鉴查法表：天医（月支前一位） */
export function tianYiYiLookupLines(): string[] {
  return BRANCH_ORDER.map((b) => {
    const hit = tianYiYiOfMonth(b);
    return hit ? `${b}月 → ${hit}（天医）` : '';
  }).filter(Boolean);
}

/** 图鉴查法表：魁罡 */
export function kuiGangLookupLines(): string[] {
  return ['日柱干支为：庚辰、庚戌、壬辰、戊戌 → 标魁罡（日柱本身）'];
}

/** 图鉴查法表：空亡（旬空口诀级） */
export function kongWangLookupLines(): string[] {
  return [
    '以日柱所在旬为准：一旬十日，两支落空',
    '甲子旬戌亥空 · 甲戌旬申酉空 · 甲申旬午未空',
    '甲午旬辰巳空 · 甲辰旬寅卯空 · 甲寅旬子丑空',
    '落柱见空亡支：标「力气虚着」；宜借实处，勿一律当凶',
  ];
}

/** 图鉴查法表：血刃 */
export function xueRenLookupLines(): string[] {
  return stemMapLookupLines(XUE_REN);
}

/** 图鉴查法表：流霞 */
export function liuXiaLookupLines(): string[] {
  return stemMapLookupLines(LIU_XIA);
}

/** 图鉴查法表：截路空亡 */
export function jieLuKongWangLookupLines(): string[] {
  return STEM_ORDER_LOOKUP.map((stem) => {
    const pair = JIE_LU[stem];
    return pair ? `${stem}日 → ${pair.join('、')}` : '';
  }).filter(Boolean);
}

/** 图鉴查法表：天赦 */
export function tianSheLookupLines(): string[] {
  return [
    '春（寅卯辰月）日柱戊寅为天赦',
    '夏（巳午未月）日柱甲午为天赦',
    '秋（申酉戌月）日柱戊申为天赦',
    '冬（亥子丑月）日柱甲子为天赦',
  ];
}

/** 图鉴查法表：三奇贵人 */
export function sanQiLookupLines(): string[] {
  return [
    '天上三奇：乙丙丁（柱干见其一可标入口）',
    '地下三奇：甲戊庚',
    '人中三奇：壬癸辛',
    '成局与否另论；本产品先标「三奇气场入口」',
  ];
}

/** 图鉴查法表：天马 */
export function tianMaLookupLines(): string[] {
  return [
    '四生支寅申巳亥见之为天马气场',
    '常与驿马同看：动中求变、远行调动',
    '落柱标「远行动象」，不是必升迁',
  ];
}

/** 图鉴查法表：沐浴（十二长生） */
export function muYuLookupLines(): string[] {
  return [
    '按日干对地支取十二长生「沐浴」位',
    '甲木沐浴在子、乙木在巳、丙戊在卯、丁己在申…',
    '落柱标「曝光/敏感气场」，勿单断情欲',
  ];
}

/** 图鉴查法表：风流（对照桃花） */
export function fengLiuLookupLines(): string[] {
  return [
    '本产品：与桃花/咸池同落时标风流（对照入口）',
    '查法锚点同桃花：年/日支入三合取桃花支',
    '标「魅力与是非提醒」，不作出轨判决',
  ];
}

/** 图鉴查法表：天德合 */
export function tianDeHeLookupLines(): string[] {
  return BRANCH_ORDER.map((m) => {
    const td = TIAN_DE_BY_MONTH[m];
    if (!td) return '';
    const heStem = STEM_HE[td];
    const heBranch = BRANCH_LIU_HE[td];
    const he = heStem ? `天干见${heStem}` : heBranch ? `地支见${heBranch}` : '';
    return he ? `${m}月天德为${td} → ${he}（天德合）` : '';
  }).filter(Boolean);
}

/** 图鉴查法表：月德合 */
export function yueDeHeLookupLines(): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const m of BRANCH_ORDER) {
    const yd = YUE_DE_BY_MONTH[m];
    if (!yd || seen.has(yd)) continue;
    seen.add(yd);
    const he = STEM_HE[yd];
    const months = BRANCH_ORDER.filter((b) => YUE_DE_BY_MONTH[b] === yd).join('');
    if (he) lines.push(`${months}月月德${yd} → 天干见${he}（月德合）`);
  }
  return lines;
}

/** 图鉴查法表：台阁（本产品≈学堂同支） */
export function taiGeLookupLines(): string[] {
  return [
    '本产品：与学堂同落支时标台阁（仕途/平台入口）',
    ...stemMapLookupLines(XUE_TANG).map((l) => l.replace('日 →', '日学堂 →')),
    '标「机构平台气场」，不是必升官',
  ];
}

/** 图鉴查法表：权星（≈将星） */
export function quanXingLookupLines(): string[] {
  return [
    '本产品：将星同见时标权星（决策场对照入口）',
    '查法锚点同将星：年/日支入三合取将星支',
    '标「掌控与决策提醒」，勿单断必掌权',
  ];
}

/** 图鉴查法表：天官 */
export function tianGuanLookupLines(): string[] {
  return stemMapLookupLines(TIAN_GUAN);
}

/** 图鉴查法表：仓廪 */
export function cangLinLookupLines(): string[] {
  return stemMapLookupLines(CANG_LIN_KU);
}

/** 图鉴查法表：飞财（图鉴入口） */
export function feiCaiLookupLines(): string[] {
  return [
    '本产品：图鉴入口词 · 对照十神财星与流年动象',
    '标「财来财去/横财提醒」，不是必发横财',
    '宜合偏财/正财与仓廪看；忌恐吓式破财断语',
  ];
}

/** 图鉴查法表：阴差阳错 */
export function yinChaYangCuoLookupLines(): string[] {
  return [
    '日柱落下列之一标阴差阳错（婚恋时机拧巴入口）',
    `日柱：${[...YIN_CHA_YANG_CUO].join('、')}`,
    '标「错位提醒」；慎断婚姻吉凶，勿恐吓',
  ];
}

function yearOffsetLookupLinesLocal(delta: number, label: string): string[] {
  return BRANCH_ORDER.map((b) => `年支${b} → ${label}${branchFrom(b, delta)}`);
}

/** 图鉴查法表：病符（年支前一位，顺数11） */
export function bingFuLookupLines(): string[] {
  return [
    ...yearOffsetLookupLinesLocal(11, '病符'),
    '标「小恙/需养护提醒」，非字面必病',
  ];
}

/** 图鉴查法表：死符（年支+5） */
export function siFuLookupLines(): string[] {
  return [
    ...yearOffsetLookupLinesLocal(5, '死符'),
    '标「停滞/沉重提醒」，非字面生死',
  ];
}

/** 图鉴查法表：丧门（年支+2） */
export function sangMenLookupLines(): string[] {
  return [
    ...yearOffsetLookupLinesLocal(2, '丧门'),
    '标「哀感/告别场提醒」，慎断丧事',
  ];
}

/** 图鉴查法表：大耗（年支+6冲位） */
export function daHaoLookupLines(): string[] {
  return [
    ...yearOffsetLookupLinesLocal(6, '大耗'),
    '标「破耗/流失提醒」，宜记账备份，非必破财',
  ];
}

/** 图鉴查法表：绞煞（年支±3） */
export function jiaoShaLookupLines(): string[] {
  return [
    '年支前后第三位为绞煞（与勾绞同落点）',
    ...BRANCH_ORDER.map(
      (b) => `年支${b} → ${branchFrom(b, 3)}、${branchFrom(b, -3)}`,
    ),
    '标「纠缠难解提醒」，宜拆题降温',
  ];
}

/** 图鉴查法表：五鬼 */
export function wuGuiLookupLines(): string[] {
  return stemMapLookupLines(WU_GUI);
}

/** 图鉴查法表：天罗 */
export function tianLuoLookupLines(): string[] {
  return [
    '年命纳音属火，柱支见戌或亥 → 天罗',
    '标「困局/难脱身提醒」，宜换道备份',
    '常与天罗地网同看；勿恐吓式断绝路',
  ];
}

/** 图鉴查法表：地网 */
export function diWangLookupLines(): string[] {
  return [
    '年命纳音属水或土，柱支见辰或巳 → 地网',
    '标「困局落地/纠缠提醒」，宜拆小步',
    '常与天罗地网同看；勿恐吓式断绝路',
  ];
}

const YANG_REN_MAP: Record<string, string> = {
  甲: '卯',
  乙: '寅',
  丙: '午',
  丁: '巳',
  戊: '午',
  己: '巳',
  庚: '酉',
  辛: '申',
  壬: '子',
  癸: '亥',
};

const GE_JIAO: Record<string, string> = {
  寅: '丑',
  卯: '丑',
  辰: '丑',
  巳: '辰',
  午: '辰',
  未: '辰',
  申: '未',
  酉: '未',
  戌: '未',
  亥: '戌',
  子: '戌',
  丑: '戌',
};

const LIU_E: Record<string, string> = {
  子: '卯',
  辰: '卯',
  申: '卯',
  寅: '酉',
  午: '酉',
  戌: '酉',
  巳: '午',
  酉: '午',
  丑: '午',
  亥: '子',
  卯: '子',
  未: '子',
};

/** 图鉴查法表：飞刃（羊刃冲） */
export function feiRenLookupLines(): string[] {
  return STEM_ORDER_LOOKUP.map((stem) => {
    const yr = YANG_REN_MAP[stem];
    if (!yr) return '';
    return `${stem}日羊刃${yr} → 飞刃${branchFrom(yr, 6)}`;
  }).filter(Boolean);
}

/** 图鉴查法表：元辰 */
export function yuanChenLookupLines(): string[] {
  return [
    '本产品：年支前后一位标元辰（内耗/别扭入口）',
    ...BRANCH_ORDER.map(
      (b) => `年支${b} → ${branchFrom(b, -1)}、${branchFrom(b, 1)}`,
    ),
    '标「别扭提醒」，勿单断小人',
  ];
}

/** 图鉴查法表：披麻 */
export function piMaLookupLines(): string[] {
  return [
    ...yearOffsetLookupLinesLocal(3, '披麻'),
    '标「孝服/告别场提醒」，慎断具体丧事',
  ];
}

/** 图鉴查法表：六厄 */
export function liuELookupLines(): string[] {
  return [
    '以年支或日支入三合，取六厄支',
    ...['申子辰→卯', '寅午戌→酉', '巳酉丑→午', '亥卯未→子'],
    '标「关卡阻滞提醒」，宜备份',
  ];
}

/** 图鉴查法表：进神 */
export function jinShenLookupLines(): string[] {
  return [
    `日柱为：${[...JIN_SHEN_DAYS].join('、')} → 进神`,
    '标「进取推进窗口」，要落地动作',
  ];
}

/** 图鉴查法表：退神 */
export function tuiShenLookupLines(): string[] {
  return [
    `日柱为：${[...TUI_SHEN_DAYS].join('、')} → 退神`,
    '标「收缩宜守提醒」，不是永久退场',
  ];
}

/** 图鉴查法表：孤辰 */
export function guChenLookupLines(): string[] {
  return [
    '寅卯辰年 → 孤辰巳',
    '巳午未年 → 孤辰申',
    '申酉戌年 → 孤辰亥',
    '亥子丑年 → 孤辰寅',
  ];
}

/** 图鉴查法表：寡宿 */
export function guaSuLookupLines(): string[] {
  return [
    '寅卯辰年 → 寡宿丑',
    '巳午未年 → 寡宿辰',
    '申酉戌年 → 寡宿未',
    '亥子丑年 → 寡宿戌',
  ];
}

/** 图鉴查法表：隔角 */
export function geJiaoLookupLines(): string[] {
  return BRANCH_ORDER.map((b) => {
    const hit = GE_JIAO[b];
    return hit ? `年支${b} → 隔角${hit}` : '';
  }).filter(Boolean);
}

/** 图鉴查法表：童子（产品简化口径） */
export function tongZiLookupLines(): string[] {
  return [
    '本产品简化：甲乙日见寅卯午未；戊己日见辰戌丑未',
    '标「幼年缘/宗教缘说法入口」，慎断',
    '勿恐吓式「必出家」',
  ];
}

/** 图鉴查法表：紫微（日支帝旺简化） */
export function ziWeiLookupLines(): string[] {
  return [
    '本产品简化：日支处日干「帝旺」位时标紫微（尊贵中枢入口）',
    '按日干对日支取十二长生帝旺',
    '标「中枢感」，不是必贵',
  ];
}

/** 图鉴查法表：十二长生位通用 */
export function changShengStageLookupLines(stage: string): string[] {
  return [
    `按日干对地支取十二长生「${stage}」位`,
    '甲木长生亥、沐浴子、冠带丑…（各干顺逆不同）',
    `落柱标「${stage}气场」；合原局看，勿单断`,
  ];
}

/** 图鉴查法表：天罗地网 */
export function tianLuoDiWangLookupLines(): string[] {
  return [
    '火命年见戌亥 → 天罗；水/土命年见辰巳 → 地网',
    '并见或总称时标「天罗地网」',
    '标「困局总提醒」，宜绕行/清淤，非绝路',
  ];
}

/** 图鉴查法表：旬空（对照空亡） */
export function xunKongLookupLines(): string[] {
  return [
    '与空亡同查：日柱所在旬两支落空',
    '甲子旬戌亥空 · 甲戌旬申酉空 · 甲申旬午未空',
    '甲午旬辰巳空 · 甲辰旬寅卯空 · 甲寅旬子丑空',
  ];
}

/** 图鉴查法表：马头带剑 */
export function maTouDaiJianLookupLines(): string[] {
  return [
    '本柱驿马 + 羊刃（或血刃/飞刃）同见 → 马头带剑',
    '标「奔波中带锋芒」提醒；要护具与边界',
  ];
}

/** 图鉴查法表：富星（≈仓廪） */
export function fuXingAliasLookupLines(): string[] {
  return [
    '本产品：与仓廪同落（日干之库）时标富星',
    ...cangLinLookupLines(),
    '标「资源丰厚感」，要出入流通',
  ];
}

/** 入口对照类查法 */
export function aliasEntryLookupLines(name: string, tip: string): string[] {
  return [
    `本产品：图鉴入口词「${name}」`,
    tip,
    '合十神/原局同看；不作单独判决',
  ];
}

export { YANG_REN_MAP, GE_JIAO, LIU_E };
