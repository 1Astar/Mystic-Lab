# Mystic AI / 密钥安全说明

产品方用**自己的** DeepSeek / OpenAI Key 给用户免费解读；**密钥永不进浏览器包**。

## 铁律

| 可以 | 禁止 |
|------|------|
| `VITE_MYSTIC_AI_URL=/api/mystic`（仅路径） | `VITE_*_KEY` / `VITE_*_TOKEN` / `VITE_*_SECRET` |
| Cloudflare **Runtime · Encrypt**：`MYSTIC_UPSTREAM_KEY` | 把上游 Key 写进前端、README、聊天记录 |
| 本地 `.env.local`（已 gitignore）的 `MYSTIC_UPSTREAM_*` | 把 `.env.local` 提交进 git |

`VITE_` 前缀变量会被 Vite **打进前端 JS**，任何人打开开发者工具都能看见。

## 架构

```
用户浏览器（无 Key）
  → POST /api/mystic/chat/completions
  → Cloudflare Pages Function（持有 MYSTIC_UPSTREAM_KEY）
  → DeepSeek / OpenAI
```

反馈同步同理：

```
浏览器 → POST /api/star-pm/capture → Function（持有 STAR_PM_CAPTURE_SECRET）→ Star PM
```

## Cloudflare 配置

### Build（可进前端）

| 变量 | 值 |
|------|-----|
| `VITE_MYSTIC_AI_URL` | `/api/mystic` |

### Runtime · Encrypt（绝不可用 VITE_）

| 变量 | 说明 |
|------|------|
| `MYSTIC_UPSTREAM_URL` | 例 `https://api.deepseek.com/v1` |
| `MYSTIC_UPSTREAM_KEY` | 上游 API Key |
| `MYSTIC_UPSTREAM_MODEL` | 可选，默认 `deepseek-chat` |
| `STAR_PM_CAPTURE_SECRET` | Star PM 收件箱密钥 |
| `MYSTIC_ALLOWED_ORIGINS` | 可选，逗号分隔 Origin 白名单 |

改 Build 变量后必须 **重新 Deploy**。

## 本地 `.env.local` 示例

```bash
VITE_MYSTIC_AI_URL=/api/mystic

# 以下勿加 VITE_ 前缀
MYSTIC_UPSTREAM_URL=https://api.deepseek.com/v1
MYSTIC_UPSTREAM_KEY=你的Key
MYSTIC_UPSTREAM_MODEL=deepseek-chat

STAR_PM_CAPTURE_SECRET=你的StarPM收件密钥
```

## 结果分享存储

`/api/share` 需绑定 KV：`SHARE_KV`（或改用 D1）。本地 `npm run dev` 用内存，无需 KV。

**Vercel**：前端在 `*.vercel.app` 时自动把分享 API 指到 Cloudflare Pages（`mystic-lab.pages.dev/api/share`），复用已绑的 `SHARE_KV`。也可用 `VITE_SHARE_API_URL` / `SHARE_UPSTREAM_BASE` 覆盖。  
结果页点 **「链接」** 或分享弹层「只复制链接」会生成 `/s/{id}` 深链；**复制浏览器地址栏不会加次数**。朋友打开深链看一会儿后双方可加次数。

## 自检

```bash
# 应 200/上游 JSON；响应里不应出现你的 Key
curl -s https://你的域名/api/mystic/chat/completions \
  -H "Content-Type: application/json" \
  -H "Origin: https://你的域名" \
  -d '{"model":"mystic-default","messages":[{"role":"user","content":"ping"}]}'
```

若 503：检查 Runtime 是否配了 **Production** 的 `MYSTIC_UPSTREAM_*`。

## 用户自备 Key（BYOK）

仅存在用户本机 `localStorage`，由用户自己填写；与产品方托管 Key 无关。
