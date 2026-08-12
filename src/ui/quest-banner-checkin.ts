/**
 * 运限页 · QuestBanner（顶）+ QuestCheckIn（底）
 */
import { navigate } from '../router.ts';
import type { PersonProfile } from '../life/types.ts';
import type { ZiweiChartView } from '../ziwei/types.ts';
import { CRAFT_AXES } from '../craft/spirit-roots.ts';
import {
  enrichQuestsWithAi,
  ensureDailyQuests,
  reacceptQuest,
  swapQuest,
} from '../craft/daily-quest-generate.ts';
import { dismissQuest, markQuestDoing, settleQuest } from '../craft/daily-quest-settle.ts';
import {
  loadAllQuests,
  loadWeekSummary,
  pruneWeekData,
  toYmd,
  weekStartMonday,
} from '../craft/daily-quest-store.ts';
import {
  STREAK_XP_FROM_DAY,
  STREAK_XP_MULT,
  SWAP_XP_COST,
  WEEK_ATTR_CAP,
  displayPalaceLabel,
  ziweiChartPalaceHref,
  type DailyQuest,
  type QuestCadence,
} from '../craft/daily-quest-types.ts';
import { loadCraftXp, levelProgressPct } from '../craft/xp.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function axisLabel(id: string): string {
  return CRAFT_AXES.find((a) => a.id === id)?.label ?? id;
}

function toast(msg: string): void {
  const el = document.createElement('div');
  el.className = 'ziwei-wq-toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-on'));
  setTimeout(() => {
    el.classList.remove('is-on');
    setTimeout(() => el.remove(), 280);
  }, 2000);
}

function goPalace(topic: string): void {
  navigate(ziweiChartPalaceHref(topic));
}

function slotDismissed(userId: string, cadence: QuestCadence): boolean {
  const today = toYmd();
  const weekStart = weekStartMonday();
  const questDate = cadence === 'weekly' ? weekStart : today;
  const slot = loadAllQuests().filter(
    (q) =>
      q.userId === userId &&
      q.cadence === cadence &&
      q.questDate === questDate,
  );
  if (slot.some((q) => q.status === 'done' || q.isSettled)) return false;
  if (slot.some((q) => q.status !== 'dismissed')) return false;
  return slot.some((q) => q.status === 'dismissed');
}

function streakHint(streak: number): string {
  if (streak >= STREAK_XP_FROM_DAY) {
    return `连续日常 ${streak} 天 · XP ×${STREAK_XP_MULT}`;
  }
  if (streak > 0) {
    return `连续日常 ${streak} 天 · 再连 ${STREAK_XP_FROM_DAY - streak} 天 XP ×${STREAK_XP_MULT}`;
  }
  return `连续日常 0 天 · 满 ${STREAK_XP_FROM_DAY} 天日常 XP ×${STREAK_XP_MULT}`;
}

function statusLabel(q: DailyQuest): string {
  if (q.status === 'done' || q.isSettled) return '已完成';
  if (q.status === 'doing') return '进行中';
  return '未开始';
}

