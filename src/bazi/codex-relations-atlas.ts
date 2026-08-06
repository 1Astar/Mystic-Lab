import {
  LIU_CHONG,
  LIU_HAI,
  LIU_HE,
  SAN_HE,
  SAN_XING,
  TIAN_GAN_HE,
  ZI_XING,
  relationsForBranch,
  relationsForStem,
  type BranchRelationHit,
} from './relations.ts';
import { SHENG_OF, KE_OF, SHENG_ME, KE_ME } from './codex-wuxing-map.ts';
import { WUXING_ORDER } from './codex-lore.ts';
import type { WuXing } from './elements.ts';
import { STEM_LORE, BRANCH_LORE } from './codex-lore.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pairRow(
  left: string,
  right: string,
  kind: string,
  note: string,
  leftAttr: string,
  rightAttr: string,
): string {
  return `
    <div class="bazi-rel-pair is-${escapeHtml(kind)}">
      <button type="button" class="bazi-rel-node" data-open-entry="${escapeHtml(leftAttr)}">${escapeHtml(left)}</button>
      <span class="bazi-rel-edge" aria-hidden="true">${escapeHtml(kind)}</span>
      <button type="button" class="bazi-rel-node" data-open-entry="${escapeHtml(rightAttr)}">${escapeHtml(right)}</button>
      <em class="bazi-rel-note">${escapeHtml(note)}</em>
    </div>`;
}

function multiRow(members: string[], kind: string, note: string): string {
  const nodes = members
    .map(
      (m) =>
        `<button type="button" class="bazi-rel-node" data-open-entry="${escapeHtml(m)}">${escapeHtml(m)}</button>`,
    )
    .join('<span class="bazi-rel-edge-dot">·</span>');
  return `
    <div class="bazi-rel-pair is-${escapeHtml(kind)} is-multi">
      <div class="bazi-rel-multi">${nodes}</div>
      <span class="bazi-rel-edge">${escapeHtml(kind)}</span>
      <em class="bazi-rel-note">${escapeHtml(note)}</em>
    </div>`;
}

/** 首页「生克图」Tab（含相生相克与合冲刑害） */
export function renderRelationsAtlasHtml(): string {
  const shengRows = WUXING_ORDER.map(
    (wx) =>
      pairRow(wx, SHENG_OF[wx], '生', `${wx}生${SHENG_OF[wx]}`, wx, SHENG_OF[wx]),
  ).join('');
  const keRows = WUXING_ORDER.map(
    (wx) => pairRow(wx, KE_OF[wx], '克', `${wx}克${KE_OF[wx]}`, wx, KE_OF[wx]),
  ).join('');
  const chongRows = LIU_CHONG.map(([a, b]) =>
    pairRow(a, b, '冲', `${a}${b}相冲 · 对撞变动`, a, b),
  ).join('');
  const heRows = LIU_HE.map(([a, b, el]) =>
    pairRow(a, b, '合', `${a}${b}合化${el} · 牵绊成局`, a, b),
  ).join('');
  const ganHeRows = TIAN_GAN_HE.map(([a, b, el]) =>
    pairRow(a, b, '合', `${a}${b}合化${el}`, a, b),
  ).join('');
  const haiRows = LIU_HAI.map(([a, b]) =>
    pairRow(a, b, '害', `${a}${b}相害 · 隐性摩擦`, a, b),
  ).join('');
  const xingRows = [
    ...SAN_XING.map((g) => multiRow(g, '刑', `${g.join('')}相刑 · 别扭内耗`)),
    multiRow(['子', '卯'], '刑', '子卯相刑 · 无礼之刑'),
    ...[...ZI_XING].map((z) => multiRow([z, z], '刑', `${z}${z}自刑 · 自我拉扯`)),
  ].join('');
  const sanHeRows = SAN_HE.map((g) =>
    multiRow(g.members, '三合', `${g.members.join('')}三合${g.result}`),
  ).join('');

  return `
    <p class="bazi-codex-hint">生克图 · 相生相克与合冲刑害 · 点节点跳进百科</p>
    <section class="bazi-gz-section bazi-rel-atlas-sec">
      <h2 class="bazi-codex-section-title">五行 · 相生</h2>
      <div class="bazi-rel-pair-list">${shengRows}</div>
    </section>
    <section class="bazi-gz-section bazi-rel-atlas-sec">
      <h2 class="bazi-codex-section-title">五行 · 相克</h2>
      <div class="bazi-rel-pair-list">${keRows}</div>
    </section>
    <section class="bazi-gz-section bazi-rel-atlas-sec">
      <h2 class="bazi-codex-section-title">地支 · 六冲</h2>
      <div class="bazi-rel-pair-list">${chongRows}</div>
    </section>
    <section class="bazi-gz-section bazi-rel-atlas-sec">
      <h2 class="bazi-codex-section-title">地支 · 六合</h2>
      <div class="bazi-rel-pair-list">${heRows}</div>
    </section>
    <section class="bazi-gz-section bazi-rel-atlas-sec">
      <h2 class="bazi-codex-section-title">地支 · 六害</h2>
      <div class="bazi-rel-pair-list">${haiRows}</div>
    </section>
    <section class="bazi-gz-section bazi-rel-atlas-sec">
      <h2 class="bazi-codex-section-title">地支 · 刑</h2>
      <div class="bazi-rel-pair-list">${xingRows}</div>
    </section>
    <section class="bazi-gz-section bazi-rel-atlas-sec">
      <h2 class="bazi-codex-section-title">地支 · 三合</h2>
      <div class="bazi-rel-pair-list">${sanHeRows}</div>
    </section>
    <section class="bazi-gz-section bazi-rel-atlas-sec">
      <h2 class="bazi-codex-section-title">天干 · 五合</h2>
      <div class="bazi-rel-pair-list">${ganHeRows}</div>
    </section>`;
}

