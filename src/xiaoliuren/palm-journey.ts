/**
 * 掌上演算等级（Schema V1）：
 * Lv1 认识六神 → Lv2 会看农历 → Lv3 会找时辰
 * → Lv4 完成一次起课 → Lv5 理解结果 → Lv6 自己解释
 */
export type PalmJourneyChapterId =
  | 'gods'
  | 'lunar'
  | 'hour'
  | 'first-cast'
  | 'read-result'
  | 'self-explain';

export type PalmJourneyChapter = {
  id: PalmJourneyChapterId;
  /** 与 Schema Lv 对齐，1–6 */
  level: number;
  order: number;
  title: string;
  subtitle: string;
  body: string[];
  practiceLabel: string;
  practicePath: string;
};

export const PALM_JOURNEY_CHAPTERS: PalmJourneyChapter[] = [
  {
    id: 'gods',
    level: 1,
    order: 1,
    title: '认识六神',
    subtitle: 'Lv1 · 大安 · 留连 · 速喜 · 赤口 · 小吉 · 空亡',
    body: [
      '六神是小六壬的六种落位结果，各自代表一种状态倾向。',
      '不要只看吉凶：看关键词、象征、适合做什么、需要提醒什么。',
      '先建立印象，起课时才知道「落到哪一位」意味着什么。',
    ],
    practiceLabel: '打开六神图鉴',
    practicePath: '/xiaoliuren/codex',
  },
  {
    id: 'lunar',
    level: 2,
    order: 2,
    title: '学会看农历',
    subtitle: 'Lv2 · 起课用农历月与日，不是公历',
    body: [
      '小六壬以农历月、农历日为起数依据。',
      '起课流程里会把公历翻成农历：先认月份，再认日期。',
      '例如「六月初二」——月决定第一步落点，日从上一步继续数。',
    ],
    practiceLabel: '去起课里看翻黄历',
    practicePath: '/xiaoliuren/reading',
  },
  {
    id: 'hour',
    level: 3,
    order: 3,
    title: '学会辨别时辰',
    subtitle: 'Lv3 · 十二时辰与传统别名',
    body: [
      '时辰是起课的最后一环：子夜半、丑鸡鸣、寅平旦……一直到亥人定。',
      '每个时辰约两小时；认得当前时辰，才能从日落点继续把光点数完。',
      '会背别名更好记：例如中午前后是午时 · 日中。',
    ],
    practiceLabel: '打开时辰入门',
    practicePath: '/xiaoliuren/hour-guide',
  },
  {
    id: 'first-cast',
    level: 4,
    order: 4,
    title: '完成一次起课',
    subtitle: 'Lv4 · 时间 → 起数 → 掐指 → 落位',
    body: [
      '完整一次起课：提问 → 确认农历与时辰 → 月、日、时三步顺数 → 得到六神。',
      '建议选「新手模式」：正月起大安，日与时从上一步落点继续，不重回大安。',
      '自己掐指时，默念位数，光点（或指尖）停住就是本步落位。第一次以走通全流程为目标。',
    ],
    practiceLabel: '开始第一次起课',
    practicePath: '/xiaoliuren/reading',
  },
  {
    id: 'read-result',
    level: 5,
    order: 5,
    title: '学会理解结果',
    subtitle: 'Lv5 · 传统含义 → 结合问题 → 建议 → 提醒',
    body: [
      '落课后按五段看：你的问题、传统含义、结合问题、现在更适合、给你的一个提醒。',
      '避免「今天会发财」式断语——小六壬更适合短期趋势与当下选择。',
      '读完结果，可在手札写下感悟，方便对照后来发生了什么。',
    ],
    practiceLabel: '起课并看五段解释',
    practicePath: '/xiaoliuren/reading',
  },
  {
    id: 'self-explain',
    level: 6,
    order: 6,
    title: '学会自己解释',
    subtitle: 'Lv6 · 合上提示，试着用自己的话说明落课',
    body: [
      '至此你已具备：识六神、看农历、找时辰、起一课、读五段。',
      '自己解释的方法：先说本义关键词 → 对照你的问题属于感情/工作/财富/自我哪一类 → 给出一个可执行的小动作。',
      '不必追求像系统文案一样完整；能向朋友讲清楚「为什么落在这、你打算怎么做」就算过关。',
    ],
    practiceLabel: '再起一课并自己复述',
    practicePath: '/xiaoliuren/reading',
  },
];

