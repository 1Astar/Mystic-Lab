import type { CastResult } from './engine.ts';
import type { Hexagram } from './hexagrams.ts';
import { LINE_LABELS } from './hexagrams.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { buildReadingFacts } from './reading-facts.ts';
import zhouyi64 from './data/zhouyi-64.json';

type ZhouYiGua = {
  name: string;
  gua_ci: string;
  tuan_ci: string;
  da_xiang: string;
  xiao_xiang: string[];
};

const ZHOU = zhouyi64 as ZhouYiGua[];
const ZHOU_BY_NAME = new Map(ZHOU.map((g) => [g.name, g]));

export type ClassicCompendiumBlock = {
  tag: '象曰' | '诗曰' | '断曰' | '决策';
  text: string;
};

export type ClassicCompendium = {
  title: string;
  fullName: string;
  blocks: ClassicCompendiumBlock[];
  /** 有变卦时附变卦简断 */
  changed?: {
    fullName: string;
    blocks: ClassicCompendiumBlock[];
  };
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 诗曰：据卦象关键词整理的对照诗（教学用，非通行本原文） */
export function buildShiYue(hex: Hexagram): string {
  const a = hex.keywords[0] ?? '时势';
  const b = hex.keywords[1] ?? '进退';
  const c = hex.keywords[2] ?? hex.keywords[0] ?? '取舍';
  return `${a}初现莫强求，${b}之中自有谋；\n君子若能明${c}，前程一步一层楼。`;
}

function buildXiangYue(name: string, changingIndexes: number[]): string {
  const g = ZHOU_BY_NAME.get(name);
  const corpus = getClassicCorpus(name);
  const da = g?.da_xiang ?? corpus?.daXiang ?? '';
  if (!da) return '本库暂无大象。';

  const parts = [da];
  if (changingIndexes.length) {
    const xiao = changingIndexes
      .map((i) => {
        const line = g?.xiao_xiang?.[i] ?? corpus?.lineNotes?.[i];
        if (!line) return '';
        return `${LINE_LABELS[i]}小象：${line}`;
      })
      .filter(Boolean);
    if (xiao.length) parts.push(xiao.join('\n'));
  }
  return parts.join('\n');
}

function buildDuanYue(hex: Hexagram, name: string, changingIndexes: number[]): string {
  const g = ZHOU_BY_NAME.get(name);
  const corpus = getClassicCorpus(name);
  const gua = (g?.gua_ci ?? corpus?.judgment ?? '').replace(/^[^：:]+[：:]/, '').trim() || corpus?.judgment || '';
  const move =
    changingIndexes.length === 0
      ? '卦静无动，宜观旺衰与世应，勿以一词定终身。'
      : `动在${changingIndexes.map((i) => LINE_LABELS[i]).join('、')}，吉凶须追变爻生克，勿见字面即断。`;
  const gist = hex.gist;
  return [gua ? `卦辞示：${gua}` : '', `今象：${gist}`, move].filter(Boolean).join('\n');
}

function buildDecision(
  cast: CastResult,
  hex: Hexagram,
  question: string,
  castAt: Date,
): string {
  const facts = buildReadingFacts(cast, question, castAt);
  const q = question.trim() || '所问之事';
  const theme = facts.themeWord || hex.keywords[0] || '当下';
  const rel = facts.shiYingRel.rel;

  if (cast.changed) {
    const to = cast.changed.keywords[0] ?? cast.changed.name;
    return `就「${q}」而言：本卦主调偏「${hex.keywords[0] ?? hex.name}」，事变朝「${to}」一侧松动。世应${rel}——先把内外对齐，再朝变卦方向做一小步可验证的行动；忌硬守旧法、一次求成。`;
  }
  return `就「${q}」而言：卦象偏「${hex.keywords.slice(0, 2).join('、') || hex.name}」。世应${rel}——宜先稳「${theme}」相关边界与准备，少做大动作；把能核对结果的一小步做实，再观后效。`;
}

function blocksForHex(
  cast: CastResult,
  hex: Hexagram,
  name: string,
  changingIndexes: number[],
  question: string,
  castAt: Date,
  includeDecision: boolean,
): ClassicCompendiumBlock[] {
  const blocks: ClassicCompendiumBlock[] = [
    { tag: '象曰', text: buildXiangYue(name, changingIndexes) },
    { tag: '诗曰', text: buildShiYue(hex) },
    { tag: '断曰', text: buildDuanYue(hex, name, changingIndexes) },
  ];
  if (includeDecision) {
    blocks.push({ tag: '决策', text: buildDecision(cast, hex, question, castAt) });
  }
  return blocks;
}

/** 传统解卦全书：象曰 / 诗曰 / 断曰 + 决策 */
export function buildClassicCompendium(
  cast: CastResult,
  question = '',
  castAt = new Date(),
): ClassicCompendium {
  const primary = cast.primary;
  const pack: ClassicCompendium = {
    title: '传统解卦全书',
    fullName: primary.fullName,
    blocks: blocksForHex(
      cast,
      primary,
      primary.name,
      cast.changingIndexes,
      question,
      castAt,
      true,
    ),
  };

  if (cast.changed) {
    pack.changed = {
      fullName: cast.changed.fullName,
      blocks: [
        { tag: '象曰', text: buildXiangYue(cast.changed.name, []) },
        { tag: '诗曰', text: buildShiYue(cast.changed) },
        {
          tag: '断曰',
          text: buildDuanYue(cast.changed, cast.changed.name, []),
        },
      ],
    };
  }

  return pack;
}

function renderBlocksHtml(blocks: ClassicCompendiumBlock[]): string {
  return blocks
    .map((b) => {
      const kind =
        b.tag === '象曰'
          ? 'xiang'
          : b.tag === '诗曰'
            ? 'shi'
            : b.tag === '断曰'
              ? 'duan'
              : 'decision';
      return `
      <div class="ly-compendium-block is-${kind}">
        <p class="ly-compendium-tag">${escapeHtml(b.tag)}</p>
        <p class="ly-compendium-text">${escapeHtml(b.text).replace(/\n/g, '<br>')}</p>
      </div>`;
    })
    .join('');
}

export function renderClassicCompendiumHtml(c: ClassicCompendium): string {
  const changed = c.changed
    ? `
      <div class="ly-compendium-changed">
        <p class="ly-layer-guide">变卦 · ${escapeHtml(c.changed.fullName)}</p>
        ${renderBlocksHtml(c.changed.blocks)}
      </div>`
    : '';

  return `
    <section class="ly-compendium" data-classic-compendium>
      <h4 class="ly-compendium-title">${escapeHtml(c.title)}</h4>
      <p class="ly-compendium-gua">${escapeHtml(c.fullName)}</p>
      <p class="ly-guide-tip">象曰取大象／动爻小象；诗曰为教学对照诗；断曰与决策供参照，不作定论。</p>
      ${renderBlocksHtml(c.blocks)}
      ${changed}
    </section>
  `;
}

export function renderClassicCompendiumForCast(
  cast: CastResult,
  question = '',
  castAt = new Date(),
): string {
  return renderClassicCompendiumHtml(buildClassicCompendium(cast, question, castAt));
}
