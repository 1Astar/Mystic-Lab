/** 紫微边看边问：星曜 / 宫位概念本地答 */
import { getStarLore, MAJOR_STARS, type StarCard } from './stars.ts';
import { getPalaceLore, PALACE_LORE } from './palace-lore.ts';
import { isStarPmCaptureReady, postStarPmIdeaCapture } from '../ai/star-pm-endpoint.ts';

function norm(s: string): string {
  return s.replace(/\s+/g, '').replace(/[？?！!。．\.，,、]/g, '');
}

function starAnswer(lore: StarCard): string {
  return `${lore.id} · ${lore.epithet}\n${lore.myth}\n${lore.portrait}`;
}

export function answerZiweiConcept(raw: string): { answer: string; hit: boolean } {
  const q = norm(raw);
  if (q.length < 2) {
    return { answer: '再写具体一点，例如「紫微星是什么」。', hit: false };
  }

  for (const star of MAJOR_STARS) {
    const lore = getStarLore(star.id) ?? star;
    if (q.includes(norm(lore.id)) || q.includes(norm(lore.epithet)) || q.includes(norm(lore.title))) {
      return { hit: true, answer: starAnswer(lore) };
    }
  }

  for (const p of PALACE_LORE) {
    if (q.includes(norm(p.id)) || q.includes(norm(p.title)) || q.includes(norm(p.hint))) {
      return {
        hit: true,
        answer: `${p.title} · ${p.hint}\n${p.oneLiner}\n${p.asks}`,
      };
    }
  }

  const byName = getStarLore(raw.trim().replace(/星$/, ''));
  if (byName) return { hit: true, answer: starAnswer(byName) };

  const palace = getPalaceLore(raw.trim()) || getPalaceLore(`${raw.trim()}宫`);
  if (palace) {
    return {
      hit: true,
      answer: `${palace.title} · ${palace.hint}\n${palace.oneLiner}`,
    };
  }

  return {
    hit: false,
    answer: '词库里还没有这条。我先记下来，之后会补进星曜探索。',
  };
}

export async function recordZiweiConceptMiss(q: string): Promise<void> {
  if (!isStarPmCaptureReady()) return;
  try {
    await postStarPmIdeaCapture({
      title: `[紫微边问] ${q.trim().slice(0, 40)}`,
      type: '内容想法',
      relatedProjectId: 'proj-moonpie',
      relatedModule: '紫微·解读·边看边问',
      summary: '概念未命中，待补词库',
      priority: 'P2',
      suggestedNextStep: '补紫微星曜/宫位词条',
      source: 'Mystic Lab',
      rawThought: q.trim(),
    });
  } catch {
    /* ignore */
  }
}
