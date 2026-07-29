/**
 * OfflineAnswerPack 共用渲染：此刻解读 + 速断
 * 优先四段剧本：定心丸 → 现状真相 → 具体动作 → 底线
 */
import type { CastResult } from '../liuyao/engine.ts';
import { navigate } from '../router.ts';
import type { OfflineAnswerPack } from './types.ts';
import type { ScriptBeat } from './script-play.ts';
import { escapeHtml, formatProseHtml } from './prose.ts';
import { pickQuickGuideChips, QUICK_GUIDE_BY_ID } from './quick-guides.ts';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type HexNeedle = { kind: 'primary' | 'changed'; name: string; label: string };

const HEX_HOT_TOKEN = '@@LYHEX';

function collectHexNeedles(cast: CastResult): HexNeedle[] {
  const entries: { kind: 'primary' | 'changed'; name: string; full: string }[] = [
    {
      kind: 'primary',
      name: cast.primary.name,
      full: cast.primary.fullName,
    },
  ];
  if (cast.changed) {
    entries.unshift({
      kind: 'changed',
      name: cast.changed.name,
      full: cast.changed.fullName,
    });
  }

  // 长名优先，避免「大有」先匹配破坏「火天大有」
  return entries
    .flatMap((e) => [
      { kind: e.kind, name: e.name, label: e.full },
      { kind: e.kind, name: e.name, label: e.name },
    ])
    .filter((n, i, arr) => arr.findIndex((x) => x.label === n.label && x.kind === n.kind) === i)
    .sort((a, b) => b.label.length - a.label.length);
}

function hotButton(kind: 'primary' | 'changed', name: string, labelHtml: string): string {
  return `<button type="button" class="ly-hex-hot" data-hex-kind="${kind}" data-hex-name="${escapeHtml(name)}" title="打开卦象精读">${labelHtml}</button>`;
}

/** 暂时盖住已生成的热链，避免短名在按钮内文/属性里二次匹配 */
function withProtectedHexHots(html: string, map: (masked: string) => string): string {
  const parts: string[] = [];
  const masked = html.replace(
    /<button\b[^>]*\bly-hex-hot\b[^>]*>[\s\S]*?<\/button>/g,
    (m) => {
      const i = parts.length;
      parts.push(m);
      return `${HEX_HOT_TOKEN}${i}@@`;
    },
  );
  let out = map(masked);
  out = out.replace(new RegExp(`${HEX_HOT_TOKEN}(\\d+)@@`, 'g'), (_, i: string) => parts[Number(i)]!);
  return out;
}

function mapHtmlTextSegments(html: string, mapText: (text: string) => string): string {
  return html.replace(/(<[^>]*>)|([^<]+)/g, (_all, tag: string | undefined, text: string | undefined) => {
    if (tag) return tag;
    return mapText(text ?? '');
  });
}

function linkifyPlainText(text: string, needles: HexNeedle[]): string {
  let out = text;
  const used = new Set<string>();
  for (const n of needles) {
    if (used.has(n.label)) continue;
    used.add(n.label);
    const re = new RegExp(`${escapeRegExp(escapeHtml(n.label))}(?:（[^）]+）)?`, 'g');
    out = withProtectedHexHots(out, (masked) =>
      mapHtmlTextSegments(masked, (seg) =>
        seg.replace(re, (m) => hotButton(n.kind, n.name, m)),
      ),
    );
  }
  return out;
}

/** 转义后的散文里，把本/变卦名做成可点热词 */
export function linkifyHexInHtml(html: string, cast: CastResult): string {
  const needles = collectHexNeedles(cast);
  let out = mapHtmlTextSegments(html, (text) => linkifyPlainText(text, needles));

  if (cast.changed) {
    const changedName = cast.changed.name;
    out = withProtectedHexHots(out, (masked) =>
      mapHtmlTextSegments(masked, (text) =>
        text.replace(/变卦/g, () => hotButton('changed', changedName, '变卦')),
      ),
    );
  }
  out = withProtectedHexHots(out, (masked) =>
    mapHtmlTextSegments(masked, (text) =>
      text.replace(/本卦/g, () => hotButton('primary', cast.primary.name, '本卦')),
    ),
  );

  return out;
}

function formatLinkedProse(text: string, cast: CastResult | undefined, className?: string): string {
  const base = formatProseHtml(text, className);
  return cast ? linkifyHexInHtml(base, cast) : base;
}

function termHotHtml(term: string, gloss: string): string {
  return `<button type="button" class="ly-term-hot" data-term-gloss="${escapeHtml(gloss)}" aria-expanded="false"><span class="ly-term-mark">${escapeHtml(term)}</span></button><span class="ly-term-tip" hidden>${escapeHtml(gloss)}</span>`;
}

