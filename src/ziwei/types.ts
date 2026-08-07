import type { MajorStarId } from './stars.ts';

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

export type ZiweiTheater = {
  headline: string;
  pillars: TheaterPillar[];
  comfort: ComfortNote[];
  annual: AnnualAdvice;
  decade: DecadeAdvice;
  litMajorStars: MajorStarId[];
  soulCombo: SoulCombo;
  spotlightStar: string;
};

export type ZiweiChartView = {
  solarDate: string;
  timeLabel: string;
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
