import { navigate } from '../router.ts';
import { HEXAGRAMS, hexagramByKingWen } from '../liuyao/hexagrams.ts';
import {
  bindHexGuideNotes,
  buildHexGuidePack,
  renderGuideArtHtml,
  renderHexGuideNotesHtml,
} from '../liuyao/hex-guide.ts';
import { getJournalEntryById, meetBannerForHex } from '../liuyao/journey.ts';
import { openLiuyaoEncounterReplay } from '../ui/liuyao-encounter-replay.ts';
import { mountEnvBanner } from '../ui/banner.ts';

function resolveHex() {
  const q = new URLSearchParams(location.search);
  const byName = q.get('gua');
  const byKw = q.get('kw');
  const byTab = q.get('tab') || 'domain';
  const hex =
    (byName && HEXAGRAMS.find((h) => h.name === byName)) ||
    (byKw ? hexagramByKingWen(Number(byKw)) : undefined) ||
    null;
  return { hex, tab: byTab };
}

/** 图鉴解读笔记：整页（深链）；主入口仍是 HEX CARD 右侧抽屉 */
export function renderLiuyaoHexNotes(root: HTMLElement): void {
  const page = document.createElement('div');
  page.className = 'page ly-hexagrams-page ly-hex-notes-page';
  mountEnvBanner(page);

  const { hex, tab } = resolveHex();

  const top = document.createElement('div');
  top.className = 'ly-topbar';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = hex ? `← 返回「${hex.name}」图鉴卡` : '← 返回六十四卦图鉴';
  back.addEventListener('click', () => {
    if (hex) {
      navigate(`/liuyao/hexagrams?gua=${encodeURIComponent(hex.name)}`);
    } else {
      navigate('/liuyao/hexagrams');
    }
  });
  top.append(back);
  page.append(top);

  if (!hex) {
    const empty = document.createElement('div');
    empty.className = 'ly-hex-notes-empty';
    empty.innerHTML = `
      <h1 class="page-title">解读笔记</h1>
      <p class="page-subtitle">未指定卦名。请从图鉴卡进入，或在地址加 ?gua=乾</p>
      <button type="button" class="btn" data-go-list>打开六十四卦图鉴</button>
    `;
    empty.querySelector('[data-go-list]')?.addEventListener('click', () => {
      navigate('/liuyao/hexagrams');
    });
    page.append(empty);
    root.appendChild(page);
    return;
  }

  const pack = buildHexGuidePack(hex);
  const header = document.createElement('header');
  header.className = 'ly-codex-header ly-hex-notes-head';
  header.innerHTML = `
    <p class="ly-guide-kicker">解读笔记 · 文王第 ${hex.kingWen} 卦</p>
    <h1 class="page-title">${hex.fullName}</h1>
    <p class="page-subtitle">${meetBannerForHex(hex)}</p>
  `;
  page.append(header);

  const body = document.createElement('div');
  body.className = 'ly-hex-notes-body';
  body.innerHTML = `
    <div class="ly-hex-notes-hero">
      ${renderGuideArtHtml(pack, { className: 'ly-guide-art ly-hex-notes-hero-art', alt: hex.fullName })}
      <div class="ly-hex-notes-hero-copy">
        <p class="ly-guide-img-k">整体意象</p>
        <p class="ly-guide-one-line">${pack.oneLiner}</p>
        ${
          pack.gist.trim() && pack.gist.trim() !== pack.oneLiner.trim()
            ? `<p class="ly-guide-tip">${pack.gist}</p>`
            : ''
        }
      </div>
    </div>
    <section class="ly-hex-notes-panel" data-hex-notes-panel>
      ${renderHexGuideNotesHtml(pack)}
    </section>
  `;
  page.append(body);

  const notes = body.querySelector<HTMLElement>('[data-hex-guide-notes]');
  if (notes) {
    bindHexGuideNotes(notes, hex.name, {
      onRestore: (id) => {
        const entry = getJournalEntryById(id);
        if (entry) openLiuyaoEncounterReplay(page, entry);
      },
    });
    if (tab && tab !== 'domain') {
      notes.querySelector<HTMLButtonElement>(`[data-guide-tab="${tab}"]`)?.click();
    }
  }

  root.appendChild(page);
}
