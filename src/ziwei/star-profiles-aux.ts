/**
 * 六吉 / 六煞 / 禄存天马 · curated 四屏 profile（对齐主星厚度）
 */
import type { RawStarProfile } from './star-profiles.ts';
import { AUX_STARS, getStarLore } from './stars.ts';

const FOCUS = [
  { id: '命宫', title: '命宫', hint: '我是谁' },
  { id: '官禄', title: '官禄宫', hint: '事业轨道' },
  { id: '财帛', title: '财帛宫', hint: '资源处理' },
  { id: '夫妻', title: '夫妻宫', hint: '亲密惯性' },
  { id: '福德', title: '福德宫', hint: '安全感与快乐' },
  { id: '迁移', title: '迁移宫', hint: '外部评价场' },
] as const;

function ph(lines: Partial<Record<(typeof FOCUS)[number]['id'], string>>): RawStarProfile['palaces'] {
  return FOCUS.map((p) => ({
    palaceId: p.id,
    title: p.title,
    hint: p.hint,
    line: lines[p.id] ?? `此宫见此星：把「${p.hint}」议题叠上这层辅色。`,
  }));
}

type AuxDraft = {
  keywords: string[];
  metaphor: string;
  tags: RawStarProfile['tags'];
  drive: string;
  gift: string;
  shadow: string;
  need: string;
  wealth: string;
  social: string;
  palaces?: Partial<Record<(typeof FOCUS)[number]['id'], string>>;
};

function build(id: string, d: AuxDraft): RawStarProfile {
  const card = getStarLore(id)!;
  return {
    starId: id,
    oneLiner: card.portrait.length > 48 ? `${card.portrait.slice(0, 46)}…` : card.portrait,
    keywords: d.keywords.slice(0, 4),
    metaphor: d.metaphor,
    tags: d.tags,
    counsel: card.counsel,
    essence: {
      drive: d.drive,
      gift: d.gift,
      shadow: d.shadow,
      need: d.need,
      workStyle: card.mirrorWork,
      relationStyle: card.mirrorLove,
      strengths: d.gift,
      shadows: d.shadow,
      cares: d.need,
      fears: d.shadow,
    },
    mirror: {
      work: card.mirrorWork,
      love: card.mirrorLove,
      wealth: d.wealth,
      social: d.social,
      self: card.counsel,
    },
    palaces: ph(d.palaces ?? {}),
  };
}