function kwTagsHtml(keywords: string[]): string {
  return keywords
    .slice(0, 3)
    .filter(Boolean)
    .map((k) => `<span class="ly-kw-tag">${escapeHtml(k)}</span>`)
    .join('');
}

/** 从解析文里拆本卦 / 变卦旁白（direct-reading 固定格式） */
function splitParseAsides(parse: string): {
  primaryAside: string;
  changedAside: string;
  metaphor: string;
} {
  const metaphorMatch = parse.match(/【核心隐喻】[：:]\s*([\s\S]*)$/);
  const metaphor = metaphorMatch?.[1]?.trim() ?? '';
  const body = metaphorMatch ? parse.slice(0, metaphorMatch.index).trim() : parse.trim();
  const parts = body.split(/\n\n+/);
  let primaryAside = '';
  let changedAside = '';
  for (const p of parts) {
    const t = p.trim();
    if (/^本卦/.test(t)) {
      primaryAside = t
        .replace(/^本卦【[^】]+】[：:]\s*代表[^\n。]*[。.]?\s*/, '')
        .replace(/^本卦[^\n]*\n/, '')
        .trim();
    } else if (/^变卦/.test(t) || /^无变卦/.test(t)) {
      changedAside = t
        .replace(/^变卦【[^】]+】[：:]\s*代表[^\n。]*[。.]?\s*/, '')
        .replace(/^变卦[^\n]*\n/, '')
        .replace(/^无变卦[：:]?\s*/, '')
        .trim();
    }
  }
  return { primaryAside, changedAside, metaphor };
}

function layerHead(title: string, sub: string): string {
  return `
    <header class="ly-layer-head">
      <h3 class="ly-layer-title">【${escapeHtml(title)}】</h3>
      <p class="ly-layer-sub">${escapeHtml(sub)}</p>
    </header>`;
}

function highlightComfortHtml(text: string, cast: CastResult | undefined): string {
  const esc = escapeHtml(text);
  const linked = cast ? linkifyHexInHtml(esc, cast) : esc;
  // 抚慰金句：含「别急/不是你的/守住/气馁/自我怀疑」等整句加亮
  return linked.replace(
    /([^。！？\n]*?(?:别急|不要因此|不要自我怀疑|并非来自你|守住你的|不是你的能力|该停则停)[^。！？\n]*[。！？]?)/g,
    '<strong class="ly-script-gold">$1</strong>',
  );
}

function renderScriptBeat(
  beat: ScriptBeat,
  cast: CastResult | undefined,
): string {
  const isOps = beat.id === 'action' || beat.id === 'boundary';
  const body =
    beat.id === 'calm'
      ? `<div class="ly-pack-prose">${highlightComfortHtml(beat.body, cast)}</div>`
      : formatLinkedProse(beat.body, cast);

  return `
    <section class="ly-layer-card ly-script-beat${isOps ? ' is-ops' : ''}" data-briefing-section data-script-beat="${beat.id}">
      <header class="ly-layer-head">
        <h3 class="ly-layer-title">${escapeHtml(beat.title)}</h3>
      </header>
      ${body}
    </section>`;
}

function renderScriptPlay(
  pack: OfflineAnswerPack,
  cast: CastResult | undefined,
): string {
  const script = pack.script;
  if (!script) return '';

  const hexLine = cast
    ? `<p class="ly-script-hexmeta">${escapeHtml(cast.primary.fullName)}${
        cast.changed ? ` → ${escapeHtml(cast.changed.fullName)}` : ''
      }</p>`
    : '';

  return `
    <section class="ly-layer-card ly-script-verdict" data-briefing-section data-layer="verdict">
      <header class="ly-layer-head">
        <h3 class="ly-layer-title">卦象定调</h3>
        <span class="ly-layer-sub">一句话结论</span>
      </header>
      ${hexLine}
      <p class="ly-pack-headline ly-verdict-card">${escapeHtml(script.headline)}</p>
    </section>
    ${script.beats.map((b) => renderScriptBeat(b, cast)).join('')}`;
}

