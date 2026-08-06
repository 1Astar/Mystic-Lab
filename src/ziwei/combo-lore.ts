/** 搭戏组合图鉴 · 星曜如何互相当对手戏 */
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
};

export const COMBO_LORE: ComboLore[] = [
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
  },
];

export function getComboLore(id: string): ComboLore | undefined {
  return COMBO_LORE.find((c) => c.id === id || c.title === id);
}
