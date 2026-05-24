/**
 * 5000 道 catalog：双分包加载（A=索引+chunk0-4，B=chunk5-9），主包仅 legacy 200。
 */
import type { Recipe } from '../types/recipe'
import { enrichRecipeMedia } from '../utils/enrichRecipeMedia'
import { RAW } from './recipesLegacy'
import { ADDITIONAL_RECIPES } from './additionalRecipes'
import Taro from '@tarojs/taro'
import {
  CATALOG_CHUNK_SPLIT,
  type CatalogBridge,
  type CatalogBridgeParts,
} from './catalogBridge'

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

let indexCache: CatalogIndexEntry[] = []
const chunkCache = new Map<number, Recipe[]>()
let legacyLoaded: Recipe[] | null = null
let liteCache: Recipe[] | null = null
let initPromise: Promise<void> | null = null
let partAPromise: Promise<void> | null = null
let partBPromise: Promise<void> | null = null

function getParts(): CatalogBridgeParts {
  const g = globalThis as CatalogBridgeParts
  const app = Taro.getApp<CatalogBridgeParts>()
  return {
    catalogPartA: g.__catalogPartA ?? app?.catalogPartA,
    catalogPartB: g.__catalogPartB ?? app?.catalogPartB,
  }
}

function preloadStub(url: string): Promise<void> {
  return new Promise((resolve) => {
    const wxApi = (globalThis as { wx?: { preloadPage?: (o: object) => void } }).wx
    if (wxApi?.preloadPage) {
      wxApi.preloadPage({ url, success: () => resolve(), fail: () => resolve() })
    } else {
      resolve()
    }
  })
}

function waitForPart(part: 'a' | 'b', timeoutMs = 10000): Promise<void> {
  const parts = getParts()
  if (part === 'a' && parts.catalogPartA) return Promise.resolve()
  if (part === 'b' && parts.catalogPartB) return Promise.resolve()
  return new Promise((resolve) => {
    const handler = (ready: string) => {
      if (ready === part) {
        cleanup()
        resolve()
      }
    }
    const timer = setTimeout(() => {
      cleanup()
      resolve()
    }, timeoutMs)
    const cleanup = () => {
      clearTimeout(timer)
      Taro.eventCenter.off('catalogPartReady', handler)
    }
    Taro.eventCenter.on('catalogPartReady', handler)
  })
}

async function ensurePartA(): Promise<void> {
  if (getParts().catalogPartA) return
  if (partAPromise) return partAPromise
  partAPromise = new Promise<void>((resolve, reject) => {
    Taro.loadSubPackage({
      name: 'catalogA',
      success: async () => {
        await preloadStub('/packageCatalogA/pages/stub/index')
        await waitForPart('a')
        resolve()
      },
      fail: reject,
    })
  }).catch((e) => {
    partAPromise = null
    throw e
  })
  return partAPromise
}

async function ensurePartB(): Promise<void> {
  if (getParts().catalogPartB) return
  if (partBPromise) return partBPromise
  partBPromise = new Promise<void>((resolve, reject) => {
    Taro.loadSubPackage({
      name: 'catalogB',
      success: async () => {
        await preloadStub('/packageCatalogB/pages/stub/index')
        await waitForPart('b')
        resolve()
      },
      fail: reject,
    })
  }).catch((e) => {
    partBPromise = null
    throw e
  })
  return partBPromise
}

async function ensureBridge(): Promise<CatalogBridge> {
  await ensurePartA()
  const parts = getParts()
  if (!parts.catalogPartA) throw new Error('catalog part A not ready')
  return {
    loadPkgIndex: parts.catalogPartA.loadPkgIndex,
    loadPkgChunk: async (chunkId: number) => {
      if (chunkId < CATALOG_CHUNK_SPLIT) {
        return parts.catalogPartA!.loadPkgChunk(chunkId)
      }
      await ensurePartB()
      const b = getParts().catalogPartB
      if (!b) throw new Error('catalog part B not ready')
      return b.loadPkgChunk(chunkId)
    },
  }
}

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

export function initCatalog(): Promise<void> {
  if (initPromise) return initPromise
  initPromise = ensureBridge()
    .then((bridge) => bridge.loadPkgIndex())
    .then((index) => {
      indexCache = index
      liteCache = null
      // 延迟合并大列表，避免阻塞首屏渲染
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          try {
            liteCache = buildLiteCatalog()
          } catch (e) {
            console.warn('buildLiteCatalog failed', e)
          }
          resolve()
        }, 16)
      })
    })
    .catch((e) => {
      console.warn('catalog subpackage load failed', e)
      initPromise = null
    })
  return initPromise
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

export function getCatalogLiteRecipes(): Recipe[] {
  if (liteCache) return liteCache
  liteCache = buildLiteCatalog()
  return liteCache
}

export function getCatalogCount(): number {
  return getCatalogLiteRecipes().length
}

async function loadChunk(chunkId: number): Promise<Recipe[]> {
  if (chunkCache.has(chunkId)) return chunkCache.get(chunkId)!
  const bridge = await ensureBridge()
  const list = await bridge.loadPkgChunk(chunkId)
  chunkCache.set(chunkId, list)
  return list
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
