/**
 * 三十纳音记忆顶图（纯意象，图上不写字）
 * 风格对齐 codex-art：帷幕底色 + 五行色相 + is-cover
 */
import { NAYIN_ATLAS } from './codex-atlas-catalog.ts';
import type { WuXing } from './elements.ts';

const WX_ACCENT: Record<WuXing, { a: string; b: string; c: string }> = {
  木: { a: '#2f6b48', b: '#6aab84', c: '#0e1f16' },
  火: { a: '#a84830', b: '#d4926a', c: '#2a100c' },
  土: { a: '#8a6e3e', b: '#c4a66e', c: '#241a10' },
  金: { a: '#a8a090', b: '#ddd6c4', c: '#1e1c18' },
  水: { a: '#2f5a88', b: '#6a9cbc', c: '#0c1624' },
};

const NAYIN_WX = Object.fromEntries(
  NAYIN_ATLAS.map((n) => [n.name, n.wuxing as WuXing]),
) as Record<string, WuXing>;

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

type SceneFn = (uid: string, col: { a: string; b: string; c: string }) => string;

const SCENES: Record<string, SceneFn> = {
  海中金: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M18 48 Q48 72 42 104 M52 42 Q82 78 78 108 M88 46 Q116 80 122 106 M118 50 Q140 78 146 100" fill="none" stroke="${col.a}" stroke-width="1.4" opacity="0.45"/>
    <circle cx="80" cy="78" r="14" fill="${col.c}" stroke="${col.b}" stroke-width="1.35" opacity="0.88"/>
    <circle cx="80" cy="78" r="5" fill="${col.b}" opacity="0.28"/>`,
  炉中火: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M48 100 H112 V78 Q112 58 80 52 Q48 58 48 78 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.3" opacity="0.88"/>
    <path d="M80 74 Q70 58 80 40 Q90 58 80 74" fill="${col.b}" opacity="0.35" stroke="${col.a}" stroke-width="1"/>
    <circle cx="80" cy="52" r="4" fill="${col.b}" opacity="0.4"/>`,
  大林木: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M40 108 L48 48 L56 108 Z M68 108 L80 30 L92 108 Z M104 108 L114 52 L124 108 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.15" opacity="0.82"/>
    <path d="M80 30 L80 18 M48 48 L48 38 M114 52 L114 42" stroke="${col.b}" stroke-width="1.2" opacity="0.5"/>`,
  路旁土: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M24 88 L70 70 L136 88" fill="none" stroke="${col.a}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <path d="M28 100 Q80 90 132 100" fill="none" stroke="${col.b}" stroke-width="1.2" opacity="0.4"/>
    <path d="M50 70 L46 54 M90 76 L94 58" stroke="${col.b}" stroke-width="1" opacity="0.35"/>`,
  剑锋金: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M58 100 L84 28 L94 34 L72 104 Z" fill="${col.c}" stroke="${col.b}" stroke-width="1.35" opacity="0.92"/>
    <path d="M84 28 L98 18" stroke="${col.a}" stroke-width="1.5" stroke-linecap="round" opacity="0.65"/>
    <path d="M70 104 H100" stroke="${col.a}" stroke-width="1.6" opacity="0.55"/>`,
  山头火: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M22 100 L58 48 L80 68 L108 36 L142 100 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.25" opacity="0.85"/>
    <circle cx="108" cy="36" r="10" fill="${col.b}" opacity="0.28" stroke="${col.a}" stroke-width="1.1"/>
    <path d="M108 24 L108 16 M100 30 L94 24 M116 30 L122 24" stroke="${col.b}" stroke-width="1.1" stroke-linecap="round" opacity="0.55"/>`,
  涧下水: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M42 28 L52 100 M118 28 L108 100" fill="none" stroke="${col.a}" stroke-width="1.5" opacity="0.45"/>
    <path d="M72 36 Q80 70 76 108" fill="none" stroke="${col.b}" stroke-width="1.8" stroke-linecap="round" opacity="0.75"/>
    <path d="M86 40 Q90 72 88 106" fill="none" stroke="${col.a}" stroke-width="1.3" opacity="0.55"/>`,
  城头土: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M32 96 H128 V70 H32 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.2" opacity="0.85"/>
    <path d="M40 70 V52 H56 V70 M72 70 V48 H88 V70 M104 70 V52 H120 V70" fill="none" stroke="${col.b}" stroke-width="1.25" opacity="0.65"/>`,
  白蜡金: (uid, col) => `
    ${veil(uid, col.c)}
    <ellipse cx="80" cy="62" rx="22" ry="28" fill="${col.c}" stroke="${col.b}" stroke-width="1.3" opacity="0.85"/>
    <ellipse cx="80" cy="54" rx="10" ry="8" fill="${col.b}" opacity="0.18"/>
    <path d="M68 88 Q80 98 92 88" fill="none" stroke="${col.a}" stroke-width="1" opacity="0.4"/>`,
  杨柳木: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M70 108 Q74 60 86 28" fill="none" stroke="${col.a}" stroke-width="1.8" stroke-linecap="round" opacity="0.75"/>
    <path d="M86 40 Q108 58 118 90 M86 52 Q104 70 112 98 M78 48 Q58 70 50 96" fill="none" stroke="${col.b}" stroke-width="1.25" opacity="0.6"/>`,
  泉中水: (uid, col) => `
    ${veil(uid, col.c)}
    <ellipse cx="80" cy="88" rx="36" ry="12" fill="none" stroke="${col.a}" stroke-width="1.2" opacity="0.5"/>
    <ellipse cx="80" cy="88" rx="20" ry="7" fill="${col.b}" opacity="0.1"/>
    <path d="M80 88 Q76 60 80 36 Q84 60 80 88" fill="none" stroke="${col.b}" stroke-width="1.5" opacity="0.7"/>
    <circle cx="80" cy="40" r="3" fill="${col.b}" opacity="0.35"/>`,
  屋上土: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M36 78 L80 40 L124 78 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.3" opacity="0.88"/>
    <path d="M48 78 H112 V100 H48 Z" fill="none" stroke="${col.b}" stroke-width="1.15" opacity="0.55"/>
    <path d="M80 40 L80 28" stroke="${col.b}" stroke-width="1.2" opacity="0.4"/>`,
  霹雳火: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M78 22 L62 56 H86 L70 98" fill="none" stroke="${col.b}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>
    <circle cx="70" cy="98" r="5" fill="${col.a}" opacity="0.35"/>
    <path d="M96 34 L108 48 M50 40 L40 52" stroke="${col.a}" stroke-width="1.1" opacity="0.4"/>`,
  松柏木: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M80 108 L80 34" stroke="${col.a}" stroke-width="2.4" stroke-linecap="round" opacity="0.85"/>
    <path d="M80 48 L54 68 L80 60 L106 68 Z M80 62 L58 82 L80 74 L102 82 Z M80 78 L64 96 L80 90 L96 96 Z" fill="${col.c}" stroke="${col.b}" stroke-width="1" opacity="0.8"/>`,
  长流水: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M14 48 Q50 36 86 52 Q118 66 150 44" fill="none" stroke="${col.a}" stroke-width="1.7" opacity="0.7"/>
    <path d="M16 68 Q54 56 90 72 Q122 86 148 64" fill="none" stroke="${col.b}" stroke-width="1.4" opacity="0.55"/>
    <path d="M18 88 Q58 78 94 90 Q124 100 146 82" fill="none" stroke="${col.a}" stroke-width="1.15" opacity="0.4"/>`,
  沙中金: (uid, col) => `
    ${veil(uid, col.c)}
    <circle cx="48" cy="78" r="2.2" fill="${col.a}" opacity="0.35"/>
    <circle cx="64" cy="92" r="1.8" fill="${col.b}" opacity="0.3"/>
    <circle cx="102" cy="86" r="2" fill="${col.a}" opacity="0.3"/>
    <circle cx="118" cy="72" r="1.6" fill="${col.b}" opacity="0.28"/>
    <circle cx="80" cy="64" r="11" fill="${col.c}" stroke="${col.b}" stroke-width="1.25" opacity="0.9"/>
    <circle cx="80" cy="64" r="4" fill="${col.b}" opacity="0.3"/>`,
  山下火: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M28 58 L80 22 L132 58" fill="none" stroke="${col.a}" stroke-width="1.4" opacity="0.55"/>
    <path d="M40 100 Q80 70 120 100" fill="none" stroke="${col.a}" stroke-width="1.2" opacity="0.35"/>
    <path d="M80 92 Q70 76 80 58 Q90 76 80 92" fill="${col.b}" opacity="0.35" stroke="${col.a}" stroke-width="1.1"/>`,
  平地木: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M22 96 H138" stroke="${col.a}" stroke-width="1.2" opacity="0.4"/>
    <path d="M80 96 L80 36" stroke="${col.a}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M80 58 L52 40 M80 48 L108 30 M80 42 L66 24 M80 42 L96 22" fill="none" stroke="${col.b}" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>`,
  壁上土: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M46 28 V100 H114 V28" fill="${col.c}" stroke="${col.a}" stroke-width="1.3" opacity="0.85"/>
    <path d="M46 48 H114 M46 68 H114 M46 88 H114" stroke="${col.b}" stroke-width="0.9" opacity="0.35"/>
    <path d="M70 28 V100" stroke="${col.b}" stroke-width="0.8" opacity="0.25"/>`,
  金箔金: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M40 70 L80 42 L120 70 L80 98 Z" fill="none" stroke="${col.b}" stroke-width="1.35" opacity="0.75"/>
    <path d="M50 68 L80 48 L110 68 L80 88 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.1" opacity="0.7"/>
    <path d="M60 66 L80 54 L100 66 L80 78 Z" fill="${col.b}" opacity="0.15"/>`,
  覆灯火: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M56 48 Q80 28 104 48 L96 58 H64 Z" fill="${col.c}" stroke="${col.a}" stroke-width="1.2" opacity="0.85"/>
    <path d="M80 58 L80 88" stroke="${col.a}" stroke-width="1.6" opacity="0.65"/>
    <path d="M80 72 Q68 62 80 50 Q92 62 80 72" fill="${col.b}" opacity="0.3"/>
    <ellipse cx="80" cy="96" rx="18" ry="5" fill="none" stroke="${col.b}" stroke-width="0.9" opacity="0.35"/>`,
  天河水: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M24 92 Q60 48 100 36 Q130 28 148 40" fill="none" stroke="${col.b}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <circle cx="48" cy="70" r="1.4" fill="${col.a}" opacity="0.5"/>
    <circle cx="78" cy="46" r="1.2" fill="${col.b}" opacity="0.45"/>
    <circle cx="112" cy="34" r="1.5" fill="${col.a}" opacity="0.5"/>
    <circle cx="132" cy="38" r="1.1" fill="${col.b}" opacity="0.4"/>`,
  大驿土: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M20 86 L70 62 L140 78" fill="none" stroke="${col.a}" stroke-width="2.4" stroke-linecap="round" opacity="0.75"/>
    <path d="M24 98 L74 76 L144 90" fill="none" stroke="${col.b}" stroke-width="1.3" opacity="0.4"/>
    <path d="M68 64 L62 48 M100 70 L106 52" stroke="${col.b}" stroke-width="1" opacity="0.35"/>`,
  钗钏金: (uid, col) => `
    ${veil(uid, col.c)}
    <circle cx="72" cy="58" r="18" fill="none" stroke="${col.b}" stroke-width="1.5" opacity="0.8"/>
    <circle cx="98" cy="52" r="10" fill="none" stroke="${col.a}" stroke-width="1.25" opacity="0.7"/>
    <path d="M54 70 Q80 96 110 64" fill="none" stroke="${col.b}" stroke-width="1.1" opacity="0.45"/>
    <circle cx="98" cy="52" r="3" fill="${col.b}" opacity="0.25"/>`,
  桑柘木: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M80 104 L80 50" stroke="${col.a}" stroke-width="1.9"/>
    <ellipse cx="66" cy="54" rx="16" ry="12" fill="none" stroke="${col.b}" stroke-width="1.2" opacity="0.65"/>
    <ellipse cx="96" cy="48" rx="14" ry="11" fill="none" stroke="${col.b}" stroke-width="1.15" opacity="0.6"/>
    <ellipse cx="80" cy="66" rx="12" ry="9" fill="${col.c}" stroke="${col.a}" stroke-width="1" opacity="0.55"/>`,
  大溪水: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M30 36 Q58 78 52 108" fill="none" stroke="${col.a}" stroke-width="2.2" stroke-linecap="round" opacity="0.75"/>
    <path d="M58 32 Q90 80 86 110" fill="none" stroke="${col.b}" stroke-width="1.8" opacity="0.65"/>
    <path d="M92 40 Q120 82 126 106" fill="none" stroke="${col.a}" stroke-width="1.5" opacity="0.5"/>`,
  沙中土: (uid, col) => `
    ${veil(uid, col.c)}
    <circle cx="52" cy="70" r="3" fill="${col.a}" opacity="0.4"/>
    <circle cx="68" cy="86" r="4" fill="${col.b}" opacity="0.35"/>
    <circle cx="90" cy="74" r="5" fill="${col.a}" opacity="0.38"/>
    <circle cx="110" cy="88" r="3.2" fill="${col.b}" opacity="0.32"/>
    <circle cx="78" cy="58" r="2.4" fill="${col.b}" opacity="0.3"/>
    <path d="M36 100 Q80 92 128 102" fill="none" stroke="${col.a}" stroke-width="1" opacity="0.3"/>`,
  天上火: (uid, col) => `
    ${veil(uid, col.c)}
    <circle cx="80" cy="44" r="18" fill="${col.b}" opacity="0.22" stroke="${col.a}" stroke-width="1.4"/>
    ${[0, 45, 90, 135, 180, 225, 270, 315]
      .map((d) => {
        const r = (d * Math.PI) / 180;
        return `<line x1="${80 + Math.cos(r) * 24}" y1="${44 + Math.sin(r) * 24}" x2="${80 + Math.cos(r) * 40}" y2="${44 + Math.sin(r) * 40}" stroke="${col.b}" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>`;
      })
      .join('')}
    <path d="M28 104 Q80 88 132 104" fill="none" stroke="${col.a}" stroke-width="1" opacity="0.28"/>`,
  石榴木: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M80 100 L80 58" stroke="${col.a}" stroke-width="1.7"/>
    <circle cx="68" cy="52" r="9" fill="none" stroke="${col.b}" stroke-width="1.2" opacity="0.7"/>
    <circle cx="92" cy="48" r="8" fill="none" stroke="${col.b}" stroke-width="1.15" opacity="0.65"/>
    <circle cx="80" cy="66" r="7" fill="${col.c}" stroke="${col.a}" stroke-width="1.1" opacity="0.7"/>
    <circle cx="80" cy="66" r="2.2" fill="${col.b}" opacity="0.35"/>`,
  大海水: (uid, col) => `
    ${veil(uid, col.c)}
    <path d="M12 58 Q40 88 70 62 Q100 36 130 70 Q148 86 156 64" fill="none" stroke="${col.a}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <path d="M14 78 Q46 104 78 80 Q110 56 146 88" fill="none" stroke="${col.b}" stroke-width="1.5" opacity="0.5"/>
    <ellipse cx="80" cy="40" rx="40" ry="8" fill="${col.b}" opacity="0.07"/>`,
};

/** 纳音记忆图；未知名回退为五行圆 */
export function nayinArtSvg(name: string, opts?: { uid?: string }): string {
  const wx = NAYIN_WX[name] ?? '土';
  const col = WX_ACCENT[wx];
  const idx = NAYIN_ATLAS.findIndex((n) => n.name === name);
  const uid = opts?.uid ?? `ny${idx >= 0 ? idx : 'x'}`;
  const scene = SCENES[name];
  const body =
    scene?.(uid, col) ??
    `${veil(uid, col.c)}<circle cx="80" cy="60" r="24" fill="none" stroke="${col.a}" stroke-width="1.3" opacity="0.5"/>`;
  return svgWrap(body, 'bazi-art-svg bazi-art-nayin is-cover');
}

export function listNayinArtNames(): string[] {
  return Object.keys(SCENES);
}
