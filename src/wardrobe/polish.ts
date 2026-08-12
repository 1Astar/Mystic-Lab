/**
 * 衣橱文案 AI 润色：失败保留模板（对齐造命 Daily Quest）
 */
import {
  canUseMysticFollow,
  loadAiServiceMode,
  recordFollowUse,
} from '../ai/ai-mode.ts';
import { resolveAiRunReady, runChatCompletion } from '../ai/chat-runner.ts';
import type { WardrobePack } from './build-pack.ts';
import { loadWardrobePolish, saveWardrobePolish } from './polish-cache.ts';

export type WardrobePolishResult = {
  styleSummary: string;
  todayTip: string;
  source: 'template' | 'ai' | 'cache';
};

export async function polishWardrobeCopy(
  pack: WardrobePack,
  opts: { personId: string; nickname?: string },
): Promise<WardrobePolishResult> {
  const cached = loadWardrobePolish(opts.personId, pack.today.dateKey);
  if (cached) {
    return {
      styleSummary: cached.styleSummary,
      todayTip: cached.todayTip,
      source: 'cache',
    };
  }

  const template: WardrobePolishResult = {
    styleSummary: pack.style.summary,
    todayTip: pack.today.tip,
    source: 'template',
  };

  const ready = resolveAiRunReady({
    kind: 'follow',
    mysticFollowOk: canUseMysticFollow(),
  });
  if (!ready.ok) return template;

  const system = [
    '你是温柔的穿搭顾问，把八字衣橱规则译成口语短句。',
    '禁止：忌穿、倒霉色、缺什么、绝对吉凶、恐吓。',
    '只用软建议：主推/点缀/可以少一点。',
    '只输出 JSON：{"styleSummary":"本命风格一句60字内","todayTip":"今日穿搭一句80字内"}',
  ].join('\n');

  const user = [
    `称呼：${opts.nickname || '你'}`,
    `日主：${pack.dayMaster}${pack.dayMasterWx}`,
    `气质：${pack.temperament}（${pack.mood}）`,
    `本命色：${pack.chips.map((c) => `${c.label}${c.wx}(${c.names.join('/')})`).join('；')}`,
    `风格底稿：${pack.style.summary}`,
    `今日流日：${pack.today.ganZhi} ${pack.today.stemGod} · ${pack.today.tag}`,
    `今日底稿：${pack.today.tip}`,
  ].join('\n');

  try {
    const text = await runChatCompletion(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { temperature: 0.55 },
    );
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return template;
    const parsed = JSON.parse(m[0]) as {
      styleSummary?: string;
      todayTip?: string;
    };
    const styleSummary = String(parsed.styleSummary ?? '')
      .trim()
      .slice(0, 120);
    const todayTip = String(parsed.todayTip ?? '').trim().slice(0, 160);
    if (styleSummary.length < 8 || todayTip.length < 8) return template;
    if (/忌穿|倒霉|缺什么/.test(styleSummary + todayTip)) return template;

    if (loadAiServiceMode() === 'mystic') recordFollowUse();
    saveWardrobePolish(opts.personId, pack.today.dateKey, {
      styleSummary,
      todayTip,
    });
    return { styleSummary, todayTip, source: 'ai' };
  } catch {
    return template;
  }
}
