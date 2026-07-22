import type {
  FiveYearArchive,
  LifePortrait,
  LifeProfileInput,
  ParallelWorld,
} from './types.ts';

function pickBySeed<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length]!;
}

function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return h;
}

function ageBand(ageRaw: string): 'early' | 'mid' | 'later' | 'open' {
  const n = Number.parseInt(ageRaw, 10);
  if (!Number.isFinite(n)) return 'open';
  if (n < 28) return 'early';
  if (n < 40) return 'mid';
  return 'later';
}

/** 本地模板：结合填写信息的现状推演（探索叙事，非断语） */
export function buildTemplatePortrait(profile: LifeProfileInput): LifePortrait {
  const seed = hashSeed(
    [
      profile.age,
      profile.occupation,
      profile.city,
      profile.confusion,
      profile.birthYear,
      profile.birthMonth,
      profile.birthDay,
    ].join('|'),
  );
  const band = ageBand(profile.age);
  const occ = profile.occupation.trim() || '当下的工作节奏';
  const city = profile.city.trim() || '当前所在的城市';
  const confusion = profile.confusion.trim() || '某种尚未说清的犹豫';

  const tendencyPools = [
    ['外柔内坚', '对变化敏感', '重视关系里的安全感'],
    ['行动优先', '讨厌空转', '愿意为长期结果忍耐'],
    ['观察力强', '先想清楚再动', '对「意义感」要求高'],
    ['适应力好', '容易接下他人期待', '需要定期给自己留白'],
  ];
  const themePools = [
    ['稳定与突破的拉扯', '自我定义重新书写', '资源从「够用」到「有余」'],
    ['技能复利', '圈子升级', '情绪边界'],
    ['城市与归属', '节奏重塑', '把困惑变成可验证的小实验'],
  ];

  const stageByBand: Record<typeof band, { title: string; summary: string }> = {
    early: {
      title: '起步校准期',
      summary: `你大概还在用真实反馈校准方向：${occ}是主场，${city}提供场景，而「${confusion}」像一枚提示牌——提醒你别只积累忙碌，也要留下可回看的选择记录。`,
    },
    mid: {
      title: '承重与重配期',
      summary: `这一阶段常同时扛着职责与自我更新：${occ}带来可见成果，也带来惯性。在${city}，你对「${confusion}」的感受更像对轨迹的微调需求，而不是单纯焦虑。`,
    },
    later: {
      title: '整合与取舍期',
      summary: `经验已足够支撑判断，真正难的是舍弃：${occ}未必再是唯一身份。${city}的生活节奏，与「${confusion}」一起，在催你把精力投向更长线的意义与关系。`,
    },
    open: {
      title: '自我对照期',
      summary: `把已填信息当作一面镜子：围绕${occ}与${city}，你正在用「${confusion}」标出当下真正在意的轴。倾向不等于命运，只是方便你对照下一步小实验。`,
    },
  };

  const stage = stageByBand[band];
  const tendencies = pickBySeed(tendencyPools, seed);
  const themes = pickBySeed(themePools, seed + 3);

  return {
    tendencies: [...tendencies],
    themes: [...themes],
    stageTitle: stage.title,
    stageSummary: stage.summary,
    stageHints: [
      `用一周记录：与「${confusion}」相关的触发时刻`,
      `在${city}找一个低成本对照实验（不必立刻大改）`,
      `把${occ}里已验证的能力写成三条可迁移清单`,
    ],
    source: 'template',
    generatedAt: new Date().toISOString(),
  };
}

