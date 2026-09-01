/**
 * 生时校准 v2 · 用户自补充细节反查
 * 关键词 + 钟点/文化时间锚点 → 地支 / trait / 十神，再喂回侦探引擎。
 */
import type { DetectiveOptionEffect } from './rectify-detective-data.ts';
import {
  applyFreeformEffect,
  type DetectiveClue,
  type DetectiveEngineState,
} from './rectify-detective-engine.ts';
import type { ShichenTraitId } from './rectify-shichen-diff.ts';
import type { TenGodCategory } from './ten-gods.ts';
import { resolveBirthPlaceLng } from './cities.ts';
import { hourToShichenBranch, toTrueSolarDate } from './true-solar.ts';

export type ParsedUserClue = {
  raw: string;
  matched: string[];
  effect: DetectiveOptionEffect;
  /** 没命中规则词库 */
  weak: boolean;
};

/** 解析钟点时可选：用出生地做真太阳校正 */
export type UserClueContext = {
  birthYear?: string;
  birthMonth?: string;
  birthDay?: string;
  birthPlace?: string;
};

type Rule = {
  keys: string[];
  label: string;
  effect: Omit<DetectiveOptionEffect, 'clueHint'>;
};

/** 钟点中点 → 时辰（与 SHICHEN_MID 一致） */
const HOUR_TO_BRANCH: ReadonlyArray<{ start: number; end: number; branch: string }> = [
  { start: 23, end: 1, branch: '子' },
  { start: 1, end: 3, branch: '丑' },
  { start: 3, end: 5, branch: '寅' },
  { start: 5, end: 7, branch: '卯' },
  { start: 7, end: 9, branch: '辰' },
  { start: 9, end: 11, branch: '巳' },
  { start: 11, end: 13, branch: '午' },
  { start: 13, end: 15, branch: '未' },
  { start: 15, end: 17, branch: '申' },
  { start: 17, end: 19, branch: '酉' },
  { start: 19, end: 21, branch: '戌' },
  { start: 21, end: 23, branch: '亥' },
];

const CN_HOUR: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  十一: 11,
  十二: 12,
  十三: 13,
  十四: 14,
  十五: 15,
  十六: 16,
  十七: 17,
  十八: 18,
  十九: 19,
  二十: 20,
  廿: 20,
  二十一: 21,
  二十二: 22,
  二十三: 23,
  廿一: 21,
  廿二: 22,
  廿三: 23,
};

/** 生活/文化时间锚点 → 约几点（24h） */
const TIME_ANCHORS: ReadonlyArray<{ keys: string[]; hour: number; label: string }> = [
  { keys: ['新闻联播', '联播开始', '看新闻联播'], hour: 19, label: '新闻联播≈钟表19点' },
  { keys: ['春晚', '除夕晚会'], hour: 20, label: '春晚时段≈20点→戌时' },
  { keys: ['午夜场', '跨年倒计时', '零点钟声'], hour: 0, label: '午夜零点→子时' },
  { keys: ['鸡叫', '公鸡叫', '打鸣'], hour: 5, label: '鸡鸣≈5点→卯时' },
  { keys: ['日出', '天亮不久', '天刚亮'], hour: 6, label: '日出前后≈6点→卯时' },
  { keys: ['早饭', '吃早餐', '早餐时间'], hour: 7, label: '早饭≈7点→辰时' },
  { keys: ['上班点', '上班路上', '早高峰'], hour: 8, label: '上班高峰≈8点→辰时' },
  { keys: ['上学', '上课铃', '晨读'], hour: 8, label: '上学时段≈8点→辰时' },
  { keys: ['午饭', '吃中饭', '午餐', '午休前'], hour: 12, label: '午饭≈12点→午时' },
  { keys: ['午睡', '午休'], hour: 13, label: '午睡≈13点→未时' },
  { keys: ['放学', '下班点', '晚高峰'], hour: 18, label: '放学/下班≈18点→酉时' },
  { keys: ['晚饭', '吃晚饭', '晚餐'], hour: 18, label: '晚饭≈18点→酉时' },
  { keys: ['日落', '天黑不久', '擦黑'], hour: 18, label: '日落前后≈18点→酉时' },
  { keys: ['熄灯', '查铺', '夜自习结束'], hour: 22, label: '熄灯前后≈22点→亥时' },
  { keys: ['半夜醒来', '夜半'], hour: 0, label: '夜半≈0点→子时' },
];

