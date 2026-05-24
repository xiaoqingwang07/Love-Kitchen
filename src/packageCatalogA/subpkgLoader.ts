/**
 * catalog A 分包：索引 + chunk 0–4
 */
import type { Recipe } from '../../types/recipe'
import type { CatalogIndexEntry } from '../../data/catalogLoader'

let indexCache: CatalogIndexEntry[] | null = null
const chunkCache = new Map<number, Recipe[]>()

export async function loadPkgIndex(): Promise<CatalogIndexEntry[]> {
  if (indexCache) return indexCache
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  indexCache = require('./catalog/index.json') as CatalogIndexEntry[]
  return indexCache
}

export async function loadPkgChunk(chunkId: number): Promise<Recipe[]> {
  if (chunkCache.has(chunkId)) return chunkCache.get(chunkId)!
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ctx = require.context('./catalog/chunks', false, /chunk-[0-4]\.json$/)
  const key = `./chunk-${chunkId}.json`
  if (!ctx.keys().includes(key)) return []
  const list = ctx(key) as Recipe[]
  chunkCache.set(chunkId, list)
  return list
}
