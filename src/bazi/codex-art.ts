import type { WuXing } from './elements.ts';
import { stemsOfWuxing, type StemBranchLore } from './codex-lore.ts';

/** 抽象插画 SVG：自然元素 / 流线轮廓，不写实人物与动物 */

const WX_ACCENT: Record<WuXing, { a: string; b: string; c: string }> = {
  木: { a: '#3d8f5a', b: '#7ec89a', c: '#1a3d28' },
  火: { a: '#c45a3a', b: '#e8a070', c: '#4a1810' },
  土: { a: '#a8844a', b: '#d4b87a', c: '#3d2e18' },
  金: { a: '#c8c0a8', b: '#f0ead8', c: '#3a3830' },
  水: { a: '#3a6ea5', b: '#7eb0d4', c: '#122038' },
};

function svgWrap(inner: string, cls: string): string {
  return `<svg class="${cls}" viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
}

/** 五行主卡：宏观气象 + 隐约子天干轮廓 */
export function wuxingArtSvg(wx: WuXing): string {
  const col = WX_ACCENT[wx];
  const kids = stemsOfWuxing(wx);
  const ghostKids = kids
    .map((k, i) => {
      const x = 28 + i * 52;
      return `<text x="${x}" y="108" text-anchor="middle" font-size="11" fill="${col.b}" opacity="0.22" font-family="serif">${k.id}</text>
        <path d="M${x - 10} 92 Q${x} 78 ${x + 10} 92" fill="none" stroke="${col.b}" stroke-width="0.8" opacity="0.18"/>`;
    })
    .join('');

  const scenes: Record<WuXing, string> = {
    木: `
      <defs>
        <radialGradient id="g-mu" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="${col.b}" stop-opacity="0.35"/><stop offset="100%" stop-color="${col.c}" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="160" height="120" fill="url(#g-mu)"/>
      <!-- 蕨类舒展漩涡 -->
      <path d="M80 100 C60 90 48 70 52 48 C56 28 78 18 90 32 C98 42 92 58 78 62 C68 65 62 55 68 48" fill="none" stroke="${col.a}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M78 62 C88 50 108 42 118 52" fill="none" stroke="${col.b}" stroke-width="1.4" opacity="0.85"/>
      <path d="M68 48 C58 38 42 36 34 48" fill="none" stroke="${col.b}" stroke-width="1.2" opacity="0.7"/>
      <path d="M20 110 Q40 95 55 110 M90 110 Q110 92 130 108" fill="none" stroke="${col.a}" stroke-width="1" opacity="0.35"/>
      ${ghostKids}`,
    火: `
      <defs>
        <radialGradient id="g-huo" cx="50%" cy="70%" r="55%"><stop offset="0%" stop-color="${col.b}" stop-opacity="0.4"/><stop offset="100%" stop-color="${col.c}" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="160" height="120" fill="url(#g-huo)"/>
      <!-- 暗红木炭 + 火焰拉丝 -->
      <path d="M48 95 L58 78 L70 92 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.2"/>
      <path d="M72 98 L82 76 L94 94 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.2"/>
      <path d="M98 96 L108 80 L118 94 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1"/>
      <path d="M64 78 Q70 48 78 28 Q84 48 86 72" fill="none" stroke="${col.b}" stroke-width="1.8" stroke-linecap="round" opacity="0.9"/>
      <path d="M86 72 Q92 42 100 24 Q106 50 108 78" fill="none" stroke="${col.a}" stroke-width="1.4" opacity="0.75"/>
      <path d="M50 70 Q55 40 62 30" fill="none" stroke="${col.b}" stroke-width="1" opacity="0.45"/>
      ${ghostKids}`,
    土: `
      <defs>
        <linearGradient id="g-tu" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${col.c}" stop-opacity="0.2"/><stop offset="100%" stop-color="${col.a}" stop-opacity="0.15"/></linearGradient>
      </defs>
      <rect width="160" height="120" fill="url(#g-tu)"/>
      <!-- 干涸开裂 + 沙丘层叠 -->
      <path d="M10 70 Q40 55 80 68 Q120 82 150 60" fill="none" stroke="${col.b}" stroke-width="1.6" opacity="0.7"/>
      <path d="M8 88 Q50 78 90 90 Q130 100 155 82" fill="none" stroke="${col.a}" stroke-width="2"/>
      <path d="M40 50 L48 72 M70 42 L66 78 M95 48 L102 80 M120 55 L115 85" stroke="${col.b}" stroke-width="1" opacity="0.55"/>
      <path d="M25 100 Q80 92 140 105" fill="none" stroke="${col.a}" stroke-width="1.2" opacity="0.4"/>
      ${ghostKids}`,
    金: `
      <defs>
        <linearGradient id="g-jin" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="${col.c}" stop-opacity="0.5"/><stop offset="100%" stop-color="${col.b}" stop-opacity="0.25"/></linearGradient>
      </defs>
      <rect width="160" height="120" fill="url(#g-jin)"/>
      <!-- 陨石金属片 + 刀锋纹理 -->
      <path d="M45 78 L78 28 L118 72 L95 98 L55 95 Z" fill="${col.c}" stroke="${col.b}" stroke-width="1.5" opacity="0.85"/>
      <path d="M62 70 L88 42 M70 82 L98 55 M78 90 L105 68" stroke="${col.b}" stroke-width="0.9" opacity="0.55"/>
      <path d="M50 60 L70 35" stroke="${col.a}" stroke-width="1.2" opacity="0.4"/>
      ${ghostKids}`,
    水: `
      <defs>
        <radialGradient id="g-shui" cx="50%" cy="45%" r="50%"><stop offset="0%" stop-color="${col.b}" stop-opacity="0.3"/><stop offset="100%" stop-color="${col.c}" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="160" height="120" fill="url(#g-shui)"/>
      <!-- 涟漪 + 鹅卵石暗流 -->
      <ellipse cx="55" cy="72" rx="14" ry="8" fill="${col.c}" stroke="${col.a}" stroke-width="1" opacity="0.8"/>
      <ellipse cx="105" cy="78" rx="16" ry="9" fill="${col.c}" stroke="${col.a}" stroke-width="1" opacity="0.75"/>
      <ellipse cx="80" cy="55" rx="28" ry="12" fill="none" stroke="${col.b}" stroke-width="1.2" opacity="0.55"/>
      <ellipse cx="80" cy="55" rx="42" ry="20" fill="none" stroke="${col.a}" stroke-width="1" opacity="0.35"/>
      <ellipse cx="80" cy="55" rx="55" ry="28" fill="none" stroke="${col.b}" stroke-width="0.8" opacity="0.22"/>
      <path d="M40 88 Q80 70 120 90" fill="none" stroke="${col.b}" stroke-width="1.4" opacity="0.5"/>
      ${ghostKids}`,
  };

  return svgWrap(scenes[wx], 'bazi-art-svg bazi-art-wx');
}

/** 天干：天空自然力量；地支：大地实体流线（隐约兽形，不写实） */
export function stemBranchArtSvg(item: StemBranchLore): string {
  const col = WX_ACCENT[item.wuxing];
  const scenes: Record<string, string> = {
    甲: `<path d="M80 105 L80 35 M80 40 L55 70 M80 50 L105 75 M60 30 Q80 18 100 32" fill="none" stroke="${col.a}" stroke-width="2.2" stroke-linecap="round"/><path d="M70 28 Q80 12 90 28" fill="none" stroke="${col.b}" stroke-width="1.2"/>`,
    乙: `<path d="M40 90 Q55 40 70 70 Q85 100 100 45 Q110 25 125 55" fill="none" stroke="${col.b}" stroke-width="1.8" stroke-linecap="round"/><path d="M55 55 Q65 35 75 50" fill="none" stroke="${col.a}" stroke-width="1" opacity="0.7"/>`,
    丙: `<circle cx="80" cy="48" r="16" fill="none" stroke="${col.b}" stroke-width="2"/><g stroke="${col.a}" stroke-width="1.4" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((d) => {
      const r = (d * Math.PI) / 180;
      const x1 = 80 + Math.cos(r) * 22;
      const y1 = 48 + Math.sin(r) * 22;
      const x2 = 80 + Math.cos(r) * 42;
      const y2 = 48 + Math.sin(r) * 42;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }).join('')}</g>`,
    丁: `<path d="M80 95 L80 55" stroke="${col.a}" stroke-width="1.5"/><path d="M80 55 Q72 40 80 28 Q88 40 80 55" fill="${col.b}" opacity="0.55" stroke="${col.a}" stroke-width="1"/><circle cx="55" cy="35" r="1.5" fill="${col.b}" opacity="0.7"/><circle cx="105" cy="42" r="1.2" fill="${col.b}" opacity="0.5"/><circle cx="95" cy="28" r="1" fill="${col.b}" opacity="0.6"/>`,
    戊: `<path d="M30 95 L45 40 L70 55 L95 28 L130 95 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.6" opacity="0.85"/><path d="M45 40 L70 55 L95 28" fill="none" stroke="${col.b}" stroke-width="1" opacity="0.5"/>`,
    己: `<path d="M20 70 Q50 55 80 68 Q110 82 140 65" fill="none" stroke="${col.a}" stroke-width="1.8"/><path d="M25 85 Q60 75 95 88 Q125 95 145 80" fill="none" stroke="${col.b}" stroke-width="1.3"/><path d="M40 60 L42 78 M70 58 L68 80 M100 62 L103 85" stroke="${col.b}" stroke-width="0.8" opacity="0.45"/>`,
    庚: `<path d="M50 85 L70 35 L95 50 L110 30 L125 75 L90 95 Z" fill="${col.c}" stroke="${col.b}" stroke-width="1.5"/><path d="M70 35 L72 55 M95 50 L88 70" stroke="${col.a}" stroke-width="1" opacity="0.5"/>`,
    辛: `<circle cx="70" cy="55" r="8" fill="none" stroke="${col.b}" stroke-width="1.4"/><circle cx="95" cy="48" r="5" fill="none" stroke="${col.a}" stroke-width="1.2"/><path d="M55 70 Q80 90 110 65" fill="none" stroke="${col.b}" stroke-width="1" opacity="0.6"/><circle cx="80" cy="72" r="2" fill="${col.b}" opacity="0.7"/>`,
    壬: `<path d="M20 40 Q50 70 40 95 Q70 50 90 85 Q110 40 140 75" fill="none" stroke="${col.a}" stroke-width="2.2" stroke-linecap="round"/><path d="M25 55 Q60 85 55 100" fill="none" stroke="${col.b}" stroke-width="1.3" opacity="0.6"/>`,
    癸: `<ellipse cx="80" cy="70" rx="45" ry="18" fill="none" stroke="${col.a}" stroke-width="1.5" opacity="0.7"/><path d="M50 55 Q80 40 110 55" fill="none" stroke="${col.b}" stroke-width="1.2" opacity="0.5"/><ellipse cx="95" cy="42" rx="10" ry="6" fill="${col.b}" opacity="0.25"/>`,
    // 地支：流线轮廓隐约兽态
    子: `<path d="M35 75 Q55 45 85 55 Q115 65 130 50" fill="none" stroke="${col.a}" stroke-width="2"/><path d="M50 80 Q70 95 100 78" fill="none" stroke="${col.b}" stroke-width="1.2" opacity="0.6"/><ellipse cx="118" cy="48" rx="8" ry="5" fill="none" stroke="${col.b}" stroke-width="1" opacity="0.45"/>`,
    丑: `<path d="M40 90 L50 50 L80 45 L110 55 L120 90" fill="none" stroke="${col.a}" stroke-width="2"/><path d="M55 70 L105 75" stroke="${col.b}" stroke-width="1" opacity="0.5"/><path d="M60 50 Q70 35 85 48" fill="none" stroke="${col.b}" stroke-width="1.2" opacity="0.4"/>`,
    寅: `<path d="M30 70 Q60 30 90 55 Q120 80 145 40" fill="none" stroke="${col.a}" stroke-width="2.2" stroke-linecap="round"/><path d="M45 55 Q70 20 95 45" fill="none" stroke="${col.b}" stroke-width="1.3" opacity="0.55"/>`,
    卯: `<path d="M70 95 L75 50" stroke="${col.a}" stroke-width="1.5"/><path d="M75 55 Q55 40 50 55 Q65 60 75 55 Q95 40 100 55 Q85 62 75 55" fill="none" stroke="${col.b}" stroke-width="1.6"/><circle cx="115" cy="35" r="10" fill="none" stroke="${col.a}" stroke-width="1" opacity="0.45"/>`,
    辰: `<path d="M25 60 Q50 80 80 65 Q110 45 140 70" fill="none" stroke="${col.a}" stroke-width="1.8"/><path d="M40 75 Q70 95 100 80" fill="none" stroke="${col.b}" stroke-width="1.2" opacity="0.55"/><ellipse cx="70" cy="70" rx="12" ry="6" fill="${col.c}" opacity="0.35"/>`,
    巳: `<ellipse cx="80" cy="70" rx="35" ry="14" fill="${col.c}" stroke="${col.a}" stroke-width="1.4" opacity="0.7"/><path d="M50 55 Q80 40 110 55" fill="none" stroke="${col.b}" stroke-width="1" opacity="0.4"/><path d="M60 70 Q80 78 100 68" fill="none" stroke="${col.a}" stroke-width="0.8" opacity="0.5"/>`,
    午: `<path d="M40 90 Q55 40 70 70 Q85 30 100 65 Q115 25 130 85" fill="none" stroke="${col.a}" stroke-width="2" stroke-linecap="round"/><path d="M55 50 Q70 20 80 45" fill="none" stroke="${col.b}" stroke-width="1.3" opacity="0.7"/>`,
    未: `<path d="M25 85 Q50 60 80 70 Q110 80 140 55" fill="none" stroke="${col.a}" stroke-width="2"/><path d="M50 70 Q55 45 65 55 M90 72 Q100 48 110 58" fill="none" stroke="${col.b}" stroke-width="1.2" opacity="0.6"/>`,
    申: `<path d="M45 85 L95 30 L115 40 L70 95 Z" fill="${col.c}" stroke="${col.b}" stroke-width="1.5" opacity="0.85"/><path d="M95 30 L110 25" stroke="${col.a}" stroke-width="2" stroke-linecap="round"/>`,
    酉: `<circle cx="80" cy="58" r="22" fill="none" stroke="${col.b}" stroke-width="1.6"/><circle cx="80" cy="58" r="3" fill="${col.a}"/><path d="M80 36 L80 42 M80 74 L80 80 M58 58 L64 58 M96 58 L102 58" stroke="${col.a}" stroke-width="1.2"/>`,
    戌: `<path d="M35 90 L45 55 L80 45 L115 55 L125 90 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.6"/><path d="M45 55 L125 55" stroke="${col.b}" stroke-width="1" opacity="0.45"/><path d="M60 55 L60 90 M100 55 L100 90" stroke="${col.b}" stroke-width="1" opacity="0.35"/>`,
    亥: `<path d="M25 45 Q50 75 45 100" fill="none" stroke="${col.a}" stroke-width="1.8" stroke-linecap="round"/><path d="M55 35 Q70 80 65 105" fill="none" stroke="${col.b}" stroke-width="1.5" opacity="0.75"/><path d="M85 40 Q95 85 100 105" fill="none" stroke="${col.a}" stroke-width="1.6"/><path d="M115 50 Q125 80 130 100" fill="none" stroke="${col.b}" stroke-width="1.3" opacity="0.65"/>`,
  };

  const body = scenes[item.id] ?? `<circle cx="80" cy="60" r="28" fill="none" stroke="${col.a}" stroke-width="1.5"/>`;
  const kindMark =
    item.kind === 'stem'
      ? `<text x="12" y="18" font-size="9" fill="${col.b}" opacity="0.35">天</text>`
      : `<text x="12" y="18" font-size="9" fill="${col.b}" opacity="0.35">地</text>`;

  return svgWrap(
    `<rect width="160" height="120" fill="${col.c}" opacity="0.25"/>${kindMark}${body}`,
    `bazi-art-svg bazi-art-${item.kind}`,
  );
}

export function artFrameHtml(opts: {
  lit: boolean;
  svg: string;
  title: string;
  sub: string;
  badge?: string;
  extraClass?: string;
  dataId: string;
}): string {
  const { lit, svg, title, sub, badge, extraClass = '', dataId } = opts;
  return `
    <button type="button" class="bazi-art-card ${extraClass} ${lit ? 'is-lit' : 'is-dim'}" data-codex-id="${dataId}">
      <div class="bazi-art-stage">
        ${svg}
        ${lit ? '<span class="bazi-art-particles" aria-hidden="true"></span>' : '<span class="bazi-art-seal" aria-hidden="true"></span>'}
      </div>
      <strong>${title}</strong>
      <em>${sub}</em>
      ${badge ? `<span class="bazi-wx-badge ${lit ? '' : 'is-lock'}">${badge}</span>` : ''}
    </button>`;
}
