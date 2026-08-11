/**
 * 各体系对外定位副标题（Lab 首页 / 推荐镜头 / 模块页头共用）
 */
export const SYSTEM_POSITION = {
  tarot: '画面 · 内心镜像',
  liuyao: '此刻 · 一事细看',
  bazi: '本我 · 命理结构',
  ziwei: '人生地图',
} as const;

export type PositionedSystem = keyof typeof SYSTEM_POSITION;
