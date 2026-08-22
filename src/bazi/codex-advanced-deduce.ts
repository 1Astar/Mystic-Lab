/**
 * 图鉴「进阶推演」：词条当索引；原局/流年出现对宫时展开冲合刑害说明书。
 * Soft copy：行程节奏，避必凶必贵。
 */
import type { BaziChart, PillarCell } from './cast.ts';
import { getBaziEncyclopedia } from './codex-encyclopedia.ts';
import type { LuckCycles } from './luck-cycles.ts';
import {
  LIU_CHONG,
  relationsForBranch,
  relationsForStem,
  type BranchRelationHit,
} from './relations.ts';

export type DeduceSource = 'natal' | 'liunian' | 'both' | 'index';

export type AdvancedDeduceModule = {
  /** 寅申冲 / 甲己合化土 */
  name: string;
  kind: string;
  /** 进阶推演 · 寅申冲 */
  title: string;
  body: string;
  /** 原局何处 / 流年触发 */
  where: string;
  peerIds: string[];
  source: DeduceSource;
  ctaLabel?: string;
  ctaHref?: string;
};

const CHONG_PLAYBOOK: Record<string, string> = {
  子午:
    '子午冲像昼夜对撞：作息、情绪冷热、公开与内收容易拉扯。宜把行程切成「冲刺段 / 休整段」，少在极端状态下做长期承诺。',
  丑未:
    '丑未冲偏土气翻搅：事务堆积、责任与拖延感同场。宜清清单、定一个可交付节点，少同时开太多坑。',
  寅申:
    '寅申冲常对应移动、合同文书、工作地点或场域切换的节奏窗。宜留交通与书面核对的缓冲，把「变动」当成行程管理，而非单断吉凶。',
  卯酉:
    '卯酉冲偏锋芒对照：审美/表达与规则/切割同场。宜先对齐标准再输出，少用情绪硬刚书面约定。',
  辰戌:
    '辰戌冲像库门对开：资源搬迁、整理、边界重划。宜做一次收纳式复盘（人、钱、承诺各清一条）。',
  巳亥:
    '巳亥冲偏水火与走位：信息过载与远近切换。宜控输入、留回程，重要决定放在睡足之后。',
};

const HE_PLAYBOOK: Record<string, string> = {
  子丑: '子丑合：人情与事务被拉近，宜把口头约定落到可验收的一小步。',
  寅亥: '寅亥合：生长与资源牵成一股，宜借力成局，也防合而不清、责任糊在一起。',
  卯戌: '卯戌合：表达与承载结盟，适合把作品/方案落到平台上。',
  辰酉: '辰酉合：收纳与锋利同场，宜精修一件事到可交付。',
  巳申: '巳申合：技能与驿动合流，适合学习迁移或短途推进，留归岸。',
  午未: '午未合：热度与田园粘合，宜把热情落成日常节奏，防过黏耗能。',
};

const HAI_PLAYBOOK =
  '相害像暗处绊脚：合作里易有错位预期。宜把关键约定写清，少靠「应该懂」。';

const XING_PLAYBOOK =
  '相刑偏内耗与较劲：同一议题反复摩擦。宜换渠道沟通、拆成可验证的小问题，少在同一情绪里硬耗。';

const SAN_HE_PLAYBOOK =
  '三合/半合偏成局与拉帮：资源向某一五行聚拢。宜看你是否真需要这股东风，再决定跟局还是抽身。';

const STEM_HE_PLAYBOOK: Record<string, string> = {
  甲己: '甲己合土：方向与承载结盟，适合把理想落成可耕耘的事务。',
  乙庚: '乙庚合金：柔韧遇上规则，适合签约、定流程，防被约束绑死。',
  丙辛: '丙辛合水：热度与珠玉合流，表达更精致，也防过亮耗神。',
  丁壬: '丁壬合木：细照与江河相遇，适合深谈与长线滋养。',
  戊癸: '戊癸合火：承载被点燃，适合公开推进一件实事。',
};

function pairKey(a: string, b: string): string {
  return a < b ? `${a}${b}` : `${b}${a}`;
}

function natalPillars(chart: BaziChart): PillarCell[] {
  return chart.pillars.filter((p) => !p.empty && p.key !== 'liunian');
}

