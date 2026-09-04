import type { CardReading } from './types.ts';

export type CardArchetypeSlice = {
  theme: string;
  sketch: string;
  questionHook: string;
};

type CardArchetypeDef = {
  cardIds?: string[];
  match?: RegExp;
  upright: CardArchetypeSlice;
  reversed?: CardArchetypeSlice;
};

const MAJOR: CardArchetypeDef[] = [
  {
    cardIds: ['major-0'],
    match: /愚者/,
    upright: {
      theme: '新的开始、冒险',
      sketch: '青年站在崖边望向远方，行囊轻便，能量偏向前行。',
      questionHook: '可能带着冲动或「先走一步再说」的心态。',
    },
    reversed: {
      theme: '逃避、盲目、缺乏规划',
      sketch: '脚步悬空、方向不明——逆位愚者像不顾后果的逃离，或没想清楚就伸手抓一根稻草。',
      questionHook:
        '带有逃避现实的性质：可能面对烂摊子想逃，一时冲动、孤独或想回避责任，而非成熟的长远打算。',
    },
  },
  {
    cardIds: ['major-1'],
    match: /魔术师/,
    upright: {
      theme: '意志、资源整合',
      sketch: '桌上四元素齐备，一手指天一指地——有能力把想法落地。',
      questionHook: '局面里有人（或你自己）正在主动操盘、找办法，而不是坐等。',
    },
    reversed: {
      theme: '才能未发挥、话术大于行动',
      sketch: '道具散落或指向混乱——像有手段却用错方向，或承诺多于兑现。',
      questionHook: '警惕「说得好听」：动机可能夹杂表演、操控或自我欺骗。',
    },
  },
  {
    cardIds: ['major-2'],
    match: /女祭司/,
    upright: {
      theme: '直觉、未说出口的真话',
      sketch: '端坐帘幕后，脚边新月——表面平静，内里知道很多却不说。',
      questionHook: '答案更在感受与潜意识，不在对方嘴上；宜慢下来听直觉。',
    },
    reversed: {
      theme: '直觉被堵、信息不透明',
      sketch: '卷轴半掩、水面浑浊——像故意隐瞒，或你自己不愿面对。',
      questionHook: '可能有信息差：别急着下结论，先弄清「还有什么没说」。',
    },
  },
  {
    cardIds: ['major-3'],
    match: /皇后/,
    upright: {
      theme: '滋养、丰盛、照顾',
      sketch: '麦田与丰饶符号——给予、包容、让事物生长。',
      questionHook: '议题里可能有「谁在被照顾 / 谁在付出」这条线。',
    },
    reversed: {
      theme: '过度付出、创造力枯竭',
      sketch: '丰饶变质为负担——像掏空自己去喂别人。',
      questionHook: '边界模糊：关心可以，但别把自己耗到无力再判断。',
    },
  },
  {
    cardIds: ['major-4'],
    match: /皇帝/,
    upright: {
      theme: '权威、结构、掌控',
      sketch: '石座与权杖——用规则、面子或权力压场。',
      questionHook: '更像在谈「谁说了算、底线在哪」，而不只是情绪。',
    },
    reversed: {
      theme: '失控、僵化或外强中干',
      sketch: '王座动摇——要么霸道失度，要么表面硬撑内里虚。',
      questionHook: '别被气势唬住：看清是真掌控还是虚张声势。',
    },
  },
  {
    cardIds: ['major-5'],
    match: /教皇/,
    upright: {
      theme: '传统、规训、求认同',
      sketch: '仪式与师徒——按「应该怎么做」来，重视面子与规范。',
      questionHook: '可能受家庭/社会期待驱动，而不只是个人意愿。',
    },
    reversed: {
      theme: '打破陈规、质疑权威',
      sketch: '仪式失效——想走自己的路，或反感被说教。',
      questionHook: '在「听话」与「做自己」之间拉扯，别用道德绑架自己。',
    },
  },
  {
    cardIds: ['major-6'],
    match: /恋人/,
    upright: {
      theme: '选择、价值一致、联结',
      sketch: '两人与天使——真心靠近，或面临重要抉择。',
      questionHook: '核心在「选哪边、和谁站一队」，感情与价值绑在一起。',
    },
    reversed: {
      theme: '分歧、犹豫、不同步',
      sketch: '联结断裂或背对——像各怀心思，或逃避选择。',
      questionHook: '别美化暧昧：看清是否价值观真的合得来。',
    },
  },
  {
    cardIds: ['major-7'],
    match: /战车/,
    upright: {
      theme: '推进、胜负心、硬扛',
      sketch: '战车前行、sphinx 对峙——靠意志力冲过去。',
      questionHook: '局面在加速：有人想赢、想尽快出结果。',
    },
    reversed: {
      theme: '方向乱、内耗、刹不住',
      sketch: '战车失控——冲动赶路，或内外分裂拖后腿。',
      questionHook: '先统一「要去哪」，再谈快不快；蛮力可能适得其反。',
    },
  },
  {
    cardIds: ['major-8'],
    match: /力量/,
    upright: {
      theme: '温柔驯服、耐心与勇气',
      sketch: '轻抚狮口——用软力量化解野性，而非硬碰硬。',
      questionHook: '宜以耐心、边界清晰的方式处理，而不是爆发对抗。',
    },
    reversed: {
      theme: '自我怀疑、情绪失控',
      sketch: '狮子反扑或人手退缩——像压不住脾气，或觉得自己不够格。',
      questionHook: '先稳住自己，再谈影响对方；别在耗竭时做决定。',
    },
  },
  {
    cardIds: ['major-9'],
    match: /隐者/,
    upright: {
      theme: '内省、独处、慢下来找答案',
      sketch: '提灯独行——退后一步观察，不急于表态。',
      questionHook: '可能需要信息沉淀期；对方或你自己都在「先想清楚」。',
    },
    reversed: {
      theme: '孤立、拒绝沟通',
      sketch: '灯火过暗——像躲起来，或把别人挡在外面。',
      questionHook: '过度封闭会误判局面；适度开口比一个人扛更准。',
    },
  },
  {
    cardIds: ['major-10'],
    match: /命运之轮/,
    upright: {
      theme: '转折、周期、运气转动',
      sketch: '轮盘升降——局面在变，不全是人力可控。',
      questionHook: '像到了换挡点：顺势比死扛旧剧本重要。',
    },
    reversed: {
      theme: '阻滞、坏循环、拖延转机',
      sketch: '轮子卡住——重复踩坑，或变化被拖迟。',
      questionHook: '别赌「总会好转」：看清是不是在同一圈里转。',
    },
  },
  {
    cardIds: ['major-11'],
    match: /正义/,
    upright: {
      theme: '公平、因果、算账',
      sketch: '天平与剑——讲规则、讲对错，要一个说法。',
      questionHook: '议题里「谁欠谁、是否公平」会被摆到台面。',
    },
    reversed: {
      theme: '偏见、逃避责任、不公',
      sketch: '天平倾斜——可能各执一词，或有人不愿认账。',
      questionHook: '先分清事实与情绪，再谈公道；别用正义感绑架自己。',
    },
  },
  {
    cardIds: ['major-12'],
    match: /倒吊人/,
    upright: {
      theme: '停滞、拖累、被迫等待',
      sketch: '一人倒吊在树上无法动弹——局面卡住，只能被动承受。',
      questionHook:
        '挣扎往往换不来解脱，反而陷入拖延与被动；因果回到身上，要用等待和痛苦来偿还之前的冷漠或逃避。',
    },
    reversed: {
      theme: '挣脱或更深的固执',
      sketch: '逆位倒吊人：要么终于想通，要么更顽固地困在原地。',
      questionHook: '僵局可能持续，别指望别人能替他把账还清。',
    },
  },
  {
    cardIds: ['major-13'],
    match: /死神/,
    upright: {
      theme: '结束、割舍、重生前夜',
      sketch: '白马与旗帜——旧阶段必须落幕，才有新开始。',
      questionHook: '像在说「该放下了」——结束很痛苦，但拖着更耗。',
    },
    reversed: {
      theme: '抗拒改变、死攥过去',
      sketch: '旗帜半落不落——嘴上说翻篇，行动还黏在旧局。',
      questionHook: '承认结束比假装没事更接近真相。',
    },
  },
  {
    cardIds: ['major-14'],
    match: /节制/,
    upright: {
      theme: '调和、耐心、循序渐进',
      sketch: '天使倒水交融——找中间路线，不走极端。',
      questionHook: '宜降温、对齐节奏；一次迈太大步容易翻车。',
    },
    reversed: {
      theme: '失衡、急躁、过量',
      sketch: '水洒出杯外——像情绪或行为过头，调和失败。',
      questionHook: '先止损极端反应，再谈解决方案。',
    },
  },
  {
    cardIds: ['major-15'],
    match: /恶魔/,
    upright: {
      theme: '束缚、欲望、成瘾式纠缠',
      sketch: '锁链松却未脱——被恐惧、利益或习惯拴住。',
      questionHook: '看清「是什么让你离不开」：未必是爱，可能是怕或利。',
    },
    reversed: {
      theme: '觉醒、挣脱枷锁',
      sketch: '锁链断裂——意识到困局，开始抽身。',
      questionHook: '脱身需要行动，别只停在「我知道了」。',
    },
  },
  {
    cardIds: ['major-16'],
    match: /塔/,
    upright: {
      theme: '突变、崩塌、真相砸下',
      sketch: '高塔雷击——伪装维持不住，突发打破幻想。',
      questionHook: '做好「计划外冲击」的心理准备；震后反而更清楚。',
    },
    reversed: {
      theme: '危机延后、暗雷未爆',
      sketch: '塔摇未倒——隐患还在，别因暂时没事就松懈。',
      questionHook: '主动修补比等塌下来省力。',
    },
  },
  {
    cardIds: ['major-17'],
    match: /星星/,
    upright: {
      theme: '希望、疗愈、远期愿景',
      sketch: '星空下倒水——暗夜里的微光，慢慢恢复信任。',
      questionHook: '局面有向好可能，但需要时间，不是一夜翻盘。',
    },
    reversed: {
      theme: '失望、信心不足',
      sketch: '星光黯淡——像被打击后不敢再期待。',
      questionHook: '把希望缩成可验证的一小步，比空喊励志有用。',
    },
  },
  {
    cardIds: ['major-18'],
    match: /月亮/,
    upright: {
      theme: '迷雾、不安、潜意识恐惧',
      sketch: '小径、犬狼、水中月——看不清，容易自己吓自己。',
      questionHook: '多是不确定带来的想象；先核实事实，再放大担忧。',
    },
    reversed: {
      theme: '迷雾散去、真相渐明',
      sketch: '月光变亮——误会减少，直觉更可靠。',
      questionHook: '适合把含糊处问清楚，别在脑内编剧。',
    },
  },
  {
    cardIds: ['major-19'],
    match: /太阳/,
    upright: {
      theme: '明朗、喜悦、事情摊开',
      sketch: '孩童与白马、烈日——能量外放，好坏都较显眼。',
      questionHook: '局面趋向透明；好消息或真相更容易浮出水面。',
    },
    reversed: {
      theme: '快乐打折、乐观过头',
      sketch: '阳光被云挡——表面还行，内里仍有阴影。',
      questionHook: '别因一时顺利忽略未处理的问题。',
    },
  },
  {
    cardIds: ['major-20'],
    match: /审判/,
    upright: {
      theme: '召唤、复盘、做出裁决',
      sketch: '号角与起身的人——到了清算与重启的时刻。',
      questionHook: '像终审：该认的认，该走的走，别拖成长期悬案。',
    },
    reversed: {
      theme: '自我批判、逃避反省',
      sketch: '号角无声——知道该改，却迟迟不动。',
      questionHook: '拖延判决只会让旧账利息更高。',
    },
  },
  {
    cardIds: ['major-21'],
    match: /世界/,
    upright: {
      theme: '完成、整合、阶段圆满',
      sketch: '花环中舞动——一个周期收尾，可以庆祝也可总结。',
      questionHook: '议题接近「告一段落」；问的是如何好好收官。',
    },
    reversed: {
      theme: '未完成、差临门一脚',
      sketch: '花环未闭——快成了，还差关键一步。',
      questionHook: '别在终点前松懈；把最后一块拼图补上。',
    },
  },
];

