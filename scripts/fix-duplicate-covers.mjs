#!/usr/bin/env node
/**
 * 修复 catalog 重复封面：同一张图被 ≥3 道菜用作封面时，
 * 改用该菜自己的步骤图（优先最后一步 = 成品图；要求该图全局不重复）。
 * 同步更新 chunks 与 index.json，保持 image 一致。
 */
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const cdnDir = path.join(root, 'catalog-cdn')
const DUP_THRESHOLD = 3

const chunks = []
for (let i = 0; ; i++) {
  const p = path.join(cdnDir, 'chunks', `chunk-${i}.json`)
  if (!fs.existsSync(p)) break
  chunks.push({ path: p, data: JSON.parse(fs.readFileSync(p, 'utf8')) })
}

const coverCount = new Map()
const imgKey = (u) => (u || '').split('?')[0]
for (const { data } of chunks) {
  for (const r of data) {
    const k = imgKey(r.image)
    if (k) coverCount.set(k, (coverCount.get(k) || 0) + 1)
  }
}

let fixed = 0
let unfixable = []
const newCover = new Map() // id -> image

for (const { data } of chunks) {
  for (const r of data) {
    const k = imgKey(r.image)
    if (!k || (coverCount.get(k) || 0) < DUP_THRESHOLD) continue
    const steps = Array.isArray(r.steps) ? r.steps : []
    // 从最后一步往前找：有图、且这张图不是全局重复图
    const candidate = [...steps]
      .reverse()
      .find((s) => s && s.image && (coverCount.get(imgKey(s.image)) || 0) < DUP_THRESHOLD)
    if (candidate) {
      r.image = candidate.image
      r.mediaAligned = true
      newCover.set(String(r.id), candidate.image)
      fixed++
    } else {
      // 无法修复：降质，避免出现在推荐位
      r.qualityScore = Math.min(r.qualityScore ?? 80, 40)
      unfixable.push(r.displayTitle || r.title)
    }
  }
}

for (const { path: p, data } of chunks) {
  fs.writeFileSync(p, JSON.stringify(data))
}

const idxPath = path.join(cdnDir, 'index.json')
const index = JSON.parse(fs.readFileSync(idxPath, 'utf8'))
let idxFixed = 0
for (const item of index) {
  const img = newCover.get(String(item.id))
  if (img) {
    item.image = img
    idxFixed++
  }
}
fs.writeFileSync(idxPath, JSON.stringify(index))

const meta = JSON.parse(fs.readFileSync(path.join(cdnDir, 'meta.json'), 'utf8'))
meta.version = (meta.version || 1) + 1
meta.generatedAt = new Date().toISOString()
fs.writeFileSync(path.join(cdnDir, 'meta.json'), JSON.stringify(meta, null, 2))

console.log(`封面修复: ${fixed} 道（index 同步 ${idxFixed} 条）`)
console.log(`无法修复已降质: ${unfixable.length} 道`, unfixable.slice(0, 5))
console.log(`meta.version -> ${meta.version}`)
