import { navigate } from '../router.ts';
import { buildVaultSnapshot, meetLineFor } from '../liuyao/vault.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { liuyaoPageBgStyle } from '../ui/liuyao-hero.ts';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

/** 成长档案：相遇排行 + 起卦时间线 */
export function renderLiuyaoGrowth(root: HTMLElement): () => void {
  const snap = buildVaultSnapshot();
  const page = document.createElement('div');
  page.className = 'page ly-growth-page';
  page.setAttribute('style', liuyaoPageBgStyle('learn'));
  mountEnvBanner(page);

  const rank = snap.meets
    .slice(0, 12)
    .map(
      (m) => `
      <li class="ly-growth-rank-item">
        <span class="ly-growth-rank-name">${m.fullName}</span>
        <span class="ly-growth-rank-count">×${m.count}</span>
        <span class="ly-growth-rank-meta">${meetLineFor(m)}</span>
      </li>`,
    )
    .join('');

  const timeline = snap.recent
    .map((e) => {
      const at = e.castAt || e.createdAt;
      return `
      <li class="ly-growth-tl-item">
        <p class="ly-growth-tl-meta">${formatDate(at)} · ${e.primaryFullName}</p>
        <p class="ly-growth-tl-q">${e.question || '（未写问题）'}</p>
      </li>`;
    })
    .join('');

  page.innerHTML = `
    <div class="ly-topbar">
      <button type="button" class="back-link" data-back>← 我的卦库</button>
    </div>
    <header class="ly-vault-head">
      <h1 class="page-title">成长档案</h1>
      <p class="ly-vault-lead">主题复现与时间线——半年后再遇同一卦时，会更有沉浸感。</p>
    </header>
    <section class="ly-growth-sec">
      <h2 class="ly-growth-sec-title">相遇排行</h2>
      ${
        rank
          ? `<ol class="ly-growth-rank">${rank}</ol>`
          : `<p class="ly-guide-tip">还没有起卦记录。去起一卦，图鉴会开始点亮。</p>`
      }
    </section>
    <section class="ly-growth-sec">
      <h2 class="ly-growth-sec-title">最近时间线</h2>
      ${
        timeline
          ? `<ol class="ly-growth-tl">${timeline}</ol>`
          : `<p class="ly-guide-tip">保存到「我的卦象」后，这里会出现轨迹。</p>`
      }
    </section>
    <p class="ly-vault-foot-link">
      <button type="button" class="ly-home-secondary" data-path="/liuyao/journal">打开我的卦象 ›</button>
    </p>
  `;

  page.querySelector('[data-back]')?.addEventListener('click', () => navigate('/liuyao/vault'));
  page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
    el.addEventListener('click', () => navigate(el.dataset.path!));
  });

  root.appendChild(page);
  return () => {};
}
