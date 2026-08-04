import { openShareSheet, copyShareDeepLink, syncAddressBarToShare, type ShareDraft } from './sheet.ts';
import type { ShareSystem } from './types.ts';

export type InviteBarOpts = {
  draft: () => ShareDraft;
  /** 结果语境，如「这一卦」「这次结果」 */
  unitLabel?: string;
  /** 明确体系；缺省从 draft() 推断 */
  system?: ShareSystem;
};

const SHARE_FAB_SEL = '[data-ms-share-fab]';
const LINK_FAB_SEL = '[data-ms-link-fab]';
const AI_FAB_SEL = '[data-ly-ai-fab]';

/** 卸掉侧边分享 / AI，避免跨体系残留（塔罗点到六爻分享） */
export function clearSideActionFabs(): void {
  document
    .querySelectorAll(`${SHARE_FAB_SEL}, ${LINK_FAB_SEL}, ${AI_FAB_SEL}`)
    .forEach((el) => {
      el.remove();
    });
}

function toast(msg: string): void {
  document.querySelector('.ms-link-toast')?.remove();
  const el = document.createElement('div');
  el.className = 'ms-link-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 2600);
}

/**
 * 结果页左侧分享按钮。
 * 注意：不要清空结果容器（复原页会把解读 host 传来，清掉会只剩标题）。
 * 只卸分享 FAB；非六爻语境时一并卸掉「深度解读」，避免残留。
 * 六爻页由 personalize 先挂 FAB、再挂分享，故分享不得清掉深度解读。
 */
export function mountInviteCompanionBar(
  host: HTMLElement,
  opts: InviteBarOpts,
): void {
  document.querySelectorAll(`${SHARE_FAB_SEL}, ${LINK_FAB_SEL}`).forEach((el) => {
    el.remove();
  });
  const system = opts.system || (() => {
    try {
      return opts.draft().system;
    } catch {
      return undefined;
    }
  })();
  if (system && system !== 'liuyao') {
    document.querySelectorAll(AI_FAB_SEL).forEach((el) => el.remove());
  }
  // 点牌弹窗若异常未卸，会把侧边 FAB 藏成「看不见」
  document.documentElement.classList.remove('thread-peek-open');
  host.querySelector('[data-ms-invite-bar]')?.remove();
  if (host.classList.contains('ms-invite-host')) {
    host.hidden = true;
    host.setAttribute('aria-hidden', 'true');
  }

  const resolvedSystem = system || opts.draft().system;
  const root = document.querySelector('#app') || document.body;

  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'ms-share-fab';
  fab.dataset.msShareFab = '1';
  fab.dataset.shareSystem = resolvedSystem;
  fab.setAttribute('aria-label', resolvedSystem === 'tarot' ? '分享牌阵' : '分享');
  fab.innerHTML = `<span class="ms-share-fab-ico" aria-hidden="true">↗</span><span>分享</span>`;
  fab.addEventListener('click', () => {
    const draft = opts.draft();
    if (draft.system !== resolvedSystem) {
      console.warn('[share-fab] draft system mismatch', draft.system, resolvedSystem);
    }
    openShareSheet(draft, { mode: 'share', autoStart: true });
  });

  const linkFab = document.createElement('button');
  linkFab.type = 'button';
  linkFab.className = 'ms-share-fab ms-link-fab';
  linkFab.dataset.msLinkFab = '1';
  linkFab.setAttribute('aria-label', '复制可加次数的链接');
  linkFab.innerHTML = `<span>链接</span>`;
  linkFab.addEventListener('click', () => {
    linkFab.disabled = true;
    toast('正在生成可加次数的链接…');
    void copyShareDeepLink(opts.draft())
      .then((url) => {
        toast('已复制深链；地址栏也已换成 /s/…，直接发网址即可加次数');
        console.info('[share-link]', url);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : '复制失败';
        toast(msg);
      })
      .finally(() => {
        linkFab.disabled = false;
      });
  });

  root.appendChild(fab);
  root.appendChild(linkFab);

  // 静默把地址栏绑到 /s/…，复制网址也能加次数
  void syncAddressBarToShare(opts.draft()).catch(() => {
    /* 分享服务不可用时不打断结果页 */
  });
}
