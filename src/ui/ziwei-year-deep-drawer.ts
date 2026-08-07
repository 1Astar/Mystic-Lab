/**
 * 流年深度解析：右侧抽屉（仿六爻解读笔记）
 */
import type { PersonProfile } from '../life/types.ts';
import {
  addYearVerifyEvent,
  buildYearDeepPack,
  listYearVerifyEvents,
  removeYearVerifyEvent,
  type YearDeepPack,
} from '../ziwei/year-deep.ts';
import type { TimeScopeLevel } from '../ziwei/time-scope.ts';
import type { YearTrackItem } from '../ziwei/year-track.ts';
import type { ZiweiChartView } from '../ziwei/types.ts';
import type { LearnFocus } from '../ziwei/learn-explain.ts';
import { openZiweiLearnSheet } from './ziwei-learn-sheet.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shortPalace(name: string): string {
  return name.replace(/宫$/, '');
}

function possiblesHeader(tense: YearDeepPack['tense']): string {
  if (tense === 'past') return '常见痕迹';
  if (tense === 'future') return '值得留意';
  return '可能表现';
}

function renderBody(pack: YearDeepPack, events: string[]): string {
  const chain = pack.chain
    .map(
      (step, i) => `
      <li class="ziwei-year-deep-step">
        ${i > 0 ? '<span class="ziwei-year-deep-arrow" aria-hidden="true">↓</span>' : ''}
        <button type="button" class="ziwei-year-deep-step-btn" data-chain-idx="${i}">
          <strong>${escapeHtml(step.title)}</strong>
          <span>${escapeHtml(step.detail)}</span>
        </button>
      </li>`,
    )
    .join('');

  const mutagen = pack.mutagen.length
    ? pack.mutagen
        .map(
          (m) => `
        <li>
          <button type="button" class="ziwei-year-deep-hua" data-hua="${escapeHtml(m.kind)}" data-star="${escapeHtml(m.star)}">
            <em class="is-hua-${escapeHtml(m.kind)}">化${escapeHtml(m.kind)}</em>
            <strong>${escapeHtml(m.star)}${m.palace ? ` · ${escapeHtml(shortPalace(m.palace))}` : ''}</strong>
            <span>${escapeHtml(m.text)}</span>
          </button>
        </li>`,
        )
        .join('')
    : '<li class="ziwei-year-deep-muted">本年四化暂缺</li>';

  const related = pack.relatedPalaces
    .map(
      (p) =>
        `<button type="button" class="ziwei-year-deep-chip" data-palace="${escapeHtml(p)}">${escapeHtml(shortPalace(p))}</button>`,
    )
    .join('');

  const eventList = events.length
    ? events
        .map(
          (e, i) => `
        <li>
          <span>${escapeHtml(e)}</span>
          <button type="button" class="ziwei-year-deep-del" data-del="${i}" aria-label="删除">×</button>
        </li>`,
        )
        .join('')
    : '<li class="ziwei-year-deep-muted">尚未记录。写下一件真实发生过的事，用来对照推演。</li>';

  return `
    <section class="ziwei-year-deep-sec">
      <h5>一、${escapeHtml(pack.levelLabel ?? '流年')}结论</h5>
      <p class="ziwei-year-deep-conclusion">${escapeHtml(pack.conclusion)}</p>
      <p class="ziwei-year-deep-tone">${escapeHtml(pack.tenseLabel)} · ${pack.year}｜${pack.age}岁${
        pack.gz ? ` · ${escapeHtml(pack.gz)}` : ''
      }</p>
    </section>

    <section class="ziwei-year-deep-sec">
      <h5>二、推演依据</h5>
      <p class="ziwei-year-deep-tip">这段话从哪些宫位、四化与三方推出来——点每一步可看术语/宫位解释。</p>
      <ol class="ziwei-year-deep-chain">${chain}</ol>
    </section>

    <section class="ziwei-year-deep-sec">
      <h5>三、具体解释</h5>
      <ul class="ziwei-year-deep-hua-list">${mutagen}</ul>
    </section>

    <section class="ziwei-year-deep-sec">
      <h5>四、${escapeHtml(possiblesHeader(pack.tense))}</h5>
      <ul class="ziwei-year-deep-possibles">
        ${pack.possibles.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}
      </ul>
    </section>

    <section class="ziwei-year-deep-sec">
      <h5>关联宫位</h5>
      <div class="ziwei-year-deep-related">${related}</div>
    </section>

    <section class="ziwei-year-deep-sec">
      <h5>五、验证记录</h5>
      <p class="ziwei-year-deep-tip">与下方「我的记录」同步。实际发生：</p>
      <ul class="ziwei-year-deep-events" data-events>${eventList}</ul>
      <form class="ziwei-year-deep-add" data-add-form>
        <input type="text" name="event" maxlength="80" placeholder="添加事件（例如：换了工作内容）" autocomplete="off" />
        <button type="submit">添加</button>
      </form>
    </section>
  `;
}

