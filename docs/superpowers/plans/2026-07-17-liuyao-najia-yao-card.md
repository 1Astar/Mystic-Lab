# 六爻纳甲装卦 + 实盘卡 Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** 深度签可改占卜时间，展示四柱 + 纳甲装卦表，点爻开实盘卡（v0.2.31）。

**Architecture:** `ganzhi.ts` 包 `lunar-javascript` 出四柱；`najia.ts` 自写纳甲/六亲/六神；`yao-card.ts` + `result-layers.ts` 接深度签 UI。

**Tech Stack:** TypeScript、Vite、vitest、已有 `lunar-javascript`

## Global Constraints

- 只改深度签与装卦相关文件；现状/核心签不动
- UTF-8；最小 diff；不塞神煞大全 / P3 星图
- 规格：`docs/superpowers/specs/2026-07-17-liuyao-najia-yao-card-design.md`

---

### Task 1: ganzhi（四柱）

**Files:** Create `src/liuyao/ganzhi.ts`, Test `src/liuyao/ganzhi.test.ts`, Modify `src/types/lunar-javascript.d.ts`

- [ ] `siZhuFromDate(date: Date): SiZhu` 用 `Solar.fromDate` → year/month/day/hour + dayStem + dayXunKong
- [ ] 单测：固定 Date 断言日柱非空、日干一字

### Task 2: najia（装卦）

**Files:** Create `src/liuyao/najia.ts`, `src/liuyao/najia.test.ts`; 必要时 `hexagrams.ts` export `palaceOf`

- [ ] 纳支表（离=卯丑亥，兑=巳卯丑…）
- [ ] `dressHexagram(cast, dayStem)` → rows + palace
- [ ] 单测：雷地豫 + 壬日 → 六神初爻玄武；震宫六亲合理

### Task 3: UI

**Files:** `yao-card.ts`, `result-layers.ts`, `liuyao.css`, optional journal `castAt`

- [ ] 深度签：datetime-local、四柱条、装卦表、点行开卡
- [ ] 改时间重渲深度面板

### Task 4: 验收

- [ ] `npx tsc --noEmit` + `npm test` 相关文件
- [ ] version 0.2.31 + CHANGELOG + PM 回写