const RULES: Rule[] = [
  {
    keys: ['半夜', '凌晨', '子时', '午夜', '深夜生'],
    label: '夜半出生意象',
    effect: { boostBranches: ['子', '丑'], keepBranches: ['子', '丑', '亥', '寅'] },
  },
  {
    keys: ['清晨', '早上', '天亮', '卯时', '刚亮'],
    label: '清晨出生意象',
    effect: { boostBranches: ['卯', '辰', '寅'], band: { kind: 'morning' } },
  },
  {
    keys: ['中午', '正午', '午饭', '午时'],
    label: '正午意象',
    effect: { boostBranches: ['午', '未'], band: { kind: 'afternoon' } },
  },
  {
    keys: ['傍晚', '黄昏', '日落', '晚饭'],
    label: '傍晚意象',
    effect: { boostBranches: ['酉', '戌'], band: { kind: 'evening' } },
  },
  {
    keys: ['搬家', '转学', '外出', '奔波', '出差', '离家', '漂泊'],
    label: '驿马/变动',
    effect: { boostTraits: ['travel'], boostBranches: ['寅', '申', '巳', '亥'] },
  },
  {
    keys: ['口才', '说话', '表达', '演讲', '写作', '创作', '点子'],
    label: '食伤表达',
    effect: { boostTraits: ['talk'], boostTenGodCats: ['shi_shang'] },
  },
  {
    keys: ['钱', '理财', '务实', '算账', '生意', '投资'],
    label: '财星务实',
    effect: { boostTraits: ['money'], boostTenGodCats: ['cai'] },
  },
  {
    keys: ['读书', '学习', '钻研', '考证', '学术'],
    label: '印星书卷',
    effect: { boostTraits: ['study'], boostTenGodCats: ['yin'] },
  },
  {
    keys: ['倔', '不服', '主见', '争强', '好胜', '抢风头'],
    label: '比劫主见',
    effect: { boostTraits: ['lead'], boostTenGodCats: ['bi_jie'] },
  },
  {
    keys: ['敏感', '多虑', '内耗', '想太多', '玻璃心'],
    label: '细腻敏感',
    effect: { boostTraits: ['sensitive'], boostTenGodCats: ['yin'] },
  },
  {
    keys: ['热情', '爆发', '急性子', '火爆', '直接'],
    label: '火气外放',
    effect: { boostBranches: ['巳', '午'], boostTraits: ['action'] },
  },
  {
    keys: ['沉稳', '内敛', '慢热', '安静', '不爱说话'],
    label: '内收沉稳',
    effect: { boostBranches: ['酉', '亥', '丑'], boostTraits: ['steady', 'study'] },
  },
  {
    keys: ['体弱', '生病', '住院', '受伤', '开刀'],
    label: '健康意象',
    effect: { boostTraits: ['health'] },
  },
  {
    keys: ['人缘', '桃花', '异性缘', '受欢迎'],
    label: '桃花人缘',
    effect: { boostTraits: ['charm'], boostBranches: ['午', '卯', '子'] },
  },
  {
    keys: ['白天生', '白天'],
    label: '白天出生',
    effect: { excludeBranches: ['子', '丑', '亥'] },
  },
  {
    keys: ['晚上生', '夜里生', '晚上'],
    label: '夜间出生',
    effect: { keepBranches: ['酉', '戌', '亥', '子', '丑', '寅'] },
  },
];

const BRANCH_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/** 0–23 点 → 地支；邻近支用于软加权 */
export function hourToBranch(hour: number): { branch: string; neighbors: string[] } {
  return neighborsOf(hourToShichenBranch(hour));
}

/**
 * 文化/口述钟点（东八区钟表）→ 真太阳时小时。
 * 未填可识别出生地时原样返回钟点。
 */
export function clockHourToTrueSolarHour(
  clockHour: number,
  ctx?: UserClueContext,
): { hour: number; labelSuffix: string } {
  const place = resolveBirthPlaceLng(ctx?.birthPlace);
  if (!place.matched && !(ctx?.birthPlace ?? '').trim()) {
    return { hour: clockHour, labelSuffix: '' };
  }
  const y = Number(ctx?.birthYear);
  const m = Number(ctx?.birthMonth);
  const d = Number(ctx?.birthDay);
  const year = Number.isFinite(y) && y >= 1900 ? y : 2000;
  const month = Number.isFinite(m) && m >= 1 && m <= 12 ? m : 6;
  const day = Number.isFinite(d) && d >= 1 && d <= 31 ? d : 15;
  const h = ((Math.floor(clockHour) % 24) + 24) % 24;
  const minute = Math.round((clockHour % 1) * 60);
  const clock = new Date(year, month - 1, day, h, minute, 0);
  const tst = toTrueSolarDate(clock, place.lng);
  const tstHour = tst.getHours() + tst.getMinutes() / 60;
  const city = place.cityName ?? '当地';
  const pad = String(tst.getMinutes()).padStart(2, '0');
  return {
    hour: tstHour,
    labelSuffix: `（${city}钟表${h}点→真太阳约${tst.getHours()}:${pad}）`,
  };
}

