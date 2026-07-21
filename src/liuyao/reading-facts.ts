import type { CastResult } from './engine.ts';
import { LINE_LABELS, upperLowerFromLines } from './hexagrams.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { dressHexagram } from './najia.ts';
import {
  composeScene,
  detectSceneDomain,
  type SceneDomain,
} from './scene-map.ts';
import { buildShengKeMap } from './shengke-map.ts';
import { lineApproxWuXing, shiYingRelation, type ShiYingRel } from './wuxing.ts';
import { resolveYongShen } from './yong-shen.ts';

/** 爻位角色（初→上） */
export const LINE_ROLE = [
  '基础 / 开端 / 基层',
  '内部 / 宅内 / 助手',
  '关口 / 过渡 / 门口',
  '外部 / 门庭 / 近外',
  '核心 / 君位 / 决策',
  '收束 / 结果 / 终结',
] as const;

export type ReadingLineRef = {
  line: number;
  label: string;
  role: string;
  index: number;
};

export type ReadingFacts = {
  question: string;
  domain: SceneDomain;
  primary: {
    name: string;
    fullName: string;
    keywords: string[];
    gist: string;
  };
  changed: {
    name: string;
    fullName: string;
    keywords: string[];
    gist: string;
  } | null;
  upperNature: string;
  lowerNature: string;
  upperId: string;
  lowerId: string;
  sceneFormula: string;
  sceneBridge: string;
  sceneCareer: string;
  sceneLove: string;
  shi: ReadingLineRef;
  ying: ReadingLineRef;
  shiYingRel: { rel: ShiYingRel; verdict: string; tip: string };
  changing: { indexes: number[]; labels: string[] };
  yong: {
    name: string;
    why: string;
    tip: string;
    matchedLine?: number;
    matchedLabel?: string;
  };
  shengKe: {
    summary: string;
    tip: string;
    whyYuan?: string;
    whyJi?: string;
  };
  themeWord: string;
};

function mapLineRole(line1to6: number): ReadingLineRef {
  const index = line1to6 - 1;
  return {
    line: line1to6,
    label: LINE_LABELS[index]!,
    role: LINE_ROLE[index]!,
    index,
  };
}

function buildShengKeFacts(
  cast: CastResult,
  question: string,
  castAt: Date,
): ReadingFacts['shengKe'] & { matchedLine?: number; matchedLabel?: string } {
  const sz = siZhuFromDate(castAt);
  const dressed = dressHexagram(cast, sz.dayStem);
  const map = buildShengKeMap(cast, dressed, question);
  const yongNode = map.nodes.find((n) => n.role === '用神');
  const yuanNode = map.nodes.find((n) => n.role === '原神');
  const jiNode = map.nodes.find((n) => n.role === '忌神');

  const whyYuan = yuanNode
    ? `因为「${yuanNode.row.liuqin}」在${yuanNode.row.label}${
        yuanNode.row.changing ? '（动）' : ''
      }五行生用神，所以它是帮你的原神——可借这一层的资源/信息推进。`
    : undefined;

  const whyJi = jiNode
    ? `因为「${jiNode.row.liuqin}」在${jiNode.row.label}${
        jiNode.row.changing ? '（动）' : ''
      }克制用神，所以它是忌神——这一层的急躁或干扰会拖累你问的事。`
    : undefined;

  return {
    summary: map.summary,
    tip: map.tip,
    whyYuan,
    whyJi,
    matchedLine: yongNode ? yongNode.row.index : undefined,
    matchedLabel: yongNode ? yongNode.row.label : undefined,
  };
}

/** 一次起卦共享事实，供速断 / 学习双轨渲染 */
export function buildReadingFacts(
  cast: CastResult,
  question: string,
  castAt: Date = new Date(),
): ReadingFacts {
  const domain = detectSceneDomain(question);
  const { upper, lower } = upperLowerFromLines(cast.primaryLines);
  const scene = composeScene(upper, lower, cast.primary);
  const shi = mapLineRole(cast.shiLine);
  const ying = mapLineRole(cast.yingLine);
  const shiWx = lineApproxWuXing(cast.shiLine, upper.id, lower.id);
  const yingWx = lineApproxWuXing(cast.yingLine, upper.id, lower.id);
  const shiYingRel = shiYingRelation(shiWx, yingWx);
  const yong = resolveYongShen(question);
  const sk = buildShengKeFacts(cast, question, castAt);

  return {
    question,
    domain,
    primary: {
      name: cast.primary.name,
      fullName: cast.primary.fullName,
      keywords: [...cast.primary.keywords],
      gist: cast.primary.gist,
    },
    changed: cast.changed
      ? {
          name: cast.changed.name,
          fullName: cast.changed.fullName,
          keywords: [...cast.changed.keywords],
          gist: cast.changed.gist,
        }
      : null,
    upperNature: upper.nature,
    lowerNature: lower.nature,
    upperId: upper.id,
    lowerId: lower.id,
    sceneFormula: scene.formula,
    sceneBridge: scene.bridge,
    sceneCareer: scene.career,
    sceneLove: scene.love,
    shi,
    ying,
    shiYingRel,
    changing: {
      indexes: [...cast.changingIndexes],
      labels: cast.changingIndexes.map((i) => LINE_LABELS[i]!),
    },
    yong: {
      name: yong.name,
      why: yong.why,
      tip: yong.tip,
      matchedLine: sk.matchedLine,
      matchedLabel: sk.matchedLabel,
    },
    shengKe: {
      summary: sk.summary,
      tip: sk.tip,
      whyYuan: sk.whyYuan,
      whyJi: sk.whyJi,
    },
    themeWord: cast.primary.keywords[0] ?? cast.primary.name,
  };
}
