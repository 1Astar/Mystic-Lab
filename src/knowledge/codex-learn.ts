import type { CardKnowledge, LifeSceneCue } from './types.ts';
import { formatMisreadingFriendly } from './misreading-copy.ts';

function clip(text: string, max = 200): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const last = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('；'), cut.lastIndexOf('，'));
  return `${(last > 40 ? cut.slice(0, last + 1) : cut).replace(/[，、；]+$/, '')}…`;
}

function stripSceneLead(text: string): string {
  return text
    .trim()
    .replace(/^(工作|感情|学业|自我层面)上[，,：:]\s*/, '')
    .replace(/^财富议题里[，,：:]\s*/, '')
    .replace(/^里[，,]\s*/, '');
}

/** 手写优先；否则从工作/感情/财富压成具体情境（去掉百科口吻前缀） */
export function resolveLifeScenes(knowledge: CardKnowledge): LifeSceneCue[] {
  if (knowledge.lifeScenes?.length) return knowledge.lifeScenes;

  const scenes: LifeSceneCue[] = [];
  const work = knowledge.workMeaning?.trim();
  const love = knowledge.loveMeaning?.trim();
  const wealth = knowledge.wealthMeaning?.trim() || knowledge.studyMeaning?.trim();

  if (work) {
    scenes.push({
      icon: '💼',
      when: '如果你在职场里纠结',
      body: clip(stripSceneLead(work), 120),
    });
  }
  if (love) {
    scenes.push({
      icon: '❤️',
      when: '如果你在感情关系里',
      body: clip(stripSceneLead(love), 120),
    });
  }
  if (wealth) {
    scenes.push({
      icon: '🙋',
      when: '如果你在谈机会或资源',
      body: clip(stripSceneLead(wealth), 120),
    });
  }
  return scenes.slice(0, 3);
}

export function resolveDailyPractice(knowledge: CardKnowledge): string {
  if (knowledge.dailyPractice?.trim()) return knowledge.dailyPractice.trim();
  const name = knowledge.nameCn;
  const kw = knowledge.keywords.slice(0, 2).join('、') || name;
  return [
    `闭上眼睛，默念「此刻我最不愿面对的是什么？」然后回想【${name}】的画面。`,
    `试试看：它让你看见的，是哪一件与「${kw}」有关、却一直被推开的事？`,
  ].join('\n');
}

export function resolveAlertMisreading(knowledge: CardKnowledge): string {
  const raw = knowledge.misreadings?.[0]?.trim();
  if (!raw) {
    return `【${knowledge.nameCn}】不是绝对好坏的判决——先对照你的具体问题，再下结论。不要过早定论。`;
  }
  return formatMisreadingFriendly(knowledge.nameCn, raw);
}

export function resolveUprightBrief(knowledge: CardKnowledge): string {
  return clip(knowledge.uprightMeaning, 200);
}

export function resolveReversedBrief(knowledge: CardKnowledge): string {
  return clip(knowledge.reversedMeaning, 200);
}
