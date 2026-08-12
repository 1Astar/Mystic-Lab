/**
 * 造命 · 属性来源详情（星曜 + 本周任务打卡）
 */
import { navigate } from '../router.ts';
import { CRAFT_AXES, type CraftAxisId, type CraftAxisScore } from './spirit-roots.ts';
import { listSettledQuestsForAxis, loadWeekSummary, pruneWeekData } from './daily-quest-store.ts';
import {
  WEEK_ATTR_CAP,
  displayPalaceLabel,
  ziweiChartPalaceHref,
} from './daily-quest-types.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function bindSheetClose(sheet: HTMLElement): void {
  sheet.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', () => sheet.remove());
  });
}

/** 板块级：为什么有的轴没有数值 + 去玩引导 */
export function openCraftEmptyAxisTip(opts?: {
  onExploreQuests?: () => void;
}): void {
  document.querySelector('.craft-axis-sheet')?.remove();
  const sheet = document.createElement('div');
  sheet.className = 'craft-axis-sheet is-open';
  sheet.innerHTML = `
    <button type="button" class="ziwei-wq-backdrop" data-close aria-label="关闭"></button>
    <div class="ziwei-wq-card" role="dialog" aria-modal="true" aria-label="为什么有的轴没有数值">
      <p class="ziwei-wq-card-kicker">灵根六轴</p>
      <h2>为什么现在没有数值？</h2>
      <p class="ziwei-wq-card-theme">「定盘未计入 · 有效 0」不是坏了，是这根轴还没被点到。</p>
      <p class="ziwei-wq-card-body">定盘只计入命宫主星映射到的轴。没点到的轴会显示「定盘未计入」，有效分为 0——可以养起来，不是缺数据。</p>
      <h3 class="craft-src-h">可以这样养</h3>
      <ol class="craft-tip-steps">
        <li>去<strong>紫微命盘</strong>点亮星曜，强化雷达对应轴</li>
        <li>在<strong>运限页</strong>完成本周小任务并打卡，给对应轴加分</li>
        <li>本页下方「你现在最想问」走宫位探索，边玩边懂自己</li>
      </ol>
      <div class="ziwei-wq-card-actions">
        <button type="button" class="life-btn-ghost" data-close>知道了</button>
        <button type="button" class="life-btn-secondary" data-craft-tip-quests>看问答任务</button>
        <button type="button" class="life-btn-primary" data-craft-tip-chart>去命盘探索</button>
      </div>
    </div>`;
  document.body.appendChild(sheet);
  bindSheetClose(sheet);
  sheet.querySelector('[data-craft-tip-chart]')?.addEventListener('click', () => {
    sheet.remove();
    navigate('/ziwei/reading?mode=chart');
  });
  sheet.querySelector('[data-craft-tip-quests]')?.addEventListener('click', () => {
    sheet.remove();
    if (opts?.onExploreQuests) {
      opts.onExploreQuests();
      return;
    }
    document.querySelector('.craft-quest-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function openAxisSourceSheet(
  userId: string,
  axisId: CraftAxisId,
  axis?: CraftAxisScore,
): void {
  document.querySelector('.craft-axis-sheet')?.remove();
  pruneWeekData(userId);
  const week = loadWeekSummary(userId);
  const def = CRAFT_AXES.find((a) => a.id === axisId);
  const label = def?.label ?? axisId;
  const starSources = (axis?.sources ?? []).filter((s) => !s.startsWith('本周打卡'));
  const quests = listSettledQuestsForAxis(userId, axisId);
  const questGain = week.attrByAxis[axisId] ?? 0;
  const emptyStars = starSources.length === 0;

  const sheet = document.createElement('div');
  sheet.className = 'craft-axis-sheet is-open';
  sheet.innerHTML = `
    <button type="button" class="ziwei-wq-backdrop" data-close aria-label="关闭"></button>
    <div class="ziwei-wq-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(label)}来源">
      <p class="ziwei-wq-card-kicker">属性来源详情</p>
      <h2>${escapeHtml(label)}</h2>
      <p class="ziwei-wq-card-theme">${escapeHtml(def?.sub ?? '')} · 当前有效分 ${axis?.value ?? '—'}</p>

      <h3 class="craft-src-h">由哪颗星点亮</h3>
      ${
        emptyStars
          ? `<p class="life-footnote">定盘尚未计入该轴主星——不是缺数据。可去命盘点亮相关星曜，或完成本周任务打卡来养这根轴。</p>`
          : `<ul class="craft-src-list">${starSources.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
      }

      <h3 class="craft-src-h">由哪几项本周任务打卡获得</h3>
      ${
        quests.length
          ? `<ul class="craft-src-list">${quests
              .map(
                (q) =>
                  `<li>
                    ${escapeHtml(q.cadence === 'weekly' ? '周常' : '日常')} · ${escapeHtml(displayPalaceLabel(q.topic))} · ${escapeHtml(q.taskTitle)}（+${q.rewardValue}）
                    <button type="button" class="ziwei-dq-palace-link" data-axis-palace="${escapeHtml(q.topic)}">去看落星 ›</button>
                  </li>`,
              )
              .join('')}</ul>
             <p class="life-footnote">本周该轴来自打卡合计 +${questGain} · 全属性周上限 ${week.weekAttrGained}/${WEEK_ATTR_CAP}</p>`
          : `<p class="life-footnote">本周还没有打卡贡献到「${escapeHtml(label)}」。去紫微运限页接任务吧。</p>`
      }
      ${
        week.weekAttrGained >= WEEK_ATTR_CAP
          ? `<p class="ziwei-dq-settle-cap">本周天赋已觉醒圆满；继续打卡会把溢出属性 1:1 转为 XP。</p>`
          : ''
      }
      <div class="ziwei-wq-card-actions">
        ${emptyStars ? `<button type="button" class="life-btn-secondary" data-craft-tip-why>为什么是 0？</button>` : ''}
        <button type="button" class="life-btn-primary" data-close>收起</button>
      </div>
    </div>`;
  document.body.appendChild(sheet);
  bindSheetClose(sheet);
  sheet.querySelector('[data-craft-tip-why]')?.addEventListener('click', () => {
    openCraftEmptyAxisTip();
  });
  sheet.querySelectorAll<HTMLButtonElement>('[data-axis-palace]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const topic = btn.dataset.axisPalace;
      if (!topic) return;
      sheet.remove();
      navigate(ziweiChartPalaceHref(topic));
    });
  });
}
