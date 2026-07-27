import { describe, expect, it } from 'vitest';
import { formatMisreadingFriendly } from './misreading-copy.ts';

describe('formatMisreadingFriendly', () => {
  it('rewrites 误读为 into positive correction', () => {
    expect(
      formatMisreadingFriendly('月亮', '误读为「一定有欺骗」——也可能是自己的焦虑投影。'),
    ).toBe(
      '【月亮】不代表一定有欺骗——也可能是自己的焦虑投影。不要过早下定论。',
    );
  });

  it('keeps already-friendly moon copy', () => {
    const friendly =
      '【月亮】不代表一定有欺骗——它更多指向「未知的恐惧」、「信息的不透明」，或者是自己内心的焦虑投射。不要过早下定论。';
    expect(formatMisreadingFriendly('月亮', friendly)).toBe(friendly);
  });
});
