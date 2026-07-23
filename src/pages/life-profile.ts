import { navigate } from '../router.ts';
import { isAiConfigured } from '../ai/settings.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { mountBirthDatetimeField } from '../ui/birth-datetime-picker.ts';
import { generatePortrait } from '../life/generate.ts';
import {
  formatBirthBrief,
  hasUsableProfile,
  loadLifeStore,
  saveLifeStore,
} from '../life/storage.ts';
import type { LifeProfileInput } from '../life/types.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readForm(form: HTMLFormElement): LifeProfileInput {
  const g = (name: string) =>
    (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null)?.value?.trim() ??
    '';
  return {
    age: g('age'),
    occupation: g('occupation'),
    city: g('city'),
    birthYear: g('birthYear'),
    birthMonth: g('birthMonth'),
    birthDay: g('birthDay'),
    birthHour: g('birthHour'),
    birthPlace: g('birthPlace'),
    confusion: g('confusion'),
  };
}

export function renderLifeProfile(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  let store = loadLifeStore();
  const aiOn = isAiConfigured();

  const page = document.createElement('div');
  page.className = 'page life-page life-profile-page';
  mountEnvBanner(page);

  const p = store.profile;

  page.innerHTML = `
    <button type="button" class="back-link life-back">← 返回 Mystic Lab</button>
    <header class="life-header">
      <p class="home-eyebrow">LAB PROFILE</p>
      <h1 class="page-title">我的档案</h1>
      <p class="page-subtitle">Lab 全局通用 · 塔罗 / 小六壬 / 六爻 / 人生宇宙解读都可选用</p>
      <p class="life-ai-hint">${aiOn ? '将优先用 AI 推演' : '本地模板推演 · 配置 AI 后可更贴合现状'}</p>
    </header>

    <form class="life-form" id="life-profile-form">
      <fieldset class="life-fieldset">
        <legend>当前人生状态</legend>
        <label class="life-field"><span>年龄</span><input name="age" type="text" inputmode="numeric" placeholder="如 29" value="${escapeHtml(p.age)}" /></label>
        <label class="life-field"><span>职业</span><input name="occupation" type="text" placeholder="如 产品经理" value="${escapeHtml(p.occupation)}" /></label>
        <label class="life-field"><span>城市</span><input name="city" type="text" placeholder="如 上海" value="${escapeHtml(p.city)}" /></label>
        <label class="life-field life-field-full">
          <span>当前困惑</span>
          <textarea name="confusion" rows="3" placeholder="例如：要不要离职？下一份工作去哪里？">${escapeHtml(p.confusion)}</textarea>
        </label>
      </fieldset>

      <fieldset class="life-fieldset">
        <legend>出生信息 · 轻画像入口</legend>
        <div id="life-birth-dt-slot" class="life-birth-row"></div>
        <label class="life-field life-field-full"><span>出生地点</span><input name="birthPlace" type="text" placeholder="可选" value="${escapeHtml(p.birthPlace)}" /></label>
        <p class="life-footnote">也可在「八字」模块直接填写出生信息，两边共用同一份档案。</p>
      </fieldset>

      <div class="life-form-actions">
        <button type="submit" class="life-btn-primary" id="life-gen-btn">生成我的人生阶段</button>
        <button type="button" class="life-btn-ghost" id="life-to-life" ${store.portrait ? '' : 'disabled'}>去人生宇宙玩法 ›</button>
      </div>
      <p class="life-status" id="life-status" hidden></p>
    </form>

    <section class="life-portrait" id="life-portrait" ${store.portrait ? '' : 'hidden'}></section>
  `;

  const form = page.querySelector<HTMLFormElement>('#life-profile-form')!;
  const statusEl = page.querySelector<HTMLElement>('#life-status')!;
  const portraitEl = page.querySelector<HTMLElement>('#life-portrait')!;
  const toLife = page.querySelector<HTMLButtonElement>('#life-to-life')!;
  const genBtn = page.querySelector<HTMLButtonElement>('#life-gen-btn')!;
  const birthSlot = page.querySelector<HTMLElement>('#life-birth-dt-slot')!;

  mountBirthDatetimeField({
    host: form,
    replaceEl: birthSlot,
    initialYear: p.birthYear,
    initialMonth: p.birthMonth,
    initialDay: p.birthDay,
    initialHour: p.birthHour,
  });

  function renderPortrait(): void {
    const portrait = store.portrait;
    if (!portrait) {
      portraitEl.hidden = true;
      portraitEl.innerHTML = '';
      toLife.disabled = true;
      return;
    }
    portraitEl.hidden = false;
    toLife.disabled = false;
    const sourceLabel = portrait.source === 'ai' ? 'AI 推演' : '本地模板';
    portraitEl.innerHTML = `
      <div class="life-card life-card-portrait">
        <p class="life-card-kicker">你的当前人生阶段 · ${escapeHtml(sourceLabel)}</p>
        <h2>${escapeHtml(portrait.stageTitle)}</h2>
        <p class="life-card-body">${escapeHtml(portrait.stageSummary)}</p>
        <div class="life-chip-row">
          ${portrait.tendencies.map((t) => `<span class="life-chip">${escapeHtml(t)}</span>`).join('')}
        </div>
        <p class="life-meta">人生主题：${portrait.themes.map(escapeHtml).join(' · ')}</p>
        <p class="life-meta">出生简记：${escapeHtml(formatBirthBrief(store.profile))}</p>
        <ul class="life-hint-list">
          ${portrait.stageHints.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  renderPortrait();

  page.querySelector('.life-back')?.addEventListener('click', () => navigate('/'));
  toLife.addEventListener('click', () => navigate('/life'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const profile = readForm(form);
    if (!hasUsableProfile(profile)) {
      statusEl.hidden = false;
      statusEl.textContent = '请至少填写年龄、职业、城市或困惑中的一项。';
      return;
    }

    genBtn.disabled = true;
    statusEl.hidden = false;
    statusEl.textContent = aiOn ? '正在结合你的信息推演…' : '正在用本地模板生成…';

    try {
      const portrait = await generatePortrait(profile);
      store = {
        ...store,
        profile,
        portrait,
        updatedAt: new Date().toISOString(),
      };
      saveLifeStore(store);
      renderPortrait();
      statusEl.textContent =
        portrait.source === 'ai'
          ? '已生成（AI）。可去人生宇宙玩平行 / 选择 / 预测。'
          : '已生成（本地模板）。配置 AI 后可再生成更贴合的版本。';
    } catch (err) {
      statusEl.textContent = err instanceof Error ? err.message : '生成失败';
    } finally {
      genBtn.disabled = false;
    }
  });

  root.appendChild(page);
  return () => {
    stars.remove();
    document.querySelector('.birth-dt-sheet')?.remove();
  };
}
