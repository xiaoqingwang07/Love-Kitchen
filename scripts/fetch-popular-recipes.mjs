#!/usr/bin/env node
/**
 * 从下厨房抓取最常见/热门菜谱，生成可扩展 catalog（目标 5000 道）。
 *
 * 用法：
 *   node scripts/fetch-popular-recipes.mjs              # 默认目标 5000
 *   node scripts/fetch-popular-recipes.mjs --limit 50   # 试跑
 *   node scripts/fetch-popular-recipes.mjs --resume     # 断点续抓
 *
 * 产出：
 *   src/data/catalog/index.json        — 轻量索引（匹配/推荐用）
 *   src/data/catalog/chunks/chunk-*.json — 完整步骤（每包 500 道）
 *   src/data/catalog/meta.json
 *   scripts/recipe-image-cache.json      — 封面+步骤真实图（合入 fetch-recipe-images）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  sleep,
  fetchRecipeDetail,
  collectRecipeIdsFromExplore,
  collectRecipeIdsFromCategories,
  collectAllPopularIds,
  normalizeTitleKey,
  pickEmoji,
  sized,
  normalizeUrl,
  assertRealPhotoUrl,
  isValidChuimgUrl,
} from './xcf-lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const catalogDir = path.join(root, 'src/packageCatalogA/catalog')
const chunksDirA = path.join(catalogDir, 'chunks')
const chunksDirB = path.join(root, 'src/packageCatalogB/catalog/chunks')
const CHUNK_SPLIT = 5
const cachePath = path.join(__dirname, 'recipe-image-cache.json')
const progressPath = path.join(__dirname, 'fetch-popular-progress.json')

const TARGET = (() => {
  const i = process.argv.indexOf('--limit')
  if (i >= 0 && process.argv[i + 1]) return Number(process.argv[i + 1]) || 5000
  return 5000
})()
const RESUME = process.argv.includes('--resume')
const CHUNK_SIZE = 500

function loadLegacyTitles() {
  const titles = new Set()
  const recipesTs = fs.readFileSync(path.join(root, 'src/data/recipesLegacy.ts'), 'utf8')
  const addTs = fs.readFileSync(path.join(root, 'src/data/additionalRecipes.ts'), 'utf8')
  for (const m of recipesTs.matchAll(/title:\s*'([^']+)'/g)) titles.add(m[1].trim())
  for (const m of addTs.matchAll(/title:\s*'([^']+)'/g)) titles.add(m[1].trim())
  return titles
}

function buildRecipeRecord(id, detail) {
  const pairs = detail.pairedSteps?.length
    ? detail.pairedSteps
    : (detail.stepTexts || []).map((text, idx) => ({
        text,
        image: detail.stepImages?.[idx] || '',
      }))

  const steps = pairs.map((p, idx) => {
    const row = {
      content: p.text,
      time: Math.max(2, Math.round(detail.time / Math.max(pairs.length, 1))),
    }
    if (p.image && isValidChuimgUrl(p.image)) {
      row.image = sized(normalizeUrl(p.image))
    }
    if (idx === 0 && pairs.some((x) => x.image)) {
      row.tip = '步骤图对应该步制作过程（下厨房原图）'
    }
    return row
  })

  let difficulty = '中等'
  if (detail.time <= 20) difficulty = '简单'
  if (detail.time >= 60 || pairs.length >= 8) difficulty = '复杂'

  const coverRaw = detail.cover || pairs.find((p) => p.image)?.image || ''
  const image = coverRaw && isValidChuimgUrl(coverRaw) ? sized(normalizeUrl(coverRaw)) : undefined

  return {
    id,
    title: detail.title,
    source: 'local',
    quote: `下厨房人气菜谱 · ${detail.count ? `${detail.count} 人做过` : '家常经典'}`,
    rating: detail.rating,
    count: detail.count || id * 31,
    emoji: pickEmoji(detail.title),
    difficulty,
    time: detail.time,
    tags: ['家常', '下厨房'],
    ingredients: detail.ingredients.slice(0, 12),
    steps,
    image,
    mediaAligned: true,
    nutritionAnalysis: `${detail.title}，常见家常做法，可按口味调整用料。`,
    xiachufangId: detail.xiachufangId,
  }
}

function loadExistingImageCache() {
  if (!fs.existsSync(cachePath)) return {}
  try {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'))
  } catch {
    return {}
  }
}

function chunkFileDir(chunkId) {
  return Number(chunkId) >= CHUNK_SPLIT ? chunksDirB : chunksDirA
}

function writeCatalog(index, chunks, imageCacheDelta) {
  fs.mkdirSync(chunksDirA, { recursive: true })
  fs.mkdirSync(chunksDirB, { recursive: true })
  const mergedCache = { ...loadExistingImageCache(), ...imageCacheDelta }
  fs.writeFileSync(path.join(catalogDir, 'index.json'), JSON.stringify(index, null, 0), 'utf8')
  for (const [chunkId, recipes] of Object.entries(chunks)) {
    const dir = chunkFileDir(chunkId)
    fs.writeFileSync(
      path.join(dir, `chunk-${chunkId}.json`),
      JSON.stringify(recipes, null, 0),
      'utf8'
    )
  }
  fs.writeFileSync(
    path.join(catalogDir, 'meta.json'),
    JSON.stringify(
      {
        version: 1,
        count: index.length,
        chunkSize: CHUNK_SIZE,
        chunkSplit: CHUNK_SPLIT,
        packages: ['packageCatalogA', 'packageCatalogB'],
        generatedAt: new Date().toISOString(),
        source: 'xiachufang-mobile',
      },
      null,
      2
    ),
    'utf8'
  )
  fs.writeFileSync(cachePath, JSON.stringify(mergedCache, null, 2), 'utf8')
}

function loadProgress() {
  if (!RESUME || !fs.existsSync(progressPath)) {
    return { doneIds: [], recipes: [], imageCache: {}, titleKeys: {} }
  }
  try {
    return JSON.parse(fs.readFileSync(progressPath, 'utf8'))
  } catch {
    return { doneIds: [], recipes: [], imageCache: {}, titleKeys: {} }
  }
}

function saveProgress(state) {
  fs.writeFileSync(progressPath, JSON.stringify(state, null, 2), 'utf8')
}

function buildIndexAndChunks(recipes) {
  const index = recipes.map((r) => ({
    id: r.id,
    title: r.title,
    ingredients: r.ingredients,
    tags: r.tags,
    rating: r.rating,
    count: r.count,
    time: r.time,
    difficulty: r.difficulty,
    emoji: r.emoji,
    quote: r.quote,
    image: r.image || undefined,
    chunk: Math.floor((r.id - 1) / CHUNK_SIZE),
  }))
  const chunks = {}
  for (const r of recipes) {
    const cid = Math.floor((r.id - 1) / CHUNK_SIZE)
    if (!chunks[cid]) chunks[cid] = []
    chunks[cid].push(r)
  }
  return { index, chunks }
}

function flushCatalog(state, quiet = false) {
  const { index, chunks } = buildIndexAndChunks(state.recipes)
  writeCatalog(index, chunks, state.imageCache)
  if (!quiet) console.log(`  → catalog flushed (${state.recipes.length} recipes)`)
}

async function main() {
  console.log(`Target: ${TARGET} popular recipes from xiachufang`)

  let state = loadProgress()
  const preservedCache = loadExistingImageCache()
  if (!state.imageCache || !Object.keys(state.imageCache).length) {
    state.imageCache = { ...preservedCache }
  }
  if (!RESUME) {
    console.log('Collecting recipe IDs from explore + categories + hot search...')
    const allIds = await collectAllPopularIds()
    console.log('unique ids pool', allIds.length)
    state.idQueue = allIds.filter((id) => !state.doneIds.includes(id))
  } else {
    console.log('Resume:', state.recipes?.length || 0, 'recipes done, queue', state.idQueue?.length || 0)
    if (!state.idQueue) state.idQueue = []
    if (state.recipes.length < TARGET && state.idQueue.length < 800) {
      console.log('Refilling ID queue for target', TARGET)
      const moreIds = await collectAllPopularIds()
      const seen = new Set([...(state.doneIds || []), ...state.idQueue])
      let added = 0
      for (const id of moreIds) {
        if (!seen.has(id)) {
          state.idQueue.push(id)
          seen.add(id)
          added++
        }
      }
      console.log('Added', added, 'new ids, queue now', state.idQueue.length)
    }
  }

  const legacyTitles = loadLegacyTitles()
  let nextId = (state.recipes?.length || 0) + 1

  while (state.recipes.length < TARGET && state.idQueue.length > 0) {
    const xcfId = state.idQueue.shift()
    if (state.doneIds.includes(xcfId)) continue

    let detail
    try {
      detail = await fetchRecipeDetail(xcfId)
    } catch (e) {
      console.log('ERR fetch', xcfId, e.message)
      state.doneIds.push(xcfId)
      continue
    }
    await sleep(450)

    if (!detail) {
      state.doneIds.push(xcfId)
      continue
    }

    const key = normalizeTitleKey(detail.title)
    if (state.titleKeys[key]) {
      state.doneIds.push(xcfId)
      continue
    }

    if (!detail.pairedSteps?.length || !detail.cover) {
      console.log('SKIP no photos/steps', detail.title)
      state.doneIds.push(xcfId)
      continue
    }

    try {
      assertRealPhotoUrl(detail.cover, detail.title)
      detail.pairedSteps.forEach((p, i) => {
        if (p.image) assertRealPhotoUrl(normalizeUrl(p.image), `step${i}`)
      })
    } catch (e) {
      console.log('SKIP', e.message)
      state.doneIds.push(xcfId)
      continue
    }

    const recipe = buildRecipeRecord(nextId, detail)
    const stepUrls = recipe.steps.map((s) => s.image).filter(Boolean)

    state.recipes.push(recipe)
    state.titleKeys[key] = true
    state.imageCache[recipe.title] = {
      recipeId: xcfId,
      sourceName: detail.title,
      cover: recipe.image || '',
      stepImages: recipe.steps.map((s) => s.image || ''),
      rawStepCount: stepUrls.length,
      localStepCount: recipe.steps.length,
      mediaAligned: true,
    }

    state.doneIds.push(xcfId)
    nextId++

    console.log(
      `[${state.recipes.length}/${TARGET}] ${recipe.title} (xcf:${xcfId}, ${recipe.steps.length} steps, ${stepUrls.length} photos)`
    )

    if (state.recipes.length % 20 === 0) {
      saveProgress(state)
      flushCatalog(state, true)
    }
    if (state.recipes.length % 80 === 0) await sleep(5000)
  }

  // 保留现有 200 道手写精品：若 catalog 中无同名则标记待合并（不重复抓取）
  const legacyNote = [...legacyTitles].filter(
    (t) => !state.recipes.some((r) => normalizeTitleKey(r.title) === normalizeTitleKey(t))
  )
  if (legacyNote.length) {
    console.log(`Note: ${legacyNote.length} legacy recipes not in xcf batch — run merge-legacy after build`)
  }

  const { index, chunks } = buildIndexAndChunks(state.recipes)

  writeCatalog(index, chunks, state.imageCache)
  saveProgress(state)

  console.log('\nDone.')
  console.log('recipes', state.recipes.length)
  console.log('chunks', Object.keys(chunks).length)
  console.log('image cache', Object.keys(state.imageCache).length)
  console.log('Next: node scripts/patch-catalog-media.mjs')
  console.log('      node scripts/emit-legacy-images.mjs')
  console.log('      npm run build:weapp')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
