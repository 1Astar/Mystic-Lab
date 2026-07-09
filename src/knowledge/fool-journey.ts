/** 愚人之旅：大阿尔克那 22 张成长叙事 */

export type JourneyMapStep = {
  order: number;
  deckId: string;
  nameCn: string;
  title: string;
  theme: string;
  symbolism?: string;
  lifeStage?: string;
  /** 占问里常见的生活场景，用于「你可能会在…遇见它」 */
  encounterWhen?: string;
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

const JOURNEY_EXTRA: Record<string, Pick<JourneyMapStep, 'symbolism' | 'lifeStage'>> = {
  'major-0': {
    symbolism: '悬崖边的行囊、白狗与朝阳——轻装上阵，信任未知。',
    lifeStage: '人生新章、转行、毕业、第一次独自出发。',
  },
  'major-1': {
    symbolism: '桌上四元素工具、一手指天一指地——「如其在上，如其在下」，资源已在手中。',
    lifeStage: '开始动手、展现才华、把想法变成可见成果。',
  },
  'major-2': {
    symbolism: '月亮帷幕、石榴与经书——有些答案藏在静默与直觉里。',
    lifeStage: '学习倾听内心、等待时机、不急于用理性填满一切。',
  },
  'major-3': {
    symbolism: '丰饶田野、金星符号——孕育、滋养、感受生命丰盛。',
    lifeStage: '照顾关系与身体、创意开花、学习爱与被爱的能力。',
  },
  'major-4': {
    symbolism: '石座、权杖与羊头——秩序、边界、为世界建立结构。',
    lifeStage: '承担责任、制定规则、在混乱中建立稳定框架。',
  },
  'major-5': {
    symbolism: '宗教殿堂、钥匙与信徒——传统、教导与信念系统。',
    lifeStage: '寻找导师、融入制度、确认自己相信什么。',
  },
  'major-6': {
    symbolism: '天使、亚当夏娃与两棵树——价值对齐的选择与吸引。',
    lifeStage: '重要抉择、关系承诺、在心动与原则之间对齐真心。',
  },
  'major-7': {
    symbolism: '战车、双狮身与星冠——以意志驾驭对立力量，向前推进。',
    lifeStage: '竞争、冲刺目标、克服障碍但须先调和内在冲突。',
  },
  'major-8': {
    symbolism: '少女轻抚狮口、无限符号——温柔驯服野性，非靠蛮力。',
    lifeStage: '以耐心与同理面对恐惧或冲动，重建内在勇气。',
  },
  'major-9': {
    symbolism: '灯笼里的六芒星、雪山独行——在独处中举着内在之光。',
    lifeStage: '退后一步、深度内省、寻找下一盏指路明灯。',
  },
  'major-10': {
    symbolism: '四角落符号与转动的轮——起落周期，无人能永远停在顶端。',
    lifeStage: '运势转折、接受变化、在顺境与逆境中保持站位。',
  },
  'major-11': {
    symbolism: '天平、宝剑与直视的双目——因果、公平与不可回避的真相。',
    lifeStage: '面对后果、诚实权衡、法律或道德层面的决断。',
  },
  'major-12': {
    symbolism: '倒吊人、光环与平静面容——暂停换视角，牺牲换来领悟。',
    lifeStage: '主动等待、放手控制、在停滞里看见被忽略的答案。',
  },
  'major-13': {
    symbolism: '白马、王旗与日出——旧章落幕，结束为新生腾出空间。',
    lifeStage: '告别、转型、放下不再服务的身份或关系。',
  },
  'major-14': {
    symbolism: '天使倒水调和两杯——在极端之间找第三条路，耐心混合。',
    lifeStage: '疗愈、戒断极端、学习中庸与长期调和。',
  },
  'major-15': {
    symbolism: '锁链、火炬与倒五角星——欲望与执念的枷锁，往往比想象中松。',
    lifeStage: '觉察成瘾、控制欲或有毒依附，辨认什么在暗中操控你。',
  },
  'major-16': {
    symbolism: '雷击高塔、坠落的人与王冠——虚假结构崩塌，真相震耳欲聋。',
    lifeStage: '突发变故、信念崩塌、痛但必要的觉醒时刻。',
  },
  'major-17': {
    symbolism: '八芒星、倒水少女与远方水光——黑暗后重新相信微光。',
    lifeStage: '疗愈、恢复、在低谷后慢慢重建希望与信任。',
  },
  'major-18': {
    symbolism: '双塔、犬狼与水中龙虾——迷雾、恐惧与潜意识涌动。',
    lifeStage: '困惑期、梦境与直觉混杂，不宜在模糊中急于定论。',
  },
  'major-19': {
    symbolism: '巨日、向日葵与赤裸孩童——喜悦、清晰与生命力回归。',
    lifeStage: '成功可见、自信绽放、阴霾暂退值得被庆祝。',
  },
  'major-20': {
    symbolism: '天使号角、复活的人群——听见召唤，复盘过往，做出觉醒抉择。',
    lifeStage: '人生复盘、第二次机会、回应内心真正的召唤。',
  },
  'major-21': {
    symbolism: '花环舞者、四角落符号——一周期圆满整合，新的循环即将展开。',
    lifeStage: '阶段完成、毕业、项目收官、带着整合感进入下一圈。',
  },
};

for (const chapter of FOOL_JOURNEY_CHAPTERS) {
  for (const step of chapter.steps) {
    const extra = JOURNEY_EXTRA[step.deckId];
    if (extra) {
      step.symbolism = extra.symbolism;
      step.lifeStage = extra.lifeStage;
    } else {
      step.symbolism = step.theme;
      step.lifeStage = '成长旅程中的一站，对照你此刻的人生议题。';
    }
  }
}

export function getJourneyChapterForStep(deckId: string): JourneyMapChapter | undefined {
  return FOOL_JOURNEY_CHAPTERS.find((ch) => ch.steps.some((s) => s.deckId === deckId));
}

export function getJourneyStep(deckId: string): JourneyMapStep | undefined {
  return FOOL_JOURNEY_STEPS.find((s) => s.deckId === deckId);
}

export function getNextJourneyStep(deckId: string): JourneyMapStep | undefined {
  const idx = FOOL_JOURNEY_STEPS.findIndex((s) => s.deckId === deckId);
  if (idx < 0 || idx >= FOOL_JOURNEY_STEPS.length - 1) return undefined;
  return FOOL_JOURNEY_STEPS[idx + 1];
}

export { MINOR_ARCANA_BRIEF } from './minor-structure.ts';
