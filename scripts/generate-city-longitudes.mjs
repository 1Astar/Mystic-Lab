/**
 * 从 public-wheels/china-cities JSON 生成 src/bazi/city-longitudes.ts
 * 用法: node scripts/generate-city-longitudes.mjs [path-to-china_cities.json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src =
  process.argv[2] ||
  path.join(
    process.env.USERPROFILE || '',
    '.cursor/projects/e-star-private/agent-tools/6a8e452e-13be-4540-9f30-8b24f77d2146.txt',
  );

const j = JSON.parse(fs.readFileSync(src, 'utf8'));

/** @type {Map<string, { lng: number; count: number; min: number; max: number }>} */
const bag = new Map();

function add(name, lng) {
  const n = String(name || '').trim();
  if (!n || n.length < 2) return;
  if (/^(市辖区|县|省直辖|自治区直辖)/.test(n)) return;
  const x = +lng;
  if (!Number.isFinite(x) || x < 70 || x > 140) return;
  const cur = bag.get(n);
  if (!cur) bag.set(n, { lng: x, count: 1, min: x, max: x });
  else {
    cur.count++;
    cur.min = Math.min(cur.min, x);
    cur.max = Math.max(cur.max, x);
    cur.lng = (cur.lng * (cur.count - 1) + x) / cur.count;
  }
}

for (const p of j) {
  for (const pref of p.prefectureCities || []) {
    const pn = pref.prefectureNameZh;
    const cities = pref.cities || [];
    const hit = cities.find((c) => c.nameZh === pn) || cities[0];
    if (hit) add(pn, hit.longtitude);
    for (const c of cities) add(c.nameZh, c.longtitude);
  }
}

const EXTRA = [
  { name: '北京', lng: 116.41, aliases: ['北京', '北平'] },
  { name: '天津', lng: 117.2, aliases: ['天津'] },
  { name: '上海', lng: 121.47, aliases: ['上海'] },
  { name: '重庆', lng: 106.55, aliases: ['重庆'] },
  { name: '香港', lng: 114.17, aliases: ['香港', 'HK', 'Hong Kong'] },
  { name: '澳门', lng: 113.54, aliases: ['澳门'] },
  { name: '台北', lng: 121.56, aliases: ['台北', '臺北'] },
  { name: '西安', lng: 108.94, aliases: ['西安', '长安'] },
  { name: '哈尔滨', lng: 126.64, aliases: ['哈尔滨', '哈市'] },
  { name: '呼和浩特', lng: 111.75, aliases: ['呼和浩特', '呼市'] },
  { name: '乌鲁木齐', lng: 87.62, aliases: ['乌鲁木齐', '乌市'] },
  { name: '广州', lng: 113.26, aliases: ['广州'] },
  { name: '成都', lng: 104.07, aliases: ['成都'] },
  { name: '赣州', lng: 114.93, aliases: ['赣州', '赣县'] },
];

const SKIP_AMBIGUOUS = new Set();
for (const [name, v] of bag) {
  if (v.max - v.min > 0.8) SKIP_AMBIGUOUS.add(name);
}

/** @type {Map<string, { name: string; aliases: string[]; lng: number }>} */
const out = new Map();

function upsert(name, lng, aliases) {
  const n = name.trim();
  if (!n) return;
  const existing = out.get(n);
  const al = aliases || [n];
  if (!existing) {
    out.set(n, { name: n, aliases: [...new Set(al)], lng: Math.round(lng * 100) / 100 });
  } else {
    for (const a of al) if (!existing.aliases.includes(a)) existing.aliases.push(a);
  }
}

for (const [name, v] of bag) {
  if (SKIP_AMBIGUOUS.has(name)) continue;
  upsert(name, v.lng, [name]);
}

for (const e of EXTRA) {
  out.set(e.name, {
    name: e.name,
    aliases: [...new Set(e.aliases)],
    lng: e.lng,
  });
}

const g = out.get('赣州');
if (g && !g.aliases.includes('赣县')) g.aliases.push('赣县');

const list = [...out.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh'));

const header = `/** 国内城市经度（东经），用于真太阳时粗校正。
 * 数据源：public-wheels/china-cities（和风天气城市表，含地级+县级）。
 * 同名且经度差>0.8° 的歧义地名已剔除；长安→西安 等常用别名见 aliases。
 * 重新生成：node scripts/generate-city-longitudes.mjs [china_cities.json]
 */
export type CityLng = { name: string; aliases: string[]; lng: number };

export const CITY_LONGITUDES: CityLng[] = `;

const body = JSON.stringify(list, null, 2)
  .replace(/"name":/g, 'name:')
  .replace(/"aliases":/g, 'aliases:')
  .replace(/"lng":/g, 'lng:')
  .replace(/"/g, "'");

const dest = path.join(root, 'src/bazi/city-longitudes.ts');
fs.writeFileSync(dest, header + body + ';\n', 'utf8');
console.log({
  total: list.length,
  skippedAmbiguous: SKIP_AMBIGUOUS.size,
  dest,
  hasGanzhou: !!out.get('赣州'),
  hasBeijing: !!out.get('北京'),
});