/** 与 AUX_STARS 对齐的 curated 表 */
export const AUX_PROFILES: Record<string, RawStarProfile> = {
  左辅: build('左辅', {
    keywords: ['成全', '补位', '侧翼', '贵人'],
    metaphor: '侧翼参谋 · 青鸾托羽',
    tags: { yinYang: '阳', wuxing: '土', dou: '—', huaqi: '贵人' },
    drive: '把缺口补上，让主场的人站得住。',
    gift: '协作、成全、默契补位；场面有你更稳。',
    shadow: '永远当配角，忘了自己也可以主场。',
    need: '被允许偶尔站 C 位，而不是只被需要。',
    wealth: '财从协作与合伙来；独吞局不合拍。',
    social: '朋友圈里是可靠补位者；学会提需求。',
    palaces: {
      命宫: '自我认同常绑在「我能帮上忙」：被需要才安心。',
      官禄: '事业像参谋/搭档岗：成全老板或团队更顺。',
      夫妻: '亲密里爱托底；别把伴侣养成离不开你的人。',
    },
  }),
  右弼: build('右弼', {
    keywords: ['缝合', '斡旋', '人脉', '调和'],
    metaphor: '穿帘紫燕 · 缝隙修补者',
    tags: { yinYang: '阴', wuxing: '水', dou: '—', huaqi: '贵人' },
    drive: '把断裂的关系与事务重新缝上。',
    gift: '斡旋、对接、资源缝合；人脉是隐性武器。',
    shadow: '修到没边界，把自己缝进别人的局。',
    need: '清晰的「这次谁主场」约定。',
    wealth: '财从牵线与整合来；抽成与边界要写清。',
    social: '天然润滑剂；注意别被当传话筒消耗。',
  }),
  文昌: build('文昌', {
    keywords: ['文书', '科名', '结构', '证书'],
    metaphor: '执笔金乌 · 答卷上的金光',
    tags: { yinYang: '阳', wuxing: '金', dou: '—', huaqi: '科名' },
    drive: '把想法落成可被看见的文字与体系。',
    gift: '考试、方案、知识产品；结构感强。',
    shadow: '只写不练，纸上漂亮、落地慢。',
    need: '作品被发出去、得到真实反馈。',
    wealth: '稿酬、课程、认证路径更亮。',
    social: '靠文采与条理赢得尊重；少炫才压人。',
  }),
  文曲: build('文曲', {
    keywords: ['巧思', '表达', '艺感', '临场'],
    metaphor: '持笛墨仙 · 能拐弯的音符',
    tags: { yinYang: '阴', wuxing: '水', dou: '—', huaqi: '才艺' },
    drive: '把复杂事讲得漂亮、有戏。',
    gift: '创意、内容、临场应变；表达有韵。',
    shadow: '说得太美、承诺虚；轻浮感。',
    need: '巧思必须落地成一件可交付物。',
    wealth: '创意变现、口播、策划费更合拍。',
    social: '魅力加分；重要约定写清楚。',
  }),
  天魁: build('天魁', {
    keywords: ['阳贵', '提携', '公开', '背书'],
    metaphor: '白日贵人 · 朝服上的提携印',
    tags: { yinYang: '阳', wuxing: '火', dou: '—', huaqi: '贵人' },
    drive: '在公开场被看见、被提拔。',
    gift: '长辈/上司缘、体制与公开赛道更顺。',
    shadow: '空等贵人，自己不准备。',
    need: '可被看见的作品与履历。',
    wealth: '背书与公开机会带资源。',
    social: '易遇提携者；别把贵人当父母。',
  }),
  天钺: build('天钺', {
    keywords: ['阴贵', '暗助', '内圈', '信任'],
    metaphor: '月下贵人 · 灯笼里的路条',
    tags: { yinYang: '阴', wuxing: '土', dou: '—', huaqi: '贵人' },
    drive: '靠私下信任与情报推进。',
    gift: '内圈资源、一对一顾问型路径。',
    shadow: '人情想太满，暗助变纠葛。',
    need: '守口与互信的小圈子。',
    wealth: '社群与内推型变现更亮。',
    social: '贵人缘柔；重信任轻炫耀。',
  }),
  擎羊: build('擎羊', {
    keywords: ['锋利', '冲开', '试炼', '决断'],
    metaphor: '先劈开局面的刀',
    tags: { yinYang: '阳', wuxing: '金', dou: '—', huaqi: '煞' },
    drive: '切开僵局，逼出结果。',
    gift: '抗压、决断、在难局里开路。',
    shadow: '伤人伤己，为爽感而砍。',
    need: '刀口对准问题，不是对准人。',
    wealth: '高压变现、危机单；投机易血刃。',
    social: '直、狠、清；边界要先说。',
  }),
  陀罗: build('陀罗', {
    keywords: ['纠缠', '拖延', '细耗', '胶着'],
    metaphor: '缠住脚步的绳',
    tags: { yinYang: '阴', wuxing: '金', dou: '—', huaqi: '煞' },
    drive: '把事拖进细节里反复磨。',
    gift: '耐心攻坚、风控意识、不怕慢活。',
    shadow: '内耗、拖延、关系胶着难断。',
    need: '可结束的期限与止损线。',
    wealth: '细账与长期债题更响；防泥潭投资。',
    social: '易纠缠；学会干净告别。',
  }),
  火星: build('火星', {
    keywords: ['爆发', '点火', '急躁', '速度'],
    metaphor: '一点就着的火种',
    tags: { yinYang: '阳', wuxing: '火', dou: '—', huaqi: '煞' },
    drive: '快速启动，点燃场面。',
    gift: '爆发力、感染力、启动快。',
    shadow: '急躁、口舌、烧掉耐心。',
    need: '冲之前的冷静缓冲。',
    wealth: '风口单、短线热度；防冲动下单。',
    social: '气场热；别用火气推人。',
  }),
  铃星: build('铃星', {
    keywords: ['暗火', '焦虑', '响铃', '紧绷'],
    metaphor: '夜里突然响起的铃',
    tags: { yinYang: '阴', wuxing: '火', dou: '—', huaqi: '煞' },
    drive: '用紧绷感提醒「有事要处理」。',
    gift: '危机嗅觉、夜战耐力、细处警觉。',
    shadow: '焦虑、暗耗、睡眠与口舌。',
    need: '可落地的安放动作，不只报警。',
    wealth: '防暗亏与手续费式损耗。',
    social: '易紧绷；沟通先降温。',
  }),
  地空: build('地空', {
    keywords: ['抽空', '破妄', '虚名', '过滤器'],
    metaphor: '虚空法螺 · 期待落空',
    tags: { yinYang: '阳', wuxing: '火', dou: '—', huaqi: '空' },
    drive: '看破虚名，只留抓得住的。',
    gift: '洞察、断舍离、少被表象骗。',
    shadow: '虚无、不投入、机会也空过。',
    need: '每周一件可核对的落地事。',
    wealth: '投资要可验证；防空气项目。',
    social: '怕空头支票；少开过度承诺。',
  }),
  地劫: build('地劫', {
    keywords: ['打断', '波折', '重组', '止血'],
    metaphor: '逼你改道的烽燧',
    tags: { yinYang: '阴', wuxing: '火', dou: '—', huaqi: '劫' },
    drive: '用突发打断逼你重组节奏。',
    gift: '危机意识、应急、风控课题。',
    shadow: '被意外打乱，空耗理想。',
    need: '先止血再谈理想。',
    wealth: '保险与备份意识；投机收敛。',
    social: '怕突发变故；关系留沟通备份。',
  }),
  禄存: build('禄存', {
    keywords: ['财库', '储蓄', '稳健', '安全感'],
    metaphor: '金蟾守库 · 未散的禄',
    tags: { yinYang: '阳', wuxing: '土', dou: '—', huaqi: '禄' },
    drive: '手里有粮，安全感才落地。',
    gift: '储蓄、现金流纪律、长期复利。',
    shadow: '守得太紧，该投不投。',
    need: '「可动用 / 不动用」两格分明。',
    wealth: '库的主题本座；稳健理财更合拍。',
    social: '物质安全感重要；别用钱替代亲密。',
    palaces: {
      财帛: '库落财帛：理财与储蓄直觉强，防死守。',
      福德: '心里有粮才快乐；也要允许适度享受。房产/固定资产议题也可叠看。',
      命宫: '自我安全感绑在「手里有粮」；别把钱当唯一自我。',
    },
  }),
  天马: build('天马', {
    keywords: ['奔走', '变动', '出行', '动财'],
    metaphor: '四蹄生风的驿马',
    tags: { yinYang: '阳', wuxing: '火', dou: '—', huaqi: '动' },
    drive: '用移动换空间与机会。',
    gift: '出差、迁徙、贸易、打开新局。',
    shadow: '为动而动，根不稳。',
    need: '动之前先定回程锚。',
    wealth: '动中生财；物流与跨地业务更亮。',
    social: '人在旅途缘分多；关系要可远程维持。',
    palaces: {
      迁移: '马在迁：外出、迁居、外地发展题更响。',
      命宫: '坐命天马：闲不住，适合移动型人生。',
      财帛: '动财：现金流跟着脚步走。',
    },
  }),
};

/** 确保 AUX_STARS 都有条目（缺则从卡面兜底生成） */
for (const s of AUX_STARS) {
  if (!AUX_PROFILES[s.id]) {
    AUX_PROFILES[s.id] = build(s.id, {
      keywords: [s.epithet, s.title, '辅曜', '色调'],
      metaphor: s.myth,
      tags: { yinYang: '—', wuxing: '—', dou: '—', huaqi: '辅' },
      drive: s.epithet,
      gift: s.trait,
      shadow: s.counsel,
      need: '被正确使用的舞台。',
      wealth: '财富面向随落宫与主星而变。',
      social: s.mirrorLove,
    });
  }
}
