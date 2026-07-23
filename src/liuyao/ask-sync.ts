import type { AskVaultEntry } from './ask-vault.ts';
import {
  isStarPmCaptureConfigured,
  loadAiSettings,
  type AiSettings,
} from '../ai/settings.ts';

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

async function postToStarPm(entry: AskVaultEntry, settings: AiSettings): Promise<void> {
  const base = settings.starPmBaseUrl.trim().replace(/\/$/, '');
  const titleBase = entry.q.trim().slice(0, 36);
  const title = `[六爻边问] ${entry.hexName} · ${titleBase}${entry.q.length > 36 ? '…' : ''}`;
  const summary = `${entry.source} · 问${entry.askCount}次 · 有用${entry.usefulVotes}`;

  const res = await fetch(`${base}/api/ideas/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ideas-capture-secret': settings.starPmCaptureSecret.trim(),
    },
    body: JSON.stringify({
      title,
      type: '内容想法',
      relatedProjectId: 'proj-moonpie',
      relatedModule: '六爻',
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
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text.slice(0, 120) || `HTTP ${res.status}`);
  }
}

/** 新问或达回灌门槛时尝试同步；同键 24h 内不重复 */
export async function syncAskToStarPm(entry: AskVaultEntry): Promise<AskSyncResult> {
  const settings = loadAiSettings();
  if (!isStarPmCaptureConfigured(settings)) {
    return {
      starPm: { ok: false, message: '已保存在本机；配置 Star PM 后可同步到收件箱' },
    };
  }
  if (!shouldSync(entry)) {
    return { starPm: { ok: true, message: '近期已同步，跳过' } };
  }
  try {
    await postToStarPm(entry, settings);
    recentSync.set(syncKey(entry), Date.now());
    return { starPm: { ok: true, message: '已同步到 Star PM 收件箱' } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '同步失败';
    return { starPm: { ok: false, message: `已本机保存；Star PM：${msg}` } };
  }
}
