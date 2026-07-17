import { navigate } from '../router.ts';
import { LIUYAO_CONCEPTS } from '../liuyao/learn-concepts.ts';
import { mountLiuyaoModeSwitch, setLiuyaoMode } from '../liuyao/mode.ts';
import { mountEnvBanner } from '../ui/banner.ts';

export function renderLiuyaoConcepts(root: HTMLElement): void {
  const page = document.createElement('div');
  page.className = 'page ly-concepts-page';
  mountEnvBanner(page);

  const top = document.createElement('div');
  top.className = 'ly-topbar';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 学习模式';
  back.addEventListener('click', () => {
    setLiuyaoMode('learn');
    navigate('/liuyao');
  });
  const modeHost = document.createElement('div');
  modeHost.className = 'ly-topbar-actions';
  top.append(back, modeHost);
  page.append(top);

  setLiuyaoMode('learn');
  mountLiuyaoModeSwitch(modeHost, {
    onChange: (mode) => {
      if (mode === 'cast') navigate('/liuyao');
    },
  });

  const hashId = location.hash.replace(/^#/, '');
  const initial =
    LIUYAO_CONCEPTS.find((c) => c.id === hashId)?.id ?? LIUYAO_CONCEPTS[0]!.id;

  const header = document.createElement('header');
  header.className = 'ly-codex-header';
  header.innerHTML = `
    <h1 class="page-title">核心概念</h1>
    <p class="page-subtitle">世应 · 六亲 · 动爻 · 变卦——读卦时反复用到的四块积木</p>
    <nav class="ly-concept-chips" aria-label="概念切换">
      ${LIUYAO_CONCEPTS.map(
        (c) => `
        <button type="button" class="ly-concept-chip${c.id === initial ? ' is-active' : ''}" data-id="${c.id}">
          ${c.title}
        </button>
      `,
      ).join('')}
    </nav>
  `;
  page.append(header);

  const stage = document.createElement('div');
  stage.className = 'ly-concept-stage';
  page.append(stage);

  function paint(id: string): void {
    const c = LIUYAO_CONCEPTS.find((x) => x.id === id) ?? LIUYAO_CONCEPTS[0]!;
    header.querySelectorAll<HTMLButtonElement>('.ly-concept-chip').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.id === c.id);
    });
    if (location.hash !== `#${c.id}`) {
      history.replaceState({}, '', `#${c.id}`);
    }
    stage.innerHTML = `
      <article class="ly-concept-detail">
        <p class="ly-concept-kicker">${c.kicker}</p>
        <h2>${c.title}</h2>
        <p class="ly-concept-summary">${c.summary}</p>
        ${c.sections
          .map(
            (s) => `
          <section class="ly-concept-section">
            <h3>${s.heading}</h3>
            ${s.body.map((p) => `<p>${p}</p>`).join('')}
          </section>
        `,
          )
          .join('')}
      </article>
    `;
  }

  header.querySelectorAll<HTMLButtonElement>('[data-id]').forEach((btn) => {
    btn.addEventListener('click', () => paint(btn.dataset.id!));
  });

  paint(initial);
  root.appendChild(page);
}
