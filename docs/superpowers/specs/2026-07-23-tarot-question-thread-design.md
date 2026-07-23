# 塔罗「此刻解读」指哪打哪设计

**日期：** 2026-07-23  
**状态：** 已落地（规则 + LLM Prompt + UI）

## 问题

1. 职场多子问被恋爱/原生家庭套话污染  
2. 按牌百科展开，用户抓不住「该怎么办」  
3. 多牌各自答全套子问 → 重复、机械

## 方案

- **主题强裁剪：** `detectQuestionTheme` 扩职场词；`sanitizeTopicText` 删恋爱句  
- **位次对齐 + 后段合成：** 路径问绑单牌；风险/建议绑多牌  
- **整盘一次 LLM（多牌）：** `fetchSpreadThreadReading`，不再每张牌各答一遍  
- **职场金标准（A+B）：** `work-thread-gold.ts` 写入 Prompt；路径 insight 须分前段/中后段，允许 6–12 句；`max_tokens` 整盘约 4200；内置 mock 同步加长  
- **UI：** 「此刻解读」= `questionThread` 卡片串；热点可选展开；图鉴后置  
- **去重：** 有逐条问答时隐藏「答案倾向」与长补充拆解

## 关键文件

- `src/interpretation/question-thread.ts`
- `src/interpretation/work-thread-gold.ts`
- `src/interpretation/topic-sanitize.ts`
- `src/ui/question-thread-panel.ts`
- `src/ai/llm-client.ts` / `src/interpretation/llm-provider.ts`
- `src/pages/tarot.ts` / `src/ui/card-result-tabs.ts`
