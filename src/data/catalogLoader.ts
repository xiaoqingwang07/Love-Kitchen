/**
 * 5000 道 catalog：云端按需加载 + 本地文件缓存。
 *
 * 数据托管在 CDN / 微信云存储，构建变量 TARO_APP_CATALOG_BASE_URL 指向其根目录：
 *   ${base}/meta.json            版本信息
 *   ${base}/index.json           轻量索引（标题 / 食材 / 评分 / chunk 号）
 *   ${base}/chunks/chunk-N.json  完整菜谱分片（含步骤）
 *
 * 主包只内置 legacy 200 道，离线/未配置 CDN 时自动回退到它们。
 * 首启走网络，之后命中文件缓存（秒开、可离线），后台按 meta.version 静默刷新。
 */
import type { Recipe } from '../types/recipe'
import { enrichRecipeMedia } from '../utils/enrichRecipeMedia'
import { RAW } from './recipesLegacy'
import { ADDITIONAL_RECIPES } from './additionalRecipes'
import Taro from '@tarojs/taro'

export interface CatalogIndexEntry {
  id: number
  title: string
  ingredients: { name: string; amount: string }[]
  tags?: string[]
  rating?: number
  count?: number
  time?: number
  difficulty?: Recipe['difficulty']
  emoji?: string
  quote?: string
  image?: string
  chunk: number
}

interface CatalogMeta {
  version: number
  count?: number
  chunkSize?: number
  generatedAt?: string
}

const CACHE_DIR = 'catalog'
const INDEX_FILE = 'index.json'
const META_FILE = 'meta.json'
const REQUEST_TIMEOUT_MS = 20000

let indexCache: CatalogIndexEntry[] = []
const chunkCache = new Map<number, Recipe[]>()
let legacyLoaded: Recipe[] | null = null
let liteCache: Recipe[] | null = null
let initPromise: Promise<void> | null = null

/* ───────── 配置 ───────── */

function catalogBaseUrl(): string {
  if (typeof TARO_APP_CATALOG_BASE_URL !== 'string') return ''
  return TARO_APP_CATALOG_BASE_URL.trim().replace(/\/+$/, '')
}

/** 是否配置了远端 catalog（未配置时全程走 legacy 200，不发任何请求） */
export function usesRemoteCatalog(): boolean {
  return catalogBaseUrl().length > 0
}

/* ───────── 网络 ───────── */

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await Taro.request({ url, method: 'GET', timeout: REQUEST_TIMEOUT_MS })
    if (res.statusCode !== 200) return null
    const data = res.data
    if (typeof data === 'string') {
      try {
        return JSON.parse(data) as T
      } catch {
        return null
      }
    }
    return (data as T) ?? null
  } catch {
    return null
  }
}

/* ───────── 文件缓存（小程序；H5 自动降级为仅内存） ───────── */

type Fs = {
  readFileSync: (path: string, encoding: string) => string | ArrayBuffer
  writeFileSync: (path: string, data: string, encoding: string) => void
  mkdirSync: (dirPath: string, recursive?: boolean) => void
}

function getFs(): Fs | null {
  try {
    const fn = (Taro as unknown as { getFileSystemManager?: () => Fs }).getFileSystemManager
    return typeof fn === 'function' ? fn() : null
  } catch {
    return null
  }
}

function userDataPath(): string {
  try {
    const env = (Taro as unknown as { env?: { USER_DATA_PATH?: string } }).env
    return env?.USER_DATA_PATH || ''
  } catch {
    return ''
  }
}

function cachePath(name: string): string {
  return `${userDataPath()}/${CACHE_DIR}/${name}`
}

function readCacheJson<T>(name: string): T | null {
  const fs = getFs()
  if (!fs || !userDataPath()) return null
  try {
    const txt = fs.readFileSync(cachePath(name), 'utf8')
    if (typeof txt !== 'string') return null
    return JSON.parse(txt) as T
  } catch {
    return null
  }
}

function writeCacheJson(name: string, data: unknown): void {
  const fs = getFs()
  if (!fs || !userDataPath()) return
  try {
    try {
      fs.mkdirSync(`${userDataPath()}/${CACHE_DIR}`, true)
    } catch {
      /* 目录已存在 */
    }
    fs.writeFileSync(cachePath(name), JSON.stringify(data), 'utf8')
  } catch {
    /* 写缓存失败不影响功能 */
  }
}

