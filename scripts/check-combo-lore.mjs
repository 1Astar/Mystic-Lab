import fs from 'node:fs';
const s = fs.readFileSync('src/ziwei/combo-lore.ts', 'utf8');
const lines = s.split(/\n/);
for (let i = 245; i < 280; i++) {
  const L = lines[i] ?? '';
  const codes = [...L]
    .map((c, idx) => ({ c, idx, code: c.charCodeAt(0) }))
    .filter((x) => x.code === 39 || x.code === 8216 || x.code === 8217 || x.code === 8220 || x.code === 8221);
  console.log(i + 1, JSON.stringify(L), codes);
}
try {
  await import('./src/ziwei/combo-lore.ts');
  console.log('import ok');
} catch (e) {
  console.error('import fail', e);
}
