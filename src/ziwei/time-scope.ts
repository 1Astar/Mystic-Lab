/**
 * 运限层级内容：年主题 / 月推进 / 日当天 / 时当下
 */
import { CHINESE_HOURS } from '../xiaoliuren/chinese-hour.ts';
import type { PersonProfile } from '../life/types.ts';
import { resolveHoroscopeLimits } from './horoscope-limits.ts';
import type { ZiweiChartView } from './types.ts';
import {
  buildYearTrack,
  type YearTense,
  type YearTrackItem,
} from './year-track.ts';

export type TimeScopeLevel = 'decade' | 'year' | 'month' | 'day' | 'hour';

export type DecadeScopeItem = {
  palace: string;
  ageFrom: number;
  ageTo: number;
  gz: string;
  theme: string;
  lead: string;
  domains: string[];
  possibles: string[];
  mutagenLine: string;
  majorStars: string[];
  /** 该限中段对应公历年，便于叠盘与深度抽屉 */
  midYear: number;
};

export type MonthScopeItem = {
  year: number;
  month: number;
  monthLabel: string;
  palace: string;
  theme: string;
  domains: string[];
  possibles: string[];
  tense: YearTense;
  /** 流月干支 */
  gz: string;
  /** 流月四化 */
  mutagenLine: string;
  /** 对照：当年流年命宫 */
  yearPalace: string;
  yearMutagenLine: string;
  /** 一句推进导读 */
  lead: string;
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

const DECADE_THEME: Record<string, string> = {
  命: '重塑自我',
  兄弟: '同辈协作',
  夫妻: '亲密关系',
  子女: '创造与表达',
  财帛: '搞钱与资源',
  疾厄: '身心边界',
  迁移: '出走与视野',
  仆役: '人脉与协作',
  交友: '人脉与协作',
  官禄: '事业舞台',
  田宅: '根基与资产',
  福德: '内心满足',
  父母: '出处与权威',
};

const DECADE_POSSIBLES: Record<string, string[]> = {
  命: ['对自己的角色重新定义', '人生主轴议题反复出现', '对外形象或自我叙事调整'],
  兄弟: ['同辈协作网络变重要', '通过他人获得机会或压力', '更在意群体中的位置'],
  夫妻: ['亲密边界需要重谈', '一对一关系成为十年功课', '承诺与期待更敏感'],
  子女: ['创造表达欲持续增强', '想把想法做成可见成果', '晚辈/作品相关事务浮现'],
  财帛: ['资源进出成为长期议题', '对安全感与值不值更敏感', '收支节奏被反复校准'],
  疾厄: ['身心负荷需要长期管理', '节奏与边界成为功课', '作息健康被反复提醒'],
  迁移: ['外出变动与视野拓展', '生活半径可能变化', '环境切换带来新刺激'],
  仆役: ['人脉协作被长期调用', '朋友圈带来机会与消耗', '更依赖他人推进'],
  交友: ['人脉协作被长期调用', '朋友圈带来机会与消耗', '更依赖他人推进'],
  官禄: ['事业舞台成为十年主线', '职业路径反复校准', '角色感与责任加重'],
  田宅: ['家与根基相关安排', '资产与安全感议题醒目', '居住/根基变动可能出现'],
  福德: ['内心满足需要长期补给', '精神消耗与恢复是课题', '更在意过得开不开心'],
  父母: ['出处规则长辈议题', '权威关系需要重新定位', '对靠谁听谁更敏感'],
};

export function monthLabel(month: number): string {
  return MONTH_LABELS[Math.min(12, Math.max(1, month)) - 1] ?? `${month}月`;
}

export function buildDecadeScope(
  person: PersonProfile,
  view: ZiweiChartView,
  birthYear: number,
  palaceName: string,
): DecadeScopeItem {
  const palace =
    view.palaces.find(
      (p) => p.name === palaceName || shortPalace(p.name) === shortPalace(palaceName),
    ) ?? view.palaces.find((p) => p.decadalRange) ?? view.soulPalace;
  const ageFrom = palace.decadalRange?.[0] ?? 0;
  const ageTo = palace.decadalRange?.[1] ?? 0;
  const midAge = ageFrom && ageTo ? Math.round((ageFrom + ageTo) / 2) : 30;
  const midYear = birthYear + midAge - 1;
  const snap = resolveHoroscopeLimits(person, {
    year: midYear,
    month: 6,
    day: 15,
    hour: 6,
  });
  const key = keyOf(palace.name);
  const theme = DECADE_THEME[key] ?? (palace.name ? '人生主场' : '酝酿中');
  const theater = view.theater.decade;
  const useTheater =
    theater.palaceName &&
    (theater.palaceName === palace.name ||
      shortPalace(theater.palaceName) === shortPalace(palace.name));
  const majorStars = palace.majors.map((s) => s.name);
  const starHint =
    majorStars.length > 0
      ? majorStars.map((n) => `「${n}」`).join('、')
      : '空象（更看大限四化）';
  const lead = useTheater
    ? theater.lead
    : ageFrom
      ? `这十年主场在「${theme}」（约虚岁 ${ageFrom}–${ageTo}）。大限由 ${starHint} 定调——先对准这条线，再用流年做微调。`
      : '大限尚未清晰起运时，先养身体与安全感；起运后课题线会更清楚。';

  return {
    palace: palace.name,
    ageFrom: useTheater ? theater.ageFrom : ageFrom,
    ageTo: useTheater ? theater.ageTo : ageTo,
    gz: `${palace.decadalStem ?? ''}${palace.decadalBranch ?? ''}` || snap?.decadeGZ || '',
    theme: useTheater ? theater.theme : theme,
    lead,
    domains: PALACE_DOMAIN[key] ?? ['十年', '主场'],
    possibles: (DECADE_POSSIBLES[key] ?? ['十年主线议题反复出现', '节奏需要长期校准']).slice(0, 3),
    mutagenLine: useTheater
      ? theater.mutagenLine.replace(/、/g, ' · ')
      : snap?.decadeMutagenLine || '',
    majorStars: useTheater ? theater.majorStars : majorStars,
    midYear,
  };
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
  const mutagenLine = snap?.monthMutagenLine || '';
  const gz = snap?.monthGZ || '';
  const yearPalace = snap?.yearPalace || '';
  const yearMutagenLine = snap?.yearMutagenLine || '';
  const theme =
    MONTH_THEME[key] ?? (palace ? `${shortPalace(palace)}相关议题被推进` : '本月主场待定');
  const ji = mutagenLine.includes('化忌')
    ? mutagenLine.split(' · ').find((c) => c.includes('化忌'))
    : '';
  const lu = mutagenLine.split(' · ').find((c) => c.includes('化禄'));
  const leadParts = [
    gz ? `本月干支「${gz}」` : '',
    palace ? `流月命在${shortPalace(palace)}` : '',
    lu ? `${lu}宜推进` : '',
    ji ? `${ji}宜复盘少硬刚` : '',
  ].filter(Boolean);
  const lead =
    leadParts.length > 0
      ? `${leadParts.join('；')}。在流年主轴下，把本月当成短窗口推进，不必一次梭哈。`
      : `在年度主轴下，本月重点看${shortPalace(palace) || '推进'}——先对准主场，再看四化落点。`;

  return {
    year,
    month,
    monthLabel: monthLabel(month),
    palace,
    theme,
    domains: PALACE_DOMAIN[key] ?? ['推进', '观察'],
    possibles: (MONTH_POSSIBLES[key] ?? ['主场议题被短暂点亮', '日常节奏可能微调']).slice(0, 3),
    tense: tenseOf(year, nowYear),
    gz,
    mutagenLine,
    yearPalace,
    yearMutagenLine,
    lead,
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
