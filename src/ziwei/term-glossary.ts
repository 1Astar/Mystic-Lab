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
    id: 'struct-liuchong',
    category: 'structure',
    name: '六冲',
    aliases: ['冲', '相冲'],
    shortMeaning: '地支正对：子午、丑未、寅申、卯酉、辰戌、巳亥——对撞与变动。',
    traditional: '盘上隔六宫为正冲，也是对宫关系的地支底色。',
    relatedTerms: ['对宫', '六合', '三方四正'],
  },
  {
    id: 'struct-liuhe',
    category: 'structure',
    name: '六合',
    aliases: ['合', '相合'],
    shortMeaning: '地支六对牵绊：子丑、寅亥、卯戌、辰酉、巳申、午未——易成局也易黏着。',
    traditional: '六合与三合不同；六合是两支相合，三合是三支合局。',
    relatedTerms: ['六冲', '三方四正', '对宫'],
  },
  {
    id: 'struct-sanfang',
    category: 'structure',
    name: '三方四正',
    aliases: ['三方', '四正', '会照'],
    shortMeaning: '解读一宫时，常连看本宫、对宫与两个三合宫的关联范围。',
    traditional:
      '按地支位：对宫隔 6，三合隔 4 与 8。合称三方四正，是读宫的主关系，不是刑克判决。',
    relatedTerms: ['对宫', '命宫', '夫妻宫', '官禄宫', '迁移宫', '六冲', '六合'],
  },
  {
    id: 'struct-dui',
    category: 'structure',
    name: '对宫',
    shortMeaning: '与本宫正对面的宫位，常用来对照内外或互补面。',
    traditional: '地支六冲位，盘上相隔六宫。如命宫对迁移、夫妻对官禄。',
    relatedTerms: ['三方四正', '命宫', '迁移宫'],
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
    shortMeaning: '给星曜加的状态栏：哪里顺、哪里卡、哪里有名、哪里要扛。',
    traditional: '由天干引出禄权科忌四星。生年四化与宫干飞星是两套常用看法。',
    relatedTerms: ['化禄', '化权', '化科', '化忌'],
  },
  {
    id: 'limit-daxian',
    category: 'limit',
    name: '大限',
    shortMeaning: '约十年一段的人生主题档：什么课题被推到前台。',
    traditional: '大限落某宫，该宫星曜与四化成为这十年的主舞台。',
    relatedTerms: ['流年', '命宫', '四化'],
  },
  {
    id: 'limit-liunian',
    category: 'limit',
    name: '流年',
    shortMeaning: '某一年被点亮的线索：适合对照具体问题。',
    traditional: '流年干支与四化、叠在本命与大限之上读。',
    relatedTerms: ['大限', '流月', '四化'],
  },
  {
    id: 'limit-liuyue',
    category: 'limit',
    name: '流月',
    shortMeaning: '月份尺度的激活：把流年课题拆成更短窗口。',
    traditional: '流月在专业排盘中用于细看时机，产品后续会加深。',
    relatedTerms: ['流年', '大限'],
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
