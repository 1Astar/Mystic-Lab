/**
 * 主星详情 4 屏：星之画像 / 长在身上的特质 / 生活镜子 / 在你盘里·醒言
 * 气质：神秘但清晰 · 温柔带秩序 · 记人不是记局
 */
import { getStarLore, MAJOR_STARS, type MajorStarId, type StarCard } from './stars.ts';
import { MORE_PROFILES } from './star-profiles-more.ts';

export type DetailTabId = 'portrait' | 'trait' | 'mirror' | 'you';

export const DETAIL_TAB_LABEL: Record<DetailTabId, string> = {
  portrait: '星之画像',
  trait: '长在身上',
  mirror: '生活镜子',
  you: '在你盘里',
};

/** 落宫优先（生活语言，避免宫斗叙事） */
export const FOCUS_PALACES: Array<{ id: string; title: string; hint: string }> = [
  { id: '命宫', title: '命宫', hint: '我是谁' },
  { id: '官禄', title: '官禄宫', hint: '事业轨道' },
  { id: '财帛', title: '财帛宫', hint: '资源处理' },
  { id: '夫妻', title: '夫妻宫', hint: '亲密惯性' },
  { id: '福德', title: '福德宫', hint: '安全感与快乐' },
  { id: '迁移', title: '迁移宫', hint: '外部评价场' },
];

export type StarTags = {
  yinYang: string;
  wuxing: string;
  dou: string;
  huaqi: string;
};

/** 02 长在身上的特质 */
export type StarTrait = {
  drive: string;
  gift: string;
  shadow: string;
  need: string;
};

/** 03 生活镜子 */
export type LifeMirror = {
  work: string;
  love: string;
  wealth: string;
  social: string;
  self: string;
};

export type PalaceHit = {
  palaceId: string;
  title: string;
  hint: string;
  line: string;
};

/** @deprecated 关系网内容迁到组合旅程；保留供降级 */
export type StarRelations = {
  synergy: string;
  tension: string;
  opposite: string;
  sanfang: string;
  mutagen: string;
};

export type StarProfile = {
  starId: string;
  oneLiner: string;
  /** 最多展示 4 个 */
  keywords: string[];
  /** 角色隐喻（人格海报提示） */
  metaphor: string;
  tags: StarTags;
  trait: StarTrait;
  mirror: LifeMirror;
  palaces: PalaceHit[];
  counsel: string;
  relations?: StarRelations;
  artSrc?: string;
};

/** 已出人格海报的主星 → public 路径 */
export const STAR_ART_SRC: Partial<Record<MajorStarId, string>> = {
  紫微: '/ziwei/stars/紫微.webp',
  天机: '/ziwei/stars/天机.webp',
  太阳: '/ziwei/stars/太阳.webp',
  武曲: '/ziwei/stars/武曲.webp',
  天同: '/ziwei/stars/天同.webp',
  廉贞: '/ziwei/stars/廉贞.webp',
  天府: '/ziwei/stars/天府.webp',
  太阴: '/ziwei/stars/太阴.webp',
  贪狼: '/ziwei/stars/贪狼.webp',
  巨门: '/ziwei/stars/巨门.webp',
  天相: '/ziwei/stars/天相.webp',
  天梁: '/ziwei/stars/天梁.webp',
  七杀: '/ziwei/stars/七杀.webp',
  破军: '/ziwei/stars/破军.webp',
};

function resolveArtSrc(starId: string, explicit?: string): string | undefined {
  return explicit ?? STAR_ART_SRC[starId as MajorStarId];
}

/** 旧档案 → 新四屏（兼容 star-profiles-more） */
type LegacyEssence = {
  strengths?: string;
  shadows?: string;
  cares?: string;
  fears?: string;
  workStyle?: string;
  relationStyle?: string;
  drive?: string;
  gift?: string;
  shadow?: string;
  need?: string;
};

