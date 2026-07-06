export type CardDefinition = {
  id: string;
  nameEn: string;
  nameZh: string;
  arcana: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  rank?: string;
  keywords: string[];
  upright: string;
  reversed: string;
  color: string;
  symbol: string;
};

const MAJOR_DATA: Omit<CardDefinition, 'id' | 'arcana'>[] = [
  { nameEn: 'The Fool', nameZh: '愚者', keywords: ['新开始', '冒险'], color: '#f0c040', symbol: '☀', upright: '愚者正位象征全新的旅程与无限可能。你正站在起点，内心充满好奇与勇气，愿意放下顾虑向前迈步。此刻适合追随直觉，拥抱未知。', reversed: '愚者逆位提醒谨慎行事，避免冲动与鲁莽。你可能忽略了潜在风险，或在重要决定上缺乏准备。先稳住脚步，再决定是否出发。' },
  { nameEn: 'The Magician', nameZh: '魔术师', keywords: ['意志', '创造'], color: '#e05c8a', symbol: '∞', upright: '魔术师正位代表你拥有将想法化为现实的能力与资源。专注、技巧与自信齐备，是采取行动、展现才华的良机。', reversed: '魔术师逆位暗示才能未充分发挥，或存在欺骗与操纵。警惕自我怀疑，也避免用巧言掩饰真相。' },
  { nameEn: 'The High Priestess', nameZh: '女祭司', keywords: ['直觉', '神秘'], color: '#7eb8da', symbol: '☽', upright: '女祭司正位呼唤你倾听内在声音。答案不在外界喧嚣中，而在静默与直觉深处。耐心等待，真相会自然浮现。', reversed: '女祭司逆位表示与直觉失联，或被表面信息迷惑。需要重新建立内在平静，辨别真实与幻象。' },
  { nameEn: 'The Empress', nameZh: '皇后', keywords: ['丰饶', '滋养'], color: '#6bc98a', symbol: '♀', upright: '皇后正位象征成长、滋养与丰盛。你正处创造力旺盛的阶段，适合培育计划、关系或自我关怀。', reversed: '皇后逆位可能意味过度依赖或创造力受阻。注意平衡给予与索取，避免忽视自身需求。' },
  { nameEn: 'The Emperor', nameZh: '皇帝', keywords: ['权威', '结构'], color: '#c45c3a', symbol: '♔', upright: '皇帝正位代表秩序、领导力与稳定框架。此刻需要果断决策，建立规则，以理性掌控局面。', reversed: '皇帝逆位警示专制或失控。可能过于僵化，或缺乏自律与方向，需重新审视权力运用方式。' },
  { nameEn: 'The Hierophant', nameZh: '教皇', keywords: ['传统', '信仰'], color: '#9b7fd4', symbol: '✝', upright: '教皇正位指向传统智慧、学习与精神指引。寻求导师、制度或信念的支持，将助你找到正确路径。', reversed: '教皇逆位鼓励打破陈规，独立思考。不必盲从权威，但要明确自己真正相信什么。' },
  { nameEn: 'The Lovers', nameZh: '恋人', keywords: ['选择', '联结'], color: '#e88cb0', symbol: '♥', upright: '恋人正位关乎价值一致的选择与深层联结。感情、合作或重要决定，都需心与心的契合。', reversed: '恋人逆位暗示分歧、犹豫或价值观冲突。需要诚实面对关系中的裂痕，勿逃避抉择。' },
  { nameEn: 'The Chariot', nameZh: '战车', keywords: ['胜利', '意志'], color: '#4a90c4', symbol: '⚡', upright: '战车正位象征以坚定意志克服障碍，向前推进。自律与专注将带你赢得阶段性胜利。', reversed: '战车逆位表示方向迷失或内在冲突。外力再强，若心未统一，也难以抵达目标。' },
  { nameEn: 'Strength', nameZh: '力量', keywords: ['勇气', '耐心'], color: '#d4a040', symbol: '♌', upright: '力量正位并非蛮力，而是以温柔与耐心驯服野性。以同理与自信面对挑战，你将展现真正勇气。', reversed: '力量逆位暗示自我怀疑或情绪失控。重建内在力量，从接纳脆弱开始。' },
  { nameEn: 'The Hermit', nameZh: '隐者', keywords: ['内省', '独处'], color: '#8899aa', symbol: '⌖', upright: '隐者正位邀请你暂时退出喧嚣，独自寻找答案。内省与独处将照亮下一步方向。', reversed: '隐者逆位可能过度孤立或拒绝他人帮助。独处有益，但别把自己封闭在孤独中。' },
  { nameEn: 'Wheel of Fortune', nameZh: '命运之轮', keywords: ['转变', '周期'], color: '#c9a227', symbol: '☸', upright: '命运之轮正位标志转折与机遇来临。接受变化，顺势而为，好运正在转动。', reversed: '命运之轮逆位暗示阻滞或坏运气。变化难免，关键是调整心态，在低谷中积蓄力量。' },
  { nameEn: 'Justice', nameZh: '正义', keywords: ['公平', '因果'], color: '#5a8fc4', symbol: '⚖', upright: '正义正位强调公平、真相与因果。诚实面对自己与他人，决定将得到公正结果。', reversed: '正义逆位警示偏见或不公。可能逃避责任，或遭遇不公正待遇，需寻求澄清。' },
  { nameEn: 'The Hanged Man', nameZh: '倒吊人', keywords: ['牺牲', '等待'], color: '#7a9eb8', symbol: '⊥', upright: '倒吊人正位意味暂停与换位思考。有时放手与等待，比强行行动更能带来领悟。', reversed: '倒吊人逆位表示无谓拖延或抗拒必要牺牲。该行动时需行动，别以等待为借口。' },
  { nameEn: 'Death', nameZh: '死神', keywords: ['结束', '重生'], color: '#4a4a5a', symbol: '☠', upright: '死神正位象征旧章落幕与新生的开始。结束并非毁灭，而是为蜕变腾出空间。', reversed: '死神逆位暗示抗拒改变，紧抓过去不放。唯有放手，才能迎接新的可能。' },
  { nameEn: 'Temperance', nameZh: '节制', keywords: ['平衡', '调和'], color: '#6ab8c4', symbol: '☯', upright: '节制正位倡导中庸与耐心调和。在极端之间找到平衡，循序渐进方能达成和谐。', reversed: '节制逆位表示失衡与急躁。可能过度或不足，需要重新校准节奏与比例。' },
  { nameEn: 'The Devil', nameZh: '恶魔', keywords: ['束缚', '欲望'], color: '#8b3a3a', symbol: '♄', upright: '恶魔正位揭示欲望、执念或无形束缚。觉察什么在控制你，才有解脱的可能。', reversed: '恶魔逆位象征打破枷锁、重获自由。你正从不良习惯或有毒关系中抽离。' },
  { nameEn: 'The Tower', nameZh: '塔', keywords: ['突变', '觉醒'], color: '#c44a2a', symbol: '⚡', upright: '塔正位预示突发变故与旧结构崩塌。震撼虽痛，却清除虚假，为真相重建铺路。', reversed: '塔逆位表示危机被延迟或冲击减弱。别因侥幸忽视隐患，主动调整好过被动崩塌。' },
  { nameEn: 'The Star', nameZh: '星星', keywords: ['希望', '灵感'], color: '#88b8e8', symbol: '★', upright: '星星正位带来希望、疗愈与灵感。黑暗之后，微光指引你继续前行，保持信念。', reversed: '星星逆位暗示失望或信心不足。希望仍在，只是暂时被阴霾遮蔽，别放弃。' },
  { nameEn: 'The Moon', nameZh: '月亮', keywords: ['幻象', '潜意识'], color: '#8898c8', symbol: '☾', upright: '月亮正位表示迷雾与潜意识涌动。并非一切如表面所见，需分辨恐惧与真实。', reversed: '月亮逆位象征迷雾散去，真相渐明。困惑减轻，直觉变得更加清晰可信。' },
  { nameEn: 'The Sun', nameZh: '太阳', keywords: ['喜悦', '成功'], color: '#f0c040', symbol: '☀', upright: '太阳正位是喜悦、成功与生命力的象征。一切明朗，自信绽放，值得庆祝。', reversed: '太阳逆位表示快乐受阻或过度乐观。调整期望，小小阴霾遮不住本质的光明。' },
  { nameEn: 'Judgement', nameZh: '审判', keywords: ['觉醒', '召唤'], color: '#c9a8e8', symbol: '♪', upright: '审判正位呼唤觉醒与重生。回顾过往，听从内心召唤，做出符合真我的抉择。', reversed: '审判逆位暗示自我批判或逃避反省。放下苛责，诚实但不残忍地面对自己。' },
  { nameEn: 'The World', nameZh: '世界', keywords: ['完成', '圆满'], color: '#6bc98a', symbol: '◎', upright: '世界正位标志周期圆满完成与整合达成。你已走过重要旅程，可以庆祝成就。', reversed: '世界逆位表示尚未完成或临门一脚差一步。再坚持片刻，圆满触手可及。' },
];

