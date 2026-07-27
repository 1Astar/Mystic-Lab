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
export type ComposedScene = {
  formula: string;
  meaning: string;
  upperNature: string;
  lowerNature: string;
  upperId: TrigramId;
  lowerId: TrigramId;
  themeWords: string;
  bridgeLead: string;
  bridgeCue: string;
  careerLower: string;
  careerUpper: string;
  careerAsk: string;
  loveLower: string;
  loveUpper: string;
  loveAsk: string;
  /** 兼容旧调用：整段文案 */
  career: string;
  love: string;
  bridge: string;
};

export function composeScene(
  upper: Trigram,
  lower: Trigram,
  hex: Hexagram,
): ComposedScene {
  const u = TRIGRAM_SCENE[upper.id];
  const l = TRIGRAM_SCENE[lower.id];
  const themeWords = hex.keywords.slice(0, 2).join('、');
  const bridgeCue = `「${upper.nature}+${lower.nature}」译成：这件事里，谁在动、谁该停、场子是顺还是险。`;
  const careerAsk = '我是在硬推，还是该先停/先谈？';
  const loveAsk = '该推进、该止步，还是先说清楚？';

  return {
    formula: `上${upper.nature}（${upper.id}）+ 下${lower.nature}（${lower.id}）→ ${hex.fullName}`,
    meaning: `${hex.gist}`,
    upperNature: upper.nature,
    lowerNature: lower.nature,
    upperId: upper.id,
    lowerId: lower.id,
    themeWords,
    bridgeLead: '',
    bridgeCue,
    careerLower: l.career,
    careerUpper: u.career,
    careerAsk,
    loveLower: l.love,
    loveUpper: u.love,
    loveAsk,
    career: [
      `工作上`,
      `下卦：${l.career}`,
      `上卦：${u.career}`,
      `合看：${themeWords}正在成为主旋律`,
      `自问：${careerAsk}`,
    ].join('\n'),
    love: [
      `感情上`,
      `下卦（你这边）：${l.love}`,
      `上卦（关系场/对方）：${u.love}`,
      `合看：${themeWords}`,
      `自问：${loveAsk}`,
    ].join('\n'),
    bridge: bridgeCue,
  };
}

function escapeScene(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 取象注解：断语标签 + 工作/感情合并成一段解说 */
export function renderSceneXiangHtml(
  scene: ComposedScene,
  opts?: {
    domain?: SceneDomain;
    hint?: string;
    showFormula?: boolean;
  },
): string {
  const hint = opts?.hint?.trim();
  const tags = [
    scene.careerLower,
    scene.careerUpper,
    scene.loveLower,
    scene.loveUpper,
    scene.themeWords,
  ]
    .flatMap((t) => t.split(/[、，]/).map((s) => s.trim()).filter(Boolean))
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, 8);

  const tagHtml = tags
    .map((t) => `<span class="ly-oracle-tag">${escapeScene(t)}</span>`)
    .join('');

  const body = [
    `下卦这一边：工作上像「${scene.careerLower}」，感情上则像「${scene.loveLower}」。`,
    `上卦在外面：事业场偏「${scene.careerUpper}」，关系场偏「${scene.loveUpper}」。`,
    `合看主调是「${scene.themeWords}」——${scene.meaning}`,
    `此刻可自问：工作上，${scene.careerAsk} 感情上，${scene.loveAsk}`,
  ].join('');

  return `
    <div class="ly-scene-xiang">
      <p class="ly-scene-cue">${escapeScene(scene.bridgeCue)}</p>
      ${hint ? `<p class="ly-scene-hint">${escapeScene(hint)}</p>` : ''}
      <div class="ly-oracle-tags" aria-label="取象关键词">${tagHtml}</div>
      <p class="ly-scene-merged">${escapeScene(body)}</p>
    </div>
  `;
}

/**
 * 主屏「看根基」用：结构义 × 实际一问的合一短释义（不重复工作/感情长表）
 */
export function renderFoundationBridgeHtml(
  scene: ComposedScene,
  domain: SceneDomain = 'general',
): string {
  const ask =
    domain === 'love'
      ? scene.loveAsk
      : domain === 'career'
        ? scene.careerAsk
        : '我这边（下卦）在承什么？外面（上卦）在逼什么？';
  const lowerHint =
    domain === 'love' ? scene.loveLower : domain === 'career' ? scene.careerLower : scene.careerLower;
  const upperHint =
    domain === 'love' ? scene.loveUpper : domain === 'career' ? scene.careerUpper : scene.careerUpper;

  return `
    <div class="ly-foundation-bridge" data-foundation-bridge>
      <p class="ly-layer-guide">根基 × 实际</p>
      <p class="ly-foundation-bridge-lead">
        结构上：下${escapeScene(scene.lowerNature)}是你这边的底色（${escapeScene(lowerHint)}），
        上${escapeScene(scene.upperNature)}是外面的场（${escapeScene(upperHint)}）。
        合在一起，主调偏「${escapeScene(scene.themeWords)}」——${escapeScene(scene.meaning)}
      </p>
      <p class="ly-foundation-bridge-ask"><em>此刻可自问：</em>${escapeScene(ask)}</p>
      <p class="ly-guide-tip">工作 / 感情分行细译，请打开「解读笔记 · 卦象解析」（手机点下方「打开解读笔记」或右侧书签）。</p>
    </div>
  `;
}

export function pickSceneLine(
  scene: ReturnType<typeof composeScene>,
  domain: SceneDomain,
): string {
  if (domain === 'career') return scene.career;
  if (domain === 'love') return scene.love;
  return `${scene.meaning}\n\n${scene.career}\n\n${scene.love}`;
}

export function detectSceneDomain(question: string): SceneDomain {
  const q = question.trim();
  if (
    /工作|offer|职业|升职|跳槽|事业|项目|老板|同事|面试|离职|辞职|转正|留任|留在|薪|工资|月薪|\d+\s*k|求职|入职|裁员/.test(
      q,
    )
  ) {
    return 'career';
  }
  if (/感情|恋爱|分手|复合|婚姻|对象|喜欢|关系/.test(q)) return 'love';
  if (/生活|搬家|健康|家庭|钱|财务/.test(q)) return 'life';
  return 'general';
}
