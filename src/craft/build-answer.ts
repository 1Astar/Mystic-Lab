/**
 * 造命 · 规则模板答问（零 LLM）
 * 提问 → 宫位 → 核心词 → 白话结论 → 本周任务
 */
import type { PersonProfile } from '../life/types.ts';
import { getPalaceLore } from '../ziwei/palace-lore.ts';
import { getStarLore } from '../ziwei/stars.ts';
import type { PalaceSnap, ZiweiChartView } from '../ziwei/types.ts';
import { castZiweiChart } from '../ziwei/cast.ts';
import { getCraftQuest, type CraftQuest } from './quests.ts';

export type CraftAnswer = {
  quest: CraftQuest;
  palaceTitle: string;
  palaceHint: string;
  keywords: string[];
  starBrief: string;
  /** 白话结论（正面引导） */
  conclusion: string;
  /** 破局点 / 考验 */
  challenge: string;
  weeklyTask: string;
  learnTip: string;
};

function findPalace(view: ZiweiChartView, name: string): PalaceSnap | undefined {
  const key = name.replace(/宫$/, '');
  return view.palaces.find((p) => p.name === name || p.name.replace(/宫$/, '') === key);
}

function starLine(palace: PalaceSnap | undefined): string {
  if (!palace) return '此宫暂无主星落点，可借三方四正来看场景。';
  const majors = palace.majors.map((s) => s.name).filter(Boolean);
  if (!majors.length) {
    return palace.isEmpty
      ? `${palace.name}偏空象——更像「借力场」，适合主动设计环境。`
      : `${palace.name}主星不显，先看辅星色调与对宫。`;
  }
  const bits = majors.map((n) => {
    const lore = getStarLore(n);
    return lore ? `${n}（${lore.epithet}）` : n;
  });
  return `${palace.name}主星：${bits.join('、')}`;
}

function rewriteChallenge(raw: string): string {
  return raw
    .replace(/煞忌/g, '考验信号')
    .replace(/忌与空/g, '空档与拉扯')
    .replace(/化忌/g, '需要减速验证的点')
    .replace(/破耗忌/g, '漏失风险')
    .replace(/不利/g, '需要小心的')
    .replace(/煞/g, '挑战')
    .replace(/忌/g, '考验');
}

export function buildCraftAnswer(
  view: ZiweiChartView,
  quest: CraftQuest,
): CraftAnswer {
  const lore = getPalaceLore(quest.palace);
  const palace = findPalace(view, quest.palace);
  const support = quest.supportPalace ? findPalace(view, quest.supportPalace) : undefined;
  const supportLore = quest.supportPalace ? getPalaceLore(quest.supportPalace) : undefined;

  const keywords = lore?.keywords?.slice(0, 4) ?? ['场景', '选择', '节奏'];
  const starBrief = starLine(palace);
  const supportBrief = support
    ? `辅看${support.name}：${starLine(support).replace(/^.*?主星：/, '主星 ')}`
    : '';

  const conclusionParts = [
    lore
      ? `围绕「${lore.hint}」来看：${lore.oneLiner}`
      : `先把问题落到${quest.palace}宫这个人生场景。`,
    starBrief,
  ];
  if (supportLore) {
    conclusionParts.push(
      `同时对照${supportLore.title}（${supportLore.hint}）：${supportLore.oneLiner}`,
    );
  }
  if (supportBrief) conclusionParts.push(supportBrief);

  const challengeRaw = lore?.watchOut ?? '把模糊期待写成可核对的一小步。';
  const challenge = `破局点：${rewriteChallenge(challengeRaw)}`;

  const leadStar = palace?.majors[0]?.name ?? '';
  const weeklyTask = quest.weeklyTask
    .replace(/\{star\}/g, leadStar || '你的主星')
    .replace(/\{palace\}/g, lore?.title ?? quest.palace);

  const learnTip = leadStar
    ? `紫微小课堂：你刚碰到「${leadStar}」。下次打开紫微图鉴，看看它在${lore?.title ?? quest.palace}的解释——可能有一句专属彩蛋。`
    : `紫微小课堂：下次打开紫微图鉴，点进「${lore?.title ?? quest.palace}」，把它当成人生场景卡来收集。`;

  return {
    quest,
    palaceTitle: lore?.title ?? `${quest.palace}宫`,
    palaceHint: lore?.hint ?? '人生场景',
    keywords,
    starBrief,
    conclusion: conclusionParts.filter(Boolean).join('\n\n'),
    challenge,
    weeklyTask,
    learnTip,
  };
}

export function resolveCraftAnswer(
  person: PersonProfile,
  questId: string,
): { ok: true; answer: CraftAnswer; view: ZiweiChartView } | { ok: false; error: string } {
  const quest = getCraftQuest(questId);
  if (!quest) return { ok: false, error: '未知问题' };
  const view = castZiweiChart(person, {
    intent: 'map',
    question: quest.question,
  });
  if ('error' in view) return { ok: false, error: view.error };
  return { ok: true, answer: buildCraftAnswer(view, quest), view };
}
