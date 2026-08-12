/**
 * 八字衣橱：本命色卡 + 今日穿搭 + 一周七格（规则先出，可选 AI 润色）
 */
import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { attachPersonSwitcherToPage } from '../ui/module-person-chrome.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { castBaziChart } from '../bazi/cast.ts';
import { parseBirthParts } from '../bazi/parse-birth.ts';
import { getActivePerson } from '../life/storage.ts';
import {
  buildWardrobePack,
  type WardrobeDayOutfit,
  type WardrobePack,
} from '../wardrobe/build-pack.ts';
import { polishWardrobeCopy } from '../wardrobe/polish.ts';
import { WX_WEAR } from '../wardrobe/wx-palette.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function chipsHtml(pack: WardrobePack): string {
  return pack.chips
    .map((c) => {
      const soft = c.role === 'soften' ? ' is-soften' : '';
      return `
      <div class="wardrobe-chip ${c.cssClass}${soft}" data-role="${c.role}">
        <span class="wardrobe-chip-swatch" aria-hidden="true"></span>
        <div>
          <em>${escapeHtml(c.label)}</em>
          <strong class="${c.cssClass}">${escapeHtml(c.wx)}</strong>
          <p>${escapeHtml(c.names.join(' · '))}</p>
        </div>
      </div>`;
    })
    .join('');
}

function whyDetails(title: string, lines: string[]): string {
  return `
    <details class="wardrobe-why">
      <summary>${escapeHtml(title)}</summary>
      <ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>
    </details>`;
}

function dayDetailHtml(d: WardrobeDayOutfit, selected: boolean): string {
  const nudge =
    d.nudgeWx && WX_WEAR[d.nudgeWx]
      ? `可多看：${d.nudgeWx}（${WX_WEAR[d.nudgeWx].colorNames.slice(0, 2).join('、')}）`
      : '';
  const soften = d.softenWx
    ? `可以少一点大面积：${d.softenWx}`
    : '';
  return `
    <article class="wardrobe-day-detail${selected ? ' is-on' : ''}" data-day-detail="${escapeHtml(d.dateKey)}" ${selected ? '' : 'hidden'}>
      <p class="wardrobe-day-meta">${escapeHtml(d.dateKey)} · 周${escapeHtml(d.weekday)} · ${escapeHtml(d.ganZhi)}${d.stemGod && d.stemGod !== '—' ? ` · ${escapeHtml(d.stemGod)}` : ''}</p>
      <p class="wardrobe-day-tip" data-day-tip="${escapeHtml(d.dateKey)}">${escapeHtml(d.tip)}</p>
      ${nudge ? `<p class="wardrobe-day-nudge">${escapeHtml(nudge)}</p>` : ''}
      ${soften ? `<p class="wardrobe-day-soften">${escapeHtml(soften)}</p>` : ''}
      ${whyDetails('为什么 · 流日依据', d.why)}
    </article>`;
}

function weekHtml(pack: WardrobePack): string {
  const todayKey = pack.today.dateKey;
  const cells = pack.week
    .map((d) => {
      const on = d.dateKey === todayKey ? ' is-on' : '';
      const wxClass = d.nudgeWx
        ? ` wx-${d.nudgeWx === '木' ? 'mu' : d.nudgeWx === '火' ? 'huo' : d.nudgeWx === '土' ? 'tu' : d.nudgeWx === '金' ? 'jin' : 'shui'}`
        : '';
      return `
      <button type="button" class="wardrobe-week-cell${on}${wxClass}" data-week-day="${escapeHtml(d.dateKey)}" aria-pressed="${d.dateKey === todayKey ? 'true' : 'false'}">
        <span class="wardrobe-week-wd">周${escapeHtml(d.weekday)}</span>
        <span class="wardrobe-week-dot" aria-hidden="true"></span>
        <span class="wardrobe-week-tag">${escapeHtml(d.tag)}</span>
      </button>`;
    })
    .join('');
  const details = pack.week.map((d) => dayDetailHtml(d, d.dateKey === todayKey)).join('');
  return `
    <div class="wardrobe-week-rail" role="tablist" aria-label="一周衣橱">${cells}</div>
    <div class="wardrobe-week-panels">${details}</div>`;
}

