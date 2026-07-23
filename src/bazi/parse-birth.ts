/** 解析档案中的时辰 / 钟点 */

export type ParsedHour =
  | { kind: 'clock'; hour: number; minute: number; label: string }
  | { kind: 'shichen'; hour: number; minute: number; label: string; branch: string }
  | { kind: 'none' };

const SHICHEN: { branch: string; aliases: string[]; midHour: number; midMinute: number }[] = [
  { branch: '子', aliases: ['子时', '子'], midHour: 0, midMinute: 0 },
  { branch: '丑', aliases: ['丑时', '丑'], midHour: 2, midMinute: 0 },
  { branch: '寅', aliases: ['寅时', '寅'], midHour: 4, midMinute: 0 },
  { branch: '卯', aliases: ['卯时', '卯'], midHour: 6, midMinute: 0 },
  { branch: '辰', aliases: ['辰时', '辰'], midHour: 8, midMinute: 0 },
  { branch: '巳', aliases: ['巳时', '巳'], midHour: 10, midMinute: 0 },
  { branch: '午', aliases: ['午时', '午'], midHour: 12, midMinute: 0 },
  { branch: '未', aliases: ['未时', '未'], midHour: 14, midMinute: 0 },
  { branch: '申', aliases: ['申时', '申'], midHour: 16, midMinute: 0 },
  { branch: '酉', aliases: ['酉时', '酉'], midHour: 18, midMinute: 0 },
  { branch: '戌', aliases: ['戌时', '戌'], midHour: 20, midMinute: 0 },
  { branch: '亥', aliases: ['亥时', '亥'], midHour: 22, midMinute: 0 },
];

export function parseBirthHour(raw: string): ParsedHour {
  const text = raw.trim();
  if (!text) return { kind: 'none' };

  const clock = text.match(/^(\d{1,2})[:：点时](\d{1,2})?/);
  if (clock) {
    const hour = Number(clock[1]);
    const minute = clock[2] !== undefined ? Number(clock[2]) : 0;
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return {
        kind: 'clock',
        hour,
        minute,
        label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      };
    }
  }

  const compact = text.match(/^(\d{1,2})点(半)?$/);
  if (compact) {
    const hour = Number(compact[1]);
    const minute = compact[2] ? 30 : 0;
    if (hour >= 0 && hour <= 23) {
      return {
        kind: 'clock',
        hour,
        minute,
        label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      };
    }
  }

  for (const s of SHICHEN) {
    for (const alias of s.aliases) {
      if (text === alias || text.includes(alias)) {
        // 避免「子」误匹配「子午」等：优先完整「X时」
        if (alias.length === 1 && text.length > 1 && !text.includes(`${alias}时`)) {
          continue;
        }
        return {
          kind: 'shichen',
          hour: s.midHour,
          minute: s.midMinute,
          label: `${s.branch}时`,
          branch: s.branch,
        };
      }
    }
  }

  // 单字地支
  for (const s of SHICHEN) {
    if (text === s.branch) {
      return {
        kind: 'shichen',
        hour: s.midHour,
        minute: s.midMinute,
        label: `${s.branch}时`,
        branch: s.branch,
      };
    }
  }

  return { kind: 'none' };
}

export type BirthParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  hasHour: boolean;
  hourLabel: string;
};

export function parseBirthParts(
  birthYear: string,
  birthMonth: string,
  birthDay: string,
  birthHour: string,
): BirthParts | null {
  const year = Number(birthYear.trim());
  const month = Number(birthMonth.trim());
  const day = Number(birthDay.trim());
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const parsed = parseBirthHour(birthHour);
  if (parsed.kind === 'none') {
    return {
      year,
      month,
      day,
      hour: 12,
      minute: 0,
      hasHour: false,
      hourLabel: '未填时辰',
    };
  }
  return {
    year,
    month,
    day,
    hour: parsed.hour,
    minute: parsed.minute,
    hasHour: true,
    hourLabel: parsed.label,
  };
}
