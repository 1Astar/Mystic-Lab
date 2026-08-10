/** 双盘映照 · 主题对照 */

export type MirrorThemeId =
  | 'personality'
  | 'career'
  | 'love'
  | 'wealth'
  | 'family'
  | 'health';

export type MirrorThemeCard = {
  id: MirrorThemeId;
  title: string;
  /** 八字侧重（术语向，短） */
  baziLens: string;
  /** 紫微侧重（宫位向，短） */
  ziweiLens: string;
  /** 八字用了什么 */
  baziEvidence: string[];
  /** 紫微用了什么 */
  ziweiEvidence: string[];
  /** 八字角度（白话） */
  baziAngle: string;
  /** 紫微角度（白话） */
  ziweiAngle: string;
  /** 共同指向 */
  shared: string;
  /** 不同角度 */
  different: string;
  /** 综合结论（人话） */
  synthesis: string;
  /** 稳定底色 vs 会变 */
  stableNote: string;
  changeNote: string;
};

export type MirrorComparePack = {
  personName: string;
  dayMasterBrief: string;
  soulBrief: string;
  themes: MirrorThemeCard[];
  headline: string;
  generatedAt: string;
};
