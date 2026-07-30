import type { AskVaultEntry } from './ask-vault.ts';
import { isStarPmCaptureReady, postStarPmIdeaCapture } from '../ai/star-pm-endpoint.ts';

const recentSync = new Map<string, number>();
const SYNC_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type AskSyncResult = {
  starPm: { ok: boolean; message: string };
};

function syncKey(entry: AskVaultEntry): string {
  return `${entry.hexName}::${entry.qKey}`;
}

function shouldSync(entry: AskVaultEntry): boolean {
  const key = syncKey(entry);
  const last = recentSync.get(key) ?? 0;
  return Date.now() - last >= SYNC_COOLDOWN_MS;
}

async function postToStarPm(entry: AskVaultEntry): Promise<void> {
  const titleBase = entry.q.trim().slice(0, 36);
  const title = `[六爻边问] ${entry.hexName} · ${titleBase}${entry.q.length > 36 ? '…' : ''}`;
  const summary = `${entry.source} · 问${entry.askCount}次 · 有用${entry.usefulVotes}`;

  await postStarPmIdeaCapture({
    title,
    type: '内容想法',
    relatedProjectId: 'proj-moonpie',
    relatedModule: '六爻·笔记·边看边问',
    summary,
    priority: entry.source === 'promoted' ? 'P1' : 'P2',
    suggestedNextStep:
      entry.source === 'promoted'
        ? '达回灌门槛，可审阅后固化为种子常问'
        : '对照用户追问完善六爻教学答疑',
    source: 'Mystic Lab',
    rawThought: [
      `卦: ${entry.hexName}`,
      `问: ${entry.q}`,
      `答: ${entry.a}`,
      `askCount: ${entry.askCount}`,
      `usefulVotes: ${entry.usefulVotes}`,
      `unclearVotes: ${entry.unclearVotes}`,
      `source: ${entry.source}`,
      `readingQuestion: ${entry.readingQuestion ?? ''}`,
      `updatedAt: ${entry.updatedAt}`,
    ].join('\n'),
  });
}

/** 新问或达回灌门槛时尝试同步；同键 24h 内不重复 */
export async function syncAskToStarPm(entry: AskVaultEntry): Promise<AskSyncResult> {
  if (!isStarPmCaptureReady()) {
    return {
      starPm: { ok: false, message: '已保存在本机；同步暂不可用' },
    };
  }
  if (!shouldSync(entry)) {
    return { starPm: { ok: true, message: '近期已同步，跳过' } };
  }
  try {
    await postToStarPm(entry);
    recentSync.set(syncKey(entry), Date.now());
    return { starPm: { ok: true, message: '已同步到 Star PM 收件箱' } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '同步失败';
    return { starPm: { ok: false, message: `已本机保存；Star PM：${msg}` } };
  }
}
