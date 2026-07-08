import { detectQuestionTheme, type QuestionTheme } from '../codex/collection.ts';
import { isClosedQuestion, questionKindLabel } from './question-guide.ts';

export type QuestionPattern =
  | 'love_likes'
  | 'love_return'
  | 'interview'
  | 'offer'
  | 'quit'
  | 'generic_closed'
  | 'open';

export type QuestionAngle = {
  id: string;
  label: string;
  question: string;
};

export type QuestionCoachResult = {
  originalQuestion: string;
  activeQuestion: string;
  topic: QuestionTheme;
  pattern: QuestionPattern;
  isClosed: boolean;
  personName?: string;
  note?: string;
  genericSuggestions: string[];
  angles: QuestionAngle[];
};

const GENERIC_OPEN_SUGGESTIONS = [
  '我现在需要看清什么？',
  '我可以怎么调整？',
  '这件事的阻碍和机会分别是什么？',
];

const CLOSED_RE =
  /会不会|能不能|是不是|该不该|顺不顺|喜不喜欢|要不要|可不可以|能否|有没有可能|什么时候|何时|多久|哪一天|吗[？?]?$/;

function detectClosed(q: string): boolean {
  return isClosedQuestion(q) || CLOSED_RE.test(q);
}

function extractPersonName(q: string): string | undefined {
  const patterns = [
    /^(.{1,12}?)\s*喜欢我吗/,
    /^(.{1,12}?)\s*是不是喜欢我/,
    /(.{1,12}?)\s*对我有感觉吗/,
    /(.{1,12}?)\s*爱不爱我/,
  ];
  for (const re of patterns) {
    const m = q.match(re);
    if (m?.[1]) {
      const name = m[1].replace(/[他她它\s]/g, '').trim();
      if (name && name.length <= 8 && !/^(他|她|对方|这个人)$/.test(name)) {
        return name;
      }
    }
  }
  return undefined;
}

function detectPattern(q: string, topic: QuestionTheme): QuestionPattern {
  if (/回来|复合|回头|还会联系/.test(q) && topic === 'love') return 'love_return';
  if (/喜欢我|是不是喜欢|爱不爱|有感觉|喜欢我吗/.test(q) && topic === 'love') return 'love_likes';
  if (/面试/.test(q) && topic === 'work') return 'interview';
  if (/offer|录用|拿到.*机会|能不能进/.test(q) && topic === 'work') return 'offer';
  if (/辞职|离职|要不要走|该不该走/.test(q) && topic === 'work') return 'quit';
  if (detectClosed(q)) return 'generic_closed';
  return 'open';
}

