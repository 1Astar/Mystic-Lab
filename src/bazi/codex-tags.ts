import {
  branchHideStems,
  stemTenGod,
  type BaziChart,
} from './cast.ts';
import { TEN_GOD_PLAIN } from './learn-steps.ts';
import {
  shenshaHintsForBranch,
  shenshaHintsForStem,
} from './shensha.ts';
import { STEM_LORE } from './codex-lore.ts';

export type TagKind = 'shensha' | 'tengod';

export type CodexTag = {
  kind: TagKind;
  /** 传统名 */
  name: string;
  /** 现代短标签 */
  modern: string;
  /** 一句话印象 */
  impression: string;
  /** 位置 / 怎么看见 */
  where: string;
  /** 副作用 / 注意 */
  trap: string;
  /** 是否在当前命盘遇见过 */
  met?: boolean;
};

/** 星煞 / 十神独立图鉴卡 */
export type StarCardLore = CodexTag & {
  /** 存储 id：ss:天乙贵人 / tg:正官 */
  id: string;
  zone: 'auspicious' | 'mixed' | 'tengod';
  glyph: string;
};

export function shenshaCardId(name: string): string {
  return `ss:${name}`;
}

export function tengodCardId(name: string): string {
  return `tg:${name}`;
}

const SHENSHA_LORE: Record<
  string,
  Omit<CodexTag, 'kind' | 'name' | 'met'>
> = {
  天乙贵人: {
    modern: '贵人之星',
    impression:
      '当你在黑暗中迷路时，突然有一束光指引你走出困境——逢凶化吉，关键时刻总有人相助。',
    where: '多落在日柱或时柱附近。中年或晚年遇大坎时，常有意想不到的大人物出手。',
    trap: '它是「逢凶化吉」，不是天上掉馅饼。往往要先经历一难，贵人才显形——别因为有它就懈怠。',
  },
  文昌: {
    modern: '学业才华之星',
    impression: '你的灵感如箭，能瞬间命中正确答案；逢考易过，文字与机智常在。',
    where: '看日干对应的文昌落在哪一支；常与学业、文书、表达相关。',
    trap: '聪明不等于落地。文昌旺却不练手，容易停留在「想得很清楚、做得很少」。',
  },
  禄神: {
    modern: '稳定根基',
    impression: '身上带着能站住、能吃饭的底气。',
    where: '日干之禄落在对应地支；多主衣食与基本盘。',
    trap: '禄在不等于躺平。根基要用来积累，而不是当成「怎么都行」的借口。',
  },
  羊刃: {
    modern: '极端刚烈之星',
    impression: '自带极强爆发力与果决；锋利感强，敢冲，也容易刺人。',
    where: '日干羊刃落支；常见于性格与抗压面。',
    trap: '出鞘之刃不加控制，易极端、易冲突。练的是收放，不是磨平，也不是硬刚全世界。',
  },
  华盖: {
    modern: '孤独感来源',
    impression: '站在人群里仍可能觉得孤独，习惯精神独处。',
    where: '三合局之华盖落支；常与信仰、艺术、清高感有关。',
    trap: '独处是养分，自我隔绝是陷阱。分清「需要安静」和「拒绝一切连接」。',
  },
  孤辰寡宿: {
    modern: '孤独独处之煞',
    impression: '纵使棋局复杂，最终也只有自己一人与生活对弈——内心孤寂，精神世界却极深。',
    where: '传统以年支起孤辰寡宿落支；常与六亲缘薄、喜独处相关。',
    trap: '高纬度的清冷是天赋，不是惩罚。别把「不愿敞开」活成「谁都不配靠近」。',
  },
  驿马: {
    modern: '奔波变动之星',
    impression: '此地留不住你——奔波、远离、动中求财，适合出差外贸与换场。',
    where: '三合局驿马落支；主奔波、出行、变动。',
    trap: '动不等于逃避。驿马旺时，要问自己是在开拓还是在逃跑。',
  },
  桃花: {
    modern: '姻缘人缘之煞',
    impression: '异性缘与社交魅力旺；美好如镜中花，也易牵出复杂红线。',
    where: '三合局桃花落支；主缘分与社交磁场。',
    trap: '桃花不仅是浪漫，也容易带来情感牵绊。分清滋养与消耗。',
  },
  劫煞: {
    modern: '意外破财之煞',
    impression: '突如其来的阻碍：事情在即将成功时翻车，天平忽然断裂。',
    where: '传统以年支三合对冲起劫煞落支；主突发意外与破耗感。',
    trap: '骤雨会停。遇劫煞别赌最后一口气，留缓冲、拆步骤，比硬冲更活命。',
  },
  将星: {
    modern: '主心骨感',
    impression: '关键局里容易被推到「扛事」的位置。',
    where: '三合局将星落支；主权威感与担当。',
    trap: '能扛不等于该什么都扛。学会授权，才是将星的成熟用法。',
  },
  红鸾: {
    modern: '喜庆缘',
    impression: '容易碰到喜事、约会与被庆祝的时刻。',
    where: '相对年支之红鸾落支。',
    trap: '喜庆是窗口，不是终身保票；关系仍要经营。',
  },
  天喜: {
    modern: '欢喜缘',
    impression: '气氛容易变暖，身边多一点开心事。',
    where: '相对年支之天喜落支。',
    trap: '欢喜来时别上头；把快乐落成可重复的连接。',
  },
};

