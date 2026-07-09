/** 单牌知识库覆盖（优先于 deck 泛化文案） */
export type CardKnowledgeOverride = {
  keywords: string[];
  oneSentence: string;
  uprightMeaning: string;
  reversedMeaning: string;
  uprightKeywords?: string[];
  reversedKeywords?: string[];
  wealthMeaning?: string;
  misreadings?: string[];
  visualOverview?: string;
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
  'pentacles-four': {
    keywords: ['稳定', '安全感', '控制', '守住资源', '保守', '防御', '害怕失去'],
    oneSentence:
      '星币四像一个人坐在城镇边缘，紧紧抱着自己的金币——他拥有资源，但也被资源困住；想守住安全感，却因为太怕失去而变得紧绷、保守。',
    uprightMeaning:
      '正位时，牌在说你正在努力守住已有的东西：金钱、位置、安全感或某种「不能失去」的秩序。这能带来稳定，也可能让你身体和心都不太流动。',
    reversedMeaning:
      '逆位时，过度紧握可能开始松动——要么被迫分享，要么意识到「守住」的代价是错失机会。牌在问：你是真的安全，还是只是不敢动？',
  },
};
