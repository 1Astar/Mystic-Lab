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
      kicker: '🌙 邀请同行者',
      title: isTarot ? '生成邀请图' : '生成邀请图',
      lead: '正面是美图，点一下翻到完整解读。长按当前面可保存。',
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
      <div class="ms-share-row">
        <span>问题</span>
        <button type="button" class="ms-share-chip" data-ms-q-vis>${showQuestion ? '不显示' : '显示'}</button>
      </div>
      <p class="ms-share-q" data-ms-q></p>
      <label class="ms-share-check ${hasAi ? '' : 'is-disabled'}">
        <input type="checkbox" data-ms-ai ${hasAi ? '' : 'disabled'} />
        带上深度解读${hasAi ? '' : '（本题还没有）'}
      </label>
      <p class="ms-share-status" data-ms-status hidden></p>
      <div class="ms-share-actions" data-ms-pre>
        <button type="button" class="btn ms-share-go" data-ms-go>${escapeHtml(copy.primary)}</button>
        ${
          mode === 'save'
            ? ''
            : `<button type="button" class="ms-share-copy-only" data-ms-copy-only>只复制链接（可加次数）</button>`
        }
      </div>
      <div class="ms-share-done" data-ms-done hidden>
        <div class="ms-flip" data-ms-flip tabindex="0" role="button" aria-label="点一下翻转正反面">
          <div class="ms-flip-inner">
            <div class="ms-flip-face ms-flip-front">
              <img class="ms-share-preview" data-ms-front alt="正面：卦象美图，长按保存" />
            </div>
            <div class="ms-flip-face ms-flip-back">
              <img class="ms-share-preview" data-ms-back alt="背面：完整解读，长按保存" />
            </div>
          </div>
        </div>
        <p class="ms-share-hint" data-ms-flip-hint>点一下翻转 · 长按当前面保存</p>
        <p class="ms-share-link-tap" data-ms-copy-link tabindex="0" role="button">点一下复制链接</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const qEl = modal.querySelector('[data-ms-q]') as HTMLElement;
  const visBtn = modal.querySelector('[data-ms-q-vis]') as HTMLButtonElement;
  const status = modal.querySelector('[data-ms-status]') as HTMLElement;
  const done = modal.querySelector('[data-ms-done]') as HTMLElement;
  const preActions = modal.querySelector('[data-ms-pre]') as HTMLElement;
  const flipEl = modal.querySelector('[data-ms-flip]') as HTMLElement;
  const flipHint = modal.querySelector('[data-ms-flip-hint]') as HTMLElement;
  const frontImg = modal.querySelector('[data-ms-front]') as HTMLImageElement;
  const backImg = modal.querySelector('[data-ms-back]') as HTMLImageElement;
  const copyLinkEl = modal.querySelector('[data-ms-copy-link]') as HTMLElement;
  const copyOnlyBtn = modal.querySelector(
    '[data-ms-copy-only]',
  ) as HTMLButtonElement | null;
  const goBtn = modal.querySelector('[data-ms-go]') as HTMLButtonElement;
  let snap: ShareSnapshot | null = null;
  let deepUrl = '';
  let frontUrl = '';
  let backUrl = '';
  let showingBack = false;

  const paintQ = () => {
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

  const buildCreateBody = (): ShareCreateBody => ({
    ownerId: getOrCreateOwnerId(),
    system: draft.system,
    questionMasked: !showQuestion,
    questionDisplay: questionDisplayOf(),
    headline: draft.headline.slice(0, 80),
    summary: draft.summary.slice(0, 400),
    sections: draft.sections.slice(0, 12),
    visual: draft.visual,
    includeAi: includeAi && hasAi,
    aiText: includeAi && hasAi ? draft.aiText : undefined,
    brandSlogan:
      mode === 'invite' ? '你的朋友邀请你看看近期状态' : draft.brandSlogan,
  });

  /** 只建快照拿深链（可加次数），不出图 */
  const ensureDeepLink = async (): Promise<string> => {
    snap = await createShareSnapshot(buildCreateBody());
    deepUrl = shareDeepUrl(snap.id);
    return deepUrl;
  };

  const generate = async (opts?: { quiet?: boolean }) => {
    setStatus(opts?.quiet ? '正在按显示设置重绘…' : '正在生成正反面…');
    goBtn.disabled = true;
    if (copyOnlyBtn) copyOnlyBtn.disabled = true;
    snap = await createShareSnapshot(buildCreateBody());
    deepUrl = shareDeepUrl(snap.id);
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
      goBtn.disabled = false;
      if (copyOnlyBtn) copyOnlyBtn.disabled = false;
      return;
    }

    if (mode === 'save') {
      downloadCurrent();
      setStatus('已下载正面。点一下翻到背面，长按或再生成后可存解读面。');
      goBtn.disabled = false;
      if (copyOnlyBtn) copyOnlyBtn.disabled = false;
      return;
    }

    const shareResult = await nativeShareCoverImage({
      dataUrl: frontUrl,
      filename: `随心而行-${snap.id}.png`,
      title:
        mode === 'invite'
          ? '随心而行 · 邀请你看看'
          : '随心而行 · 分享',
      text:
        mode === 'invite'
          ? '你的朋友邀请你看看你的近期状态（扫码打开）'
          : `${snap.headline}（扫码看完整解读）`,
      url: deepUrl,
    });

    if (shareResult === 'shared') {
      setStatus('已调起分享正面图。点卡片可翻到背面解读。');
    } else if (shareResult === 'cancelled') {
      setStatus('已取消。点卡片翻转，长按保存。');
    } else {
      setStatus('点卡片翻转看解读；长按当前面保存发给朋友。');
    }
  };

  visBtn.addEventListener('click', () => {
    showQuestion = !showQuestion;
    paintQ();
    if (snap) {
      void generate({ quiet: true }).catch((err) => {
        goBtn.disabled = false;
        if (copyOnlyBtn) copyOnlyBtn.disabled = false;
        setStatus(shareFailMessage(err));
      });
    }
  });
  modal.querySelector('[data-ms-ai]')?.addEventListener('change', (e) => {
    includeAi = (e.target as HTMLInputElement).checked;
  });

  const copyLink = async (opts?: { createIfNeeded?: boolean }) => {
    try {
      if (!deepUrl && opts?.createIfNeeded) {
        setStatus('正在生成可加次数的链接…');
        if (copyOnlyBtn) copyOnlyBtn.disabled = true;
        goBtn.disabled = true;
        await ensureDeepLink();
        goBtn.disabled = false;
        if (copyOnlyBtn) copyOnlyBtn.disabled = false;
      }
      if (!deepUrl) return;
      await navigator.clipboard.writeText(deepUrl);
      copyLinkEl.textContent = '已复制';
      copyLinkEl.classList.add('is-copied');
      if (copyOnlyBtn) copyOnlyBtn.textContent = '已复制链接';
      setStatus('链接已复制：朋友打开并看一会儿，双方都可加次数');
      window.setTimeout(() => {
        copyLinkEl.textContent = '点一下复制链接';
        copyLinkEl.classList.remove('is-copied');
        if (copyOnlyBtn) copyOnlyBtn.textContent = '只复制链接（可加次数）';
      }, 1800);
    } catch (err) {
      goBtn.disabled = false;
      if (copyOnlyBtn) copyOnlyBtn.disabled = false;
      setStatus(
        err instanceof Error && /分享|网络|Failed/.test(err.message)
          ? shareFailMessage(err)
          : '复制失败，请手动选中地址栏',
      );
    }
  };

  copyOnlyBtn?.addEventListener('click', () => {
    void copyLink({ createIfNeeded: true });
  });

  copyLinkEl.addEventListener('click', () => {
    void copyLink({ createIfNeeded: true });
  });
  copyLinkEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      void copyLink({ createIfNeeded: true });
    }
  });

  const toggleFlip = () => {
    showingBack = !showingBack;
    flipEl.classList.toggle('is-flipped', showingBack);
    flipHint.textContent = showingBack
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
      goBtn.disabled = false;
      if (copyOnlyBtn) copyOnlyBtn.disabled = false;
      setStatus(shareFailMessage(err));
    });
  });

  if (options.autoStart) {
    void generate().catch((err) => {
      goBtn.disabled = false;
      if (copyOnlyBtn) copyOnlyBtn.disabled = false;
      setStatus(shareFailMessage(err));
    });
  }
}
