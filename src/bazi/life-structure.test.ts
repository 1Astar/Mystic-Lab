import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { castBaziChart } from './cast.ts';
import { buildLuckCycles } from './luck-cycles.ts';
import {
  buildLifeStructure,
  buildLifeWuxingBars,
  toCraftWuxingBars,
} from './life-structure.ts';
import {
  dayunLoreStageTopic,
  getJiaziDayunLore,
} from './codex-jiazi-dayun-lore.ts';

const PROFILE = {
  ...EMPTY_PROFILE,
  birthYear: '2005',
  birthMonth: '12',
  birthDay: '23',
  birthHour: '8:37',
  birthPlace: '北京',
};

describe('life-structure', () => {
  it('builds bars + copy without 缺什么 talk', () => {
    const chart = castBaziChart(PROFILE, 2026, {
      includeLiunian: false,
      gender: 'female',
    });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const luck = buildLuckCycles(PROFILE, 'female', 2026);
    const pack = buildLifeStructure(chart, { gender: 'female', luck });
    expect(pack.bars).toHaveLength(5);
    expect(pack.headline).toBeTruthy();
    expect(pack.personality).toBeTruthy();
    expect(pack.strength).toBeTruthy();
    expect(pack.environment).toBeTruthy();
    const blob = [
      pack.headline,
      pack.personality,
      pack.strength,
      pack.environment,
      pack.natalWhy.join(' '),
      ...pack.bars.map((b) => `${b.softLabel}${b.tip}`),
      pack.stage?.topic ?? '',
    ].join(' ');
    expect(blob).not.toMatch(/缺什么|命里缺|倒霉|缺行/);
    expect(pack.stage).toBeTruthy();
    if (pack.stage && luck) {
      const dy = luck.dayun.find((d) => d.current && !d.empty);
      if (dy) {
        expect(pack.stage.topic).toBe(dayunLoreStageTopic(dy.ganZhi));
        expect(pack.stage.why.join(' ')).toMatch(getJiaziDayunLore(dy.ganZhi).memory);
      }
    }
  });

  it('craft compat bars share pct with life structure', () => {
    const chart = castBaziChart(PROFILE, 2026, { includeLiunian: false });
    if ('error' in chart) return;
    const life = buildLifeWuxingBars(chart);
    const craft = toCraftWuxingBars(life);
    expect(craft.map((c) => c.pct)).toEqual(life.map((b) => b.pct));
    expect(craft.some((c) => c.dayMaster)).toBe(true);
  });
});
