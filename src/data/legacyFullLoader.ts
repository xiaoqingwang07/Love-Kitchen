/**
 * 完整 legacy 菜谱（含 steps），静态打入主包 common.js（~350 KiB）。
 * 保证离线/无 CDN 时详情页步骤可用；catalog 5000 道仍走 CDN 分片。
 * 未来若需减主包，可将此模块移入 subPackage，主包改用 recipesLegacyLite。
 */
import type { Recipe } from '../types/recipe'
import { RAW } from './recipesLegacy'
import { ADDITIONAL_RECIPES } from './additionalRecipes'

let cache: Recipe[] | null = null

export function loadLegacyFullRecipes(): Recipe[] {
  if (cache) return cache
  cache = [
    ...RAW.map((r) => ({ ...r, source: 'local' as const })),
    ...ADDITIONAL_RECIPES,
  ]
  return cache
}
