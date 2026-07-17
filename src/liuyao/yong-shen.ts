import type { SceneDomain } from './scene-map.ts';
import { detectSceneDomain } from './scene-map.ts';
import type { LiuQin } from './najia.ts';

/** 用神对应的六亲（可能多个，如感情） */
export function yongLiuQinList(question: string): LiuQin[] {
  const q = question.trim();
  if (/考试|考研|考证|题目|成绩|分数/.test(q)) return ['父母'];
  if (/钱|财|投资|收入/.test(q)) return ['妻财'];
  if (/感情|恋爱|分手|复合|对象|婚姻|喜欢/.test(q)) return ['妻财', '官鬼'];
  if (/面试|升职|工作|offer|事业|老板|岗位/.test(q)) return ['官鬼'];
  const domain = detectSceneDomain(question);
  if (domain === 'career') return ['官鬼'];
  if (domain === 'love') return ['妻财', '官鬼'];
  return ['父母'];
}

/** 用神取用（教学层：先讲「问什么看什么」） */
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
      name: '父母爻',
      why: '考试/文书类问题，传统上以「父母爻」为用神（目标）。',
      tip: '父母发动常与题目、资料、文书信息有关；装卦完成后会标出它在第几爻。',
    };
  }
  if (/面试|升职|工作|offer|事业|老板|岗位/.test(q) || domain === 'career') {
    return {
      domain: 'career',
      name: '官鬼爻',
      why: '工作/面试类问题，传统上以「官鬼爻」为用神（目标）。',
      tip: '官鬼代表岗位、考核、压力与机会；装卦后会在卦图上高亮它所在的爻。',
    };
  }
  if (/感情|恋爱|分手|复合|对象|婚姻|喜欢/.test(q) || domain === 'love') {
    return {
      domain: 'love',
      name: '妻财爻 / 官鬼爻',
      why: '感情类：男测常看妻财，女测常看官鬼（流派略有差异）。',
      tip: '先看世应是否同频，再用用神看对方/关系场；装卦后会标出具体爻位。',
    };
  }
  if (/钱|财|投资|收入/.test(q)) {
    return {
      domain: 'life',
      name: '妻财爻',
      why: '求财类问题，以「妻财爻」为用神。',
      tip: '财爻旺相、得生，常利求财；装卦后会对着表格指出它在哪一爻。',
    };
  }
  return {
    domain,
    name: '用神（按所问而定）',
    why: '用神＝你问的这件事在卦里的「代表爻」。问什么，取什么。',
    tip: '先写清问题，再取用神。装卦完成后，核心要素页会把它圈出来。',
  };
}
