#!/usr/bin/env node
/**
 * 为 200 道本地菜谱生成封面 + 真实步骤过程图。
 *
 * 来源：下厨房移动端菜谱详情页（m.xiachufang.com/recipe/{id}/）
 * - 封面：详情页 hero cover
 * - 步骤图：按 DOM 顺序提取 .step-cover 背景图（真实逐步过程图，非搜索图集）
 *
 * 用法：
 *   node scripts/fetch-recipe-images.mjs           # 补抓缺失项
 *   node scripts/fetch-recipe-images.mjs --emit  # 仅从 cache 写入 ts 文件
 *   node scripts/fetch-recipe-images.mjs --force # 全量重抓
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const cachePath = path.join(__dirname, 'recipe-image-cache.json')

const DESKTOP_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  Referer: 'https://www.xiachufang.com/',
}
const MOBILE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  Referer: 'https://m.xiachufang.com/',
}
const TIMEOUT_MS = 15000
const SLEEP_MS = 420
const BATCH_PAUSE_EVERY = 12
const BATCH_PAUSE_MS = 5000
const FORCE = process.argv.includes('--force')
const EMIT_ONLY = process.argv.includes('--emit')

const METHOD_STEP_COUNT = {
  stir: 4,
  braise: 4,
  steam: 4,
  soup: 4,
  noodle: 4,
  rice: 4,
  cold: 4,
  breakfast: 4,
  dumpling: 4,
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchText(url, headers, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, { headers, signal: ctrl.signal })
      if (res.status === 429) {
        if (i < retries) {
          await sleep(8000 * (i + 1))
          continue
        }
        return ''
      }
      if (!res.ok) {
        if (i < retries) {
          await sleep(800 * (i + 1))
          continue
        }
        return ''
      }
      const text = await res.text()
      if (text.includes('滑动验证') && i < retries) {
        await sleep(1200 * (i + 1))
        continue
      }
      return text
    } catch {
      if (i < retries) {
        await sleep(800 * (i + 1))
        continue
      }
      return ''
    } finally {
      clearTimeout(t)
    }
  }
  return ''
}

function normalizeUrl(u) {
  let url = (u || '').replace(/&amp;/g, '&').trim()
  if (url.startsWith('//')) url = `https:${url}`
  return url.split('?')[0]
}

/** 写入前校验：必须是下厨房真实 CDN，禁止 SVG / Unsplash 等占位 */
function assertRealPhotoUrl(url, label = 'image') {
  if (!/i\d+\.chuimg\.com/i.test(url || '')) {
    throw new Error(`[${label}] 非下厨房真实图，已拒绝写入: ${String(url).slice(0, 80)}`)
  }
}

function sized(url, w = 1200, h = 760) {
  return `${normalizeUrl(url)}?imageView2/1/w/${w}/h/${h}/interlace/1/q/85`
}

function parseStepsBlock(text, startIdx) {
  const sm = text.indexOf('steps:', startIdx)
  if (sm < 0) return { count: 0, end: startIdx }
  const arrStart = text.indexOf('[', sm)
  if (arrStart < 0) return { count: 0, end: startIdx }
  let depth = 0
  for (let i = arrStart; i < text.length; i++) {
    const ch = text[i]
    if (ch === '[') depth++
    else if (ch === ']') {
      depth--
      if (depth === 0) {
        const block = text.slice(arrStart + 1, i)
        const count = (block.match(/content:/g) || []).length
        return { count, end: i + 1 }
      }
    }
  }
  return { count: 0, end: startIdx }
}

function readAdditionalSeeds(addTs) {
  const meta = []
  for (const line of addTs.split('\n')) {
    if (!/^\s*\{\s*id:\s*\d+,/.test(line)) continue
    const titleM = line.match(/title:\s*'([^']+)'/)
    const methodM = line.match(/method:\s*'([^']+)'/)
    if (!titleM || !methodM) continue
    meta.push({
      title: titleM[1],
      stepCount: METHOD_STEP_COUNT[methodM[1]] || 4,
    })
  }
  return meta
}

