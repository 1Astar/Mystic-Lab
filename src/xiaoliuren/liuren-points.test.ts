import { describe, expect, it } from 'vitest';
import {
  formatPalmAnchor,
  getLiurenPoint,
  LIUREN_ORIGIN,
  LIUREN_POINTS,
} from './liuren-points.ts';

describe('liuren palm coordinates', () => {
  it('keeps six positions with finger/segment structure', () => {
    expect(LIUREN_POINTS).toHaveLength(6);
    expect(LIUREN_ORIGIN.finger).toBe('食指');
    expect(LIUREN_ORIGIN.segment).toBe('下节');
    expect(formatPalmAnchor(LIUREN_ORIGIN)).toBe('食指下节');
  });

  it('preserves live coordinates for 大安', () => {
    const daAn = getLiurenPoint(0);
    expect(daAn.x).toBe(41);
    expect(daAn.y).toBe(35);
  });
});
