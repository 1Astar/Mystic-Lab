import type { LifeProfileInput } from '../life/types.ts';

const KEY = 'mystic-lab-bazi-partner';

export type PartnerBirth = Pick<
  LifeProfileInput,
  'birthYear' | 'birthMonth' | 'birthDay' | 'birthHour' | 'birthPlace'
> & { label: string };

export const EMPTY_PARTNER: PartnerBirth = {
  label: '对方',
  birthYear: '',
  birthMonth: '',
  birthDay: '',
  birthHour: '',
  birthPlace: '',
};

export function loadPartner(): PartnerBirth {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_PARTNER };
    return { ...EMPTY_PARTNER, ...(JSON.parse(raw) as Partial<PartnerBirth>) };
  } catch {
    return { ...EMPTY_PARTNER };
  }
}

export function savePartner(partner: PartnerBirth): void {
  localStorage.setItem(KEY, JSON.stringify(partner));
}

export function partnerAsProfile(p: PartnerBirth): LifeProfileInput {
  return {
    age: '',
    occupation: '',
    city: '',
    confusion: '',
    birthYear: p.birthYear,
    birthMonth: p.birthMonth,
    birthDay: p.birthDay,
    birthHour: p.birthHour,
    birthPlace: p.birthPlace,
  };
}
