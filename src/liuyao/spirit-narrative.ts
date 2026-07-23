import type { CastResult } from './engine.ts';
import { dressHexagram, type LiuQin, type YaoDress } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { buildShengKeMap, YUAN_OF, JI_OF } from './shengke-map.ts';
import { formatLiuqinShort } from './energy-lens.ts';
import { resolveYongShen } from './yong-shen.ts';

export type SpiritNarrativePara = {
  kind: 'yong' | 'yuan' | 'ji' | 'chou' | 'verdict';
  text: string;
};

export type SpiritNarrative = {
  paragraphs: SpiritNarrativePara[];
  /** 一句收束 */
  verdict: string;
};

function chouOf(yongQin: LiuQin): LiuQin {
  return YUAN_OF[JI_OF[yongQin]];
}

function pickRow(rows: YaoDress[], qin: LiuQin): YaoDress | undefined {
  const matches = rows.filter((r) => r.liuqin === qin);
  if (!matches.length) return undefined;
  return matches.find((r) => r.changing) ?? matches.find((r) => r.isShi) ?? matches[0];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rowTag(row: YaoDress): string {
  const move = row.changing ? '·动' : '';
  return `${row.label}${row.liuqin}${row.branch}${row.wuxing}${move}`;
}

/** 成段断语：用 / 元 / 忌 / 仇（含贪生忘克等经典句式） */
export function buildSpiritNarrative(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): SpiritNarrative {
  const dressed = dressHexagram(cast, siZhuFromDate(castAt).dayStem);
  const map = buildShengKeMap(cast, dressed, question);
  const yongDef = resolveYongShen(question);
  const paragraphs: SpiritNarrativePara[] = [];

  if (!map.yongQin) {
    return {
      paragraphs: [
        {
          kind: 'verdict',
          text: `本题用神倾向「${yongDef.name}」，本卦尚未落到具体爻。先把问题写具体，或回到世应与动爻再定锚。`,
        },
      ],
      verdict: '用神未定——先写清所问，再看生克。',
    };
  }

  const yong = map.nodes.find((n) => n.role === '用神')?.row;
  const yuan = map.nodes.find((n) => n.role === '原神')?.row;
  const ji = map.nodes.find((n) => n.role === '忌神')?.row;
  const chouQin = chouOf(map.yongQin);
  const chou = pickRow(dressed.rows, chouQin);
  const yuanQin = YUAN_OF[map.yongQin];
  const jiQin = JI_OF[map.yongQin];

  if (yong) {
    paragraphs.push({
      kind: 'yong',
      text: `核心聚焦取「${formatLiuqinShort(map.yongQin)}」（${yongDef.why}）。落在${rowTag(yong)}——这是本题注意力该放的系统，不是封建身份标签。`,
    });
  }

  if (yuan) {
    paragraphs.push({
      kind: 'yuan',
      text: yuan.changing
        ? `补给系统在${rowTag(yuan)}发动：场上有明面助力，宜顺着这一层做可验证的一小步。`
        : `补给系统在${rowTag(yuan)}（静），助力在场但未大动，可借力、勿空等。`,
    });
  } else {
    paragraphs.push({
      kind: 'yuan',
      text: `补给系统「${formatLiuqinShort(yuanQin)}」未明显落到爻上。推进更多靠自己对齐世应节奏。`,
    });
  }

  if (ji) {
    paragraphs.push({
      kind: 'ji',
      text: ji.changing
        ? `耗散系统在${rowTag(ji)}发动：干扰正在起来，宜先减这一层的消耗，再谈大推进。`
        : `耗散系统在${rowTag(ji)}（静/暗处牵制）：干扰未必喧哗，但会拖节奏——少硬碰，改迂回。`,
    });
  } else {
    paragraphs.push({
      kind: 'ji',
      text: `耗散系统「${formatLiuqinShort(jiQin)}」未明显现形。可更专注核心聚焦所在层。`,
    });
  }

  let greedyLine = '';
  if (chou && ji) {
    greedyLine = chou.changing || ji.changing
      ? `拉扯层在${rowTag(chou)}给耗散系统续力：容易形成内耗循环——先减耗散干扰，再谈借补给。`
      : `拉扯层在${rowTag(chou)}给耗散系统续力：耗散有源，顺序宜「先清干扰，再借助力」。`;
    paragraphs.push({ kind: 'chou', text: greedyLine });
  } else if (chou) {
    paragraphs.push({
      kind: 'chou',
      text: `拉扯层倾向「${formatLiuqinShort(chouQin)}」，落在${rowTag(chou)}。耗散若再抬头，这一层会给它续力。`,
    });
  } else {
    paragraphs.push({
      kind: 'chou',
      text: `拉扯层「${formatLiuqinShort(chouQin)}」未直接落到爻上。先看耗散是否暗处牵制，再决定先清干扰还是先借补给。`,
    });
  }

  const hasYuan = Boolean(yuan);
  const hasJi = Boolean(ji);
  const yuanMove = Boolean(yuan?.changing);
  const jiMove = Boolean(ji?.changing);

  let verdict: string;
  if (hasYuan && hasJi && yuanMove && jiMove) {
    verdict = '补给与耗散皆动：先保核心聚焦不被拖垮（减耗散），再借补给推进——顺序比速度重要。';
  } else if (hasJi && jiMove && !yuanMove) {
    verdict = '耗散发动更醒目：先稳住可控的一层，少硬冲，改用小步验证。';
  } else if (hasYuan && yuanMove && !jiMove) {
    verdict = '补给发动、耗散未大动：可顺助力推进一小步，同时别把窗口当成永久。';
  } else if (greedyLine) {
    verdict = '耗散有拉扯层续力：防内耗循环，先减干扰再借力。';
  } else if (hasYuan && !hasJi) {
    verdict = '补给在场、耗散不明：借补给所在层做准备，别空等结果。';
  } else if (!hasYuan && hasJi) {
    verdict = '耗散在场、补给不明：先减干扰，再谈扩张。';
  } else {
    verdict = map.tip || '先盯核心聚焦所在层，再看补给是否帮得上、耗散是否拖后腿。';
  }

  paragraphs.push({ kind: 'verdict', text: verdict });

  return { paragraphs, verdict };
}

function roleLabel(kind: SpiritNarrativePara['kind']): string {
  if (kind === 'yong') return '核心聚焦';
  if (kind === 'yuan') return '补给';
  if (kind === 'ji') return '耗散';
  if (kind === 'chou') return '拉扯';
  return '收束';
}

export function renderSpiritNarrativeHtml(n: SpiritNarrative): string {
  const paras = n.paragraphs
    .map((p) => {
      const label = roleLabel(p.kind);
      return `
      <p class="ly-spirit-nar-p is-${p.kind}">
        <strong class="ly-spirit-nar-role is-${p.kind}">${escapeHtml(label)}</strong>
        <span>${escapeHtml(p.text)}</span>
      </p>`;
    })
    .join('');

  return `
    <section class="ly-spirit-nar" data-spirit-narrative>
      <h4 class="ly-spirit-nar-title">核心聚焦 · 补给 / 耗散 / 拉扯</h4>
      <p class="ly-guide-tip">不谈谁克死谁，只谈注意力该放哪；绿看补给，红看耗散。</p>
      <div class="ly-spirit-nar-body">${paras}</div>
    </section>
  `;
}

export function renderSpiritNarrativeForCast(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): string {
  return renderSpiritNarrativeHtml(buildSpiritNarrative(cast, question, castAt));
}
