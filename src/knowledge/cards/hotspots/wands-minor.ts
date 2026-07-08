import type { CardVisualHotspots } from '../../types.ts';

/** 权杖组牌面热点（14 张） */
export const WANDS_MINOR_HOTSPOTS: CardVisualHotspots[] = [
  {
    cardId: 'wands-ace',
    deckId: 'wands-ace',
    hotspots: [
      { id: 'hand', label: '云端之手', x: 50, y: 28, meaning: '灵感从更高处递来——一股新生的行动力正在等你接住。' },
      { id: 'wand', label: '权杖', x: 50, y: 48, meaning: '火种、热情与创造冲动——适合启动，而非空想。' },
      { id: 'leaves', label: '新叶', x: 50, y: 38, meaning: '潜力正在萌发，但需要土壤与时间。' },
      { id: 'castle', label: '远城', x: 50, y: 82, meaning: '目标在远方，第一步是点燃自己。' },
    ],
  },
  {
    cardId: 'wands-two',
    deckId: 'wands-two',
    hotspots: [
      { id: 'figure', label: '持杖者', x: 50, y: 48, meaning: '站在高点眺望——规划与视野，但尚未行动。' },
      { id: 'globe', label: '手中地球', x: 62, y: 42, meaning: '世界在手中，选择比冲动更重要。' },
      { id: 'wand_held', label: '手中权杖', x: 45, y: 55, meaning: '已握住的资源与方向，下一步是落地。' },
      { id: 'ships', label: '远海船队', x: 50, y: 78, meaning: '机会已在路上，耐心与布局同样关键。' },
    ],
  },
  {
    cardId: 'wands-three',
    deckId: 'wands-three',
    hotspots: [
      { id: 'figure', label: '眺望者', x: 50, y: 42, meaning: '等待回报的阶段——前期投入开始显现迹象。' },
      { id: 'wands', label: '三根权杖', x: 50, y: 68, meaning: '已建立的根基，支撑你看得更远。' },
      { id: 'ships', label: '归来船只', x: 50, y: 82, meaning: '努力即将有回音，但抵达仍需时间。' },
    ],
  },
  {
    cardId: 'wands-four',
    deckId: 'wands-four',
    hotspots: [
      { id: 'figure', label: '举花者', x: 50, y: 52, meaning: '庆祝阶段性成果——值得停下来认可自己。' },
      { id: 'canopy', label: '花棚', x: 50, y: 28, meaning: '暂时的安稳与庇护，但不是终点。' },
      { id: 'wands', label: '四根权杖', x: 50, y: 72, meaning: '稳固的结构已立起，可在此休整再出发。' },
      { id: 'castle', label: '远城', x: 50, y: 12, meaning: '更大的世界仍在召唤，别困在舒适区。' },
    ],
  },
  {
    cardId: 'wands-five',
    deckId: 'wands-five',
    hotspots: [
      { id: 'youths', label: '五人争持', x: 50, y: 48, meaning: '竞争、摩擦与各自立场——混乱中仍有活力。' },
      { id: 'wands', label: '交错权杖', x: 50, y: 38, meaning: '冲突未必是坏事，可能是方向磨合。' },
      { id: 'sky', label: '晴云', x: 50, y: 15, meaning: '局面虽乱，但无毁灭性——更多是较劲。' },
    ],
  },
  {
    cardId: 'wands-six',
    deckId: 'wands-six',
    hotspots: [
      { id: 'rider', label: '凯旋者', x: 50, y: 42, meaning: '被看见、被认可——阶段性胜利值得承认。' },
      { id: 'wreath', label: '桂冠', x: 50, y: 22, meaning: '荣誉与公众认可，但别让它变成唯一动力。' },
      { id: 'crowd', label: '跟随者', x: 50, y: 72, meaning: '影响力在扩大，责任也随之而来。' },
    ],
  },
  {
    cardId: 'wands-seven',
    deckId: 'wands-seven',
    hotspots: [
      { id: 'defender', label: '守势者', x: 50, y: 48, meaning: '以少敌多仍坚守——立场需要捍卫。' },
      { id: 'wand', label: '手中权杖', x: 55, y: 35, meaning: '你的优势在高度与决心，不在数量。' },
      { id: 'wands_below', label: '下方权杖', x: 50, y: 78, meaning: '压力来自多方，但未必都能伤到你。' },
    ],
  },
  {
    cardId: 'wands-eight',
    deckId: 'wands-eight',
    hotspots: [
      { id: 'wands', label: '飞行权杖', x: 50, y: 42, meaning: '事态加速推进——消息、行动或变化来得很快。' },
      { id: 'land', label: '下方田野', x: 50, y: 82, meaning: '落地在即，准备好接住这波动能。' },
      { id: 'sky', label: '晴空', x: 50, y: 18, meaning: '方向清晰，阻力相对小——顺势而为。' },
    ],
  },
  {
    cardId: 'wands-nine',
    deckId: 'wands-nine',
    hotspots: [
      { id: 'wounded', label: '带伤守者', x: 50, y: 48, meaning: '疲惫但仍未放弃——韧性比完美更重要。' },
      { id: 'bandage', label: '头上绷带', x: 50, y: 28, meaning: '过去的战斗留下痕迹，也换来经验。' },
      { id: 'wands', label: '身后八杖', x: 50, y: 72, meaning: '防线仍在，但资源已消耗不少。' },
    ],
  },
  {
    cardId: 'wands-ten',
    deckId: 'wands-ten',
    hotspots: [
      { id: 'burden', label: '负杖者', x: 50, y: 52, meaning: '责任过重——是否什么都自己扛？' },
      { id: 'wands', label: '十根权杖', x: 50, y: 32, meaning: '负担来自累积，未必每一项都必要。' },
      { id: 'destination', label: '远方房屋', x: 50, y: 82, meaning: '终点不远，但需先学会分担或放下。' },
    ],
  },
  {
    cardId: 'wands-page',
    deckId: 'wands-page',
    hotspots: [
      { id: 'youth', label: '侍从', x: 50, y: 48, meaning: '好奇、探索、新消息——热情正在成形。' },
      { id: 'wand', label: '举起的权杖', x: 58, y: 28, meaning: '跃跃欲试，但经验尚浅，需实践验证。' },
      { id: 'desert', label: '荒漠', x: 50, y: 78, meaning: '环境未必成熟，火种需自己守护。' },
    ],
  },
  {
    cardId: 'wands-knight',
    deckId: 'wands-knight',
    hotspots: [
      { id: 'knight', label: '骑士', x: 50, y: 45, meaning: '急速冲锋——行动力强，但可能忽略细节。' },
      { id: 'horse', label: '奔马', x: 50, y: 62, meaning: '冲劲是资源，失控则是风险。' },
      { id: 'wand', label: '高举权杖', x: 50, y: 22, meaning: '目标明确、态度热烈——问：你要烧向哪里？' },
      { id: 'pyramids', label: '远金字塔', x: 50, y: 12, meaning: '远方有成就，但路途需要耐心。' },
    ],
  },
  {
    cardId: 'wands-queen',
    deckId: 'wands-queen',
    hotspots: [
      { id: 'queen', label: '王后', x: 50, y: 42, meaning: '自信、温暖、有感染力——热情而不莽撞。' },
      { id: 'wand', label: '向日葵权杖', x: 58, y: 32, meaning: '生命力向外绽放，也照亮他人。' },
      { id: 'cat', label: '黑猫', x: 28, y: 72, meaning: '直觉与独立——热情中保留神秘与边界。' },
      { id: 'lions', label: '狮首雕饰', x: 72, y: 68, meaning: '力量与保护，王座由意志支撑。' },
    ],
  },
  {
    cardId: 'wands-king',
    deckId: 'wands-king',
    hotspots: [
      { id: 'king', label: '国王', x: 50, y: 42, meaning: '远见、领导力与成熟热情——能点燃也能掌舵。' },
      { id: 'wand', label: '权杖', x: 62, y: 55, meaning: '权力用于推动愿景，而非炫耀。' },
      { id: 'salamander', label: '蜥蜴纹', x: 50, y: 68, meaning: '火元素循环——创造与毁灭同在，需节制。' },
      { id: 'lions', label: '狮与火纹', x: 38, y: 72, meaning: '稳固与野性并存，真正的力量有根基。' },
    ],
  },
];
