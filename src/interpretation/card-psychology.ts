import type { QuestionTopic } from '../knowledge/types.ts';
import type { CardReading } from './types.ts';

/** 解读透镜：在 QuestionTopic 之外补家庭/身心等语境 */
export type ReadingLens = 'family' | 'love' | 'work' | 'study' | 'health' | 'self';

const LENS_LABEL: Record<ReadingLens, string> = {
  family: '家庭',
  love: '感情',
  work: '职场',
  study: '学业',
  health: '身心',
  self: '自我',
};

export function resolveReadingLens(question: string, fallbackTopic: QuestionTopic): ReadingLens {
  const q = question.trim();
  if (/爸|妈|父|母|家人|家庭|父母|公婆|孩子|亲子|爷爷|奶奶|外公|外婆/.test(q)) return 'family';
  if (/身体|健康|失眠|焦虑|医院|病|睡不|神经衰弱/.test(q)) return 'health';
  if (/工作|求职|离职|面试|转正|老板|同事|项目/.test(q)) return 'work';
  if (/感情|恋爱|分手|复合|喜欢|对象|伴侣|婚姻/.test(q)) return 'love';
  if (/学业|考试|学习|考研|升学|学校/.test(q)) return 'study';
  if (fallbackTopic === 'work') return 'work';
  if (fallbackTopic === 'love') return 'love';
  if (fallbackTopic === 'study') return 'study';
  return 'self';
}

/** 母题：牌的核心情绪基调 */
export function motherTheme(card: CardReading): string {
  const kw = card.keywords.filter(Boolean).slice(0, 3).join('、');
  if (kw) return kw;
  const one = card.interpretationLayers.standard.oneSentence?.trim();
  if (one) return one.length > 36 ? `${one.slice(0, 34)}…` : one;
  return card.cardName;
}

function sceneMeaningForLens(card: CardReading, lens: ReadingLens): string {
  const sc = card.selectedCard;
  switch (lens) {
    case 'family':
      return (sc.selfMeaning || sc.loveMeaning || '').trim();
    case 'love':
      return (sc.loveMeaning || '').trim();
    case 'work':
      return (sc.workMeaning || '').trim();
    case 'study':
      return (sc.studyMeaning || '').trim();
    case 'health':
      return (sc.selfMeaning || '').trim();
    default:
      return (sc.selfMeaning || '').trim();
  }
}

/** 意象素描：先看画面，再查书 */
export function imageSketch(card: CardReading): string {
  const vo = card.selectedCard.visualOverview?.trim();
  if (vo && vo.length > 16) {
    return vo.length > 140 ? `${vo.slice(0, 138)}…` : vo;
  }
  const orient = card.orientation === 'reversed' ? '逆位' : '正位';
  const kw = card.keywords.slice(0, 3).join('、') || '张力、停顿、注视';
  return `${card.cardName}（${orient}）：先盯画面 30 秒——人物在做什么？颜色偏冷还是暖？用三个形容词描述感受（例如：${kw}）。这就是解牌的钩子。`;
}

function subThemeLine(lens: ReadingLens, mother: string, card: CardReading): string {
  const scene = sceneMeaningForLens(card, lens);
  if (scene) {
    const short = scene.length > 110 ? `${scene.slice(0, 108)}…` : scene;
    return `母题「${mother}」→ ${LENS_LABEL[lens]}子题：${short}`;
  }
  const fallbacks: Record<ReadingLens, string> = {
    family: '家庭里更像牵挂、未说出口的担忧，或想了解对方处境的冲动。',
    love: '感情里更像依恋、距离感，或心里还没放下的那一块。',
    work: '职场里更像压力、选择，或对未来的不确定。',
    study: '学业里更像准备度、心态起伏，或对结果的想象。',
    health: '身心层面更像绷紧、失眠式焦虑，或身体在替你发声。',
    self: '个人状态里更像内在在催促你正视某种感受。',
  };
  return `母题「${mother}」在${LENS_LABEL[lens]}语境：${fallbacks[lens]}`;
}

