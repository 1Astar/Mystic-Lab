import { navigate } from '../router.ts';
import { isAiConfigured } from '../ai/settings.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { generateSimulation } from '../life/generate.ts';
import { SIMULATE_QUESTION_PRESETS } from '../life/simulate-templates.ts';
import {
  hasUsableProfile,
  loadLifeStore,
  saveSimulation,
} from '../life/storage.ts';
import type { ChoiceSimulation } from '../life/types.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderLifeSimulate(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  let store = loadLifeStore();
  const aiOn = isAiConfigured();
  const ready = hasUsableProfile(store.profile);

  const page = document.createElement('div');
  page.className = 'page life-page life-simulate-page';
  mountEnvBanner(page);

  if (!ready) {
    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回人生宇宙</button>
      <div class="life-empty">
        <h1 class="page-title">选择模拟</h1>
        <p>先填一点现状信息，模拟才会贴着「现在的我」推演。</p>
        <button type="button" class="life-btn-primary" data-go-profile>去人生档案</button>
      </div>
    `;
    page.querySelector('.life-back')?.addEventListener('click', () => navigate('/life'));
    page.querySelector('[data-go-profile]')?.addEventListener('click', () =>
      navigate('/profile'),
    );
    root.appendChild(page);
    return () => stars.remove();
  }

  const defaultQ =
    store.simulation?.question ||
    store.profile.confusion.trim() ||
    SIMULATE_QUESTION_PRESETS[0];

  page.innerHTML = `
    <button type="button" class="back-link life-back">← 返回人生宇宙</button>
    <header class="life-header">
      <p class="home-eyebrow">CHOICE SIM</p>
      <h1 class="page-title">选择模拟</h1>
      <p class="page-subtitle">同一决策，并排看几条可能轨迹（探索对照，非算命）</p>
      <p class="life-ai-hint">${aiOn ? 'AI 已启用 · 轨迹会更贴你的现状' : '本地模板 · 配置 AI 后可增强'}</p>
    </header>

    <section class="life-card life-now-card">
      <p class="life-card-kicker">现在的我</p>
      <p>${escapeHtml(store.profile.occupation || '职业未填')} · ${escapeHtml(store.profile.city || '城市未填')}${store.portrait ? ` · ${escapeHtml(store.portrait.stageTitle)}` : ''}</p>
    </section>

    <form class="life-form" id="life-sim-form">
      <label class="life-field life-field-full">
        <span>你在犹豫的问题</span>
        <textarea name="question" rows="2" placeholder="例如：我要不要离职？">${escapeHtml(defaultQ)}</textarea>
      </label>
      <div class="life-preset-row" id="life-q-presets">
        ${SIMULATE_QUESTION_PRESETS.map(
          (q) =>
            `<button type="button" class="life-preset-chip" data-q="${escapeHtml(q)}">${escapeHtml(q)}</button>`,
        ).join('')}
      </div>
      <div class="life-form-actions">
        <button type="submit" class="life-btn-primary" id="life-sim-gen">生成对照轨迹</button>
        <button type="button" class="life-btn-ghost" data-path="/life/parallel">去平行人生 ›</button>
      </div>
      <p class="life-status" id="life-status" hidden></p>
    </form>

    <section class="life-sim-result" id="life-sim-result" ${store.simulation ? '' : 'hidden'}></section>
  `;

  const form = page.querySelector<HTMLFormElement>('#life-sim-form')!;
  const qInput = form.elements.namedItem('question') as HTMLTextAreaElement;
  const statusEl = page.querySelector<HTMLElement>('#life-status')!;
  const resultEl = page.querySelector<HTMLElement>('#life-sim-result')!;
  const genBtn = page.querySelector<HTMLButtonElement>('#life-sim-gen')!;

  function renderResult(sim: ChoiceSimulation): void {
    resultEl.hidden = false;
    const src = sim.source === 'ai' ? 'AI 推演' : '本地模板';
    resultEl.innerHTML = `
      <div class="life-horizon">
        <p class="life-horizon-label">推演起点</p>
        <p class="life-horizon-value">${escapeHtml(sim.horizonLabel)}</p>
        <p class="life-horizon-q">问题：${escapeHtml(sim.question)}</p>
        <p class="life-meta">${escapeHtml(src)}</p>
      </div>
      <div class="life-branch-grid">
        ${sim.branches
          .map((b) => {
            const on = sim.selectedBranchId === b.id;
            return `
            <article class="life-card life-branch-card ${on ? 'is-picked' : ''}" data-branch-id="${escapeHtml(b.id)}">
              <p class="life-card-kicker">${escapeHtml(b.label)}</p>
              <h3>${escapeHtml(b.title)}</h3>
              <ol class="life-timeline">
                ${b.trajectory.map((step) => `<li><span>${escapeHtml(step)}</span></li>`).join('')}
              </ol>
              <p class="life-branch-note">${escapeHtml(b.note)}</p>
              <button type="button" class="life-btn-secondary life-pick-btn" data-pick="${escapeHtml(b.id)}">
                ${on ? '已标记想验证' : '标记我想验证这条'}
              </button>
            </article>`;
          })
          .join('')}
      </div>
      ${
        sim.selectedBranchId
          ? `<p class="life-sim-foot">已标记一条轨迹。可以过几周回来对照：现实有没有朝这个方向滑动？</p>`
          : ''
      }
    `;

    resultEl.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.pick!;
        const next: ChoiceSimulation = {
          ...sim,
          selectedBranchId: sim.selectedBranchId === id ? undefined : id,
        };
        store = saveSimulation(next);
        renderResult(next);
      });
    });
  }

  if (store.simulation) renderResult(store.simulation);

  page.querySelector('.life-back')?.addEventListener('click', () => navigate('/life'));
  page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
    el.addEventListener('click', () => navigate(el.dataset.path!));
  });

  page.querySelectorAll<HTMLButtonElement>('[data-q]').forEach((chip) => {
    chip.addEventListener('click', () => {
      qInput.value = chip.dataset.q ?? '';
      qInput.focus();
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = qInput.value.trim();
    if (question.length < 2) {
      statusEl.hidden = false;
      statusEl.textContent = '请先写下你在犹豫的问题。';
      return;
    }
    genBtn.disabled = true;
    statusEl.hidden = false;
    statusEl.textContent = aiOn ? '正在生成对照轨迹…' : '正在用模板生成对照轨迹…';
    try {
      const sim = await generateSimulation(question, store.profile);
      store = saveSimulation(sim);
      renderResult(sim);
      statusEl.textContent =
        sim.source === 'ai'
          ? '已生成（AI）。点一条标记「想验证」，方便日后对照。'
          : '已生成（模板）。配置 AI 后可再生成更贴合版本。';
    } catch (err) {
      statusEl.textContent = err instanceof Error ? err.message : '生成失败';
    } finally {
      genBtn.disabled = false;
    }
  });

  root.appendChild(page);
  return () => stars.remove();
}
