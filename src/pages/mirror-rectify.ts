/**
 * 双盘映照 · 多时辰校准入口（复用生时校准事件草稿）
 */
import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { eventsReadyForScore, filledEvents } from '../bazi/rectify-events.ts';
import { loadRectifyDraft } from '../bazi/rectify-draft.ts';
import { parseBirthParts } from '../bazi/parse-birth.ts';
import { formatBirthBrief, getActivePerson, loadLifeStore } from '../life/storage.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderMirrorRectify(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const store = loadLifeStore();
  const person = getActivePerson();
  const readyDate = Boolean(
    parseBirthParts(store.profile.birthYear, store.profile.birthMonth, store.profile.birthDay, ''),
  );
  const draft = loadRectifyDraft();
  const eventsOk = draft ? eventsReadyForScore(draft.events, draft.mode) : false;
  const filledN = draft ? filledEvents(draft.events).length : 0;

  const page = document.createElement('div');
  page.className = 'page life-page mirror-page mirror-rectify-page';
  mountEnvBanner(page);

  if (!readyDate) {
    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/mirror">← 返回双盘映照</button>
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
        <h1 class="page-title">多时辰双盘校准</h1>
        <p class="page-subtitle">需要先填写出生年月日</p>
      </header>
      <section class="mirror-gate">
        <p>校准靠大事件反推时辰；先补齐档案里的生日。</p>
        <button type="button" class="life-btn-primary" data-path="/profile">去管理档案 ›</button>
      </section>`;
  } else if (!person.gender) {
    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/mirror">← 返回双盘映照</button>
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
        <h1 class="page-title">多时辰双盘校准</h1>
        <p class="page-subtitle">紫微排盘需要性别</p>
      </header>
      <section class="mirror-gate">
        <p>当前档案：${escapeHtml(formatBirthBrief(store.profile))}</p>
        <button type="button" class="life-btn-primary" data-path="/profile">去档案选性别 ›</button>
      </section>`;
  } else {
    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/mirror">← 返回双盘映照</button>
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
        <p class="home-eyebrow">DUAL RECTIFY</p>
        <h1 class="page-title">多时辰双盘校准</h1>
        <p class="page-subtitle">候选时辰分别排八字与紫微，用人生事件看哪边更贴。</p>
        <p class="bazi-home-person">当前 · ${escapeHtml(person.nickname)} · ${escapeHtml(formatBirthBrief(store.profile))}</p>
      </header>

      <section class="mirror-hero-meta">
        <p><strong>怎么做</strong></p>
        <p>1. 收窄大概时段，并填入学/入职/搬家等大事件（与八字生时校准共用草稿）。</p>
        <p>2. 每个候选时辰各自排盘：八字看流年十神，紫微看流年命宫。</p>
        <p>3. 得到八字解释力 / 紫微解释力 / 综合可信度，可暂用采用写回档案。</p>
      </section>

      <section class="mirror-rectify-actions">
        ${
          eventsOk
            ? `<p class="mirror-footnote">已有 ${filledN} 条可用事件，可直接双盘打分。</p>
               <button type="button" class="life-btn-primary" data-path="/mirror/rectify/result">对照双盘打分 ›</button>
               <button type="button" class="life-btn-ghost" data-path="/bazi/rectify">编辑时段与事件</button>`
            : `<p class="mirror-footnote">还没有足够事件（当前 ${filledN} 条）。先去生时校准填时段与年表，再回来打分。</p>
               <button type="button" class="life-btn-primary" data-path="/bazi/rectify">去填写时段与事件 ›</button>`
        }
      </section>`;
  }

  root.appendChild(page);
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