const SUITS = [
  { key: 'wands' as const, zh: '权杖', symbol: '🔥', color: '#e07040' },
  { key: 'cups' as const, zh: '圣杯', symbol: '💧', color: '#4a90c4' },
  { key: 'swords' as const, zh: '宝剑', symbol: '💨', color: '#8898b0' },
  { key: 'pentacles' as const, zh: '星币', symbol: '🌍', color: '#c9a040' },
];

const RANKS = [
  { en: 'Ace', zh: 'Ace', theme: '新契机' },
  { en: 'Two', zh: '二', theme: '平衡与选择' },
  { en: 'Three', zh: '三', theme: '成长与表达' },
  { en: 'Four', zh: '四', theme: '稳定与休息' },
  { en: 'Five', zh: '五', theme: '冲突与挑战' },
  { en: 'Six', zh: '六', theme: '和谐与回馈' },
  { en: 'Seven', zh: '七', theme: '坚持与考验' },
  { en: 'Eight', zh: '八', theme: '行动与变化' },
  { en: 'Nine', zh: '九', theme: '积累与警觉' },
  { en: 'Ten', zh: '十', theme: '圆满与负担' },
  { en: 'Page', zh: '侍从', theme: '探索与学习' },
  { en: 'Knight', zh: '骑士', theme: '追求与冲动' },
  { en: 'Queen', zh: '王后', theme: '滋养与洞察' },
  { en: 'King', zh: '国王', theme: '掌控与成熟' },
];

