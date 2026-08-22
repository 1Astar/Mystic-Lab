/**
 * 神煞「相遇高光」面板：阶段卡 + 规则矩阵总结 + 四柱脉搏 + 生态位 + 色调带
 * 文案用结构填空，不调 AI；利好与提醒并存。
 */
import {
  SHENSHA_THEME_META,
  SHENSHA_TONE_META,
  SHENSHA_TONE_ORDER,
  countShenshaByTone,
  shenshaBrowseMeta,
  type ShenshaThemeId,
  type ShenshaToneId,
} from './codex-shensha-browse.ts';

/** 四大支柱议题 */
export const SHENSHA_PILLAR_THEMES = [
  'patron',
  'romance',
  'talent',
  'career',
] as const satisfies readonly ShenshaThemeId[];

/** 非大类 · 生态位议题 */
export const SHENSHA_NICHE_THEMES = [
  'fortune',
  'void',
  'friction',
  'health',
  'solitude',
  'flow',
] as const satisfies readonly ShenshaThemeId[];

export type ShenshaPillarId = (typeof SHENSHA_PILLAR_THEMES)[number];
export type ShenshaNicheId = (typeof SHENSHA_NICHE_THEMES)[number];

/** 星象脉搏 → 命盘「四要素」分类 */
export const THEME_TO_CHART_PILLAR: Record<
  ShenshaPillarId,
  'core' | 'career' | 'bond' | 'lesson'
> = {
  patron: 'bond',
  romance: 'bond',
  talent: 'core',
  career: 'career',
};

const PILLAR_UI: Record<
  ShenshaPillarId,
  { emoji: string; unit: string; zeroHint: string }
> = {
  patron: {
    emoji: '🤝',
    unit: '份暗中助力',
    zeroHint: '这一块偏平静',
  },
  romance: {
    emoji: '🌺',
    unit: '次心动际遇',
    zeroHint: '缘分板块较安静',
  },
  talent: {
    emoji: '✨',
    unit: '点天赋灵光',
    zeroHint: '才艺色调暂未点亮',
  },
  career: {
    emoji: '🎭',
    unit: '层社会舞台',
    zeroHint: '名位舞台暂未展开',
  },
};

const NICHE_UI: Record<
  ShenshaNicheId,
  { emoji: string; hint: string }
> = {
  fortune: { emoji: '🪙', hint: '显性的资源/膳养色调' },
  void: { emoji: '🕳️', hint: '走漏与虚延窗口，宜补地基' },
  friction: { emoji: '⚠️', hint: '拦路虎提醒，宜先做心理准备' },
  health: { emoji: '🩺', hint: '身心检修窗口' },
  solitude: { emoji: '🌙', hint: '独处清高、少热闹的特质' },
  flow: { emoji: '🌊', hint: '换场与阶段消长感' },
};

/** @deprecated 旧高光行；保留类型以免外部误用编译炸 */
export type ShenshaMeetHighlightLine = {
  id: string;
  text: string;
};

export type ShenshaMeetStage = {
  id: 'seed' | 'rising' | 'constellation';
  icon: string;
  title: string;
  blurb: string;
};

export type ShenshaMeetSummary = {
  id: string;
  badge: string;
  text: string;
};

export type ShenshaMeetPillar = {
  theme: ShenshaPillarId;
  title: string;
  emoji: string;
  count: number;
  line: string;
  muted: boolean;
};

export type ShenshaMeetNiche = {
  theme: ShenshaNicheId;
  title: string;
  emoji: string;
  count: number;
  hint: string;
};

export type ShenshaMeetToneSlice = {
  id: ShenshaToneId;
  short: string;
  count: number;
  pct: number;
  dot: string;
};

export type ShenshaMeetPulsePanel = {
  total: number;
  stage: ShenshaMeetStage;
  lead: string;
  summary: ShenshaMeetSummary;
  pillars: ShenshaMeetPillar[];
  niches: ShenshaMeetNiche[];
  tones: ShenshaMeetToneSlice[];
};

