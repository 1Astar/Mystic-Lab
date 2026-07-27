# Mystic Engine · 离线答问（OfflineAnswerPack）— 设计规格

| 项 | 内容 |
|---|---|
| 项目 | Mystic Lab · 随心而行 |
| 日期 | 2026-07-27 |
| 状态 | 已拍板 · 新一期开工 |
| 范围 | 全站统一答问引擎；**本轮样板 = 六爻「此刻解读」**；塔罗等同 schema 后置 |
| Star PM | `proj-moonpie` · 新一期「Mystic Engine 离线答问」 |

## 变更记录

| 版本 | 日期 | 摘要 |
|---|---|---|
| v0.1 | 2026-07-27 | 脑暴定稿：方案 A + UserContext + 意图库/场景动作库 |

---

## 1. 结论

离线解读要**尽量贴近接了 AI 的完成度**。缺口不在「有没有框架」，而在**答法**：先答子问、证据绑盘面、破局动作场景化。

落地为 **Mystic Engine**（运行时不依赖 LLM）：

```
用户问题
    ↓
Intent Engine
    ↓
Context Engine          → UserContext（可缺省）
    ↓
Divination Facts        → 六爻 ReadingFacts / 日后塔罗·八字
    ↓
Evidence Mapper
    ↓
Action Generator        → 意图库 × tone × 风险偏好
    ↓
OfflineAnswerPack
    ↓
UI
```

内容靠**意图库 + 场景动作库**（可离线批产、人工抽检入库）；有运行时 AI 时共用同一 Pack / UI 壳，失败回落离线。

---

## 2. 背景与问题

对照用户提供的金标 AI 解读 vs 产品输出：

| 产品常见输出 | 金标 AI |
|---|---|
| 能量叙事三段（现状/方向/清单）或偏模板直译 | **先直接答子问题** |
| 事实在，未写成「证据→结论」 | 本/变、世应、六神等当**论据** |
| 「只选一个可验证动作」偏空 | 落到具体场景（约谈转正标准等） |

代码已有雏形：`direct-reading.ts`（拆题分答）、`question-coach.ts`（pattern）、`profile-context.ts`（档案进解读）。本轮是把它们收成统一引擎 + 两库，而不是再堆通用卦义。

产品原则不变：**不做死刑判决 / 绝对吉凶**；倾向写成「有希望但需谈 / 不宜冲动断裂」等有条件表述。

---

## 3. 目标与非目标

### 目标

1. 无 AI 时，高频问法输出与好 AI **同构**：分答 → 证据 → 决策 → 破局动作。
2. 全站统一 `OfflineAnswerPack` schema；六爻先接，塔罗后接。
3. 意图库 + 场景动作库可扩展；缺意图时 `open_explore` 兜底，不空屏。
4. UserContext 接现有 Lab 档案；缺档静默降级。
5. 开/关 AI 版式一致，只变细腻度。

### 非目标

- 运行时必接 LLM
- 云端用户画像同步
- 本轮一次做齐塔罗 / 八字 / 小六壬 UI
- 未进 Facts 的断法（如月破/暗动）硬编进证据
- 替代六步学习 / 笔记抽屉

---

## 4. 数据模型

### 4.1 OfflineAnswerPack

```ts
type EvidenceLine = {
  factKey: string;   // 可回溯到 Divination Facts
  plain: string;     // 人话
};

type SceneAction = {
  id: string;
  title: string;     // 短标签，如「约谈转正标准」
  body: string;      // 可含 {occupation} {stage} 等插槽
};

type AnswerBlock = {
  intentId: string;
  questionSlice: string;
  lean: string;
  evidence: EvidenceLine[];
};

type OfflineAnswerPack = {
  intents: IntentHit[];
  answers: AnswerBlock[];
  decision: string;
  breakthrough: SceneAction;
  checklist: SceneAction[];  // ≤3
  boardExpand?: string;      // 盘面/能量辅层，UI 可折
  contextUsed: boolean;      // 是否注入了档案
};
```

### 4.2 IntentHit

```ts
type IntentId =
  | 'salary_negotiate'
  | 'probation_convert'
  | 'quit_now'
  | 'quit_vs_stay'
  | 'job_search_window'
  | 'offer_decide'
  | 'team_conflict'
  | 'love_likes'
  | 'love_stay_leave'
  | 'love_contact'
  | 'timing'
  | 'anxiety_decide'
  | 'open_explore';

type IntentHit = {
  id: IntentId;
  slice: string;
  confidence: 'high' | 'mid';
  domain: 'career' | 'love' | 'life' | 'general';
};
```

