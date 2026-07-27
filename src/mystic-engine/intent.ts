import type { IntentHit, IntentId, SceneDomain } from './types.ts';

type KindMap = {
  id: IntentId;
  domain: SceneDomain;
  confidence: 'high' | 'mid';
};

function classifySlice(s: string): KindMap {
  // —— 财富（先于泛「收入」职场）——
  if (/投资|股票|基金|理财|买不买.*股|定投|亏钱|回本/.test(s)) {
    return { id: 'wealth_invest', domain: 'wealth', confidence: 'high' };
  }
  if (
    /消费|花不花|该不该买|大额支出|剁手|要不要买|花.*万|报课|学费|这笔钱该不该花/.test(
      s,
    ) &&
    !/公司|offer|岗|创业/.test(s)
  ) {
    return { id: 'wealth_spend', domain: 'wealth', confidence: 'mid' };
  }
  if (/被动收入|副业赚钱|整体收入|现金流|回款/.test(s) && !/转正|调薪|谈薪|8\s*k/.test(s)) {
    return { id: 'wealth_income', domain: 'wealth', confidence: 'mid' };
  }

  // —— 事业 ——
  if (/创业|自己干|开公司|做老板|副业变主业|独立做产品/.test(s)) {
    return { id: 'career_startup', domain: 'career', confidence: 'high' };
  }
  if (/转岗|换组|内部调动|调去|换条线|转业务/.test(s)) {
    return { id: 'career_transfer', domain: 'career', confidence: 'high' };
  }
  if (/升职|晋升|升一级|职级|评级|晋升答辩/.test(s) && !/加薪|涨薪/.test(s)) {
    return { id: 'career_promote', domain: 'career', confidence: 'high' };
  }
  if (/转正/.test(s) && (/薪|工资|月薪|\d+\s*k|涨薪|调薪|拿|收入/.test(s) || /能不能|能否|会不会/.test(s))) {
    return { id: 'probation_convert', domain: 'career', confidence: 'high' };
  }
  if (/薪|工资|月薪|\d+\s*k|涨薪|调薪|转正.*拿|拿到.*钱|谈薪/.test(s)) {
    return { id: 'salary_negotiate', domain: 'career', confidence: 'high' };
  }
  if (/离职|辞职|走人|跳槽|离开|不干|裸辞/.test(s) && /留|留下|要不要留|继续/.test(s)) {
    return { id: 'quit_vs_stay', domain: 'career', confidence: 'high' };
  }
  if (/要不要留|留下|继续干|该不该留/.test(s)) {
    return { id: 'quit_vs_stay', domain: 'career', confidence: 'high' };
  }
  if (/离职|辞职|走人|跳槽|离开|不干|裸辞|要不要走|该不该走/.test(s)) {
    return { id: 'quit_now', domain: 'career', confidence: 'high' };
  }
  if (/找工作|求职|下一份|换工作|三个月.*求职|求职.*三个月|投简历|海投/.test(s)) {
    return { id: 'job_search_window', domain: 'career', confidence: 'high' };
  }
  if (/offer|录用|面试|通过|过关|能不能进/.test(s)) {
    return { id: 'offer_decide', domain: 'career', confidence: 'high' };
  }
  if (/同事|领导|汇报|冲突|上司|团队/.test(s) && !/对象|男朋友|女朋友|伴侣|婚姻/.test(s)) {
    return { id: 'team_conflict', domain: 'career', confidence: 'mid' };
  }

  // —— 关系 ——
  if (/结婚|婚|婚礼|彩礼|领证|要不要结|婚姻/.test(s)) {
    return { id: 'love_marriage', domain: 'love', confidence: 'high' };
  }
  if (/复合|回头|还会联系|能不能和好|挽回/.test(s)) {
    return { id: 'love_reunion', domain: 'love', confidence: 'high' };
  }
  if (/暧昧|不清不楚|拉扯|试探|有没有戏|暗恋/.test(s)) {
    return { id: 'love_ambiguous', domain: 'love', confidence: 'high' };
  }
  if (/吵架|冷战|争执|矛盾|闹翻|沟通不了|关系冲突/.test(s)) {
    return { id: 'love_conflict', domain: 'love', confidence: 'high' };
  }
  if (/喜欢我|是不是喜欢|爱不爱|有感觉/.test(s)) {
    return { id: 'love_likes', domain: 'love', confidence: 'high' };
  }
  if (/分手|要不要分|继续在一起|去留/.test(s) && /感情|对象|恋爱|他|她|男朋友|女朋友/.test(s)) {
    return { id: 'love_stay_leave', domain: 'love', confidence: 'mid' };
  }
  if (/联系|找他|找她|主动吗|要不要找/.test(s)) {
    return { id: 'love_contact', domain: 'love', confidence: 'high' };
  }

  // —— 成长 ——
  if (/考研|考试|过不过|四级|六级|高考|中考|考证|学习计划|要不要学/.test(s)) {
    return { id: 'growth_study', domain: 'growth', confidence: 'high' };
  }
  if (/五年规划|长期规划|人生方向|职业规划|三年后|十年后/.test(s)) {
    return { id: 'growth_plan', domain: 'growth', confidence: 'high' };
  }
  if (/志愿|考研|读研|留学|换专业|要不要读/.test(s)) {
    return { id: 'growth_study', domain: 'growth', confidence: 'high' };
  }
  if (/两难|选哪个|A还是B|如何选择|重大选择|纠结选/.test(s)) {
    return { id: 'growth_choice', domain: 'growth', confidence: 'high' };
  }

  // —— 通用 ——
  if (/几月|何时|什么时候|月底|月初|年底|时机|未来三个月/.test(s)) {
    return { id: 'timing', domain: 'general', confidence: 'mid' };
  }
  if (/纠结|犹豫|要不要|该不该|能不能/.test(s)) {
    return { id: 'anxiety_decide', domain: 'general', confidence: 'mid' };
  }
  return { id: 'open_explore', domain: 'general', confidence: 'mid' };
}

