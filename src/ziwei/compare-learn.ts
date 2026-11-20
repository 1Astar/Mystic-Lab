/**
 * 图鉴「对照学习」：首批挂载词 + CC BY-NC-SA 署名栏模板
 * 语料源：Renhuai123/nihai-tianji-corpus（天纪短引文，可秒级回放）
 * 产品规则：对照进图鉴；三节看盘课进紫微学习；不进红娘。
 */
import { findCompareCite } from './compare-learn-cites.ts';

export const COMPARE_LEARN_BATCH = 'v1' as const;

export const COMPARE_CORPUS = {
  name: 'nihai-tianji-corpus',
  title: '倪海厦《天纪》结构化语料',
  repoUrl: 'https://github.com/Renhuai123/nihai-tianji-corpus',
  licenseName: 'CC BY-NC-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh',
  /** 原课著作权声明（语料 LICENSE 口径） */
  originalRights: '原课程内容著作权归倪海厦先生及其权利继承人所有。',
  purpose: '对照学习 · 非商业引用',
} as const;

export type CompareMountKind = 'palace' | 'method' | 'star';

export type CompareMountTerm = {
  id: string;
  /** 图鉴/盘面显示名 */
  label: string;
  kind: CompareMountKind;
  /** 天纪语料册（便于日后检索挂载） */
  corpusBook: '01-主星' | '02-十二宫' | '07-方法论';
  /** 对应哪一节看盘课（可多节） */
  lessons: Array<'spouse' | 'dual' | 'year'>;
  why: string;
};

/**
 * 首批挂载：先服务三节课「眼睛跟得上」——
 * 感情下手 / 双宫同读 / 本命·大限·流年，再扩全库。
 */
export const COMPARE_MOUNT_TERMS_V1: readonly CompareMountTerm[] = [
  {
    id: 'palace-命宫',
    label: '命宫',
    kind: 'palace',
    corpusBook: '02-十二宫',
    lessons: ['year'],
    why: '本命层「一直在那里」的锚点；切流年时对照不丢。',
  },
  {
    id: 'palace-夫妻',
    label: '夫妻宫',
    kind: 'palace',
    corpusBook: '02-十二宫',
    lessons: ['spouse', 'dual'],
    why: '第1节第一眼；第2节感情侧。',
  },
  {
    id: 'palace-官禄',
    label: '官禄宫',
    kind: 'palace',
    corpusBook: '02-十二宫',
    lessons: ['dual'],
    why: '第2节事业侧；与夫妻宫同看。',
  },
  {
    id: 'palace-福德',
    label: '福德宫',
    kind: 'palace',
    corpusBook: '02-十二宫',
    lessons: ['spouse', 'dual'],
    why: '天纪常提醒论婚姻兼看福德；带读时点到即可。',
  },
  {
    id: 'palace-财帛',
    label: '财帛宫',
    kind: 'palace',
    corpusBook: '02-十二宫',
    lessons: ['year'],
    why: '命宫三方之一；流年落点常见。',
  },
  {
    id: 'palace-迁移',
    label: '迁移宫',
    kind: 'palace',
    corpusBook: '02-十二宫',
    lessons: ['dual', 'year'],
    why: '外地机会/外出议题；第2节场景常碰到。',
  },
  {
    id: 'method-三方四正',
    label: '三方四正',
    kind: 'method',
    corpusBook: '02-十二宫',
    lessons: ['spouse', 'dual', 'year'],
    why: '整盘跟读的骨架：看一宫必会到的位置。',
  },
  {
    id: 'method-大限',
    label: '大限',
    kind: 'method',
    corpusBook: '07-方法论',
    lessons: ['year'],
    why: '第3节「十年镜头」。',
  },
  {
    id: 'method-流年',
    label: '流年',
    kind: 'method',
    corpusBook: '02-十二宫',
    lessons: ['year'],
    why: '第3节「这一年才用到」的层。',
  },
  {
    id: 'star-紫微',
    label: '紫微',
    kind: 'star',
    corpusBook: '01-主星',
    lessons: ['spouse', 'dual', 'year'],
    why: '主星定性样本；落哪宫怎么读。',
  },
  {
    id: 'star-天府',
    label: '天府',
    kind: 'star',
    corpusBook: '01-主星',
    lessons: ['spouse', 'dual'],
    why: '常与紫微同看的库星。',
  },
  {
    id: 'star-贪狼',
    label: '贪狼',
    kind: 'star',
    corpusBook: '01-主星',
    lessons: ['spouse', 'dual'],
    why: '感情/欲望戏常见主星。',
  },
  {
    id: 'star-武曲',
    label: '武曲',
    kind: 'star',
    corpusBook: '01-主星',
    lessons: ['dual'],
    why: '事业/财气戏常见；双宫课用。',
  },
  {
    id: 'star-七杀',
    label: '七杀',
    kind: 'star',
    corpusBook: '01-主星',
    lessons: ['dual', 'year'],
    why: '压力与决断象；外派/转折场景可对照。',
  },
  {
    id: 'star-天机',
    label: '天机',
    kind: 'star',
    corpusBook: '01-主星',
    lessons: ['year'],
    why: '变动与心思；流年议题常露面。',
  },
] as const;

