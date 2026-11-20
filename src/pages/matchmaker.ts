/**
 * 今日当红娘 v2 · /matchmaker
 * 随机人池 → 牵线 → 按年推演（大运/流年/红鸾）→ 猜 → 回信 → 回看三行
 */
import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import type { MatchReasonId, VenueId } from '../matchmaker/events.ts';
import {
  adoptCustomMainline,
  clearRematch,
  enterGen2Matchmaking,
  enterIntimacyLesson,
  enterTengodLesson,
  findPersonAnywhere,
  followHousehold,
  getLedgerEntry,
  isTengodLesson,
  leaveGen2Matchmaking,
  leaveIntimacyLesson,
  leaveRematch,
  loadFreePool,
  loadMatchmakerStore,
  loadTutorialPool,
  refreshPoolKeepPinned,
  resetMatchmakerStore,
  saveMatchmakerStore,
  setIntimacyLesson,
  startRematch,
  type MatchmakerStore,
} from '../matchmaker/store.ts';
import {
  applyGuess,
  buildCouple,
  getPairFromStore,
  openNextEvent,
  revealEvent,
} from '../matchmaker/story.ts';
import { findInPool } from '../matchmaker/characters.ts';
import {
  openNearMissDialog,
  renderFamilyView,
  renderLedgerView,
} from '../matchmaker/ledger-ui.ts';
import { openPersonDialog } from '../matchmaker/person-dialog.ts';
import { openCreateCharacterDialog } from '../matchmaker/create-dialog.ts';
import {
  advanceLesson,
  gradeBaziBranchPick,
  gradeBaziDayColumn,
  gradePalaceTap,
} from '../matchmaker/intimacy-lesson.ts';
import {
  mountIntimacyLessonPlate,
  renderIntimacyLesson,
  setLessonFeedback,
} from '../matchmaker/intimacy-lesson-ui.ts';
import {
  advanceTengodLesson,
  gradePracticeGuess,
  gradeTapDay,
  gradeTapXin,
} from '../matchmaker/tengod-lesson.ts';
import {
  mountTengodLessonPlate,
  renderTengodLesson,
  tengodHintText,
} from '../matchmaker/tengod-lesson-ui.ts';
import {
  bindLearnClicks,
  renderFollowStep,
  renderGuessStep,
  renderPoolStep,
  renderReasonStep,
  renderRevealStep,
  renderVenueStep,
  tryPlayHintHtml,
} from '../matchmaker/steps-ui.ts';
import { loadTwoGenSample } from '../matchmaker/twogen-sample.ts';

const STEP_LABELS: Record<MatchmakerStore['step'], string> = {
  pool: '选人',
  reason: '理由',
  venue: '摆桌',
  guess: '猜',
  reveal: '回信',
  follow: '续追',
};

