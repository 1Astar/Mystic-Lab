/**
 * 年度轨迹：本命盘不改写，仅叠流年落宫与四化主题
 */
import type { PersonProfile } from '../life/types.ts';
import { resolveHoroscopeLimits } from './horoscope-limits.ts';

export type YearTense = 'past' | 'present' | 'future';

export type YearTrackItem = {
  year: number;
  age: number;
  gz: string;
  yearPalace: string;
  yearMutagenLine: string;
  /** 时间线短标签 */
  chipLabel: string;
  theme: string;
  tense: YearTense;
  tenseLabel: string;
  career: string;
  relation: string;
  wealth: string;
  possibles: string[];
  /** 观察重点：一句 */
  watchFocus: string;
};

/** 流年命宫 → 时间线短词 */
const YEAR_CHIP: Record<string, string> = {
  命宫: '自我重校',
  命: '自我重校',
  兄弟: '伙伴课题',
  兄弟宫: '伙伴课题',
  夫妻: '关系变化',
  夫妻宫: '关系变化',
  子女: '创造表达',
  子女宫: '创造表达',
  财帛: '资源起伏',
  财帛宫: '资源起伏',
  疾厄: '身心节律',
  疾厄宫: '身心节律',
  迁移: '外出变动',
  迁移宫: '外出变动',
  仆役: '人际协作',
  交友: '人际协作',
  交友宫: '人际协作',
  官禄: '职业调整',
  官禄宫: '职业调整',
  田宅: '居住根基',
  田宅宫: '居住根基',
  福德: '内心满足',
  福德宫: '内心满足',
  父母: '出处权威',
  父母宫: '出处权威',
};

const YEAR_THEME: Record<string, string> = {
  命宫: '自我定位与人生主轴成为这一年的重要议题。',
  兄弟: '同辈关系与协作网络成为这一年的重要议题。',
  夫妻: '一对一关系与亲密边界成为这一年的重要议题。',
  子女: '创造、表达与延续感成为这一年的重要议题。',
  财帛: '资源进出与安全感成为这一年的重要议题。',
  疾厄: '身心节律与负荷管理成为这一年的重要议题。',
  迁移: '外出变动与视野拓展成为这一年的重要议题。',
  仆役: '人际协作与可调用人脉成为这一年的重要议题。',
  交友: '人际协作与可调用人脉成为这一年的重要议题。',
  官禄: '职业方向与社会角色成为这一年的重要议题。',
  田宅: '居住根基与安全感成为这一年的重要议题。',
  福德: '内心满足与精神补给成为这一年的重要议题。',
  父母: '出处、规则与长辈关系成为这一年的重要议题。',
};

function shortPalace(name: string): string {
  return name.replace(/宫$/, '');
}

function palaceKey(name: string): string {
  return shortPalace(name) || name;
}

function tenseOf(year: number, nowYear: number): YearTense {
  if (year < nowYear) return 'past';
  if (year > nowYear) return 'future';
  return 'present';
}

function tenseLabel(t: YearTense): string {
  if (t === 'past') return '人生回顾';
  if (t === 'future') return '趋势预览';
  return '正在经历';
}

/** 宫位 → 可能表现（短句，最多 3） */
const YEAR_POSSIBLES: Record<string, string[]> = {
  命宫: ['对自己的角色重新定义', '更在意「我到底要什么」', '对外形象或自我叙事有调整'],
  兄弟: ['接触新的同学、同事或合作对象', '更在意自己在群体中的位置', '通过他人获得机会或压力'],
  夫妻: ['亲密关系需要重新谈边界', '对承诺与期待更敏感', '一对一相处出现新节奏'],
  子女: ['创作、表达或项目推进感增强', '子代/晚辈相关事务浮现', '想把想法变成可见成果'],
  财帛: ['收支节奏被重新审视', '资源进出更敏感', '对「值不值」更容易计较'],
  疾厄: ['身心负荷需要被看见', '作息或健康习惯被提醒', '节奏被迫放慢或重排'],
  迁移: ['外出、迁徙或视野拓展', '环境切换带来新刺激', '生活半径可能变化'],
  仆役: ['朋友圈与可调用的人脉被点亮', '协作网络带来机会或消耗', '更依赖他人推进事务'],
  交友: ['朋友圈与可调用的人脉被点亮', '协作网络带来机会或消耗', '更依赖他人推进事务'],
  官禄: ['工作内容或路径可能调整', '对事业方向重新评估', '舞台感与角色感增强'],
  田宅: ['居住或资产安排被讨论', '安全感议题更醒目', '家与根基相关变动'],
  福德: ['内心满足感需要补给', '精神消耗与恢复成为课题', '更在意「过得开不开心」'],
  父母: ['长辈、规则或出处议题浮现', '权威关系需要重新定位', '对「靠谁/听谁」更敏感'],
};

