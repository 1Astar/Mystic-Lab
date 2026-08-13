import { describe, expect, it } from 'vitest';
import { evaluateComboFormation } from './combo-formation.ts';
import type { PalaceSnap, ZiweiChartView } from './types.ts';

function palace(
  name: string,
  branch: string,
  majors: string[] = [],
  minors: string[] = [],
): PalaceSnap {
  return {
    name,
    earthlyBranch: branch,
    heavenlyStem: '甲',
    isSoul: name === '命宫',
    isBody: false,
    majors: majors.map((n) => ({ name: n })),
    minors: minors.map((n) => ({ name: n })),
    adjectives: [],
  } as PalaceSnap;
}

/** 十二宫按常见序，地支子起命便于控三方 */
function stubView(overrides: Partial<Record<string, { majors?: string[]; minors?: string[] }>>): ZiweiChartView {
  const order: Array<[string, string]> = [
    ['命宫', '子'],
    ['兄弟', '丑'],
    ['夫妻', '寅'],
    ['子女', '卯'],
    ['财帛', '辰'],
    ['疾厄', '巳'],
    ['迁移', '午'],
    ['仆役', '未'],
    ['官禄', '申'],
    ['田宅', '酉'],
    ['福德', '戌'],
    ['父母', '亥'],
  ];
  const palaces = order.map(([name, br]) => {
    const o = overrides[name] ?? {};
    return palace(name, br, o.majors ?? [], o.minors ?? []);
  });
  const soul = palaces[0]!;
  return {
    palaces,
    soulPalace: soul,
    bodyPalace: soul,
    soul: '紫微',
    body: '天相',
    fiveElementsClass: '水二局',
    theater: { headline: '测' },
  } as unknown as ZiweiChartView;
}

describe('combo-formation', () => {
  it('locks without chart', () => {
    const ev = evaluateComboFormation(['七杀', '破军', '贪狼'], null);
    expect(ev.status).toBe('locked');
    expect(ev.progress).toBe(0);
  });

  it('completes 杀破狼 when three sit in one 三方四正', () => {
    // 命子、财帛辰(+4)、官禄申(+8) 为命宫三合；迁移午为对宫
    const view = stubView({
      命宫: { majors: ['七杀'] },
      财帛: { majors: ['破军'] },
      官禄: { majors: ['贪狼'] },
    });
    const ev = evaluateComboFormation(['七杀', '破军', '贪狼'], view);
    expect(ev.status).toBe('complete');
    expect(ev.progress).toBe(1);
    expect(ev.focusPalace).toBeTruthy();
  });

  it('stays partial when only two of 杀破狼会照', () => {
    const view = stubView({
      命宫: { majors: ['七杀'] },
      迁移: { majors: ['破军'] }, // 对宫会照
      仆役: { majors: ['贪狼'] }, // 与命/迁不在同一三方
    });
    const ev = evaluateComboFormation(['七杀', '破军', '贪狼'], view);
    expect(ev.status).toBe('partial');
    expect(ev.litMembers.sort()).toEqual(['七杀', '破军'].sort());
    expect(ev.missingMembers).toEqual(['贪狼']);
  });

  it('completes 紫府 when same palace', () => {
    const view = stubView({
      命宫: { majors: ['紫微', '天府'] },
    });
    const ev = evaluateComboFormation(['紫微', '天府'], view);
    expect(ev.status).toBe('complete');
  });

  it('completes mutagen combo when 化禄权科忌 all on plate', () => {
    const view = stubView({
      命宫: { majors: ['廉贞'] },
    });
    // inject mutagen on majors
    view.palaces[0]!.majors[0] = { name: '廉贞', mutagen: '禄' } as never;
    view.palaces[1]!.majors = [{ name: '破军', mutagen: '权' } as never];
    view.palaces[2]!.majors = [{ name: '武曲', mutagen: '科' } as never];
    view.palaces[3]!.majors = [{ name: '太阳', mutagen: '忌' } as never];
    const ev = evaluateComboFormation(['化禄', '化权', '化科', '化忌'], view);
    expect(ev.status).toBe('complete');
  });

  it('does not complete merely because stars exist far apart', () => {
    const view = stubView({
      命宫: { majors: ['天机'] },
      夫妻: { majors: ['太阴'] },
      疾厄: { majors: ['天同'] },
      仆役: { majors: ['天梁'] },
    });
    const ev = evaluateComboFormation(['天机', '太阴', '天同', '天梁'], view);
    expect(ev.status).not.toBe('complete');
  });
});
