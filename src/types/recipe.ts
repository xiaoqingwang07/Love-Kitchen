/**
 * 菜谱数据类型定义
 */

// 食材
export interface Ingredient {
  name: string
  amount: string
}

// 营养成分
export interface Nutrition {
  calories: number    // 热量 kcal
  protein: number    // 蛋白质 g
  carbs: number      // 碳水 g
  fat?: number       // 脂肪 g
}

/** 菜谱来源：用于列表角标与用户预期 */
export type RecipeSource = 'ai' | 'local' | 'cache'

// 菜谱
export interface Recipe {
  id: string | number
  title: string
  /** 列表/详情展示：AI 生成、本地库、命中缓存 */
  source?: RecipeSource
  quote?: string
  rating?: number
  count?: number
  emoji?: string
  image?: string
  ingredients?: Ingredient[]
  steps?: Step[]
  nutritionAnalysis?: string
  nutrition?: Nutrition
  isFavorite?: boolean
  difficulty?: '简单' | '中等' | '复杂'
  time?: number       // 烹饪时间（分钟）
  tags?: string[]     // 标签：家常、快手、运动加餐等
  /** 收藏入库时间戳（仅本地存储用） */
  savedAt?: number
}

// 烹饪步骤（增强版）— 下图上文，贴近下厨房类 App 的阅读节奏
export interface Step {
  content: string
  time?: number       // 该步骤耗时（分钟）
  tip?: string        // 小贴士
  /** 步骤配图 HTTPS URL（须在微信小程序「downloadFile 合法域名」中配置对应主机） */
  image?: string
}

// 搜索历史项
export interface SearchHistoryItem {
  keywords: string
  timestamp: number
}

// 用户反馈
export interface RecipeFeedback {
  recipeId: string | number
  action: 'cooked' | 'liked' | 'shared'
  timestamp: number
}

// AI 请求配置
export interface AIConfig {
  model: string
  temperature: number
  maxTokens: number
}

// 场景化 Prompt 配置
export interface ScenePrompt {
  system: string
  userTemplate: string
}

export const SCENE_PROMPTS = {
  // 跑后加餐（可选场景；主产品定位仍为家庭日常）
  runner: {
    system: `你是家庭营养方向的烹饪顾问。用户可能刚做完中等强度运动，需要一餐易消化、补充能量与蛋白质的餐食。
要求：
- 糖原与优质蛋白搭配合理即可，不必堆砌专业术语
- 做法适合中国家庭厨房，步骤清晰
- 语气亲切，像在给家人建议`,
    userTemplate: `食材：{ingredients}。请推荐1道适合运动后加餐的家常菜。`
  },
  // 快手菜
  quick: {
    system: `你是五星级AI主厨。用户时间紧张，要求15分钟内完成。
要求：
- 步骤简单，不超过5步
- 无需特殊调料
- 成品要有锅气`,
    userTemplate: `食材：{ingredients}。请推荐1道15分钟快手菜。`
  },
  // 增肌
  muscle: {
    system: `你是健美运动员的主厨。用户目的是增肌。
要求：
- 高蛋白（每道菜至少30g蛋白质）
- 碳水精确配比
- 烹饪方式简单`,
    userTemplate: `食材：{ingredients}。请推荐1道适合增肌的高蛋白菜。`
  },
  // 日常
  normal: {
    system: `你是一个五星级AI主厨和运动营养专家。
根据用户食材，推荐最合适的菜谱。
要求：
- 营养均衡
- 做法家常
- 回答简洁`,
    userTemplate: `食材：{ingredients}。请推荐1道家常菜。`
  }
} as const

export type SceneType = keyof typeof SCENE_PROMPTS
