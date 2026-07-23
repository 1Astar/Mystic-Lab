/** 把用户输入拆成可逐条作答的子问题 */

const NUMBERED =
  /(?:^|\n)\s*(?:\d+[.\u3001\uFF0E)]\s*|[\u2460-\u2473]\s*|[（(]\d+[）)]\s*)([^\n]+)/g;

export function splitUserQuestions(raw: string): string[] {
  const q = raw.trim();
  if (!q) return [];

  const numbered: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(NUMBERED.source, 'g');
  while ((m = re.exec(q)) !== null) {
    const line = m[1]!.trim().replace(/[？?]+$/, '');
    if (line.length >= 2) numbered.push(line);
  }
  if (numbered.length >= 2) return numbered.slice(0, 8);

  const byLine = q
    .split(/\n+/)
    .map((s) => s.trim().replace(/^[-•·]\s*/, ''))
    .filter((s) => s.length >= 4);
  if (byLine.length >= 2) return byLine.slice(0, 8);

  return [q];
}

/** 子问题意图标签（便于规则文案） */
export type SubQuestionIntent =
  | 'reason'
  | 'leave_path'
  | 'stay_path'
  | 'risk'
  | 'advice'
  | 'general';

export function classifySubQuestion(text: string): SubQuestionIntent {
  const t = text;
  if (/原因|为什么想|真正想|内心|心累|疲惫/.test(t)) return 'reason';
  if (/离职|离开|走了|不干|辞职/.test(t) && /走势|三个月|未来|之后|会怎样/.test(t))
    return 'leave_path';
  if (/留|转正|继续|不走/.test(t) && /走势|三个月|未来|之后|会怎样/.test(t))
    return 'stay_path';
  if (/风险|防范|小心|坑|注意/.test(t)) return 'risk';
  if (/建议|策略|怎么办|怎么做|行动|最终/.test(t)) return 'advice';
  if (/离职|辞职|离开/.test(t)) return 'leave_path';
  if (/留|转正/.test(t)) return 'stay_path';
  return 'general';
}
