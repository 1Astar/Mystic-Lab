import { grantBonusCredits } from '../ai/ai-mode.ts';
import { claimShareReward, fetchShareSnapshot, shareDeepUrl } from '../share/api.ts';
import { buildShareCoverElement, makeShareQrDataUrl } from '../share/cover.ts';
import { getOrCreateDeviceId, getOrCreateOwnerId } from '../share/ids.ts';
import { syncShareOwnerRewards } from '../share/sheet.ts';
import type { ShareSnapshot } from '../share/types.ts';
import { SHARE_VIEW_MS } from '../share/types.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function systemHome(system: string): string {
  switch (system) {
    case 'liuyao':
      return '/liuyao';
    case 'tarot':
      return '/tarot';
    case 'xiaoliuren':
      return '/xiaoliuren';
    case 'bazi':
      return '/bazi';
    case 'life':
      return '/life';
    case 'meihua':
      return '/meihua';
    default:
      return '/';
  }
}

export async function renderShareView(root: HTMLElement, id: string): Promise<() => void> {
  void syncShareOwnerRewards();
  root.innerHTML = `
    <div class="ms-view page">
      <p class="ms-view-loading">载入分享…</p>
    </div>
  `;

  let snap: ShareSnapshot | null = null;
  try {
    snap = await fetchShareSnapshot(id);
  } catch {
    root.innerHTML = `
      <div class="ms-view page">
        <h1>暂时打不开</h1>
        <p>网络或服务异常，稍后再试。</p>
        <a class="btn" href="/">回首页</a>
      </div>`;
    return () => undefined;
  }

  if (!snap) {
    root.innerHTML = `
      <div class="ms-view page">
        <h1>分享不存在或已过期</h1>
        <a class="btn" href="/">回首页</a>
      </div>`;
    return () => undefined;
  }

  const openedAt = Date.now();
  const deep = shareDeepUrl(id);
  let qrDataUrl: string | undefined;
  try {
    qrDataUrl = await makeShareQrDataUrl(deep);
  } catch {
    qrDataUrl = undefined;
  }
  const cover = buildShareCoverElement({ ...snap, deepUrl: deep, qrDataUrl }, 'front');
  cover.classList.add('ms-view-cover');

  const sections = snap.sections
    .map(
      (s) => `
      <section class="ms-view-sec">
        <h2>${escapeHtml(s.heading)}</h2>
        <div class="ms-view-body">${escapeHtml(s.body).replace(/\n/g, '<br/>')}</div>
      </section>`,
    )
    .join('');

  const aiBlock =
    snap.includeAi && snap.aiText
      ? `<section class="ms-view-sec ms-view-ai">
          <h2>深度解读</h2>
          <div class="ms-view-body">${escapeHtml(snap.aiText).replace(/\n/g, '<br/>')}</div>
        </section>`
      : '';

  root.innerHTML = `
    <div class="ms-view page">
      <header class="ms-view-top">
        <a class="ms-view-home" href="/">随心而行</a>
        <button type="button" class="ms-view-copy" data-copy>复制链接</button>
      </header>
      <section class="ms-view-invite-hero">
        <p class="ms-view-invite-moon" aria-hidden="true">🌙</p>
        <h1 class="ms-view-invite-title">你的朋友邀请你看看你的近期状态</h1>
        <p class="ms-view-invite-sub">打开这份解读，你将获得 1 次免费体验机会</p>
      </section>
      <div data-cover></div>
      <div class="ms-view-main">
        ${
          snap.questionDisplay
            ? `<p class="ms-view-q">${escapeHtml(snap.questionDisplay)}</p>`
            : ''
        }
        ${sections}
        ${aiBlock}
      </div>
      <footer class="ms-view-bar">
        <p class="ms-view-reward" data-reward>再看一会儿，即可领取 1 次体验</p>
        <a class="btn ms-view-cta" href="${systemHome(snap.system)}">我也来一卦</a>
      </footer>
    </div>
  `;
  root.querySelector('[data-cover]')?.appendChild(cover);

  const rewardEl = root.querySelector('[data-reward]') as HTMLElement;
  root.querySelector('[data-copy]')?.addEventListener('click', () => {
    void navigator.clipboard.writeText(shareDeepUrl(id));
    rewardEl.textContent = '链接已复制';
  });

  let claimed = false;
  const tryClaim = () => {
    if (claimed) return;
    const viewedMs = Date.now() - openedAt;
    if (viewedMs < SHARE_VIEW_MS) {
      rewardEl.textContent = `再看 ${Math.ceil((SHARE_VIEW_MS - viewedMs) / 1000)} 秒即可领取`;
      return;
    }
    claimed = true;
    rewardEl.textContent = '领取中…';
    void claimShareReward({
      id,
      deviceId: getOrCreateDeviceId(),
      ownerId: getOrCreateOwnerId(),
      viewedMs,
    }).then((r) => {
      if (r.grantViewer) {
        grantBonusCredits(1);
        rewardEl.textContent =
          r.reason === 'owner_day_cap'
            ? '已获得 1 次体验（邀请方今日奖励已满）'
            : '已获得 1 次体验机会';
      } else if (r.reason === 'self') {
        rewardEl.textContent = '这是你发出的邀请，体验次数不加在这里';
      } else if (r.reason === 'already') {
        rewardEl.textContent = '这份邀请你已经领取过了';
      } else if (r.reason === 'too_fast') {
        claimed = false;
        rewardEl.textContent = '再稍等一下再领';
      } else {
        rewardEl.textContent = '这次没有加上次数，解读仍可继续看';
      }
    });
  };

  const timers = [
    window.setInterval(tryClaim, 1000),
    window.setTimeout(tryClaim, SHARE_VIEW_MS + 50),
  ];
  const onVis = () => {
    if (document.visibilityState === 'visible') tryClaim();
  };
  document.addEventListener('visibilitychange', onVis);

  return () => {
    timers.forEach((t) => clearInterval(t));
    document.removeEventListener('visibilitychange', onVis);
  };
}
