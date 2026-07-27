# 六爻边看边问飞轮 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 解读笔记新增「边看边问」Tab；支持常问 + 自问；AI/规则答疑；本机 vault；同问≥5 且有用≥3 回灌常问；可选 Star PM 双写。

**Architecture:** 本机 `ask-vault` 为真相源；`ask-answer` 负责规则/LLM；`ask-panel` 挂笔记第 5 Tab；达门槛条目 `source=promoted` 进入常问区。古籍 Tab 移除原 FAQ 块。

**Tech Stack:** TypeScript、Vitest、现有 `isAiConfigured` / `loadAiSettings` / Star PM capture 模式（对齐 `question-feedback-sync`）。

**Spec:** `docs/superpowers/specs/2026-07-23-liuyao-ask-flywheel-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `src/liuyao/ask-vault.ts` | normalize、CRUD、计数、回灌筛选 |
| `src/liuyao/ask-vault.test.ts` | 门槛与 normalize |
| `src/liuyao/ask-answer.ts` | 规则兜底 + LLM 短答 |
| `src/liuyao/ask-answer.test.ts` | 规则路径 |
| `src/liuyao/ask-sync.ts` | Star PM capture（可选） |
| `src/liuyao/ask-panel.ts` | 渲染 + 绑定 |
| `src/liuyao/learn-course.ts` | 第 5 Tab；古籍去 FAQ |
| `src/liuyao/deep-course.ts` | 同步 |
| `src/styles/liuyao.css` | ask panel 样式 |

---

### Task 1: ask-vault

- [x] 写失败测试：normalize 合并变体；askCount/usefulVotes；≥5 且 ≥3 才 `listPromoted`
- [x] 实现 `ask-vault.ts`（localStorage 键 `mystic-ly-ask-vault`）
- [x] 测试通过

### Task 2: ask-answer（规则路径）

- [x] 写失败测试：无 AI 时返回可读短答且可入库
- [x] 实现规则兜底（复用 `buildLearnFaq` / reading facts）
- [x] 测试通过

### Task 3: ask-answer LLM + sync

- [x] 实现 LLM JSON 短答（有配置时）；失败回落规则
- [x] `ask-sync.ts` 对齐 question-feedback-sync 双写
- [x] 冒烟：未配置不抛错

### Task 4: ask-panel UI + 笔记 Tab

- [x] `renderAskPanelHtml` / `bindAskPanel`：常问 + 输入 + 有用/不太懂
- [x] learn-course / deep-course：`NoteDrawerTab` 增加 `ask`；古籍去掉 `renderLearnFaqHtml`
- [x] 测试更新：笔记含边看边问；古籍不再独占 FAQ

### Task 5: 回灌展示 + 样式 + 验收

- [x] 常问区：种子/动态五问 + promoted
- [x] CSS（贴合六爻金线风格，非第二套胶囊大 Tab）
- [x] `tsc` + 相关 vitest 全绿

---

## 验收清单

- [ ] 笔记有「边看边问」Tab；古籍无整块 FAQ
- [ ] 可自问；无 AI 也能答
- [ ] 有用累加；未达 5/3 不上常问；达门槛后出现
- [ ] 未配 Star PM 仅本机保存
