#!/usr/bin/env node
/**
 * 为 Vercel 静态托管创建 public/catalog → catalog-cdn 符号链接。
 * 部署后 catalog 地址：https://你的项目.vercel.app/catalog
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const publicDir = path.join(root, 'public')
const linkPath = path.join(publicDir, 'catalog')
const target = path.join(root, 'catalog-cdn')
/** 相对路径 symlink，避免 git/CI 机器绝对路径不一致 */
const relativeTarget = path.relative(publicDir, target)

if (!fs.existsSync(path.join(target, 'meta.json'))) {
  console.warn('skip link-catalog-public: catalog-cdn 不存在')
  process.exit(0)
}

fs.mkdirSync(publicDir, { recursive: true })

try {
  const st = fs.lstatSync(linkPath)
  if (st.isSymbolicLink()) {
    const cur = fs.readlinkSync(linkPath)
    const resolved = path.resolve(path.dirname(linkPath), cur)
    const isRelativeLink =
      cur === relativeTarget || cur === path.normalize(relativeTarget)
    if (resolved === target && isRelativeLink) {
      process.exit(0)
    }
    // 绝对路径或错误目标 → 删除后重建为相对 symlink
  }
  fs.rmSync(linkPath, { recursive: true, force: true })
} catch {
  /* 不存在 */
}

try {
  fs.symlinkSync(relativeTarget, linkPath, 'dir')
  console.log(`linked public/catalog → ${relativeTarget}`)
} catch (err) {
  console.warn('symlink 失败，改为复制 meta 探针（Vercel 请确保 catalog-cdn 在仓库内）:', err.message)
}
