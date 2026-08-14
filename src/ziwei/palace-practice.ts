/**
 * 宫位详情 · 实战融合：盘内落星 + 日常/流年提示
 */
import { loadAllQuests, weekStartMonday } from '../craft/daily-quest-store.ts';
import type { DailyQuest } from '../craft/daily-quest-types.ts';
import { getStarLore } from './stars.ts';
import { getMinorStarLore } from './minor-star-lore.ts';
import { getShenshaLore } from './shensha-lore.ts';
import { LUCKY_STAR_IDS, SHA_STAR_IDS } from './codex-taxonomy.ts';
import type { PalaceSnap, StarSnap, ZiweiChartView } from './types.ts';

export type PalaceOccupantKind = 'major' | 'lucky' | 'sha' | 'aux' | 'minor' | 'shensha' | 'series';

export type PalaceOccupant = {
  name: string;
  kind: PalaceOccupantKind;
  /** 跳转图鉴用的 data-* 属性名 */
  openAttr: 'data-open-star' | 'data-open-minor' | 'data-open-shensha' | null;
  epithet: string;
  brightness?: string;
  mutagen?: string;
};

export type PalacePracticeTip = {
  kind: 'quest' | 'annual' | 'empty';
  title: string;
  body: string;
  /** 周任务可跳造命 */
  questHref?: string;
};

function palaceKey(name: string): string {
  return name.replace(/宫$/, '').trim();
}

export function findPalaceSnap(
  view: ZiweiChartView | null | undefined,
  palaceId: string,
): PalaceSnap | undefined {
  if (!view?.palaces?.length) return undefined;
  const key = palaceKey(palaceId);
  return view.palaces.find((p) => palaceKey(p.name) === key);
}

function resolveKindAndOpen(name: string, from: 'major' | 'minor' | 'adj' | 'series'): {
  kind: PalaceOccupantKind;
  openAttr: PalaceOccupant['openAttr'];
  epithet: string;
} {
  if (from === 'series') {
    const lore = getShenshaLore(name);
    return {
      kind: 'series',
      openAttr: lore ? 'data-open-shensha' : null,
      epithet: lore?.epithet ?? '十二神',
    };
  }
  if (from === 'major' || getStarLore(name)?.category === 'major') {
    const card = getStarLore(name);
    return {
      kind: 'major',
      openAttr: 'data-open-star',
      epithet: card?.epithet ?? '主星',
    };
  }
  if ((LUCKY_STAR_IDS as readonly string[]).includes(name)) {
    const card = getStarLore(name);
    return { kind: 'lucky', openAttr: 'data-open-star', epithet: card?.epithet ?? '六吉' };
  }
  if ((SHA_STAR_IDS as readonly string[]).includes(name)) {
    const card = getStarLore(name);
    return { kind: 'sha', openAttr: 'data-open-star', epithet: card?.epithet ?? '六煞' };
  }
  if (getStarLore(name)) {
    const card = getStarLore(name)!;
    return { kind: 'aux', openAttr: 'data-open-star', epithet: card.epithet };
  }
  const minor = getMinorStarLore(name);
  if (minor) {
    return { kind: 'minor', openAttr: 'data-open-minor', epithet: minor.epithet };
  }
  const sh = getShenshaLore(name);
  if (sh) {
    return { kind: 'shensha', openAttr: 'data-open-shensha', epithet: sh.epithet };
  }
  return { kind: 'aux', openAttr: null, epithet: '同宫星曜' };
}

function fromSnap(s: StarSnap, from: 'major' | 'minor' | 'adj'): PalaceOccupant {
  const meta = resolveKindAndOpen(s.name, from);
  return {
    name: s.name,
    kind: meta.kind,
    openAttr: meta.openAttr,
    epithet: meta.epithet,
    brightness: s.brightness || undefined,
    mutagen: s.mutagen || undefined,
  };
}

