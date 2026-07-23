import { navigate } from '../router.ts';
import { isAiConfigured } from '../ai/settings.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { mountBirthDatetimeField } from '../ui/birth-datetime-picker.ts';
import { attachPersonSwitcherToPage } from '../ui/module-person-chrome.ts';
import { generatePortrait } from '../life/generate.ts';
import {
  deletePerson,
  formatBirthBrief,
  getActivePerson,
  hasUsableProfile,
  listPersons,
  loadLifeStore,
  saveLifeStore,
  setActivePersonId,
  upsertPerson,
} from '../life/storage.ts';
import {
  EMPTY_PROFILE,
  PERSON_RELATION_LABELS,
  SELF_PROFILE_ID,
  createEmptyPerson,
  toLifeProfileInput,
  type LifeProfileInput,
  type PersonProfile,
  type PersonRelation,
} from '../life/types.ts';
import { SCENE_TAG_OPTIONS, normalizeSceneTags } from '../life/scene-tags.ts';

const OPEN_NEW_KEY = 'mystic-lab-profile-open-new';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readForm(form: HTMLFormElement): {
  nickname: string;
  relation: PersonRelation;
  gender: '' | 'female' | 'male';
  lifeTags: string[];
  profile: LifeProfileInput;
} {
  const g = (name: string) =>
    (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null)
      ?.value?.trim() ?? '';
  const genderRaw = g('gender');
  const gender = genderRaw === 'female' || genderRaw === 'male' ? genderRaw : '';
  const relationRaw = g('relation') as PersonRelation;
  const lifeTags = normalizeSceneTags(
    [...form.querySelectorAll<HTMLInputElement>('[data-life-tag]:checked')].map((el) => el.value),
  );
  const custom = g('lifeTagCustom');
  if (custom && !lifeTags.includes(custom)) lifeTags.push(custom.slice(0, 10));
  return {
    nickname: g('nickname').slice(0, 8) || '未命名',
    relation: Object.keys(PERSON_RELATION_LABELS).includes(relationRaw) ? relationRaw : 'friend',
    gender,
    lifeTags: lifeTags.slice(0, 8),
    profile: {
      age: g('age'),
      occupation: g('occupation'),
      city: g('city'),
      birthYear: g('birthYear'),
      birthMonth: g('birthMonth'),
      birthDay: g('birthDay'),
      birthHour: g('birthHour'),
      birthPlace: g('birthPlace'),
      confusion: g('confusion'),
    },
  };
}