function packBodyHtml(pack: WardrobePack): string {
  return `
    <section class="wardrobe-card" aria-label="本命衣橱">
      <p class="wardrobe-kicker">本命衣橱</p>
      <h2 class="wardrobe-temperament">${escapeHtml(pack.temperament)}</h2>
      <p class="wardrobe-sub">${escapeHtml(pack.temperamentSub)} · ${escapeHtml(pack.mood)}</p>
      <p class="wardrobe-dm">日主 ${escapeHtml(pack.dayMaster)}${pack.dayMasterWx ? escapeHtml(pack.dayMasterWx) : ''}</p>
      <div class="wardrobe-chips">${chipsHtml(pack)}</div>
      <div class="wardrobe-style">
        <p class="wardrobe-style-summary" data-style-summary>${escapeHtml(pack.style.summary)}</p>
        <ul class="wardrobe-style-list">
          <li><span>材质</span>${escapeHtml(pack.style.materials.join(' · '))}</li>
          <li><span>剪裁</span>${escapeHtml(pack.style.cuts.join(' · '))}</li>
          <li><span>配饰</span>${escapeHtml(pack.style.accessories.join(' · '))}</li>
          <li><span>场合</span>${escapeHtml(pack.style.occasion)}</li>
        </ul>
        ${whyDetails('为什么 · 本命依据', pack.natalWhy)}
      </div>
    </section>

    <section class="wardrobe-card" aria-label="今日穿搭">
      <p class="wardrobe-kicker">今日穿搭</p>
      <p class="wardrobe-today-meta">${escapeHtml(pack.today.dateKey)} · ${escapeHtml(pack.today.ganZhi)} · ${escapeHtml(pack.today.tag)}</p>
      <p class="wardrobe-today-tip" data-today-tip>${escapeHtml(pack.today.tip)}</p>
      <p class="wardrobe-ai-note" data-ai-note hidden></p>
      ${whyDetails('为什么 · 今日依据', pack.today.why)}
    </section>

    <section class="wardrobe-card" aria-label="一周衣橱">
      <p class="wardrobe-kicker">一周衣橱</p>
      <p class="wardrobe-week-lead">点某一天看细则；短标签来自流日气候。</p>
      ${weekHtml(pack)}
    </section>`;
}

export function renderWardrobeHome(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const person = getActivePerson();
  const page = document.createElement('div');
  page.className = 'page life-page wardrobe-page';
  mountEnvBanner(page);

  const canBazi = Boolean(
    parseBirthParts(person.birthYear, person.birthMonth, person.birthDay, person.birthHour),
  );

  let disposePolish: (() => void) | undefined;
  let pack: WardrobePack | null = null;

  if (!canBazi) {
    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/">← 返回 Mystic Lab</button>
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <p class="home-eyebrow">WARDROBE</p>
        <h1 class="page-title">八字衣橱</h1>
        <p class="page-subtitle">幸运色、个人风格、每日穿搭</p>
      </header>
      <section class="mirror-gate">
        <p>需要出生信息，才能把日主五行译成可穿的颜色与风格。</p>
        <button type="button" class="life-btn-primary" data-path="/profile">去管理档案填写 ›</button>
      </section>`;
  } else {
    const chart = castBaziChart(person, new Date().getFullYear(), {
      includeLiunian: false,
      gender: person.gender,
    });
    if ('error' in chart) {
      page.innerHTML = `
        <button type="button" class="back-link life-back" data-path="/">← 返回 Mystic Lab</button>
        <section class="mirror-gate"><p>${escapeHtml(chart.error)}</p></section>`;
    } else {
      pack = buildWardrobePack(chart);
      page.innerHTML = `
        <button type="button" class="back-link life-back" data-path="/">← 返回 Mystic Lab</button>
        <header class="life-header">
          <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
          <p class="home-eyebrow">WARDROBE</p>
          <h1 class="page-title">八字衣橱</h1>
          <p class="page-subtitle">把日主与流日，译成可穿的颜色与风格</p>
        </header>
        ${packBodyHtml(pack)}`;
    }
  }

  root.appendChild(page);
  attachPersonSwitcherToPage(page, {
    onChange: () => {
      disposePolish?.();
      navigate('/wardrobe');
    },
  });

  page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
    el.addEventListener('click', () => {
      const path = el.dataset.path;
      if (path) navigate(path);
    });
  });

  page.querySelectorAll<HTMLButtonElement>('[data-week-day]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.weekDay;
      if (!key) return;
      page.querySelectorAll('[data-week-day]').forEach((b) => {
        b.classList.toggle('is-on', b === btn);
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      page.querySelectorAll<HTMLElement>('[data-day-detail]').forEach((panel) => {
        const on = panel.dataset.dayDetail === key;
        panel.hidden = !on;
        panel.classList.toggle('is-on', on);
      });
    });
  });

  if (pack) {
    let cancelled = false;
    disposePolish = () => {
      cancelled = true;
    };
    const note = page.querySelector<HTMLElement>('[data-ai-note]');
    if (note) {
      note.hidden = false;
      note.textContent = '正在看有没有更口语的写法…';
    }
    void polishWardrobeCopy(pack, {
      personId: person.id,
      nickname: person.nickname,
    }).then((polished) => {
      if (cancelled) return;
      const styleEl = page.querySelector('[data-style-summary]');
      const tipEl = page.querySelector('[data-today-tip]');
      if (styleEl && polished.styleSummary) styleEl.textContent = polished.styleSummary;
      if (tipEl && polished.todayTip) tipEl.textContent = polished.todayTip;
      const todayPanel = page.querySelector<HTMLElement>(
        `[data-day-tip="${pack!.today.dateKey}"]`,
      );
      if (todayPanel && polished.todayTip) todayPanel.textContent = polished.todayTip;
      if (note) {
        if (polished.source === 'ai') note.textContent = '今日与风格句已口语润色';
        else if (polished.source === 'cache') note.textContent = '沿用今日已润色文案';
        else {
          note.textContent = '';
          note.hidden = true;
        }
      }
    });
  }

  return () => {
    disposePolish?.();
    stars.remove();
  };
}
