# 八字 · 出生密码双层（L1 我的命盘 + L2 命盘解析）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 八字默认先给「我的命盘」白话速读（规则模板），再进「命盘解析」保留出生密码五步 + 专业盘；融合不替代。

**Architecture:** `castBaziChart` 仍是唯一排盘源；新建 `portrait-template` 把日主/月令/十神映射成零术语文案；新路由 `/bazi/reading` 为 L1；`/bazi/chart` 加五步壳与专业行折叠为 L2；首页入口改道 L1。

**Tech Stack:** TypeScript、Vitest、现有 `lunar-javascript` 排盘、Vite 路由页

## Global Constraints

- 首版 **纯规则模板**，禁止 LLM 生成 L1/主题句
- L1 文案 **零术语**：禁止甲乙丙丁、十神名、藏干、十二长生、神煞名出现在用户可见字符串
- 专业盘网格 **只在 L2**；合盘/流年 Tab **不删**
- 出生密码五步 **完整保留在 L2**，不砍
- 大运、完整喜用神、AI 问答 → **本计划不做**
- Commit 仅当用户明确要求时执行
- Star PM：`idea-d8259eb2` · `proj-moonpie` · 板块 `八字·学习·出生密码`

---

## File map

| File | Responsibility |
|------|----------------|
| `src/bazi/portrait-types.ts` | L1/主题输出类型 |
| `src/bazi/portrait-copy.ts` | 句池（五行气质、旺衰修饰、五域句） |
| `src/bazi/portrait-template.ts` | `buildBaziPortrait(chart, opts)` |
| `src/bazi/portrait-template.test.ts` | 模板单测 |
| `src/bazi/ten-gods.ts` | 从 chart 收集干神袋 / 分类 |
| `src/pages/bazi-reading.ts` | L1「我的命盘」页 |
| `src/pages/bazi-home.ts` | 性别字段 + 入口改道 |
| `src/pages/bazi-chart.ts` | L2 五步壳 + 专业行折叠 |
| `src/main.ts` | 注册 `/bazi/reading` |
| `src/styles/bazi.css` | L1 五域卡 + L2 步进样式 |

---

### Task 1: 十神袋工具 + 画像类型

**Files:**
- Create: `src/bazi/ten-gods.ts`
- Create: `src/bazi/ten-gods.test.ts`
- Create: `src/bazi/portrait-types.ts`

**Interfaces:**
- Produces:
  - `type TenGodCategory = 'bi_jie' | 'shi_shang' | 'cai' | 'guan_sha' | 'yin'`
  - `categorizeTenGod(label: string): TenGodCategory | null`
  - `collectTenGodLabels(chart: BaziChart): string[]` — 年/月/时干神 + 日柱 hideGods（非空）
  - `countCategories(labels: string[]): Record<TenGodCategory, number>`
  - `type BaziPortrait = { keyword: string; personality: string; career: string; relationship: string; wealth: string; innerWork: string; themes: [string, string, string]; source: 'template'; generatedAt: string }`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it } from 'vitest';
import { categorizeTenGod, countCategories } from './ten-gods.ts';

