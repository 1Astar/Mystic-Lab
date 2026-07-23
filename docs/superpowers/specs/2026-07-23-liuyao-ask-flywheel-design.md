# 六爻「边看边问」完整飞轮 — 设计规格

| 项 | 内容 |
|---|---|
| 项目 | Mystic Lab · 随心而行 |
| 日期 | 2026-07-23 |
| 状态 | 实现中 |
| 关联项目 ID | `proj-moonpie`（Star PM） |
| 关联 Idea | `idea-023bc9fa` |

## 变更记录

| 版本 | 日期 | 摘要 |
|---|---|---|
| v0.1 | 2026-07-23 | 初稿：独立 Tab + AI/规则答疑 + 本机 vault + Star PM 双写；常问回灌门槛 ask≥5 且有用≥3 |

---

## 1. 结论

- 解读笔记增加第 5 大 Tab：**边看边问**（从古籍注解区拆出）。
- 用户可点「常问」或自提问题；有 AI 配置则带本卦语境作答，否则规则兜底。
- 每条问答写入本机 vault，可选同步 Star PM Ideas。
- **常问回灌门槛（已确认）**：规范化后的相同问题 **`askCount ≥ 5` 且 `usefulVotes ≥ 3`** 才进入「常问」区。
- 内置种子 FAQ + 当前卦动态规则五问始终可展示（不占用回灌名额逻辑）。

实现顺序建议：Tab 壳 + 现有 FAQ 迁入 → 提问框 + 规则/AI 答 → vault + 有用投票 → 回灌门控 → Star PM 双写。

---

## 2. 背景与问题

「边看边问」现挂在古籍解析底部，与读原文抢注意力；只有规则生成的固定五问，用户无法自问，疑问也无法沉淀。需要独立入口 + 可学习的问答飞轮。

---

## 3. 目标与非目标

### 目标

1. 独立 Tab：常问列表 +「我还想问」。
2. AI（可选）结合本卦/变卦/动爻/用神/原问题短答；无 AI 时规则兜底并提示可配置。
3. 本机入库；配置 Star PM 后双写收件箱。
4. 按门槛回灌「常问」；「有用 / 不太懂」影响权重。

### 非目标（首版不做）

- 跨用户云端共用常问库
- 无审核自动写入产品源码 / 全网上墙
- 替代主解读结论
- 模型微调或独立后端服务

---

## 4. 信息架构

```
解读笔记大 Tab
├─ 卦象解析（意象/分域/落点/能量/六神 · 下划线小轨）
├─ 专业排盘
├─ 古籍解析（去掉底部边看边问）
├─ 边看边问 ★ 新
│   ├─ 常问（种子 + 动态规则 + 已回灌）
│   └─ 我还想问（输入 → 回答 → 有用/不太懂）
└─ 个人沉淀
```

---

## 5. 回答链路

```
用户提问
  → normalizeQuestion（去空白、统一标点、截断）
  → 查 vault 是否已有同卦同问规范化键
       ├─ 有：复用最佳答案，askCount++
       └─ 无：
            ├─ isAiConfigured → LLM（本卦语境 JSON 短答）
            └─ else → 规则兜底（模板 / 分域短断 / buildLearnFaq 近邻）
  → 展示答案 +「有用」「不太懂」
  → 持久化 vault；可选 POST Star PM
```

### LLM 约束（提示词要点）

- 角色：六爻教学助教，不是替用户断吉凶的绝对权威。
- 必须结合：本卦全名、变卦（若有）、动爻位、用神倾向、用户原占问题。
- 输出短答（约 80–180 字）+ 可选 1 条「下一步可自问」。
- 禁止恐吓、宿命论、医疗/法律替代建议。

### 无 AI 兜底

- 命中动态五问模板 → 直接答。
- 否则：卦名释义 + 用神一句 + 「配置 AI 后可获得更贴题讲解」。

---

## 6. 数据模型（本机）

