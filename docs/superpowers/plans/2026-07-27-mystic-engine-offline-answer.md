# Mystic Engine 离线答问 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 无 AI 时六爻「此刻解读」输出 OfflineAnswerPack（分答→证据→决策→破局动作），贴近金标 AI 完成度。

**Architecture:** 新建 `src/mystic-engine/` 组装管线；消费现有 `reading-facts` + Lab 档案；用意图库/动作库静态表生成文案；`question-briefing` 改为渲染 Pack。

**Tech Stack:** TypeScript、Vitest、现有六爻结果页 DOM 渲染

## Global Constraints

- 运行时不依赖 LLM；禁止绝对吉凶死刑判决
- Evidence 只引用 Facts 已有字段
- 缺档 / 关闭档案注入时静默降级
- 本轮只改六爻「此刻解读」UI；塔罗后置
- 规格：`docs/superpowers/specs/2026-07-27-mystic-engine-offline-answer-design.md`

---

### Task 1: 类型 + Intent Engine 骨架

**Files:**
- Create: `src/mystic-engine/types.ts`
- Create: `src/mystic-engine/intent.ts`
- Create: `src/mystic-engine/intent.test.ts`
- Create: `src/mystic-engine/index.ts`

**Interfaces:**
- Produces: `IntentId`, `IntentHit`, `detectIntents(question: string): IntentHit[]`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it } from 'vitest';
import { detectIntents } from './intent.ts';

