import type { CardVisualHotspots } from '../../types.ts';

/** 圣杯组牌面热点（14 张） */
export const CUPS_MINOR_HOTSPOTS: CardVisualHotspots[] = [
  {
    cardId: 'cups-ace',
    deckId: 'cups-ace',
    overview:
      '云端之手托出满溢圣杯，白鸽衔币飞过，水滴落入池中。情感与联结从高处倾注——不必强堵，先学习接住。',
    hotspots: [
      { id: 'hand', label: '云端之手', x: 50, y: 28, meaning: '情感、直觉或联结的新开端——从高处倾注而来。' },
      { id: 'cup', label: '圣杯', x: 50, y: 48, meaning: '满溢的感受，值得被看见与接住。' },
      { id: 'dove', label: '白鸽', x: 50, y: 38, meaning: '和平、祝福与心灵层面的讯息。' },
      { id: 'water', label: '溢出水滴', x: 50, y: 62, meaning: '情感自然流动，不必强行堵住。' },
    ],
  },
  {
    cardId: 'cups-two',
    deckId: 'cups-two',
    overview:
      '二人互相递杯，双蛇杖与狮首在上。平等交换与吸引——情感需要双向投入，也涉及更高层面的盟约与勇气。',
    hotspots: [
      { id: 'figures', label: '二人', x: 50, y: 48, meaning: '平等交换、吸引与联结——关系中的互惠。' },
      { id: 'cups', label: '双杯相碰', x: 50, y: 42, meaning: '情感在两人之间流动，需要双向投入。' },
      { id: 'caduceus', label: '双蛇杖', x: 50, y: 28, meaning: '结合、疗愈与更高层面的盟约。' },
      { id: 'lion', label: '狮首', x: 50, y: 18, meaning: '热情与勇气，支撑这段联结。' },
    ],
  },
  {
    cardId: 'cups-three',
    deckId: 'cups-three',
    overview:
      '三位女子在园中举杯欢庆，地上果实累累。友谊与共享喜悦——联结本身即是滋养，不必独自扛。',
    hotspots: [
      { id: 'women', label: '三位女子', x: 50, y: 48, meaning: '庆祝、友谊与共享喜悦——联结带来滋养。' },
      { id: 'cups', label: '举起的杯', x: 50, y: 35, meaning: '情感在群体中流动，不必独自承担。' },
      { id: 'fruit', label: '地上果实', x: 50, y: 78, meaning: '丰收与满足，是此前付出的回响。' },
    ],
  },
  {
    cardId: 'cups-four',
    deckId: 'cups-four',
    overview:
      '青年抱臂坐在树下，眼前三杯未接，云端又递来一杯。牌义详解：不满足、失望、倾向向内收缩或拒绝外部机会——匮乏感常是自己筑起的。稳定在旁，新可能在递来，需先放下防守的双臂。',
    hotspots: [
      { id: 'youth', label: '抱臂青年', x: 50, y: 52, meaning: '倦怠、冷漠或对眼前拥有的视而不见。' },
      { id: 'cups', label: '前三杯', x: 50, y: 68, meaning: '已提供的选项，但你尚未伸手。' },
      { id: 'offered', label: '云端之杯', x: 50, y: 22, meaning: '新的可能正在递来——需先放下双臂。' },
      { id: 'tree', label: '身后树', x: 72, y: 42, meaning: '稳定与安全在旁，却未进入内心。' },
    ],
  },
  {
    cardId: 'cups-five',
    deckId: 'cups-five',
    overview:
      '黑袍人低头看着三只倾倒的杯，身后两杯完好，远桥可见。失落真实，但非全部——转身仍有被保留的资源与出路。',
    hotspots: [
      { id: 'cloak', label: '黑袍人', x: 50, y: 52, meaning: '沉浸在失落里——悲伤真实，但可能遮住其余。' },
      { id: 'spilled', label: '倾倒三杯', x: 50, y: 72, meaning: '已失去的，值得哀悼，但不必反复咀嚼。' },
      { id: 'standing', label: '身后两杯', x: 50, y: 38, meaning: '仍被保留的资源与联结——转身就能看见。' },
      { id: 'bridge', label: '远桥', x: 50, y: 18, meaning: '出路仍在，只是此刻无心去看。' },
    ],
  },
  {
    cardId: 'cups-six',
    deckId: 'cups-six',
    overview:
      '孩童在花园中交换杯中花，远处有守卫与村落。纯真、回忆与旧日温情——过去仍可滋养，但不必沉溺。',
    hotspots: [
      { id: 'children', label: '孩童', x: 50, y: 52, meaning: '纯真、回忆与旧日温情——过去仍在滋养你。' },
      { id: 'cups', label: '杯中花', x: 50, y: 42, meaning: '这些花代表着安全和温暖，但因为是画在杯子上，意味着这是一种被保护的、不真实的温暖——怀旧美好，却不必当成此刻的全部真相。' },
      { id: 'guard', label: '守卫', x: 72, y: 38, meaning: '安全边界内的怀旧，不必沉溺。' },
      { id: 'village', label: '远村', x: 50, y: 82, meaning: '故乡与根源，提醒你从何处来。' },
    ],
  },
  {
    cardId: 'cups-seven',
    deckId: 'cups-seven',
    overview:
      '人影面对云中七杯，杯中各有奇象：城堡、蛇、珍宝……幻想与欲望交织——选项很多，并非每一种都能、都该成真。',
    hotspots: [
      { id: 'figure', label: '做梦者', x: 50, y: 62, meaning: '面对众多幻想与选项——诱惑与想象交织。' },
      { id: 'cups', label: '云中七杯', x: 50, y: 32, meaning: '每个杯子是一种欲望或可能，并非都能成真。' },
      { id: 'snake', label: '蛇', x: 38, y: 28, meaning: '隐藏的诱惑或恐惧，需辨认真实。' },
      { id: 'castle', label: '城堡', x: 62, y: 22, meaning: '幻想中的成就，可能脱离现实。' },
    ],
  },
  {
    cardId: 'cups-eight',
    deckId: 'cups-eight',
    overview:
      '人离开整齐排列的八杯，走向月光下的远山。已有情感满足仍觉不足——直觉指引离开，前路未明却是诚实选择。',
    hotspots: [
      { id: 'walker', label: '离去者', x: 50, y: 52, meaning: '主动离开熟悉——为更深意义而转身。' },
      { id: 'cups', label: '排列八杯', x: 50, y: 68, meaning: '已拥有的情感与满足，但内心仍觉不足。' },
      { id: 'moon', label: '弯月', x: 50, y: 18, meaning: '直觉指引离开，即使旁人未必理解。' },
      { id: 'mountains', label: '远山', x: 50, y: 82, meaning: '前路未明，但离开本身是诚实选择。' },
    ],
  },
  {
    cardId: 'cups-nine',
    deckId: 'cups-nine',
    overview:
      '满足者坐在桌前，身后九杯排列整齐。愿望阶段性达成——丰盛可享受，也要问：下一步真正要什么？',
    hotspots: [
      { id: 'figure', label: '满足者', x: 50, y: 48, meaning: '情感上的满足与自得——愿望阶段性达成。' },
      { id: 'cups', label: '身后九杯', x: 50, y: 68, meaning: '丰盛在身后，但别只停在炫耀。' },
      { id: 'table', label: '蓝布桌', x: 50, y: 58, meaning: '安稳的享受，也需问：下一步要什么？' },
    ],
  },
  {
    cardId: 'cups-ten',
    deckId: 'cups-ten',
    overview:
      '一家在彩虹下相聚，十杯横空，远屋安稳，孩童嬉戏。情感圆满与归属的意象——幸福需要日常维护，根基可向外延伸。',
    hotspots: [
      { id: 'family', label: '一家四口', x: 50, y: 52, meaning: '情感圆满、归属与世代联结——家的意象。' },
      { id: 'rainbow', label: '彩虹十杯', x: 50, y: 22, meaning: '祝福与和谐，情感达到一种完整。' },
      { id: 'home', label: '远屋', x: 50, y: 82, meaning: '根基稳固，可在此扎根也可向外延伸。' },
      { id: 'children', label: '嬉戏孩童', x: 62, y: 58, meaning: '纯真与传承，幸福需要日常维护。' },
    ],
  },
  {
    cardId: 'cups-page',
    deckId: 'cups-page',
    overview:
      '侍从凝视杯中游鱼，身后海浪翻涌。敏感与好奇——心正在打开，潜意识比逻辑更早知道。',
    hotspots: [
      { id: 'youth', label: '侍从', x: 50, y: 48, meaning: '敏感、好奇、情感讯息——心正在打开。' },
      { id: 'cup', label: '手中杯', x: 55, y: 38, meaning: '捧着一份感受，尚不知如何表达。' },
      { id: 'fish', label: '杯中鱼', x: 55, y: 42, meaning: '潜意识浮现——直觉比逻辑更早知道。' },
      { id: 'waves', label: '海浪', x: 50, y: 78, meaning: '情绪起伏正常，学会与波动共处。' },
    ],
  },
  {
    cardId: 'cups-knight',
    deckId: 'cups-knight',
    overview:
      '骑士缓骑马，手捧圣杯，河水蜿蜒。浪漫与追求跟着心走——节奏温柔，仍需耐心走完曲折之路。',
    hotspots: [
      { id: 'knight', label: '骑士', x: 50, y: 45, meaning: '浪漫、追求、情感驱动——跟着心走，但别迷失。' },
      { id: 'horse', label: '缓行白马', x: 50, y: 62, meaning: '节奏温柔，不像权杖骑士那般急躁。' },
      { id: 'cup', label: '手中圣杯', x: 58, y: 32, meaning: '献上情感或邀请——真诚比技巧重要。' },
      { id: 'river', label: '河流', x: 50, y: 82, meaning: '情感之路曲折，需耐心前行。' },
    ],
  },
  {
    cardId: 'cups-queen',
    deckId: 'cups-queen',
    overview:
      '王后坐海边王座，捧雕花圣杯，天使纹饰在上。共情与直觉智慧——温柔而有边界，根基在感受与深度。',
    hotspots: [
      { id: 'queen', label: '王后', x: 50, y: 42, meaning: '共情、直觉与情感智慧——温柔而有边界。' },
      { id: 'cup', label: '雕花圣杯', x: 58, y: 32, meaning: '情感深度与内在丰盛，可滋养他人。' },
      { id: 'throne', label: '海边王座', x: 50, y: 68, meaning: '根基在感受与潜意识，需与水元素共处。' },
      { id: 'angels', label: '杯上天使', x: 58, y: 22, meaning: '灵性层面的守护与更高指引。' },
    ],
  },
  {
    cardId: 'cups-king',
    deckId: 'cups-king',
    overview:
      '国王稳持圣杯，远船航行，鱼从水中跃出。情感成熟与克制——能感受又不被淹没，在波动中掌舵。',
    hotspots: [
      { id: 'king', label: '国王', x: 50, y: 42, meaning: '情感成熟、克制与慈悲——能感受而不被淹没。' },
      { id: 'cup', label: '手中杯', x: 62, y: 48, meaning: '情绪被稳稳托住，可理性表达感受。' },
      { id: 'ship', label: '远船', x: 50, y: 18, meaning: '事业与情感并行，需在波动中掌舵。' },
      { id: 'fish', label: '跃鱼', x: 28, y: 72, meaning: '潜意识与创造力，从深处带来灵感。' },
    ],
  },
];
