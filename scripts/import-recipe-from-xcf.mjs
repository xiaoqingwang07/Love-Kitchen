#!/usr/bin/env node
/**
 * 从下厨房导入单道菜（开发/运营用）：抓取详情 + 真实封面/步骤图，写入 pending 目录。
 *
 * 用法：
 *   node scripts/import-recipe-from-xcf.mjs "菜名"
 *   node scripts/import-recipe-from-xcf.mjs --wish   # 从 recipe-wishlist.json 批量导入
 *
 * 产出：
 *   scripts/pending-recipes/{slug}.json  — 菜谱元数据 + xiachufang recipeId
 *   并更新 scripts/recipe-image-cache.json 封面/步骤图（仅 i*.chuimg.com）
 *
 * 合入正式库：审阅 pending JSON 后并入内置 seed / 下版本发版。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const cachePath = path.join(__dirname, 'recipe-image-cache.json')
const wishPath = path.join(__dirname, 'recipe-wishlist.json')
const pendingDir = path.join(__dirname, 'pending-recipes')

const MOBILE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  Referer: 'https://m.xiachufang.com/',
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function slugify(title) {
  return title.replace(/\s/g, '_').replace(/[^\w\u4e00-\u9fff-]/g, '').slice(0, 40)
}

async function fetchText(url) {
  const res = await fetch(url, { headers: MOBILE_HEADERS })
  if (!res.ok) return ''
  return res.text()
}

function extractMobileRecipe(html) {
  if (!html || html.includes('滑动验证') || html.length < 8000) return null
  const stepImages = []
  for (const m of html.matchAll(
    /class="step-cover[^"]*"[^>]*style="[^"]*background-image:url\(([^)]+)\)/g
  )) {
    const u = m[1].replace(/&amp;/g, '&').split('?')[0]
    if (u && !stepImages.includes(u)) stepImages.push(u.startsWith('//') ? `https:${u}` : u)
  }
  const coverM = html.match(
    /class="cover[^"]*"[^>]*style="[^"]*background-image:url\(([^)]+)\)/
  )
  let cover = coverM?.[1]?.replace(/&amp;/g, '&').split('?')[0] || ''
  if (cover.startsWith('//')) cover = `https:${cover}`
  const nameM = html.match(/"name":"([^"]{2,80})"/)
  const name = nameM?.[1]?.replace(/\\u002F/g, '/') || ''
  if (!cover && stepImages.length === 0) return null
  return { name, cover: cover || stepImages[0], stepImages }
}

async function searchIds(title) {
  const url = `https://m.xiachufang.com/search/?keyword=${encodeURIComponent(title)}`
  const html = await fetchText(url)
  const ids = []
  for (const m of html.matchAll(/\/recipe\/(\d+)\//g)) {
    if (!ids.includes(m[1])) ids.push(m[1])
  }
  return ids.slice(0, 5)
}

function assertChuimg(url, label) {
  if (!/i\d+\.chuimg\.com/i.test(url || '')) {
    throw new Error(`[${label}] 非下厨房真实图: ${url}`)
  }
}

async function importOne(title) {
  const ids = await searchIds(title)
  await sleep(500)
  if (!ids.length) throw new Error(`搜索无结果: ${title}`)

  let best = null
  let bestId = ''
  for (const id of ids) {
    const html = await fetchText(`https://m.xiachufang.com/recipe/${id}/`)
    const parsed = extractMobileRecipe(html)
    await sleep(400)
    if (parsed?.stepImages?.length) {
      best = parsed
      bestId = id
      break
    }
  }
  if (!best) throw new Error(`详情页无步骤图: ${title}`)

  assertChuimg(best.cover, 'cover')
  best.stepImages.forEach((u, i) => assertChuimg(u, `step${i + 1}`))

  const payload = {
    title,
    sourceName: best.name,
    xiachufangRecipeId: bestId,
    cover: best.cover,
    stepImages: best.stepImages,
    importedAt: new Date().toISOString(),
    note: '审阅后合入 src/data/；运行 fetch-recipe-images --emit 刷新 TS 映射',
  }

  fs.mkdirSync(pendingDir, { recursive: true })
  const outPath = path.join(pendingDir, `${slugify(title)}.json`)
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8')

  let cache = {}
  if (fs.existsSync(cachePath)) {
    try {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
    } catch {
      cache = {}
    }
  }
  const sized = (u) =>
    `${u.split('?')[0]}?imageView2/1/w/1200/h/760/interlace/1/q/85`
  cache[title] = {
    recipeId: bestId,
    sourceName: best.name,
    cover: sized(best.cover),
    stepImages: best.stepImages.map(sized),
    rawStepCount: best.stepImages.length,
    localStepCount: best.stepImages.length,
  }
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8')

  console.log('OK', title, '→', outPath, `(${best.stepImages.length} step photos)`)
  return payload
}

async function main() {
  const args = process.argv.slice(2)
  if (args[0] === '--wish') {
    if (!fs.existsSync(wishPath)) {
      console.log('无 recipe-wishlist.json，可从小程序 storage 导出心愿菜标题列表到此文件')
      process.exit(0)
    }
    const titles = JSON.parse(fs.readFileSync(wishPath, 'utf8'))
    for (const t of titles) {
      try {
        await importOne(typeof t === 'string' ? t : t.title)
      } catch (e) {
        console.error('FAIL', t, e.message)
      }
      await sleep(800)
    }
    return
  }
  const title = args.join(' ').trim()
  if (!title) {
    console.error('用法: node scripts/import-recipe-from-xcf.mjs "菜名"')
    process.exit(1)
  }
  await importOne(title)
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
