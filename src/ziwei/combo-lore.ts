/** 搭戏组合 / 古典格局探索 */
import { mergeClassicCatalog } from './combo-classic-catalog.ts';
import { stampGeCategory } from './combo-categories.ts';

export type ComboFamily = 'classic-ge' | 'star-combo';

/** strong=我的页默认展开；soft=成格也进「候选」折叠 */

export type ComboRank = 'strong' | 'soft';

export type ComboFormationRule =
  | 'sanfang'
  | 'wenxing-gongming'
  | 'cailu-jiama'
  | 'riyue-bingming'
  | 'danchi-guichi'
  /** 名录释义专用：图鉴可见，不按宽松三方自动判成格 */
  | 'catalog';

export type ComboTone = 'ji' | 'xiong' | 'neutral';

/** 图鉴门类；缺省由 combo-categories 按 id/family 推断 */
export type GeCategory =
  | 'di-fu'
  | 'ji-sha'
  | 'ri-yue'
  | 'wen-gui'
  | 'lu-ma'
  | 'huo-tan'
  | 'xiong'
  | 'star-combo';

export type ComboLore = {
  id: string;
  title: string;
  oneLiner: string;
  keywords: string[];
  members: string[];
  vibe: string;
  strength: string;
  shadow: string;
  howToPlay: string;
  mutagenNote: string;
  family: ComboFamily;
  rank: ComboRank;
  /** 缺省 sanfang：成员同三方四正 */
  formationRule?: ComboFormationRule;
  /** 古典吉/凶色调；缺省中性 */
  tone?: ComboTone;
  category?: GeCategory;
};



