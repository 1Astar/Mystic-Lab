/**
 * 喂给大模型的精简盘面（勿塞整盘）
 */
import type { CastResult } from './engine.ts';
import { formatHexWithPinyin, hexPinyin } from './hex-pinyin.ts';
import { getBoardLens, QIN_MODERN } from './board-lens.ts';

export type CompactHexagramPayload = {
  user_question: string;
  hexagram_data: {
    primary_name: string;
    primary_name_pinyin?: string;
    changed_name: string | null;
    changed_name_pinyin?: string;
    moving_lines: string[];
    shi_line: { position: string; six_qin: string; modern: string };
    ying_line: { position: string; six_qin: string; modern: string };
    core_traditional_elements: {
      caifu_line?: string;
      fumu_line?: string;
      zhuque_on?: string[];
    };
    keywords: { primary: string[]; changed: string[] };
  };
};

export { QIN_MODERN };

/** 只抽关键字段给 AI，避免整盘噪音 */
export function buildCompactHexagramPayload(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): CompactHexagramPayload {
  const lens = getBoardLens(cast, castAt);

  return {
    user_question: question.trim(),
    hexagram_data: {
      primary_name: formatHexWithPinyin(cast.primary.name, cast.primary.fullName),
      primary_name_pinyin: hexPinyin(cast.primary.name),
      changed_name: cast.changed
        ? formatHexWithPinyin(cast.changed.name, cast.changed.fullName)
        : null,
      changed_name_pinyin: cast.changed ? hexPinyin(cast.changed.name) : undefined,
      moving_lines: lens.moving,
      shi_line: {
        position: lens.shi.position,
        six_qin: lens.shi.qin,
        modern: lens.shi.modern,
      },
      ying_line: {
        position: lens.ying.position,
        six_qin: lens.ying.qin,
        modern: lens.ying.modern,
      },
      core_traditional_elements: {
        caifu_line: lens.caifu?.position,
        fumu_line: lens.fumu?.position,
        zhuque_on: lens.infoNoiseOn.length ? lens.infoNoiseOn : undefined,
      },
      keywords: {
        primary: cast.primary.keywords.slice(0, 3),
        changed: cast.changed?.keywords.slice(0, 3) ?? [],
      },
    },
  };
}
