# 安全与上线检查

## LLM API Key

- API Key **不再**出现在前端代码或构建产物中。
- 客户端仅通过 `TARO_APP_LLM_PROXY_URL` 调用服务端中转，所有 LLM 请求由服务端转发。
- 在 Vercel 等平台的环境变量中配置 `MINIMAX_API_KEY`，不要在前端 `.env.local` 中填写任何真实 Key。
- 如果需要轻量门禁，可在 Vercel 设置 `LLM_PROXY_SHARED_SECRET`，并在服务端中转逻辑中校验请求头。

## 微信小程序

- 使用服务端中转时，在[微信公众平台](https://mp.weixin.qq.com) → 开发 → 开发管理 → 服务器域名 → **request 合法域名** 中加入你的中转域名（如 `https://xxx.vercel.app`）。

## 模型返回数据

- 客户端对 LLM 返回的菜谱 JSON 使用 Zod 校验（`src/schemas/recipeLlm.ts`），校验失败会触发结果页的本地/缓存兜底，避免白屏。
