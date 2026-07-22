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

/** 教学用白话对白（边算边学 Step 4） */
export function buildCourseShengKeDialogue(graph: ShengKeGraph): {
  tease: string;
  dialogue: string;
} {
  const yong = graph.nodes.find((n) => n.roles.includes('用神') || n.role === '用神');
  const yuan = graph.nodes.find((n) => n.roles.includes('原神') || n.role === '原神');
  const ji = graph.nodes.find((n) => n.roles.includes('忌神') || n.role === '忌神');
  const hasSheng = graph.edges.some((e) => e.kind === '生' && e.toRole === '用神');
  const hasKe = graph.edges.some((e) => e.kind === '克' && e.toRole === '用神');

  const tease =
    '刚才我们找到了代表你的世爻，和代表事情的用神。它们现在「打架」了，你猜谁赢了？往下看因果图。';

  if (!yong) {
    return {
      tease,
      dialogue:
        '这张图里，用神还没落到具体爻上。先把问题写具体，或回到上一步把世应看清，再来猜输赢。',
    };
  }

  let dialogue: string;
  if (hasSheng && hasKe) {
    dialogue = `虽然当前环境有个因素在拉你后腿${
      ji ? `（红线·${ji.row.label}）` : '（红线的克）'
    }，但好在有个隐藏力量在暗中扶持你${
      yuan ? `（绿线·${yuan.row.label}）` : '（绿线的生）'
    }。最终结果是：扶持的力量压过了拖后腿的，所以事情有的救——先减干扰，再借力推进。`;
  } else if (hasSheng && !hasKe) {
    dialogue = `好消息：有隐藏力量在暗中扶持你${
      yuan ? `（绿线·${yuan.row.label}）` : ''
    }，拖后腿的不明显。可以顺着这股助力，做一小步验证。`;
  } else if (hasKe && !hasSheng) {
    dialogue = `眼下拖后腿的力更明显${
      ji ? `（红线·${ji.row.label}）` : ''
    }，暗中扶持还不够亮。先别硬冲：把干扰层降下来，再谈推进。`;
  } else {
    dialogue =
      '这局里生克都不显眼。少盯复杂拉扯，先用世应与动爻定下一步，比硬猜输赢更管用。';
  }

  return { tease, dialogue };
}

const ROLE_PLAIN: Record<GraphRole, string> = {
  用神: '核心目标',
  原神: '暗中扶持',
  忌神: '拖后腿',
  世: '你',
};

/** 边算边学：带动画的生克星图 + 白话对白 */
export function renderCourseShengKeHtml(
  graph: ShengKeGraph,
  opts?: { compact?: boolean },
): string {
  const { tease, dialogue } = buildCourseShengKeDialogue(graph);
  const compact = opts?.compact ?? false;
  const w = 320;
  const h = 220;
  const drawn = new Set<number>();

  const nodeSvg = graph.nodes
    .map((n) => {
      if (drawn.has(n.row.index)) return '';
      drawn.add(n.row.index);
      const primary =
        (['用神', '原神', '忌神', '世'] as GraphRole[]).find((r) => n.roles.includes(r)) ??
        n.role;
      const p = POS[primary];
      const plain = ROLE_PLAIN[primary];
      const classic = primary;
      const cls =
        primary === '用神'
          ? 'is-yong'
          : primary === '忌神'
            ? 'is-ji'
            : primary === '原神'
              ? 'is-yuan'
              : 'is-shi';
      return `
        <g class="ly-sk-node ly-sk-course-node ${cls}" data-sk-line="${n.row.index}">
          <circle cx="${p.x}" cy="${p.y}" r="30"/>
          <text class="ly-sk-role" x="${p.x}" y="${p.y - 8}" text-anchor="middle">${plain}</text>
          <text class="ly-sk-meta" x="${p.x}" y="${p.y + 6}" text-anchor="middle">${n.row.label}</text>
          <text class="ly-sk-meta ly-sk-classic-tag" x="${p.x}" y="${p.y + 18}" text-anchor="middle">${classic}</text>
        </g>`;
    })
    .join('');

  const edgeSvg = graph.edges
    .map((e, i) => {
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
      const tip = e.kind === '生' ? '生（帮助）' : '克（阻碍）';
      const delay = e.kind === '克' ? 'ly-sk-anim-ke' : 'ly-sk-anim-sheng';
      return `
        <line class="ly-sk-edge ${delay}" style="--sk-i:${i}" x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" marker-end="url(#ly-sk-course-arrow-${e.kind})" />
        <g class="ly-sk-pop ${delay}">
          <rect class="ly-sk-pop-bg is-${e.kind === '生' ? 'sheng' : 'ke'}" x="${mx - 36}" y="${my - 22}" width="72" height="20" rx="6"/>
          <text class="ly-sk-edge-label" x="${mx}" y="${my - 8}" text-anchor="middle">${tip}</text>
        </g>`;
    })
    .join('');

  return `
    <section class="ly-sk-course" data-course-shengke>
      ${compact ? '' : `<p class="ly-sk-course-tease">${tease}</p>`}
      <svg class="ly-sk-svg ly-sk-course-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="因果生克星图">
        <defs>
          <marker id="ly-sk-course-arrow-生" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#6aab73"/>
          </marker>
          <marker id="ly-sk-course-arrow-克" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#c45c4a"/>
          </marker>
        </defs>
        ${edgeSvg}
        ${nodeSvg}
      </svg>
      ${compact ? '' : `<p class="ly-sk-course-dialogue">${dialogue}</p>`}
    </section>
  `;
}
