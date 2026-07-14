import type { CardVisualHotspots } from '../../types.ts';

/** 星币组牌面热点（14 张） */
export const PENTACLES_MINOR_HOTSPOTS: CardVisualHotspots[] = [
  {
    cardId: 'pentacles-ace',
    deckId: 'pentacles-ace',
    overview:
      '云端之手托着一枚大星币，下方花园与小径展开。务实新机会从高处递来——种子需要土壤与时间，急不得。',
    hotspots: [
      { id: 'hand', label: '云端之手', x: 50, y: 28, meaning: '务实的新机会或资源——从高处递到手中。' },
      { id: 'coin', label: '星币', x: 50, y: 48, meaning: '物质、金钱或身体层面的新起点，值得培育。' },
      { id: 'garden', label: '下方花园', x: 50, y: 78, meaning: '种子需要土壤与时间，急不得。' },
      { id: 'path', label: '小径', x: 50, y: 68, meaning: '通往丰盛的路已铺开，第一步是接住。' },
    ],
  },
  {
    cardId: 'pentacles-two',
    deckId: 'pentacles-two',
    overview:
      '青年在海边杂耍双币，无限带相连，远船起伏。多任务与取舍——在波动中找节奏，外在再动也要稳住重心。',
    hotspots: [
      { id: 'juggler', label: '杂耍者', x: 50, y: 48, meaning: '多任务、平衡与灵活——在波动中保持节奏。' },
      { id: 'coins', label: '双币', x: 50, y: 38, meaning: '资源有限，需取舍与优先级。' },
      { id: 'infinity', label: '无限带', x: 50, y: 28, meaning: '循环往复的日常，熟练后可游刃有余。' },
      { id: 'ships', label: '远海船', x: 50, y: 82, meaning: '外在世界仍在变动，内心需稳住重心。' },
    ],
  },
  {
    cardId: 'pentacles-three',
    deckId: 'pentacles-three',
    overview:
      '工匠、持图者与僧侣同看教堂工程。技能、协作与意义并置——质量来自细节，长期工程靠分段完成。',
    hotspots: [
      { id: 'craftsman', label: '工匠', x: 50, y: 52, meaning: '技能、协作与打磨——质量来自细节。' },
      { id: 'architect', label: '持图者', x: 28, y: 42, meaning: '规划与设计，蓝图需要人手实现。' },
      { id: 'monk', label: '僧侣', x: 72, y: 42, meaning: '精神或价值层面的认可，工作亦有意义。' },
      { id: 'cathedral', label: '教堂', x: 50, y: 22, meaning: '长期工程，阶段性成果值得肯定。' },
    ],
  },
  {
    cardId: 'pentacles-four',
    deckId: 'pentacles-four',
    overview:
      '一个人坐在城镇边缘，紧紧抱着自己的金币，头顶、胸前、脚下都被金币占据。他拥有资源，但也被资源困住——想守住安全感，却因为太害怕失去，身体和心都不太流动。',
    hotspots: [
      { id: 'head_coin', label: '头顶星币', x: 50, y: 22, meaning: '脑子里一直想着安全、资源、结果。' },
      { id: 'chest_coin', label: '胸前星币', x: 50, y: 42, meaning: '把重要东西抱得很紧，不太愿意冒险。' },
      { id: 'feet_coins', label: '脚下双币', x: 50, y: 72, meaning: '站稳了，但也被固定在原地。' },
      { id: 'city', label: '背后城市', x: 50, y: 12, meaning: '现实世界、机会、资源场，但你和它之间有距离。' },
    ],
  },
  {
    cardId: 'pentacles-five',
    deckId: 'pentacles-five',
    overview:
      '风雪中两人蹒跚走过教堂彩窗，窗外光暖。匮乏与孤立真实——帮助可能近在咫尺，需抬头看见与求助。',
    hotspots: [
      { id: 'poor', label: '雪中二人', x: 50, y: 55, meaning: '匮乏、孤立或健康/资源上的困境——需要支持。' },
      { id: 'crutches', label: '拐杖', x: 42, y: 62, meaning: '身体或现实层面的限制，值得正视。' },
      { id: 'window', label: '彩窗', x: 50, y: 32, meaning: '帮助近在身旁——教堂/社群资源，需抬头看见。' },
      { id: 'snow', label: '风雪', x: 50, y: 15, meaning: '环境严酷，但严冬不会永远持续。' },
    ],
  },
  {
    cardId: 'pentacles-six',
    deckId: 'pentacles-six',
    overview:
      '富人手持天平向跪地者分发星币。给予、衡量与公平——施与受是健康循环，分配也包括善待自己。',
    hotspots: [
      { id: 'merchant', label: '施予者', x: 50, y: 42, meaning: '给予、衡量与公平——施与受的平衡。' },
      { id: 'scales', label: '天平', x: 50, y: 32, meaning: '资源分配需公正，也包括对自己。' },
      { id: 'beggars', label: '跪地二人', x: 50, y: 68, meaning: '接受帮助不可耻，互惠是健康循环。' },
      { id: 'coins', label: '落下星币', x: 50, y: 55, meaning: '流动中的财富，囤积不如善用。' },
    ],
  },
  {
    cardId: 'pentacles-seven',
    deckId: 'pentacles-seven',
    overview:
      '农夫倚锄凝视藤上六枚星币，一枚尚在手中。投入已发生，收成在路上——评估阶段：继续、调整，或耐心再等一季。',
    hotspots: [
      { id: 'farmer', label: '农夫', x: 50, y: 52, meaning: '耐心等待收成——投入已发生，结果在路上。' },
      { id: 'vine', label: '星币藤', x: 50, y: 38, meaning: '一颗一颗结出的果实，成长可见但缓慢。' },
      { id: 'lean', label: '倚杖', x: 55, y: 48, meaning: '评估阶段：是否继续？是否调整？' },
    ],
  },
  {
    cardId: 'pentacles-eight',
    deckId: 'pentacles-eight',
    overview:
      '学徒伏案打磨，墙上挂满星币成品，远镇可见。专注与重复——熟能生巧，质量来自日常纪律多于灵感爆发。',
    hotspots: [
      { id: 'apprentice', label: '学徒', x: 50, y: 48, meaning: '专注、重复、打磨技艺——熟能生巧。' },
      { id: 'coins', label: '墙上星币', x: 50, y: 32, meaning: '每一件作品都是累积，质量来自细节。' },
      { id: 'bench', label: '工作台', x: 50, y: 68, meaning: '日常纪律，比灵感爆发更可靠。' },
      { id: 'town', label: '远镇', x: 50, y: 82, meaning: '技艺可换生存，也可换认可。' },
    ],
  },
  {
    cardId: 'pentacles-nine',
    deckId: 'pentacles-nine',
    overview:
      '女子立于葡萄园，手套上栖猎鹰，蜗牛缓爬。自足地享受劳动成果——独立而丰盛，节奏可由自己定义。',
    hotspots: [
      { id: 'lady', label: '园中女子', x: 50, y: 48, meaning: '自足、享受劳动成果——独立而丰盛。' },
      { id: 'falcon', label: '手套猎鹰', x: 62, y: 38, meaning: '掌控与优雅，资源在握但不张扬。' },
      { id: 'vine', label: '葡萄藤', x: 50, y: 68, meaning: '长期培育的回报，值得慢慢品尝。' },
      { id: 'snail', label: '蜗牛', x: 28, y: 72, meaning: '慢即是快——节奏由自己定义。' },
    ],
  },
  {
    cardId: 'pentacles-ten',
    deckId: 'pentacles-ten',
    overview:
      '家族在拱门与十币纹下相聚，长者、家人与犬。长期积累与传承——物质安全需要情感一起维护。',
    hotspots: [
      { id: 'patriarch', label: '长者', x: 50, y: 42, meaning: '家族、传承与长期积累——财富跨越世代。' },
      { id: 'family', label: '家人与犬', x: 50, y: 62, meaning: '物质安全与归属，也需情感维护。' },
      { id: 'arch', label: '拱门十币', x: 50, y: 22, meaning: '结构稳固，遗产与规则并存。' },
      { id: 'city', label: '远城', x: 50, y: 82, meaning: '根基深厚，可守也可再投资。' },
    ],
  },
  {
    cardId: 'pentacles-page',
    deckId: 'pentacles-page',
    overview:
      '侍从蹲身端详手中星币，田野与远山铺开。学习与务实探索的开始——潜力在脚下，每一步都算数。',
    hotspots: [
      { id: 'youth', label: '侍从', x: 50, y: 48, meaning: '学习、好奇、新机会——务实探索的开始。' },
      { id: 'coin', label: '手中星币', x: 58, y: 42, meaning: '仔细端详资源，培养珍惜与辨识力。' },
      { id: 'field', label: '田野', x: 50, y: 78, meaning: '潜力在脚下，需弯腰耕耘。' },
      { id: 'mountains', label: '远山', x: 50, y: 15, meaning: '目标遥远，但每一步都算数。' },
    ],
  },
  {
    cardId: 'pentacles-knight',
    deckId: 'pentacles-knight',
    overview:
      '骑士缓行黑马，专注手中星币，脚下是犁过的地。稳健勤勉、慢但可靠——耐力比爆发更能换来收成。',
    hotspots: [
      { id: 'knight', label: '骑士', x: 50, y: 45, meaning: '稳健、勤勉、按部就班——慢但可靠。' },
      { id: 'horse', label: '黑马', x: 50, y: 62, meaning: '不炫耀的速度，耐力比爆发重要。' },
      { id: 'coin', label: '手中星币', x: 58, y: 32, meaning: '专注眼前资源，一步一步积累。' },
      { id: 'plowed', label: '犁过的地', x: 50, y: 82, meaning: '已耕种的田野，收成取决于持续照料。' },
    ],
  },
  {
    cardId: 'pentacles-queen',
    deckId: 'pentacles-queen',
    overview:
      '王后坐玫瑰园，怀中星币，脚边有兔。务实滋养与身体智慧——丰盛且接地气，生活可被精心打理。',
    hotspots: [
      { id: 'queen', label: '王后', x: 50, y: 42, meaning: '务实、滋养、身体与智慧——丰盛且接地气。' },
      { id: 'coin', label: '怀中星币', x: 50, y: 55, meaning: '珍惜资源，也懂得享受劳动成果。' },
      { id: 'rabbit', label: '脚边兔', x: 28, y: 72, meaning: '丰饶、繁衍与自然循环。' },
      { id: 'garden', label: '玫瑰园', x: 50, y: 78, meaning: '美与实用并存，生活可被精心打理。' },
    ],
  },
  {
    cardId: 'pentacles-king',
    deckId: 'pentacles-king',
    overview:
      '国王端坐握币，袍饰牛首与葡萄。物质成功与商业头脑——能建也能守，财富是工具，用法定义格局。',
    hotspots: [
      { id: 'king', label: '国王', x: 50, y: 42, meaning: '物质成功、稳定与商业头脑——能建也能守。' },
      { id: 'coin', label: '手中星币', x: 62, y: 48, meaning: '财富是工具，如何使用定义格局。' },
      { id: 'bull', label: '牛首雕饰', x: 38, y: 68, meaning: '固执与力量——稳定也可能变僵化。' },
      { id: 'vine', label: '葡萄与袍', x: 50, y: 72, meaning: '丰收在身，享受但别停止生长。' },
    ],
  },
];