function neighborsOf(branch: string): { branch: string; neighbors: string[] } {
  const i = BRANCH_NAMES.indexOf(branch as (typeof BRANCH_NAMES)[number]);
  if (i < 0) return { branch, neighbors: [branch] };
  const prev = BRANCH_NAMES[(i + 11) % 12]!;
  const next = BRANCH_NAMES[(i + 1) % 12]!;
  return { branch, neighbors: [prev, branch, next] };
}

function parseCnHourToken(token: string): number | null {
  if (token in CN_HOUR) return CN_HOUR[token]!;
  if (/^\d{1,2}$/.test(token)) {
    const n = Number(token);
    if (n >= 0 && n <= 23) return n;
  }
  return null;
}

/**
 * 从自然语言抽钟点：19点、晚上七点、7:30、下午3点 等。
 * 返回 24h 小时；无法解析 → null。
 */
export function extractClockHour(text: string): { hour: number; label: string } | null {
  const t = text.trim();

  // 显式「子时」「戌时」
  for (const b of BRANCH_NAMES) {
    if (t.includes(`${b}时`)) {
      const mid =
        HOUR_TO_BRANCH.find((r) => r.branch === b)?.start ??
        (b === '子' ? 0 : 12);
      return { hour: mid === 23 ? 0 : mid, label: `点名${b}时` };
    }
  }

  // HH:MM / H:MM
  const colon = t.match(/(?:凌晨|早上|上午|中午|下午|傍晚|晚上|夜里|晚间)?\s*(\d{1,2})\s*[:：]\s*\d{1,2}/);
  if (colon) {
    let h = Number(colon[1]);
    if (/下午|傍晚/.test(colon[0]) && h < 12) h += 12;
    if (/晚上|夜里|晚间/.test(colon[0]) && h < 12) h += 12;
    if (/中午/.test(colon[0]) && h < 11) h = 12;
    if (h >= 0 && h <= 23) return { hour: h, label: `钟点${h}点` };
  }

  // 晚上七点 / 下午3点 / 19点 / 七时
  const cnKeys = Object.keys(CN_HOUR).sort((a, b) => b.length - a.length);
  const cnAlt = cnKeys.join('|');
  const re = new RegExp(
    `(凌晨|早上|上午|中午|下午|傍晚|晚上|夜里|晚间)?\\s*(${cnAlt}|\\d{1,2})\\s*(?:点半|点钟|点|时)`,
  );
  const m = t.match(re);
  if (m) {
    const period = m[1] ?? '';
    let h = parseCnHourToken(m[2]!);
    if (h == null) return null;
    if (period === '下午' || period === '傍晚') {
      if (h < 12) h += 12;
    } else if (period === '晚上' || period === '夜里' || period === '晚间') {
      if (h > 0 && h < 12) h += 12;
      if (h === 12) h = 0; // 晚上12点 → 0
    } else if (period === '中午' && h <= 1) {
      h = 12 + h;
    } else if (period === '凌晨' && h === 12) {
      h = 0;
    }
    if (h >= 0 && h <= 23) {
      const label = period ? `${period}${m[2]}点` : `${h}点`;
      return { hour: h, label: `钟点${label}→${h}时` };
    }
  }

  return null;
}

function effectFromHour(
  hour: number,
  label: string,
): { label: string; effect: Omit<DetectiveOptionEffect, 'clueHint'> } {
  const { branch, neighbors } = hourToBranch(hour);
  return {
    label,
    effect: {
      boostBranches: neighbors,
      keepBranches: neighbors,
      band:
        ['卯', '辰', '巳'].includes(branch)
          ? { kind: 'morning' }
          : ['午', '未', '申'].includes(branch)
            ? { kind: 'afternoon' }
            : ['酉', '戌'].includes(branch)
              ? { kind: 'evening' }
              : { kind: 'night' },
    },
  };
}

