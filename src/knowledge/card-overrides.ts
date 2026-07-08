/** 单牌知识库覆盖（优先于 deck 泛化文案） */
export type CardKnowledgeOverride = {
  keywords: string[];
  oneSentence: string;
  uprightMeaning: string;
  reversedMeaning: string;
};

export const CARD_KNOWLEDGE_OVERRIDES: Record<string, CardKnowledgeOverride> = {
  'swords-ten': {
    keywords: ['终结', '触底', '过度消耗', '灾难化想象', '旧模式结束'],
    oneSentence:
      '宝剑十正位通常指向一段压力累积后的终点——像「已经撑到极限」的信号，也可能代表你正在用最糟糕的想象审判自己。',
    uprightMeaning:
      '它未必预言真正的毁灭，更像在说：某个阶段已经走到尽头，继续硬撑只会更耗。你需要辨认，哪些是现实困境，哪些是被放大后的灾难化想象。',
    reversedMeaning:
      '逆位时，最坏的阶段可能正在过去，但余波还在。你可能仍习惯往最糟处想，或还没允许自己从「判死刑」式的自我对话里走出来。',
  },
};