/** 本宫盘内全部落星（主/辅/杂/神煞系列） */
export function listPalaceOccupants(palace: PalaceSnap | undefined): PalaceOccupant[] {
  if (!palace) return [];
  const out: PalaceOccupant[] = [];
  for (const s of palace.majors) out.push(fromSnap(s, 'major'));
  for (const s of palace.minors) out.push(fromSnap(s, 'minor'));
  for (const s of palace.adjectives ?? []) out.push(fromSnap(s, 'adj'));
  for (const s of palace.series ?? []) {
    const meta = resolveKindAndOpen(s.name, 'series');
    out.push({
      name: s.name,
      kind: meta.kind,
      openAttr: meta.openAttr,
      epithet: meta.epithet,
    });
  }
  return out;
}

/** 「这里坐着【七杀】（…）和【天钺】（…）」 */
export function formatPalaceConfigLine(
  occupants: PalaceOccupant[],
  palaceTitle: string,
): string {
  if (!occupants.length) {
    return `你的本命盘里，${palaceTitle}目前没有主辅星同宫（或尚未排盘）。`;
  }
  const focus = occupants.filter((o) => o.kind === 'major' || o.kind === 'lucky' || o.kind === 'sha');
  const pool = focus.length ? focus : occupants.slice(0, 4);
  const bits = pool.map((o) => {
    const hua = o.mutagen ? `·化${o.mutagen}` : '';
    return `【${o.name}${hua}】（${o.epithet}）`;
  });
  if (bits.length === 1) return `这里坐着${bits[0]}。点击可跳转星曜图鉴。`;
  const last = bits.pop()!;
  return `这里坐着${bits.join('、')}和${last}。点击可跳转星曜图鉴。`;
}

function starLabel(o: PalaceOccupant): string {
  return o.mutagen ? `${o.name}化${o.mutagen}` : o.name;
}

/**
 * 合读一句：把本宫落星收成戏份关系，如「主戏七杀、天钺托底」。
 */
export function formatPalaceHeduLine(occupants: PalaceOccupant[]): string | null {
  if (!occupants.length) return null;
  const majors = occupants.filter((o) => o.kind === 'major');
  const luckies = occupants.filter((o) => o.kind === 'lucky');
  const shas = occupants.filter((o) => o.kind === 'sha');
  const aux = occupants.filter((o) => o.kind === 'aux');
  const parts: string[] = [];

  if (majors.length === 1) {
    parts.push(`主戏${starLabel(majors[0]!)}`);
  } else if (majors.length >= 2) {
    parts.push(`主戏${starLabel(majors[0]!)}·${starLabel(majors[1]!)}同台`);
  }

  if (luckies.length === 1) {
    parts.push(`${starLabel(luckies[0]!)}托底`);
  } else if (luckies.length >= 2) {
    parts.push(`${luckies.map(starLabel).slice(0, 2).join('·')}托底`);
  }

  if (shas.length === 1) {
    parts.push(`${starLabel(shas[0]!)}作刺`);
  } else if (shas.length >= 2) {
    parts.push(`${shas.map(starLabel).slice(0, 2).join('·')}压场`);
  }

  if (!parts.length && aux.length) {
    parts.push(`${aux.map(starLabel).slice(0, 2).join('·')}助阵`);
  }

  if (!parts.length) {
    const soft = occupants.slice(0, 2).map(starLabel);
    parts.push(soft.length === 1 ? `${soft[0]}点染` : `${soft.join('·')}点染`);
  }

  return parts.join('、');
}

export function findWeekQuestForPalace(
  palaceId: string,
  userId: string,
): DailyQuest | null {
  const key = palaceKey(palaceId);
  const ws = weekStartMonday();
  const pool = loadAllQuests().filter(
    (q) =>
      q.userId === userId &&
      (q.status === 'todo' || q.status === 'doing') &&
      (q.questDate === ws ||
        q.questDate.startsWith(ws.slice(0, 7)) ||
        q.cadence === 'daily'),
  );
  const hit =
    pool.find((q) =>
      [q.topic, q.origin, q.taskTitle, q.taskDescription].some((t) => {
        const s = String(t || '');
        return s.includes(key) || s.includes(`${key}宫`);
      }),
    ) ?? null;
  return hit;
}

