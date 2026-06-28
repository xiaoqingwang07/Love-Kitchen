#!/usr/bin/env node
/**
 * 图床迁移脚本：把下厨房 CDN 的菜谱图，下载后传到你自己的对象存储，并改写代码里的图片地址。
 * ──────────────────────────────────────────────────────────────────────────
 * 它做三件事：
 *   1. 扫描 src/data/*.ts 里所有 i*.chuimg.com 的图片地址；
 *   2. 逐张下载（已缩放到 ~1200px）→ 上传到你的 bucket（同名 key，放在 dish/ 目录下）；
 *   3. 改写源码：把 chuimg 地址换成你图床的地址，并清掉七牛专用的 ?imageView2 缩放参数、
 *      把 stepImages.ts 里的 sized() 改成直接返回（图已经是缩好的，无需运行时再缩）。
 *
 * 适配：任何 S3 兼容存储 —— 腾讯云 COS、阿里云 OSS、Cloudflare R2、七牛、MinIO、AWS S3。
 *
 * ⚠️ 安全网：请在「干净的 git 工作区」上跑（先 git commit），万一结果不对，git checkout . 一键还原。
 * ──────────────────────────────────────────────────────────────────────────
 * 用法（在项目根目录）：
 *   1. npm i -D @aws-sdk/client-s3        # 只装这一个依赖
 *   2. 把下面 CONFIG 填好
 *   3. node scripts/migrate-images.mjs    # 默认 DRY_RUN=true，只报告不改动
 *   4. 确认无误后，把 DRY_RUN 改成 false，再跑一次，真正执行
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { readFile, writeFile, readdir, copyFile } from 'node:fs/promises'
import path from 'node:path'

// ============================== 你只需要改这一块 ==============================
const CONFIG = {
  DRY_RUN: true, // 先 true 跑一遍看报告；确认没问题再改 false 真正执行

  // —— 你的对象存储（以腾讯云 COS 为例，其它家把 endpoint/region 换掉即可）——
  endpoint: 'https://cos.ap-guangzhou.myqcloud.com', // COS: https://cos.<区域>.myqcloud.com ；OSS: https://oss-<区域>.aliyuncs.com
  region: 'ap-guangzhou', // COS 区域，如 ap-guangzhou；OSS 如 oss-cn-hangzhou（去掉 oss- 前缀填 cn-hangzhou 也行，按各家文档）
  bucket: 'love-kitchen-1300000000', // 你的桶名（COS 桶名通常带 APPID 后缀）
  accessKeyId: '你的-SecretId',
  secretAccessKey: '你的-SecretKey',

  // —— 图片对外访问的根地址（务必和上面同一个桶，建议绑自定义域名/CDN）——
  // 最终图片地址 = CDN_BASE + '/dish/' + 文件名
  CDN_BASE: 'https://你的图床域名.com',

  keyPrefix: 'dish/', // 上传到桶里的目录
  concurrency: 6, // 并发下载/上传数，网络好可调大
}
// ===========================================================================

const DATA_DIR = path.resolve('src/data')
const SIZE_QUERY = '?imageView2/1/w/1200/h/760/interlace/1/q/85' // 下载时用，拿到 ~1200px 版本
// 匹配 chuimg 图片「基础地址」（不含 ? 之后的参数）
const CHUIMG_BASE_RE = /https:\/\/i\d\.chuimg\.com\/[A-Za-z0-9_]+\.(?:jpg|jpeg|png|webp)/g
// 匹配挂在图片地址后的七牛缩放参数，迁移后需整段删除
const IMAGEVIEW2_RE = /\?imageView2\/[^'"\s)]*/g

const s3 = new S3Client({
  endpoint: CONFIG.endpoint,
  region: CONFIG.region,
  credentials: { accessKeyId: CONFIG.accessKeyId, secretAccessKey: CONFIG.secretAccessKey },
  forcePathStyle: true, // COS/OSS/MinIO 多数需要 path-style
})

const fileNameOf = (baseUrl) => baseUrl.split('/').pop()
const keyOf = (baseUrl) => CONFIG.keyPrefix + fileNameOf(baseUrl)
const newUrlOf = (baseUrl) => `${CONFIG.CDN_BASE.replace(/\/$/, '')}/${keyOf(baseUrl)}`
const contentTypeOf = (name) =>
  name.endsWith('.png') ? 'image/png' : name.endsWith('.webp') ? 'image/webp' : 'image/jpeg'

async function listDataFiles() {
  const names = await readdir(DATA_DIR)
  return names.filter((n) => n.endsWith('.ts')).map((n) => path.join(DATA_DIR, n))
}

