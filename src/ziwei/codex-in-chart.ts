/**
 * 图鉴「在你盘里」：白话拆解落宫 + 跳完整命盘
 */
import type { ChartStarHit } from './codex-collect.ts';
import { getMinorStarLore } from './minor-star-lore.ts';
import { getPalaceLore } from './palace-lore.ts';
import { getShenshaLore } from './shensha-lore.ts';
import { getStarLore } from './stars.ts';
import { getStarProfile } from './star-profiles.ts';
import { mutagenNoteForStar, type MutagenKind } from './star-mutagen-notes.ts';
import { normalizeStatus, STATUS_PRODUCT } from './term-glossary.ts';

export type CodexInChartKind = 'major' | 'minor' | 'shensha';

export type CodexInChartView = {
  inChart: boolean;
  palace?: string;
  /** 短标题：落在「福德（内在快乐系统）」 */
  placeLine: string;
  /** 兼容旧调用：拼成一段 */
  roleLine: string;
  /** 白话拆解：星 → 宫 → 合读 → 亮度 → 流年 */
  explain: string[];
  /** 传给 data-goto-chart，已含 mode=chart */
  jumpQs: string;
};

/** 宫的生活说法：命宫（我是谁） */
export function palaceLifeLabel(palace: string): string {
  const lore = getPalaceLore(palace);
  if (lore?.hint) return `${palace}（${lore.hint}）`;
  return palace;
}

export function ziweiChartJumpQs(opts: {
  star?: string;
  palace?: string;
  status?: string;
}): string {
  const q = new URLSearchParams({ mode: 'chart' });
  if (opts.star?.trim()) q.set('star', opts.star.trim());
  if (opts.palace?.trim()) q.set('palace', opts.palace.trim());
  if (opts.status?.trim()) q.set('status', opts.status.trim());
  return q.toString();
}

/** 神煞/杂曜叠在宫上的用法提示（非吉凶判决） */
export function decoUseTip(name: string, palace: string): string {
  const life = getPalaceLore(palace)?.hint ?? palace;
  if (/红鸾|天喜|天姚|咸池|龙池|凤阁/.test(name)) {
    return `用在「${life}」时：先看边界与节奏，别把气色当成必须成交的承诺。`;
  }
  if (/孤辰|寡宿|华盖/.test(name)) {
    return `用在「${life}」时：允许独处与精简社交，质量重于热闹。`;
  }
  if (/截路|截空|空亡|旬空|天空|天虚/.test(name)) {
    return `用在「${life}」时：先把交付物写清楚、地基补实，再谈加速。`;
  }
  if (/天刑|阴煞|劫杀|劫煞|白虎|灾煞|贯索|官符/.test(name)) {
    return `用在「${life}」时：规则谈清、证据优先，少硬刚升级。`;
  }
  if (/天伤|天哭|天月|病符|丧门|吊客/.test(name)) {
    return `用在「${life}」时：先护身心与情绪出口，神煞是提醒不是判决。`;
  }
  if (/天德|月德|天使|解神|年解|天才|文昌|文曲/.test(name)) {
    return `用在「${life}」时：留缓冲与求助通道，把才艺/文书当加分色调。`;
  }
  if (/将星|攀鞍|大耗|岁破|左辅|右弼|天魁|天钺/.test(name)) {
    return `用在「${life}」时：权责与资源账一起看，动中求进也要留蓄水池。`;
  }
  return `用在「${life}」时：只作色调，叠在本宫主星与三方四正上读，不单独吓人。`;
}

