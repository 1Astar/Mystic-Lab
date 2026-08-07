/**
 * 图鉴 · 命盘关联层：根据当前用户四柱动态生成。
 */
import type { BaziChart, PillarCell } from './cast.ts';
import { stemTenGod } from './cast.ts';
import { getBaziEncyclopedia, isAtlasLibraryKind } from './codex-encyclopedia.ts';
import type { CodexDossier } from './codex-encyclopedia-types.ts';
import { buildCodexDossier } from './codex-dossier.ts';
import {
  BRANCH_WUXING,
  STEM_WUXING,
  type WuXing,
} from './elements.ts';
import type { LuckCycles } from './luck-cycles.ts';
import { getStarCard } from './codex-tags.ts';

const SHENG: WuXing[] = ['木', '火', '土', '金', '水'];

function nextWx(wx: WuXing): WuXing {
  return SHENG[(SHENG.indexOf(wx) + 1) % 5]!;
}

function controlsWx(a: WuXing, b: WuXing): boolean {
  return nextWx(nextWx(a)) === b;
}

const PILLAR_STAGE: Record<string, string> = {
  year: '早年 / 家族环境',
  month: '青年社会 / 职业底色',
  day: '自我与伴侣',
  hour: '晚年 / 子女 / 未来方向',
  liunian: '流年当下',
};

export type ChartLinkHit = {
  key: PillarCell['key'];
  title: string;
  stage: string;
  how: string;
};

export type ChartLinkReport = {
  present: boolean;
  summary: string;
  hits: ChartLinkHit[];
  stageNotes: string[];
  peerRelations: string[];
  shengKe: string[];
  strength: {
    deLing: boolean | null;
    deDi: boolean | null;
    deShi: boolean | null;
    note: string;
  };
  dayMasterImpact: string;
  luckTrigger: string;
  dossierHint: string;
};

function natal(chart: BaziChart): PillarCell[] {
  return chart.pillars.filter((p) => p.key !== 'liunian' && !p.empty);
}

function entryWx(id: string): WuXing | '' {
  const e = getBaziEncyclopedia(id);
  if (!e) return '';
  if (e.kind === 'wuxing') return e.id as WuXing;
  return (e.tags.wuxing as WuXing) || '';
}

function matchStem(cell: PillarCell, stem: string): string | null {
  if (cell.stem === stem) return `天干「${stem}」`;
  if (cell.hideGan.includes(stem)) return `藏干「${stem}」`;
  return null;
}

function matchBranch(cell: PillarCell, branch: string): string | null {
  if (cell.branch === branch) return `地支「${branch}」`;
  return null;
}

function matchTengod(cell: PillarCell, name: string): string | null {
  if (cell.stemGod === name) return `天干十神「${name}」`;
  if (cell.hideGods.includes(name)) return `藏干十神「${name}」`;
  return null;
}

function matchShensha(cell: PillarCell, name: string): string | null {
  if (cell.shensha.some((s) => s === name || s.includes(name))) {
    return `神煞「${name}」`;
  }
  return null;
}

function matchWuxing(cell: PillarCell, wx: WuXing): string | null {
  const bits: string[] = [];
  if (STEM_WUXING[cell.stem] === wx) bits.push(`干${cell.stem}`);
  if (BRANCH_WUXING[cell.branch] === wx) bits.push(`支${cell.branch}`);
  for (const g of cell.hideGan) {
    if (STEM_WUXING[g] === wx) bits.push(`藏${g}`);
  }
  return bits.length ? bits.join('·') : null;
}

