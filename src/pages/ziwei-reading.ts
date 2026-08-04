import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { SYSTEM_POSITION } from '../lab/system-positioning.ts';
import { getActivePerson } from '../life/storage.ts';
import { castZiweiChart } from '../ziwei/cast.ts';
import { collectUnlockIdsFromPalaces, unlockStarsFromChart } from '../ziwei/codex.ts';
import { getStarLore } from '../ziwei/stars.ts';
import {
  loadZiweiIntent,
  loadZiweiQuestion,
  saveZiweiQuestion,
} from '../ziwei/session.ts';
import type { ZiweiChartView } from '../ziwei/types.ts';
import { showUnlockToast } from '../ui/unlock-toast.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type ViewMode = 'theater' | 'classic';

export function renderZiweiReading(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const person = getActivePerson();
  const intent = loadZiweiIntent();
  let question = loadZiweiQuestion();
  let mode: ViewMode = 'theater';
  let openPillar: string | null = 'core';
  let drill: { title: string; body: string } | null = null;
  let unlockedOnce = false;

  const page = document.createElement('div');
  page.className = 'page ziwei-page ziwei-reading-page';
  mountEnvBanner(page);
  root.appendChild(page);

  const drillMap = new Map<string, { title: string; body: string }>();

  function maybeUnlock(view: ZiweiChartView): void {
    if (unlockedOnce) return;
    unlockedOnce = true;
    const { ids, palaceByStar } = collectUnlockIdsFromPalaces(view.palaces);
    const unlocked = unlockStarsFromChart(ids, palaceByStar);
    if (unlocked.newly.length > 0) {
      const first = unlocked.newly[0]!;
      const lore = getStarLore(first);
      showUnlockToast({
        isFirstTime: true,
        count: unlocked.total,
        cardName: lore ? `${lore.id} · ${lore.epithet}` : first,
      });
    }
  }

  function bind(): void {
    page.querySelector('.life-back')?.addEventListener('click', () => navigate('/'));
    page.querySelectorAll<HTMLButtonElement>('[data-path]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const path = btn.dataset.path;
        if (path) navigate(path);
      });
    });
    page.querySelector('#ziwei-edit-birth')?.addEventListener('click', () => {
      navigate('/ziwei?edit=1');
    });
    page.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        mode = btn.dataset.mode === 'classic' ? 'classic' : 'theater';
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-pillar]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.pillar ?? '';
        openPillar = openPillar === id ? null : id;
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-drill-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.drillId ?? '';
        drill = drillMap.get(id) ?? null;
        paint();
      });
    });
    page.querySelector('#ziwei-drill-close')?.addEventListener('click', () => {
      drill = null;
      paint();
    });
    page.querySelector('#ziwei-ask')?.addEventListener('click', () => {
      const input = page.querySelector<HTMLInputElement>('#ziwei-q');
      question = input?.value.trim() ?? '';
      saveZiweiQuestion(question);
      paint();
    });
  }

  function paintError(msg: string): void {
    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回 Mystic Lab</button>
      <header class="life-header">
        <h1 class="page-title">星盘未就绪</h1>
        <p class="page-subtitle">${escapeHtml(msg)}</p>
      </header>
      <button type="button" class="life-btn-primary" data-path="/ziwei?edit=1">补全出生信息</button>
    `;
    bind();
  }

  /** 紫微运限共有模块（不属于「人生剧场」叙事专属） */
  function decadeSectionHtml(view: ZiweiChartView): string {
    const decade = view.theater.decade;
    return `
      <section class="ziwei-decade" aria-label="十年大限">
        <p class="ziwei-kicker">紫微 · 十年大限${decade.started && decade.ageFrom ? ` · 虚岁 ${decade.ageFrom}–${decade.ageTo}` : ''}</p>
        <p class="ziwei-decade-theme">${escapeHtml(decade.theme)}</p>
        <p class="ziwei-decade-lead">${escapeHtml(decade.lead)}</p>
        <p class="ziwei-decade-meta">${escapeHtml(decade.mutagenLine)}</p>
        <details class="ziwei-forecast ziwei-decade-fold">
          <summary>这十年怎么走 · 展开看课题与防坑</summary>
          <pre class="ziwei-forecast-body">${escapeHtml(decade.guide)}</pre>
        </details>
        <button type="button" class="ziwei-drill-link" data-drill-id="decade">大限传统口径 ›</button>
      </section>`;
  }

  function paintTheater(view: ZiweiChartView): void {
    drillMap.clear();
    const t = view.theater;
    drillMap.set('soul', {
      title: '命宫 · 传统',
      body: `命宫主星：${view.soulPalace.majors.map((s) => s.name + (s.mutagen ? `化${s.mutagen}` : '')).join('、') || '空宫'}\n身主：${view.body}\n命主：${view.soul}`,
    });
    drillMap.set('annual', {
      title: '流年 · 传统',
      body: t.annual.traditional,
    });
    drillMap.set('decade', {
      title: '十年大限 · 传统',
      body: t.decade.traditional,
    });

    const pillarsHtml = t.pillars
      .map((p) => {
        const open = openPillar === p.id;
        const drillId = `pillar-${p.id}`;
        drillMap.set(drillId, { title: `${p.title} · 传统`, body: p.traditional });
        return `
        <article class="ziwei-pillar ${open ? 'is-open' : ''}">
          <button type="button" class="ziwei-pillar-head" data-pillar="${p.id}">
            <span>
              <strong>${escapeHtml(p.title)}</strong>
              <em>${escapeHtml(p.subtitle)}</em>
            </span>
            <span aria-hidden="true">${open ? '▾' : '▸'}</span>
          </button>
          ${
            open
              ? `<div class="ziwei-pillar-body">
                  <p>${escapeHtml(p.body).replace(/\n\n/g, '</p><p>')}</p>
                  <button type="button" class="ziwei-drill-link" data-drill-id="${drillId}">查看传统宫星 ›</button>
                </div>`
              : ''
          }
        </article>`;
      })
      .join('');

    const comfortHtml = t.comfort
      .map(
        (c) => `
      <aside class="ziwei-comfort">
        <p class="ziwei-comfort-tag">安心提示 · ${escapeHtml(c.trigger)}</p>
        <p>${escapeHtml(c.line)}</p>
      </aside>`,
      )
      .join('');

    const annual = t.annual;
    const spot = t.spotlightStar;
    const spotLore = getStarLore(spot);
    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回 Mystic Lab</button>
      <header class="life-header ziwei-header">
        <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
        <h1 class="page-title">紫微</h1>
        <p class="page-subtitle">${SYSTEM_POSITION.ziwei} · ${escapeHtml(view.fiveElementsClass)}</p>
        <button type="button" class="ziwei-edit-birth" id="ziwei-edit-birth">改出生信息</button>
      </header>

      ${decadeSectionHtml(view)}

      <div class="ziwei-mode-tabs" role="tablist" aria-label="解读模式">
        <button type="button" class="ziwei-mode-tab is-on" data-mode="theater">人生剧场</button>
        <button type="button" class="ziwei-mode-tab" data-mode="classic">传统盘解</button>
      </div>

      <section class="ziwei-combo" aria-label="内核主星组合">
        <p class="ziwei-kicker">高亮主星 · 组合技</p>
        <div class="ziwei-combo-lead">
          <span class="ziwei-combo-glyph" aria-hidden="true">${escapeHtml((spot || '星').slice(0, 1))}</span>
          <div>
            <p class="ziwei-combo-name">${escapeHtml(spot || '空象')}${spotLore ? ` · ${escapeHtml(spotLore.epithet)}` : ''}</p>
            <p class="ziwei-combo-myth">${escapeHtml(spotLore?.myth ?? '内核空象，贵人与流年来点亮。')}</p>
          </div>
        </div>
        <p class="ziwei-combo-line">${escapeHtml(t.soulCombo.line)}</p>
      </section>

      <section class="ziwei-headline">
        <p class="ziwei-kicker">核心定调</p>
        <p class="ziwei-headline-text">${escapeHtml(t.headline)}</p>
        <button type="button" class="ziwei-drill-link" data-drill-id="soul">专业口径（传统） ›</button>
      </section>

      <section class="ziwei-pillars" aria-label="人生四线索">
        <p class="ziwei-kicker">人生四线索</p>
        ${pillarsHtml}
      </section>

      <section class="ziwei-annual" aria-label="易数流年">
        <p class="ziwei-kicker">易数流年 · ${annual.year}</p>
        <label class="ziwei-ask-label" for="ziwei-q">问一句今年的事</label>
        <div class="ziwei-ask-row">
          <input id="ziwei-q" class="ziwei-ask-input" maxlength="80" value="${escapeHtml(question)}" placeholder="例如：我今年适合换工作吗？" />
          <button type="button" class="life-btn-primary" id="ziwei-ask">占问</button>
        </div>
        <p class="ziwei-annual-q">就「${escapeHtml(annual.question)}」</p>
        <p class="ziwei-annual-advice">${escapeHtml(annual.advice)}</p>
        <p class="ziwei-annual-meta">${escapeHtml(annual.mutagenLine)}</p>
        <button type="button" class="ziwei-drill-link" data-drill-id="annual">流年传统四化 ›</button>
      </section>

      <details class="ziwei-forecast">
        <summary>未来一年的风向标 · 展开看运势与防坑</summary>
        <pre class="ziwei-forecast-body">${escapeHtml(annual.forecastGuide)}</pre>
      </details>

      ${comfortHtml}

      <section class="ziwei-codex-cta">
        <p class="ziwei-codex-cta-copy">刚才你看到了内核中的【${escapeHtml(spot || '主星')}】，想深入了解它在神话里代表的性格，以及怎么驾驭它吗？</p>
        <button type="button" class="life-btn-primary" data-path="/ziwei/codex?star=${encodeURIComponent(spot || '紫微')}">
          去图鉴里看看 【${escapeHtml(spot || '主星')}】 ›
        </button>
      </section>

      <nav class="ziwei-reading-nav">
        <button type="button" class="bazi-home-link" data-path="/ziwei/codex">
          <strong>星曜图鉴</strong>
          <span>绝世主星 · 助阵辅星 · 四大化星</span>
          <em aria-hidden="true">›</em>
        </button>
        <button type="button" class="bazi-home-link bazi-home-link-soft" data-path="/ziwei?edit=1">
          <strong>出生信息</strong>
          <span>改生辰 · 出生地 · 性别</span>
          <em aria-hidden="true">›</em>
        </button>
      </nav>

      ${
        drill
          ? `<div class="ziwei-drill-sheet" role="dialog" aria-modal="true">
              <div class="ziwei-drill-panel">
                <button type="button" class="ziwei-drill-close" id="ziwei-drill-close">关闭</button>
                <h2>${escapeHtml(drill.title)}</h2>
                <pre class="ziwei-drill-body">${escapeHtml(drill.body)}</pre>
              </div>
            </div>`
          : ''
      }
    `;
    bind();
  }

  function paintClassic(view: ZiweiChartView): void {
    drillMap.clear();
    drillMap.set('decade', {
      title: '十年大限 · 传统',
      body: view.theater.decade.traditional,
    });
    const rows = view.palaces
      .map((p) => {
        const majors =
          p.majors
            .map(
              (s) =>
                `${s.name}${s.brightness ? s.brightness : ''}${s.mutagen ? `化${s.mutagen}` : ''}`,
            )
            .join(' ') || '空';
        const minors = p.minors.map((s) => s.name).slice(0, 5).join(' ');
        return `<tr>
          <td>${escapeHtml(p.name)}${p.isBody ? '<br><small>身</small>' : ''}</td>
          <td>${escapeHtml(p.heavenlyStem + p.earthlyBranch)}</td>
          <td>${escapeHtml(majors)}</td>
          <td>${escapeHtml(minors)}</td>
        </tr>`;
      })
      .join('');

    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回 Mystic Lab</button>
      <header class="life-header ziwei-header">
        <h1 class="page-title">紫微</h1>
        <p class="page-subtitle">${escapeHtml(view.solarDate)} · ${escapeHtml(view.timeLabel)} · ${escapeHtml(view.genderLabel)} · ${escapeHtml(view.fiveElementsClass)}</p>
        <button type="button" class="ziwei-edit-birth" id="ziwei-edit-birth">改出生信息</button>
      </header>

      ${decadeSectionHtml(view)}

      <div class="ziwei-mode-tabs" role="tablist">
        <button type="button" class="ziwei-mode-tab" data-mode="theater">人生剧场</button>
        <button type="button" class="ziwei-mode-tab is-on" data-mode="classic">传统盘解</button>
      </div>

      <p class="ziwei-classic-meta">命主 ${escapeHtml(view.soul)} · 身主 ${escapeHtml(view.body)}</p>
      <div class="ziwei-classic-table-wrap">
        <table class="ziwei-classic-table">
          <thead><tr><th>宫</th><th>干支</th><th>主星</th><th>辅星</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${
        view.theater.comfort[0]
          ? `<aside class="ziwei-comfort"><p class="ziwei-comfort-tag">安心提示</p><p>${escapeHtml(view.theater.comfort[0].line)}</p></aside>`
          : ''
      }

      ${
        drill
          ? `<div class="ziwei-drill-sheet" role="dialog" aria-modal="true">
              <div class="ziwei-drill-panel">
                <button type="button" class="ziwei-drill-close" id="ziwei-drill-close">关闭</button>
                <h2>${escapeHtml(drill.title)}</h2>
                <pre class="ziwei-drill-body">${escapeHtml(drill.body)}</pre>
              </div>
            </div>`
          : ''
      }
    `;
    bind();
  }
  function paint(): void {
    const next = castZiweiChart(person, {
      intent,
      year: new Date().getFullYear(),
      question,
    });
    if ('error' in next) {
      paintError(next.error);
      return;
    }
    maybeUnlock(next);
    if (mode === 'classic') paintClassic(next);
    else paintTheater(next);
  }

  paint();
  return () => stars.remove();
}