export const COMBO_LORE_CORE: ComboLore[] = [

  {

    id: '文星拱命',

    title: '文星拱命格',

    oneLiner: '昌曲会照命宫三方——文气、学习与表达更亮。',

    keywords: ['文才', '考试', '表达', '拱命'],

    members: ['文昌', '文曲'],

    vibe: '文昌偏结构、文曲偏韵味；一起拱命，像书桌与麦克风都对准你。',

    strength: '学得进、写得出、谈吐加分；科名与内容变现更顺。',

    shadow: '纸上漂亮、落地慢；或才气外露却缺纪律。',

    howToPlay: '把灵感交成作品；考试与表达场合主动露脸。',

    mutagenNote: '化科：名声；化禄：稿酬课程；化忌：拖延完美主义。',

    family: 'classic-ge',

    rank: 'strong',

    formationRule: 'wenxing-gongming',

    tone: 'ji',

  },

  {

    id: '财禄夹马',

    title: '财禄夹马格',

    oneLiner: '天马坐命、财禄夹宫——动中生财的格局（条件较严）。',

    keywords: ['天马', '武曲', '禄', '动财'],

    members: ['天马', '武曲', '禄存'],

    vibe: '马在跑、财在夹：适合贸易、奔走、险中求财的戏码。',

    strength: '财源活、敢动、现金流题更响。',

    shadow: '奔波耗体；邻禄常伴羊陀，吉中带刺。',

    howToPlay: '动之前先定回程锚；投机设止损。',

    mutagenNote: '化禄夹更活；昌忌冲破则富假。',

    family: 'classic-ge',

    rank: 'strong',

    formationRule: 'cailu-jiama',

    tone: 'ji',

  },

  {

    id: '日月并明',

    title: '日月并明格',

    oneLiner: '日与月在命盘三方同亮——外场与内场都有光。',

    keywords: ['太阳', '太阴', '并明', '双亮'],

    members: ['太阳', '太阴'],

    vibe: '白天的舞台与夜里的蓄能同时在线，人格完整度高。',

    strength: '公开表达与私下感受能轮班；少年得志感更强（仍看煞忌）。',

    shadow: '日太耗月，或月太沉吞日——内外撕裂。',

    howToPlay: '行程强制留「无输出」夜段；别两头都满负荷。',

    mutagenNote: '日禄权：曝光带资源；月禄：储蓄人缘；忌则明暗失衡。',

    family: 'classic-ge',

    rank: 'strong',

    formationRule: 'riyue-bingming',

    tone: 'ji',

  },

  {

    id: '丹墀桂墀',

    title: '丹墀桂墀格',

    oneLiner: '昌在命、曲在迁（或对调）——丹墀桂墀，功名文气的古典说法。',

    keywords: ['文昌', '文曲', '命迁', '丹桂'],

    members: ['文昌', '文曲'],

    vibe: '一宫丹墀（朝堂文气）、一宫桂墀（折桂文气）：出门与归位都带文香。',

    strength: '求学、科考、文职路径更顺眼。',

    shadow: '虚名大于实务；迁宫动荡时文气漂。',

    howToPlay: '用作品证明「桂」；别只收藏证书幻想。',

    mutagenNote: '与日月并明不同：本格看昌曲分居命/迁。流派或将并明也称丹墀桂墀。',

    family: 'classic-ge',

    rank: 'strong',

    formationRule: 'danchi-guichi',

    tone: 'ji',

  },

  {

    id: '杀破狼',

    title: '杀破狼',

    oneLiner: '变动、开创、冲劲强——适合开荒与改命局。',

    keywords: ['变动', '开创', '冲劲', '行动'],

    members: ['七杀', '破军', '贪狼'],

    vibe: '三颗星像突击小队：杀开路、破拆局、狼找资源与人。',

    strength: '敢冲、敢换、场面一热就能推进；危机里反而清醒。',

    shadow: '太猛、太散、为爽感而动；容易消耗关系与积蓄。',

    howToPlay: '先定「这一仗要拿下什么」，再动手；给自己配一个托底的人。',

    mutagenNote: '遇化禄：冲劲变现；化权：主导加速；化忌：空耗与口舌。',

    family: 'star-combo',

    rank: 'soft',

  },

  {

    id: '机月同梁',

    title: '机月同梁',

    oneLiner: '思考、协调、组织——文职与策略型组合。',

    keywords: ['思考', '协调', '组织', '文职'],

    members: ['天机', '太阴', '天同', '天梁'],

    vibe: '谋士、感受、福气、荫护同台：偏文、偏细、偏长线。',

    strength: '会盘算、会照顾场、能把复杂事做成流程。',

    shadow: '想太多、太软、决断慢；机会窗口容易错过。',

    howToPlay: '用清单限时决策；关键节点找一颗「刚」星帮你拍板。',

    mutagenNote: '化科：名声与方案；化禄：细活变现；化忌：内耗与优柔。',

    family: 'star-combo',

    rank: 'soft',

  },

  {

    id: '日月',

    title: '日月',

    oneLiner: '外在表达 vs 内在感受——一放一收的轴线。',

    keywords: ['表达', '感受', '公开', '内在'],

    members: ['太阳', '太阴'],

    vibe: '日主外照、月主内蓄：舞台与后台要轮班，不能只开一盏灯。',

    strength: '既能带动场面，也能在私下蓄能；人格完整度高。',

    shadow: '日太亮耗尽月，或月太沉吞掉日——公开与私下撕裂。',

    howToPlay: '白天给世界，夜里给自己；行程里强制留「无输出时段」。',

    mutagenNote: '日化禄权：曝光带资源；月化禄：储蓄与人缘；忌则一明一暗失衡。',

    family: 'star-combo',

    rank: 'soft',

  },

  {

    id: '禄权科忌',

    title: '禄权科忌',

    oneLiner: '资源 / 执行 / 名声 / 卡点——四化是人生催化剂。',

    keywords: ['资源', '执行', '名声', '卡点'],

    members: ['化禄', '化权', '化科', '化忌'],

    vibe: '不是新角色，是给角色加的状态栏：哪里顺、哪里卡。',

    strength: '禄让事成，权让你拍板，科引贵人，忌标出必修课。',

    shadow: '忌被当成死刑；禄被当成可以躺赢。',

    howToPlay: '每年看流年四化：禄处推进、忌处复盘，不要对调。',

    mutagenNote: '本命与大限/流年四化叠加以「当下最亮的那组」为准。',

    family: 'star-combo',

    rank: 'soft',

  },

  {

    id: '紫府',

    title: '紫微天府',

    oneLiner: '王座加库藏——定调与托底同在。',

    keywords: ['定调', '库藏', '稳盘', '资源'],

    members: ['紫微', '天府'],

    vibe: '帝星坐镇、府库存粮：场面与家底互相喂养。',

    strength: '适合管人管资源；长期主义强。',

    shadow: '过稳、过端；窗口来了仍不肯动。',

    howToPlay: '保留主轴，但每年做一次「小冒险配额」。',

    mutagenNote: '化禄权：资源与话语权双升；化忌：名位压力或死守。',

    family: 'star-combo',

    rank: 'soft',

  },

  {

    id: '杀府',

    title: '七杀天府',

    oneLiner: '冲劲与稳定的张力——开锋后要有人守营。',

    keywords: ['冲劲', '稳定', '张力', '将相'],

    members: ['七杀', '天府'],

    vibe: '先锋与粮草官同场：能冲也能守，戏好看也难演。',

    strength: '开拓之后有沉淀；不像纯杀那样空。',

    shadow: '内在拉扯：想冲的自己 vs 想守的自己。',

    howToPlay: '把一年拆成「冲刺季」与「巩固季」，不要同时全开。',

    mutagenNote: '杀化权：开锋更狠；府化禄：守营有粮；忌则左右互搏。',

    family: 'star-combo',

    rank: 'soft',

  },

  {

    id: '辅弼',

    title: '左辅右弼',

    oneLiner: '成全与托底——场面需要帮手时他们在。',

    keywords: ['贵人', '成全', '托底', '协作'],

    members: ['左辅', '右弼'],

    vibe: '不抢戏的双辅：把主轴托稳，把缺口补上。',

    strength: '贵人感、协作力、容错率更高。',

    shadow: '太会成全别人，忘了自己主场。',

    howToPlay: '主动说清「这次谁主场」；辅星也要有边界。',

    mutagenNote: '遇禄权：贵人变现；化忌：帮错人或过度付出。',

    family: 'star-combo',

    rank: 'soft',

  },

  {

    id: '魁钺',

    title: '天魁天钺',

    oneLiner: '天降贵气——机遇与体面常结伴。',

    keywords: ['贵气', '机遇', '体面', '提携'],

    members: ['天魁', '天钺'],

    vibe: '像被点名上台：机会来时要接得住。',

    strength: '容易遇提携、场合加分。',

    shadow: '等贵人来，自己不准备。',

    howToPlay: '把「可见度」当作业：作品、履历、关系都要可被看见。',

    mutagenNote: '化科更扬名；化忌则贵人迟到或场面空欢喜。',

    family: 'star-combo',

    rank: 'soft',

  },

  {

    id: '昌曲',

    title: '昌曲',

    oneLiner: '文才双星——写得出、说得动。',

    keywords: ['文才', '表达', '学习', '审美'],

    members: ['文昌', '文曲'],

    vibe: '一个偏结构一个偏韵味：文章与谈吐一起亮。',

    strength: '学习、表达、审美型变现更顺。',

    shadow: '纸上谈兵，落地慢。',

    howToPlay: '每学一项就交一件作品，别只收藏灵感。',

    mutagenNote: '化科：名声；化禄：稿酬/课程；化忌：拖延与完美主义。',

    family: 'star-combo',

    rank: 'soft',

  },

  {

    id: '羊陀',

    title: '羊陀',

    oneLiner: '锋利与纠缠——压力先来，本事后成。',

    keywords: ['试炼', '锋利', '纠缠', '业力'],

    members: ['擎羊', '陀罗'],

    vibe: '刀与绳：切开局面，也被局面缠住。',

    strength: '抗压、决断、在难局里长本事。',

    shadow: '伤人伤己，内耗成日常。',

    howToPlay: '把冲突写成清单：砍问题，不切手边人。',

    mutagenNote: '忌处更考边界；禄权则压力变动力。',

    family: 'star-combo',

    rank: 'soft',

  },

  {

    id: '火铃',

    title: '火铃',

    oneLiner: '爆发与躁动——速度快，也容易烫手。',

    keywords: ['爆发', '速度', '躁动', '业力'],

    members: ['火星', '铃星'],

    vibe: '点火与响铃：气氛一热就想冲。',

    strength: '启动快、感染力强。',

    shadow: '急躁、口舌、烧掉耐心。',

    howToPlay: '冲之前设「冷静 24 小时」规则。',

    mutagenNote: '化忌加速口舌；化权则爆发可用在正事。',

    family: 'star-combo',

    rank: 'soft',

  },

  {

    id: '空劫',

    title: '空劫',

    oneLiner: '抽离与破妄——看穿空相，也怕落空。',

    keywords: ['抽离', '破妄', '眼界', '空相'],

    members: ['地空', '地劫'],

    vibe: '两盏冷灯：照见虚妄，也照见恐惧。',

    strength: '洞察、哲学感、少被表象骗。',

    shadow: '虚无、不投入、机会也空过。',

    howToPlay: '允许「空」休息，但每周做一件落地小事。',

    mutagenNote: '忌处更空；科禄则空性变智慧输出。',

    family: 'star-combo',

    rank: 'soft',

  },

  {

    id: '机梁',

    title: '机梁',

    oneLiner: '谋划加荫护——想得细，也有人罩。',

    keywords: ['谋划', '荫护', '策略', '稳'],

    members: ['天机', '天梁'],

    vibe: '军师与长辈同台：计策有后盾。',

    strength: '规划力、顾问感、长期局。',

    shadow: '想太多、倚老卖老或依赖庇护。',

    howToPlay: '方案限时拍板；荫护用来托底不是逃避。',

    mutagenNote: '化科：名声方案；化忌：内耗与说教。',

    family: 'star-combo',

    rank: 'soft',

  },

  {

    id: '府相',

    title: '府相',

    oneLiner: '库藏与体面——资源要装得住礼。',

    keywords: ['库藏', '体面', '服务', '稳盘'],

    members: ['天府', '天相'],

    vibe: '管家与礼仪官：有粮也有分寸。',

    strength: '资源管理、服务意识、场面得体。',

    shadow: '过稳过迎合。',

    howToPlay: '每年留一点「不体面但必要」的冒险配额。',

    mutagenNote: '府禄：粮足；相忌：失我讨好。',

    family: 'star-combo',

    rank: 'soft',

  },

];

/** 专规古典格 + 完整名录 + 星曜组合 */
export const COMBO_LORE: ComboLore[] = mergeClassicCatalog(COMBO_LORE_CORE).map(stampGeCategory);

/** 又称 / 别名 → 名录 id */
const COMBO_ALIASES: Record<string, string> = {
  日丽中天: '金灿光辉',
  日照雷门: '日出扶桑',
  月落亥宫: '月朗天门',
  刑囚印: '刑囚夹印',
  官封三代: '巨日同宫',
};

export function getComboLore(id: string): ComboLore | undefined {
  const key = COMBO_ALIASES[id] ?? id;
  return COMBO_LORE.find((c) => c.id === key || c.title === key || c.id === id || c.title === id);
}