function countThemes(ids: Iterable<string>): Record<ShenshaThemeId, number> {
  const counts = {
    patron: 0,
    romance: 0,
    talent: 0,
    career: 0,
    fortune: 0,
    void: 0,
    friction: 0,
    health: 0,
    solitude: 0,
    flow: 0,
  } satisfies Record<ShenshaThemeId, number>;
  for (const id of ids) {
    counts[shenshaBrowseMeta(id).theme] += 1;
  }
  return counts;
}

export function resolveMeetStage(total: number): ShenshaMeetStage {
  if (total <= 3) {
    return {
      id: 'seed',
      icon: '🌱',
      title: '初遇',
      blurb: '你的命盘刚刚开启，缘分正在萌芽。',
    };
  }
  if (total <= 10) {
    return {
      id: 'rising',
      icon: '🌟',
      title: '渐入佳境',
      blurb: '你已经收集了核心护持，故事正在展开。',
    };
  }
  return {
    id: 'constellation',
    icon: '✨',
    title: '群星汇聚',
    blurb: '你的盘面星光璀璨，是一本丰富的人生之书。',
  };
}

/**
 * 规则矩阵：结构+填空，利好与提醒并存。
 */
export function resolveMeetSummary(
  themes: Record<ShenshaThemeId, number>,
): ShenshaMeetSummary {
  const { patron, romance, talent, career, friction, void: voidN, solitude } =
    themes;

  if (patron > 5 && romance > 2 && career > 1) {
    return {
      id: 'late_bloom',
      badge: '大器晚成',
      text: '你的人生常遇贵人点拨，感情中也有桃花相助，且在社会生活中容易获得地位认同。这是一副【大器晚成】的优质底牌。',
    };
  }
  if (talent > 3 && patron < 2) {
    return {
      id: 'lone_talent',
      badge: '孤高傲骨',
      text: '你有着敏锐的感知力与独特的才华，虽然常需独自披荆斩棘，但你完全有能力靠一技之长打下一片天。你偏向【孤高傲骨】的智者路线。',
    };
  }
  if (friction >= 3 && patron < 3) {
    return {
      id: 'guard_rails',
      badge: '自我护栏',
      text: '命盘里提醒类星偏多，冲突与边界会更常出现。贵人未必缺席，但更要练【自我护栏】——先稳住再出击。',
    };
  }
  if (voidN >= 3 && fortuneSafe(themes) < 2) {
    return {
      id: 'steady_first',
      badge: '先稳再攻',
      text: '耗散与空亡的色调偏重，适合把注意力放在补地基与收口上。你偏向【先稳再攻】的节奏，不急着铺开场面。',
    };
  }
  if (solitude >= 2 && romance < 2) {
    return {
      id: 'quiet_strength',
      badge: '清减自立',
      text: '独处与清高的色调更明显，热闹未必是主场。你更擅长在安静里积蓄力量，走【清减自立】的路线。',
    };
  }
  return {
    id: 'slow_build',
    badge: '厚积薄发',
    text: '你的命盘相遇多是平稳、扎实的累积。不追求轰轰烈烈，但求每一步都踏实。你有【厚积薄发】的潜力。',
  };
}

function fortuneSafe(themes: Record<ShenshaThemeId, number>): number {
  return themes.fortune;
}

