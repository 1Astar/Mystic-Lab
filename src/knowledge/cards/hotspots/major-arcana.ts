import type { CardVisualHotspots } from '../../types.ts';

/** Rider-Waite 大阿尔克那牌面热点（22 张） */
export const MAJOR_ARCANA_HOTSPOTS: CardVisualHotspots[] = [
  {
    cardId: 'major-0',
    deckId: 'major-0',
    overview:
      '一个年轻人站在悬崖边，背着行囊望向远方日光，脚边白狗抬头提醒。像一次尚未看清全貌的出发——天真与信任并存，本能也在轻声示警。',
    hotspots: [
      { id: 'cliff', label: '悬崖边', x: 50, y: 78, meaning: '未知的前方——迈出一步前，未必看清全貌。' },
      { id: 'dog', label: '白狗', x: 72, y: 70, meaning: '本能的提醒：天真不等于忽视现实。' },
      { id: 'bundle', label: '行囊', x: 38, y: 55, meaning: '你已携带的经验与行李，不必空手出发。' },
      { id: 'sun', label: '远方日光', x: 50, y: 12, meaning: '尚未抵达的可能，仍在召唤你向前。' },
    ],
  },
  {
    cardId: 'major-1',
    deckId: 'major-1',
    hotspots: [
      { id: 'figure', label: '魔术师', x: 50, y: 42, meaning: '意志集中在一点——你有能力把想法化为行动。' },
      { id: 'wand', label: '权杖', x: 22, y: 18, meaning: '灵感与行动力，已握在手中。' },
      { id: 'cup', label: '圣杯', x: 78, y: 22, meaning: '情感与直觉，也是可调配的资源。' },
      { id: 'sword', label: '宝剑', x: 82, y: 48, meaning: '清晰的判断与沟通，等待被使用。' },
      { id: 'pentacle', label: '星币', x: 18, y: 52, meaning: '物质与机会——想法需要落地。' },
      { id: 'infinity', label: '无限符号', x: 50, y: 14, meaning: '潜能尚未封顶，关键在于专注。' },
    ],
  },
  {
    cardId: 'major-2',
    deckId: 'major-2',
    overview:
      '女祭司端坐黑白双柱之间，膝上放着半遮卷轴，脚边有一弯月亮。答案不在喧嚣的外界，而在你尚未说出口的内在知晓里。',
    hotspots: [
      { id: 'priestess', label: '女祭司', x: 50, y: 45, meaning: '静默的知晓——答案在内在，不在喧嚣里。' },
      { id: 'scroll', label: '卷轴', x: 55, y: 58, meaning: '部分真相仍被遮掩，适合等待而非强推。' },
      { id: 'moon', label: '脚边月亮', x: 50, y: 82, meaning: '直觉与周期，比逻辑更早感知变化。' },
      { id: 'pillars', label: '黑白柱', x: 28, y: 35, meaning: '两极之间的平衡：明与暗、知与未知。' },
    ],
  },
  {
    cardId: 'major-3',
    deckId: 'major-3',
    hotspots: [
      { id: 'empress', label: '皇后', x: 50, y: 42, meaning: '滋养、创造与丰盛——适合培育而非催促。' },
      { id: 'wheat', label: '麦田', x: 50, y: 78, meaning: '成果来自持续照料，不是一夜速成。' },
      { id: 'crown', label: '星冠', x: 50, y: 12, meaning: '自然秩序中的美与丰饶，值得信任。' },
      { id: 'cushion', label: '软垫', x: 50, y: 62, meaning: '舒适与安全感，也是创造力的土壤。' },
    ],
  },
  {
    cardId: 'major-4',
    deckId: 'major-4',
    hotspots: [
      { id: 'emperor', label: '皇帝', x: 50, y: 40, meaning: '结构、边界与决断——混乱时需要框架。' },
      { id: 'throne', label: '石座', x: 50, y: 68, meaning: '稳固来自规则与自律，而非一时冲动。' },
      { id: 'mountains', label: '远山', x: 50, y: 18, meaning: '目标清晰但路途漫长，耐心同样是力量。' },
      { id: 'scepter', label: '权杖', x: 72, y: 38, meaning: '掌控局面的工具——用在哪里，结果就在哪里。' },
    ],
  },
  {
    cardId: 'major-5',
    deckId: 'major-5',
    hotspots: [
      { id: 'hierophant', label: '教皇', x: 50, y: 38, meaning: '传统、信念与传承——可借力，也可审视。' },
      { id: 'keys', label: '交叉钥匙', x: 50, y: 58, meaning: '通往理解的钥匙：一套是规则，一套是内在领悟。' },
      { id: 'acolytes', label: '侍从', x: 32, y: 72, meaning: '学习与归属的需求——你处在什么「体系」里？' },
    ],
  },
  {
    cardId: 'major-6',
    deckId: 'major-6',
    overview:
      '天使在两人头顶见证，一人望向生命之树，一人望向知识之树。联结与选择同时存在——吸引之外，更是价值观是否对齐。',
    hotspots: [
      { id: 'figures', label: '两个人物', x: 50, y: 52, meaning: '联结与选择同时存在，不只有吸引。' },
      { id: 'angel', label: '天使', x: 50, y: 10, meaning: '更高层面的价值见证，提醒对齐真心。' },
      { id: 'tree', label: '生命之树', x: 22, y: 40, meaning: '成长与生命能量的选择。' },
      { id: 'snake', label: '知识之树', x: 78, y: 40, meaning: '诱惑与认知的代价——选择伴随取舍。' },
    ],
  },
  {
    cardId: 'major-7',
    deckId: 'major-7',
    hotspots: [
      { id: 'chariot', label: '战车', x: 50, y: 45, meaning: '意志驱动向前——方向一致时，力量才会汇聚。' },
      { id: 'sphinx', label: '双狮身', x: 38, y: 72, meaning: '内在冲突需先调和：一黑一白，一退一进。' },
      { id: 'canopy', label: '华盖', x: 50, y: 18, meaning: '胜利需要保护也需要边界，不是裸奔向前。' },
      { id: 'city', label: '身后城邦', x: 50, y: 88, meaning: '你已离开的舒适区——前进意味着暂时告别。' },
    ],
  },
  {
    cardId: 'major-8',
    deckId: 'major-8',
    hotspots: [
      { id: 'woman', label: '女子', x: 50, y: 48, meaning: '以温柔驯服野性——力量不必等于压制。' },
      { id: 'lion', label: '狮子', x: 50, y: 68, meaning: '原始冲动与欲望，可被引导而非消灭。' },
      { id: 'infinity', label: '头顶无限', x: 50, y: 22, meaning: '内在力量的循环：信心与耐心相互滋养。' },
    ],
  },
  {
    cardId: 'major-9',
    deckId: 'major-9',
    hotspots: [
      { id: 'hermit', label: '隐者', x: 50, y: 42, meaning: '独处不是为了逃避，而是为了听见自己。' },
      { id: 'lantern', label: '灯笼', x: 58, y: 28, meaning: '微光只照亮下一步——不必要求全盘看清。' },
      { id: 'staff', label: '手杖', x: 42, y: 55, meaning: '经验与支持，陪你走过内在的长路。' },
      { id: 'peak', label: '山巅', x: 50, y: 82, meaning: '高处孤独，但视野也因此不同。' },
    ],
  },
  {
    cardId: 'major-10',
    deckId: 'major-10',
    hotspots: [
      { id: 'wheel', label: '命运之轮', x: 50, y: 45, meaning: '周期转动——起落是常态，关键是你如何站位。' },
      { id: 'sphinx', label: 'sphinx', x: 50, y: 28, meaning: '谜题仍在：变化中保持觉察，比预测更重要。' },
      { id: 'snake', label: '下降之蛇', x: 28, y: 52, meaning: '旧势力退场，不必紧抓已过的阶段。' },
      { id: 'anubis', label: '上升之犬', x: 72, y: 52, meaning: '新机会正在升起，但需要你去迎接。' },
    ],
  },
  {
    cardId: 'major-11',
    deckId: 'major-11',
    hotspots: [
      { id: 'justice', label: '正义', x: 50, y: 40, meaning: '公平、因果与诚实——对自己也对他人。' },
      { id: 'scales', label: '天平', x: 50, y: 58, meaning: '权衡两端：事实、感受、责任，哪边被忽略了？' },
      { id: 'sword', label: '宝剑', x: 50, y: 22, meaning: '真相可能锋利，但拖延不会让问题消失。' },
    ],
  },
  {
    cardId: 'major-12',
    deckId: 'major-12',
    hotspots: [
      { id: 'figure', label: '倒吊人', x: 50, y: 42, meaning: '暂停与换位思考——有时放手比硬推更有效。' },
      { id: 'halo', label: '头后光环', x: 50, y: 28, meaning: '牺牲或等待中，也可能获得新的领悟。' },
      { id: 'tree', label: '生命之树', x: 50, y: 12, meaning: '被挂住的不是失败，而是旧视角。' },
    ],
  },
  {
    cardId: 'major-13',
    deckId: 'major-13',
    hotspots: [
      { id: 'skeleton', label: '骷髅骑士', x: 50, y: 38, meaning: '结束与转化——旧章落幕，为新生命腾出空间。' },
      { id: 'flag', label: '白旗', x: 62, y: 22, meaning: '纯白象征净化，结束也可以是干净的。' },
      { id: 'people', label: '众人', x: 50, y: 72, meaning: '变化影响所有人——没人能完全置身事外。' },
      { id: 'sun', label: '双塔与太阳', x: 50, y: 12, meaning: '远方仍有光——结束不等于绝望。' },
    ],
  },
  {
    cardId: 'major-14',
    deckId: 'major-14',
    hotspots: [
      { id: 'angel', label: '天使', x: 50, y: 22, meaning: '调和者出现——极端之间，还有第三条路。' },
      { id: 'cups', label: '双杯', x: 50, y: 52, meaning: '流动与混合：把不同元素慢慢调成平衡。' },
      { id: 'path', label: '小径', x: 50, y: 82, meaning: '疗愈是过程，不是一次到位的答案。' },
      { id: 'foot', label: '一脚一水', x: 42, y: 68, meaning: '一只脚踏在现实，一只仍触探内在——两者都需要。' },
    ],
  },
  {
    cardId: 'major-15',
    deckId: 'major-15',
    hotspots: [
      { id: 'devil', label: '恶魔', x: 50, y: 28, meaning: '欲望、执念与无形束缚——觉察什么在控制你。' },
      { id: 'chains', label: '锁链', x: 38, y: 58, meaning: '枷锁看似坚固，其实松垮——你有松绑的空间。' },
      { id: 'couple', label: '被缚二人', x: 50, y: 62, meaning: '共陷的模式：习惯、依赖或恐惧绑在一起。' },
      { id: 'torch', label: '倒火炬', x: 62, y: 48, meaning: '被颠倒的欲望——越压抑，越可能在暗处反扑。' },
    ],
  },
  {
    cardId: 'major-16',
    deckId: 'major-16',
    overview:
      '闪电击中高塔，王冠坠落，两人从塔上跌下。旧结构、旧信念被强制震塌——痛苦，但也在逼你放下不再真实的依靠。',
    hotspots: [
      { id: 'lightning', label: '闪电', x: 50, y: 8, meaning: '突发的真相与强制觉醒。' },
      { id: 'tower', label: '高塔', x: 50, y: 42, meaning: '旧结构、旧信念——不再真实的依靠。' },
      { id: 'falling', label: '坠落的人', x: 50, y: 72, meaning: '被迫放下伪装，痛苦但解放。' },
      { id: 'crown', label: '坠落王冠', x: 42, y: 58, meaning: '失效的权威与头衔，不再定义你。' },
    ],
  },
  {
    cardId: 'major-17',
    deckId: 'major-17',
    overview:
      '裸身人物跪在水边，一手倒水入池、一手倒入河，头顶八星环绕一大星。像疗愈与希望重新流动——不是暴富，是慢慢恢复信任与方向。',
    hotspots: [
      { id: 'big_star', label: '大星', x: 52, y: 18, meaning: '远方的指引——希望与精神层面的照亮。' },
      { id: 'figure', label: '裸身人物', x: 50, y: 55, meaning: '坦诚、脆弱、卸下防御后的真实。' },
      { id: 'water', label: '水流', x: 50, y: 72, meaning: '情绪流动与疗愈，把能量重新倒回生活。' },
      { id: 'land', label: '陆地', x: 50, y: 88, meaning: '现实层面的恢复与扎根。' },
    ],
  },
  {
    cardId: 'major-18',
    deckId: 'major-18',
    overview:
      '一轮满月悬在双塔之间，脚下小路蜿蜒，狗与狼对月长啸，水中浮出小龙虾。迷雾未散——真相尚在潜意识深处，直觉比匆忙结论更可靠。',
    hotspots: [
      { id: 'moon', label: '月亮', x: 50, y: 14, meaning: '潜意识、周期与尚未说清的真相。' },
      { id: 'path', label: '小路', x: 50, y: 68, meaning: '在迷雾中仍要前行，但别急着下结论。' },
      { id: 'dog_wolf', label: '狗与狼', x: 35, y: 58, meaning: '驯服的本能与野性的恐惧并存。' },
      { id: 'crayfish', label: '小龙虾', x: 50, y: 82, meaning: '从深处浮现的情绪与旧有模式。' },
    ],
  },
  {
    cardId: 'major-19',
    deckId: 'major-19',
    hotspots: [
      { id: 'sun', label: '太阳', x: 50, y: 14, meaning: '清晰、喜悦与生命力——阴霾暂退，真相可见。' },
      { id: 'child', label: '骑马孩童', x: 50, y: 52, meaning: '天真与自信回归，不必过度防御。' },
      { id: 'sunflowers', label: '向日葵', x: 50, y: 78, meaning: '自然地向光生长——方向对了，能量就会回来。' },
      { id: 'wall', label: '矮墙', x: 50, y: 88, meaning: '保护仍在，但不再封闭——开放而有边界。' },
    ],
  },
  {
    cardId: 'major-20',
    deckId: 'major-20',
    hotspots: [
      { id: 'angel', label: '天使', x: 50, y: 12, meaning: '召唤与觉醒——听见内心更高层面的声音。' },
      { id: 'trumpet', label: '号角', x: 50, y: 28, meaning: '不能再假装没听见——该回应的召唤已到。' },
      { id: 'figures', label: '升起的人', x: 50, y: 68, meaning: '从旧我中站起，整合过往，选择重生。' },
      { id: 'cross', label: '旗帜十字', x: 50, y: 55, meaning: '价值与信念的重新对齐。' },
    ],
  },
  {
    cardId: 'major-21',
    deckId: 'major-21',
    hotspots: [
      { id: 'dancer', label: '舞者', x: 50, y: 48, meaning: '整合与完成——旅程的一个阶段圆满收束。' },
      { id: 'wreath', label: '花环', x: 50, y: 22, meaning: '保护圈仍在，但你已学会在其中自由移动。' },
      { id: 'corners', label: '四角落符号', x: 18, y: 18, meaning: '四元素齐备——身心灵与物质世界达成平衡。' },
      { id: 'wands', label: '双杖', x: 50, y: 62, meaning: '主动与被动、阴阳两股力量在舞动中合一。' },
    ],
  },
];
