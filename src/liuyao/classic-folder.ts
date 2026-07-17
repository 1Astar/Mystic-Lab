import type { CastResult } from './engine.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { HEXAGRAMS, LINE_LABELS, type Hexagram } from './hexagrams.ts';
import { navigate } from '../router.ts';

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
      if (line) {
        return `<div class="ly-classic-line${focus}"><strong>${label}</strong><p class="ly-classic-zh">${line.classic}</p>${
          line.note ? `<p class="ly-guide-tip">${line.note}</p>` : ''
        }</div>`;
      }
      return `<div class="ly-classic-line${focus}"><strong>${label}</strong><p class="ly-guide-tip">该爻古文待补录。</p></div>`;
    })
    .join('');
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
      <p class="ly-classic-modern">${d.modern}</p>
      <details class="ly-classic-scroll">
        <summary>展开古文（卦辞 · 六爻 · 大象）</summary>
        <div class="ly-classic-body">
          ${
            d.judgment
              ? `<p class="ly-classic-zh"><b>卦辞</b> ${d.judgment}</p>`
              : '<p class="ly-guide-tip">卦辞暂缺</p>'
          }
          ${d.daXiang ? `<p class="ly-classic-zh"><b>大象</b> ${d.daXiang}</p>` : ''}
          <p class="ly-guide-tip">动爻/世爻优先标出；下方可展开六爻全文。</p>
          ${renderLineBlocks(d, focusIndexes, 'focus')}
          <details class="ly-classic-all-yao">
            <summary>六爻全文</summary>
            ${renderLineBlocks(d, focusIndexes, 'all')}
          </details>
          ${
            d.zengshan
              ? `<div class="ly-classic-zengshan"><b>增删卜易 · 相关</b><p>${d.zengshan}</p></div>`
              : ''
          }
          <p class="ly-guide-tip">周易原文为通行本开源校对；增删卜易为教学义理摘录，非全书影印。</p>
        </div>
      </details>
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
        <p>${d.modern}</p>
        <details>
          <summary>古文 · 增删卜易</summary>
          <div class="ly-classic-body">
            ${d.judgment ? `<p class="ly-classic-zh"><b>卦辞</b> ${d.judgment}</p>` : ''}
            ${d.daXiang ? `<p class="ly-classic-zh"><b>大象</b> ${d.daXiang}</p>` : ''}
            ${renderLineBlocks(d, [], 'all')}
            ${
              d.zengshan
                ? `<div class="ly-classic-zengshan"><b>增删卜易 · 相关</b><p>${d.zengshan}</p></div>`
                : ''
            }
          </div>
        </details>
      </article>`;
    })
    .join('');

  return `
    <p class="ly-guide-tip">已收录周易 64 卦卦辞/爻辞校对稿；每卦附《增删卜易》教学摘录。</p>
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