/** 宫位白话：这宫管什么（不是判决） */
const PALACE_PLAIN: Record<string, string> = {
  命宫: '命宫：不是「命好不好」，更像自我主场——你怎么定调、扛事、被看见。',
  兄弟: '兄弟宫：同辈、协作与平级关系——谁跟你一起扛、谁跟你较劲。',
  夫妻: '夫妻宫：亲密惯性——你怎么靠近、怎么谈、怎么相处。',
  子女: '子女宫：创造与产出——作品、项目、带人，不一定只指小孩。',
  财帛: '财帛宫：资源处理——钱怎么进、怎么留、怎么花在你在乎的事上。',
  疾厄: '疾厄宫：身心边界——压力落在哪、休息够不够、哪里容易透支。',
  迁移: '迁移宫：外部世界——换场、出行、外人眼里的你。',
  仆役: '交友宫（仆役）：圈子与协作——谁给你路线图，谁消耗你。',
  官禄: '官禄宫：事业轨道——你怎么做事、被认领、换成舞台。',
  田宅: '田宅宫：根据地——家、资产、能不能真正歇下来的地方。',
  福德: '福德：不是「有没有福气」的判决，更像精神账户——休息、兴趣、满足感从哪来。',
  父母: '父母宫：支持与规则——长辈、权威、你内化的「应该怎样」。',
};

/** 主星×宫：合读专句（逐步加厚） */
const PLACEMENT_PLAIN: Partial<Record<string, Partial<Record<string, string>>>> = {
  天机: {
    福德:
      '落在一起：安全感来自「脑内有地图」。心里安，是因为路径想通了，不是单纯躺平或狂欢。',
    命宫: '落在一起：身份感来自「想得通」。你靠脑子定调，也容易把自己想进死胡同。',
    官禄: '落在一起：事业吃策划与应变——方案多时，先交付最小可验证的一版。',
    财帛: '落在一起：资源处理靠算路，不靠硬撞——信息差要换成交付，才进得了账。',
    夫妻: '落在一起：亲密里爱沟通策略；记得留一点不必说清的松弛。',
    迁移: '落在一起：外部世界刺激新算法——换场能刷新，也别把每个场都复盘到天亮。',
  },
};

const BRIGHT_PLAIN: Partial<Record<string, Partial<Record<string, string>>>> = {
  天机: {
    陷: '亮度「陷」：这套智变气质发挥不太顺——容易变成：越想休息越在头脑加班、方案很多但难落地、快乐被分析冲淡。不是宫位坏了，是天机这台发动机在这里转得别扭。',
  },
};

function palaceKey(palace: string): string {
  return palace.replace(/宫$/, '');
}

