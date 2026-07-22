import { navigate } from '../router.ts';
import {
  HEXAGRAMS,
  hexagramByKingWen,
  linesFromHexagram,
  type Hexagram,
  LINE_LABELS,
} from '../liuyao/hexagrams.ts';
import { buildVaultSnapshot } from '../liuyao/vault.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import {
  buildHexGuidePack,
  bindHexGuideNotes,
  renderGuideArtHtml,
  renderHexGuideNotesHtml,
  type HexGuidePack,
} from '../liuyao/hex-guide.ts';
import { getJournalEntryById } from '../liuyao/journey.ts';
import { openLiuyaoEncounterReplay } from '../ui/liuyao-encounter-replay.ts';

function artHtml(h: Hexagram): string {
  const pack = buildHexGuidePack(h);
  return renderGuideArtHtml(pack, { className: 'ly-guide-art', alt: h.fullName });
}

/** 细线条爻；列表用精简版（无标签） */
function renderCssYaoStack(
  pack: HexGuidePack,
  lines: number[],
  opts: { tags?: boolean } = { tags: true },
): string {
  const topFirst = [...lines].reverse();
  const shiFromTop = 6 - pack.pro.shiLine;
  const yingFromTop = 6 - pack.pro.yingLine;
  const withTags = opts.tags !== false;
  return `
    <div class="ly-guide-yao-stack" data-yao-stack aria-hidden="true">
      ${topFirst
        .map((bit, i) => {
          const tags: string[] = [];
          if (withTags) {
            if (i === 0) tags.push('上');
            if (i === 3) tags.push('下');
            if (i === shiFromTop) tags.push('世');
            if (i === yingFromTop) tags.push('应');
          }
          const yang = bit === 1;
          const tri = i < 3 ? 'is-upper-tri' : 'is-lower-tri';
          return `
          <div class="ly-guide-yao-row ${tri}${yang ? ' is-yang' : ' is-yin'}">
            <span class="ly-guide-yao-ln"></span>
            ${
              tags.length
                ? `<span class="ly-guide-yao-tag">${tags.join(' ')}</span>`
                : ''
            }
          </div>`;
        })
        .join('')}
      <div class="ly-guide-yao-seam" aria-hidden="true"></div>
    </div>
  `;
}

function detailHtml(h: Hexagram, switchMeta: { index: number; total: number }): string {
  const pack = buildHexGuidePack(h);
  const lines = linesFromHexagram(h) as number[];
  const swNum = `${String(switchMeta.index + 1).padStart(2, '0')} / ${String(switchMeta.total).padStart(2, '0')}`;
  // 与 atmosphere demo 一致：整卡 background-image 铺满，不嵌套另一层 aspect-ratio 图
  const bgAttr = pack.atmosphereSrc
    ? ` style="background-image:url('${pack.atmosphereSrc}')"`
    : ` data-upper="${pack.upperNature}" data-lower="${pack.lowerNature}"`;
  const bgClass = pack.atmosphereSrc ? '' : ' is-empty';

  return `
    <button type="button" class="ly-hex-back" data-back>← 返回列表</button>
    <article class="ly-hex-detail ly-guide-detail" data-hex-guide>
      <header class="ly-guide-detail-head">
        <p class="ly-guide-kicker">合成 · ${h.fullName} · 文王第 ${h.kingWen} 卦</p>
        <div class="ly-guide-toolbar">
          <label class="ly-guide-tog"><input type="checkbox" data-text-toggle checked /> 显示文字</label>
        </div>
      </header>

      <div class="ly-guide-solo">
        <div class="ly-guide-card" data-guide-card>
          <div class="ly-guide-card-bg${bgClass}"${bgAttr}></div>
          <div class="ly-guide-card-veil"></div>
          <div class="ly-guide-card-motion" aria-hidden="true"></div>

          <button type="button" class="ly-guide-dismiss" data-tri-dismiss aria-label="关闭注解"></button>
          <button type="button" class="ly-guide-zone is-upper" data-zone="upper" aria-label="查看上卦">
            <span class="ly-guide-zone-hint">点这里 · 上卦</span>
          </button>
          <button type="button" class="ly-guide-zone is-lower" data-zone="lower" aria-label="查看下卦">
            <span class="ly-guide-zone-hint">点这里 · 下卦</span>
          </button>

          <div class="ly-guide-card-ui text-layer">
            <div class="ly-guide-brand">MYSTIC LAB · HEX CARD</div>
            <h2 class="ly-guide-name">${h.name}</h2>
            <p class="ly-guide-sub">${h.fullName} · 第${h.kingWen}卦</p>
            <div class="ly-guide-chips is-shi">
              <span class="ly-guide-chip">世 · ${LINE_LABELS[pack.pro.shiLine - 1]}</span>
              <span class="ly-guide-chip is-ying">应 · ${LINE_LABELS[pack.pro.yingLine - 1]}</span>
            </div>
          </div>

          <button type="button" class="ly-guide-mini-note" data-guide-notes data-open-tab="domain" title="打开解读笔记">笔记</button>

          <div class="ly-guide-mid text-layer">
            <div class="ly-guide-yao-host">
              ${renderCssYaoStack(pack, lines)}
            </div>
          </div>

          <aside class="ly-guide-side-mask text-layer" data-tri-note hidden>
            <p class="ly-guide-tri-k" data-tri-role>上卦</p>
            <p class="ly-guide-tri-v" data-tri-title></p>
            <p class="ly-guide-tri-h" data-tri-rep></p>
            <p class="ly-guide-tri-why" data-tri-why></p>
          </aside>

          <div class="ly-guide-card-foot text-layer">
            <p class="ly-guide-img-k">整体意象</p>
            <p class="ly-guide-one-line">${pack.oneLiner}</p>
            <div class="ly-guide-legend" aria-hidden="true">
              <span class="is-yang">阳爻</span>
              <span class="is-yin">阴爻</span>
              <span class="is-move">动爻高亮</span>
            </div>
          </div>
        </div>
      </div>

      <div class="ly-guide-switch" data-guide-switch>
        <button type="button" class="ly-guide-sw-btn" data-guide-prev aria-label="上一卦">‹</button>
        <div class="ly-guide-sw-mid">
          <p class="ly-guide-sw-num">${swNum}</p>
          <p class="ly-guide-sw-name">${h.fullName}</p>
        </div>
        <button type="button" class="ly-guide-sw-btn" data-guide-next aria-label="下一卦">›</button>
      </div>
    </article>
  `;
}

