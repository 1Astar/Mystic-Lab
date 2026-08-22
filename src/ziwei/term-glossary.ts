/**
 * 紫微术语六类 + 统一四层解释字段
 * star | palace | status | structure | mutagen | limit
 */
export type TermCategory =
  | 'star'
  | 'palace'
  | 'status'
  | 'structure'
  | 'mutagen'
  | 'limit';

export const TERM_CATEGORY_LABEL: Record<TermCategory, string> = {
  star: '星曜',
  palace: '宫位',
  status: '星曜状态',
  structure: '结构',
  mutagen: '四化',
  limit: '运限',
};

/** 盘面/抽屉色标：避免绿=好、红=坏 */
export const TERM_CATEGORY_CLASS: Record<TermCategory, string> = {
  star: 'is-cat-star',
  palace: 'is-cat-palace',
  status: 'is-cat-status',
  structure: 'is-cat-structure',
  mutagen: 'is-cat-mutagen',
  limit: 'is-cat-limit',
};

export type StatusKey = '庙' | '旺' | '得' | '利' | '平' | '陷' | '不' | '地';

export const STATUS_PRODUCT: Record<
  string,
  { product: string; userLine: string; dots: number }
> = {
  庙: { product: '发挥最充分', userLine: '这颗星最容易展现本来的特质', dots: 4 },
  旺: { product: '发挥较强', userLine: '特质明显，行动表现比较有力', dots: 3 },
  得: { product: '能够发挥', userLine: '有一定支持，但强度不如庙旺', dots: 2 },
  利: { product: '能够发挥', userLine: '有一定支持，但强度不如庙旺', dots: 2 },
  平: { product: '中性状态', userLine: '特质存在，表现会受其他因素影响', dots: 2 },
  不: { product: '发挥受限', userLine: '需要结合其他星曜判断', dots: 1 },
  地: { product: '发挥受限', userLine: '需要结合其他星曜判断', dots: 1 },
  陷: { product: '表现不顺', userLine: '优点不容易直接发挥，问题面可能更明显', dots: 1 },
};

export const STATUS_DISCLAIMER =
  '「陷」不等于坏，「庙」也不等于一定好。它描述的是星曜如何发挥，不是人生结果的好坏。状态必须和星曜性质、所在宫位、四化、会照一起看。';

/**
 * 产品口径：部分主星不讲「庙 / 旺」两档（亮度仍用得利平陷等）。
 * 例：天机以灵动盘算为主，不走「入庙 / 旺地」那套说法。
 */
const STARS_WITHOUT_MIAO_WANG = new Set(['天机']);

/** 该星亮度说明里列出的档位文案 */
export function brightnessGradeLabel(starId: string): string {
  return STARS_WITHOUT_MIAO_WANG.has(starId.replace(/星$/, ''))
    ? '得利平陷'
    : '庙旺得利平陷';
}

export function brightnessSectionTitle(starId: string): string {
  return STARS_WITHOUT_MIAO_WANG.has(starId.replace(/星$/, ''))
    ? '亮度状态'
    : '庙旺状态';
}

export function starUsesMiaoWang(starId: string): boolean {
  return !STARS_WITHOUT_MIAO_WANG.has(starId.replace(/星$/, ''));
}

export type GlossaryEntry = {
  id: string;
  category: TermCategory;
  name: string;
  aliases?: string[];
  shortMeaning: string;
  traditional: string;
  relatedTerms: string[];
};

