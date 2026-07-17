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
  }
> = {
  少阳: {
    coinsHint: '两字一背',
    rule: '字＝阴面（计2），背＝阳面（计3）。两字一背＝2+2+3＝7。阴多阳少，阳被阴压着，所以是「少阳」——阳还嫩，但本质仍是阳。',
    draw: '少阳在卦里画成一条连横 ━━━（不标 ○）。因为它的本质是阳，只是还不强，这一爻不会变。',
    contrastKind: '老阳',
    contrast: '若摇出「背背背」（老阳＝9），同样画连横，但会加 ○：阳到极致，即将转阴。',
  },
  老阳: {
    coinsHint: '三背',
    rule: '三背＝3+3+3＝9。全是阳，阳到极致，称为「老阳」。',
    draw: '老阳也画连横 ━━━，但右边加 ○：表示这一爻会动，翻成阴，进入变卦。',
    contrastKind: '少阳',
    contrast: '若是「两字一背」（少阳），同样是连横，但没有 ○，不会变。',
  },
  少阴: {
    coinsHint: '一字两背',
    rule: '一字两背＝2+3+3＝8。阳多阴少，阴被压着，所以是「少阴」——阴还稳，本质是阴。',
    draw: '少阴画成断开两截 ━━　━━（不标 ×）。本质是阴，这一爻不会变。',
    contrastKind: '老阴',
    contrast: '若摇出「字字字」（老阴＝6），同样画断开，但会加 ×：阴到极致，即将转阳。',
  },
  老阴: {
    coinsHint: '三字',
    rule: '三字＝2+2+2＝6。全是阴，阴到极致，称为「老阴」。',
    draw: '老阴也画断开 ━━　━━，但右边加 ×：表示这一爻会动，翻成阳，进入变卦。',
    contrastKind: '少阴',
    contrast: '若是「一字两背」（少阴），同样是断开，但没有 ×，不会变。',
  },
};

export function coinsLabel(coins: [CoinFace, CoinFace, CoinFace]): string {
  return coins.map((c) => (c === 'reverse' ? '背' : '字')).join('');
}

/** 起卦过程底部：最近一爻的翻牌入口 */
export function renderFlipTeachBar(t: YaoThrow, index0: number): string {
  const faces = coinsLabel(t.coins);
  return `
    <section class="ly-flip-bar" aria-label="规则交互演示">
      <div class="ly-flip-bar-main">
        <span class="ly-flip-bar-visual">${renderYaoKindVisual(t.kind)}</span>
        <div>
          <p class="ly-flip-bar-title">第 ${index0 + 1} 爻 · ${faces} → <strong>${t.kind}</strong></p>
          <p class="ly-flip-bar-sub">摇一次，懂一次规则</p>
        </div>
      </div>
      <button type="button" class="ly-flip-btn" data-flip-index="${index0}">翻牌解谜</button>
    </section>
  `;
}

/** 六爻已成：规则演示模块（进解读前） */
export function renderFlipTeachModule(throws: YaoThrow[]): string {
  const rows = throws
    .map((t, i) => {
      const faces = coinsLabel(t.coins);
      return `
      <button type="button" class="ly-flip-chip" data-flip-index="${i}">
        <span class="ly-flip-chip-n">${i + 1}</span>
        ${renderYaoKindVisual(t.kind)}
        <span class="ly-flip-chip-txt">${faces}<br>${t.kind}</span>
      </button>
    `;
    })
    .join('');

  return `
    <section class="ly-flip-module" aria-label="规则交互演示">
      <h3 class="ly-flip-module-title">规则交互演示</h3>
      <p class="ly-flip-module-lead">六爻已成型。先点任意一爻「翻牌解谜」，搞懂字背怎么变成横线——再去看解读。</p>
      <div class="ly-flip-chips">${rows}</div>
    </section>
  `;
}

export function showFlipTeachModal(t: YaoThrow, index0: number): void {
  document.querySelector('.ly-flip-modal')?.remove();
  const teach = FLIP_TEACH[t.kind];
  const g = YAO_KIND_GUIDE[t.kind];
  const faces = coinsLabel(t.coins);
  const contrast = YAO_KIND_GUIDE[teach.contrastKind];

  const overlay = document.createElement('div');
  overlay.className = 'ly-flip-modal';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'ly-flip-modal-title');
  overlay.innerHTML = `
    <div class="ly-flip-modal-backdrop"></div>
    <div class="ly-flip-modal-card">
      <header class="ly-flip-modal-header">
        <div>
          <p class="ly-flip-modal-kicker">第 ${index0 + 1} 爻 · 翻牌解谜</p>
          <h2 id="ly-flip-modal-title">${faces} → ${t.kind}</h2>
        </div>
        <button type="button" class="ly-flip-modal-close" aria-label="关闭">×</button>
      </header>
      <div class="ly-flip-modal-visual">${renderYaoKindVisual(t.kind)}</div>
      <div class="ly-flip-block">
        <em>🔹 规则解释</em>
        <p>${teach.rule}</p>
      </div>
      <div class="ly-flip-block">
        <em>🔹 画线规则</em>
        <p>${teach.draw}</p>
        <p class="ly-flip-meta">${g.bitLabel} · ${g.draw}${g.changing ? ' · 会变' : ' · 静'}</p>
      </div>
      <div class="ly-flip-block ly-flip-contrast">
        <em>🔹 对比教学 · ${teach.contrastKind}</em>
        <div class="ly-flip-contrast-row">
          ${renderYaoKindVisual(t.kind)}
          <span>vs</span>
          ${renderYaoKindVisual(teach.contrastKind)}
        </div>
        <p>${teach.contrast}</p>
        <p class="ly-flip-meta">${contrast.look}</p>
      </div>
      <button type="button" class="btn ly-btn-gold ly-flip-modal-ok">懂了，继续</button>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-visible'));

  const close = (): void => {
    overlay.classList.remove('is-visible');
    window.setTimeout(() => overlay.remove(), 280);
  };
  overlay.querySelector('.ly-flip-modal-close')?.addEventListener('click', close);
  overlay.querySelector('.ly-flip-modal-backdrop')?.addEventListener('click', close);
  overlay.querySelector('.ly-flip-modal-ok')?.addEventListener('click', close);
}
