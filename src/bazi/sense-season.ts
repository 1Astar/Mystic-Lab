import type { BaziChart } from './cast.ts';

export type SeasonTone = {
  /** 开场标题，如「你是一年中的初春」 */
  title: string;
  /** 拟人化正文，零术语 */
  body: string;
  /** 一句 condensed */
  tagline: string;
};

type StemTone = {
  seasonName: string;
  metaphor: string;
  drive: string;
  need: string;
};

/** 按日干拟人；对外文案不出现天干字 */
const STEM_TONE: Record<string, StemTone> = {
  甲: {
    seasonName: '初春',
    metaphor: '破土而出的大树',
    drive: '向上生长、不甘平庸',
    need: '外界的阳光与雨水——节奏对了才长得稳',
  },
  乙: {
    seasonName: '仲春',
    metaphor: '顺势攀缘的藤花',
    drive: '柔软却执着地找光',
    need: '可依靠的支架与持续滋养',
  },
  丙: {
    seasonName: '盛夏正午',
    metaphor: '当空烈日',
    drive: '照亮四周、快速点燃行动',
    need: '适度收敛，免得连人也灼伤',
  },
  丁: {
    seasonName: '夏夜',
    metaphor: '炉中细火与灯火',
    drive: '专注把一件事烧透',
    need: '稳定的燃料与不被风吹散的空间',
  },
  戊: {
    seasonName: '长夏',
    metaphor: '厚重的山脊',
    drive: '承载与托底',
    need: '别被过度索取掏空，记得留一块空地',
  },
  己: {
    seasonName: '田园季',
    metaphor: '温润的沃土',
    drive: '把种子养成收成',
    need: '清晰的边界，免得什么都承',
  },
  庚: {
    seasonName: '金秋',
    metaphor: '锋利而干净的矿脉',
    drive: '决断、切开多余',
    need: '别只剩刀锋——也要有柔软的落点',
  },
  辛: {
    seasonName: '秋露',
    metaphor: '细亮的珠玉',
    drive: '讲究品质与分寸',
    need: '避免过度打磨，留一点呼吸',
  },
  壬: {
    seasonName: '深冬江河',
    metaphor: '奔涌的大水',
    drive: '流动、看见远方',
    need: '河床与岸——否则容易散',
  },
  癸: {
    seasonName: '冬末细雨',
    metaphor: '润物的雨露',
    drive: '渗透、滋养、慢慢渗进人心',
    need: '别把精力蒸发掉，记得补给与停顿',
  },
};

/**
 * 核心定调：你是一年中的什么季节？
 * 规则模板，禁止 LLM；不写「日元为甲木」类术语。
 */
export function buildSeasonTone(chart: BaziChart): SeasonTone {
  const stem = chart.dayMaster;
  const tone = STEM_TONE[stem];
  if (!tone) {
    return {
      title: '你处在独有的一季',
      tagline: '先认出你的气候',
      body: '你的命理特质像一种气候：有专属的温度与风向。先感受它，再决定怎么走路。',
    };
  }
  return {
    title: `你是一年中的${tone.seasonName}`,
    tagline: tone.metaphor,
    body: `你的命理特质，就像${tone.metaphor}。你天生具有${tone.drive}的劲儿，但同时也需要${tone.need}。`,
  };
}
