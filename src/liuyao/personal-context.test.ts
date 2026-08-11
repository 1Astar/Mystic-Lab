import { describe, expect, it } from 'vitest';
import {
  formatPersonalContextLines,
  hasPersonalContext,
  PERSONAL_CONTEXT_HINTS,
  personalContextFieldsHtml,
} from './personal-context.ts';

describe('personal-context', () => {
  it('renders one card with jump tags and placeholder attrs (not body text)', () => {
    const html = personalContextFieldsHtml('p');
    expect(html).toContain('data-ctx-jump="experience"');
    expect(html).toContain('data-placeholder=');
    expect(html).toContain(PERSONAL_CONTEXT_HINTS.experience);
    expect(html).toContain('contenteditable="true"');
    expect(html).not.toMatch(
      new RegExp(`>${PERSONAL_CONTEXT_HINTS.experience.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<`),
    );
  });

  it('formats only filled fields for the model', () => {
    expect(hasPersonalContext(EMPTY())).toBe(false);
    const ctx = {
      experience: '待了两年',
      goal: '',
      events: '',
      worry: '怕空窗',
    };
    expect(hasPersonalContext(ctx)).toBe(true);
    const lines = formatPersonalContextLines(ctx).join('\n');
    expect(lines).toMatch(/两年/);
    expect(lines).toMatch(/空窗/);
  });
});

function EMPTY() {
  return { experience: '', goal: '', events: '', worry: '' };
}