/** 结构 / 四化 / 运限 / 状态总述 —— 静态词条 */
export const GLOSSARY: GlossaryEntry[] = [
  {
    id: 'status-overview',
    category: 'status',
    name: '庙旺落陷',
    aliases: ['星曜状态', '亮度'],
    shortMeaning: '表示一颗星在不同宫位中，发挥自身特质的顺畅程度。',
    traditional:
      '传统紫微按星曜落于地支，标庙、旺、得、利、平、陷等亮度。不同流派等级表略有差异，它描述力量与发挥状态，不是直接吉凶。',
    relatedTerms: ['庙', '旺', '平', '陷', '三方四正', '四化'],
  },
  {
    id: 'status-miao',
    category: 'status',
    name: '庙',
    shortMeaning: '发挥最充分——这颗星最容易展现本来的特质。',
    traditional: '庙地：星曜得地，气势最足，特质容易正面展开。',
    relatedTerms: ['庙旺落陷', '旺', '陷', '三方四正'],
  },
  {
    id: 'status-wang',
    category: 'status',
    name: '旺',
    shortMeaning: '发挥较强——特质明显，行动表现比较有力。',
    traditional: '旺地：气势强，表现鲜明，但仍需看宫位与会照。',
    relatedTerms: ['庙旺落陷', '庙', '平'],
  },
  {
    id: 'status-de',
    category: 'status',
    name: '得',
    aliases: ['利'],
    shortMeaning: '能够发挥——有一定支持，但强度不如庙旺。',
    traditional: '得/利：星曜有根基可发挥，力度中上。',
    relatedTerms: ['庙旺落陷', '平', '庙'],
  },
  {
    id: 'status-li',
    category: 'status',
    name: '利',
    shortMeaning: '能够发挥——有一定支持，但强度不如庙旺。',
    traditional: '利地：与「得」相近，表示可发挥但非最强。',
    relatedTerms: ['庙旺落陷', '得', '平'],
  },
  {
    id: 'status-ping',
    category: 'status',
    name: '平',
    shortMeaning: '中性状态——特质存在，表现会受其他因素影响。',
    traditional: '平地：亮度中性，发挥程度更多由同宫、四化与三方四正决定。',
    relatedTerms: ['庙旺落陷', '得', '陷', '三方四正', '四化'],
  },
  {
    id: 'status-xian',
    category: 'status',
    name: '陷',
    aliases: ['不', '地'],
    shortMeaning: '表现不顺——优点不容易直接发挥，问题面可能更明显。',
    traditional:
      '陷地：星曜失力或别扭。煞星处陷未必坏事；吉星处陷也不等于人生判负，须合看宫位与四化。',
    relatedTerms: ['庙旺落陷', '平', '化忌', '三方四正'],
  },
  {
    id: 'struct-wuxing-ju',
    category: 'structure',
    name: '五行局',
    aliases: [
      '五局',
      '水二局',
      '木三局',
      '金四局',
      '土五局',
      '火六局',
      '五行',
    ],
    shortMeaning: '命盘气场的节奏档：决定大限起运与盘面「局」的轻重感。',
    traditional:
      '由命宫天干与生年等推得水二、木三、金四、土五、火六五局。局数影响大限岁数起算，不是吉凶判决；读盘时作气质底色即可。',
    relatedTerms: ['命宫', '大限', '三方四正'],
  },
  {
    id: 'struct-dizhi',
    category: 'structure',
    name: '地支关系',
    aliases: ['支关系', '冲合刑', '地支连线'],
    shortMeaning:
      '宫与宫的地支互动三态：冲＝对撞变动、合＝牵绊成局、刑＝别扭内耗（含自刑）。',
    traditional:
      '· 六冲：子午、丑未、寅申、卯酉、辰戌、巳亥（隔六宫，也是对宫底色）\n· 六合：子丑、寅亥、卯戌、辰酉、巳申、午未（两支牵绊，≠三合）\n· 刑：寅巳申、丑未戌、子卯；辰午酉亥自刑\n图层只画当前所选宫的冲/合/刑，不铺全盘。',
    relatedTerms: ['六冲', '六合', '刑', '对宫', '三方四正'],
  },
  {
    id: 'struct-liuchong',
    category: 'structure',
    name: '六冲',
    aliases: ['冲', '相冲'],
    shortMeaning: '地支正对：子午、丑未、寅申、卯酉、辰戌、巳亥——对撞与变动。',
    traditional: '盘上隔六宫为正冲，也是对宫关系的地支底色。用途是对照内外与节奏拉扯，不是单纯吉凶。',
    relatedTerms: ['地支关系', '对宫', '六合', '三方四正'],
  },
  {
    id: 'struct-liuhe',
    category: 'structure',
    name: '六合',
    aliases: ['合', '相合'],
    shortMeaning: '地支六对牵绊：子丑、寅亥、卯戌、辰酉、巳申、午未——易成局也易黏着。',
    traditional: '六合与三合不同；六合是两支相合，三合是三支合局。',
    relatedTerms: ['地支关系', '六冲', '三方四正', '对宫'],
  },
  {
    id: 'struct-xing',
    category: 'structure',
    name: '刑',
    aliases: ['三刑', '相刑', '自刑'],
    shortMeaning: '地支刑：寅巳申、丑未戌、子卯无礼之刑；辰午酉亥自刑——别扭、规矩摩擦或自我拉扯。',
    traditional:
      '刑主别扭与内耗，不是刑法判决。读盘时看本宫与哪些宫成刑、是否自刑，再叠主星与四化。',
    relatedTerms: ['地支关系', '六冲', '六合', '三方四正'],
  },
  {
    id: 'struct-sanfang',
    category: 'structure',
    name: '三方四正',
    aliases: ['三方', '四正', '会照'],
    shortMeaning:
      '读一宫时的主镜头：本宫 + 对宫 + 两座三合。先看本宫星曜，再对照对宫，再看三合会照。',
    traditional:
      '按地支位：对宫隔 6，三合隔 4 与 8，合称三方四正——是关联范围，不是刑克判决。常例：读命宫时，对宫是迁移（外面如何看见我），三合是官禄（事业轨道）与财帛（资源进账），看它们如何托住「我是谁」。',
    relatedTerms: ['对宫', '三合', '命宫', '官禄宫', '财帛宫', '迁移宫', '六冲', '六合', '地支关系'],
  },
  {
    id: 'struct-dui',
    category: 'structure',
    name: '对宫',
    shortMeaning:
      '正对面那一宫：用来对照内外或互补面。读命宫时对宫是迁移——内核的我 vs 外面世界如何看见我。',
    traditional:
      '地支六冲位，盘上相隔六宫。常见成对：命↔迁移、夫妻↔官禄、财帛↔福德。用途是对照，不是单纯吉凶。',
    relatedTerms: ['三方四正', '三合', '命宫', '迁移宫', '地支关系', '六冲'],
  },
  {
    id: 'struct-sanhe',
    category: 'structure',
    name: '三合',
    aliases: ['三合局', '会照'],
    shortMeaning:
      '与本宫会照的两宫（隔四、隔八），三宫成局。读命宫时常连看官禄（事业如何塑造我）与财帛（资源如何托住我）。',
    traditional:
      '申子辰、寅午戌、巳酉丑、亥卯未。盘上相对本宫隔 4 与 8 宫。与六合不同：六合是两支牵绊，三合是三支成局、会照本宫主题。',
    relatedTerms: ['三方四正', '对宫', '六合', '命宫', '官禄宫', '财帛宫'],
  },
  {
    id: 'mutagen-lu',
    category: 'mutagen',
    name: '化禄',
    aliases: ['禄'],
    shortMeaning: '顺与得的催化剂：事情更容易有实质收获。',
    traditional: '四化之一。落在哪颗星、哪一宫，就加强该处的资源与满足感。',
    relatedTerms: ['化权', '化科', '化忌', '四化', '三方四正'],
  },
  {
    id: 'mutagen-quan',
    category: 'mutagen',
    name: '化权',
    aliases: ['权'],
    shortMeaning: '主导与执行力被放大：更适合拍板、推进。',
    traditional: '四化之一。加重掌控欲与决策感，过刚时也易顶牛。',
    relatedTerms: ['化禄', '化忌', '官禄宫'],
  },
  {
    id: 'mutagen-ke',
    category: 'mutagen',
    name: '化科',
    aliases: ['科'],
    shortMeaning: '名声、贵人与文书线索：适合展示与求教。',
    traditional: '四化之一。主科名、声誉、化解与文书。',
    relatedTerms: ['化禄', '化忌', '天机'],
  },
  {
    id: 'mutagen-ji',
    category: 'mutagen',
    name: '化忌',
    aliases: ['忌'],
    shortMeaning: '卡点与执念标记：此处宜降预期、少硬刚、多复盘。',
    traditional: '四化之一。标出消耗与黏着处，不是死刑判决。',
    relatedTerms: ['化禄', '庙旺落陷', '三方四正'],
  },
  {
    id: 'mutagen-overview',
    category: 'mutagen',
    name: '四化',
    aliases: ['禄权科忌'],
    shortMeaning:
      '禄权科忌四态：化禄偏顺与得、化权偏主导要扛、化科偏名声贵人、化忌偏卡点执念。',
    traditional:
      '由天干引出禄、权、科、忌四颗化星（常称生年四化）。化落哪颗星、哪一宫，就给该处加一层催化。宫干飞星是另一套看法，勿与生年四化混为一谈。',
    relatedTerms: ['化禄', '化权', '化科', '化忌', '生年四化'],
  },
  {
    id: 'struct-mingzhu',
    category: 'structure',
    name: '命主',
    aliases: ['命主星'],
    shortMeaning: '由命宫地支推出的主星指针，常用来补看「我是谁」的气质底色。',
    traditional: '命主落某星，像本命的代言人之一；仍以命宫主星与三方四正为主，命主作辅读。',
    relatedTerms: ['身主', '命宫', '五行局'],
  },
  {
    id: 'struct-shenzhu',
    category: 'structure',
    name: '身主',
    aliases: ['身主星'],
    shortMeaning: '由身宫地支推出的主星指针，偏看行动落点与「身子怎么走」。',
    traditional: '身主与命主对照：命主偏内核标签，身主偏行为取向；皆轻于宫干四化与主星组合。',
    relatedTerms: ['命主', '身宫', '命宫'],
  },
  {
    id: 'struct-shen',
    category: 'structure',
    name: '身宫',
    shortMeaning: '行动与落点的宫：身子常往哪边使力。',
    traditional: '身宫可与命宫同宫或另落。读盘时命宫定人设，身宫看精力投向。',
    relatedTerms: ['命宫', '身主', '命主'],
  },
  {
    id: 'mutagen-birth',
    category: 'mutagen',
    name: '生年四化',
    aliases: ['本命四化'],
    shortMeaning: '由生年天干定下的禄权科忌：本命长期的催化底色。',
    traditional: '生年干引出四颗化星落宫。先看化入哪宫、化在哪颗星，再叠大限/流年四化。',
    relatedTerms: ['四化', '化禄', '化权', '化科', '化忌', '流年'],
  },
  {
    id: 'mutagen-limit',
    category: 'mutagen',
    name: '运限四化',
    aliases: ['大限四化', '流年四化'],
    shortMeaning: '大限、流年（及更细运限）天干带来的阶段性四化。',
    traditional: '叠在生年四化之上读：生年是底色，运限是这一季被点亮的催化。',
    relatedTerms: ['生年四化', '大限', '流年', '四化'],
  },
  {
    id: 'limit-daxian',
    category: 'limit',
    name: '大限',
    shortMeaning: '约十年一段的人生主题档：什么课题被推到前台。',
    traditional: '大限落某宫，该宫星曜与四化成为这十年的主舞台。',
    relatedTerms: ['流年', '命宫', '四化', '运限四化'],
  },
  {
    id: 'limit-liunian',
    category: 'limit',
    name: '流年',
    shortMeaning: '某一年被点亮的线索：适合对照具体问题。',
    traditional: '流年干支与四化、叠在本命与大限之上读。',
    relatedTerms: ['大限', '流月', '流日', '四化'],
  },
  {
    id: 'limit-liuyue',
    category: 'limit',
    name: '流月',
    shortMeaning: '月份尺度的激活：把流年课题拆成更短窗口。',
    traditional:
      '流月看当月干支、流月命宫与流月四化，叠在本命与流年之上读。宜推进处看化禄，宜复盘处看化忌；是短窗口，不是十年判决。',
    relatedTerms: ['流年', '流日', '大限', '四化', '运限四化'],
  },
  {
    id: 'limit-liuri',
    category: 'limit',
    name: '流日',
    aliases: ['日限'],
    shortMeaning: '某一天的主场落点：把流月课题再缩成「今天」。',
    traditional:
      '流日看当日干支与流日命宫，叠在本命、大限、流年、流月之上。适合对照当天发生的事做验证，不作长篇人生判决。',
    relatedTerms: ['流月', '流时', '流年', '大限'],
  },
  {
    id: 'limit-liushi',
    category: 'limit',
    name: '流时',
    aliases: ['时限'],
    shortMeaning: '时辰尺度的时机提示：此刻能量往哪边偏。',
    traditional:
      '流时看该时辰落宫。把它当「现在这一拍」的提示，不展开成整年故事；宜短、宜可执行。',
    relatedTerms: ['流日', '流月', '流年'],
  },
  {
    id: 'struct-konggong',
    category: 'structure',
    name: '空宫',
    aliases: ['空宫位'],
    shortMeaning: '该宫没有主星坐守：主题更依赖三方四正与对宫来补读。',
    traditional:
      '空宫不是「没有这部分人生」。主星不在，宫职仍在；借对宫、三合与飞星来看该领域如何被外界与会照带动。忌把空宫读成缺失或诅咒。',
    relatedTerms: ['三方四正', '对宫', '三合', '身宫'],
  },
];

export function normalizeStatus(raw: string): string {
  const s = raw.trim().replace(/地$/, '陷');
  if (s === '不') return '陷';
  return s;
}

export function getGlossaryByName(name: string): GlossaryEntry | undefined {
  const n = name.trim();
  return GLOSSARY.find(
    (g) => g.name === n || g.aliases?.includes(n) || g.id === n,
  );
}

export function statusDotsHtml(status: string): string {
  const info = STATUS_PRODUCT[normalizeStatus(status)];
  const n = info?.dots ?? 2;
  return Array.from({ length: 4 }, (_, i) => (i < n ? '●' : '○')).join('');
}