/** 日常提示：优先本周任务，其次流年焦点宫 */
export function buildPalacePracticeTips(
  palaceId: string,
  userId: string,
  view: ZiweiChartView | null | undefined,
): PalacePracticeTip[] {
  const tips: PalacePracticeTip[] = [];
  const quest = userId ? findWeekQuestForPalace(palaceId, userId) : null;
  if (quest) {
    tips.push({
      kind: 'quest',
      title: quest.cadence === 'weekly' ? '本周任务' : '今日功课',
      body: `${quest.taskTitle} — ${quest.taskDescription}`.slice(0, 220),
      questHref: '/craft',
    });
  }

  const annual = view?.theater?.annual;
  const key = palaceKey(palaceId);
  const focusHit = annual?.focusPalaces?.some((p) => palaceKey(p) === key);
  if (annual && focusHit) {
    tips.push({
      kind: 'annual',
      title: `${annual.year}流年 · 本宫在焦点`,
      body: [annual.mutagenLine, annual.advice].filter(Boolean).join(' ').slice(0, 220),
    });
  } else if (annual?.shenshaLine && annual.shenshaLine.includes(key)) {
    tips.push({
      kind: 'annual',
      title: `${annual.year}流年 · 神煞叠读`,
      body: annual.shenshaLine.slice(0, 220),
    });
  }

  if (!tips.length) {
    tips.push({
      kind: 'empty',
      title: '日常提示',
      body: '本周暂无挂到此宫的任务。回完整命盘点本宫，或接造命周常，会把「练什么」送到这里。',
    });
  }
  return tips;
}

/** 十二宫短卡 · 盘内存在感（对齐八字 presence / 主星短卡状态） */
export type PalaceListPresence = {
  /** 卡片 class：有星 lit / 空宫 soft / 未排盘 absent */
  stateCls: 'is-lit' | 'is-soft' | 'is-absent';
  statusLabel: string;
  /** 角标：命宫 / 身宫 / 命·身 */
  roleBadge: string | null;
  /** 📍 本盘：七杀 · 天钺 */
  meetLine: string | null;
  /** 缩略字：夫妻 → 夫妻 */
  glyph: string;
};

export function resolvePalaceListPresence(
  palaceId: string,
  palaceTitle: string,
  view: ZiweiChartView | null | undefined,
): PalaceListPresence {
  const glyph = palaceTitle.replace(/宫$/, '').slice(0, 2) || palaceTitle.slice(0, 2);
  if (!view?.palaces?.length) {
    return {
      stateCls: 'is-absent',
      statusLabel: '未排盘',
      roleBadge: null,
      meetLine: null,
      glyph,
    };
  }
  const snap = findPalaceSnap(view, palaceId);
  const roleBits = [
    snap?.isSoul ? '命宫' : '',
    snap?.isBody ? '身宫' : '',
  ].filter(Boolean);
  const roleBadge = roleBits.length ? roleBits.join(' · ') : null;
  const occupants = listPalaceOccupants(snap);
  const focus = occupants.filter(
    (o) => o.kind === 'major' || o.kind === 'lucky' || o.kind === 'sha',
  );
  const names = (focus.length ? focus : occupants).slice(0, 3).map((o) => o.name);

  if (!names.length) {
    return {
      stateCls: 'is-soft',
      statusLabel: '空宫',
      roleBadge,
      meetLine: '📍 本盘空宫',
      glyph,
    };
  }
  return {
    stateCls: 'is-lit',
    statusLabel: roleBadge ? `${roleBadge} · 有星` : '本盘有星',
    roleBadge,
    meetLine: `📍 本盘：${names.join(' · ')}${occupants.length > names.length ? '…' : ''}`,
    glyph,
  };
}

/** 宫位详情 Tab：议题 · 配置 · 提示 */
export type PalacePracticeTab = 'core' | 'config' | 'tips';

export const PALACE_PRACTICE_TAB_LABEL: Record<PalacePracticeTab, string> = {
  core: '是什么',
  config: '在你身上',
  tips: '练一题',
};

export const PALACE_PRACTICE_TAB_ORDER: PalacePracticeTab[] = ['core', 'config', 'tips'];

export function defaultPalacePracticeTab(
  view: ZiweiChartView | null | undefined,
  palaceId: string,
): PalacePracticeTab {
  const snap = findPalaceSnap(view, palaceId);
  const occ = listPalaceOccupants(snap);
  return occ.length ? 'config' : 'core';
}