describe('detectIntents', () => {
  it('splits salary + stay/leave from dual question', () => {
    const hits = detectIntents(
      '转正能不能拿到8k？我要不要留在冠英？8月初要不要离职？',
    );
    const ids = hits.map((h) => h.id);
    expect(ids).toContain('salary_negotiate');
    expect(ids.some((id) => id === 'quit_vs_stay' || id === 'quit_now')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/mystic-engine/intent.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement types + detectIntents**

`types.ts`：按规格写 `IntentId`、`IntentHit`、`EvidenceLine`、`SceneAction`、`AnswerBlock`、`OfflineAnswerPack`、`UserContext`、`RiskPreference`、`Tone`。

`intent.ts`：基于问题切分（可参考 `liuyao/direct-reading.ts` 的 `splitQuestionParts`）映射到 `IntentId`；未知 → `open_explore`；多意图去重。

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**（仅当用户要求时再 commit）

---

### Task 2: Context Engine

**Files:**
- Create: `src/mystic-engine/context.ts`
- Create: `src/mystic-engine/context.test.ts`
- Modify: `src/life/types.ts` — `PersonProfile` / `LifeProfileInput` 增加可选 `riskPreference?: RiskPreference`
- Modify: `src/life/storage.ts` — 读写兼容缺省

**Interfaces:**
- Consumes: `getLabProfileSnapshot`, `loadUseProfilePref`
- Produces: `resolveUserContext(opts?: { useProfile?: boolean }): UserContext | null`

- [ ] **Step 1: Failing test** — 有档案且 useProfile=true 时返回 occupation；关闭时返回 null

- [ ] **Step 2: Implement `resolveUserContext`；缺字段默认 `riskPreference: 'balanced'`

- [ ] **Step 3: Tests PASS**

---

### Task 3: Tone + Evidence Mapper（接 ReadingFacts）

**Files:**
- Create: `src/mystic-engine/tone.ts`
- Create: `src/mystic-engine/evidence.ts`
- Create: `src/mystic-engine/evidence.test.ts`

**Interfaces:**
- Consumes: `CastResult` / `ReadingFacts`（`buildReadingFacts`）
- Produces: `detectTone(cast): Tone`；`mapEvidence(facts, intent): EvidenceLine[]`

- [ ] **Step 1: Test** — 涣→巽类关键词得 `soft`/`flow`；证据含 `primary_changed` 或 `shi` 的 factKey 与人话

- [ ] **Step 2: Implement** — 气质规则可移植 `direct-reading` 的 SOFT/FLOW/HARD/OPEN/CUT；证据 2–4 条/意图

- [ ] **Step 3: PASS**

---

### Task 4: 场景动作库 + Action Generator

**Files:**
- Create: `src/mystic-engine/packs/career-actions.ts`
- Create: `src/mystic-engine/actions.ts`
- Create: `src/mystic-engine/actions.test.ts`

**Interfaces:**
- Produces: `pickActions(intent, tone, ctx): { breakthrough, checklist }`
- 插槽：`{occupation}` `{stage}` 替换；无则删掉占位或换通用词

- [ ] **Step 1: Test** — `salary_negotiate` × `soft` × cautious → breakthrough 含「谈/标准/核对」类具体动作，且不是「只选一个可验证动作」

- [ ] **Step 2: 写入职场首批动作表（salary / quit / probation / job_search）

- [ ] **Step 3: PASS**

---

### Task 5: buildOfflineAnswerPack + 金标验收测

**Files:**
- Create: `src/mystic-engine/build-pack.ts`
- Create: `src/mystic-engine/build-pack.test.ts`
- Create: `src/mystic-engine/lean.ts`（intent×tone lean 模板）

**Interfaces:**
- Produces: `buildOfflineAnswerPack(input: { question, cast, castAt?, useProfile? }): OfflineAnswerPack`

- [ ] **Step 1: 验收测**（规格 §8）

```ts
it('gold case: 8k + stay/leave yields multi-answer pack', () => {
  // 用固定掷爻或 learn-sample cast 构造「涣→巽」或任意稳定 cast
  const pack = buildOfflineAnswerPack({ question: '...', cast, useProfile: false });
  expect(pack.answers.length).toBeGreaterThanOrEqual(2);
  expect(pack.answers.every((a) => a.evidence.length >= 1)).toBe(true);
  expect(pack.breakthrough.body).not.toMatch(/只选一个可验证动作/);
  expect(pack.breakthrough.body.length).toBeGreaterThan(12);
});
```

- [ ] **Step 2: Implement assembler** — intents → lean + evidence + decision 收束 + actions

- [ ] **Step 3: PASS**

---

### Task 6: 六爻「此刻解读」UI 换 Pack

**Files:**
- Modify: `src/liuyao/question-briefing.ts` — `buildQuestionBriefing` / `renderQuestionBriefingHtml` 改为基于 Pack（或新 `renderAnswerPackHtml` 再委托）
- Modify: `src/liuyao/question-briefing` 相关测试
- Modify: `src/ui/liuyao/result-tabs.ts` — 若需传档案开关，接现有 profile pref

**Interfaces:**
- Consumes: `buildOfflineAnswerPack`
- UI 区块标题：`先答你的问题` / `决策参考` / `破局动作`

- [ ] **Step 1: 更新 briefing 测试** — HTML 含分答与 breakthrough，不再依赖旧「现状与转折点」

- [ ] **Step 2: 渲染 Pack；保留「打开解读笔记」「六步学习」按钮

- [ ] **Step 3: `npx vitest run src/liuyao/question-briefing` 与 `src/mystic-engine` PASS**

- [ ] **Step 4: 真机/本地走查金标问法一题**

---

### Task 7（可选同期）: riskPreference 档案字段 UI

**Files:**
- Modify: `src/pages/life-profile.ts` — 可选三选一：稳健 / 均衡 / 进取
- Modify: life 相关测试

仅当 Task 1–6 完成后做；不做不挡发版。

---

## Spec coverage

| 规格项 | Task |
|---|---|
| Intent / Pack 类型 | 1, 5 |
| UserContext | 2 |
| Evidence + Tone | 3 |
| 动作库 | 4 |
| 组装 + 验收 | 5 |
| 六爻 UI | 6 |
| riskPreference UI | 7 |
| 塔罗 | 后置（本 plan 不做） |
