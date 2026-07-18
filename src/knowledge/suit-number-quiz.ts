import { formatCardNameZh } from '../tarot/card-names.ts';
import { TAROT_DECK, type CardDefinition } from '../tarot/deck.ts';
import {
  COMBINATION_EXAMPLES,
  NUMBER_STAGES,
  SUIT_GROUPS,
  type SuitGroup,
} from './minor-structure.ts';

export type SuitNumberQuizOption = {
  id: string;
  /** 如「行动 + 加速」 */
  label: string;
  correct: boolean;
};

export type SuitNumberQuizItem = {
  deckId: string;
  nameCn: string;
  suitLabel: string;
  num: string;
  prompt: string;
  options: SuitNumberQuizOption[];
  correctFeedback: string;
  wrongFeedback: string;
};

const RANK_TO_NUM: Record<string, string> = {
  Ace: '1',
  Two: '2',
  Three: '3',
  Four: '4',
  Five: '5',
  Six: '6',
  Seven: '7',
  Eight: '8',
  Nine: '9',
  Ten: '10',
};

function suitOf(card: CardDefinition): SuitGroup | undefined {
  return SUIT_GROUPS.find((s) => s.key === card.suit);
}

function numOf(card: CardDefinition) {
  if (card.arcana !== 'minor' || !card.rank) return undefined;
  const n = RANK_TO_NUM[card.rank];
  if (!n) return undefined;
  return NUMBER_STAGES.find((s) => s.num === n);
}

/** 选项短标签：领域关键词 + 阶段关键词 */
export function optionLabel(suitTheme: string, numTheme: string): string {
  const domain = suitTheme.split('、')[0]?.trim() || suitTheme;
  const stage = numTheme.split('、')[0]?.trim() || numTheme;
  return `${domain} + ${stage}`;
}

function elementWord(hint: string): string {
  const m = hint.match(/^(.{1,3}元素)/);
  return m?.[1] ?? '这组牌';
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pipMinors(): CardDefinition[] {
  return TAROT_DECK.filter((c) => c.arcana === 'minor' && numOf(c));
}

/**
 * 生成一道「牌组 × 数字」猜谜。
 * @param rand 可注入随机源，便于测试
 */
export function buildSuitNumberQuiz(rand: () => number = Math.random): SuitNumberQuizItem | null {
  const pool = pipMinors();
  if (pool.length < 2) return null;

  const card = pool[Math.floor(rand() * pool.length)]!;
  const suit = suitOf(card);
  const stage = numOf(card);
  if (!suit || !stage) return null;

  const correctLabel = optionLabel(suit.theme, stage.theme);

  const distractors: string[] = [];
  for (const other of shuffle(pool, rand)) {
    if (other.id === card.id) continue;
    const os = suitOf(other);
    const on = numOf(other);
    if (!os || !on) continue;
    const label = optionLabel(os.theme, on.theme);
    if (label === correctLabel) continue;
    if (!distractors.includes(label)) distractors.push(label);
    if (distractors.length >= 2) break;
  }
  if (distractors.length === 0) return null;

  const options: SuitNumberQuizOption[] = shuffle(
    [
      { id: 'correct', label: correctLabel, correct: true },
      ...distractors.slice(0, 2).map((label, i) => ({
        id: `wrong-${i}`,
        label,
        correct: false,
      })),
    ],
    rand,
  );

  const nameCn = formatCardNameZh(card);
  const example = COMBINATION_EXAMPLES.find((e) => e.deckId === card.id);
  const element = elementWord(suit.hint);

  const correctFeedback = example
    ? `答对了！${example.reading}`
    : `答对了！${element}的「${suit.theme.split('、')[0]}」遇上「${stage.theme.split('、')[0]}」——${nameCn}常在说：领域在${suit.label}，阶段偏${stage.label}（${stage.theme}）。`;

  const wrongFeedback = `更偏向「${correctLabel}」哦。${suit.label}代表${suit.theme}；${stage.num}（${stage.label}）代表${stage.theme}。合起来读：${nameCn}。`;

  return {
    deckId: card.id,
    nameCn,
    suitLabel: suit.label,
    num: stage.num,
    prompt: '你觉得这代表什么领域和什么阶段？',
    options,
    correctFeedback,
    wrongFeedback,
  };
}
