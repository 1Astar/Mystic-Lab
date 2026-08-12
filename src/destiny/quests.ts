/**
 * 造命问问 · 高频问题 → 宫位 · 挑战向文案（忌/煞不直出）
 */

export type DestinyQuestId =
  | 'job_switch'
  | 'love_timing'
  | 'make_money'
  | 'stress'
  | 'move_city';

export type DestinyQuestDef = {
  id: DestinyQuestId;
  title: string;
  blurb: string;
  /** 主看宫位（紫微） */
  palace: string;
  /** 辅看宫位 */
  supportPalace?: string;
  keywords: string[];
  /** 白话结论模板；{stars} {hint} 可替换 */
  conclusionTpl: string;
  /** 本周小任务模板 */
  taskTpl: string;
  /** 破局提示（正面引导） */
  challengeTip: string;
};

export const DESTINY_QUESTS: DestinyQuestDef[] = [
  {
    id: 'job_switch',
    title: '我今年该不该跳槽？',
    blurb: '事业轨道 · 外部环境',
    palace: '官禄',
    supportPalace: '迁移',
    keywords: ['事业轨道', '角色', '换轨时机'],
    conclusionTpl:
      '先看官禄宫怎么定你的「专业身份」：主星 {stars}。{hint} 跳槽不是对错题，而是「这条轨道还能不能托住你想交付的东西」。',
    taskTpl:
      '本周写下：现在这份工作「最想留下的一件事」和「最想离开的一件事」各一句话；再约 30 分钟，只研究一个目标岗位的真实一天。',
    challengeTip: '若感到卡顿，把它当成「换轨前的体检」——先弄清要什么，再决定动不动。',
  },
  {
    id: 'love_timing',
    title: '我什么时候能遇到正缘？',
    blurb: '亲密关系 · 内心满足',
    palace: '夫妻',
    supportPalace: '福德',
    keywords: ['亲密', '节奏', '满足感'],
    conclusionTpl:
      '夫妻宫主星 {stars} 更像你的亲密惯性：{hint} 「正缘」常在你把期待说清楚之后才靠得更近，而不是干等一个日期。',
    taskTpl:
      '本周给自己留 1 次 40 分钟约会（可与自己）：列出「相处时我需要的三条约定」，发到备忘录；若有对象，挑一条温和地核对。',
    challengeTip: '若关系反复拉扯，当「边界练习」：把含糊改成可核对的小约定。',
  },
  {
    id: 'make_money',
    title: '近期如何搞钱？',
    blurb: '进账路径 · 蓄水纪律',
    palace: '财帛',
    supportPalace: '田宅',
    keywords: ['进账', '经营', '留存'],
    conclusionTpl:
      '财帛宫主星 {stars} 提示你的赚钱手法偏：{hint} 搞钱先找「清晰进账路径」，再谈扩张；留存靠纪律，不靠感觉。',
    taskTpl:
      '本周做一次「钱的体检」：列出近 30 天三笔最大支出；再开一个只进不出的小蓄水账户，先转入一笔你不心疼的金额。',
    challengeTip: '若觉得赚得快漏得也快，把破局点放在「蓄水池」而不是再开一条进账。',
  },
  {
    id: 'stress',
    title: '最近压力好大怎么办？',
    blurb: '身心负荷 · 修复',
    palace: '疾厄',
    supportPalace: '福德',
    keywords: ['负荷', '边界', '修复'],
    conclusionTpl:
      '疾厄宫像负荷仪表盘，主星 {stars}：{hint} 压力不是要硬扛到赢，而是学会何时降速、用什么方式回血。',
    taskTpl:
      '本周给自己留 2 小时独处（可拆成两次）：关掉工作通知，只记录「此刻身体哪里紧」和「一件让你感到被滋养的小事」。',
    challengeTip: '若容易过劳，把「休息」当成技能练习，而不是偷懒标签。',
  },
  {
    id: 'move_city',
    title: '换城市会不会更好？',
    blurb: '外出舞台 · 自我定调',
    palace: '迁移',
    supportPalace: '命宫',
    keywords: ['外出', '舞台', '自我'],
    conclusionTpl:
      '迁移宫主星 {stars} 描述你在外面怎么演：{hint} 换城市之前，先问「新环境能不能让我更像自己」，而不是只问薪资数字。',
    taskTpl:
      '本周做一次「城市对照」：选一个候选城市，列出「生活成本 / 行业密度 / 我认识的人」三栏各写两点；再问一位当地朋友真实一天是怎样的。',
    challengeTip: '若感到漂，先找一个「回得来的锚」（人、习惯或小据点），再谈远行。',
  },
];

export function getDestinyQuest(id: string): DestinyQuestDef | undefined {
  return DESTINY_QUESTS.find((q) => q.id === id);
}
