#!/usr/bin/env node
/** 仅 emit legacy 200 道配图到 TS，catalog 配图已内嵌 chunk */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const cachePath = path.join(__dirname, 'recipe-image-cache.json')

function loadLegacyTitles() {
  const titles = new Set()
  for (const file of ['recipesLegacy.ts', 'additionalRecipes.ts']) {
    const ts = fs.readFileSync(path.join(root, 'src/data', file), 'utf8')
    for (const m of ts.matchAll(/title:\s*'([^']+)'/g)) titles.add(m[1].trim())
  }
  return titles
}

function assertReal(url) {
  if (!/i\d+\.chuimg\.com/i.test(url || '')) throw new Error('bad url')
}

const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
const legacyTitles = loadLegacyTitles()
const coverMap = {}
const stepMap = {}

for (const title of legacyTitles) {
  const entry = cache[title]
  if (!entry?.stepImages?.length) continue
  coverMap[title] = entry.cover
  stepMap[title] = entry.stepImages
}

const coverLines = [
  '/**',
  ' * 200 道 legacy 精品菜谱封面（下厨房 CDN）。catalog 2000+ 配图内嵌 chunk。',
  ' */',
  'export const EXACT_DISH_IMAGE_OVERRIDES: Record<string, string> = {',
]
for (const [title, url] of Object.entries(coverMap)) {
  assertReal(url)
  coverLines.push(`  '${title}': '${url}',`)
}
coverLines.push('}', '')
fs.writeFileSync(path.join(root, 'src/data/exactDishImages.ts'), coverLines.join('\n'), 'utf8')

const stepLines = [
  '/**',
  ' * legacy 200 道步骤图。catalog 步骤图内嵌 chunk recipe.steps[].image。',
  ' */',
  'const sized = (base: string, w = 1200) =>',
  "  `${base}?imageView2/1/w/${w}/h/760/interlace/1/q/85`",
  '',
  'export const STEP_IMAGE_MAP: Record<string, string[]> = {',
]
for (const [title, urls] of Object.entries(stepMap)) {
  for (const u of urls) assertReal(u)
  const arr = urls.map((u) => `sized('${u.split('?')[0]}')`).join(', ')
  stepLines.push(`  '${title}': [${arr}],`)
}
stepLines.push(
  '}',
  '',
  'export function getStepImages(title: string): string[] {',
  '  return STEP_IMAGE_MAP[title] ?? []',
  '}',
  '',
  'export function hasStepImages(title: string): boolean {',
  '  return getStepImages(title).length > 0',
  '}',
  ''
)
fs.writeFileSync(path.join(root, 'src/data/stepImages.ts'), stepLines.join('\n'), 'utf8')
console.log('legacy covers', Object.keys(coverMap).length, 'steps', Object.keys(stepMap).length)
