import type { CardDefinition } from '../tarot/deck.ts';
import { formatCardNameZh } from '../tarot/card-names.ts';
import { cardFaceImageHtml } from '../tarot/card-images.ts';
import {
  getVisualHotspots,
  getVisualOverview,
  resolveCardKnowledge,
} from '../knowledge/registry.ts';
import type { CodexEntry } from '../codex/collection.ts';

type CodexDetailTab = 'basic' | 'scene' | 'visual' | 'encounter';

const TAB_LABELS: Record<CodexDetailTab, string> = {
  basic: '基础牌义',
  scene: '场景解读',
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
};

export function mountCodexDetail(
  container: HTMLElement,
  card: CardDefinition,
  entry: CodexEntry,
  callbacks: CodexDetailCallbacks,
): void {
  const knowledge = resolveCardKnowledge(card);
  const visual = getVisualHotspots(card.id);
  const overview = getVisualOverview(card.id) ?? knowledge.oneSentence;
  const nameCn = formatCardNameZh(card);

  const uprightKw = knowledge.uprightKeywords ?? knowledge.keywords;
  const reversedKw = knowledge.reversedKeywords ?? knowledge.keywords;

  const hotspotList = visual?.hotspots.length
    ? visual.hotspots
        .map((h) => `<li><strong>${escapeHtml(h.label)}</strong>：${escapeHtml(h.meaning)}</li>`)
        .join('')
    : '<li class="codex-muted">这张牌的牌面热点还在整理中</li>';

  const misreadings = knowledge.misreadings?.length
    ? knowledge.misreadings.map((m) => `<li>${escapeHtml(m)}</li>`).join('')
    : '<li class="codex-muted">暂无专项误读说明，请以正逆位语境理解</li>';

  const latest = entry.encounters[0];
  const latestTendency = latest
    ? formatAnswerTendency(latest.summary, nameCn)
    : '（暂无记录）';

  const historyHtml = entry.encounters.length
    ? entry.encounters
        .map(
          (e) => `
        <div class="codex-encounter">
          <time>${new Date(e.at).toLocaleString('zh-CN')}</time>
          <p>${e.question ? `问：${escapeHtml(e.question)}` : '（未记录问题）'}</p>
          <p>${escapeHtml(e.spreadLabel || '占问')} · ${e.reversed ? '逆位' : '正位'}</p>
          ${
            e.summary && e.summary !== nameCn
              ? `<p class="codex-encounter-tendency">答案倾向：${escapeHtml(e.summary)}</p>`
              : ''
          }
        </div>`,
        )
        .join('')
    : '<p class="codex-muted">暂无历史占问记录</p>';

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
    <div class="codex-meet-banner">
      你已经与这张牌相遇 <strong>${entry.count}</strong> 次
    </div>
    <div class="codex-detail-hero">
      <div class="codex-detail-face">
        ${cardFaceImageHtml(card.id, `${nameCn} · ${knowledge.nameEn}`, 'codex-face-img')}
      </div>
      <div class="codex-detail-head" style="--card-color:${card.color}">
        <h2>${escapeHtml(nameCn)}</h2>
        <p>${escapeHtml(knowledge.nameEn)} · ${card.arcana === 'major' ? '大阿尔克那' : '小阿尔克那'}</p>
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
        <div class="codex-section">
          <h3>正位关键词</h3>
          <p class="codex-body-text">${escapeHtml(uprightKw.join('、'))}</p>
        </div>
        <div class="codex-section">
          <h3>逆位关键词</h3>
          <p class="codex-body-text">${escapeHtml(reversedKw.join('、'))}</p>
        </div>
        <div class="codex-section">
          <h3>一句话牌义</h3>
          <p class="codex-body-text">${escapeHtml(knowledge.oneSentence)}</p>
        </div>
        <div class="codex-section">
          <h3>容易误读的点</h3>
          <ul class="codex-misread-list">${misreadings}</ul>
        </div>
      </section>
      <section class="codex-detail-panel" data-panel="scene" role="tabpanel" hidden>
        <ul class="codex-theme-list codex-scene-list">
          <li><strong>感情</strong>：${escapeHtml(knowledge.loveMeaning)}</li>
          <li><strong>工作</strong>：${escapeHtml(knowledge.workMeaning)}</li>
          <li><strong>财富</strong>：${escapeHtml(knowledge.wealthMeaning ?? knowledge.studyMeaning)}</li>
          <li><strong>自我</strong>：${escapeHtml(knowledge.selfMeaning)}</li>
        </ul>
      </section>
      <section class="codex-detail-panel" data-panel="visual" role="tabpanel" hidden>
        <div class="codex-section">
          <h3>整牌总览</h3>
          <p class="codex-body-text">${escapeHtml(overview)}</p>
        </div>
        <div class="codex-section">
          <h3>牌面热点</h3>
          <ul class="codex-hotspot-list">${hotspotList}</ul>
        </div>
      </section>
      <section class="codex-detail-panel" data-panel="encounter" role="tabpanel" hidden>
        <div class="codex-encounter-summary">
          <p><span class="codex-encounter-label">抽到次数</span><strong>${entry.count}</strong> 次</p>
          <p><span class="codex-encounter-label">最近一次问题</span>${latest?.question ? escapeHtml(latest.question) : '（未记录）'}</p>
          <p><span class="codex-encounter-label">最近一次答案倾向</span>${escapeHtml(latestTendency)}</p>
        </div>
        <div class="codex-section">
          <h3>历史占问记录</h3>
          ${historyHtml}
        </div>
        <div class="codex-section">
          <h3>我的感想</h3>
          <textarea class="codex-note-input" rows="3" placeholder="写下对这张牌的感想…">${escapeHtml(entry.personalNote)}</textarea>
          <button type="button" class="btn btn-secondary codex-save-note">保存感想</button>
        </div>
        <button type="button" class="btn btn-ghost codex-fav-btn">${entry.favorite ? '取消收藏' : '收藏此牌'}</button>
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

  renderTabs();
}
