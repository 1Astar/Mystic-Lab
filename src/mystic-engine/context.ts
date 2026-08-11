import {
  getLabProfileSnapshot,
  loadUseProfilePref,
} from '../life/profile-context.ts';
import { effectiveAge } from '../life/age.ts';
import type { RiskPreference, UserContext } from './types.ts';

function normalizeRisk(raw: string | undefined): RiskPreference {
  if (raw === 'cautious' || raw === 'bold' || raw === 'balanced') return raw;
  return 'balanced';
}

/**
 * 从 Lab 档案解析 UserContext；关闭档案或未建档时返回 null。
 */
export function resolveUserContext(opts?: {
  useProfile?: boolean;
}): UserContext | null {
  const use =
    opts?.useProfile ?? loadUseProfilePref(getLabProfileSnapshot().ready);
  if (!use) return null;

  const snap = getLabProfileSnapshot();
  if (!snap.ready) return null;

  const { profile, portrait, person } = snap;
  const stageParts = [
    portrait?.stageTitle?.trim(),
    profile.confusion.trim() || undefined,
    person.lifeTags.length ? person.lifeTags.slice(0, 3).join('、') : undefined,
  ].filter(Boolean);

  const riskRaw = (profile as { riskPreference?: string }).riskPreference;
  const age = effectiveAge(profile);

  return {
    age: age || undefined,
    occupation: profile.occupation.trim() || undefined,
    currentStage: stageParts.length ? stageParts.join(' · ') : undefined,
    riskPreference: normalizeRisk(riskRaw),
  };
}
