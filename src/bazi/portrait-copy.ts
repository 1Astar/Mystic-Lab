import type { SeasonLabel, WuXing } from './elements.ts';
import type { TenGodCategory } from './ten-gods.ts';

export const WX_TRAIT: Record<WuXing, string[]> = {
  木: ['感受力强，重视意义与成长', '愿意为想法伸展空间', '对氛围与方向敏感'],
  火: ['表达欲清楚，容易点燃周围', '行动快，喜欢被看见', '热情来得快也要会收'],
  土: ['求稳与承载，信得过的人', '做事有分寸，怕空转', '信任建立后很持久'],
  金: ['边界清楚，讲究效率与标准', '决断干净，讨厌含糊', '对秩序与契约敏感'],
  水: ['思绪流动，适应变化', '直觉准，需要独处充电', '兴趣广，怕被框死'],
};

export const STRENGTH_MOD: Record<SeasonLabel, string> = {
  旺: '气场偏满，节奏容易自驱',
  相: '有助力，适合借势推进',
  休: '蓄力期，适合慢热深耕',
  囚: '外在压力感更强，需主动找出口',
  死: '本气偏弱，更怕硬扛，宜找补给',
};

export const CAREER_BY_CAT: Record<TenGodCategory, string[]> = {
  guan_sha: [
    '更适应有结构的责任与清晰权责',
    '适合在规则里做事，也能扛关键节点',
    '对职位与评价敏感，宜选能看见成长的岗位',
  ],
  shi_shang: [
    '更被表达、创作与展示吸引',
    '适合把想法变成可被看见的作品',
    '讨厌重复空转，需要输出感',
  ],
  bi_jie: [
    '搭档与竞争并存，适合并肩推进',
    '同侪能量强，独处太久会闷',
    '资源常来自协作与互换',
  ],
  yin: [
    '先学再出手，信息与导师很重要',
    '适合研究、教练、幕后支持型角色',
    '安全感来自弄懂规则再上场',
  ],
  cai: [
    '结果导向，在意可核对的产出',
    '适合谈条件、管资源、盯落地',
    '价值感来自「做成了」而不只是想法',
  ],
};

export const RELATION_LINES = [
  '亲密关系里更在意被理解，而不是被管束',
  '靠近时会观察对方是否稳定可托付',
  '冲突时需要冷却空间，再谈边界',
  '容易把「对方是否靠谱」当成安全感来源',
];

export const WEALTH_LINES = {
  steady: ['偏稳健积累：小步可核对，胜过一次赌大', '钱感来自持续交付，而非风口幻想'],
  flow: ['偏机会流动：窗口来了敢接，也要设止损', '资源常随人脉与信息流动'],
  skill: ['偏技能变现：先把本事做成可报价的服务', '收入跟「别人愿不愿为你付钱」绑在一起'],
};

export const INNER_WEAK = [
  '内在课题常落在：别把认可外包给外界评价',
  '容易外求认同，先练「自己给自己一句准话」',
  '弱时硬扛最伤，先找补给再谈冲刺',
];

export const INNER_STRONG = [
  '内在课题常落在：别让自驱变成自我鞭打',
  '节奏满时更怕空转，要学会主动停一拍',
  '气场强时易忽略别人节奏，记得对齐再加速',
];

export function pickLine(pool: string[], seed: number): string {
  if (!pool.length) return '';
  return pool[Math.abs(seed) % pool.length]!;
}
