const TRIGRAMS = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'] as const;

const TRIGRAM_LINES: Record<string, string> = {
  乾: '111',
  兑: '110',
  离: '101',
  震: '100',
  巽: '011',
  坎: '010',
  艮: '001',
  坤: '000',
};

function renderTrigramMini(name: string): string {
  const bits = TRIGRAM_LINES[name] ?? '000';
  const lines = bits
    .split('')
    .map((bit, i) => {
      const y = 4 + i * 5;
      if (bit === '1') {
        return `<line x1="2" y1="${y}" x2="14" y2="${y}" class="mh-mini-yang"/>`;
      }
      return `<line x1="2" y1="${y}" x2="6" y2="${y}" class="mh-mini-yin"/><line x1="10" y1="${y}" x2="14" y2="${y}" class="mh-mini-yin"/>`;
    })
    .join('');
  return `<svg class="mh-trigram-mini" viewBox="0 0 16 18" aria-hidden="true">${lines}</svg>`;
}

function renderBaguaWheel(): string {
  const spokes = TRIGRAMS.map((_, i) => {
    const angle = (i / 8) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const x2 = 50 + 34 * Math.cos(rad);
    const y2 = 50 + 34 * Math.sin(rad);
    return `<line x1="50" y1="50" x2="${x2}" y2="${y2}" class="mh-bagua-spoke"/>`;
  }).join('');

  const items = TRIGRAMS.map((name, i) => {
    const angle = (i / 8) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const r = 38;
    const x = 50 + r * Math.cos(rad);
    const y = 50 + r * Math.sin(rad);
    return `
      <div class="mh-trigram-node" style="left:${x}%;top:${y}%">
        ${renderTrigramMini(name)}
        <span class="mh-trigram-name">${name}</span>
      </div>`;
  }).join('');

  return `
    <div class="mh-bagua-wheel" aria-hidden="true">
      <div class="mh-bagua-orbit"></div>
      <div class="mh-bagua-ring"></div>
      <svg class="mh-bagua-spokes" viewBox="0 0 100 100">${spokes}</svg>
      ${items}
      <div class="mh-bagua-core">
        <svg viewBox="0 0 40 48" class="mh-hexagram-svg" aria-hidden="true">
          <g class="mh-hex-lines">
            <line x1="4" y1="6" x2="18" y2="6"/><line x1="22" y1="6" x2="36" y2="6"/>
            <line x1="4" y1="14" x2="18" y2="14"/><line x1="22" y1="14" x2="36" y2="14"/>
            <line x1="4" y1="22" x2="18" y2="22"/><line x1="22" y1="22" x2="36" y2="22"/>
            <line x1="4" y1="30" x2="18" y2="30"/><line x1="22" y1="30" x2="36" y2="30"/>
            <line x1="4" y1="38" x2="18" y2="38"/><line x1="22" y1="38" x2="36" y2="38"/>
            <line x1="4" y1="46" x2="18" y2="46"/><line x1="22" y1="46" x2="36" y2="46"/>
          </g>
        </svg>
      </div>
    </div>
  `;
}

function renderPlumBranch(side: 'left' | 'right'): string {
  const flip = side === 'right' ? ' mh-plum-flip' : '';
  const pos = side === 'left' ? ' mh-plum-left' : ' mh-plum-right';
  return `
    <svg class="mh-plum-branch${flip}${pos}" viewBox="0 0 80 120" aria-hidden="true">
      <path class="mh-plum-stem" d="M40 118 C38 90 28 70 18 48 C12 36 8 22 12 8"/>
      <circle cx="14" cy="18" r="5" class="mh-plum-petal"/>
      <circle cx="22" cy="12" r="4.5" class="mh-plum-petal"/>
      <circle cx="10" cy="28" r="4" class="mh-plum-petal mh-plum-petal-soft"/>
      <circle cx="20" cy="34" r="5" class="mh-plum-petal"/>
      <circle cx="12" cy="44" r="4" class="mh-plum-petal mh-plum-petal-soft"/>
      <circle cx="24" cy="50" r="4.5" class="mh-plum-petal"/>
    </svg>`;
}

function renderPavilion(): string {
  return `
    <svg class="mh-pavilion" viewBox="0 0 120 60" aria-hidden="true">
      <path class="mh-pavilion-roof" d="M10 38 L60 8 L110 38 Z"/>
      <path class="mh-pavilion-body" d="M28 38 V52 H92 V38"/>
      <line x1="60" y1="38" x2="60" y2="52" class="mh-pavilion-line"/>
      <line x1="44" y1="38" x2="44" y2="52" class="mh-pavilion-line"/>
      <line x1="76" y1="38" x2="76" y2="52" class="mh-pavilion-line"/>
    </svg>`;
}

export function renderMeihuaHero(): string {
  return `
    <div class="mh-hero-scene">
      <div class="mh-scene-mist" aria-hidden="true"></div>
      <div class="mh-scene-moon" aria-hidden="true">
        <span class="mh-moon-halo"></span>
      </div>
      ${renderPlumBranch('left')}
      ${renderPlumBranch('right')}
      <div class="mh-scene-mountain" aria-hidden="true"></div>
      ${renderPavilion()}
      ${renderBaguaWheel()}
    </div>
    <div class="mh-explore-card">
      <span class="mh-explore-icon" aria-hidden="true">✿</span>
      <div>
        <p class="mh-explore-label">适合探索</p>
        <p class="mh-explore-text">选择 / 趋势 / 变化 / 关系</p>
      </div>
    </div>
  `;
}
