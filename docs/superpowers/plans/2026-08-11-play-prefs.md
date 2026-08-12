# 玩法偏好（Play Prefs）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按角色持久化两层玩法开关（线总开 + 块显示），默认全关；造命/八字/紫微右上角进同一设置面板；关线停对应结算与入口，关 RPG 连带停运限任务。

**Architecture:** 新建 `src/play/prefs.ts` 为唯一读写源；`openPlayPrefsSheet` 统一 UI；各页用 `isLineEnabled` / `isBlockShown` 显隐与 early-return；样式放 `play-prefs.css`（不依赖 ziwei.css）。多步 howto 改为分行列表（含 `learn-tree.ts` 长句）。

**Tech Stack:** TypeScript、Vitest、现有 Vite 路由与 localStorage 模式（对齐 `profile-context` / `liuyao/mode`）

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-11-play-prefs-design.md`
- 默认全关：缺 person / line / block → `false`
- 跟角色：`byPerson[personId]`
- 关线 = 不能玩 + 不产对应经验；不清档
- 关 RPG → 运限任务条不挂载、结算 early-return
- 块关、线开：深链仍可玩并产经验（运限例外：线关则完全停）
- 多步说明禁止分号长句 → `场景 · 动作` 分行列表
- 弹层样式不得只依赖 `ziwei.css`
- Commit **仅当用户明确要求时**执行（计划里 Step Commit 可跳过）
- Star PM：`proj-moonpie`

---

## File map

| File | Responsibility |
|------|----------------|
| `src/play/prefs.ts` | 类型、默认、load/save、isLineEnabled、isBlockShown、setLine、setBlock |
| `src/play/prefs.test.ts` | 默认全关、隔离角色、开关读写 |
| `src/play/prefs-sheet.ts` | `openPlayPrefsSheet(personId, opts?)` |
| `src/play/prefs-meta.ts` | 线/块标签、「怎么玩」分行文案 |
| `src/play/gate.ts` | 占位 HTML helper：`playClosedPlaceholderHtml(label, lineId)` |
| `src/ui/play-prefs-entry.ts` | `attachPlayPrefsButton(actionsEl, personId)` |
| `src/styles/play-prefs.css` | sheet + 占位 + 入口按钮 |
| `src/pages/craft-home.ts` | 入口 + 按块显隐 |
| `src/pages/ziwei-reading.ts` | 入口 + rpg 关则不 mount 任务 |
| `src/pages/bazi-reading.ts`（及 guess/week/learn 相关） | 入口 + 线/块门闩 |
| `src/bazi/learn-store.ts` | collect/interaction/guess 写前门闩 |
| `src/craft/daily-quest-store.ts` 或结算入口 | rpg 关 early-return |
| `src/ui/quest-banner-checkin.ts` | mount 前检查 rpg |
| `src/bazi/learn-tree.ts` | howto 改分行 |
| `src/journal/backup.ts` | 加入 `mystic-lab-play-prefs-v1` |
| `src/main.ts` / 各路由 styles | 需要处加载 `play-prefs.css` |

---

### Task 1: prefs store + 单测

**Files:**
- Create: `src/play/prefs.ts`
- Create: `src/play/prefs.test.ts`

**Interfaces:**
- Produces:
  - `PLAY_PREFS_KEY = 'mystic-lab-play-prefs-v1'`
  - `type PlayLineId = 'learn' | 'sim' | 'guess' | 'weekly' | 'shuttle' | 'rpg'`
  - `type PlayBlockId` 字符串联合（见下）
  - `type PlayLinePrefs = { enabled: boolean; blocks: Partial<Record<PlayBlockId, boolean>> }`
  - `type PlayPrefs = { lines: Record<PlayLineId, PlayLinePrefs> }`
  - `emptyPlayPrefs(): PlayPrefs` — 全 `enabled: false`，`blocks: {}`
  - `loadPlayPrefs(personId: string): PlayPrefs`
  - `savePlayPrefs(personId: string, prefs: PlayPrefs): void`
  - `isLineEnabled(personId: string, line: PlayLineId): boolean`
  - `isBlockShown(personId: string, line: PlayLineId, block: PlayBlockId): boolean` — 线关则 false；线开则看 `blocks[block] === true`
  - `setLineEnabled(personId, line, enabled): PlayPrefs`
  - `setBlockShown(personId, line, block, shown): PlayPrefs`
  - `__resetPlayPrefsForTest(): void`

**PlayBlockId（P0 全集）：**

```ts
export type PlayBlockId =
  | 'knowledgeChip'
  | 'tree'
  | 'ifBlock'
  | 'guessEntry'
  | 'weather'
  | 'timeMachine'
  | 'spiritRadar'
  | 'yearBuff'
  | 'comboAch'
  | 'awakenTip'
  | 'xpCard'
  | 'craftQuests'
  | 'ziweiDaily';
