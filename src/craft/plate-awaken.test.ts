import { describe, expect, it, beforeEach } from 'vitest';
import { createEmptyPerson } from '../life/types.ts';
import { castZiweiChart } from '../ziwei/cast.ts';
import {
  buildPlateAwakenCopy,
  classifyPlateStar,
  collectOriginKeys,
  countSealedStars,
  plateStarKey,
  trialGainsFor,
  TRIAL_GAIN_MAJOR,
  TRIAL_GAIN_SHA,
} from './plate-awaken.ts';
import { activateStar, activateKey } from './spirit-activate.ts';

const mem = new Map<string, string>();

beforeEach(() => {
  mem.clear();
  // @ts-expect-error test stub
  globalThis.localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
  };
});

function sampleView() {
  const person = createEmptyPerson({
    nickname: '测',
    gender: 'female',
    birthYear: '1990',
    birthMonth: '5',
    birthDay: '12',
    birthHour: '14:30',
    birthPlace: '成都',
  });
  const view = castZiweiChart(person, { intent: 'map' });
  if ('error' in view) throw new Error(view.error);
  return view;
}

describe('plate awaken', () => {
  it('marks soul majors and soul/body masters as origin', () => {
    const view = sampleView();
    const origin = collectOriginKeys(view);
    expect(origin.size).toBeGreaterThan(0);
    for (const s of view.soulPalace.majors) {
      if (!s.name) continue;
      expect(origin.has(activateKey(view.soulPalace.name, s.name))).toBe(true);
      expect(
        classifyPlateStar(
          { palace: view.soulPalace.name, star: s.name, isMajor: true },
          view,
        ),
      ).toBe('origin');
    }
  });

  it('classifies non-origin as sealed then awakened after activate', () => {
    const view = sampleView();
    const origin = collectOriginKeys(view);
    const candidate = view.palaces
      .flatMap((p) =>
        p.majors.map((s) => ({ palace: p.name, star: s.name, isMajor: true as const })),
      )
      .find((r) => r.star && !origin.has(plateStarKey(r)));
    expect(candidate).toBeTruthy();
    if (!candidate) return;

    expect(classifyPlateStar(candidate, view)).toBe('sealed');
    const copy = buildPlateAwakenCopy(candidate, 'sealed');
    expect(copy.theme).toBe('trial');
    expect(copy.cta).toBe('activate');
    expect(copy.body).not.toMatch(/倒霉/);

    activateStar(plateStarKey(candidate), {
      starNameForCodex: candidate.star,
      palace: candidate.palace,
    });
    expect(classifyPlateStar(candidate, view)).toBe('awakened');
  });

  it('gives karma framing and yeli gain for sha / 化忌', () => {
    const shaGains = trialGainsFor({
      palace: '官禄',
      star: '擎羊',
      isMajor: false,
    });
    expect(shaGains.some((g) => g.axis === 'yeli' && g.gain === TRIAL_GAIN_SHA)).toBe(true);
    const jiCopy = buildPlateAwakenCopy(
      { palace: '官禄', star: '廉贞', mutagenCard: '化忌', isMajor: true },
      'sealed',
    );
    expect(jiCopy.karma).toBe(true);
    expect(jiCopy.body).toMatch(/业力/);
    expect(jiCopy.body).not.toMatch(/倒霉/);

    const majorGains = trialGainsFor({
      palace: '财帛',
      star: '太阳',
      isMajor: true,
    });
    expect(majorGains.some((g) => g.gain === TRIAL_GAIN_MAJOR)).toBe(true);
  });

  it('counts sealed stars above zero for a fresh chart', () => {
    const view = sampleView();
    const { sealed } = countSealedStars(view);
    expect(sealed).toBeGreaterThan(0);
  });
});