function showSettleSheet(
  res: Extract<ReturnType<typeof settleQuest>, { ok: true }>,
  topic?: string,
): void {
  document.querySelector('.ziwei-dq-settle')?.remove();
  const sheet = document.createElement('div');
  sheet.className = 'ziwei-dq-settle is-open';
  const capNote = res.attrCapped
    ? '<p class="ziwei-dq-settle-cap">本周天赋已觉醒圆满，下周再来解锁更高潜能吧。</p>'
    : '';
  const overflow =
    res.overflowAttr > 0
      ? `<p class="ziwei-dq-settle-overflow">属性溢出 ${res.overflowAttr} → 已转为 XP</p>`
      : '';
  const multNote =
    res.cadence === 'daily' && res.xpMult > 1
      ? `<p class="ziwei-dq-settle-overflow">连续 ${res.weekDailyStreak} 天 · XP ${res.xpBase} ×${res.xpMult} = ${Math.floor(res.xpBase * res.xpMult)}（未含溢出）</p>`
      : res.cadence === 'daily'
        ? `<p class="ziwei-wq-card-meta">${escapeHtml(streakHint(res.weekDailyStreak))}</p>`
        : '';
  const palaceBtn = topic
    ? `<button type="button" class="life-btn-ghost" data-dq-palace>去看${escapeHtml(displayPalaceLabel(topic))}落星 ›</button>`
    : '';
  sheet.innerHTML = `
    <button type="button" class="ziwei-wq-backdrop" data-dq-close aria-label="关闭"></button>
    <div class="ziwei-wq-card" role="dialog" aria-modal="true">
      <p class="ziwei-wq-card-kicker">打卡结算</p>
      <h2>${escapeHtml(axisLabel(res.rewardType))} +${res.attrApplied}</h2>
      <div class="ziwei-dq-rails">
        <div>
          <p>🔮 命格觉醒（属性）</p>
          <div class="ziwei-dq-rail"><i style="width:${Math.min(100, res.weekAttrGained)}%"></i></div>
          <span>${res.weekAttrGained} / ${WEEK_ATTR_CAP}（本周上限）</span>
        </div>
        <div>
          <p>✨ 星图收集（XP）</p>
          <div class="ziwei-dq-rail is-xp"><i style="width:${Math.min(100, res.weekXpGained % 100)}%"></i></div>
          <span>本周已获 ${res.weekXpGained} XP · 总 ${res.totalXp}（无周上限）· 本次 +${res.xpGain}</span>
        </div>
      </div>
      ${multNote}${overflow}${capNote}
      <div class="ziwei-wq-card-actions">
        ${palaceBtn}
        <button type="button" class="life-btn-primary" data-dq-close>知道了</button>
      </div>
    </div>`;
  document.body.appendChild(sheet);
  sheet.querySelectorAll('[data-dq-close]').forEach((el) => {
    el.addEventListener('click', () => sheet.remove());
  });
  sheet.querySelector('[data-dq-palace]')?.addEventListener('click', () => {
    sheet.remove();
    if (topic) goPalace(topic);
  });
}

function openDetailCard(
  quest: DailyQuest,
  opts: {
    onSettle: (id: string) => void;
    onDismiss: (id: string) => void;
    onSwap: (id: string) => void;
    onDoing?: (id: string) => void;
  },
): void {
  document.querySelector('.ziwei-wq-sheet')?.remove();
  opts.onDoing?.(quest.id);
  const done = quest.status === 'done' || quest.isSettled;
  const palaceLabel = displayPalaceLabel(quest.topic);
  const sheet = document.createElement('div');
  sheet.className = 'ziwei-wq-sheet is-open';
  sheet.innerHTML = `
    <button type="button" class="ziwei-wq-backdrop" data-wq-close aria-label="关闭"></button>
    <div class="ziwei-wq-card" role="dialog" aria-modal="true">
      <button type="button" class="ziwei-dq-x" data-wq-dismiss title="关闭任务">✕</button>
      <p class="ziwei-wq-card-kicker">${quest.cadence === 'weekly' ? '周常' : '日常'} · ${done ? '已完成' : '进行中'} · 可截图保存</p>
      <h2>${escapeHtml(quest.taskTitle)}</h2>
      <p class="ziwei-wq-card-theme">${escapeHtml(quest.origin)}</p>
      <p class="ziwei-wq-card-body">${escapeHtml(quest.taskDescription)}</p>
      <p class="ziwei-wq-card-xp">奖励：${escapeHtml(axisLabel(quest.rewardType))} +${quest.rewardValue} · XP +${quest.xpValue}</p>
      <p class="ziwei-wq-card-meta">${escapeHtml(palaceLabel)} · ${quest.source === 'ai' ? 'AI 润色' : '规则模板'}</p>
      <div class="ziwei-wq-card-actions">
        <button type="button" class="life-btn-ghost" data-wq-palace>去看${escapeHtml(palaceLabel)}落星 ›</button>
        <button type="button" class="life-btn-ghost" data-wq-swap>换个任务 (−${SWAP_XP_COST} XP)</button>
        ${
          done
            ? `<button type="button" class="life-btn-primary" disabled data-settled>已打卡</button>`
            : `<button type="button" class="life-btn-primary" data-wq-check>打卡完成</button>`
        }
      </div>
    </div>`;
  document.body.appendChild(sheet);
  const close = () => sheet.remove();
  sheet.querySelector('[data-wq-close]')?.addEventListener('click', close);
  sheet.querySelector('[data-wq-palace]')?.addEventListener('click', () => {
    close();
    goPalace(quest.topic);
  });
  sheet.querySelector('[data-wq-dismiss]')?.addEventListener('click', () => {
    opts.onDismiss(quest.id);
    close();
  });
  sheet.querySelector('[data-wq-swap]')?.addEventListener('click', () => {
    opts.onSwap(quest.id);
    close();
  });
  const checkBtn = sheet.querySelector<HTMLButtonElement>('[data-wq-check]');
  checkBtn?.addEventListener('click', () => {
    if (checkBtn.dataset.settled === '1' || checkBtn.disabled) return;
    checkBtn.disabled = true;
    checkBtn.dataset.settled = '1';
    checkBtn.textContent = '结算中…';
    opts.onSettle(quest.id);
    close();
  });
}

