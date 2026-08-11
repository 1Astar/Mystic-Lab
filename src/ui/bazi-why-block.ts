/**
 * 【为什么这么解？】展开块 + 收入知识库
 */
import type { LearnWhyItem } from '../bazi/learn-why.ts';
import {
  collectKnowledge,
  hasKnowledge,
  learnStatusLine,
  loadBaziLearn,
  markWhyExpanded,
  resolveBaziLearnTitle,
} from '../bazi/learn-store.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function whyBlockHtml(item: LearnWhyItem): string {
  const collected = hasKnowledge(item.id);
  return `
    <div class="bazi-why" data-why-id="${escapeHtml(item.id)}">
      <button type="button" class="bazi-why-toggle" data-why-toggle aria-expanded="false">
        为什么这么解？
      </button>
      <div class="bazi-why-panel" data-why-panel hidden>
        <p class="bazi-why-title">${escapeHtml(item.title)}</p>
        <p class="bazi-why-body">${escapeHtml(item.body)}</p>
        <div class="bazi-why-actions">
          <button type="button" class="bazi-why-collect${collected ? ' is-done' : ''}" data-why-collect ${collected ? 'disabled' : ''}>
            ${collected ? '已收入知识库' : '收入知识库'}
          </button>
          <span class="bazi-why-toast" data-why-toast hidden></span>
        </div>
      </div>
    </div>`;
}

export function learnBadgeHtml(): string {
  const line = learnStatusLine();
  const title = resolveBaziLearnTitle();
  return `<p class="bazi-learn-badge"><button type="button" class="bazi-learn-badge-btn" data-path="/bazi/learn" title="${escapeHtml(title.blurb)}">${escapeHtml(line)} · 知识树 ›</button></p>`;
}

export function mountWhyBlocks(root: HTMLElement): () => void {
  const cleanups: Array<() => void> = [];

  const refreshBadge = (): void => {
    root.querySelectorAll<HTMLElement>('[data-learn-badge], .bazi-learn-badge-btn').forEach((el) => {
      const title = resolveBaziLearnTitle(loadBaziLearn());
      const line = `${learnStatusLine()} · 知识树 ›`;
      el.textContent = line;
      el.title = title.blurb;
    });
  };

  root.querySelectorAll<HTMLElement>('[data-why-id]').forEach((host) => {
    const id = host.dataset.whyId || '';
    const toggle = host.querySelector<HTMLButtonElement>('[data-why-toggle]');
    const panel = host.querySelector<HTMLElement>('[data-why-panel]');
    const collectBtn = host.querySelector<HTMLButtonElement>('[data-why-collect]');
    const toast = host.querySelector<HTMLElement>('[data-why-toast]');
    if (!toggle || !panel) return;

    const onToggle = (): void => {
      const open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && id) {
        markWhyExpanded(id);
        refreshBadge();
      }
    };

    const onCollect = (): void => {
      if (!id || !collectBtn) return;
      const res = collectKnowledge(id);
      collectBtn.disabled = true;
      collectBtn.classList.add('is-done');
      collectBtn.textContent = '已收入知识库';
      if (toast) {
        toast.hidden = false;
        toast.textContent = res.already
          ? '已经收集过了'
          : `已收集 · ${res.title.label}${res.gained ? ` · +${res.gained} XP` : ''}`;
      }
      refreshBadge();
    };

    toggle.addEventListener('click', onToggle);
    collectBtn?.addEventListener('click', onCollect);
    cleanups.push(() => {
      toggle.removeEventListener('click', onToggle);
      collectBtn?.removeEventListener('click', onCollect);
    });
  });

  return () => cleanups.forEach((fn) => fn());
}
