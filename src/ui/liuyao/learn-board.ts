import type { CastResult } from '../../liuyao/engine.ts';
import { LINE_LABELS } from '../../liuyao/hexagrams.ts';
import { YAO_KIND_GUIDE } from '../../liuyao/yao-kind-guide.ts';
import { renderHexagramSvg } from './hexagram-view.ts';

function lineGlyph(kind: keyof typeof YAO_KIND_GUIDE): string {
  const g = YAO_KIND_GUIDE[kind];
  if (g.draw === '连横') {
    return `<span class="ly-board-yang"></span>${g.mark ? `<span class="ly-board-mark">${g.mark}</span>` : ''}`;
  }
  return `<span class="ly-board-yin"><i></i><i></i></span>${g.mark ? `<span class="ly-board-mark">${g.mark}</span>` : ''}`;
}

/** 本/变卦对照表：单元格可点开解释 */
export function renderLearnBoard(cast: CastResult): string {
  const changedShi = cast.changed?.shiLine;
  const changedYing = changedShi
    ? ((((changedShi - 1 + 3) % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6)
    : undefined;

  const rows = [5, 4, 3, 2, 1, 0]
    .map((i) => {
      const t = cast.throws[i]!;
      const shi = cast.shiLine === i + 1 ? '世' : '';
      const ying = cast.yingLine === i + 1 ? '应' : '';
      const role = shi || ying || '·';
      const roleKey = shi ? 'shi' : ying ? 'ying' : `line:${i}`;
      return `
      <tr>
        <td>
          <button type="button" class="ly-board-cell ly-tap" data-explain="line:${i}">
            <span class="ly-board-glyph">${lineGlyph(t.kind)}</span>
          </button>
        </td>
        <td>
          <button type="button" class="ly-board-cell ly-tap" data-explain="line:${i}">${LINE_LABELS[i]}</button>
        </td>
        <td>
          <button type="button" class="ly-board-cell ly-tap ${shi || ying ? 'is-role' : ''}" data-explain="${roleKey}">${role}</button>
        </td>
        <td>
          <button type="button" class="ly-board-cell ly-tap" data-explain="line:${i}">${t.kind}</button>
        </td>
        <td>
          <button type="button" class="ly-board-cell ly-tap" data-explain="${t.changing ? 'dong' : `line:${i}`}">
            ${t.changing ? (t.kind === '老阳' ? '○动' : '×动') : '静'}
          </button>
        </td>
      </tr>
    `;
    })
    .join('');

  const changedRows = cast.changed
    ? [5, 4, 3, 2, 1, 0]
        .map((i) => {
          const bit = cast.changedLines[i]!;
          const moved = cast.changingIndexes.includes(i);
          const kindLabel = bit === 1 ? '阳' : '阴';
          const shi = changedShi === i + 1 ? '世' : '';
          const ying = changedYing === i + 1 ? '应' : '';
          const role = shi || ying || '·';
          return `
        <tr class="${moved ? 'is-moved' : ''}">
          <td>
            <button type="button" class="ly-board-cell ly-tap" data-explain="changed">
              <span class="ly-board-glyph">${
                bit === 1
                  ? '<span class="ly-board-yang"></span>'
                  : '<span class="ly-board-yin"><i></i><i></i></span>'
              }</span>
            </button>
          </td>
          <td><button type="button" class="ly-board-cell ly-tap" data-explain="changed">${LINE_LABELS[i]}</button></td>
          <td><button type="button" class="ly-board-cell ly-tap" data-explain="changed">${role}</button></td>
          <td><button type="button" class="ly-board-cell ly-tap" data-explain="changed">${kindLabel}</button></td>
          <td><button type="button" class="ly-board-cell ly-tap" data-explain="changed">${moved ? '由动而来' : '—'}</button></td>
        </tr>
      `;
        })
        .join('')
    : '';

  return `
    <div class="ly-learn-board">
      <div class="ly-board-pair">
        <section class="ly-board-panel">
          <button type="button" class="ly-board-title ly-tap" data-explain="primary">
            本卦 · ${cast.primary.fullName}
          </button>
          <div class="ly-board-svg">${renderHexagramSvg({
            lines: cast.primaryLines,
            shiLine: cast.shiLine,
            yingLine: cast.yingLine,
            changingIndexes: cast.changingIndexes,
            showTrigramLabels: true,
          })}</div>
          <table class="ly-board-table">
            <thead>
              <tr>
                <th>爻象</th><th>爻位</th><th>世应</th><th>四象</th><th>动静</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <button type="button" class="ly-board-link ly-tap" data-explain="liu-qin">六亲会出现在这一列（点我看说明）›</button>
        </section>
        ${
          cast.changed
            ? `
        <section class="ly-board-panel">
          <button type="button" class="ly-board-title ly-tap" data-explain="changed">
            变卦 · ${cast.changed.fullName}
          </button>
          <div class="ly-board-svg">${renderHexagramSvg({
            lines: cast.changedLines,
            shiLine: changedShi,
            yingLine: changedYing,
            showTrigramLabels: true,
          })}</div>
          <table class="ly-board-table">
            <thead>
              <tr>
                <th>爻象</th><th>爻位</th><th>世应</th><th>阴阳</th><th>来源</th>
              </tr>
            </thead>
            <tbody>${changedRows}</tbody>
          </table>
        </section>`
            : ''
        }
      </div>
      <p class="ly-board-hint">点任意格子 / 卦名 / 四象卡，下方会出现对应解释。</p>
      <aside class="ly-board-explain" data-explain-panel>
        <p class="ly-board-explain-placeholder">从上面点一项开始——例如点「老阳」或带 ○ 的爻。</p>
      </aside>
    </div>
  `;
}
