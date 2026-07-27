import type { DrawnCard } from '../tarot/engine.ts';
import { TAROT_DECK, type CardDefinition } from '../tarot/deck.ts';
import { buildEncounterGuidance } from '../knowledge/encounter-guidance.ts';
import type { ReadingResult } from '../interpretation/types.ts';

export type UnlockResult = {
  isFirstTime: boolean;
  count: number;
  cardName: string;
};

export type CodexProgress = {
  collected: number;
  total: number;
  topSuitLabel: string | null;
  topThemeLabel: string | null;
};

export type CodexSuitProgress = {
  id: string;
  label: string;
  collected: number;
  total: number;
};

/** 按大阿卡纳 / 四组统计已收集张数（唯一牌，非相遇次数） */
export function getCodexSuitBreakdown(): CodexSuitProgress[] {
  const collected = new Set(getAllEntries().map((e) => e.cardId));
  const groups: { id: string; label: string; match: (c: CardDefinition) => boolean }[] = [
    { id: 'major', label: '大阿卡纳', match: (c) => c.arcana === 'major' },
    { id: 'wands', label: '权杖组', match: (c) => c.suit === 'wands' },
    { id: 'cups', label: '圣杯组', match: (c) => c.suit === 'cups' },
    { id: 'swords', label: '宝剑组', match: (c) => c.suit === 'swords' },
    { id: 'pentacles', label: '星币组', match: (c) => c.suit === 'pentacles' },
  ];
  return groups.map((g) => {
    const cards = TAROT_DECK.filter(g.match);
    return {
      id: g.id,
      label: g.label,
      collected: cards.filter((c) => collected.has(c.id)).length,
      total: cards.length,
    };
  });
}

const SUIT_LABELS: Record<string, string> = {
  major: '大阿卡纳',
  wands: '权杖组',
  cups: '圣杯组',
  swords: '宝剑组',
  pentacles: '星币组',
};

export type QuestionTheme = 'work' | 'love' | 'study' | 'self';

const THEME_DISPLAY: Record<QuestionTheme, string> = {
  work: '工作方向',
  love: '感情关系',
  study: '学业成长',
  self: '自我状态',
};

export type CodexEncounter = {
  at: string;
  question: string;
  summary: string;
  reversed: boolean;
  spreadLabel: string;
  /** 关联手札，用于复原完整结果页 */
  journalId?: string;
  /** 当时位次相关的解读要点（建议/阻碍/局面） */
  guidance?: string;
};

export type CodexEntry = {
  cardId: string;
  firstSeenAt: string;
  count: number;
  favorite: boolean;
  personalNote: string;
  encounters: CodexEncounter[];
};

export type CodexStore = {
  entries: Record<string, CodexEntry>;
};

const STORAGE_KEY = 'mystic-lab-codex';

function saveStore(store: CodexStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function isDuplicateEncounter(a: CodexEncounter, b: CodexEncounter): boolean {
  if (a.question.trim() !== b.question.trim()) return false;
  if (a.spreadLabel !== b.spreadLabel) return false;
  if (a.reversed !== b.reversed) return false;
  const dt = Math.abs(new Date(a.at).getTime() - new Date(b.at).getTime());
  return dt < 8000;
}

function dedupeEncounters(encounters: CodexEncounter[]): CodexEncounter[] {
  const out: CodexEncounter[] = [];
  for (const enc of encounters) {
    if (out.some((prev) => isDuplicateEncounter(prev, enc))) continue;
    out.push(enc);
  }
  return out;
}

function sanitizeEntry(entry: CodexEntry): CodexEntry {
  const encounters = dedupeEncounters(entry.encounters);
  return {
    ...entry,
    count: Math.max(encounters.length, 1),
    encounters,
  };
}

function loadStore(): CodexStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: {} };
    const store = JSON.parse(raw) as CodexStore;
    let changed = false;
    for (const [id, entry] of Object.entries(store.entries)) {
      const clean = sanitizeEntry(entry);
      if (clean.count !== entry.count || clean.encounters.length !== entry.encounters.length) {
        store.entries[id] = clean;
        changed = true;
      }
    }
    if (changed) saveStore(store);
    return store;
  } catch {
    return { entries: {} };
  }
}

export function detectQuestionTheme(question: string): QuestionTheme {
  const q = question.trim();
  // 职场优先：离职/转正/试用等具体场景即使夹杂「关系」也锁 work
  if (
    /工作|事业|职场|换工作|找工作|求职|offer|面试|跳槽|升职|项目|辞职|离职|转正|试用|年假|薪资|薪水|裁员|加班|同事|老板|汇报|绩效|合同|入职|兼职|副业|创业|岗|想离开|去留|离开的原因/.test(
      q,
    )
  ) {
    return 'work';
  }
  if (/感情|爱情|恋爱|喜欢|分手|复合|婚姻|伴侣|表白|前任|旧情人/.test(q)) return 'love';
  if (/学业|考试|学习|考研|留学|论文|学校/.test(q)) return 'study';
  return 'self';
}

