#!/usr/bin/env node
/**
 * 清洗 catalog：写入 displayTitle、qualityScore、修正明显坏数据。
 * 保留 originalTitle / originalMeta，不删除原始信息。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  cleanDisplayTitle,
  computeQualityScore,
  estimateMinTime,
  hasTimeIssue,
  hasTitleIssue,
  sanitizeIngredients,
} from './lib/catalog-quality-rules.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const CATALOG_ROOTS = [
  path.join(root, 'catalog-cdn'),
  path.join(root, 'src/packageCatalogA/catalog'),
  path.join(root, 'src/packageCatalogB/catalog'),
]

function discoverCatalog() {
  for (const dir of CATALOG_ROOTS) {
    const indexPath = path.join(dir, 'index.json')
    if (fs.existsSync(indexPath)) return { dir, indexPath, chunksDir: path.join(dir, 'chunks') }
  }
  return null
}

function resolveDisplayTitle(recipe, originalTitle) {
  let displayTitle = cleanDisplayTitle(originalTitle)
  if (!hasTitleIssue(displayTitle)) return displayTitle
  const quoted = originalTitle.match(/[【「『""]([^】」』""]{2,14})[】」』""]/)
  if (quoted) {
    const q = cleanDisplayTitle(quoted[1])
    if (!hasTitleIssue(q)) return q
  }
  const ing = Array.isArray(recipe.ingredients) ? recipe.ingredients[0]?.name : ''
  if (ing && String(ing).trim().length >= 2) {
    const guess = cleanDisplayTitle(`${String(ing).trim()}小炒`)
    if (!hasTitleIssue(guess)) return guess
  }
  return displayTitle
}

function enrichRecipe(recipe, imageDupCount) {
  const originalTitle = recipe.originalTitle || recipe.title
  const displayTitle = resolveDisplayTitle(recipe, originalTitle)
  if (Array.isArray(recipe.ingredients)) {
    recipe.ingredients = sanitizeIngredients(recipe.ingredients)
  }
  if (hasTimeIssue(recipe)) recipe.time = estimateMinTime(recipe)
  recipe.originalTitle = originalTitle
  recipe.displayTitle = displayTitle
  recipe.title = displayTitle || originalTitle.slice(0, 16)
  recipe.qualityScore = computeQualityScore(
    { ...recipe, originalTitle, displayTitle, title: originalTitle },
    imageDupCount
  )
  return recipe
}

const catalog = discoverCatalog()
if (!catalog) {
  console.warn('未找到 catalog，跳过清洗')
  process.exit(0)
}

const index = JSON.parse(fs.readFileSync(catalog.indexPath, 'utf8'))
const imageMap = new Map()
for (const entry of index) {
  const img = entry.image?.trim()
  if (img) imageMap.set(img, (imageMap.get(img) || 0) + 1)
}

let patchedIndex = 0
for (const entry of index) {
  const dup = entry.image ? imageMap.get(entry.image.trim()) || 1 : 1
  enrichRecipe(entry, dup)
  patchedIndex++
}

fs.writeFileSync(catalog.indexPath, JSON.stringify(index, null, 0), 'utf8')
console.log('patched index entries', patchedIndex)

if (fs.existsSync(catalog.chunksDir)) {
  let patchedChunks = 0
  for (const file of fs.readdirSync(catalog.chunksDir).filter((f) => f.endsWith('.json'))) {
    const fp = path.join(catalog.chunksDir, file)
    const list = JSON.parse(fs.readFileSync(fp, 'utf8'))
    for (const recipe of list) {
      const dup = recipe.image ? imageMap.get(recipe.image.trim()) || 1 : 1
      enrichRecipe(recipe, dup)
      patchedChunks++
    }
    fs.writeFileSync(fp, JSON.stringify(list, null, 0), 'utf8')
    console.log('patched chunk', file, list.length)
  }
  console.log('patched chunk recipes', patchedChunks)
}
