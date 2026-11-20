/**
 * 红娘排盘：复用 castBaziChart / castZiweiChart
 */
import { castBaziChart, type BaziChart } from '../bazi/cast.ts';
import { describeBranchRelations } from '../bazi/relations.ts';
import { castZiweiChart } from '../ziwei/cast.ts';
import type { PalaceSnap, ZiweiChartView } from '../ziwei/types.ts';
import type { PersonProfile } from '../life/types.ts';
import type { MatchmakerCharacter } from './characters.ts';

export type SpousePalaceSummary = {
  name: string;
  branch: string;
  majorNames: string[];
  minorNames: string[];
  line: string;
};

export type MatchmakerCast = {
  person: PersonProfile;
  bazi: BaziChart;
  ziwei: ZiweiChartView;
  dayStem: string;
  dayBranch: string;
  dayGz: string;
  spousePalace: SpousePalaceSummary;
};

function spouseFromView(view: ZiweiChartView): SpousePalaceSummary {
  const palace: PalaceSnap | undefined =
    view.palaces.find((p) => p.name === '夫妻宫') ??
    view.palaces.find((p) => p.name === '夫妻');
  if (!palace) {
    return {
      name: '夫妻宫',
      branch: '—',
      majorNames: [],
      minorNames: [],
      line: '盘上暂未找到夫妻宫。',
    };
  }
  const majorNames = palace.majors.map((s) => s.name);
  const minorNames = palace.minors.map((s) => s.name);
  const stars =
    majorNames.length > 0
      ? majorNames.join('、')
      : minorNames.length > 0
        ? `辅星 ${minorNames.slice(0, 3).join('、')}`
        : '空宫';
  return {
    name: palace.name,
    branch: palace.earthlyBranch || '—',
    majorNames,
    minorNames,
    line: `夫妻宫落「${palace.earthlyBranch || '—'}」· ${stars}`,
  };
}

export function castMatchmakerPerson(
  person: PersonProfile,
): MatchmakerCast | { error: string } {
  const gender = person.gender === 'female' || person.gender === 'male' ? person.gender : '';
  const bazi = castBaziChart(person, new Date().getFullYear(), {
    gender,
    includeLiunian: false,
  });
  if ('error' in bazi) return { error: bazi.error };

  const ziwei = castZiweiChart(person, { intent: 'map' });
  if ('error' in ziwei) return { error: ziwei.error };

  const dayStem = bazi.dayMaster;
  const dayBranch = bazi.dayBranch;
  return {
    person,
    bazi,
    ziwei,
    dayStem,
    dayBranch,
    dayGz: `${dayStem}${dayBranch}`,
    spousePalace: spouseFromView(ziwei),
  };
}

export function castCharacter(
  ch: MatchmakerCharacter,
): MatchmakerCast | { error: string } {
  return castMatchmakerPerson(ch);
}

/** 两日支关系文案（合/冲等） */
export function dayBranchRelationLines(a: string, b: string): string[] {
  return describeBranchRelations([a, b]);
}

export function hasLiuChong(a: string, b: string): boolean {
  return dayBranchRelationLines(a, b).some((l) => l.includes('相冲'));
}