function readRecipeMeta() {
  const recipesTs = fs.readFileSync(path.join(root, 'src/data/recipesLegacy.ts'), 'utf8')
  const addTs = fs.readFileSync(path.join(root, 'src/data/additionalRecipes.ts'), 'utf8')
  const meta = []

  for (const m of recipesTs.matchAll(/id:\s*(\d+),\s*\n\s*title:\s*'([^']+)'/g)) {
    const title = m[2]
    const { count } = parseStepsBlock(recipesTs, m.index)
    if (count > 0) meta.push({ title, stepCount: count })
  }

  for (const seed of readAdditionalSeeds(addTs)) {
    if (!meta.some((x) => x.title === seed.title)) meta.push(seed)
  }

  const catalogIndex = path.join(root, 'src/packageCatalogA/catalog/index.json')
  if (fs.existsSync(catalogIndex)) {
    try {
      const index = JSON.parse(fs.readFileSync(catalogIndex, 'utf8'))
      for (const entry of index) {
        if (!entry?.title) continue
        if (meta.some((x) => x.title === entry.title)) continue
        const chunkBase =
          (entry.chunk ?? 0) >= 5
            ? 'src/packageCatalogB/catalog/chunks'
            : 'src/packageCatalogA/catalog/chunks'
        const chunkPath = path.join(root, `${chunkBase}/chunk-${entry.chunk ?? 0}.json`)
        let stepCount = 4
        if (fs.existsSync(chunkPath)) {
          const chunk = JSON.parse(fs.readFileSync(chunkPath, 'utf8'))
          const full = chunk.find((r) => r.title === entry.title)
          if (full?.steps?.length) stepCount = full.steps.length
        }
        meta.push({ title: entry.title, stepCount })
      }
    } catch {
      /* ignore */
    }
  }

  return meta
}

async function searchRecipeIds(title) {
  const ids = []
  const queries = [title, `${title} 家常`, `${title} 做法`]

  for (const q of queries) {
    const mobileUrl = `https://m.xiachufang.com/search/?keyword=${encodeURIComponent(q)}`
    const html = await fetchText(mobileUrl, MOBILE_HEADERS)
    for (const m of html.matchAll(/\/recipe\/(\d+)\//g)) {
      if (!ids.includes(m[1])) ids.push(m[1])
    }
    if (ids.length >= 5) break
    await sleep(600)
  }

  if (ids.length === 0) {
    const desktopUrl = `https://www.xiachufang.com/search/?keyword=${encodeURIComponent(title)}`
    const html = await fetchText(desktopUrl, DESKTOP_HEADERS)
    for (const m of html.matchAll(/\/recipe\/(\d+)\//g)) {
      if (!ids.includes(m[1])) ids.push(m[1])
    }
  }

  return ids.slice(0, 5)
}

function extractMobileRecipe(html) {
  if (!html || html.includes('滑动验证') || html.length < 8000) return null

  const stepImages = []
  const stepRe =
    /class="step-cover[^"]*"[^>]*style="[^"]*background-image:url\(([^)]+)\)/g
  for (const m of html.matchAll(stepRe)) {
    const base = normalizeUrl(m[1])
    if (base && !stepImages.includes(base)) stepImages.push(base)
  }

  const coverMatch = html.match(
    /class="cover[^"]*"[^>]*style="[^"]*background-image:url\(([^)]+)\)/
  )
  const ogMatch = html.match(/property="og:image"\s+content="([^"]+)"/)
  const cover = normalizeUrl(coverMatch?.[1] || ogMatch?.[1] || '')

  let name = ''
  const nameMatch =
    html.match(/"name":"([^"]{2,60})"/) ||
    html.match(/<title>([^<]{2,60})<\/title>/)
  if (nameMatch) name = nameMatch[1].replace(/\\u002F/g, '/').trim()

  if (!cover && stepImages.length === 0) return null
  return { name, cover: cover || stepImages[0], stepImages }
}

async function fetchMobileRecipe(recipeId, retries = 4) {
  const url = `https://m.xiachufang.com/recipe/${recipeId}/`
  for (let i = 0; i <= retries; i++) {
    const html = await fetchText(url, MOBILE_HEADERS, 2)
    const parsed = extractMobileRecipe(html)
    if (parsed) return parsed
    await sleep(600 * (i + 1))
  }
  return null
}

