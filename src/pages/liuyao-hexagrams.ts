import { navigate } from '../router.ts';
import {
  HEXAGRAMS,
  hexagramByKingWen,
  linesFromHexagram,
  type Hexagram,
} from '../liuyao/hexagrams.ts';
import { mountLiuyaoModeSwitch, setLiuyaoMode } from '../liuyao/mode.ts';
import { hexagramNameWhy, TRIGRAM_ORDER, TRIGRAMS, type TrigramId } from '../liuyao/trigrams.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { renderHexagramSvg } from '../ui/liuyao/hexagram-view.ts';

function trigramLabel(id: TrigramId): string {
  const t = TRIGRAMS[id];
  return `${t.id}${t.symbol}·${t.nature}`;
}

function detailHtml(h: Hexagram): string {
  const upper = TRIGRAMS[h.upper];
  const lower = TRIGRAMS[h.lower];
  const lines = linesFromHexagram(h);
  const nameWhy = hexagramNameWhy(h.name, upper, lower);

  return `
    <button type="button" class="ly-hex-back" data-back>← 返回列表</button>
    <article class="ly-hex-detail">
      <p class="ly-hex-kw">文王第 ${h.kingWen} 卦</p>
      <h2 class="ly-hex-detail-name">${h.fullName}</h2>
      <p class="ly-hex-keywords">${h.keywords.join(' · ')}</p>
      <div class="ly-hex-detail-svg">${renderHexagramSvg({
        lines,
        shiLine: h.shiLine,
        showTrigramLabels: true,
      })}</div>
      <div class="ly-teach-grid">
        <article class="ly-teach-trigram">
          <header>
            <span class="ly-teach-role">上卦</span>
            <strong>${upper.id}${upper.symbol}</strong>
            <span class="ly-teach-nature">＝ ${upper.nature}</span>
          </header>
          <p class="ly-teach-shape">${upper.shapeHint}</p>
          <p class="ly-teach-why"><em>为什么是${upper.nature}？</em>${upper.whyImage}</p>
        </article>
        <article class="ly-teach-trigram">
          <header>
            <span class="ly-teach-role">下卦</span>
            <strong>${lower.id}${lower.symbol}</strong>
            <span class="ly-teach-nature">＝ ${lower.nature}</span>
          </header>
          <p class="ly-teach-shape">${lower.shapeHint}</p>
          <p class="ly-teach-why"><em>为什么是${lower.nature}？</em>${lower.whyImage}</p>
        </article>
      </div>
      <div class="ly-teach-name">
        <p class="ly-teach-formula">上${upper.nature} + 下${lower.nature} → <strong>${h.fullName}</strong></p>
        <p><em>为什么叫「${h.name}」？</em>${nameWhy}</p>
        <p class="ly-teach-shi">世爻默认在第 ${h.shiLine} 爻（八宫定位；实占以起卦结果为准）</p>
      </div>
      <p class="ly-hex-gist">${h.gist}</p>
    </article>
  `;
}

export function renderLiuyaoHexagrams(root: HTMLElement): void {
  const page = document.createElement('div');
  page.className = 'page ly-hexagrams-page';
  mountEnvBanner(page);

  const top = document.createElement('div');
  top.className = 'ly-topbar';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 学习模式';
  back.addEventListener('click', () => {
    setLiuyaoMode('learn');
    navigate('/liuyao');
  });
  const modeHost = document.createElement('div');
  modeHost.className = 'ly-topbar-actions';
  top.append(back, modeHost);
  page.append(top);

  setLiuyaoMode('learn');
  mountLiuyaoModeSwitch(modeHost, {
    onChange: (mode) => {
      if (mode === 'cast') navigate('/liuyao');
    },
  });

  const header = document.createElement('header');
  header.className = 'ly-codex-header';
  header.innerHTML = `
    <h1 class="page-title">六十四卦图鉴</h1>
    <p class="page-subtitle">按文王序浏览。点开一卦，看上下卦如何叠成卦名。</p>
    <div class="ly-hex-filter">
      <label>
        <span>上卦</span>
        <select data-filter="upper">
          <option value="">全部</option>
          ${TRIGRAM_ORDER.map(
            (id) => `<option value="${id}">${trigramLabel(id)}</option>`,
          ).join('')}
        </select>
      </label>
      <label>
        <span>下卦</span>
        <select data-filter="lower">
          <option value="">全部</option>
          ${TRIGRAM_ORDER.map(
            (id) => `<option value="${id}">${trigramLabel(id)}</option>`,
          ).join('')}
        </select>
      </label>
    </div>
  `;
  page.append(header);

  const stage = document.createElement('div');
  stage.className = 'ly-hex-stage';
  page.append(stage);

  let upperFilter = '';
  let lowerFilter = '';

  function filtered(): Hexagram[] {
    return HEXAGRAMS.filter((h) => {
      if (upperFilter && h.upper !== upperFilter) return false;
      if (lowerFilter && h.lower !== lowerFilter) return false;
      return true;
    });
  }

  function paintList(): void {
    const rows = filtered();
    stage.innerHTML = `
      <p class="ly-hex-count">共 ${rows.length} 卦</p>
      <div class="ly-hex-grid">
        ${rows
          .map(
            (h) => `
          <button type="button" class="ly-hex-card" data-kw="${h.kingWen}">
            <span class="ly-hex-card-num">${h.kingWen}</span>
            <strong>${h.name}</strong>
            <span class="ly-hex-card-full">${h.fullName}</span>
            <span class="ly-hex-card-kw">${h.keywords.slice(0, 2).join(' · ')}</span>
          </button>
        `,
          )
          .join('')}
      </div>
    `;
    stage.querySelectorAll<HTMLButtonElement>('[data-kw]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const h = hexagramByKingWen(Number(btn.dataset.kw));
        if (h) paintDetail(h);
      });
    });
  }

  function paintDetail(h: Hexagram): void {
    stage.innerHTML = detailHtml(h);
    stage.querySelector('[data-back]')?.addEventListener('click', paintList);
  }

  header.querySelectorAll<HTMLSelectElement>('select[data-filter]').forEach((sel) => {
    sel.addEventListener('change', () => {
      if (sel.dataset.filter === 'upper') upperFilter = sel.value;
      if (sel.dataset.filter === 'lower') lowerFilter = sel.value;
      paintList();
    });
  });

  paintList();
  root.appendChild(page);
}
