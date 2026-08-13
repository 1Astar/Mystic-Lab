/**
 * 古典格局名录（图鉴全表）。
 * formationRule=catalog：只供查阅与释义；严判成格另挂专规后再改 rule。
 */
import type { ComboLore, ComboTone } from './combo-lore.ts';

type GeDraft = {
  id: string;
  title: string;
  oneLiner: string;
  members: string[];
  keywords?: string[];
  tone?: ComboTone;
  vibe?: string;
  strength?: string;
  shadow?: string;
  howToPlay?: string;
  mutagenNote?: string;
};

function ge(p: GeDraft): ComboLore {
  return {
    family: 'classic-ge',
    rank: 'strong',
    formationRule: 'catalog',
    tone: p.tone ?? 'ji',
    keywords: p.keywords ?? p.members.slice(0, 4),
    vibe: p.vibe ?? p.oneLiner,
    strength: p.strength ?? '成格时，相关议题更容易展开；仍要看庙旺与煞忌。',
    shadow: p.shadow ?? '未成格或带煞忌时，勿当铁律；流派条件常更细。',
    howToPlay: p.howToPlay ?? '先对照本命盘成员落宫，再查是否满足成格专规。',
    mutagenNote: p.mutagenNote ?? '遇四化再论深浅；本条为名录释义，不自动判成格。',
    id: p.id,
    title: p.title,
    oneLiner: p.oneLiner,
    members: p.members,
  };
}

