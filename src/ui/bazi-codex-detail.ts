import {
  CODEX_DETAIL_LABELS,
  getBaziEncyclopedia,
  codexDetailPanesFor,
  type CodexDetailPane,
} from '../bazi/codex-encyclopedia.ts';
import { isBaziCodexUnlocked, listBaziCodexEntries, type BaziCodexEncounter } from '../bazi/codex.ts';
import { buildCodexDossier } from '../bazi/codex-dossier.ts';
import {
  buildChartLinkReport,
  type ChartLinkReport,
} from '../bazi/codex-chart-link.ts';
import {
  baziCodexMarkButtonLabel,
  hasBaziCodexMark,
  toggleBaziCodexMark,
  type BaziCodexMark,
} from '../bazi/codex-favorites.ts';
import { chartPresenceBrief } from '../bazi/codex-presence-brief.ts';
import { findCodexInsightTip } from '../bazi/codex-insight-tip.ts';
import {
  focusWuxingFromEntry,
  renderRelationStarMapHtml,
  renderWuxingShengKeMapHtml,
} from '../bazi/codex-wuxing-map.ts';
import { renderEntryRelationFragmentHtml } from '../bazi/codex-relations-atlas.ts';
import { renderStructureMapHtml } from '../bazi/codex-structure-map.ts';
import type { BaziChart } from '../bazi/cast.ts';
import type { LuckCycles } from '../bazi/luck-cycles.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function bullets(items: string[]): string {
  if (!items.length) return '';
  return `<ul class="bazi-enc-list">${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
}

function section(title: string, body: string): string {
  if (!body.trim()) return '';
  return `<section class="bazi-enc-section"><h3>${escapeHtml(title)}</h3>${body}</section>`;
}

function formatEncounterTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN');
  } catch {
    return iso;
  }
}

function renderMeetEncountersHtml(encounters: BaziCodexEncounter[]): string {
  if (!encounters.length) return '';
  const first = encounters[encounters.length - 1]!;
  const timeline = encounters
    .map(
      (e) => `
      <li class="bazi-meet-enc-item">
        <time>${escapeHtml(formatEncounterTime(e.at))}</time>
        <p>${e.question ? `问：${escapeHtml(e.question)}` : '（未记录问题）'}</p>
        ${e.summary.trim() ? `<p class="bazi-meet-enc-summary">${escapeHtml(e.summary)}</p>` : ''}
      </li>`,
    )
    .join('');
  return section(
    '我的相遇',
    `
    <div class="bazi-meet-enc">
      <div class="bazi-meet-enc-first">
        <p class="bazi-meet-enc-label">第一次相遇</p>
        <time>${escapeHtml(formatEncounterTime(first.at))}</time>
        <p>${first.question ? `你问：${escapeHtml(first.question)}` : '（未记录问题）'}</p>
        ${
          encounters.length > 1
            ? `<p class="bazi-meet-enc-more">此后又相遇 <strong>${encounters.length - 1}</strong> 次</p>`
            : ''
        }
      </div>
      <ol class="bazi-meet-enc-timeline">${timeline}</ol>
    </div>`,
  );
}

export type BaziCodexDetailOpts = {
  artHtml: string;
  lit: boolean;
  unlockHint?: string;
  memoryExtraHtml?: string;
  /** 命盘关联层（动态） */
  chartLink?: ChartLinkReport | null;
  chart?: BaziChart | null;
  luck?: LuckCycles | null;
};

function renderChartPane(link: ChartLinkReport | null | undefined, lit: boolean): string {
  if (!link) {
    return `<p class="bazi-codex-hint">排盘后可查看本词条在你命盘中的落点与作用。</p>`;
  }
  const status = link.present
    ? `<p class="bazi-enc-chart-status is-on">${escapeHtml(link.summary)}</p>`
    : `<p class="bazi-enc-chart-status">${escapeHtml(link.summary)}</p>`;

  const stages = link.stageNotes.length
    ? section('出现在哪一柱 · 人生阶段', bullets(link.stageNotes))
    : '';
  const peers = link.peerRelations.length
    ? section('与哪些干支产生关系', bullets(link.peerRelations))
    : '';
  const sk = link.shengKe.length
    ? section('被谁生、被谁克', bullets(link.shengKe))
    : '';
  const strength = section(
    '得令 · 得地 · 得势',
    `<p>${escapeHtml(link.strength.note)}</p>`,
  );
  const impact = section('对日主是助力还是压力', `<p>${escapeHtml(link.dayMasterImpact)}</p>`);
  const luck = section('当前大运、流年是否触发', `<p>${escapeHtml(link.luckTrigger)}</p>`);
  const role = link.dossierHint
    ? section('命盘中的实际作用', `<p>${escapeHtml(link.dossierHint)}</p>`)
    : '';
  const deep = link.deepBrief
    ? section(
        '深度解析 · 四柱与运程',
        `<p class="bazi-enc-deep">${escapeHtml(link.deepBrief).replace(/\n/g, '<br>')}</p>`,
      )
    : '';

  const body = `${status}${stages}${peers}${sk}${strength}${impact}${luck}${role}${deep}`;
  if (!lit) {
    return `<p class="bazi-codex-locked">点亮后展开完整命盘关联。</p><div class="bazi-enc-teaser is-dim">${status}${strength}${impact}</div>`;
  }
  return body;
}

function renderSchoolDiffPane(
  dossier: ReturnType<typeof buildCodexDossier>,
): string {
  const sd = dossier?.schoolDiff;
  if (!sd) {
    return `<p class="bazi-codex-hint">本词条暂无他派差异说明。</p>`;
  }
  return `
    ${section('本产品查法', `<p>${escapeHtml(sd.productMethod)}</p>`)}
    ${section('他派常见差异', bullets(sd.otherSchools))}
    ${section('阅读提醒', `<p>${escapeHtml(sd.note)}</p>`)}
  `;
}

/**
 * 八字图鉴四屏：基础 / 表现 / 生克 / 命盘（神煞加「他派差异」）
 */
export function renderBaziCodexDetailHtml(
  id: string,
  opts: BaziCodexDetailOpts,
): string {
  const entry = getBaziEncyclopedia(id);
  if (!entry) return '';
  const dossier = buildCodexDossier(id);
  if (!dossier) return '';

  const lit = opts.lit ?? isBaziCodexUnlocked(id);
  const codexEntry = listBaziCodexEntries().find((e) => e.id === id);
  const meetHtml =
    lit && (codexEntry?.encounters?.length ?? 0) > 0
      ? renderMeetEncountersHtml(codexEntry!.encounters ?? [])
      : '';
  const tags = [
    dossier.yinyangLabel !== '—' ? dossier.yinyangLabel : entry.tags.yinyang,
    dossier.wuxingLabel,
    entry.tags.category,
  ].filter(Boolean) as string[];

  const lockedBanner = lit
    ? ''
    : `<p class="bazi-codex-locked">${escapeHtml(opts.unlockHint ?? '尚未点亮。排盘遇见后可完整展开。')}</p>`;

  const bodyOrTeaser = (html: string) =>
    lit
      ? html
      : `${lockedBanner}<div class="bazi-enc-teaser is-dim">${html}</div>`;

  const focus = focusWuxingFromEntry(entry);
  const presenceBrief = chartPresenceBrief(id, opts.chart ?? null, opts.luck ?? null);
        const insightTip = findCodexInsightTip(id, opts.chart ?? null);
  const markFire = hasBaziCodexMark(id, 'fire');
  const markUseful = hasBaziCodexMark(id, 'useful');

  const shengKe =
    focus
      ? renderWuxingShengKeMapHtml({
          focus,
          compact: true,
          nodeAttr: 'data-open-entry',
          markerPrefix: 'bazi-sk-detail',
          title: `生克图 · ${entry.title}`,
          hint: `以「${focus}」为焦点看相生相克`,
        })
      : renderRelationStarMapHtml(entry);
  const fragment = renderEntryRelationFragmentHtml(id);

  const comboHtml = dossier.combos.length
    ? `<ul class="bazi-enc-list">${dossier.combos
        .map(
          (c) =>
            `<li><strong>${escapeHtml(c.peer)}</strong> · ${escapeHtml(c.note)}</li>`,
        )
        .join('')}</ul>`
    : '';

  const panes: Partial<Record<CodexDetailPane, string>> = {
    basics: `
      <div class="bazi-enc-memory${entry.kind === 'shensha' ? ' is-shensha' : ''}">
        <div class="bazi-enc-art ${entry.kind === 'shensha' ? 'is-badge' : ''} ${lit ? 'is-lit' : 'is-dim'}">${opts.artHtml}${lit || entry.kind === 'shensha' ? '' : '<span class="bazi-art-seal"></span>'}</div>
        <div class="bazi-enc-tags">
          ${tags.map((t) => `<span class="bazi-enc-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        <h2 class="bazi-enc-title">${escapeHtml(entry.title)}</h2>
        <p class="bazi-enc-oneliner">${escapeHtml(dossier.whatIs)}</p>
        ${
          presenceBrief
            ? `<p class="bazi-enc-presence-brief">${escapeHtml(presenceBrief)}</p>`
            : ''
        }
        ${section('季节与旺衰', `<p>${escapeHtml(dossier.season)}</p>`)}
        ${section('喜', bullets(dossier.likes))}
        ${section('忌', bullets(dossier.dislikes))}
        ${section('一句话记忆', `<p class="bazi-enc-memory-line">${escapeHtml(dossier.memory)}</p>`)}
        ${opts.memoryExtraHtml ?? ''}
        ${meetHtml}
        ${lit ? '' : lockedBanner}
      </div>`,
    express: bodyOrTeaser(`
      ${
        dossier.dayunAs
          ? section(
              dossier.dayunAs.rich ? '作大运时' : '作大运时 · 速览（详解待补）',
              `<p class="bazi-enc-dayun-theme"><strong>${escapeHtml(dossier.dayunAs.theme)}</strong></p>
               <p>${escapeHtml(dossier.dayunAs.weather)}</p>
               <ul class="bazi-enc-list">
                 <li><strong>宜推进</strong> · ${escapeHtml(dossier.dayunAs.leanIn)}</li>
                 <li><strong>留意</strong> · ${escapeHtml(dossier.dayunAs.watch)}</li>
                 <li><strong>怎么用</strong> · ${escapeHtml(dossier.dayunAs.playbook)}</li>
               </ul>
               <p class="bazi-enc-memory-line">${escapeHtml(dossier.dayunAs.memory)}</p>`,
            )
          : ''
      }
      ${section('性格表现', `<p>${escapeHtml(dossier.personality)}</p>`)}
      ${section('优势', `<p>${escapeHtml(dossier.strength)}</p>`)}
      ${section('短板与失衡', `<p>${escapeHtml(dossier.imbalance)}</p>`)}
      ${section('正面状态与失衡状态', `<p>${escapeHtml(dossier.positive)}</p>`)}
      ${section('感情表现', `<p>${escapeHtml(dossier.love)}</p>`)}
      ${section('工作与财富', `<p>${escapeHtml(dossier.career)}</p><p>${escapeHtml(dossier.wealth)}</p>`)}
      ${section('身体对应', `<p>${escapeHtml(dossier.body)}</p>`)}
      ${section('四柱意义', `<ul class="bazi-enc-list">
        <li>${escapeHtml(dossier.pillarMeaning.year)}</li>
        <li>${escapeHtml(dossier.pillarMeaning.month)}</li>
        <li>${escapeHtml(dossier.pillarMeaning.day)}</li>
        <li>${escapeHtml(dossier.pillarMeaning.hour)}</li>
      </ul>`)}
      ${section('结构图解', renderStructureMapHtml(id))}
    `),
    relation: bodyOrTeaser(`
      ${shengKe}
      ${fragment}
      ${section('常见组合', comboHtml)}
    `),
    chart: renderChartPane(
      opts.chartLink ?? buildChartLinkReport(id, null, null, dossier),
      lit,
    ),
    schools: bodyOrTeaser(renderSchoolDiffPane(dossier)),
  };

  const tabPanes = codexDetailPanesFor(entry.kind);

  return `
    <div class="bazi-codex-sheet bazi-enc-sheet" role="dialog" aria-modal="true">
      <div class="bazi-codex-panel bazi-enc-panel" data-enc-root data-enc-id="${escapeHtml(id)}">
        <div class="bazi-enc-toolbar">
          <div class="bazi-enc-marks" role="group" aria-label="收藏标记">
            <button type="button" class="bazi-enc-mark${markFire ? ' is-on' : ''}" data-codex-mark="fire" aria-pressed="${markFire}">
              ${escapeHtml(baziCodexMarkButtonLabel('fire', markFire))}
            </button>
            <button type="button" class="bazi-enc-mark${markUseful ? ' is-on' : ''}" data-codex-mark="useful" aria-pressed="${markUseful}">
              ${escapeHtml(baziCodexMarkButtonLabel('useful', markUseful))}
            </button>
          </div>
          <button type="button" class="bazi-codex-close" data-codex-close aria-label="关闭">
            <span aria-hidden="true">✕</span> 关闭
          </button>
        </div>
        <div class="bazi-enc-tab-bar" role="tablist">
          ${tabPanes
            .map(
              (p, i) =>
                `<button type="button" class="bazi-enc-tab${i === 0 ? ' is-active' : ''}" role="tab" data-enc-tab="${p}" aria-selected="${i === 0}">${CODEX_DETAIL_LABELS[p]}</button>`,
            )
            .join('')}
        </div>
        <div class="bazi-enc-panels" data-enc-panels>
          ${tabPanes
            .map(
              (p, i) =>
                `<section class="bazi-enc-pane" data-enc-pane="${p}" role="tabpanel" ${i === 0 ? '' : 'hidden'}>
                ${panes[p] ?? ''}
              </section>`,
            )
            .join('')}
        </div>
        ${
          insightTip
            ? `<aside class="bazi-enc-insight-tip" role="note">
                <p>${escapeHtml(insightTip.text)}</p>
              </aside>`
            : ''
        }
      </div>
    </div>`;
}

