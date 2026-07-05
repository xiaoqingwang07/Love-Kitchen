/**
 * 菜谱库入口：优先 catalog（2000+），无 catalog 时回退 legacy 200 道。
 */
export {
  getCatalogCount,
  getCatalogLiteRecipes,
  getRecipeDetailById,
  getRecipeDetailByIdSync,
  preloadRecipeChunk,
  usesCatalog,
  initCatalog,
} from './catalogLoader'
