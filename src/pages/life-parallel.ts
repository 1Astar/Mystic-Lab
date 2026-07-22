import { navigate } from '../router.ts';
import { isAiConfigured } from '../ai/settings.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { FORK_PRESETS } from '../life/fork-presets.ts';
import { generateArchives } from '../life/generate.ts';
import {
  hasUsableProfile,
  loadLifeStore,
  saveLifeStore,
} from '../life/storage.ts';
import type { ParallelWorld } from '../life/types.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderLifeParallel(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  let store = loadLifeStore();
  const aiOn = isAiConfigured();
  const ready = hasUsableProfile(store.profile) && Boolean(store.portrait);

  const page = document.createElement('div');
  page.className = 'page life-page life-parallel-page';
  mountEnvBanner(page);

  if (!ready) {
    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回人生宇宙</button>
      <div class="life-empty">
        <h1 class="page-title">平行人生</h1>
        <p>请先建立「现在的我」档案，再复制出平行世界。</p>
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

  const me = store.profile;
  const portrait = store.portrait!;

  page.innerHTML = `
    <button type="button" class="back-link life-back">← 返回人生宇宙</button>
    <header class="life-header">
      <p class="home-eyebrow">PARALLEL LIVES</p>
      <h1 class="page-title">平行人生</h1>
      <p class="page-subtitle">复制「现在的我」，对照不同分叉的五年档案</p>
      <p class="life-ai-hint">${aiOn ? 'AI 已启用' : '本地模板 · 可开 AI 增强叙事'}</p>
    </header>

    <section class="life-card life-now-card">
      <p class="life-card-kicker">现在的我</p>
      <h2>${escapeHtml(portrait.stageTitle)}</h2>
      <p>${escapeHtml(me.occupation || '职业未填')} · ${escapeHtml(me.city || '城市未填')} · ${escapeHtml(me.age ? `${me.age}岁` : '年龄未填')}</p>
      <p class="life-card-body">${escapeHtml(me.confusion || portrait.stageSummary)}</p>
    </section>

    <section class="life-forks" aria-label="选择分叉">
      <div class="life-forks-head">
        <h2>选择 2–4 个世界</h2>
        <p>点选预设，可改文案；也可点「自定义」加一条。</p>
      </div>
      <div class="life-fork-list" id="life-fork-list"></div>
      <div class="life-form-actions">
        <button type="button" class="life-btn-ghost" id="life-add-custom">+ 自定义分叉</button>
        <button type="button" class="life-btn-primary" id="life-gen-worlds">生成五年后档案</button>
      </div>
      <p class="life-status" id="life-status" hidden></p>
    </section>

    <section class="life-archives" id="life-archives" hidden></section>
  `;

  const listEl = page.querySelector<HTMLElement>('#life-fork-list')!;
  const archivesEl = page.querySelector<HTMLElement>('#life-archives')!;
  const statusEl = page.querySelector<HTMLElement>('#life-status')!;
  const genBtn = page.querySelector<HTMLButtonElement>('#life-gen-worlds')!;

  function selectedCount(): number {
    return store.worlds.filter((w) => w.selected).length;
  }

  function renderForks(): void {
    listEl.innerHTML = store.worlds
      .map((w) => {
        const presetHint = FORK_PRESETS.find((p) => p.id === w.id)?.divergence;
        return `
        <label class="life-fork-item ${w.selected ? 'is-on' : ''}">
          <input type="checkbox" data-world-id="${escapeHtml(w.id)}" ${w.selected ? 'checked' : ''} />
          <span class="life-fork-label">${escapeHtml(w.label)}</span>
          <input type="text" class="life-fork-input" data-div-id="${escapeHtml(w.id)}" value="${escapeHtml(w.divergence)}" placeholder="${escapeHtml(presetHint || '描述这个世界的分叉')}" />
        </label>`;
      })
      .join('');

    listEl.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((box) => {
      box.addEventListener('change', () => {
        const id = box.dataset.worldId!;
        const on = box.checked;
        if (on && selectedCount() >= 4) {
          box.checked = false;
          statusEl.hidden = false;
          statusEl.textContent = '最多同时对照 4 个世界。';
          return;
        }
        store = {
          ...store,
          worlds: store.worlds.map((w) =>
            w.id === id ? { ...w, selected: on } : w,
          ),
        };
        saveLifeStore(store);
        renderForks();
      });
    });

    listEl.querySelectorAll<HTMLInputElement>('.life-fork-input').forEach((input) => {
      input.addEventListener('change', () => {
        const id = input.dataset.divId!;
        store = {
          ...store,
          worlds: store.worlds.map((w) =>
            w.id === id ? { ...w, divergence: input.value.trim() } : w,
          ),
        };
        saveLifeStore(store);
      });
    });
  }

  function renderArchives(worlds: ParallelWorld[]): void {
    const withArchive = worlds.filter((w) => w.selected && w.archive);
    if (withArchive.length === 0) {
      archivesEl.hidden = true;
      archivesEl.innerHTML = '';
      return;
    }
    archivesEl.hidden = false;
    archivesEl.innerHTML = `
      <h2 class="life-archives-title">五年后 · 平行对照</h2>
      <div class="life-archive-grid">
        ${withArchive
          .map((w) => {
            const a = w.archive!;
            const src = a.source === 'ai' ? 'AI' : '模板';
            return `
            <article class="life-card life-archive-card">
              <p class="life-card-kicker">${escapeHtml(w.label)} · ${escapeHtml(src)}</p>
              <h3>${escapeHtml(w.divergence)}</h3>
              <p class="life-tone">${escapeHtml(a.tone)}</p>
              <p class="life-archive-title">${escapeHtml(a.title)}</p>
              <p class="life-card-body">${escapeHtml(a.summary)}</p>
              <dl class="life-dl">
                <div><dt>工作</dt><dd>${escapeHtml(a.work)}</dd></div>
                <div><dt>生活</dt><dd>${escapeHtml(a.lifestyle)}</dd></div>
                <div><dt>关系</dt><dd>${escapeHtml(a.relationships)}</dd></div>
                <div><dt>成长</dt><dd>${escapeHtml(a.growth)}</dd></div>
              </dl>
            </article>`;
          })
          .join('')}
      </div>`;
  }

  renderForks();
  renderArchives(store.worlds);

  page.querySelector('.life-back')?.addEventListener('click', () => navigate('/life'));

  page.querySelector('#life-add-custom')?.addEventListener('click', () => {
    if (store.worlds.length >= 6) {
      statusEl.hidden = false;
      statusEl.textContent = '最多 6 条分叉（含预设）。';
      return;
    }
    const n = store.worlds.length + 1;
    const id = `custom-${Date.now()}`;
    store = {
      ...store,
      worlds: [
        ...store.worlds,
        {
          id,
          label: `世界 ${String.fromCharCode(64 + n)}`,
          divergence: '',
          selected: selectedCount() < 4,
        },
      ],
    };
    saveLifeStore(store);
    renderForks();
  });

  genBtn.addEventListener('click', async () => {
    const picked = store.worlds.filter((w) => w.selected && w.divergence.trim());
    if (picked.length < 2) {
      statusEl.hidden = false;
      statusEl.textContent = '请至少选择并填写 2 个分叉。';
      return;
    }
    genBtn.disabled = true;
    statusEl.hidden = false;
    statusEl.textContent = aiOn ? '正在生成平行档案…' : '正在用模板生成平行档案…';
    try {
      const worlds = await generateArchives(store.profile, store.worlds);
      store = { ...store, worlds };
      saveLifeStore(store);
      renderArchives(worlds);
      statusEl.textContent = '五年档案已就绪。对照看看哪条轨迹更像你想验证的假设。';
    } catch (err) {
      statusEl.textContent = err instanceof Error ? err.message : '生成失败';
    } finally {
      genBtn.disabled = false;
    }
  });

  root.appendChild(page);
  return () => stars.remove();
}
