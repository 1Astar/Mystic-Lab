/**
 * 图鉴分类小挑战浮层
 */
import type { CodexQuiz } from '../bazi/codex-category-quiz.ts';
import { markCategoryQuizResult } from '../bazi/codex-category-quiz-progress.ts';
import { markLearnInteraction } from '../bazi/learn-store.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type OpenCodexCategoryQuizOpts = {
  quiz: CodexQuiz;
  onClose?: () => void;
};

export function openCodexCategoryQuiz(opts: OpenCodexCategoryQuizOpts): void {
  document.querySelector('.bazi-codex-quiz')?.remove();
  const { quiz } = opts;
  const root = document.createElement('div');
  root.className = 'bazi-codex-quiz is-open';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', '分类小挑战');

  const paint = (phase: 'ask' | 'result', picked?: string) => {
    const correct = picked === quiz.answerId;
    root.innerHTML = `
      <button type="button" class="bazi-codex-quiz-backdrop" data-quiz-skip aria-label="关闭"></button>
      <div class="bazi-codex-quiz-panel">
        <p class="bazi-codex-quiz-kicker">小挑战 · ${escapeHtml(quiz.categoryLabel)}</p>
        <h2 class="bazi-codex-quiz-title">逛完一类，巩固一下</h2>
        <p class="bazi-codex-quiz-prompt">${escapeHtml(quiz.prompt)}</p>
        ${
          phase === 'ask'
            ? `<div class="bazi-codex-quiz-options" role="group">
                ${quiz.options
                  .map(
                    (o) => `
                  <button type="button" class="bazi-codex-quiz-opt" data-quiz-opt="${escapeHtml(o.id)}">
                    ${escapeHtml(o.label)}
                  </button>`,
                  )
                  .join('')}
              </div>
              <button type="button" class="bazi-codex-quiz-skip" data-quiz-skip>下次再说</button>`
            : `<div class="bazi-codex-quiz-result ${correct ? 'is-ok' : 'is-no'}">
                <p class="bazi-codex-quiz-verdict">${correct ? '答对了' : '再记一记'}</p>
                <p class="bazi-codex-quiz-explain">${escapeHtml(
                  correct ? quiz.explainCorrect : quiz.explainWrong,
                )}</p>
                <button type="button" class="bazi-codex-quiz-done" data-quiz-close>继续逛图鉴</button>
              </div>`
        }
      </div>`;

    const close = (result: 'correct' | 'wrong' | 'skip') => {
      markCategoryQuizResult(quiz.category, result);
      if (result !== 'skip') {
        markLearnInteraction(`codex-quiz:${quiz.category}:${quiz.id}`);
      }
      root.remove();
      opts.onClose?.();
    };

    root.querySelectorAll<HTMLButtonElement>('[data-quiz-skip]').forEach((btn) => {
      btn.addEventListener('click', () => close('skip'));
    });
    root.querySelectorAll<HTMLButtonElement>('[data-quiz-opt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.quizOpt || '';
        paint('result', id);
      });
    });
    root.querySelector('[data-quiz-close]')?.addEventListener('click', () => {
      const ok = picked === quiz.answerId;
      close(ok ? 'correct' : 'wrong');
    });
  };

  paint('ask');
  document.body.appendChild(root);
}