async function collectBaseUrls(files) {
  const set = new Set()
  for (const f of files) {
    const text = await readFile(f, 'utf8')
    const m = text.match(CHUIMG_BASE_RE)
    if (m) for (const u of m) set.add(u)
  }
  return [...set]
}

async function objectExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: CONFIG.bucket, Key: key }))
    return true
  } catch {
    return false
  }
}

async function uploadOne(baseUrl) {
  const key = keyOf(baseUrl)
  if (await objectExists(key)) return { baseUrl, key, skipped: true }

  const res = await fetch(baseUrl + SIZE_QUERY)
  if (!res.ok) throw new Error(`下载失败 ${res.status}：${baseUrl}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await s3.send(
    new PutObjectCommand({
      Bucket: CONFIG.bucket,
      Key: key,
      Body: buf,
      ContentType: contentTypeOf(key),
      CacheControl: 'public, max-age=31536000',
    })
  )
  return { baseUrl, key, bytes: buf.length }
}

async function runPool(items, worker, concurrency) {
  let i = 0
  let done = 0
  let failed = 0
  const total = items.length
  async function next() {
    const idx = i++
    if (idx >= total) return
    try {
      const r = await worker(items[idx])
      done++
      const tag = r.skipped ? '已存在跳过' : `${(r.bytes / 1024).toFixed(0)}KB`
      process.stdout.write(`\r  [${done + failed}/${total}] ${tag}              `)
    } catch (e) {
      failed++
      console.error(`\n  ✗ ${e.message}`)
    }
    await next()
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, total) }, next))
  process.stdout.write('\n')
  return { done, failed }
}

async function rewriteSources(files) {
  for (const f of files) {
    let text = await readFile(f, 'utf8')
    const before = text
    // 1) chuimg 基础地址 → 新图床地址
    text = text.replace(CHUIMG_BASE_RE, (u) => newUrlOf(u))
    // 2) 删掉残留的七牛 ?imageView2 参数（exactDishImages 里内联的）
    text = text.replace(IMAGEVIEW2_RE, '')
    if (text === before) continue

    if (CONFIG.DRY_RUN) {
      console.log(`  将改写：${path.basename(f)}`)
    } else {
      await copyFile(f, f + '.bak')
      await writeFile(f, text, 'utf8')
      console.log(`  ✓ 已改写 ${path.basename(f)}（原件备份为 ${path.basename(f)}.bak）`)
    }
  }

  // 3) 把 stepImages.ts 的 sized() 改成直接返回（图已缩好，无需再拼参数）
  const stepFile = path.join(DATA_DIR, 'stepImages.ts')
  let step = await readFile(stepFile, 'utf8')
  const SIZED_OLD = '`${base}?imageView2/1/w/${w}/h/760/interlace/1/q/85`'
  if (step.includes(SIZED_OLD)) {
    if (CONFIG.DRY_RUN) {
      console.log('  将把 stepImages.ts 的 sized() 改为直接返回 base')
    } else {
      step = step.replace(SIZED_OLD, '`${base}`')
      await writeFile(stepFile, step, 'utf8')
      console.log('  ✓ 已调整 sized()')
    }
  }
}

async function main() {
  console.log(`\n图床迁移 ${CONFIG.DRY_RUN ? '【演练模式 DRY_RUN，不会改动任何东西】' : '【正式执行】'}\n`)
  const files = await listDataFiles()
  const baseUrls = await collectBaseUrls(files)
  console.log(`扫描到 ${baseUrls.length} 张待迁移图片。`)
  if (baseUrls.length === 0) {
    console.log('没有发现 chuimg 图片，可能已经迁移过了。')
    return
  }

  if (CONFIG.DRY_RUN) {
    console.log('\n示例（前 3 张的去向）：')
    for (const u of baseUrls.slice(0, 3)) console.log(`  ${u}\n    → ${newUrlOf(u)}`)
    console.log('\n[演练] 跳过实际下载/上传。下面预览源码改写：')
    await rewriteSources(files)
    console.log('\n确认无误后：把 CONFIG.DRY_RUN 改成 false，再跑一次即可真正执行。')
    return
  }

  console.log('\n开始下载并上传…')
  const { done, failed } = await runPool(baseUrls, uploadOne, CONFIG.concurrency)
  console.log(`上传完成：成功 ${done}，失败 ${failed}。`)
  if (failed > 0) {
    console.log('有失败项，先排查（多为网络或权限），全部成功后再改写源码，避免出现死链。')
    return
  }

  console.log('\n改写源码中…')
  await rewriteSources(files)
  console.log('\n✅ 全部完成。请本地预览确认图片正常，然后 git commit 提交。')
  console.log('   如需还原：git checkout src/data/ （或删掉 *.bak 备份）。')
}

main().catch((e) => {
  console.error('\n迁移中断：', e)
  process.exit(1)
})
