import type { LifeProfileInput } from './types.ts';

/** 由出生年月日推算周岁；无效则返回空串 */
export function deriveAgeFromBirth(
  birthYear: string,
  birthMonth = '',
  birthDay = '',
  at = new Date(),
): string {
  const y = Number(String(birthYear).trim());
  if (!Number.isFinite(y) || y < 1900 || y > at.getFullYear()) return '';
  const mRaw = Number(String(birthMonth).trim());
  const dRaw = Number(String(birthDay).trim());
  const m = Number.isFinite(mRaw) && mRaw >= 1 && mRaw <= 12 ? mRaw : 1;
  const d = Number.isFinite(dRaw) && dRaw >= 1 && dRaw <= 31 ? dRaw : 1;
  let age = at.getFullYear() - y;
  const nowM = at.getMonth() + 1;
  const nowD = at.getDate();
  if (nowM < m || (nowM === m && nowD < d)) age -= 1;
  if (age < 0 || age > 120) return '';
  return String(age);
}

/** 优先用生日推算；无生日时回退已存 age */
export function effectiveAge(profile: Pick<LifeProfileInput, 'age' | 'birthYear' | 'birthMonth' | 'birthDay'>, at = new Date()): string {
  const derived = deriveAgeFromBirth(profile.birthYear, profile.birthMonth, profile.birthDay, at);
  if (derived) return derived;
  return String(profile.age ?? '').trim();
}

export function withDerivedAge(profile: LifeProfileInput, at = new Date()): LifeProfileInput {
  const age = deriveAgeFromBirth(profile.birthYear, profile.birthMonth, profile.birthDay, at);
  return age ? { ...profile, age } : profile;
}
