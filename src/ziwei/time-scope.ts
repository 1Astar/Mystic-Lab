/**
 * 运限层级内容：年主题 / 月推进 / 日当天 / 时当下
 */
import { CHINESE_HOURS } from '../xiaoliuren/chinese-hour.ts';
import type { PersonProfile } from '../life/types.ts';
import { resolveHoroscopeLimits } from './horoscope-limits.ts';
import {
  buildYearTrack,
  type YearTense,
  type YearTrackItem,
} from './year-track.ts';

export type TimeScopeLevel = 'decade' | 'year' | 'month' | 'day' | 'hour';

export type MonthScopeItem = {
  year: number;
  month: number;
  monthLabel: string;
  palace: string;
  theme: string;
  domains: string[];
  possibles: string[];
  tense: YearTense;
};

export type DayScopeItem = {
  year: number;
  month: number;
  day: number;
  dateLabel: string;
  palace: string;
  career: string;
  relation: string;
  action: string;
};

export type HourScopeItem = {
  year: number;
  month: number;
  day: number;
  hour: number;
  hourLabel: string;
  rangeLabel: string;
  palace: string;
  theme: string;
  suit: string;
  caution: string;
};

const MONTH_LABELS = [
  '一月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '十一月',
  '十二月',
];

const PALACE_DOMAIN: Record<string, string[]> = {
  命: ['自我', '方向'],
  兄弟: ['合作', '同辈'],
  夫妻: ['关系', '边界'],
  子女: ['表达', '创造'],
  财帛: ['财富', '资源'],
  疾厄: ['身心', '节奏'],
  迁移: ['外出', '变动'],
  仆役: ['协作', '人脉'],
  交友: ['协作', '人脉'],
  官禄: ['事业', '角色'],
  田宅: ['家庭', '根基'],
  福德: ['内心', '补给'],
  父母: ['出处', '权威'],
};

const MONTH_THEME: Record<string, string> = {
  命: '自我定位被短暂点亮',
  兄弟: '协作与同辈关系推进',
  夫妻: '一对一关系需要谈清楚',
  子女: '表达与成果感被推进',
  财帛: '资源进出被重新掂量',
  疾厄: '身心节奏需要留意',
  迁移: '外出或环境切换',
  仆役: '人脉与协作被调用',
  交友: '人脉与协作被调用',
  官禄: '工作关系与个人选择',
  田宅: '家与根基相关推进',
  福德: '内心满足需要补给',
  父母: '规则与出处议题浮现',
};

const MONTH_POSSIBLES: Record<string, string[]> = {
  命: ['对自己的角色重新掂量', '想清楚「这一步要不要」'],
  兄弟: ['协作沟通变密', '同辈机会或摩擦'],
  夫妻: ['关系期待被摆上台面', '边界需要重谈'],
  子女: ['想把想法做成可见成果', '表达欲上升'],
  财帛: ['收支安排被讨论', '对值不值更敏感'],
  疾厄: ['作息或负荷被提醒', '节奏需要放缓'],
  迁移: ['外出或场景切换', '视野被打开一点'],
  仆役: ['找人帮忙或被找', '协作网络被点亮'],
  交友: ['找人帮忙或被找', '协作网络被点亮'],
  官禄: ['任务变化、沟通摩擦', '重新评估方向'],
  田宅: ['家务/居住安排变动', '安全感议题醒目'],
  福德: ['想休息或补给', '情绪消耗被看见'],
  父母: ['规则/长辈相关事务', '对权威更敏感'],
};

const DAY_CAREER: Record<string, string> = {
  命: '适合整理方向与优先级',
  官禄: '适合整理和推进工作',
  迁移: '适合外出对接或换环境想事',
  财帛: '适合核对收支与资源安排',
  兄弟: '适合协作推进，少单打独斗',
  交友: '适合协作推进，少单打独斗',
  仆役: '适合协作推进，少单打独斗',
};

const DAY_RELATION: Record<string, string> = {
  夫妻: '注意表达方式与期待',
  兄弟: '注意协作里的语气',
  交友: '注意表达方式',
  仆役: '注意表达方式',
  父母: '对权威沟通多留余地',
  命: '先听清楚自己真正要什么',
};

const DAY_ACTION: Record<string, string> = {
  官禄: '先确认信息，再做决定',
  夫妻: '先说清楚，再谈下一步',
  疾厄: '先稳住节奏，再加压',
  财帛: '先核对事实，再承诺',
  迁移: '先定目的地，再出门',
  命: '先写清优先级，再行动',
};