export function unlockSingleCard(
  drawn: DrawnCard,
  question: string,
  summary: string,
  journalId?: string | null,
): UnlockResult {
  const store = loadStore();
  const now = new Date().toISOString();
  const id = drawn.card.id;
  const existing = store.entries[id];

  const encounter: CodexEncounter = {
    at: now,
    question,
    summary,
    reversed: drawn.reversed,
    spreadLabel: drawn.position ?? '',
    journalId: journalId?.trim() || undefined,
  };

  let isFirstTime = false;
  let count = 1;

  if (existing) {
    if (isDuplicateEncounter(encounter, existing.encounters[0] ?? encounter)) {
      return { isFirstTime: false, count: existing.count, cardName: drawn.card.nameZh };
    }
    existing.count += 1;
    count = existing.count;
    existing.encounters.unshift(encounter);
    existing.encounters = dedupeEncounters(existing.encounters).slice(0, 10);
  } else {
    isFirstTime = true;
    store.entries[id] = {
      cardId: id,
      firstSeenAt: now,
      count: 1,
      favorite: false,
      personalNote: '',
      encounters: [encounter],
    };
  }

  saveStore(store);
  return { isFirstTime, count, cardName: drawn.card.nameZh };
}

/** @deprecated 改用 unlockSingleCard，在抽牌时逐张解锁 */
export function unlockCardsFromReading(
  cards: DrawnCard[],
  question: string,
  summaries: string[],
): void {
  const store = loadStore();
  const now = new Date().toISOString();

  cards.forEach((drawn, i) => {
    const id = drawn.card.id;
    const existing = store.entries[id];
    const encounter: CodexEncounter = {
      at: now,
      question,
      summary: summaries[i] ?? drawn.card.nameZh,
      reversed: drawn.reversed,
      spreadLabel: drawn.position ?? '',
    };

    if (existing) {
      existing.count += 1;
      existing.encounters.unshift(encounter);
      existing.encounters = existing.encounters.slice(0, 10);
    } else {
      store.entries[id] = {
        cardId: id,
        firstSeenAt: now,
        count: 1,
        favorite: false,
        personalNote: '',
        encounters: [encounter],
      };
    }
  });

  saveStore(store);
}

export function getCodexEntry(cardId: string): CodexEntry | undefined {
  return loadStore().entries[cardId];
}

/** 把手札 id 写回对应牌的相遇记录（完成占问时调用） */
export function linkEncountersToJournal(
  journalId: string,
  question: string,
  cardIds: string[],
  aroundIso: string,
  windowMs = 45 * 60 * 1000,
): void {
  const store = loadStore();
  const q = question.trim();
  const t = new Date(aroundIso).getTime();
  let changed = false;

  for (const cardId of cardIds) {
    const entry = store.entries[cardId];
    if (!entry) continue;
    for (const enc of entry.encounters) {
      if (enc.journalId === journalId) continue;
      if (enc.question.trim() !== q) continue;
      const dt = Math.abs(new Date(enc.at).getTime() - t);
      if (dt > windowMs) continue;
      enc.journalId = journalId;
      changed = true;
    }
  }

  if (changed) saveStore(store);
}

/** 用完整解读回填相遇记录的 guidance / summary */
export function enrichEncountersFromReading(
  reading: ReadingResult,
  journalId?: string | null,
): void {
  if (!reading.cards.length) return;
  const store = loadStore();
  const q = (reading.cards[0]?.question ?? reading.questionThread?.answers[0]?.question ?? '').trim();
  const jid = journalId?.trim() || undefined;
  let changed = false;

  reading.cards.forEach((card, i) => {
    const entry = store.entries[card.cardId];
    if (!entry?.encounters.length) return;
    const guidance = buildEncounterGuidance(reading, i);
    if (!guidance) return;

    // 优先匹配同问题 + 同位次的最近一条
    const match =
      entry.encounters.find(
        (e) =>
          (!jid || e.journalId === jid || !e.journalId) &&
          e.question.trim() === q &&
          (e.spreadLabel || '') === (card.position || ''),
      ) ??
      entry.encounters.find(
        (e) => e.question.trim() === q || (jid && e.journalId === jid),
      ) ??
      entry.encounters[0];

    if (!match) return;
    if (jid && !match.journalId) match.journalId = jid;
    if (match.guidance !== guidance) {
      match.guidance = guidance;
      changed = true;
    }
    if (!match.summary || match.summary === card.cardName) {
      match.summary = guidance.slice(0, 120);
      changed = true;
    }
  });

  if (changed) saveStore(store);
}

export function isCardCollected(cardId: string): boolean {
  return !!loadStore().entries[cardId];
}

