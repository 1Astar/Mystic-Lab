/**
 * 生时校准 v2 · 侦探题库（粗筛 + 性格）
 * 选项映射到时辰 band / 十神类别 / 行为 trait，供规则引擎打分。
 */
import type { RectifyTimeBand } from './rectify-candidates.ts';
import type { ShichenTraitId } from './rectify-shichen-diff.ts';
import type { TenGodCategory } from './ten-gods.ts';

export type DetectivePhase = 'objective' | 'personality';

export type DetectiveOptionEffect = {
  /** 硬收窄时段 */
  band?: RectifyTimeBand;
  /** 只保留这些地支（与 band 取交集） */
  keepBranches?: string[];
  /** 加分 */
  boostBranches?: string[];
  boostTraits?: ShichenTraitId[];
  boostTenGodCats?: TenGodCategory[];
  /** 硬排除地支 */
  excludeBranches?: string[];
  /** 线索文案片段 */
  clueHint: string;
};

export type DetectiveOption = {
  id: string;
  label: string;
  hint?: string;
  effect: DetectiveOptionEffect;
};

export type DetectiveQuestion = {
  id: string;
  phase: DetectivePhase;
  stepTitle: string;
  title: string;
  subtitle?: string;
  options: DetectiveOption[];
};

/** 对不上号时软跳过：记线索、不改名次 */
const SKIP_OPTION = (hint: string): DetectiveOption => ({
  id: 'skip',
  label: '都不像 / 说不清',
  hint,
  effect: { clueHint: '这一题跳过，不改时辰名次，继续往下' },
});

export const OBJECTIVE_QUESTIONS: DetectiveQuestion[] = [
  {
    id: 'obj-slot',
    phase: 'objective',
    stepTitle: '起风时刻',
    title: '长辈或你自己印象里，你大概出生在什么时段？',
    subtitle: '这决定我们先看哪一段「天气」',
    options: [
      {
        id: 'dawn',
        label: '清晨（约 5–8 点）',
        effect: { band: { kind: 'morning' }, keepBranches: ['卯', '辰'], clueHint: '清晨露珠、阳气初升' },
      },
      {
        id: 'forenoon',
        label: '上午（约 8–11 点）',
        effect: { band: { kind: 'morning' }, keepBranches: ['辰', '巳'], clueHint: '隅中日升、热力蓄势' },
      },
      {
        id: 'noon',
        label: '中午（约 11–14 点）',
        effect: { band: { kind: 'afternoon' }, keepBranches: ['午', '未'], clueHint: '正午烈日、爆发力强' },
      },
      {
        id: 'afternoon',
        label: '下午（约 14–17 点）',
        effect: { band: { kind: 'afternoon' }, keepBranches: ['未', '申'], clueHint: '晡时收束、务实赶工' },
      },
      {
        id: 'dusk',
        label: '傍晚（约 17–20 点）',
        effect: { band: { kind: 'evening' }, clueHint: '日入暮色、锋芒内收' },
      },
      {
        id: 'night',
        label: '晚上（约 20–23 点）',
        effect: { band: { kind: 'night' }, keepBranches: ['戌', '亥'], clueHint: '人定前夜、心思渐深' },
      },
      {
        id: 'late',
        label: '深夜 / 凌晨（约 23–5 点）',
        effect: {
          band: { kind: 'night' },
          keepBranches: ['子', '丑', '寅'],
          clueHint: '月夜星稀、午夜寒风',
        },
      },
      {
        id: 'unknown',
        label: '完全不清楚',
        effect: { band: { kind: 'all' }, clueHint: '十二时辰全开，靠后面性格与剧本收窄' },
      },
    ],
  },
  {
    id: 'obj-daynight',
    phase: 'objective',
    stepTitle: '明暗分界',
    title: '家人有没有提过你是「白天」还是「晚上」生的？',
    options: [
      {
        id: 'day',
        label: '白天（天亮到天黑）',
        effect: {
          excludeBranches: ['子', '丑', '亥'],
          clueHint: '先压暗夜间：子、丑、亥暂收暗',
        },
      },
      {
        id: 'night',
        label: '晚上（天黑到天亮）',
        effect: {
          keepBranches: ['子', '丑', '亥', '戌', '酉'],
          clueHint: '夜间能量抬头：亥子丑酉戌进入视野',
        },
      },
      {
        id: 'unsure',
        label: '没提过 / 记不清',
        effect: { clueHint: '不硬切日夜，继续用性格侧写' },
      },
    ],
  },
  {
    id: 'obj-meal',
    phase: 'objective',
    stepTitle: '烟火气',
    title: '有没有听过「正好在吃饭时间」之类的说法？',
    options: [
      {
        id: 'yes',
        label: '有，大概在饭点前后',
        effect: {
          boostBranches: ['辰', '午', '酉'],
          clueHint: '食时、日中、日入——辰午酉权重上升',
        },
      },
      {
        id: 'no',
        label: '没有',
        effect: { clueHint: '不偏向饭点时辰' },
      },
      {
        id: 'unsure',
        label: '不清楚',
        effect: { clueHint: '跳过饭点线索' },
      },
    ],
  },
];

