import { detectQuestionTheme, type QuestionTheme } from '../codex/collection.ts';
import { isClosedQuestion, questionKindLabel } from './question-guide.ts';

export type QuestionPattern =
  | 'love_likes'
  | 'love_return'
  | 'love_contact'
  | 'love_third'
  | 'interview'
  | 'offer'
  | 'quit'
  | 'job_search'
  | 'promotion'
  | 'team_conflict'
  | 'study_exam'
  | 'study_path'
  | 'money'
  | 'move_city'
  | 'anxiety_decide'
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

const JOB_SEARCH_RE = /找工作|找到.*工作|下一份工作|新工作|失业|换工作|跳槽|求职|offer|录用/;

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
  if (/第三者|劈腿|出轨|有别人/.test(q) && topic === 'love') return 'love_third';
  if (/联系|找他|找她|主动吗|要不要找/.test(q) && topic === 'love') return 'love_contact';

  if (/面试/.test(q) && topic === 'work') return 'interview';
  if (/offer|录用|拿到.*机会|能不能进/.test(q) && topic === 'work') return 'offer';
  if (/辞职|离职|要不要走|该不该走/.test(q) && topic === 'work') return 'quit';
  if (/升职|加薪|绩效|晋升/.test(q) && topic === 'work') return 'promotion';
  if (/同事|领导|汇报|冲突|上司|团队/.test(q) && topic === 'work') return 'team_conflict';
  if (JOB_SEARCH_RE.test(q) && (topic === 'work' || detectClosed(q))) return 'job_search';

  if (/考试|过不过|分数|四级|六级|高考|中考/.test(q) && topic === 'study') return 'study_exam';
  if (/志愿|考研|读研|留学|换专业|要不要读/.test(q) && topic === 'study') return 'study_path';

  if (/理财|投资|股票|基金|买不买|花不花|存钱/.test(q)) return 'money';
  if (/搬家|换城市|出去|定居|留不留/.test(q)) return 'move_city';

  if (detectClosed(q) && /纠结|犹豫|要不要|该不该|能不能/.test(q)) return 'anxiety_decide';
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

    case 'love_contact':
      return [
        { id: 'direct', label: '直接问', question: q },
        { id: 'bond', label: '看联结', question: '我们之间现在还留着怎样的联结？' },
        { id: 'boundary', label: '看边界', question: '此刻主动联系对我意味着什么？' },
        { id: 'next', label: '看下一步', question: '我怎样处理想联系又不想勉强的心情？' },
      ];

    case 'love_third':
      return [
        { id: 'direct', label: '直接问', question: q },
        { id: 'see', label: '看倾向', question: '我在这段关系里需要先看清什么？' },
        { id: 'face', label: '看面对', question: '我该如何面对这份不确定与不安？' },
        { id: 'boundary', label: '看边界', question: '我真正需要守住的界限是什么？' },
      ];

    case 'interview':
      return [
        { id: 'direct', label: '直接问', question: q },
        { id: 'focus', label: '看注意点', question: '面试我最需要注意什么？' },
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

    case 'job_search':
      return [
        { id: 'direct', label: '直接问', question: q },
        { id: 'block', label: '看阻碍', question: '我找工作路上最大的阻碍是什么？' },
        { id: 'both', label: '看两面', question: '找工作的阻碍和机会分别是什么？' },
        { id: 'action', label: '看行动', question: '我下一步该怎样提高找到工作的可能性？' },
      ];

    case 'promotion':
      return [
        { id: 'direct', label: '直接问', question: q },
        { id: 'see', label: '看清什么', question: '关于升职/加薪，我现在最需要看清什么？' },
        { id: 'block', label: '看卡点', question: '阻碍我推进的关键卡点是什么？' },
        { id: 'action', label: '看行动', question: '我下一步可以怎么调整以增加机会？' },
      ];

    case 'team_conflict':
      return [
        { id: 'direct', label: '直接问', question: q },
        { id: 'dynamic', label: '看动态', question: '这段职场关系里正在发生什么？' },
        { id: 'adjust', label: '看调整', question: '我可以怎么调整自己的应对方式？' },
        { id: 'boundary', label: '看边界', question: '我需要守住哪些界限？' },
      ];

    case 'study_exam':
      return [
        { id: 'direct', label: '直接问', question: q },
        { id: 'focus', label: '看重点', question: '备考阶段我最该抓住什么重点？' },
        { id: 'mind', label: '看心态', question: '我怎样调整考试焦虑更有效？' },
        { id: 'meaning', label: '看意义', question: '这次考试对我真正意味着什么？' },
      ];

    case 'study_path':
      return [
        { id: 'direct', label: '直接问', question: q },
        { id: 'need', label: '看需要', question: '我真正需要从这条学业路径里得到什么？' },
        { id: 'risk', label: '看风险', question: '我需要评估哪些风险与代价？' },
        { id: 'both', label: '看两面', question: '继续与调整的阻碍和机会分别是什么？' },
      ];

    case 'money':
      return [
        { id: 'direct', label: '直接问', question: q },
        { id: 'need', label: '看需要', question: '这笔财务决定背后，我真正需要的是什么？' },
        { id: 'risk', label: '看风险', question: '我需要正视哪些风险与底线？' },
        { id: 'see', label: '看清什么', question: '做决定前我还缺看清什么？' },
      ];

    case 'move_city':
      return [
        { id: 'direct', label: '直接问', question: q },
        { id: 'why', label: '看动机', question: '我想换环境的真实动机是什么？' },
        { id: 'risk', label: '看风险', question: '搬家/换城市需要评估哪些得失？' },
        { id: 'adapt', label: '看适应', question: '到了新环境，我最需要调整什么？' },
      ];

    case 'anxiety_decide':
      return [
        { id: 'direct', label: '直接问', question: q },
        { id: 'see', label: '看本质', question: '我现在需要看清什么？' },
        { id: 'adjust', label: '看调整', question: '我可以怎么调整？' },
        { id: 'both', label: '看两面', question: '这件事的阻碍和机会分别是什么？' },
      ];

    case 'generic_closed':
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

    case 'love_contact':
      return '要不要联系可以直接问。也可以先看联结与边界，再决定是否主动。';

    case 'love_third':
      return '封闭式怀疑也能占。牌更适合帮你看清自己该面对什么、守住什么，而不是下罪名式结论。';

    case 'interview':
    case 'offer':
    case 'job_search':
    case 'promotion':
      return '封闭式问题也能占。若换开放式角度，牌往往更容易给出可行动的建议。';

    case 'quit':
      return '要不要辞职可以直接问。也可以先看真实感受与风险，再决定下一步。';

    case 'team_conflict':
      return '职场关系问题可以直接问。也可以看互动动态与你能调整的部分。';

    case 'study_exam':
    case 'study_path':
      return '学业决定可以直接问。开放式角度更容易看见重点、风险与真实需要。';

    case 'money':
      return '财务决定可以直接问。牌适合帮你看清需要、风险与底线，不做具体荐股。';

    case 'move_city':
      return '去留可以直接问。也可以先看动机、得失与适应面。';

    case 'anxiety_decide':
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
