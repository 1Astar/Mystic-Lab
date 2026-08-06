import { grantBonusCredits } from '../ai/ai-mode.ts';
import {
  createShareSnapshot,
  redeemOwnerRewards,
  shareDeepUrl,
} from './api.ts';
import {
  nativeShareCoverImage,
  renderShareCoverPair,
} from './cover.ts';
import { getOrCreateOwnerId } from './ids.ts';
import type { ShareCreateBody, ShareSnapshot, ShareSystem, ShareVisual } from './types.ts';

export type ShareDraft = {
  system: ShareSystem;
  question: string;
  headline: string;
  summary: string;
  sections: { heading: string; body: string }[];
  visual: ShareVisual;
  aiText?: string;
  brandSlogan?: string;
};

export type ShareSheetMode = 'save' | 'share' | 'invite';

export type ShareSheetOptions = {
  mode?: ShareSheetMode;
  autoStart?: boolean;
};

function draftCacheKey(draft: ShareDraft): string {
  return [
    draft.system,
    draft.headline.slice(0, 40),
    draft.summary.slice(0, 80),
  ].join('|');
}

/** 创建或复用本会话深链（sessionStorage 去重） */
export async function ensureShareDeepLink(draft: ShareDraft): Promise<string> {
  void syncShareOwnerRewards();
  const key = `mystic-lab-share-deep:${draftCacheKey(draft)}`;
  try {
    const cached = sessionStorage.getItem(key);
    if (cached && cached.includes('/s/')) return cached;
  } catch {
    /* ignore */
  }
  const snap = await createShareSnapshot({
    ownerId: getOrCreateOwnerId(),
    system: draft.system,
    questionMasked: true,
    questionDisplay: '',
    headline: draft.headline.slice(0, 80),
    summary: draft.summary.slice(0, 400),
    sections: draft.sections.slice(0, 12),
    visual: draft.visual,
    includeAi: false,
    brandSlogan: draft.brandSlogan || '答案不在牌里，在你心里。',
  });
  const url = shareDeepUrl(snap.id);
  try {
    sessionStorage.setItem(key, url);
  } catch {
    /* ignore */
  }
  return url;
}

/**
 * 把地址栏换成 /s/id（replaceState，不触发路由重渲染）。
 * 复制地址栏即等于发可加次数深链；刷新会进分享深页。
 */
export async function syncAddressBarToShare(draft: ShareDraft): Promise<string> {
  const url = await ensureShareDeepLink(draft);
  try {
    const path = new URL(url, location.origin).pathname;
    if (location.pathname !== path) {
      history.replaceState(
        { ...(history.state as object), mysticShareBound: true },
        '',
        path,
      );
    }
  } catch {
    /* ignore */
  }
  return url;
}

