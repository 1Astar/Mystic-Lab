import type { MajorStarId } from './stars.ts';

/** 入口已合并；horizon 仅兼容旧调用，语义等同 map */
export type ZiweiIntent = 'horizon' | 'map';

export type StarSnap = {
  name: string;
  brightness: string;
  mutagen: string;
  isMajor: boolean;
};

export type PalaceSnap = {
  name: string;
  isSoul: boolean;
  isBody: boolean;
  isEmpty: boolean;
  heavenlyStem: string;
  earthlyBranch: string;
  majors: StarSnap[];
  minors: StarSnap[];
  adjectives: StarSnap[];
  /**
   * 长生 / 博士 / 将前 / 岁前 十二神（每宫各一）
   * 盘面可点开释义
   */
  series?: Array<{ kind: 'changsheng' | 'boshi' | 'jiangqian' | 'suiqian'; name: string }>;
  /** 虚岁大限起止，来自 iztro palace.decadal.range */
  decadalRange?: [number, number];
  /** 大限天干地支 */
  decadalStem?: string;
  decadalBranch?: string;
};

export type PillarId = 'core' | 'career' | 'bond' | 'lesson';

export type TheaterPillar = {
  id: PillarId;
  title: string;
  subtitle: string;
  palaceNames: string[];
  body: string;
  traditional: string;
  hasRisk: boolean;
};

export type ComfortNote = {
  trigger: string;
  line: string;
};

export type AnnualAdvice = {
  year: number;
  question: string;
  mutagenLine: string;
  focusPalaces: string[];
  advice: string;
  traditional: string;
  forecastGuide: string;
  /** 神煞叠读（流年） */
  shenshaLine?: string;
};

export type SoulCombo = {
  leadStar: string;
  coStars: string[];
  line: string;
};

/** 当前十年大限（轻量专区） */
export type DecadeAdvice = {
  /** 是否已起运（童限/未起运时为 false） */
  started: boolean;
  label: string;
  ageFrom: number;
  ageTo: number;
  /** 生活语言主题，如「创造与表达」 */
  theme: string;
  /** 本命宫位名（传统口径） */
  palaceName: string;
  majorStars: string[];
  mutagenLine: string;
  /** 结果页始终可见的一句定调 */
  lead: string;
  /** 展开后的运势与防坑 */
  guide: string;
  traditional: string;
};

export type DeepShenshaNote = {
  name: string;
  palace: string;
  epithet: string;
  /** 一句落点摘要 */
  line: string;
  /** 加厚正文 */
  body: string;
  /** 挂到哪些人生四要素 */
  pillarIds: PillarId[];
  pillarLabels: string[];
  /** 与流年焦点相关时的加一句 */
  annualHook?: string;
};

export type ZiweiTheater = {
  headline: string;
  pillars: TheaterPillar[];
  comfort: ComfortNote[];
  annual: AnnualAdvice;
  decade: DecadeAdvice;
  litMajorStars: MajorStarId[];
  soulCombo: SoulCombo;
  spotlightStar: string;
  /** 深度再筛：最值得讲的几条神煞 */
  shenshaHighlights: DeepShenshaNote[];
};

export type ZiweiChartView = {
  solarDate: string;
  timeLabel: string;
  /** 钟表时刻 YYYY-M-D H:MM */
  clockLabel: string;
  /** 真太阳时 YYYY-M-D H:MM */
  trueSolarLabel: string;
  /** 出生地解析说明 */
  placeNote: string;
  genderLabel: string;
  soul: string;
  body: string;
  fiveElementsClass: string;
  palaces: PalaceSnap[];
  soulPalace: PalaceSnap;
  bodyPalace: PalaceSnap;
  theater: ZiweiTheater;
  intent: ZiweiIntent;
};
