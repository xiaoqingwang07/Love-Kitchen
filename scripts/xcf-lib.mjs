/**
 * 下厨房移动端抓取共用工具（搜索 / 详情 / 真实图校验）
 */
export const MOBILE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  Referer: 'https://m.xiachufang.com/',
}

export const TIMEOUT_MS = 15000

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function fetchText(url, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, { headers: MOBILE_HEADERS, signal: ctrl.signal })
      if (res.status === 429) {
        await sleep(8000 * (i + 1))
        continue
      }
      if (!res.ok) {
        if (i < retries) {
          await sleep(1000 * (i + 1))
          continue
        }
        return ''
      }
      return await res.text()
    } catch {
      if (i < retries) {
        await sleep(1000 * (i + 1))
        continue
      }
      return ''
    } finally {
      clearTimeout(t)
    }
  }
  return ''
}

export function normalizeUrl(u) {
  let url = (u || '').replace(/&amp;/g, '&').trim()
  // 部分页面 step-cover 为 srcset，只取第一张 chuimg 图
  if (url.includes(',') && /chuimg/i.test(url)) {
    const m = url.match(/(?:https?:)?\/\/[^,\s"']+chuimg[^,\s"']+/i)
    if (m) url = m[0]
  }
  if (url.startsWith('//')) url = `https:${url}`
  return url.split('?')[0]
}

export function sized(url, w = 1200, h = 760) {
  return `${normalizeUrl(url)}?imageView2/1/w/${w}/h/${h}/interlace/1/q/85`
}

export function assertRealPhotoUrl(url, label = 'image') {
  if (!isValidChuimgUrl(url)) {
    throw new Error(`[${label}] 非下厨房真实图: ${String(url).slice(0, 80)}`)
  }
}

/** 合法的下厨房 CDN 图（排除 srcset 解析损坏的 URL） */
export function isValidChuimgUrl(url) {
  const u = String(url || '')
  if (!/i\d+\.chuimg\.com/i.test(u)) return false
  if (/\/w\/\d+\/h\/(?:\/|$)/i.test(u)) return false
  if (/\.(?:jpg|png|webp)\/interlace/i.test(u)) return false
  return true
}

/**
 * 按 DOM step 块 1:1 解析步骤文字 + 步骤图（禁止全局 dedupe，避免错位）
 */
export function parseMobileRecipeSteps(html) {
  const steps = []
  const blocks = html.split(/class="step step"/)
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i]
    const textM =
      block.match(/class="step-text"[^>]*>([\s\S]*?)<\/p>/i) ||
      block.match(/class="step-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    const coverM = block.match(
      /class="step-cover[^"]*"[^>]*style="[^"]*background-image:url\(([^)]+)\)/i
    )
    const text = textM?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    const image = coverM?.[1] ? normalizeUrl(coverM[1]) : ''
    if (text && text.length > 1) {
      steps.push({ text, image: image && isValidChuimgUrl(image) ? image : '' })
    }
  }
  return steps
}

/** @deprecated 仅兼容旧脚本；新代码请用 parseMobileRecipeSteps 逐步绑定 */
export function alignStepImages(urls, stepCount) {
  if (!urls.length || stepCount <= 0) return []
  if (urls.length === stepCount) return [...urls]
  // 不再用最后一张图补齐 — 只取前 stepCount 张或逐步 zip
  if (urls.length > stepCount) return urls.slice(0, stepCount)
  return urls.map((u, i) => (i < urls.length ? u : ''))
}

export async function searchRecipeIds(title) {
  const ids = []
  for (const q of [title, `${title} 家常`]) {
    const url = `https://m.xiachufang.com/search/?keyword=${encodeURIComponent(q)}`
    const html = await fetchText(url)
    for (const m of html.matchAll(/\/recipe\/(\d+)\//g)) {
      if (!ids.includes(m[1])) ids.push(m[1])
    }
    if (ids.length >= 4) break
    await sleep(400)
  }
  return ids.slice(0, 5)
}

export function parseMobileRecipePage(html) {
  if (!html || html.includes('滑动验证') || html.length < 8000) return null

  const titleMatch =
    html.match(/"name":"([^"]{2,60})"/) ||
    html.match(/<title>([^<|]{2,40})/)
  const title = (titleMatch?.[1] || '').replace(/\\u002F/g, '/').trim()

  const ingredients = []
  for (const m of html.matchAll(
    /class="ing-name[^"]*"[^>]*>\s*([^<]+)[\s\S]*?class="ing-amount[^"]*"[^>]*>\s*([^<]+)/g
  )) {
    const name = m[1].trim()
    const amount = m[2].trim()
    if (name && name !== '水') ingredients.push({ name, amount })
  }

  const pairedSteps = parseMobileRecipeSteps(html)
  const stepTexts = pairedSteps.map((s) => s.text)
  const stepImages = pairedSteps.map((s) => s.image).filter(Boolean)

  const coverM = html.match(
    /class="cover[^"]*"[^>]*style="[^"]*background-image:url\(([^)]+)\)/
  )
  let cover = normalizeUrl(coverM?.[1] || '')
  if (!isValidChuimgUrl(cover)) cover = ''
  if (!cover) {
    const firstStepImg = pairedSteps.find((s) => s.image)?.image
    if (firstStepImg) cover = firstStepImg
  }

  const timeM = html.match(/time_cost[^:]*:\s*(\d+)/) || html.match(/(\d{1,3})\s*分钟/)
  const time = timeM ? Number(timeM[1]) : 30

  const scoreM = html.match(/score:"([\d.]+)"/)
  const rating = scoreM ? Math.min(5, Number(scoreM[1])) : 4.5

  const cookM = html.match(/cook_count[^:]*:\s*(\d+)/) || html.match(/(\d+)\s*人做过/)
  const count = cookM ? Number(cookM[1]) : 0

  if (!title || ingredients.length === 0 || stepTexts.length === 0) return null

  return { title, ingredients, pairedSteps, stepTexts, stepImages, cover, time, rating, count }
}

