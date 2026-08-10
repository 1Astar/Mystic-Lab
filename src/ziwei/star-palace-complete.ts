/**
 * 主星落十二宫：补全句库（已有专句优先，缺的用模板填满）
 * 独立文件避免与 star-profiles 循环依赖
 */
import type { StarCard } from './stars.ts';

export type PalaceHitLine = {
  palaceId: string;
  title: string;
  hint: string;
  line: string;
};

export const TWELVE_PALACE_META: Array<{ id: string; title: string; hint: string }> = [
  { id: '命宫', title: '命宫', hint: '我是谁' },
  { id: '兄弟', title: '兄弟宫', hint: '同辈伙伴' },
  { id: '夫妻', title: '夫妻宫', hint: '亲密惯性' },
  { id: '子女', title: '子女宫', hint: '创造延续' },
  { id: '财帛', title: '财帛宫', hint: '资源处理' },
  { id: '疾厄', title: '疾厄宫', hint: '身心边界' },
  { id: '迁移', title: '迁移宫', hint: '外部评价场' },
  { id: '仆役', title: '奴仆宫', hint: '协作圈子' },
  { id: '官禄', title: '官禄宫', hint: '事业轨道' },
  { id: '田宅', title: '田宅宫', hint: '安稳根基' },
  { id: '福德', title: '福德宫', hint: '快乐系统' },
  { id: '父母', title: '父母宫', hint: '规则支持' },
];

function normKey(id: string): string {
  return id.replace(/宫$/, '').replace(/^奴仆$/, '仆役').replace(/^交友$/, '仆役');
}

function templateLine(starName: string, palaceKey: string, card: StarCard): string {
  const s = starName;
  const epithet = card.epithet;
  switch (palaceKey) {
    case '命':
    case '命宫':
      return `${s}坐命：人设自带「${epithet}」底色，别人先读到这层气质。`;
    case '兄弟':
      return `${s}在兄弟：同辈协作里显「${epithet}」——并肩或较劲都更鲜明。`;
    case '夫妻':
      return `${s}在夫妻：亲密惯性贴近「${epithet}」——${card.mirrorLove.slice(0, 36)}${card.mirrorLove.length > 36 ? '…' : ''}`;
    case '子女':
      return `${s}在子女：创造、作品或子代议题上，发挥方式偏「${epithet}」。`;
    case '财帛':
      return `${s}在财帛：资源进出带「${epithet}」手法——${card.mirrorWork.slice(0, 36)}${card.mirrorWork.length > 36 ? '…' : ''}`;
    case '疾厄':
      return `${s}在疾厄：身心负荷与压力出口，要按「${epithet}」的节奏管理，别硬扛反模式。`;
    case '迁移':
      return `${s}在迁移：外面世界如何看见你，常放大「${epithet}」这一面。`;
    case '仆役':
    case '奴仆':
    case '交友':
      return `${s}在交友/仆役：圈子与协作网里，你扮演「${epithet}」式角色。`;
    case '官禄':
      return `${s}在官禄：事业轨道吃「${epithet}」——${card.mirrorWork.slice(0, 36)}${card.mirrorWork.length > 36 ? '…' : ''}`;
    case '田宅':
      return `${s}在田宅：家与安全感的营造方式，带「${epithet}」痕迹。`;
    case '福德':
      return `${s}在福德：快乐算法贴近「${epithet}」——${card.counsel.slice(0, 36)}${card.counsel.length > 36 ? '…' : ''}`;
    case '父母':
      return `${s}在父母：长辈/规则/支持系统里，议题常绕「${epithet}」展开。`;
    default:
      return `${s}落此宫：以「${epithet}」理解该场域即可，再叠四化与会照。`;
  }
}

const EXTRA: Partial<Record<string, Partial<Record<string, string>>>> = {
  紫微: {
    兄弟: '紫微在兄弟：同辈里易成主心骨，也易被推去扛事。',
    子女: '紫微在子女：作品与传承要有「殿堂感」——质量重于数量。',
    疾厄: '紫微在疾厄：压力来自包袱；学会交出去，身体才松。',
    仆役: '紫微在交友：圈子围着你转；防只剩角色没有朋友。',
    田宅: '紫微在田宅：家要有秩序与尊严，像微型朝廷。',
    父母: '紫微在父母：权威议题重；继承规则也要问是否仍适合你。',
  },
  天机: {
    兄弟: '天机在兄弟：同辈像智囊团，也易互相算计——把竞争改成分工。',
    子女: '天机在子女：创作多点子；先交付最小成品再迭代。',
    疾厄: '天机在疾厄：脑疲劳是主伤；睡眠与停机比补剂重要。',
    仆役: '天机在交友：贵人是「给路线图的人」。',
    田宅: '天机在田宅：家是思维实验室，也要有收纳信息的角落。',
    父母: '天机在父母：规则被你重算；与长辈沟通用方案不是抬杠。',
  },
  贪狼: {
    兄弟: '贪狼在兄弟：伙伴局热闹，防利益与暧昧搅在一起。',
    子女: '贪狼在子女：创造力强、项目多；专一交付是课题。',
    疾厄: '贪狼在疾厄：欲与睡眠、成瘾边缘要设闸。',
    仆役: '贪狼在交友：人脉即舞台；名单要精简。',
    田宅: '贪狼在田宅：家像沙龙；安稳感要另建锚点。',
    父母: '贪狼在父母：家风议题里欲望与规矩易拉扯。',
  },
  破军: {
    兄弟: '破军在兄弟：同辈关系变动快，分合都干脆。',
    子女: '破军在子女：作品常推倒重来；保留一版可交付的最小成品。',
    疾厄: '破军在疾厄：透支后大修；改建生活前先保睡眠。',
    仆役: '破军在交友：圈子迭代快；旧人未必差，是场变了。',
    田宅: '破军在田宅：家常搬迁或重装；安稳感要可携带。',
    父母: '破军在父母：与权威易「破旧规」；说明新规再拆。',
  },
  七杀: {
    兄弟: '七杀在兄弟：平级里像先锋，也易孤独；找可托后背的人。',
    子女: '七杀在子女：创造偏攻坚项目；别同时开太多前线。',
    疾厄: '七杀在疾厄：压力下更醒，也更伤；学会收刀。',
    仆役: '七杀在交友：带得动小队，也易落单作战。',
    田宅: '七杀在田宅：家像前哨站，功能优先于精致。',
    父母: '七杀在父母：权威冲突时易硬刚；选战场再出手。',
  },
};

export function completePalaceHits(
  starId: string,
  existing: PalaceHitLine[],
  card: StarCard,
): PalaceHitLine[] {
  const map = new Map<string, PalaceHitLine>();
  for (const h of existing) {
    map.set(normKey(h.palaceId), h);
    map.set(normKey(h.title), h);
  }
  const extras = EXTRA[starId.replace(/星$/, '')] ?? {};

  return TWELVE_PALACE_META.map((meta) => {
    const key = normKey(meta.id);
    const prev = map.get(key);
    if (prev?.line) {
      return {
        palaceId: meta.id,
        title: meta.title,
        hint: meta.hint,
        line: prev.line,
      };
    }
    const special = extras[key] ?? extras[meta.id];
    return {
      palaceId: meta.id,
      title: meta.title,
      hint: meta.hint,
      line: special ?? templateLine(starId, key, card),
    };
  });
}