/** 结果页一键：创建可加次数深链并复制（不出图） */
export async function copyShareDeepLink(draft: ShareDraft): Promise<string> {
  const url = await syncAddressBarToShare(draft);
  await navigator.clipboard.writeText(url);
  return url;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shareFailMessage(err: unknown): string {
  if (!(err instanceof Error)) return '生成失败，请稍后再试';
  const m = err.message || '';
  if (/分享服务|SHARE_KV|存储未绑定|分享创建|分享内容不完整/.test(m)) return m;
  if (/Failed to fetch|NetworkError|network|Load failed/i.test(m)) {
    return '网络不通，分享图没生成成功，请检查网络后重试';
  }
  if (/SecurityError|Tainted|toDataURL|css rules|Attempting to parse/i.test(m)) {
    return '出图失败（图片或样式受限）。请再试一次；仍失败请刷新页面';
  }
  if (m.length > 100) return '生成失败，请稍后再试';
  return m || '生成失败，请稍后再试';
}

export async function syncShareOwnerRewards(): Promise<number> {
  try {
    const n = await redeemOwnerRewards(getOrCreateOwnerId());
    if (n > 0) grantBonusCredits(n);
    return n;
  } catch {
    return 0;
  }
}

function modeCopy(
  mode: ShareSheetMode,
  system: ShareSystem = 'liuyao',
): {
  kicker: string;
  title: string;
  lead: string;
  primary: string;
} {
  const isTarot = system === 'tarot';
  if (mode === 'invite') {
    return {
      kicker: '✦ 邀请同行',
      title: '生成邀请图',
      lead: '一张好看的邀请卡。扫码进站，不带具体问句。',
      primary: '生成邀请图',
    };
  }
  if (mode === 'save') {
    return {
      kicker: isTarot ? '保存牌阵' : '保存卦象',
      title: '留一张美图',
      lead: '正面美图 / 背面解读。点一下翻转，长按保存。',
      primary: '生成美图',
    };
  }
  return {
    kicker: isTarot ? '分享牌阵' : '分享卦象',
    title: isTarot ? '发一张牌图给朋友' : '发一张图给朋友',
    lead: isTarot
      ? '正面是牌阵美图，点一下看背面完整解读。长按可保存并发出。'
      : '正面是卦象美图，点一下看背面完整解读。长按可保存并发出。',
    primary: '生成分享图',
  };
}

export function openShareSheet(
  draft: ShareDraft,
  options: ShareSheetOptions = {},
): void {
  document.querySelector('.ms-share-modal')?.remove();
  void syncShareOwnerRewards();

  const mode: ShareSheetMode = options.mode || 'invite';
  const copy = modeCopy(mode, draft.system);
  const isLabInvite = mode === 'invite' && draft.system === 'lab';
  /** 默认不显示问题；打开分享页也按此快照，不会再露出问句 */
  let showQuestion = false;
  let includeAi = false;
  const hasAi = Boolean(draft.aiText?.trim());

  const questionDisplayOf = () =>
    showQuestion ? (draft.question || '').slice(0, 200) : '';

  const modal = document.createElement('div');
  modal.className = 'ms-share-modal is-open';
  modal.innerHTML = `
    <button type="button" class="ms-share-backdrop" data-ms-close aria-label="关闭"></button>
    <div class="ms-share-sheet" role="dialog" aria-modal="true" aria-labelledby="ms-share-title">
      <header class="ms-share-head">
        <div>
          <p class="ms-share-kicker">${escapeHtml(copy.kicker)}</p>
          <h2 id="ms-share-title">${escapeHtml(copy.title)}</h2>
        </div>
        <button type="button" class="ms-share-x" data-ms-close aria-label="关闭">×</button>
      </header>
      <p class="ms-share-lead">${escapeHtml(copy.lead)}</p>
      ${
        isLabInvite
          ? ''
          : `<div class="ms-share-row">
        <span>问题</span>
        <button type="button" class="ms-share-chip" data-ms-q-vis>${showQuestion ? '不显示' : '显示'}</button>
      </div>
      <p class="ms-share-q" data-ms-q></p>
      <label class="ms-share-check ${hasAi ? '' : 'is-disabled'}">
        <input type="checkbox" data-ms-ai ${hasAi ? '' : 'disabled'} />
        带上深度解读${hasAi ? '' : '（本题还没有）'}
      </label>`
      }
      <p class="ms-share-status" data-ms-status hidden></p>
      <div class="ms-share-actions" data-ms-pre>
        <button type="button" class="btn ms-share-go" data-ms-go>${escapeHtml(copy.primary)}</button>
      </div>
      <div class="ms-share-done" data-ms-done hidden>
        <div class="ms-flip" data-ms-flip tabindex="0" role="button" aria-label="点一下翻转正反面">
          <div class="ms-flip-inner">
            <div class="ms-flip-face ms-flip-front">
              <img class="ms-share-preview" data-ms-front alt="正面：邀请美图，长按保存" />
            </div>
            <div class="ms-flip-face ms-flip-back">
              <img class="ms-share-preview" data-ms-back alt="背面：邀请说明，长按保存" />
            </div>
          </div>
        </div>
        <p class="ms-share-hint" data-ms-flip-hint>点一下翻转 · 长按当前面保存</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const qEl = modal.querySelector('[data-ms-q]') as HTMLElement | null;
  const visBtn = modal.querySelector('[data-ms-q-vis]') as HTMLButtonElement | null;
  const status = modal.querySelector('[data-ms-status]') as HTMLElement;
  const done = modal.querySelector('[data-ms-done]') as HTMLElement;
  const preActions = modal.querySelector('[data-ms-pre]') as HTMLElement;
  const flipEl = modal.querySelector('[data-ms-flip]') as HTMLElement;
  const flipHint = modal.querySelector('[data-ms-flip-hint]') as HTMLElement;
  const frontImg = modal.querySelector('[data-ms-front]') as HTMLImageElement;
  const backImg = modal.querySelector('[data-ms-back]') as HTMLImageElement;
  const goBtn = modal.querySelector('[data-ms-go]') as HTMLButtonElement;
  let snap: ShareSnapshot | null = null;
  let deepUrl = '';
  let frontUrl = '';
  let backUrl = '';
  let showingBack = false;

  const paintQ = () => {
    if (!qEl || !visBtn) return;
    const full = (draft.question || '').trim();
    qEl.textContent = showQuestion
      ? full || '（无问题）'
      : '（不显示）';
    qEl.classList.toggle('is-hidden-q', !showQuestion);
    visBtn.textContent = showQuestion ? '不显示' : '显示';
  };
  paintQ();

  const close = () => modal.remove();
  modal.querySelectorAll('[data-ms-close]').forEach((el) => {
    el.addEventListener('click', close);
  });

  const setStatus = (t: string, show = true) => {
    status.hidden = !show;
    status.textContent = t;
  };

  const setBusy = (busy: boolean) => {
    goBtn.disabled = busy;
  };

  const buildCreateBody = (): ShareCreateBody => ({
    ownerId: getOrCreateOwnerId(),
    system: draft.system,
    questionMasked: true,
    questionDisplay: isLabInvite ? '' : questionDisplayOf(),
    headline: draft.headline.slice(0, 80),
    summary: draft.summary.slice(0, 400),
    sections: draft.sections.slice(0, 12),
    visual: draft.visual,
    includeAi: !isLabInvite && includeAi && hasAi,
    aiText: !isLabInvite && includeAi && hasAi ? draft.aiText : undefined,
    brandSlogan: draft.brandSlogan || '答案不在牌里，在你心里。',
  });

  const generate = async (opts?: { quiet?: boolean }) => {
    setStatus(opts?.quiet ? '正在按显示设置重绘…' : '正在生成正反面…');
    setBusy(true);
    snap = await createShareSnapshot(buildCreateBody());
    deepUrl = shareDeepUrl(snap.id);
    try {
      const path = new URL(deepUrl, location.origin).pathname;
      if (location.pathname !== path) {
        history.replaceState(
          { ...(history.state as object), mysticShareBound: true },
          '',
          path,
        );
      }
    } catch {
      /* ignore */
    }
    const pair = await renderShareCoverPair(snap, deepUrl);
    frontUrl = pair.front;
    backUrl = pair.back;
    frontImg.src = frontUrl;
    backImg.src = backUrl;
    done.hidden = false;
    preActions.hidden = true;
    showingBack = false;
    flipEl.classList.remove('is-flipped');

    if (opts?.quiet) {
      setStatus(showQuestion ? '已显示问题并重绘分享图' : '已隐藏问题并重绘分享图');
      setBusy(false);
      return;
    }

    if (mode === 'save') {
      downloadCurrent();
      setStatus('已下载正面。点一下翻到背面，长按或再生成后可存解读面。');
      setBusy(false);
      return;
    }

    const shareResult = await nativeShareCoverImage({
      dataUrl: frontUrl,
      filename: `随心而行-${snap.id}.png`,
      title: mode === 'invite' ? '随心而行 · 邀请同行' : '随心而行 · 分享',
      text:
        mode === 'invite'
          ? `${snap.headline}（扫码进站）`
          : `${snap.headline}（扫码看完整解读）`,
      url: isLabInvite
        ? `${typeof location !== 'undefined' ? location.origin : ''}/`
        : deepUrl,
    });

    if (shareResult === 'shared') {
      setStatus(
        isLabInvite
          ? '已调起分享。点卡片可翻转，长按保存。'
          : '已调起分享正面图。点卡片可翻到背面解读。',
      );
    } else if (shareResult === 'cancelled') {
      setStatus('已取消。点卡片翻转，长按保存。');
    } else {
      setStatus(
        isLabInvite
          ? '点卡片翻转；长按当前面保存发给朋友。'
          : '点卡片翻转看解读；长按当前面保存发给朋友。',
      );
    }
    setBusy(false);
  };

  visBtn?.addEventListener('click', () => {
    showQuestion = !showQuestion;
    paintQ();
    if (snap) {
      void generate({ quiet: true }).catch((err) => {
        setBusy(false);
        setStatus(shareFailMessage(err));
      });
    }
  });
  modal.querySelector('[data-ms-ai]')?.addEventListener('change', (e) => {
    includeAi = (e.target as HTMLInputElement).checked;
  });

  const toggleFlip = () => {
    showingBack = !showingBack;
    flipEl.classList.toggle('is-flipped', showingBack);
    flipHint.textContent = isLabInvite
      ? showingBack
        ? '背面 · 邀请说明 · 再点翻回 · 长按可保存'
        : '正面 · 邀请卡 · 点一下翻面 · 长按可保存'
      : showingBack
        ? '背面 · 完整解读 · 再点翻回正面 · 长按可保存'
        : '正面 · 卦象 · 点一下看解读 · 长按可保存';
  };

  flipEl.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('img') && e.detail === 0) return;
    toggleFlip();
  });
  flipEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFlip();
    }
  });

  const downloadCurrent = () => {
    const dataUrl = showingBack ? backUrl : frontUrl;
    if (!dataUrl || !snap) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `随心而行-${showingBack ? '解读' : '卦象'}-${snap.id}.png`;
    a.click();
  };

  goBtn.addEventListener('click', () => {
    void generate().catch((err) => {
      setBusy(false);
      setStatus(shareFailMessage(err));
    });
  });

  if (options.autoStart) {
    void generate().catch((err) => {
      setBusy(false);
      setStatus(shareFailMessage(err));
    });
  }
}
