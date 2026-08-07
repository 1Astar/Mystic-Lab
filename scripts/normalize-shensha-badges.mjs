/**
 * 精品神煞徽章：按章面半径归一到画布统一占比，再写回 webp（源 png 不动）。
 * usage: node scripts/normalize-shensha-badges.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.resolve('public/bazi/covers');
const OUT = 960;
/** 章面直径占画布（略大于 30%，列表 scale≈2.85 时几乎铺满圆裁切） */
const TARGET_DIAM_RATIO = 0.36;
const PAD = 1.18;
const BG = { r: 8, g: 10, b: 18, alpha: 1 };

const SLUGS = [
  'taohua',
  'tianyi',
  'wenchang',
  'huagai',
  'yima',
  'yangren',
  'jiangxing',
  'hongluan',
  'tianxi',
  'lushen',
  'guchen',
];

/**
 * 从中心向外找「金属章」半径：取高亮环最大稳定半径，避开大片雾景。
 */
async function detectRadius(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;

  const ringMean = (r) => {
    let sum = 0;
    let n = 0;
    for (let a = 0; a < 360; a += 3) {
      const x = Math.round(cx + r * Math.cos((a * Math.PI) / 180));
      const y = Math.round(cy + r * Math.sin((a * Math.PI) / 180));
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const i = (y * w + x) * c;
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
      n++;
    }
    return n ? sum / n : 0;
  };

  // 多阈值取中位数半径，抑制雾/星尘
  const candidates = [];
  for (const thr of [32, 40, 48, 56]) {
    let maxR = 0;
    let peak = 0;
    for (let r = 10; r < w * 0.42; r += 2) {
      const m = ringMean(r);
      if (m > thr) {
        maxR = r;
        if (m > peak) peak = m;
      } else if (maxR > 40 && m < thr * 0.45) {
        break;
      }
    }
    if (maxR >= 40) candidates.push(maxR);
  }

  candidates.sort((a, b) => a - b);
  let r =
    candidates.length > 0
      ? candidates[Math.floor(candidates.length / 2)]
      : 120;

  // 亮像素紧 bbox（排除极暗虚空），与环半径取较小者防吃进雾
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  const tightThr = 52;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * c;
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (data[i + 3] > 24 && lum > tightThr) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX > minX) {
    const bboxR = Math.max(maxX - minX, maxY - minY) / 2;
    // 若 bbox 明显更大，多半是雾；取偏小的
    if (bboxR < r * 1.35) r = Math.max(r, bboxR * 0.92);
    else r = Math.min(r, bboxR * 0.55);
  }

  r = Math.min(Math.max(r, 70), w * 0.28);
  return { w, h, cx, cy, r };
}

async function normalizeOne(slug) {
  const png = path.join(dir, `${slug}.png`);
  const webp = path.join(dir, `${slug}.webp`);
  // 始终用 png 源，避免二次归一化叠方框
  const src = fs.existsSync(png) ? png : webp;
  if (!fs.existsSync(src)) {
    console.log(slug, 'MISSING');
    return;
  }

  const { w, h, cx, cy, r } = await detectRadius(src);
  const half = Math.min(
    Math.floor(r * PAD),
    Math.floor(Math.min(cx, cy, w - 1 - cx, h - 1 - cy)),
  );
  const left = Math.round(cx - half);
  const top = Math.round(cy - half);
  const size = half * 2;

  const targetDiam = Math.round(OUT * TARGET_DIAM_RATIO);
  const badgeBuf = await sharp(src)
    .extract({ left, top, width: size, height: size })
    .resize(targetDiam, targetDiam, { fit: 'fill' })
    .png()
    .toBuffer();

  const leftOut = Math.round((OUT - targetDiam) / 2);
  const topOut = Math.round((OUT - targetDiam) / 2);

  await sharp({
    create: {
      width: OUT,
      height: OUT,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: badgeBuf, left: leftOut, top: topOut }])
    .webp({ quality: 86 })
    .toFile(webp);

  console.log(
    `${slug.padEnd(12)} r=${String(Math.round(r)).padStart(3)}  src=${((r * 2) / w * 100).toFixed(1)}% → ${TARGET_DIAM_RATIO * 100}%`,
  );
}

for (const slug of SLUGS) {
  await normalizeOne(slug);
}
console.log('done');
