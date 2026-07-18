import { TRIGRAMS, type TrigramId, trigramFromBits } from './trigrams.ts';

export type LineBit = 0 | 1;

export interface Hexagram {
  /** 文王卦序 1–64 */
  kingWen: number;
  /** 卦名，如 革 */
  name: string;
  /** 全称，如 泽火革 */
  fullName: string;
  upper: TrigramId;
  lower: TrigramId;
  keywords: string[];
  /** 一句话象意（现代） */
  gist: string;
  /** 世爻位：1=初 … 6=上 */
  shiLine: 1 | 2 | 3 | 4 | 5 | 6;
}

/** 八宫世爻：宫内序 → 世位 */
const PALACE_SHI: Array<1 | 2 | 3 | 4 | 5 | 6> = [6, 1, 2, 3, 4, 5, 4, 3];

type PalaceRow = [string, string, string, string, string, string, string, string];

/** 八宫：本宫 → 一世… → 游魂 → 归魂（卦名） */
const PALACES: PalaceRow[] = [
  ['乾', '姤', '遁', '否', '观', '剥', '晋', '大有'],
  ['兑', '困', '萃', '咸', '蹇', '谦', '小过', '归妹'],
  ['离', '旅', '鼎', '未济', '蒙', '涣', '讼', '同人'],
  ['震', '豫', '解', '恒', '升', '井', '大过', '随'],
  ['巽', '小畜', '家人', '益', '无妄', '噬嗑', '颐', '蛊'],
  ['坎', '节', '屯', '既济', '革', '丰', '明夷', '师'],
  ['艮', '贲', '大畜', '损', '睽', '履', '中孚', '渐'],
  ['坤', '复', '临', '泰', '大壮', '夬', '需', '比'],
];

const SHI_BY_NAME = new Map<string, 1 | 2 | 3 | 4 | 5 | 6>();
const PALACE_BY_NAME = new Map<string, TrigramId>();
for (const palace of PALACES) {
  const palaceId = palace[0] as TrigramId;
  palace.forEach((name, i) => {
    SHI_BY_NAME.set(name, PALACE_SHI[i]!);
    PALACE_BY_NAME.set(name, palaceId);
  });
}

/** 八宫本宫（纳甲六亲用） */
export function palaceOfHexagram(name: string): TrigramId | undefined {
  return PALACE_BY_NAME.get(name);
}