function natalBranches(chart: BaziChart): { branch: string; titles: string[] }[] {
  const map = new Map<string, string[]>();
  for (const p of natalPillars(chart)) {
    if (!p.branch || p.branch === '—') continue;
    const list = map.get(p.branch) ?? [];
    list.push(p.title);
    map.set(p.branch, list);
  }
  return [...map.entries()].map(([branch, titles]) => ({ branch, titles }));
}

function natalStems(chart: BaziChart): { stem: string; titles: string[] }[] {
  const map = new Map<string, string[]>();
  for (const p of natalPillars(chart)) {
    const add = (stem: string, how: string) => {
      if (!stem || stem === '—') return;
      const list = map.get(stem) ?? [];
      list.push(`${p.title}${how}`);
      map.set(stem, list);
    };
    add(p.stem, '');
    for (const g of p.hideGan) add(g, '藏');
  }
  return [...map.entries()].map(([stem, titles]) => ({ stem, titles }));
}

function currentLiunian(luck: LuckCycles | null | undefined, chart: BaziChart | null) {
  if (luck) {
    const hit = luck.liunian.find((l) => l.current) || luck.liunian.find((l) => l.selected);
    if (hit) return hit;
  }
  const cell = chart?.pillars.find((p) => p.key === 'liunian' && !p.empty);
  if (!cell) return null;
  return {
    year: chart!.liunianYear,
    stem: cell.stem,
    branch: cell.branch,
  };
}

function chongBody(a: string, b: string): string {
  return CHONG_PLAYBOOK[pairKey(a, b)] || '对冲带来节奏切换。宜留缓冲、核对行程与书面约定，勿单断吉凶。';
}

function heBody(a: string, b: string): string {
  return HE_PLAYBOOK[pairKey(a, b)] || '相合像牵绊成局：人情与事务被拉近，宜把约定落到可验收的一步。';
}

function playbookFor(hit: BranchRelationHit, focus: string, peer: string): string {
  if (hit.kind === '冲') return chongBody(focus, peer);
  if (hit.kind === '合') return heBody(focus, peer);
  if (hit.kind === '害') return HAI_PLAYBOOK;
  if (hit.kind === '刑') return XING_PLAYBOOK;
  if (hit.kind === '三合') return SAN_HE_PLAYBOOK;
  return hit.label;
}

function clashDisplayName(focus: string, peer: string): string {
  const pair = LIU_CHONG.find(
    ([a, b]) => (a === focus && b === peer) || (b === focus && a === peer),
  );
  return pair ? `${pair[0]}${pair[1]}冲` : `${focus}${peer}冲`;
}

function displayName(hit: BranchRelationHit, focus: string, peer: string): string {
  if (hit.kind === '冲') return clashDisplayName(focus, peer);
  if (hit.kind === '合') {
    const label = hit.label.match(/^(.{2})合/)?.[1];
    return label ? `${label}合` : hit.label;
  }
  if (hit.kind === '害') return hit.label.replace('相害', '害');
  if (hit.kind === '刑') return hit.label.replace('相刑', '刑');
  return hit.label;
}

/**
 * 当前词条的进阶推演模块（有盘优先绑盘；无盘给索引提示）。
 */
export function buildAdvancedDeduceModules(
  id: string,
  chart: BaziChart | null | undefined,
  luck: LuckCycles | null | undefined,
): AdvancedDeduceModule[] {
  const entry = getBaziEncyclopedia(id);
  if (!entry) return [];

  if (entry.kind === 'branch') {
    return buildBranchDeduce(entry.id, chart ?? null, luck ?? null);
  }
  if (entry.kind === 'stem') {
    return buildStemDeduce(entry.id, chart ?? null, luck ?? null);
  }
  return [];
}