export type MountQuestUiOpts = {
  bannerHost: HTMLElement;
  checkInHost: HTMLElement;
  view: ZiweiChartView;
  person: PersonProfile;
  floatRoot?: HTMLElement;
};

export type QuestUiHandle = { destroy: () => void };

export function mountQuestBannerAndCheckIn(opts: MountQuestUiOpts): QuestUiHandle {
  let { daily, weekly } = ensureDailyQuests(opts.view, opts.person);
  const week = () => {
    pruneWeekData(opts.person.id);
    return loadWeekSummary(opts.person.id);
  };

  const banner = document.createElement('aside');
  banner.className = 'ziwei-wq-bar ziwei-dq-banner';
  banner.setAttribute('aria-label', '本周造命任务');

  const checkIn = document.createElement('section');
  checkIn.className = 'ziwei-dq-checkin';
  checkIn.setAttribute('aria-label', '任务打卡');

  const float = document.createElement('div');
  float.className = 'ziwei-wq-float';
  const floatRoot =
    opts.floatRoot ??
    (document.querySelector('#app') as HTMLElement | null) ??
    document.body;

  let settleLock = false;

  function doSettle(id: string): void {
    if (settleLock) return;
    settleLock = true;
    try {
      const before = loadAllQuests().find((q) => q.id === id);
      const res = settleQuest(id);
      if (!res.ok) {
        toast(res.reason === 'already_settled' ? '已经打过卡了' : '无法打卡');
        return;
      }
      showSettleSheet(res, before?.topic);
      toast(`+${res.attrApplied} 属性 · +${res.xpGain} XP`);
      refreshFromStore();
    } finally {
      settleLock = false;
    }
  }

  function doReaccept(cadence: QuestCadence): void {
    const r = reacceptQuest(opts.view, opts.person, cadence);
    if (!r.ok) toast(r.reason);
    else {
      toast('已重新接取');
      refreshFromStore();
    }
  }

  function refreshFromStore(): void {
    const ensured = ensureDailyQuests(opts.view, opts.person);
    daily = ensured.daily;
    weekly = ensured.weekly;
    paint();
  }

  function paint(): void {
    const w = week();
    const focus = weekly && weekly.status !== 'dismissed' ? weekly : daily;
    const xp = loadCraftXp();
    const pct = levelProgressPct(xp);
    const dailyDismissed = !daily && slotDismissed(opts.person.id, 'daily');
    const weeklyDismissed = !weekly && slotDismissed(opts.person.id, 'weekly');

    if (!focus || focus.status === 'dismissed') {
      const reBtns = [
        dailyDismissed
          ? `<button type="button" class="life-btn-primary" data-dq-reaccept="daily">重新接取今日日常</button>`
          : '',
        weeklyDismissed
          ? `<button type="button" class="life-btn-ghost" data-dq-reaccept="weekly">重新接取本周周常</button>`
          : '',
      ]
        .filter(Boolean)
        .join('');
      banner.innerHTML = `
        <div class="ziwei-wq-bar-main">
          <p class="ziwei-wq-bar-kicker">本周任务</p>
          <p class="ziwei-wq-bar-task">${
            dailyDismissed || weeklyDismissed
              ? '任务已关闭。想做的时候可以重新接取。'
              : '暂无进行中的任务'
          }</p>
          <div class="ziwei-dq-reaccept-row">${reBtns}</div>
        </div>`;
      banner.querySelectorAll<HTMLButtonElement>('[data-dq-reaccept]').forEach((btn) => {
        btn.addEventListener('click', () => {
          doReaccept(btn.dataset.dqReaccept as QuestCadence);
        });
      });
    } else {
      banner.dataset.kind = focus.rewardType;
      const done = focus.status === 'done' || focus.isSettled;
      const palaceLabel = displayPalaceLabel(focus.topic);
      banner.innerHTML = `
        <button type="button" class="ziwei-dq-x ziwei-dq-x-inline" data-dq-banner-x aria-label="关闭">✕</button>
        <div class="ziwei-wq-bar-main">
          <p class="ziwei-wq-bar-kicker">${focus.cadence === 'weekly' ? '周常' : '日常'} · ${escapeHtml(palaceLabel)}</p>
          <p class="ziwei-wq-bar-task"><strong>【${escapeHtml(focus.taskTitle)}】</strong>${escapeHtml(focus.taskDescription)}</p>
          <p class="ziwei-wq-bar-xp">${escapeHtml(focus.origin)} · ${escapeHtml(axisLabel(focus.rewardType))} +${focus.rewardValue} / XP +${focus.xpValue}</p>
          <p class="ziwei-wq-bar-xp">本周属性 ${w.weekAttrGained}/${WEEK_ATTR_CAP} · ${escapeHtml(streakHint(w.weekDailyStreak))}</p>
          <p class="ziwei-wq-bar-xp">状态 · ${escapeHtml(statusLabel(focus))}</p>
          <button type="button" class="ziwei-dq-palace-link" data-dq-banner-palace>去看${escapeHtml(palaceLabel)}落星 ›</button>
        </div>
        <button type="button" class="ziwei-wq-go life-btn-primary" data-dq-go">${
          done ? '已打卡 · 再看' : focus.status === 'doing' ? '继续' : '去做'
        }</button>`;
      banner.querySelector('[data-dq-go]')?.addEventListener('click', () => {
        openDetailCard(focus, {
          onSettle: doSettle,
          onDoing: (id) => {
            markQuestDoing(id);
            refreshFromStore();
          },
          onDismiss: (id) => {
            dismissQuest(id);
            toast('已关闭本任务');
            refreshFromStore();
          },
          onSwap: (id) => {
            const r = swapQuest(opts.view, opts.person, id);
            if (!r.ok) toast(r.reason);
            else {
              toast('已换新任务');
              refreshFromStore();
            }
          },
        });
      });
      banner.querySelector('[data-dq-banner-x]')?.addEventListener('click', () => {
        dismissQuest(focus.id);
        toast('已关闭');
        refreshFromStore();
      });
      banner.querySelector('[data-dq-banner-palace]')?.addEventListener('click', () => {
        goPalace(focus.topic);
      });
    }

    const row = (q: DailyQuest | null, label: string, cadence: QuestCadence) => {
      if (!q || q.status === 'dismissed') {
        const canRe = slotDismissed(opts.person.id, cadence);
        return `
          <div class="ziwei-dq-row is-empty">
            <div>
              <strong>${label}</strong>
              <span>${canRe ? '已关闭' : '暂无'}</span>
            </div>
            ${
              canRe
                ? `<button type="button" class="life-btn-ghost" data-dq-reaccept="${cadence}">重新接取</button>`
                : `<em>—</em>`
            }
          </div>`;
      }
      const done = q.status === 'done' || q.isSettled;
      return `
        <div class="ziwei-dq-row ${done ? 'is-done' : q.status === 'doing' ? 'is-doing' : ''}">
          <div>
            <strong>${label} · ${escapeHtml(q.taskTitle)}</strong>
            <span>${escapeHtml(displayPalaceLabel(q.topic))} → ${escapeHtml(axisLabel(q.rewardType))} +${q.rewardValue} · ${escapeHtml(statusLabel(q))}</span>
            <button type="button" class="ziwei-dq-palace-link" data-dq-row-palace="${escapeHtml(q.topic)}">去看落星 ›</button>
          </div>
          <button type="button" class="life-btn-primary" data-dq-check="${q.id}" ${done ? 'disabled data-settled="1"' : ''}>
            ${done ? '已完成' : '打卡'}
          </button>
        </div>`;
    };

    checkIn.innerHTML = `
      <p class="ziwei-kicker">任务打卡</p>
      <p class="ziwei-codex-hint">现实里做完再回来点打卡：属性涨在雷达上，XP 进星图收集。</p>
      ${row(daily, '今日日常', 'daily')}
      ${row(weekly, '本周周常', 'weekly')}
      <p class="ziwei-wq-bar-xp">本周属性 ${w.weekAttrGained}/${WEEK_ATTR_CAP} · 本周 XP ${w.weekXpGained}</p>
      <p class="ziwei-wq-bar-xp">${escapeHtml(streakHint(w.weekDailyStreak))}</p>`;

    checkIn.querySelectorAll<HTMLButtonElement>('[data-dq-check]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled || btn.dataset.settled === '1') return;
        btn.disabled = true;
        btn.dataset.settled = '1';
        const id = btn.dataset.dqCheck;
        if (id) {
          markQuestDoing(id);
          doSettle(id);
        }
      });
    });
    checkIn.querySelectorAll<HTMLButtonElement>('[data-dq-reaccept]').forEach((btn) => {
      btn.addEventListener('click', () => {
        doReaccept(btn.dataset.dqReaccept as QuestCadence);
      });
    });
    checkIn.querySelectorAll<HTMLButtonElement>('[data-dq-row-palace]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.dqRowPalace;
        if (t) goPalace(t);
      });
    });

    float.innerHTML = `
      <button type="button" class="ziwei-wq-float-btn" data-dq-float>
        <span>本周任务</span>
        <em>Lv.${xp.level} · ${pct}% · 属性 ${w.weekAttrGained}/${WEEK_ATTR_CAP}</em>
      </button>`;
    float.querySelector('[data-dq-float]')?.addEventListener('click', () => {
      checkIn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  paint();
  opts.bannerHost.appendChild(banner);
  opts.checkInHost.appendChild(checkIn);
  floatRoot.appendChild(float);

  void enrichQuestsWithAi(
    opts.view,
    opts.person,
    [daily, weekly].filter(Boolean) as DailyQuest[],
  ).then(() => refreshFromStore());

  return {
    destroy: () => {
      banner.remove();
      checkIn.remove();
      float.remove();
      document.querySelector('.ziwei-wq-sheet')?.remove();
      document.querySelector('.ziwei-dq-settle')?.remove();
    },
  };
}
