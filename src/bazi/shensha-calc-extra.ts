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
    const tianDe = (
      {
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
      } as Record<string, string>
    )[monthBranch];
    if (tianDe) {
      const heStem = STEM_HE[tianDe];
      const heBranch = BRANCH_LIU_HE[tianDe];
      if ((heStem && stem === heStem) || (heBranch && branch === heBranch)) {
        out.push('天德合');
      }
    }
    const yueDe = (
      {
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
      } as Record<string, string>
    )[monthBranch];
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
  const ku: Record<string, string> = {
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
  if (ku[dayStem] === branch) {
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
