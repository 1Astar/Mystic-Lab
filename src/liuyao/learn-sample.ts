import {
  buildCastFromThrows,
  facesToThrow,
  type CastResult,
  type YaoKind,
  type YaoThrow,
} from './engine.ts';
import { LINE_LABELS, upperLowerFromLines, yingLineOf } from './hexagrams.ts';
import { buildFiveSteps, fiveStepExplain } from './five-steps.ts';
import { composeScene } from './scene-map.ts';
import { YAO_KIND_GUIDE } from './yao-kind-guide.ts';

/** 学习示例：覆盖四象 + 世应 + 本/变卦（山火贲 → 山风蛊） */
const SAMPLE_SUMS = [9, 6, 7, 8, 8, 7] as const;

function throwFromSum(sum: 6 | 7 | 8 | 9): YaoThrow {
  if (sum === 6) return facesToThrow(['obverse', 'obverse', 'obverse']);
  if (sum === 7) return facesToThrow(['obverse', 'obverse', 'reverse']);
  if (sum === 8) return facesToThrow(['obverse', 'reverse', 'reverse']);
  return facesToThrow(['reverse', 'reverse', 'reverse']);
}

export function buildLearnSampleCast(): CastResult {
  return buildCastFromThrows(
    SAMPLE_SUMS.map((s) => throwFromSum(s)),
    'coin',
  );
}

export interface ExplainPayload {
  title: string;
  body: string[];
}

export function explainYaoKind(kind: YaoKind): ExplainPayload {
  const g = YAO_KIND_GUIDE[kind];
  return {
    title: kind,
    body: [g.look, g.why, g.changing ? '变卦里，这一爻会阴阳对调。' : '变卦里，这一爻保持原样。'],
  };
}

export function explainLineCell(
  cast: CastResult,
  lineIndex: number,
): ExplainPayload {
  const t = cast.throws[lineIndex]!;
  const g = YAO_KIND_GUIDE[t.kind];
  const label = LINE_LABELS[lineIndex]!;
  const shi = cast.shiLine === lineIndex + 1;
  const ying = cast.yingLine === lineIndex + 1;
  const role = shi
    ? '此爻为世（我）——解卦时先看「我这边」落在哪一层。'
    : ying
      ? '此爻为应（外界）——解卦时看「对面/环境」落在哪一层。'
      : '此爻既非世也非应，仍可配合动爻看这一层有没有在变。';
  return {
    title: `${label} · ${t.kind}`,
    body: [
      `画法：${g.look}`,
      role,
      t.changing
        ? `这是动爻：会翻转到变卦，变为${t.bit === 1 ? '阴（断开）' : '阳（连横）'}。动爻是解卦引擎。`
        : '这是静爻：变卦中这一爻与本卦相同。',
    ],
  };
}

export function explainShiYing(cast: CastResult, which: '世' | '应'): ExplainPayload {
  const line = which === '世' ? cast.shiLine : cast.yingLine;
  return {
    title: which === '世' ? '世爻（解卦骨架）' : '应爻（解卦骨架）',
    body: [
      which === '世'
        ? '世＝我：你的立场、状态、能动的部分。不看世应，卦辞再漂亮也落不到「你」。'
        : '应＝外界：对方、岗位、环境。不看应，就不知道对面在哪。',
      `本示例：${which}在${LINE_LABELS[line - 1]}。世在第 ${cast.shiLine} 爻时，应在第 ${yingLineOf(cast.shiLine)} 爻。`,
      '感情：世看己、应看对方；工作：世看准备度、应看岗位/环境。',
    ],
  };
}

export function explainHexSide(
  cast: CastResult,
  side: '本卦' | '变卦',
): ExplainPayload {
  if (side === '本卦') {
    const { upper, lower } = upperLowerFromLines(cast.primaryLines);
    const scene = composeScene(upper, lower, cast.primary);
    return {
      title: `本卦 · ${cast.primary.fullName}`,
      body: [scene.formula, scene.bridge, scene.career, scene.love],
    };
  }
  if (!cast.changed) {
    return {
      title: '变卦',
      body: ['无动爻则无变卦。先把本卦场景与世应看清。'],
    };
  }
  const { upper, lower } = upperLowerFromLines(cast.changedLines);
  const scene = composeScene(upper, lower, cast.changed);
  return {
    title: `变卦 · ${cast.changed.fullName}`,
    body: [
      '变卦＝动爻翻转后的下一幕方向，不是注定结局。',
      scene.formula,
      scene.career,
      scene.love,
    ],
  };
}

export function explainTopic(
  key: string,
  cast: CastResult,
  question = '',
): ExplainPayload | null {
  if (key.startsWith('step:')) {
    const n = Number(key.slice('step:'.length)) as 1 | 2 | 3 | 4 | 5;
    const step = buildFiveSteps(cast, question).find((s) => s.step === n);
    return step ? fiveStepExplain(step) : null;
  }
  if (key.startsWith('yao-kind:')) {
    return explainYaoKind(key.slice('yao-kind:'.length) as YaoKind);
  }
  if (key.startsWith('line:')) {
    return explainLineCell(cast, Number(key.slice('line:'.length)));
  }
  if (key === 'shi') return explainShiYing(cast, '世');
  if (key === 'ying') return explainShiYing(cast, '应');
  if (key === 'primary') return explainHexSide(cast, '本卦');
  if (key === 'changed') return explainHexSide(cast, '变卦');
  if (key === 'liu-qin') {
    return {
      title: '六亲',
      body: [
        '完整装卦后，每一爻会标父母、兄弟、子孙、妻财、官鬼之一。',
        '以世为「我」，按五行生克定六亲。',
        '先掌握五步走；六亲装卦后续叠进同一张表。',
      ],
    };
  }
  if (key === 'dong') {
    return {
      title: '动爻（解卦引擎）',
      body: [
        '老阳（○）、老阴（×）为动爻——标出「哪里正在变」。',
        '没有动爻，变卦只是装饰；动爻才是过程箭头。',
        `本示例动爻在：${cast.changingIndexes.map((i) => LINE_LABELS[i]).join('、')}。`,
        cast.changed
          ? `翻转后形成变卦「${cast.changed.fullName}」：${cast.changed.gist}`
          : '',
      ].filter(Boolean),
    };
  }
  return null;
}
