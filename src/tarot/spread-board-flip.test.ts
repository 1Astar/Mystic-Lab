import { describe, expect, it } from 'vitest';
import { paintSpreadBoard, renderSpreadBoardShellHtml } from '../ui/spread-board.ts';
import { SPREADS } from './spreads.ts';
import type { DrawnCard } from './engine.ts';

function miniDrawn(name: string, position: string): DrawnCard {
  return {
    card: {
      id: 'major_fool',
      name: 'The Fool',
      nameZh: name,
      color: '#4a3060',
      arcana: 'major',
      deckId: 'major',
    },
    reversed: false,
    position,
    positionKey: 'past',
  } as DrawnCard;
}

describe('spread-board flip reveal', () => {
  it('shows card name on label when revealed in flip phase', () => {
    const spread = SPREADS['past-present-future'];
    const placements = [
      { x: 20, y: 50 },
      { x: 50, y: 50 },
      { x: 80, y: 50 },
    ];
    const root = document.createElement('div');
    root.innerHTML = renderSpreadBoardShellHtml(
      spread,
      'past-present-future',
      placements,
      0,
      'flip',
    );

    const drawn = [
      miniDrawn('宝剑九', '过去'),
      miniDrawn('愚者', '现在'),
      miniDrawn('倒吊人', '未来'),
    ];

    paintSpreadBoard(root, {
      spread,
      spreadType: 'past-present-future',
      drawn,
      currentIndex: 0,
      phase: 'flip',
      revealedFlags: [true, true, true],
      placements,
    });

    const labels = [...root.querySelectorAll('.spread-board-label')].map((el) => el.textContent);
    expect(labels[0]).toContain('宝剑九');
    expect(labels[1]).toContain('愚者');
    expect(labels[2]).toContain('倒吊人');
    expect(root.querySelectorAll('.tarot-card.is-revealed').length).toBe(3);
  });
});