function renderCoreLayer(
  pack: OfflineAnswerPack,
  cast: CastResult | undefined,
): string {
  const { primaryAside, changedAside, metaphor } = splitParseAsides(pack.verdict.parse);
  const metaphorLine = metaphor || pack.coreMetaphor?.replace(/^核心隐喻[：:]\s*/, '') || '';

  let hexBlocks = '';
  if (cast) {
    const pName = cast.primary.fullName || cast.primary.name;
    const pHot = hotButton('primary', cast.primary.name, escapeHtml(pName));
    hexBlocks += `
      <div class="ly-hex-frame">
        <p class="ly-hex-frame-lead">
          <span class="ly-role-tag">本卦</span>
          ${pHot}
          <span class="ly-hex-eq">=</span>
          ${kwTagsHtml(cast.primary.keywords)}
        </p>
        ${
          primaryAside
            ? `<div class="ly-hex-aside">${formatLinkedProse(primaryAside, cast, 'ly-pack-p ly-aside-p')}</div>`
            : ''
        }
      </div>`;
    if (cast.changed) {
      const cName = cast.changed.fullName || cast.changed.name;
      const cHot = hotButton('changed', cast.changed.name, escapeHtml(cName));
      hexBlocks += `
      <div class="ly-hex-frame">
        <p class="ly-hex-frame-lead">
          <span class="ly-role-tag">变卦</span>
          ${cHot}
          <span class="ly-hex-eq">=</span>
          ${kwTagsHtml(cast.changed.keywords)}
        </p>
        ${
          changedAside
            ? `<div class="ly-hex-aside">${formatLinkedProse(changedAside, cast, 'ly-pack-p ly-aside-p')}</div>`
            : ''
        }
      </div>`;
    } else if (changedAside) {
      hexBlocks += `<div class="ly-hex-aside">${formatLinkedProse(changedAside, cast, 'ly-pack-p ly-aside-p')}</div>`;
    }
  } else {
    hexBlocks = `<div class="ly-pack-prose">${formatLinkedProse(pack.verdict.parse, undefined)}</div>`;
  }

  return `
    <section class="ly-layer-card" data-briefing-section data-layer="core">
      ${layerHead('核心方向', '定调')}
      <p class="ly-pack-headline">${escapeHtml(pack.verdict.headline)}</p>
      <div class="ly-layer-rule" aria-hidden="true"></div>
      ${hexBlocks}
      ${
        metaphorLine
          ? `<p class="ly-metaphor"><span class="ly-role-tag">隐喻</span>${escapeHtml(metaphorLine)}</p>`
          : ''
      }
    </section>`;
}

function cleanWhyTitle(title: string): string {
  return title
    .replace(/（世爻[：:][^）]+）/g, '')
    .replace(/（动爻[：:][^）]+）/g, '')
    .replace(/（变卦[^）]*）/g, '')
    .replace(/（无变卦）/g, '')
    .trim();
}

function renderWhyBadge(
  w: import('./types.ts').WhyItem,
  cast: CastResult | undefined,
): string {
  const term = w.badgeTerm ?? w.gloss;
  if (!term && !w.badgeHex && !w.badgeNote && !w.badge) {
    return '';
  }

  // 旧 badge 字符串兜底
  if (!term && !w.badgeHex && w.badge) {
    return `<span class="ly-why-badge">${escapeHtml(w.badge)}</span>`;
  }

  const termHtml = term
    ? termHotHtml(term.term, term.gloss)
    : '';
  const hexHtml =
    w.badgeHex && cast
      ? hotButton(
          w.badgeHex.kind,
          w.badgeHex.name,
          escapeHtml(w.badgeHex.label),
        )
      : w.badgeHex
        ? escapeHtml(w.badgeHex.label)
        : '';
  const noteHtml = w.badgeNote ? escapeHtml(w.badgeNote) : '';

  const parts = [termHtml, hexHtml || noteHtml].filter(Boolean);
  if (!parts.length) return '';
  return `<span class="ly-why-badge">${parts.join('<span class="ly-why-badge-dot" aria-hidden="true">·</span>')}</span>`;
}

