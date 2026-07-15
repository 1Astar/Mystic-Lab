import { navigate } from '../router.ts';
import {
  getContinuePalmChapter,
  getNextPalmChapter,
  getPalmChapter,
  formatPalmJourneyLevel,
  getPalmJourneyLevel,
  isPalmJourneyComplete,
  loadPalmJourneyProgress,
  markPalmChapterDone,
  markPalmJourneyCelebrated,
  PALM_JOURNEY_CHAPTERS,
  type PalmJourneyChapterId,
} from '../xiaoliuren/palm-journey.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mountStaggerEntrance } from '../ui/xiaoliuren/motion.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderXiaoliurenPalmJourney(root: HTMLElement): () => void {
  let openId: PalmJourneyChapterId | null = null;

  const page = document.createElement('div');
  page.className = 'page xlr-palm-journey-page xlr-xuan-page';
  mountEnvBanner(page);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回小六壬';
  back.addEventListener('click', () => navigate('/xiaoliuren'));
  page.append(back);

  const body = document.createElement('div');
  body.className = 'xlr-palm-journey-body';
  page.append(body);
  root.appendChild(page);

  function closeDetail(): void {
    openId = null;
    page.querySelector('.xlr-journey-sheet')?.remove();
  }

  function openDetail(id: PalmJourneyChapterId): void {
    closeDetail();
    const chapter = getPalmChapter(id);
    if (!chapter) return;
    openId = id;

    const done = loadPalmJourneyProgress().completed.includes(id);
    const next = getNextPalmChapter(id);
    const allDone = isPalmJourneyComplete() || (done && !next);

    const sheet = document.createElement('div');
    sheet.className = 'xlr-journey-sheet';
    sheet.innerHTML = `
      <button type="button" class="xlr-journey-sheet-backdrop" aria-label="关闭"></button>
      <aside class="xlr-journey-sheet-panel" role="dialog" aria-labelledby="xlr-journey-title">
        <div class="xlr-journey-sheet-handle" aria-hidden="true"></div>
        <button type="button" class="xlr-journey-sheet-close" aria-label="关闭">✕</button>
        <div class="xlr-journey-sheet-scroll">
          <p class="xlr-journey-kicker">掌上演算之旅 · Lv${chapter.level} · 第 ${chapter.order} 章</p>
          <h2 id="xlr-journey-title" class="xlr-journey-title">${escapeHtml(chapter.title)}</h2>
          <p class="xlr-journey-sub">${escapeHtml(chapter.subtitle)}</p>
          ${chapter.body.map((p) => `<p class="xlr-journey-p">${escapeHtml(p)}</p>`).join('')}
          <div class="xlr-journey-actions">
            <button type="button" class="btn" data-act="practice">${escapeHtml(chapter.practiceLabel)} →</button>
            ${
              done
                ? '<p class="xlr-journey-done-badge">本章已完成</p>'
                : '<button type="button" class="btn btn-ghost" data-act="complete">标记本章完成</button>'
            }
            ${
              next
                ? `<button type="button" class="btn btn-ghost" data-act="next">下一章 · ${escapeHtml(next.title)}</button>`
                : allDone || done
                  ? '<button type="button" class="btn" data-act="celebrate">完成旅程</button>'
                  : ''
            }
          </div>
        </div>
      </aside>
    `;

    const close = () => {
      sheet.classList.remove('is-open');
      window.setTimeout(() => {
        sheet.remove();
        openId = null;
      }, 240);
    };

    sheet.querySelector('.xlr-journey-sheet-backdrop')?.addEventListener('click', close);
    sheet.querySelector('.xlr-journey-sheet-close')?.addEventListener('click', close);

    sheet.querySelector('[data-act="practice"]')?.addEventListener('click', () => {
      markPalmChapterDone(id);
      navigate(chapter.practicePath);
    });

    sheet.querySelector('[data-act="complete"]')?.addEventListener('click', () => {
      markPalmChapterDone(id);
      openDetail(id);
      renderList();
    });

    sheet.querySelector('[data-act="next"]')?.addEventListener('click', () => {
      markPalmChapterDone(id);
      if (next) openDetail(next.id);
      renderList();
    });

    sheet.querySelector('[data-act="celebrate"]')?.addEventListener('click', () => {
      markPalmChapterDone(id);
      markPalmJourneyCelebrated();
      closeDetail();
      renderList();
      showCelebration();
    });

    page.append(sheet);
    requestAnimationFrame(() => sheet.classList.add('is-open'));
  }

  function showCelebration(): void {
    body.querySelector('.xlr-journey-celebrate')?.remove();
    const el = document.createElement('section');
    el.className = 'xlr-journey-celebrate';
    el.innerHTML = `
      <p class="xlr-journey-celebrate-eyebrow">PALM JOURNEY</p>
      <h2>恭喜，你已经完成第一次掌上演算。</h2>
      <p>Lv1–Lv6 已通关：识六神、看农历、找时辰、完成起课、理解结果、自己解释。接下来可以随时起课，或回图鉴加深印象。</p>
      <div class="xlr-journey-celebrate-actions">
        <button type="button" class="btn" data-go="/xiaoliuren/reading">再起一课</button>
        <button type="button" class="btn btn-ghost" data-go="/xiaoliuren/codex">六神图鉴</button>
      </div>
    `;
    el.querySelectorAll<HTMLElement>('[data-go]').forEach((btn) => {
      btn.addEventListener('click', () => navigate(btn.dataset.go!));
    });
    body.prepend(el);
  }

  function renderList(): void {
    const progress = loadPalmJourneyProgress();
    const doneSet = new Set(progress.completed);
    const doneCount = progress.completed.length;
    const level = getPalmJourneyLevel();
    const complete = doneCount >= PALM_JOURNEY_CHAPTERS.length;
    const continueChapter = getContinuePalmChapter();

    body.innerHTML = `
      <header class="xlr-palm-journey-header xlr-stagger-root">
        <p class="xlr-home-eyebrow xlr-stagger-item" style="--si:1">随心而行 · 小六壬</p>
        <h1 class="page-title xlr-stagger-item" style="--si:2">掌上演算之旅</h1>
        <p class="page-subtitle xlr-stagger-item" style="--si:3">Lv1–Lv6：从识六神到自己解释</p>
        <div class="xlr-journey-progress xlr-stagger-item" style="--si:4" aria-label="学习进度">
          <div class="xlr-journey-progress-bar">
            <span style="width:${(doneCount / PALM_JOURNEY_CHAPTERS.length) * 100}%"></span>
          </div>
          <p class="xlr-journey-progress-label">${formatPalmJourneyLevel(level)} · ${doneCount} / ${PALM_JOURNEY_CHAPTERS.length} 章</p>
        </div>
        ${
          !complete
            ? `<button type="button" class="btn xlr-journey-continue xlr-stagger-item" style="--si:5" data-continue="${continueChapter.id}">继续 · Lv${continueChapter.level} ${escapeHtml(continueChapter.title)}</button>`
            : ''
        }
      </header>
      <ol class="xlr-journey-list xlr-stagger-root">
        ${PALM_JOURNEY_CHAPTERS.map((c, i) => {
          const done = doneSet.has(c.id);
          return `
            <li class="xlr-journey-card xlr-stagger-item${done ? ' is-done' : ''}" style="--si:${i + 1}">
              <button type="button" data-chapter="${c.id}">
                <span class="xlr-journey-card-no">Lv${c.level}</span>
                <span class="xlr-journey-card-main">
                  <strong>${escapeHtml(c.title)}</strong>
                  <em>${escapeHtml(c.subtitle)}</em>
                </span>
                <span class="xlr-journey-card-status">${done ? '已完成' : '未开始'}</span>
              </button>
            </li>`;
        }).join('')}
      </ol>
    `;

    if (complete) showCelebration();

    body.querySelector('[data-continue]')?.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.continue as PalmJourneyChapterId;
      openDetail(id);
    });

    body.querySelectorAll<HTMLElement>('[data-chapter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openDetail(btn.dataset.chapter as PalmJourneyChapterId);
      });
    });

    mountStaggerEntrance(body);
  }

  renderList();
  if (openId) openDetail(openId);

  return () => {
    closeDetail();
  };
}
