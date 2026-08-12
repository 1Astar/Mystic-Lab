/**
 * 双盘映照 · 流年时间轴（八字大运/流年 × 紫微流年命宫）
 */
import type { PersonProfile } from '../life/types.ts';
import { buildLuckCycles } from '../bazi/luck-cycles.ts';
import {
  findDayunForYear,
  findLiunianForYear,
} from '../bazi/sense-shuttle.ts';
import { buildYearTrack } from '../ziwei/year-track.ts';
import type { MirrorYearRow } from './types.ts';

function shortPalace(name: string): string {
  return name.replace(/宫$/, '');
}

/** 流年命宫 ↔ 八字十神粗映射，用于「是否同一议题」 */
const PALACE_GOD_HINT: Record<string, string[]> = {
  命: ['比肩', '劫财', '印'],
  兄弟: ['比肩', '劫财'],
  夫妻: ['正财', '偏财', '正官', '七杀'],
  子女: ['食神', '伤官'],
  财帛: ['正财', '偏财'],
  疾厄: ['印', '比肩', '劫财'],
  迁移: ['食神', '伤官', '偏财'],
  仆役: ['比肩', '劫财'],
  交友: ['比肩', '劫财'],
  官禄: ['正官', '七杀', '食神', '伤官'],
  田宅: ['正财', '偏财', '印'],
  福德: ['食神', '伤官', '印'],
  父母: ['正印', '偏印', '正官'],
};

function godsOverlap(stemGod: string, palace: string): boolean {
  if (!stemGod || !palace) return false;
  const key = shortPalace(palace);
  const hints = PALACE_GOD_HINT[key] ?? [];
  return hints.some((h) => stemGod.includes(h));
}

function dayunLabel(
  gz: string,
  stemGod: string,
  empty: boolean,
  start: number,
  end: number,
): string {
  if (empty || !gz) return `童限/未起运（${start}–${end}）`;
  return `${gz}大运${stemGod ? ` · ${stemGod}` : ''}（${start}–${end}）`;
}

function liunianLabel(gz: string, stemGod: string): string {
  if (!gz) return '流年待排';
  return `${gz}流年${stemGod ? ` · ${stemGod}` : ''}`;
}

function compareLine(opts: {
  year: number;
  dayunGz: string;
  dayunGod: string;
  liuGz: string;
  liuGod: string;
  palace: string;
  chip: string;
  mutagen: string;
}): string {
  const palace = shortPalace(opts.palace) || '未定';
  const chip = opts.chip || '流年主场';
  const overlap = godsOverlap(opts.liuGod, opts.palace) || godsOverlap(opts.dayunGod, opts.palace);
  const mutagenBit = opts.mutagen ? `；四化 ${opts.mutagen}` : '';
  if (overlap) {
    return `${opts.year}：八字${opts.liuGz || '流年'}（${opts.liuGod || '动力'}）与紫微流年命落${palace}（${chip}）指向相近议题${mutagenBit}。`;
  }
  return `${opts.year}：八字看${opts.liuGz || '流年'}带来的十神动力（${opts.liuGod || '待明'}），紫微看流年命落${palace}的人生场景（${chip}）${mutagenBit}——两边扫描仪角度不同。`;
}

export function buildMirrorTimeline(opts: {
  person: PersonProfile;
  gender: '' | 'female' | 'male';
  birthYear: number;
  centerYear?: number;
  radius?: number;
  nowYear?: number;
}): MirrorYearRow[] {
  const nowYear = opts.nowYear ?? new Date().getFullYear();
  const center = opts.centerYear ?? nowYear;
  const radius = opts.radius ?? 3;
  const track = buildYearTrack({
    person: opts.person,
    birthYear: opts.birthYear,
    centerYear: center,
    radius,
    nowYear,
  });

  return track.map((item) => {
    const luck = buildLuckCycles(opts.person, opts.gender, item.year, {
      now: new Date(nowYear, 5, 15),
    });
    const dayun = luck ? findDayunForYear(luck, item.year) : null;
    const liu = luck ? findLiunianForYear(luck, item.year) : null;
    const baziDayun = dayun
      ? dayunLabel(
          dayun.ganZhi,
          dayun.stemGod,
          dayun.empty,
          dayun.startYear,
          dayun.endYear,
        )
      : '大运待排';
    const baziLiunian = liu
      ? liunianLabel(liu.ganZhi, liu.stemGod)
      : '流年待排';

    return {
      year: item.year,
      age: item.age,
      current: item.year === nowYear,
      baziDayun,
      baziLiunian,
      ziweiPalace: item.yearPalace,
      ziweiChip: item.chipLabel,
      ziweiMutagen: item.yearMutagenLine,
      compare: compareLine({
        year: item.year,
        dayunGz: dayun && !dayun.empty ? dayun.ganZhi : '',
        dayunGod: dayun && !dayun.empty ? dayun.stemGod : '',
        liuGz: liu?.ganZhi ?? '',
        liuGod: liu?.stemGod ?? '',
        palace: item.yearPalace,
        chip: item.chipLabel,
        mutagen: item.yearMutagenLine,
      }),
    };
  });
}
