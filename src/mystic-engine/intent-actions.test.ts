import { describe, expect, it } from 'vitest';
import {
  formatSceneActionsPlain,
  intentActionsPlain,
  resolveIntentActions,
} from './intent-actions.ts';

describe('resolveIntentActions', () => {
  it('maps career interview question to offer_decide actions', () => {
    const r = resolveIntentActions('今天适合面试吗？', { ctx: null });
    expect(r.primary.id).toBe('offer_decide');
    expect(r.breakthrough.title).toMatch(/条款|核对/);
    expect(r.breakthrough.body.length).toBeGreaterThan(8);
  });

  it('maps love likes to relation pack', () => {
    const r = resolveIntentActions('Chris 喜不喜欢我？', { ctx: null });
    expect(r.primary.id).toBe('love_likes');
    expect(r.breakthrough.title.length).toBeGreaterThan(2);
  });

  it('formats plain string with checklist', () => {
    const plain = formatSceneActionsPlain(
      { id: 'a', title: '主动作', body: '先做这一件。' },
      [{ id: 'b', title: '核对', body: '书面确认。' }],
    );
    expect(plain).toBe('主动作：先做这一件。；核对——书面确认。');
  });

  it('intentActionsPlain returns non-empty for quit question', () => {
    const plain = intentActionsPlain('我要不要离职？', { ctx: null });
    expect(plain).toMatch(/：/);
    expect(plain.length).toBeGreaterThan(12);
  });
});
