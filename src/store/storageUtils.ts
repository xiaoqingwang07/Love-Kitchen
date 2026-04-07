/**
 * 本文件为 Taro Storage 读写封装，非状态管理层。
 * 收藏、搜索历史、做过的菜、菜谱缓存等均通过同步 Storage API 持久化。
 * 运行时全局状态请使用 MobX（如 pantryStore + StoreContext）。
 */
import Taro from '@tarojs/taro'
import type { Recipe } from '../types/recipe'
import { STORAGE_KEYS } from './storageKeys'

// ============ 收藏相关（ID 统一为字符串，兼容 AI 字符串 id 与历史数字 id） ============
export const getFavoriteIds = (): string[] => {
  try {
    const fav = Taro.getStorageSync(STORAGE_KEYS.favoriteRecipes)
    if (!Array.isArray(fav)) return []
    return fav.map((x: unknown) => String(x))
  } catch { return [] }
}

export const getFavoriteDetails = (): Recipe[] => {
  try {
    const details = Taro.getStorageSync(STORAGE_KEYS.favoriteRecipeDetails)
    return Array.isArray(details) ? details : []
  } catch { return [] }
}

export const isFavorite = (recipeId: number | string): boolean => {
  return getFavoriteIds().includes(String(recipeId))
}

export const toggleFavorite = (recipe: Recipe): boolean => {
  const favs = getFavoriteIds()
  let details = getFavoriteDetails()
  const id = String(recipe.id)

  if (favs.includes(id)) {
    const newFavs = favs.filter((fid) => fid !== id)
    Taro.setStorageSync(STORAGE_KEYS.favoriteRecipes, newFavs)
    details = details.filter((d) => String(d.id) !== id)
    Taro.setStorageSync(STORAGE_KEYS.favoriteRecipeDetails, details)
    return false
  }
  const newFavs = [...favs, id]
  Taro.setStorageSync(STORAGE_KEYS.favoriteRecipes, newFavs)
  details = [...details, { ...recipe, savedAt: Date.now() }]
  Taro.setStorageSync(STORAGE_KEYS.favoriteRecipeDetails, details)
  return true
}

export const getFavoriteCount = (): number => getFavoriteIds().length

// ============ 搜索历史 ============
const MAX_HISTORY = 10

export interface SearchHistoryItem {
  keywords: string
  timestamp: number
}

export const getSearchHistory = (): SearchHistoryItem[] => {
  try {
    const history = Taro.getStorageSync(STORAGE_KEYS.searchHistory)
    return Array.isArray(history) ? history : []
  } catch { return [] }
}

export const addSearchHistory = (keywords: string): void => {
  if (!keywords.trim()) return
  let history = getSearchHistory()
  history = history.filter(item => item.keywords !== keywords)
  history.unshift({ keywords: keywords.trim(), timestamp: Date.now() })
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY)
  Taro.setStorageSync(STORAGE_KEYS.searchHistory, history)
}

export const clearSearchHistory = (): void => {
  Taro.removeStorageSync(STORAGE_KEYS.searchHistory)
}

export const deleteSearchHistory = (index: number): void => {
  const history = getSearchHistory()
  history.splice(index, 1)
  Taro.setStorageSync(STORAGE_KEYS.searchHistory, history)
}

// ============ 做过的菜 ============
const MAX_COOKED = 20

export const getCookedRecipes = (): (Recipe & { cookedAt: number })[] => {
  try {
    const cooked = Taro.getStorageSync(STORAGE_KEYS.cookedRecipes)
    return Array.isArray(cooked) ? cooked : []
  } catch { return [] }
}

/** 记入「做过的菜」：按 id 去重（字符串比较，兼容数字 id 与 AI 字符串 id），最多保留 MAX_COOKED 条（最新在前）。 */
export const markAsCooked = (recipe: Recipe): boolean => {
  try {
    const cooked = getCookedRecipes()
    const id = String(recipe.id)
    if (cooked.some((c) => String(c.id) === id)) return true
    const next = [{ ...recipe, cookedAt: Date.now() }, ...cooked].slice(0, MAX_COOKED)
    Taro.setStorageSync(STORAGE_KEYS.cookedRecipes, next)
    return true
  } catch (e) {
    console.error('Mark as cooked failed:', e)
    return false
  }
}

// ============ 缓存相关 ============
const CACHE_EXPIRE = 24 * 60 * 60 * 1000 // 24小时
const MAX_CACHE_SIZE = 50 // 最多缓存50条

interface CacheItem {
  data: Recipe | Recipe[]
  timestamp: number
}

export const getCachedRecipe = (key: string): Recipe | Recipe[] | null => {
  try {
    const cache = Taro.getStorageSync(STORAGE_KEYS.recipeCache) as Record<string, CacheItem> | null
    if (!cache || !cache[key]) return null
    const item = cache[key]
    if (Date.now() - item.timestamp > CACHE_EXPIRE) {
      delete cache[key]
      Taro.setStorageSync(STORAGE_KEYS.recipeCache, cache)
      return null
    }
    return item.data
  } catch { return null }
}

export const setCachedRecipe = (key: string, data: Recipe | Recipe[]): void => {
  try {
    let cache = (Taro.getStorageSync(STORAGE_KEYS.recipeCache) as Record<string, CacheItem>) || {}
    
    // 超过容量限制时，删除最老的缓存
    if (Object.keys(cache).length >= MAX_CACHE_SIZE) {
      const sorted = Object.entries(cache).sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toDelete = sorted.slice(0, Math.floor(MAX_CACHE_SIZE / 2))
      toDelete.forEach(([k]) => delete cache[k])
    }
    
    cache[key] = { data, timestamp: Date.now() }
    Taro.setStorageSync(STORAGE_KEYS.recipeCache, cache)
  } catch (e) { console.error('Cache set failed:', e) }
}

export const removeCachedRecipe = (key: string): void => {
  try {
    const cache = (Taro.getStorageSync(STORAGE_KEYS.recipeCache) as Record<string, CacheItem>) || {}
    if (!cache[key]) return
    delete cache[key]
    Taro.setStorageSync(STORAGE_KEYS.recipeCache, cache)
  } catch (e) { console.error('Cache remove failed:', e) }
}

export const generateCacheKey = (ingredients: string[], scene?: string): string => {
  const sorted = [...ingredients].sort().join(',')
  return scene ? `${scene}:${sorted}` : sorted
}
