import { navigate } from '../router.ts';
import { openCodexCardDetail } from '../codex/detail-host.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mountSuitNumbersGuide } from '../ui/codex-suit-numbers.ts';

export function renderCodexSuitNumbers(root: HTMLElement): void {
  let selectedId: string | null = null;

  const page = document.createElement('div');
  page.className = 'page codex-page codex-learn-page';
  mountEnvBanner(page);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回图鉴';
  back.addEventListener('click', () => navigate('/tarot/tujian'));
  page.append(back);

  function render(): void {
    page.querySelector('.codex-learn-body')?.remove();
    page.querySelector('.codex-detail')?.remove();

    const body = document.createElement('div');
    body.className = 'codex-learn-body';

    const host = document.createElement('div');
    mountSuitNumbersGuide(host, {
      onSelectCard: (deckId) => {
        selectedId = deckId;
        openCodexCardDetail(
          {
            page,
            selectedId,
            onClose: () => {
              selectedId = null;
            },
            onRefresh: render,
          },
          deckId,
        );
      },
    });
    body.appendChild(host);
    page.appendChild(body);

    if (selectedId) {
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
