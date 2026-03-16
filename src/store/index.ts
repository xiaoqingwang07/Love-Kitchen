/**
 * 状态管理 - 收藏夹 & 历史记录
 * 使用 Taro 的 getStorageSync 实现简单状态同步
 */
import Taro from '@tarojs/taro'
import type { Recipe, SearchHistoryItem } from '../types/recipe'

// ============ Storage Keys ============
const FAVORITES_KEY = 'favoriteRecipes'
const FAVORITE_DETAILS_KEY = 'favoriteRecipeDetails'
const SEARCH_HISTORY_KEY = 'searchHistory'
const COOKED_RECIPES_KEY = 'cookedRecipes'

// ============ 收藏相关 ============

// 获取收藏 ID 列表
export const getFavoriteIds = (): number[] => {
  try {
    const fav = Taro.getStorageSync(FAVORITES_KEY)
    return Array.isArray(fav) ? fav : []
  } catch {
    return []
  }
}

// 获取收藏的详细信息
export const getFavoriteDetails = (): Recipe[] => {
  try {
    const details = Taro.getStorageSync(FAVORITE_DETAILS_KEY)
    return Array.isArray(details) ? details : []
  } catch {
    return []
  }
}

// 检查是否已收藏
export const isFavorite = (recipeId: number | string): boolean => {
  const favs = getFavoriteIds()
  return favs.includes(Number(recipeId))
}

// 切换收藏状态
export const toggleFavorite = (recipe: Recipe): boolean => {
  const favs = getFavoriteIds()
  let details = getFavoriteDetails()
  let isFav: boolean

  const id = Number(recipe.id)
  
  if (favs.includes(id)) {
    // 取消收藏
    const newFavs = favs.filter(fid => fid !== id)
    Taro.setStorageSync(FAVORITES_KEY, newFavs)
    
    // 更新详情
    details = details.filter(d => d.id !== id)
    Taro.setStorageSync(FAVORITE_DETAILS_KEY, details)
    
    isFav = false
  } else {
    // 添加收藏
    const newFavs = [...favs, id]
    Taro.setStorageSync(FAVORITES_KEY, newFavs)
    
    // 保存详细信息
    const recipeWithTime = { ...recipe, savedAt: Date.now() }
    details = [...details, recipeWithTime]
    Taro.setStorageSync(FAVORITE_DETAILS_KEY, details)
    
    isFav = true
  }

  return isFav
}

// 获取收藏数量
export const getFavoriteCount = (): number => {
  return getFavoriteIds().length
}

// ============ 搜索历史 ============

const MAX_HISTORY = 10

// 获取搜索历史
export const getSearchHistory = (): SearchHistoryItem[] => {
  try {
    const history = Taro.getStorageSync(SEARCH_HISTORY_KEY)
    return Array.isArray(history) ? history : []
  } catch {
    return []
  }
}

// 添加搜索历史
export const addSearchHistory = (keywords: string): void => {
  if (!keywords.trim()) return
  
  let history = getSearchHistory()
  
  // 去除重复（保留最新的）
  history = history.filter(item => item.keywords !== keywords)
  
  // 添加新记录
  history.unshift({
    keywords: keywords.trim(),
    timestamp: Date.now()
  })
  
  // 限制数量
  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY)
  }
  
  Taro.setStorageSync(SEARCH_HISTORY_KEY, history)
}

// 清空搜索历史
export const clearSearchHistory = (): void => {
  Taro.removeStorageSync(SEARCH_HISTORY_KEY)
}

// 删除单条历史
export const deleteSearchHistory = (index: number): void => {
  const history = getSearchHistory()
  history.splice(index, 1)
  Taro.setStorageSync(SEARCH_HISTORY_KEY, history)
}

// ============ 做过的菜 ============

// 标记为做过
export const markAsCooked = (recipe: Recipe): void => {
  try {
    const cooked = getCookedRecipes()
    
    // 检查是否已做过
    if (!cooked.find(c => c.id === recipe.id)) {
      cooked.unshift({
        ...recipe,
        cookedAt: Date.now()
      })
      
      // 最多保留20道
      if (cooked.length > 20) {
        cooked.pop()
      }
      
      Taro.setStorageSync(COOKED_RECIPES_KEY, cooked)
    }
  } catch (e) {
    console.error('Mark as cooked failed:', e)
  }
}

// 获取做过的菜
export const getCookedRecipes = (): (Recipe & { cookedAt: number })[] => {
  try {
    const cooked = Taro.getStorageSync(COOKED_RECIPES_KEY)
    return Array.isArray(cooked) ? cooked : []
  } catch {
    return []
  }
}

// 获取做过这道菜的用户数（模拟）
export const getCookedCount = (recipeId: number | string): number => {
  // 实际应该从服务端获取，这里模拟
  const base = 800 + Math.floor(Math.random() * 500)
  return base + Number(recipeId) % 100
}

// ============ 缓存相关 ============

// 菜谱缓存（用于离线/快速加载）
const RECIPE_CACHE_KEY = 'recipeCache'
const CACHE_EXPIRE = 24 * 60 * 60 * 1000 // 24小时

interface CacheItem {
  data: Recipe | Recipe[]
  timestamp: number
}

// 获取缓存
export const getCachedRecipe = (key: string): Recipe | Recipe[] | null => {
  try {
    const cache = Taro.getStorageSync(RECIPE_CACHE_KEY) as Record<string, CacheItem> | null
    
    if (!cache || !cache[key]) return null
    
    const item = cache[key]
    
    // 检查是否过期
    if (Date.now() - item.timestamp > CACHE_EXPIRE) {
      delete cache[key]
      Taro.setStorageSync(RECIPE_CACHE_KEY, cache)
      return null
    }
    
    return item.data as Recipe | Recipe[]
  } catch {
    return null
  }
}

// 设置缓存
export const setCachedRecipe = (key: string, data: Recipe | Recipe[]): void => {
  try {
    const cache = (Taro.getStorageSync(RECIPE_CACHE_KEY) as Record<string, CacheItem>) || {}
    
    cache[key] = {
      data,
      timestamp: Date.now()
    }
    
    Taro.setStorageSync(RECIPE_CACHE_KEY, cache)
  } catch (e) {
    console.error('Cache set failed:', e)
  }
}

// 生成缓存 key
export const generateCacheKey = (ingredients: string[], scene?: string): string => {
  const sorted = [...ingredients].sort().join(',')
  return scene ? `${scene}:${sorted}` : sorted
}