export function renderLifeProfile(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  let store = loadLifeStore();
  const aiOn = isAiConfigured();
  let editingId: string | null = getActivePerson().id;
  let creatingNew = false;

  try {
    if (sessionStorage.getItem(OPEN_NEW_KEY) === '1') {
      sessionStorage.removeItem(OPEN_NEW_KEY);
      creatingNew = true;
      editingId = null;
    }
  } catch {
    /* ignore */
  }

  const page = document.createElement('div');
  page.className = 'page life-page life-profile-page';
  mountEnvBanner(page);

  page.innerHTML = `
    <button type="button" class="back-link life-back">← 返回 Mystic Lab</button>
    <header class="life-header">
      <p class="home-eyebrow">ARCHIVE</p>
      <h1 class="page-title">档案</h1>
      <p class="page-subtitle">自己与他人 · 各板块顶栏可切换「这次问谁」</p>
      <p class="life-ai-hint">${aiOn ? '将优先用 AI 推演轻画像' : '本地模板推演 · 配置 AI 后可更贴合'}</p>
    </header>
    <div data-profile-body></div>
  `;

  root.appendChild(page);
  attachPersonSwitcherToPage(page);

  const body = page.querySelector<HTMLElement>('[data-profile-body]')!;

  function paint(): void {
    store = loadLifeStore();
    if (creatingNew) {
      paintEditor(createEmptyPerson({ nickname: '', relation: 'friend' }), true);
      return;
    }
    const id = editingId ?? store.activeProfileId;
    const person = store.profiles.find((p) => p.id === id) ?? getActivePerson();
    paintEditor(person, false);
  }

  function paintListHint(): string {
    const people = listPersons();
    return `
      <section class="profile-people-strip">
        <div class="profile-people-head">
          <h2>档案列表</h2>
          <button type="button" class="btn btn-sm" data-add-person>添加他人</button>
        </div>
        <ul class="profile-people-list">
          ${people
            .map((p) => {
              const on = !creatingNew && p.id === (editingId ?? store.activeProfileId);
              return `
              <li>
                <button type="button" class="profile-people-item${on ? ' is-on' : ''}" data-edit-person="${escapeHtml(p.id)}">
                  <span class="profile-people-avatar">${escapeHtml(p.nickname.slice(0, 1))}</span>
                  <span>
                    <strong>${escapeHtml(p.nickname)}</strong>
                    <em>${escapeHtml(PERSON_RELATION_LABELS[p.relation])}</em>
                  </span>
                </button>
              </li>`;
            })
            .join('')}
        </ul>
      </section>`;
  }

  function paintEditor(person: PersonProfile, isNew: boolean): void {
    const p = person;
    const relOptions = (Object.keys(PERSON_RELATION_LABELS) as PersonRelation[])
      .filter((r) => (isNew || p.id !== SELF_PROFILE_ID ? r !== 'self' : true))
      .map(
        (r) =>
          `<option value="${r}" ${p.relation === r ? 'selected' : ''}>${PERSON_RELATION_LABELS[r]}</option>`,
      )
      .join('');

    body.innerHTML = `
      ${paintListHint()}
      <form class="life-form" id="life-profile-form">
        <fieldset class="life-fieldset">
          <legend>${isNew ? '添加档案' : `编辑 · ${escapeHtml(p.nickname)}`}</legend>
          <label class="life-field"><span>昵称</span><input name="nickname" type="text" maxlength="8" placeholder="1–8 字" value="${escapeHtml(isNew ? '' : p.nickname)}" ${p.id === SELF_PROFILE_ID && !isNew ? 'readonly' : ''} /></label>
          <label class="life-field"><span>关系</span>
            <select name="relation" ${p.id === SELF_PROFILE_ID && !isNew ? 'disabled' : ''}>${relOptions}</select>
          </label>
          <label class="life-field"><span>性别</span>
            <select name="gender">
              <option value="" ${!p.gender ? 'selected' : ''}>不填</option>
              <option value="female" ${p.gender === 'female' ? 'selected' : ''}>女生</option>
              <option value="male" ${p.gender === 'male' ? 'selected' : ''}>男生</option>
            </select>
          </label>
        </fieldset>

        <fieldset class="life-fieldset">
          <legend>长期标签（可选）</legend>
          <div class="profile-life-tags">
            ${SCENE_TAG_OPTIONS.map(
              (t) => `
              <label class="profile-life-tag">
                <input type="checkbox" data-life-tag value="${t}" ${p.lifeTags.includes(t) ? 'checked' : ''} />
                <span>#${t}</span>
              </label>`,
            ).join('')}
          </div>
          <label class="life-field life-field-full"><span>自定义标签</span><input name="lifeTagCustom" type="text" maxlength="10" placeholder="如 求职期" /></label>
        </fieldset>

        <fieldset class="life-fieldset">
          <legend>当前人生状态</legend>
          <label class="life-field"><span>年龄</span><input name="age" type="text" inputmode="numeric" placeholder="如 29" value="${escapeHtml(p.age)}" /></label>
          <label class="life-field"><span>职业</span><input name="occupation" type="text" placeholder="如 产品经理" value="${escapeHtml(p.occupation)}" /></label>
          <label class="life-field"><span>城市</span><input name="city" type="text" placeholder="如 上海" value="${escapeHtml(p.city)}" /></label>
          <label class="life-field life-field-full">
            <span>当前困惑</span>
            <textarea name="confusion" rows="3" placeholder="例如：要不要离职？">${escapeHtml(p.confusion)}</textarea>
          </label>
        </fieldset>

        <fieldset class="life-fieldset">
          <legend>出生信息</legend>
          <div id="life-birth-dt-slot" class="life-birth-row"></div>
          <label class="life-field life-field-full"><span>出生地点</span><input name="birthPlace" type="text" placeholder="可选" value="${escapeHtml(p.birthPlace)}" /></label>
          <p class="life-footnote">出生信息也可在「八字」里填写。</p>
        </fieldset>

        <div class="life-form-actions">
          <button type="submit" class="life-btn-primary" id="life-save-btn">保存档案</button>
          ${
            p.id === SELF_PROFILE_ID && !isNew
              ? `<button type="button" class="life-btn-ghost" id="life-gen-btn">生成人生阶段</button>
                 <button type="button" class="life-btn-ghost" id="life-to-life" ${store.portrait ? '' : 'disabled'}>去人生宇宙 ›</button>`
              : ''
          }
          ${
            !isNew && p.id !== SELF_PROFILE_ID
              ? `<button type="button" class="life-btn-ghost" id="life-delete-btn">删除此人</button>`
              : ''
          }
          ${isNew ? `<button type="button" class="life-btn-ghost" id="life-cancel-new">取消</button>` : ''}
        </div>
        <p class="life-status" id="life-status" hidden></p>
      </form>
      <section class="life-portrait" id="life-portrait" ${store.portrait && p.id === SELF_PROFILE_ID && !isNew ? '' : 'hidden'}></section>
    `;

    const form = body.querySelector<HTMLFormElement>('#life-profile-form')!;
    const statusEl = body.querySelector<HTMLElement>('#life-status')!;
    const portraitEl = body.querySelector<HTMLElement>('#life-portrait')!;
    const birthSlot = body.querySelector<HTMLElement>('#life-birth-dt-slot')!;

    mountBirthDatetimeField({
      host: form,
      replaceEl: birthSlot,
      initialYear: p.birthYear,
      initialMonth: p.birthMonth,
      initialDay: p.birthDay,
      initialHour: p.birthHour,
    });

    body.querySelector('[data-add-person]')?.addEventListener('click', () => {
      creatingNew = true;
      editingId = null;
      paint();
    });
    body.querySelectorAll<HTMLButtonElement>('[data-edit-person]').forEach((btn) => {
      btn.addEventListener('click', () => {
        creatingNew = false;
        editingId = btn.dataset.editPerson!;
        setActivePersonId(editingId);
        paint();
      });
    });

    body.querySelector('#life-cancel-new')?.addEventListener('click', () => {
      creatingNew = false;
      editingId = getActivePerson().id;
      paint();
    });

    body.querySelector('#life-delete-btn')?.addEventListener('click', () => {
      if (!confirm(`确定删除「${p.nickname}」？`)) return;
      deletePerson(p.id);
      creatingNew = false;
      editingId = SELF_PROFILE_ID;
      paint();
    });

    const toLife = body.querySelector<HTMLButtonElement>('#life-to-life');
    toLife?.addEventListener('click', () => navigate('/life'));

    function renderPortrait(): void {
      const portrait = store.portrait;
      if (!portrait || p.id !== SELF_PROFILE_ID) {
        if (portraitEl) {
          portraitEl.hidden = true;
          portraitEl.innerHTML = '';
        }
        if (toLife) toLife.disabled = true;
        return;
      }
      portraitEl.hidden = false;
      if (toLife) toLife.disabled = false;
      const sourceLabel = portrait.source === 'ai' ? 'AI 推演' : '本地模板';
      portraitEl.innerHTML = `
        <div class="life-card life-card-portrait">
          <p class="life-card-kicker">当前人生阶段 · ${escapeHtml(sourceLabel)}</p>
          <h2>${escapeHtml(portrait.stageTitle)}</h2>
          <p class="life-card-body">${escapeHtml(portrait.stageSummary)}</p>
          <div class="life-chip-row">
            ${portrait.tendencies.map((t) => `<span class="life-chip">${escapeHtml(t)}</span>`).join('')}
          </div>
          <p class="life-meta">人生主题：${portrait.themes.map(escapeHtml).join(' · ')}</p>
          <p class="life-meta">出生简记：${escapeHtml(formatBirthBrief(store.profile))}</p>
          <ul class="life-hint-list">
            ${portrait.stageHints.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    renderPortrait();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = readForm(form);
      if (p.id === SELF_PROFILE_ID && !isNew) {
        data.nickname = '自己';
        data.relation = 'self';
      }
      const nextPerson: PersonProfile = {
        ...(isNew
          ? createEmptyPerson({ nickname: data.nickname, relation: data.relation })
          : p),
        nickname: data.nickname,
        relation: p.id === SELF_PROFILE_ID && !isNew ? 'self' : data.relation,
        gender: data.gender,
        lifeTags: data.lifeTags,
        ...data.profile,
      };
      if (!isNew) nextPerson.id = p.id;
      upsertPerson(nextPerson);
      setActivePersonId(nextPerson.id);
      creatingNew = false;
      editingId = nextPerson.id;
      statusEl.hidden = false;
      statusEl.textContent = '已保存';
      paint();
    });

    body.querySelector('#life-gen-btn')?.addEventListener('click', async () => {
      const data = readForm(form);
      const profile = data.profile;
      if (!hasUsableProfile(profile)) {
        statusEl.hidden = false;
        statusEl.textContent = '请至少填写年龄、职业、城市或困惑中的一项。';
        return;
      }
      const genBtn = body.querySelector<HTMLButtonElement>('#life-gen-btn')!;
      genBtn.disabled = true;
      statusEl.hidden = false;
      statusEl.textContent = aiOn ? '正在结合信息推演…' : '正在用本地模板生成…';
      try {
        upsertPerson({
          ...p,
          nickname: '自己',
          relation: 'self',
          gender: data.gender,
          lifeTags: data.lifeTags,
          ...profile,
        });
        const portrait = await generatePortrait(profile);
        store = loadLifeStore();
        store = {
          ...store,
          profile: toLifeProfileInput(profile),
          portrait,
          updatedAt: new Date().toISOString(),
        };
        saveLifeStore(store);
        statusEl.textContent =
          portrait.source === 'ai' ? '已生成（AI）。' : '已生成（本地模板）。';
        paint();
      } catch (err) {
        statusEl.textContent = err instanceof Error ? err.message : '生成失败';
      } finally {
        genBtn.disabled = false;
      }
    });
  }

  page.querySelector('.life-back')?.addEventListener('click', () => navigate('/'));
  paint();

  return () => {
    stars.remove();
    document.querySelector('.birth-dt-sheet')?.remove();
  };
}

export { EMPTY_PROFILE };
