/**
 * 填生辰：时间精度常显；粗精度展开来源 + 生时校准；细精度可选手动展开来源
 */
import {
  BIRTH_TIME_ACCURACY_OPTIONS,
  BIRTH_TIME_SOURCE_OPTIONS,
  needsBirthTimeRectify,
  type BirthTimeAccuracy,
  type BirthTimeSource,
} from '../life/birth-time-meta.ts';
import { navigate } from '../router.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type BirthTimeMetaValue = {
  birthTimeAccuracy: BirthTimeAccuracy;
  birthTimeSource: BirthTimeSource;
};

export type MountBirthTimeMetaOpts = {
  host: HTMLElement;
  /** 插在此元素之后；缺省 append 到 host */
  afterEl?: HTMLElement | null;
  initial?: Partial<BirthTimeMetaValue>;
  onChange?: (value: BirthTimeMetaValue) => void;
  /** 是否显示校准引导卡；默认 true */
  showRectifyCard?: boolean;
};

function choiceRow(
  name: string,
  options: Array<{ id: string; label: string }>,
  selected: string,
): string {
  return options
    .map((opt) => {
      const on = selected === opt.id;
      return `<button type="button" class="birth-meta-chip ${on ? 'is-on' : ''}" data-meta-group="${escapeHtml(name)}" data-meta-value="${escapeHtml(opt.id)}" aria-pressed="${on}">${escapeHtml(opt.label)}</button>`;
    })
    .join('');
}

function sourceLabel(id: BirthTimeSource): string {
  return BIRTH_TIME_SOURCE_OPTIONS.find((o) => o.id === id)?.label ?? '';
}

export function mountBirthTimeMetaField(opts: MountBirthTimeMetaOpts): {
  getValue: () => BirthTimeMetaValue;
  destroy: () => void;
} {
  let accuracy: BirthTimeAccuracy = opts.initial?.birthTimeAccuracy ?? '';
  let source: BirthTimeSource = opts.initial?.birthTimeSource ?? '';
  /** 细精度时，用户手动展开「补充来源」 */
  let sourceForcedOpen = false;
  const showCard = opts.showRectifyCard !== false;

  const root = document.createElement('div');
  root.className = 'birth-time-meta';
  root.dataset.birthTimeMeta = '1';

  function isFine(): boolean {
    return accuracy === 'minute' || accuracy === 'pm15';
  }

  function isCoarse(): boolean {
    return needsBirthTimeRectify(accuracy);
  }

  function sourceExpanded(): boolean {
    if (isCoarse()) return true;
    if (isFine()) return sourceForcedOpen;
    return false;
  }

  function paint(): void {
    const coarse = isCoarse();
    const fine = isFine();
    const expanded = sourceExpanded();
    const srcText = sourceLabel(source);

    const sourceBlock = expanded
      ? `<div class="birth-meta-block birth-meta-source" data-birth-meta-extra>
          <p class="birth-meta-title">时间来源</p>
          <div class="birth-meta-chips" role="group" aria-label="时间来源">
            ${choiceRow('source', BIRTH_TIME_SOURCE_OPTIONS, source)}
          </div>
        </div>`
      : '';

    const rectifyBlock =
      showCard && coarse
        ? `<button type="button" class="birth-meta-rectify is-nudge" data-open-rectify>
            <span>
              <strong>时间不太确定？</strong>
              <em>查看生时校准（用大事件反推时辰）</em>
            </span>
            <i aria-hidden="true">›</i>
          </button>`
        : '';

    const sourceToggle =
      fine && !expanded
        ? `<button type="button" class="birth-meta-source-toggle" data-toggle-source>
            ${
              srcText
                ? `来源：${escapeHtml(srcText)} · 修改`
                : '补充来源（可选）'
            }
          </button>`
        : fine && expanded
          ? `<button type="button" class="birth-meta-source-toggle is-open" data-toggle-source>收起来源</button>`
          : '';

    root.innerHTML = `
      <div class="birth-meta-block">
        <p class="birth-meta-title">时间精度 <em>如实申报</em></p>
        <p class="birth-meta-hint">先填大概时间，再选把握程度；选「±1小时 / 不确定」会展开来源与校准。</p>
        <div class="birth-meta-chips" role="group" aria-label="时间精度">
          ${choiceRow('accuracy', BIRTH_TIME_ACCURACY_OPTIONS, accuracy)}
        </div>
      </div>
      ${rectifyBlock}
      ${sourceToggle}
      ${sourceBlock}
    `;

    root.querySelectorAll<HTMLButtonElement>('[data-meta-group]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.metaGroup;
        const value = btn.dataset.metaValue ?? '';
        if (group === 'accuracy') {
          const next = (value as BirthTimeAccuracy) || '';
          const wasCoarse = isCoarse();
          accuracy = next;
          // 从粗精度切回细精度：收起来源，避免占位
          if (wasCoarse && (next === 'minute' || next === 'pm15')) {
            sourceForcedOpen = false;
          }
          // 选到粗精度：自动展开
          if (needsBirthTimeRectify(next)) {
            sourceForcedOpen = false;
          }
        } else if (group === 'source') {
          source = (value as BirthTimeSource) || '';
        }
        opts.onChange?.({ birthTimeAccuracy: accuracy, birthTimeSource: source });
        paint();
      });
    });

    root.querySelector('[data-toggle-source]')?.addEventListener('click', () => {
      sourceForcedOpen = !sourceForcedOpen;
      paint();
    });

    root.querySelector('[data-open-rectify]')?.addEventListener('click', () => {
      navigate('/bazi/rectify');
    });
  }

  paint();

  if (opts.afterEl?.parentElement === opts.host) {
    opts.afterEl.insertAdjacentElement('afterend', root);
  } else {
    opts.host.appendChild(root);
  }

  return {
    getValue: () => ({ birthTimeAccuracy: accuracy, birthTimeSource: source }),
    destroy: () => root.remove(),
  };
}

/** 解读页底栏：生时校准 CTA */
export function birthRectifyCtaHtml(opts?: { soft?: boolean }): string {
  const soft = opts?.soft !== false;
  return `
    <button type="button" class="bazi-home-link ${soft ? 'bazi-home-link-soft' : ''}" data-path="/bazi/rectify">
      <strong>觉得不准？试试生时校准</strong>
      <span>用大事件反推更贴近的时辰</span>
      <em aria-hidden="true">›</em>
    </button>`;
}