/** 纯 Tab：点切换，一次只显示一屏；收藏标记可切换 */
export function bindBaziCodexDetail(root: HTMLElement): void {
  const panel = root.querySelector<HTMLElement>('[data-enc-root]');
  if (!panel) return;
  const id = panel.dataset.encId ?? '';
  const tabs = [...panel.querySelectorAll<HTMLButtonElement>('[data-enc-tab]')];
  const panes = [...panel.querySelectorAll<HTMLElement>('[data-enc-pane]')];

  const activate = (paneId: CodexDetailPane) => {
    for (const tab of tabs) {
      const on = tab.dataset.encTab === paneId;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    }
    for (const pane of panes) {
      pane.hidden = pane.dataset.encPane !== paneId;
    }
  };

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      activate(tab.dataset.encTab as CodexDetailPane);
    });
  }

  panel.querySelectorAll<HTMLButtonElement>('[data-codex-mark]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mark = btn.dataset.codexMark as BaziCodexMark;
      if (!id || (mark !== 'fire' && mark !== 'useful')) return;
          const on = toggleBaziCodexMark(id, mark);
          btn.classList.toggle('is-on', on);
          btn.setAttribute('aria-pressed', on ? 'true' : 'false');
          btn.textContent = baziCodexMarkButtonLabel(mark, on);
          root.dispatchEvent(
            new CustomEvent('bazi-codex-marks-changed', { bubbles: true }),
          );
    });
  });
}