/** 文王序：卦名 → 序号；上下卦用二进制键 */
const KING_WEN: Array<{
  kingWen: number;
  name: string;
  upper: TrigramId;
  lower: TrigramId;
  keywords: string[];
  gist: string;
}> = [
  { kingWen: 1, name: '乾', upper: '乾', lower: '乾', keywords: ['开创', '刚健', '持续'], gist: '力量充沛，适合主动推进，也要留意过度刚强。' },
  { kingWen: 2, name: '坤', upper: '坤', lower: '坤', keywords: ['承载', '接纳', '厚德'], gist: '宜守宜承，先稳住根基，再谈扩张。' },
  { kingWen: 3, name: '屯', upper: '坎', lower: '震', keywords: ['起步', '艰难', '蓄势'], gist: '事情刚萌芽，阻力在所难免，宜耐心布局。' },
  { kingWen: 4, name: '蒙', upper: '艮', lower: '坎', keywords: ['启蒙', '求教', '模糊'], gist: '信息尚不清晰，适合学习与请教，不宜急断。' },
  { kingWen: 5, name: '需', upper: '坎', lower: '乾', keywords: ['等待', '时机', '准备'], gist: '条件未齐，先准备与等待，比硬冲更有利。' },
  { kingWen: 6, name: '讼', upper: '乾', lower: '坎', keywords: ['争议', '边界', '沟通'], gist: '存在分歧，宜厘清边界与证据，避免意气之争。' },
  { kingWen: 7, name: '师', upper: '坤', lower: '坎', keywords: ['组织', '纪律', '众人'], gist: '需借众人之力，但要有明确目标与秩序。' },
  { kingWen: 8, name: '比', upper: '坎', lower: '坤', keywords: ['亲近', '联合', '归附'], gist: '适合结盟与靠近可靠之人，诚信是前提。' },
  { kingWen: 9, name: '小畜', upper: '巽', lower: '乾', keywords: ['积蓄', '小成', '节制'], gist: '力量在积蓄中，宜小步前进，勿一次求大。' },
  { kingWen: 10, name: '履', upper: '乾', lower: '兑', keywords: ['践行', '谨慎', '分寸'], gist: '走在边界上，礼貌与分寸比速度更重要。' },
  { kingWen: 11, name: '泰', upper: '坤', lower: '乾', keywords: ['通达', '调和', '畅通'], gist: '上下沟通顺畅，适合推进合作与整合。' },
  { kingWen: 12, name: '否', upper: '乾', lower: '坤', keywords: ['闭塞', '隔阂', '守成'], gist: '通道暂时不畅，宜守不宜攻，等格局再开。' },
  { kingWen: 13, name: '同人', upper: '乾', lower: '离', keywords: ['同盟', '公开', '共识'], gist: '适合找同路人，公开透明比私下算计更有利。' },
  { kingWen: 14, name: '大有', upper: '离', lower: '乾', keywords: ['丰盛', '拥有', '担当'], gist: '资源在手，关键是如何分配与承担责任。' },
  { kingWen: 15, name: '谦', upper: '坤', lower: '艮', keywords: ['谦逊', '务实', '收敛'], gist: '放低姿态反而更能推进，虚张声势无益。' },
  { kingWen: 16, name: '豫', upper: '震', lower: '坤', keywords: ['愉悦', '响应', '预备'], gist: '氛围积极，可动员他人，也防乐极生懈。' },
  { kingWen: 17, name: '随', upper: '兑', lower: '震', keywords: ['跟随', '适应', '择时'], gist: '宜顺势而为，跟随正确方向比坚持旧路线重要。' },
  { kingWen: 18, name: '蛊', upper: '艮', lower: '巽', keywords: ['整治', '纠偏', '修复'], gist: '旧弊需清理，适合整顿、复盘与修复关系。' },
  { kingWen: 19, name: '临', upper: '坤', lower: '兑', keywords: ['临近', '督导', '接近'], gist: '机会在靠近，可主动靠近现场与关键人。' },
  { kingWen: 20, name: '观', upper: '巽', lower: '坤', keywords: ['观察', '审视', '榜样'], gist: '先看清格局与示范，再决定是否介入。' },
  { kingWen: 21, name: '噬嗑', upper: '离', lower: '震', keywords: ['决断', '咬合', '清除'], gist: '障碍需咬断，适合明确决断与清除阻碍。' },
  { kingWen: 22, name: '贲', upper: '艮', lower: '离', keywords: ['文饰', '表达', '形象'], gist: '形式与表达很重要，但别只剩表面光鲜。' },
  { kingWen: 23, name: '剥', upper: '艮', lower: '坤', keywords: ['剥落', '消退', '止损'], gist: '旧结构在剥落，宜止损与收缩，勿硬撑。' },
  { kingWen: 24, name: '复', upper: '坤', lower: '震', keywords: ['归来', '重启', '回头'], gist: '转机初现，适合从根本处重新开始。' },
  { kingWen: 25, name: '无妄', upper: '乾', lower: '震', keywords: ['真诚', '意外', '本分'], gist: '守本分、少妄动；意外事件需冷静应对。' },
  { kingWen: 26, name: '大畜', upper: '艮', lower: '乾', keywords: ['积蓄', '涵养', '节制'], gist: '大力积蓄能量与能力，暂缓全面释放。' },
  { kingWen: 27, name: '颐', upper: '艮', lower: '震', keywords: ['养育', '言语', '自养'], gist: '关注滋养：身体、学习与言辞的节制。' },
  { kingWen: 28, name: '大过', upper: '兑', lower: '巽', keywords: ['过重', '非常', '承压'], gist: '负荷偏重，需非常手段或重新分配压力。' },
  { kingWen: 29, name: '坎', upper: '坎', lower: '坎', keywords: ['险陷', '流动', '诚信'], gist: '身处险境，靠诚信与持续流动渡过，勿慌乱。' },
  { kingWen: 30, name: '离', upper: '离', lower: '离', keywords: ['依附', '明亮', '文明'], gist: '依附正确的光明方向，保持清晰与可见。' },
  { kingWen: 31, name: '咸', upper: '兑', lower: '艮', keywords: ['感应', '互动', '共鸣'], gist: '双方有感应，关键在真诚互动而非强迫。' },
  { kingWen: 32, name: '恒', upper: '震', lower: '巽', keywords: ['持久', '稳定', '长期'], gist: '宜建立可长期坚持的节奏，忌朝令夕改。' },
  { kingWen: 33, name: '遁', upper: '乾', lower: '艮', keywords: ['退避', '抽身', '保全'], gist: '适时抽身保全力量，不是失败而是策略。' },
  { kingWen: 34, name: '大壮', upper: '震', lower: '乾', keywords: ['强盛', '进取', '节制'], gist: '力量正盛，可进取，但过刚易折。' },
  { kingWen: 35, name: '晋', upper: '离', lower: '坤', keywords: ['晋升', '前进', '显露'], gist: '向上显露的阶段，适合被看见与被认可。' },
  { kingWen: 36, name: '明夷', upper: '坤', lower: '离', keywords: ['含光', '韬晦', '忍耐'], gist: '光明受抑，宜韬光养晦，保护核心价值。' },
  { kingWen: 37, name: '家人', upper: '巽', lower: '离', keywords: ['家庭', '秩序', '内圈'], gist: '先理顺内圈关系与分工，再向外扩展。' },
  { kingWen: 38, name: '睽', upper: '离', lower: '兑', keywords: ['背离', '差异', '求同'], gist: '立场有差异，宜求小同存大异，勿硬合。' },
  { kingWen: 39, name: '蹇', upper: '坎', lower: '艮', keywords: ['阻滞', '艰难', '求助'], gist: '前路阻滞，宜暂停硬闯，寻求外援与路径。' },
  { kingWen: 40, name: '解', upper: '震', lower: '坎', keywords: ['缓解', '解开', '释放'], gist: '困局开始松动，适合化解与放下。' },
  { kingWen: 41, name: '损', upper: '艮', lower: '兑', keywords: ['减损', '取舍', '精简'], gist: '有所减损才能前进，主动取舍比被动失去好。' },
  { kingWen: 42, name: '益', upper: '巽', lower: '震', keywords: ['增益', '助益', '投入'], gist: '适合投入与助人，增益会回流到自身。' },
  { kingWen: 43, name: '夬', upper: '兑', lower: '乾', keywords: ['决断', '突破', '公开'], gist: '到了决断时刻，宜公开、明确，忌拖泥带水。' },
  { kingWen: 44, name: '姤', upper: '乾', lower: '巽', keywords: ['邂逅', '意外', '警惕'], gist: '不期而遇的因素出现，宜警惕其后续影响。' },
  { kingWen: 45, name: '萃', upper: '兑', lower: '坤', keywords: ['聚集', '汇合', '号召'], gist: '人与资源在聚集，适合号召与整合。' },
  { kingWen: 46, name: '升', upper: '坤', lower: '巽', keywords: ['上升', '积累', '渐进'], gist: '循序上升，靠积累而非跳跃。' },
  { kingWen: 47, name: '困', upper: '兑', lower: '坎', keywords: ['困顿', '受限', '言辞'], gist: '资源或表达受限，先稳住再找出口。' },
  { kingWen: 48, name: '井', upper: '坎', lower: '巽', keywords: ['滋养', '共享', '修缮'], gist: '修好自己的井，持续滋养他人也滋养自己。' },
  { kingWen: 49, name: '革', upper: '兑', lower: '离', keywords: ['变革', '更新', '打破'], gist: '旧方式正在被打破，变革已在进行中。' },
  { kingWen: 50, name: '鼎', upper: '离', lower: '巽', keywords: ['重器', '革新', '承载'], gist: '新秩序在成形，适合承载新角色与责任。' },
  { kingWen: 51, name: '震', upper: '震', lower: '震', keywords: ['震动', '警醒', '行动'], gist: '突发震动带来警醒，宜迅速调整姿态。' },
  { kingWen: 52, name: '艮', upper: '艮', lower: '艮', keywords: ['止住', '边界', '静止'], gist: '该停则停，守住边界比继续推进更重要。' },
  { kingWen: 53, name: '渐', upper: '巽', lower: '艮', keywords: ['渐进', '有序', '成长'], gist: '循序渐进的成长，急不得也停不得。' },
  { kingWen: 54, name: '归妹', upper: '震', lower: '兑', keywords: ['从属', '关系', '不当'], gist: '关系位置需审慎，避免勉强结合。' },
  { kingWen: 55, name: '丰', upper: '震', lower: '离', keywords: ['丰盛', '盛大', '高峰'], gist: '处于高峰期，珍惜并规划高峰之后的路径。' },
  { kingWen: 56, name: '旅', upper: '离', lower: '艮', keywords: ['旅途', '客居', '短暂'], gist: '暂时的客居状态，灵活适应，勿强求扎根。' },
  { kingWen: 57, name: '巽', upper: '巽', lower: '巽', keywords: ['柔入', '渗透', '反复'], gist: '以柔顺方式渗入，反复沟通比一次硬推有效。' },
  { kingWen: 58, name: '兑', upper: '兑', lower: '兑', keywords: ['悦谈', '交流', '开口'], gist: '适合开口交流与表达愉悦，也防言多。' },
  { kingWen: 59, name: '涣', upper: '巽', lower: '坎', keywords: ['涣散', '消融', '疏通'], gist: '僵局在消融，适合疏通情绪与信息。' },
  { kingWen: 60, name: '节', upper: '坎', lower: '兑', keywords: ['节制', '限度', '规则'], gist: '建立限度与规则，节制带来可持续。' },
  { kingWen: 61, name: '中孚', upper: '巽', lower: '兑', keywords: ['诚信', '感应', '内心'], gist: '以内心诚信打动外界，虚饰无效。' },
  { kingWen: 62, name: '小过', upper: '震', lower: '艮', keywords: ['小过', '谨慎', '细节'], gist: '宜从小处谨慎修正，大事不宜冒进。' },
  { kingWen: 63, name: '既济', upper: '坎', lower: '离', keywords: ['完成', '过渡', '守成'], gist: '阶段完成，但需防满溢，开始下一程准备。' },
  { kingWen: 64, name: '未济', upper: '离', lower: '坎', keywords: ['未完成', '过渡', '潜力'], gist: '尚未完成，仍有空间，关键在继续推进的方法。' },
];