存储键：`mystic-ly-ask-vault`（localStorage JSON 数组，上限例如 200 条，LRU/按时间裁剪）。

```ts
type AskVaultEntry = {
  id: string;
  /** 规范化问题键：trim + 小写标点统一 */
  qKey: string;
  q: string;
  a: string;
  hexName: string;       // 本卦名，如「夬」
  domain: string;        // career | love | general …
  source: 'seed' | 'rule' | 'ai' | 'promoted';
  askCount: number;
  usefulVotes: number;
  unclearVotes: number;
  createdAt: string;
  updatedAt: string;
  /** 关联当次占问问题（可选） */
  readingQuestion?: string;
};
```

### 「相同问题」定义

- `qKey = normalize(q)`：去首尾空白、合并连续空白、全角标点→半角、去句末「？/?」。
- 回灌与计数的匹配作用域：**同一 `hexName` + 同一 `qKey`**（不同卦的同文案问题分开计）。

---

## 7. 常问回灌门槛（已确认）

| 条件 | 阈值 |
|---|---|
| 同卦同问 `askCount` | **≥ 5** |
| 同卦同问 `usefulVotes` | **≥ 3** |
| 二者同时满足 | 才进入「常问 · 大家常问」区块 |

补充规则：

- `unclearVotes` 不阻止回灌，但若 `unclearVotes > usefulVotes`，常问卡上可标「仍有人觉得难懂」供后续改写（首版仅展示标记，不自动下架）。
- 种子 FAQ、动态规则五问：**不受此门槛**，始终可出现在常问区上半部。
- 回灌条目 `source` 标记为 `promoted`；用户再点开仍可投「有用」。
- 空问、过短（&lt; 4 字）、明显脏话/无关灌水：不入库、不计次。

---

## 8. Star PM 双写

对齐既有「问法反馈」模式：

- 触发：新问题首次入库，或达到回灌门槛时各同步一次（防刷：同 `qKey+hexName` 24h 内不重复 capture）。
- 标题：`[六爻边问] {hexName} · {q 截断}`
- `type`：内容想法；`relatedProjectId`：`proj-moonpie`；`relatedModule`：六爻
- 未配置 capture secret：仅本机，UI 轻提示「已保存在本机」。

---

## 9. UI 要点

- 大 Tab 文案：**边看边问**（与卦象解析等胶囊大 Tab 一致）。
- 常问：折叠 `<details>`，风格沿用现有 FAQ，不另造一套胶囊小 Tab。
- 提问区：输入框 + 发送；回答区下方「有用」「不太懂」ghost 按钮（一次有效，可改选）。
- 无 AI：发送旁/答后灰字提示配置入口（打开现有 AI 设置弹窗）。

---

## 10. 模块边界

| 单元 | 职责 |
|---|---|
| `liuyao/ask-vault.ts` | 读写 vault、normalize、计数、回灌筛选 |
| `liuyao/ask-answer.ts` | 规则兜底 + 调 LLM |
| `liuyao/ask-sync.ts` | Star PM capture |
| `liuyao/ask-panel.ts`（或挂 learn-course） | 渲染 Tab 内容与绑定 |
| `narrative-learn.ts` | `buildLearnFaq` 仍产出动态五问；`renderLearnFaqHtml` 改为可嵌入 panel |

---

## 11. 测试要点

- normalize 合并「同一问题？」变体。
- askCount / usefulVotes 累加；未达 5/3 不上常问。
- 达门槛后出现在 promoted 列表。
- 无 AI 时仍可答并入库。
- 古籍 Tab 不再含 `data-learn-faq` 整块（改由边看边问 Tab 承载）。

---

## 12. 已确认决策一览

| 项 | 选择 |
|---|---|
| 范围 | 完整飞轮（Tab + AI + 入库 + 回灌） |
| 架构 | 本机优先 + Star PM 可选双写 |
| 回灌门槛 | **同问 ≥5 次且「有用」≥3** |
| 匹配作用域 | 同本卦名 + 规范化问句 |
