import type { YaoKind } from './engine.ts';

/** 四象：画法 + 会不会变（学习/起卦共用） */
export const YAO_KIND_GUIDE: Record<
  YaoKind,
  {
    draw: '连横' | '断开';
    bitLabel: '阳' | '阴';
    mark: '' | '○' | '×';
    changing: boolean;
    /** 一行说清长什么样 */
    look: string;
    /** 为何这样画、和少/老的差别 */
    why: string;
  }
> = {
  少阳: {
    draw: '连横',
    bitLabel: '阳',
    mark: '',
    changing: false,
    look: '一条连续横线 ━━━，旁边没有 ○ / ×。',
    why: '阳画成「连在一起的一整横」。少阳＝年轻的阳：稳在本卦里，这一爻不会翻。',
  },
  老阳: {
    draw: '连横',
    bitLabel: '阳',
    mark: '○',
    changing: true,
    look: '同样是连续横线 ━━━，右边多一个 ○。',
    why: '老阳也是阳，所以仍画连横；「老」表示极盛将变——○ 表示这一爻会翻成阴，进入变卦。',
  },
  少阴: {
    draw: '断开',
    bitLabel: '阴',
    mark: '',
    changing: false,
    look: '中间断开的两截 ━━　━━，旁边没有标记。',
    why: '阴画成「中间断开的两截」。少阴＝稳定的阴：留在本卦，不会翻。',
  },
  老阴: {
    draw: '断开',
    bitLabel: '阴',
    mark: '×',
    changing: true,
    look: '同样是断开两截 ━━　━━，右边多一个 ×。',
    why: '老阴也是阴，所以仍画断开；「老」表示极盛将变——× 表示这一爻会翻成阳，进入变卦。',
  },
};

export function renderYaoKindVisual(kind: YaoKind): string {
  const g = YAO_KIND_GUIDE[kind];
  const line =
    g.draw === '连横'
      ? '<span class="ly-yao-demo-yang" aria-hidden="true"></span>'
      : '<span class="ly-yao-demo-yin" aria-hidden="true"><i></i><i></i></span>';
  const mark = g.mark
    ? `<span class="ly-yao-demo-mark">${g.mark}</span>`
    : '<span class="ly-yao-demo-mark ly-yao-demo-mark-empty"></span>';
  return `<span class="ly-yao-demo">${line}${mark}</span>`;
}

/** 四象对照卡：一眼分清少/老、连/断 */
export function renderYaoKindLegend(opts?: { interactive?: boolean }): string {
  const kinds: YaoKind[] = ['少阳', '老阳', '少阴', '老阴'];
  const cards = kinds
    .map((kind) => {
      const g = YAO_KIND_GUIDE[kind];
      const tap = opts?.interactive
        ? ` type="button" class="ly-yao-kind-card ly-tap" data-explain="yao-kind:${kind}"`
        : ` class="ly-yao-kind-card"`;
      const tag = opts?.interactive ? 'button' : 'div';
      return `
      <${tag}${tap}>
        ${renderYaoKindVisual(kind)}
        <strong>${kind}</strong>
        <span class="ly-yao-kind-meta">${g.bitLabel} · ${g.draw}${g.changing ? ' · 会变' : ' · 静'}</span>
        <span class="ly-yao-kind-hint">${g.look}</span>
      </${tag}>
    `;
    })
    .join('');

  return `
    <section class="ly-yao-kind-legend" aria-label="四象画法">
      <h3 class="ly-yao-kind-title">爻怎么画？先认四象</h3>
      <p class="ly-yao-kind-lead">规则只有两层：<strong>阴断开、阳连横</strong>；再看旁边有没有 ○/×——有就表示「老」、这一爻会变。</p>
      <div class="ly-yao-kind-grid">${cards}</div>
    </section>
  `;
}
