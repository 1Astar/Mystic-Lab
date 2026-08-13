import { describe, expect, it } from 'vitest';
import { CITY_LONGITUDES, resolveBirthPlaceLng } from './cities.ts';

describe('CITY_LONGITUDES', () => {
  it('covers prefecture + county scale', () => {
    expect(CITY_LONGITUDES.length).toBeGreaterThan(2000);
  });
});

describe('resolveBirthPlaceLng', () => {
  it('matches 赣州', () => {
    const r = resolveBirthPlaceLng('江西省赣州市');
    expect(r.matched).toBe(true);
    expect(r.cityName).toBe('赣州');
    expect(r.lng).toBeCloseTo(114.93, 1);
  });

  it('matches obscure county 井陉', () => {
    const r = resolveBirthPlaceLng('井陉');
    expect(r.matched).toBe(true);
    expect(r.cityName).toBe('井陉');
  });

  it('does not map 南京 to 北京 via 京', () => {
    const r = resolveBirthPlaceLng('南京');
    expect(r.matched).toBe(true);
    expect(r.cityName).toBe('南京');
  });

  it('maps 长安 to 西安', () => {
    const r = resolveBirthPlaceLng('长安');
    expect(r.matched).toBe(true);
    expect(r.cityName).toBe('西安');
  });

  it('empty place uses CST meridian', () => {
    const r = resolveBirthPlaceLng('');
    expect(r.matched).toBe(false);
    expect(r.lng).toBe(120);
  });
});