function clipClause(s: string, max = 28): string {
  const t = s.replace(/[。；;].*$/, '').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function starEssenceLine(starId: string): string {
  const profile = getStarProfile(starId);
  const card = getStarLore(starId);
  if (profile) {
    const keys = profile.keywords.slice(0, 4).join('、');
    const gift = clipClause(profile.trait.gift);
    const shadow = clipClause(profile.trait.shadow);
    return `${starId}：${keys}。强项是${gift}；阴影是${shadow}。`;
  }
  if (card) {
    return `${starId}：以「${card.epithet}」气质出场——${clipClause(card.portrait, 36)}。`;
  }
  return `${starId}：先看它落在哪条人生线上。`;
}

function palacePlainLine(palace: string): string {
  const key = palaceKey(palace);
  if (PALACE_PLAIN[key]) return PALACE_PLAIN[key]!;
  const lore = getPalaceLore(palace);
  if (lore?.oneLiner) return `${lore.title}：${lore.oneLiner}`;
  if (lore?.hint) return `${lore.title}：关乎「${lore.hint}」。`;
  return `${palace}：本宫主星会在这里显出用法。`;
}

function togetherLine(starId: string, palace: string): string {
  const key = palaceKey(palace);
  const curated = PLACEMENT_PLAIN[starId]?.[key];
  if (curated) return curated;
  const profile = getStarProfile(starId);
  const hit = profile?.palaces.find((p) => palaceKey(p.palaceId) === key || palaceKey(p.title) === key);
  if (hit?.line) return `落在一起：${hit.line}`;
  const hint = getPalaceLore(palace)?.hint ?? palace;
  return `落在一起：它的气质会接到你「${hint}」这条线上——先看顺不顺，再谈吉凶。`;
}

function brightnessPlainLine(starId: string, brightness: string): string {
  const key = normalizeStatus(brightness);
  const curated = BRIGHT_PLAIN[starId]?.[key] ?? BRIGHT_PLAIN[starId]?.[brightness];
  if (curated) return curated;
  const info = STATUS_PRODUCT[key];
  if (info) {
    return `亮度「${brightness}」：${info.userLine}——描述发挥顺不顺，不是人生好坏判决。`;
  }
  return `亮度「${brightness}」：先对照宫位与四化，别单独吓人。`;
}

function yearHuaPlainLine(
  starId: string,
  yearHua: { year: number; kind: string },
): string {
  const kind = yearHua.kind as MutagenKind;
  if (starId === '天机' && kind === '权') {
    return `${yearHua.year} 流年化权：这一年天机更有「拍板权」——适合把脑子里的分支收成一条能验证的路，别只想不决。`;
  }
  const note = mutagenNoteForStar(starId, kind);
  return `${yearHua.year} 流年化${kind}：${note}`;
}

export function buildCodexInChartView(
  starId: string,
  hit: ChartStarHit | undefined,
  kind: CodexInChartKind,
  opts?: {
    hasChart?: boolean;
    yearHua?: { year: number; kind: string; label: string } | null;
  },
): CodexInChartView {
  const jumpQs = ziweiChartJumpQs({ star: starId, palace: hit?.palace });
  if (!hit?.palace) {
    const placeLine = opts?.hasChart
      ? '你的本命盘里目前没有它——图鉴仍可预览，不伪造落宫。'
      : '尚未排盘。完善出生信息并打开完整命盘后，这里会显示它落在哪一宫。';
    const roleLine = '没有落宫时，先看下方百科含义即可。';
    return {
      inChart: false,
      placeLine,
      roleLine,
      explain: [roleLine],
      jumpQs: ziweiChartJumpQs({}),
    };
  }

  const place = palaceLifeLabel(hit.palace);
  const placeLine = `落在「${place}」。`;

  if (kind !== 'major') {
    const blurb =
      kind === 'shensha'
        ? getShenshaLore(starId)?.oneLiner ?? ''
        : getMinorStarLore(starId)?.oneLiner ?? '';
    const tip = decoUseTip(starId, hit.palace);
    const explain = [
      blurb ? `${starId}：${blurb}` : `${starId}叠在本宫作色调。`,
      palacePlainLine(hit.palace),
      tip,
    ].filter(Boolean);
    return {
      inChart: true,
      palace: hit.palace,
      placeLine,
      roleLine: explain.join(''),
      explain,
      jumpQs,
    };
  }

  const explain: string[] = [
    starEssenceLine(starId),
    palacePlainLine(hit.palace),
    togetherLine(starId, hit.palace),
  ];
  if (hit.isSoulMajor) {
    explain.push('它也是你命宫主星之一：这条线的发挥，会更贴近「我是谁」。');
  }
  if (hit.brightness) {
    explain.push(brightnessPlainLine(starId, hit.brightness));
  }
  if (opts?.yearHua) {
    explain.push(yearHuaPlainLine(starId, opts.yearHua));
  }

  return {
    inChart: true,
    palace: hit.palace,
    placeLine,
    roleLine: explain.join(''),
    explain,
    jumpQs,
  };
}

/** 详情页 HTML 片段 */
export function renderInChartSectionHtml(
  view: CodexInChartView,
  escapeHtml: (s: string) => string,
): string {
  const cta = view.inChart
    ? `<p><button type="button" class="ziwei-inline-link ziwei-goto-chart-cta" data-goto-chart="${escapeHtml(view.jumpQs)}">去完整命盘 →</button></p>`
    : `<p><button type="button" class="ziwei-inline-link ziwei-goto-chart-cta" data-goto-chart="${escapeHtml(view.jumpQs)}">打开完整命盘 →</button></p>`;
  const body = (view.explain?.length ? view.explain : [view.roleLine])
    .map((line) => `<p class="ziwei-in-chart-explain">${escapeHtml(line)}</p>`)
    .join('');
  return `
    <section class="ziwei-detail-block ziwei-in-chart-block">
      <h3>在你盘里</h3>
      <p class="ziwei-in-chart-place">${escapeHtml(view.placeLine)}</p>
      <div class="ziwei-in-chart-explains">${body}</div>
      ${cta}
    </section>`;
}
