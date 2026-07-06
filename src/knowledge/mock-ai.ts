import type { CardKnowledge, ReadingContext } from './types.ts';
import { getSceneMeaning } from './registry.ts';

/**
 * P1：模拟第二层 AI 解读。P3 替换为真实 LLM 调用，接口保持不变。
 */
export function mockAIInterpretation(
  context: ReadingContext,
  knowledge: CardKnowledge,
  reversed: boolean,
): string {
  const scene = getSceneMeaning(knowledge, context.topic, reversed);
  const q = context.question.trim();

  if (!q) {
    return `就「${context.cardPosition}」这个位置而言，${knowledge.nameCn}更像在提醒你：${knowledge.oneSentence} ${scene}`;
  }

  const topicLead: Record<ReadingContext['topic'], string> = {
    work: '就你问的工作方向而言，',
    love: '就你问的感情关系而言，',
    study: '就你问的学业成长而言，',
    self: '就你此刻的自我状态而言，',
  };

  return [
    `${topicLead[context.topic]}这张牌不像是在给你一个非黑即白的答案。`,
    `你问的是：「${q}」`,
    `${knowledge.nameCn}在此更像翻译器：${scene}`,
    reversed
      ? '逆位提醒你：阻滞或失衡的部分也值得正视，不必急着用乐观盖过去。'
      : '它邀请你把牌义落回自己的生活经验里，而不是等待外界给一个确定结论。',
  ].join('');
}
