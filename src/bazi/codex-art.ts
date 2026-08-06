import type { WuXing } from './elements.ts';
import { type StemBranchLore } from './codex-lore.ts';

/**
 * 记忆图 = 意象封面
 * - 神秘、静谧、有秩序
 * - 用「象」表达，图上不写解释文案
 * - 名称 / 气质留给卡面标题与详情第一屏
 */

const WX_ACCENT: Record<WuXing, { a: string; b: string; c: string }> = {
  木: { a: '#2f6b48', b: '#6aab84', c: '#0e1f16' },
  火: { a: '#a84830', b: '#d4926a', c: '#2a100c' },
  土: { a: '#8a6e3e', b: '#c4a66e', c: '#241a10' },
  金: { a: '#a8a090', b: '#ddd6c4', c: '#1e1c18' },
  水: { a: '#2f5a88', b: '#6a9cbc', c: '#0c1624' },
};

function svgWrap(inner: string, cls: string): string {
  return `<svg class="${cls}" viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
}

function veil(uid: string, col: string): string {
  return `
    <defs>
      <radialGradient id="${uid}-veil" cx="50%" cy="42%" r="62%">
        <stop offset="0%" stop-color="${col}" stop-opacity="0.22"/>
        <stop offset="70%" stop-color="${col}" stop-opacity="0.06"/>
        <stop offset="100%" stop-color="#050508" stop-opacity="0.55"/>
      </radialGradient>
      <linearGradient id="${uid}-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#050508" stop-opacity="0"/>
        <stop offset="100%" stop-color="#050508" stop-opacity="0.45"/>
      </linearGradient>
    </defs>
    <rect width="160" height="120" fill="url(#${uid}-veil)"/>
    <rect width="160" height="120" fill="url(#${uid}-floor)"/>`;
}

/** 五行：宏观元素之象 */
export function wuxingArtSvg(wx: WuXing, opts?: { uid?: string }): string {
  const col = WX_ACCENT[wx];
  const uid = opts?.uid ?? `wx-${wx}`;

  const scenes: Record<WuXing, string> = {
    木: `
      ${veil(uid, col.c)}
      <path d="M80 112 L80 28" stroke="${col.a}" stroke-width="2.6" stroke-linecap="round" opacity="0.9"/>
      <path d="M80 62 L52 40 M80 50 L108 30 M80 42 L62 22 M80 42 L100 18" fill="none" stroke="${col.b}" stroke-width="1.6" stroke-linecap="round" opacity="0.75"/>
      <ellipse cx="80" cy="36" rx="34" ry="10" fill="none" stroke="${col.b}" stroke-width="0.8" opacity="0.2"/>
      <path d="M18 112 Q50 100 80 112 Q110 100 142 112" fill="none" stroke="${col.a}" stroke-width="1" opacity="0.28"/>`,
    火: `
      ${veil(uid, col.c)}
      <circle cx="80" cy="70" r="18" fill="${col.c}" stroke="${col.a}" stroke-width="1.2" opacity="0.85"/>
      <circle cx="80" cy="70" r="7" fill="${col.b}" opacity="0.35"/>
      ${[15, 55, 95, 135, 175, 215, 255, 295, 335]
        .map((d) => {
          const r = (d * Math.PI) / 180;
          const len = d % 40 < 20 ? 36 : 28;
          return `<line x1="${80 + Math.cos(r) * 22}" y1="${70 + Math.sin(r) * 22}" x2="${80 + Math.cos(r) * len}" y2="${70 + Math.sin(r) * len}" stroke="${col.b}" stroke-width="1.15" stroke-linecap="round" opacity="0.55"/>`;
        })
        .join('')}`,
    土: `
      ${veil(uid, col.c)}
      <path d="M22 98 L52 52 L78 70 L108 40 L140 98 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.3" opacity="0.88"/>
      <path d="M22 98 H140" stroke="${col.b}" stroke-width="1.1" opacity="0.55"/>
      <path d="M36 98 V110 M60 98 V110 M84 98 V110 M108 98 V110" stroke="${col.b}" stroke-width="0.9" opacity="0.28"/>`,
    金: `
      ${veil(uid, col.c)}
      <path d="M58 96 L82 34 L90 38 L72 96 Z" fill="${col.c}" stroke="${col.b}" stroke-width="1.25" opacity="0.9"/>
      <path d="M108 78 L126 52 L136 60 L118 92 Z" fill="${col.c}" stroke="${col.b}" stroke-width="1.1" opacity="0.75"/>
      <path d="M112 74 L128 56 M118 84 L132 66" stroke="${col.a}" stroke-width="0.8" opacity="0.35"/>`,
    水: `
      ${veil(uid, col.c)}
      <path d="M18 48 Q48 78 42 108" fill="none" stroke="${col.a}" stroke-width="1.8" stroke-linecap="round" opacity="0.75"/>
      <path d="M48 42 Q78 82 72 112" fill="none" stroke="${col.b}" stroke-width="1.5" opacity="0.65"/>
      <path d="M82 44 Q108 84 112 112" fill="none" stroke="${col.a}" stroke-width="1.6" opacity="0.55"/>
      <path d="M118 50 Q138 82 144 104" fill="none" stroke="${col.b}" stroke-width="1.2" opacity="0.45"/>
      <ellipse cx="84" cy="34" rx="42" ry="9" fill="${col.b}" opacity="0.08"/>`,
  };

  return svgWrap(scenes[wx], 'bazi-art-svg bazi-art-wx is-cover');
}

/** 天干 / 地支记忆图 */
export function stemBranchArtSvg(item: StemBranchLore, opts?: { uid?: string }): string {
  const col = WX_ACCENT[item.wuxing];
  const uid = opts?.uid ?? `gz-${item.id}`;

  if (item.kind === 'stem') {
    const stemScenes: Record<string, string> = {
      // 甲：高耸古树，破雾见天
      甲: `
        ${veil(uid, col.c)}
        <ellipse cx="80" cy="28" rx="46" ry="12" fill="${col.b}" opacity="0.07"/>
        <path d="M80 112 L80 26" stroke="${col.a}" stroke-width="3" stroke-linecap="round"/>
        <path d="M80 58 L48 36 M80 46 L112 24 M80 70 L56 54 M80 70 L104 54" fill="none" stroke="${col.b}" stroke-width="1.7" stroke-linecap="round" opacity="0.7"/>
        <path d="M28 112 Q80 98 132 112" fill="none" stroke="${col.a}" stroke-width="1" opacity="0.25"/>`,
      // 乙：藤蔓花枝，柔韧攀附
      乙: `
        ${veil(uid, col.c)}
        <path d="M36 108 Q48 50 68 78 Q88 108 108 42 Q122 22 138 58" fill="none" stroke="${col.b}" stroke-width="1.9" stroke-linecap="round" opacity="0.85"/>
        <path d="M58 68 Q70 44 82 58 M98 62 Q110 38 122 52" fill="none" stroke="${col.a}" stroke-width="1.1" opacity="0.55"/>
        <circle cx="108" cy="42" r="3" fill="${col.b}" opacity="0.35"/>
        <circle cx="72" cy="74" r="2.2" fill="${col.b}" opacity="0.3"/>`,
      // 丙：太阳 / 大火球外放
      丙: `
        ${veil(uid, col.c)}
        <circle cx="80" cy="52" r="20" fill="${col.c}" stroke="${col.b}" stroke-width="1.6" opacity="0.9"/>
        <circle cx="80" cy="52" r="8" fill="${col.b}" opacity="0.28"/>
        ${[0, 45, 90, 135, 180, 225, 270, 315]
          .map((d) => {
            const r = (d * Math.PI) / 180;
            return `<line x1="${80 + Math.cos(r) * 26}" y1="${52 + Math.sin(r) * 26}" x2="${80 + Math.cos(r) * 44}" y2="${52 + Math.sin(r) * 44}" stroke="${col.a}" stroke-width="1.35" stroke-linecap="round" opacity="0.55"/>`;
          })
          .join('')}`,
      // 丁：烛火 / 夜灯内在光源
      丁: `
        ${veil(uid, col.c)}
        <path d="M80 108 L80 62" stroke="${col.a}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M80 62 Q70 46 80 30 Q90 46 80 62" fill="${col.b}" opacity="0.32" stroke="${col.a}" stroke-width="1.1"/>
        <circle cx="80" cy="42" r="10" fill="${col.b}" opacity="0.1"/>
        <circle cx="56" cy="36" r="1.2" fill="${col.b}" opacity="0.4"/>
        <circle cx="104" cy="40" r="1" fill="${col.b}" opacity="0.3"/>`,
      // 戊：高山厚载
      戊: `
        ${veil(uid, col.c)}
        <path d="M20 104 L48 42 L76 60 L106 30 L144 104 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.4" opacity="0.9"/>
        <path d="M20 104 H144" stroke="${col.b}" stroke-width="1.1" opacity="0.45"/>`,
      // 己：田园层叠
      己: `
        ${veil(uid, col.c)}
        <path d="M16 58 Q52 44 84 58 Q116 72 146 54" fill="none" stroke="${col.a}" stroke-width="1.6" opacity="0.75"/>
        <path d="M18 78 Q56 66 92 80 Q122 90 146 74" fill="none" stroke="${col.b}" stroke-width="1.25" opacity="0.55"/>
        <path d="M22 98 H140" stroke="${col.a}" stroke-width="1" opacity="0.35"/>
        <path d="M42 58 V98 M74 60 V98 M106 62 V98" stroke="${col.b}" stroke-width="0.8" opacity="0.25"/>`,
      // 庚：刀锋果断
      庚: `
        ${veil(uid, col.c)}
        <path d="M52 100 L86 24 L96 30 L70 104 Z" fill="${col.c}" stroke="${col.b}" stroke-width="1.35" opacity="0.92"/>
        <path d="M70 104 H102" stroke="${col.a}" stroke-width="1.8" stroke-linecap="round" opacity="0.7"/>
        <path d="M86 24 L98 16" stroke="${col.a}" stroke-width="1.6" stroke-linecap="round" opacity="0.65"/>`,
      // 辛：珠玉精致
      辛: `
        ${veil(uid, col.c)}
        <circle cx="70" cy="58" r="14" fill="none" stroke="${col.b}" stroke-width="1.35" opacity="0.8"/>
        <circle cx="100" cy="48" r="8" fill="none" stroke="${col.a}" stroke-width="1.15" opacity="0.7"/>
        <circle cx="90" cy="74" r="4.5" fill="${col.b}" opacity="0.22"/>
        <path d="M48 84 Q82 102 122 72" fill="none" stroke="${col.b}" stroke-width="0.9" opacity="0.35"/>`,
      // 壬：江海吞吐
      壬: `
        ${veil(uid, col.c)}
        <path d="M14 44 Q50 82 40 110" fill="none" stroke="${col.a}" stroke-width="2" stroke-linecap="round" opacity="0.75"/>
        <path d="M44 38 Q82 86 74 112" fill="none" stroke="${col.b}" stroke-width="1.7" opacity="0.65"/>
        <path d="M82 42 Q116 84 122 110" fill="none" stroke="${col.a}" stroke-width="1.8" opacity="0.55"/>
        <path d="M116 50 Q140 84 148 102" fill="none" stroke="${col.b}" stroke-width="1.3" opacity="0.45"/>`,
      // 癸：雨露渗透
      癸: `
        ${veil(uid, col.c)}
        <path d="M58 26 Q52 48 60 64" fill="none" stroke="${col.b}" stroke-width="1.35" stroke-linecap="round" opacity="0.7"/>
        <path d="M80 20 Q76 50 84 68" fill="none" stroke="${col.a}" stroke-width="1.5" opacity="0.75"/>
        <path d="M102 28 Q106 52 98 66" fill="none" stroke="${col.b}" stroke-width="1.25" opacity="0.6"/>
        <ellipse cx="80" cy="90" rx="46" ry="12" fill="none" stroke="${col.a}" stroke-width="1.15" opacity="0.45"/>
        <ellipse cx="80" cy="90" rx="26" ry="7" fill="${col.b}" opacity="0.08"/>`,
    };
    const body =
      stemScenes[item.id] ??
      `${veil(uid, col.c)}<circle cx="80" cy="60" r="26" fill="none" stroke="${col.a}" stroke-width="1.3" opacity="0.5"/>`;
    return svgWrap(body, 'bazi-art-svg bazi-art-stem is-cover');
  }

  // 地支：时空感、节气感（无文字）
  const branchScenes: Record<string, string> = {
    子: `
      ${veil(uid, col.c)}
      <circle cx="122" cy="30" r="6" fill="none" stroke="${col.b}" stroke-width="1" opacity="0.35"/>
      <circle cx="122" cy="30" r="1.6" fill="${col.b}" opacity="0.4"/>
      <path d="M24 58 Q56 90 50 112" fill="none" stroke="${col.a}" stroke-width="1.7" opacity="0.65"/>
      <path d="M58 52 Q88 94 92 114" fill="none" stroke="${col.b}" stroke-width="1.35" opacity="0.5"/>`,
    丑: `
      ${veil(uid, col.c)}
      <path d="M34 86 H128 V108 H34 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.15" opacity="0.8"/>
      <path d="M48 86 V68 H72 V86 M92 86 V60 H116 V86" fill="none" stroke="${col.b}" stroke-width="1.2" opacity="0.55"/>`,
    寅: `
      ${veil(uid, col.c)}
      <path d="M42 108 L56 52 L70 108 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.15" opacity="0.75"/>
      <path d="M78 108 L96 34 L114 108 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.25" opacity="0.85"/>
      <path d="M96 34 L96 20" stroke="${col.b}" stroke-width="1.3" stroke-linecap="round" opacity="0.55"/>`,
    卯: `
      ${veil(uid, col.c)}
      <circle cx="124" cy="34" r="11" fill="none" stroke="${col.b}" stroke-width="1.1" opacity="0.35"/>
      <path d="M58 108 L62 56" stroke="${col.a}" stroke-width="1.7"/>
      <path d="M62 72 Q44 56 40 70 Q54 74 62 72 Q84 52 90 72 Q74 78 62 72" fill="none" stroke="${col.b}" stroke-width="1.35" opacity="0.75"/>`,
    辰: `
      ${veil(uid, col.c)}
      <ellipse cx="80" cy="74" rx="46" ry="20" fill="${col.c}" stroke="${col.a}" stroke-width="1.2" opacity="0.65"/>
      <path d="M42 74 Q80 90 118 74" fill="none" stroke="${col.b}" stroke-width="1.1" opacity="0.45"/>`,
    巳: `
      ${veil(uid, col.c)}
      <path d="M58 100 L80 42 L102 100 Z" fill="none" stroke="${col.a}" stroke-width="1.35" opacity="0.7"/>
      <path d="M80 42 Q72 58 80 74 Q88 58 80 42" fill="${col.b}" opacity="0.22" stroke="${col.b}" stroke-width="0.9"/>`,
    午: `
      ${veil(uid, col.c)}
      <circle cx="80" cy="48" r="17" fill="${col.b}" opacity="0.22" stroke="${col.a}" stroke-width="1.4"/>
      ${[0, 45, 90, 135, 180, 225, 270, 315]
        .map((d) => {
          const r = (d * Math.PI) / 180;
          return `<line x1="${80 + Math.cos(r) * 22}" y1="${48 + Math.sin(r) * 22}" x2="${80 + Math.cos(r) * 38}" y2="${48 + Math.sin(r) * 38}" stroke="${col.b}" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>`;
        })
        .join('')}
      <path d="M28 108 Q80 92 132 108" fill="none" stroke="${col.a}" stroke-width="1" opacity="0.28"/>`,
    未: `
      ${veil(uid, col.c)}
      <path d="M20 72 Q56 56 90 72 Q120 84 144 66" fill="none" stroke="${col.a}" stroke-width="1.5" opacity="0.65"/>
      <path d="M24 92 Q70 80 116 94 Q134 100 146 90" fill="none" stroke="${col.b}" stroke-width="1.15" opacity="0.45"/>
      <ellipse cx="58" cy="58" rx="7" ry="4" fill="none" stroke="${col.b}" stroke-width="0.9" opacity="0.35"/>`,
    申: `
      ${veil(uid, col.c)}
      <path d="M24 88 L144 56" stroke="${col.a}" stroke-width="1.7" stroke-linecap="round" opacity="0.7"/>
      <path d="M24 98 L144 66" stroke="${col.b}" stroke-width="1" opacity="0.35" stroke-dasharray="3 3"/>
      <path d="M96 40 L114 48 L104 68 Z" fill="${col.c}" stroke="${col.b}" stroke-width="1.1" opacity="0.75"/>`,
    酉: `
      ${veil(uid, col.c)}
      <path d="M20 68 Q80 40 140 68" fill="none" stroke="${col.b}" stroke-width="1.2" opacity="0.35"/>
      <circle cx="80" cy="74" r="18" fill="none" stroke="${col.a}" stroke-width="1.45" opacity="0.75"/>
      <circle cx="80" cy="74" r="3.5" fill="${col.b}" opacity="0.35"/>
      <path d="M112 46 Q132 54 142 68" fill="none" stroke="${col.b}" stroke-width="1.1" opacity="0.45"/>`,
    戌: `
      ${veil(uid, col.c)}
      <path d="M36 100 L46 52 L80 42 L114 52 L124 100 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.3" opacity="0.85"/>
      <path d="M56 100 V62 H104 V100" fill="none" stroke="${col.b}" stroke-width="1.1" opacity="0.5"/>`,
    亥: `
      ${veil(uid, col.c)}
      <ellipse cx="80" cy="80" rx="50" ry="22" fill="${col.c}" stroke="${col.a}" stroke-width="1.15" opacity="0.5"/>
      <path d="M42 80 Q80 96 118 80" fill="none" stroke="${col.b}" stroke-width="1.1" opacity="0.45"/>
      <circle cx="122" cy="30" r="4.5" fill="none" stroke="${col.b}" stroke-width="0.9" opacity="0.35"/>`,
  };
  const body =
    branchScenes[item.id] ??
    `${veil(uid, col.c)}<circle cx="80" cy="60" r="26" fill="none" stroke="${col.a}" stroke-width="1.3" opacity="0.5"/>`;
  return svgWrap(body, 'bazi-art-svg bazi-art-branch is-cover');
}

const TG_ACCENT = { a: '#9a7a4a', b: '#d4b888', c: '#16120e' };

/** 十神：人生角色之象（无文字） */
export function tengodArtSvg(name: string, opts?: { uid?: string }): string {
  const col = TG_ACCENT;
  const uid = opts?.uid ?? `tg-${name}`;
  const scenes: Record<string, string> = {
    // 比肩：两圆并肩
    比肩: `
      ${veil(uid, col.c)}
      <circle cx="56" cy="58" r="17" fill="none" stroke="${col.b}" stroke-width="1.45" opacity="0.75"/>
      <circle cx="104" cy="58" r="17" fill="none" stroke="${col.b}" stroke-width="1.45" opacity="0.75"/>
      <path d="M73 58 H87" stroke="${col.a}" stroke-width="1.6" opacity="0.55"/>`,
    // 劫财：中心被拉扯
    劫财: `
      ${veil(uid, col.c)}
      <circle cx="80" cy="58" r="16" fill="none" stroke="${col.b}" stroke-width="1.4" opacity="0.7"/>
      <path d="M46 40 L68 56 L46 72 M114 40 L92 56 L114 72" fill="none" stroke="${col.a}" stroke-width="1.5" stroke-linecap="round" opacity="0.65"/>`,
    // 食神：柔和输出
    食神: `
      ${veil(uid, col.c)}
      <circle cx="80" cy="48" r="13" fill="none" stroke="${col.b}" stroke-width="1.3" opacity="0.7"/>
      <path d="M80 61 Q56 86 46 104 M80 61 Q104 86 114 104" fill="none" stroke="${col.a}" stroke-width="1.35" stroke-linecap="round" opacity="0.6"/>`,
    // 伤官：锋利突破
    伤官: `
      ${veil(uid, col.c)}
      <path d="M58 100 L80 30 L102 100 Z" fill="none" stroke="${col.a}" stroke-width="1.45" opacity="0.75"/>
      <path d="M80 30 L80 78" stroke="${col.b}" stroke-width="1.7" opacity="0.65"/>`,
    // 正财：规整库藏
    正财: `
      ${veil(uid, col.c)}
      <rect x="52" y="40" width="56" height="46" rx="3" fill="none" stroke="${col.b}" stroke-width="1.4" opacity="0.75"/>
      <path d="M66 56 H94 M66 70 H94" stroke="${col.a}" stroke-width="1.15" opacity="0.5"/>`,
    // 偏财：流动机会
    偏财: `
      ${veil(uid, col.c)}
      <path d="M28 72 Q60 40 92 66 Q120 90 146 54" fill="none" stroke="${col.a}" stroke-width="1.7" stroke-linecap="round" opacity="0.7"/>
      <circle cx="56" cy="56" r="4" fill="none" stroke="${col.b}" stroke-width="1.1" opacity="0.55"/>
      <circle cx="102" cy="74" r="4" fill="none" stroke="${col.b}" stroke-width="1.1" opacity="0.55"/>
      <circle cx="132" cy="58" r="3.2" fill="none" stroke="${col.b}" stroke-width="1" opacity="0.45"/>`,
    // 正官：台阶 / 印章 / 秩序
    正官: `
      ${veil(uid, col.c)}
      <path d="M42 96 H118" stroke="${col.a}" stroke-width="1.3" opacity="0.45"/>
      <path d="M50 84 H110" stroke="${col.a}" stroke-width="1.3" opacity="0.55"/>
      <path d="M58 72 H102" stroke="${col.a}" stroke-width="1.3" opacity="0.65"/>
      <rect x="68" y="38" width="24" height="28" fill="none" stroke="${col.b}" stroke-width="1.35" opacity="0.75"/>
      <path d="M74 48 H86 M74 56 H86" stroke="${col.b}" stroke-width="0.9" opacity="0.45"/>`,
    // 七杀：刀锋风压
    七杀: `
      ${veil(uid, col.c)}
      <path d="M48 96 L80 28 L112 96 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.35" opacity="0.85"/>
      <path d="M80 28 L80 78" stroke="${col.b}" stroke-width="1.9" opacity="0.7"/>
      <path d="M36 52 H58 M102 52 H124" stroke="${col.b}" stroke-width="1" opacity="0.3"/>`,
    // 正印：书卷 / 庇护
    正印: `
      ${veil(uid, col.c)}
      <path d="M38 88 Q80 34 122 88" fill="none" stroke="${col.b}" stroke-width="1.6" opacity="0.65"/>
      <circle cx="80" cy="72" r="13" fill="none" stroke="${col.a}" stroke-width="1.25" opacity="0.65"/>
      <path d="M80 59 V48" stroke="${col.b}" stroke-width="1.2" opacity="0.5"/>`,
    // 偏印：孤圈抽离
    偏印: `
      ${veil(uid, col.c)}
      <circle cx="80" cy="56" r="20" fill="none" stroke="${col.b}" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.55"/>
      <circle cx="80" cy="56" r="5.5" fill="${col.b}" opacity="0.28"/>
      <path d="M40 100 Q80 80 120 100" fill="none" stroke="${col.a}" stroke-width="1.05" opacity="0.35"/>`,
  };
  const body =
    scenes[name] ??
    `${veil(uid, col.c)}<circle cx="80" cy="60" r="24" fill="none" stroke="${col.a}" stroke-width="1.3" opacity="0.5"/>`;
  return svgWrap(body, 'bazi-art-svg bazi-art-tengod is-cover');
}

/** 结构屏缩小版（同记忆图语言） */
export function structureArtFromLore(
  lore:
    | { kind: 'wuxing'; id: WuXing }
    | StemBranchLore
    | { kind: 'tengod'; name: string },
): string {
  if (lore.kind === 'wuxing') {
    return `<div class="bazi-enc-struct-art">${wuxingArtSvg(lore.id, { uid: `st-wx-${lore.id}` })}</div>`;
  }
  if (lore.kind === 'tengod') {
    return `<div class="bazi-enc-struct-art">${tengodArtSvg(lore.name, { uid: `st-tg-${lore.name}` })}</div>`;
  }
  return `<div class="bazi-enc-struct-art">${stemBranchArtSvg(lore, { uid: `st-gz-${lore.id}` })}</div>`;
}

export function artFrameHtml(opts: {
  lit: boolean;
  /** SVG 或记忆封面 img HTML */
  svg: string;
  title: string;
  sub: string;
  badge?: string;
  extraClass?: string;
  dataId: string;
}): string {
  const { lit, svg, title, sub, badge, extraClass = '', dataId } = opts;
  const hasCover = svg.includes('bazi-art-cover');
  return `
    <button type="button" class="bazi-art-card ${extraClass} ${lit ? 'is-lit' : 'is-dim'}${hasCover ? ' has-cover' : ''}" data-codex-id="${dataId}">
      <div class="bazi-art-stage">
        ${svg}
        ${lit ? '<span class="bazi-art-particles" aria-hidden="true"></span>' : '<span class="bazi-art-seal" aria-hidden="true"></span>'}
      </div>
      <strong>${title}</strong>
      <em>${sub}</em>
      ${badge ? `<span class="bazi-wx-badge ${lit ? '' : 'is-lock'}">${badge}</span>` : ''}
    </button>`;
}
