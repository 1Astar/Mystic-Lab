/** 脱敏结果快照（可公开分享） */
export type ShareSystem =
  | 'liuyao'
  | 'tarot'
  | 'xiaoliuren'
  | 'bazi'
  | 'life'
  | 'meihua';

export type ShareSection = {
  heading: string;
  body: string;
};

export type ShareVisual =
  | {
      kind: 'liuyao';
      primaryName: string;
      changedName?: string;
      /** 自下而上 6 爻，1 阳 0 阴 */
      primaryLines: number[];
      changedLines?: number[];
      changingIndexes?: number[];
      shiLine?: number;
      yingLine?: number;
      /** 图鉴氛围图 URL（可为 data URL） */
      primaryArtSrc?: string;
      changedArtSrc?: string;
    }
  | {
      kind: 'tarot';
      cards: {
        name: string;
        position?: string;
        symbol?: string;
        cardId?: string;
        reversed?: boolean;
      }[];
    }
  | {
      kind: 'xiaoliuren';
      gods: string[];
      label?: string;
    }
  | {
      kind: 'bazi';
      pillars?: string;
      label?: string;
    }
  | {
      kind: 'life';
      label?: string;
    }
  | {
      kind: 'meihua';
      label?: string;
    }
  | {
      kind: 'generic';
      label?: string;
    };

export type ShareSnapshot = {
  id: string;
  system: ShareSystem;
  createdAt: string;
  /** 服务端存；客户端创建时传入，领取时用于防自刷 */
  ownerId: string;
  questionMasked: boolean;
  /** 展示用问题；为空表示分享页与封面均不显示问句 */
  questionDisplay: string;
  /** 体系标题，如卦名 */
  headline: string;
  /** 封面大字摘要 */
  summary: string;
  sections: ShareSection[];
  visual: ShareVisual;
  includeAi: boolean;
  aiText?: string;
  brandSlogan?: string;
};

export type ShareCreateBody = Omit<ShareSnapshot, 'id' | 'createdAt'> & {
  ownerId: string;
};

export type ShareClaimResult = {
  ok: boolean;
  reason?:
    | 'not_found'
    | 'self'
    | 'already'
    | 'owner_day_cap'
    | 'rate_limited'
    | 'too_fast'
    | 'error';
  /** 打开方是否应在本机 +1 */
  grantViewer?: boolean;
  /** 分享方今日已获（含本次） */
  ownerDayCount?: number;
};

export const SHARE_OWNER_KEY = 'mystic-lab-share-owner-v1';
export const SHARE_DEVICE_KEY = 'mystic-lab-share-device-v1';
export const SHARE_DAY_CAP = 3;
export const SHARE_VIEW_MS = 3000;