function collectHits(chart: BaziChart, id: string): ChartLinkHit[] {
  const entry = getBaziEncyclopedia(id);
  if (!entry) return [];
  const hits: ChartLinkHit[] = [];
  const star = getStarCard(id);

  for (const cell of natal(chart)) {
    let how: string | null = null;
    if (entry.kind === 'stem') how = matchStem(cell, entry.id);
    else if (entry.kind === 'branch') how = matchBranch(cell, entry.id);
    else if (entry.kind === 'tengod') how = matchTengod(cell, star?.name || entry.title);
    else if (entry.kind === 'shensha') how = matchShensha(cell, star?.name || entry.title);
    else if (entry.kind === 'wuxing') how = matchWuxing(cell, entry.id as WuXing);
    else if (entry.kind === 'jiazi') {
      const gz = `${cell.stem}${cell.branch}`;
      how = gz === entry.title ? '本柱坐落' : null;
    } else if (entry.kind === 'nayin') {
      how = cell.nayin === entry.title ? `纳音${cell.nayin}` : null;
    }

    if (how) {
      hits.push({
        key: cell.key,
        title: cell.title,
        stage: PILLAR_STAGE[cell.key] || cell.title,
        how,
      });
    }
  }
  return hits;
}

function peerRelationNotes(chart: BaziChart, id: string): string[] {
  const entry = getBaziEncyclopedia(id);
  if (!entry || (entry.kind !== 'stem' && entry.kind !== 'branch')) return [];
  const notes: string[] = [];
  const target = entry.id;
  const cells = natal(chart);
  const peers = new Set<string>();
  for (const c of cells) {
    peers.add(c.stem);
    peers.add(c.branch);
    for (const g of c.hideGan) peers.add(g);
  }
  peers.delete(target);
  peers.delete('—');

  const dossier = buildCodexDossier(id);
  if (dossier) {
    for (const combo of dossier.combos) {
      const peerId = combo.peer.replace(/金|木|水|火|土/g, '').slice(0, 1);
      const hit =
        peers.has(combo.peer) ||
        peers.has(peerId) ||
        [...peers].some((p) => combo.peer.includes(p) || p.includes(combo.peer.charAt(0)));
      if (hit) notes.push(combo.note);
    }
  }

  // 盘内干支两两提示（限 4 条）
  if (entry.kind === 'stem') {
    for (const p of peers) {
      if (!STEM_WUXING[p]) continue;
      const god = stemTenGod(chart.dayMaster, p);
      if (p !== target && STEM_WUXING[target] && notes.length < 6) {
        const myWx = STEM_WUXING[target]!;
        const otherWx = STEM_WUXING[p]!;
        if (nextWx(myWx) === otherWx) {
          notes.push(`盘内见${p}：${entry.title}生${p}（${god || '泄秀'}）。`);
        } else if (controlsWx(otherWx, myWx)) {
          notes.push(`盘内见${p}：${p}克${entry.title}（压力/成器）。`);
        } else if (nextWx(otherWx) === myWx) {
          notes.push(`盘内见${p}：${p}生${entry.title}（滋养/贵人）。`);
        }
      }
    }
  }

  return [...new Set(notes)].slice(0, 6);
}

function strengthOf(
  chart: BaziChart,
  id: string,
): ChartLinkReport['strength'] {
  const wx = entryWx(id);
  if (!wx) {
    return { deLing: null, deDi: null, deShi: null, note: '此类词条不以五行旺衰论得令得地。' };
  }
  const month = natal(chart).find((c) => c.key === 'month');
  const monthWx = month ? BRANCH_WUXING[month.branch] : undefined;
  const season = chart.season.find((s) => s.label === wx);
  const deLing = season ? season.strength === '旺' || season.strength === '相' : monthWx === wx;

  let rootHits = 0;
  let sameHits = 0;
  for (const c of natal(chart)) {
    if (BRANCH_WUXING[c.branch] === wx) {
      rootHits += 1;
      sameHits += 1;
    }
    if (STEM_WUXING[c.stem] === wx) sameHits += 1;
    for (const g of c.hideGan) {
      if (STEM_WUXING[g] === wx) {
        rootHits += 1;
        sameHits += 0.5;
      }
    }
  }
  const deDi = rootHits >= 1;
  const deShi = sameHits >= 2.5;

  const parts = [
    deLing ? '得令' : '不得令',
    deDi ? '得地' : '不得地',
    deShi ? '得势' : '不得势',
  ];
  return {
    deLing,
    deDi,
    deShi,
    note: `相对月令与通根：${parts.join('、')}。`,
  };
}

