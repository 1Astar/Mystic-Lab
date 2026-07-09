import type { CardDefinition } from '../tarot/deck.ts';
import { formatCardNameZh } from '../tarot/card-names.ts';
import { cardFaceImageHtml } from '../tarot/card-images.ts';
import {
  getVisualHotspots,
  getVisualOverview,
  resolveCardKnowledge,
} from '../knowledge/registry.ts';
import type { CodexEntry } from '../codex/collection.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

  container.className = 'codex-detail';
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
    <section class="codex-section">
      <h3>关键词</h3>
      <p class="codex-kw-row"><span class="codex-kw-label">正位</span>${escapeHtml(uprightKw.join('、'))}</p>
      <p class="codex-kw-row"><span class="codex-kw-label">逆位</span>${escapeHtml(reversedKw.join('、'))}</p>
    </section>
    <section class="codex-section">
      <h3>整牌总览</h3>
      <p class="codex-body-text">${escapeHtml(overview)}</p>
    </section>
    <section class="codex-section">
      <h3>在不同问题里</h3>
      <ul class="codex-theme-list">
        <li><strong>感情</strong>：${escapeHtml(knowledge.loveMeaning)}</li>
        <li><strong>工作</strong>：${escapeHtml(knowledge.workMeaning)}</li>
        <li><strong>财富</strong>：${escapeHtml(knowledge.wealthMeaning ?? knowledge.studyMeaning)}</li>
        <li><strong>自我</strong>：${escapeHtml(knowledge.selfMeaning)}</li>
      </ul>
    </section>
    <section class="codex-section">
      <h3>牌面元素</h3>
      <ul class="codex-hotspot-list">${hotspotList}</ul>
    </section>
    <section class="codex-section">
      <h3>容易误读的点</h3>
      <ul class="codex-misread-list">${misreadings}</ul>
    </section>
    <section class="codex-section">
      <h3>相遇记录</h3>
      ${entry.encounters
        .map(
          (e) => `
        <div class="codex-encounter">
          <time>${new Date(e.at).toLocaleString('zh-CN')}</time>
          <p>${e.question ? `问：${escapeHtml(e.question)}` : '（未记录问题）'}</p>
          <p>${escapeHtml(e.spreadLabel)} · ${e.reversed ? '逆位' : '正位'}</p>
        </div>`,
        )
        .join('')}
    </section>
    <section class="codex-section">
      <h3>我的感想</h3>
      <textarea class="codex-note-input" rows="3" placeholder="写下对这张牌的感想…">${escapeHtml(entry.personalNote)}</textarea>
      <button type="button" class="btn btn-secondary codex-save-note">保存感想</button>
    </section>
    <button type="button" class="btn btn-ghost codex-fav-btn">${entry.favorite ? '取消收藏' : '收藏此牌'}</button>
  `;

  container.querySelector('.codex-detail-close')?.addEventListener('click', callbacks.onClose);
  container.querySelector('.codex-save-note')?.addEventListener('click', () => {
    const ta = container.querySelector<HTMLTextAreaElement>('.codex-note-input');
    if (ta) callbacks.onSaveNote(ta.value);
  });
  container.querySelector('.codex-fav-btn')?.addEventListener('click', callbacks.onToggleFavorite);
}
