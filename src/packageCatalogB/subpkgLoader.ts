/**
 * catalog B 分包：chunk 5–9
 */
import type { Recipe } from '../../types/recipe'

const chunkCache = new Map<number, Recipe[]>()

export async function loadPkgChunk(chunkId: number): Promise<Recipe[]> {
  if (chunkCache.has(chunkId)) return chunkCache.get(chunkId)!
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ctx = require.context('./catalog/chunks', false, /chunk-[5-9]\.json$/)
  const key = `./chunk-${chunkId}.json`
  if (!ctx.keys().includes(key)) return []
  const list = ctx(key) as Recipe[]
  chunkCache.set(chunkId, list)
  return list
}
