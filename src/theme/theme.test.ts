import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  LAB_THEME_STORAGE_KEY,
  applyTheme,
  getTheme,
  initTheme,
  isLabTheme,
  setTheme,
} from './theme.ts';

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

function installDocumentStub(): void {
  const dataset: Record<string, string> = {};
  const style: { colorScheme: string } = { colorScheme: '' };
  const documentElement = {
    dataset,
    style,
    removeAttribute(name: string) {
      if (name === 'data-theme') delete dataset.theme;
    },
  };
  Object.defineProperty(globalThis, 'document', {
    value: { documentElement },
    configurable: true,
  });
}

describe('lab theme', () => {
  beforeEach(() => {
    installMemoryStorage();
    installDocumentStub();
  });

  afterEach(() => {
    localStorage.removeItem(LAB_THEME_STORAGE_KEY);
  });

  it('defaults to star', () => {
    expect(getTheme()).toBe('star');
    expect(initTheme()).toBe('star');
    expect(document.documentElement.dataset.theme).toBe('star');
  });

  it('persists moon and restores via initTheme', () => {
    expect(setTheme('moon')).toBe('moon');
    expect(localStorage.getItem(LAB_THEME_STORAGE_KEY)).toBe('moon');
    document.documentElement.removeAttribute('data-theme');
    expect(initTheme()).toBe('moon');
    expect(document.documentElement.dataset.theme).toBe('moon');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('applyTheme sets color-scheme for star', () => {
    applyTheme('star');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('isLabTheme guards', () => {
    expect(isLabTheme('star')).toBe(true);
    expect(isLabTheme('moon')).toBe(true);
    expect(isLabTheme('solar')).toBe(false);
  });
});
