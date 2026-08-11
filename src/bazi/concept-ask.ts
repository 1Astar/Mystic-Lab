/** 八字边看边问：概念本地答（不调 AI）——优先图鉴实体，禁止另写重复正文 */
import { STEM_LORE, BRANCH_LORE, WUXING_LORE, WUXING_ORDER } from './codex-lore.ts';
import { ALL_STAR_CARDS } from './codex-tags.ts';
import { answerFromCodexEntity } from './codex-entity-resolve.ts';
import { CHANG_SHENG_GLOSS, isChangShengStage } from './pillar-meta.ts';
import { isStarPmCaptureReady, postStarPmIdeaCapture } from '../ai/star-pm-endpoint.ts';

function norm(s: string): string {
  return s.replace(/\s+/g, '').replace(/[？?！!。．\.，,、]/g, '');
}

const ROLE_LORE: Record<string, string> = {
  日主: '日柱天干代表「我」的气质底色，是排盘看关系的参照点。',
  女主: '女命日柱天干，代表「我」这一面的气质底色。',
  男主: '男命日柱天干，代表「我」这一面的气质底色。',
  元女: '女命日主的称呼，等同于「我」在盘里的位置。',
  元男: '男命日主的称呼，等同于「我」在盘里的位置。',
};

function nayinHint(term: string): string | null {
  if (!/[木火土金水]$/.test(term) || term.length < 2 || term.length > 4) return null;
  const wx = term.slice(-1);
  return `「${term}」是纳音——把一对干支读成一种气象意象，属${wx}。它不替代十神，而是给这柱一个画面感。`;
}

function xunkongHint(term: string): string | null {
  if (!/^[子丑寅卯辰巳午未申酉戌亥]{2}$/.test(term)) return null;
  return `「${term}」是空亡位：日柱旬空所落的地支。空不等于坏，更像「这一段力气虚着」，宜借实处发力。`;
}

export function answerBaziConcept(raw: string): { answer: string; hit: boolean } {
  const q = norm(raw);
  if (q.length < 1) {
    return { answer: '再写具体一点，例如「食神是什么」。', hit: false };
  }

  // ① 图鉴知识库（唯一正文源）
  const fromCodex = answerFromCodexEntity(raw, { depth: 'atlas' });
  if (fromCodex.hit) return { hit: true, answer: fromCodex.answer };

  for (const [k, v] of Object.entries(ROLE_LORE)) {
    if (q === k || q.includes(k)) return { hit: true, answer: v };
  }

  if (isChangShengStage(q)) {
    return {
      hit: true,
      answer: `${q}：十二长生之一：${CHANG_SHENG_GLOSS[q]}`,
    };
  }

  const nayin = nayinHint(q);
  if (nayin) return { hit: true, answer: nayin };

  const xk = xunkongHint(q);
  if (xk) return { hit: true, answer: xk };

  if (q.includes('纳音')) {
    return {
      hit: true,
      answer: '纳音是把一对干支读成一种气象意象（如杨柳木、剑锋金）。它补画面，不替代十神与旺衰。',
    };
  }
  if (q.includes('空亡')) {
    return {
      hit: true,
      answer: '空亡指日柱所在旬里「落空」的地支。空位力气偏虚，宜借实处；不必一律当凶看。',
    };
  }
  if (q.includes('地势') || q.includes('自坐') || q.includes('十二长生')) {
    return {
      hit: true,
      answer:
        '地势多指日干对某支的十二长生状态；自坐是本柱干坐本柱支的长生位。用来看「这口气处在旺、衰、养」哪一段。',
    };
  }

  // 兜底：旧卡字段（应已被图鉴覆盖；保留防漏网）
  for (const card of ALL_STAR_CARDS) {
    if (q.includes(norm(card.name)) || norm(card.name).includes(q) || q.includes(norm(card.modern))) {
      return {
        hit: true,
        answer: `${card.name}（${card.modern}）\n${card.impression}\n看见：${card.where}\n注意：${card.trap}`,
      };
    }
  }

  for (const s of STEM_LORE) {
    if (q.includes(s.id) || q.includes(norm(s.title)) || q.includes(norm(s.epithet))) {
      return {
        hit: true,
        answer: `${s.title} · ${s.epithet}\n${s.portrait}`,
      };
    }
  }

  for (const b of BRANCH_LORE) {
    if (q.includes(b.id) || q.includes(norm(b.title)) || q.includes(norm(b.epithet))) {
      return {
        hit: true,
        answer: `${b.title} · ${b.epithet}\n${b.portrait}`,
      };
    }
  }

  for (const wx of WUXING_ORDER) {
    const lore = WUXING_LORE[wx];
    if (!lore) continue;
    if (q.includes(wx) || q.includes(norm(lore.title)) || q.includes(norm(lore.epithet))) {
      return {
        hit: true,
        answer: `${lore.title} · ${lore.epithet}\n${lore.portrait}\n${lore.meaning}`,
      };
    }
  }

  return {
    hit: false,
    answer: '词库里还没有这条。我先记下来，之后会补进探索与答疑。',
  };
}

/** 未命中 → 可选同步 Star PM */
export async function recordBaziConceptMiss(q: string): Promise<void> {
  if (!isStarPmCaptureReady()) return;
  try {
    await postStarPmIdeaCapture({
      title: `[八字边问] ${q.trim().slice(0, 40)}`,
      type: '内容想法',
      relatedProjectId: 'proj-moonpie',
      relatedModule: '八字·解读·边看边问',
      summary: '概念未命中，待补词库',
      priority: 'P2',
      suggestedNextStep: '补八字概念词条或探索释义',
      source: 'Mystic Lab',
      rawThought: q.trim(),
    });
  } catch {
    /* 静默：本机提示已在 UI */
  }
}
