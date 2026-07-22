import { navigate } from '../router.ts';
import { isAiConfigured } from '../ai/settings.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { generateForecast } from '../life/generate.ts';
import {
  FORECAST_QUESTION_PRESETS,
  forecastStats,
} from '../life/forecast-templates.ts';
import {
  addForecast,
  clearForecastResult,
  hasUsableProfile,
  loadLifeStore,
  updateForecastCheck,
} from '../life/storage.ts';
import type { LifeForecast } from '../life/types.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resultLabel(f: LifeForecast): string {
  if (f.result === 'hit') return '✅ 命中';
  if (f.result === 'miss') return '❌ 未命中';
  return '⏳ 待对照';
}

export function renderLifeForecast(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  let store = loadLifeStore();
  const aiOn = isAiConfigured();
  const ready = hasUsableProfile(store.profile);

  const page = document.createElement('div');
  page.className = 'page life-page life-forecast-page';
  mountEnvBanner(page);

  if (!ready) {
    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回人生宇宙</button>
      <div class="life-empty">
        <h1 class="page-title">人生预测记录</h1>
        <p>先填一点现状，预测假设才会有依据可对照。</p>
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

  page.innerHTML = `
    <button type="button" class="back-link life-back">← 返回人生宇宙</button>
    <header class="life-header">
      <p class="home-eyebrow">FORECAST LOG</p>
      <h1 class="page-title">人生预测记录</h1>
      <p class="page-subtitle">提出假设 → 写下依据 → 回来打卡对照（不是算命准不准秀）</p>
      <p class="life-ai-hint">${aiOn ? 'AI 已启用' : '本地模板 · 可开 AI 增强'}</p>
    </header>

    <section class="life-forecast-stats" id="life-fc-stats"></section>

    <form class="life-form" id="life-fc-form">
      <label class="life-field life-field-full">
        <span>你想猜什么</span>
        <textarea name="question" rows="2" placeholder="例如：猜猜我下一份工作在哪里？">${escapeHtml(store.profile.confusion || '')}</textarea>
      </label>
      <div class="life-preset-row">
        ${FORECAST_QUESTION_PRESETS.map(
          (q) =>
            `<button type="button" class="life-preset-chip" data-q="${escapeHtml(q)}">${escapeHtml(q)}</button>`,
        ).join('')}
      </div>
      <label class="life-field life-field-full">
        <span>现实补充（可选）</span>
        <textarea name="context" rows="2" placeholder="正在面试哪类岗位、预算、最近发生了什么…"></textarea>
      </label>
      <div class="life-form-actions">
        <button type="submit" class="life-btn-primary" id="life-fc-gen">生成预测假设</button>
      </div>
      <p class="life-status" id="life-status" hidden></p>
    </form>

    <section class="life-forecast-list" id="life-fc-list"></section>
  `;

  const form = page.querySelector<HTMLFormElement>('#life-fc-form')!;
  const qInput = form.elements.namedItem('question') as HTMLTextAreaElement;
  const ctxInput = form.elements.namedItem('context') as HTMLTextAreaElement;
  const statusEl = page.querySelector<HTMLElement>('#life-status')!;
  const statsEl = page.querySelector<HTMLElement>('#life-fc-stats')!;
  const listEl = page.querySelector<HTMLElement>('#life-fc-list')!;
  const genBtn = page.querySelector<HTMLButtonElement>('#life-fc-gen')!;

  function renderStats(): void {
    const list = store.forecasts ?? [];
    const s = forecastStats(list);
    if (s.total === 0) {
      statsEl.innerHTML = `<p class="life-meta">还没有预测记录。先提一个可对照的假设吧。</p>`;
      return;
    }
    const rate =
      s.hit + s.miss > 0
        ? Math.round((s.hit / (s.hit + s.miss)) * 100)
        : null;
    statsEl.innerHTML = `
      <div class="life-stat-row">
        <span>共 ${s.total}</span>
        <span>待对照 ${s.pending}</span>
        <span>命中 ${s.hit}</span>
        <span>未命中 ${s.miss}</span>
        ${rate !== null ? `<span>已对照命中率 ${rate}%</span>` : ''}
      </div>
    `;
  }

  function renderList(): void {
    const list = store.forecasts ?? [];
    if (list.length === 0) {
      listEl.innerHTML = '';
      return;
    }
    listEl.innerHTML = `
      <h2 class="life-archives-title">我的预测档案</h2>
      <div class="life-forecast-cards">
        ${list
          .map((f) => {
            const src = f.source === 'ai' ? 'AI' : '模板';
            const pending = f.result === 'pending';
            return `
            <article class="life-card life-forecast-card" data-id="${escapeHtml(f.id)}">
              <div class="life-forecast-top">
                <p class="life-card-kicker">${escapeHtml(resultLabel(f))} · ${escapeHtml(src)}</p>
                <p class="life-meta">建议对照日 ${escapeHtml(f.checkBy)}</p>
              </div>
              <h3>${escapeHtml(f.question)}</h3>
              <p class="life-forecast-pred">${escapeHtml(f.prediction)}</p>
              <p class="life-forecast-why"><strong>依据</strong> ${escapeHtml(f.rationale)}</p>
              ${f.context ? `<p class="life-meta">现实补充：${escapeHtml(f.context)}</p>` : ''}
              ${
                f.reflection
                  ? `<p class="life-forecast-reflect">复盘：${escapeHtml(f.reflection)}</p>`
                  : ''
              }
              ${
                pending
                  ? `<div class="life-forecast-actions">
                      <input type="text" class="life-fork-input" data-reflect="${escapeHtml(f.id)}" placeholder="可选：实际发生了什么？" />
                      <div class="life-form-actions">
                        <button type="button" class="life-btn-primary" data-hit="${escapeHtml(f.id)}">✅ 命中</button>
                        <button type="button" class="life-btn-secondary" data-miss="${escapeHtml(f.id)}">❌ 未命中</button>
                      </div>
                    </div>`
                  : `<button type="button" class="life-btn-ghost" data-reset="${escapeHtml(f.id)}">改回待对照</button>`
              }
            </article>`;
          })
          .join('')}
      </div>
    `;

    listEl.querySelectorAll<HTMLButtonElement>('[data-hit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.hit!;
        const input = listEl.querySelector<HTMLInputElement>(
          `input[data-reflect="${id}"]`,
        );
        store = updateForecastCheck(id, 'hit', input?.value ?? '');
        renderStats();
        renderList();
      });
    });
    listEl.querySelectorAll<HTMLButtonElement>('[data-miss]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.miss!;
        const input = listEl.querySelector<HTMLInputElement>(
          `input[data-reflect="${id}"]`,
        );
        store = updateForecastCheck(id, 'miss', input?.value ?? '');
        renderStats();
        renderList();
      });
    });
    listEl.querySelectorAll<HTMLButtonElement>('[data-reset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        store = clearForecastResult(btn.dataset.reset!);
        renderStats();
        renderList();
      });
    });
  }

  renderStats();
  renderList();

  page.querySelector('.life-back')?.addEventListener('click', () => navigate('/life'));
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
      statusEl.textContent = '请先写下你想猜的问题。';
      return;
    }
    genBtn.disabled = true;
    statusEl.hidden = false;
    statusEl.textContent = aiOn ? '正在生成预测假设…' : '正在用模板生成…';
    try {
      const draft = await generateForecast(question, ctxInput.value, store.profile);
      store = addForecast(draft);
      renderStats();
      renderList();
      statusEl.textContent =
        draft.source === 'ai'
          ? '已写入预测档案。到复查日回来打卡即可。'
          : '已写入（模板）。配置 AI 后可生成更贴合版本。';
      ctxInput.value = '';
    } catch (err) {
      statusEl.textContent = err instanceof Error ? err.message : '生成失败';
    } finally {
      genBtn.disabled = false;
    }
  });

  root.appendChild(page);
  return () => stars.remove();
}
