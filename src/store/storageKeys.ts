/**
 * 微信小程序 Storage 键名集中定义（与线上已有数据兼容，禁止随意改名）
 */
export const STORAGE_KEYS = {
  selectedRecipeDetail: 'selectedRecipeDetail',
  savedIngredients: 'savedIngredients', // legacy，已无读写方，保留键名兼容旧数据
  profileOpenFavorites: 'profileOpenFavorites',
  autoSearchIngredient: 'autoSearchIngredient',
  sharedRecipeSnapshot: 'sharedRecipeSnapshot',
  favoriteRecipes: 'favoriteRecipes',
  favoriteRecipeDetails: 'favoriteRecipeDetails',
  customRecipes: 'customRecipes',
  recipeWishlist: 'recipeWishlist',
  searchHistory: 'searchHistory',
  cookedRecipes: 'cookedRecipes',
  recipeCache: 'recipeCache',
  recipeScene: 'recipeScene',
  defaultDinersCount: 'defaultDinersCount',
  pickAutoSelectIngredients: 'pickAutoSelectIngredients',
  fridgeLayoutConfig: 'fridgeLayoutConfig',
  llmApiKey: 'LLM_API_KEY',
  deepseekApiKey: 'DEEPSEEK_API_KEY',
  pantryItems: 'pantryItems',
  pantryFridgeTipDismissed: 'pantry_fridge_tip_dismissed',
  pantryEmptyBannerDismissed: 'pantry_empty_banner_dismissed',
  unlockedAchievements: 'unlockedAchievements',
  expiryReminder: 'expiryReminder',
  analyticsEvents: 'analyticsEvents',
  /** 首次成功入库标记 */
  firstIntakeCompleted: 'firstIntakeCompleted',
  /** 冰箱页待执行动作：receipt | ingredients | paste */
  pantryPendingAction: 'pantryPendingAction',
  /** 家庭厨房本地状态 */
  householdState: 'householdState',
  householdMemberId: 'householdMemberId',
  householdMemberToken: 'householdMemberToken',
  /** 分享购物清单快照 */
  sharedShoppingList: 'sharedShoppingList',
  /** 待加入家庭的邀请码（分享链接落地） */
  pendingJoinCode: 'pendingJoinCode',
  /** 成功解决晚餐次数（烹饪模式完成） */
  mealSolvedCount: 'mealSolvedCount',
  /** Plus 软提示已展示 */
  plusPromptShown: 'plusPromptShown',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

/** getLlmApiKey 按顺序尝试的本地 Key */
export const LLM_STORAGE_KEYS = [
  STORAGE_KEYS.llmApiKey,
  STORAGE_KEYS.deepseekApiKey,
] as const