const NOTABLE_MINORS: CardArchetypeDef[] = [
  {
    cardIds: ['swords-nine'],
    match: /宝剑九|九.*剑/,
    upright: {
      theme: '痛苦、焦虑、内耗',
      sketch: '一人坐在床上捂着脸，背景九把剑——极度的精神压力、噩梦、担忧，像夜里睡不着的那种绷紧。',
      questionHook:
        '往往不是「感情有多深」，而是他正极度焦虑、无助，潜意识里在找一个熟悉、能依赖的「安全港湾」。',
    },
    reversed: {
      theme: '恐惧缓解、仍有余悸',
      sketch: '剑仍在，但人开始抬头——最糟的想象未必会发生。',
      questionHook: '焦虑在退潮，但惯性担忧还在；宜用事实核对想象。',
    },
  },
  {
    cardIds: ['swords-queen'],
    match: /宝剑王后|王后.*剑|剑.*王后/,
    upright: {
      theme: '理智、冷酷、划清界限',
      sketch: '端坐的王后手持利剑，表情冷静甚至锋利——用头脑切断情绪纠缠。',
      questionHook: '过去或平时：要面子、强势，用冷硬态度处理问题，亲手斩断温情也可能。',
    },
    reversed: {
      theme: '尖刻伤人、理性变武器',
      sketch: '剑尖对外——像用道理压人，或情绪被压到反弹。',
      questionHook: '冷静若变成无情，关系只会更脆。',
    },
  },
  {
    cardIds: ['cups-six'],
    match: /圣杯六|六.*杯/,
    upright: {
      theme: '回忆、馈赠、过去的温情',
      sketch: '孩童与花、旧日馈赠——美好的过往与熟悉的人。',
      questionHook: '可能打「回忆牌」，唤起同情或旧情。',
    },
    reversed: {
      theme: '回不去的过去、单方面索取',
      sketch: '逆位圣杯六：温情变质，变成利用旧关系解燃眉之急，而非真心回到从前。',
      questionHook:
        '打破高高在上的姿态来索取帮助，但过去的情感已变质——更像利益交换或单方面的「卖惨」。',
    },
  },
  {
    cardIds: ['cups-three'],
    match: /圣杯三|三.*杯/,
    upright: {
      theme: '庆祝、小圈子、情绪共鸣',
      sketch: '三人举杯——分享、倾诉、短暂放松。',
      questionHook: '可能有倾诉对象或情绪出口，但不等于问题已解决。',
    },
  },
  {
    cardIds: ['pentacles-five'],
    match: /星币五|五.*币/,
    upright: {
      theme: '匮乏感、求助、现实压力',
      sketch: '雪中行人过窗——缺钱、缺支持，或觉得被冷落。',
      questionHook: '现实压力很重；求助可能是真困境，也可能是卖惨。',
    },
  },
  {
    cardIds: ['wands-three'],
    match: /权杖三|三.*杖/,
    upright: {
      theme: '眺望、等待回报、布局',
      sketch: '人望远方船只——已出手，等结果，视野拉长。',
      questionHook: '处于「已行动、待验证」阶段，耐心比再折腾重要。',
    },
    reversed: {
      theme: '等待落空、推不动、进退两难',
      sketch: '远望落空——计划卡住，回报迟迟不来。',
      questionHook:
        '他可能仍在观望或试探，却推不动局面；纠缠未必一夜升级，但也谈不上自己收手。',
    },
  },
  {
    cardIds: ['wands-five'],
    match: /权杖五|五.*杖/,
    upright: {
      theme: '争执、拉扯、各持己见',
      sketch: '几人持杖对峙——吵、抢话语权、互不相让，场面消耗大。',
      questionHook:
        '纠缠的底色是争执与较劲：谁都不肯先松手，不是单方面「认栽」，而是持续拉锯。',
    },
    reversed: {
      theme: '冲突内耗、回避正面交锋',
      sketch: '杖落下或背过身——吵不下去，但气还在，转成冷战或背后较劲。',
      questionHook: '冲突转地下：表面停火，暗里仍耗着你们。',
    },
  },
  {
    cardIds: ['cups-ace'],
    match: /圣杯王牌|王牌.*杯|杯.*王牌/,
    upright: {
      theme: '情感开口、新连接萌芽',
      sketch: '杯中溢出清水——有心软、有新的情感通道。',
      questionHook: '出现情感松动或新连接的可能；是否接住，取决于你的边界。',
    },
    reversed: {
      theme: '情感口子不开、感化无效',
      sketch: '杯口倾覆或受阻——真心流不动，和好式收场的窗口很窄。',
      questionHook:
        '别指望靠感化或「再给一次机会」收场；脱身更像切断情感与资源通道，而不是等他良心发现。',
    },
  },
];

