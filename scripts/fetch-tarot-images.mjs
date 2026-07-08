import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TAROT_BACK_SOURCE,
  TAROT_IMAGE_SOURCE_BASE,
  buildTarotImageManifest,
} from './tarot-image-map.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/tarot');
const RETRIES = 4;
const DELAY_MS = 120;

mkdirSync(outDir, { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadFile(url, dest) {
  let lastError;
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'MysticLab/0.1.3 (tarot-image-fetch)' },
      });
      if (res.status === 429 || res.status === 503) {
        await sleep(800 * (attempt + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(dest, buf);
      return;
    } catch (err) {
      lastError = err;
      await sleep(400 * (attempt + 1));
    }
  }
  throw new Error(`${url} → ${lastError instanceof Error ? lastError.message : 'failed'}`);
}

const manifest = buildTarotImageManifest();
let downloaded = 0;
let skipped = 0;
let failed = 0;

console.log('Fetching Rider-Waite tarot faces (public domain)…');

for (const [deckId, sourceFile] of manifest) {
  const dest = join(outDir, `${deckId}.jpg`);
  if (existsSync(dest)) {
    skipped++;
    continue;
  }
  const url = `${TAROT_IMAGE_SOURCE_BASE}/${sourceFile}`;
  try {
    await downloadFile(url, dest);
    downloaded++;
    process.stdout.write(`\r  ${downloaded + skipped}/${manifest.length} ${deckId}.jpg`);
    await sleep(DELAY_MS);
  } catch (err) {
    failed++;
    console.error(`\n  ✗ ${deckId}: ${err instanceof Error ? err.message : err}`);
  }
}

const backDest = join(outDir, 'back.jpg');
if (!existsSync(backDest)) {
  try {
    await downloadFile(`${TAROT_IMAGE_SOURCE_BASE}/${TAROT_BACK_SOURCE}`, backDest);
    downloaded++;
  } catch (err) {
    failed++;
    console.error(`\n  ✗ back.jpg: ${err instanceof Error ? err.message : err}`);
  }
}

writeFileSync(
  join(outDir, 'ATTRIBUTION.md'),
  `# Tarot Card Images

- **Deck**: Rider-Waite-Smith (1909)
- **License**: Public Domain (US/UK)
- **Source**: [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck) via [mixvlad/TarotCards](https://github.com/mixvlad/TarotCards)
- **CDN**: jsDelivr
- **Fetched by**: \`scripts/fetch-tarot-images.mjs\`
`,
);

console.log(`\nTarot images: ${downloaded} downloaded, ${skipped} cached, ${failed} failed`);

if (failed > 0) {
  process.exitCode = 1;
}
