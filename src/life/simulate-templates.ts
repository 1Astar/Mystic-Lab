import type { ChoiceBranch, ChoiceSimulation, LifeProfileInput } from './types.ts';

export const SIMULATE_QUESTION_PRESETS = [
  '我要不要离职？',
  '要不要去大厂？',
  '要不要开始做个人项目？',
  '要不要换城市？',
] as const;

function defaultHorizonLabel(now = new Date()): string {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return `${y}年${m}月`;
}

function detectScene(question: string): 'quit' | 'bigtech' | 'side' | 'city' | 'generic' {
  const q = question.trim();
  if (/离职|辞职|留下|跳槽/.test(q)) return 'quit';
  if (/大厂|BAT|字节|阿里|腾讯/.test(q)) return 'bigtech';
  if (/个人项目|副业|自由|独立/.test(q)) return 'side';
  if (/换城|出国|搬家|城市/.test(q)) return 'city';
  return 'generic';
}

function branch(
  id: string,
  label: string,
  title: string,
  trajectory: string[],
  note: string,
): ChoiceBranch {
  return { id, label, title, trajectory, note };
}

/** 本地模板：按问题关键词生成 3 条可对照轨迹 */
export function buildTemplateSimulation(
  question: string,
  profile: LifeProfileInput,
  now = new Date(),
): ChoiceSimulation {
  const q = question.trim() || profile.confusion.trim() || '下一步怎么选？';
  const occ = profile.occupation.trim() || '当前工作';
  const city = profile.city.trim() || '当前城市';
  const scene = detectScene(q);
  const horizonLabel = defaultHorizonLabel(now);

  const byScene: Record<typeof scene, ChoiceBranch[]> = {
    quit: [
      branch(
        'a',
        '选择 A',
        '继续留下',
        ['稳定积累', '技能增长偏慢', '约 1 年后重新评估'],
        `在熟悉的${occ}里换取缓冲；适合先把「想离开的理由」写成可验证清单。`,
      ),
      branch(
        'b',
        '选择 B',
        '进入新机会（如 AI / 创业公司）',
        ['短期压力上升', '项目经验加速', '人脉与视野扩展'],
        '换环境换反馈速度；代价是不确定与节奏压迫，需要底线与退出条件。',
      ),
      branch(
        'c',
        '选择 C',
        '自由推进个人项目',
        ['自由度提高', '收入可能波动', '个人品牌慢慢成形'],
        '把热爱拆成可交付物；适合用小预算试跑，而不是一次清空退路。',
      ),
    ],
    bigtech: [
      branch(
        'a',
        '选择 A',
        '暂不投大厂',
        ['保持现有节奏', '补齐作品集缺口', '等窗口再动'],
        `继续在${city}用${occ}积累可迁移能力，避免为「大厂」二字盲目跳。`,
      ),
      branch(
        'b',
        '选择 B',
        '冲刺大厂机会',
        ['准备成本升高', '面试反馈密集', '入职后高强度校准'],
        '可能换来更大协作半径；要提前想好健康与边界策略。',
      ),
      branch(
        'c',
        '选择 C',
        '中厂 / 垂直赛道并行试探',
        ['选择面更宽', '议价空间更实', '再决定是否升级'],
        '先验证「你真正想要的工作形态」，再谈品牌光环。',
      ),
    ],
    side: [
      branch(
        'a',
        '选择 A',
        '主业优先，副业缓行',
        ['精力集中', '副业停留想法层', '半年后再看'],
        '适合现金流紧或主业窗口关键时；记下未做之事，避免自我责备。',
      ),
      branch(
        'b',
        '选择 B',
        '固定周节奏推进个人项目',
        ['每周可交付切片', '进度可见', '偶发与主业冲突'],
        '用日历保护创作时段；目标是「持续」，不是爆款。',
      ),
      branch(
        'c',
        '选择 C',
        '阶段性全力投入',
        ['短期产出拉高', '收入/社交波动', '需要明确复盘点'],
        '设 8–12 周实验期与退出线，避免无限期「再坚持一下」。',
      ),
    ],
    city: [
      branch(
        'a',
        '选择 A',
        '留在当前城市',
        ['关系与节奏稳定', '机会半径有限', '定期外出充电'],
        `${city}继续做主场；用旅行/远程协作补视野，不必立刻连根拔起。`,
      ),
      branch(
        'b',
        '选择 B',
        '换到目标城市',
        ['搬家成本与适应期', '新圈子重建', '职业与生活重配'],
        '先短住/远程试用，再决定户籍与长租，降低一次性赌注。',
      ),
      branch(
        'c',
        '选择 C',
        '双城 / 远程过渡',
        ['灵活但分裂感', '成本中等', '给自己观察窗口'],
        '适合还没想清「为了什么换城」时，用过渡态收集真实感受。',
      ),
    ],
    generic: [
      branch(
        'a',
        '选择 A',
        '维持现状并观察',
        ['短期压力较低', '变化偏慢', '设复查节点'],
        `围绕「${q}」，先收集 2–4 周真实触发点，再决定是否大动。`,
      ),
      branch(
        'b',
        '选择 B',
        '采取明确行动',
        ['短期不确定上升', '反馈变快', '需要支持系统'],
        '把行动拆成可逆的第一步；写清成功/失败各长什么样。',
      ),
      branch(
        'c',
        '选择 C',
        '设计小实验对照',
        ['成本可控', '信息增量高', '可能显得「不够决断」'],
        '用实验代替空想：同一问题，两周内做一次低成本对照。',
      ),
    ],
  };

  return {
    question: q,
    horizonLabel,
    branches: byScene[scene],
    source: 'template',
    generatedAt: now.toISOString(),
  };
}