function fullNameOf(upper: TrigramId, lower: TrigramId, name: string): string {
  if (upper === lower) return `${upper}为${TRIGRAMS[upper].nature === '天' ? '天' : TRIGRAMS[upper].nature}`;
  // 纯卦特例
  if (name === '乾') return '乾为天';
  if (name === '坤') return '坤为地';
  if (name === '坎') return '坎为水';
  if (name === '离') return '离为火';
  if (name === '震') return '震为雷';
  if (name === '艮') return '艮为山';
  if (name === '巽') return '巽为风';
  if (name === '兑') return '兑为泽';
  return `${TRIGRAMS[upper].nature}${TRIGRAMS[lower].nature}${name}`;
}

export const HEXAGRAMS: Hexagram[] = KING_WEN.map((row) => ({
  ...row,
  fullName: fullNameOf(row.upper, row.lower, row.name),
  shiLine: SHI_BY_NAME.get(row.name) ?? 3,
}));

const BY_BITS = new Map<string, Hexagram>();
const BY_KING = new Map<number, Hexagram>();

for (const h of HEXAGRAMS) {
  const lower = TRIGRAMS[h.lower].bits;
  const upper = TRIGRAMS[h.upper].bits;
  const key = [...lower, ...upper].join('');
  BY_BITS.set(key, h);
  BY_KING.set(h.kingWen, h);
}

export function hexagramFromLines(lines: LineBit[]): Hexagram {
  if (lines.length !== 6) throw new Error('需要六爻');
  const key = lines.join('');
  const found = BY_BITS.get(key);
  if (!found) throw new Error(`未知卦象: ${key}`);
  return found;
}

export function hexagramByKingWen(n: number): Hexagram | undefined {
  return BY_KING.get(n);
}

export function linesFromHexagram(h: Hexagram): LineBit[] {
  return [...TRIGRAMS[h.lower].bits, ...TRIGRAMS[h.upper].bits];
}

export function upperLowerFromLines(lines: LineBit[]): { upper: ReturnType<typeof trigramFromBits>; lower: ReturnType<typeof trigramFromBits> } {
  return {
    lower: trigramFromBits([lines[0]!, lines[1]!, lines[2]!]),
    upper: trigramFromBits([lines[3]!, lines[4]!, lines[5]!]),
  };
}

export function yingLineOf(shi: 1 | 2 | 3 | 4 | 5 | 6): 1 | 2 | 3 | 4 | 5 | 6 {
  return ((((shi - 1 + 3) % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6);
}

export const LINE_LABELS = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'] as const;