export type RawStarProfile = {
  starId: string;
  oneLiner: string;
  keywords: string[];
  metaphor?: string;
  tags: StarTags;
  essence?: LegacyEssence;
  trait?: StarTrait;
  mirror?: LifeMirror;
  palaces: PalaceHit[];
  counsel?: string;
  relations?: StarRelations;
  artSrc?: string;
};

function palaceLine(palaces: PalaceHit[], id: string): string {
  return palaces.find((p) => p.palaceId === id)?.line ?? '';
}

export function normalizeProfile(raw: RawStarProfile): StarProfile {
  const e = raw.essence ?? {};
  const trait: StarTrait = raw.trait ?? {
    drive: e.drive ?? e.cares ?? '建立属于自己的节奏。',
    gift: e.gift ?? e.strengths ?? '把独特之处用出来。',
    shadow: e.shadow ?? e.shadows ?? '用力过猛或用力错位。',
    need:
      e.need ??
      (e.cares
        ? `把「${e.cares}」落成可验证的小实验，而不是一直焦虑。`
        : '被理解的位置，和可验证的小安全感。'),
  };
  const mirror: LifeMirror = raw.mirror ?? {
    work: e.workStyle ?? (palaceLine(raw.palaces, '官禄') || '工作里会露出这颗星的主调。'),
    love: e.relationStyle ?? (palaceLine(raw.palaces, '夫妻') || '亲密里有固定惯性。'),
    wealth: palaceLine(raw.palaces, '财帛') || '资源进出反映它的处理方式。',
    social: raw.relations?.synergy ?? '社交里吸引同类频率的人。',
    self:
      palaceLine(raw.palaces, '福德') ||
      palaceLine(raw.palaces, '命宫') ||
      '独处时更能听见这颗星。',
  };
  return {
    starId: raw.starId,
    oneLiner: raw.oneLiner,
    keywords: raw.keywords.slice(0, 4),
    metaphor: raw.metaphor ?? '星象原型 · 天象与力量的剪影',
    tags: raw.tags,
    trait,
    mirror,
    palaces: raw.palaces,
    counsel:
      raw.counsel ??
      raw.relations?.tension ??
      '先认出它，再决定是借力还是收帆。',
    relations: raw.relations,
    artSrc: resolveArtSrc(raw.starId, raw.artSrc),
  };
}