const HOUR_SUIT: Record<string, string> = {
  子: '收心、复盘、安静想',
  丑: '休整、少开新议题',
  寅: '酝酿、准备开场',
  卯: '开始、沟通、出发',
  辰: '开工、对接、落实',
  巳: '推进正经事',
  午: '拍板或公开表达',
  未: '消化、微调、补漏',
  申: '收尾、催办、赶工',
  酉: '交接、回家路上的沟通',
  戌: '社交、缓和、陪伴',
  亥: '收心、放下、准备休息',
};

const HOUR_CAUTION: Record<string, string> = {
  子: '别硬开高强度决策',
  丑: '别硬扛疲劳开会',
  寅: '别把半成品直接甩给人',
  卯: '临时变化与情绪判断',
  辰: '信息未齐时少承诺',
  巳: '别同时开太多线',
  午: '别在情绪高点硬刚',
  未: '别把拖延当成休息',
  申: '别为赶工牺牲核对',
  酉: '别把白天的火带回家',
  戌: '别用社交麻痹正题',
  亥: '别再开新战场',
};

function shortPalace(name: string): string {
  return name.replace(/宫$/, '');
}

function keyOf(palace: string): string {
  return shortPalace(palace) || palace;
}

function tenseOf(year: number, nowYear: number): YearTense {
  if (year < nowYear) return 'past';
  if (year > nowYear) return 'future';
  return 'present';
}

export function monthLabel(month: number): string {
  return MONTH_LABELS[Math.min(12, Math.max(1, month)) - 1] ?? `${month}月`;
}

export function buildMonthScope(
  person: PersonProfile,
  year: number,
  month: number,
  nowYear = new Date().getFullYear(),
): MonthScopeItem {
  const snap = resolveHoroscopeLimits(person, { year, month, day: 15, hour: 6 });
  const palace = snap?.monthPalace ?? '';
  const key = keyOf(palace);
  return {
    year,
    month,
    monthLabel: monthLabel(month),
    palace,
    theme: MONTH_THEME[key] ?? (palace ? `${shortPalace(palace)}相关议题被推进` : '本月主场待定'),
    domains: PALACE_DOMAIN[key] ?? ['推进', '观察'],
    possibles: (MONTH_POSSIBLES[key] ?? ['主场议题被短暂点亮', '日常节奏可能微调']).slice(0, 3),
    tense: tenseOf(year, nowYear),
  };
}

export function buildDayScope(
  person: PersonProfile,
  year: number,
  month: number,
  day: number,
): DayScopeItem {
  const snap = resolveHoroscopeLimits(person, { year, month, day, hour: 6 });
  const palace = snap?.dayPalace ?? '';
  const key = keyOf(palace);
  return {
    year,
    month,
    day,
    dateLabel: `${year}年${month}月${day}日`,
    palace,
    career: DAY_CAREER[key] ?? '适合整理和推进眼前事务',
    relation: DAY_RELATION[key] ?? '注意表达方式',
    action: DAY_ACTION[key] ?? '先确认信息，再做决定',
  };
}

export function buildHourScope(
  person: PersonProfile,
  year: number,
  month: number,
  day: number,
  hour: number,
): HourScopeItem {
  const h = Math.min(11, Math.max(0, hour));
  const meta = CHINESE_HOURS[h]!;
  const snap = resolveHoroscopeLimits(person, { year, month, day, hour: h });
  const palace = snap?.hourPalace ?? '';
  const key = keyOf(palace);
  const branch = meta.name;
  return {
    year,
    month,
    day,
    hour: h,
    hourLabel: meta.label,
    rangeLabel: meta.rangeLabel.replace(/\s/g, ''),
    palace,
    theme: palace
      ? `${shortPalace(palace)}被点亮 · ${MONTH_THEME[key] ?? '当下议题浮现'}`
      : '此刻时机提示',
    suit: HOUR_SUIT[branch] ?? '按现状小步推进',
    caution: HOUR_CAUTION[branch] ?? '少做不可逆决定',
  };
}

/** 年内容加家庭维度（财富旁） */
export function yearFamilyLine(item: YearTrackItem): string {
  const key = keyOf(item.yearPalace);
  const verb =
    item.tense === 'past' ? '曾偏向' : item.tense === 'future' ? '可能偏向' : '容易偏向';
  if (key === '田宅' || key === '父母' || key === '子女') {
    return `${verb}处理家与出处相关的安排。`;
  }
  if (key === '夫妻') {
    return `${verb}把亲密关系与家庭节奏一起看。`;
  }
  return `${verb}留意家与生活根基是否被挤占。`;
}

export function yearThemeHeadline(item: YearTrackItem): string {
  if (item.chipLabel === '职业调整') return '职业方向重新调整';
  return item.chipLabel || '年度主轴';
}

export { buildYearTrack, MONTH_LABELS, type YearTrackItem };
