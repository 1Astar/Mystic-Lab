import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { SYSTEM_POSITION } from '../lab/system-positioning.ts';
import {
  formatBirthBrief,
  getActivePerson,
  hasBirthInfo,
  patchActivePerson,
  updateBirthFields,
} from '../life/storage.ts';
import { parseBirthParts } from '../bazi/parse-birth.ts';
import { mountBirthDatetimeField } from '../ui/birth-datetime-picker.ts';
import { mountBirthTimeMetaField } from '../ui/birth-time-meta-field.ts';
import { codexProgress } from '../ziwei/codex.ts';
import {
  loadZiweiIntent,
  saveZiweiIntent,
  type StoredIntent,
} from '../ziwei/session.ts';
import { mountLabFloatShell } from '../ui/lab-float-shell.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function canCast(person: ReturnType<typeof getActivePerson>): boolean {
  return Boolean(
    parseBirthParts(person.birthYear, person.birthMonth, person.birthDay, person.birthHour) &&
      (person.gender === 'female' || person.gender === 'male'),
  );
}

function wantsEdit(): boolean {
  try {
    return new URLSearchParams(location.search).get('edit') === '1';
  } catch {
    return false;
  }
}

export function renderZiweiHome(root: HTMLElement): () => void {
  let person = getActivePerson();
  let intent: StoredIntent = loadZiweiIntent();
  const progress = codexProgress();
  const forceEdit = wantsEdit();

  /** 档案/八字已填齐 → 直接进结果（loading → reading） */
  if (canCast(person) && !forceEdit) {
    navigate('/ziwei/loading');
    return () => {};
  }

  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page ziwei-page ziwei-home-page';
  mountEnvBanner(page);
  root.appendChild(page);

  function paint(): void {
    const ready = canCast(person);
    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回 Mystic Lab</button>
      <header class="life-header ziwei-header">
        <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
        <h1 class="page-title">紫微</h1>
        <p class="page-subtitle">${SYSTEM_POSITION.ziwei}</p>
        <p class="ziwei-home-person">当前角色 · ${escapeHtml(person.nickname)}</p>
      </header>

      <section class="ziwei-intent" aria-label="你想看什么">
        <p class="ziwei-kicker">入口</p>
        <p class="ziwei-lead">近三年节奏与当下格局已合并到同一解读页；填好生辰后即可进入。</p>
      </section>

      <section class="ziwei-archive" aria-label="出生信息">
        <p class="ziwei-kicker">出生信息</p>
        ${
          hasBirthInfo(person)
            ? `<p class="ziwei-archive-brief">当前：${escapeHtml(formatBirthBrief(person))}</p>`
            : ''
        }
        <div id="ziwei-birth-dt-slot" class="life-birth-row"></div>
        <div id="ziwei-birth-meta-slot"></div>
        <label class="life-field life-field-full">
          <span>出生地</span>
          <input
            name="birthPlace"
            id="ziwei-birth-place"
            type="text"
            placeholder="如 成都（用于真太阳时）"
            value="${escapeHtml(person.birthPlace)}"
          />
        </label>
        <fieldset class="life-fieldset bazi-gender-field">
          <legend>性别</legend>
          <div class="bazi-gender-row">
            <label><input type="radio" name="zw-gender" value="female" ${person.gender === 'female' ? 'checked' : ''} /> 女</label>
            <label><input type="radio" name="zw-gender" value="male" ${person.gender === 'male' ? 'checked' : ''} /> 男</label>
          </div>
        </fieldset>
        <p class="life-footnote">出生信息与八字、档案共用；出生地可用于真太阳时粗校。</p>
        <div class="ziwei-home-actions">
          <button type="button" class="life-btn-primary" id="ziwei-start" ${ready ? '' : 'disabled'}>
            构建我的星辰罗盘 ›
          </button>
        </div>
      </section>

      <nav class="ziwei-home-nav" aria-label="紫微入口">
        <button type="button" class="bazi-home-link" data-path="/ziwei/tujian">
          <strong>星曜探索</strong>
          <span>角色 · 场景 · 搭戏 · 相遇 · ${progress.collected}/${progress.total}</span>
          <em aria-hidden="true">›</em>
        </button>
        <button type="button" class="bazi-home-link" data-path="/ziwei/guess">
          <strong>猜星曜盲盒</strong>
          <span>每日一题 · 复习主星与宫位</span>
          <em aria-hidden="true">›</em>
        </button>
        <button type="button" class="bazi-home-link" data-path="/ziwei/journal">
          <strong>紫微手札</strong>
          <span>记体感 · AI 解读可回看</span>
          <em aria-hidden="true">›</em>
        </button>
        <button type="button" class="bazi-home-link" data-path="/records">
          <strong>我的旅程</strong>
          <span>与塔罗 / 八字等同级回顾手札</span>
          <em aria-hidden="true">›</em>
        </button>
      </nav>
    `;

    const slot = page.querySelector<HTMLElement>('#ziwei-birth-dt-slot')!;
    const archive = page.querySelector<HTMLElement>('.ziwei-archive')!;
    mountBirthDatetimeField({
      host: archive,
      replaceEl: slot,
      initialYear: person.birthYear,
      initialMonth: person.birthMonth,
      initialDay: person.birthDay,
      initialHour: person.birthHour,
      onChange: (fields) => {
        const place =
          page.querySelector<HTMLInputElement>('#ziwei-birth-place')?.value.trim() ??
          person.birthPlace;
        updateBirthFields({
          birthYear: fields.birthYear,
          birthMonth: fields.birthMonth,
          birthDay: fields.birthDay,
          birthHour: fields.birthHour,
          birthPlace: place,
        });
        person = getActivePerson();
        const start = page.querySelector<HTMLButtonElement>('#ziwei-start');
        if (start) start.disabled = !canCast(person);
        const brief = page.querySelector('.ziwei-archive-brief');
        if (brief && hasBirthInfo(person)) {
          brief.textContent = `当前：${formatBirthBrief(person)}`;
        }
      },
    });

    const metaSlot = page.querySelector<HTMLElement>('#ziwei-birth-meta-slot');
    if (metaSlot) {
      mountBirthTimeMetaField({
        host: metaSlot,
        initial: {
          birthTimeAccuracy: person.birthTimeAccuracy,
          birthTimeSource: person.birthTimeSource,
        },
        onChange: (meta) => {
          updateBirthFields({
            birthYear: person.birthYear,
            birthMonth: person.birthMonth,
            birthDay: person.birthDay,
            birthHour: person.birthHour,
            birthPlace: person.birthPlace,
            birthTimeAccuracy: meta.birthTimeAccuracy,
            birthTimeSource: meta.birthTimeSource,
          });
          person = getActivePerson();
        },
      });
    }

    page.querySelector('#ziwei-birth-place')?.addEventListener('change', () => {
      const place =
        page.querySelector<HTMLInputElement>('#ziwei-birth-place')?.value.trim() ?? '';
      updateBirthFields({
        birthYear: person.birthYear,
        birthMonth: person.birthMonth,
        birthDay: person.birthDay,
        birthHour: person.birthHour,
        birthPlace: place,
      });
      person = getActivePerson();
      const brief = page.querySelector('.ziwei-archive-brief');
      if (brief && hasBirthInfo(person)) {
        brief.textContent = `当前：${formatBirthBrief(person)}`;
      }
    });

    page.querySelector('.life-back')?.addEventListener('click', () => navigate('/'));
    page.querySelectorAll<HTMLInputElement>('input[name="zw-gender"]').forEach((input) => {
      input.addEventListener('change', () => {
        const v = input.value === 'male' ? 'male' : 'female';
        patchActivePerson({ gender: v });
        person = getActivePerson();
        const start = page.querySelector<HTMLButtonElement>('#ziwei-start');
        if (start) start.disabled = !canCast(person);
      });
    });
    page.querySelector('#ziwei-start')?.addEventListener('click', () => {
      const place =
        page.querySelector<HTMLInputElement>('#ziwei-birth-place')?.value.trim() ??
        person.birthPlace;
      updateBirthFields({
        birthYear: person.birthYear,
        birthMonth: person.birthMonth,
        birthDay: person.birthDay,
        birthHour: person.birthHour,
        birthPlace: place,
      });
      person = getActivePerson();
      if (!canCast(person)) return;
      saveZiweiIntent(intent);
      navigate('/ziwei/loading');
    });
    page.querySelectorAll<HTMLButtonElement>('[data-path]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const path = btn.dataset.path;
        if (path) navigate(path);
      });
    });
  }

  paint();
  const disposeFloat = mountLabFloatShell(page, {
    system: 'ziwei',
    surface: 'learn',
    tujianPath: '/ziwei/codex',
    notesContext: '紫微首页',
  });
  return () => {
    disposeFloat();
    stars.remove();
    document.querySelector('.birth-dt-sheet')?.remove();
  };
}
