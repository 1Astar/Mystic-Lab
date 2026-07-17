import type { LineBit } from '../../liuyao/hexagrams.ts';
import { LINE_LABELS, upperLowerFromLines } from '../../liuyao/hexagrams.ts';
import { coinSrc } from '../../liuyao/assets.ts';

export interface HexagramViewOptions {
  lines: LineBit[];
  /** 1-based */
  shiLine?: number;
  yingLine?: number;
  changingIndexes?: number[];
  compact?: boolean;
  animateIndex?: number;
  revealedCount?: number;
  showTrigramLabels?: boolean;
  /** 金色圈世、红色圈应 */
  emphasizeShiYing?: boolean;
  /** 动爻闪烁强调 */
  pulseChanging?: boolean;
}

function lineSvg(bit: LineBit, y: number, cx: number, pending = false): string {
  const clsYang = pending ? 'ly-yao-pending' : 'ly-yao-yang';
  const clsYin = pending ? 'ly-yao-pending' : 'ly-yao-yin';
  if (pending) {
    return `<line class="${clsYang}" x1="${cx - 44}" y1="${y}" x2="${cx + 44}" y2="${y}" stroke-dasharray="3 4"/>`;
  }
  if (bit === 1) {
    return `<line class="${clsYang}" x1="${cx - 44}" y1="${y}" x2="${cx + 44}" y2="${y}"/>`;
  }
  return `<line class="${clsYin}" x1="${cx - 44}" y1="${y}" x2="${cx - 8}" y2="${y}"/>
    <line class="${clsYin}" x1="${cx + 8}" y1="${y}" x2="${cx + 44}" y2="${y}"/>`;
}

export function renderHexagramSvg(opts: HexagramViewOptions): string {
  const {
    lines,
    shiLine,
    yingLine,
    changingIndexes = [],
    compact,
    animateIndex,
    revealedCount,
    showTrigramLabels,
    emphasizeShiYing,
    pulseChanging,
  } = opts;
  const leftPad = emphasizeShiYing ? 28 : 0;
  const labelW = showTrigramLabels && !compact ? 56 : 0;
  const cx = 60 + leftPad;
  const w = 120 + labelW + leftPad;
  const h = compact ? 100 : 130;
  const gap = compact ? 14 : 18;
  const startY = compact ? 12 : 14;
  const filled = revealedCount ?? lines.length;
  const braceX = 118 + leftPad;

  const inner = lines
    .map((bit, i) => {
      const y = startY + (5 - i) * gap;
      const pending = i >= filled;
      const isShi = !pending && shiLine === i + 1;
      const isYing = !pending && yingLine === i + 1;
      const changing = !pending && changingIndexes.includes(i);
      const visible = pending || animateIndex === undefined || i <= animateIndex;
      const cls = [
        'ly-yao-row',
        pending ? 'ly-yao-pending-row' : '',
        changing ? 'ly-yao-changing' : '',
        pulseChanging && changing ? 'ly-yao-pulse' : '',
        isShi ? 'ly-yao-shi' : '',
        isYing ? 'ly-yao-ying' : '',
        visible ? 'ly-yao-visible' : 'ly-yao-hidden',
      ]
        .filter(Boolean)
        .join(' ');

      let decor = '';
      if (emphasizeShiYing && (isShi || isYing)) {
        decor = `
          <circle class="${isShi ? 'ly-shi-ring' : 'ly-ying-ring'}" cx="${cx}" cy="${y}" r="17"/>
          <text class="ly-yao-tag-strong ${isShi ? 'is-shi' : 'is-ying'}" x="2" y="${y + 4}">${isShi ? '世·我' : '应·外'}</text>
        `;
      } else if (isShi || isYing) {
        const tags = [isShi ? '世' : '', isYing ? '应' : ''].filter(Boolean).join('/');
        decor = `<text class="ly-yao-tag" x="${8 + leftPad}" y="${y + 4}">${tags}</text>`;
      }

      return `<g class="${cls}" data-line="${i}">
        ${decor}
        ${lineSvg(pending ? 0 : bit, y, cx, pending)}
        ${!compact && !showTrigramLabels ? `<text class="ly-yao-label" x="${108 + leftPad}" y="${y + 4}">${LINE_LABELS[i]}</text>` : ''}
      </g>`;
    })
    .join('');

  let trigramAnno = '';
  if (showTrigramLabels && !compact && filled >= 6) {
    const { upper, lower } = upperLowerFromLines(lines);
    const yUpperMid = startY + gap;
    const yLowerMid = startY + 4 * gap;
    trigramAnno = `
      <g class="ly-trigram-anno">
        <line class="ly-trigram-brace" x1="${braceX}" y1="${startY}" x2="${braceX}" y2="${startY + 2 * gap}"/>
        <text class="ly-trigram-name" x="${braceX + 6}" y="${yUpperMid + 3}">上${upper.id}·${upper.nature}</text>
        <line class="ly-trigram-brace" x1="${braceX}" y1="${startY + 3 * gap}" x2="${braceX}" y2="${startY + 5 * gap}"/>
        <text class="ly-trigram-name" x="${braceX + 6}" y="${yLowerMid + 3}">下${lower.id}·${lower.nature}</text>
      </g>`;
  }

  return `<svg class="ly-hexagram-svg${compact ? ' ly-hexagram-compact' : ''}${showTrigramLabels ? ' ly-hexagram-annotated' : ''}${emphasizeShiYing ? ' ly-hexagram-roles' : ''}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${inner}${trigramAnno}</svg>`;
}

export function renderCoinFace(face: 'obverse' | 'reverse', index: number): string {
  return `<div class="ly-coin ly-coin-${face}" data-coin="${index}" aria-hidden="true">
    <img class="ly-coin-img" src="${coinSrc(face)}" alt="" />
  </div>`;
}

export function renderThreeCoins(
  faces?: ['obverse' | 'reverse', 'obverse' | 'reverse', 'obverse' | 'reverse'],
): string {
  const f = faces ?? ['obverse', 'reverse', 'obverse'];
  return `<div class="ly-coins">${f.map((face, i) => renderCoinFace(face, i)).join('')}</div>`;
}