export type OpenZiweiYearDeepOpts = {
  view: ZiweiChartView;
  person: PersonProfile;
  item: YearTrackItem;
  scope?: {
    level?: TimeScopeLevel;
    month?: number;
    day?: number;
    hour?: number;
  };
  onClose?: () => void;
};

export function openZiweiYearDeepDrawer(opts: OpenZiweiYearDeepOpts): void {
  document.querySelector('[data-ziwei-year-deep]')?.remove();

  const pack = buildYearDeepPack(opts.view, opts.person, opts.item, opts.scope);
  let events = listYearVerifyEvents(opts.person.id, pack.year);

  const drawer = document.createElement('aside');
  drawer.className = 'ziwei-year-deep-drawer';
  drawer.dataset.ziweiYearDeep = '';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  const titleLevel = pack.levelLabel ?? '流年';
  drawer.setAttribute('aria-label', `${pack.year}年${titleLevel}推演`);

  function paint(): void {
    drawer.innerHTML = `
      <div class="ziwei-year-deep-backdrop" data-deep-close></div>
      <div class="ziwei-year-deep-panel">
        <header class="ziwei-year-deep-head">
          <div>
            <p class="ziwei-year-deep-kicker">为什么这样判断</p>
            <h4>${pack.year}年 · ${escapeHtml(titleLevel)}推演</h4>
          </div>
          <button type="button" class="ziwei-year-deep-x" data-deep-close aria-label="关闭">×</button>
        </header>
        <div class="ziwei-year-deep-body">${renderBody(pack, events)}</div>
      </div>`;

    drawer.querySelectorAll('[data-deep-close]').forEach((el) => {
      el.addEventListener('click', close);
    });

    drawer.querySelectorAll<HTMLButtonElement>('[data-chain-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.chainIdx);
        const step = pack.chain[idx];
        if (step?.focus) openTerm(step.focus);
      });
    });

    drawer.querySelectorAll<HTMLButtonElement>('[data-hua]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openTerm({
          kind: 'mutagen',
          term: `化${btn.dataset.hua ?? ''}`,
          starName: btn.dataset.star,
        });
      });
    });

    drawer.querySelectorAll<HTMLButtonElement>('[data-palace]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openTerm({ kind: 'palace', palaceName: btn.dataset.palace });
      });
    });

    drawer.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        events = removeYearVerifyEvent(opts.person.id, pack.year, Number(btn.dataset.del));
        paint();
      });
    });

    drawer.querySelector<HTMLFormElement>('[data-add-form]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.currentTarget as HTMLFormElement;
      const input = form.elements.namedItem('event') as HTMLInputElement | null;
      const text = input?.value ?? '';
      events = addYearVerifyEvent(opts.person.id, pack.year, text);
      paint();
    });
  }

  function openTerm(focus: LearnFocus): void {
    openZiweiLearnSheet({
      view: opts.view,
      focus,
      onOpenChart: () => undefined,
    });
  }

  function close(): void {
    drawer.remove();
    opts.onClose?.();
  }

  paint();
  document.body.appendChild(drawer);
  requestAnimationFrame(() => drawer.classList.add('is-visible'));
}
