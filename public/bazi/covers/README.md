# 八字图鉴 · 记忆封面

- **App 只接 webp**：`/bazi/covers/{slug}.webp`
- 同目录 `{slug}.png` 仅作原图归档，不在代码里引用
- Prompt：`src/bazi/codex-cover-prompts.ts`
- 转换：`node scripts/convert-bazi-covers.mjs`（结束后会再跑神煞归一化）
- 精品神煞章面大小：`node scripts/normalize-shensha-badges.mjs`（只改 webp，png 源不动）
- 已出齐：十天干 + 十二地支 + 十神 + 十二星煞（44）
