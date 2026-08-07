import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { attachPersonSwitcherToPage } from '../ui/module-person-chrome.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { mountBirthDatetimeField } from '../ui/birth-datetime-picker.ts';
import {
  formatBirthBrief,
  getActivePerson,
  hasBirthInfo,
  loadLifeStore,
  patchActivePerson,
  updateBirthFields,
} from '../life/storage.ts';
import { parseBirthParts } from '../bazi/parse-birth.ts';
import { baziCodexProgress } from '../bazi/codex.ts';
import { SYSTEM_POSITION } from '../lab/system-positioning.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function canCast(p: {
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour: string;
}): boolean {
  return Boolean(parseBirthParts(p.birthYear, p.birthMonth, p.birthDay, p.birthHour));
}

/** 校准只需年月日（时辰待推） */
function canRectify(p: {
  birthYear: string;
  birthMonth: string;
  birthDay: string;
}): boolean {
  return Boolean(parseBirthParts(p.birthYear, p.birthMonth, p.birthDay, ''));
}

function wantsEdit(): boolean {
  try {
    return new URLSearchParams(location.search).get('edit') === '1';
  } catch {
    return false;
  }
}

export function renderBaziHome(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  let store = loadLifeStore();
  let person = getActivePerson();
  const p = store.profile;

  // 与紫微一致：人生宇宙档案已可排盘则直进命盘，不重复填表（?edit=1 强制改资料）
  if (canCast(person) && !wantsEdit()) {
    stars.remove();
    navigate('/bazi/reading');
    return () => {};
  }

  let castReady = canCast(person);
  let dateReady = canRectify(person);

  const page = document.createElement('div');
  page.className = 'page life-page bazi-home-page';
  mountEnvBanner(page);

  function genderRadios(): string {
    const g = person.gender;
    return `
      <fieldset class="life-fieldset bazi-gender-field">
        <legend>性别（可选，微调关系措辞）</legend>
        <div class="bazi-gender-row">
          <label><input type="radio" name="gender" value="female" ${g === 'female' ? 'checked' : ''} /> 女</label>
          <label><input type="radio" name="gender" value="male" ${g === 'male' ? 'checked' : ''} /> 男</label>
          <label><input type="radio" name="gender" value="" ${!g ? 'checked' : ''} /> 暂不选</label>
        </div>
      </fieldset>`;
  }

  function renderEntries(): string {
    const codex = baziCodexProgress();
    return `
    <nav class="bazi-home-nav" aria-label="八字入口">
      <button type="button" class="bazi-home-link" data-path="/bazi/reading" data-open="${castReady ? '1' : '0'}" ${castReady ? '' : 'disabled'}>
        <strong>我的命盘</strong>
        <span>白话速读 · 认识自己</span>
        ${castReady ? '<em aria-hidden="true">›</em>' : '<em class="tag">需出生日期</em>'}
      </button>
      <button type="button" class="bazi-home-link" data-path="/bazi/chart" data-open="${castReady ? '1' : '0'}" ${castReady ? '' : 'disabled'}>
        <strong>命盘解析</strong>
        <span>出生密码五步 · 专业盘</span>
        ${castReady ? '<em aria-hidden="true">›</em>' : '<em class="tag">需出生日期</em>'}
      </button>
      <button type="button" class="bazi-home-link bazi-home-link-soft" data-path="/bazi/rectify" data-open="${dateReady ? '1' : '0'}" ${dateReady ? '' : 'disabled'}>
        <strong>生时校准</strong>
        <span>大事件反推时辰</span>
        ${dateReady ? '<em aria-hidden="true">›</em>' : '<em class="tag">需出生日期</em>'}
      </button>
      <button type="button" class="bazi-home-link" data-path="/bazi/tujian">
        <strong>八字探索</strong>
        <span>金木水火土 · 天干地支 · ${codex.collected}/${codex.total}</span>
        <em aria-hidden="true">›</em>
      </button>
    </nav>`;
  }

  page.innerHTML = `
    <button type="button" class="back-link life-back">← 返回 Mystic Lab</button>
    <header class="life-header">
      <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
      <p class="home-eyebrow">MYSTIC LAB</p>
      <h1 class="page-title">八字</h1>
      <p class="page-subtitle">${SYSTEM_POSITION.bazi}</p>
      <p class="bazi-home-person">当前角色 · ${escapeHtml(person.nickname)}</p>
    </header>

    <form class="life-form bazi-birth-form" id="bazi-birth-form" aria-label="出生信息">
      <fieldset class="life-fieldset">
        <legend>出生信息</legend>
        <p class="life-footnote">写入「${escapeHtml(person.nickname)}」的档案，各体系共用，不必重复填写。</p>
        <p class="life-footnote" id="bazi-birth-sync" ${hasBirthInfo(p) ? '' : 'hidden'}>
          ${hasBirthInfo(p) ? `当前：${escapeHtml(formatBirthBrief(p))}` : ''}
        </p>
        <div id="bazi-birth-dt-slot" class="life-birth-row"></div>
        <label class="life-field life-field-full"><span>出生地</span><input name="birthPlace" type="text" placeholder="如 成都（可选，用于真太阳时粗校）" value="${escapeHtml(p.birthPlace)}" /></label>
      </fieldset>
      ${genderRadios()}
      <div class="life-form-actions">
        <button type="submit" class="life-btn-primary" id="bazi-birth-save">保存到档案</button>
        <button type="button" class="life-btn-primary" id="bazi-to-reading" data-path="/bazi/reading" ${castReady ? '' : 'disabled'}>认识我的出生密码 ›</button>
      </div>
      <p class="life-status" id="bazi-birth-status" hidden></p>
    </form>

    <div id="bazi-entries" class="bazi-home-entries">${renderEntries()}</div>
  `;

  const form = page.querySelector<HTMLFormElement>('#bazi-birth-form')!;
  const statusEl = page.querySelector<HTMLElement>('#bazi-birth-status')!;
  const syncHint = page.querySelector<HTMLElement>('#bazi-birth-sync')!;
  const entriesEl = page.querySelector<HTMLElement>('#bazi-entries')!;
  const toReading = page.querySelector<HTMLButtonElement>('#bazi-to-reading')!;
  const slot = page.querySelector<HTMLElement>('#bazi-birth-dt-slot')!;

  mountBirthDatetimeField({
    host: form,
    replaceEl: slot,
    initialYear: p.birthYear,
    initialMonth: p.birthMonth,
    initialDay: p.birthDay,
    initialHour: p.birthHour,
  });

  function refreshCastGate(): void {
    castReady = canCast(store.profile);
    dateReady = canRectify(store.profile);
    toReading.disabled = !castReady;
    entriesEl.innerHTML = renderEntries();
    bindPathClicks(entriesEl);
  }

  function bindPathClicks(scope: ParentNode = page): void {
    scope.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        if ((el as HTMLButtonElement).disabled) return;
        if (el.dataset.open === '0') return;
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
  }

  page.querySelector('.life-back')?.addEventListener('click', () => navigate('/'));
  bindPathClicks();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const g = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | null)?.value?.trim() ?? '';
    const birth = {
      birthYear: g('birthYear'),
      birthMonth: g('birthMonth'),
      birthDay: g('birthDay'),
      birthHour: g('birthHour'),
      birthPlace: g('birthPlace'),
    };
    if (!birth.birthYear && !birth.birthMonth && !birth.birthDay) {
      statusEl.hidden = false;
      statusEl.textContent = '请先选择出生时间。';
      return;
    }
    const checked = form.querySelector<HTMLInputElement>('input[name="gender"]:checked');
    const genderRaw = checked?.value ?? '';
    const gender =
      genderRaw === 'female' || genderRaw === 'male' ? genderRaw : ('' as const);
    store = updateBirthFields(birth);
    store = patchActivePerson({ gender });
    person = getActivePerson();
    syncHint.hidden = false;
    syncHint.textContent = `当前：${formatBirthBrief(store.profile)}`;
    statusEl.hidden = false;
    statusEl.textContent = canCast(store.profile)
      ? `已写入「${person.nickname}」的档案。`
      : `已写入「${person.nickname}」的档案。排盘还需完整年月日。`;
    refreshCastGate();
  });

  root.appendChild(page);
  attachPersonSwitcherToPage(page, {
    onChange: () => {
      // 切换角色：有资料直进排盘，否则留在表单
      navigate(canCast(getActivePerson()) ? '/bazi/reading' : '/bazi?edit=1');
    },
  });
  return () => {
    stars.remove();
    document.querySelector('.birth-dt-sheet')?.remove();
  };
}