const DEMO: Partial<Record<MajorStarId, RawStarProfile>> = {
  紫微: {
    starId: '紫微',
    oneLiner: '它像一个天生会定主轴的人：不吵，但场面会慢慢围过来。',
    keywords: ['核心', '统筹', '主轴', '定盘'],
    metaphor: '星核 + 龙/麒麟骨相 · 中央王座感 · 中轴对称',
    tags: { yinYang: '阳', wuxing: '土', dou: '北斗', huaqi: '官禄' },
    trait: {
      drive: '建立秩序，被看见价值。',
      gift: '统筹、扛事、定局。',
      shadow: '控制欲、包袱感、端着不松。',
      need: '可信的位置与稳定的舞台。',
    },
    mirror: {
      work: '适合定调与资源整合：管理、品牌、平台型角色。',
      love: '亲密里像主心骨；要练习示弱，别只当负责人。',
      wealth: '财从结构来——人与事编排对了，资源会跟着主轴走。',
      social: '容易成为圈子里的定盘星；也容易被过度期待。',
      self: '乱局最耗你；事情在轨道上，内心才安。',
    },
    palaces: [
      { palaceId: '命宫', title: '命宫', hint: '我是谁', line: '自我主轴清晰：别人围着你的节奏转，你也常成为拍板的人。' },
      { palaceId: '官禄', title: '官禄宫', hint: '事业轨道', line: '事业靠定调与整合，而非单打独斗的小聪明。' },
      { palaceId: '财帛', title: '财帛宫', hint: '资源处理', line: '资源处理偏「建结构」：先盘面，再进账。' },
      { palaceId: '夫妻', title: '夫妻宫', hint: '亲密惯性', line: '亲密惯性是可靠与负责；小心变成家长而不是同伴。' },
      { palaceId: '福德', title: '福德宫', hint: '安全感与快乐', line: '安全感来自「事情在轨道上」。' },
      { palaceId: '迁移', title: '迁移宫', hint: '外部评价场', line: '外部评价场里仍易成焦点；出远门也像带着自己的坐标系。' },
    ],
    counsel: '当你觉得必须一个人扛完时，先问：哪些可以交出去，而王座不会塌？',
  },
  天机: {
    starId: '天机',
    oneLiner: '它像脑子一直在动的人：路径分叉、随时重算下一张地图。',
    keywords: ['聪明', '转得快', '盘算', '变招'],
    metaphor: '流动仪轨 + 机关羽翼 · 星轨齿轮 · 路径分叉',
    tags: { yinYang: '阴', wuxing: '木', dou: '南斗', huaqi: '善' },
    trait: {
      drive: '把复杂事拆开，比别人早半步看见选项。',
      gift: '策划、变招、把乱线梳成路径。',
      shadow: '想太多、夜里空转、决断拖延。',
      need: '有限选项 + 可落地的下一步。',
    },
    mirror: {
      work: '咨询、产品、策略、内容：靠「想得早」变现。',
      love: '爱分析对方；记得留不必说清的松弛。',
      wealth: '财从信息差与方案来，蛮干不如重算。',
      social: '人际里像军师：给主意，也容易过度解读。',
      self: '脑内安静时才真休息；清单比再想一轮有用。',
    },
    palaces: [
      { palaceId: '命宫', title: '命宫', hint: '我是谁', line: '身份感来自「想得通」。' },
      { palaceId: '官禄', title: '官禄宫', hint: '事业轨道', line: '职业吃策划与应变。' },
      { palaceId: '财帛', title: '财帛宫', hint: '资源处理', line: '资源处理靠算路，不靠硬撞。' },
      { palaceId: '夫妻', title: '夫妻宫', hint: '亲密惯性', line: '亲密惯性是沟通策略；温度要故意留。' },
      { palaceId: '福德', title: '福德宫', hint: '安全感与快乐', line: '安全感来自脑内有地图。' },
      { palaceId: '迁移', title: '迁移宫', hint: '外部评价场', line: '外部世界刺激新算法：换场能刷新。' },
    ],
    counsel: '想抓住所有分支时，先只选一条能在七天内验证的小路。',
  },
  太阴: {
    starId: '太阴',
    oneLiner: '它像温柔收纳世界的人：细腻、储蓄、夜里才真正醒着。',
    keywords: ['细腻', '储蓄', '感受', '夜'],
    metaphor: '月轮 + 静水镜湖 · 柔光收纳 · 玉光夜感',
    tags: { yinYang: '阴', wuxing: '水', dou: '南斗', huaqi: '财帛' },
    trait: {
      drive: '在安全里蓄能，再用感受连接世界。',
      gift: '共情、审美、细水长流的经营。',
      shadow: '退缩、潮汐情绪、把话吞回去。',
      need: '不被打断的节奏，和被懂的安全感。',
    },
    mirror: {
      work: '内容、设计、咨询、夜间创造：靠洞察与情绪价值。',
      love: '深、慢热；需要安全感托住才肯靠近。',
      wealth: '易通过储蓄、细节、审美与稳定经营积累。',
      social: '小圈深交；大场消耗大。',
      self: '独处与夜里是主场；喧闹后要充电。',
    },
    palaces: [
      { palaceId: '命宫', title: '命宫', hint: '我是谁', line: '自我从内侧慢慢亮。' },
      { palaceId: '官禄', title: '官禄宫', hint: '事业轨道', line: '事业宜细活与长线。' },
      { palaceId: '财帛', title: '财帛宫', hint: '资源处理', line: '资源处理偏蓄与经营。' },
      { palaceId: '夫妻', title: '夫妻宫', hint: '亲密惯性', line: '亲密惯性是深情与敏感。' },
      { palaceId: '福德', title: '福德宫', hint: '安全感与快乐', line: '福德是主场：仪式与安静能充满你。' },
      { palaceId: '迁移', title: '迁移宫', hint: '外部评价场', line: '外部评价场消耗大，外出后要回家。' },
    ],
    counsel: '想躲回壳里时，先告诉一个可信的人一句真实感受——比一个人消化更健康。',
  },
  破军: {
    starId: '破军',
    oneLiner: '它像敢把旧地图撕掉再画的人：破旧立新，先裂开再重组。',
    keywords: ['破旧立新', '敢拆', '敢冲', '重组'],
    metaphor: '破碎后重组的星门 · 裂开感 · 冲破旧结构',
    tags: { yinYang: '阴', wuxing: '水', dou: '北斗', huaqi: '耗' },
    trait: {
      drive: '突破感、改写旧局。',
      gift: '敢拆、敢换、敢重来。',
      shadow: '太猛、太急、先破后补。',
      need: '破完要立什么——清晰的下一版本。',
    },
    mirror: {
      work: '创业、改革、重构、开荒与转型。',
      love: '推进快、讨厌被困；承诺写成可迭代版本。',
      wealth: '财随变动来；忌空耗，拆旧渠前先画新渠。',
      social: '圈子流动快；稳定期要刻意练「停」。',
      self: '无聊是最大的苦；推进与重生最爽。',
    },
    palaces: [
      { palaceId: '命宫', title: '命宫', hint: '我是谁', line: '自我认同来自「我能改写」。' },
      { palaceId: '官禄', title: '官禄宫', hint: '事业轨道', line: '职业路径多变，适合更新与开荒。' },
      { palaceId: '财帛', title: '财帛宫', hint: '资源处理', line: '资源处理偏重组；防漏。' },
      { palaceId: '夫妻', title: '夫妻宫', hint: '亲密惯性', line: '亲密惯性是刺激与推进。' },
      { palaceId: '福德', title: '福德宫', hint: '安全感与快乐', line: '快乐来自断裂后的重生。' },
      { palaceId: '迁移', title: '迁移宫', hint: '外部评价场', line: '外部世界是试验场。' },
    ],
    counsel: '动手拆之前，先写下一句：破完我要立什么？写不出来就先别拆。',
  },
  贪狼: {
    starId: '贪狼',
    oneLiner:
      '它像一个天生会感应欲望与新鲜感的人，擅长吸引、连接、尝试，也容易因太多可能性而摇摆。',
    keywords: ['欲望', '吸引力', '好奇', '连接'],
    metaphor: '魅惑狐影 + 星雾尾迹 · 流光社交引力',
    tags: { yinYang: '阳', wuxing: '木', dou: '北斗', huaqi: '桃花' },
    trait: {
      drive: '追逐新鲜感与被吸引的感觉。',
      gift: '情商、连接、把场面玩热。',
      shadow: '贪多、摇摆、舍不得错过。',
      need: '真正想要的那一个，而不是全部可能性。',
    },
    mirror: {
      work: '演艺、公关、销售、美业：靠人脉与应变。',
      love: '丰富易纠缠；专一靠选择。',
      wealth: '财从人与机会来；忌空心热闹。',
      social: '引力强；圈子容易过载。',
      self: '快乐清单很长；要学会「够了就收」。',
    },
    palaces: [
      { palaceId: '命宫', title: '命宫', hint: '我是谁', line: '人格自带吸引力，也难被单一标签定义。' },
      { palaceId: '官禄', title: '官禄宫', hint: '事业轨道', line: '事业吃关系与变化。' },
      { palaceId: '财帛', title: '财帛宫', hint: '资源处理', line: '资源随人缘流动。' },
      { palaceId: '夫妻', title: '夫妻宫', hint: '亲密惯性', line: '亲密惯性是多情与尝试。' },
      { palaceId: '福德', title: '福德宫', hint: '安全感与快乐', line: '快乐来自新鲜与被吸引。' },
      { palaceId: '迁移', title: '迁移宫', hint: '外部评价场', line: '外部评价场桃花与机会多。' },
    ],
    counsel: '当你很想抓住所有可能性时，先问自己：你是真的想要，还是只是舍不得错过？',
  },
  七杀: {
    starId: '七杀',
    oneLiner: '它像敢开锋的力量：压力下更清醒，也容易孤独作战。',
    keywords: ['开锋', '魄力', '速度', '决断'],
    metaphor: '裂空流星 + 剑锋 · 杀气纹轨道',
    tags: { yinYang: '阴', wuxing: '金', dou: '北斗', huaqi: '将星' },
    trait: {
      drive: '打开局面，证明自己冲得动。',
      gift: '魄力、决断、危机推进。',
      shadow: '太快、缺缓冲、无人可托时硬刚。',
      need: '副手与后路——知道何时断、何时立。',
    },
    mirror: {
      work: '开拓、危机管理、竞争赛道。',
      love: '直接热烈；让对方有跟上的时间。',
      wealth: '财从快窗口来；要防孤注。',
      social: '像先锋：带得动人，也易落单。',
      self: '闲着像惩罚；打胜仗最充电。',
    },
    palaces: [
      { palaceId: '命宫', title: '命宫', hint: '我是谁', line: '自我在冲锋中成形。' },
      { palaceId: '官禄', title: '官禄宫', hint: '事业轨道', line: '事业宜开荒与攻坚。' },
      { palaceId: '财帛', title: '财帛宫', hint: '资源处理', line: '资源处理偏快决策。' },
      { palaceId: '夫妻', title: '夫妻宫', hint: '亲密惯性', line: '亲密惯性是推进与直接。' },
      { palaceId: '福德', title: '福德宫', hint: '安全感与快乐', line: '快乐来自胜负清晰。' },
      { palaceId: '迁移', title: '迁移宫', hint: '外部评价场', line: '外部世界像出征场。' },
    ],
    counsel: '强不是一直往前冲，而是你知道什么时候断，什么时候立。',
  },
};

