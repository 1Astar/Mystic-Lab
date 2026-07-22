import type { ReadingFacts } from './reading-facts.ts';

export type BianQuizOption = {
  id: string;
  text: string;
  correct: boolean;
};

export type BianQuiz = {
  prompt: string;
  options: BianQuizOption[];
  explain: string;
  action: string;
};

const DISTRACTORS = [
  '应立刻硬冲，把阻力一次性撞开。',
  '完全躺平不管，等事情自己消失。',
  '只看本卦、忽略变卦，当什么都没变。',
  '变卦等于注定结局，不用再做任何选择。',
  '动爻越多越好，越乱越要一次梭哈。',
];

function shuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** 变卦实战：三选一，选后揭正确释义 */
export function buildBianQuiz(facts: ReadingFacts): BianQuiz | null {
  if (!facts.changed) return null;

  const correctText = `变卦「${facts.changed.fullName}」在说：朝「${facts.changed.keywords[0]}」方向松动——适合观察后小步验证，而不是硬冲或放弃。`;
  const seed =
    facts.primary.name.charCodeAt(0) +
    facts.changed.name.charCodeAt(0) +
    facts.changing.indexes.reduce((a, b) => a + b, 0);

  const wrong = shuffle(DISTRACTORS, seed)
    .filter((d) => !d.includes(facts.changed!.keywords[0]!))
    .slice(0, 2);

  const options = shuffle(
    [
      { id: 'a', text: correctText, correct: true },
      { id: 'b', text: wrong[0]!, correct: false },
      { id: 'c', text: wrong[1]!, correct: false },
    ],
    seed + 7,
  );

  return {
    prompt: `【变卦实战】本卦「${facts.primary.fullName}」因动爻变成「${facts.changed.fullName}」。你觉得变卦更接近哪种读法？`,
    options,
    explain: `正确释义：风/观察、边界松动之类的关键词落在「${facts.changed.keywords.slice(0, 2).join('、')}」。白话：${facts.changed.gist}`,
    action: `行动指令：退半步看大局，朝「${facts.changed.keywords[0]}」做一次可验证的小实验。`,
  };
}

export function renderBianQuizHtml(quiz: BianQuiz): string {
  const opts = quiz.options
    .map(
      (o) => `
      <button type="button" class="ly-bian-opt" data-bian-opt="${o.id}" data-correct="${o.correct ? '1' : '0'}">
        ${o.text}
      </button>`,
    )
    .join('');

  return `
    <div class="ly-bian-quiz" data-bian-quiz>
      <p class="ly-guide-talk">${quiz.prompt}</p>
      <div class="ly-bian-opts">${opts}</div>
      <div class="ly-bian-reveal" data-bian-reveal hidden>
        <p class="ly-bian-feedback" data-bian-feedback></p>
        <p>${quiz.explain}</p>
        <p class="ly-guide-tip">${quiz.action}</p>
        <button type="button" class="ly-bian-retry" data-bian-retry>再试一次</button>
      </div>
    </div>
  `;
}

export function bindBianQuiz(root: HTMLElement): void {
  const box = root.querySelector<HTMLElement>('[data-bian-quiz]');
  if (!box) return;
  const reveal = box.querySelector<HTMLElement>('[data-bian-reveal]');
  const feedback = box.querySelector<HTMLElement>('[data-bian-feedback]');
  const opts = box.querySelectorAll<HTMLButtonElement>('[data-bian-opt]');

  const reset = () => {
    reveal!.hidden = true;
    opts.forEach((b) => {
      b.disabled = false;
      b.classList.remove('is-right', 'is-wrong');
    });
  };

  opts.forEach((btn) => {
    btn.addEventListener('click', () => {
      const ok = btn.dataset.correct === '1';
      opts.forEach((b) => {
        b.disabled = true;
        if (b.dataset.correct === '1') b.classList.add('is-right');
      });
      btn.classList.add(ok ? 'is-right' : 'is-wrong');
      if (feedback) {
        feedback.textContent = ok ? '答对了——变卦是这样读的。' : '差一点点——正确读法如下。';
      }
      if (reveal) reveal.hidden = false;
    });
  });

  box.querySelector('[data-bian-retry]')?.addEventListener('click', reset);
}
