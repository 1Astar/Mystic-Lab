import { describe, expect, it } from 'vitest';
import {
  CAST_LOGIC_STEPS,
  DEPTH_LAYERS,
  PALM_SYSTEM_TOPICS,
} from './palm-system.ts';

describe('palm system depth layers', () => {
  it('has five depth layers', () => {
    expect(DEPTH_LAYERS.map((l) => l.title)).toEqual([
      '会用',
      '理解为什么',
      '掌诀系统',
      '起课逻辑',
      '案例学习',
    ]);
  });

  it('covers palm why questions', () => {
    expect(PALM_SYSTEM_TOPICS.map((t) => t.id)).toEqual(['layout', 'origin', 'clockwise']);
    expect(CAST_LOGIC_STEPS.map((s) => s.label)).toEqual(['月', '日', '时辰', '落位']);
  });
});
