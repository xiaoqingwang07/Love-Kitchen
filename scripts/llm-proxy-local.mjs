#!/usr/bin/env node
/**
 * 本地 LLM 中转（与 api/llm-proxy.js 同逻辑），供微信开发者工具联调。
 *
 * 1. 在项目根 .env.local 配置 MINIMAX_API_KEY=你的密钥
 * 2. npm run dev:llm-proxy
 * 3. .env.local 中 TARO_APP_LLM_PROXY_URL=http://127.0.0.1:8787
 * 4. npm run dev:weapp 重新编译
 */
import fs from 'fs'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const envPath = path.join(root, '.env.local')
const PORT = Number(process.env.LLM_PROXY_PORT || 8787)

function loadEnv() {
  const out = {}
  if (!fs.existsSync(envPath)) return out
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i <= 0) continue
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return out
}

const env = loadEnv()
const MINIMAX_KEY = process.env.MINIMAX_API_KEY || env.MINIMAX_API_KEY || env.TARO_APP_MINIMAX_API_KEY

if (!MINIMAX_KEY) {
  console.error('FAIL: 请在 .env.local 中配置 MINIMAX_API_KEY 或 TARO_APP_MINIMAX_API_KEY')
  process.exit(1)
}

const ALLOWED_MODELS = ['MiniMax-M2.7']
const MAX_TOKENS = 4000

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-LLM-Proxy-Secret')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }))
  }

  let body
  try {
    body = JSON.parse(await readBody(req))
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'Invalid JSON' }))
  }

  if (!ALLOWED_MODELS.includes(body.model)) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'invalid model' }))
  }

  const payload = {
    model: body.model,
    messages: body.messages,
    temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
    max_tokens: Math.min(Number(body.max_tokens) || 2800, MAX_TOKENS),
  }

  try {
    const upstream = await fetch('https://api.minimaxi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MINIMAX_KEY}`,
      },
      body: JSON.stringify(payload),
    })
    const text = await upstream.text()
    res.writeHead(upstream.status, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(text)
  } catch (e) {
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Upstream unavailable', detail: String(e.message || e) }))
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`LLM proxy listening on http://127.0.0.1:${PORT}`)
  console.log('Set TARO_APP_LLM_PROXY_URL=http://127.0.0.1:8787 in .env.local then rebuild weapp')
})