function renderWhyCard(
  w: import('./types.ts').WhyItem,
  i: number,
  cast: CastResult | undefined,
): string {
  const title = cleanWhyTitle(w.title);
  const hook = w.hook?.trim() || '';
  const points = (w.points ?? []).filter(Boolean);
  const tip = w.tip?.trim() || '';

  let fallbackLines: string[] = [];
  if (!hook && w.body.trim()) {
    fallbackLines = w.body
      .split(/\n+/)
      .map((s) => s.replace(/^(潜台词|建议|具体指向|系统提示)[：:]\s*/, '').trim())
      .filter(Boolean);
  }

  const hookHtml = hook
    ? `<p class="ly-why-hook">${cast ? linkifyHexInHtml(escapeHtml(hook), cast) : escapeHtml(hook)}</p>`
    : fallbackLines[0]
      ? `<p class="ly-why-hook">${cast ? linkifyHexInHtml(escapeHtml(fallbackLines[0]!), cast) : escapeHtml(fallbackLines[0]!)}</p>`
      : '';

  const pointSource = points.length
    ? points
    : fallbackLines.slice(hook ? 0 : 1).filter((l) => !/^建议/.test(l));
  const pointsHtml = pointSource.length
    ? `<ul class="ly-why-points">${pointSource
        .map(
          (p) =>
            `<li>${cast ? linkifyHexInHtml(escapeHtml(p), cast) : escapeHtml(p)}</li>`,
        )
        .join('')}</ul>`
    : '';

  const tipText =
    tip ||
    fallbackLines.find((l) => l.startsWith('建议'))?.replace(/^建议[：:]\s*/, '') ||
    '';
  const tipHtml = tipText
    ? `<p class="ly-why-tip"><span class="ly-why-tip-label">建议</span>${
        cast ? linkifyHexInHtml(escapeHtml(tipText), cast) : escapeHtml(tipText)
      }</p>`
    : '';

  return `
    <article class="ly-why-card">
      <header class="ly-why-card-head">
        <span class="ly-why-num" aria-hidden="true">${i + 1}</span>
        <div class="ly-why-card-titles">
          <p class="ly-why-title">${
            cast ? linkifyHexInHtml(escapeHtml(title), cast) : escapeHtml(title)
          }</p>
          ${renderWhyBadge(w, cast)}
        </div>
      </header>
      ${hookHtml}
      ${pointsHtml}
      ${tipHtml}
    </article>`;
}

function renderPulseLayer(
  pack: OfflineAnswerPack,
  cast: CastResult | undefined,
): string {
  if (!pack.why.length) return '';
  const items = pack.why.map((w, i) => renderWhyCard(w, i, cast)).join('');

  return `
    <section class="ly-layer-card" data-briefing-section data-layer="pulse">
      ${layerHead('现状与转机', '找病灶')}
      <div class="ly-pack-yao-list">${items}</div>
    </section>`;
}

const ACTION_ROLES = ['肯定', '务实', '提防'] as const;

function renderActionLayer(
  pack: OfflineAnswerPack,
  cast: CastResult | undefined,
): string {
  const weekItems = [pack.breakthrough, ...pack.checklist].filter((a) => a.body.trim());
  const decision = pack.verdict.decision.trim();

  const weekHtml = weekItems
    .map((c, i) => {
      const role = ACTION_ROLES[i] ?? '动作';
      return `
        <li>
          <p class="ly-pack-action-title">
            <span class="ly-role-tag">${escapeHtml(role)}</span>
            ${escapeHtml(c.title)}
          </p>
          ${formatLinkedProse(c.body, cast, 'ly-pack-p ly-pack-action-p')}
        </li>`;
    })
    .join('');

  const chips = pickQuickGuideChips(pack.intents);
  const chipsHtml =
    chips.length > 0
      ? `<div class="ly-guide-chips" data-guide-chips>
          ${chips
            .map(
              (c) => `
            <button type="button" class="ly-guide-chip" data-guide-id="${escapeHtml(c.id)}">
              ${escapeHtml(c.label)}
            </button>`,
            )
            .join('')}
        </div>`
      : '';

  return `
    <section class="ly-layer-card" data-briefing-section data-layer="action">
      ${layerHead('具体动作', '给解法')}
      ${
        decision
          ? `<div class="ly-pack-prose ly-pack-decision-rec">${formatLinkedProse(decision, cast)}</div>`
          : ''
      }
      ${weekHtml ? `<ul class="ly-pack-checklist">${weekHtml}</ul>` : ''}
      ${chipsHtml}
    </section>`;
}

function renderReassureLayer(
  pack: OfflineAnswerPack,
  cast: CastResult | undefined,
): string {
  if (!pack.reassurance?.trim()) return '';
  return `
    <section class="ly-layer-card ly-layer-reassure" data-briefing-section data-layer="reassure">
      ${layerHead('心理定心丸', '心态安抚')}
      <div class="ly-pack-reassure-body">${formatLinkedProse(
        pack.reassurance,
        cast,
        'ly-pack-p ly-reassure-p',
      )}</div>
    </section>`;
}

export type RenderPackOpts = {
  topicLabel?: string;
  lead?: string;
  compact?: boolean;
  classicHtml?: string;
  /** 传入则可点本/变卦名打开卦象精读 */
  cast?: CastResult;
};

