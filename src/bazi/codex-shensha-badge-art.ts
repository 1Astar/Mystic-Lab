/**
 * 神煞扩展小章面（SVG）：无 webp 时的记忆徽章
 * 风格：圆章居中 ~30% 视口感 + 午夜靛蓝底（对齐精品章面留白）
 */
import { shenshaCardId } from './codex-tags.ts';

function svgWrap(inner: string): string {
  return `<svg class="bazi-art-svg bazi-art-ss-badge" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
}

function voidBg(uid: string): string {
  return `
    <defs>
      <radialGradient id="${uid}-bg" cx="50%" cy="48%" r="58%">
        <stop offset="0%" stop-color="#141828" stop-opacity="0.9"/>
        <stop offset="55%" stop-color="#0a0c14" stop-opacity="1"/>
        <stop offset="100%" stop-color="#050508" stop-opacity="1"/>
      </radialGradient>
      <radialGradient id="${uid}-glow" cx="50%" cy="50%" r="22%">
        <stop offset="0%" stop-color="#d4b56a" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#d4b56a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="120" height="120" fill="url(#${uid}-bg)"/>
    <circle cx="60" cy="60" r="26" fill="url(#${uid}-glow)"/>`;
}

function rim(_uid: string, stroke = '#c9a86a'): string {
  return `
    <circle cx="60" cy="60" r="22" fill="#12141c" stroke="${stroke}" stroke-width="1.6" opacity="0.95"/>
    <circle cx="60" cy="60" r="18.5" fill="none" stroke="${stroke}" stroke-width="0.6" opacity="0.35"/>`;
}

type BadgeFn = (uid: string) => string;

/** 按神煞名绘制；无专属则返回空 */
const BADGES: Record<string, BadgeFn> = {
  天德: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#d4b56a')}
    <path d="M60 48 Q52 56 60 68 Q68 56 60 48" fill="#d4b56a" opacity="0.35"/>
    <circle cx="60" cy="54" r="3.2" fill="#f0d78a" opacity="0.7"/>
    <path d="M48 70 Q60 64 72 70" fill="none" stroke="#c9a86a" stroke-width="1.1" opacity="0.55"/>`,
  月德: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#b8c4d8')}
    <path d="M66 48 A10 10 0 1 1 66 72 A7.5 7.5 0 1 0 66 48" fill="#d8e0f0" opacity="0.55"/>
    <circle cx="70" cy="52" r="1.4" fill="#f0f4ff" opacity="0.7"/>`,
  福星: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#d4b56a')}
    <path d="M60 46 L62.5 54 H71 L64 59 L66.5 67 L60 62 L53.5 67 L56 59 L49 54 H57.5 Z" fill="#f0d78a" opacity="0.55"/>
    <circle cx="60" cy="60" r="3" fill="none" stroke="#c9a86a" stroke-width="0.8" opacity="0.45"/>`,
  金舆: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#d0c4a0')}
    <rect x="50" y="52" width="20" height="12" rx="2" fill="#2a2418" stroke="#d0c4a0" stroke-width="1.1" opacity="0.9"/>
    <path d="M52 52 L56 46 H64 L68 52" fill="none" stroke="#d0c4a0" stroke-width="1.1" opacity="0.7"/>
    <circle cx="54" cy="66" r="2.2" fill="#c9a86a" opacity="0.55"/>
    <circle cx="66" cy="66" r="2.2" fill="#c9a86a" opacity="0.55"/>`,
  天厨: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#c4a66e')}
    <path d="M50 66 H70 L66 52 H54 Z" fill="#2a2014" stroke="#c4a66e" stroke-width="1.1" opacity="0.9"/>
    <ellipse cx="60" cy="50" rx="8" ry="3" fill="none" stroke="#d4b56a" stroke-width="1" opacity="0.55"/>
    <path d="M60 46 V42" stroke="#d4b56a" stroke-width="1.1" opacity="0.5"/>`,
  学堂: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#c9a86a')}
    <path d="M48 58 L60 50 L72 58 L60 66 Z" fill="#1a1820" stroke="#c9a86a" stroke-width="1.15" opacity="0.92"/>
    <path d="M60 50 V66" stroke="#c9a86a" stroke-width="0.9" opacity="0.55"/>
    <circle cx="66" cy="48" r="2.2" fill="#f0d78a" opacity="0.55"/>`,
  空亡: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#8a9bb0')}
    <circle cx="60" cy="60" r="9" fill="none" stroke="#a8b8cc" stroke-width="1.5" opacity="0.7" stroke-dasharray="3 2.5"/>
    <circle cx="60" cy="60" r="3" fill="none" stroke="#8a9bb0" stroke-width="0.9" opacity="0.4"/>`,
  病符: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#7a9a78')}
    <path d="M60 48 V72 M52 56 H68" stroke="#9bbb98" stroke-width="1.6" stroke-linecap="round" opacity="0.65"/>
    <path d="M54 66 Q60 70 66 66" fill="none" stroke="#7a9a78" stroke-width="1" opacity="0.45"/>`,
  白虎: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#c8d0dc')}
    <path d="M48 62 Q60 46 72 62 Q60 70 48 62" fill="#e8eef6" opacity="0.28" stroke="#c8d0dc" stroke-width="1.1"/>
    <path d="M54 56 L50 50 M66 56 L70 50" stroke="#c8d0dc" stroke-width="1.2" stroke-linecap="round" opacity="0.55"/>
    <circle cx="56" cy="58" r="1.3" fill="#1a1c24"/><circle cx="64" cy="58" r="1.3" fill="#1a1c24"/>`,
  灾煞: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#b08060')}
    <path d="M60 48 L66 62 H54 Z" fill="none" stroke="#d4a06a" stroke-width="1.4" opacity="0.7"/>
    <path d="M60 56 V60" stroke="#d4a06a" stroke-width="1.3" stroke-linecap="round" opacity="0.7"/>
    <circle cx="60" cy="64" r="1.2" fill="#d4a06a" opacity="0.7"/>`,
  亡神: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#7a8898')}
    <path d="M52 66 Q60 48 68 66" fill="none" stroke="#9aa8b8" stroke-width="1.3" opacity="0.55"/>
    <path d="M56 58 H64" stroke="#7a8898" stroke-width="1" opacity="0.4"/>
    <circle cx="60" cy="54" r="2" fill="#9aa8b8" opacity="0.35"/>`,
  咸池: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#d4a0b0')}
    <circle cx="60" cy="58" r="7" fill="none" stroke="#e0b0c0" stroke-width="1.2" opacity="0.65"/>
    <path d="M54 66 Q60 70 66 66" fill="none" stroke="#d4a0b0" stroke-width="1" opacity="0.5"/>
    <circle cx="63" cy="55" r="1.5" fill="#f0d0d8" opacity="0.45"/>`,
  天德合: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#d4b56a')}
    <circle cx="52" cy="56" r="7" fill="none" stroke="#c9a86a" stroke-width="1.2" opacity="0.7"/>
    <circle cx="68" cy="56" r="7" fill="none" stroke="#d4b56a" stroke-width="1.2" opacity="0.7"/>
    <circle cx="60" cy="56" r="2.5" fill="#f0d78a" opacity="0.45"/>`,
  月德合: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#b8c4d8')}
    <path d="M54 52 A8 8 0 1 1 54 68" fill="none" stroke="#d8e0f0" stroke-width="1.3" opacity="0.6"/>
    <circle cx="66" cy="58" r="5" fill="none" stroke="#b8c4d8" stroke-width="1.1" opacity="0.55"/>`,
  天赦: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#d4b56a')}
    <path d="M48 58 H72 M60 48 V68" stroke="#f0d78a" stroke-width="1.5" stroke-linecap="round" opacity="0.55"/>
    <circle cx="60" cy="58" r="10" fill="none" stroke="#c9a86a" stroke-width="1" opacity="0.35"/>`,
  三奇贵人: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#e0c070')}
    <circle cx="48" cy="58" r="3" fill="#f0d78a" opacity="0.55"/>
    <circle cx="60" cy="50" r="3" fill="#f0d78a" opacity="0.7"/>
    <circle cx="72" cy="58" r="3" fill="#f0d78a" opacity="0.55"/>`,
  天医: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#7a9a88')}
    <path d="M60 48 V68 M52 58 H68" stroke="#9bbb98" stroke-width="1.7" stroke-linecap="round" opacity="0.7"/>
    <circle cx="60" cy="58" r="11" fill="none" stroke="#7a9a88" stroke-width="0.8" opacity="0.35"/>`,
  解神: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#c9a86a')}
    <path d="M48 52 Q60 46 72 52" fill="none" stroke="#d4b56a" stroke-width="1.3" opacity="0.65"/>
    <path d="M50 64 Q60 70 70 64" fill="none" stroke="#c9a86a" stroke-width="1.2" opacity="0.5"/>
    <path d="M56 56 L64 60 M64 56 L56 60" stroke="#f0d78a" stroke-width="1.1" opacity="0.55"/>`,
  词馆: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#c9a86a')}
    <rect x="50" y="48" width="20" height="24" rx="2" fill="#1a1820" stroke="#c9a86a" stroke-width="1.1" opacity="0.9"/>
    <path d="M54 54 H66 M54 60 H64 M54 66 H62" stroke="#d4b56a" stroke-width="0.9" opacity="0.5"/>`,
  文曲: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#b8a878')}
    <path d="M48 66 Q54 48 60 58 Q66 68 72 50" fill="none" stroke="#d4b56a" stroke-width="1.3" opacity="0.7"/>
    <circle cx="72" cy="50" r="2" fill="#f0d78a" opacity="0.55"/>`,
  天马: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#a8c0d8')}
    <path d="M46 62 Q54 48 70 54" fill="none" stroke="#c8d8e8" stroke-width="1.4" opacity="0.7"/>
    <path d="M62 50 L70 46 L68 54" fill="none" stroke="#a8c0d8" stroke-width="1.2" opacity="0.6"/>
    <circle cx="52" cy="64" r="2" fill="#8ab0d0" opacity="0.45"/>`,
  吊客: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#8a9098')}
    <path d="M52 50 H68 V66 H52 Z" fill="none" stroke="#a8b0b8" stroke-width="1.2" opacity="0.55"/>
    <path d="M56 56 H64 M56 61 H62" stroke="#8a9098" stroke-width="1" opacity="0.45"/>`,
  天哭: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#7a8898')}
    <path d="M52 54 Q60 50 68 54" fill="none" stroke="#9aa8b8" stroke-width="1.2" opacity="0.55"/>
    <path d="M56 62 Q60 68 64 62" fill="none" stroke="#7a8898" stroke-width="1.2" opacity="0.5"/>
    <circle cx="54" cy="56" r="1.2" fill="#9aa8b8" opacity="0.4"/><circle cx="66" cy="56" r="1.2" fill="#9aa8b8" opacity="0.4"/>`,
  天虚: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#6a7888')}
    <circle cx="60" cy="58" r="10" fill="none" stroke="#8a98a8" stroke-width="1.2" opacity="0.4" stroke-dasharray="2 2.5"/>
    <circle cx="60" cy="58" r="3" fill="none" stroke="#6a7888" stroke-width="0.9" opacity="0.35"/>`,
  破碎: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#b09070')}
    <path d="M50 50 L70 50 L66 68 H54 Z" fill="none" stroke="#c4a080" stroke-width="1.2" opacity="0.6" stroke-dasharray="3 2"/>
    <path d="M58 52 L62 66" stroke="#b09070" stroke-width="1.1" opacity="0.5"/>`,
  大耗: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#b08060')}
    <path d="M48 54 H72" stroke="#d4a06a" stroke-width="1.3" opacity="0.55"/>
    <path d="M66 50 L74 54 L66 58" fill="none" stroke="#d4a06a" stroke-width="1.2" opacity="0.65"/>
    <circle cx="52" cy="62" r="2.5" fill="none" stroke="#b08060" stroke-width="1" opacity="0.45"/>`,
  丧门: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#7a8090')}
    <path d="M52 66 V50 H68 V66" fill="none" stroke="#9aa0b0" stroke-width="1.3" opacity="0.55"/>
    <path d="M56 56 H64" stroke="#7a8090" stroke-width="1" opacity="0.4"/>`,
  魁罡: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#c8b070')}
    <path d="M60 46 L66 58 H54 Z" fill="#2a2418" stroke="#d4b56a" stroke-width="1.2" opacity="0.85"/>
    <path d="M60 58 V68" stroke="#c8b070" stroke-width="1.3" opacity="0.55"/>`,
  沐浴: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#7eb6f0')}
    <path d="M48 58 Q54 50 60 58 Q66 66 72 58" fill="none" stroke="#9ec8f0" stroke-width="1.3" opacity="0.65"/>
    <circle cx="60" cy="52" r="2.5" fill="#c8e0f8" opacity="0.4"/>`,
  风流: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#d4a0b0')}
    <path d="M52 66 Q48 52 60 48 Q72 52 68 66" fill="none" stroke="#e0b0c0" stroke-width="1.2" opacity="0.6"/>
    <circle cx="60" cy="56" r="3" fill="#f0d0d8" opacity="0.35"/>`,
  流霞: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#e0a090')}
    <path d="M46 62 Q60 48 74 58" fill="none" stroke="#f0b8a0" stroke-width="1.4" opacity="0.65"/>
    <path d="M50 66 Q60 56 70 64" fill="none" stroke="#e0a090" stroke-width="1.1" opacity="0.45"/>`,
  血刃: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#c08080')}
    <path d="M54 68 L60 46 L66 68" fill="none" stroke="#d4a0a0" stroke-width="1.4" opacity="0.7"/>
    <path d="M56 58 H64" stroke="#c08080" stroke-width="1.1" opacity="0.5"/>`,
  国印: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#d4b56a')}
    <rect x="50" y="50" width="20" height="20" rx="2" fill="#1a1820" stroke="#d4b56a" stroke-width="1.2" opacity="0.9"/>
    <circle cx="60" cy="60" r="4" fill="none" stroke="#f0d78a" stroke-width="1" opacity="0.55"/>`,
  台阁: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#c9a86a')}
    <path d="M48 66 H72 L66 52 H54 Z" fill="#1a1820" stroke="#c9a86a" stroke-width="1.15" opacity="0.9"/>
    <path d="M56 52 V46 H64 V52" fill="none" stroke="#d4b56a" stroke-width="1" opacity="0.55"/>`,
  权星: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#e0c070')}
    <circle cx="60" cy="54" r="5" fill="none" stroke="#f0d78a" stroke-width="1.3" opacity="0.7"/>
    <path d="M60 60 V70 M56 66 H64" stroke="#c9a86a" stroke-width="1.2" opacity="0.55"/>`,
  飞刃: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#b0b8c8')}
    <path d="M48 64 L70 48" stroke="#d0d8e4" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
    <path d="M64 46 L72 50 L66 54" fill="none" stroke="#b0b8c8" stroke-width="1.2" opacity="0.55"/>`,
  紫微: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#c0a0d0')}
    <path d="M60 46 L62 54 H70 L64 58 L66 66 L60 62 L54 66 L56 58 L50 54 H58 Z" fill="#e0c8f0" opacity="0.45"/>
    <circle cx="60" cy="56" r="2" fill="#f0e0ff" opacity="0.5"/>`,
  天官: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#d4b56a')}
    <path d="M50 64 L60 48 L70 64 Z" fill="none" stroke="#f0d78a" stroke-width="1.3" opacity="0.7"/>
    <circle cx="60" cy="58" r="3" fill="#c9a86a" opacity="0.4"/>`,
  仓廪: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#c4a66e')}
    <rect x="48" y="52" width="24" height="16" rx="2" fill="#2a2014" stroke="#c4a66e" stroke-width="1.15" opacity="0.9"/>
    <path d="M52 52 L56 46 H64 L68 52" fill="none" stroke="#d4b56a" stroke-width="1" opacity="0.55"/>`,
  飞财: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#d0b070')}
    <circle cx="54" cy="58" r="5" fill="none" stroke="#e0c080" stroke-width="1.2" opacity="0.65"/>
    <path d="M60 54 L72 48" stroke="#d0b070" stroke-width="1.3" opacity="0.6"/>
    <path d="M68 46 L74 48 L70 52" fill="none" stroke="#d0b070" stroke-width="1.1"/>`,
  进神: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#7ed0a0')}
    <path d="M50 64 L60 48 L70 64" fill="none" stroke="#9ee0b0" stroke-width="1.4" opacity="0.7"/>
    <path d="M60 54 V68" stroke="#7ed0a0" stroke-width="1.2" opacity="0.5"/>`,
  退神: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#8aa0b0')}
    <path d="M50 50 L60 66 L70 50" fill="none" stroke="#a8b8c8" stroke-width="1.4" opacity="0.65"/>
    <path d="M60 46 V58" stroke="#8aa0b0" stroke-width="1.2" opacity="0.45"/>`,
  富星: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#e0c070')}
    <circle cx="60" cy="56" r="8" fill="none" stroke="#f0d78a" stroke-width="1.3" opacity="0.65"/>
    <path d="M60 50 V62 M55 56 H65" stroke="#d4b56a" stroke-width="1.2" opacity="0.55"/>`,
  孤辰: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#8a9bb0')}
    <circle cx="60" cy="56" r="5" fill="#1a1c24" stroke="#a8b8cc" stroke-width="1.2" opacity="0.85"/>
    <circle cx="72" cy="64" r="2" fill="none" stroke="#8a9bb0" stroke-width="0.9" opacity="0.35"/>`,
  寡宿: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#7a8898')}
    <circle cx="56" cy="56" r="4.5" fill="none" stroke="#9aa8b8" stroke-width="1.2" opacity="0.55"/>
    <circle cx="66" cy="60" r="3" fill="none" stroke="#7a8898" stroke-width="1" opacity="0.4"/>`,
  隔角: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#9a8a70')}
    <path d="M48 50 H58 V70" fill="none" stroke="#c4b090" stroke-width="1.3" opacity="0.6"/>
    <path d="M62 50 H72 V70" fill="none" stroke="#c4b090" stroke-width="1.3" opacity="0.6"/>
    <path d="M58 60 H62" stroke="#9a8a70" stroke-width="1" stroke-dasharray="2 2" opacity="0.5"/>`,
  元辰: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#a08090')}
    <path d="M52 50 Q60 58 52 66 M68 50 Q60 58 68 66" fill="none" stroke="#c0a0b0" stroke-width="1.3" opacity="0.6"/>
    <circle cx="60" cy="58" r="2.5" fill="#a08090" opacity="0.35"/>`,
  天罗: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#8090a8')}
    <circle cx="60" cy="58" r="11" fill="none" stroke="#a0b0c8" stroke-width="1.1" opacity="0.5"/>
    <path d="M50 50 L70 66 M70 50 L50 66" stroke="#8090a8" stroke-width="1" opacity="0.4"/>`,
  地网: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#708070')}
    <path d="M48 52 H72 M48 58 H72 M48 64 H72" stroke="#90a090" stroke-width="1" opacity="0.45"/>
    <path d="M54 48 V68 M60 48 V68 M66 48 V68" stroke="#708070" stroke-width="0.9" opacity="0.4"/>`,
  马头带剑: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#b0a890')}
    <path d="M48 62 L58 50 L68 62" fill="none" stroke="#d0c8a8" stroke-width="1.3" opacity="0.65"/>
    <path d="M66 48 L72 54" stroke="#c0b090" stroke-width="1.4" opacity="0.7"/>`,
  阴差阳错: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#a090b0')}
    <path d="M50 52 A8 8 0 0 1 66 52" fill="none" stroke="#c0b0d0" stroke-width="1.2" opacity="0.6"/>
    <path d="M54 64 A8 8 0 0 0 70 64" fill="none" stroke="#9080a0" stroke-width="1.2" opacity="0.5"/>`,
  童子: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#c8b890')}
    <circle cx="60" cy="52" r="5" fill="none" stroke="#e0d0a8" stroke-width="1.2" opacity="0.65"/>
    <path d="M52 66 Q60 58 68 66" fill="none" stroke="#c8b890" stroke-width="1.2" opacity="0.5"/>`,
  挂剑: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#a8b0c0')}
    <path d="M60 48 V68" stroke="#c8d0e0" stroke-width="1.5" opacity="0.7"/>
    <path d="M54 52 H66" stroke="#a8b0c0" stroke-width="1.2" opacity="0.55"/>
    <circle cx="60" cy="46" r="2" fill="#d0d8e4" opacity="0.45"/>`,
  死符: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#8890a0')}
    <rect x="52" y="50" width="16" height="20" rx="2" fill="none" stroke="#a8b0c0" stroke-width="1.2" opacity="0.6"/>
    <path d="M56 58 H64 M60 54 V62" stroke="#8890a0" stroke-width="1" opacity="0.4"/>`,
  绞煞: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#a08090')}
    <path d="M48 56 Q60 44 72 56 Q60 68 48 56" fill="none" stroke="#c0a0b0" stroke-width="1.3" opacity="0.6"/>
    <circle cx="60" cy="56" r="3" fill="none" stroke="#a08090" stroke-width="1" opacity="0.45"/>`,
  五鬼: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#9080a8')}
    <circle cx="52" cy="54" r="2.2" fill="#b0a0c8" opacity="0.45"/>
    <circle cx="60" cy="48" r="2.2" fill="#b0a0c8" opacity="0.5"/>
    <circle cx="68" cy="54" r="2.2" fill="#b0a0c8" opacity="0.45"/>
    <circle cx="56" cy="64" r="2.2" fill="#9080a8" opacity="0.4"/>
    <circle cx="64" cy="64" r="2.2" fill="#9080a8" opacity="0.4"/>`,
  勾绞: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#b09090')}
    <path d="M50 50 Q60 58 50 66" fill="none" stroke="#d0b0b0" stroke-width="1.4" opacity="0.65"/>
    <path d="M70 50 Q60 58 70 66" fill="none" stroke="#b09090" stroke-width="1.4" opacity="0.55"/>`,
  披麻: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#9a9888')}
    <path d="M50 48 V68 M56 50 V66 M62 50 V66 M68 48 V68" stroke="#b8b4a0" stroke-width="1.1" opacity="0.5"/>
    <path d="M48 56 H72" stroke="#9a9888" stroke-width="1" opacity="0.4"/>`,
  六厄: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#a09080')}
    <path d="M52 50 L60 66 L68 50" fill="none" stroke="#c0b0a0" stroke-width="1.3" opacity="0.6"/>
    <path d="M48 58 H72" stroke="#a09080" stroke-width="1" opacity="0.4"/>`,
  胎神: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#c8a0b0')}
    <ellipse cx="60" cy="58" rx="8" ry="10" fill="none" stroke="#e0c0d0" stroke-width="1.2" opacity="0.6"/>
    <circle cx="60" cy="56" r="3" fill="#d0a8b8" opacity="0.35"/>`,
  养神: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#90b0a0')}
    <path d="M52 62 Q60 48 68 62" fill="none" stroke="#b0d0c0" stroke-width="1.3" opacity="0.6"/>
    <circle cx="60" cy="56" r="4" fill="none" stroke="#90b0a0" stroke-width="1.1" opacity="0.5"/>`,
  截路空亡: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#8090a0')}
    <path d="M48 56 H72" stroke="#a0b0c0" stroke-width="1.3" stroke-dasharray="3 3" opacity="0.55"/>
    <path d="M60 48 L60 64" stroke="#8090a0" stroke-width="1.2" opacity="0.5"/>
    <circle cx="60" cy="56" r="7" fill="none" stroke="#8090a0" stroke-width="1" opacity="0.4"/>`,
  劫煞: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#90a0b0')}
    <path d="M48 50 L72 66 M72 50 L48 66" stroke="#b0c0d0" stroke-width="1.4" opacity="0.55"/>
    <circle cx="60" cy="58" r="5" fill="none" stroke="#d0d8e0" stroke-width="1.2" opacity="0.65"/>`,
  正印: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#c9a86a')}
    <rect x="52" y="50" width="16" height="20" rx="2" fill="#1a1820" stroke="#d4b56a" stroke-width="1.15" opacity="0.9"/>
    <path d="M56 58 H64 M60 54 V62" stroke="#f0d78a" stroke-width="1.1" opacity="0.55"/>`,
  '华盖（驿）': (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#a8b0c8')}
    <path d="M48 58 Q60 46 72 58" fill="none" stroke="#c8d0e4" stroke-width="1.4" opacity="0.65"/>
    <path d="M54 66 L66 52" stroke="#a8b0c8" stroke-width="1.2" opacity="0.5"/>`,
  动态: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#90b8c8')}
    <path d="M48 60 Q56 48 64 58 Q70 66 74 54" fill="none" stroke="#b0d0e0" stroke-width="1.4" opacity="0.65"/>
    <circle cx="74" cy="52" r="2" fill="#c8e0f0" opacity="0.45"/>`,
  '羊刃（凶读）': (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#b09090')}
    <path d="M54 68 L60 44 L66 68" fill="none" stroke="#d0a8a8" stroke-width="1.5" opacity="0.75"/>
    <path d="M52 58 H68" stroke="#b09090" stroke-width="1.1" opacity="0.5"/>`,
  天喜红鸾: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#d4a090')}
    <circle cx="54" cy="56" r="5" fill="none" stroke="#e8c0a8" stroke-width="1.2" opacity="0.6"/>
    <path d="M62 50 Q70 56 64 66" fill="none" stroke="#d4a090" stroke-width="1.2" opacity="0.55"/>`,
  咸池桃花: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#d4a0b0')}
    <circle cx="60" cy="56" r="7" fill="none" stroke="#e8c0d0" stroke-width="1.2" opacity="0.55"/>
    <circle cx="60" cy="56" r="3" fill="#f0d0e0" opacity="0.35"/>`,
  妻妾: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#c8a0b0')}
    <circle cx="54" cy="56" r="4.5" fill="none" stroke="#e0c0d0" stroke-width="1.2" opacity="0.55"/>
    <circle cx="66" cy="56" r="4.5" fill="none" stroke="#c8a0b0" stroke-width="1.2" opacity="0.5"/>`,
  夫星: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#c0a870')}
    <path d="M52 64 L60 48 L68 64 Z" fill="none" stroke="#e0c890" stroke-width="1.3" opacity="0.65"/>
    <circle cx="60" cy="58" r="2.5" fill="#d4b56a" opacity="0.4"/>`,
  词馆学堂: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#c4a66e')}
    <path d="M50 52 H70 V66 H50 Z" fill="#1a1820" stroke="#c4a66e" stroke-width="1.1" opacity="0.9"/>
    <path d="M54 48 L60 44 L66 48" fill="none" stroke="#d4b56a" stroke-width="1" opacity="0.55"/>`,
  子孙星: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#90b890')}
    <circle cx="60" cy="52" r="4" fill="none" stroke="#b0d0b0" stroke-width="1.2" opacity="0.6"/>
    <path d="M52 66 Q60 58 68 66" fill="none" stroke="#90b890" stroke-width="1.2" opacity="0.5"/>`,
  长生: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#7ec0a0')}
    <path d="M60 66 V50 M54 56 Q60 48 66 56" fill="none" stroke="#9ed8b8" stroke-width="1.3" opacity="0.65"/>
    <circle cx="60" cy="48" r="2.5" fill="#b8e8d0" opacity="0.4"/>`,
  帝旺: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#e0c070')}
    <path d="M60 46 L63 54 H71 L65 58 L67 66 L60 62 L53 66 L55 58 L49 54 H57 Z" fill="#f0d78a" opacity="0.45"/>`,
  墓库: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#a09078')}
    <path d="M48 66 H72 V54 H48 Z" fill="#2a2418" stroke="#c4b090" stroke-width="1.15" opacity="0.85"/>
    <path d="M54 54 V48 H66 V54" fill="none" stroke="#a09078" stroke-width="1" opacity="0.5"/>`,
  旬空: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#8a98a8')}
    <circle cx="60" cy="58" r="10" fill="none" stroke="#b0bcc8" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.55"/>
    <circle cx="60" cy="58" r="3" fill="none" stroke="#8a98a8" stroke-width="1" opacity="0.4"/>`,
  天罗地网: (uid) => `
    ${voidBg(uid)}
    ${rim(uid, '#8090a0')}
    <circle cx="60" cy="56" r="10" fill="none" stroke="#a0b0c0" stroke-width="1.1" opacity="0.5"/>
    <path d="M48 52 H72 M48 58 H72 M48 64 H72" stroke="#8090a0" stroke-width="0.9" opacity="0.4"/>`,
};

export function listShenshaBadgeArtNames(): string[] {
  return Object.keys(BADGES);
}

/** 传入 ss:名 或 中文名 */
export function shenshaBadgeSvg(idOrName: string, opts?: { uid?: string }): string {
  const name = idOrName.startsWith('ss:') ? idOrName.slice(3) : idOrName;
  const fn = BADGES[name];
  if (!fn) return '';
  const uid = (opts?.uid ?? `ssb-${shenshaCardId(name)}`).replace(/[^a-zA-Z0-9_-]/g, '');
  return svgWrap(fn(uid));
}
