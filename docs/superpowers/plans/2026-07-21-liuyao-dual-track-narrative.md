# 六爻双轨文案引擎 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 速断短结论三 Tab + 学习完整因果链四页，共用 `ReadingFacts` 数据驱动叙事。

**Architecture:** `buildReadingFacts(cast, question)` 一次算出世应/动爻/取象/用神/生克；`narrative-quick` / `narrative-learn` 两套渲染；`result-tabs.ts` 按 `learn` 分流；变卦实战用 `bian-quiz.ts` 三选一。

**Tech Stack:** Vite + TypeScript + Vitest（现有 Mystic Lab）

**PM:** idea-3bfd93d7 · tasks P0 `task-17f92bbb` / P1 `task-af2828e5` / P2 `task-3a0c8a43` / P3 `task-610273cb` · 规格 `docs/superpowers/specs/2026-07-21-liuyao-dual-track-narrative-design.md`

## Global Constraints

- 任意卦数据驱动，禁止单卦写死主路径
- 速断禁止长「因为…所以…」链；学习必须含因果句
- 世应允许「世＝你」锚，必须再接爻位生活映射
- 主文案不用 LLM
- 不改起卦/纳甲算法本身

---

## File map

| File | Role |
|---|---|
| `src/liuyao/reading-facts.ts` | `ReadingFacts` + `buildReadingFacts` |
| `src/liuyao/reading-facts.test.ts` | 事实层测试 |
| `src/liuyao/narrative-learn.ts` | 学习：因果链、核心映射、FAQ 增量、古文三层文案 |
| `src/liuyao/narrative-quick.ts` | 速断：结论/分类/原文 + 表格式盘面 HTML |
| `src/liuyao/bian-quiz.ts` | 变卦三选一 |
| `src/liuyao/interpret.ts` | 学习「此刻解读」改消费 narrative-learn |
| `src/liuyao/result-layers.ts` | `renderCorePanel` / deep / FAQ 接 learn 文案 |
| `src/liuyao/compose-teach.ts` | 步骤标题指令化 + 本卦实战 + 挂 quiz |
| `src/ui/liuyao/result-tabs.ts` | learn=false → quick tabs；learn=true → 现四 Tab |
| `src/styles/liuyao.css` | 表盘、quiz、因果链样式 |
| `docs/superpowers/plans/2026-07-21-liuyao-dual-track-narrative.md` | 本计划 |

---

### Task 1: ReadingFacts

**Files:**
- Create: `src/liuyao/reading-facts.ts`
- Create: `src/liuyao/reading-facts.test.ts`

**Produces:** `buildReadingFacts(cast, question): ReadingFacts`

- [ ] 实现类型与 builder（复用 scene-map / wuxing / yong-shen / sheng-ke-graph）
- [ ] 测试：有问题域 → domain=career；有动爻 → changing.labels 非空；themeWord 非空
- [ ] Commit: `feat(liuyao): add ReadingFacts shared narrative layer`

### Task 2: 学习此刻解读 + 核心映射（P0）

**Files:**
- Create: `src/liuyao/narrative-learn.ts`
- Modify: `src/liuyao/interpret.ts`
- Modify: `src/liuyao/result-layers.ts` (`renderCorePanel`)
- Modify: `src/ui/liuyao/result-tabs.ts`（阅读 Tab 结构）
- Test: `src/liuyao/engine.test.ts` 或 `narrative-learn.test.ts`

- [ ] `buildCausalReading(facts)` → anchor / because / so / 供行动挂载
- [ ] `renderCoreMappedHtml(facts)` → 世应定义锚 + 爻位映射 + 用神
- [ ] 学习 Tab「此刻解读」改为锚点→推导→结论→行动
- [ ] Commit: `feat(liuyao): learn-mode causal chain and core life mapping`

### Task 3: 速断三 Tab + 表盘（P1）

**Files:**
- Create: `src/liuyao/narrative-quick.ts`
- Modify: `src/ui/liuyao/result-tabs.ts`
- Modify: `src/styles/liuyao.css`
- Optional: 轻量装卦六亲列（无日干时用近似或空六亲列仅世应动）

- [ ] `renderQuickBoard(cast)` 本∥变表
- [ ] Tabs: 结论｜分类建议｜原文
- [ ] `learn===false` 时走 quick；hero 用表盘替代或并列 SVG
- [ ] Commit: `feat(liuyao): quick-mode result board and short-conclusion tabs`

### Task 4: 怎么读卦 + 变卦 quiz（P2）

**Files:**
- Create: `src/liuyao/bian-quiz.ts` + test
- Modify: `src/liuyao/compose-teach.ts`
- Modify: `src/ui/liuyao/result-tabs.ts`（bind quiz）

- [ ] 三选项生成；正确项=变卦读法；选后揭释义
- [ ] 步骤标题改口语指令；本卦实战直接展示
- [ ] Commit: `feat(liuyao): instructional guide steps with bian-gua quiz`

### Task 5: 深度教学骨架（P3）

**Files:**
- Modify: `src/liuyao/narrative-learn.ts` / `result-layers.ts` / `sheng-ke-graph.ts`
- Modify: classic folder 渲染增加现代场景层

- [ ] whyYuan / whyJi 旁注
- [ ] 古文：原文｜白话｜现代场景
- [ ] FAQ 增加本→变推理问
- [ ] Commit: `feat(liuyao): deep panel teaching skeleton`

### Task 6: PM / CHANGELOG / 版本

- [ ] CHANGELOG 条目；视情况 bump version
- [ ] PM：P0–P3 task 状态；idea 进度；nextAction
- [ ] Commit + push（若用户要求 push）

---

## Spec coverage

| Spec | Task |
|---|---|
| ReadingFacts | 1 |
| 学习因果链 / 核心映射 | 2 |
| 速断三 Tab + 表盘 | 3 |
| 指令步骤 + 变卦选择题 | 4 |
| 生克 why / 古文三层 / FAQ | 5 |
| 双轨分流 | 2–3 |
