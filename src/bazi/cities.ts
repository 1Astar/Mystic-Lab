/** 国内主要城市经度（东经），用于真太阳时粗校正 */

export type CityLng = { name: string; aliases: string[]; lng: number };

export const CITY_LONGITUDES: CityLng[] = [
  { name: '北京', aliases: ['北京', '北平', '京'], lng: 116.41 },
  { name: '天津', aliases: ['天津'], lng: 117.2 },
  { name: '上海', aliases: ['上海', '沪'], lng: 121.47 },
  { name: '重庆', aliases: ['重庆', '渝'], lng: 106.55 },
  { name: '哈尔滨', aliases: ['哈尔滨', '哈市'], lng: 126.64 },
  { name: '长春', aliases: ['长春'], lng: 125.32 },
  { name: '沈阳', aliases: ['沈阳'], lng: 123.43 },
  { name: '大连', aliases: ['大连'], lng: 121.61 },
  { name: '呼和浩特', aliases: ['呼和浩特', '呼市'], lng: 111.75 },
  { name: '石家庄', aliases: ['石家庄'], lng: 114.51 },
  { name: '太原', aliases: ['太原'], lng: 112.55 },
  { name: '济南', aliases: ['济南'], lng: 117.0 },
  { name: '青岛', aliases: ['青岛'], lng: 120.38 },
  { name: '郑州', aliases: ['郑州'], lng: 113.62 },
  { name: '西安', aliases: ['西安', '长安'], lng: 108.94 },
  { name: '兰州', aliases: ['兰州'], lng: 103.83 },
  { name: '西宁', aliases: ['西宁'], lng: 101.78 },
  { name: '银川', aliases: ['银川'], lng: 106.27 },
  { name: '乌鲁木齐', aliases: ['乌鲁木齐', '乌市'], lng: 87.62 },
  { name: '南京', aliases: ['南京'], lng: 118.8 },
  { name: '苏州', aliases: ['苏州'], lng: 120.62 },
  { name: '杭州', aliases: ['杭州'], lng: 120.16 },
  { name: '宁波', aliases: ['宁波'], lng: 121.54 },
  { name: '合肥', aliases: ['合肥'], lng: 117.23 },
  { name: '福州', aliases: ['福州'], lng: 119.3 },
  { name: '厦门', aliases: ['厦门'], lng: 118.09 },
  { name: '南昌', aliases: ['南昌'], lng: 115.86 },
  { name: '武汉', aliases: ['武汉'], lng: 114.31 },
  { name: '长沙', aliases: ['长沙'], lng: 112.98 },
  { name: '广州', aliases: ['广州', '穗'], lng: 113.26 },
  { name: '深圳', aliases: ['深圳'], lng: 114.06 },
  { name: '珠海', aliases: ['珠海'], lng: 113.58 },
  { name: '东莞', aliases: ['东莞'], lng: 113.75 },
  { name: '佛山', aliases: ['佛山'], lng: 113.12 },
  { name: '南宁', aliases: ['南宁'], lng: 108.37 },
  { name: '海口', aliases: ['海口'], lng: 110.35 },
  { name: '成都', aliases: ['成都', '蓉'], lng: 104.07 },
  { name: '绵阳', aliases: ['绵阳'], lng: 104.68 },
  { name: '贵阳', aliases: ['贵阳'], lng: 106.63 },
  { name: '昆明', aliases: ['昆明'], lng: 102.71 },
  { name: '拉萨', aliases: ['拉萨'], lng: 91.11 },
  { name: '香港', aliases: ['香港', 'HK', 'Hong Kong'], lng: 114.17 },
  { name: '澳门', aliases: ['澳门'], lng: 113.54 },
  { name: '台北', aliases: ['台北', '臺北'], lng: 121.56 },
];

/** 东八区标准经线 */
export const CST_MERIDIAN = 120;

export type PlaceResolve = {
  matched: boolean;
  cityName?: string;
  lng: number;
  note: string;
};

export function resolveBirthPlaceLng(place: string): PlaceResolve {
  const raw = place.trim();
  if (!raw) {
    return {
      matched: false,
      lng: CST_MERIDIAN,
      note: '未填出生地 · 按东八区北京时间排盘',
    };
  }
  const lower = raw.toLowerCase();
  for (const city of CITY_LONGITUDES) {
    for (const alias of city.aliases) {
      if (raw.includes(alias) || lower.includes(alias.toLowerCase())) {
        return {
          matched: true,
          cityName: city.name,
          lng: city.lng,
          note: `真太阳时 · 按${city.name}经度 ${city.lng.toFixed(1)}°E 校正`,
        };
      }
    }
  }
  return {
    matched: false,
    lng: CST_MERIDIAN,
    note: `未识别「${raw}」· 按东八区北京时间排盘（未校正真太阳时）`,
  };
}
