import {
  hexagramFromLines,
  linesFromHexagram,
  type Hexagram,
  type LineBit,
} from './hexagrams.ts';
import { renderTermLabelHtml } from './term-gloss.ts';

export type DerivedKind = 'hu' | 'cuo' | 'zong';

export interface DerivedHex {
  kind: DerivedKind;
  /** 互 / 错 / 综 */
  label: string;
  termId: 'hu-gua' | 'cuo-gua' | 'zong-gua';
  hex: Hexagram;
  /** 怎么从本卦推出来（白话） */
  how: string;
  /** 怎么读（白话） */
  read: string;
}

function flipBit(b: LineBit): LineBit {
  return b === 1 ? 0 : 1;
}

/** 互卦：二三四为下，三四五为上（爻序自下而上） */
export function mutualLines(lines: LineBit[]): LineBit[] {
  if (lines.length !== 6) throw new Error('需要六爻');
  return [lines[1]!, lines[2]!, lines[3]!, lines[2]!, lines[3]!, lines[4]!];
}

/** 错卦：六爻阴阳全翻 */
export function oppositeLines(lines: LineBit[]): LineBit[] {
  if (lines.length !== 6) throw new Error('需要六爻');
  return lines.map(flipBit) as LineBit[];
}

/** 综卦：整卦上下颠倒 */
export function invertedLines(lines: LineBit[]): LineBit[] {
  if (lines.length !== 6) throw new Error('需要六爻');
  return [...lines].reverse() as LineBit[];
}

export function derivedHexagramsOf(hex: Hexagram): DerivedHex[] {
  const lines = linesFromHexagram(hex);
  const hu = hexagramFromLines(mutualLines(lines));
  const cuo = hexagramFromLines(oppositeLines(lines));
  const zong = hexagramFromLines(invertedLines(lines));

  return [
    {
      kind: 'hu',
      label: '互卦',
      termId: 'hu-gua',
      hex: hu,
      how: '取本卦二、三、四爻为下卦，三、四、五爻为上卦，另合成一卦。',
      read: '看事情的中间过程、内层态势——表层没动时，里头已在酝酿什么。',
    },
    {
      kind: 'cuo',
      label: '错卦',
      termId: 'cuo-gua',
      hex: cuo,
      how: '本卦六爻阴阳全部对调（阳变阴、阴变阳）。',
      read: '看对立面／对照面：若整盘阴阳互换，格局会偏成什么样。',
    },
    {
      kind: 'zong',
      label: '综卦',
      termId: 'zong-gua',
      hex: zong,
      how: '本卦上下颠倒（初爻变上爻、上爻变初爻）。',
      read: '看翻转视角：像把局面倒过来，或站到对方立场再看一眼。',
    },
  ];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 图鉴／笔记：互 · 错 · 综对照条（名词可点开释义） */
export function renderDerivedHexSectionHtml(
  hex: Hexagram,
  opts?: { linkToGuide?: boolean },
): string {
  const rows = derivedHexagramsOf(hex);
  const linkToGuide = opts?.linkToGuide !== false;

  return `
    <section class="ly-derived" data-derived-hex data-hex="${escapeHtml(hex.name)}">
      <p class="ly-guide-tip">本卦静态结构外的三种常见对照。点名词看释义；点卦名可进图鉴卡。</p>
      <ul class="ly-derived-list">
        ${rows
          .map((d) => {
            const nameLink = linkToGuide
              ? `<a class="ly-derived-name" href="/liuyao/hexagrams?gua=${encodeURIComponent(
                  d.hex.name,
                )}" data-path="/liuyao/hexagrams?gua=${encodeURIComponent(
                  d.hex.name,
                )}">${escapeHtml(d.hex.fullName)}</a>`
              : `<span class="ly-derived-name">${escapeHtml(d.hex.fullName)}</span>`;
            return `
          <li class="ly-derived-item" data-derived="${d.kind}">
            <div class="ly-derived-head">
              ${renderTermLabelHtml(d.termId, d.label)}
              <span class="ly-derived-arrow" aria-hidden="true">→</span>
              ${nameLink}
            </div>
            <p class="ly-derived-how">${escapeHtml(d.how)}</p>
            <p class="ly-derived-read">${escapeHtml(d.read)}</p>
          </li>`;
          })
          .join('')}
      </ul>
    </section>
  `;
}

/** HEX CARD 下方精简条：名词带释义，卦名可跳转 */
export function renderDerivedHexCompactHtml(hex: Hexagram): string {
  const rows = derivedHexagramsOf(hex);
  return `
    <div class="ly-derived-compact" data-derived-compact>
      ${rows
        .map(
          (d) => `
        <div class="ly-derived-chip">
          ${renderTermLabelHtml(d.termId, d.label)}
          <a class="ly-derived-chip-name" href="/liuyao/hexagrams?gua=${encodeURIComponent(
            d.hex.name,
          )}" data-path="/liuyao/hexagrams?gua=${encodeURIComponent(d.hex.name)}" title="${escapeHtml(
            d.read,
          )}">${escapeHtml(d.hex.name)}</a>
        </div>`,
        )
        .join('')}
    </div>
  `;
}