function buildBranchDeduce(
  focus: string,
  chart: BaziChart | null,
  luck: LuckCycles | null,
): AdvancedDeduceModule[] {
  const hits = relationsForBranch(focus);
  const out: AdvancedDeduceModule[] = [];
  const ln = currentLiunian(luck, chart);
  const cta = chart
    ? { ctaLabel: '在人生地图对照', ctaHref: '/bazi/reading' }
    : undefined;

  if (!chart) {
    const chong = hits.find((h) => h.kind === '冲');
    const peer = chong?.peers[0];
    if (chong && peer) {
      out.push({
        name: clashDisplayName(focus, peer),
        kind: '冲',
        title: `进阶推演 · ${clashDisplayName(focus, peer)}（索引）`,
        body: `图鉴里的「${focus}」是索引。若你命盘或流年出现【${peer}】，会展开「${clashDisplayName(focus, peer)}」说明书：${chongBody(focus, peer)}`,
        where: '排盘后按原局 / 流年自动展开',
        peerIds: [peer],
        source: 'index',
        ctaLabel: '去排盘看你的推演',
        ctaHref: '/bazi/reading',
      });
    }
    return out.slice(0, 1);
  }

  const natal = natalBranches(chart);
  const natalSet = new Map(natal.map((n) => [n.branch, n.titles]));

  for (const hit of hits) {
    for (const peer of hit.peers) {
      if (peer === focus && hit.kind === '刑') {
        // 自刑：原局重复出现
        const titles = natalSet.get(focus) ?? [];
        const count = natalPillars(chart).filter((p) => p.branch === focus).length;
        if (count < 2) continue;
        out.push({
          name: displayName(hit, focus, peer),
          kind: hit.kind,
          title: `进阶推演 · ${displayName(hit, focus, peer)}`,
          body: playbookFor(hit, focus, peer),
          where: `原局多处见【${focus}】（${titles.join('·')}）`,
          peerIds: [focus],
          source: 'natal',
          ...cta,
        });
        continue;
      }

      const natalTitles = natalSet.get(peer);
      const liunianHit = ln?.branch === peer;
      if (!natalTitles && !liunianHit) continue;

      const whereBits: string[] = [];
      let source: DeduceSource = 'natal';
      if (natalTitles?.length) {
        whereBits.push(`原局${natalTitles.join('·')}见【${peer}】`);
      }
      if (liunianHit) {
        whereBits.push(`${ln!.year}流年支【${peer}】`);
        source = natalTitles?.length ? 'both' : 'liunian';
      }

      out.push({
        name: displayName(hit, focus, peer),
        kind: hit.kind,
        title: `进阶推演 · ${displayName(hit, focus, peer)}`,
        body: playbookFor(hit, focus, peer),
        where: whereBits.join('；'),
        peerIds: [peer],
        source,
        ...cta,
      });
    }
  }

  // Prefer 冲 first, then 合, limit to 3
  const rank = (k: string) =>
    k === '冲' ? 0 : k === '合' ? 1 : k === '刑' ? 2 : k === '害' ? 3 : 4;
  out.sort((a, b) => rank(a.kind) - rank(b.kind));
  return out.slice(0, 3);
}

function buildStemDeduce(
  focus: string,
  chart: BaziChart | null,
  luck: LuckCycles | null,
): AdvancedDeduceModule[] {
  const hits = relationsForStem(focus);
  if (!hits.length) return [];
  const hit = hits[0]!;
  const peer = hit.peers[0];
  if (!peer) return [];
  const name = hit.label.replace(/合化.*/, '合');
  const body =
    STEM_HE_PLAYBOOK[pairKey(focus, peer)] ||
    `${hit.label}：天干牵绊成局，宜看是否真要「合」成一件可交付的事。`;

  if (!chart) {
    return [
      {
        name,
        kind: '合',
        title: `进阶推演 · ${name}（索引）`,
        body: `若原局或流年透出【${peer}】，会展开「${name}」说明书。${body}`,
        where: '排盘后按原局 / 流年自动展开',
        peerIds: [peer],
        source: 'index',
        ctaLabel: '去排盘看你的推演',
        ctaHref: '/bazi/reading',
      },
    ];
  }

  const stems = natalStems(chart);
  const natalTitles = stems.find((s) => s.stem === peer)?.titles;
  const ln = currentLiunian(luck, chart);
  const liunianHit = ln?.stem === peer;
  if (!natalTitles && !liunianHit) return [];

  const whereBits: string[] = [];
  let source: DeduceSource = 'natal';
  if (natalTitles?.length) whereBits.push(`原局${natalTitles.join('·')}见【${peer}】`);
  if (liunianHit) {
    whereBits.push(`${ln!.year}流年干【${peer}】`);
    source = natalTitles?.length ? 'both' : 'liunian';
  }

  return [
    {
      name,
      kind: '合',
      title: `进阶推演 · ${name}`,
      body,
      where: whereBits.join('；'),
      peerIds: [peer],
      source,
      ctaLabel: '在人生地图对照',
      ctaHref: '/bazi/reading',
    },
  ];
}