/* ───────── 远端索引 / 分片 ───────── */

async function fetchAndCacheIndex(): Promise<boolean> {
  const base = catalogBaseUrl()
  if (!base) return false
  const [meta, index] = await Promise.all([
    fetchJson<CatalogMeta>(`${base}/${META_FILE}`),
    fetchJson<CatalogIndexEntry[]>(`${base}/${INDEX_FILE}`),
  ])
  if (!Array.isArray(index) || index.length === 0) return false
  indexCache = index
  liteCache = null
  writeCacheJson(INDEX_FILE, index)
  if (meta) writeCacheJson(META_FILE, meta)
  return true
}

/** 后台静默刷新：远端版本变化时更新缓存，下次启动生效（不热替换当前会话，避免 id 抖动） */
async function refreshIndexIfStale(cachedMeta: CatalogMeta | null): Promise<void> {
  const base = catalogBaseUrl()
  if (!base) return
  const remoteMeta = await fetchJson<CatalogMeta>(`${base}/${META_FILE}`)
  if (!remoteMeta) return
  if (cachedMeta && remoteMeta.version === cachedMeta.version) return
  const index = await fetchJson<CatalogIndexEntry[]>(`${base}/${INDEX_FILE}`)
  if (Array.isArray(index) && index.length > 0) {
    writeCacheJson(INDEX_FILE, index)
    writeCacheJson(META_FILE, remoteMeta)
    chunkCache.clear()
  }
}

async function loadChunk(chunkId: number): Promise<Recipe[]> {
  if (chunkCache.has(chunkId)) return chunkCache.get(chunkId)!
  const cached = readCacheJson<Recipe[]>(`chunk-${chunkId}.json`)
  if (Array.isArray(cached)) {
    chunkCache.set(chunkId, cached)
    return cached
  }
  const base = catalogBaseUrl()
  if (!base) return []
  const list = await fetchJson<Recipe[]>(`${base}/chunks/chunk-${chunkId}.json`)
  if (!Array.isArray(list)) return []
  chunkCache.set(chunkId, list)
  writeCacheJson(`chunk-${chunkId}.json`, list)
  return list
}

/* ───────── 轻量目录构建（与原实现一致） ───────── */

function normalizeTitleKey(title: string): string {
  return title.replace(/\s/g, '').toLowerCase()
}

function indexEntryToLiteRecipe(entry: CatalogIndexEntry): Recipe {
  const image =
    entry.image && /i\d+\.chuimg\.com/i.test(entry.image) ? entry.image : undefined
  return {
    id: entry.id,
    title: entry.title,
    source: 'local',
    quote: entry.quote,
    rating: entry.rating,
    count: entry.count,
    emoji: entry.emoji,
    difficulty: entry.difficulty,
    time: entry.time,
    tags: entry.tags,
    ingredients: entry.ingredients,
    image,
    steps: [],
  }
}

function loadLegacyBase(): Recipe[] {
  return [...RAW, ...ADDITIONAL_RECIPES].map((r) => ({ ...r, source: 'local' as const }))
}

function loadLegacyRecipes(): Recipe[] {
  if (legacyLoaded) return legacyLoaded
  legacyLoaded = loadLegacyBase().map(enrichRecipeMedia)
  return legacyLoaded
}

function getIndexSync(): CatalogIndexEntry[] {
  return indexCache
}

function buildLiteCatalog(): Recipe[] {
  const index = getIndexSync()
  const legacy = loadLegacyBase()

  if (index.length === 0) {
    return legacy.map(enrichRecipeMedia)
  }

  const legacyKeys = new Set(legacy.map((r) => normalizeTitleKey(r.title)))
  let nextId = Math.max(...legacy.map((r) => Number(r.id) || 0), 0) + 1

  const catalogOnly = index
    .filter((e) => !legacyKeys.has(normalizeTitleKey(e.title)))
    .map((e) => ({
      ...indexEntryToLiteRecipe(e),
      id: nextId++,
    }))

  return [...legacy, ...catalogOnly]
}

/* ───────── 公共 API（签名保持不变） ───────── */

