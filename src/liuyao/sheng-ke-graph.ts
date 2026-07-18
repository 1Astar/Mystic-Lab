import type { YaoDress, LiuQin } from './najia.ts';
import { yongLiuQinList, resolveYongShen } from './yong-shen.ts';
import {
  whatGenerates,
  whatOvercomes,
  WX_KE,
  WX_SHENG,
  type WuXing,
} from './wuxing.ts';

export type GraphRole = '用神' | '原神' | '忌神' | '世';

export type GraphNode = {
  role: GraphRole;
  row: YaoDress;
  /** 同爻兼多个角色时合并展示 */
  roles: GraphRole[];
};

export type GraphEdge = {
  fromRole: GraphRole;
  toRole: GraphRole;
  kind: '生' | '克';
};

export type ShengKeGraph = {
  yongName: string;
  yongTargets: LiuQin[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  lines: [string, string];
};

function pickBest(candidates: YaoDress[]): YaoDress | undefined {
  if (candidates.length === 0) return undefined;
  const moving = candidates.find((r) => r.changing);
  if (moving) return moving;
  const shi = candidates.find((r) => r.isShi);
  if (shi) return shi;
  return candidates[0];
}

function findByWx(rows: YaoDress[], wx: WuXing, exclude?: number): YaoDress | undefined {
  const list = rows.filter((r) => r.wuxing === wx && r.index !== exclude);
  return pickBest(list);
}

/** 从装卦行构建用神—原神—忌神—世 生克图 */
export function buildShengKeGraph(rows: YaoDress[], question: string): ShengKeGraph {
  const yong = resolveYongShen(question);
  const targets = yongLiuQinList(question);
  const yongCands = rows.filter((r) => targets.includes(r.liuqin));
  const yongRow = pickBest(yongCands);

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const byRole = new Map<GraphRole, YaoDress>();

  const pushNode = (role: GraphRole, row: YaoDress) => {
    const existing = nodes.find((n) => n.row.index === row.index);
    if (existing) {
      if (!existing.roles.includes(role)) existing.roles.push(role);
      if (role === '用神') existing.role = '用神';
      byRole.set(role, row);
      return;
    }
    const node: GraphNode = { role, row, roles: [role] };
    nodes.push(node);
    byRole.set(role, row);
  };

  if (yongRow) {
    pushNode('用神', yongRow);
    const yuanWx = whatGenerates(yongRow.wuxing);
    const jiWx = whatOvercomes(yongRow.wuxing);
    const yuanRow = findByWx(rows, yuanWx, yongRow.index);
    const jiRow = findByWx(rows, jiWx, yongRow.index);
    if (yuanRow) {
      pushNode('原神', yuanRow);
      edges.push({ fromRole: '原神', toRole: '用神', kind: '生' });
    }
    if (jiRow) {
      pushNode('忌神', jiRow);
      edges.push({ fromRole: '忌神', toRole: '用神', kind: '克' });
    }
  }

  const shiRow = rows.find((r) => r.isShi);
  if (shiRow) {
    pushNode('世', shiRow);
    if (yongRow && shiRow.index !== yongRow.index) {
      if (WX_SHENG[shiRow.wuxing] === yongRow.wuxing) {
        edges.push({ fromRole: '世', toRole: '用神', kind: '生' });
      } else if (WX_KE[shiRow.wuxing] === yongRow.wuxing) {
        edges.push({ fromRole: '世', toRole: '用神', kind: '克' });
      } else if (WX_SHENG[yongRow.wuxing] === shiRow.wuxing) {
        edges.push({ fromRole: '用神', toRole: '世', kind: '生' });
      } else if (WX_KE[yongRow.wuxing] === shiRow.wuxing) {
        edges.push({ fromRole: '用神', toRole: '世', kind: '克' });
      }
    }
  }

  const lines = buildConclusions(yong.name, byRole, edges);
  return { yongName: yong.name, yongTargets: targets, nodes, edges, lines };
}

function buildConclusions(
  yongName: string,
  byRole: Map<GraphRole, YaoDress>,
  edges: GraphEdge[],
): [string, string] {
  const yong = byRole.get('用神');
  if (!yong) {
    return [
      `本题倾向看「${yongName}」，本卦暂未直接落到对应六亲爻，先回看世应与动爻。`,
      '把问题写得更具体，或先点装卦表各爻，确认你要盯的目标。',
    ];
  }
  const hasSheng = edges.some((e) => e.kind === '生' && e.toRole === '用神');
  const hasKe = edges.some((e) => e.kind === '克' && e.toRole === '用神');
  const yuan = byRole.get('原神');
  const ji = byRole.get('忌神');

  const line1 = `用神在${yong.label}（${yong.liuqin}${yong.branch}${yong.wuxing}${
    yong.changing ? '·动' : ''
  }）${
    hasSheng && yuan
      ? `，得原神${yuan.label}相生`
      : hasSheng
        ? '，有生助'
        : '，未见明显原神生助'
  }${hasKe && ji ? `，同时受忌神${ji.label}所克` : hasKe ? '，另有克泄' : ''}。`;

  const line2 =
    hasSheng && !hasKe
      ? '格局偏得助：可顺着用神所在层面推进一小步，验证外界是否配合。'
      : hasKe && !hasSheng
        ? '格局有克压：先稳住世爻能控的部分，忌神层面少硬碰，改用迂回。'
        : hasSheng && hasKe
          ? '有生有克：先保用神不被拖垮（减忌神干扰），再借原神之助推进。'
          : '生克都不显：少做复杂推演，先用世应与动爻定下一步。';

  return [line1, line2];
}

const POS: Record<GraphRole, { x: number; y: number }> = {
  原神: { x: 70, y: 48 },
  忌神: { x: 250, y: 48 },
  用神: { x: 160, y: 130 },
  世: { x: 160, y: 210 },
};

function nodeAt(nodes: GraphNode[], role: GraphRole): GraphNode | undefined {
  return nodes.find((n) => n.roles.includes(role) || n.role === role);
}

/** SVG 星图 + 两句结论 */
export function renderShengKeGraphHtml(graph: ShengKeGraph): string {
  const w = 320;
  const h = 250;
  const drawn = new Set<number>();

  const nodeSvg = graph.nodes
    .map((n) => {
      if (drawn.has(n.row.index)) return '';
      drawn.add(n.row.index);
      const primary =
        (['用神', '原神', '忌神', '世'] as GraphRole[]).find((r) => n.roles.includes(r)) ??
        n.role;
      const p = POS[primary];
      const label = n.roles.join('·');
      const cls =
        primary === '用神'
          ? 'is-yong'
          : primary === '忌神'
            ? 'is-ji'
            : primary === '原神'
              ? 'is-yuan'
              : 'is-shi';
      return `
        <g class="ly-sk-node ${cls}" data-sk-line="${n.row.index}">
          <circle cx="${p.x}" cy="${p.y}" r="28"/>
          <text class="ly-sk-role" x="${p.x}" y="${p.y - 6}" text-anchor="middle">${label}</text>
          <text class="ly-sk-meta" x="${p.x}" y="${p.y + 10}" text-anchor="middle">${n.row.label} ${n.row.branch}${n.row.wuxing}</text>
        </g>`;
    })
    .join('');

  const edgeSvg = graph.edges
    .map((e) => {
      const a = nodeAt(graph.nodes, e.fromRole);
      const b = nodeAt(graph.nodes, e.toRole);
      if (!a || !b) return '';
      const pa =
        POS[
          (['用神', '原神', '忌神', '世'] as GraphRole[]).find((r) => a.roles.includes(r)) ??
            a.role
        ];
      const pb =
        POS[
          (['用神', '原神', '忌神', '世'] as GraphRole[]).find((r) => b.roles.includes(r)) ??
            b.role
        ];
      const mx = (pa.x + pb.x) / 2;
      const my = (pa.y + pb.y) / 2;
      const color = e.kind === '生' ? '#6aab73' : '#c45c4a';
      return `
        <line class="ly-sk-edge" x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" stroke="${color}" marker-end="url(#ly-sk-arrow-${e.kind})" />
        <text class="ly-sk-edge-label" x="${mx}" y="${my - 6}" fill="${color}" text-anchor="middle">${e.kind}</text>`;
    })
    .join('');

  return `
    <section class="ly-sk-panel">
      <h4>生克星图</h4>
      <p class="ly-layer-guide">本题用神倾向「${graph.yongName}」。绿=生，红=克；点节点会联动装卦表并打开实盘卡。</p>
      <svg class="ly-sk-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="用神原神忌神生克图">
        <defs>
          <marker id="ly-sk-arrow-生" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#6aab73"/>
          </marker>
          <marker id="ly-sk-arrow-克" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#c45c4a"/>
          </marker>
        </defs>
        ${edgeSvg}
        ${nodeSvg}
      </svg>
      <div class="ly-sk-lines">
        <p>${graph.lines[0]}</p>
        <p>${graph.lines[1]}</p>
      </div>
    </section>
  `;
}
