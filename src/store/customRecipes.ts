import Taro from '@tarojs/taro'
import { STORAGE_KEYS } from './storageKeys'
import type { Recipe } from '../types/recipe'

export interface RecipeWish {
  title: string
  requestedAt: number
  note?: string
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = Taro.getStorageSync(key)
    if (!raw) return fallback
    return typeof raw === 'string' ? (JSON.parse(raw) as T) : (raw as T)
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  Taro.setStorageSync(key, value)
}

export function getCustomRecipes(): Recipe[] {
  const list = readJson<Recipe[]>(STORAGE_KEYS.customRecipes, [])
  return Array.isArray(list) ? list : []
}

export function saveCustomRecipe(recipe: Recipe): Recipe {
  const list = getCustomRecipes()
  const sid = String(recipe.id)
  const entry: Recipe = {
    ...recipe,
    id: sid.startsWith('custom-') ? sid : `custom-${Date.now()}`,
    source: 'custom',
    savedAt: Date.now(),
  }
  const idx = list.findIndex((r) => String(r.id) === String(entry.id) || r.title === entry.title)
  const next = [...list]
  if (idx >= 0) next[idx] = entry
  else next.unshift(entry)
  writeJson(STORAGE_KEYS.customRecipes, next.slice(0, 120))
  return entry
}

export function removeCustomRecipe(id: string | number): void {
  const sid = String(id)
  writeJson(
    STORAGE_KEYS.customRecipes,
    getCustomRecipes().filter((r) => String(r.id) !== sid)
  )
}

export function getRecipeWishlist(): RecipeWish[] {
  const list = readJson<RecipeWish[]>(STORAGE_KEYS.recipeWishlist, [])
  return Array.isArray(list) ? list : []
}

export function addRecipeWish(title: string, note?: string): void {
  const t = title.trim()
  if (!t) return
  const list = getRecipeWishlist().filter((w) => w.title !== t)
  list.unshift({ title: t, requestedAt: Date.now(), note })
  writeJson(STORAGE_KEYS.recipeWishlist, list.slice(0, 50))
}

export function removeRecipeWish(title: string): void {
  writeJson(
    STORAGE_KEYS.recipeWishlist,
    getRecipeWishlist().filter((w) => w.title !== title)
  )
}
