/**
 * 将扩展神煞 SVG 章面光栅化为 png + webp（960²，章面约占 36%）
 * usage: npx tsx scripts/rasterize-extended-shensha.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  listShenshaBadgeArtNames,
  shenshaBadgeSvg,
} from '../src/bazi/codex-shensha-badge-art.ts';
import { SHENSHA_COVER_PROMPTS } from '../src/bazi/codex-cover-prompts.ts';

const dir = path.resolve('public/bazi/covers');
const OUT = 960;

/** 仅扩展批（无精品 AI 原图的 slug） */
const FEATURED = new Set([
  'tianyi',
  'wenchang',
  'lushen',
  'jiangxing',
  'hongluan',
  'tianxi',
  'taohua',
  'yangren',
  'huagai',
  'guchen',
  'yima',
]);

const slugByName = Object.fromEntries(
  SHENSHA_COVER_PROMPTS.filter((p) => p.id.startsWith('ss:')).map((p) => [
    p.title,
    p.slug,
  ]),
) as Record<string, string>;

fs.mkdirSync(dir, { recursive: true });

const names = listShenshaBadgeArtNames().filter((n) => {
  const slug = slugByName[n];
  return slug && !FEATURED.has(slug);
});

if (!names.length) {
  console.log('no extended badges to rasterize');
  process.exit(0);
}

for (const name of names) {
  const slug = slugByName[name]!;
  const svg = shenshaBadgeSvg(name, { uid: `raster-${slug}` });
  if (!svg) {
    console.log(name, 'NO SVG');
    continue;
  }
  // 强制输出尺寸，避免 sharp 按 viewBox 过小
  const sized = svg.replace(
    /<svg\b([^>]*)>/,
    `<svg$1 width="${OUT}" height="${OUT}">`,
  );
  const pngPath = path.join(dir, `${slug}.png`);
  const webpPath = path.join(dir, `${slug}.webp`);
  const buf = await sharp(Buffer.from(sized))
    .resize(OUT, OUT, { fit: 'fill' })
    .png()
    .toBuffer();
  await sharp(buf).toFile(pngPath);
  await sharp(buf).webp({ quality: 86 }).toFile(webpPath);
  console.log(`${name.padEnd(4)} → ${slug}.png / .webp`);
}

console.log('done', names.length);
