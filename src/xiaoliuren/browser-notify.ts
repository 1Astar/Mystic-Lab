import {
  ensureBrowserNotifyPermission,
  getBrowserNotifyPermission,
  isBrowserNotifySupported,
  showBrowserNotification,
  tryDemoBrowserNotification,
} from '../core/browser-notify.ts';
import type { XiaoliurenJournalEntry } from './journal.ts';

export {
  ensureBrowserNotifyPermission,
  getBrowserNotifyPermission,
  isBrowserNotifySupported,
  showBrowserNotification,
  tryDemoBrowserNotification,
};

const NOTIFIED_KEY = 'mystic-lab-xlr-review-notified';

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