function fallbackPalaces(card: StarCard): PalaceHit[] {
  return FOCUS_PALACES.map((p) => ({
    palaceId: p.id,
    title: p.title,
    hint: p.hint,
    line:
      p.id === '命宫'
        ? card.trait
        : p.id === '官禄' || p.id === '财帛'
          ? card.mirrorWork
          : p.id === '夫妻'
            ? card.mirrorLove
            : card.counsel,
  }));
}

function fallbackProfile(card: StarCard): StarProfile {
  return normalizeProfile({
    starId: card.id,
    oneLiner: card.portrait.slice(0, 42) + (card.portrait.length > 42 ? '…' : ''),
    keywords: [card.epithet, '力量', '原型', card.title].slice(0, 4),
    metaphor: card.myth,
    tags: { yinYang: '—', wuxing: '—', dou: '—', huaqi: '—' },
    essence: {
      drive: card.epithet,
      gift: card.trait,
      shadow: card.counsel,
      need: '被正确使用的舞台。',
      workStyle: card.mirrorWork,
      relationStyle: card.mirrorLove,
    },
    palaces: fallbackPalaces(card),
    counsel: card.counsel,
  });
}

export function getStarProfile(starId: string): StarProfile | undefined {
  const card = getStarLore(starId);
  if (!card) return undefined;
  const raw =
    DEMO[starId as MajorStarId] ??
    (MORE_PROFILES[starId as MajorStarId] as RawStarProfile | undefined);
  if (raw) return normalizeProfile(raw);
  return fallbackProfile(card);
}

export function listMajorProfiles(): StarProfile[] {
  return MAJOR_STARS.map((s) => getStarProfile(s.id)!);
}

/** @deprecated 旧 id 映射 */
export type StarEssence = StarTrait;