export function renderLiuyaoHexagrams(root: HTMLElement): () => void {
  const page = document.createElement('div');
  page.className = 'page ly-hexagrams-page';
  mountEnvBanner(page);

  const top = document.createElement('div');
  top.className = 'ly-topbar';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 我的卦库';
  back.addEventListener('click', () => {
    navigate('/liuyao/vault');
  });
  top.append(back);
  page.append(top);

  const header = document.createElement('header');
  header.className = 'ly-codex-header';
  const vault = buildVaultSnapshot();
  const meetByName = new Map(vault.meets.map((m) => [m.name, m.count]));
  header.innerHTML = `
    <h1 class="page-title">六十四卦图鉴</h1>
    <p class="page-subtitle">已遇见 ${vault.collected} / ${vault.total} 卦</p>
  `;
  page.append(header);

  const stage = document.createElement('div');
  stage.className = 'ly-hex-stage';
  page.append(stage);

  let currentDetail: Hexagram | null = null;

  function paintList(): void {
    currentDetail = null;
    const rows = HEXAGRAMS;
    stage.innerHTML = `
      <p class="ly-hex-count">共 ${rows.length} 卦</p>
      <div class="ly-hex-grid is-visual">
        ${rows
          .map((h) => {
            const pack = buildHexGuidePack(h);
            const lines = linesFromHexagram(h) as number[];
            const n = meetByName.get(h.name) ?? 0;
            const metClass = n > 0 ? ' is-met' : ' is-locked';
            return `
          <button type="button" class="ly-hex-card is-visual${metClass}" data-kw="${h.kingWen}" aria-label="${h.fullName}">
            <div class="ly-hex-card-art">${artHtml(h)}</div>
            <div class="ly-hex-card-yao">${renderCssYaoStack(pack, lines, { tags: false })}</div>
            <span class="ly-hex-card-glyph">${h.name}</span>
          </button>
        `;
          })
          .join('')}
      </div>
    `;
    stage.querySelectorAll<HTMLButtonElement>('[data-kw]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const hx = hexagramByKingWen(Number(btn.dataset.kw));
        if (hx) paintDetail(hx);
      });
    });
  }

  function paintDetail(h: Hexagram): void {
    currentDetail = h;
    const switchList = HEXAGRAMS;
    const index = Math.max(0, HEXAGRAMS.findIndex((x) => x.name === h.name));

    stage.innerHTML = detailHtml(h, { index, total: switchList.length });
    stage.querySelector('[data-back]')?.addEventListener('click', () => {
      history.replaceState({}, '', '/liuyao/hexagrams');
      paintList();
    });

    const article = stage.querySelector<HTMLElement>('[data-hex-guide]');
    const card = stage.querySelector<HTMLElement>('[data-guide-card]');
    const note = stage.querySelector<HTMLElement>('[data-tri-note]');
    const pack = buildHexGuidePack(h);
    let focus: 'upper' | 'lower' | null = null;

    // 深链同步，便于分享 / 刷新仍停在当前卦
    history.replaceState({}, '', `/liuyao/hexagrams?gua=${encodeURIComponent(h.name)}`);

    const closeNotesDrawer = () => {
      page.querySelector('[data-guide-drawer]')?.remove();
    };

    const openNotesDrawer = (tab?: string) => {
      closeNotesDrawer();
      const drawer = document.createElement('aside');
      drawer.className = 'ly-guide-drawer';
      drawer.dataset.guideDrawer = '';
      drawer.innerHTML = `
        <div class="ly-guide-drawer-backdrop" data-drawer-close></div>
        <div class="ly-guide-drawer-panel">
          <header class="ly-guide-drawer-head">
            <h4>${h.fullName} · 解读笔记</h4>
            <button type="button" class="ly-course-drawer-x" data-drawer-close aria-label="关闭">×</button>
          </header>
          <div class="ly-guide-drawer-body" data-drawer-notes>
            ${renderHexGuideNotesHtml(pack)}
          </div>
        </div>
      `;
      page.appendChild(drawer);
      drawer.querySelectorAll('[data-drawer-close]').forEach((el) => {
        el.addEventListener('click', closeNotesDrawer);
      });
      const notesRoot = drawer.querySelector<HTMLElement>('[data-drawer-notes]');
      if (notesRoot) {
        bindHexGuideNotes(notesRoot, h.name, {
          onRestore: (id) => {
            const entry = getJournalEntryById(id);
            if (entry) openLiuyaoEncounterReplay(page, entry);
          },
        });
        const openTab = tab && tab !== 'domain' ? tab : null;
        if (openTab) {
          notesRoot.querySelector<HTMLButtonElement>(`[data-guide-tab="${openTab}"]`)?.click();
        }
      }
    };

    const goRelative = (delta: number) => {
      closeNotesDrawer();
      if (!switchList.length) return;
      const next = switchList[(index + delta + switchList.length) % switchList.length]!;
      paintDetail(next);
    };

    const clearFocus = () => {
      focus = null;
      card?.classList.remove('is-focus-upper', 'is-focus-lower');
      note?.setAttribute('hidden', '');
      note?.classList.remove('is-upper', 'is-lower', 'is-on');
    };
    const openFocus = (kind: 'upper' | 'lower') => {
      if (focus === kind) {
        clearFocus();
        return;
      }
      focus = kind;
      const isUp = kind === 'upper';
      card?.classList.toggle('is-focus-upper', isUp);
      card?.classList.toggle('is-focus-lower', !isUp);
      if (note) {
        note.classList.toggle('is-upper', isUp);
        note.classList.toggle('is-lower', !isUp);
        note.querySelector('[data-tri-role]')!.textContent = isUp ? '上卦' : '下卦';
        note.querySelector('[data-tri-title]')!.textContent = isUp
          ? `${pack.upperId} · ${pack.upperNature}`
          : `${pack.lowerId} · ${pack.lowerNature}`;
        note.querySelector('[data-tri-rep]')!.textContent = isUp
          ? pack.upperRep.replace(/、/g, ' · ')
          : pack.lowerRep.replace(/、/g, ' · ');
        note.querySelector('[data-tri-why]')!.textContent = isUp
          ? pack.upperWhy
          : pack.lowerWhy;
        note.removeAttribute('hidden');
        requestAnimationFrame(() => note.classList.add('is-on'));
      }
    };

    stage.querySelectorAll<HTMLElement>('[data-guide-notes]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openNotesDrawer(el.dataset.openTab);
      });
    });

    stage.querySelector('[data-guide-prev]')?.addEventListener('click', () => goRelative(-1));
    stage.querySelector('[data-guide-next]')?.addEventListener('click', () => goRelative(1));

    const textToggle = stage.querySelector<HTMLInputElement>('[data-text-toggle]');
    textToggle?.addEventListener('change', () => {
      article?.classList.toggle('is-text-off', !textToggle.checked);
    });

    stage.querySelectorAll<HTMLElement>('[data-zone]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const kind = el.dataset.zone as 'upper' | 'lower';
        if (kind === 'upper' || kind === 'lower') openFocus(kind);
      });
    });
    stage.querySelector('[data-tri-dismiss]')?.addEventListener('click', () => clearFocus());
    note?.addEventListener('click', (e) => e.stopPropagation());

    card?.addEventListener('dblclick', () => openNotesDrawer('domain'));
  }

  paintList();

  // 笔记「打开图鉴」深链：?gua=乾 或 ?kw=1
  try {
    const q = new URLSearchParams(location.search);
    const byName = q.get('gua');
    const byKw = q.get('kw');
    const target =
      (byName && HEXAGRAMS.find((h) => h.name === byName)) ||
      (byKw ? hexagramByKingWen(Number(byKw)) : undefined);
    if (target) paintDetail(target);
  } catch {
    /* ignore */
  }

  const onKey = (e: KeyboardEvent) => {
    if (!currentDetail || !stage.querySelector('[data-hex-guide]')) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) {
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const i = Math.max(0, HEXAGRAMS.findIndex((x) => x.name === currentDetail!.name));
      const delta = e.key === 'ArrowLeft' ? -1 : 1;
      const next = HEXAGRAMS[(i + delta + HEXAGRAMS.length) % HEXAGRAMS.length];
      if (next) paintDetail(next);
    } else if (e.key === 'Escape') {
      if (page.querySelector('[data-ly-replay]')) {
        page.querySelector('[data-ly-replay]')?.remove();
        return;
      }
      if (page.querySelector('[data-guide-drawer]')) {
        page.querySelector('[data-guide-drawer]')?.remove();
        return;
      }
      history.replaceState({}, '', '/liuyao/hexagrams');
      paintList();
    }
  };
  window.addEventListener('keydown', onKey);

  root.appendChild(page);
  return () => window.removeEventListener('keydown', onKey);
}