首批可随库扩展；识别层升级现有 `splitQuestionParts` / 塔罗 `QuestionPattern`，统一映射到 `IntentId`。

### 4.3 UserContext

```ts
type RiskPreference = 'cautious' | 'balanced' | 'bold';

type UserContext = {
  age?: string;
  occupation?: string;
  currentStage?: string;       // portrait.stageTitle / lifeTags / confusion
  riskPreference: RiskPreference; // 默认 balanced；档案可增字段
  previousReadings?: Array<{     // 手札近 N 条同主题摘要
    intentHint?: string;
    leanHint?: string;
    at: string;
  }>;
  preferences?: {
    favorActions?: boolean;
    favorEvidence?: boolean;
  };
};
```

对齐现有：`LifeProfileInput`、`LifePortrait`、`getLabProfileSnapshot`、`loadUseProfilePref`。  
新增：`riskPreference`（可选，默认 balanced）。缺档或用户关闭「带入档案」→ Context 空，不挡解读。

### 4.4 Tone（卦象气质）

由 Divination Facts / 关键词规则得到，供动作库索引：

`soft`（柔渗/反复）| `cut`（决断）| `hard`（受阻）| `open`（开窗）| `flow`（流动）| `neutral`

---

## 5. 引擎模块职责

| 模块 | 职责 | 本轮落点（建议路径） |
|---|---|---|
| Intent Engine | 拆题 → IntentHit[] | `src/mystic-engine/intent.ts`（六爻可先从 `direct-reading.splitQuestionParts` 迁出映射） |
| Context Engine | 档案 → UserContext | `src/mystic-engine/context.ts`（包 `profile-context`） |
| Divination Facts | 体系事实层 | 六爻继续 `reading-facts.ts`；引擎只消费接口 |
| Evidence Mapper | fact → 贴意图人话 | `src/mystic-engine/evidence.ts` |
| Action Generator | 查表 intent×tone×risk | `src/mystic-engine/actions.ts` + `packs/*.ts` |
| buildOfflineAnswerPack | 组装 | `src/mystic-engine/build-pack.ts` |

**Context 注入规则（非玄学）**

- 谈薪 + 有 occupation → 动作插槽带岗位语境
- `riskPreference=cautious` → 破局偏核对/期限/留后路；`bold` → 可偏本周约谈
- `previousReadings` 同意图反复 → 加一句收束提醒

**Evidence 规则**

- 只引用 Facts 已有字段；一条证据必须能指回盘面
- Facts 无月破/暗动则禁止写出

---

## 6. UI 规格（六爻「此刻解读」）

| 区块 | 内容 |
|---|---|
| 顶栏 | 问题锚点 + 本题焦点；有档案且开启时一行「档案 · …」 |
| 先答你的问题 | 每意图：子问 → lean → evidence |
| 决策参考 | 综合一段 |
| 破局动作 | breakthrough + checklist≤3 |
| 折叠 | boardExpand / 古籍旁注 |

速断：可只露判词一句（取首 lean 或 decision 压缩）+ breakthrough。  
替换/升级现有 `question-briefing` 渲染为 Pack 驱动；保留笔记/六步入口。

---

## 7. 内容批产

1. 金标样例定语气（用户提供的两份 AI 解读）
2. 批产 `intent × tone × risk` → lean 模板、证据句式、动作句
3. 抽检：禁绝对吉凶、禁捏造 Facts、动作可执行
4. 入库静态 TS/JSON，随版本记录
5. 未知意图 → `open_explore`

---

## 8. 验收

同一问「转正能不能拿到 8k？要不要留 / 8 月初离职？」在**无 AI**时必须：

1. 至少两个 AnswerBlock（薪资谈 / 去留）
2. 证据出现本→变或世应等可回溯 factKey
3. breakthrough 为具体可执行动作（非「只选一个可验证动作」空话）
4. 有档案且开启时，动作或决策中出现职业/阶段插槽痕迹（或明确未开启）

对照金标：结构同构即可，不要求字字相同。

---

## 9. 功能板块（Star PM）

- `Lab·解读·Mystic Engine`
- `Lab·解读·意图库`
- `Lab·解读·场景动作库`
- `Lab·解读·用户上下文`
- `六爻·结果·离线答问`（样板）

---

## 10. 实现顺序（摘要）

1. `mystic-engine` 类型 + Intent/Context + 空 Pack 组装（测驱动）
2. 意图库首批 + Evidence（接 ReadingFacts）
3. 场景动作库首批（职场高频）
4. 六爻 `question-briefing` / 此刻解读 UI 换 Pack
5. `riskPreference` 档案字段（可选 UI）
6. 塔罗对齐 schema（后置期）