function buildMinorCards(): CardDefinition[] {
  const cards: CardDefinition[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const id = `${suit.key}-${rank.en.toLowerCase()}`;
      cards.push({
        id,
        nameEn: `${rank.en} of ${suit.key.charAt(0).toUpperCase() + suit.key.slice(1)}`,
        nameZh: `${suit.zh}${rank.zh}`,
        arcana: 'minor',
        suit: suit.key,
        rank: rank.en,
        keywords: [suit.zh, rank.theme],
        color: suit.color,
        symbol: suit.symbol,
        upright: `${suit.zh}${rank.zh}正位：在${rank.theme}的主题下，${suit.zh}的能量正流动。你正经历与${suit.zh}相关的积极发展，保持觉察并顺势而为。`,
        reversed: `${suit.zh}${rank.zh}逆位：${rank.theme}方面出现阻滞。${suit.zh}的能量受阻，需检视是否忽视内在信号或方向偏差。`,
      });
    }
  }
  return cards;
}

export const TAROT_DECK: CardDefinition[] = [
  ...MAJOR_DATA.map((card, i) => ({
    ...card,
    id: `major-${i}`,
    arcana: 'major' as const,
  })),
  ...buildMinorCards(),
];

export function getCardById(id: string): CardDefinition | undefined {
  return TAROT_DECK.find((c) => c.id === id);
}
