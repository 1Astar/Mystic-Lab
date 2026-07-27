import { beforeEach, describe, expect, it } from 'vitest';
import { createSelfPerson, type LifeStore } from '../life/types.ts';
import { resolveUserContext } from './context.ts';

const STORE_KEY = 'mystic-lab-life-universe';
const PREF_KEY = 'mystic-lab-use-profile-in-readings';

function installMemoryStorage(): void {
  const map = new Map<string, string>();
  const memory = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: memory,
    configurable: true,
  });
}

function seedStore(): void {
  const self = createSelfPerson({
    age: '28',
    occupation: '产品经理',
    city: '上海',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthHour: '',
    birthPlace: '',
    confusion: '纠结转正薪资',
  });
  const store: LifeStore = {
    profiles: [self],
    activeProfileId: self.id,
    profile: self,
    portrait: {
      tendencies: [],
      themes: ['职业过渡'],
      stageTitle: '求职过渡期',
      stageSummary: '',
      stageHints: [],
      source: 'template',
      generatedAt: new Date().toISOString(),
    },
    worlds: [],
    simulation: undefined,
    forecasts: [],
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

describe('resolveUserContext', () => {
  beforeEach(() => {
    installMemoryStorage();
    localStorage.clear();
  });

  it('returns occupation when profile on', () => {
    seedStore();
    localStorage.setItem(PREF_KEY, '1');
    const ctx = resolveUserContext({ useProfile: true });
    expect(ctx?.occupation).toBe('产品经理');
    expect(ctx?.riskPreference).toBe('balanced');
    expect(ctx?.currentStage).toMatch(/求职过渡期/);
  });

  it('returns null when profile off', () => {
    seedStore();
    const ctx = resolveUserContext({ useProfile: false });
    expect(ctx).toBeNull();
  });
});
