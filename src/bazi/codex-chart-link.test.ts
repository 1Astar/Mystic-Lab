import { describe, expect, it } from 'vitest';
import { buildChartLinkReport } from './codex-chart-link.ts';

describe('codex chart link deep / luck', () => {
  it('luckTrigger detects shensha on current dayun branch', () => {
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
          nayin: '',
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
          branch: '申',
          hideGan: [],
          hideGods: [],
          nayin: '',
          xunKong: '',
          diShi: '',
          ziZuo: '',
          shensha: [],
        },
      ],
      dayMaster: '甲',
      dayMasterWx: '木' as const,
      dayBranch: '申',
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

    const report = buildChartLinkReport('ss:天乙贵人', chart, luck);
    expect(report.luckTrigger).toMatch(/神煞触发/);
    expect(report.deepBrief).toMatch(/【大运·流年】/);
    expect(report.deepBrief).toMatch(/乙丑/);
  });
});