export function buildShenshaMeetPulsePanel(
  collectedIds: Iterable<string>,
  opts?: { nicheMax?: number },
): ShenshaMeetPulsePanel | null {
  const ids = [...new Set([...collectedIds].map((s) => s.trim()).filter(Boolean))];
  if (!ids.length) return null;

  const nicheMax = opts?.nicheMax ?? 4;
  const themes = countThemes(ids);
  const total = ids.length;
  const stage = resolveMeetStage(total);
  const summary = resolveMeetSummary(themes);

  const pillars: ShenshaMeetPillar[] = SHENSHA_PILLAR_THEMES.map((theme) => {
    const count = themes[theme];
    const ui = PILLAR_UI[theme];
    return {
      theme,
      title: SHENSHA_THEME_META[theme].title,
      emoji: ui.emoji,
      count,
      muted: count === 0,
      line: count > 0 ? `${count} ${ui.unit}` : ui.zeroHint,
    };
  });

  const niches: ShenshaMeetNiche[] = SHENSHA_NICHE_THEMES.map((theme) => ({
    theme,
    title: SHENSHA_THEME_META[theme].title,
    emoji: NICHE_UI[theme].emoji,
    count: themes[theme],
    hint: NICHE_UI[theme].hint,
  }))
    .filter((n) => n.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, nicheMax);

  const toneCounts = countShenshaByTone({ ids: new Set(ids) });
  const toneSum = SHENSHA_TONE_ORDER.reduce((n, id) => n + (toneCounts[id] || 0), 0);
  const dots: Record<ShenshaToneId, string> = {
    support: '🟢',
    neutral: '⚪',
    caution: '🔴',
  };
  const tones: ShenshaMeetToneSlice[] = SHENSHA_TONE_ORDER.map((id) => {
    const count = toneCounts[id] ?? 0;
    const pct = toneSum ? Math.round((count / toneSum) * 100) : 0;
    return {
      id,
      short: SHENSHA_TONE_META[id].short,
      count,
      pct,
      dot: dots[id],
    };
  });

  return {
    total,
    stage,
    lead: `你一路走来，命盘里已经点亮了 ${total} 颗星曜。它们并非偶然出现，而是你人生剧本里的客串演员。`,
    summary,
    pillars,
    niches,
    tones,
  };
}

/**
 * 兼容旧 API：转为短行列表（测试/外部若仍调用）。
 * 新 UI 请用 buildShenshaMeetPulsePanel。
 */