function titleSimilarity(a, b) {
  const x = (a || '').replace(/\s/g, '')
  const y = (b || '').replace(/\s/g, '')
  if (!x || !y) return 0
  if (x === y) return 1
  if (x.includes(y) || y.includes(x)) return 0.85
  const setA = new Set(x.split(''))
  const setB = new Set(y.split(''))
  let inter = 0
  for (const c of setA) if (setB.has(c)) inter++
  return inter / Math.max(setA.size, setB.size)
}

function scoreCandidate(dishTitle, detail, stepCount) {
  const sim = titleSimilarity(dishTitle, detail.name)
  const steps = detail.stepImages.length
  if (steps === 0) return -1

  let score = sim * 100
  if (steps >= stepCount) score += 20
  else if (steps >= stepCount - 1) score += 10
  else score -= (stepCount - steps) * 8

  if (steps >= 3) score += 5
  if (detail.cover) score += 3
  return score
}

/** 将 N 张过程图对齐到本地 M 步：M<=N 时均匀抽样，M>N 时用最后一张补齐 */
function alignStepImages(urls, stepCount) {
  if (!urls.length || stepCount <= 0) return []
  if (urls.length === stepCount) return [...urls]
  if (urls.length > stepCount) {
    return Array.from({ length: stepCount }, (_, i) => {
      const idx = Math.round((i * (urls.length - 1)) / Math.max(stepCount - 1, 1))
      return urls[idx]
    })
  }
  const out = [...urls]
  while (out.length < stepCount) out.push(urls[urls.length - 1])
  return out
}

async function resolveDish({ title, stepCount }, cache) {
  const cached = cache[title]
  if (
    !FORCE &&
    cached?.stepImages?.length >= stepCount &&
    cached?.cover
  ) {
    return cached
  }

  const ids = await searchRecipeIds(title)
  await sleep(SLEEP_MS + Math.random() * 120)

  if (ids.length === 0) return null

  let best = null
  let bestScore = -1
  let bestId = ''

  for (const id of ids.slice(0, 3)) {
    const detail = await fetchMobileRecipe(id)
    await sleep(SLEEP_MS + Math.random() * 120)
    if (!detail) continue
    const score = scoreCandidate(title, detail, stepCount)
    if (score > bestScore) {
      bestScore = score
      best = detail
      bestId = id
    }
    if (score >= 95 && detail.stepImages.length >= stepCount) break
  }

  if (!best || best.stepImages.length === 0) {
    return null
  }

  const aligned = alignStepImages(best.stepImages, stepCount)
  const entry = {
    recipeId: bestId,
    sourceName: best.name,
    cover: sized(best.cover),
    stepImages: aligned.map((u) => sized(u)),
    rawStepCount: best.stepImages.length,
    localStepCount: stepCount,
  }
  cache[title] = entry
  return entry
}

function buildOutputMaps(meta, cache) {
  const coverMap = {}
  const stepMap = {}
  const usedCovers = new Set()

  for (const { title } of meta) {
    const entry = cache[title]
    if (!entry?.stepImages?.length) continue

    let cover = entry.cover
    const coverBase = normalizeUrl(cover)
    if (usedCovers.has(coverBase)) {
      const alt = entry.stepImages.find((u) => !usedCovers.has(normalizeUrl(u)))
      if (alt) cover = alt
    }
    usedCovers.add(normalizeUrl(cover))
    coverMap[title] = cover
    stepMap[title] = entry.stepImages
  }

  return { coverMap, stepMap }
}

function writeExactDishImages(map) {
  const lines = [
    '/**',
    ' * 200 道本地菜谱真实封面图（下厨房 CDN，每道菜唯一封面）。',
    ' * 小程序 downloadFile 合法域名：i2.chuimg.com',
    ' */',
    'export const EXACT_DISH_IMAGE_OVERRIDES: Record<string, string> = {',
  ]
  for (const [title, url] of Object.entries(map)) {
    assertRealPhotoUrl(url, `cover:${title}`)
    lines.push(`  '${title}': '${url}',`)
  }
  lines.push('}', '')
  fs.writeFileSync(path.join(root, 'src/data/exactDishImages.ts'), lines.join('\n'), 'utf8')
}

