import { navigate } from '../router.ts';
import { openCodexCardDetail } from '../codex/detail-host.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mountCodexStoryMap } from '../ui/codex-story-map.ts';
import { mountJourneyDetail } from '../ui/codex-journey-detail.ts';

export function renderCodexFoolJourney(root: HTMLElement): void {
  let selectedId: string | null = null;
  let detailMode: 'journey' | 'codex' = 'journey';

  const page = document.createElement('div');
  page.className = 'page codex-page codex-learn-page';
  mountEnvBanner(page);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回图鉴';
  back.addEventListener('click', () => navigate('/codex'));
  page.append(back);

  function closeDetail(): void {
    selectedId = null;
    page.querySelector('.codex-detail')?.remove();
  }

  function openJourneyDetail(deckId: string): void {
    closeDetail();
    selectedId = deckId;
    detailMode = 'journey';
    const detail = document.createElement('aside');
    mountJourneyDetail(detail, deckId, {
      onClose: closeDetail,
      onContinue: (nextId) => openJourneyDetail(nextId),
      onOpenCodex: (id) => {
        closeDetail();
        detailMode = 'codex';
        openCodexCardDetail(
          {
            page,
            selectedId: id,
            onClose: () => {
              selectedId = null;
            },
            onRefresh: render,
          },
          id,
        );
      },
    });
    page.appendChild(detail);
  }

  function render(): void {
    page.querySelector('.codex-learn-body')?.remove();

    const body = document.createElement('div');
    body.className = 'codex-learn-body';

    const host = document.createElement('div');
    mountCodexStoryMap(host, {
      onSelectCard: openJourneyDetail,
      onContinue: openJourneyDetail,
    });
    body.appendChild(host);
    page.appendChild(body);

    if (selectedId && detailMode === 'codex') {
      openCodexCardDetail(
        {
          page,
          selectedId,
          onClose: () => {
            selectedId = null;
          },
          onRefresh: render,
        },
        selectedId,
      );
    }
  }

  root.appendChild(page);
  render();
}
