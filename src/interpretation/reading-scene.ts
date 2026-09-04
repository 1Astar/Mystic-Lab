/**
 * 问题 → 场景（面）：本问 + 连载上集 → 透镜/主语/问法槽位。
 * 任意新问走同一条路，不靠个例关键词堆文案。
 */
import type { ReadingSeriesContext } from '../journal/reading-series.ts';
import type { QuestionTopic } from '../knowledge/types.ts';
import type { ReadingLens } from './card-psychology.ts';
import {
  resolveAskShape,
  type AskShape,
} from './ask-shape.ts';

export type QuestionSubject = 'father' | 'mother' | 'self' | 'partner' | 'other';

export type ReadingScene = {
  lens: ReadingLens;
  subject: QuestionSubject;
  ask: AskShape;
  /** @deprecated 用 ask.needsTimeline；保留兼容 */
  isActionOutcome: boolean;
  isFamily: boolean;
  contextBlob: string;
};

const FAMILY_RE =
  /爸|妈|父|母|家人|家庭|父母|公婆|孩子|亲子|爷爷|奶奶|外公|外婆/;

/** @deprecated 用 resolveAskShape；保留给旧调用 */
export function isActionOutcomeQuestion(question: string): boolean {
  const ask = resolveAskShape(question);
  return (
    ask.needsTimeline &&
    ask.slots.some((s) =>
      ['will_do', 'consequence', 'yes_no', 'choice'].includes(s.kind),
    )
  );
}

export function needsWholeSpreadPerCard(
  question: string,
  spreadType?: string,
  cardCount = 0,
): boolean {
  if (cardCount <= 1) return false;
  if (spreadType === 'past-present-future') return true;
  if (spreadType === 'situation-obstacle-advice') return true;
  return resolveAskShape(question).needsWholeSpread;
}

/** @deprecated 边界语气用 lens + ask；勿再当合成开关 */
export function isSafetyEntanglementQuestion(question: string): boolean {
  return /安全|摆脱|纠缠|骚扰|威胁/.test(question.trim());
}

function priorText(series?: ReadingSeriesContext | null): string {
  if (!series?.priorEpisodes?.length) return '';
  return series.priorEpisodes.map((e) => e.question).join('｜');
}

function inferSubjectFromBlob(blob: string): QuestionSubject {
  if (/我爸|父亲|爸爸/.test(blob)) return 'father';
  if (/我妈|母亲|妈妈/.test(blob)) return 'mother';
  if (/我对象|男友|女友|伴侣|老公|老婆/.test(blob)) return 'partner';
  if (/他(?!们)/.test(blob) && FAMILY_RE.test(blob)) return 'father';
  if (/她(?!们)/.test(blob) && FAMILY_RE.test(blob)) return 'mother';
  if (/他(?!们)/.test(blob)) return 'other';
  if (/她(?!们)/.test(blob)) return 'other';
  if (/我(?!们)|自己|本人/.test(blob)) return 'self';
  return 'other';
}

function lensFromTopic(topic: QuestionTopic): ReadingLens {
  if (topic === 'work') return 'work';
  if (topic === 'love') return 'love';
  if (topic === 'study') return 'study';
  return 'self';
}

export function resolveReadingScene(input: {
  question: string;
  topic?: QuestionTopic;
  series?: ReadingSeriesContext | null;
  sceneTags?: string[];
}): ReadingScene {
  const q = input.question.trim();
  const prior = priorText(input.series);
  const tags = (input.sceneTags ?? []).join(' ');
  const contextBlob = [q, prior, tags].filter(Boolean).join('｜');
  const ask = resolveAskShape(q);

  const isFamily =
    FAMILY_RE.test(q) ||
    FAMILY_RE.test(prior) ||
    /family|家庭|父母/.test(tags);

  let lens: ReadingLens;
  if (isFamily) lens = 'family';
  else if (/身体|健康|失眠|焦虑|医院|病|睡不|神经衰弱/.test(q)) lens = 'health';
  else if (/工作|求职|离职|面试|转正|老板|同事|项目|薪|offer/.test(q)) lens = 'work';
  else if (/感情|恋爱|分手|复合|喜欢|对象|伴侣|婚姻/.test(q)) lens = 'love';
  else if (/学业|考试|学习|考研|升学|学校/.test(q)) lens = 'study';
  else if (/钱|投资|理财|贷款|债/.test(q)) lens = 'self';
  else lens = lensFromTopic(input.topic ?? 'self');

  let subject = inferSubjectFromBlob(contextBlob);
  if (
    isFamily &&
    subject === 'other' &&
    /他|她/.test(q) &&
    !/我妈|母亲|妈妈|我爸|父亲|爸爸/.test(q)
  ) {
    subject = /她/.test(q) ? 'mother' : 'father';
  }

  return {
    lens,
    subject,
    ask,
    isActionOutcome: ask.needsTimeline,
    isFamily,
    contextBlob,
  };
}