```

- [ ] **Step 1: Write failing test**

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import {
  __resetPlayPrefsForTest,
  isBlockShown,
  isLineEnabled,
  loadPlayPrefs,
  setBlockShown,
  setLineEnabled,
} from './prefs.ts';

describe('play prefs', () => {
  beforeEach(() => __resetPlayPrefsForTest());

  it('defaults all lines off', () => {
    const p = loadPlayPrefs('u1');
    expect(p.lines.rpg.enabled).toBe(false);
    expect(p.lines.learn.enabled).toBe(false);
    expect(isLineEnabled('u1', 'rpg')).toBe(false);
    expect(isBlockShown('u1', 'rpg', 'xpCard')).toBe(false);
  });

  it('isolates persons', () => {
    setLineEnabled('a', 'rpg', true);
    setBlockShown('a', 'rpg', 'xpCard', true);
    expect(isLineEnabled('a', 'rpg')).toBe(true);
    expect(isBlockShown('a', 'rpg', 'xpCard')).toBe(true);
    expect(isLineEnabled('b', 'rpg')).toBe(false);
  });

  it('block stays hidden when line off even if block true in storage', () => {
    setBlockShown('u1', 'learn', 'knowledgeChip', true);
    expect(isBlockShown('u1', 'learn', 'knowledgeChip')).toBe(false);
    setLineEnabled('u1', 'learn', true);
    expect(isBlockShown('u1', 'learn', 'knowledgeChip')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npx vitest run src/play/prefs.test.ts`  
（在 `产品/Mystic Lab  随心而行` 目录）

- [ ] **Step 3: Implement `prefs.ts`**

