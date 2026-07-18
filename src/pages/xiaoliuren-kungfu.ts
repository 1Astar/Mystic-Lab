import { navigate } from '../router.ts';
import { buildPalmKungfuStats } from '../xiaoliuren/palm-kungfu.ts';
import { renderSixGodIcon, getSixGodById } from '../xiaoliuren/six-gods.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mountStaggerEntrance } from '../ui/xiaoliuren/motion.ts';

function barWidth(pct: number): string {
  return `${Math.max(pct > 0 ? 6 : 0, Math.min(100, pct))}%`;
}

export function renderXiaoliurenKungfu(root: HTMLElement): () => void {
  const stats = buildPalmKungfuStats();

  const page = document.createElement('div');
  page.className = 'page xlr-kungfu-page xlr-xuan-page';
  mountEnvBanner(page);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回小六壬';
  back.addEventListener('click', () => navigate('/xiaoliuren'));
  page.append(back);

  const body = document.createElement('div');
  body.className = 'xlr-kungfu-body xlr-stagger-root';

  const modeKnown = stats.modeShares.filter((m) => m.id !== 'unknown' && m.count > 0);
  const modeUnknown = stats.modeShares.find((m) => m.id === 'unknown');

  body.innerHTML = `
    <header class="xlr-kungfu-header xlr-stagger-item" style="--si:1">
      <p class="xlr-home-eyebrow">掌上功夫</p>
      <h1 class="page-title">${stats.title}</h1>
      <p class="page-subtitle">${stats.subtitle}</p>
      <p class="xlr-kungfu-next">${stats.nextHint}</p>
    </header>

    <section class="xlr-kungfu-section xlr-stagger-item" style="--si:2" aria-label="起课概览">
      <h2 class="xlr-kungfu-h2">起课次数</h2>
      <div class="xlr-kungfu-metrics">
        <div class="xlr-kungfu-metric">
          <strong>${stats.totalCasts}</strong>
          <span>总起课</span>
        </div>
        <div class="xlr-kungfu-metric">
          <strong>${stats.withQuestion}</strong>
          <span>写过问题</span>
        </div>
        <div class="xlr-kungfu-metric">
          <strong>${stats.withReflection}</strong>
          <span>写过反思</span>
        </div>
        <div class="xlr-kungfu-metric">
          <strong>${stats.reviewed}</strong>
          <span>已对照</span>
        </div>
      </div>
      ${
        stats.pendingReview > 0
          ? `<p class="xlr-kungfu-note">另有 ${stats.pendingReview} 课待对照 · 可在手札里回看</p>`
          : ''
      }
    </section>

    <section class="xlr-kungfu-section xlr-stagger-item" style="--si:3" aria-label="通关进度">
      <h2 class="xlr-kungfu-h2">三关进度</h2>
      <ul class="xlr-kungfu-gates">
        <li class="is-done">
          <span>关1 · 新手</span>
          <em>${stats.learnClears > 0 ? `已过 ${stats.learnClears} 次` : '待完成'}</em>
        </li>
        <li class="${stats.gates.practice.unlocked ? 'is-done' : 'is-locked'}">
          <span>关2 · 操练</span>
          <em>${stats.gates.practice.unlocked ? `已过 ${stats.practiceClears} 次` : '需先过新手'}</em>
        </li>
        <li class="${stats.quickUnlocked ? 'is-done' : 'is-locked'}">
          <span>关3 · 快速</span>
          <em>${stats.quickUnlocked ? '已解锁' : `还需操练 ${stats.gates.beginner.remaining} 次`}</em>
        </li>
      </ul>
    </section>

    <section class="xlr-kungfu-section xlr-stagger-item" style="--si:4" aria-label="模式占比">
      <h2 class="xlr-kungfu-h2">模式占比</h2>
      <p class="xlr-kungfu-lead">新起课会记入模式；旧手札可能显示「未记录」。</p>
      <div class="xlr-kungfu-bars">
        ${
          modeKnown.length === 0 && !(modeUnknown && modeUnknown.count > 0)
            ? '<p class="xlr-kungfu-empty">还没有带模式的起课记录。</p>'
            : [...modeKnown, ...(modeUnknown && modeUnknown.count > 0 ? [modeUnknown] : [])]
                .map(
                  (m) => `
            <div class="xlr-kungfu-bar-row">
              <span class="xlr-kungfu-bar-label">${m.label}<em>${m.count}</em></span>
              <div class="xlr-kungfu-bar-track" aria-hidden="true">
                <span class="xlr-kungfu-bar-fill" style="width:${barWidth(m.pct)}"></span>
              </div>
              <span class="xlr-kungfu-bar-pct">${m.pct}%</span>
            </div>`,
                )
                .join('')
        }
      </div>
    </section>

    <section class="xlr-kungfu-section xlr-stagger-item" style="--si:5" aria-label="六神频率">
      <h2 class="xlr-kungfu-h2">六神频率</h2>
      <p class="xlr-kungfu-lead">看自己常落哪一位——不是吉凶榜，是熟悉程度。</p>
      <div class="xlr-kungfu-gods">
        ${
          stats.totalCasts === 0
            ? '<p class="xlr-kungfu-empty">起课后，这里会出现六神分布。</p>'
            : stats.godFreq
                .map((g) => {
                  const god = getSixGodById(g.id);
                  return `
              <article class="xlr-kungfu-god">
                ${renderSixGodIcon(god, 'xlr-kungfu-god-icon')}
                <div class="xlr-kungfu-god-meta">
                  <strong>${g.name}</strong>
                  <span>${g.count} 次 · ${g.pct}%</span>
                </div>
                <div class="xlr-kungfu-bar-track" aria-hidden="true">
                  <span class="xlr-kungfu-bar-fill" style="width:${barWidth(g.pct)}"></span>
                </div>
              </article>`;
                })
                .join('')
        }
      </div>
    </section>

    <div class="xlr-kungfu-cta xlr-stagger-item" style="--si:6">
      <button type="button" class="btn" data-go="/xiaoliuren/reading">去起课练一手</button>
      <button type="button" class="btn btn-ghost" data-go="/xiaoliuren/journal">打开手札</button>
    </div>
  `;

  page.append(body);
  body.querySelectorAll<HTMLElement>('[data-go]').forEach((el) => {
    el.addEventListener('click', () => navigate(el.dataset.go!));
  });

  root.appendChild(page);
  mountStaggerEntrance(body);
  return () => {};
}
