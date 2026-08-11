import { describe, expect, it } from 'vitest';
import { detectIntents } from './intent.ts';

describe('detectIntents', () => {
  it('splits salary + stay/leave from dual question', () => {
    const hits = detectIntents(
      '转正能不能拿到8k？我要不要留在冠英？8月初要不要离职？',
    );
    const ids = hits.map((h) => h.id);
    expect(
      ids.some((id) => id === 'salary_negotiate' || id === 'probation_convert'),
    ).toBe(true);
    expect(ids.some((id) => id === 'quit_vs_stay' || id === 'quit_now')).toBe(
      true,
    );
  });

  it('maps probation + salary phrasing', () => {
    const hits = detectIntents('转正能不能拿到8k？');
    expect(hits.some((h) => h.id === 'probation_convert' || h.id === 'salary_negotiate')).toBe(
      true,
    );
  });

  it('maps job search window', () => {
    const hits = detectIntents(
      '我在2026年7月底主动离开目前公司，未来三个月的求职、收入与整体发展如何？',
    );
    const ids = hits.map((h) => h.id);
    expect(
      ids.some((id) =>
        ['job_search_window', 'quit_now', 'salary_negotiate', 'open_explore', 'timing'].includes(
          id,
        ),
      ),
    ).toBe(true);
  });

  it('does not treat bare 离开/留下 as career quit', () => {
    expect(detectIntents('他会离开我吗').map((h) => h.id)).not.toContain('quit_now');
    expect(detectIntents('他会离开我吗').map((h) => h.id)).toContain('love_stay_leave');
    expect(detectIntents('留下回忆就好').map((h) => h.id)).not.toContain('quit_vs_stay');
    expect(detectIntents('我想离开这里去旅行').map((h) => h.id)).not.toContain(
      'quit_now',
    );
    expect(detectIntents('要不要分手').map((h) => h.id)).toContain('love_stay_leave');
    expect(detectIntents('我要不要留在这家公司').map((h) => h.id)).toContain(
      'quit_vs_stay',
    );
  });

  it('maps new catalog intents', () => {
    expect(detectIntents('我想内部转岗去产品组').map((h) => h.id)).toContain(
      'career_transfer',
    );
    expect(detectIntents('今年能不能晋升').map((h) => h.id)).toContain(
      'career_promote',
    );
    expect(detectIntents('要不要辞职创业').map((h) => h.id)).toContain(
      'career_startup',
    );
    expect(detectIntents('我们现在算暧昧吗').map((h) => h.id)).toContain(
      'love_ambiguous',
    );
    expect(detectIntents('能不能复合').map((h) => h.id)).toContain(
      'love_reunion',
    );
    expect(detectIntents('今年该不该结婚').map((h) => h.id)).toContain(
      'love_marriage',
    );
    expect(detectIntents('这只基金还要不要加仓').map((h) => h.id)).toContain(
      'wealth_invest',
    );
    expect(detectIntents('要不要花两万报课').map((h) => h.id)).toContain(
      'wealth_spend',
    );
    expect(detectIntents('考研还是工作怎么选').map((h) => h.id)[0]).toMatch(
      /growth_study|growth_choice/,
    );
    expect(detectIntents('我的五年职业规划对不对').map((h) => h.id)).toContain(
      'growth_plan',
    );
  });
});
