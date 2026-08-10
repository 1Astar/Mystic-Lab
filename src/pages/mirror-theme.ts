import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { attachPersonSwitcherToPage } from '../ui/module-person-chrome.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { castBaziChart } from '../bazi/cast.ts';
import { parseBirthParts } from '../bazi/parse-birth.ts';
import { getActivePerson } from '../life/storage.ts';
import { buildMirrorCompare, getMirrorTheme } from '../mirror/build-compare.ts';
import { castZiweiChart } from '../ziwei/cast.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function listHtml(items: string[], label: string): string {
  if (!items.length) return '';
  return `
    <div class="mirror-evidence">
      <h3>${escapeHtml(label)}</h3>
      <ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
    </div>`;
}

export function renderMirrorTheme(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const person = getActivePerson();
  const id = new URLSearchParams(location.search).get('id') || 'personality';

  const page = document.createElement('div');
  page.className = 'page life-page mirror-page mirror-theme-page';
  mountEnvBanner(page);

  const canCast = Boolean(
    parseBirthParts(person.birthYear, person.birthMonth, person.birthDay, person.birthHour),
  );

  let body = '';
  if (!canCast || !person.gender) {
    body = `
      <section class="mirror-gate">
        <p>需要完整出生信息与性别才能打开主题详情。</p>
        <button type="button" class="life-btn-primary" data-path="/profile">去管理档案 ›</button>
      </section>`;
  } else {
    const chart = castBaziChart(person, new Date().getFullYear(), {
      includeLiunian: false,
      gender: person.gender,
    });
    const ziwei = castZiweiChart(person);
    if ('error' in chart || 'error' in ziwei) {
      const err = 'error' in chart ? chart.error : (ziwei as { error: string }).error;
      body = `<section class="mirror-gate"><p>${escapeHtml(err)}</p></section>`;
    } else {
      const pack = buildMirrorCompare(chart, ziwei, {
        personName: person.nickname,
        gender: person.gender,
      });
      const theme = getMirrorTheme(pack, id) ?? pack.themes[0]!;
      body = `
        <header class="mirror-detail-head">
          <p class="home-eyebrow">THEME</p>
          <h2 class="page-title">${escapeHtml(theme.title)}</h2>
          <p class="page-subtitle">八字侧重 ${escapeHtml(theme.baziLens)} · 紫微侧重 ${escapeHtml(theme.ziweiLens)}</p>
        </header>

        <section class="mirror-split" aria-label="左右对照">
          <article class="mirror-pane">
            <h3>八字角度</h3>
            <p>${escapeHtml(theme.baziAngle)}</p>
            ${listHtml(theme.baziEvidence, '用了哪些信息')}
          </article>
          <article class="mirror-pane">
            <h3>紫微角度</h3>
            <p>${escapeHtml(theme.ziweiAngle)}</p>
            ${listHtml(theme.ziweiEvidence, '用了哪些宫位 / 星曜')}
          </article>
        </section>

        <section class="mirror-result-stack" aria-label="三种结果">
          <article class="mirror-result">
            <h3>共同指向</h3>
            <p>${escapeHtml(theme.shared)}</p>
          </article>
          <article class="mirror-result">
            <h3>不同角度</h3>
            <p>${escapeHtml(theme.different)}</p>
          </article>
          <article class="mirror-result is-synthesis">
            <h3>综合结论</h3>
            <p>${escapeHtml(theme.synthesis)}</p>
          </article>
        </section>

        <section class="mirror-stability">
          <p><strong>稳定底色</strong> ${escapeHtml(theme.stableNote)}</p>
          <p><strong>会随运限变化</strong> ${escapeHtml(theme.changeNote)}</p>
        </section>`;
    }
  }

  page.innerHTML = `
    <button type="button" class="back-link life-back" data-path="/mirror">← 返回双盘映照</button>
    ${body}
  `;

  root.appendChild(page);
  attachPersonSwitcherToPage(page);

  page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
    el.addEventListener('click', () => {
      const path = el.dataset.path;
      if (path) navigate(path);
    });
  });

  return () => {
    stars.remove();
  };
}
