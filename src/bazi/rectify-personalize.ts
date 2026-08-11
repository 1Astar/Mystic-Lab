/**
 * 生时校准 · LLM 个性化解说
 * 硬规则：排名 / 分数 / 暂定时辰只由规则引擎决定；LLM 只解释，不得改写结论。
 */
import { resolveAiRunReady, runChatCompletion } from '../ai/chat-runner.ts';
import { canUseMysticDeep, recordDeepUse } from '../ai/ai-mode.ts';
import { isAiConfigured } from '../ai/settings.ts';
import { openAiSettingsModal } from '../ui/ai-settings-panel.ts';
import { eventLabel, type RectifyEvent } from './rectify-events.ts';
import { provisionalAdvice, type RankedHourCandidate } from './rectify-score.ts';

const CACHE_KEY = 'mystic-lab-bazi-rectify-ai-narrate';

export type RectifyNarrateInput = {
  personName: string;
  birthBrief: string;
  events: RectifyEvent[];
  ranked: RankedHourCandidate[];
};

export function buildEngineFactsBlock(input: RectifyNarrateInput): string {
  const top = input.ranked.slice(0, 3);
  const lines: string[] = [
    `档案：${input.personName} · ${input.birthBrief}`,
    `事件数：${input.events.length}`,
    `引擎建议：${provisionalAdvice(input.ranked)}`,
    '',
    '【引擎排名（只读，禁止改写名次与百分比）】',
  ];
  for (const r of top) {
    lines.push(
      `${r.candidate.branch}时 ${r.confidencePct}%（${r.confidenceLabel}）时柱${r.candidate.hourPillar}`,
    );
    lines.push(`摘要：${r.summary}`);
    if (r.hits.length) {
      lines.push(`命中：${r.hits.map((h) => eventLabel(h.event)).join('、')}`);
    }
    if (r.misses.length) {
      lines.push(`未命中：${r.misses.map((m) => eventLabel(m.event)).join('、')}`);
    }
    lines.push('');
  }
  lines.push('【用户事件】');
  for (const e of input.events) {
    lines.push(`- ${eventLabel(e)} · 精度 ${e.precision}${e.note ? ` · ${e.note}` : ''}`);
  }
  return lines.join('\n');
}

export function buildRectifyNarratePrompt(input: RectifyNarrateInput): {
  system: string;
  user: string;
} {
  const top = input.ranked[0];
  const system = [
    '你是生时校准陪读教练。规则引擎已给出时辰排名与可信度，你只做个性化解说。',
    '硬禁止：改写引擎名次、百分比、或另推一个「更准」的时辰当结论。',
    '允许：用人话讲清为什么暂定此时辰、差异在哪、哪些事件仍不确定、下一步可补什么。',
    '语气：温暖、具体、不绝对判决；约 220–360 字；2–4 段短段落。',
    '结尾用一句话重申：这是暂定结论，可随新事件继续校正。',
    top
      ? `当前引擎第一名：${top.candidate.branch}时 ${top.confidencePct}%（${top.confidenceLabel}）。解说必须以此为暂定结论。`
      : '当前无可用候选。',
  ].join('\n');

  const user = [
    '请基于下列引擎事实，写一段个性化解说（不要输出 JSON，不要标题编号清单）。',
    '',
    buildEngineFactsBlock(input),
  ].join('\n');

  return { system, user };
}

/** 无 AI 时的本地人话兜底（仍完全来自引擎） */
export function buildOfflineNarrate(input: RectifyNarrateInput): string {
  const top = input.ranked[0];
  const alt = input.ranked[1];
  if (!top) {
    return '规则引擎未能排出候选时辰。请放宽出生时段，或再补几条带年份的大事件后重试。';
  }
  const hit = top.hits.map((h) => eventLabel(h.event)).join('、') || '部分事件';
  const miss = top.misses.map((m) => eventLabel(m.event)).join('、');
  const parts = [
    `按规则对照，暂定更贴近的是${top.candidate.label}（可信度 ${top.confidencePct}% · ${top.confidenceLabel}）。`,
    `它更能解释：${hit}。`,
  ];
  if (miss) parts.push(`仍较难解释：${miss}——这些不等于否定，只是信号偏弱。`);
  if (alt) {
    parts.push(
      `可对照的次选是${alt.candidate.branch}时（${alt.confidencePct}%）。两套差异值得用新事件继续验证。`,
    );
  }
  parts.push('这是暂定结论，不是绝对答案；以后有大事回来补充，可信度会更新。');
  return parts.join('');
}

export function cacheKeyForNarrate(input: RectifyNarrateInput): string {
  const top = input.ranked
    .slice(0, 3)
    .map((r) => `${r.candidate.branch}:${r.confidencePct}:${r.hits.length}:${r.misses.length}`)
    .join('|');
  const ev = input.events.map((e) => `${e.id}:${e.year}:${e.type}`).join(',');
  return `${top}::${ev}`;
}

export function loadCachedNarrate(key: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { key?: string; text?: string };
    if (p.key === key && p.text?.trim()) return p.text.trim();
    return null;
  } catch {
    return null;
  }
}

export function saveCachedNarrate(key: string, text: string): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ key, text: text.trim() }));
  } catch {
    /* ignore */
  }
}

export type NarrateResult =
  | { ok: true; text: string; via: 'ai' | 'offline' | 'cache' }
  | { ok: false; reason: string; needSettings?: boolean };

export async function generateRectifyNarrate(
  input: RectifyNarrateInput,
  opts?: { force?: boolean },
): Promise<NarrateResult> {
  if (!input.ranked.length) {
    return { ok: true, text: buildOfflineNarrate(input), via: 'offline' };
  }
  const key = cacheKeyForNarrate(input);
  if (!opts?.force) {
    const cached = loadCachedNarrate(key);
    if (cached) return { ok: true, text: cached, via: 'cache' };
  }

  const ready = resolveAiRunReady({ kind: 'deep', mysticDeepOk: canUseMysticDeep() });
  if (!ready.ok) {
    if (ready.reason === 'need_byok') {
      return {
        ok: false,
        reason: '尚未配置 AI。可先看规则摘要，或去配置自己的接口。',
        needSettings: true,
      };
    }
    if (ready.reason === 'mystic_quota') {
      return {
        ok: false,
        reason: '免费 AI 次数已用完。可改用自己的 Key，或先看规则引擎摘要。',
      };
    }
    // mystic_soon → 若已配 BYOK 会在 resolve 里 ok；否则离线
    const offline = buildOfflineNarrate(input);
    return { ok: true, text: offline, via: 'offline' };
  }

  const { system, user } = buildRectifyNarratePrompt(input);
  try {
    const text = await runChatCompletion(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { temperature: 0.45 },
    );
    if (ready.via === 'mystic') recordDeepUse();
    saveCachedNarrate(key, text);
    return { ok: true, text, via: 'ai' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '生成失败';
    if (msg === 'NO_AI' || !isAiConfigured()) {
      return {
        ok: false,
        reason: 'AI 未就绪，已可用下方规则摘要代替。',
        needSettings: true,
      };
    }
    return { ok: false, reason: msg };
  }
}

export function openRectifyAiSettings(): void {
  openAiSettingsModal();
}
