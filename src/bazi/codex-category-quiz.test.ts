import { describe, expect, it, beforeEach } from 'vitest';
import {
  CODEX_CATEGORY_QUIZZES,
  pickCategoryQuiz,
  quizzesForCategory,
} from './codex-category-quiz.ts';
import {
  browseCountForCategory,
  hasCategoryQuizDoneToday,
  markCategoryQuizResult,
  maybeOfferCategoryQuiz,
  recordCodexCategoryBrowse,
  resetCodexCategoryQuizStateForTests,
} from './codex-category-quiz-progress.ts';

describe('codex-category-quiz', () => {
  it('十神类含财星透出题', () => {
    const list = quizzesForCategory('tengod');
    expect(list.some((q) => q.id === 'cq-tengod-cai-tou')).toBe(true);
    expect(list[0]!.options.length).toBeGreaterThanOrEqual(2);
  });

  it('每类至少一题', () => {
    const cats = new Set(CODEX_CATEGORY_QUIZZES.map((q) => q.category));
    for (const c of [
      'relation',
      'stem',
      'branch',
      'tengod',
      'nayin',
      'jiazi',
      'luck',
    ] as const) {
      expect(cats.has(c), c).toBe(true);
      expect(pickCategoryQuiz(c, '2026-08-14')).not.toBeNull();
    }
  });

  it('神煞不出态度题', () => {
    expect(quizzesForCategory('shensha')).toEqual([]);
    expect(pickCategoryQuiz('shensha', '2026-08-18')).toBeNull();
  });
});

describe('codex-category-quiz-progress', () => {
  beforeEach(() => {
    resetCodexCategoryQuizStateForTests();
  });

  it('逛够两类词条后离开才出题', () => {
    expect(maybeOfferCategoryQuiz('tengod')).toBeNull();
    recordCodexCategoryBrowse('tengod', 'tg:正财');
    expect(maybeOfferCategoryQuiz('tengod')).toBeNull();
    recordCodexCategoryBrowse('tengod', 'tg:偏财');
    expect(browseCountForCategory('tengod')).toBe(2);
    const quiz = maybeOfferCategoryQuiz('tengod');
    expect(quiz?.category).toBe('tengod');
  });

  it('当日做过不再弹', () => {
    recordCodexCategoryBrowse('stem', '甲');
    recordCodexCategoryBrowse('stem', '乙');
    markCategoryQuizResult('stem', 'correct');
    expect(hasCategoryQuizDoneToday('stem')).toBe(true);
    recordCodexCategoryBrowse('stem', '丙');
    recordCodexCategoryBrowse('stem', '丁');
    expect(maybeOfferCategoryQuiz('stem')).toBeNull();
  });
});
