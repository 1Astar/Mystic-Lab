/** 浏览器 Notification API（小六壬 / 塔罗手札共用） */

export function isBrowserNotifySupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotifyPermission(): NotificationPermission | 'unsupported' {
  if (!isBrowserNotifySupported()) return 'unsupported';
  return Notification.permission;
}

/** 请求权限；已授权/已拒绝则直接返回 */
export async function ensureBrowserNotifyPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
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
      tag: opts.tag ?? 'mystic-lab',
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

export async function tryDemoBrowserNotification(): Promise<
  'shown' | 'denied' | 'unsupported'
> {
  return showBrowserNotification('Mystic Lab · 试用通知', {
    body: '这就是浏览器通知。以后占问满 3 天未写感悟时，回站也可能弹出提醒。',
    tag: 'mystic-lab-demo',
  });
}