function dayMasterImpactOf(chart: BaziChart, id: string): string {
  const entry = getBaziEncyclopedia(id);
  if (!entry) return '—';
  const dm = chart.dayMaster;
  const dmWx = chart.dayMasterWx;

  if (entry.kind === 'stem') {
    if (entry.id === dm) return `此即日主本体「${dm}」——一切喜忌以调候与流通为准。`;
    const god = stemTenGod(dm, entry.id);
    const wx = STEM_WUXING[entry.id];
    if (!wx || !dmWx) return `相对日主为「${god}」。`;
    if (nextWx(wx) === dmWx) return `对日主偏助力：${entry.title}生${dm}（资源/贵人感），十神「${god}」。`;
    if (controlsWx(wx, dmWx)) return `对日主偏压力：${entry.title}克${dm}（规则/考验），十神「${god}」。`;
    if (nextWx(dmWx) === wx) return `日主生之，偏泄气/表达出口，十神「${god}」。`;
    if (controlsWx(dmWx, wx) ) return `日主克之，偏掌控/求财向，十神「${god}」。`;
    if (wx === dmWx) return `与日主同气，比劫帮身或夺财，十神「${god}」。`;
    return `相对日主为「${god}」。`;
  }

  if (entry.kind === 'branch') {
    const wx = BRANCH_WUXING[entry.id];
    if (!wx || !dmWx) return '看该支是否通根日主、是否冲合日支。';
    if (entry.id === chart.dayBranch) return '此为日支（配偶宫/坐下），对自我落脚影响最大。';
    if (wx === dmWx || nextWx(wx) === dmWx) return `地支「${entry.title}」气场偏生扶日主。`;
    if (controlsWx(wx, dmWx)) return `地支「${entry.title}」气场偏克制日主。`;
    return `地支「${entry.title}」以通根与冲合论对日主的影响。`;
  }

  if (entry.kind === 'tengod') {
    const name = getStarCard(id)?.name || entry.title;
    return `十神「${name}」相对日主：看落柱与旺衰，过旺为压、有制为用。`;
  }

  if (entry.kind === 'wuxing') {
    const wx = entry.id as WuXing;
    if (!dmWx) return '—';
    if (wx === dmWx) return '此为日主本气五行。';
    if (nextWx(wx) === dmWx) return '此行生扶日主，多为助力资源。';
    if (controlsWx(wx, dmWx)) return '此行克制日主，多为压力或成器之铁。';
    if (nextWx(dmWx) === wx) return '日主生此行，多为泄秀与出口。';
    return '与日主隔位相克/相生，看流通。';
  }

  return '神煞对日主的影响，宜结合落柱喜忌，不作单一定论。';
}

function luckTriggerOf(
  chart: BaziChart,
  id: string,
  luck: LuckCycles | null,
): string {
  if (!luck) return '尚未排出大运流年（需完整出生信息与性别）。';
  const entry = getBaziEncyclopedia(id);
  if (!entry) return '—';
  const curDu = luck.dayun.find((d) => d.current && !d.empty);
  const curLn = luck.liunian.find((l) => l.current) || luck.liunian.find((l) => l.selected);
  const bits: string[] = [];

  const touch = (stem: string, branch: string, label: string) => {
    if (entry.kind === 'stem' && (stem === entry.id)) bits.push(`${label}天干触发`);
    if (entry.kind === 'branch' && branch === entry.id) bits.push(`${label}地支触发`);
    if (entry.kind === 'wuxing') {
      const wx = entry.id as WuXing;
      if (STEM_WUXING[stem] === wx || BRANCH_WUXING[branch] === wx) bits.push(`${label}五行触发`);
    }
    if (entry.kind === 'tengod') {
      const name = getStarCard(id)?.name || entry.title;
      if (stemTenGod(chart.dayMaster, stem) === name) bits.push(`${label}十神触发`);
    }
    if (entry.kind === 'shensha') {
      /* 神煞流年触发需另表；此处提示落点 */
    }
  };

  if (curDu) touch(curDu.stem, curDu.branch, `当前大运${curDu.ganZhi}`);
  if (curLn) touch(curLn.stem, curLn.branch, `流年${curLn.year}`);

  // 原局流年柱
  const lnPillar = chart.pillars.find((p) => p.key === 'liunian' && !p.empty);
  if (lnPillar) touch(lnPillar.stem, lnPillar.branch, '盘面流年柱');

  if (!bits.length) {
    return `当前大运 ${curDu?.ganZhi || '—'} · 流年 ${curLn?.year || '—'}：未直接触发本词条。`;
  }
  return bits.join('；') + '。';
}

