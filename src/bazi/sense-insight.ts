import type { BaziChart } from './cast.ts';
import { buildBaziFacts } from './bazi-facts.ts';
import type { SeasonLabel, WuXing } from './elements.ts';
import type { TenGodCategory } from './ten-gods.ts';

export type RealityInsight = {
  title: string;
  story: string;
  /** 一句追问式开场 */
  hook: string;
};

type StoryBits = {
  hook: string;
  body: string;
};

const BY_STRENGTH: Record<SeasonLabel, StoryBits[]> = {
  旺: [
    {
      hook: '你最近是不是气场很满，却也容易把自己推太快？',
      body: '别人眼里你「有劲」，你自己有时会觉得停不下来——像油门踩着，却不一定找得到舒服的档位。',
    },
    {
      hook: '是不是常有「我明明能做更多」的躁动？',
      body: '本气偏足时，空转最折磨人。你需要的不是再加油，而是给力找一个真正值得使的出口。',
    },
  ],
  相: [
    {
      hook: '你最近是不是隐隐觉得「有人在帮你」，但还差点临门一脚？',
      body: '气势在涨，适合借势推进；别硬扛一个人的戏，把助力和窗口用起来会顺很多。',
    },
  ],
  休: [
    {
      hook: '你最近是不是觉得特别憋屈，有一种「有力气没处使」的感觉？',
      body: '外面不一定看得见你的火候，里面却在攒着。这不是废掉了，是蓄力季——先养节奏，再谈冲刺。',
    },
    {
      hook: '是不是容易上火、口腔溃疡，或者莫名烦躁？',
      body: '内里在较劲时，身体常先抗议。先降温、睡够、少跟自己较劲，比硬扛更有用。',
    },
  ],
  囚: [
    {
      hook: '你是不是常感到被框住，想动又动不了？',
      body: '外在压力感更强时，硬冲只会更闷。先找一个小出口——把气散出去，局面才会松。',
    },
  ],
  死: [
    {
      hook: '你最近是不是特别怕硬扛，一点风吹就觉得扛不住？',
      body: '本气偏弱时，先补给再谈表现。允许自己慢半拍，找托住你的人与节奏，比逞强更智慧。',
    },
  ],
};

const BY_CAT: Partial<Record<TenGodCategory, string>> = {
  guan_sha: '责任与评价也容易压上来，像有人一直在旁边盯着你「做没做好」。',
  cai: '钱与结果的话题会更敏感——做成了才安心，空转最难受。',
  shi_shang: '表达欲和被看见的渴望会抬头，憋着不说往往更内耗。',
  yin: '特别需要被理解、被托住；信息不透明时焦虑会放大。',
  bi_jie: '同辈与协作会缠着你：并肩有力，较劲也费神。',
};

const BY_WX: Partial<Record<WuXing, string>> = {
  木: '你骨子里在意「往哪长」——没方向比没力气更折磨。',
  火: '你容易把情绪烧到表面，也容易被看见；记得给热度留退路。',
  土: '你习惯托底，怕场面散掉；别把所有人的重量都扛自己肩上。',
  金: '你对标准很敏感，含糊最让你烦；说清楚边界会轻松一截。',
  水: '你思绪流动快，也容易散；落地感往往比灵感更稀缺。',
};

function pick<T>(pool: T[], seed: number): T {
  return pool[Math.abs(seed) % pool.length]!;
}

function hash(chart: BaziChart): number {
  const s = `${chart.dayMaster}${chart.dayBranch}${chart.yearBranch}${chart.clockLabel}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * 第一层：现实感悟。完全口语场景化，禁止术语。
 */
export function buildRealityInsight(chart: BaziChart): RealityInsight {
  const facts = buildBaziFacts(chart);
  const seed = hash(chart);
  const base = pick(BY_STRENGTH[facts.dayStrength], seed);
  const catLine = facts.dominantCategories[0]
    ? BY_CAT[facts.dominantCategories[0]]
    : '';
  const wxLine = facts.dayMasterWx ? BY_WX[facts.dayMasterWx] : '';

  const parts = [base.body];
  if (catLine) parts.push(catLine);
  if (wxLine) parts.push(wxLine);

  return {
    title: '你的现实感悟',
    hook: base.hook,
    story: parts.join(''),
  };
}
