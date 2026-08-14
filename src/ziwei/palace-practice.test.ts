import { describe, expect, it } from 'vitest';
import {
  buildPalacePracticeTips,
  defaultPalacePracticeTab,
  findPalaceSnap,
  formatPalaceConfigLine,
  formatPalaceHeduLine,
  listPalaceOccupants,
  resolvePalaceListPresence,
} from './palace-practice.ts';
import type { PalaceSnap, ZiweiChartView } from './types.ts';

function palace(
  name: string,
  majors: Array<{ name: string; mutagen?: string }> = [],
  minors: Array<{ name: string }> = [],
): PalaceSnap {
  return {
    name,
    earthlyBranch: '寅',
    heavenlyStem: '甲',
    isSoul: false,
    isBody: false,
    isEmpty: false,
    majors: majors.map((m) => ({
      name: m.name,
      brightness: '旺',
      mutagen: m.mutagen ?? '',
      isMajor: true,
    })),
    minors: minors.map((m) => ({
      name: m.name,
      brightness: '',
      mutagen: '',
      isMajor: false,
    })),
    adjectives: [],
  };
}

function stubView(fuqi: PalaceSnap): ZiweiChartView {
  const palaces = [palace('命宫'), fuqi, palace('官禄')];
  return {
    palaces,
    soulPalace: palaces[0]!,
    bodyPalace: palaces[0]!,
    soul: '紫微',
    body: '天相',
    fiveElementsClass: '水二局',
    solarDate: '2000-1-1',
    timeLabel: '午',
    clockLabel: '',
    trueSolarLabel: '',
    placeNote: '',
    genderLabel: '女',
    intent: 'map',
    theater: {
      headline: '',
      pillars: [],
      comfort: [],
      annual: {
        year: 2026,
        question: '',
        mutagenLine: '流年化忌落夫妻',
        focusPalaces: ['夫妻宫'],
        advice: '亲密议题要说清楚边界。',
        traditional: '',
        forecastGuide: '',
      },
      decade: {
        started: true,
        label: '',
        ageFrom: 20,
        ageTo: 29,
        theme: '',
        palaceName: '命宫',
        majorStars: [],
        mutagenLine: '',
        lead: '',
        guide: '',
        traditional: '',
      },
      litMajorStars: [],
      soulCombo: { leadStar: '紫微', coStars: [], line: '' },
      spotlightStar: '',
      shenshaHighlights: [],
    },
  };
}

describe('palace-practice', () => {
  it('lists 七杀+天钺 in 夫妻宫 and formats config line', () => {
    const fuqi = palace(
      '夫妻宫',
      [{ name: '七杀' }],
      [{ name: '天钺' }],
    );
    const view = stubView(fuqi);
    const snap = findPalaceSnap(view, '夫妻');
    expect(snap?.name).toBe('夫妻宫');
    const occ = listPalaceOccupants(snap);
    expect(occ.map((o) => o.name)).toEqual(expect.arrayContaining(['七杀', '天钺']));
    const line = formatPalaceConfigLine(occ, '夫妻宫');
    expect(line).toContain('七杀');
    expect(line).toContain('天钺');
    expect(line).toContain('跳转星曜图鉴');
    expect(formatPalaceHeduLine(occ)).toBe('主戏七杀、天钺托底');
  });

  it('surfaces annual tip when palace is focus', () => {
    const view = stubView(palace('夫妻宫', [{ name: '七杀' }]));
    const tips = buildPalacePracticeTips('夫妻', '', view);
    expect(tips.some((t) => t.kind === 'annual')).toBe(true);
    expect(tips.find((t) => t.kind === 'annual')?.body).toMatch(/亲密|化忌|边界/);
  });

  it('marks openAttr for atlas jump', () => {
    const occ = listPalaceOccupants(
      palace('夫妻宫', [{ name: '七杀', mutagen: '忌' }], [{ name: '天钺' }]),
    );
    const qi = occ.find((o) => o.name === '七杀');
    const yue = occ.find((o) => o.name === '天钺');
    expect(qi?.openAttr).toBe('data-open-star');
    expect(qi?.mutagen).toBe('忌');
    expect(yue?.openAttr).toBe('data-open-star');
  });

  it('resolves list presence for short cards', () => {
    const view = stubView(
      palace('夫妻宫', [{ name: '七杀' }], [{ name: '天钺' }]),
    );
    const hit = resolvePalaceListPresence('夫妻', '夫妻宫', view);
    expect(hit.stateCls).toBe('is-lit');
    expect(hit.statusLabel).toMatch(/有星/);
    expect(hit.meetLine).toContain('七杀');

    const empty = resolvePalaceListPresence('官禄', '官禄宫', view);
    expect(empty.stateCls).toBe('is-soft');
    expect(empty.statusLabel).toBe('空宫');

    const none = resolvePalaceListPresence('夫妻', '夫妻宫', null);
    expect(none.stateCls).toBe('is-absent');
    expect(none.statusLabel).toBe('未排盘');
  });

  it('defaults detail tab to 配置 when palace has stars', () => {
    const view = stubView(palace('夫妻宫', [{ name: '七杀' }]));
    expect(defaultPalacePracticeTab(view, '夫妻')).toBe('config');
    expect(defaultPalacePracticeTab(view, '官禄')).toBe('core');
    expect(defaultPalacePracticeTab(null, '夫妻')).toBe('core');
  });
});
