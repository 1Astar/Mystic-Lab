# 塔罗未完成续抽（Resume Partial）

日期：2026-07-23  
状态：已定稿（待实现）

## 目标

手札里标「未完成」的塔罗占问，可以从列表或详情一键回到抽牌流程，**跳过仪式/洗切**，保留已抽牌，接着抽完剩余张并完成占问。

## 非目标

- 六爻 / 小六壬半成品续做（本轮不做）
- 重走仪式动画（方案 B）或作废已抽牌（方案 C）
- 改动手札持久化 schema（复用现有 `partial` 字段）
- 旅程页单独深链（旅程打开详情后走同一详情入口即可）

## 已确认决策

| 项 | 选择 |
|----|------|
| 接续位置 | **A**：直达抽牌态 |
| 入口 | **手札列表 + 详情双入口** |
| 牌面 | 已抽牌按手札还原，视为已翻开 |
| journal | 沿用同一 `journalId`，完成后变 `complete` |

## 行为

1. 仅当 `status === 'partial'` 且已抽 ≥1 张时可续。
2. 入口文案：「继续完成」。
   - 手札列表：未完成条目的操作区按钮（阻止冒泡，避免误开详情）。
   - 手札详情：头部/底部主按钮。
3. 点击后：`sessionStorage` 写入 `resumeJournalId`（读后即清）→ `navigate('/tarot/reading')`。
4. 塔罗阅读页启动时若有 resume id：
   - 加载对应手札；校验失败则 toast/提示并正常新开。
   - 用现有 `reconstructDrawnCards` 还原 `drawnCards`。
   - `question` / `spreadType` / `currentJournalId` / `reading`（若有 snapshot）一并恢复。
   - `cardPool` = 已抽 + 同牌阵剩余张（`drawCards`/`drawSpread` 逻辑排除已用 id，按阵位补 `position`/`positionKey`）。
   - `currentIndex` = 已抽张数；`revealedFlags` 对已抽全为 true。
   - `setState('draw')`（或等价：已全部抽满但未 complete 则进入翻开/结果前的下一合法态）。
5. 之后走现有抽牌 / 解读 / `upsertJournalProgress` / `saveJournalEntry` 路径。

## 边界

- 牌 id / 牌名无法还原 → 不可续，提示「无法恢复此占问」。
- `custom` 牌阵且 session 自定义位丢失：用已存 `position` 文案兜底；剩余位按已抽长度对齐标准位或「补牌」。
- 已抽张数 ≥ 牌阵应抽张数但仍为 partial：进入结果生成/结果态，而不是再抽。
- 浏览器无 sessionStorage：降级为带 query `?resume=<id>`（若实现成本低则一并做；否则仅 sessionStorage + 失败提示）。

## 实现要点（文件级）

- `src/journal/resume.ts`（新）：`canResumePartial`、`buildResumeSession`、`peek/consumeResumeJournalId`。
- 复用 `src/journal/replay.ts` 的 `reconstructDrawnCards`。
- `src/pages/tarot.ts`：启动 hydrate。
- `src/pages/journal.ts`、`src/ui/journal-detail.ts`：双入口按钮。
- 单测：resume 组 pool、排除已抽、满牌进结果。

## 验收

1. 抽到一半离开 → 手札显示未完成。
2. 列表或详情点「继续完成」→ 直达抽牌，已抽牌在且已翻开。
3. 抽完剩余 → 正常结果页 → 手札变为完成、未完成徽章消失。
4. 新开一局不受残留 resume 污染（读后即清）。
