#!/usr/bin/env node
/**
 * 用新版「step 块 1:1 解析」重写下厨房 catalog 的步骤图文。
 *
 *   node scripts/repair-catalog-step-media.mjs --limit 100
 *   node scripts/repair-catalog-step-media.mjs --resume
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  sleep,
  fetchRecipeDetail,
  sized,
  normalizeUrl,
  isValidChuimgUrl,
  assertRealPhotoUrl,
} from './xcf-lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const cachePath = path.join(__dirname, 'recipe-image-cache.json')
const progressPath = path.join(__dirname, 'repair-media-progress.json')
const indexPath = path.join(root, 'src/packageCatalogA/catalog/index.json')
const chunkDirs = [
  path.join(root, 'src/packageCatalogA/catalog/chunks'),
  path.join(root, 'src/packageCatalogB/catalog/chunks'),
]

const RESUME = process.argv.includes('--resume')
const LIMIT = (() => {
  const i = process.argv.indexOf('--limit')
  return i >= 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : 0
})()

function loadProgress() {
  if (RESUME && fs.existsSync(progressPath)) {
    return JSON.parse(fs.readFileSync(progressPath, 'utf8'))
  }
  return { doneTitles: [] }
}

function saveProgress(state) {
  fs.writeFileSync(progressPath, JSON.stringify(state, null, 2), 'utf8')
}

function buildStepsFromDetail(detail) {
  const pairs = detail.pairedSteps || []
  return pairs.map((p, idx) => {
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
}

function needsRepair(recipe) {
  if (!recipe.xiachufangId) return false
  if (recipe.mediaAligned === true) return false
  const steps = recipe.steps || []
  if (!steps.length) return true
  if (steps.some((s) => s.image && !isValidChuimgUrl(s.image))) return true
  const imgs = steps.map((s) => s.image).filter(Boolean)
  if (!imgs.length) return true
  const last = imgs[imgs.length - 1]
  if (steps.length >= 3 && imgs.filter((u) => u === last).length >= steps.length - 1) return true
  return true
}

async function main() {
  const state = loadProgress()
  const done = new Set(state.doneTitles)
  const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {}
  const index = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : []
  const indexByTitle = new Map(index.map((e) => [e.title, e]))

  /** filePath -> recipe[] */
  const chunkStore = new Map()
  const queue = []

  for (const chunksDir of chunkDirs) {
    if (!fs.existsSync(chunksDir)) continue
    for (const file of fs.readdirSync(chunksDir).filter((f) => f.endsWith('.json'))) {
      const fp = path.join(chunksDir, file)
      const list = JSON.parse(fs.readFileSync(fp, 'utf8'))
      chunkStore.set(fp, list)
      for (const r of list) {
        if (done.has(r.title)) continue
        if (needsRepair(r)) queue.push({ fp, title: r.title, xcfId: r.xiachufangId })
      }
    }
  }

  console.log('repair queue', queue.length, LIMIT ? `(limit ${LIMIT})` : '')
  let fixed = 0

  for (const item of queue) {
    if (LIMIT > 0 && fixed >= LIMIT) break
    const list = chunkStore.get(item.fp)
    const recipe = list.find((r) => r.title === item.title)
    if (!recipe) continue

    console.log(`[${fixed + 1}/${queue.length}] ${recipe.title} (xcf:${item.xcfId})`)

    let detail
    try {
      detail = await fetchRecipeDetail(item.xcfId)
    } catch (e) {
      console.log('  ERR', e.message)
      done.add(recipe.title)
      continue
    }
    await sleep(420)

    if (!detail?.pairedSteps?.length) {
      console.log('  SKIP no paired steps')
      done.add(recipe.title)
      continue
    }

    const coverRaw = detail.cover || detail.pairedSteps.find((p) => p.image)?.image
    if (!coverRaw || !isValidChuimgUrl(coverRaw)) {
      console.log('  SKIP bad cover')
      done.add(recipe.title)
      continue
    }

    try {
      assertRealPhotoUrl(normalizeUrl(coverRaw), 'cover')
    } catch (e) {
      console.log('  SKIP', e.message)
      done.add(recipe.title)
      continue
    }

    const steps = buildStepsFromDetail(detail)
    const image = sized(normalizeUrl(coverRaw))
    const oldTitle = recipe.title
    const newTitle = detail.title || oldTitle

    recipe.steps = steps
    recipe.image = image
    recipe.mediaAligned = true
    recipe.title = newTitle

    cache[newTitle] = {
      recipeId: item.xcfId,
      sourceName: newTitle,
      cover: image,
      stepImages: steps.map((s) => s.image || ''),
      rawStepCount: steps.filter((s) => s.image).length,
      localStepCount: steps.length,
      mediaAligned: true,
    }
    if (oldTitle !== newTitle) delete cache[oldTitle]

    let idxEntry = indexByTitle.get(oldTitle) || indexByTitle.get(newTitle)
    if (idxEntry) {
      idxEntry.image = image
      idxEntry.title = newTitle
      if (oldTitle !== newTitle) indexByTitle.delete(oldTitle)
      indexByTitle.set(newTitle, idxEntry)
    }

    done.add(oldTitle)
    done.add(newTitle)
    fixed++
    state.doneTitles = [...done]

    if (fixed % 25 === 0) {
      saveProgress(state)
      for (const [fp, recipes] of chunkStore) {
        fs.writeFileSync(fp, JSON.stringify(recipes, null, 0), 'utf8')
      }
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8')
      if (index.length) {
        fs.writeFileSync(indexPath, JSON.stringify([...indexByTitle.values()].sort((a, b) => a.id - b.id), null, 0), 'utf8')
      }
      console.log('  checkpoint', fixed)
    }
  }

  for (const [fp, recipes] of chunkStore) {
    fs.writeFileSync(fp, JSON.stringify(recipes, null, 0), 'utf8')
  }
  saveProgress(state)
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8')
  if (index.length) {
    const merged = index.map((e) => indexByTitle.get(e.title) || e)
    fs.writeFileSync(indexPath, JSON.stringify(merged, null, 0), 'utf8')
  }
  console.log('fixed', fixed, 'done total', done.size)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
