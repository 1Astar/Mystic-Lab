/**
 * 八字学习成就墙：挂已有 learn-store 行为，不新开玩法
 */
import {
  loadBaziLearn,
  resolveBaziLearnTitle,
  type BaziLearnState,
  type BaziLearnTitleId,
} from './learn-store.ts';

export type LearnAchievementId =
  | 'chugui_seal'
  | 'why_first'
  | 'why_five'
  | 'lever'
  | 'if_sim'
  | 'shuttle'
  | 'guess_one'
  | 'guess_three'
  | 'week_review'
  | 'title_zhiming'
  | 'title_tuiyan';

export type LearnAchievementDef = {
  id: LearnAchievementId;
  /** 徽章短名 */
  label: string;
  /** 圆章内符号（单字/两字） */
  glyph: string;
  /** 未点亮说明 */
  lockedHint: string;
  /** 点亮祝贺 */
  unlockedHint: string;
  /** 去做 */
  action: { label: string; path: string };
};

export type LearnAchievement = LearnAchievementDef & {
  unlocked: boolean;
};

export const LEARN_ACHIEVEMENT_DEFS: readonly LearnAchievementDef[] = [
  {
    id: 'chugui_seal',
    label: '初窥之印',
    glyph: '窥',
    lockedHint: '打开命盘解读即可点亮。',
    unlockedHint: '你已迈进门径。',
    action: { label: '去解读 ›', path: '/bazi/reading' },
  },
  {
    id: 'why_first',
    label: '第一枚为什么',
    glyph: '问',
    lockedHint: '收入任意 1 个知识点。',
    unlockedHint: '开始收集底层逻辑。',
    action: { label: '去收集 ›', path: '/bazi/reading' },
  },
  {
    id: 'why_five',
    label: '为什么收集家',
    glyph: '五',
    lockedHint: '知识点凑满 5 个。',
    unlockedHint: '知命门槛的知识侧已齐。',
    action: { label: '去收集 ›', path: '/bazi/reading' },
  },
  {
    id: 'lever',
    label: '杠杆手感',
    glyph: '衡',
    lockedHint: '在总览拖一次能量天平杠杆。',
    unlockedHint: '亲手感受过生克杠杆。',
    action: { label: '去试杠杆 ›', path: '/bazi/reading' },
  },
  {
    id: 'if_sim',
    label: '如果推演',
    glyph: '如',
    lockedHint: '在运势 Tab 看完一条【如果】。',
    unlockedHint: '做过一次反事实推演。',
    action: { label: '去运势 ›', path: '/bazi/reading' },
  },
  {
    id: 'shuttle',
    label: '时光旅人',
    glyph: '梭',
    lockedHint: '在命盘页拖一次时光机滑杆。',
    unlockedHint: '看过本命船外的季节云。',
    action: { label: '去时光机 ›', path: '/bazi' },
  },
  {
    id: 'guess_one',
    label: '猜中一次',
    glyph: '中',
    lockedHint: '猜命盘答对 1 题。',
    unlockedHint: '复习机制启动。',
    action: { label: '去猜命盘 ›', path: '/bazi/guess' },
  },
  {
    id: 'guess_three',
    label: '猜中三回',
    glyph: '三',
    lockedHint: '累计猜对 3 题（推演大师路径 A）。',
    unlockedHint: '盲盒复习已成习惯。',
    action: { label: '去猜命盘 ›', path: '/bazi/guess' },
  },
  {
    id: 'week_review',
    label: '周报对账',
    glyph: '周',
    lockedHint: '脑内天气写满 ≥3 天并完成本周对账。',
    unlockedHint: '完成过一次流日复盘。',
    action: { label: '去脑内天气 ›', path: '/bazi/week' },
  },
  {
    id: 'title_zhiming',
    label: '知命之印',
    glyph: '命',
    lockedHint: '达到称号「知命不惑」。',
    unlockedHint: '知其所以然。',
    action: { label: '看升级路径 ›', path: '/bazi/learn' },
  },
  {
    id: 'title_tuiyan',
    label: '推演之印',
    glyph: '演',
    lockedHint: '达到称号「推演大师」。',
    unlockedHint: '会用、会复盘。',
    action: { label: '看升级路径 ›', path: '/bazi/learn' },
  },
] as const;

function hasPrefix(ids: string[], prefix: string): boolean {
  return ids.some((id) => id.startsWith(prefix));
}

export function isAchievementUnlocked(
  id: LearnAchievementId,
  state: BaziLearnState = loadBaziLearn(),
): boolean {
  const title = resolveBaziLearnTitle(state);
  const titleRank = (t: BaziLearnTitleId): number =>
    t === 'tuiyan' ? 2 : t === 'zhiming' ? 1 : 0;
  const rank = titleRank(title.id);
  const inter = state.interactionIds;

  switch (id) {
    case 'chugui_seal':
      return true;
    case 'why_first':
      return state.knowledgeIds.length >= 1;
    case 'why_five':
      return state.knowledgeIds.length >= 5;
    case 'lever':
      return hasPrefix(inter, 'lever:');
    case 'if_sim':
      return hasPrefix(inter, 'if:');
    case 'shuttle':
      return hasPrefix(inter, 'shuttle:');
    case 'guess_one':
      return state.guessWins >= 1;
    case 'guess_three':
      return state.guessWins >= 3;
    case 'week_review':
      return hasPrefix(inter, 'review:week:');
    case 'title_zhiming':
      return rank >= 1;
    case 'title_tuiyan':
      return rank >= 2;
    default:
      return false;
  }
}

export function buildLearnAchievements(
  state: BaziLearnState = loadBaziLearn(),
): LearnAchievement[] {
  return LEARN_ACHIEVEMENT_DEFS.map((def) => ({
    ...def,
    unlocked: isAchievementUnlocked(def.id, state),
  }));
}

export function countUnlockedAchievements(
  state: BaziLearnState = loadBaziLearn(),
): { unlocked: number; total: number } {
  const list = buildLearnAchievements(state);
  return {
    unlocked: list.filter((a) => a.unlocked).length,
    total: list.length,
  };
}