function hitChips(hits: BranchRelationHit[] | { kind: string; label: string; peers: string[] }[]): string {
  if (!hits.length) return '';
  return `
    <div class="bazi-rel-hit-list">
      ${hits
        .map((h) => {
          const peers = h.peers
            .map(
              (p) =>
                `<button type="button" class="bazi-enc-rel-chip" data-open-entry="${escapeHtml(p)}">${escapeHtml(p)}</button>`,
            )
            .join('');
          return `
            <div class="bazi-rel-hit is-${escapeHtml(h.kind)}">
              <span class="bazi-rel-hit-kind">${escapeHtml(h.kind)}</span>
              <strong>${escapeHtml(h.label)}</strong>
              <div class="bazi-rel-hit-peers">${peers}</div>
            </div>`;
        })
        .join('')}
    </div>`;
}

/** 详情生克 Tab 下半：与本卡相关的合冲片段 */
export function renderEntryRelationFragmentHtml(id: string): string {
  const stem = STEM_LORE.find((s) => s.id === id);
  if (stem) {
    const hits = relationsForStem(id);
    const wx = stem.wuxing as WuXing;
    return `
      <section class="bazi-rel-fragment">
        <h3 class="bazi-enc-section-title">天干合 · 与「${escapeHtml(stem.title)}」相关</h3>
        ${
          hits.length
            ? hitChips(hits)
            : '<p class="bazi-codex-muted">暂无单独合象条目。</p>'
        }
        <p class="bazi-codex-hint">五行底座：生${escapeHtml(SHENG_OF[wx])} · 克${escapeHtml(KE_OF[wx])} · 被${escapeHtml(SHENG_ME[wx])}生 · 被${escapeHtml(KE_ME[wx])}克</p>
      </section>`;
  }

  const branch = BRANCH_LORE.find((b) => b.id === id);
  if (branch) {
    const hits = relationsForBranch(id);
    return `
      <section class="bazi-rel-fragment">
        <h3 class="bazi-enc-section-title">合冲刑害 · 与「${escapeHtml(branch.title)}」相关</h3>
        ${hitChips(hits)}
      </section>`;
  }

  if ((WUXING_ORDER as string[]).includes(id)) {
    const wx = id as WuXing;
    return `
      <section class="bazi-rel-fragment">
        <h3 class="bazi-enc-section-title">五行对照 · ${escapeHtml(wx)}</h3>
        <div class="bazi-rel-pair-list">
          ${pairRow(wx, SHENG_OF[wx], '生', '它生谁', wx, SHENG_OF[wx])}
          ${pairRow(wx, KE_OF[wx], '克', '它克谁', wx, KE_OF[wx])}
          ${pairRow(SHENG_ME[wx], wx, '生', '谁来帮它', SHENG_ME[wx], wx)}
          ${pairRow(KE_ME[wx], wx, '克', '谁来克它', KE_ME[wx], wx)}
        </div>
      </section>`;
  }

  return '';
}
