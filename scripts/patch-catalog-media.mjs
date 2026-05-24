#!/usr/bin/env node
/**
 * 将 recipe-image-cache 中的封面/步骤图写入 catalog chunk。
 * 规则：步骤图严格 1:1，禁止用最后一张图填充缺失步骤。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { isValidChuimgUrl, sized, normalizeUrl } from './xcf-lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const cachePath = path.join(__dirname, 'recipe-image-cache.json')
const chunkDirs = [
  path.join(root, 'src/packageCatalogA/catalog/chunks'),
  path.join(root, 'src/packageCatalogB/catalog/chunks'),
]

const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
let patched = 0
let strippedBad = 0

for (const chunksDir of chunkDirs) {
  if (!fs.existsSync(chunksDir)) continue
  for (const file of fs.readdirSync(chunksDir).filter((f) => f.endsWith('.json'))) {
    const fp = path.join(chunksDir, file)
    const list = JSON.parse(fs.readFileSync(fp, 'utf8'))
    for (const recipe of list) {
      const entry = cache[recipe.title]
      if (!entry?.cover) continue

      const cover = isValidChuimgUrl(entry.cover) ? entry.cover : ''
      if (cover) recipe.image = cover
      else strippedBad++

      if (recipe.steps?.length && entry.stepImages?.length) {
        recipe.steps = recipe.steps.map((step, idx) => {
          const raw = entry.stepImages[idx] || ''
          const image = raw && isValidChuimgUrl(raw) ? raw : undefined
          return image ? { ...step, image } : { ...step, image: undefined }
        })
        recipe.mediaAligned = entry.mediaAligned === true
      }
      patched++
    }
    fs.writeFileSync(fp, JSON.stringify(list, null, 0), 'utf8')
    console.log('patched', file, list.length)
  }
}

console.log('recipes with media', patched, 'stripped bad cover', strippedBad)