/** 宫位 → 观察重点（一句） */
const YEAR_WATCH: Record<string, string> = {
  命宫: '这一年的选择，是更接近自己，还是更迎合外界？',
  兄弟: '关系是带来支持，还是带来比较与消耗？',
  夫妻: '边界是谈清楚了，还是靠忍着维持？',
  子女: '表达是在释放，还是在证明自己？',
  财帛: '钱在流动，还是在焦虑里空转？',
  疾厄: '身体是在求救，还是只是被忽视？',
  迁移: '走出去是在开拓，还是在逃避？',
  仆役: '人脉是助力，还是把你拖进比较？',
  交友: '人脉是助力，还是把你拖进比较？',
  官禄: '调整是升级，还是只在换地方消耗？',
  田宅: '根基是在加固，还是在被掏空？',
  福德: '满足感来自真实补给，还是短暂麻痹？',
  父母: '权威是保护，还是在替你做决定？',
};

function domainLines(
  palace: string,
  mutagenLine: string,
  tense: YearTense,
): { career: string; relation: string; wealth: string; possibles: string[]; watchFocus: string } {
  const key = palaceKey(palace);
  const hasJi = mutagenLine.includes('化忌');
  const hasLu = mutagenLine.includes('化禄');
  const hasQuan = mutagenLine.includes('化权');

  const verb =
    tense === 'past' ? '曾偏向' : tense === 'future' ? '可能偏向' : '容易偏向';

  let career = `${verb}把注意力放在工作路径与社会角色上。`;
  let relation = `${verb}留意一对一相处里的边界与期待。`;
  let wealth = `${verb}关注支出节奏与长期安排。`;

  if (key === '官禄' || key === '迁移') {
    career = hasLu
      ? `${verb}推进工作路径；禄象提示「能动起来」的窗口。`
      : hasJi
        ? `${verb}复盘职业选择，忌象处少硬刚、多试小步。`
        : `${verb}职业与舞台感增强，适合重新校准方向。`;
  }
  if (key === '夫妻' || key === '兄弟' || key === '仆役' || key === '交友') {
    relation = hasQuan
      ? `${verb}在关系里拍板或被要求站出来。`
      : hasJi
        ? `${verb}关系议题黏着，适合把期待说清楚。`
        : `${verb}人际与亲密议题被放大。`;
  }
  if (key === '财帛' || key === '田宅') {
    wealth = hasLu
      ? `${verb}资源有进账感，仍宜留弹性。`
      : hasJi
        ? `${verb}钱与资产处要防消耗与纠结。`
        : `${verb}财富与根基议题更醒目。`;
  }
  if (key === '疾厄' || key === '福德') {
    career = `${verb}先稳住节奏，再谈冲刺。`;
  }

  const base = YEAR_POSSIBLES[key] ?? [
    '主场议题被外部环境点亮',
    '日常节律可能需要重排',
    '对下一步方向产生新判断',
  ];
  const possibles = base.slice(0, 3);

  const watchFocus = YEAR_WATCH[key] ?? '这一年的主场，是在滋养你，还是在消耗你？';

  return { career, relation, wealth, possibles, watchFocus };
}

export function buildYearTrack(opts: {
  person: PersonProfile;
  birthYear: number;
  /** 时间线中心，默认今年 */
  centerYear?: number;
  /** 左右各扩几年，默认 2 → 共 5 年 */
  radius?: number;
  nowYear?: number;
}): YearTrackItem[] {
  const nowYear = opts.nowYear ?? new Date().getFullYear();
  const center = opts.centerYear ?? nowYear;
  const radius = opts.radius ?? 2;
  const start = Math.max(opts.birthYear, center - radius);
  const end = center + radius;
  const items: YearTrackItem[] = [];

  for (let y = start; y <= end; y++) {
    const snap = resolveHoroscopeLimits(opts.person, {
      year: y,
      month: 6,
      day: 15,
      hour: 6,
    });
    const palace = snap?.yearPalace ?? '';
    const key = palaceKey(palace);
    const tense = tenseOf(y, nowYear);
    const mutagenLine = snap?.yearMutagenLine ?? '';
    const domains = domainLines(palace, mutagenLine, tense);
    const theme =
      YEAR_THEME[palace] ??
      YEAR_THEME[key] ??
      (palace
        ? `流年主场落在${shortPalace(palace)}，成为这一年的重要议题。`
        : '流年主场待定，先看命宫与四化落点。');

    items.push({
      year: y,
      age: y - opts.birthYear + 1,
      gz: snap?.yearGZ ?? '',
      yearPalace: palace,
      yearMutagenLine: mutagenLine,
      chipLabel:
        YEAR_CHIP[palace] ?? YEAR_CHIP[key] ?? (shortPalace(palace) || '流年'),
      theme,
      tense,
      tenseLabel: tenseLabel(tense),
      ...domains,
    });
  }

  return items;
}
