/**
 * 盘面→现代陪读透镜（解析 / 为什么共用）
 * 用户面主用白话，括号内保留传统六亲名以便接轨。
 */
import type { CastResult } from './engine.ts';
import { LINE_LABELS } from './hexagrams.ts';
import { dressHexagram, type LiuQin } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { LINE_ROLE } from './reading-facts.ts';
import { getHexVoice } from './hex-voice.ts';

export const QIN_MODERN: Record<LiuQin, string> = {
  官鬼: '目标系统 / 外部规则',
  妻财: '物质根基 / 自我价值',
  父母: '文书信息 / 合同靠山',
  兄弟: '竞争分利 / 同辈拉扯',
  子孙: '破局点子 / 敢试的一小步',
};

export type BoardLens = {
  shi: { position: string; role: string; qin: LiuQin; modern: string };
  ying: { position: string; role: string; qin: LiuQin; modern: string };
  moving: string[];
  caifu?: { position: string; role: string };
  fumu?: { position: string; role: string };
  /** 有信息/口舌杂音提示（原朱雀，用户面不提神煞名） */
  hasInfoNoise: boolean;
  infoNoiseOn: string[];
};

export function getBoardLens(cast: CastResult, castAt = new Date()): BoardLens {
  const dressed = dressHexagram(cast, siZhuFromDate(castAt).dayStem);
  const shi = dressed.rows.find((r) => r.isShi)!;
  const ying = dressed.rows.find((r) => r.isYing)!;

  const findQin = (qin: LiuQin) => {
    const row = dressed.rows.find((r) => r.liuqin === qin);
    if (!row) return undefined;
    return {
      position: LINE_LABELS[row.index]!,
      role: LINE_ROLE[row.index] ?? '',
    };
  };

  const zhuque = dressed.rows
    .filter((r) => r.liushen === '朱雀')
    .map((r) => LINE_LABELS[r.index]!);

  return {
    shi: {
      position: LINE_LABELS[shi.index]!,
      role: LINE_ROLE[shi.index] ?? '',
      qin: shi.liuqin,
      modern: QIN_MODERN[shi.liuqin],
    },
    ying: {
      position: LINE_LABELS[ying.index]!,
      role: LINE_ROLE[ying.index] ?? '',
      qin: ying.liuqin,
      modern: QIN_MODERN[ying.liuqin],
    },
    moving: cast.changingIndexes.map((i) => LINE_LABELS[i]!),
    caifu: findQin('妻财'),
    fumu: findQin('父母'),
    hasInfoNoise: zhuque.length > 0,
    infoNoiseOn: zhuque,
  };
}

/** 盘面辅读短文：世应动 + 判词卡主调（供 Pack boardExpand） */
export function buildBoardExpandText(cast: CastResult, castAt = new Date()): string {
  const lens = getBoardLens(cast, castAt);
  const pVoice = getHexVoice(cast.primary.name);
  const cVoice = cast.changed ? getHexVoice(cast.changed.name) : undefined;
  const lines: string[] = [
    `世在${lens.shi.position}，气质偏「${QIN_MODERN[lens.shi.qin]}（${lens.shi.qin}）」。`,
    `应在${lens.ying.position}，外界偏「${QIN_MODERN[lens.ying.qin]}（${lens.ying.qin}）」。`,
    lens.moving.length
      ? `动爻：${lens.moving.join('、')}——过程可能有拉扯，别指望一步到位。`
      : '无动：局面暂稳，先核对事实再谈翻盘。',
  ];
  if (pVoice) {
    lines.push(`本卦主调「${pVoice.frame}」：${pVoice.metaphorSolo}`);
  }
  if (cast.changed && cVoice) {
    lines.push(`变卦走向「${cVoice.asChanged}」：${cVoice.metaphorSolo}`);
  } else if (cast.changed) {
    lines.push(`变向「${cast.changed.name}」（${cast.changed.keywords.slice(0, 2).join('、')}）。`);
  }
  if (lens.caifu) {
    lines.push(
      `妻财在${lens.caifu.position}${lens.caifu.role ? `（${lens.caifu.role}）` : ''}：物质根基 / 自我价值层更显眼。`,
    );
  }
  if (lens.hasInfoNoise) {
    lines.push(`信息杂音落在${lens.infoNoiseOn.join('、')}：口头不算数，以书面为准。`);
  }
  return lines.join('\n');
}