export type CompareCite = {
  /** 短引文（可选；有则展示） */
  quote?: string;
  bvid?: string;
  part?: number;
  /** 如 00:40:09 */
  tHms?: string;
  /** 语料册内小节名，便于人工核对 */
  sectionNote?: string;
};

export type CompareAttribution = {
  termLabel: string;
  cite?: CompareCite;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 时分秒 → 秒，供 B 站 ?t= */
export function hmsToSeconds(tHms: string): number | null {
  const m = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(tHms.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  const s = Number(m[3]);
  if ([h, min, s].some((n) => Number.isNaN(n))) return null;
  return h * 3600 + min * 60 + s;
}

export function bilibiliPlaybackUrl(cite: CompareCite): string | null {
  if (!cite.bvid) return null;
  const q = new URLSearchParams();
  if (cite.part != null && cite.part > 0) q.set('p', String(cite.part));
  if (cite.tHms) {
    const sec = hmsToSeconds(cite.tHms);
    if (sec != null) q.set('t', String(sec));
  }
  const qs = q.toString();
  return `https://www.bilibili.com/video/${cite.bvid}${qs ? `?${qs}` : ''}`;
}

/**
 * 署名栏模板（无卡片框）：对照引文必带。
 * 要素：来源 · 许可 · 原权利 · 用途 · 语料链 · 可选回放
 */
export function renderCompareAttributionHtml(attr: CompareAttribution): string {
  const { termLabel, cite } = attr;
  const play = cite ? bilibiliPlaybackUrl(cite) : null;
  const stamp =
    cite?.bvid && cite.tHms
      ? `[${cite.bvid}${cite.part != null ? ` p${cite.part}` : ''} @${cite.tHms}]`
      : cite?.sectionNote
        ? cite.sectionNote
        : '';

  return `
  <aside class="zw-compare-attr" aria-label="对照学习署名">
    <p class="zw-compare-attr-kicker">对照学习 · ${escapeHtml(termLabel)}</p>
    ${
      cite?.quote
        ? `<blockquote class="zw-compare-quote"><p>「${escapeHtml(cite.quote)}」</p>${
            stamp ? `<footer>${escapeHtml(stamp)}</footer>` : ''
          }</blockquote>`
        : ''
    }
    <p class="zw-compare-attr-meta">
      来源：${escapeHtml(COMPARE_CORPUS.title)}（${escapeHtml(COMPARE_CORPUS.name)}）
      · 许可 <a href="${COMPARE_CORPUS.licenseUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(COMPARE_CORPUS.licenseName)}</a>
      · ${escapeHtml(COMPARE_CORPUS.purpose)}
    </p>
    <p class="zw-compare-attr-meta">${escapeHtml(COMPARE_CORPUS.originalRights)}</p>
    <p class="zw-compare-attr-meta">
      语料仓库：<a href="${COMPARE_CORPUS.repoUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(COMPARE_CORPUS.repoUrl)}</a>
      · 相同方式共享
    </p>
    <p class="zw-compare-attr-meta">随心而行词条释义与练习为产品原创；引文仅供对照，不作吉凶判决。</p>
    ${
      play
        ? `<p class="zw-compare-attr-play"><a href="${escapeHtml(play)}" target="_blank" rel="noopener noreferrer">▶ 回放原讲这一秒</a></p>`
        : ''
    }
  </aside>`;
}

export function mountsForLesson(
  lesson: CompareMountTerm['lessons'][number],
): CompareMountTerm[] {
  return COMPARE_MOUNT_TERMS_V1.filter((t) => t.lessons.includes(lesson));
}

/** 图鉴词条：有挂载则渲染短引文+署名；无则空串 */
export function renderCompareBlockForTerm(termLabel: string): string {
  const entry = findCompareCite(termLabel);
  if (!entry) return '';
  const display =
    COMPARE_MOUNT_TERMS_V1.find((t) => t.label === termLabel || entry.keys.includes(t.label))
      ?.label ?? entry.keys[0]!;
  return renderCompareAttributionHtml({
    termLabel: display,
    cite: {
      quote: entry.quote,
      bvid: entry.bvid,
      part: entry.part,
      tHms: entry.tHms,
      sectionNote: entry.sectionNote,
    },
  });
}

export const ZIWEI_LEARN_LESSONS = [
  {
    id: 'spouse' as const,
    order: 1,
    title: '想看感情，从哪里下手？',
    lead: '打开原生紫微盘，自己点一次夫妻宫；点不出有提示。再带读一组盘面信息，换盘自练。',
    status: 'ready' as const,
    path: '/ziwei/learn/spouse',
  },
  {
    id: 'dual' as const,
    order: 2,
    title: '工作和感情撞在一起，怎么读？',
    lead: '同居遇上外地工作机会：带着问题看夫妻宫与官禄宫，示范两处线索怎么一起讲。',
    status: 'soon' as const,
    path: '/ziwei/learn/dual',
  },
  {
    id: 'year' as const,
    order: 3,
    title: '为什么偏偏是这一年？',
    lead: '同一张盘来回切本命、大限、流年：哪些一直在，哪些是看这一年才用到。',
    status: 'soon' as const,
    path: '/ziwei/learn/year',
  },
] as const;
