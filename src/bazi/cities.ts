/** 国内城市经度解析（真太阳时粗校正） */

export type { CityLng } from './city-longitudes.ts';
export { CITY_LONGITUDES } from './city-longitudes.ts';

import { CITY_LONGITUDES } from './city-longitudes.ts';

/** 东八区标准经线 */
export const CST_MERIDIAN = 120;

export type PlaceResolve = {
  matched: boolean;
  cityName?: string;
  lng: number;
  note: string;
};

type Hit = { cityName: string; lng: number; aliasLen: number; exact: boolean };

/**
 * 最长别名优先；全等优先于 includes。
 * 去掉单字别名（如「京」），避免「南京」误配「北京」。
 */
export function resolveBirthPlaceLng(place: string | null | undefined): PlaceResolve {
  const raw = (place ?? '').trim();
  if (!raw) {
    return {
      matched: false,
      lng: CST_MERIDIAN,
      note: '未填出生地 · 按东八区北京时间排盘',
    };
  }
  const lower = raw.toLowerCase();
  const hits: Hit[] = [];
  for (const city of CITY_LONGITUDES) {
    for (const alias of city.aliases) {
      if (!alias || alias.length < 2) continue;
      const exact = raw === alias || lower === alias.toLowerCase();
      const soft = raw.includes(alias) || lower.includes(alias.toLowerCase());
      if (!exact && !soft) continue;
      hits.push({
        cityName: city.name,
        lng: city.lng,
        aliasLen: alias.length,
        exact,
      });
    }
  }
  if (!hits.length) {
    return {
      matched: false,
      lng: CST_MERIDIAN,
      note: `未识别「${raw}」· 按东八区北京时间排盘（未校正真太阳时）`,
    };
  }
  hits.sort((a, b) => {
    if (a.exact !== b.exact) return a.exact ? -1 : 1;
    if (b.aliasLen !== a.aliasLen) return b.aliasLen - a.aliasLen;
    return b.cityName.length - a.cityName.length;
  });
  const best = hits[0]!;
  return {
    matched: true,
    cityName: best.cityName,
    lng: best.lng,
    note: `真太阳时 · 按${best.cityName}经度 ${best.lng.toFixed(1)}°E 校正`,
  };
}
