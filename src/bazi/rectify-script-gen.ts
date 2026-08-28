/**
 * 生时校准 v2 · 剧本生成器
 * 由候选时辰差异包生成「人生剧本」：大事节点 + 微细节；双剧本对照表。
 * 纯规则，不调 LLM。
 */
import type { LifeProfileInput } from '../life/types.ts';
import type { RankedDetectiveBranch } from './rectify-detective-engine.ts';
import {
  buildShichenDiffProfiles,
  diffProfileByBranch,
  summarizePairDiff,
  SHICHEN_TRAITS,
  type ShichenDiffProfile,
  type ShichenTraitId,
} from './rectify-shichen-diff.ts';

export type ScriptMajorBeat = {
  ageLabel: string;
  title: string;
  body: string;
  traitIds: ShichenTraitId[];
};

export type ScriptMicroRow = {
  dim: string;
  text: string;
};

export type LifeScript = {
  branch: string;
  hourPillar: string;
  label: string;
  weatherMetaphor: string;
  confidencePct: number;
  title: string;
  majors: ScriptMajorBeat[];
  micros: ScriptMicroRow[];
};

export type ScriptContrastRow = {
  dim: string;
  left: string;
  right: string;
};

export type ScriptContrastPack = {
  left: LifeScript;
  right: LifeScript;
  /** 第三候选，默认藏在「还有一版」 */
  hidden: LifeScript | null;
  contrastTable: ScriptContrastRow[];
  pairDiffLines: string[];
};

type StageDef = {
  ageLabel: string;
  pick: (p: ShichenDiffProfile) => { title: string; body: string; traitIds: ShichenTraitId[] };
};

function traitLabel(id: ShichenTraitId): string {
  return SHICHEN_TRAITS.find((t) => t.id === id)?.label ?? id;
}

function has(p: ShichenDiffProfile, id: ShichenTraitId): boolean {
  return p.behaviorTraitIds.includes(id);
}

