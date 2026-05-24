#!/usr/bin/env node
/**
 * 从 exactDishImages.ts + stepImages.ts 重建 legacy 配图 cache，与现有 cache 合并。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const cachePath = path.join(__dirname, 'recipe-image-cache.json')

function parseCoverMap(ts) {
  const map = {}
  for (const m of ts.matchAll(/'([^']+)':\s*'(https:[^']+)'/g)) {
    if (m[2].includes('chuimg')) map[m[1]] = m[2]
  }
  return map
}

function parseStepMap(ts) {
  const map = {}
  for (const m of ts.matchAll(/'([^']+)':\s*\[([^\]]+)\]/g)) {
    const title = m[1]
    const urls = [...m[2].matchAll(/sized\('([^']+)'\)/g)].map((x) => {
      const base = x[1]
      return `${base}?imageView2/1/w/1200/h/760/interlace/1/q/85`
    })
    if (urls.length) map[title] = urls
  }
  return map
}

const coverTs = fs.readFileSync(path.join(root, 'src/data/exactDishImages.ts'), 'utf8')
const stepTs = fs.readFileSync(path.join(root, 'src/data/stepImages.ts'), 'utf8')
const covers = parseCoverMap(coverTs)
const steps = parseStepMap(stepTs)

let existing = {}
if (fs.existsSync(cachePath)) {
  try {
    existing = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
  } catch {
    existing = {}
  }
}

const rebuilt = { ...existing }
let added = 0
for (const title of Object.keys(steps)) {
  if (rebuilt[title]?.stepImages?.length >= steps[title].length && rebuilt[title]?.cover) continue
  rebuilt[title] = {
    recipeId: rebuilt[title]?.recipeId ?? 'legacy',
    sourceName: title,
    cover: covers[title] || steps[title][0],
    stepImages: steps[title],
    rawStepCount: steps[title].length,
    localStepCount: steps[title].length,
  }
  added++
}

fs.writeFileSync(cachePath, JSON.stringify(rebuilt, null, 2), 'utf8')
console.log('cache entries', Object.keys(rebuilt).length, 'rebuilt from ts', added)
