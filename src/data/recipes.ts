/**
 * 菜谱库入口：优先 catalog（2000+），无 catalog 时回退 legacy 200 道。
 */
import type { Recipe } from '../types/recipe'
import { getCatalogLiteRecipes } from './catalogLoader'

export const DEFAULT_RECIPES: Recipe[] = getCatalogLiteRecipes()

export {
  getCatalogCount,
  getRecipeDetailById,
  getRecipeDetailByIdSync,
  preloadRecipeChunk,
  usesCatalog,
  initCatalog,
} from './catalogLoader'
