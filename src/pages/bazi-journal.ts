/**
 * 八字 · 手札
 */
import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { castBaziChart } from '../bazi/cast.ts';
import {
  BAZI_JOURNAL_MOODS,
  buildBaziJournalSnapshot,
  deleteBaziJournalEntry,
  loadBaziJournal,
  moodLabel,
  saveBaziJournalEntry,
  snapshotLine,
  updateBaziJournalReflection,
  type BaziAiSession,
  type BaziJournalEntry,
  type BaziJournalMood,
} from '../bazi/journal.ts';
import { buildLuckCycles } from '../bazi/luck-cycles.ts';
import { getActivePerson, hasBirthInfo, loadLifeStore } from '../life/storage.ts';
import { baziSysTabsHtml } from '../ui/lab-sys-tabs.ts';
import { attachPersonSwitcherToPage } from '../ui/module-person-chrome.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderAiSessionsHtml(sessions: BaziAiSession[] | undefined): string {
  if (!sessions?.length) return '';
  const blocks = sessions
    .map((s) => {
      const title = s.kind === 'deep' ? '深度解读' : '追问';
      const body =
        s.deepReading?.trim() ||
        s.turns
          .filter((t) => t.role === 'assistant')
          .map((t) => t.content)
          .join('\n\n') ||
        '';
      if (!body.trim()) return '';
      const extra =
        s.turns.length > 1
          ? `<details class="ly-replay-ai-turns"><summary>追问记录（${s.turns.length} 条）</summary>${s.turns
              .map(
                (t) =>
                  `<p class="ly-replay-ai-turn is-${t.role}"><strong>${
                    t.role === 'user' ? '你' : '陪读'
                  }</strong> · ${escapeHtml(t.content)}</p>`,
              )
              .join('')}</details>`
          : '';
      return `<section class="ly-replay-ai"><h4>${title}</h4><p class="ly-replay-pre">${escapeHtml(
        body,
      )}</p>${extra}</section>`;
    })
    .filter(Boolean)
    .join('');
  return blocks ? `<div class="ly-replay-ai-wrap bj-ai-wrap">${blocks}</div>` : '';
}

function aiBadge(entry: BaziJournalEntry): string {
  const n = entry.aiSessions?.length ?? 0;
  if (!n) return '';
  return `<p class="bj-ai-badge">含深度解读 · ${n} 段</p>`;
}

function currentSnapshot() {
  const store = loadLifeStore();
  const person = getActivePerson();
  if (!hasBirthInfo(store.profile)) return null;
  const year = new Date().getFullYear();
  const chart = castBaziChart(person, year, {
    includeLiunian: false,
    gender: person.gender,
  });
  if ('error' in chart) return null;
  const luck = buildLuckCycles(person, person.gender, year);
  return buildBaziJournalSnapshot(chart, luck);
}