export function buildChartLinkReport(
  id: string,
  chart: BaziChart | null,
  luck: LuckCycles | null = null,
  dossier?: CodexDossier | null,
): ChartLinkReport {
  const d = dossier ?? buildCodexDossier(id);
  if (!chart) {
    return {
      present: false,
      summary: '填写出生信息并排盘后，这里会显示它在你命盘里的位置与作用。',
      hits: [],
      stageNotes: [],
      peerRelations: [],
      shengKe: [],
      strength: { deLing: null, deDi: null, deShi: null, note: '—' },
      dayMasterImpact: '—',
      luckTrigger: '—',
      dossierHint: d?.chartRole || '',
    };
  }

  const hits = collectHits(chart, id);
  const present = hits.length > 0;
  const stageNotes = hits.map(
    (h) => `${h.title}（${h.stage}）：${h.how}`,
  );
  const peerRelations = peerRelationNotes(chart, id);
  const strength = strengthOf(chart, id);
  const dayMasterImpact = dayMasterImpactOf(chart, id);
  const luckTrigger = luckTriggerOf(chart, id, luck);

  const entry = getBaziEncyclopedia(id);
  const shengKe: string[] = [];
  if (entry) {
    for (const g of entry.relations.helpedBy.slice(0, 2)) {
      shengKe.push(`被${g.label}生扶`);
    }
    for (const c of entry.relations.controls.slice(0, 1)) {
      shengKe.push(`克制${c.label}`);
    }
    for (const d2 of entry.relations.drainedBy.slice(0, 1)) {
      shengKe.push(`受${d2.label}泄/耗`);
    }
  }

  const summary = present
    ? `在你的命盘中出现于：${hits.map((h) => h.title).join('、')}。`
    : '原局四柱未直接出现此词条（仍可作知识卡学习；流年大运或合会时可能触发）。';

  return {
    present,
    summary,
    hits,
    stageNotes,
    peerRelations,
    shengKe,
    strength,
    dayMasterImpact,
    luckTrigger,
    dossierHint: d?.chartRole || '',
  };
}

/** 卡片层：命盘出现状态短文案 */
export function chartPresenceLabel(
  id: string,
  chart: BaziChart | null,
  lit: boolean,
): string {
  const entry = getBaziEncyclopedia(id);
  const atlas = entry ? isAtlasLibraryKind(entry.kind) : false;
  if (!chart) {
    if (atlas) return '';
    return lit ? '已点亮' : '未点亮';
  }
  const hits = collectHits(chart, id);
  if (hits.length) {
    return `命盘 · ${hits.map((h) => h.title.replace(/柱/, '')).join('·')}出现`;
  }
  // 甲子/纳音等索引默认可读，勿写成「已点亮」造成误解
  if (atlas) {
    if (entry?.kind === 'jiazi' || entry?.kind === 'nayin') return '原局未见此柱';
    return '';
  }
  return lit ? '已点亮 · 原局未直接坐落' : '未点亮';
}