const STAGES: StageDef[] = [
  {
    ageLabel: '幼年 0–7',
    pick: (p) => {
      if (has(p, 'health') || p.vsDay.kind === '冲') {
        return {
          title: '体质与安顿感偏敏感',
          body: '幼年较易有小恙或环境变动感，家人更操心「安不安」。',
          traitIds: ['health', 'travel'],
        };
      }
      if (has(p, 'sensitive') || has(p, 'study')) {
        return {
          title: '早慧、观察多',
          body: '小时候更像「小大人」：爱看、爱问，情绪细。',
          traitIds: ['sensitive', 'study'],
        };
      }
      if (has(p, 'action') || has(p, 'lead')) {
        return {
          title: '闲不住、主见早',
          body: '幼年就显活泼或拗劲，不太吃「乖乖坐着」那一套。',
          traitIds: ['action', 'lead'],
        };
      }
      return {
        title: '家中气场偏稳',
        body: `在「${p.weatherMetaphor}」底色下，幼年整体更偏按部就班。`,
        traitIds: ['steady'],
      };
    },
  },
  {
    ageLabel: '少年 8–16',
    pick: (p) => {
      if (has(p, 'study') || p.tenGodCats.includes('yin')) {
        return {
          title: '学业/兴趣钻研线更显',
          body: '读书或专项兴趣更容易成为自我认同的一部分。',
          traitIds: ['study'],
        };
      }
      if (has(p, 'talk') || p.tenGodCats.includes('shi_shang')) {
        return {
          title: '表达欲抬头',
          body: '更爱说、爱写、爱表现；同学关系里常是气氛担当或吐槽役。',
          traitIds: ['talk'],
        };
      }
      if (has(p, 'travel') || p.vsYear.kind === '冲') {
        return {
          title: '离家/转学意象更强',
          body: '少年阶段较易遇到环境切换：搬家、转学、寄宿或长期外出。',
          traitIds: ['travel'],
        };
      }
      return {
        title: '同伴圈里找位置',
        body: '这一阶段更在意「合不合群」，性格底色开始定型。',
        traitIds: has(p, 'charm') ? ['charm'] : ['steady'],
      };
    },
  },
  {
    ageLabel: '青年 17–28',
    pick: (p) => {
      if (has(p, 'money') || p.tenGodCats.includes('cai')) {
        return {
          title: '务实求财 / 资源感',
          body: '择业更看重现实回报与资源整合，少空谈理想口号。',
          traitIds: ['money'],
        };
      }
      if (p.tenGodCats.includes('guan_sha') || has(p, 'steady')) {
        return {
          title: '责任与压力并存',
          body: '更容易早早扛事：体制内/大厂/家族期待，抗压是关键词。',
          traitIds: ['steady', 'action'],
        };
      }
      if (has(p, 'talk') || has(p, 'charm')) {
        return {
          title: '靠表达与人缘开路',
          body: '机会更多来自展示、社交与创意输出，而非死磕一条窄赛道。',
          traitIds: ['talk', 'charm'],
        };
      }
      if (has(p, 'lead') || has(p, 'action')) {
        return {
          title: '不甘人后、想自己说了算',
          body: '创业、跳槽、自立门户的冲动更强，讨厌被管死。',
          traitIds: ['lead', 'action'],
        };
      }
      return {
        title: '探索自我定位',
        body: `青年阶段在「${p.stemGod || '时柱'}」气场下摸索方向，起伏正常。`,
        traitIds: [],
      };
    },
  },
  {
    ageLabel: '壮年 29–45',
    pick: (p) => {
      if (p.vsDay.kind === '冲' || has(p, 'travel')) {
        return {
          title: '迁徙 / 事业线摇摆更显',
          body: '这个年龄段较易有城市切换、行业换道或长期出差。',
          traitIds: ['travel'],
        };
      }
      if (has(p, 'money') || p.tenGodCats.includes('cai')) {
        return {
          title: '资产与家庭责任加重',
          body: '买房、投资、养家等「钱与安稳」议题更容易成为主线。',
          traitIds: ['money'],
        };
      }
      if (p.tenGodCats.includes('guan_sha')) {
        return {
          title: '权责高峰',
          body: '管理、考核、名声压力上来；成就感与疲惫感往往同框。',
          traitIds: ['steady'],
        };
      }
      if (has(p, 'sensitive')) {
        return {
          title: '内耗与自我调整',
          body: '更需要边界与疗愈感；表面稳住，内心戏可能很多。',
          traitIds: ['sensitive'],
        };
      }
      return {
        title: '人生剧本进入「加戏」段',
        body: '家庭与事业双线并行，时柱差异会在抉择上显影。',
        traitIds: [],
      };
    },
  },
  {
    ageLabel: '中后 46+',
    pick: (p) => {
      if (has(p, 'study') || p.tenGodCats.includes('yin')) {
        return {
          title: '传道 / 沉淀智慧',
          body: '更倾向带人、写作、复盘经验，外在竞争欲下降。',
          traitIds: ['study'],
        };
      }
      if (has(p, 'steady') || p.tenGodCats.includes('guan_sha')) {
        return {
          title: '守成与名望',
          body: '更看重稳定、声誉与「别翻车」，少冒险换赛道。',
          traitIds: ['steady'],
        };
      }
      if (has(p, 'charm') || has(p, 'talk')) {
        return {
          title: '人缘与表达仍是资产',
          body: '社交圈、兴趣社群或公众表达仍能带来存在感。',
          traitIds: ['charm', 'talk'],
        };
      }
      return {
        title: '收束与回望',
        body: `气场回到「${p.weatherMetaphor}」，更在意身心节奏而非扩张。`,
        traitIds: [],
      };
    },
  },
];

function familyLine(p: ShichenDiffProfile): string {
  if (p.tenGodCats.includes('yin') && p.tenGodCats.includes('cai')) {
    return '对家人偏付出，也怕伤和气';
  }
  if (p.tenGodCats.includes('bi_jie') || has(p, 'lead')) {
    return '家中有主见，不易一味妥协';
  }
  if (p.tenGodCats.includes('shi_shang') || has(p, 'talk')) {
    return '家里气氛靠你带动，情绪来得快';
  }
  if (has(p, 'sensitive')) {
    return '观察多、冲突少，心里戏往往比嘴上多';
  }
  return '家庭互动整体中性，随运势起伏';
}

function workLine(p: ShichenDiffProfile): string {
  const labels = p.behaviorTraitIds.slice(0, 2).map(traitLabel);
  if (labels.length) return `工作侧写偏：${labels.join('；')}`;
  if (p.stemGod) return `时干「${p.stemGod}」更影响你做事的口气与节奏`;
  return '工作气质随大运起伏，时柱差异不极端';
}