export function renderBaziJournal(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page life-page bazi-journal-page';
  mountEnvBanner(page);
  root.appendChild(page);

  function paint(): void {
    const entries = loadBaziJournal();
    const snap = currentSnapshot();
    const snapHint = snapshotLine(snap);

    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/bazi">← 八字</button>
      ${baziSysTabsHtml('reading')}
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <p class="home-eyebrow">JOURNAL</p>
        <h1 class="page-title">八字手札</h1>
        <p class="page-subtitle">记下此刻体感 · 附上当时格局与运程快照 · AI 解读可回看 · <button type="button" class="bj-journey-link" data-path="/records">我的旅程 ›</button></p>
      </header>

      <section class="bj-compose" aria-label="写一条手札">
        <p class="bj-compose-kicker">写一条</p>
        ${
          snapHint
            ? `<p class="bj-snap-preview" aria-label="将附带的快照">${escapeHtml(snapHint)}</p>`
            : `<p class="bj-snap-preview is-muted">未排盘时仍可写；有出生信息会自动附格局快照。</p>`
        }
        <label class="bj-field">
          <span class="visually-hidden">手札正文</span>
          <textarea id="bj-body" class="bj-input" rows="4" maxlength="2000" placeholder="今天想留下什么？对照喜用、大运，或一句体感…"></textarea>
        </label>
        <div class="bj-moods" role="group" aria-label="心情（可选）">
          ${BAZI_JOURNAL_MOODS.map(
            (m) => `
            <label class="bj-mood">
              <input type="radio" name="bj-mood" value="${escapeHtml(m.id)}" ${m.id === '' ? 'checked' : ''} />
              <span>${escapeHtml(m.label)}</span>
            </label>`,
          ).join('')}
        </div>
        <div class="bj-compose-actions">
          <button type="button" class="life-btn-primary" id="bj-save">写入手札</button>
          <button type="button" class="life-btn-ghost" data-path="/bazi/reading">回解读 ›</button>
        </div>
        <p class="bj-status" id="bj-status" hidden></p>
      </section>

      <section class="bj-list" aria-label="手札列表">
        <h2 class="bj-list-title">已记 ${entries.length} 条</h2>
        ${
          entries.length === 0
            ? `<div class="bj-empty"><p>还没有手札。</p><p class="bj-empty-hint">写一句今天的体感，或在解读页生成深度解读后自动写入。</p></div>`
            : entries
                .map((e) => {
                  const date = new Date(e.createdAt);
                  const when = Number.isNaN(date.getTime())
                    ? ''
                    : date.toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                  const mood = moodLabel(e.mood);
                  const line = snapshotLine(e.snapshot);
                  const hasAi = (e.aiSessions?.length ?? 0) > 0;
                  return `
                  <article class="bj-item${hasAi ? ' has-ai' : ''}" data-id="${escapeHtml(e.id)}">
                    <div class="bj-item-head">
                      <time>${escapeHtml(when)}</time>
                      ${mood ? `<span class="bj-mood-pill">${escapeHtml(mood)}</span>` : ''}
                      ${e.subjectName ? `<span class="bj-who">${escapeHtml(e.subjectName)}</span>` : ''}
                    </div>
                    ${aiBadge(e)}
                    <p class="bj-body">${escapeHtml(e.body || '（空白）')}</p>
                    ${line ? `<p class="bj-snap">${escapeHtml(line)}${e.snapshot?.dayunHint ? ` · ${escapeHtml(e.snapshot.dayunHint)}` : ''}</p>` : ''}
                    ${
                      hasAi
                        ? `<details class="bj-ai-fold"><summary>回看 AI 解读</summary>${renderAiSessionsHtml(e.aiSessions)}</details>`
                        : ''
                    }
                    <textarea class="bj-reflect" rows="2" data-reflect placeholder="后来补写…">${escapeHtml(e.reflection)}</textarea>
                    <div class="bj-item-actions">
                      <button type="button" class="life-btn-ghost bj-del" data-del>删除</button>
                    </div>
                  </article>`;
                })
                .join('')
        }
      </section>
    `;

    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });

    page.querySelector('#bj-save')?.addEventListener('click', () => {
      const ta = page.querySelector<HTMLTextAreaElement>('#bj-body');
      const status = page.querySelector<HTMLElement>('#bj-status');
      const body = ta?.value ?? '';
      if (!body.trim()) {
        if (status) {
          status.hidden = false;
          status.textContent = '先写一句再保存。';
        }
        ta?.focus();
        return;
      }
      const moodEl = page.querySelector<HTMLInputElement>('input[name="bj-mood"]:checked');
      const mood = (moodEl?.value ?? '') as BaziJournalMood;
      saveBaziJournalEntry({
        body,
        mood,
        snapshot: snap,
      });
      paint();
    });

    page.querySelectorAll<HTMLTextAreaElement>('[data-reflect]').forEach((ta) => {
      const id = ta.closest<HTMLElement>('[data-id]')?.dataset.id;
      if (!id) return;
      ta.addEventListener('change', () => {
        updateBaziJournalReflection(id, ta.value);
      });
    });

    page.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest<HTMLElement>('[data-id]')?.dataset.id;
        if (!id) return;
        if (!confirm('删除这条手札？')) return;
        deleteBaziJournalEntry(id);
        paint();
      });
    });

    attachPersonSwitcherToPage(page, {
      onChange: () => navigate('/bazi/journal'),
    });
  }

  paint();

  return () => {
    stars.remove();
    page.remove();
  };
}