const SHENSHA_ZONE: Record<string, 'auspicious' | 'mixed'> = {
  天乙贵人: 'auspicious',
  文昌: 'auspicious',
  禄神: 'auspicious',
  将星: 'auspicious',
  红鸾: 'auspicious',
  天喜: 'auspicious',
  桃花: 'auspicious',
  羊刃: 'mixed',
  华盖: 'mixed',
  孤辰寡宿: 'mixed',
  驿马: 'mixed',
  劫煞: 'mixed',
};

const SHENSHA_GLYPH: Record<string, string> = {
  天乙贵人: '贵',
  文昌: '文',
  禄神: '禄',
  羊刃: '刃',
  华盖: '盖',
  孤辰寡宿: '孤',
  驿马: '马',
  桃花: '桃',
  劫煞: '劫',
  将星: '将',
  红鸾: '鸾',
  天喜: '喜',
};

const TEN_GOD_LORE: Record<
  string,
  Omit<CodexTag, 'kind' | 'name' | 'met' | 'modern'> & { modern: string }
> = {
  正官: {
    modern: TEN_GOD_PLAIN.正官,
    impression: '结构、规则与「被看见的责任」。',
    where: '克日主且阴阳异性之干；常在年、月、时干或藏干中现身。',
    trap: '正官是骨架，不是枷锁。用它立规矩，别被规矩活活卡住。',
  },
  七杀: {
    modern: TEN_GOD_PLAIN.七杀,
    impression: '压力、魄力与不得不突破的关口。',
    where: '克日主且阴阳同性之干；古人云有制为偏官，无制为七杀。',
    trap: '七杀要驾驭：有出口（食伤疏通）则成器，硬扛易惹冲突。',
  },
  正财: {
    modern: TEN_GOD_PLAIN.正财,
    impression: '稳健、可预期的资源与回报。',
    where: '日主所克且阴阳异性；多见正职、储蓄与固定收益感。',
    trap: '正财稳，但过稳会怕变。学会在安全垫上留一点试错预算。',
  },
  偏财: {
    modern: TEN_GOD_PLAIN.偏财,
    impression: '流动机会、横财气与人脉型资源。',
    where: '日主所克且阴阳同性；多见项目、生意与意外进账感。',
    trap: '偏财来得快去得也快。抓住窗口，同时留退路。',
  },
  正印: {
    modern: TEN_GOD_PLAIN.正印,
    impression: '支持、学习与被托住的感觉。',
    where: '生日主且阴阳异性；多见贵人、学历与庇护。',
    trap: '印多为懒。接受帮助时，别把成长外包出去。',
  },
  偏印: {
    modern: TEN_GOD_PLAIN.偏印,
    impression: '独特思路、偏门学问与非常规支持。',
    where: '生日主且阴阳同性；多见技艺、玄学感与孤独的聪明。',
    trap: '偏印利钻研，也易钻牛角尖。定期把想法翻译成别人听得懂的话。',
  },
  食神: {
    modern: TEN_GOD_PLAIN.食神,
    impression: '表达、享受与温和的产出。',
    where: '日主所生且阴阳同性；多见才艺、口福与从容输出。',
    trap: '食神宜养，过乐则散。享受之外，留一点结构化输出。',
  },
  伤官: {
    modern: TEN_GOD_PLAIN.伤官,
    impression: '创意、锋芒与不服管的表达欲。',
    where: '日主所生且阴阳异性；多见革新、吐槽与才华外露。',
    trap: '伤官见官易顶牛。锋芒用在创作与破局，少用在无谓抬杠。',
  },
  比肩: {
    modern: TEN_GOD_PLAIN.比肩,
    impression: '同侪并肩、自我主张与分担。',
    where: '与日主同干；多见朋友、合伙人与「我也能行」。',
    trap: '比肩多易争。并肩是资源，较劲是内耗。',
  },
  劫财: {
    modern: TEN_GOD_PLAIN.劫财,
    impression: '争夺、互换与破财式的流动。',
    where: '与日主同五行异阴阳；多见竞争、拆借与被动分享。',
    trap: '劫财不是注定破财，而是提醒你：边界不清时，钱和机会都容易被分走。',
  },
};

export const SHENSHA_CARDS: StarCardLore[] = Object.keys(SHENSHA_LORE).map((name) => {
  const lore = SHENSHA_LORE[name]!;
  return {
    id: shenshaCardId(name),
    kind: 'shensha' as const,
    name,
    zone: SHENSHA_ZONE[name] ?? 'mixed',
    glyph: SHENSHA_GLYPH[name] ?? name.slice(0, 1),
    ...lore,
  };
});