/** 共时性：问句与牌面的情绪共振 */
export function resonanceHook(question: string, card: CardReading): string {
  const snippet = question.length > 42 ? `${question.slice(0, 40)}…` : question;
  const tone = /为什么|怎么|会不会|能不能|吗/.test(question)
    ? '你在追问背后的动因'
    : '你在感受当下的局面';
  const mother = motherTheme(card);
  const orientNote =
    card.orientation === 'reversed'
      ? '逆位让能量更内化、受阻，宜先处理情绪再谈行动。'
      : '正位时能量较外显，适合把感受说出来或写下来。';
  return `共时性共振：问「${snippet}」的这一刻，${card.cardName} 像镜子接住信号——${tone}；母题是「${mother}」。${orientNote}`;
}

function contextWithNeighbors(cards: CardReading[], index: number): string {
  const prev = index > 0 ? cards[index - 1] : null;
  const next = index < cards.length - 1 ? cards[index + 1] : null;
  if (!prev && !next) return '';
  const parts: string[] = [];
  if (prev) parts.push(`前一张【${prev.cardName}】`);
  if (next) parts.push(`后一张【${next.cardName}】`);
  return `语境串联：${parts.join('，')}——用「因为 A，所以 B」串起来读，别孤立背牌意。`;
}

export type PsychologyInsight = {
  meaningMap: string;
  insight: string;
  action?: string;
};

/**
 * 三明治解读：点题 → 画面/母题子题 → 潜意识层
 * 对应「牌意心理学 + 共时性直觉共振」
 */
export function buildPsychologyInsight(
  card: CardReading,
  question: string,
  lens: ReadingLens,
  allCards: CardReading[],
  index: number,
): PsychologyInsight {
  const mother = motherTheme(card);
  const sketch = imageSketch(card);
  const sub = subThemeLine(lens, mother, card);
  const resonance = resonanceHook(question, card);
  const neighbor = contextWithNeighbors(allCards, index);

  const coreEnergy =
    card.orientation === 'reversed'
      ? '能量偏内收、阻滞，需要先命名「我最卡在哪里」。'
      : '能量偏外显、可被觉察，适合把感受翻译成一句人话。';

  const meaningMap = `${resonance}\n意象素描：${sketch}`;

  const insight = [
    `点题：这张牌的核心能量是【${mother}】，${coreEnergy}`,
    sub,
    neighbor,
    card.orientation === 'reversed'
      ? '潜意识：逆位时别死记标准释义——先问「我现在最怕/最睡不着的是什么？」比查书更准。'
      : '潜意识：正位时牌在指向一种可说出口的需要；用「我正在感受___」开头写一句给自己。',
  ]
    .filter(Boolean)
    .join('\n');

  const action =
    lens === 'family'
      ? '『分清：这是他的事、你的事，还是家庭的事——再决定要不要问清楚。』'
      : lens === 'health'
        ? '『今晚先做一件让身体松下来的小事（散步、热水、早睡），再谈大决定。』'
        : '『写下三个盯牌面时冒出来的形容词，用它们写一句给自己的话。』';

  return { meaningMap, insight, action };
}

export function buildSpreadOverallPsychology(
  cards: CardReading[],
  question: string,
  lens: ReadingLens,
): string {
  const names = cards.map((c) => c.cardName).join('、');
  const mothers = cards.map((c) => motherTheme(c)).join(' → ');
  return `整盘（${names}）在${LENS_LABEL[lens]}议题里形成一条情绪线：${mothers}。牌是镜子，不是判决书——把抽象感受变具象，再决定下一步。`;
}

export function empathyForLens(lens: ReadingLens, cards: CardReading[]): string {
  const names = cards.map((c) => c.cardName).join('、');
  if (lens === 'family') {
    return `牌阵（${names}）照见的是家庭里的牵挂与未说出口的部分——答案不在牌里，在你如何理解这段关系。`;
  }
  return `根据牌阵（${names}），我先帮你把画面与感受对齐——直觉共振往往比死记牌意更准。`;
}