export function buildShenshaMeetHighlights(
  collectedIds: Iterable<string>,
): ShenshaMeetHighlightLine[] {
  const panel = buildShenshaMeetPulsePanel(collectedIds);
  if (!panel) return [];
  return [
    {
      id: panel.stage.id,
      text: `${panel.stage.icon} ${panel.stage.title} · ${panel.stage.blurb}`,
    },
    { id: panel.summary.id, text: panel.summary.text },
    ...panel.pillars
      .filter((p) => !p.muted)
      .slice(0, 2)
      .map((p) => ({
        id: p.theme,
        text: `${p.emoji} ${p.title} · ${p.line}`,
      })),
  ];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderShenshaMeetHighlightHtml(
  panel: ShenshaMeetPulsePanel | null | ShenshaMeetHighlightLine[],
  opts?: { emptyHint?: string; activeTheme?: ShenshaThemeId | 'all' },
): string {
  /** 兼容旧：传入 lines 数组时只渲染空壳或简表 */
  if (Array.isArray(panel)) {
    if (!panel.length) {
      return renderEmpty(opts?.emptyHint);
    }
    return `
    <section class="ziwei-shensha-meet-highlight" aria-label="相遇高光总结">
      <header class="ziwei-shensha-meet-highlight-head">✨ 相遇高光总结</header>
      <ul class="ziwei-shensha-meet-highlight-list">
        ${panel
          .map(
            (l) =>
              `<li class="ziwei-shensha-meet-highlight-item">${escapeHtml(l.text)}</li>`,
          )
          .join('')}
      </ul>
    </section>`;
  }

  if (!panel) return renderEmpty(opts?.emptyHint);

  const active = opts?.activeTheme ?? 'all';
  const toneSum = panel.tones.reduce((n, t) => n + t.count, 0) || 1;

  const pillarsHtml = panel.pillars
    .map((p) => {
      return `
      <button type="button"
        class="ziwei-meet-pulse-card${p.muted ? ' is-muted' : ''}${active === p.theme ? ' is-on' : ''}"
        data-meet-kind="shensha"
        data-shensha-theme="${p.theme}"
        title="${escapeHtml(p.title)} · 打开本页神煞·${escapeHtml(p.title)}">
        <span class="ziwei-meet-pulse-emoji" aria-hidden="true">${p.emoji}</span>
        <strong class="ziwei-meet-pulse-title">${escapeHtml(p.title)}</strong>
        <em class="ziwei-meet-pulse-num">${p.count}</em>
        <span class="ziwei-meet-pulse-line">${escapeHtml(p.line)}</span>
      </button>`;
    })
    .join('');

  const nichesHtml = panel.niches.length
    ? `
    <div class="ziwei-meet-niche-row" role="list" aria-label="星曜生态位">
      ${panel.niches
        .map(
          (n, i) => `
        ${i > 0 ? '<span class="ziwei-meet-niche-sep" aria-hidden="true"></span>' : ''}
        <button type="button" class="ziwei-meet-niche-chip${active === n.theme ? ' is-on' : ''}"
          data-meet-kind="shensha" data-shensha-theme="${n.theme}" role="listitem"
          title="${escapeHtml(n.hint)}">
          <span aria-hidden="true">${n.emoji}</span>
          <span>${escapeHtml(n.title)}</span>
          <em>${n.count}</em>
        </button>`,
        )
        .join('')}
    </div>`
    : `<p class="ziwei-meet-niche-empty">生态位标签会在收集到福禄 / 刑耗 / 独处等非大类神煞后出现。</p>`;

  const toneLegend = panel.tones
    .map(
      (t) => `
      <button type="button" class="ziwei-meet-tone-stat is-tone-${t.id}" data-meet-kind="shensha" data-shensha-tone="${t.id}">
        <span aria-hidden="true">${t.dot}</span>
        ${escapeHtml(t.short)} <em>${t.count}</em> 占 ${t.pct}%
      </button>`,
    )
    .join('');

  const toneBar = panel.tones
    .map(
      (t) =>
        `<i class="is-tone-${t.id}" style="flex:${Math.max(t.count / toneSum, 0.01)}" title="${escapeHtml(t.short)} ${t.count}（${t.pct}%）"></i>`,
    )
    .join('');

  return `
    <section class="ziwei-shensha-meet-highlight is-pulse" aria-label="已收集 · 神煞图鉴总览">
      <header class="ziwei-shensha-meet-highlight-head">✨ 已收集 · 神煞图鉴</header>

      <button type="button" class="ziwei-meet-stage-card is-${panel.stage.id}" data-meet-kind="shensha" title="查看本页神煞分类">
        <p class="ziwei-meet-stage-kicker">${panel.stage.icon} ${escapeHtml(panel.stage.title)}</p>
        <p class="ziwei-meet-stage-blurb">${escapeHtml(panel.stage.blurb)}</p>
        <p class="ziwei-meet-stage-lead">${escapeHtml(panel.lead)}</p>
      </button>

      <button type="button" class="ziwei-meet-summary-card" data-meet-kind="shensha" title="查看本页神煞分类">
        <span class="ziwei-meet-summary-badge">${escapeHtml(panel.summary.badge)}</span>
        <p>${escapeHtml(panel.summary.text)}</p>
      </button>

      <h3 class="ziwei-meet-pulse-heading">星象脉搏</h3>
      <div class="ziwei-meet-pulse-grid" role="group" aria-label="四大支柱">
        ${pillarsHtml}
      </div>

      <h3 class="ziwei-meet-pulse-heading">星曜生态位</h3>
      ${nichesHtml}

      <h3 class="ziwei-meet-pulse-heading">命盘色调</h3>
      <div class="ziwei-meet-tone-block" role="group" aria-label="色调占比">
        <div class="ziwei-meet-tone-legend">${toneLegend}</div>
        <div class="ziwei-meet-tone-bar" aria-hidden="true">${toneBar}</div>
        <p class="ziwei-shensha-tone-hint">色调是气氛提示，不是吉凶判决 · 点总结切到本页神煞分类</p>
      </div>
    </section>`;
}

function renderEmpty(emptyHint?: string): string {
  const hint =
    emptyHint ?? '收集神煞后，这里会用阶段卡与脉搏看板总揽你的相遇底色。';
  return `
    <section class="ziwei-shensha-meet-highlight is-empty" aria-label="相遇高光总结">
      <header class="ziwei-shensha-meet-highlight-head">✨ 已收集 · 神煞图鉴</header>
      <p class="ziwei-shensha-meet-highlight-empty">${escapeHtml(hint)}</p>
    </section>`;
}
