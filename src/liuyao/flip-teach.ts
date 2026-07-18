import type { CoinFace, YaoKind, YaoThrow } from './engine.ts';
import { YAO_KIND_GUIDE, renderYaoKindVisual } from './yao-kind-guide.ts';

/** 铜钱组合 → 四象：教学文案（起卦翻牌解谜） */
export const FLIP_TEACH: Record<
  YaoKind,
  {
    coinsHint: string;
    rule: string;
    draw: string;
    contrastKind: YaoKind;
    contrast: string;
    /** 画法短标签：连横 / 断开 */
    drawShort: string;
  }
> = {
  少阳: {
    coinsHint: '两字一背',
    rule: '字＝阴面（计2），背＝阳面（计3）。两字一背＝2+2+3＝7。阴多阳少，阳被阴压着，所以是「少阳」——阳还嫩，但本质仍是阳。',
    draw: '少阳在卦里画成一条连横 ━━━（不标 ○）。因为它的本质是阳，只是还不强，这一爻不会变。',
    contrastKind: '老阳',
    contrast: '若不带 ○ 的连横，是【少阳】（两字一背），稳定不会变；带 ○ 的连横才是【老阳】，会变。',
    drawShort: '连横（少阳，静）',
  },
  老阳: {
    coinsHint: '三背',
    rule: '三背＝3+3+3＝9。全是阳，阳到极致，称为「老阳」。旁边带 ○ 标记，表示会变成阴。',
    draw: '老阳也画连横 ━━━，但右边加 ○：表示这一爻会动，翻成阴，进入变卦。',
    contrastKind: '少阳',
    contrast: '如果不带 ○ 的连横，那是【少阳】（两字一背），它是稳定的，不会变。',
    drawShort: '连横（老阳，会变）',
  },
  少阴: {
    coinsHint: '一字两背',
    rule: '一字两背＝2+3+3＝8。阳多阴少，阴被压着，所以是「少阴」——阴还稳，本质是阴。',
    draw: '少阴画成断开两截 ━━　━━（不标 ×）。本质是阴，这一爻不会变。',
    contrastKind: '老阴',
    contrast: '若不带 × 的断开，是【少阴】，稳定不会变；带 × 的断开才是【老阴】，会变。',
    drawShort: '断开（少阴，静）',
  },
  老阴: {
    coinsHint: '三字',
    rule: '三字＝2+2+2＝6。全是阴，阴到极致，称为「老阴」。旁边带 × 标记，表示会变成阳。',
    draw: '老阴也画断开 ━━　━━，但右边加 ×：表示这一爻会动，翻成阳，进入变卦。',
    contrastKind: '少阴',
    contrast: '如果不带 × 的断开，那是【少阴】（一字两背），它是稳定的，不会变。',
    drawShort: '断开（老阴，会变）',
  },
};

export function coinsLabel(coins: [CoinFace, CoinFace, CoinFace]): string {
  return coins.map((c) => (c === 'reverse' ? '背' : '字')).join('');
}

/** 规则注解折叠：默认收起，感兴趣再点开 */
export function teachFold(summary: string, body: string): string {
  return `
    <details class="ly-teach-fold">
      <summary class="ly-teach-fold-sum">${summary}</summary>
      <div class="ly-teach-fold-body">${body}</div>
    </details>
  `;
}

/** 事后回看：六爻怎么摇出来的（非主教学入口） */
export function renderYaoMemoryFold(throws: YaoThrow[]): string {
  const rows = throws
    .map((t, i) => {
      const faces = coinsLabel(t.coins);
      return `
      <button type="button" class="ly-flip-chip" data-flip-index="${i}">
        <span class="ly-flip-chip-n">${i + 1}</span>
        ${renderYaoKindVisual(t.kind)}
        <span class="ly-flip-chip-txt"><em>${faces}</em><br>${t.kind}</span>
      </button>
    `;
    })
    .join('');

  return teachFold(
    '六爻生成记忆 · 回看完整起卦过程',
    `
    <section class="ly-flip-module ly-yao-memory" aria-label="六爻生成记忆">
      <p class="ly-flip-module-lead">事后回顾用：想一口气复看六次怎么摇的，点任一爻。</p>
      <div class="ly-flip-chips">${rows}</div>
    </section>
  `,
  );
}

function drawOutcome(kind: YaoKind): string {
  const g = YAO_KIND_GUIDE[kind];
  const teach = FLIP_TEACH[kind];
  return `${g.draw}${g.mark ? ` ${g.mark}` : ''} · ${teach.drawShort}`;
}

