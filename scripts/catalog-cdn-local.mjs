#!/usr/bin/env node
/**
 * 本地 catalog 静态服务（开发用）。
 * 把仓库 catalog-cdn/ 目录挂到 http://127.0.0.1:8790
 *
 * 用法：
 *   npm run dev:catalog          # 终端 1
 *   npm run dev:weapp            # 终端 2（需 .env.local 已设 TARO_APP_CATALOG_BASE_URL）
 */
import fs from 'fs'
import http from 'http'
import https from 'https'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const CATALOG_DIR = path.join(root, 'catalog-cdn')
const PORT = Number(process.env.CATALOG_PORT || 8790)
const HOST = process.env.CATALOG_HOST || '127.0.0.1'

const MIME = {
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0])
  const rel = decoded.replace(/^\/+/, '')
  const abs = path.normalize(path.join(CATALOG_DIR, rel))
  if (!abs.startsWith(CATALOG_DIR)) return null
  return abs
}

function isAllowedImageHost(hostname) {
  return /^i\d+\.chuimg\.com$/i.test(hostname)
}

function handleImageProxy(req, res, rawUrl) {
  let target
  try {
    const u = new URL(String(rawUrl), 'http://127.0.0.1')
    if (!isAllowedImageHost(u.hostname)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Forbidden host')
      return
    }
    target = u
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Bad URL')
    return
  }

  const upstream = https.request(
    target,
    { method: req.method === 'HEAD' ? 'HEAD' : 'GET', headers: { 'User-Agent': 'Love-Kitchen-Dev/1.0' } },
    (up) => {
      res.writeHead(up.statusCode || 502, {
        'Content-Type': up.headers['content-type'] || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      })
      if (req.method === 'HEAD') {
        res.end()
        return
      }
      up.pipe(res)
    }
  )
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Upstream error')
  })
  upstream.end()
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405)
    res.end('Method Not Allowed')
    return
  }

  const reqUrl = req.url || '/'
  if (reqUrl.startsWith('/img-proxy?')) {
    const q = new URL(reqUrl, 'http://127.0.0.1')
    handleImageProxy(req, res, q.searchParams.get('u') || '')
    return
  }

  const filePath = safePath(reqUrl)
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not Found')
    return
  }

  const ext = path.extname(filePath).toLowerCase()
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'public, max-age=60',
  })
  if (req.method === 'HEAD') {
    res.end()
    return
  }
  fs.createReadStream(filePath).pipe(res)
})

if (!fs.existsSync(path.join(CATALOG_DIR, 'meta.json'))) {
  console.error('FAIL: catalog-cdn/meta.json 不存在')
  process.exit(1)
}

server.listen(PORT, HOST, () => {
  const base = `http://${HOST}:${PORT}`
  console.log(`catalog CDN 本地服务: ${base}`)
  console.log(`  meta   → ${base}/meta.json`)
  console.log(`  index  → ${base}/index.json (${fs.statSync(path.join(CATALOG_DIR, 'index.json')).size} bytes)`)
  console.log('')
  console.log('请在 .env.local 设置：')
  console.log(`  TARO_APP_CATALOG_BASE_URL=${base}`)
  console.log('然后 npm run dev:weapp 重新编译。')
  console.log(`  img    → ${base}/img-proxy?u=…（本地代理下厨房图，解决小程序图片域名校验）`)
})
