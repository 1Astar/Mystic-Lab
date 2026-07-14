import {
  getCodexEntry,
  isCardCollected,
  savePersonalNote,
  toggleFavorite,
} from '../codex/collection.ts';
import { navigate } from '../router.ts';
import { TAROT_DECK } from '../tarot/deck.ts';
import { mountCodexDetail } from '../ui/codex-detail.ts';
import { mountCodexPreview } from '../ui/codex-preview.ts';
import { openEncounterReplay } from '../ui/reading-replay.ts';

export type CodexDetailHost = {
  page: HTMLElement;
  selectedId: string | null;
  onClose: () => void;
  onRefresh: () => void;
};

export function openCodexCardDetail(host: CodexDetailHost, deckId: string): void {
  host.page.querySelector('.codex-detail')?.remove();
  host.page.querySelector('.reading-replay')?.remove();
  host.selectedId = deckId;

  const card = TAROT_DECK.find((c) => c.id === deckId);
  if (!card) return;

  const detail = document.createElement('aside');
  const collected = isCardCollected(deckId);
  const entry = getCodexEntry(deckId);

  if (collected && entry) {
    mountCodexDetail(detail, card, entry, {
      onClose: () => {
        host.onClose();
        detail.remove();
      },
      onSaveNote: (note: string) => savePersonalNote(deckId, note),
      onToggleFavorite: () => {
        toggleFavorite(deckId);
        host.onRefresh();
      },
      onOpenEncounter: (encounterAt: string) => {
        const enc = entry.encounters.find((e) => e.at === encounterAt);
        if (!enc) return;
        openEncounterReplay(host.page, deckId, enc);
      },
    });
  } else {
    mountCodexPreview(detail, card, {
      onClose: () => {
        host.onClose();
        detail.remove();
      },
      onDraw: () => navigate('/tarot/reading'),
    });
  }

  host.page.appendChild(detail);
}

export function closeCodexCardDetail(host: CodexDetailHost): void {
  host.page.querySelector('.codex-detail')?.remove();
  host.onClose();
}
