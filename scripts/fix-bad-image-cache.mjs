#!/usr/bin/env node
/** 修复 cache 中损坏的步骤图 URL（srcset 解析问题） */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  sleep,
  fetchRecipeDetail,
  sized,
  assertRealPhotoUrl,
  normalizeUrl,
} from './xcf-lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const cachePath = path.join(__dirname, 'recipe-image-cache.json')
const chunkDirs = [
  path.join(root, 'src/packageCatalogA/catalog/chunks'),
  path.join(root, 'src/packageCatalogB/catalog/chunks'),
]

function isBad(entry) {
  return entry?.stepImages?.some((u) => u.includes('/w/0/h/'))
}

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

const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
const titleToRecipe = new Map()

for (const chunksDir of chunkDirs) {
  if (!fs.existsSync(chunksDir)) continue
  for (const file of fs.readdirSync(chunksDir).filter((f) => f.endsWith('.json'))) {
    const list = JSON.parse(fs.readFileSync(path.join(chunksDir, file), 'utf8'))
    for (const r of list) {
      if (r.xiachufangId) titleToRecipe.set(r.title, r)
    }
  }
}

const badTitles = Object.keys(cache).filter((t) => isBad(cache[t]))
console.log('bad entries', badTitles.length)

let fixed = 0
for (const title of badTitles) {
  const recipe = titleToRecipe.get(title)
  const xcfId = recipe?.xiachufangId || cache[title]?.recipeId
  if (!xcfId || xcfId === 'legacy') {
    console.log('SKIP no xcf id', title)
    continue
  }
  console.log('fix', title, xcfId)
  const detail = await fetchRecipeDetail(xcfId)
  await sleep(450)
  if (!detail?.cover || !detail.stepImages.length) {
    console.log('  SKIP no photos')
    continue
  }
  const stepCount = recipe?.steps?.length || cache[title]?.localStepCount || detail.stepTexts.length
  const stepUrls = alignStepImages(
    detail.stepImages.map((u) => normalizeUrl(u)),
    stepCount
  ).map((u) => sized(u))
  cache[title] = {
    recipeId: xcfId,
    sourceName: detail.title,
    cover: sized(normalizeUrl(detail.cover)),
    stepImages: stepUrls,
    rawStepCount: detail.stepImages.length,
    localStepCount: stepCount,
  }
  fixed++
  console.log('  OK', stepUrls.length)
}

fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8')
console.log('fixed', fixed)
