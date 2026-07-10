/**
 * 将 2×3 六神合图切成 public/xiaoliuren/gods/god-*.png
 * 用法: node scripts/slice-six-gods.mjs [源图路径]
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const defaultSrc = join(
  root,
  'public/xiaoliuren/gods/six-gods-grid.png',
);
const src = process.argv[2] ?? defaultSrc;

if (!existsSync(src)) {
  console.error(`源图不存在: ${src}`);
  process.exit(1);
}

const py = `
from pathlib import Path
from PIL import Image

src = Path(r'''${src.replace(/\\/g, '\\\\')}''')
out_dir = Path(r'''${join(root, 'public/xiaoliuren/gods').replace(/\\/g, '\\\\')}''')
out_dir.mkdir(parents=True, exist_ok=True)

grid_copy = out_dir / 'six-gods-grid.png'
if src.resolve() != grid_copy.resolve():
    Image.open(src).save(grid_copy)

img = Image.open(src).convert('RGBA')
w, h = img.size
cols, rows = 3, 2
cell_w, cell_h = w // cols, h // rows
icon_h = int(cell_h * 0.78)

ids = [
    ['da-an', 'liu-lian', 'su-xi'],
    ['chi-kou', 'xiao-ji', 'kong-wang'],
]

for row in range(rows):
    for col in range(cols):
        left = col * cell_w
        top = row * cell_h
        box = (left, top, left + cell_w, top + icon_h)
        tile = img.crop(box)
        tw, th = tile.size
        side = min(tw, th)
        cx = (tw - side) // 2
        cy = max(0, (th - side) // 2 - int(side * 0.04))
        tile = tile.crop((cx, cy, cx + side, cy + side))
        tile = tile.resize((256, 256), Image.Resampling.LANCZOS)
        out = out_dir / f'god-{ids[row][col]}.png'
        tile.save(out, 'PNG')
        print(out)
`;

const result = spawnSync('python', ['-c', py], { encoding: 'utf8' });
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