/** 完整教学卡（旁侧浮层：保留原先翻牌解谜全文） */
export function renderYaoTeachCardHtml(t: YaoThrow, index0: number): string {
  const teach = FLIP_TEACH[t.kind];
  const faces = coinsLabel(t.coins);
  const contrast = FLIP_TEACH[teach.contrastKind];
  return `
    <header class="ly-yao-pop-head">
      <strong>第 ${index0 + 1} 爻 · ${t.kind}</strong>
      <button type="button" class="ly-yao-pop-close" aria-label="收起">收起 ˄</button>
    </header>
    <div class="ly-yao-pop-visual">${renderYaoKindVisual(t.kind)}</div>
    <p class="ly-yao-pop-flow">
      <span class="ly-yao-pop-faces">${faces}</span>
      <span class="ly-yao-pop-arrow">→</span>
      <span>${drawOutcome(t.kind)}</span>
    </p>
    <div class="ly-yao-pop-block">
      <em>怎么算</em>
      <p>${teach.rule}</p>
    </div>
    <div class="ly-yao-pop-block">
      <em>怎么画</em>
      <p>${teach.draw}</p>
    </div>
    <div class="ly-yao-pop-contrast">
      <em>对比 · ${teach.contrastKind}</em>
      <div class="ly-yao-pop-contrast-row">
        ${renderYaoKindVisual(t.kind)}
        <span>vs</span>
        ${renderYaoKindVisual(teach.contrastKind)}
      </div>
      <p>${teach.contrast}</p>
      <p class="ly-yao-pop-contrast-hint">${contrast.coinsHint} → ${contrast.drawShort}</p>
    </div>
  `;
}

/** 爻旁半透明教学浮层：贴着被点的爻出现 */
export function showYaoTeachPopover(
  t: YaoThrow,
  index0: number,
  anchor?: DOMRect | null,
): void {
  document.querySelector('.ly-yao-pop')?.remove();

  const pop = document.createElement('div');
  pop.className = 'ly-yao-pop';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', `第 ${index0 + 1} 爻教学`);
  pop.innerHTML = renderYaoTeachCardHtml(t, index0);
  document.body.appendChild(pop);

  const place = () => {
    const margin = 10;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const popW = pop.offsetWidth;
    let popH = pop.offsetHeight;

    if (!anchor) {
      pop.style.left = `${Math.max(margin, (vw - popW) / 2)}px`;
      pop.style.top = `${Math.max(margin, vh * 0.18)}px`;
      return;
    }

    const spaceRight = vw - anchor.right - margin;
    const spaceLeft = anchor.left - margin;
    const preferRight = spaceRight >= Math.min(popW, 200) || spaceRight >= spaceLeft;

    let left: number;
    let fromSide: 'right' | 'left' | 'up' = 'right';
    if (preferRight) {
      left = anchor.right + 8;
      fromSide = 'right';
      if (left + popW > vw - margin) left = Math.max(margin, vw - popW - margin);
    } else {
      left = anchor.left - popW - 8;
      fromSide = 'left';
      if (left < margin) left = margin;
    }

    /** 竖直：尽量贴着爻；空间不够时向上冒出，并收紧最大高度 */
    const spaceBelow = vh - anchor.top - margin;
    const spaceAbove = anchor.top - margin;
    let top: number;

    if (popH <= spaceBelow) {
      top = Math.max(margin, anchor.top - 6);
    } else if (spaceAbove >= 120) {
      const maxH = Math.min(520, Math.max(160, spaceAbove - 4));
      pop.style.maxHeight = `${maxH}px`;
      popH = pop.offsetHeight;
      top = Math.max(margin, anchor.top - popH - 8);
      fromSide = 'up';
    } else {
      const maxH = Math.min(520, Math.max(160, vh - margin * 2));
      pop.style.maxHeight = `${maxH}px`;
      popH = pop.offsetHeight;
      top = Math.max(margin, Math.min(anchor.top - 6, vh - popH - margin));
    }

    pop.dataset.from = fromSide;
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  };

  /** 不可见态先定位，下一帧再淡入，避免瞬间弹出 */
  pop.setAttribute('aria-hidden', 'true');
  place();
  requestAnimationFrame(() => {
    place();
    requestAnimationFrame(() => {
      pop.classList.add('is-visible');
      pop.removeAttribute('aria-hidden');
    });
  });

  const close = (): void => {
    pop.classList.remove('is-visible');
    pop.classList.add('is-leaving');
    pop.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => pop.remove(), 420);
    document.removeEventListener('pointerdown', onDoc, true);
    document.removeEventListener('keydown', onKey);
  };
  pop.querySelector('.ly-yao-pop-close')?.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });

  const onDoc = (e: Event) => {
    if (!pop.contains(e.target as Node)) close();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };
  window.setTimeout(() => {
    document.addEventListener('pointerdown', onDoc, true);
    document.addEventListener('keydown', onKey);
  }, 0);
}

/** @deprecated 保留兼容；起卦页改用旁侧浮层 */
export function showFlipTeachModal(t: YaoThrow, index0: number): void {
  showYaoTeachPopover(t, index0, null);
}
