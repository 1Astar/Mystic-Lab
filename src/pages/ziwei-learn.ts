/**
 * 紫微学习 · 看盘课入口（三节）+ 对照学习挂载一览
 */
import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import {
  COMPARE_MOUNT_TERMS_V1,
  COMPARE_LEARN_BATCH,
  COMPARE_CORPUS,
  ZIWEI_LEARN_LESSONS,
  mountsForLesson,
  renderCompareBlockForTerm,
  type CompareMountTerm,
} from '../ziwei/compare-learn.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function kindLabel(kind: CompareMountTerm['kind']): string {
  if (kind === 'palace') return '宫';
  if (kind === 'method') return '法';
  return '星';
}

function mountListHtml(terms: readonly CompareMountTerm[]): string {
  return `<ul class="zw-learn-mounts">
    ${terms
      .map(
        (t) => `
      <li>
        <span class="zw-learn-mount-kind">${kindLabel(t.kind)}</span>
        <strong>${escapeHtml(t.label)}</strong>
        <span class="zw-muted">${escapeHtml(t.why)}</span>
      </li>`,
      )
      .join('')}
  </ul>`;
}

export function renderZiweiLearn(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page ziwei-page ziwei-learn-page';
  mountEnvBanner(page);
  root.appendChild(page);

  const lessonsHtml = ZIWEI_LEARN_LESSONS.map((lesson) => {
    const mounts = mountsForLesson(lesson.id);
    const cta =
      lesson.status === 'ready'
        ? `<button type="button" class="life-btn-primary" data-zw-learn="${lesson.id}">开始这一节 ›</button>`
        : `<button type="button" class="life-btn-ghost" disabled>下一轮开放</button>`;
    return `
    <section class="zw-learn-lesson" aria-labelledby="zw-learn-${lesson.id}">
      <p class="ziwei-kicker">第 ${lesson.order} 节</p>
      <h2 id="zw-learn-${lesson.id}" class="mm-section-title">${escapeHtml(lesson.title)}</h2>
      <p class="mm-section-lead">${escapeHtml(lesson.lead)}</p>
      <p class="zw-muted">本节对照挂载：${mounts.map((m) => m.label).join('、')}</p>
      <div class="mm-actions">${cta}</div>
    </section>`;
  }).join('');

  page.innerHTML = `
    <button type="button" class="back-link life-back" data-path="/ziwei">← 紫微</button>
    <header class="life-header ziwei-header">
      <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
      <p class="home-eyebrow">ZIWEI LEARN</p>
      <h1 class="life-title">紫微学习</h1>
      <p class="life-sub">整盘跟读 · 自有角色练习 · 图鉴对照另开一层</p>
    </header>

    <section class="zw-learn-intro" aria-label="怎么学">
      <p class="ziwei-kicker">方法</p>
      <p class="mm-section-lead">借「拿着整张盘讲、眼睛跟得上在看哪里」的教法；讲解与练习用随心而行自己的角色重排。倪师原文短引文只在图鉴对照学习层出现。</p>
    </section>

    ${lessonsHtml}

    <section class="zw-learn-compare" aria-label="对照学习挂载">
      <p class="ziwei-kicker">图鉴 · 对照学习</p>
      <h2 class="mm-section-title">首批挂载词（${COMPARE_LEARN_BATCH}）</h2>
      <p class="mm-section-lead">先挂与三节课相关的宫、法、星；图鉴词条后续接短引文 + 署名栏。语料：${escapeHtml(COMPARE_CORPUS.title)}。</p>
      ${mountListHtml(COMPARE_MOUNT_TERMS_V1)}
      <h3 class="zw-learn-sub">词条挂载预览 · 夫妻宫</h3>
      ${renderCompareBlockForTerm('夫妻宫')}
      <div class="mm-actions">
        <button type="button" class="life-btn-ghost" data-path="/ziwei/tujian">打开紫微图鉴 ›</button>
      </div>
    </section>
  `;

  const onClick = (e: Event) => {
    const t = e.target as HTMLElement | null;
    const pathEl = t?.closest?.('[data-path]') as HTMLElement | null;
    if (pathEl?.dataset.path) {
      navigate(pathEl.dataset.path);
      return;
    }
    const lessonEl = t?.closest?.('[data-zw-learn]') as HTMLElement | null;
    const id = lessonEl?.dataset.zwLearn;
    if (id === 'spouse') {
      navigate('/ziwei/learn/spouse');
    }
  };
  page.addEventListener('click', onClick);

  return () => {
    page.removeEventListener('click', onClick);
    page.remove();
    stars.remove();
  };
}

/** 第1节占位：下轮接整盘点夫妻宫；先展示挂载与署名 */
export function renderZiweiLearnSpouse(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);
  const page = document.createElement('div');
  page.className = 'page ziwei-page ziwei-learn-page';
  mountEnvBanner(page);
  root.appendChild(page);

  const mounts = mountsForLesson('spouse');
  page.innerHTML = `
    <button type="button" class="back-link life-back" data-path="/ziwei/learn">← 紫微学习</button>
    <header class="life-header ziwei-header">
      <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
      <p class="home-eyebrow">LESSON 1</p>
      <h1 class="life-title">想看感情，从哪里下手？</h1>
      <p class="life-sub">下一轮接入：原生盘上自己点夫妻宫 · 提示 · 带读 · 换盘</p>
    </header>
    <section aria-label="本节挂载">
      <p class="ziwei-kicker">本节对照词</p>
      ${mountListHtml(mounts)}
    </section>
    ${renderCompareBlockForTerm('夫妻宫')}
    <div class="mm-actions">
      <button type="button" class="life-btn-ghost" data-path="/ziwei/learn">回课表</button>
      <button type="button" class="life-btn-ghost" data-path="/ziwei/tujian?bucket=palaces&palace=%E5%A4%AB%E5%A6%BB">图鉴查夫妻宫 ›</button>
    </div>
  `;

  const onClick = (e: Event) => {
    const el = (e.target as HTMLElement | null)?.closest?.('[data-path]') as HTMLElement | null;
    if (el?.dataset.path) navigate(el.dataset.path);
  };
  page.addEventListener('click', onClick);
  return () => {
    page.removeEventListener('click', onClick);
    page.remove();
    stars.remove();
  };
}
