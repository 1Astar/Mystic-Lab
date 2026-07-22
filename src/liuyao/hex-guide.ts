/**
 * 六十四卦图鉴：意象底图 + 分域映射 + 与六爻笔记同构的详解分区
 */
import type { Hexagram } from './hexagrams.ts';
import {
  LINE_LABELS,
  linesFromHexagram,
  palaceStageOfHexagram,
  yingLineOf,
} from './hexagrams.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { glossDaXiang, glossLine } from './classic-gloss.ts';
import { TRIGRAMS, hexagramNameWhy } from './trigrams.ts';
import { renderDerivedHexSectionHtml } from './derived-hex.ts';
import { bindTermGloss } from './term-gloss.ts';
import { bindHexEncounterPanel, renderHexEncounterPanelHtml } from './hex-encounter.ts';

export type GuideDomain = {
  id: string;
  label: string;
  body: string;
};

export type GuideYao = {
  index: number;
  label: string;
  classic: string;
  bai: string;
  isShi: boolean;
  isYing: boolean;
};

export type HexGuidePack = {
  hex: Hexagram;
  upperId: string;
  lowerId: string;
  upperNature: string;
  lowerNature: string;
  upperLabel: string;
  lowerLabel: string;
  upperRep: string;
  lowerRep: string;
  upperWhy: string;
  lowerWhy: string;
  /** 一句话卦意（自然结构白话） */
  oneLiner: string;
  nameWhy: string;
  gist: string;
  atmosphereSrc: string | null;
  domains: GuideDomain[];
  yaos: GuideYao[];
  classic: {
    judgment: string;
    daXiang: string;
    daBai: string;
    zengshan: string;
  };
  pro: {
    palace: string;
    shiLine: number;
    yingLine: number;
    tip: string;
  };
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 已有氛围图的文王卦序；其余走 CSS 程序化底 */
const ATMOSPHERE_MAX = 48;

export function atmosphereSrcFor(kingWen: number): string | null {
  if (kingWen < 1 || kingWen > ATMOSPHERE_MAX) return null;
  const n = String(kingWen).padStart(2, '0');
  return `/liuyao/hex-guide/${n}.png`;
}

function toneFromKeywords(hex: Hexagram): 'rise' | 'hold' | 'hard' | 'turn' {
  const k = hex.keywords.join('');
  if (/困|险|阻滞|剥|闭塞|艰难|退避/.test(k)) return 'hard';
  if (/通达|丰盛|晋升|上升|强盛|开创|畅通|拥有|亲近|联合/.test(k)) return 'rise';
  if (/归来|缓解|解开|变革|更新|重启|启蒙/.test(k)) return 'turn';
  return 'hold';
}

function buildDomains(hex: Hexagram): GuideDomain[] {
  const tone = toneFromKeywords(hex);
  const kw = hex.keywords.slice(0, 2).join('、');

  const work =
    tone === 'rise'
      ? `运势偏开（${kw}）。适合推进、被看见；脚踏实地比硬冲更稳。`
      : tone === 'hard'
        ? `局面偏紧（${kw}）。先守边界与证据，减无效消耗，再等窗口。`
        : tone === 'turn'
          ? `转机露头（${kw}）。旧法可能失效，适合小步试新，复盘后再放大。`
          : `结构偏稳（${kw}）。把节奏与职责对齐，积小成，忌无谓大转向。`;

  const love =
    tone === 'rise'
      ? `关系热度与条件较匹配；好过了头也易碰触，宜多包容。`
      : tone === 'hard'
        ? `期待或内外有落差，易见拉扯。先对齐事实与边界，再谈升温。`
        : `宜渐进沟通：把没说清的话说清，比制造戏剧转折更有用。`;

  const self =
    tone === 'rise'
      ? `自我能量偏足，可主动；同时防过刚、过满。`
      : tone === 'hard'
        ? `先安顿身心与边界，别把「难」解读成「我不行」。`
        : `把注意力收回可验证的一小步，少脑补大局。`;

  const career =
    tone === 'rise'
      ? `事业窗口在开，得助之象；戒骄满。`
      : tone === 'hard'
        ? `事业宜守不宜攻，先把基础盘稳。`
        : `事业宜稳进，忌躁进。`;

  const health =
    '先把睡眠与饮食稳住，再谈大动作。身心节奏往往是卦象的第一道回声。';

  return [
    { id: 'work', label: '工作', body: work },
    { id: 'love', label: '感情', body: love },
    { id: 'self', label: '自我', body: self },
    { id: 'career', label: '事业', body: career },
    { id: 'health', label: '健康', body: health },
  ];
}

function trigramWhy(nature: string, pos: 'upper' | 'lower'): string {
  const upperHint: Record<string, string> = {
    天: '刚健贯通',
    地: '包容承载',
    水: '云雨未落、外部未畅',
    火: '明照在外',
    雷: '震动外发',
    风: '柔入流转',
    山: '遮掩止静',
    泽: '交流开口',
  };
  const lowerHint: Record<string, string> = {
    天: '力量已蓄、待发',
    地: '厚实托底',
    水: '内在未明',
    火: '内心有明',
    雷: '自身刚启动',
    风: '柔顺潜入',
    山: '内里止静',
    泽: '情志待通',
  };
  const hint = (pos === 'upper' ? upperHint : lowerHint)[nature] ?? (pos === 'upper' ? '环境场' : '自身底色');
  return pos === 'upper' ? `${nature}在上——${hint}` : `${nature}在下——${hint}`;
}

/** 图鉴卡「整体意象」：优先用氛围诗句，否则回落到卦旨 */
const ATMOSPHERE_LINES: Record<number, string> = {
  1: '层层高空打开，一束光贯通——高、开、通、阳。',
  2: '厚实铺开，一切被温柔接住。',
  3: '艰难开端，萌而未畅。',
  4: '山立雾流，路在未明处——遮掩与探索，像初学者在雾中找路。',
  5: '雨意未落——等待蓄势。',
  6: '上下相背——分歧对冲。',
  7: '众力集结，纪律成军。',
  8: '地在下，水在上。万物汇聚，有连接之象。',
  9: '风力环流于天——蓄而未放，小步积成。',
  10: '天光照泽面——谨慎踏行，分寸即礼。',
  11: '地柔天升，气机交泰——通畅和合。',
  12: '天地相背，中门不开——闭塞待时。',
  13: '火光聚人于天——同道集结，共向而行。',
  14: '火天灿然——丰盛在握，当思担当。',
  15: '山藏于地——内有分量，外不张扬。',
  16: '雷声过地，万物苏醒——振奋、预备、被唤起。',
  17: '雷动于泽——顺势而随，择时而行。',
  18: '山风穿腐——旧弊当治，整顿修复。',
  19: '泽气临地——机会靠近，可临现场。',
  20: '风过大地——登高而观，先看清再介入。',
  21: '雷火咬合——障碍当断，决而通之。',
  22: '山下有火——文饰光华，别只剩表面。',
  23: '山剥于地——外层剥落，宜止损收缩。',
  24: '一阳来复——从根本处重新开始。',
  25: '天清雷动——真诚无妄，不造假势。',
  26: '山含天力——大有所蓄，未即释放。',
  27: '山为颚、雷为养——自养与被养。',
  28: '泽重压风梁——负荷过重，宜减支点。',
  29: '重渊叠水——险中自有通路。',
  30: '双明相丽——附丽于清明之光。',
  31: '泽感于山——彼此感应，气机相召。',
  32: '雷久风续——持之以恒，节奏可久。',
  33: '山遮天路——宜退守藏锋，不硬闯。',
  34: '雷动于天——气势正壮，慎过刚。',
  35: '火升于地——前行可见，向上而晋。',
  36: '明埋地下——光受伤，宜晦而自守。',
  37: '风火相生——家室之象，内明外顺。',
  38: '火泽相背——所见不合，宜求同存异。',
  39: '水困于山——前路艰，宜止而后进。',
  40: '雷解于水——紧张松开，困局可解。',
  41: '山下有泽——有减有益，取舍成损。',
  42: '风雷相益——增益流通，彼此成全。',
  43: '泽决于天——决断当断，勿再拖泥。',
  44: '天遇柔风——不期而遇，宜察来意。',
  45: '泽聚于地——众流来萃，会合之象。',
  46: '地中有风——积小而上，渐进可升。',
  47: '泽困于水——资源受困，先求出路。',
  48: '水风为井——源在深处，养人长久。',
};

function atmosphereOneLiner(hex: Hexagram): string {
  return ATMOSPHERE_LINES[hex.kingWen] ?? hex.gist;
}

export function buildHexGuidePack(hex: Hexagram): HexGuidePack {
  const upper = TRIGRAMS[hex.upper];
  const lower = TRIGRAMS[hex.lower];
  const corpus = getClassicCorpus(hex.name);
  const stage = palaceStageOfHexagram(hex.name);
  const shi = hex.shiLine;
  const ying = yingLineOf(shi);
  const yaos: GuideYao[] = LINE_LABELS.map((label, i) => ({
    index: i,
    label,
    classic: corpus?.lineClassics[i] ?? '',
    bai: glossLine(hex.name, i) ?? '',
    isShi: shi === i + 1,
    isYing: ying === i + 1,
  }));

  return {
    hex,
    upperId: upper.id,
    lowerId: lower.id,
    upperNature: upper.nature,
    lowerNature: lower.nature,
    upperLabel: `上卦：${upper.id}（${upper.nature}）`,
    lowerLabel: `下卦：${lower.id}（${lower.nature}）`,
    upperRep: upper.represents.join('、'),
    lowerRep: lower.represents.join('、'),
    upperWhy: trigramWhy(upper.nature, 'upper'),
    lowerWhy: trigramWhy(lower.nature, 'lower'),
    oneLiner: atmosphereOneLiner(hex),
    nameWhy: hexagramNameWhy(hex.name, upper, lower),
    gist: hex.gist,
    atmosphereSrc: atmosphereSrcFor(hex.kingWen),
    domains: buildDomains(hex),
    yaos,
    classic: {
      judgment: corpus?.judgment ?? '',
      daXiang: corpus?.daXiang ?? '',
      daBai: glossDaXiang(hex.name) ?? hex.gist,
      zengshan: corpus?.zengshan ?? '',
    },
    pro: {
      palace: stage
        ? `${stage.palace}宫 · ${stage.stageLabel} · 世在${LINE_LABELS[shi - 1]}`
        : `世在${LINE_LABELS[shi - 1]}`,
      shiLine: shi,
      yingLine: ying,
      tip: '图鉴展示本卦静态结构。六神随日干起、用神/忌神依所问而定——完整生克见起卦后的「专业排盘」。',
    },
  };
}

const SEDIMENT_KEY = 'mystic.liuyao.hexGuide.sediment.v1';

export function loadHexSediment(name: string): string {
  try {
    const raw = localStorage.getItem(SEDIMENT_KEY);
    if (!raw) return '';
    const map = JSON.parse(raw) as Record<string, string>;
    return map[name] ?? '';
  } catch {
    return '';
  }
}

export function saveHexSediment(name: string, text: string): void {
  try {
    const raw = localStorage.getItem(SEDIMENT_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[name] = text;
    localStorage.setItem(SEDIMENT_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

/** 图鉴氛围图或程序化底 */
export function renderGuideArtHtml(
  pack: HexGuidePack,
  opts?: { className?: string; alt?: string },
): string {
  const cls = opts?.className ?? 'ly-guide-art';
  const alt = opts?.alt ?? `${pack.hex.fullName}意象`;
  if (pack.atmosphereSrc) {
    return `<div class="${cls}"><img src="${escapeHtml(pack.atmosphereSrc)}" alt="${escapeHtml(alt)}" loading="lazy" /></div>`;
  }
  return `<div class="${cls} ly-guide-art-empty" data-upper="${escapeHtml(
    pack.upperNature,
  )}" data-lower="${escapeHtml(pack.lowerNature)}" aria-hidden="true"></div>`;
}

/** 上/下卦代表 + 为何叠成此卦（笔记与图鉴共用） */
export function renderGuideFormWhyHtml(pack: HexGuidePack): string {
  return `
    <div class="ly-guide-form-why" data-guide-form-why>
      <div class="ly-gua-form-why">
        <div class="ly-gua-form-tri">
          <p class="ly-gua-form-tri-name">${escapeHtml(pack.upperNature)} · ${escapeHtml(pack.upperId)}</p>
          <p class="ly-gua-form-tri-rep">上卦代表：${escapeHtml(pack.upperRep)}</p>
          <p class="ly-guide-tri-why">${escapeHtml(pack.upperWhy)}</p>
        </div>
        <div class="ly-gua-form-tri">
          <p class="ly-gua-form-tri-name">${escapeHtml(pack.lowerNature)} · ${escapeHtml(pack.lowerId)}</p>
          <p class="ly-gua-form-tri-rep">下卦代表：${escapeHtml(pack.lowerRep)}</p>
          <p class="ly-guide-tri-why">${escapeHtml(pack.lowerWhy)}</p>
        </div>
        <p class="ly-gua-form-arrow" aria-hidden="true">↓</p>
        <div class="ly-gua-form-result">
          <p class="ly-gua-form-result-name">${escapeHtml(pack.hex.fullName)}</p>
          <p class="ly-gua-form-result-eq">上${escapeHtml(pack.upperNature)} + 下${escapeHtml(
            pack.lowerNature,
          )} → ${escapeHtml(pack.hex.name)}</p>
          <p class="ly-guide-name-why"><em>为什么叫「${escapeHtml(pack.hex.name)}」？</em>${escapeHtml(
            pack.nameWhy,
          )}</p>
        </div>
      </div>
    </div>
  `;
}

/** 分域映射 tabs（工作 / 感情 / …） */
export function renderGuideDomainSectionHtml(pack: HexGuidePack): string {
  const domainTabs = pack.domains
    .map(
      (d, i) =>
        `<button type="button" class="ly-guide-domain-tab${i === 0 ? ' is-active' : ''}" data-domain="${d.id}" role="tab" aria-selected="${i === 0}">${escapeHtml(d.label)}</button>`,
    )
    .join('');

  const domainPanes = pack.domains
    .map(
      (d, i) => `
      <div class="ly-guide-domain-pane${i === 0 ? ' is-active' : ''}" data-domain-pane="${d.id}" ${i === 0 ? '' : 'hidden'}>
        <p class="ly-guide-domain-body">${escapeHtml(d.body)}</p>
      </div>`,
    )
    .join('');

  return `
    <div class="ly-guide-domains" data-guide-domains>
      <p class="ly-layer-guide">分域注解</p>
      <div class="ly-guide-domain-tabs" role="tablist">${domainTabs}</div>
      ${domainPanes}
    </div>
  `;
}

/**
 * 笔记图鉴条：矮卡 = 氛围底 + 卦名/世应/爻线/意象 + 卡下相关上下卦说明
 */
function renderGuideSnippetHeroHtml(pack: HexGuidePack): string {
  const lines = linesFromHexagram(pack.hex);
  const topFirst = [...lines].reverse();
  const shiFromTop = 6 - pack.pro.shiLine;
  const yingFromTop = 6 - pack.pro.yingLine;
  const bgAttr = pack.atmosphereSrc
    ? ` style="background-image:url('${escapeHtml(pack.atmosphereSrc)}')"`
    : ` data-upper="${escapeHtml(pack.upperNature)}" data-lower="${escapeHtml(pack.lowerNature)}"`;
  const bgClass = pack.atmosphereSrc ? '' : ' is-empty';

  const yaoRows = topFirst
    .map((bit, i) => {
      const tags: string[] = [];
      if (i === 0) tags.push('上');
      if (i === 3) tags.push('下');
      if (i === shiFromTop) tags.push('世');
      if (i === yingFromTop) tags.push('应');
      const yang = bit === 1;
      return `
        <div class="ly-guide-snippet-yao-row${yang ? ' is-yang' : ' is-yin'}">
          <span class="ly-guide-snippet-yao-ln"></span>
          ${
            tags.length
              ? `<span class="ly-guide-snippet-yao-tag">${tags.join(' ')}</span>`
              : ''
          }
        </div>`;
    })
    .join('');

  const showGist = pack.gist.trim() && pack.gist.trim() !== pack.oneLiner.trim();

  return `
    <div class="ly-guide-snippet-pack" data-guide-snippet-pack>
      <div class="ly-guide-snippet-hero" data-guide-snippet-hero>
        <div class="ly-guide-snippet-hero-bg${bgClass}"${bgAttr}></div>
        <div class="ly-guide-snippet-hero-veil" aria-hidden="true"></div>
        <div class="ly-guide-snippet-hero-ui">
          <p class="ly-guide-snippet-brand">MYSTIC LAB · HEX</p>
          <h3 class="ly-guide-snippet-name">${escapeHtml(pack.hex.name)}</h3>
          <p class="ly-guide-snippet-sub">${escapeHtml(pack.hex.fullName)} · 第${pack.hex.kingWen}卦</p>
          <div class="ly-guide-snippet-chips">
            <span>世 · ${escapeHtml(LINE_LABELS[pack.pro.shiLine - 1]!)}</span>
            <span>应 · ${escapeHtml(LINE_LABELS[pack.pro.yingLine - 1]!)}</span>
          </div>
        </div>
        <div class="ly-guide-snippet-yao" aria-hidden="true">${yaoRows}</div>
        <div class="ly-guide-snippet-hero-foot">
          <p class="ly-guide-img-k">整体意象</p>
          <p class="ly-guide-one-line">${escapeHtml(pack.oneLiner)}</p>
        </div>
      </div>
      <div class="ly-guide-snippet-related">
        <div class="ly-guide-snippet-tri">
          <p class="ly-guide-snippet-tri-k">上卦 · ${escapeHtml(pack.upperNature)}（${escapeHtml(pack.upperId)}）</p>
          <p class="ly-guide-snippet-tri-v">${escapeHtml(pack.upperRep)}</p>
          <p class="ly-guide-snippet-tri-why">${escapeHtml(pack.upperWhy)}</p>
        </div>
        <div class="ly-guide-snippet-tri">
          <p class="ly-guide-snippet-tri-k">下卦 · ${escapeHtml(pack.lowerNature)}（${escapeHtml(pack.lowerId)}）</p>
          <p class="ly-guide-snippet-tri-v">${escapeHtml(pack.lowerRep)}</p>
          <p class="ly-guide-snippet-tri-why">${escapeHtml(pack.lowerWhy)}</p>
        </div>
        <p class="ly-guide-snippet-eq">上${escapeHtml(pack.upperNature)} + 下${escapeHtml(
          pack.lowerNature,
        )} → ${escapeHtml(pack.hex.name)}</p>
        <p class="ly-guide-snippet-name-why"><em>为什么叫「${escapeHtml(pack.hex.name)}」？</em>${escapeHtml(
          pack.nameWhy,
        )}</p>
        ${
          showGist
            ? `<p class="ly-guide-snippet-gist">${escapeHtml(pack.gist)}</p>`
            : ''
        }
      </div>
    </div>
  `;
}

/**
 * 笔记「卦象解析」用的图鉴条：图鉴卡（含上下卦相关）+ 分域 + 互错综
 */
export function renderGuideXiangSnippetHtml(
  pack: HexGuidePack,
  opts?: { linkToGuide?: boolean; compactArt?: boolean },
): string {
  const link =
    opts?.linkToGuide === false
      ? ''
      : `<p class="ly-guide-snippet-link"><a href="/liuyao/hexagrams?gua=${encodeURIComponent(
          pack.hex.name,
        )}" data-path="/liuyao/hexagrams?gua=${encodeURIComponent(
          pack.hex.name,
        )}">在六十四卦图鉴中打开「${escapeHtml(pack.hex.name)}」→</a></p>`;

  return `
    <section class="ly-guide-snippet${opts?.compactArt ? ' is-compact' : ''}" data-guide-snippet data-hex="${escapeHtml(
      pack.hex.name,
    )}">
      <h4 class="ly-guide-snippet-title">图鉴 · ${escapeHtml(pack.hex.fullName)}</h4>
      ${renderGuideSnippetHeroHtml(pack)}
      ${renderGuideDomainSectionHtml(pack)}
      ${renderDerivedHexSectionHtml(pack.hex)}
      ${link}
    </section>
  `;
}

export function bindGuideDomainTabs(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-guide-domains]').forEach((host) => {
    if (host.dataset.bound === '1') return;
    host.dataset.bound = '1';
    const domainTabs = host.querySelectorAll<HTMLButtonElement>('[data-domain]');
    const domainPanes = host.querySelectorAll<HTMLElement>('[data-domain-pane]');
    domainTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const id = tab.dataset.domain;
        domainTabs.forEach((t) => {
          const on = t === tab;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        domainPanes.forEach((p) => {
          const on = p.dataset.domainPane === id;
          p.classList.toggle('is-active', on);
          p.hidden = !on;
        });
      });
    });
  });
}

