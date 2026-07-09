/** 愚人之旅：大阿尔克那 22 张成长叙事 */

export type JourneyMapStep = {
  order: number;
  deckId: string;
  nameCn: string;
  title: string;
  theme: string;
};

export type JourneyMapChapter = {
  id: string;
  title: string;
  subtitle: string;
  steps: JourneyMapStep[];
};

export const FOOL_JOURNEY_INTRO = {
  title: '愚人之旅',
  subtitle:
    '大阿尔克那不是 22 张孤立的牌，而是一段人从出发、迷路、受伤、醒来，到重新完整的旅程。',
  lead: '许多读者会把 0 号愚者到 21 号世界串成一条路。你在占问里抽到的大阿卡那，也常落在这条成长线上的某一站。',
};

export const FOOL_JOURNEY_CHAPTERS: JourneyMapChapter[] = [
  {
    id: 'departure',
    title: '第一章 · 出发与成形',
    subtitle: '从天真启程，到学会运用能力、听见直觉、建立秩序与选择',
    steps: [
      {
        order: 0,
        deckId: 'major-0',
        nameCn: '愚者',
        title: '出发',
        theme: '带着天真和未知走上旅途，尚未被恐惧定义。',
      },
      {
        order: 1,
        deckId: 'major-1',
        nameCn: '魔术师',
        title: '创造',
        theme: '发现自己有能力把想法化为行动，资源已在手中。',
      },
      {
        order: 2,
        deckId: 'major-2',
        nameCn: '女祭司',
        title: '直觉',
        theme: '学会在喧嚣之外听见内在的声音，有些答案需要等待。',
      },
      {
        order: 3,
        deckId: 'major-3',
        nameCn: '皇后',
        title: '滋养',
        theme: '感受丰盛与创造力，学习照料关系、身体与梦想。',
      },
      {
        order: 4,
        deckId: 'major-4',
        nameCn: '皇帝',
        title: '秩序',
        theme: '建立规则、边界与结构，用理性稳住脚下的世界。',
      },
      {
        order: 5,
        deckId: 'major-5',
        nameCn: '教皇',
        title: '信念',
        theme: '承接传统、教导与信念系统，向外的指引与向内的认同。',
      },
      {
        order: 6,
        deckId: 'major-6',
        nameCn: '恋人',
        title: '选择',
        theme: '在关系与价值之间做判断，吸引之外更是对齐真心。',
      },
      {
        order: 7,
        deckId: 'major-7',
        nameCn: '战车',
        title: '前进',
        theme: '以意志驱动方向，克服障碍，但须先调和内在冲突。',
      },
    ],
  },
  {
    id: 'inward',
    title: '第二章 · 向内修炼',
    subtitle: '温柔的力量与独处中的智慧',
    steps: [
      {
        order: 8,
        deckId: 'major-8',
        nameCn: '力量',
        title: '驯服',
        theme: '以耐心与温柔驾驭野性，真正的勇气不必靠压制。',
      },
      {
        order: 9,
        deckId: 'major-9',
        nameCn: '隐者',
        title: '内省',
        theme: '暂时退出喧嚣，在独处里寻找下一盏灯。',
      },
    ],
  },
  {
    id: 'change',
    title: '第三章 · 变化与代价',
    subtitle: '接受命运转动、因果公平，以及必要的暂停',
    steps: [
      {
        order: 10,
        deckId: 'major-10',
        nameCn: '命运之轮',
        title: '周期',
        theme: '起落是常态，关键是在转动中保持觉察与站位。',
      },
      {
        order: 11,
        deckId: 'major-11',
        nameCn: '正义',
        title: '公平',
        theme: '面对因果与真相，诚实权衡，不回避责任。',
      },
      {
        order: 12,
        deckId: 'major-12',
        nameCn: '倒吊人',
        title: '暂停',
        theme: '有时放手与等待，比硬推更能换来新视角。',
      },
    ],
  },
  {
    id: 'transformation',
    title: '第四章 · 转化与震塌',
    subtitle: '旧我死去、欲望浮现、虚假结构崩塌',
    steps: [
      {
        order: 13,
        deckId: 'major-13',
        nameCn: '死神',
        title: '结束',
        theme: '旧章落幕，为新生腾出空间，结束可以是干净的。',
      },
      {
        order: 14,
        deckId: 'major-14',
        nameCn: '节制',
        title: '调和',
        theme: '在极端之间找第三条路，耐心混合不同元素。',
      },
      {
        order: 15,
        deckId: 'major-15',
        nameCn: '恶魔',
        title: '束缚',
        theme: '觉察欲望、执念与无形枷锁，锁链往往比想象中松。',
      },
      {
        order: 16,
        deckId: 'major-16',
        nameCn: '高塔',
        title: '崩塌',
        theme: '突发的真相震塌旧结构，痛，但不再真实的依靠必须放下。',
      },
    ],
  },
  {
    id: 'awakening',
    title: '第五章 · 疗愈与完成',
    subtitle: '穿越迷雾，被照亮，听见召唤，走完这一圈',
    steps: [
      {
        order: 17,
        deckId: 'major-17',
        nameCn: '星星',
        title: '希望',
        theme: '黑暗之后重新相信微光，疗愈是缓慢流动的过程。',
      },
      {
        order: 18,
        deckId: 'major-18',
        nameCn: '月亮',
        title: '迷雾',
        theme: '潜意识与恐惧交织，别在模糊中急于下结论。',
      },
      {
        order: 19,
        deckId: 'major-19',
        nameCn: '太阳',
        title: '照亮',
        theme: '喜悦、清晰与生命力回归，阴霾暂退，值得被看见。',
      },
      {
        order: 20,
        deckId: 'major-20',
        nameCn: '审判',
        title: '觉醒',
        theme: '听见内心召唤，复盘过往，做出符合真我的抉择。',
      },
      {
        order: 21,
        deckId: 'major-21',
        nameCn: '世界',
        title: '完成',
        theme: '一周期圆满整合，庆祝已走的路，新的循环即将展开。',
      },
    ],
  },
];

export const FOOL_JOURNEY_STEPS: JourneyMapStep[] = FOOL_JOURNEY_CHAPTERS.flatMap(
  (ch) => ch.steps,
);

/** 小阿尔克那速览（第一版简要，后续可扩展） */
export const MINOR_ARCANA_BRIEF = {
  title: '小阿尔克那怎么看',
  lead: '牌组代表领域，数字代表阶段。不必逐张背，先抓住这两层线索。',
  suits: [
    { key: 'wands', label: '权杖', theme: '行动、热情、创造力' },
    { key: 'cups', label: '圣杯', theme: '情绪、关系、爱与感受' },
    { key: 'swords', label: '宝剑', theme: '思考、冲突、判断、语言' },
    { key: 'pentacles', label: '星币', theme: '现实、金钱、身体、工作、资源' },
  ],
  numbers: [
    { num: '1', label: '王牌', theme: '新开始、种子' },
    { num: '2', label: '二', theme: '选择、对照、平衡' },
    { num: '3', label: '三', theme: '发展、表达、成长' },
    { num: '4', label: '四', theme: '稳定、结构、休息' },
    { num: '5', label: '五', theme: '冲突、挑战、摩擦' },
    { num: '6', label: '六', theme: '调整、回馈、过渡' },
    { num: '7', label: '七', theme: '试炼、坚持、考验' },
    { num: '8', label: '八', theme: '推进、变化、加速' },
    { num: '9', label: '九', theme: '临近完成、积累、警觉' },
    { num: '10', label: '十', theme: '阶段结果、圆满或负担' },
  ],
};