function writeStepImages(map) {
  const lines = [
    '/**',
    ' * 200 道菜真实步骤过程图（下厨房详情页 .step-cover，与本地步骤 1:1 对齐）。',
    ' * 每道菜数组长度 = 该菜本地步骤数（3~5 步），非固定 3 张。',
    ' */',
    'const sized = (base: string, w = 1200) =>',
    "  `${base}?imageView2/1/w/${w}/h/760/interlace/1/q/85`",
    '',
    'export const STEP_IMAGE_MAP: Record<string, string[]> = {',
  ]
  for (const [title, urls] of Object.entries(map)) {
    for (const u of urls) assertRealPhotoUrl(u, `step:${title}`)
    const arr = urls
      .map((u) => `sized('${normalizeUrl(u)}')`)
      .join(', ')
    lines.push(`  '${title}': [${arr}],`)
  }
  lines.push('}', '')
  lines.push('export function getStepImages(title: string): string[] {')
  lines.push('  return STEP_IMAGE_MAP[title] ?? []')
  lines.push('}', '')
  lines.push('export function hasStepImages(title: string): boolean {')
  lines.push('  return getStepImages(title).length > 0')
  lines.push('}', '')
  fs.writeFileSync(path.join(root, 'src/data/stepImages.ts'), lines.join('\n'), 'utf8')
}

async function main() {
  const meta = readRecipeMeta()
  console.log(`Fetching real step photos for ${meta.length} dishes...`)

  let cache = {}
  if (fs.existsSync(cachePath)) {
    try {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
    } catch {
      cache = {}
    }
  }
  if (FORCE) {
    console.log('FORCE: re-fetch all dishes (cache kept as fallback until replaced)')
  }

  if (EMIT_ONLY) {
    const { coverMap, stepMap } = buildOutputMaps(meta, cache)
    writeExactDishImages(coverMap)
    writeStepImages(stepMap)
    console.log(`Emitted ${Object.keys(stepMap).length}/${meta.length} dishes from cache.`)
    return
  }

  const MAX_PASSES = 3
  for (let pass = 1; pass <= MAX_PASSES; pass++) {
    const todo = meta.filter(({ title, stepCount }) => {
      const c = cache[title]
      return FORCE || !c?.stepImages?.length || c.stepImages.length < stepCount || !c.cover
    })
    if (todo.length === 0) break

    console.log(`\n=== Pass ${pass}/${MAX_PASSES}: ${todo.length} dishes ===`)
    if (pass > 1) await sleep(BATCH_PAUSE_MS * 2)

    for (let i = 0; i < todo.length; i++) {
      const dish = todo[i]
      const entry = await resolveDish(dish, cache)

      if (!entry) {
        console.log(`[${i + 1}/${todo.length}] FAIL ${dish.title}`)
      } else {
        console.log(
          `[${i + 1}/${todo.length}] OK ${dish.title} id=${entry.recipeId} ` +
            `steps ${entry.rawStepCount}→${entry.stepImages.length} (${entry.sourceName.slice(0, 18)})`
        )
      }

      if ((i + 1) % 8 === 0) {
        fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8')
      }
      if ((i + 1) % BATCH_PAUSE_EVERY === 0) {
        await sleep(BATCH_PAUSE_MS)
      }
    }
  }

  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8')
  const { coverMap, stepMap } = buildOutputMaps(meta, cache)

  const failed = meta.filter(({ title }) => !stepMap[title]).map((x) => x.title)
  writeExactDishImages(coverMap)
  writeStepImages(stepMap)

  const dupCovers = Object.values(coverMap).map(normalizeUrl)
  const dupCount = dupCovers.length - new Set(dupCovers).size
  const stepLens = Object.values(stepMap).map((a) => a.length)
  const avgSteps = stepLens.reduce((a, b) => a + b, 0) / (stepLens.length || 1)

  console.log('\nDone.')
  console.log('covers', Object.keys(coverMap).length, '/', meta.length)
  console.log('step maps', Object.keys(stepMap).length, '/', meta.length)
  console.log('avg step images per dish', avgSteps.toFixed(1))
  console.log('failed', failed.length, failed.slice(0, 15).join(', '))
  console.log('duplicate covers', dupCount)
  if (failed.length) process.exitCode = 1
}

main()