describe('categorizeTenGod', () => {
  it('maps common labels', () => {
    expect(categorizeTenGod('正官')).toBe('guan_sha');
    expect(categorizeTenGod('七杀')).toBe('guan_sha');
    expect(categorizeTenGod('伤官')).toBe('shi_shang');
    expect(categorizeTenGod('正财')).toBe('cai');
    expect(categorizeTenGod('偏印')).toBe('yin');
    expect(categorizeTenGod('比肩')).toBe('bi_jie');
    expect(categorizeTenGod('日主')).toBe(null);
  });

  it('counts bag', () => {
    const c = countCategories(['正官', '伤官', '正财', '正官']);
    expect(c.guan_sha).toBe(2);
    expect(c.shi_shang).toBe(1);
    expect(c.cai).toBe(1);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npx vitest run src/bazi/ten-gods.test.ts`

- [ ] **Step 3: Implement**

`ten-gods.ts`：用 `includes`/`===` 表映射（正官七杀、正财偏财、正印偏印、食神伤官、比肩劫财）。  
`collectTenGodLabels`：遍历 `chart.pillars`，取非 empty 的 `stemGod`（跳过「日主」「—」）+ 日柱 `hideGods`。  
`portrait-types.ts`：导出 `BaziPortrait` 如上。

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**（仅用户要求时）

---

### Task 2: 规则模板 `buildBaziPortrait`

**Files:**
- Create: `src/bazi/portrait-copy.ts`
- Create: `src/bazi/portrait-template.ts`
- Create: `src/bazi/portrait-template.test.ts`

**Interfaces:**
- Consumes: `BaziChart`, `categorizeTenGod`, `collectTenGodLabels`, `countCategories`, `SeasonLabel`, `WuXing`
- Produces:
  ```ts
  buildBaziPortrait(
    chart: BaziChart,
    opts?: { gender?: '' | 'female' | 'male'; seed?: number }
  ): BaziPortrait
  ```

- [ ] **Step 1: Write failing test**（固定种子，断言无术语 + 结构完整）

```ts
import { describe, expect, it } from 'vitest';
import { castBaziChart } from './cast.ts';
import { buildBaziPortrait } from './portrait-template.ts';
import { EMPTY_PROFILE } from '../life/types.ts';

const FORBIDDEN = /[甲乙丙丁戊己庚辛壬癸]|[子丑寅卯辰巳午未申酉戌亥]|正官|七杀|正财|偏财|正印|偏印|食神|伤官|比肩|劫财|藏干|长生|帝旺|纳音/;

describe('buildBaziPortrait', () => {
  it('returns plain-language cards without jargon', () => {
    const chart = castBaziChart(
      {
        ...EMPTY_PROFILE,
        birthYear: '2005',
        birthMonth: '12',
        birthDay: '23',
        birthHour: '8:37',
        birthPlace: '北京',
      },
      2025,
      { includeLiunian: false },
    );
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const p = buildBaziPortrait(chart, { gender: 'female', seed: 1 });
    expect(p.keyword.length).toBeGreaterThan(4);
    expect(p.themes).toHaveLength(3);
    for (const text of [p.keyword, p.personality, p.career, p.relationship, p.wealth, p.innerWork, ...p.themes]) {
      expect(text).not.toMatch(FORBIDDEN);
    }
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/bazi/portrait-template.test.ts`

- [ ] **Step 3: Implement copy pools + template**

`portrait-copy.ts` 句池（示例，实现时可扩到每类 ≥3 条）：

```ts
export const WX_TRAIT: Record<WuXing, string[]> = {
  木: ['感受力强，重视意义与成长', '愿意为想法伸展空间', '对氛围与方向敏感'],
  火: ['表达欲清楚，容易点燃周围', '行动快，喜欢被看见', '热情来得快也要会收'],
  土: ['求稳与承载，信得过的人', '做事有分寸，怕空转', '信任建立后很持久'],
  金: ['边界清楚，讲究效率与标准', '决断干净，讨厌含糊', '对秩序与契约敏感'],
  水: ['思绪流动，适应变化', '直觉准，需要独处充电', '兴趣广，怕被框死'],
};

export const STRENGTH_MOD: Record<SeasonLabel, string> = {
  旺: '气场偏满，节奏容易自驱',
  相: '有助力，适合借势推进',
  休: '蓄力期，适合慢热深耕',
  囚: '外在压力感更强，需主动找出口',
  死: '本气偏弱，更怕硬扛，宜找补给',
};
```

`portrait-template.ts` 逻辑：

1. `wx = chart.dayMasterWx`；若空 → 通用兜底句  
2. `strength = chart.season.find(s => s.label === wx)?.strength ?? '休'`  
3. `keyword = WX_TRAIT[wx][seed%n] 的前半气质 + STRENGTH_MOD[strength]`（拼成一句，无术语）  
4. `personality` ← `WX_TRAIT` 另一句  
5. `counts = countCategories(collectTenGodLabels(chart))`；`monthGod = month pillar stemGod`  
6. `career`：优先月干神类别 → 官杀「更适应有结构的责任」/ 食伤「更被表达与创作吸引」/ 比劫「搭档与竞争并存」/ 印「先学再出手」/ 财「结果导向」  
7. `relationship`：日柱 hideGods 主导 + 官杀/印计数；性别仅微调称呼（「你」不变，可选「对方」措辞）  
8. `wealth`：`counts.cai` 与正/偏（若 labels 含偏财）→ 稳健积累 / 机会流动 / 技能变现  
9. `innerWork`：`strength` 为 休囚死 → 外求认同类；旺/相 → 自我节奏内耗类；若 `relations.length` 可加半句「人际结构里常有拉扯」  
10. `themes`：从性格/事业/课题各抽一句压成 3 条短主题（仍零术语）  
11. `source: 'template'`, `generatedAt: new Date().toISOString()`

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**（仅用户要求时）

---

### Task 3: L1 页面 `/bazi/reading`

**Files:**
- Create: `src/pages/bazi-reading.ts`
- Modify: `src/main.ts` — 注册路由
- Modify: `src/styles/bazi.css` — `.bazi-reading-*` 五域卡

**Interfaces:**
- Consumes: `castBaziChart`, `buildBaziPortrait`, `loadLifeStore`, `getPersonFromStore`, `hasBirthInfo`
- Route: `/bazi/reading` → `renderBaziReading`

- [ ] **Step 1: 无出生信息时 gate**（与 chart 页同款：回 `/bazi` 填写）

- [ ] **Step 2: 有盘时渲染**

结构：

```html
<header>我的命盘 · 快速认识自己</header>
<p class="bazi-reading-keyword">{keyword}</p>
<section class="bazi-reading-cards">
  <!-- 性格底色 / 事业倾向 / 关系模式 / 财富方式 / 内在课题 -->
</section>
<button data-path="/bazi/chart">想看为什么？进入命盘解析 ›</button>
<button data-path="/bazi">改出生信息</button>
```

- 从 active `PersonProfile.gender` 传入 `buildBaziPortrait`
- **禁止**渲染干支、十神、网格
- 复用 `life-page` / emblem `bazi` 样式习惯

- [ ] **Step 3: `main.ts`**

```ts
'/bazi/reading',
lazy(() => import('./pages/bazi-reading.ts'), 'renderBaziReading', baziStyles),
```

- [ ] **Step 4: 手测** `npm run dev` → 填出生 → `/bazi/reading` 见五域、无术语

- [ ] **Step 5: Commit**（仅用户要求时）

---

### Task 4: 首页门禁 + 入口改道

**Files:**
- Modify: `src/pages/bazi-home.ts`
- Modify: `src/pages/lab-ask-recommend.ts`（若八字推荐链到 chart，改为 reading）

**Interfaces:**
- 保存性别到 active person（`updatePerson` / 现有 storage API；若无则用 `updateBirthFields` 旁路扩展 — 优先查 `storage.ts` 已有 `updatePersonFields`；没有则加 `patchActivePerson({ gender })`）

- [ ] **Step 1: 出生表单加性别**（女 / 男 / 暂不选），写入 `PersonProfile.gender`

- [ ] **Step 2: 改入口列表**

| 入口 | path | 状态 |
|------|------|------|
| 我的命盘 | `/bazi/reading` | 需出生日期 |
| 命盘解析 | `/bazi/chart` | 需出生日期 |
| 日主与五行 | — | 可改为跳转 chart 并带 `?step=3`，或暂留 soon |
| 十神结构 | — | 同上 `?step=4` 或 soon |
| 八字手札 | soon | 不变 |

- [ ] **Step 3: 主 CTA**「认识我的出生密码 ›」→ `/bazi/reading`（原「去排盘」改文案或拆成两个按钮）

- [ ] **Step 4: 手测** 保存含性别 → reading → chart 往返

- [ ] **Step 5: Commit**（仅用户要求时）

---

### Task 5: L2 五步壳 + 专业行折叠

**Files:**
- Modify: `src/pages/bazi-chart.ts`
- Modify: `src/styles/bazi.css`
- Optional Create: `src/bazi/learn-steps.ts`（步进文案与 step id，便于测）

**Interfaces:**
- URL: `/bazi/chart` 可选 `?step=1..5`；默认 `2`（有盘时）或按进度
- 合盘 / 流年 UI **保留**，放在五步区下方或原 Tab 位

- [ ] **Step 1: 抽出 `renderGrid` 的「简 / 全」模式**

```ts
function renderGrid(chart: BaziChart, opts?: { ariaLabel?: string; compact?: boolean }): string
```

- `compact: true`：只渲染 干神（可改标「关系位」仍显示原神名 — **L2 允许术语**）、天干、地支  
- `compact: false`：现有全行  
- 默认 compact；按钮「展开专业盘」切换

- [ ] **Step 2: 五步进度条**

```
认识自己的出生密码
①出生时间 → ②四柱 → ③五行 → ④十神 → ⑤人生主题
为什么这个时间形成这个命盘？
```

各步内容：

| step | 内容 |
|------|------|
| 1 | `formatBirthBrief` + 真太阳时一句（`clockLabel` / `trueSolarLabel`） |
| 2 | compact 四柱网格 + 展开专业盘 |
| 3 | 现有 `seasonBlock` 的月令条 + 日主叙事一句（可用 portrait.keyword 的同源片段，或单独 `dayMasterWx + strength` 白话） |
| 4 | 各柱 stemGod 列表 + 每类一句白话（可复用 portrait career/relationship 句，并标注「学习名：正官」等） |
| 5 | `buildBaziPortrait(...).themes` 三条；点击可 `step=2|3|4` |

- [ ] **Step 3: 顶栏链回 L1**「← 我的命盘」→ `/bazi/reading`

- [ ] **Step 4: 手测** 步进、折叠、合盘/流年仍可用

- [ ] **Step 5: Commit**（仅用户要求时）

---

### Task 6: 回归与收口

**Files:**
- 现有 `src/bazi/cast.test.ts` 不得破坏
- 新测全绿

- [ ] **Step 1: Run** `npx vitest run src/bazi`
- [ ] **Step 2: Run** `npx tsc --noEmit`
- [ ] **Step 3: 冒烟清单**
  - [ ] L1 无术语
  - [ ] L2 五步齐全
  - [ ] 专业盘可展开
  - [ ] 合盘仍可用
  - [ ] 无出生信息双页 gate
- [ ] **Step 4: Star PM** `finish_change_session`（若已 start）+ `update_idea` 下一步改为「P1：大运/问答」；状态勿标 done 除非用户验收
- [ ] **Step 5: Commit / 发版** 仅用户要求时

---

## Spec coverage self-review

| 需求 | Task |
|------|------|
| L1 我的命盘（关键词+五域） | 2, 3 |
| 零术语 | 2 测试 FORBIDDEN + 3 UI |
| 规则模板非 AI | 2 |
| 输入含性别 | 4 |
| L2 五步 ①～⑤ | 5 |
| 专业盘保留可折 | 5 |
| 合盘/流年不替代 | 5 约束 |
| AI 问答 / 大运 | 明确不做 |

**Placeholder scan:** 无 TBD。  
**Type consistency:** `BaziPortrait` / `buildBaziPortrait` / `TenGodCategory` 全文统一。

---

## Out of scope（下一轮）

- AI「为什么我不喜欢稳定工作」问答
- 大运人生阶段
- 真格局 / 完整喜用神推演
- 八字手札
