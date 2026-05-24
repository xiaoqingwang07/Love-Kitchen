#!/usr/bin/env node
/** 将封面图写入 catalog index.json（列表页展示用，与 chunk 内嵌图同源） */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const cachePath = path.join(__dirname, 'recipe-image-cache.json')

const cache = fs.existsSync(cachePath)
  ? JSON.parse(fs.readFileSync(cachePath, 'utf8'))
  : {}

const indexPaths = [
  path.join(root, 'src/packageCatalogA/catalog/index.json'),
  path.join(root, 'src/packageCatalogB/catalog/index.json'),
]

let patched = 0
for (const fp of indexPaths) {
  if (!fs.existsSync(fp)) continue
  const index = JSON.parse(fs.readFileSync(fp, 'utf8'))
  for (const entry of index) {
    const cover = cache[entry.title]?.cover || entry.image
    if (cover && /i\d+\.chuimg\.com/i.test(cover)) {
      entry.image = cover
      patched++
    }
  }
  fs.writeFileSync(fp, JSON.stringify(index, null, 0), 'utf8')
  console.log('patched index', path.basename(path.dirname(fp)), index.length)
}

console.log('entries with cover in index', patched)
