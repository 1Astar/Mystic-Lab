import type { SixGod } from './six-gods.ts';
import { sixGodKeywordsLine } from './six-gods.ts';
import {
  detectQuestionType,
  type QuestionType,
  type QuestionTypeId,
} from './question-types.ts';

/** AI 解读五段模板（结果页 / 未来 LLM 共用结构） */
export type AiReading = {
  question: string;
  god: string;
  meaning: string;
  analysis: string;
  suggestion: string;
  reflection: string;
  typeId: QuestionTypeId;
  typeLabel: string;
};

function domainLine(god: SixGod, typeId: QuestionTypeId): string {
  switch (typeId) {
    case 'emotion':
      return god.emotion;
    case 'career':
      return god.career;
    case 'wealth':
      return god.wealth;
    case 'travel':
      return god.travel;
    case 'self':
      return god.self;
    default:
      return god.symbolism;
  }
}

function buildAnalysis(question: string, god: SixGod, type: QuestionType): string {
  if (!question.trim()) {
    return `${god.name}落课。${god.symbolism}${god.positive.join('、')}。`;
  }

  const domain = domainLine(god, type.id);
  return `${god.name}落课。就你的问题「${question.trim()}」来看：${domain}`;
}

function buildSuggestion(god: SixGod, type: QuestionType): string {
  if (type.id === 'general') return god.action;
  return `${god.action}（侧重：${type.focus}）`;
}

export function buildAiReading(question: string, god: SixGod): AiReading {
  const type = detectQuestionType(question);
  const q = question.trim();

  return {
    question: q || '（未填写具体问题）',
    god: god.name,
    meaning: `${god.name}代表${sixGodKeywordsLine(god)}。${god.symbolism}`,
    analysis: buildAnalysis(q, god, type),
    suggestion: buildSuggestion(god, type),
    reflection: god.warning[0] ?? god.misread,
    typeId: type.id,
    typeLabel: type.label,
  };
}

export function buildTraditionalMeaning(god: SixGod): string {
  return buildAiReading('', god).meaning;
}

export function buildProcessExplanation(basisLabel: string, godName: string): string {
  return `本次以 ${basisLabel} 起课，按月 → 日 → 时的顺序推演，最终落在「${godName}」。`;
}

export const LESSON_CHECKLIST = [
  '公历如何转农历',
  '当前时间对应哪个时辰',
  '小六壬如何按月、日、时起课',
  '六神的基础含义',
] as const;
