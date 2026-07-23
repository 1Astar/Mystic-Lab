import { navigate } from '../router.ts';
import { isAiConfigured } from '../ai/settings.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { formatProfileBrief } from '../life/profile-context.ts';
import { hasUsableProfile, loadLifeStore } from '../life/storage.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type PlayMode = {
  n: string;
  title: string;
  desc: string;
  path: string;
  done: boolean;
};

export function renderLifeHome(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const store = loadLifeStore();
  const profileReady = hasUsableProfile(store.profile);
  const portraitReady = Boolean(store.portrait);
  /** 玩法需先有档案 + 轻画像 */
  const gateOpen = profileReady && portraitReady;
  const aiOn = isAiConfigured();

  const modes: PlayMode[] = [
    {
      n: '①',
      title: '平行人生',
      desc: '复制「现在的我」→ 预设分叉 → 五年档案对照',
      path: '/life/parallel',
      done: Boolean(store.worlds.some((w) => w.archive)),
    },
    {
      n: '②',
      title: '选择模拟',
      desc: '决策问题 → A/B/C 可能轨迹对照',
      path: '/life/simulate',
      done: Boolean(store.simulation?.branches?.length),
    },
    {
      n: '③',
      title: '预测打卡',
      desc: '提出假设 + 依据 → 回来 ✅/❌ 对照',
      path: '/life/forecast',
      done: Boolean((store.forecasts ?? []).length),
    },
  ];

  const nextMode = gateOpen ? modes.find((m) => !m.done) ?? modes[0]! : null;

  const page = document.createElement('div');
  page.className = 'page life-page life-home-page';
  mountEnvBanner(page);

  page.innerHTML = `
    <button type="button" class="back-link life-back">← 返回 Mystic Lab</button>
    <header class="life-header">
      <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
      <p class="home-eyebrow">MYSTIC LAB</p>
      <h1 class="page-title">人生宇宙</h1>
      <p class="page-subtitle">三个推演玩法 · 平行 · 选择 · 预测</p>
      <p class="life-ai-hint">${aiOn ? 'AI 已启用 · 推演会更贴你填的信息' : '未启用 AI · 将用本地模板推演，可在设置里打开 AI'}</p>
    </header>

    <section class="life-focus-note" aria-label="定位">
      <p class="life-focus-tag">人生推演</p>
      <p>这里只做<strong>模拟玩法</strong>。现状底座在独立的「档案」模块；建档并生成轻画像后即可开玩。</p>
    </section>

    <section class="life-profile-gate ${gateOpen ? 'is-ready' : ''}" aria-label="档案状态">
      ${
        gateOpen
          ? `<div>
              <p class="life-card-kicker">已连接 · 档案</p>
              <p class="life-gate-brief">${escapeHtml(formatProfileBrief(store.profile))}${
                store.portrait ? ` · ${escapeHtml(store.portrait.stageTitle)}` : ''
              }</p>
            </div>
            <button type="button" class="life-btn-ghost" data-path="/profile">编辑档案 ›</button>`
          : `<div>
              <p class="life-card-kicker">需要先建档案</p>
              <p class="life-gate-brief">玩法会读取「档案」里的现状与轻画像。档案是 Lab 独立模块，各体系共用。</p>
            </div>
            <button type="button" class="life-btn-primary" data-path="/profile">去档案</button>`
      }
    </section>

    <section class="life-route" aria-label="推演玩法">
      <div class="life-route-head">
        <h2 class="life-route-title">推演玩法</h2>
        <p class="life-route-tip">${
          gateOpen
            ? '三个玩法可自由进入，不必按顺序'
            : '建好档案后解锁以下玩法'
        }</p>
      </div>
      <ol class="life-route-list">
        ${modes
          .map((m, i) => {
            const isCurrent = gateOpen && nextMode?.path === m.path;
            const state = !gateOpen
              ? 'is-locked'
              : isCurrent
                ? 'is-current'
                : m.done
                  ? 'is-done'
                  : 'is-open';
            const badge = !gateOpen
              ? '未解锁'
              : isCurrent
                ? '推荐'
                : m.done
                  ? '已玩过'
                  : '可进入';
            return `
            <li class="life-route-step ${state}">
              ${i > 0 ? '<span class="life-route-connector" aria-hidden="true"></span>' : ''}
              <button type="button" class="life-route-card" data-path="${m.path}" data-open="${gateOpen ? '1' : '0'}" data-lock="请先在「档案」生成轻画像" ${gateOpen ? '' : 'aria-disabled="true"'}>
                <span class="life-route-n">${m.n}</span>
                <span class="life-route-body">
                  <strong>${m.title}</strong>
                  <span class="life-route-desc">${m.desc}</span>
                  ${!gateOpen ? '<span class="life-route-lock">需先完成档案</span>' : ''}
                </span>
                <span class="life-route-badge">${badge}</span>
              </button>
            </li>`;
          })
          .join('')}
      </ol>
      <p class="life-route-status" id="life-route-status" hidden></p>
    </section>

    <nav class="life-entry-list" aria-label="相关">
      <button type="button" class="life-entry" data-path="/bazi" data-open="1">
        <span class="life-entry-icon" aria-hidden="true">🀄</span>
        <span class="life-entry-text">
          <strong>八字模块</strong>
          <span>四柱排盘与十神 · 独立体系</span>
        </span>
        <span class="life-entry-chevron" aria-hidden="true">›</span>
      </button>
    </nav>
  `;

  const statusEl = page.querySelector<HTMLElement>('#life-route-status')!;

  page.querySelector('.life-back')?.addEventListener('click', () => navigate('/'));
  page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
    el.addEventListener('click', () => {
      const path = el.dataset.path;
      if (!path) return;
      if (el.dataset.open === '0') {
        statusEl.hidden = false;
        statusEl.textContent = el.dataset.lock || '请先去「档案」建立并生成轻画像';
        statusEl.classList.add('is-flash');
        window.setTimeout(() => statusEl.classList.remove('is-flash'), 600);
        return;
      }
      if ((el as HTMLButtonElement).disabled) return;
      navigate(path);
    });
  });

  root.appendChild(page);
  return () => stars.remove();
}