export const TENGOD_CARDS: StarCardLore[] = Object.keys(TEN_GOD_LORE).map((name) => {
  const lore = TEN_GOD_LORE[name]!;
  return {
    id: tengodCardId(name),
    kind: 'tengod' as const,
    name,
    zone: 'tengod' as const,
    glyph: name.slice(0, 1),
    ...lore,
  };
});

export const ALL_STAR_CARDS: StarCardLore[] = [...SHENSHA_CARDS, ...TENGOD_CARDS];

export function getStarCard(id: string): StarCardLore | undefined {
  return ALL_STAR_CARDS.find((c) => c.id === id);
}

export function getStarCardByName(kind: TagKind, name: string): StarCardLore | undefined {
  const id = kind === 'shensha' ? shenshaCardId(name) : tengodCardId(name);
  return getStarCard(id);
}

function buildTag(kind: TagKind, name: string, met?: boolean): CodexTag | null {
  const card = getStarCardByName(kind, name);
  if (!card) return null;
  const { id: _id, zone: _z, glyph: _g, ...rest } = card;
  return { ...rest, met };
}

const ALL_STEMS = STEM_LORE.map((s) => s.id);

/** 某天干「作为日主」时，十神课题标签（去重） */
export function tenGodHintsForStemAsDayMaster(stem: string): string[] {
  const set = new Set<string>();
  for (const other of ALL_STEMS) {
    if (other === stem) continue;
    const g = stemTenGod(stem, other);
    if (g && g !== '—' && g !== '日主') set.add(g);
  }
  return [...set];
}

/** 某地支藏干相对「假定日主=本支主气」时的十神提示，改用藏干列表作标签入口 */
export function tenGodHintsForBranch(branch: string): string[] {
  const hides = branchHideStems(branch);
  // 地支详情：用藏干对应的「可成十神」——以藏干各自为日主时会出现的十神过多；
  // 改为展示：盘中常见解读入口 = 藏干名映射到「藏干可作日主之比劫食伤…」太散。
  // 实用做法：列出藏干，并给出「藏干相对任意日主均可化为十神」的固定十神全集中
  // 与藏干五行相关的常用十神——简化为：该支藏干作为他干时常见角色 = 全十神中与藏干相关的提示。
  // 最终：对每个藏干，收集「当用户日主为甲…癸时此藏干是什么十神」的并集，取出现频率最高的若干。
  const count = new Map<string, number>();
  for (const hide of hides) {
    for (const day of ALL_STEMS) {
      const g = stemTenGod(day, hide);
      if (!g || g === '—' || g === '日主') continue;
      count.set(g, (count.get(g) ?? 0) + 1);
    }
  }
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([g]) => g);
}

export function staticTagsForStem(stem: string, met?: Set<string>): CodexTag[] {
  const shensha = shenshaHintsForStem(stem)
    .map((n) => buildTag('shensha', n, met?.has(n) ?? false))
    .filter(Boolean) as CodexTag[];
  const tengods = tenGodHintsForStemAsDayMaster(stem)
    .map((n) => buildTag('tengod', n, met?.has(`tg:${n}`) ?? false))
    .filter(Boolean) as CodexTag[];
  return [...shensha, ...tengods];
}

export function staticTagsForBranch(branch: string, met?: Set<string>): CodexTag[] {
  const shensha = shenshaHintsForBranch(branch)
    .map((n) => buildTag('shensha', n, met?.has(n) ?? false))
    .filter(Boolean) as CodexTag[];
  const tengods = tenGodHintsForBranch(branch)
    .map((n) => buildTag('tengod', n, met?.has(`tg:${n}`) ?? false))
    .filter(Boolean) as CodexTag[];
  return [...shensha, ...tengods];
}

/** 从命盘收集可点亮的星煞 / 十神卡 id */
export function starCardIdsFromChart(chart: BaziChart): string[] {
  const ids = new Set<string>();
  for (const raw of metTagIdsFromChart(chart)) {
    if (raw.startsWith('tg:')) {
      const name = raw.slice(3);
      if (TEN_GOD_LORE[name]) ids.add(tengodCardId(name));
    } else if (SHENSHA_LORE[raw]) {
      ids.add(shenshaCardId(raw));
    }
  }
  return [...ids];
}

/** 从命盘收集「已遇见」神煞与十神名 */
export function metTagIdsFromChart(chart: BaziChart): Set<string> {
  const met = new Set<string>();
  for (const p of chart.pillars) {
    if (p.empty || p.key === 'liunian') continue;
    for (const s of p.shensha || []) {
      if (s.trim()) met.add(s.trim());
    }
    if (p.key !== 'day') {
      const g = p.stemGod.trim();
      if (g && g !== '—' && g !== '日主') met.add(`tg:${g}`);
    }
    for (const hg of p.hideGods || []) {
      const g = hg.trim();
      if (g && g !== '—' && g !== '日主') met.add(`tg:${g}`);
    }
  }
  return met;
}

export function getTagLore(kind: TagKind, name: string): CodexTag | null {
  return buildTag(kind, name, false);
}