function relationLine(p: ShichenDiffProfile): string {
  if (p.vsDay.kind === '冲') return '与日主气场有冲：亲密关系里更易有拉锯、分合感';
  if (p.vsDay.kind === '合') return '与日主气场有合：亲密关系更易黏合、互相成全';
  if (p.vsDay.kind === '害') return '与日主气场有害：关系里敏感点多，需多沟通';
  if (has(p, 'charm')) return '人缘/桃花意象更显眼，容易被看见';
  return '关系线无明显冲合特写，更看大运流年';
}

export function buildLifeScript(
  profile: ShichenDiffProfile,
  confidencePct = 0,
): LifeScript {
  const majors = STAGES.map((s) => {
    const beat = s.pick(profile);
    return {
      ageLabel: s.ageLabel,
      title: beat.title,
      body: beat.body,
      traitIds: beat.traitIds.filter((id) => has(profile, id) || beat.traitIds.includes(id)),
    };
  });

  const micros: ScriptMicroRow[] = [
    {
      dim: '气场天气',
      text: profile.weatherMetaphor,
    },
    {
      dim: '外貌倾向',
      text: profile.appearanceHints.join('、') || '无突出模板特征',
    },
    {
      dim: '性情标签',
      text:
        profile.behaviorTraitIds.map(traitLabel).join('；') ||
        `以时干「${profile.stemGod || '—'}」为主调`,
    },
    {
      dim: '家宅气象',
      text: familyLine(profile),
    },
    {
      dim: '工作气质',
      text: workLine(profile),
    },
    {
      dim: '亲密关系',
      text: relationLine(profile),
    },
  ];

  if (profile.ziBoundarySplit && profile.branch === '子') {
    micros.push({
      dim: '子时边界',
      text: profile.dayChanged
        ? '晚子可能换日柱，剧本需单独核对出生在 23 点前还是后'
        : '子时早晚日柱一致，边界风险较低',
    });
  }

  return {
    branch: profile.branch,
    hourPillar: profile.hourPillar,
    label: profile.label,
    weatherMetaphor: profile.weatherMetaphor,
    confidencePct,
    title: `${profile.branch}时剧本 · ${profile.weatherMetaphor.split('/')[0]?.trim() || profile.hourPillar}`,
    majors,
    micros,
  };
}

function contrastDim(
  left: LifeScript,
  right: LifeScript,
  dim: string,
): ScriptContrastRow {
  const l = left.micros.find((m) => m.dim === dim)?.text ?? '—';
  const r = right.micros.find((m) => m.dim === dim)?.text ?? '—';
  return { dim, left: l, right: r };
}

/**
 * Top2 对照 + 可选第三套隐藏剧本。
 * ranked 不足 2 → 返回 null。
 */
export function buildScriptContrastPack(
  lifeProfile: LifeProfileInput,
  ranked: RankedDetectiveBranch[],
): ScriptContrastPack | null {
  if (ranked.length < 2) return null;
  const profiles =
    ranked[0]?.profile && ranked[1]?.profile
      ? null
      : buildShichenDiffProfiles(lifeProfile);

  const resolve = (row: RankedDetectiveBranch): ShichenDiffProfile | undefined =>
    row.profile ?? (profiles ? diffProfileByBranch(profiles, row.branch) : undefined);

  const a = resolve(ranked[0]!);
  const b = resolve(ranked[1]!);
  if (!a || !b) return null;

  const left = buildLifeScript(a, ranked[0]!.confidencePct);
  const right = buildLifeScript(b, ranked[1]!.confidencePct);
  let hidden: LifeScript | null = null;
  if (ranked[2]) {
    const c = resolve(ranked[2]);
    if (c) hidden = buildLifeScript(c, ranked[2].confidencePct);
  }

  const dims = ['气场天气', '外貌倾向', '性情标签', '家宅气象', '工作气质', '亲密关系'];
  const contrastTable = dims.map((d) => contrastDim(left, right, d));

  // 大事节点差异：同年龄段标题不同则写入对照
  for (let i = 0; i < Math.min(left.majors.length, right.majors.length); i++) {
    const lm = left.majors[i]!;
    const rm = right.majors[i]!;
    if (lm.title !== rm.title) {
      contrastTable.push({
        dim: lm.ageLabel,
        left: `${lm.title}——${lm.body}`,
        right: `${rm.title}——${rm.body}`,
      });
    }
  }

  return {
    left,
    right,
    hidden,
    contrastTable,
    pairDiffLines: summarizePairDiff(a, b),
  };
}
