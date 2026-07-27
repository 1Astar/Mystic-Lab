import type { QuestionTopic } from '../knowledge/types.ts';

/** 职场题里常见的跑题套话（恋爱/旧情/原生家庭等） */
const WORK_OFFTOPIC_SOURCE =
  '旧情人|前任|恋爱|单身|表白|分手|复合|婚姻|伴侣|喜欢我|他人.*看我|原生家庭|父母干涉|情感关系|两性|约会|暧昧|心动对方';

function workOfftopicRe(): RegExp {
  return new RegExp(WORK_OFFTOPIC_SOURCE, 'g');
}

/**
 * 强裁剪：主题锁定为 work 时，删掉明显跑题的句子。
 * 若整段被清空，回退原文（避免误杀），由上层规则文案兜底。
 */
export function sanitizeTopicText(text: string, topic: QuestionTopic): string {
  if (topic !== 'work' || !text.trim()) return text;

  const re = workOfftopicRe();
  const parts = text
    .split(/(?<=[。！？\n])/)
    .map((s) => s.trim())
    .filter(Boolean);

  const kept = parts.filter((s) => !workOfftopicRe().test(s));

  if (!kept.length) return text;
  if (kept.length === parts.length) {
    const scrubbed = text.replace(re, '').replace(/[，、]{2,}/g, '，').trim();
    return scrubbed || text;
  }
  return kept.join('');
}

export function looksLikeWorkQuestion(question: string): boolean {
  return /工作|事业|职场|换工作|找工作|求职|offer|面试|跳槽|升职|项目|辞职|离职|转正|试用|年假|薪资|薪水|裁员|加班|同事|老板|汇报|绩效|合同|入职/.test(
    question,
  );
}
