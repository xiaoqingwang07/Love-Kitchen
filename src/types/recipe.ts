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

// 菜谱
export interface Recipe {
  id: string | number
  title: string
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
  tags?: string[]     // 标签：跑者首选、快速补给等
}

// 烹饪步骤（增强版）
export interface Step {
  content: string
  time?: number       // 该步骤耗时（分钟）
  tip?: string        // 小贴士
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
  // 跑者恢复
  runner: {
    system: `你是一个国家级运动营养师。用户是月跑量200-300km的马拉松爱好者，刚刚完成训练。
要求：
- 重点补充糖原和蛋白质，3:1碳水蛋白比
- 训练后30分钟内进食效果好
- 避免高脂肪食物影响消化
- 回答简洁专业，不超过50字`,
    userTemplate: `食材：{ingredients}。请推荐1道适合跑步后补充能量的菜。`
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
