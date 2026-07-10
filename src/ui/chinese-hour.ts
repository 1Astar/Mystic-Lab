import { getChineseHour } from '../xiaoliuren/chinese-hour.ts';

export {
  CHINESE_HOURS,
  EARTHLY_BRANCHES,
  clockAngle,
  sectorPointerAngle,
  formatClockTime,
  getChineseHour,
} from '../xiaoliuren/chinese-hour.ts';
export { SIX_GODS } from '../xiaoliuren/six-gods.ts';

/** 兼容旧调用 */
export function getCurrentChineseHour() {
  const h = getChineseHour();
  return { branch: h.name, label: h.label, index: h.index };
}
