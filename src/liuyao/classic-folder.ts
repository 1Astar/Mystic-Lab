import type { CastResult } from './engine.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { formatClauseHtml } from './format-clause.ts';
import { glossDaXiang, glossLine } from './classic-gloss.ts';
import { HEXAGRAMS, LINE_LABELS, type Hexagram } from './hexagrams.ts';
import { navigate } from '../router.ts';
import { teachFold } from './flip-teach.ts';

export type ClassicLine = {
  classic: string;
  note: string;
};

export type ClassicDossier = {
  name: string;
  modern: string;
  judgment?: string;
  daXiang?: string;
  anecdote: string;
  zengshan?: string;
  lines: Partial<Record<number, ClassicLine>>;
  hasSeed: boolean;
};

const FAV_KEY = 'mystic-lab-liuyao-classic-fav';
const SEEN_KEY = 'mystic-lab-liuyao-classic-seen';

function readNames(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeNames(key: string, names: string[]): void {
  localStorage.setItem(key, JSON.stringify(names.slice(0, 120)));
}

export function listClassicFavorites(): string[] {
  return readNames(FAV_KEY);
}

export function listClassicSeen(): string[] {
  return readNames(SEEN_KEY);
}

export function markClassicSeen(name: string): void {
  const list = readNames(SEEN_KEY);
  if (!list.includes(name)) {
    list.unshift(name);
    writeNames(SEEN_KEY, list);
  }
}

export function toggleClassicFavorite(name: string): boolean {
  const list = readNames(FAV_KEY);
  const i = list.indexOf(name);
  if (i >= 0) {
    list.splice(i, 1);
    writeNames(FAV_KEY, list);
    return false;
  }
  list.unshift(name);
  writeNames(FAV_KEY, list);
  return true;
}

export function isClassicFavorite(name: string): boolean {
  return readNames(FAV_KEY).includes(name);
}

function hexByName(name: string): Hexagram | undefined {
  return HEXAGRAMS.find((h) => h.name === name);
}

export function resolveClassicDossier(name: string): ClassicDossier {
  const corpus = getClassicCorpus(name);
  const h = hexByName(name);
  if (!corpus) {
    return {
      name,
      modern: h?.gist ?? '此卦白话象意待补充。',
      anecdote: '校对稿暂缺。',
      lines: {},
      hasSeed: false,
    };
  }
  const lines: Partial<Record<number, ClassicLine>> = {};
  for (let i = 0; i < 6; i++) {
    const classic = corpus.lineClassics[i];
    if (!classic) continue;
    lines[i] = {
      classic,
      note: corpus.lineNotes[i] ?? '',
    };
  }
  return {
    name,
    modern: corpus.modern,
    judgment: corpus.judgment,
    daXiang: corpus.daXiang,
    anecdote: corpus.daXiang,
    zengshan: corpus.zengshan,
    lines,
    hasSeed: true,
  };
}

function renderLineBlocks(
  d: ClassicDossier,
  focusIndexes: number[],
  mode: 'focus' | 'all',
): string {
  const indexes = mode === 'all' ? [0, 1, 2, 3, 4, 5] : focusIndexes;
  return indexes
    .map((i) => {
      const line = d.lines[i];
      const label = LINE_LABELS[i]!;
      const focus = focusIndexes.includes(i) ? ' is-focus' : '';
      const bai = glossLine(d.name, i);
      if (line) {
        return `<div class="ly-classic-line${focus}">
          <strong>${label}</strong>
          <p class="ly-classic-zh"><span class="ly-classic-tag">原文</span>${line.classic}</p>
          ${bai ? `<p class="ly-classic-bai"><span class="ly-classic-tag is-bai">白话</span>${bai}</p>` : ''}
          ${
            line.note
              ? `<p class="ly-classic-note"><span class="ly-classic-tag is-muted">小象</span>${line.note}<em>（仍是文言旁注）</em></p>`
              : ''
          }
        </div>`;
      }
      return `<div class="ly-classic-line${focus}"><strong>${label}</strong><p class="ly-guide-tip">该爻古文待补录。</p></div>`;
    })
    .join('');
}

function renderClassicBody(d: ClassicDossier, focusIndexes: number[]): string {
  const daBai = glossDaXiang(d.name);
  const showFocus = focusIndexes.length > 0;
  return `
    <div class="ly-classic-body">
      <p class="ly-classic-lead">这是《周易》<strong>原文存档</strong>，用来对照查证；日常解读请先看上面的白话象意。</p>
      ${
        d.judgment
          ? `<div class="ly-classic-block">
              <p class="ly-classic-zh"><span class="ly-classic-tag">卦辞 · 原文</span>${d.judgment}</p>
              <p class="ly-classic-bai"><span class="ly-classic-tag is-bai">白话象意</span>${formatClauseHtml(d.modern)}</p>
            </div>`
          : '<p class="ly-guide-tip">卦辞暂缺</p>'
      }
      ${
        d.daXiang
          ? `<div class="ly-classic-block">
              <p class="ly-classic-zh"><span class="ly-classic-tag">大象 · 原文</span>${d.daXiang}</p>
              ${
                daBai
                  ? `<p class="ly-classic-bai"><span class="ly-classic-tag is-bai">白话</span>${daBai}</p>`
                  : ''
              }
            </div>`
          : ''
      }
      <p class="ly-guide-tip">六爻爻辞也是原文；有白话对照的会标在下面。</p>
      ${renderLineBlocks(d, showFocus ? focusIndexes : [0, 1, 2, 3, 4, 5], showFocus ? 'focus' : 'all')}
      ${
        showFocus
          ? `<details class="ly-classic-all-yao">
              <summary>六爻全文</summary>
              ${renderLineBlocks(d, focusIndexes, 'all')}
            </details>`
          : ''
      }
      ${
        d.zengshan
          ? teachFold(
              '增删卜易 · 白话读法摘录',
              `<div class="ly-classic-zengshan"><p>${d.zengshan.replace(
                /^《增删卜易》义理摘录（教学整理）：/,
                '',
              )}</p><p class="ly-guide-tip">教学整理，非全书影印；先定用神，再看世应、动变。</p></div>`,
            )
          : ''
      }
      <p class="ly-guide-tip">周易原文为通行本开源校对；不必一次啃完。</p>
    </div>
  `;
}

export function renderClassicFolderHtml(cast: CastResult): string {
  const d = resolveClassicDossier(cast.primary.name);
  markClassicSeen(cast.primary.name);
  const fav = isClassicFavorite(cast.primary.name);
  const focusIndexes =
    cast.changingIndexes.length > 0 ? cast.changingIndexes : [cast.shiLine - 1];

  return `
    <section class="ly-classic-folder" data-classic-folder data-classic-name="${d.name}">
      <header class="ly-classic-head">
        <h4>古文资料夹 · ${cast.primary.fullName}</h4>
        <button type="button" class="ly-classic-fav" data-classic-fav aria-pressed="${fav}">${
          fav ? '★ 已收藏' : '☆ 收藏'
        }</button>
      </header>
      <p class="ly-classic-modern">${formatClauseHtml(d.modern)}</p>
      ${teachFold('原文对照（卦辞 · 大象 · 六爻）', renderClassicBody(d, focusIndexes))}
      <p class="ly-guide-tip"><a href="/liuyao/classic" data-path="/liuyao/classic">打开学习页 · 古文资料夹 →</a></p>
    </section>
  `;
}

export function renderClassicLibraryPageHtml(filter: 'seen' | 'fav' | 'all' = 'seen'): string {
  const favs = new Set(listClassicFavorites());
  const seen = listClassicSeen();
  let names: string[];
  if (filter === 'fav') names = [...favs];
  else if (filter === 'all') names = HEXAGRAMS.map((h) => h.name);
  else names = seen.length > 0 ? seen : HEXAGRAMS.slice(0, 12).map((h) => h.name);

  const cards = names
    .map((name) => {
      const d = resolveClassicDossier(name);
      const h = hexByName(name);
      const starred = favs.has(name);
      return `
      <article class="ly-classic-lib-card" data-classic-name="${name}">
        <header>
          <strong>${h?.fullName ?? name}</strong>
          <button type="button" class="ly-classic-fav" data-classic-fav data-name="${name}" aria-pressed="${starred}">${
            starred ? '★' : '☆'
          }</button>
        </header>
        <p class="ly-classic-modern">${formatClauseHtml(d.modern)}</p>
        ${teachFold('原文对照（卦辞 · 大象 · 六爻）', renderClassicBody(d, []))}
      </article>`;
    })
    .join('');

  return `
    <p class="ly-guide-tip">每卦先看白话象意；点开「原文对照」才是《周易》经文存档，并尽量附白话。</p>
    <div class="ly-classic-filters" role="tablist">
      <button type="button" class="ly-note-tag${filter === 'seen' ? ' is-on' : ''}" data-classic-filter="seen">见过的</button>
      <button type="button" class="ly-note-tag${filter === 'fav' ? ' is-on' : ''}" data-classic-filter="fav">收藏</button>
      <button type="button" class="ly-note-tag${filter === 'all' ? ' is-on' : ''}" data-classic-filter="all">全部 64 卦</button>
    </div>
    <div class="ly-classic-lib-list">${cards || '<p class="ly-guide-tip">暂无内容。去起一卦后，本卦会出现在「见过的」。</p>'}</div>
  `;
}

export function bindClassicFolder(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('[data-classic-fav]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const host = btn.closest<HTMLElement>('[data-classic-name]');
      const name = btn.dataset.name ?? host?.dataset.classicName;
      if (!name) return;
      const on = toggleClassicFavorite(name);
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = btn.dataset.name ? (on ? '★' : '☆') : on ? '★ 已收藏' : '☆ 收藏';
    });
  });

  root.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const path = el.dataset.path;
      if (path) navigate(path);
    });
  });
}
