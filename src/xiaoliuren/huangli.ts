import { Solar } from 'lunar-javascript';
import { EARTHLY_BRANCHES } from './chinese-hour.ts';

const WUXING_CHARS = ['金', '木', '水', '火', '土'] as const;
type WuxingChar = (typeof WUXING_CHARS)[number];

const WUXING_MOOD: Record<WuxingChar, string> = {
  金: '金气清肃，适合决断、整理、收束；问事宜干脆利落。',
  木: '木气生发，宜谋划新事、循序渐进；问事看长远布局。',
  水: '水气流动，宜灵活变通、顺势而为；问事忌固执一端。',
  火: '火气炎上，气动而急，宜快问快断，不宜久拖。',
  土: '土气厚载，宜守成固本、少说多做；问事重稳妥落地。',
};

const HOUR_MOOD: Record<string, string> = {
  子: '夜深气静，适合内省发问。',
  丑: '黎明前偏沉，宜把问题想透再动。',
  寅: '阳气初升，适合开启新问。',
  卯: '晨光渐明，问事宜求清晰方向。',
  辰: '辰时气盛，适合处理实务类问题。',
  巳: '巳火渐旺，问事节奏可稍快。',
  午: '日正当空，宜直面核心疑问。',
  未: '午后气缓，适合细问细节。',
  申: '金气当令，宜快问快断。',
  酉: '日入前夕，适合复盘与收束。',
  戌: '暮色渐浓，问事宜守不宜攻。',
  亥: '入夜归静，适合问心底真意。',
};

export type HuangliBrief = {
  solarLabel: string;
  lunarLabel: string;
  weekdayLabel: string;
  hourLabel: string;
  yi: string[];
  ji: string[];
  yiPreview: string;
  jiPreview: string;
  wuxingShort: string;
  wuxingNayin: string;
  chongsha: string;
  /** 纸页简写：冲属生肖，如「羊」 */
  chongShort: string;
  caiShen: string;
  xiShen: string;
  mood: string;
};

export type ShichenLuck = {
  branch: string;
  luck: '吉' | '凶';
  active: boolean;
};

export type HuangliCalendarLayout = HuangliBrief & {
  yiColumn: string[];
  jiColumn: string[];
  dayLuck: '吉' | '凶';
  dayLuckLabel: string;
  shichenRow: ShichenLuck[];
};

function columnActivities(items: string[], max = 2): string[] {
  const cleaned = cleanActivities(items);
  return cleaned.length > 0 ? cleaned.slice(0, max) : ['—'];
}

function buildShichenRow(lunar: import('lunar-javascript').Lunar, activeBranch: string): ShichenLuck[] {
  const luckByBranch = new Map<string, '吉' | '凶'>();
  for (const time of lunar.getTimes()) {
    const branch = time.getZhi();
    if (luckByBranch.has(branch)) continue;
    luckByBranch.set(branch, time.getTianShenLuck() === '吉' ? '吉' : '凶');
  }
  return EARTHLY_BRANCHES.map((branch) => ({
    branch,
    luck: luckByBranch.get(branch) ?? '吉',
    active: branch === activeBranch,
  }));
}

function extractWuxing(nayin: string): WuxingChar | null {
  for (let i = nayin.length - 1; i >= 0; i--) {
    const ch = nayin[i];
    if (WUXING_CHARS.includes(ch as WuxingChar)) return ch as WuxingChar;
  }
  return null;
}

function cleanActivities(items: string[]): string[] {
  return items.filter((item) => item !== '无' && item !== '诸事不宜' && item !== '诸事不忌');
}

function previewActivities(items: string[], max = 3): string {
  const cleaned = cleanActivities(items);
  if (cleaned.length === 0) return '—';
  const head = cleaned.slice(0, max).join('、');
  return cleaned.length > max ? `${head}…` : head;
}

function formatSolarLabel(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}年${m}月${d}日`;
}

function formatWeekdayLabel(week: string): string {
  const map: Record<string, string> = {
    日: '星期日',
    一: '星期一',
    二: '星期二',
    三: '星期三',
    四: '星期四',
    五: '星期五',
    六: '星期六',
  };
  return map[week] ?? `星期${week}`;
}

function buildChongsha(chongShengXiao: string, sha: string): string {
  if (!chongShengXiao && !sha) return '—';
  const chong = chongShengXiao ? `冲${chongShengXiao}` : '';
  const shaPart = sha ? `煞${sha}` : '';
  return `${chong}${shaPart}` || '—';
}

function buildMood(wuxing: WuxingChar | null, hourBranch: string): string {
  if (hourBranch === '申' || wuxing === '火') return WUXING_MOOD.火;
  if (wuxing) return WUXING_MOOD[wuxing];
  return HOUR_MOOD[hourBranch] ?? '今日平稳，见招拆招即可。';
}

/** 今日黄历摘要（v1：公历、农历、时辰、宜忌、五行、冲煞、气象） */
export function getHuangliBrief(date: Date, hourLabel: string, hourBranch: string): HuangliBrief {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();

  const yi = lunar.getDayYi();
  const ji = lunar.getDayJi();
  const nayin = lunar.getDayNaYin();
  const wuxing = extractWuxing(nayin);

  const monthName = lunar.getMonthInChinese();
  const dayName = lunar.getDayInChinese();
  const lunarLabel = `农历${monthName}月${dayName}`;

  return {
    solarLabel: formatSolarLabel(date),
    lunarLabel,
    weekdayLabel: formatWeekdayLabel(solar.getWeekInChinese()),
    hourLabel,
    yi,
    ji,
    yiPreview: previewActivities(yi),
    jiPreview: previewActivities(ji),
    wuxingShort: wuxing ?? nayin.slice(-1),
    wuxingNayin: nayin,
    chongsha: buildChongsha(lunar.getDayChongShengXiao(), lunar.getDaySha()),
    chongShort: lunar.getDayChongShengXiao() || '—',
    caiShen: lunar.getDayPositionCaiDesc() || '—',
    xiShen: lunar.getDayPositionXiDesc() || '—',
    mood: buildMood(wuxing, hourBranch),
  };
}

/** 黄历纸页排版数据（宜忌列、日吉凶、时辰吉凶） */
export function getHuangliCalendarLayout(
  date: Date,
  hourLabel: string,
  hourBranch: string,
): HuangliCalendarLayout {
  const brief = getHuangliBrief(date, hourLabel, hourBranch);
  const lunar = Solar.fromDate(date).getLunar();
  const dayLuck = lunar.getDayTianShenLuck() === '吉' ? '吉' : '凶';

  return {
    ...brief,
    yiColumn: columnActivities(brief.yi),
    jiColumn: columnActivities(brief.ji),
    dayLuck,
    dayLuckLabel: dayLuck === '吉' ? '黄道吉日' : '黑道日',
    shichenRow: buildShichenRow(lunar, hourBranch),
  };
}
