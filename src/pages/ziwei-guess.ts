/**
 * 紫微 · 猜星曜盲盒
 */
import { mountLabGuessPage } from '../ui/lab-guess-page.ts';
import { ziweiSysTabsHtml } from '../ui/lab-sys-tabs.ts';
import { ZIWEI_GUESS_CARDS } from '../ziwei/guess-pack.ts';

export const ZIWEI_GUESS_STORAGE_KEY = 'mystic-lab-ziwei-guess-v1';

export function renderZiweiGuess(root: HTMLElement): () => void {
  return mountLabGuessPage(root, {
    emblem: 'cosmos',
    title: '猜星曜',
    subtitle: '用已学星曜 / 宫位复习 · 每日一题',
    backPath: '/ziwei/reading',
    backLabel: '← 命盘解读',
    tujianPath: '/ziwei/tujian',
    tujianLabel: '去图鉴 ›',
    storageKey: ZIWEI_GUESS_STORAGE_KEY,
    cards: ZIWEI_GUESS_CARDS,
    tabsHtml: ziweiSysTabsHtml('reading'),
    note: '题库为学习对照（星曜/宫位意象），不是对真人排盘鉴定。',
  });
}
