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

  it('deep brief fills 四柱 + 大运流年 from same entity (with chart)', () => {
    const chart = {
      pillars: [
        {
          key: 'year' as const,
          title: '年柱',
          stemGod: '',
          stem: '庚',
          branch: '午',
          hideGan: [],
          hideGods: [],
          nayin: '路旁土',
          xunKong: '',
          diShi: '',
          ziZuo: '',
          shensha: [],
        },
        {
          key: 'month' as const,
          title: '月柱',
          stemGod: '',
          stem: '戊',
          branch: '寅',
          hideGan: [],
          hideGods: [],
          nayin: '',
          xunKong: '',
          diShi: '',
          ziZuo: '',
          shensha: [],
        },
        {
          key: 'day' as const,
          title: '日柱',
          stemGod: '',
          stem: '甲',
          branch: '丑',
          hideGan: [],
          hideGods: [],
          nayin: '',
          xunKong: '',
          diShi: '',
          ziZuo: '',
          shensha: ['天乙贵人'],
        },
      ],
      dayMaster: '甲',
      dayMasterWx: '木' as const,
      dayBranch: '丑',
      yearBranch: '午',
      relations: [],
      season: [],
      place: {} as never,
      clockLabel: '',
      trueSolarLabel: '',
      hasHour: false,
      liunianYear: 2026,
      birthYear: 1990,
    };
    const luck = {
      dayGan: '甲',
      dayXunKong: '',
      qiYunLabel: '',
      jiaoYunLabel: '',
      ageNow: 36,
      dayun: [
        {
          ganZhi: '乙丑',
          stem: '乙',
          branch: '丑',
          stemGod: '',
          branchGod: '',
          startYear: 2020,
          endYear: 2029,
          startAge: 30,
          endAge: 39,
          empty: false,
          current: true,
        },
      ],
      liunian: [
        {
          year: 2026,
          age: 36,
          ganZhi: '丙午',
          stem: '丙',
          branch: '午',
          stemGod: '',
          branchGod: '',
          xiaoYunGanZhi: '',
          current: true,
          selected: true,
        },
      ],
      liuyue: [],
    };

    const noChart = answerFromCodexEntity('天乙贵人', { depth: 'deep' });
    expect(noChart.hit).toBe(true);
    expect(noChart.answer).toMatch(/深度解析/);
    expect(noChart.answer).toMatch(/排盘/);

    const deep = answerFromCodexEntity('天乙贵人', {
      chart,
      luck,
      depth: 'deep',
    });
    expect(deep.hit).toBe(true);
    expect(deep.answer).toMatch(/【四柱落点】/);
    expect(deep.answer).toMatch(/日柱/);
    expect(deep.answer).toMatch(/落点释义/);
    expect(deep.answer).toMatch(/【大运·流年】/);
    expect(deep.answer).toMatch(/乙丑|神煞触发|触发/);
    expect(deep.answer).toMatch(/使用边界/);

    const chartLayer = answerFromCodexEntity('天乙贵人', {
      chart,
      luck,
      depth: 'chart',
    });
    expect(chartLayer.answer).not.toMatch(/【四柱落点】/);
    expect(chartLayer.answer).toMatch(/日柱|出现/);
  });
});
