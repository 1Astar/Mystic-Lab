/**
 * 杂曜短释义：主星/辅星图鉴未收录时的底库
 * 力量轻于主辅星，作色调与提醒，不抢主戏
 */

export type MinorStarLore = {
  id: string;
  epithet: string;
  oneLiner: string;
  traditional: string;
};

export const MINOR_STAR_LORE: MinorStarLore[] = [
  {
    id: '天使',
    epithet: '解厄',
    oneLiner: '小吉星：暗中解困、化险，像有人悄悄递梯子。',
    traditional:
      '天使属杂曜吉星，主解厄、逢凶化吉与暗助。力道轻于主星、辅星，是「加分提醒」而非主戏。\n落疾厄：身心议题里更易碰到疗愈、医护或自我修复的转机；仍以本宫主星（及三方四正）为主。',
  },
  {
    id: '天伤',
    epithet: '耗损提醒',
    oneLiner: '提醒耗损与摩擦的小星，逼你留意身体与边界。',
    traditional:
      '天伤属杂曜，常作耗损、摩擦或受伤风险的提醒，不是判死刑。\n落疾厄：更要看作息、情绪出口与就医节奏；同宫主星决定戏怎么演，天伤只是字幕警告。',
  },
  {
    id: '天寿',
    epithet: '延守',
    oneLiner: '偏护持与续命感的小星，提醒「留得青山」。',
    traditional:
      '天寿杂曜，传统多主寿元、护持与细水长流。力轻，宜与疾厄、父母等宫同看，不单独夸张。',
  },
  {
    id: '天哭',
    epithet: '感伤',
    oneLiner: '情绪易往里沉的小色调，提醒允许难过、也要找出口。',
    traditional:
      '天哭杂曜，传统多主愁绪、感伤。落宫处情绪更敏感；不是注定哭，是提醒别硬撑。',
  },
  {
    id: '天虚',
    epithet: '落空感',
    oneLiner: '带一点空、飘、计划易虚的色调。',
    traditional:
      '天虚杂曜，传统多主虚耗、名实落差。落宫处宜把期待写小、把步骤写实。',
  },
  {
    id: '龙池',
    epithet: '才艺池',
    oneLiner: '才艺、审美与被看见的小光斑。',
    traditional:
      '龙池杂曜，多主才艺、文采或仪表光彩。力量轻，适合当兴趣与表达的加分项。',
  },
  {
    id: '凤阁',
    epithet: '文采阁',
    oneLiner: '风度、文书与品位的小点缀。',
    traditional:
      '凤阁杂曜，多主文采、礼仪与外形气质。与龙池常并称，作审美与表达的细部色调。',
  },
  {
    id: '红鸾',
    epithet: '喜缘',
    oneLiner: '桃花与喜事的气色星，易遇情感波动或喜庆。',
    traditional:
      '红鸾杂曜，主桃花、喜庆与情感波动。落哪宫，哪领域更易「动心或办喜事」；仍看主星定性格。',
  },
  {
    id: '天喜',
    epithet: '喜气',
    oneLiner: '喜庆、人缘与轻松气场的小星。',
    traditional:
      '天喜杂曜，主喜庆、人缘与欢洽。常与红鸾对看；落宫处气氛偏暖，仍要主星定深浅。',
  },
  {
    id: '孤辰',
    epithet: '独处',
    oneLiner: '偏独立、少纠缠的气质提醒。',
    traditional:
      '孤辰杂曜，传统主孤独、自立。不是没人缘，是更习惯自己扛；落宫处关系宜留白。',
  },
  {
    id: '寡宿',
    epithet: '清减',
    oneLiner: '偏清淡、少热闹的相处色调。',
    traditional:
      '寡宿杂曜，与孤辰常并论，主清减、少群。落宫处社交可精简，质量重于数量。',
  },
  {
    id: '华盖',
    epithet: '灵韵',
    oneLiner: '孤高、灵性与艺术气的小冠。',
    traditional:
      '华盖杂曜，多主宗教、艺术、清高或思想世界。落宫处宜给独处与创作空间。',
  },
  {
    id: '天姚',
    epithet: '魅色',
    oneLiner: '魅力、暧昧与感官吸引力的小星。',
    traditional:
      '天姚杂曜，主桃花、魅力与感官吸引力。落宫处易引人注目；边界要自己设。',
  },
  {
    id: '咸池',
    epithet: '情欲池',
    oneLiner: '欲望与吸引力更显的色调。',
    traditional:
      '咸池杂曜，传统多主桃花、欲望。落宫处感情戏更浓；克制与诚实比压抑有用。',
  },
  {
    id: '天刑',
    epithet: '规矩刃',
    oneLiner: '规矩、是非与压力感更明显的提醒。',
    traditional:
      '天刑杂曜，多主刑克、规矩、官非或自我苛责。落宫处宜把规则谈清楚，少硬刚。',
  },
  {
    id: '阴煞',
    epithet: '暗耗',
    oneLiner: '暗处摩擦或小人气场的细部提醒。',
    traditional:
      '阴煞杂曜，传统多主暗耗、小人或隐性阻力。落宫处多核对、少猜疑升级；证据优先于脑补。',
  },
  {
    id: '解神',
    epithet: '开解',
    oneLiner: '事缓则圆、有人帮解扣的小吉色。',
    traditional:
      '解神主开解、缓解。落宫处僵局更易被谈开；仍要自己开口，神煞不代劳。',
  },
  {
    id: '天巫',
    epithet: '术数感',
    oneLiner: '对仪式、玄学、非常规方法更敏感的色调。',
    traditional:
      '天巫传统多主巫医、术数、非常规技艺。落疾厄/福德等，可作兴趣或职业旁支提示。',
  },
  {
    id: '天月',
    epithet: '病色',
    oneLiner: '身心议题更需关照的细部提醒（非确诊）。',
    traditional:
      '天月杂曜传统与疾厄关联较多。见之先改善作息与就医节奏，勿自行恐吓。',
  },
  {
    id: '三台',
    epithet: '台阁',
    oneLiner: '职位、台面、被抬举的细部贵气。',
    traditional:
      '三台多主贵气、台阁。与八座并见时，公开场被看见的机会略增。',
  },
  {
    id: '八座',
    epithet: '座驾',
    oneLiner: '托举、座位、资源垫脚的小贵人色。',
    traditional:
      '八座与三台常并称，主贵人托举。落官禄/迁移，公开履历更易「有台阶」。',
  },
  {
    id: '恩光',
    epithet: '恩泽',
    oneLiner: '被提携、承恩、贵人记功的气色。',
    traditional:
      '恩光主恩泽、提携。适合主动汇报成果，让贵人知道你的名字。',
  },
  {
    id: '天贵',
    epithet: '清贵',
    oneLiner: '清贵、体面、不宜脏活烂仗的气质提醒。',
    traditional:
      '天贵杂曜主清贵。落命/官禄，形象管理与体面路径更合；撕逼战损大。',
  },
  {
    id: '台辅',
    epithet: '辅弼台',
    oneLiner: '辅政、幕僚、成全型贵气（轻于左辅右弼）。',
    traditional:
      '台辅力轻，偏幕僚成全。与左辅右弼同宫时，贵人成局意味更浓。',
  },
  {
    id: '封诰',
    epithet: '名诰',
    oneLiner: '名分、证书、被正式认定的细部吉色。',
    traditional:
      '封诰主名诰、认定。考证、授勋、公开任命类窗口略亮。',
  },
];

export function getMinorStarLore(name: string): MinorStarLore | undefined {
  const raw = name.trim();
  if (!raw) return undefined;
  const stripped = raw.replace(/星$/, '').trim();
  return (
    MINOR_STAR_LORE.find((s) => s.id === raw) ??
    (stripped && stripped !== raw
      ? MINOR_STAR_LORE.find((s) => s.id === stripped)
      : undefined) ??
    MINOR_STAR_LORE.find((s) => raw.startsWith(s.id) || stripped.startsWith(s.id))
  );
}
