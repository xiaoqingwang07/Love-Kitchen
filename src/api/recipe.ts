/**
 * 统一 API 层
 * 封装所有 AI 请求逻辑
 */
import Taro from '@tarojs/taro'
import type { Recipe, SceneType, SCENE_PROMPTS } from '../types/recipe'

// DeepSeek API 配置
const API_BASE_URL = 'https://api.deepseek.com'
const DEFAULT_MODEL = 'deepseek-chat'

// 请求配置
interface RequestConfig {
  retry?: number       // 重试次数
  timeout?: number     // 超时时间(ms)
}

const DEFAULT_CONFIG: RequestConfig = {
  retry: 2,
  timeout: 15000
}

// 获取 API Key
const getApiKey = (): string => {
  return Taro.getStorageSync('DEEPSEEK_API_KEY') || ''
}

// 安全解析 JSON
const safeParseJSON = (str: string): Recipe[] | Recipe | null => {
  try {
    // 尝试提取 JSON 数组或对象
    const match = str.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
    if (match) {
      return JSON.parse(match[0])
    }
    return JSON.parse(str)
  } catch (e) {
    console.error('JSON parse failed:', e)
    return null
  }
}

// 带重试的请求
const requestWithRetry = async <T>(
  fn: () => Promise<T>,
  retries: number = DEFAULT_CONFIG.retry!
): Promise<T> => {
  let lastError: Error | null = null
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e as Error
      if (i < retries) {
        console.warn(`请求失败，${(i + 1)}秒后重试...`, e)
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }
  
  throw lastError
}

// AI 推荐菜谱（单道）
export const fetchRecipe = async (
  ingredients: string[],
  scene: SceneType = 'normal',
  config?: RequestConfig
): Promise<Recipe> => {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    throw new Error('请先在设置中添加 DeepSeek API Key')
  }

  const promptConfig = SCENE_PROMPTS[scene]
  const ingredientsStr = ingredients.join('、')

  return requestWithRetry(async () => {
    const response = await Taro.request({
      url: `${API_BASE_URL}/chat/completions`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: {
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: promptConfig.system },
          { 
            role: 'user', 
            content: promptConfig.userTemplate.replace('{ingredients}', ingredientsStr)
          }
        ],
        temperature: 0.9,
        max_tokens: config?.maxTokens || 800
      },
      timeout: config?.timeout || DEFAULT_CONFIG.timeout
    })

    if (response.statusCode !== 200) {
      throw new Error(`API 错误: ${response.statusCode}`)
    }

    const content = response.data.choices?.[0]?.message?.content
    
    if (!content) {
      throw new Error('API 返回为空')
    }

    const recipe = safeParseJSON(content) as Recipe
    
    if (!recipe || !recipe.title) {
      throw new Error('无法解析菜谱数据')
    }

    // 补充元数据
    return {
      ...recipe,
      id: Date.now(),
      isFavorite: false,
      time: recipe.time || estimateTime(recipe.ingredients?.length || 0),
      tags: [scene === 'runner' ? '🏃 跑者专属' : scene === 'quick' ? '⚡ 快手菜' : '🍽️ 家常菜']
    }
  }, config?.retry || DEFAULT_CONFIG.retry!)
}

// AI 推荐多道菜谱
export const fetchRecipes = async (
  ingredients: string[],
  count: number = 3,
  config?: RequestConfig
): Promise<Recipe[]> => {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    throw new Error('请先在设置中添加 DeepSeek API Key')
  }

  const systemPrompt = `你是一个五星级AI主厨和运动营养专家。请根据食材推荐 ${count} 道适合【跑步爱好者】的菜谱。
必须返回纯 JSON 数组格式。结构如下（严格按照这个格式）：
[
  { 
    "title": "菜名", 
    "quote": "一句话点评", 
    "rating": 4.8, 
    "count": 1024, 
    "emoji": "🥘",
    "ingredients": [{"name": "食材1", "amount": "用量"}, ...],
    "steps": ["步骤1...", "步骤2..."],
    "nutritionAnalysis": "针对跑者的营养分析...",
    "time": 20,
    "difficulty": "简单"
  }
]
只返回 JSON，不要任何其他文字。`

  const ingredientsStr = ingredients.join('、')

  return requestWithRetry(async () => {
    const response = await Taro.request({
      url: `${API_BASE_URL}/chat/completions`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: {
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `食材：${ingredientsStr}。请推荐${count}道适合跑步后补充能量的菜。`
          }
        ],
        temperature: 1.0,
        max_tokens: config?.maxTokens || 1500
      },
      timeout: config?.timeout || DEFAULT_CONFIG.timeout
    })

    if (response.statusCode !== 200) {
      throw new Error(`API 返回错误: ${response.statusCode}`)
    }

    const content = response.data.choices?.[0]?.message?.content
    
    if (!content) {
      throw new Error('API 返回为空')
    }

    const data = safeParseJSON(content) as Recipe[]
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('无法解析菜谱数据')
    }

    // 补充元数据
    return data.map((r, idx) => ({
      ...r,
      id: Date.now() + idx,
      isFavorite: false,
      time: r.time || estimateTime(r.ingredients?.length || 0),
      tags: r.tags || ['🏃 跑者专属']
    }))
  }, config?.retry || DEFAULT_CONFIG.retry!)
}

// 根据食材数量估算烹饪时间
const estimateTime = (ingredientCount: number): number => {
  if (ingredientCount <= 3) return 15
  if (ingredientCount <= 5) return 25
  return 35
}

// 检查 API Key 是否有效
export const checkApiKey = async (): Promise<boolean> => {
  const apiKey = getApiKey()
  
  if (!apiKey) return false

  try {
    const response = await Taro.request({
      url: `${API_BASE_URL}/chat/completions`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: {
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1
      },
      timeout: 5000
    })

    return response.statusCode === 200
  } catch {
    return false
  }
}
