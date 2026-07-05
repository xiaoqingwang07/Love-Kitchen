#!/usr/bin/env node
/**
 * 审计 catalog 数据质量，输出统计与样例。
 *
 * 用法：node scripts/audit-catalog-quality.mjs [--json]
 * 扫描目录（存在则纳入）：
 *   catalog-cdn/
 *   src/packageCatalogA/catalog/
 *   src/packageCatalogB/catalog/
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  hasTitleIssue,
  hasTimeIssue,
  countIngredientIssues,
  countBadStepUrls,
  computeQualityScore,
} from './lib/catalog-quality-rules.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const asJson = process.argv.includes('--json')

const CATALOG_ROOTS = [
  path.join(root, 'catalog-cdn'),
  path.join(root, 'src/packageCatalogA/catalog'),
  path.join(root, 'src/packageCatalogB/catalog'),
]

function readJsonSafe(fp) {
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf8'))
  } catch {
    return null
  }
}

function discoverCatalog() {
  for (const dir of CATALOG_ROOTS) {
    const indexPath = path.join(dir, 'index.json')
    const chunksDir = path.join(dir, 'chunks')
    if (fs.existsSync(indexPath)) {
      return { dir, indexPath, chunksDir: fs.existsSync(chunksDir) ? chunksDir : null }
    }
  }
  return null
}

function loadAllRecipes(catalog) {
  const index = readJsonSafe(catalog.indexPath)
  if (!Array.isArray(index)) return { index: [], recipes: [] }

  const recipes = []
  if (catalog.chunksDir) {
    const chunkFiles = fs.readdirSync(catalog.chunksDir).filter((f) => f.endsWith('.json'))
    for (const file of chunkFiles) {
      const list = readJsonSafe(path.join(catalog.chunksDir, file))
      if (Array.isArray(list)) recipes.push(...list)
    }
  }

  if (recipes.length === 0) {
    for (const entry of index) {
      recipes.push({
        id: entry.id,
        title: entry.title,
        ingredients: entry.ingredients,
        time: entry.time,
        difficulty: entry.difficulty,
        image: entry.image,
        steps: [],
      })
    }
  }

  return { index, recipes }
}

function audit(recipes) {
  const imageMap = new Map()
  for (const r of recipes) {
    const img = r.image?.trim()
    if (img) imageMap.set(img, (imageMap.get(img) || 0) + 1)
  }

  let titleIssues = 0
  let displayTitleIssues = 0
  let timeIssues = 0
  let ingredientIssues = 0
  let badStepUrls = 0
  let lowQuality = 0
  const samples = { title: [], displayTitle: [], time: [], ingredient: [], duplicateImage: [] }

  for (const r of recipes) {
    const displayTitle = r.displayTitle || r.title
    if (hasTitleIssue(r.title)) {
      titleIssues++
      if (samples.title.length < 5) samples.title.push(r.title)
    }
    if (hasTitleIssue(displayTitle)) {
      displayTitleIssues++
      if (samples.displayTitle.length < 5) samples.displayTitle.push(displayTitle)
    }
    if (hasTimeIssue(r)) {
      timeIssues++
      if (samples.time.length < 5) samples.time.push({ title: r.title, time: r.time, difficulty: r.difficulty })
    }
    const badIng = countIngredientIssues(r)
    if (badIng > 0) {
      ingredientIssues++
      if (samples.ingredient.length < 5) samples.ingredient.push({ title: r.title, badIng })
    }
    badStepUrls += countBadStepUrls(r)
    const dup = r.image ? imageMap.get(r.image.trim()) || 1 : 1
    const qs = computeQualityScore({ ...r, title: displayTitle, displayTitle }, dup)
    if (qs < 60) lowQuality++
    if (dup > 50 && samples.duplicateImage.length < 5) {
      samples.duplicateImage.push({ title: r.title, image: r.image, dup })
    }
  }

  const total = recipes.length
  return {
    total,
    titleIssues,
    titleIssueRate: total ? titleIssues / total : 0,
    displayTitleIssues,
    displayTitleIssueRate: total ? displayTitleIssues / total : 0,
    timeIssues,
    timeIssueRate: total ? timeIssues / total : 0,
    ingredientIssueRecipes: ingredientIssues,
    ingredientIssueRate: total ? ingredientIssues / total : 0,
    badStepUrls,
    lowQuality,
    lowQualityRate: total ? lowQuality / total : 0,
    duplicateImagesOver50: [...imageMap.entries()].filter(([, c]) => c > 50).length,
    samples,
  }
}

const catalog = discoverCatalog()
if (!catalog) {
  console.warn('未找到 catalog index.json，跳过审计（将依赖运行时 qualityScore）')
  process.exit(0)
}

const { recipes } = loadAllRecipes(catalog)
const report = audit(recipes)
report.catalogDir = path.relative(root, catalog.dir)

if (asJson) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(`Catalog 质量审计：${report.catalogDir}`)
  console.log(`总量：${report.total}`)
  console.log(`展示标题异常：${report.displayTitleIssues} (${(report.displayTitleIssueRate * 100).toFixed(1)}%)`)
  console.log(`原始标题异常：${report.titleIssues} (${(report.titleIssueRate * 100).toFixed(1)}%)`)
  console.log(`耗时/难度异常：${report.timeIssues} (${(report.timeIssueRate * 100).toFixed(1)}%)`)
  console.log(`食材异常菜谱：${report.ingredientIssueRecipes} (${(report.ingredientIssueRate * 100).toFixed(1)}%)`)
  console.log(`坏步骤图 URL：${report.badStepUrls}`)
  console.log(`低质量(qualityScore<60)：${report.lowQuality}`)
  console.log(`复用>50次的封面图：${report.duplicateImagesOver50} 张`)
}

const reportPath = path.join(root, 'catalog-cdn/quality-report.json')
try {
  fs.writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), ...report }, null, 2))
} catch {
  /* catalog-cdn 可能只读 */
}
