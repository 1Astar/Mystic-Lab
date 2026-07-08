/**
 * deckId → Rider-Waite 源文件名（Wikimedia Commons / Public Domain）
 * 图片来源：mixvlad/TarotCards（720px）
 */

export const TAROT_IMAGE_SOURCE_BASE =
  'https://cdn.jsdelivr.net/gh/mixvlad/TarotCards@master/tarot/rider-waite/720px';

export const MAJOR_IMAGE_FILES = [
  '00_Fool.jpg',
  '01_Magician.jpg',
  '02_High_Priestess.jpg',
  '03_Empress.jpg',
  '04_Emperor.jpg',
  '05_Hierophant.jpg',
  '06_Lovers.jpg',
  '07_Chariot.jpg',
  '08_Strength.jpg',
  '09_Hermit.jpg',
  '10_Wheel_of_Fortune.jpg',
  '11_Justice.jpg',
  '12_Hanged_Man.jpg',
  '13_Death.jpg',
  '14_Temperance.jpg',
  '15_Devil.jpg',
  '16_Tower.jpg',
  '17_Star.jpg',
  '18_Moon.jpg',
  '19_Sun.jpg',
  '20_Judgement.jpg',
  '21_World.jpg',
];

const SUIT_PREFIX = {
  wands: 'Wands',
  cups: 'Cups',
  swords: 'Swords',
  pentacles: 'Pents',
};

const RANK_NUM = {
  Ace: '01',
  Two: '02',
  Three: '03',
  Four: '04',
  Five: '05',
  Six: '06',
  Seven: '07',
  Eight: '08',
  Nine: '09',
  Ten: '10',
  Page: '11',
  Knight: '12',
  Queen: '13',
  King: '14',
};

/** @returns {[deckId: string, sourceFile: string][]} */
export function buildTarotImageManifest() {
  /** @type {[string, string][]} */
  const entries = [];

  for (let i = 0; i < MAJOR_IMAGE_FILES.length; i++) {
    entries.push([`major-${i}`, MAJOR_IMAGE_FILES[i]]);
  }

  for (const [suit, prefix] of Object.entries(SUIT_PREFIX)) {
    for (const [rank, num] of Object.entries(RANK_NUM)) {
      const deckId = `${suit}-${rank.toLowerCase()}`;
      entries.push([deckId, `${prefix}${num}.jpg`]);
    }
  }

  return entries;
}

export const TAROT_BACK_SOURCE = 'Cover.jpg';
