import type { XiaoliurenJournalEntry } from './journal.ts';

const NOTIFIED_KEY = 'mystic-lab-xlr-review-notified';

export function isBrowserNotifySupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotifyPermission(): NotificationPermission | 'unsupported' {
  if (!isBrowserNotifySupported()) return 'unsupported';
  return Notification.permission;
}

/** 请求权限；已授权/已拒绝则直接返回 */
export async function ensureBrowserNotifyPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isBrowserNotifySupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

type ShowOpts = {
  body?: string;
  tag?: string;
  /** 点击通知时 */
  onClick?: () => void;
};

/** 弹出一条系统通知；未授权则先请求 */
export async function showBrowserNotification(
  title: string,
  opts: ShowOpts = {},
): Promise<'shown' | 'denied' | 'unsupported'> {
  const perm = await ensureBrowserNotifyPermission();
  if (perm === 'unsupported') return 'unsupported';
  if (perm !== 'granted') return 'denied';

  try {
    const n = new Notification(title, {
      body: opts.body,
      tag: opts.tag ?? 'mystic-lab-xlr',
      lang: 'zh-CN',
    });
    n.onclick = () => {
      window.focus();
      opts.onClick?.();
      n.close();
    };
    return 'shown';
  } catch {
    return 'denied';
  }
}

/** 立刻试用一条，方便看长什么样 */
export async function tryDemoBrowserNotification(): Promise<'shown' | 'denied' | 'unsupported'> {
  return showBrowserNotification('Mystic Lab · 试用通知', {
    body: '这就是浏览器通知。以后起课满 3 天未对照时，回站也可能弹出一条提醒。',
    tag: 'mystic-lab-xlr-demo',
  });
}

function loadNotifiedMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function markNotified(id: string): void {
  const map = loadNotifiedMap();
  map[id] = new Date().toISOString();
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map));
}

/**
 * 打开站点且存在待对照时，对尚未通知过的条目弹一次系统通知。
 * 不依赖 cron；关着网页时不会准时推送。
 */
export async function notifyDueReviewsIfAllowed(
  due: XiaoliurenJournalEntry[],
  onOpen?: (entry: XiaoliurenJournalEntry) => void,
): Promise<void> {
  if (due.length === 0) return;
  if (getBrowserNotifyPermission() !== 'granted') return;

  const notified = loadNotifiedMap();
  const fresh = due.filter((e) => !notified[e.id]);
  if (fresh.length === 0) return;

  const first = fresh[0];
  const more = fresh.length > 1 ? `（另有 ${fresh.length - 1} 条）` : '';
  const result = await showBrowserNotification(`小六壬 · 有课该对照了${more}`, {
    body: `「${first.question || '未填写问题'}」· ${first.resultName} · 起课已满 3 天`,
    tag: `mystic-lab-xlr-due-${first.id}`,
    onClick: () => onOpen?.(first),
  });

  if (result === 'shown') {
    for (const e of fresh) markNotified(e.id);
  }
}