/** 图鉴右侧笔记壳（与六爻解读笔记同构） */
export function renderHexGuideNotesHtml(pack: HexGuidePack): string {
  const yaoHtml = pack.yaos
    .map((y) => {
      const tags = [
        y.isShi ? '世' : '',
        y.isYing ? '应' : '',
      ]
        .filter(Boolean)
        .join(' · ');
      return `
      <div class="ly-classic-block">
        <p class="ly-classic-zh">
          <span class="ly-classic-tag">${escapeHtml(y.label)}${tags ? ` · ${tags}` : ''}</span>
          ${escapeHtml(y.classic || '（本库暂无爻辞）')}
        </p>
        ${
          y.bai
            ? `<p class="ly-classic-bai"><span class="ly-classic-tag is-bai">白话</span>${escapeHtml(y.bai)}</p>`
            : ''
        }
      </div>`;
    })
    .join('');

  const sediment = loadHexSediment(pack.hex.name);

  return `
    <div class="ly-guide-notes" data-hex-guide-notes>
      <div class="ly-note-mini-tabs" role="tablist" aria-label="图鉴解读笔记">
        <button type="button" class="ly-note-mini-tab is-active" data-guide-tab="domain" role="tab" aria-selected="true">卦象解析</button>
        <button type="button" class="ly-note-mini-tab" data-guide-tab="encounter" role="tab" aria-selected="false">我的相遇</button>
        <button type="button" class="ly-note-mini-tab" data-guide-tab="yao" role="tab" aria-selected="false">爻辞解释</button>
        <button type="button" class="ly-note-mini-tab" data-guide-tab="pro" role="tab" aria-selected="false">专业注解</button>
        <button type="button" class="ly-note-mini-tab" data-guide-tab="classic" role="tab" aria-selected="false">传统详解</button>
        <button type="button" class="ly-note-mini-tab" data-guide-tab="sediment" role="tab" aria-selected="false">我的沉淀</button>
      </div>
      <div class="ly-note-mini-body">
        <div class="ly-note-tab-panel is-active" data-guide-pane="domain">
          <p class="ly-guide-tip">图鉴卡含意象与上下卦；下方是分域与互错综。</p>
          ${renderGuideSnippetHeroHtml(pack)}
          ${renderGuideDomainSectionHtml(pack)}
          ${renderDerivedHexSectionHtml(pack.hex)}
        </div>
        <div class="ly-note-tab-panel" data-guide-pane="encounter" hidden>
          ${renderHexEncounterPanelHtml(pack.hex, sediment)}
        </div>
        <div class="ly-note-tab-panel" data-guide-pane="yao" hidden>
          <p class="ly-guide-tip">爻辞 · 初→上。世应已标（八宫默认位）。白话对照在古文下方。</p>
          ${yaoHtml}
        </div>
        <div class="ly-note-tab-panel" data-guide-pane="pro" hidden>
          <p class="ly-guide-tip">专业注解：对应六爻「专业排盘」——六神 / 用神 / 忌神。</p>
          <div class="ly-classic-block">
            <p class="ly-classic-zh"><span class="ly-classic-tag">宫位 / 世应</span>${escapeHtml(pack.pro.palace)}；应在${escapeHtml(LINE_LABELS[pack.pro.yingLine - 1]!)}</p>
          </div>
          <div class="ly-classic-block">
            <p class="ly-classic-zh"><span class="ly-classic-tag">六神</span>随起卦日干排布（青龙→朱雀→勾陈→螣蛇→白虎→玄武）。图鉴无某日，起卦后见完整装卦。</p>
          </div>
          <div class="ly-classic-block">
            <p class="ly-classic-zh"><span class="ly-classic-tag">用神 / 原神 / 忌神</span>依所问人事而定（求财看妻财、问官看官鬼）。原神生用神，忌神克用神。</p>
          </div>
          <p class="ly-guide-tip">${escapeHtml(pack.pro.tip)}</p>
        </div>
        <div class="ly-note-tab-panel" data-guide-pane="classic" hidden>
          <p class="ly-guide-tip">传统详解：整卦卦辞 · 大象 · 增删。逐爻见「爻辞解释」。</p>
          ${
            pack.classic.judgment
              ? `<div class="ly-classic-block">
            <p class="ly-classic-zh"><span class="ly-classic-tag">卦辞</span>${escapeHtml(pack.classic.judgment)}</p>
            <p class="ly-classic-bai"><span class="ly-classic-tag is-bai">白话</span>${escapeHtml(pack.classic.daBai)}</p>
          </div>`
              : '<p class="ly-guide-tip">本库暂无卦辞。</p>'
          }
          ${
            pack.classic.daXiang
              ? `<div class="ly-classic-block">
            <p class="ly-classic-zh"><span class="ly-classic-tag">大象</span>${escapeHtml(pack.classic.daXiang)}</p>
          </div>`
              : ''
          }
          ${
            pack.classic.zengshan
              ? `<div class="ly-classic-block">
            <p class="ly-classic-zh"><span class="ly-classic-tag">增删卜易</span>${escapeHtml(pack.classic.zengshan)}</p>
          </div>`
              : ''
          }
        </div>
        <div class="ly-note-tab-panel" data-guide-pane="sediment" hidden>
          <p class="ly-guide-tip">我的沉淀：对应六爻「个人沉淀」，仅存本机。</p>
          <label class="ly-course-note-field">
            <span>我对这一卦的体会</span>
            <textarea class="question-input" rows="5" data-guide-sediment placeholder="第一眼的感觉、触动的句子、日后回看…">${escapeHtml(sediment)}</textarea>
          </label>
        </div>
      </div>
    </div>
  `;
}

export function bindHexGuideNotes(
  root: HTMLElement,
  hexName: string,
  opts?: { onRestore?: (journalId: string) => void },
): void {
  const tabs = root.querySelectorAll<HTMLButtonElement>('[data-guide-tab]');
  const panes = root.querySelectorAll<HTMLElement>('[data-guide-pane]');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.guideTab;
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panes.forEach((p) => {
        const on = p.dataset.guidePane === id;
        p.classList.toggle('is-active', on);
        p.hidden = !on;
      });
    });
  });

  bindGuideDomainTabs(root);
  bindTermGloss(root);
  bindHexEncounterPanel(root, {
    onSaveNote: (text) => saveHexSediment(hexName, text),
    onRestore: (id) => opts?.onRestore?.(id),
  });

  const ta = root.querySelector<HTMLTextAreaElement>('[data-guide-sediment]');
  ta?.addEventListener('change', () => saveHexSediment(hexName, ta.value));
  ta?.addEventListener('blur', () => saveHexSediment(hexName, ta.value));
}
