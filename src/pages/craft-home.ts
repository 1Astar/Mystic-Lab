import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { attachPersonSwitcherToPage } from '../ui/module-person-chrome.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { CRAFT_QUESTS } from '../craft/quests.ts';
import {
  levelProgressPct,
  loadCraftXp,
  xpToNextLevel,
} from '../craft/xp.ts';
import {
  resolveSpiritRootWithGrowth,
} from '../craft/spirit-activate.ts';
import { countSealedStars } from '../craft/plate-awaken.ts';
import { spiritRootCardHtml } from '../craft/spirit-roots-ui.ts';
import { openAxisSourceSheet, openCraftEmptyAxisTip } from '../craft/axis-source-sheet.ts';
import type { CraftAxisId } from '../craft/spirit-roots.ts';
import { getActivePerson } from '../life/storage.ts';
import { parseBirthParts } from '../bazi/parse-birth.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderCraftHome(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page life-page craft-page';
  root.appendChild(page);

  let buffYear = new Date().getFullYear();

  // 问号弹层：挂一次即可（paint 会清 innerHTML，但 page 节点保留）
  page.addEventListener(
    'click',
    (e) => {
      const help = (e.target as HTMLElement | null)?.closest?.('[data-craft-axis-help]');
      if (!help || !page.contains(help)) return;
      e.preventDefault();
      e.stopPropagation();
      openCraftEmptyAxisTip({
        onExploreQuests: () => {
          page.querySelector('.craft-quest-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
      });
    },
    true,
  );

  const paint = () => {
    const person = getActivePerson();
    const xp = loadCraftXp();
    const pct = levelProgressPct(xp);
    const need = xpToNextLevel(xp);
    const canCast = Boolean(
      parseBirthParts(person.birthYear, person.birthMonth, person.birthDay, person.birthHour) &&
        person.gender,
    );

    let spiritHtml = '';
    let spiritAxes: { id: CraftAxisId; sources: string[]; value: number; sub: string; label: string }[] = [];
    if (canCast) {
      const spirit = resolveSpiritRootWithGrowth(person, { year: buffYear });
      if (spirit.ok) {
        spiritAxes = spirit.panel.axes;
        const sealed = countSealedStars(spirit.view);
        const sealedTip =
          sealed.sealed > 0
            ? `<p class="life-footnote craft-awaken-tip">紫微盘尚有 ${sealed.sealed} 颗星曜未觉醒${
                sealed.karmaSealed
                  ? `（含 ${sealed.karmaSealed} 颗业力星）`
                  : ''
              }——去命盘点亮，可强化灵根雷达。</p>`
            : `<p class="life-footnote craft-awaken-tip">盘面星曜已尽数觉醒。可继续看本年限时词条与问答任务。</p>`;
        spiritHtml = spiritRootCardHtml(spirit.panel) + sealedTip;
      } else {
        spiritHtml = `<section class="mirror-gate"><p>${escapeHtml(spirit.error)}</p></section>`;
      }
    }

    page.innerHTML = '';
    mountEnvBanner(page);
    page.insertAdjacentHTML(
      'beforeend',
      `
    <button type="button" class="back-link life-back" data-path="/">← 返回 Mystic Lab</button>
    <header class="life-header">
      <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
      <p class="home-eyebrow">CRAFT DESTINY</p>
      <h1 class="page-title">造命</h1>
      <p class="page-subtitle">灵根图谱 · 流年限时词条 · 问答任务</p>
      <p class="bazi-home-person">当前角色 · ${escapeHtml(person.nickname)}</p>
    </header>

    ${
      canCast
        ? spiritHtml
        : `<section class="mirror-gate">
        <p>需要出生年月日 + 性别，才能合成你的灵根图谱与宫位结论。</p>
        <button type="button" class="life-btn-primary" data-path="/profile">去管理档案 ›</button>
      </section>`
    }

    <section class="craft-xp-card" aria-label="星盘经验">
      <div class="craft-xp-head">
        <strong>星盘 Lv.${xp.level}</strong>
        <span>${xp.xp} XP · 距下一级 ${need}</span>
      </div>
      <div class="craft-xp-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <i style="width:${pct}%"></i>
      </div>
      <p class="life-footnote">完成「本周小任务」打卡可积累经验——知命之后，用行动造命。</p>
    </section>

    <section class="craft-quest-list" aria-label="高频问题">
      <h2 class="life-route-title">你现在最想问</h2>
      <p class="life-footnote">点问题，会带你去看对应宫位——不是甩一整盘。</p>
      <div class="craft-quest-grid">
        ${CRAFT_QUESTS.map(
          (q) => `
          <button type="button" class="craft-quest-btn" data-quest="${escapeHtml(q.id)}" ${canCast ? '' : 'disabled'}>
            <strong>${escapeHtml(q.button)}</strong>
            <span>主看 ${escapeHtml(q.palace)}宫${q.supportPalace ? ` · 辅看 ${escapeHtml(q.supportPalace)}` : ''}</span>
          </button>`,
        ).join('')}
      </div>
    </section>
  `,
    );

    attachPersonSwitcherToPage(page);

    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });

    page.querySelectorAll<HTMLButtonElement>('[data-quest]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        navigate(`/craft/quest?id=${encodeURIComponent(btn.dataset.quest || '')}`);
      });
    });

    page.querySelectorAll<HTMLButtonElement>('[data-buff-year]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const y = Number(btn.dataset.buffYear);
        if (!Number.isFinite(y) || y < 1900 || y > 2100) return;
        buffYear = Math.floor(y);
        paint();
      });
    });

    page.querySelectorAll<HTMLElement>('[data-craft-axis]').forEach((row) => {
      const open = (e: Event) => {
        const t = e.target as HTMLElement | null;
        if (t?.closest?.('[data-craft-axis-help]')) return;
        const id = row.dataset.craftAxis as CraftAxisId | undefined;
        if (!id) return;
        const axis = spiritAxes.find((a) => a.id === id);
        openAxisSourceSheet(person.id, id, axis as never);
      };
      row.addEventListener('click', open);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(e);
        }
      });
    });
  };

  paint();

  return () => {
    stars.remove();
  };
}
