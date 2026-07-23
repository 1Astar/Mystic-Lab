import type { CardDefinition } from '../tarot/deck.ts';
import { formatCardNameZh } from '../tarot/card-names.ts';
import { cardFaceImageHtml } from '../tarot/card-images.ts';
import {
  getVisualHotspots,
  getVisualOverview,
  resolveCardKnowledge,
} from '../knowledge/registry.ts';
import type { CodexEntry } from '../codex/collection.ts';
import { getCardRoleHint } from '../codex/card-role.ts';
import { formatCodexDate, getFirstEncounter } from '../codex/journey-insights.ts';
import { loadJournalEntries } from '../journal/records.ts';
import {
  encounterGuidanceLabel,
  encounterPositionKind,
  encounterReflectPrompt,
  resolveEncounterGuidance,
} from '../knowledge/encounter-guidance.ts';
import { formatMisreadingFriendly } from '../knowledge/misreading-copy.ts';
import {
  renderAlertMisreadHtml,
  renderDailyPracticeHtml,
  renderLifeScenesHtml,
  renderOrientationBriefHtml,
} from './codex-scene-cards.ts';

type CodexDetailTab = 'basic' | 'scene' | 'visual' | 'encounter';

const TAB_LABELS: Record<CodexDetailTab, string> = {
  basic: '基础牌义',
  scene: '现实映射',
  visual: '看懂牌面',
  encounter: '我的相遇',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatAnswerTendency(summary: string, cardName: string): string {
  const trimmed = summary.trim();
  if (!trimmed || trimmed === cardName) {
    return '（完成占问后，整体答案倾向会记录在这里）';
  }
  return trimmed;
}

export type CodexDetailCallbacks = {
  onClose: () => void;
  onSaveNote: (note: string) => void;
  onToggleFavorite: () => void;
  onOpenEncounter?: (encounterAt: string) => void;
};

export function mountCodexDetail(
  container: HTMLElement,
  card: CardDefinition,
  entry: CodexEntry,
  callbacks: CodexDetailCallbacks,
): void {
  const knowledge = resolveCardKnowledge(card);
  const role = getCardRoleHint(card);
  const visual = getVisualHotspots(card.id);
  const overview = getVisualOverview(card.id) ?? knowledge.oneSentence;
  const nameCn = formatCardNameZh(card);

  const hotspots = visual?.hotspots ?? [];
  const hotspotMarkers = hotspots
    .map(
      (h, i) => `
      <button type="button" class="hotspot-marker${i === 0 ? ' is-hint' : ''}" style="left:${h.x}%;top:${h.y}%;" data-meaning="${escapeHtml(h.meaning)}" data-label="${escapeHtml(h.label)}" aria-label="${escapeHtml(h.label)}">
        <span class="hotspot-dot"></span>
        <span class="hotspot-label">${escapeHtml(h.label)}</span>
      </button>`,
    )
    .join('');

  const hotspotStageHtml = hotspots.length
    ? `
        <div class="codex-section">
          <h3>牌面热点 · 点图学习</h3>
          <p class="codex-muted">点牌面光点，看元素在说什么。</p>
          <div class="visual-card-stage codex-visual-stage">
            <div class="visual-card-face" style="--card-color:${card.color}">
              ${cardFaceImageHtml(card.id, `${nameCn} · ${knowledge.nameEn}`, 'card-face-img card-face-img-visual')}
              <div class="hotspot-layer">${hotspotMarkers}</div>
            </div>
          </div>
          <p class="hotspot-detail" id="hotspot-detail-codex-${escapeHtml(card.id)}">点选牌面光点查看含义</p>
        </div>`
    : `
        <div class="codex-section">
          <h3>牌面热点</h3>
          <p class="codex-muted">这张牌的牌面热点还在整理中</p>
        </div>`;

  const firstMeet = getFirstEncounter(entry);
  const firstSummary =
    firstMeet && firstMeet.summary.trim() && firstMeet.summary !== nameCn
      ? firstMeet.summary
      : '（当时尚未记录完整解读，可在手札中回看）';

  const latest = entry.encounters[0];
  const latestSnap = latest?.journalId
    ? loadJournalEntries().find((j) => j.id === latest.journalId)?.readingSnapshot
    : undefined;
  const latestGuidance = latest
    ? resolveEncounterGuidance(latest, card.id, nameCn, latestSnap)
    : '';
  const latestKind = encounterPositionKind(latest?.spreadLabel);
  const latestTendency = latestGuidance
    ? latestGuidance
    : latest
      ? formatAnswerTendency(latest.summary, nameCn)
      : '（暂无记录）';

  const historyHtml = entry.encounters.length
    ? entry.encounters
        .map((e, i) => {
          const snap = e.journalId
            ? loadJournalEntries().find((j) => j.id === e.journalId)?.readingSnapshot
            : undefined;
          const kind = encounterPositionKind(e.spreadLabel);
          const guidance = resolveEncounterGuidance(e, card.id, nameCn, snap);
          const label = encounterGuidanceLabel(kind);
          const prompt = encounterReflectPrompt(kind);
          return `
        <button type="button" class="codex-encounter codex-encounter-clickable" data-enc-idx="${i}">
          <time>${new Date(e.at).toLocaleString('zh-CN')}</time>
          <p>${e.question ? `问：${escapeHtml(e.question)}` : '（未记录问题）'}</p>
          <p>${escapeHtml(e.spreadLabel || '占问')} · ${e.reversed ? '逆位' : '正位'}</p>
          ${
            guidance
              ? `<div class="codex-encounter-guidance">
                  <p class="codex-encounter-guidance-label">${escapeHtml(label)}</p>
                  <p class="codex-encounter-guidance-body">${escapeHtml(guidance)}</p>
                </div>`
              : e.summary && e.summary !== nameCn
                ? `<p class="codex-encounter-tendency">答案倾向：${escapeHtml(e.summary)}</p>`
                : ''
          }
          <p class="codex-encounter-reflect">${escapeHtml(prompt)}</p>
          <span class="codex-encounter-open">复原当时结果 →</span>
        </button>`;
        })
        .join('')
    : '<p class="codex-muted">暂无历史占问记录</p>';

  const extraMisreads = (knowledge.misreadings ?? [])
    .slice(1)
    .map((m) => `<li>${escapeHtml(formatMisreadingFriendly(nameCn, m))}</li>`)
    .join('');

  let activeTab: CodexDetailTab = 'basic';

  function renderTabs(): void {
    container.querySelectorAll<HTMLButtonElement>('.codex-detail-tab').forEach((btn) => {
      const tab = btn.dataset.tab as CodexDetailTab;
      btn.classList.toggle('is-active', tab === activeTab);
      btn.setAttribute('aria-selected', tab === activeTab ? 'true' : 'false');
    });
    container.querySelectorAll<HTMLElement>('.codex-detail-panel').forEach((panel) => {
      panel.hidden = panel.dataset.panel !== activeTab;
    });
  }

  container.className = 'codex-detail codex-detail-unlocked';
  container.innerHTML = `
    <button type="button" class="codex-detail-close" aria-label="关闭">✕</button>
    <section class="codex-first-meet">
      <h3 class="codex-first-meet-label">第一次相遇</h3>
      <time class="codex-first-meet-date">${formatCodexDate(firstMeet?.at ?? entry.firstSeenAt)}</time>
      <p class="codex-first-meet-q">${firstMeet?.question ? `你问：${escapeHtml(firstMeet.question)}` : '（未记录问题）'}</p>
      <div class="codex-first-meet-ai">
        <span class="codex-first-meet-ai-label">AI 解读</span>
        <p>${escapeHtml(firstSummary)}</p>
      </div>
      ${entry.count > 1 ? `<p class="codex-first-meet-more">此后又与这张牌相遇 <strong>${entry.count - 1}</strong> 次</p>` : ''}
    </section>
    <div class="codex-detail-hero">
      <div class="codex-detail-face">
        ${cardFaceImageHtml(card.id, `${nameCn} · ${knowledge.nameEn}`, 'codex-face-img')}
      </div>
      <div class="codex-detail-head" style="--card-color:${card.color}">
        <h2>${escapeHtml(nameCn)}</h2>
        <p>${escapeHtml(knowledge.nameEn)} · ${card.arcana === 'major' ? '大阿尔克那' : '小阿尔克那'}</p>
        <p class="codex-detail-role">${escapeHtml(role.formula)}</p>
      </div>
    </div>
    <div class="codex-detail-tab-bar" role="tablist">
      ${(Object.keys(TAB_LABELS) as CodexDetailTab[])
        .map(
          (id) =>
            `<button type="button" class="codex-detail-tab${id === 'basic' ? ' is-active' : ''}" role="tab" data-tab="${id}" aria-selected="${id === 'basic'}">${TAB_LABELS[id]}</button>`,
        )
        .join('')}
    </div>
    <div class="codex-detail-panels">
      <section class="codex-detail-panel" data-panel="basic" role="tabpanel">
        <div class="codex-section codex-learn-layout">
          <div class="codex-kw-tags">${knowledge.keywords
            .slice(0, 8)
            .map((k) => `<span class="codex-kw-tag">${escapeHtml(k)}</span>`)
            .join('')}</div>
          <h3 style="margin-top:14px">一句话理解</h3>
          <p class="codex-one-liner">${escapeHtml(knowledge.oneSentence)}</p>
          ${renderAlertMisreadHtml(knowledge)}
          ${
            extraMisreads
              ? `<details class="reading-accordion codex-learn-fold" style="margin-top:10px">
                  <summary class="reading-accordion-summary">
                    <span class="reading-accordion-title">更多易读错的点</span>
                    <span class="reading-accordion-chevron" aria-hidden="true"></span>
                  </summary>
                  <div class="reading-accordion-body"><ul class="codex-misread-list">${extraMisreads}</ul></div>
                </details>`
              : ''
          }
          ${renderOrientationBriefHtml(knowledge)}
        </div>
      </section>
      <section class="codex-detail-panel" data-panel="scene" role="tabpanel" hidden>
        <div class="codex-section">
          <h3>📍 生活中的现实映射</h3>
          <p class="codex-muted">按具体生活情境代入，而不是笼统的感情/事业/财富模块。</p>
          ${renderLifeScenesHtml(knowledge)}
        </div>
        <div class="codex-section">
          <h3>🧠 日常小练习</h3>
          ${renderDailyPracticeHtml(knowledge)}
        </div>
      </section>
      <section class="codex-detail-panel" data-panel="visual" role="tabpanel" hidden>
        <div class="codex-section">
          <h3>整牌总览</h3>
          <p class="codex-body-text">${escapeHtml(overview)}</p>
        </div>
        ${hotspotStageHtml}
      </section>
      <section class="codex-detail-panel" data-panel="encounter" role="tabpanel" hidden>
        <div class="codex-encounter-summary">
          <p><span class="codex-encounter-label">抽到次数</span><strong>${entry.count}</strong> 次</p>
          <p><span class="codex-encounter-label">最近一次问题</span>${latest?.question ? escapeHtml(latest.question) : '（未记录）'}</p>
          <p><span class="codex-encounter-label">${escapeHtml(encounterGuidanceLabel(latestKind))}</span>${escapeHtml(latestTendency)}</p>
        </div>
        ${
          latest
            ? `<p class="codex-encounter-reflect-lead">${escapeHtml(encounterReflectPrompt(latestKind))}</p>`
            : ''
        }
        <div class="codex-section">
          <h3>历史占问记录</h3>
          ${historyHtml}
        </div>
        <div class="codex-section codex-note-section">
          <h3>我的感想</h3>
          <p class="codex-note-hint">写给未来的自己：这张牌当时触动了你什么？</p>
          <div class="codex-note-field">
            <textarea class="codex-note-input" rows="4" placeholder="例如：当时觉得被卡住了，但后来发现……">${escapeHtml(entry.personalNote)}</textarea>
          </div>
          <div class="codex-note-actions">
            <button type="button" class="btn btn-secondary btn-sm codex-save-note">保存感想</button>
            <button type="button" class="btn btn-ghost btn-sm codex-fav-btn">${entry.favorite ? '★ 已收藏' : '☆ 收藏此牌'}</button>
          </div>
        </div>
      </section>
    </div>
  `;

  container.querySelectorAll<HTMLButtonElement>('.codex-detail-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab as CodexDetailTab;
      renderTabs();
    });
  });

  container.querySelector('.codex-detail-close')?.addEventListener('click', callbacks.onClose);
  container.querySelector('.codex-save-note')?.addEventListener('click', () => {
    const ta = container.querySelector<HTMLTextAreaElement>('.codex-note-input');
    if (ta) callbacks.onSaveNote(ta.value);
  });
  container.querySelector('.codex-fav-btn')?.addEventListener('click', callbacks.onToggleFavorite);

  const hotspotDetail = container.querySelector(
    `#hotspot-detail-codex-${card.id}`,
  ) as HTMLElement | null;
  container.querySelectorAll<HTMLButtonElement>('.hotspot-marker').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.hotspot-marker').forEach((m) => m.classList.remove('is-active', 'is-hint'));
      btn.classList.add('is-active');
      if (hotspotDetail) {
        const label = btn.dataset.label ?? '';
        const meaning = btn.dataset.meaning ?? '';
        hotspotDetail.innerHTML = label
          ? `<strong>${escapeHtml(label)}</strong>：${escapeHtml(meaning)}`
          : escapeHtml(meaning);
      }
    });
  });
  const firstHotspot = container.querySelector<HTMLButtonElement>('.hotspot-marker');
  if (firstHotspot && hotspotDetail) {
    firstHotspot.classList.add('is-active');
    const label = firstHotspot.dataset.label ?? '';
    const meaning = firstHotspot.dataset.meaning ?? '';
    hotspotDetail.innerHTML = label
      ? `<strong>${escapeHtml(label)}</strong>：${escapeHtml(meaning)}`
      : escapeHtml(meaning);
  }

  container.querySelectorAll<HTMLButtonElement>('.codex-encounter-clickable').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.encIdx ?? -1);
      const enc = entry.encounters[idx];
      if (enc) callbacks.onOpenEncounter?.(enc.at);
    });
  });

  renderTabs();
}
