# Mystic Lab · 随心而行

**答案不在牌里，在你心里。**

手势神秘学交互实验室 — MVP 聚焦手势塔罗。

## 模块

| 模块 | 路径 | 状态 |
|---|---|---|
| 随心抽牌 | `/tarot` | 可用 |
| 随心手札 | `/journal` | 可用 |
| 随心而学 | `/learn` | 即将开放 |
| 随心练习 | `/practice` | 即将开放 |
| 心意卡片 | `/share` | 抽牌后生成 |

## 塔罗仪式流程

1. 输入问题
2. 选择牌阵（单张 / 三张 / 情况·阻碍·建议）
3. 双手合十 → 洗牌 → 切牌 → 捏合抽牌 → 上翻 → 解读 → 确认
4. 生成学习卡片 + 心意分享图 + 自动存入手札

## 手势说明

| 阶段 | 手势 | 说明 |
|---|---|---|
| 净手 | 双手合十 | 进入仪式 |
| 洗牌 | 手掌收起轻晃 | 牌堆重组 |
| 切牌 | 左右挥手 | 切成两组 |
| 抽牌 | 拇指食指捏合 0.3s | 需手部稳定，防误触 |
| 翻牌 | 手掌上翻 | 翻开牌面 |
| 细读 | 向上/向下滑动 | 放大/缩小 |
| 确认 | 停留 1 秒 | 生成解释 |

微信内置浏览器对摄像头/手势支持有限，建议使用 Safari 或 Chrome 打开。不可用时可切换触控模式。

## 本地运行

电脑浏览器用 **HTTP**（避免自签证书导致白屏）：

```bash
npm install
npm run dev
```

打开终端里的 **`http://localhost:5173`**（`localhost` 下摄像头仍可用）。

手机同网段测摄像头时再用 HTTPS：

```bash
npm run dev:https
```

打开 `https://电脑IP:5173`，首次需「高级 → 继续访问」信任自签名证书。

上线部署到 Vercel 等会自带正式 HTTPS。


## 构建

```bash
npm run build
npm test
```

部署 `dist/` 至 HTTPS 静态托管。首次克隆后执行 `npm install`，`npm run dev` 会自动拉取 MediaPipe 资源。

## 版本与 Git

- 当前版本见 `package.json`，页面左下角显示 `Mystic Lab v0.x.x`
- 每次功能迭代：**改版本号 → 写 CHANGELOG → commit → push → 打 tag**

```bash
# 修订号（修 bug / 小 UI）
npm version patch   # 0.1.1 → 0.1.2

# 小版本（新模块）
npm version minor   # 0.1.x → 0.2.0

git push origin main --tags
git checkout develop && git merge main && git push origin develop
```

详见 [CHANGELOG.md](./CHANGELOG.md)

## 分支管理

| 分支 | 用途 |
|---|---|
| `main` | 稳定可演示版本，可部署 |
| `develop` | 日常开发，功能合并后再进 `main` |

推荐流程：`develop` 开发 → 自测通过 → 合并到 `main` → 打 tag → 部署。

远程仓库：[github.com/1Astar/Mystic-Lab](https://github.com/1Astar/Mystic-Lab)

## 技术栈

Vite · TypeScript · MediaPipe Gesture Recognizer · html-to-image

## 路线图

- **第一层（当前）**：手势塔罗 MVP
- **第二层**：小六壬掐指、梅花易数、牌阵教学
- **第三层**：中医、节气、五行等传统文化学院
