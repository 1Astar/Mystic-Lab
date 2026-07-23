import { describe, expect, it } from 'vitest';
import {
  backgroundChipGroups,
  intuitionChipGroups,
  textHasChip,
  toggleChipInText,
} from './pre-reading-chips.ts';

describe('pre-reading-chips', () => {
  it('returns general + theme groups for work questions', () => {
    const bg = backgroundChipGroups('找工作的阻碍是什么？');
    expect(bg).toHaveLength(2);
    expect(bg[0].label).toBe('常见处境');
    expect(bg[1].chips).toContain('已面几家');

    const feel = intuitionChipGroups('找工作的阻碍是什么？');
    expect(feel[0].label).toBe('通用感受');
    expect(feel[1].chips).toContain('像被卡住');
  });

  it('toggles chips in text', () => {
    expect(toggleChipInText('', '有点紧')).toBe('有点紧');
    expect(toggleChipInText('有点紧', '有点松')).toBe('有点紧、有点松');
    expect(toggleChipInText('有点紧、有点松', '有点紧')).toBe('有点松');
    expect(textHasChip('有点紧、像在防守', '像在防守')).toBe(true);
  });
});