function splitSlices(question: string): string[] {
  const raw = question.trim();
  if (!raw) return [];
  const chunks = raw
    .split(/[？?！!；;\n]+|(?<=[了吗呢啊嘛])(?=[我你他她它谁哪什么怎么是否要不要能不能会不会])/)
    .map((s) => s.replace(/^[\d一二三四五六七八九十、.．]+/, '').trim())
    .filter((s) => s.length >= 2);
  return chunks.length ? chunks : [raw];
}

/**
 * 从用户问题识别意图列表（可多意图）。
 */
export function detectIntents(question: string): IntentHit[] {
  const slices = splitSlices(question);
  if (!slices.length) {
    return [
      {
        id: 'open_explore',
        slice: question.trim() || '此刻想看清什么',
        confidence: 'mid',
        domain: 'general',
      },
    ];
  }

  const hits: IntentHit[] = [];
  const seen = new Set<string>();

  for (const slice of slices) {
    const kind = classifySlice(slice);
    const id = kind.id;
    const key = `${id}:${slice.slice(0, 16)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const existingIdx = hits.findIndex((h) => h.id === id);
    if (existingIdx >= 0) {
      if (slice.length > hits[existingIdx]!.slice.length) {
        hits[existingIdx] = {
          id,
          slice,
          confidence: kind.confidence,
          domain: kind.domain,
        };
      }
      continue;
    }

    hits.push({
      id,
      slice,
      confidence: kind.confidence,
      domain: kind.domain,
    });
  }

  const hasLeave = hits.some((h) => h.id === 'quit_now');
  const hasStayish = hits.some((h) => h.id === 'quit_vs_stay');
  if (hasLeave && hasStayish) {
    return hits.filter((h) => h.id !== 'quit_now');
  }
  if (hasLeave && slices.some((s) => /留|留下|要不要留/.test(s))) {
    const leave = hits.find((h) => h.id === 'quit_now')!;
    return hits
      .filter((h) => h.id !== 'quit_now')
      .concat({
        id: 'quit_vs_stay',
        slice: leave.slice,
        confidence: 'high',
        domain: 'career',
      });
  }

  return hits.length
    ? hits
    : [
        {
          id: 'open_explore',
          slice: question.trim(),
          confidence: 'mid',
          domain: 'general',
        },
      ];
}
