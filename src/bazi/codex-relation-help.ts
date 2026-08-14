/**
 * 生克环图旁小问号：模式说明 + 词条释义（六合≠三合、五合≠六合等）
 */

export type RelationModeHelp = {
  short: string;
  /** 图鉴词条短释义（进 ? 面板，不另开板块） */
  gloss: string;
  /** 说明正文；一句一行 */
  body: string;
};

export const BRANCH_MODE_HELP: Record<
  'chong' | 'he' | 'hai' | 'xing' | 'sanhe' | 'banhe' | 'sanhui',
  RelationModeHelp
> = {
  chong: {
    short: '六冲是什么？',
    gloss: '子午、丑未、寅申、卯酉、辰戌、巳亥。',
    body: '六冲是十二地支对面相撞，共六对。环上直径两端是一对，不是相邻。偏行程换场、节奏加速。不是必凶判决。相近还有「破」——结构松动、计划易裂。',
  },
  he: {
    short: '六合和三合有何不同？',
    gloss: '子丑、寅亥、卯戌、辰酉、巳申、午未。',
    body: '六合是两支一对牵绊合化，共六对。三合是三支成局成势，共四组。六合看配对牵绊。三合看一方气势。别和天干五合搞混。',
  },
  hai: {
    short: '六害是什么？',
    gloss: '六害 · 暗中掣肘、合中带损。',
    body: '六害是六对隐性掣肘。比冲更暗，比合更别扭。偏暗掣节奏，宜慢核实。不作恐吓判决。「穿」常作害的另一说法。',
  },
  xing: {
    short: '刑是什么？',
    gloss: '三刑、子卯刑、自刑等，内耗与纠结。',
    body: '刑偏内耗与纠结。含三刑、子卯刑、自刑。像三角拉扯，或自己跟自己较劲。宜理顺关系，非恐吓标签。',
  },
  sanhe: {
    short: '三合是什么？',
    gloss: '申子辰水、寅午戌火、巳酉丑金、亥卯未木。',
    body: '三合是三支成局，气势成一方五行。与六合不同：六合是两两配对。缺一支时看「半合」模式。',
  },
  banhe: {
    short: '半合是什么？',
    gloss: '三合缺一仍成半合，气场偏一方。',
    body: '半合来自三合局任意两支。力度弱于三合全成。偏一方气场，不是完整成局。可与三合对照看。',
  },
  sanhui: {
    short: '三会是什么？',
    gloss: '寅卯辰木、巳午未火、申酉戌金、亥子丑水。',
    body: '三会是按方位成方，四季一方。与三合不同表：三合隔位成局，三会相邻成方。偏一方旺气聚拢。',
  },
};

export const STEM_MODE_HELP: Record<
  'he' | 'chong' | 'sheng' | 'ke',
  RelationModeHelp
> = {
  he: {
    short: '天干五合≠地支六合',
    gloss: '甲己合土、乙庚合金、丙辛合水、丁壬合木、戊癸合火。',
    body: '天干五合是十天干两两配对合化，共五对。地支六合是十二支两两合，另一套。名字都带「合」，对象不同。看环图标题是「天干」还是「地支」。',
  },
  chong: {
    short: '天干相冲说明',
    gloss: '甲庚、乙辛、丙壬、丁癸等对冲，力大易震荡。',
    body: '天干相冲常见四对。力感大、易震荡，偏换场节奏。与地支六冲不是同一张表。',
  },
  sheng: {
    short: '天干相生说明',
    gloss: '按五行相生看干与干的滋养与泄秀。',
    body: '按天干所属五行相生。环上同色线多为阳干连阳干、阴干连阴干。完整生克仍以五行为纲。',
  },
  ke: {
    short: '天干相克说明',
    gloss: '按五行相克看干与干的压力与成器。',
    body: '按天干所属五行相克。偏压力与成器节奏。不是单纯「倒霉」标签。',
  },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 按句号等拆成一行一句 */
export function splitHelpSentences(text: string): string[] {
  return text
    .split(/(?<=[。！？；])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function linesHtml(text: string, className = 'bazi-br-help-line'): string {
  return splitHelpSentences(text)
    .map((line) => `<p class="${className}">${escapeHtml(line)}</p>`)
    .join('');
}

/** 结构图标题旁小问号（details；点空白可关，见 bindRelationHelpDismiss） */
export function relationHelpDetailsHtml(help: {
  short: string;
  gloss?: string;
  body: string;
  /** 多条词条（运程一览等） */
  items?: ReadonlyArray<{ title: string; gloss: string }>;
}): string {
  const gloss = help.gloss?.trim()
    ? `<div class="bazi-br-help-gloss"><span>词条</span>${linesHtml(help.gloss.trim(), 'bazi-br-help-line is-gloss')}</div>`
    : '';
  const items =
    help.items && help.items.length
      ? `<ul class="bazi-br-help-list">${help.items
          .map(
            (it) =>
              `<li><strong>${escapeHtml(it.title)}</strong>${linesHtml(it.gloss)}</li>`,
          )
          .join('')}</ul>`
      : '';
  return `
    <details class="bazi-br-help">
      <summary class="bazi-codex-help" title="${escapeHtml(help.short)}" aria-label="${escapeHtml(help.short)}">?</summary>
      <div class="bazi-br-help-panel">
        <strong>${escapeHtml(help.short)}</strong>
        ${gloss}
        ${items}
        <div class="bazi-br-help-body">${linesHtml(help.body)}</div>
      </div>
    </details>`;
}

/** 点空白关闭问号面板；同页只留一个打开 */
export function bindRelationHelpDismiss(scope: ParentNode = document): () => void {
  const onToggle = (e: Event): void => {
    const d = e.target;
    if (!(d instanceof HTMLDetailsElement) || !d.classList.contains('bazi-br-help')) return;
    if (!d.open) return;
    scope.querySelectorAll<HTMLDetailsElement>('details.bazi-br-help[open]').forEach((other) => {
      if (other !== d) other.open = false;
    });
  };

  const onPointer = (e: Event): void => {
    const t = e.target as Element | null;
    if (!t?.closest) return;
    const open = scope.querySelectorAll<HTMLDetailsElement>('details.bazi-br-help[open]');
    if (!open.length) return;
    if (t.closest('details.bazi-br-help')) return;
    open.forEach((d) => {
      d.open = false;
    });
  };

  scope.querySelectorAll('details.bazi-br-help').forEach((d) => {
    d.addEventListener('toggle', onToggle);
  });
  // 捕获阶段：空白处一点就关；延后绑，避免打开当次点击立刻关掉
  let removePointer: (() => void) | null = null;
  const timer = window.setTimeout(() => {
    document.addEventListener('pointerdown', onPointer, true);
    removePointer = () => document.removeEventListener('pointerdown', onPointer, true);
  }, 0);

  return () => {
    window.clearTimeout(timer);
    removePointer?.();
    scope.querySelectorAll('details.bazi-br-help').forEach((d) => {
      d.removeEventListener('toggle', onToggle);
    });
  };
}
