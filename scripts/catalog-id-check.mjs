/**
 * P1 catalog ID 回归：legacy 1–200 与 catalog 索引 id 分离
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const LEGACY_MAX = 200
const OFFSET = 100_000

function toRuntime(catalogIndexId) {
  return catalogIndexId > LEGACY_MAX ? catalogIndexId : OFFSET + catalogIndexId
}

function normalizeTitleKey(title) {
  return String(title || '').replace(/\s/g, '').toLowerCase()
}

const legacySrc = fs.readFileSync(path.join(root, 'src/data/recipesLegacy.ts'), 'utf8')
const additionalSrc = fs.readFileSync(path.join(root, 'src/data/additionalRecipes.ts'), 'utf8')
const legacyTitles = new Set()
for (const src of [legacySrc, additionalSrc]) {
  const re = /title:\s*['"]([^'"]+)['"]/g
  let m
  while ((m = re.exec(src))) legacyTitles.add(normalizeTitleKey(m[1]))
}

const index = JSON.parse(fs.readFileSync(path.join(root, 'catalog-cdn/index.json'), 'utf8'))
const catalogOnly = index.filter((e) => !legacyTitles.has(normalizeTitleKey(e.displayTitle || e.title)))

const runtimeIds = new Set()
const legacyRuntimeIds = new Set(Array.from({ length: LEGACY_MAX }, (_, i) => i + 1))

let dupRuntime = null
for (const entry of catalogOnly) {
  const runtimeId = toRuntime(entry.id)
  if (runtimeIds.has(runtimeId)) {
    dupRuntime = runtimeId
    break
  }
  runtimeIds.add(runtimeId)
  if (legacyRuntimeIds.has(runtimeId)) {
    console.error(`FAIL catalog-only「${entry.title}」runtime id ${runtimeId} 与 legacy 冲突`)
    process.exit(1)
  }
  if (entry.id <= LEGACY_MAX && runtimeId === entry.id) {
    console.error(`FAIL catalog 索引 id=${entry.id} 不得等于 runtime id（会与 legacy 撞号）`)
    process.exit(1)
  }
  if (entry.id > LEGACY_MAX && runtimeId !== entry.id) {
    console.error(`FAIL catalog id=${entry.id} runtime 应等于 catalog id`)
    process.exit(1)
  }
}

const cat1 = catalogOnly.find((e) => e.id === 1) || index.find((e) => e.id === 1)
if (cat1 && !legacyTitles.has(normalizeTitleKey(cat1.displayTitle || cat1.title))) {
  const rt = toRuntime(1)
  if (rt === 1) {
    console.error('FAIL catalog 索引 id=1 的 runtime 不得为 1（legacy 红烧肉已占用）')
    process.exit(1)
  }
  if (rt !== 100001) {
    console.error(`FAIL catalog id=1 runtime 应为 100001，实际 ${rt}`)
    process.exit(1)
  }
}

if (dupRuntime != null) {
  console.error(`FAIL catalog-only 出现重复 runtime id: ${dupRuntime}`)
  process.exit(1)
}

console.log(
  `catalog-id-check passed: legacyTitles=${legacyTitles.size} catalogOnly=${catalogOnly.length} sampleRuntime(id=1)=${toRuntime(1)}`
)
