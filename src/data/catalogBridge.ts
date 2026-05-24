import type { Recipe } from '../types/recipe'
import type { CatalogIndexEntry } from './catalogLoader'

export interface CatalogBridge {
  loadPkgIndex: () => Promise<CatalogIndexEntry[]>
  loadPkgChunk: (chunkId: number) => Promise<Recipe[]>
}

export interface CatalogBridgeParts {
  catalogPartA?: Pick<CatalogBridge, 'loadPkgIndex' | 'loadPkgChunk'>
  catalogPartB?: Pick<CatalogBridge, 'loadPkgChunk'>
  __catalogPartA?: Pick<CatalogBridge, 'loadPkgIndex' | 'loadPkgChunk'>
  __catalogPartB?: Pick<CatalogBridge, 'loadPkgChunk'>
}

/** A 包负责 chunk 0–4 + 索引；B 包负责 chunk 5–9 */
export const CATALOG_CHUNK_SPLIT = 5