function minorBySuitRank(card: CardReading): CardArchetypeSlice | null {
  const id = card.cardId || card.selectedCardId;
  const m = id.match(
    /^(wands|cups|swords|pentacles)-(ace|two|three|four|five|six|seven|eight|nine|ten|page|knight|queen|king)$/,
  );
  if (!m) return null;
  const [, suit, rank] = m;
  const rev = card.orientation === 'reversed';
  const suitZh =
    suit === 'wands' ? '权杖' : suit === 'cups' ? '圣杯' : suit === 'swords' ? '宝剑' : '星币';
  const suitTheme =
    suit === 'wands'
      ? '行动、热情、冲劲'
      : suit === 'cups'
        ? '情绪、关系、感受'
        : suit === 'swords'
          ? '念头、判断、沟通压力'
          : '资源、现实、身体与钱';
  const rankTheme: Record<string, string> = {
    ace: '新契机',
    two: '选择与平衡',
    three: '成长与表达',
    four: '稳定与休息',
    five: '冲突与挑战',
    six: '回馈与和谐',
    seven: '坚持与考验',
    eight: '快速变化',
    nine: '积累与警觉',
    ten: '圆满与负担',
    page: '探索与学习',
    knight: '追求与冲动',
    queen: '洞察与滋养',
    king: '掌控与成熟',
  };
  const theme = `${suitTheme} · ${rankTheme[rank!] ?? rank}`;
  const sketch = `${suitZh}牌在问「${suitTheme}」层面如何展开。`;
  const questionHook = rev
    ? `逆位时这股${suitTheme}能量受阻或内化，宜先辨认卡点再行动。`
    : `正位时${suitTheme}较外显，可把感受与事实分开看。`;
  return { theme, sketch, questionHook };
}

const ARCHETYPES: CardArchetypeDef[] = [...MAJOR, ...NOTABLE_MINORS];

function pickSlice(def: CardArchetypeDef, reversed: boolean): CardArchetypeSlice {
  if (reversed && def.reversed) return def.reversed;
  return def.upright;
}

/** 按 cardId 优先，再按牌名匹配；其余走小阿卡纳通用模板 */
export function matchCardArchetype(card: CardReading): CardArchetypeSlice | null {
  const rev = card.orientation === 'reversed';
  const ids = [card.cardId, card.selectedCardId].filter(Boolean);

  for (const def of ARCHETYPES) {
    if (def.cardIds?.some((id) => ids.includes(id))) {
      return pickSlice(def, rev);
    }
  }
  for (const def of ARCHETYPES) {
    if (def.match?.test(card.cardName)) {
      return pickSlice(def, rev);
    }
  }
  return minorBySuitRank(card);
}
