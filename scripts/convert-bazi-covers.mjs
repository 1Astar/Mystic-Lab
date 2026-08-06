/**
 * PNG → WebP（记忆封面）
 * usage: node scripts/convert-bazi-covers.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.resolve('public/bazi/covers');
const maxW = 960;
const quality = 82;

const pngs = fs.readdirSync(dir).filter((f) => f.endsWith('.png'));
if (!pngs.length) {
  console.log('no png in', dir);
  process.exit(0);
}

for (const file of pngs) {
  const src = path.join(dir, file);
  const out = path.join(dir, file.replace(/\.png$/i, '.webp'));
  const before = fs.statSync(src).size;
  await sharp(src)
    .resize({ width: maxW, withoutEnlargement: true })
    .webp({ quality })
    .toFile(out);
  const after = fs.statSync(out).size;
  console.log(
    `${file} → ${path.basename(out)}  ${(before / 1024 / 1024).toFixed(2)}MB → ${(after / 1024).toFixed(0)}KB`,
  );
}