export const PERSONALITY_QUESTIONS: DetectiveQuestion[] = [
  {
    id: 'per-weather',
    phase: 'personality',
    stepTitle: '日常节奏',
    title: '朋友形容你平时更像哪一种？',
    subtitle: '选最常被说中的那句，不用想五行',
    options: [
      {
        id: 'fire',
        label: '热得快、说干就干，情绪和行动都来得猛',
        hint: '像正午烈日 / 雷阵雨',
        effect: {
          boostBranches: ['巳', '午'],
          boostTenGodCats: ['shi_shang', 'bi_jie'],
          clueHint: '火旺：巳午时概率上升',
        },
      },
      {
        id: 'wood',
        label: '人清醒、爱动脑子，容易对新鲜事来劲',
        hint: '像清晨暖阳 / 微风',
        effect: {
          boostBranches: ['卯', '辰', '寅'],
          boostTenGodCats: ['yin', 'shi_shang'],
          clueHint: '木气舒展：寅卯辰更亮',
        },
      },
      {
        id: 'metal',
        label: '稳、讲分寸，做事先看现实划不划算',
        hint: '像黄昏暮色',
        effect: {
          boostBranches: ['申', '酉'],
          boostTenGodCats: ['cai', 'guan_sha'],
          clueHint: '金气收束：申酉进入前排',
        },
      },
      {
        id: 'water',
        label: '表面安静，其实脑子停不下来，感受细',
        hint: '像月夜星稀',
        effect: {
          boostBranches: ['亥', '子', '丑'],
          boostTenGodCats: ['yin', 'shi_shang'],
          clueHint: '水气深潜：亥子丑暂亮',
        },
      },
      SKIP_OPTION('都不贴切就跳过，后面剧本再对照'),
    ],
  },
  {
    id: 'per-work',
    phase: 'personality',
    stepTitle: '被夸的点',
    title: '同事或同学最常因为什么夸你？',
    subtitle: '回想最近一两次真实反馈；对不上就选最后一项',
    options: [
      {
        id: 'create',
        label: '「你想法多 / 讲得清楚 / 会整活」',
        hint: '表达与创意',
        effect: { boostTenGodCats: ['shi_shang'], boostTraits: ['talk'], clueHint: '食伤气：表达型时辰加分' },
      },
      {
        id: 'discipline',
        label: '「你扛得住 / 靠谱 / 不太服软」',
        hint: '抗压与纪律',
        effect: {
          boostTenGodCats: ['guan_sha'],
          boostTraits: ['steady', 'action'],
          clueHint: '官杀气：责任型时辰加分',
        },
      },
      {
        id: 'resource',
        label: '「你算得清 / 会找资源 / 不空谈」',
        hint: '务实与资源',
        effect: { boostTenGodCats: ['cai'], boostTraits: ['money'], clueHint: '财星气：务实型时辰加分' },
      },
      {
        id: 'rival',
        label: '「你不服输 / 爱争一口气」',
        hint: '竞争与主见',
        effect: { boostTenGodCats: ['bi_jie'], boostTraits: ['lead', 'action'], clueHint: '比劫气：主见型时辰加分' },
      },
      SKIP_OPTION('很少被这样夸，或想不起具体反馈'),
    ],
  },
  {
    id: 'per-family',
    phase: 'personality',
    stepTitle: '家里怎么处',
    title: '过年吃饭或家庭群里，你更常是哪种角色？',
    subtitle: '想一件具体场景就行；都不像就跳过',
    options: [
      {
        id: 'warm',
        label: '先照顾别人情绪，怕话说重了伤人',
        hint: '重情、怕伤和气',
        effect: { boostTenGodCats: ['yin', 'cai'], boostTraits: ['sensitive'], clueHint: '印星/财星：重情时辰偏亮' },
      },
      {
        id: 'stubborn',
        label: '有自己想法，不太容易被说服',
        hint: '主见、硬气',
        effect: { boostTenGodCats: ['bi_jie', 'guan_sha'], boostTraits: ['lead'], clueHint: '比劫/官杀：硬气时辰偏亮' },
      },
      {
        id: 'express',
        label: '话多、爱调侃，桌上气氛常靠你撑',
        hint: '气氛担当',
        effect: { boostTenGodCats: ['shi_shang'], boostTraits: ['talk'], clueHint: '食伤：外放型时辰偏亮' },
      },
      {
        id: 'quiet',
        label: '听得多、说得少，冲突时宁可躲开',
        hint: '观察、少硬刚',
        effect: { boostTenGodCats: ['yin'], boostTraits: ['study', 'sensitive'], clueHint: '印星：内收型时辰偏亮' },
      },
      SKIP_OPTION('家里情况特殊，这几项都不贴'),
    ],
  },
  {
    id: 'per-anger',
    phase: 'personality',
    stepTitle: '真生气时',
    title: '真被惹急了，你更常怎么处理？',
    subtitle: '选最接近你的真实反应；都不像就跳过',
    options: [
      {
        id: 'burst',
        label: '当场说开或发作，吵完可能很快过去',
        hint: '爆发后易翻篇',
        effect: { boostBranches: ['午', '寅', '卯'], boostTraits: ['action'], clueHint: '火木爆发：午寅卯候选抬头' },
      },
      {
        id: 'cold',
        label: '先冷着不说，攒够了再一次性摊牌',
        hint: '冷处理、翻旧账',
        effect: { boostBranches: ['酉', '亥', '子'], boostTraits: ['sensitive'], clueHint: '金水内收：酉亥子需对照' },
      },
      {
        id: 'drama',
        label: '很在意面子，对方给台阶才肯停',
        hint: '要台阶、要体面',
        effect: { boostBranches: ['午', '未', '戌'], boostTraits: ['lead'], clueHint: '土火面子：午未戌进入对照' },
      },
      {
        id: 'rare',
        label: '很少正面发火，多半自己闷着消化',
        hint: '闷着、少发作',
        effect: { boostBranches: ['丑', '辰', '酉'], boostTraits: ['steady', 'study'], clueHint: '湿土金稳：丑辰酉偏稳' },
      },
      SKIP_OPTION('发火方式不固定，或很少遇到这种场面'),
    ],
  },
  {
    id: 'per-social',
    phase: 'personality',
    stepTitle: '熟人局',
    title: '去一个半生不熟的局（同学聚会 / 同事聚餐），你通常？',
    subtitle: '想最近一次真实经历；都不像就跳过',
    options: [
      {
        id: 'center',
        label: '容易成为话题中心，爱带动气氛',
        hint: '外放、好表现',
        effect: { boostTraits: ['talk', 'charm'], boostBranches: ['午', '卯'], clueHint: '桃花外放：午卯偏亮' },
      },
      {
        id: 'edge',
        label: '先坐边上听，熟了才多说话',
        hint: '观察、慢热',
        effect: { boostTraits: ['study', 'sensitive'], boostBranches: ['酉', '亥'], clueHint: '内收观察：酉亥需留意' },
      },
      {
        id: 'busy',
        label: '人认识不少，但很少深聊到心里',
        hint: '广而不深、常在路上',
        effect: { boostTraits: ['travel'], boostBranches: ['寅', '申'], clueHint: '驿马冲动：寅申走动多' },
      },
      {
        id: 'steady',
        label: '更想跟两三个熟人扎堆，不爱扩圈',
        hint: '小圈、铁关系',
        effect: { boostTraits: ['steady'], boostBranches: ['辰', '丑'], clueHint: '土气守成：辰丑偏稳' },
      },
      SKIP_OPTION('很少出门社交，或这几项都不像'),
    ],
  },
];

export const ALL_DETECTIVE_QUESTIONS: DetectiveQuestion[] = [
  ...OBJECTIVE_QUESTIONS,
  ...PERSONALITY_QUESTIONS,
];

export function questionById(id: string): DetectiveQuestion | undefined {
  return ALL_DETECTIVE_QUESTIONS.find((q) => q.id === id);
}

export function optionById(
  questionId: string,
  optionId: string,
): { question: DetectiveQuestion; option: DetectiveOption } | undefined {
  const question = questionById(questionId);
  if (!question) return undefined;
  const option = question.options.find((o) => o.id === optionId);
  if (!option) return undefined;
  return { question, option };
}