function buildAngles(
  q: string,
  pattern: QuestionPattern,
  personName?: string,
): QuestionAngle[] {
  const who = personName ?? '他';

  switch (pattern) {
    case 'love_likes':
      return [
        { id: 'direct', label: '直接问', question: q },
        { id: 'tendency', label: '看倾向', question: `${who}对我的情感倾向是什么？` },
        { id: 'signals', label: '看信号', question: `${who}哪些行为值得我留意？` },
        { id: 'block', label: '看阻碍', question: '为什么这段关系还没有明朗？' },
        { id: 'next', label: '看下一步', question: '我该如何确认他的心意？' },
      ];

    case 'love_return':
      return [
        { id: 'direct', label: '直接问', question: q },
        { id: 'tendency', label: '看倾向', question: '这段关系里还留着怎样的情感联结？' },
        { id: 'block', label: '看阻碍', question: '是什么让关系停在现在这一步？' },
        { id: 'next', label: '看下一步', question: '我该如何面对这段关系里的不确定？' },
      ];

    case 'interview':
      return [
        { id: 'direct', label: '直接问', question: q },
        { id: 'focus', label: '看注意点', question: '明天面试我最需要注意什么？' },
        { id: 'strength', label: '看优势', question: '我该如何更好地展示自己的优势？' },
        { id: 'meaning', label: '看意义', question: '这次机会对我来说意味着什么？' },
      ];

    case 'offer':
      return [
        { id: 'direct', label: '直接问', question: q },
        { id: 'trend', label: '看趋势', question: '我走向这个机会的可能性如何？' },
        { id: 'block', label: '看阻碍', question: '我提升这次机会成功率的关键卡点是什么？' },
        { id: 'action', label: '看行动', question: '我下一步该抓住什么机会？' },
      ];

    case 'quit':
      return [
        { id: 'direct', label: '直接问', question: q },
        { id: 'feeling', label: '看感受', question: '我现在对这份工作的真实感受是什么？' },
        { id: 'risk', label: '看风险', question: '我需要评估哪些风险？' },
        { id: 'need', label: '看需要', question: '我真正需要从下一份工作里得到什么？' },
      ];

    case 'generic_closed':
      if (/找工作|新工作|失业|换工作|offer|录用/.test(q)) {
        return [
          { id: 'direct', label: '直接问', question: q },
          { id: 'block', label: '看阻碍', question: '我找工作路上最大的阻碍是什么？' },
          { id: 'both', label: '看两面', question: '找工作的阻碍和机会分别是什么？' },
          { id: 'action', label: '看行动', question: '我下一步该怎样提高找到工作的可能性？' },
        ];
      }
      return [
        { id: 'direct', label: '直接问', question: q },
        { id: 'see', label: '看本质', question: '我现在需要看清什么？' },
        { id: 'adjust', label: '看调整', question: '我可以怎么调整？' },
        { id: 'both', label: '看两面', question: '这件事的阻碍和机会分别是什么？' },
      ];

    default:
      return [{ id: 'direct', label: '继续占问', question: q }];
  }
}

function buildNote(pattern: QuestionPattern, _q: string, personName?: string): string | undefined {
  switch (pattern) {
    case 'love_likes':
      return personName
        ? `你可以直接保留「${personName}喜欢我吗」。塔罗更适合看这段关系里的情感倾向、信号和阻碍，而不是替对方做绝对宣判。`
        : '你可以直接保留原问题。塔罗更适合看情感倾向、信号和阻碍，而不是替对方做绝对宣判。';

    case 'love_return':
      return '你可以直接问会不会回来。牌会帮你看联结、距离和你可以怎么面对不确定。';

    case 'interview':
    case 'offer':
      return '封闭式问题也能占。若换开放式角度，牌往往更容易给出可行动的建议。';

    case 'quit':
      return '要不要辞职可以直接问。也可以先看真实感受与风险，再决定下一步。';

    case 'generic_closed':
      return '这是封闭式问题（想要一个确定答案）。可以直接占问；若换成开放式角度，牌往往更容易给出「看清什么、怎么调整」。';

    default:
      return '这是开放式问题，适合看清阻碍、机会与行动方向。';
  }
}

function buildGenericSuggestions(pattern: QuestionPattern): string[] {
  if (pattern === 'open') return [];
  return [...GENERIC_OPEN_SUGGESTIONS];
}

export function getQuestionTypeLabel(isClosed: boolean): string {
  return isClosed ? '封闭式' : '开放式';
}

export { questionKindLabel };

export function analyzeQuestion(raw: string): QuestionCoachResult | null {
  const originalQuestion = raw.trim();
  if (originalQuestion.length < 2) return null;

  const topic = detectQuestionTheme(originalQuestion);
  const pattern = detectPattern(originalQuestion, topic);
  const personName = pattern === 'love_likes' ? extractPersonName(originalQuestion) : undefined;
  const isClosed = pattern !== 'open';

  return {
    originalQuestion,
    activeQuestion: originalQuestion,
    topic,
    pattern,
    isClosed,
    personName,
    note: buildNote(pattern, originalQuestion, personName),
    genericSuggestions: buildGenericSuggestions(pattern),
    angles: buildAngles(originalQuestion, pattern, personName),
  };
}

export function applyQuestionAngle(
  coach: QuestionCoachResult,
  angleId: string,
): QuestionCoachResult {
  const angle = coach.angles.find((a) => a.id === angleId);
  if (!angle) return coach;
  return { ...coach, activeQuestion: angle.question };
}
