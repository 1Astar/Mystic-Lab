import type { Hexagram } from './hexagrams.ts';
import type { Trigram, TrigramId } from './trigrams.ts';

export type SceneDomain = 'career' | 'love' | 'life' | 'general';

/** 单卦自然象 → 人事取象（工作/感情常用） */
const TRIGRAM_SCENE: Record<
  TrigramId,
  { force: string; career: string; love: string }
> = {
  乾: {
    force: '刚健、主导、公开推进',
    career: '规则、上级、主动出击的一方',
    love: '主动方、表态、把关系推到明处',
  },
  坤: {
    force: '承载、接纳、打底',
    career: '基层、后勤、先稳住再谈扩张',
    love: '包容、陪伴、把关系托住',
  },
  震: {
    force: '发动、震动、突然开始',
    career: '启动项目、突发变动、面试/谈判被触发',
    love: '心动、冲突爆发、关系被「震」醒',
  },
  巽: {
    force: '渗入、反复、柔顺推进',
    career: '沟通协调、渗透影响、反复磨合',
    love: '试探、迂回表达、慢慢靠近',
  },
  坎: {
    force: '险陷、流动、不确定',
    career: '风险、情绪压力、路径不明',
    love: '情绪深水区、信任考验、不安',
  },
  离: {
    force: '看见、依附光明、曝光',
    career: '被看见、方案亮相、需要澄清真相',
    love: '坦诚、看见彼此、热情与依附',
  },
  艮: {
    force: '止住、边界、挡住',
    career: '暂停、门槛、该收手的阶段',
    love: '设边界、冷却、先停一停',
  },
  兑: {
    force: '开口、交流、愉悦',
    career: '谈条件、公开沟通、合作洽谈',
    love: '说话、约会场、关系里的「说开」',
  },
};

export function trigramScene(id: TrigramId) {
  return TRIGRAM_SCENE[id];
}

/** 上卦+下卦 → 组合场景（用户真正要的翻译） */
export function composeScene(
  upper: Trigram,
  lower: Trigram,
  hex: Hexagram,
): {
  formula: string;
  meaning: string;
  career: string;
  love: string;
  bridge: string;
} {
  const u = TRIGRAM_SCENE[upper.id];
  const l = TRIGRAM_SCENE[lower.id];
  return {
    formula: `上${upper.nature}（${upper.id}）+ 下${lower.nature}（${lower.id}）→ ${hex.fullName}`,
    meaning: `${hex.gist}`,
    career: `工作上：下面是「${l.career}」，上面是「${u.career}」。合在一起看——${hex.keywords.slice(0, 2).join('、')}正在成为主旋律。问自己：我是在硬推，还是该先停/先谈？`,
    love: `感情上：下卦像你这边的底色（${l.love}），上卦像关系场/对方侧（${u.love}）。合在一起——${hex.keywords.slice(0, 2).join('、')}。问自己：该推进、该止步，还是先说清楚？`,
    bridge: `别停在「为什么叫${upper.nature}/${lower.nature}」。要把「${upper.nature}+${lower.nature}」译成：这件事里，谁在动、谁该停、场子是顺还是险。`,
  };
}

export function pickSceneLine(
  scene: ReturnType<typeof composeScene>,
  domain: SceneDomain,
): string {
  if (domain === 'career') return scene.career;
  if (domain === 'love') return scene.love;
  return `${scene.meaning} ${scene.career.replace('工作上：', '若偏事务：')}；${scene.love.replace('感情上：', '若偏关系：')}`;
}

export function detectSceneDomain(question: string): SceneDomain {
  const q = question.trim();
  if (/工作|offer|职业|升职|跳槽|事业|项目|老板|同事|面试/.test(q)) return 'career';
  if (/感情|恋爱|分手|复合|婚姻|对象|喜欢|关系/.test(q)) return 'love';
  if (/生活|搬家|健康|家庭|钱|财务/.test(q)) return 'life';
  return 'general';
}
