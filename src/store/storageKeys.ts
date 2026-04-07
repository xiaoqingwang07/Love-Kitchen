/**
 * 微信小程序 Storage 键名集中定义（与线上已有数据兼容，禁止随意改名）
 */
export const STORAGE_KEYS = {
  selectedRecipeDetail: 'selectedRecipeDetail',
  savedIngredients: 'savedIngredients',
  profileOpenFavorites: 'profileOpenFavorites',
  autoSearchIngredient: 'autoSearchIngredient',
  sharedRecipeSnapshot: 'sharedRecipeSnapshot',
  favoriteRecipes: 'favoriteRecipes',
  favoriteRecipeDetails: 'favoriteRecipeDetails',
  searchHistory: 'searchHistory',
  cookedRecipes: 'cookedRecipes',
  recipeCache: 'recipeCache',
  recipeScene: 'recipeScene',
  defaultDinersCount: 'defaultDinersCount',
  llmApiKey: 'LLM_API_KEY',
  deepseekApiKey: 'DEEPSEEK_API_KEY',
  pantryItems: 'pantryItems',
  pantryFridgeTipDismissed: 'pantry_fridge_tip_dismissed',
  pantryEmptyBannerDismissed: 'pantry_empty_banner_dismissed',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

/** getLlmApiKey 按顺序尝试的本地 Key */
export const LLM_STORAGE_KEYS = [
  STORAGE_KEYS.llmApiKey,
  STORAGE_KEYS.deepseekApiKey,
] as const
