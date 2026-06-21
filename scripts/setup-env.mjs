#!/usr/bin/env node
/**
 * 初始化 .env.local（若不存在）。
 * 用法：node scripts/setup-env.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const envPath = path.join(root, '.env.local')

if (fs.existsSync(envPath)) {
  console.log('.env.local 已存在，跳过')
  process.exit(0)
}

const template = `# 爱心厨房本地配置（勿提交 Git）

# MiniMax API Key — 仅用于本地 llm-proxy 服务端，不会打进小程序包
MINIMAX_API_KEY=

# 本地 LLM 中转地址（先 npm run dev:llm-proxy，再 npm run dev:weapp）
TARO_APP_LLM_PROXY_URL=http://127.0.0.1:8787

# 上线部署 Vercel 后改为：
# TARO_APP_LLM_PROXY_URL=https://你的项目.vercel.app/api/llm-proxy

# 5000 道 catalog 云端根目录（上传 catalog-cdn/ 后填写，指向 meta.json 所在目录）
# 留空则只用主包内置的 legacy 200 道
# TARO_APP_CATALOG_BASE_URL=https://你的cdn域名/love-kitchen/catalog
`

fs.writeFileSync(envPath, template, 'utf8')
console.log('已创建 .env.local，请填入 MINIMAX_API_KEY 后执行：')
console.log('  npm run dev:llm-proxy   # 终端 1')
console.log('  npm run dev:weapp       # 终端 2')
