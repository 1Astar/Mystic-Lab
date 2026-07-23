import { renderCardFace } from '../tarot/animations.ts';
import type { DrawnCard } from '../tarot/engine.ts';
import {
  isFreeArrangeSpread,
  layoutsForSpread,
  type SlotLayout,
} from '../tarot/spread-layout.ts';
import type { SpreadDefinition, SpreadType } from '../tarot/spreads.ts';

export type BoardPhase = 'draw' | 'place' | 'flip';

export type SpreadBoardPaintOpts = {
  spread: SpreadDefinition;
  spreadType: SpreadType;
  drawn: DrawnCard[];
  currentIndex: number;
  phase: BoardPhase;
  /** 各位置是否已翻开（与 drawn 对齐；未填视为未翻） */
  revealedFlags: boolean[];
  /** 自定义随心摆：各位置中心点 %；长度应覆盖 positions */
  placements: SlotLayout[];
  onPlacementChange?: (index: number, pos: SlotLayout) => void;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function ensurePlacements(
  spread: SpreadDefinition,
  existing: SlotLayout[] | null | undefined,
): SlotLayout[] {
  const base = layoutsForSpread(spread);
  if (!existing || existing.length === 0) return base;
  return base.map((fallback, i) => existing[i] ?? fallback);
}

/** 牌阵盘骨架（不含已抽牌面，由 paintSpreadBoard 填入） */
export function renderSpreadBoardShellHtml(
  spread: SpreadDefinition,
  spreadType: SpreadType,
  placements: SlotLayout[],
  currentIndex: number,
  phase: BoardPhase,
): string {
  const free = isFreeArrangeSpread(spreadType);
  const slots = spread.positions
    .map((pos, i) => {
      const layout = placements[i] ?? layoutsForSpread(spread)[i]!;
      const isNext = (phase === 'draw' || phase === 'place') && i === currentIndex;
      const cls = [
        'spread-board-slot',
        isNext ? 'is-next' : '',
        free ? 'is-free' : 'is-fixed',
      ]
        .filter(Boolean)
        .join(' ');
      return `
        <div
          class="${cls}"
          data-slot-index="${i}"
          style="left:${layout.x}%;top:${layout.y}%"
        >
          <span class="spread-board-label">${escapeHtml(pos.label)}</span>
          <div class="spread-board-card-host" data-card-host="${i}"></div>
        </div>`;
    })
    .join('');

  return `
    <div
      class="spread-board ${free ? 'is-free-arrange' : 'is-fixed-spread'}"
      data-spread="${escapeHtml(spreadType)}"
      aria-label="${escapeHtml(spread.name)}"
    >
      <div class="spread-board-canvas">${slots}</div>
    </div>`;
}

export function paintSpreadBoard(
  root: HTMLElement,
  opts: SpreadBoardPaintOpts,
): () => void {
  const {
    spread,
    spreadType,
    drawn,
    currentIndex,
    phase,
    revealedFlags,
    placements,
    onPlacementChange,
  } = opts;
  const free = isFreeArrangeSpread(spreadType);
  const cleanups: (() => void)[] = [];

  spread.positions.forEach((_, i) => {
    const host = root.querySelector<HTMLElement>(`[data-card-host="${i}"]`);
    const slot = root.querySelector<HTMLElement>(`[data-slot-index="${i}"]`);
    if (!host || !slot) return;

    const card = drawn[i];
    const holding = phase === 'place' && i === currentIndex;
    if (!card || holding) {
      host.innerHTML = '';
      host.removeAttribute('data-reveal-index');
      host.classList.remove('tarot-slot-single', 'is-revealable');
      slot.classList.add('is-empty');
      slot.classList.remove('is-filled', 'is-active');
      return;
    }

    slot.classList.remove('is-empty');
    slot.classList.add('is-filled');

    const revealed = Boolean(revealedFlags[i]);
    const revealable = phase === 'flip' && !revealed;
    host.dataset.revealIndex = String(i);
    host.classList.toggle('tarot-slot-single', revealable);
    host.classList.toggle('is-revealable', revealable);
    slot.classList.toggle('is-active', revealable);
    renderCardFace(host, card, revealed);
    host.querySelector('.tarot-card')?.classList.add('is-board-card');

    // 待翻开的牌留给翻牌点击，不绑拖拽
    if (revealable) return;

    let startX = 0;
    let startY = 0;
    let originLeft = 0;
    let originTop = 0;
    let dragging = false;
    let moved = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button != null && e.button !== 0) return;
      const board = root.querySelector('.spread-board-canvas') as HTMLElement | null;
      if (!board) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      const rect = board.getBoundingClientRect();
      originLeft = ((slot.offsetLeft + slot.offsetWidth / 2) / rect.width) * 100;
      originTop = ((slot.offsetTop + slot.offsetHeight / 2) / rect.height) * 100;
      slot.setPointerCapture(e.pointerId);
      slot.classList.add('is-dragging');
      e.stopPropagation();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const board = root.querySelector('.spread-board-canvas') as HTMLElement | null;
      if (!board) return;
      const rect = board.getBoundingClientRect();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.hypot(dx, dy) > 6) moved = true;
      const x = Math.min(92, Math.max(8, originLeft + (dx / rect.width) * 100));
      const y = Math.min(90, Math.max(10, originTop + (dy / rect.height) * 100));
      slot.style.left = `${x}%`;
      slot.style.top = `${y}%`;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      slot.classList.remove('is-dragging');
      try {
        slot.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const board = root.querySelector('.spread-board-canvas') as HTMLElement | null;
      if (!board) return;
      const rect = board.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      let x = ((slotRect.left + slotRect.width / 2 - rect.left) / rect.width) * 100;
      let y = ((slotRect.top + slotRect.height / 2 - rect.top) / rect.height) * 100;
      x = Math.min(92, Math.max(8, x));
      y = Math.min(90, Math.max(10, y));

      if (!free) {
        const snap = placements[i] ?? layoutsForSpread(spread)[i]!;
        slot.style.left = `${snap.x}%`;
        slot.style.top = `${snap.y}%`;
        return;
      }
      if (moved) onPlacementChange?.(i, { x, y });
    };

    host.addEventListener('pointerdown', onPointerDown);
    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerup', onPointerUp);
    host.addEventListener('pointercancel', onPointerUp);
    cleanups.push(() => {
      host.removeEventListener('pointerdown', onPointerDown);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerup', onPointerUp);
      host.removeEventListener('pointercancel', onPointerUp);
    });
  });

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