```ts
const PLAY_PREFS_KEY = 'mystic-lab-play-prefs-v1';
const LINE_IDS = ['learn', 'sim', 'guess', 'weekly', 'shuttle', 'rpg'] as const;

export function emptyPlayPrefs(): PlayPrefs {
  const lines = {} as PlayPrefs['lines'];
  for (const id of LINE_IDS) lines[id] = { enabled: false, blocks: {} };
  return { lines };
}

function readStore(): { byPerson: Record<string, PlayPrefs> } {
  try {
    const raw = localStorage.getItem(PLAY_PREFS_KEY);
    if (!raw) return { byPerson: {} };
    const parsed = JSON.parse(raw) as { byPerson?: Record<string, PlayPrefs> };
    return { byPerson: parsed.byPerson ?? {} };
  } catch {
    return { byPerson: {} };
  }
}

function writeStore(store: { byPerson: Record<string, PlayPrefs> }): void {
  localStorage.setItem(PLAY_PREFS_KEY, JSON.stringify(store));
}

export function loadPlayPrefs(personId: string): PlayPrefs {
  const stored = readStore().byPerson[personId];
  const base = emptyPlayPrefs();
  if (!stored?.lines) return base;
  for (const id of LINE_IDS) {
    const L = stored.lines[id];
    if (!L) continue;
    base.lines[id] = {
      enabled: Boolean(L.enabled),
      blocks: { ...(L.blocks ?? {}) },
    };
  }
  return base;
}

export function isLineEnabled(personId: string, line: PlayLineId): boolean {
  return loadPlayPrefs(personId).lines[line].enabled === true;
}

export function isBlockShown(
  personId: string,
  line: PlayLineId,
  block: PlayBlockId,
): boolean {
  const prefs = loadPlayPrefs(personId);
  if (!prefs.lines[line].enabled) return false;
  return prefs.lines[line].blocks[block] === true;
}

// setLineEnabled / setBlockShown: load → mutate → save → return prefs
// __resetPlayPrefsForTest: localStorage.removeItem(PLAY_PREFS_KEY)
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**（仅用户要求时）

---

### Task 2: prefs-meta + sheet UI + CSS + entry button

**Files:**
- Create: `src/play/prefs-meta.ts`
- Create: `src/play/prefs-sheet.ts`
- Create: `src/play/gate.ts`
- Create: `src/ui/play-prefs-entry.ts`
- Create: `src/styles/play-prefs.css`

**Interfaces:**
- Consumes: Task 1 APIs
- Produces:
  - `PLAY_LINES_META: { id, label, blocks: { id, label }[], howto: string[] }[]`
  - `openPlayPrefsSheet(personId: string, opts?: { focusLine?: PlayLineId; onChange?: () => void }): void`
  - `playClosedPlaceholderHtml(title: string, lineId: PlayLineId): string`
  - `attachPlayPrefsButton(actions: HTMLElement, personId: string, onChange?: () => void): void`

- [ ] **Step 1: Implement `prefs-meta.ts`**

每条线含 `howto: string[]`，例如 shuttle/sim 互动：

```ts
howto: [
  '总览 · 拖「能量天平」杠杆',
  '运势 · 点【如果】模拟',
  '猜命盘 · 答一题',
  '命盘 · 拖「时光机」',
]
```

learn howto：

```ts
[
  '解读页 · 点【为什么这么解？】',
  '展开后 · 点【收入知识库】',
]
```

rpg howto：

```ts
[
  '造命 · 打开星盘 XP 与问答',
  '紫微运限 · 接日常/周常并打卡',
]
```

块与线绑定按 spec：`learn→knowledgeChip,tree`；`sim→ifBlock`；`guess→guessEntry`；`weekly→weather`；`shuttle→timeMachine,spiritRadar,yearBuff,comboAch,awakenTip`；`rpg→xpCard,craftQuests,ziweiDaily`。

- [ ] **Step 2: Implement sheet**

`openPlayPrefsSheet`：

1. `document.querySelector('.play-prefs-sheet')?.remove()`
2. 渲染 `div.play-prefs-sheet.is-open` + backdrop + card
3. 每条线：标题 + `<input type="checkbox" data-line>`；其下块 checkbox `data-line` + `data-block`；howto 用 `<ul class="play-prefs-howto">`
4. 线关时块 checkbox `disabled`
5. change → `setLineEnabled` / `setBlockShown` → `opts.onChange?.()`
6. 关闭按钮 `data-close`

样式：`position:fixed; inset:0; z-index:650;` 卡片底部；金墨边框；howto `list-style` + 每行短。

- [ ] **Step 3: `gate.ts` + entry**

```ts
export function playClosedPlaceholderHtml(title: string, lineId: PlayLineId): string {
  return `<button type="button" class="play-closed-ph" data-play-prefs-open data-focus-line="${lineId}">
    <strong>${title}</strong><span>已关闭 · 去设置开启</span>
  </button>`;
}
```

`attachPlayPrefsButton`：在 `actions` 内 prepend  
`<button type="button" class="play-prefs-entry" data-play-prefs-open aria-label="玩法设置">⚙</button>`  
（或文案「玩法」；避免与人切换抢宽度）  
click → `openPlayPrefsSheet(personId, { onChange })`。

- [ ] **Step 4: 手动烟测** — 在任意页临时调用 sheet，勾选持久化（可写极简 HTML 注释测试；正式挂靠 Task 3）

- [ ] **Step 5: Commit**（仅用户要求时）

---

### Task 3: 造命页接线

**Files:**
- Modify: `src/pages/craft-home.ts`
- Modify: `src/main.ts`（craftStyles 增加 `play-prefs.css`）
- Modify: `src/ui/module-person-chrome.ts`（可选：暴露 actions 回调；或 craft 在 `attachPersonSwitcherToPage` 后 `querySelector('[data-module-actions]')` 再 `attachPlayPrefsButton`）

**Interfaces:**
- Consumes: `isBlockShown`, `isLineEnabled`, `attachPlayPrefsButton`, `playClosedPlaceholderHtml`, `openPlayPrefsSheet`

- [ ] **Step 1: 加载 CSS**

`craftStyles` 增加：`() => import('./styles/play-prefs.css')`

- [ ] **Step 2: 入口**

`attachPersonSwitcherToPage(page)` 之后：

```ts
const actions = page.querySelector<HTMLElement>('[data-module-actions]');
if (actions) {
  attachPlayPrefsButton(actions, person.id, () => paint());
}
page.querySelectorAll('[data-play-prefs-open]').forEach((el) => {
  el.addEventListener('click', () => {
    const line = (el as HTMLElement).dataset.focusLine as PlayLineId | undefined;
    openPlayPrefsSheet(person.id, { focusLine: line, onChange: () => paint() });
  });
});
```

- [ ] **Step 3: 按块切 spirit / xp / quests**

在 `paint` 拼 HTML 时：

- `spiritRadar` / `yearBuff` / `comboAch` / `awakenTip`：各自 `isBlockShown(person.id, 'shuttle', …)`；否则对应占位（`spiritRootCardHtml` 可整卡占位，或拆开——P0 允许：shuttle 线下整段 spiritHtml 用占位；线开再按块裁剪。推荐：**线关 → 一整段「盘面穿梭玩法已关闭」；线开 → 现有 card，内部块用 CSS/条件藏**。）
- 最小可用：  
  - `!isLineEnabled(..., 'shuttle')` → spirit 区占位  
  - else 渲染 `spiritRootCardHtml`（P0 暂不拆 yearBuff/combo 子块也行；若易拆则拆）  
  - `xpCard`：`rpg`+`xpCard`  
  - `craftQuests`：`rpg`+`craftQuests`

- [ ] **Step 4: 浏览器**：默认进造命见占位；开 rpg+块后 XP/问答出现；开 shuttle 后灵根出现

- [ ] **Step 5: Commit**（仅用户要求时）

---

### Task 4: 紫微运限任务门闩

**Files:**
- Modify: `src/pages/ziwei-reading.ts`
- Modify: `src/ui/quest-banner-checkin.ts`
- Modify: `src/main.ts`（ziwei styles 含 `play-prefs.css` 若尚未）
- Modify: 结算写入路径（`daily-quest-store` settle 或 checkin handler）— 在 **写入属性/XP 前** `if (!isLineEnabled(userId, 'rpg')) return`

**Interfaces:**
- Consumes: `isLineEnabled(personId, 'rpg')`, `isBlockShown(..., 'ziweiDaily')`, `attachPlayPrefsButton`

- [ ] **Step 1: mount 前检查**

`ziwei-reading.ts` 里调用 `mountQuestBannerAndCheckIn` 之前：

```ts
const person = getActivePerson();
if (!isLineEnabled(person.id, 'rpg') || !isBlockShown(person.id, 'rpg', 'ziweiDaily')) {
  // 不 mount；可选插占位到 #ziwei-quest-banner-host
} else {
  unmountWeekQuest = mountQuestBannerAndCheckIn({...});
}
```

线关：占位「造命 RPG 已关闭 · 去设置开启」。  
线开块关：不挂条（深链结算仍按 spec：线关才禁结算）。

- [ ] **Step 2: 结算 early-return**

在 `quest-banner-checkin.ts`（或实际 `settle` 函数）开头：

```ts
if (!isLineEnabled(userId, 'rpg')) return;
```

- [ ] **Step 3: 右上角挂玩法按钮**（与 person switcher 同 actions）

- [ ] **Step 4: 手测** — rpg 关无任务条；打开后恢复；打卡在关线时不涨分

- [ ] **Step 5: Commit**（仅用户要求时）

---

### Task 5: 八字学习线门闩 + 知识点芯片 + howto 分行

**Files:**
- Modify: `src/bazi/learn-store.ts` — `collectKnowledge` / `markLearnInteraction` / `markGuessAnswer` 等写入口
- Modify: `src/bazi/learn-tree.ts` — howto 改数组或 HTML 列表字段
- Modify: `src/pages/bazi-reading.ts` — 知识点芯片、能量天平/如果/时光机显隐、设置入口
- Modify: `src/pages/bazi-guess.ts` / `bazi-week.ts` / `bazi-learn.ts` — 线关占位
- Modify: `src/ui/bazi-if-sim.ts` / `bazi-time-shuttle.ts` 调用处 — 按块显示
- Modify: bazi 路由 styles 加载 `play-prefs.css`
- Modify: `src/bazi/learn.test.ts` — 门闩测（mock prefs 或直接 setLine）

**门闩映射：**

| 写入 API | 需要线 |
|----------|--------|
| `collectKnowledge` | `learn` |
| `markLearnInteraction`（能量天平 / 如果 / 时光机） | 对应 `shuttle`/`sim` 或统一：互动 id 映射；P0 简化：`energy_balance`→shuttle，`if_sim`→sim，`time_shuttle`→shuttle |
| `markGuessAnswer` | `guess` |
| 周对账写入 | `weekly` |

- [ ] **Step 1: learn-store 门闩**

```ts
export function collectKnowledge(id: string, personId = getActivePerson().id): ... {
  if (!isLineEnabled(personId, 'learn')) return loadBaziLearn(); // 或 { ok:false, reason:'play_off' }
  ...
}
```

若现 API 无 personId，用 `getActivePerson().id`。

- [ ] **Step 2: learn-tree howto**

把

`'任做一件即可：总览拖「能量天平」杠杆；运势 Tab 点【如果】模拟；猜命盘答一题；命盘页拖「时光机」。'`

改为结构化：

```ts
howtoLines: [
  '总览 · 拖「能量天平」杠杆',
  '运势 · 点【如果】模拟',
  '猜命盘 · 答一题',
  '命盘 · 拖「时光机」',
]
```

渲染处改 `<ul class="play-prefs-howto">` 或同等 class；同步改 `LearnTreeView` 类型与 `bazi-learn.ts` 展示。

- [ ] **Step 3: bazi-reading 芯片**

总览「知识点 N · …」改为 button.chip：

- `isBlockShown(..., 'learn', 'knowledgeChip')` → 可点进 `/bazi/learn` 或知识区  
- 否则占位打开设置 `focusLine: 'learn'`

能量天平 / 如果 / 时光机：各自 `isBlockShown`；关则占位。

- [ ] **Step 4: guess / week 页**

线关：整页 gate + 去设置；线开：正常。

- [ ] **Step 5: 单测** — `collectKnowledge` 在 learn 关时不增加 `knowledgeIds`

```ts
it('does not collect when learn line off', () => {
  __resetPlayPrefsForTest();
  __resetBaziLearnForTest();
  // person id: use whatever getActivePerson uses in test env — if needed inject personId param
  const before = loadBaziLearn().knowledgeIds.length;
  collectKnowledge('why:x');
  expect(loadBaziLearn().knowledgeIds.length).toBe(before);
});
```

若测试环境无 person，给 `collectKnowledge` 增加可选 `personId` 参数（默认 active）。

- [ ] **Step 6: Commit**（仅用户要求时）

---

### Task 6: backup + 回归

**Files:**
- Modify: `src/journal/backup.ts` — `BACKUP_KEYS` 增加 `'mystic-lab-play-prefs-v1'`；若有 switch 校验 JSON，加宽松 object 分支

- [ ] **Step 1: 加入 BACKUP_KEYS**

- [ ] **Step 2: Run** `npx vitest run src/play/prefs.test.ts src/bazi/learn.test.ts`

- [ ] **Step 3: 手测清单（对照 spec §10）**

1. 新角色全关：造命占位、运限无条、知识点芯片关  
2. 只开 rpg+块：造命 XP/问答 + 运限恢复  
3. 开 learn+knowledgeChip：芯片可用  
4. 换角色 prefs 隔离  
5. howto 窄屏多行无横溢  

- [ ] **Step 4: Commit**（仅用户要求时）

---

## Spec coverage check

| Spec 项 | Task |
|---------|------|
| prefs 默认全关 / 跟角色 | 1 |
| 两层开关 UI | 2 |
| 三入口同一面板 | 3–5 |
| 造命显隐 + 占位 | 3 |
| 关 RPG 运限一起停 | 4 |
| 八字各线门闩 + 芯片 | 5 |
| howto 分行 | 5 |
| backup | 6 |
| 弹层不依赖 ziwei.css | 2 (`play-prefs.css`) |
| P1 一键全开等 | 不做（YAGNI） |

## Placeholder scan

无 TBD；深链块关策略按 spec 推荐执行。

## Type consistency

`PlayLineId` / `PlayBlockId` / `PLAY_PREFS_KEY` 全计划统一；sheet 与 gate 共用 `data-focus-line`。
