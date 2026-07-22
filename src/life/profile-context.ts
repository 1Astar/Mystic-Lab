import {
  hasUsableProfile,
  loadLifeStore,
} from './storage.ts';
import type { LifePortrait, LifeProfileInput } from './types.ts';

const PREF_KEY = 'mystic-lab-use-profile-in-readings';

export type LabProfileSnapshot = {
  profile: LifeProfileInput;
  portrait?: LifePortrait;
  ready: boolean;
  brief: string;
  readingContext: string;
};

/** 一行摘要：29岁 · 产品经理 · 上海 */
export function formatProfileBrief(profile: LifeProfileInput): string {
  const parts = [
    profile.age.trim() ? `${profile.age.trim()}岁` : '',
    profile.occupation.trim(),
    profile.city.trim(),
  ].filter(Boolean);
  return parts.join(' · ') || '已建档 · 细节较少';
}

/** 给占问解读用的现状上下文（探索口径，非断语） */
export function formatProfileReadingContext(
  profile: LifeProfileInput,
  portrait?: LifePortrait,
): string {
  const lines: string[] = [];
  const brief = formatProfileBrief(profile);
  if (brief) lines.push(`现状：${brief}`);
  if (profile.confusion.trim()) lines.push(`当前困惑：${profile.confusion.trim()}`);
  if (portrait?.stageTitle) {
    lines.push(`人生阶段倾向：${portrait.stageTitle}`);
  }
  if (portrait?.themes?.length) {
    lines.push(`主题：${portrait.themes.slice(0, 3).join('、')}`);
  }
  return lines.join('\n');
}

export function getLabProfileSnapshot(): LabProfileSnapshot {
  const store = loadLifeStore();
  const ready = hasUsableProfile(store.profile);
  return {
    profile: store.profile,
    portrait: store.portrait,
    ready,
    brief: ready ? formatProfileBrief(store.profile) : '',
    readingContext: ready
      ? formatProfileReadingContext(store.profile, store.portrait)
      : '',
  };
}

/** 默认：有档案则建议带上；用户可关掉并记住偏好 */
export function loadUseProfilePref(defaultWhenReady = true): boolean {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw === '0') return false;
    if (raw === '1') return true;
  } catch {
    /* ignore */
  }
  return defaultWhenReady;
}

export function saveUseProfilePref(on: boolean): void {
  localStorage.setItem(PREF_KEY, on ? '1' : '0');
}

/**
 * 合并手动背景与档案。
 * 手动内容优先保留；开启档案时把档案块附在后面（去重）。
 */
export function mergeReadingBackground(
  manual: string,
  useProfile: boolean,
  snapshot = getLabProfileSnapshot(),
): string {
  const hand = manual.trim();
  if (!useProfile || !snapshot.ready) return hand;
  const block = snapshot.readingContext;
  if (!block) return hand;
  if (!hand) return block;
  if (hand.includes(block) || hand.includes(snapshot.brief)) return hand;
  return `${hand}\n\n——\n（我的档案）\n${block}`;
}
