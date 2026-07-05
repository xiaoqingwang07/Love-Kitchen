#!/usr/bin/env node
/**
 * 一条命令启动本地开发所需全部服务（catalog + AI 中转 + 小程序编译）
 * 用法：npm run dev:local
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const envPath = path.join(root, '.env.local')

function log(tag, msg) {
  process.stdout.write(`[${tag}] ${msg}\n`)
}

if (!fs.existsSync(envPath)) {
  log('错误', '缺少 .env.local，请先让 Cursor 帮你跑 npm run setup:env')
  process.exit(1)
}

const envRaw = fs.readFileSync(envPath, 'utf8')
if (!/^MINIMAX_API_KEY=\S+/m.test(envRaw)) {
  log('警告', 'MINIMAX_API_KEY 为空，AI 功能不可用（5000 道菜和本地 200 道仍可用）')
}

const children = []

function start(name, cmd, args) {
  const child = spawn(cmd, args, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  })
  child.stdout.on('data', (buf) => {
    for (const line of buf.toString().split('\n').filter(Boolean)) {
      log(name, line)
    }
  })
  child.stderr.on('data', (buf) => {
    for (const line of buf.toString().split('\n').filter(Boolean)) {
      log(name, line)
    }
  })
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) log(name, `退出 code=${code}`)
  })
  children.push(child)
  return child
}

log('提示', '请先运行本命令，再打开微信开发者工具并编译小程序')
log('提示', '正在启动：菜谱服务 + AI 中转 + 小程序编译…')
log('提示', '仅浏览菜谱时，单独运行 npm run dev:catalog 即可')
log('提示', 'AI 功能需 npm run dev:llm-proxy 或本命令；未启动时检测会失败，属正常')
log('提示', '看到「Compiled successfully」后，去微信开发者工具点「编译」')
log('提示', '按 Ctrl+C 可全部停止')
console.log('')

start('catalog', 'node', ['scripts/catalog-cdn-local.mjs'])
start('ai', 'node', ['scripts/llm-proxy-local.mjs'])
// 稍等再启 weapp，避免端口争抢日志混乱
setTimeout(() => {
  start('weapp', 'npm', ['run', 'dev:weapp'])
}, 800)

function shutdown() {
  for (const c of children) {
    try {
      c.kill('SIGTERM')
    } catch {
      /* ignore */
    }
  }
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