export function initCatalog(): Promise<void> {
  if (initPromise) return initPromise
  initPromise = (async () => {
    // 未配置远端：直接走 legacy 200，不发请求
    if (!usesRemoteCatalog()) {
      liteCache = null
      return
    }

    // 1. 优先读文件缓存（秒开、可离线）
    const cachedIndex = readCacheJson<CatalogIndexEntry[]>(INDEX_FILE)
    if (Array.isArray(cachedIndex) && cachedIndex.length > 0) {
      indexCache = cachedIndex
      liteCache = null
      void refreshIndexIfStale(readCacheJson<CatalogMeta>(META_FILE))
    } else {
      // 2. 网络拉取索引；失败则回退 legacy
      const ok = await fetchAndCacheIndex()
      if (!ok) {
        initPromise = null
        return
      }
    }

    // 3. 延迟合并大列表，避免阻塞首屏渲染
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        try {
          liteCache = buildLiteCatalog()
        } catch (e) {
          console.warn('buildLiteCatalog failed', e)
        }
        resolve()
      }, 16)
    })
  })().catch((e) => {
    console.warn('catalog init failed', e)
    initPromise = null
  })
  return initPromise
}

export function getCatalogLiteRecipes(): Recipe[] {
  if (liteCache) return liteCache
  liteCache = buildLiteCatalog()
  return liteCache
}

export function getCatalogCount(): number {
  return getCatalogLiteRecipes().length
}

export async function getRecipeDetailById(id: string | number): Promise<Recipe | undefined> {
  const sid = String(id)
  const index = getIndexSync()
  const legacy = loadLegacyBase()

  const legacyById = legacy.find((r) => String(r.id) === sid)
  if (legacyById?.steps?.length) return enrichRecipeMedia(legacyById)

  if (index.length > 0) {
    const lite = getCatalogLiteRecipes().find((r) => String(r.id) === sid)
    if (!lite) return undefined

    const legacyByTitle = legacy.find(
      (r) => normalizeTitleKey(r.title) === normalizeTitleKey(lite.title)
    )
    if (legacyByTitle?.steps?.length) return enrichRecipeMedia(legacyByTitle)

    const entry = index.find((e) => normalizeTitleKey(e.title) === normalizeTitleKey(lite.title))
    if (!entry) return lite

    const chunk = await loadChunk(entry.chunk)
    const full = chunk.find((r) => normalizeTitleKey(r.title) === normalizeTitleKey(entry.title))
    return full ? enrichRecipeMedia(full) : lite
  }

  return loadLegacyRecipes().find((r) => String(r.id) === sid)
}

export function getRecipeDetailByIdSync(id: string | number): Recipe | undefined {
  const sid = String(id)
  const index = getIndexSync()
  const legacy = loadLegacyBase()

  const legacyById = legacy.find((r) => String(r.id) === sid)
  if (legacyById?.steps?.length) return enrichRecipeMedia(legacyById)

  if (index.length > 0) {
    const lite = getCatalogLiteRecipes().find((r) => String(r.id) === sid)
    if (!lite) return undefined

    const legacyByTitle = legacy.find(
      (r) => normalizeTitleKey(r.title) === normalizeTitleKey(lite.title)
    )
    if (legacyByTitle?.steps?.length) return enrichRecipeMedia(legacyByTitle)

    const entry = index.find((e) => normalizeTitleKey(e.title) === normalizeTitleKey(lite.title))
    if (!entry) return lite

    const cached = chunkCache.get(entry.chunk)
    if (!cached) return lite
    const full = cached.find((r) => normalizeTitleKey(r.title) === normalizeTitleKey(entry.title))
    return full ? enrichRecipeMedia(full) : indexEntryToLiteRecipe(entry)
  }

  return loadLegacyRecipes().find((r) => String(r.id) === sid)
}

export async function preloadRecipeChunk(id: string | number): Promise<void> {
  const index = getIndexSync()
  const lite = getCatalogLiteRecipes().find((r) => String(r.id) === String(id))
  if (!lite) return
  const entry = index.find((e) => normalizeTitleKey(e.title) === normalizeTitleKey(lite.title))
  if (entry) await loadChunk(entry.chunk)
}

export function usesCatalog(): boolean {
  return indexCache.length > 0
}
