# Mystic AI 托管代理（免费给用户用）

产品方用**自己的** DeepSeek / OpenAI Key 给普通用户免费深度解读；Key 不进浏览器。

## 架构

```
用户浏览器
  → POST /api/mystic/chat/completions
  → Cloudflare Pages Function（持有 MYSTIC_UPSTREAM_KEY）
  → DeepSeek / OpenAI 兼容上游
```

前端只需构建变量：

```bash
VITE_MYSTIC_AI_URL=/api/mystic
```

（不要把上游 Key 写成 `VITE_*`，否则会打进前端包。）

## Cloudflare Pages 配置

1. 确认仓库用 **Cloudflare Pages** 部署（站点如 `mystic-lab.pages.dev`）。
2. **Settings → Environment variables**

| 变量 | 环境 | 说明 |
|------|------|------|
| `VITE_MYSTIC_AI_URL` | Build | 填 `/api/mystic` |
| `MYSTIC_UPSTREAM_URL` | Production（Runtime） | 例 `https://api.deepseek.com/v1` |
| `MYSTIC_UPSTREAM_KEY` | Production · **Encrypt** | 你的 API Key |
| `MYSTIC_UPSTREAM_MODEL` | Production | 例 `deepseek-chat`（可选） |
| `MYSTIC_PROXY_SECRET` | Production · 可选 | 若填写，前端还需 `VITE_MYSTIC_AI_TOKEN=同值` |

3. 重新 **Deploy**（改 Build 变量后必须重构建）。
4. 打开站点 → AI 配置 → 选 **使用 Mystic AI**，应不再显示「即将开放」。

### DeepSeek 示例

- `MYSTIC_UPSTREAM_URL` = `https://api.deepseek.com/v1`
- `MYSTIC_UPSTREAM_MODEL` = `deepseek-chat`
- `MYSTIC_UPSTREAM_KEY` = 控制台里的 Key

### OpenAI 示例

- `MYSTIC_UPSTREAM_URL` = `https://api.openai.com/v1`
- `MYSTIC_UPSTREAM_MODEL` = `gpt-4o-mini`
- `MYSTIC_UPSTREAM_KEY` = `sk-...`

## 本地开发

在项目根 `.env.local`（已 gitignore）写：

```bash
VITE_MYSTIC_AI_URL=/api/mystic
MYSTIC_UPSTREAM_URL=https://api.deepseek.com/v1
MYSTIC_UPSTREAM_KEY=sk-你的本地调试Key
MYSTIC_UPSTREAM_MODEL=deepseek-chat
```

然后 `npm run dev`。Vite 会把 `/api/mystic/chat/completions` 转到上游（与线上 Function 同语义）。

## 安全注意

- 当前代理是**最小可用**：同源即可调用，适合内测 / 小流量。
- 正式放量前建议：服务端额度、IP/设备限流、登录态，`MYSTIC_PROXY_SECRET` 只是弱门槛。
- 免费次数前端本地计数可清；长期要服务端记账。

## 自检

```bash
# 部署后
curl -s https://你的域名/api/mystic/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"mystic-default","messages":[{"role":"user","content":"ping"}]}'
```

应返回上游 JSON；若 503，检查 Runtime 变量是否配在 **Production**（不是只配了 Preview）。
