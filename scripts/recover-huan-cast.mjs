/**
 * 按用户截图重建：风水涣 · 动三爻 → 巽为风
 * 输出可 merge 进旅程备份的 JSON 片段
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// 内联最小八卦线表（与 hexagrams KING_WEN / TRIGRAM_LINES 一致）
const TRIGRAM_LINES = {
  乾: [1, 1, 1],
  兑: [1, 1, 0],
  离: [1, 0, 1],
  震: [1, 0, 0],
  巽: [0, 1, 1],
  坎: [0, 1, 0],
  艮: [0, 0, 1],
  坤: [0, 0, 0],
};

function linesOf(upper, lower) {
  return [...TRIGRAM_LINES[lower], ...TRIGRAM_LINES[upper]];
}

function flip(bit) {
  return bit === 1 ? 0 : 1;
}

const primaryLines = linesOf('巽', '坎'); // 涣
const changingIndex = 2; // 三爻 0-based
const changedLines = primaryLines.map((b, i) => (i === changingIndex ? flip(b) : b));

function sumFor(bit, changing) {
  if (changing && bit === 1) return 9;
  if (changing && bit === 0) return 6;
  if (bit === 1) return 7;
  return 8;
}

function throwOf(bit, changing) {
  const sum = sumFor(bit, changing);
  const kind = { 6: '老阴', 7: '少阳', 8: '少阴', 9: '老阳' }[sum];
  const coins =
    sum === 6
      ? ['obverse', 'obverse', 'obverse']
      : sum === 7
        ? ['obverse', 'obverse', 'reverse']
        : sum === 8
          ? ['obverse', 'reverse', 'reverse']
          : ['reverse', 'reverse', 'reverse'];
  return { coins, sum, kind, bit, changing };
}

const throws = primaryLines.map((bit, i) => throwOf(bit, i === changingIndex));

const primary = {
  kingWen: 59,
  name: '涣',
  upper: '巽',
  lower: '坎',
  keywords: ['涣散', '消融', '疏通'],
  gist: '僵局在消融，适合疏通情绪与信息。',
  fullName: '风水涣',
  shiLine: 5,
};

const changed = {
  kingWen: 57,
  name: '巽',
  upper: '巽',
  lower: '巽',
  keywords: ['柔入', '渗透', '反复'],
  gist: '以柔顺方式渗入，反复沟通比一次硬推有效。',
  fullName: '巽为风',
  shiLine: 1,
};

const cast = {
  throws,
  primaryLines,
  changedLines,
  primary,
  changed,
  changingIndexes: [2],
  shiLine: 5,
  yingLine: 2,
  method: 'coin',
};

const question = '我要不要留在冠英？8月初要不要离职？转正能拿到8k吗？';
const castAt = '2026-07-24T06:56:00.000Z'; // 北京时间 14:56 ≈ UTC+8

const reading = {
  summary: '核心在于「涣散」',
  basis: '【卦象】风水涣 · 动三爻 → 巽为风\n世五爻 · 应二爻。',
  context: `你问的是「${question}」。本卦偏消融疏通，变向柔入渗透。`,
  action: '从「涣散」走向「柔入」：只选一个可验证动作。以柔顺方式渗入，反复沟通比一次硬推有效。',
};

const entry = {
  id: 'recover-huan-20260724-1456',
  createdAt: castAt,
  castAt,
  question,
  method: 'coin',
  primaryName: '涣',
  primaryFullName: '风水涣',
  changedFullName: '巽为风',
  changingLabels: ['三爻'],
  shiLine: 5,
  yingLine: 2,
  summary: reading.summary,
  reading,
  reflection: '',
  tags: [],
  fulfilled: null,
  castSnapshot: cast,
  learnMode: true,
  sceneTags: ['工作'],
  subjectId: 'self',
  subjectName: '自己',
};

const backup = {
  format: 'mystic-lab-backup',
  version: 1,
  exportedAt: new Date().toISOString(),
  appHint: 'Mystic Lab · recover 风水涣',
  keys: {
    'mystic-lab-liuyao-journal': JSON.stringify([entry]),
  },
};

const out = join(root, 'recover-liuyao-huan-20260724.json');
writeFileSync(out, JSON.stringify(backup, null, 2), 'utf8');

console.log('primaryLines', primaryLines.join(''));
console.log('changedLines', changedLines.join(''));
console.log('wrote', out);
console.log('entry id', entry.id);
