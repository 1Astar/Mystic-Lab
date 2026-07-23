import type { SceneDomain } from './scene-map.ts';
import { detectSceneDomain } from './scene-map.ts';
import type { LiuQin } from './najia.ts';
import { formatLiuqinShort } from './energy-lens.ts';

/** 用神对应的六亲（可能多个，如感情） */
export function yongLiuQinList(question: string): LiuQin[] {
  const q = question.trim();
  if (/考试|考研|考证|题目|成绩|分数|简历|文书/.test(q)) return ['父母'];
  if (/薪|工资|资产|投资|收入|钱|财|回本/.test(q)) return ['妻财'];
  if (/感情|恋爱|分手|复合|对象|婚姻|喜欢/.test(q)) return ['妻财', '官鬼'];
  if (/面试|升职|工作|offer|事业|老板|岗位|求职/.test(q)) return ['官鬼'];
  const domain = detectSceneDomain(question);
  if (domain === 'career') return ['官鬼'];
  if (domain === 'love') return ['妻财', '官鬼'];
  return ['父母'];
}

/** 用神取用（教学层：现代名（传统）） */
export function resolveYongShen(question: string): {
  domain: SceneDomain;
  name: string;
  why: string;
  tip: string;
} {
  const domain = detectSceneDomain(question);
  const q = question.trim();

  if (/考试|考研|考证|题目|成绩|分数/.test(q)) {
    return {
      domain: 'career',
      name: formatLiuqinShort('父母'),
      why: `考试/文书类问题，用神看「${formatLiuqinShort('父母')}」——信息网、题目与文书机会。`,
      tip: '安全基地/信息网发动，常与资料、文书、考题有关；装卦后会标出具体爻位。',
    };
  }
  if (/面试|升职|工作|offer|事业|老板|岗位/.test(q) || domain === 'career') {
    return {
      domain: 'career',
      name: formatLiuqinShort('官鬼'),
      why: `工作/面试类问题，用神看「${formatLiuqinShort('官鬼')}」——目标系统与外部规则。`,
      tip: '目标系统代表岗位、考核、压力与机会；装卦后会在卦图上高亮它所在的爻。',
    };
  }
  if (/感情|恋爱|分手|复合|对象|婚姻|喜欢/.test(q) || domain === 'love') {
    return {
      domain: 'love',
      name: `${formatLiuqinShort('妻财')} / ${formatLiuqinShort('官鬼')}`,
      why: '感情类：常同时看物质/关系回报与外部约束两套系统（流派略有差异）。',
      tip: '先看世应互动模式，再用用神看关系场；装卦后会标出具体爻位。',
    };
  }
  if (/钱|财|投资|收入/.test(q)) {
    return {
      domain: 'life',
      name: formatLiuqinShort('妻财'),
      why: `求财类问题，用神看「${formatLiuqinShort('妻财')}」——物质根基与自我价值回报。`,
      tip: '物质根基偏稳、得助，常利求财；装卦后会对着表格指出它在哪一爻。',
    };
  }
  return {
    domain,
    name: '用神（按所问而定）',
    why: '用神＝你问的这件事在卦里的「代表爻」。问什么，取什么。',
    tip: '先写清问题，再取用神。装卦完成后，核心要素页会把它圈出来。',
  };
}
