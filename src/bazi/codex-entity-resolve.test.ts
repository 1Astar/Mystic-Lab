import { describe, expect, it } from 'vitest';
import {
  answerFromCodexEntity,
  resolveCodexEntityId,
  buildCodexDepthSummary,
} from './codex-entity-resolve.ts';

describe('codex entity resolve', () => {
  it('resolves stem / tengod / shensha / nayin / jiazi', () => {
    expect(resolveCodexEntityId('甲')).toBe('甲');
    expect(resolveCodexEntityId('甲木')).toBe('甲');
    expect(resolveCodexEntityId('正官')).toBe('tg:正官');
    expect(resolveCodexEntityId('天乙贵人')).toBe('ss:天乙贵人');
    expect(resolveCodexEntityId('海中金')).toBe('ny:海中金');
    expect(resolveCodexEntityId('甲子')).toBe('jz:甲子');
  });

  it('chart brief and atlas brief share same entity', () => {
    const atlas = answerFromCodexEntity('天乙贵人', { depth: 'atlas' });
    expect(atlas.hit).toBe(true);
    expect(atlas.entityId).toBe('ss:天乙贵人');
    expect(atlas.answer).toMatch(/天乙|贵人/);

    const sum = buildCodexDepthSummary('甲', null);
    expect(sum?.entityId).toBe('甲');
    expect(sum?.atlasBrief).toMatch(/甲木|大树/);
  });

  it('changsheng peek includes chart pillar hits when chart given', () => {
    const chart = {
      pillars: [
        {
          key: 'year' as const,
          title: '年柱',
          stemGod: '',
          stem: '甲',
          branch: '子',
          hideGan: [],
          hideGods: [],
          nayin: '',
          xunKong: '',
          diShi: '沐浴',
          ziZuo: '长生',
          shensha: [],
        },
        {
          key: 'day' as const,
          title: '日柱',
          stemGod: '',
          stem: '甲',
          branch: '申',
          hideGan: [],
          hideGods: [],
          nayin: '',
          xunKong: '',
          diShi: '绝',
          ziZuo: '绝',
          shensha: [],
        },
      ],
      dayMaster: '甲',
      dayMasterWx: '木' as const,
      dayBranch: '申',
      yearBranch: '子',
      relations: [],
      season: [],
      place: {} as never,
      clockLabel: '',
      trueSolarLabel: '',
      hasHour: false,
      liunianYear: 2026,
      birthYear: 1990,
    };
    const got = answerFromCodexEntity('绝', { chart, depth: 'chart' });
    expect(got.hit).toBe(true);
    expect(got.answer).toMatch(/日柱/);
    expect(got.answer).toMatch(/地势落在/);
    expect(got.answer).toMatch(/自坐落在/);
  });
});
