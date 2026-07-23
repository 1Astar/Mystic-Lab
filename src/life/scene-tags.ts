/** 占问场景标签：按问题自动建议，用户可改删增 */

export const SCENE_TAG_OPTIONS = [
  '工作',
  '感情',
  '家庭',
  '考试',
  '健康',
  '财运',
  '决策',
  '心态',
  '迁居',
  '人际',
] as const;

export type SceneTag = (typeof SCENE_TAG_OPTIONS)[number] | string;

const RULES: { tag: string; patterns: RegExp[] }[] = [
  {
    tag: '工作',
    patterns: [/工作/, /职/, /offer/, /离职/, /跳槽/, /求职/, /面试/, /老板/, /同事/, /事业/, /创业/, /项目/, /薪/, /收入/, /公司/],
  },
  {
    tag: '感情',
    patterns: [/感情/, /恋爱/, /分手/, /复合/, /相亲/, /婚姻/, /结婚/, /离婚/, /对象/, /喜欢的人/, /暗恋/, /伴侣/, /男朋友/, /女朋友/, /老公/, /老婆/],
  },
  {
    tag: '家庭',
    patterns: [/家人/, /父母/, /妈妈/, /爸爸/, /孩子/, /家庭/, /亲情/, /婆媳/, /亲戚/],
  },
  {
    tag: '考试',
    patterns: [/考试/, /考研/, /高考/, /公考/, /证书/, /成绩/, /留学/, /学业/, /论文/],
  },
  {
    tag: '健康',
    patterns: [/健康/, /身体/, /病/, /手术/, /就医/, /养生/, /失眠/],
  },
  {
    tag: '财运',
    patterns: [/钱/, /财/, /投资/, /理财/, /买房/, /贷款/, /债/, /收入/, /花销/],
  },
  {
    tag: '迁居',
    patterns: [/搬家/, /迁居/, /定居/, /出国/, /移民/, /租房/, /买房/],
  },
  {
    tag: '人际',
    patterns: [/朋友/, /人际/, /社交/, /人缘/, /合作/, /客户/, /贵人/],
  },
  {
    tag: '决策',
    patterns: [/要不要/, /该不该/, /如何选择/, /抉择/, /决定/, /选哪个/, /去不去/, /做不做/],
  },
  {
    tag: '心态',
    patterns: [/心态/, /焦虑/, /压力/, /情绪/, /迷茫/, /方向/, /意义/],
  },
];

/** 根据问题自动建议场景标签（至少给一个；无匹配则「决策」） */
export function suggestSceneTags(question: string, max = 3): string[] {
  const q = question.trim();
  if (!q) return ['决策'];
  const hit: string[] = [];
  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(q))) {
      if (!hit.includes(rule.tag)) hit.push(rule.tag);
      if (hit.length >= max) break;
    }
  }
  return hit.length > 0 ? hit : ['决策'];
}

export function normalizeSceneTags(tags: string[] | undefined | null): string[] {
  if (!Array.isArray(tags)) return [];
  const out: string[] = [];
  for (const raw of tags) {
    const t = String(raw).trim().replace(/^#/, '').slice(0, 10);
    if (!t || out.includes(t)) continue;
    out.push(t);
    if (out.length >= 8) break;
  }
  return out;
}

/** 保存前保证至少有一个场景标签 */
export function ensureSceneTags(question: string, tags?: string[] | null): string[] {
  const normalized = normalizeSceneTags(tags);
  if (normalized.length > 0) return normalized;
  return suggestSceneTags(question);
}