export function renderAnswerPackHtml(
  pack: OfflineAnswerPack,
  opts: RenderPackOpts = {},
): string {
  const lead = opts.lead ?? '';
  const topicLabel = opts.topicLabel ?? '';
  const cast = opts.cast;

  const subAnswers =
    pack.answers.length > 1
      ? `<details class="ly-pack-subs" data-briefing-section>
          <summary>分题拆开看（${pack.answers.length}）</summary>
          <div class="ly-pack-subs-body">
            ${pack.answers
              .map(
                (a, i) => `
              <div class="ly-pack-item" data-intent="${escapeHtml(a.intentId)}">
                <p class="ly-pack-q"><span class="ly-pack-idx">${i + 1}</span>${escapeHtml(a.questionSlice)}</p>
                ${formatLinkedProse(a.lean, cast, 'ly-pack-p ly-pack-lean-p')}
              </div>`,
              )
              .join('')}
          </div>
        </details>`
      : '';

  return `
    <article class="ly-question-briefing ly-answer-pack${opts.compact ? ' is-compact' : ''}" data-question-briefing data-answer-pack>
      ${lead ? `<p class="ly-briefing-kicker">${cast ? linkifyHexInHtml(escapeHtml(lead), cast) : escapeHtml(lead)}</p>` : ''}
      ${topicLabel ? `<p class="ly-briefing-topic">${escapeHtml(topicLabel)}</p>` : ''}
      ${pack.contextUsed ? `<p class="ly-pack-context">已带入档案</p>` : ''}

      ${
        pack.script
          ? renderScriptPlay(pack, cast)
          : `${renderCoreLayer(pack, cast)}
      ${renderPulseLayer(pack, cast)}
      ${renderActionLayer(pack, cast)}
      ${renderReassureLayer(pack, cast)}`
      }
      ${subAnswers}

      ${
        pack.boardExpand
          ? `<details class="ly-briefing-more"><summary>盘面辅读</summary><div class="ly-pack-prose">${formatLinkedProse(pack.boardExpand, cast)}</div></details>`
          : ''
      }
      ${opts.classicHtml ?? ''}
    </article>
  `;
}

/** 点术语就地展开；点卦名：有精读抽屉则交给 learn-course，否则弹出短释义；行动胶囊弹备忘 */
export function bindAnswerPackGestures(root: HTMLElement, cast?: CastResult): void {
  if (root.dataset.packGesturesBound === '1') return;
  root.dataset.packGesturesBound = '1';

  root.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLButtonElement>('.ly-guide-chip');
    if (chip && root.contains(chip)) {
      e.preventDefault();
      const guide = QUICK_GUIDE_BY_ID[chip.dataset.guideId ?? ''];
      if (!guide) return;
      if (guide.path) {
        navigate(guide.path);
        return;
      }
      root.querySelector('.ly-guide-pop')?.remove();
      const pop = document.createElement('div');
      pop.className = 'ly-guide-pop';
      pop.innerHTML = `<p class="ly-guide-pop-title">${escapeHtml(guide.label)}</p><div class="ly-guide-pop-body">${escapeHtml(guide.body ?? '').replace(/\n/g, '<br>')}</div><button type="button" class="ly-guide-pop-close">收起</button>`;
      chip.insertAdjacentElement('afterend', pop);
      pop.querySelector('.ly-guide-pop-close')?.addEventListener('click', () => pop.remove());
      return;
    }

    const term = (e.target as HTMLElement).closest<HTMLElement>('.ly-term-hot');
    if (term && root.contains(term)) {
      e.preventDefault();
      const tip = term.nextElementSibling;
      if (tip?.classList.contains('ly-term-tip')) {
        const open = tip.hasAttribute('hidden');
        tip.toggleAttribute('hidden', !open);
        term.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      return;
    }

    const hot = (e.target as HTMLElement).closest<HTMLElement>('.ly-hex-hot');
    if (!hot || !root.contains(hot)) return;
    if (root.querySelector('[data-learn-notes]')) return;

    e.preventDefault();
    const name = hot.dataset.hexName;
    if (!name || !cast) return;
    const kind = hot.dataset.hexKind;
    const hex =
      kind === 'changed' && cast.changed?.name === name
        ? cast.changed
        : cast.primary.name === name
          ? cast.primary
          : cast.changed?.name === name
            ? cast.changed
            : cast.primary;
    const existing = root.querySelector('.ly-hex-pop');
    existing?.remove();
    const pop = document.createElement('div');
    pop.className = 'ly-hex-pop';
    pop.innerHTML = `<strong>${escapeHtml(hex.fullName)}</strong><p>${escapeHtml(hex.keywords.slice(0, 4).join(' · '))}</p>`;
    hot.insertAdjacentElement('afterend', pop);
    const close = () => {
      pop.remove();
      document.removeEventListener('click', close);
    };
    setTimeout(() => document.addEventListener('click', close, { once: true }), 0);
  });
}