export function renderMatchmaker(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page life-page matchmaker-page';
  root.appendChild(page);

  let store = loadMatchmakerStore();
  let disposeLessonPlate: (() => void) | null = null;

  const persist = (next: MatchmakerStore): void => {
    store = saveMatchmakerStore(next);
  };

  const toggleSelect = (id: string, repaint = true): void => {
    const anchor = store.rematch?.anchorId;
    if (anchor && id === anchor) return;
    let ids = [...store.selectedIds];
    if (ids.includes(id)) {
      ids = ids.filter((x) => x !== id);
    } else if (ids.length < 2) {
      ids = [...ids, id];
    } else if (anchor) {
      ids = [anchor, id];
    } else {
      ids = [ids[1]!, id];
    }
    if (anchor && !ids.includes(anchor)) {
      ids = [anchor, ...ids.filter((x) => x !== anchor)].slice(0, 2);
    }
    persist({ ...store, selectedIds: ids });
    if (repaint) paint();
  };

  const paint = (): void => {
    disposeLessonPlate?.();
    disposeLessonPlate = null;
    let body = '';
    if (store.view === 'ledger') {
      body = renderLedgerView(store);
    } else if (store.view === 'family') {
      body = renderFamilyView(store);
    } else if (store.view === 'lesson' && store.lesson) {
      body = isTengodLesson(store.lesson)
        ? renderTengodLesson(store.lesson)
        : renderIntimacyLesson(store.lesson);
    } else {
      switch (store.step) {
        case 'pool':
          body = renderPoolStep(store);
          break;
        case 'reason':
          body = renderReasonStep(store);
          break;
        case 'venue':
          body = renderVenueStep(store);
          break;
        case 'guess':
          body = renderGuessStep(store);
          break;
        case 'reveal':
          body = renderRevealStep(store);
          break;
        case 'follow':
          body = renderFollowStep(store);
          break;
        default:
          body = renderPoolStep(store);
      }
    }

    const order: MatchmakerStore['step'][] = [
      'pool',
      'reason',
      'venue',
      'guess',
      'reveal',
      'follow',
    ];
    const showSteps = store.view === 'play';
    const isLesson = store.view === 'lesson';
    const isTengod = isTengodLesson(store.lesson);
    const lessonTitle = isTengod ? '十神从哪来' : '怎么看亲密关系';
    const lessonSub = isTengod
      ? '先认日干 · 再认见干 · 标签相对日主 · 图鉴查释义'
      : '教学题可对错 · 猜剧情另说 · 图鉴随手查完回来';

    page.innerHTML = '';
    mountEnvBanner(page);
    page.insertAdjacentHTML(
      'beforeend',
      `
    <button type="button" class="back-link life-back" data-path="/">← 返回 Mystic Lab</button>
    <header class="life-header">
      <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
      <p class="home-eyebrow">TODAY MATCHMAKER</p>
      <h1 class="life-title">${isLesson ? lessonTitle : '今日当红娘'}</h1>
      <p class="life-sub">${
        isLesson
          ? lessonSub
          : '你负责挑人牵线 · 按年看大运流年 · 她们自己走 · 你只能猜'
      }</p>
    </header>
    ${
      showSteps
        ? `<nav class="mm-steps" aria-label="进度">
      ${order
        .map((s, i) => {
          const on = store.step === s;
          return `<span class="mm-step${on ? ' is-on' : ''}">${i + 1}. ${STEP_LABELS[s]}</span>`;
        })
        .join('')}
    </nav>`
        : ''
    }
    ${body}
    ${store.view === 'play' ? tryPlayHintHtml() : ''}
    `,
    );

    bindLearnClicks(page, store.pool.length ? store.pool : store.roster);

    if (store.view === 'lesson' && store.lesson) {
      if (isTengodLesson(store.lesson)) {
        disposeLessonPlate = mountTengodLessonPlate(page, store.lesson, {
          onStemTap: (stem) => {
            if (!isTengodLesson(store.lesson)) return;
            const graded =
              store.lesson.phase === 'tap_day'
                ? gradeTapDay(store.lesson, stem)
                : store.lesson.phase === 'tap_xin'
                  ? gradeTapXin(store.lesson, stem)
                  : null;
            if (!graded) return;
            store = setIntimacyLesson(store, graded.next);
            if (!graded.ok) {
              paint();
              setLessonFeedback(page, graded.tip, graded.next.hinted);
              return;
            }
            paint();
          },
          onGuess: (god) => {
            if (!isTengodLesson(store.lesson)) return;
            const graded = gradePracticeGuess(store.lesson, god);
            store = setIntimacyLesson(store, graded.next);
            if (!graded.ok) {
              paint();
              setLessonFeedback(page, graded.tip, graded.next.hinted);
              return;
            }
            paint();
          },
          onHint: () => {
            if (!isTengodLesson(store.lesson)) return;
            const tip = tengodHintText(store.lesson);
            store = setIntimacyLesson(store, {
              ...store.lesson,
              hinted: true,
              wrongCount: Math.max(store.lesson.wrongCount, 2),
            });
            paint();
            setLessonFeedback(page, tip, true);
          },
        });
      } else {
        disposeLessonPlate = mountIntimacyLessonPlate(page, store.lesson, {
          onPalaceTap: (palaceName) => {
            if (!store.lesson || isTengodLesson(store.lesson)) return;
            const graded = gradePalaceTap(store.lesson, palaceName);
            store = setIntimacyLesson(store, graded.next);
            if (!graded.ok) {
              paint();
              setLessonFeedback(page, graded.tip, graded.next.hinted);
              return;
            }
            paint();
          },
          onHint: () => {
            if (!store.lesson || isTengodLesson(store.lesson)) return;
            store = setIntimacyLesson(store, {
              ...store.lesson,
              hinted: true,
              wrongCount: Math.max(store.lesson.wrongCount, 2),
            });
            paint();
            setLessonFeedback(
              page,
              '提示：看「亲密 / 一对一」相关的那一宫——名字里带「夫妻」。',
              true,
            );
          },
        });
      }
    }

    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => navigate(el.dataset.path || '/'));
    });

    page.querySelectorAll<HTMLElement>('[data-toggle-char]').forEach((el) => {
      el.addEventListener('click', (e) => {
        const t = e.target as HTMLElement | null;
        // 头像/名字/了解：只开简介，不切换选中
        if (t?.closest('[data-detail-char]')) return;
        // 卡片上的「选这位」与整卡点击都会走到这里；内层按钮先停冒泡避免双触发
        if (el.matches('button.mm-char-choose')) e.stopPropagation();
        else if (t?.closest('button.mm-char-choose')) return;
        toggleSelect(el.dataset.toggleChar!);
      });
      el.addEventListener('keydown', (e) => {
        if (el.tagName === 'BUTTON') return;
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        toggleSelect(el.dataset.toggleChar!);
      });
    });

    page.querySelectorAll<HTMLElement>('[data-detail-char]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.dataset.detailChar!;
        const person = findPersonAnywhere(store, id) ?? findInPool(store.pool, id);
        if (!person) return;
        openPersonDialog({
          person,
          pool: store.pool.length ? store.pool : store.roster,
          mainlineId: store.mainlineId,
          onFollowHousehold: (pid) => {
            store = followHousehold(store, pid);
            paint();
          },
        });
      });
    });

    page.querySelectorAll<HTMLElement>('[data-roster-id]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.rosterId!;
        const person = findPersonAnywhere(store, id);
        if (!person) return;
        openPersonDialog({
          person,
          pool: store.roster.length ? store.roster : store.pool,
          mainlineId: store.mainlineId,
          onFollowHousehold: (pid) => {
            store = followHousehold(store, pid);
            paint();
          },
        });
      });
    });

    page.querySelectorAll<HTMLElement>('[data-pin-char]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.dataset.pinChar!;
        const pinned = store.pinnedIds.includes(id)
          ? store.pinnedIds.filter((x) => x !== id)
          : [...store.pinnedIds, id];
        persist({ ...store, pinnedIds: pinned });
        paint();
      });
    });

    page.querySelector('[data-mm-intimacy-lesson]')?.addEventListener('click', () => {
      store = enterIntimacyLesson(store);
      paint();
    });

    page.querySelector('[data-mm-tengod-lesson]')?.addEventListener('click', () => {
      store = enterTengodLesson(store);
      paint();
    });

    page.querySelector('[data-mm-leave-lesson]')?.addEventListener('click', () => {
      store = leaveIntimacyLesson(store);
      paint();
    });

    page.querySelector('[data-mm-lesson-next]')?.addEventListener('click', () => {
      if (!store.lesson) return;
      if (isTengodLesson(store.lesson)) {
        const next = advanceTengodLesson(store.lesson);
        if (!next) return;
        store = setIntimacyLesson(store, next);
        paint();
        return;
      }
      const next = advanceLesson(store.lesson);
      if (!next) return;
      store = setIntimacyLesson(store, next);
      paint();
    });

    page.querySelector('[data-mm-lesson-hint]')?.addEventListener('click', () => {
      if (!store.lesson) return;
      if (isTengodLesson(store.lesson)) {
        const tip = tengodHintText(store.lesson);
        store = setIntimacyLesson(store, {
          ...store.lesson,
          hinted: true,
          wrongCount: Math.max(store.lesson.wrongCount, 2),
        });
        paint();
        setLessonFeedback(page, tip, true);
        return;
      }
      const phase = store.lesson.phase;
      store = setIntimacyLesson(store, {
        ...store.lesson,
        hinted: true,
        wrongCount: Math.max(store.lesson.wrongCount, 2),
      });
      paint();
      if (phase === 'ziwei_ask' || phase === 'practice_ziwei') {
        setLessonFeedback(
          page,
          '提示：看「亲密 / 一对一」相关的那一宫——名字里带「夫妻」。',
          true,
        );
      } else if (phase === 'bazi_day') {
        setLessonFeedback(page, '提示：四柱里代表「我自己」的那一柱叫日柱——表头写「日」。', true);
      } else if (phase === 'bazi_branch') {
        setLessonFeedback(
          page,
          '提示：日柱里，下面那颗地支才是传统说的夫妻宫背景（日支）。',
          true,
        );
      }
    });

    page.querySelectorAll<HTMLElement>('.bazi-grid th.bazi-col-year, .bazi-grid th.bazi-col-month, .bazi-grid th.bazi-col-day, .bazi-grid th.bazi-col-hour').forEach((th) => {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => {
        if (!store.lesson || isTengodLesson(store.lesson)) return;
        if (store.lesson.phase !== 'bazi_day') return;
        const key = [...th.classList]
          .find((c) => c.startsWith('bazi-col-'))
          ?.replace('bazi-col-', '');
        if (!key) return;
        const graded = gradeBaziDayColumn(store.lesson, key);
        store = setIntimacyLesson(store, graded.next);
        if (!graded.ok) {
          paint();
          setLessonFeedback(page, graded.tip, graded.next.hinted);
          return;
        }
        paint();
      });
    });

    page.querySelectorAll<HTMLElement>('[data-mm-lesson-day-part]').forEach((el) => {
      el.addEventListener('click', () => {
        if (!store.lesson || isTengodLesson(store.lesson)) return;
        if (store.lesson.phase !== 'bazi_branch') return;
        const part = el.dataset.mmLessonDayPart === 'stem' ? 'stem' : 'branch';
        const graded = gradeBaziBranchPick(store.lesson, part);
        store = setIntimacyLesson(store, graded.next);
        if (!graded.ok) {
          paint();
          setLessonFeedback(page, graded.tip, graded.next.hinted);
          return;
        }
        paint();
      });
    });

    page.querySelector('[data-mm-create-char]')?.addEventListener('click', () => {
      const usedNames = new Set([
        ...store.pool.map((c) => c.nickname),
        ...store.roster.map((c) => c.nickname),
      ]);
      openCreateCharacterDialog({
        usedNames,
        onCreated: (ch) => {
          store = adoptCustomMainline(store, ch);
          paint();
        },
      });
    });

    page.querySelector('[data-mm-refresh-pool]')?.addEventListener('click', () => {
      store = refreshPoolKeepPinned(store);
      paint();
    });

    page.querySelector('[data-mm-tutorial-pool]')?.addEventListener('click', () => {
      store = loadTutorialPool(store);
      paint();
    });

    page.querySelector('[data-mm-free-pool]')?.addEventListener('click', () => {
      store = loadFreePool(store);
      paint();
    });

    page.querySelector('[data-mm-twogen-pool]')?.addEventListener('click', () => {
      store = loadTwoGenSample(store);
      paint();
    });

    page.querySelectorAll('[data-mm-view-ledger]').forEach((el) => {
      el.addEventListener('click', () => {
        persist({ ...store, view: 'ledger', focusLedgerId: null });
        paint();
      });
    });

    page.querySelectorAll('[data-mm-view-play]').forEach((el) => {
      el.addEventListener('click', () => {
        persist({ ...store, view: 'play', focusLedgerId: null });
        paint();
      });
    });

    page.querySelectorAll<HTMLElement>('[data-mm-ledger-open]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.mmLedgerOpen!;
        const entry = getLedgerEntry(store, id);
        if (!entry) return;
        if (entry.kind === 'near_miss') {
          const a = findPersonAnywhere(store, entry.idA);
          const b = findPersonAnywhere(store, entry.idB);
          openNearMissDialog(entry, {
            a: a?.nickname ?? entry.idA,
            b: b?.nickname ?? entry.idB,
          });
          return;
        }
        if (entry.kind === 'marriage') {
          persist({ ...store, view: 'family', focusLedgerId: entry.id });
          paint();
        }
      });
    });

    page.querySelectorAll<HTMLElement>('[data-mm-open-near-miss]').forEach((el) => {
      el.addEventListener('click', () => {
        const entry = getLedgerEntry(store, el.dataset.mmOpenNearMiss);
        if (!entry) return;
        const a = findPersonAnywhere(store, entry.idA);
        const b = findPersonAnywhere(store, entry.idB);
        openNearMissDialog(entry, {
          a: a?.nickname ?? entry.idA,
          b: b?.nickname ?? entry.idB,
        });
      });
    });

    page.querySelector('[data-mm-to-reason]')?.addEventListener('click', () => {
      if (store.selectedIds.length !== 2) return;
      persist({
        ...store,
        step: 'reason',
        reasonId: null,
        venueId: null,
        couple: null,
        activeEvent: null,
        lastReveal: null,
      });
      paint();
    });

    page.querySelector('[data-mm-back-pool]')?.addEventListener('click', () => {
      persist({ ...store, step: 'pool' });
      paint();
    });

    page.querySelectorAll<HTMLElement>('[data-pick-reason]').forEach((el) => {
      el.addEventListener('click', () => {
        persist({ ...store, reasonId: el.dataset.pickReason as MatchReasonId });
        paint();
      });
    });

    page.querySelector('[data-mm-to-venue]')?.addEventListener('click', () => {
      if (!store.reasonId) return;
      persist({ ...store, step: 'venue' });
      paint();
    });

    page.querySelector('[data-mm-back-reason]')?.addEventListener('click', () => {
      persist({ ...store, step: 'reason' });
      paint();
    });

    page.querySelectorAll<HTMLElement>('[data-pick-venue]').forEach((el) => {
      el.addEventListener('click', () => {
        persist({ ...store, venueId: el.dataset.pickVenue as VenueId });
        paint();
      });
    });

    page.querySelector('[data-mm-start-story]')?.addEventListener('click', () => {
      const pair = getPairFromStore(store);
      if (!pair || !store.reasonId || !store.venueId) return;
      const couple = buildCouple(pair[0], pair[1], store.reasonId, store.venueId);
      if ('error' in couple) {
        window.alert(couple.error);
        return;
      }
      const withCouple = saveMatchmakerStore(
        clearRematch({
          ...store,
          couple,
          selectedIds: [couple.idA, couple.idB],
        }),
      );
      const next = openNextEvent(withCouple);
      if ('error' in next) {
        window.alert(next.error);
        return;
      }
      store = saveMatchmakerStore(clearRematch(next));
      paint();
    });

    page.querySelectorAll<HTMLElement>('[data-pick-guess]').forEach((el) => {
      el.addEventListener('click', () => {
        const next = applyGuess(store, el.dataset.pickGuess!);
        if ('error' in next) return;
        persist(next);
        paint();
      });
    });

    page.querySelector('[data-mm-reveal]')?.addEventListener('click', () => {
      const next = revealEvent(store);
      if ('error' in next) {
        window.alert(next.error);
        return;
      }
      persist(next);
      paint();
    });

    page.querySelector('[data-mm-follow]')?.addEventListener('click', () => {
      persist({ ...store, step: 'follow' });
      paint();
    });

    page.querySelector('[data-mm-next-event]')?.addEventListener('click', () => {
      const next = openNextEvent(store);
      if ('error' in next) {
        window.alert(next.error);
        return;
      }
      store = saveMatchmakerStore(next);
      paint();
    });

    page.querySelectorAll('[data-mm-new-pair]').forEach((el) => {
      el.addEventListener('click', () => {
        persist({
          ...store,
          rematch: null,
          step: 'pool',
          view: 'play',
          selectedIds: [],
          reasonId: null,
          venueId: null,
          couple: null,
          activeEvent: null,
          lastReveal: null,
        });
        paint();
      });
    });

    page.querySelectorAll<HTMLElement>('[data-mm-rematch]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.mmRematch!;
        store = startRematch(store, id);
        paint();
      });
    });

    page.querySelectorAll<HTMLElement>('[data-mm-follow-household]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.mmFollowHousehold!;
        store = followHousehold(store, id);
        paint();
      });
    });

    page.querySelector('[data-mm-leave-rematch]')?.addEventListener('click', () => {
      store = leaveRematch(store);
      paint();
    });

    page.querySelector('[data-mm-enter-gen2]')?.addEventListener('click', () => {
      store = enterGen2Matchmaking(store);
      paint();
    });

    page.querySelector('[data-mm-leave-gen2]')?.addEventListener('click', () => {
      store = leaveGen2Matchmaking(store);
      paint();
    });
  };

  paint();

  return () => {
    disposeLessonPlate?.();
    disposeLessonPlate = null;
    stars.remove();
  };
}

/** 调试 / 测试用：清空存档 */
export function __resetMatchmakerForTest(): void {
  resetMatchmakerStore();
}