export function getCodexProgress(totalCards = 78): CodexProgress {
  const entries = getAllEntries();
  const suitCounts: Record<string, number> = {
    major: 0,
    wands: 0,
    cups: 0,
    swords: 0,
    pentacles: 0,
  };
  const themeCounts: Record<QuestionTheme, number> = {
    work: 0,
    love: 0,
    study: 0,
    self: 0,
  };

  for (const entry of entries) {
    const card = TAROT_DECK.find((c) => c.id === entry.cardId);
    if (card) {
      const suitKey = card.arcana === 'major' ? 'major' : (card.suit ?? 'major');
      suitCounts[suitKey] = (suitCounts[suitKey] ?? 0) + entry.count;
    }
    for (const enc of entry.encounters) {
      if (enc.question.trim()) {
        themeCounts[detectQuestionTheme(enc.question)] += 1;
      }
    }
  }

  return {
    collected: entries.length,
    total: totalCards,
    topSuitLabel: pickTop(suitCounts, SUIT_LABELS),
    topThemeLabel: pickTop(themeCounts, THEME_DISPLAY),
  };
}

function pickTop(counts: Record<string, number>, labels: Record<string, string>): string | null {
  let topKey: string | null = null;
  let topVal = 0;
  for (const [key, val] of Object.entries(counts)) {
    if (val > topVal) {
      topVal = val;
      topKey = key;
    }
  }
  if (!topKey || topVal === 0) return null;
  return labels[topKey] ?? null;
}

export function getCollectedCount(): number {
  return Object.keys(loadStore().entries).length;
}

export function toggleFavorite(cardId: string): boolean {
  const store = loadStore();
  const entry = store.entries[cardId];
  if (!entry) return false;
  entry.favorite = !entry.favorite;
  saveStore(store);
  return entry.favorite;
}

export function savePersonalNote(cardId: string, note: string): void {
  const store = loadStore();
  const entry = store.entries[cardId];
  if (!entry) return;
  entry.personalNote = note;
  saveStore(store);
}

export function getAllEntries(): CodexEntry[] {
  return Object.values(loadStore().entries).sort(
    (a, b) => new Date(b.firstSeenAt).getTime() - new Date(a.firstSeenAt).getTime(),
  );
}

export function cardOneLiner(card: CardDefinition, reversed: boolean): string {
  const text = reversed ? card.reversed : card.upright;
  const first = text.split('。')[0];
  return first ? `${first}。` : text.slice(0, 48);
}

const THEME_HINTS: Record<QuestionTheme, string> = {
  work: '在工作与方向的问题里',
  love: '在感情与关系的问题里',
  study: '在学业与成长的问题里',
  self: '在自我状态的问题里',
};

export function themeContextLine(
  card: CardDefinition,
  theme: QuestionTheme,
  reversed: boolean,
): string {
  const kw = card.keywords.join('、');
  const orient = reversed ? '逆位' : '正位';
  const themeLabel = THEME_HINTS[theme];

  const hints: Record<QuestionTheme, Record<string, string>> = {
    work: {
      major: `${themeLabel}，${orient}的「${card.nameZh}」常指向职业路径上的${kw}——留意它是在鼓励行动，还是提醒你先稳住节奏。`,
      minor: `${themeLabel}，这张牌暗示当前职场议题与「${kw}」相关，适合先厘清优先级再作决定。`,
    },
    love: {
      major: `${themeLabel}，${orient}的「${card.nameZh}」往往映照出关系中的${kw}，问问自己在联结与边界之间要怎样取舍。`,
      minor: `${themeLabel}，这张牌在提醒感情里「${kw}」的主题正浮现，诚实面对比急于结论更重要。`,
    },
    study: {
      major: `${themeLabel}，${orient}的「${card.nameZh}」与学习阶段的${kw}相呼应——关注方法是坚持，还是该调整方向。`,
      minor: `${themeLabel}，这张牌指向学业上「${kw}」的课题，把焦虑拆成可执行的小步会更清晰。`,
    },
    self: {
      major: `${themeLabel}，${orient}的「${card.nameZh}」更像一面镜子，照见内在的${kw}，答案仍在你心里。`,
      minor: `${themeLabel}，这张牌邀请你觉察「${kw}」的状态，不必急着定义好坏。`,
    },
  };

  const bucket = card.arcana === 'major' ? 'major' : 'minor';
  return hints[theme][bucket];
}

export function learnTipForCard(card: CardDefinition): string {
  return `小提示：「${card.nameZh}」的关键词是 ${card.keywords.join(' / ')}。以后在图鉴里再遇见它，可以回想当时的问题与感受，会比背定义更有用。`;
}

export function themeMeanings(card: CardDefinition): Record<QuestionTheme, string> {
  return {
    work: `工作：与${card.keywords[0]}、节奏和选择相关，留意是否该主动推进或先整理局面。`,
    love: `感情：涉及${card.keywords[0]}与联结，关注沟通是否真实、边界是否清晰。`,
    study: `学业：关乎${card.keywords[0]}与方法，适合检视计划是否可持续。`,
    self: `自我：映照${card.keywords[0]}与内在状态，先接纳再行动。`,
  };
}