export function buildTemplateArchive(
  profile: LifeProfileInput,
  world: Pick<ParallelWorld, 'id' | 'divergence'>,
): FiveYearArchive {
  const occ = profile.occupation.trim() || '原赛道';
  const city = profile.city.trim() || '原城市';
  const seed = hashSeed(`${world.id}|${world.divergence}|${occ}|${city}`);

  const scripts: Record<
    string,
    Omit<FiveYearArchive, 'source'>
  > = {
    stay: {
      title: '稳定复利线',
      summary: `五年后，你仍在熟悉的组织里，但角色更深：${occ}的专业厚度变成议价权，「没辞职」换来的是可回看的积累，而非停滞。`,
      work: `职责上移一层；仍偶有倦怠，但你更会用边界保护精力。`,
      lifestyle: `${city}的生活更可预期；固定支出与仪式感并存。`,
      relationships: `旧同事成为长期同盟；亲友更常听到你「慢慢来」的选择。`,
      growth: `最大成长是把「留下」从被动变成主动策略。`,
      tone: '沉稳 · 可复盘',
    },
    bigtech: {
      title: '高强度跃迁线',
      summary: `五年后，你带着大厂协作与交付语汇回看今天：节奏更快，视野更宽，也更清楚自己能承受什么压力。`,
      work: `项目复杂度上升；头衔未必华丽，但作品集更硬。`,
      lifestyle: `可能换城或通勤拉长；健康需要刻意排程。`,
      relationships: `新圈子扩张，旧关系需主动维护。`,
      growth: `学会在系统里找杠杆，而不是只靠加班证明价值。`,
      tone: '锋利 · 扩展',
    },
    startup: {
      title: '不确定创造线',
      summary: `五年后，「创业的我」更像一段自我经营史：收入波动仍在，但你拥有可讲述的产品故事与决策疤痕。`,
      work: `从执行者变成对结果负责的人；失败与小胜交替。`,
      lifestyle: `作息不规则；自由与焦虑同桌。`,
      relationships: `同路人变少但更铁；家人态度随阶段起伏。`,
      growth: `最大资产是抗不确定性与叙事能力。`,
      tone: '冒险 · 鲜活',
    },
    abroad: {
      title: '语境重塑线',
      summary: `五年后，你在另一种语言与规则里重建日常：${city}成为对照点，身份更混杂，也更自洽。`,
      work: `职业可能平移或降维重启，但跨文化协作成为优势。`,
      lifestyle: `搬家、签证、季节感改变生活节奏。`,
      relationships: `远距维系与本地新连接并行。`,
      growth: `学会在陌生里找归属，而不急着证明对错。`,
      tone: '辽阔 · 重置',
    },
    hometown: {
      title: '根系重连线',
      summary: `五年后，你把节奏降下来：与土地、家人、旧识重新连接，事业未必最响，但生活感更密。`,
      work: `可能转本地机会或远程；名气换空间。`,
      lifestyle: `${city}的喧闹被日常替代；开销结构改变。`,
      relationships: `家庭戏份加重；旧友重逢带来对照。`,
      growth: `学会用「够」定义成功，而不是只追外部坐标。`,
      tone: '安稳 · 回声',
    },
    passion: {
      title: '热爱变现线',
      summary: `五年后，热爱不再只是周末消遣：它占日历、占收入结构，也占你如何介绍自己。`,
      work: `作品与口碑慢慢成形；早期收入不稳。`,
      lifestyle: `时间更弹性，也更需要自律。`,
      relationships: `同好社群变强；部分旧期待需重新谈判。`,
      growth: `把热情拆成可交付物，是这五年的主课。`,
      tone: '热 · 未完成',
    },
  };

  const fallback: Omit<FiveYearArchive, 'source'> = {
    title: '分叉对照线',
    summary: `若沿着「${world.divergence}」走五年：你会用另一套日常证明同一份性格。与今天的${occ}相比，变化更多发生在优先级，而不只是地点。`,
    work: `工作形态随分叉改写；能力仍可迁移。`,
    lifestyle: `生活节奏重新编排；${city}可能不再是唯一锚点。`,
    relationships: `关系圈按新选择重组。`,
    growth: `五年后你更能说清：什么是想要的，什么只是惯性。`,
    tone: pickBySeed(['对照 · 清醒', '实验 · 柔韧', '分叉 · 可回看'], seed),
  };

  const base = scripts[world.id] ?? fallback;
  return { ...base, source: 'template' };
}