/** 与 combo-lore 中已挂专规的 id 去重后合并 */
export const CLASSIC_GE_CATALOG: ComboLore[] = [
  // —— 帝府将相 ——
  ge({
    id: '紫府同宫',
    title: '紫府同宫格',
    oneLiner: '紫微与天府同宫——帝库同驻，场面与家底叠在一起。',
    members: ['紫微', '天府'],
    keywords: ['紫微', '天府', '同宫', '帝库'],
  }),
  ge({
    id: '君臣庆会',
    title: '君臣庆会格',
    oneLiner: '紫府坐命，再得辅弼魁钺等拱照——君臣同朝、贵气会聚。',
    members: ['紫微', '天府', '左辅', '右弼', '天魁', '天钺'],
    keywords: ['君臣', '紫府', '辅弼', '魁钺'],
  }),
  ge({
    id: '府相朝垣',
    title: '府相朝垣格',
    oneLiner: '天府、天相朝会命垣——库藏与礼法拱卫中宫。',
    members: ['天府', '天相'],
    keywords: ['天府', '天相', '朝垣'],
  }),
  ge({
    id: '紫相朝垣',
    title: '紫相朝垣格',
    oneLiner: '紫微、天相拱照命垣——名位与体面同朝。',
    members: ['紫微', '天相'],
  }),
  ge({
    id: '七杀朝斗',
    title: '七杀朝斗格',
    oneLiner: '七杀得地朝拱——将星有用，开创力能收束成事业。',
    members: ['七杀'],
    keywords: ['七杀', '朝斗', '将星'],
  }),
  ge({
    id: '雄宿朝垣',
    title: '雄宿朝垣格',
    oneLiner: '廉贞、破军等雄宿得位朝垣——魄力与改革气足。',
    members: ['廉贞', '破军'],
    keywords: ['廉贞', '破军', '朝垣'],
  }),

  // —— 机月同梁 / 杀破狼 ——
  ge({
    id: '机月同梁格',
    title: '机月同梁格',
    oneLiner: '天机、太阴、天同、天梁会照——文职、策略、协调型成格。',
    members: ['天机', '太阴', '天同', '天梁'],
    keywords: ['机月同梁', '文职', '策略'],
  }),
  ge({
    id: '杀破狼格',
    title: '杀破狼格',
    oneLiner: '七杀、破军、贪狼会照——开创、变动、冲劲成格。',
    members: ['七杀', '破军', '贪狼'],
    keywords: ['杀破狼', '开创', '变动'],
  }),
  ge({
    id: '贪武同行',
    title: '贪武同行格',
    oneLiner: '贪狼与武曲同行——欲望与财技同线，偏生意与交际。',
    members: ['贪狼', '武曲'],
  }),

  // —— 文贵辅佐 ——
  ge({
    id: '文星暗拱',
    title: '文星暗拱格',
    oneLiner: '昌曲不在命而拱照命宫——文气暗扶，功名仍可得。',
    members: ['文昌', '文曲'],
    keywords: ['文星', '暗拱', '功名'],
  }),
  ge({
    id: '昌曲夹命',
    title: '昌曲夹命格',
    oneLiner: '文昌、文曲夹命——文才夹辅中宫，利考试表达。',
    members: ['文昌', '文曲'],
  }),
  ge({
    id: '昌曲同宫',
    title: '昌曲同宫格',
    oneLiner: '昌曲同宫——文华汇聚一处，才气更浓。',
    members: ['文昌', '文曲'],
  }),
  ge({
    id: '左右夹命',
    title: '左右夹命格',
    oneLiner: '左辅、右弼夹命——贵人夹辅，容错与成全力高。',
    members: ['左辅', '右弼'],
  }),
  ge({
    id: '左右同宫',
    title: '左右同宫格',
    oneLiner: '辅弼同宫——帮手叠力，协作戏份重。',
    members: ['左辅', '右弼'],
  }),
  ge({
    id: '魁钺拱命',
    title: '魁钺拱命格',
    oneLiner: '天魁、天钺拱照命宫——天乙贵人气，机遇与体面。',
    members: ['天魁', '天钺'],
  }),
  ge({
    id: '魁钺夹命',
    title: '魁钺夹命格',
    oneLiner: '魁钺夹命——贵气夹身，场合提携更显。',
    members: ['天魁', '天钺'],
  }),
  ge({
    id: '天乙拱命',
    title: '天乙拱命格',
    oneLiner: '天乙贵人（魁钺）拱命——贵人题更响。',
    members: ['天魁', '天钺'],
    keywords: ['天乙', '贵人', '拱命'],
  }),
  ge({
    id: '坐贵向贵',
    title: '坐贵向贵格',
    oneLiner: '身坐贵、又向贵——进出都遇体面提携。',
    members: ['天魁', '天钺'],
  }),
  ge({
    id: '廉贞文星',
    title: '廉贞文星格',
    oneLiner: '廉贞会昌曲——刚柔文气，偏法务、文书、外交。',
    members: ['廉贞', '文昌', '文曲'],
  }),
  ge({
    id: '天同逢贵',
    title: '天同逢贵格',
    oneLiner: '天同遇魁钺等贵——福力被贵人托起。',
    members: ['天同', '天魁', '天钺'],
  }),

  // —— 日月明堂 ——
  ge({
    id: '日月夹命',
    title: '日月夹命格',
    oneLiner: '太阳、太阴夹命——明暗夹辅，人格张力与光彩并存。',
    members: ['太阳', '太阴'],
  }),
  ge({
    id: '明珠出海',
    title: '明珠出海格',
    oneLiner: '日月得地如珠出海——少年光彩、外场易亮。',
    members: ['太阳', '太阴'],
    keywords: ['明珠', '出海', '日月'],
  }),
  ge({
    id: '巨日同宫',
    title: '巨日同宫格',
    oneLiner: '巨门与太阳同宫——口才与曝光同线，善辩也易口舌。',
    members: ['巨门', '太阳'],
  }),
  ge({
    id: '极向离明',
    title: '极向离明格',
    oneLiner: '紫微在午等向明之位——帝星向阳，声望易扬。',
    members: ['紫微'],
    keywords: ['极向离明', '紫微', '午'],
  }),
  ge({
    id: '金灿光辉',
    title: '金灿光辉格',
    oneLiner: '太阳庙旺得位——光明正大、外场声望强。',
    members: ['太阳'],
  }),
  ge({
    id: '月朗天门',
    title: '月朗天门格',
    oneLiner: '太阴得地清朗——内在蓄能与人缘细润。',
    members: ['太阴'],
  }),
  ge({
    id: '太阴得水',
    title: '太阴得水格',
    oneLiner: '太阴坐水旺之地——情感与财荫更润。',
    members: ['太阴'],
  }),
  ge({
    id: '日月反背',
    title: '日月反背格',
    oneLiner: '日月落陷或背驰——内外难同亮，需主动调和。',
    members: ['太阳', '太阴'],
    tone: 'xiong',
  }),

  // —— 禄马财权 ——
  ge({
    id: '三奇嘉会',
    title: '三奇嘉会格',
    oneLiner: '化禄、化权、化科同会——三奇嘉会，名利科名同题。',
    members: ['化禄', '化权', '化科'],
    keywords: ['三奇', '禄权科'],
  }),
  ge({
    id: '权禄巡逢',
    title: '权禄巡逢格',
    oneLiner: '化权与化禄交逢——权柄与财禄同线。',
    members: ['化权', '化禄'],
  }),
  ge({
    id: '科权禄夹',
    title: '科权禄夹格',
    oneLiner: '科权禄夹辅——名声、权柄、财禄夹成势。',
    members: ['化科', '化权', '化禄'],
  }),
  ge({
    id: '双禄交流',
    title: '双禄交流格',
    oneLiner: '禄存与化禄交会——双禄流动，财源更活。',
    members: ['禄存', '化禄'],
  }),
  ge({
    id: '禄马交驰',
    title: '禄马交驰格',
    oneLiner: '禄与天马交驰——动中有禄，利奔走贸易。',
    members: ['禄存', '天马'],
  }),
  ge({
    id: '禄合鸳鸯',
    title: '禄合鸳鸯格',
    oneLiner: '禄与桃花类曜合——财色议题同台，需边界。',
    members: ['禄存', '贪狼'],
  }),
  ge({
    id: '武曲守财',
    title: '武曲守财格',
    oneLiner: '武曲得位守财帛——财技与守成同在。',
    members: ['武曲'],
  }),
  ge({
    id: '财荫夹印',
    title: '财荫夹印格',
    oneLiner: '财星与荫星夹印——钱与庇护托住印绶位。',
    members: ['武曲', '天梁', '天相'],
  }),
  ge({
    id: '石中隐玉',
    title: '石中隐玉格',
    oneLiner: '巨门等落闲地却藏玉——早年隐、后期发。',
    members: ['巨门'],
    keywords: ['石中隐玉', '巨门', '大器晚成'],
  }),
  ge({
    id: '英星入庙',
    title: '英星入庙格',
    oneLiner: '英星（如廉贞等）入庙——才气有舞台。',
    members: ['廉贞'],
  }),
  ge({
    id: '将星得地',
    title: '将星得地格',
    oneLiner: '将星类主星得地——权威与决断落地。',
    members: ['七杀', '破军'],
  }),

  // —— 火铃贪 ——
  ge({
    id: '火贪',
    title: '火贪格',
    oneLiner: '火星会贪狼——欲速、热情、投机气；成格看庙旺。',
    members: ['火星', '贪狼'],
  }),
  ge({
    id: '铃贪',
    title: '铃贪格',
    oneLiner: '铃星会贪狼——暗火欲望，起伏大。',
    members: ['铃星', '贪狼'],
  }),

  // —— 凶格 / 警示 ——
  ge({
    id: '马头带箭',
    title: '马头带箭格',
    oneLiner: '天马遇煞如箭——奔走中易受伤或突发。',
    members: ['天马', '擎羊'],
    tone: 'xiong',
    keywords: ['天马', '擎羊', '突发'],
  }),
  ge({
    id: '梁马飘荡',
    title: '梁马飘荡格',
    oneLiner: '天梁逢马——荫护难定所，漂泊感强。',
    members: ['天梁', '天马'],
    tone: 'xiong',
  }),
  ge({
    id: '泛水桃花',
    title: '泛水桃花格',
    oneLiner: '桃花逢水旺位——情感议题泛滥，需堤岸。',
    members: ['贪狼', '太阴'],
    tone: 'xiong',
  }),
  ge({
    id: '风流彩杖',
    title: '风流彩杖格',
    oneLiner: '桃花叠昌曲等——风流才情，也易纠葛。',
    members: ['贪狼', '文昌', '文曲'],
    tone: 'xiong',
  }),
  ge({
    id: '命无正曜',
    title: '命无正曜格',
    oneLiner: '命宫无十四主星——借对宫与三方论，主星在别处发力。',
    members: [],
    tone: 'xiong',
    keywords: ['借星', '对宫', '三方'],
    mutagenNote: '无主星不等于无格局；重点读对宫与三方主星。',
  }),
  ge({
    id: '刑囚夹印',
    title: '刑囚夹印格',
    oneLiner: '刑忌类曜夹印——名位受挤，文书法律题更敏感。',
    members: ['廉贞', '擎羊', '天相'],
    tone: 'xiong',
  }),
  ge({
    id: '刑忌夹印',
    title: '刑忌夹印格',
    oneLiner: '刑与化忌夹印——压力夹身，宜先守法与边界。',
    members: ['化忌', '擎羊', '天相'],
    tone: 'xiong',
  }),
  ge({
    id: '空劫守命',
    title: '空劫守命格',
    oneLiner: '地空、地劫守命——抽离破妄，也易落空感。',
    members: ['地空', '地劫'],
    tone: 'xiong',
  }),
  ge({
    id: '巨逢空劫',
    title: '巨逢空劫格',
    oneLiner: '巨门逢空劫——口舌与空耗同题，宜少辩多证。',
    members: ['巨门', '地空', '地劫'],
    tone: 'xiong',
  }),
  ge({
    id: '羊陀夹忌',
    title: '羊陀夹忌格',
    oneLiner: '羊陀夹化忌——压力与卡点夹击，先做减法。',
    members: ['擎羊', '陀罗', '化忌'],
    tone: 'xiong',
  }),
  ge({
    id: '火铃夹命',
    title: '火铃夹命格',
    oneLiner: '火铃夹命——急躁爆发夹身，宜降温再决策。',
    members: ['火星', '铃星'],
    tone: 'xiong',
  }),
  ge({
    id: '天罗地网',
    title: '天罗地网格',
    oneLiner: '命陷罗网意象——进退受束，宜耐心拆局。',
    members: ['陀罗', '擎羊'],
    tone: 'xiong',
    keywords: ['天罗', '地网', '受束'],
  }),
  ge({
    id: '马落空亡',
    title: '马落空亡格',
    oneLiner: '天马落空——奔走难落实，动线要留备份。',
    members: ['天马'],
    tone: 'xiong',
  }),
  ge({
    id: '文星遇煞',
    title: '文星遇煞格',
    oneLiner: '昌曲遇煞——才气受挫或考试波折，宜补实务。',
    members: ['文昌', '文曲', '擎羊'],
    tone: 'xiong',
  }),
];

export function mergeClassicCatalog(base: ComboLore[]): ComboLore[] {
  const seen = new Set(base.map((c) => c.id));
  const extra = CLASSIC_GE_CATALOG.filter((c) => !seen.has(c.id));
  // 专规古典格在前，名录补全在后，再接星曜组合
  const classicBase = base.filter((c) => c.family === 'classic-ge');
  const combos = base.filter((c) => c.family !== 'classic-ge');
  return [...classicBase, ...extra, ...combos];
}
