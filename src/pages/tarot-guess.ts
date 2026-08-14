/**
 * 塔罗 · 猜牌盲盒
 */
import { mountLabGuessPage } from '../ui/lab-guess-page.ts';
import { TAROT_GUESS_CARDS } from '../tarot/guess-pack.ts';

export const TAROT_GUESS_STORAGE_KEY = 'mystic-lab-tarot-guess-v1';

export function renderTarotGuess(root: HTMLElement): () => void {
  return mountLabGuessPage(root, {
    emblem: 'tarot',
    title: '猜牌义',
    subtitle: '用已学大阿卡纳复习 · 每日一题',
    backPath: '/tarot',
    backLabel: '← 返回塔罗',
    tujianPath: '/tarot/tujian',
    tujianLabel: '去图鉴 ›',
    storageKey: TAROT_GUESS_STORAGE_KEY,
    cards: TAROT_GUESS_CARDS,
    note: '题库为学习对照（牌面意象），不是单次占卜鉴定。',
  });
}