function mergeEffects(
  parts: Array<Omit<DetectiveOptionEffect, 'clueHint'>>,
  clueHint: string,
): DetectiveOptionEffect {
  const boostBranches: string[] = [];
  const boostTraits: ShichenTraitId[] = [];
  const boostTenGodCats: TenGodCategory[] = [];
  const excludeBranches: string[] = [];
  const keepBranches: string[] = [];
  let band: DetectiveOptionEffect['band'];

  for (const p of parts) {
    if (p.band) band = p.band;
    if (p.boostBranches) boostBranches.push(...p.boostBranches);
    if (p.boostTraits) boostTraits.push(...p.boostTraits);
    if (p.boostTenGodCats) boostTenGodCats.push(...p.boostTenGodCats);
    if (p.excludeBranches) excludeBranches.push(...p.excludeBranches);
    if (p.keepBranches) keepBranches.push(...p.keepBranches);
  }

  return {
    band,
    boostBranches: uniq(boostBranches),
    boostTraits: uniq(boostTraits),
    boostTenGodCats: uniq(boostTenGodCats),
    excludeBranches: uniq(excludeBranches),
    keepBranches: keepBranches.length ? uniq(keepBranches) : undefined,
    clueHint,
  };
}

/** 解析用户自由文本 → 规则效果（关键词 + 钟点/文化锚点；钟点按出生地真太阳校正） */
export function parseUserClue(text: string, ctx?: UserClueContext): ParsedUserClue {
  const raw = text.trim().slice(0, 200);
  const matched: string[] = [];
  const parts: Array<Omit<DetectiveOptionEffect, 'clueHint'>> = [];

  // 1) 文化时间锚点（优先于泛化「晚上」）——锚点小时是「钟表印象」
  for (const a of TIME_ANCHORS) {
    if (a.keys.some((k) => raw.includes(k))) {
      const { hour, labelSuffix } = clockHourToTrueSolarHour(a.hour, ctx);
      const pack = effectFromHour(hour, `${a.label}${labelSuffix}`);
      matched.push(pack.label);
      parts.push(pack.effect);
      break; // 一个明确锚点即可
    }
  }

  // 2) 显式钟点 / 时辰名
  if (!matched.some((m) => m.includes('点') || m.includes('时'))) {
    const clock = extractClockHour(raw);
    if (clock) {
      // 「戌时」等点名地支：已是时辰，不再做钟表→真太阳
      const namedBranch = BRANCH_NAMES.some((b) => raw.includes(`${b}时`));
      const { hour, labelSuffix } = namedBranch
        ? { hour: clock.hour, labelSuffix: '' }
        : clockHourToTrueSolarHour(clock.hour, ctx);
      const pack = effectFromHour(hour, `${clock.label}${labelSuffix}`);
      const { branch } = hourToBranch(hour);
      matched.push(`${pack.label}→${branch}时`);
      parts.push(pack.effect);
    }
  }

  // 3) 性格/时段关键词
  for (const rule of RULES) {
    if (rule.keys.some((k) => raw.includes(k))) {
      // 已有精确钟点时，跳过泛化「晚上/白天」硬切，避免互相打架
      const hasPreciseTime = matched.some(
        (m) => m.includes('→') || m.includes('联播') || m.includes('钟点'),
      );
      if (hasPreciseTime && (rule.label === '夜间出生' || rule.label === '白天出生')) {
        continue;
      }
      matched.push(rule.label);
      parts.push(rule.effect);
    }
  }

  if (!matched.length) {
    return {
      raw,
      matched: [],
      weak: true,
      effect: {
        clueHint: '这条细节暂未命中规则词库，已记入草稿，不改名次',
      },
    };
  }

  return {
    raw,
    matched,
    weak: false,
    effect: mergeEffects(parts, `你补充：${matched.join('、')}`),
  };
}

export function applyParsedUserClue(
  state: DetectiveEngineState,
  parsed: ParsedUserClue,
): { state: DetectiveEngineState; clue: DetectiveClue } {
  if (parsed.weak) {
    const clue: DetectiveClue = {
      questionId: 'user-clue',
      optionId: 'weak',
      title: '你补充的细节',
      body: `已记下「${parsed.raw}」。${parsed.effect.clueHint}`,
      highlighted: [],
      dimmed: [],
    };
    return {
      state: { ...state, clues: [...state.clues, clue] },
      clue,
    };
  }

  return applyFreeformEffect(state, parsed.effect, {
    questionId: 'user-clue',
    optionId: `hit-${parsed.matched.join('-').slice(0, 40)}`,
    title: '你补充的细节',
  });
}

export function applyUserClueText(
  state: DetectiveEngineState,
  text: string,
  ctx?: UserClueContext,
): { state: DetectiveEngineState; clue: DetectiveClue; parsed: ParsedUserClue } {
  const parsed = parseUserClue(text, ctx);
  const res = applyParsedUserClue(state, parsed);
  return { ...res, parsed };
}
