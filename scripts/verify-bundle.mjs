#!/usr/bin/env node
/**
 * weapp 构建后检查 common.js 是否包含完整 legacy 菜谱（含 steps）。
 * 不依赖 minify 后的中文，用 steps 数组特征计数。
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const commonPath = path.join(root, 'dist/common.js')

if (!fs.existsSync(path.join(root, 'dist/app.json'))) {
  console.warn('skip verify-bundle: dist 非 weapp 产物')
  process.exit(0)
}

if (!fs.existsSync(commonPath)) {
  console.error('FAIL verify-bundle: dist/common.js 不存在')
  process.exit(1)
}

const content = fs.readFileSync(commonPath, 'utf8')
const stepsArrays = (content.match(/steps:\[/g) || []).length
const hasLegacyId = content.includes('id:1,')
const bytes = fs.statSync(commonPath).size
const kiB = Math.round(bytes / 1024)

const failures = []
if (!hasLegacyId) failures.push('common.js 未包含 legacy 菜谱 id:1')
if (stepsArrays < 50) {
  failures.push(`common.js steps 数组过少（${stepsArrays}，期望 ≥50）`)
}

if (failures.length) {
  console.error('FAIL verify-bundle:')
  for (const f of failures) console.error(' -', f)
  process.exit(1)
}

console.log('verify-bundle passed:', {
  commonJsKiB: kiB,
  stepsArrays,
  note: bytes > 244 * 1024 ? 'webpack 体积 warn 预期内（legacy 200 道含 steps）' : 'ok',
})
