#!/usr/bin/env node
/** 重新抓取 catalog 中菜品的真实步骤图，修正 cache 里损坏的 URL */
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
const chunkPath = path.join(root, 'src/packageCatalog/catalog/chunks')

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

const chunk = JSON.parse(fs.readFileSync(chunkPath, 'utf8'))
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))

for (const recipe of chunk) {
  const xcfId = recipe.xiachufangId
  if (!xcfId) continue
  console.log('fix', recipe.title, xcfId)
  const detail = await fetchRecipeDetail(xcfId)
  await sleep(500)
  if (!detail?.cover || !detail.stepImages.length) {
    console.log('  SKIP no photos')
    continue
  }
  try {
    assertRealPhotoUrl(detail.cover, recipe.title)
    detail.stepImages.forEach((u, i) => assertRealPhotoUrl(normalizeUrl(u), `step${i}`))
  } catch (e) {
    console.log('  SKIP', e.message)
    continue
  }
  const stepUrls = alignStepImages(
    detail.stepImages.map((u) => normalizeUrl(u)),
    recipe.steps.length
  ).map((u) => sized(u))
  cache[recipe.title] = {
    recipeId: xcfId,
    sourceName: detail.title,
    cover: sized(normalizeUrl(detail.cover)),
    stepImages: stepUrls,
    rawStepCount: detail.stepImages.length,
    localStepCount: recipe.steps.length,
  }
  console.log('  OK', stepUrls.length, 'steps')
}

fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8')
console.log('done', chunk.length)
