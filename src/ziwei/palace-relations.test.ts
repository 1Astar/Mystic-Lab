import { describe, expect, it } from 'vitest';
import { createSelfPerson, EMPTY_PROFILE } from '../life/types.ts';
import { castZiweiChart } from './cast.ts';
import {
  branchLinksForPalace,
  feixingFromPalace,
  sanfangSizheng,
  STEM_MUTAGEN,
} from './palace-relations.ts';

describe('palace-relations', () => {
  it('命宫三方四正含对宫与两座三合', () => {
    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '1996',
      birthMonth: '8',
      birthDay: '12',
      birthHour: '8:37',
    });
    person.gender = 'female';
    const view = castZiweiChart(person, { intent: 'map', year: 2026 });
    expect('error' in view).toBe(false);
    if ('error' in view) return;

    const rel = sanfangSizheng(view, view.soulPalace);
    expect(rel.sizheng.length).toBe(4);
    expect(rel.opposite).toBeTruthy();
    expect(rel.sanhe).toHaveLength(2);
    expect(rel.self.name).toBe('命宫');
    // 命宫对宫固定为迁移（宫名序）
    expect(rel.opposite!.name).toBe('迁移');
    const sanNames = rel.sanhe.map((p) => p.name).sort();
    expect(sanNames).toEqual(['官禄', '财帛'].sort());
  });

  it('天干四化表为禄权科忌四星', () => {
    expect(STEM_MUTAGEN.甲).toEqual(['廉贞', '破军', '武曲', '太阳']);
    expect(STEM_MUTAGEN.癸?.[3]).toBe('贪狼');
  });

  it('宫干飞星可落到盘内宫位', () => {
    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '1996',
      birthMonth: '8',
      birthDay: '12',
      birthHour: '8:37',
    });
    person.gender = 'female';
    const view = castZiweiChart(person, { intent: 'map', year: 2026 });
    if ('error' in view) return;
    const arrows = feixingFromPalace(view, view.soulPalace);
    expect(arrows.length).toBeGreaterThan(0);
    expect(arrows.every((a) => ['禄', '权', '科', '忌'].includes(a.kind))).toBe(true);
  });

  it('地支关系含冲或合', () => {
    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '1996',
      birthMonth: '8',
      birthDay: '12',
      birthHour: '8:37',
    });
    person.gender = 'female';
    const view = castZiweiChart(person, { intent: 'map', year: 2026 });
    if ('error' in view) return;
    const links = branchLinksForPalace(view, view.soulPalace);
    expect(links.some((l) => l.kind === '冲')).toBe(true);
  });
});
