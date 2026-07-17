import type { CastResult } from './engine.ts';
import type { DressedHexagram, LiuQin, YaoDress } from './najia.ts';
import { resolveYongShen } from './yong-shen.ts';

/** 生用神者 = 原神 */
export const YUAN_OF: Record<LiuQin, LiuQin> = {
  父母: '官鬼',
  官鬼: '妻财',
  妻财: '子孙',
  子孙: '兄弟',
  兄弟: '父母',
};

/** 克用神者 = 忌神 */
export const JI_OF: Record<LiuQin, LiuQin> = {
  父母: '妻财',
  官鬼: '子孙',
  妻财: '兄弟',
  子孙: '父母',
  兄弟: '官鬼',
};

export type ShengKeRole = '用神' | '原神' | '忌神' | '世';

export type ShengKeNode = {
  role: ShengKeRole;
  row: YaoDress;
};

export type ShengKeEdge = {
  fromRole: ShengKeRole;
  toRole: ShengKeRole;
  kind: '生' | '克' | '参照';
};

export type ShengKeMap = {
  yongQin: LiuQin | null;
  nodes: ShengKeNode[];
  edges: ShengKeEdge[];
  summary: string;
  tip: string;
};

export function parseYongQinCandidates(yongName: string): LiuQin[] {
  const order: LiuQin[] = ['父母', '官鬼', '妻财', '子孙', '兄弟'];
  return order.filter((q) => yongName.includes(q));
}

function pickRow(rows: YaoDress[], qin: LiuQin): YaoDress | undefined {
  const matches = rows.filter((r) => r.liuqin === qin);
  if (matches.length === 0) return undefined;
  const moving = matches.find((r) => r.changing);
  if (moving) return moving;
  const shi = matches.find((r) => r.isShi);
  if (shi) return shi;
  return matches[0];
}

export function buildShengKeMap(
  cast: CastResult,
  dressed: DressedHexagram,
  question: string,
): ShengKeMap {
  const yong = resolveYongShen(question);
  const candidates = parseYongQinCandidates(yong.name);
  let yongQin: LiuQin | null = null;
  let yongRow: YaoDress | undefined;

  for (const q of candidates.length > 0 ? candidates : (['父母'] as LiuQin[])) {
    const row = pickRow(dressed.rows, q);
    if (row) {
      yongQin = q;
      yongRow = row;
      break;
    }
  }

  if (!yongQin || !yongRow) {
    return {
      yongQin: null,
      nodes: [],
      edges: [],
      summary: '本题用神在装卦表里还对不上具体爻，先回到「核心要素」看用神定义。',
      tip: '写清问题（考试/工作/感情）后，用神六亲会更稳。',
    };
  }

  const yuanQin = YUAN_OF[yongQin];
  const jiQin = JI_OF[yongQin];
  const yuanRow = pickRow(dressed.rows, yuanQin);
  const jiRow = pickRow(dressed.rows, jiQin);
  const shiRow = dressed.rows.find((r) => r.isShi);

  const nodes: ShengKeNode[] = [{ role: '用神', row: yongRow }];
  if (yuanRow) nodes.push({ role: '原神', row: yuanRow });
  if (jiRow) nodes.push({ role: '忌神', row: jiRow });
  if (shiRow && shiRow.index !== yongRow.index) {
    nodes.push({ role: '世', row: shiRow });
  }

  const edges: ShengKeEdge[] = [];
  if (yuanRow) edges.push({ fromRole: '原神', toRole: '用神', kind: '生' });
  if (jiRow) edges.push({ fromRole: '忌神', toRole: '用神', kind: '克' });
  if (shiRow && shiRow.index !== yongRow.index) {
    edges.push({ fromRole: '世', toRole: '用神', kind: '参照' });
  }

  const yuanBit = yuanRow
    ? `原神「${yuanQin}」在${yuanRow.label}${yuanRow.changing ? '（动）' : ''}生用神`
    : `原神「${yuanQin}」未在本卦出现`;
  const jiBit = jiRow
    ? `忌神「${jiQin}」在${jiRow.label}${jiRow.changing ? '（动）' : ''}克用神`
    : `忌神「${jiQin}」未在本卦出现`;

  const summary = `用神「${yongQin}」在${yongRow.label}。${yuanBit}；${jiBit}。`;
  const tip = yuanRow && !jiRow
    ? '原神在场、忌神不现：先借「生你」的那一爻做准备，别空等结果。'
    : jiRow && jiRow.changing
      ? '忌神发动：留意干扰项，把精力放在可验证的一小步上。'
      : yuanRow && yuanRow.changing
        ? '原神发动：助力正在起来，适合主动对接资源/信息。'
        : `结合你的问题（${question.trim() || '未写具体事'}）：先盯用神所在层，再看原神是否帮得上。`;

  void cast;
  return { yongQin, nodes, edges, summary, tip };
}

const ROLE_POS: Record<ShengKeRole, { x: number; y: number }> = {
  用神: { x: 160, y: 88 },
  原神: { x: 48, y: 48 },
  忌神: { x: 272, y: 48 },
  世: { x: 160, y: 168 },
};

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderShengKeMapSvg(map: ShengKeMap): string {
  if (map.nodes.length === 0) {
    return `<p class="ly-guide-tip">${escapeXml(map.summary)}</p>`;
  }

  const nodeByRole = new Map(map.nodes.map((n) => [n.role, n]));
  const lines = map.edges
    .map((e) => {
      const a = ROLE_POS[e.fromRole];
      const b = ROLE_POS[e.toRole];
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2 - 8;
      const cls =
        e.kind === '生' ? 'ly-sk-edge-sheng' : e.kind === '克' ? 'ly-sk-edge-ke' : 'ly-sk-edge-ref';
      return `
        <line class="${cls}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" marker-end="url(#ly-sk-arrow-${e.kind})" />
        <text class="ly-sk-edge-label ${cls}" x="${midX}" y="${midY}">${e.kind}</text>
      `;
    })
    .join('');

  const circles = map.nodes
    .map((n) => {
      const p = ROLE_POS[n.role];
      const cls =
        n.role === '用神'
          ? 'ly-sk-node-yong'
          : n.role === '原神'
            ? 'ly-sk-node-yuan'
            : n.role === '忌神'
              ? 'ly-sk-node-ji'
              : 'ly-sk-node-shi';
      return `
        <g class="${cls}">
          <circle cx="${p.x}" cy="${p.y}" r="28" />
          <text class="ly-sk-role" x="${p.x}" y="${p.y - 4}">${n.role}</text>
          <text class="ly-sk-meta" x="${p.x}" y="${p.y + 12}">${n.row.liuqin}·${n.row.label}</text>
        </g>
      `;
    })
    .join('');

  void nodeByRole;

  return `
    <div class="ly-sk-map" data-shengke-map>
      <p class="ly-guide-label">用神生克星图</p>
      <svg class="ly-sk-svg" viewBox="0 0 320 210" role="img" aria-label="用神原神忌神生克关系">
        <defs>
          <marker id="ly-sk-arrow-生" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#6b9b6e" />
          </marker>
          <marker id="ly-sk-arrow-克" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#c45c4a" />
          </marker>
          <marker id="ly-sk-arrow-参照" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#888888" />
          </marker>
        </defs>
        ${lines}
        ${circles}
      </svg>
      <p class="ly-sk-summary">${escapeXml(map.summary)}</p>
      <p class="ly-sk-tip">${escapeXml(map.tip)}</p>
    </div>
  `;
}