const STORAGE_KEY = 'mystic-lab-xiaoliuren-palm-journey';

/** 旧版章节 id → 新版 */
const LEGACY_CHAPTER_MAP: Record<string, PalmJourneyChapterId> = {
  'palm-count': 'first-cast',
};

export type PalmJourneyProgress = {
  completed: PalmJourneyChapterId[];
  celebrated: boolean;
};

function emptyProgress(): PalmJourneyProgress {
  return { completed: [], celebrated: false };
}

function normalizeCompleted(raw: string[]): PalmJourneyChapterId[] {
  const valid = new Set(PALM_JOURNEY_CHAPTERS.map((c) => c.id));
  const out: PalmJourneyChapterId[] = [];
  for (const id of raw) {
    const mapped = (LEGACY_CHAPTER_MAP[id] ?? id) as PalmJourneyChapterId;
    if (valid.has(mapped) && !out.includes(mapped)) out.push(mapped);
  }
  return out;
}

export function loadPalmJourneyProgress(): PalmJourneyProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as PalmJourneyProgress;
    if (!parsed || !Array.isArray(parsed.completed)) return emptyProgress();
    return {
      completed: normalizeCompleted(parsed.completed as string[]),
      celebrated: Boolean(parsed.celebrated),
    };
  } catch {
    return emptyProgress();
  }
}

function persist(progress: PalmJourneyProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function isPalmChapterDone(id: PalmJourneyChapterId): boolean {
  return loadPalmJourneyProgress().completed.includes(id);
}

export function markPalmChapterDone(id: PalmJourneyChapterId): PalmJourneyProgress {
  const progress = loadPalmJourneyProgress();
  if (!progress.completed.includes(id)) {
    progress.completed = [...progress.completed, id];
  }
  persist(progress);
  return progress;
}

export function markPalmJourneyCelebrated(): PalmJourneyProgress {
  const progress = loadPalmJourneyProgress();
  progress.celebrated = true;
  persist(progress);
  return progress;
}

export function getPalmJourneyDoneCount(): number {
  return loadPalmJourneyProgress().completed.length;
}

/** 当前已达到的最高等级（0 = 尚未开始） */
export function getPalmJourneyLevel(): number {
  const done = new Set(loadPalmJourneyProgress().completed);
  let level = 0;
  for (const c of PALM_JOURNEY_CHAPTERS) {
    if (done.has(c.id)) level = Math.max(level, c.level);
  }
  return level;
}

export function formatPalmJourneyLevel(level = getPalmJourneyLevel()): string {
  if (level <= 0) return 'Lv0';
  return `Lv${level}`;
}

export function isPalmJourneyComplete(): boolean {
  return getPalmJourneyDoneCount() >= PALM_JOURNEY_CHAPTERS.length;
}

export function getPalmChapter(id: PalmJourneyChapterId): PalmJourneyChapter | undefined {
  return PALM_JOURNEY_CHAPTERS.find((c) => c.id === id);
}

export function getNextPalmChapter(
  currentId: PalmJourneyChapterId,
): PalmJourneyChapter | null {
  const current = getPalmChapter(currentId);
  if (!current) return null;
  return PALM_JOURNEY_CHAPTERS.find((c) => c.order === current.order + 1) ?? null;
}

export function getContinuePalmChapter(): PalmJourneyChapter {
  const done = new Set(loadPalmJourneyProgress().completed);
  return PALM_JOURNEY_CHAPTERS.find((c) => !done.has(c.id)) ?? PALM_JOURNEY_CHAPTERS[0]!;
}
