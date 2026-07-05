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

# 5000 道 catalog（先 npm run dev:catalog，再 npm run dev:weapp）
TARO_APP_CATALOG_BASE_URL=http://127.0.0.1:8790

# 上线 Vercel 后改为：
# TARO_APP_LLM_PROXY_URL=https://你的项目.vercel.app/api/llm-proxy
# TARO_APP_CATALOG_BASE_URL=https://你的项目.vercel.app/catalog
`

fs.writeFileSync(envPath, template, 'utf8')
console.log('已创建 .env.local')
console.log('本地联调：')
console.log('  终端1: npm run dev:catalog   # 5000 道 catalog')
console.log('  终端2: npm run dev:llm-proxy  # AI（需填 MINIMAX_API_KEY）')
console.log('  终端3: npm run dev:weapp      # 小程序编译')
