import { getBrowserNotifyPermission, showBrowserNotification } from '../core/browser-notify.ts';
import {
  loadJournalEntries,
  type JournalEntry,
} from './records.ts';

const REVIEW_AFTER_MS = 3 * 24 * 60 * 60 * 1000;
const NOTIFIED_KEY = 'mystic-lab-tarot-review-notified';

/** 完成占问满 3 天、尚未写感悟、也未标记应验对照 */
export function isTarotDueForReview(entry: JournalEntry, nowMs = Date.now()): boolean {
  if (entry.status === 'partial') return false;
  if (entry.fulfilled === true || entry.fulfilled === false) return false;
  if (entry.reflection?.trim()) return false;
  if (!entry.question.trim()) return false;
  const created = new Date(entry.createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return nowMs - created >= REVIEW_AFTER_MS;
}

export function listTarotDueForReview(nowMs = Date.now()): JournalEntry[] {
  return loadJournalEntries().filter((e) => isTarotDueForReview(e, nowMs));
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

/** 与小六壬同权：已授权时，回站弹系统通知 */
export async function notifyTarotDueReviewsIfAllowed(
  due: JournalEntry[],
  onOpen?: (entry: JournalEntry) => void,
): Promise<void> {
  if (due.length === 0) return;
  if (getBrowserNotifyPermission() !== 'granted') return;

  const notified = loadNotifiedMap();
  const fresh = due.filter((e) => !notified[e.id]);
  if (fresh.length === 0) return;

  const first = fresh[0];
  const more = fresh.length > 1 ? `（另有 ${fresh.length - 1} 条）` : '';
  const cardHint = first.cards[0]?.name ?? '占问';
  const result = await showBrowserNotification(`塔罗 · 该回手札写结局了${more}`, {
    body: `你之前问「${first.question}」· ${cardHint} · 已满 3 天，来记一下现实结果吧`,
    tag: `mystic-lab-tarot-due-${first.id}`,
    onClick: () => onOpen?.(first),
  });

  if (result === 'shown') {
    for (const e of fresh) markNotified(e.id);
  }
}