export async function fetchRecipeDetail(recipeId) {
  const html = await fetchText(`https://m.xiachufang.com/recipe/${recipeId}/`)
  const parsed = parseMobileRecipePage(html)
  if (!parsed) return null
  return { ...parsed, xiachufangId: String(recipeId) }
}

export async function collectRecipeIdsFromExplore(maxPages = 150) {
  const ids = []
  for (let page = 1; page <= maxPages; page++) {
    const q = page === 1 ? '' : `?page=${page}`
    const html = await fetchText(`https://m.xiachufang.com/explore/${q}`)
    if (!html) break
    let added = 0
    for (const m of html.matchAll(/\/recipe\/(\d+)\//g)) {
      if (!ids.includes(m[1])) {
        ids.push(m[1])
        added++
      }
    }
    if (added === 0) break
    await sleep(350)
  }
  return ids
}

export const CATEGORY_IDS = [
  '40076', '40077', '40078', '40071', '1012713', '957', '52428',
  '52354', '52355', '52356', '52357', '52358', '52359', '52360',
  '52361', '52362', '52363', '52364', '52365', '52366',
]

export async function collectRecipeIdsFromCategories(pagesPerCat = 25) {
  const ids = []
  for (const cat of CATEGORY_IDS) {
    for (let page = 1; page <= pagesPerCat; page++) {
      const html = await fetchText(`https://m.xiachufang.com/category/${cat}/?page=${page}`)
      if (!html) break
      let added = 0
      for (const m of html.matchAll(/\/recipe\/(\d+)\//g)) {
        if (!ids.includes(m[1])) {
          ids.push(m[1])
          added++
        }
      }
      if (added === 0) break
      await sleep(300)
    }
  }
  return ids
}

/** 常见菜名搜索，补充热门/高点击菜谱 ID */
const HOT_KEYWORDS = [
  '红烧肉', '糖醋排骨', '可乐鸡翅', '宫保鸡丁', '麻婆豆腐', '鱼香肉丝', '回锅肉',
  '番茄炒蛋', '青椒肉丝', '酸辣土豆丝', '地三鲜', '水煮鱼', '酸菜鱼', '剁椒鱼头',
  '白切鸡', '口水鸡', '黄焖鸡', '大盘鸡', '辣子鸡', '啤酒鸭', '红烧牛肉', '土豆炖牛肉',
  '番茄牛腩', '清炖排骨', '玉米排骨汤', '冬瓜排骨汤', '番茄蛋汤', '紫菜蛋花汤',
  '蛋炒饭', '扬州炒饭', '葱油拌面', '炸酱面', '牛肉面', '饺子', '包子', '馒头',
  '花卷', '烙饼', '手抓饼', '煎饼', '小笼包', '生煎', '锅贴', '馄饨',
  '凉拌黄瓜', '拍黄瓜', '皮蛋豆腐', '夫妻肺片', '白灼虾', '清蒸鲈鱼',
  '蒜蓉粉丝蒸扇贝', '油焖大虾', '椒盐虾', '干煸豆角', '干锅花菜', '蚂蚁上树',
  '木须肉', '京酱肉丝', '锅包肉', '溜肉段', '小鸡炖蘑菇', '猪肉炖粉条', '东北乱炖',
  '西湖牛肉羹', '罗宋汤', '胡辣汤', '酸辣汤', '银耳莲子羹', '红豆沙', '双皮奶',
  '戚风蛋糕', '海绵蛋糕', '曲奇', '蛋挞', '照烧鸡腿', '日式咖喱', '石锅拌饭',
]

export async function collectRecipeIdsFromHotKeywords(limit = 80) {
  const ids = []
  for (const kw of HOT_KEYWORDS.slice(0, limit)) {
    const found = await searchRecipeIds(kw)
    for (const id of found) {
      if (!ids.includes(id)) ids.push(id)
    }
    await sleep(400)
  }
  return ids
}

export async function collectAllPopularIds() {
  console.log('  collecting explore...')
  const exploreIds = await collectRecipeIdsFromExplore(280)
  console.log('  collecting categories...')
  const catIds = await collectRecipeIdsFromCategories(45)
  console.log('  collecting hot keywords...')
  const hotIds = await collectRecipeIdsFromHotKeywords(100)
  return [...new Set([...exploreIds, ...catIds, ...hotIds])]
}

export function normalizeTitleKey(title) {
  return title.replace(/\s/g, '').toLowerCase()
}

const EMOJIS = ['🥘', '🍲', '🍜', '🥩', '🍗', '🐟', '🥬', '🍳', '🥟', '🍚', '🌶️', '🥗']

export function pickEmoji(title) {
  let h = 0
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return EMOJIS[h % EMOJIS.length]
}
