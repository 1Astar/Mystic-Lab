import { navigate } from '../router.ts';
import {
  CAST_LOGIC_STEPS,
  DEPTH_LAYERS,
  PALM_SYSTEM_TOPICS,
} from '../xiaoliuren/palm-system.ts';
import { getSixGodByName, renderSixGodIcon, SIX_GODS } from '../xiaoliuren/six-gods.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mountStaggerEntrance } from '../ui/xiaoliuren/motion.ts';

/** 案例学习：同一六神，多场景对照（默认用小吉演示） */
function renderCaseBlock(): string {
  const god = getSixGodByName('小吉')!;
  return `
    <section class="xlr-depth-section xlr-stagger-item" style="--si:5" aria-label="案例学习">
      <p class="xlr-depth-kicker">第五层 · 案例学习</p>
      <h2 class="xlr-depth-h2">同一个「${god.name}」</h2>
      <p class="xlr-depth-lead">本义不变：${god.oneLiner} 问题不同，读法不同。</p>
      <div class="xlr-depth-case-god">
        ${renderSixGodIcon(god, 'xlr-depth-case-icon')}
        <div>
          <strong>${god.name}</strong>
          <p>${god.keywords.join(' · ')}</p>
        </div>
      </div>
      <dl class="xlr-depth-case-grid">
        <div><dt>问感情</dt><dd>${god.emotion}</dd></div>
        <div><dt>问工作</dt><dd>${god.career}</dd></div>
        <div><dt>问旅行</dt><dd>${god.travel}</dd></div>
      </dl>
      <button type="button" class="btn btn-ghost" data-go="/xiaoliuren/codex">看全部六神的多场景解释 →</button>
    </section>
  `;
}

export function renderXiaoliurenDepth(root: HTMLElement): () => void {
  const page = document.createElement('div');
  page.className = 'page xlr-depth-page xlr-xuan-page';
  mountEnvBanner(page);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回小六壬';
  back.addEventListener('click', () => navigate('/xiaoliuren'));
  page.append(back);

  const body = document.createElement('div');
  body.className = 'xlr-depth-body xlr-stagger-root';
  body.innerHTML = `
    <header class="xlr-depth-header xlr-stagger-item" style="--si:1">
      <p class="xlr-home-eyebrow">深度理解</p>
      <h1 class="page-title">从会用到会讲</h1>
      <p class="page-subtitle">五层：会用 → 为什么 → 掌诀 → 起课 → 案例</p>
    </header>

    <ol class="xlr-depth-layers xlr-stagger-item" style="--si:2">
      ${DEPTH_LAYERS.map(
        (l) => `
        <li>
          <span class="xlr-depth-layer-no">${l.id}</span>
          <div>
            <strong>${l.title}</strong>
            <em>${l.goal}</em>
            <p>${l.summary}</p>
          </div>
        </li>`,
      ).join('')}
    </ol>

    <section class="xlr-depth-section xlr-stagger-item" style="--si:3" aria-label="会用与理解为什么">
      <p class="xlr-depth-kicker">第一层 · 会用　／　第二层 · 理解为什么</p>
      <h2 class="xlr-depth-h2">六神：结果是什么，为什么叫这个</h2>
      <div class="xlr-depth-god-list">
        ${SIX_GODS.map(
          (g) => `
          <article class="xlr-depth-god-card">
            ${renderSixGodIcon(g, 'xlr-depth-god-icon')}
            <h3>${g.name}</h3>
            <p class="xlr-depth-god-use"><span>会用</span>${g.oneLiner}</p>
            <p class="xlr-depth-god-why"><span>为什么叫</span>${g.whyName}</p>
            <p class="xlr-depth-god-why"><span>为什么代表</span>${g.whyMeaning}</p>
          </article>`,
        ).join('')}
      </div>
    </section>

    <section class="xlr-depth-section xlr-stagger-item" style="--si:4" aria-label="掌诀与起课">
      <p class="xlr-depth-kicker">第三层 · 掌诀　／　第四层 · 起课</p>
      <h2 class="xlr-depth-h2">位置怎么排，时间怎么变成落位</h2>
      <div class="xlr-depth-palm-topics">
        ${PALM_SYSTEM_TOPICS.map(
          (t) => `
          <article>
            <h3>${t.question}</h3>
            <ul>${t.answer.map((a) => `<li>${a}</li>`).join('')}</ul>
          </article>`,
        ).join('')}
      </div>
      <ol class="xlr-depth-cast-flow" aria-label="起课逻辑">
        ${CAST_LOGIC_STEPS.map(
          (s, i) => `
          <li>
            <span>${s.label}</span>
            <p>${s.detail}</p>
            ${i < CAST_LOGIC_STEPS.length - 1 ? '<em>↓</em>' : ''}
          </li>`,
        ).join('')}
      </ol>
      <button type="button" class="btn" data-go="/xiaoliuren/reading">去起课走一遍 →</button>
    </section>

    ${renderCaseBlock()}
  `;

  body.querySelectorAll<HTMLElement>('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.go!));
  });

  page.append(body);
  root.appendChild(page);
  mountStaggerEntrance(body);

  return () => {};
}
