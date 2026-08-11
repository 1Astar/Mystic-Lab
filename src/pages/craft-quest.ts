import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { attachPersonSwitcherToPage } from '../ui/module-person-chrome.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { resolveCraftAnswer } from '../craft/build-answer.ts';
import { isoWeekKey } from '../craft/quests.ts';
import {
  hasChecked,
  levelProgressPct,
  loadCraftXp,
  markChecked,
  xpToNextLevel,
} from '../craft/xp.ts';
import { getActivePerson } from '../life/storage.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderCraftQuest(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const person = getActivePerson();
  const questId = new URLSearchParams(location.search).get('id') || '';
  const week = isoWeekKey();
  const resolved = resolveCraftAnswer(person, questId);

  const page = document.createElement('div');
  page.className = 'page life-page craft-page craft-quest-page';
  mountEnvBanner(page);

  if (!resolved.ok) {
    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/craft">← 返回造命问答</button>
      <header class="life-header">
        <h1 class="page-title">造命问答</h1>
        <p class="page-subtitle">${escapeHtml(resolved.error)}</p>
      </header>
      <button type="button" class="life-btn-primary" data-path="/profile">去管理档案 ›</button>
    `;
    root.appendChild(page);
    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
    return () => stars.remove();
  }

  const { answer } = resolved;
  let xpState = loadCraftXp();
  let done = hasChecked(week, answer.quest.id, xpState);

  function paintXpStrip(): string {
    const pct = levelProgressPct(xpState);
    return `
      <div class="craft-xp-mini">
        <span>Lv.${xpState.level} · ${xpState.xp} XP</span>
        <div class="craft-xp-bar craft-xp-bar-sm"><i style="width:${pct}%"></i></div>
      </div>`;
  }

  function paint(): void {
    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/craft">← 换一个问题</button>
      <header class="life-header">
        <p class="home-eyebrow">QUEST</p>
        <h1 class="page-title">${escapeHtml(answer.quest.button)}</h1>
        <p class="page-subtitle">${escapeHtml(answer.quest.question)}</p>
        ${paintXpStrip()}
      </header>

      <section class="craft-step" aria-label="定位宫位">
        <p class="craft-step-kicker">① 定位宫位</p>
        <h2>${escapeHtml(answer.palaceTitle)} · ${escapeHtml(answer.palaceHint)}</h2>
        <div class="craft-keywords">
          ${answer.keywords.map((k) => `<span class="craft-chip">${escapeHtml(k)}</span>`).join('')}
        </div>
        <p class="life-footnote">先认这个人生场景，再谈答案——你在学「宫位是干嘛的」。</p>
      </section>

      <section class="craft-step" aria-label="白话结论">
        <p class="craft-step-kicker">② 白话结论</p>
        ${answer.conclusion
          .split(/\n\n+/)
          .map((p) => `<p class="craft-para">${escapeHtml(p)}</p>`)
          .join('')}
        <p class="craft-challenge">${escapeHtml(answer.challenge)}</p>
      </section>

      <section class="craft-step craft-task" aria-label="本周小任务">
        <p class="craft-step-kicker">③ 本周小任务</p>
        <p class="craft-para">${escapeHtml(answer.weeklyTask)}</p>
        <p class="life-footnote">完成可 +${answer.quest.xp} XP · 本周键 ${escapeHtml(week)}</p>
        <div class="bazi-rectify-actions">
          <button type="button" class="life-btn-primary" id="craft-check" ${done ? 'disabled' : ''}>
            ${done ? '本周已打卡 ✓' : '完成并打卡'}
          </button>
          <button type="button" class="life-btn-ghost" data-path="/ziwei/tujian">去紫微图鉴 ›</button>
        </div>
        <p class="life-status" id="craft-check-status" ${done ? '' : 'hidden'}>
          ${done ? '已计入星盘经验。下一级还差 ' + xpToNextLevel(xpState) + ' XP。' : ''}
        </p>
      </section>

      <section class="craft-classroom">
        <p class="craft-step-kicker">紫微小课堂</p>
        <p>${escapeHtml(answer.learnTip)}</p>
      </section>
    `;

    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });

    page.querySelector('#craft-check')?.addEventListener('click', () => {
      const res = markChecked(week, answer.quest.id, answer.quest.xp);
      xpState = res.state;
      done = true;
      const status = page.querySelector<HTMLElement>('#craft-check-status');
      if (status) {
        status.hidden = false;
        status.textContent = res.already
          ? '本周已打过卡。'
          : `打卡成功 +${res.gained} XP！星盘 Lv.${res.state.level}，距下一级 ${xpToNextLevel(res.state)} XP。`;
      }
      paint();
    });
  }

  root.appendChild(page);
  attachPersonSwitcherToPage(page);
  paint();

  return () => {
    stars.remove();
  };
}
