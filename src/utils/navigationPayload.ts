/**
 * 跨页导航 payload：带 TTL，替代裸 setStorageSync 传参。
 */
import Taro from '@tarojs/taro'
import type { Recipe } from '../types/recipe'
import { STORAGE_KEYS } from '../store/storageKeys'

const TTL_MS = 30 * 60 * 1000
const PREFIX = 'navPayload:'

export type NavPayloadKey =
  | 'selectedRecipe'
  | 'sharedRecipe'
  | 'mealNavQuery'
  | 'pantryPendingAction'
  | 'pickAutoSelectIngredients'
  | 'profileOpenFavorites'
  | 'autoSearchIngredient'
  | 'pendingJoinCode'

export type PantryPendingAction = 'receipt' | 'ingredients' | 'paste'

interface StoredPayload<T> {
  value: T
  at: number
}

function storageKey(key: NavPayloadKey): string {
  return `${PREFIX}${key}`
}

export function setNavPayload<T>(key: NavPayloadKey, value: T): void {
  try {
    const stored: StoredPayload<T> = { value, at: Date.now() }
    Taro.setStorageSync(storageKey(key), stored)
  } catch {
    /* ignore */
  }
}

export function peekNavPayload<T>(key: NavPayloadKey): T | null {
  try {
    const raw = Taro.getStorageSync(storageKey(key)) as StoredPayload<T> | undefined
    if (!raw?.value) return null
    if (Date.now() - raw.at > TTL_MS) {
      Taro.removeStorageSync(storageKey(key))
      return null
    }
    return raw.value
  } catch {
    return null
  }
}

export function consumeNavPayload<T>(key: NavPayloadKey): T | null {
  const value = peekNavPayload<T>(key)
  if (value != null) {
    try {
      Taro.removeStorageSync(storageKey(key))
    } catch {
      /* ignore */
    }
  }
  return value
}

function setWithLegacy<T>(key: NavPayloadKey, legacyKey: string, value: T): void {
  setNavPayload(key, value)
  try {
    Taro.setStorageSync(legacyKey, value)
  } catch {
    /* ignore */
  }
}

function consumeWithLegacy<T>(key: NavPayloadKey, legacyKey: string): T | null {
  const fromNav = consumeNavPayload<T>(key)
  if (fromNav != null) return fromNav
  try {
    const legacy = Taro.getStorageSync(legacyKey) as T | null
    if (legacy != null && legacy !== '') {
      Taro.removeStorageSync(legacyKey)
      return legacy
    }
  } catch {
    /* ignore */
  }
  return null
}

function consumeFlagWithLegacy(key: NavPayloadKey, legacyKey: string): boolean {
  const fromNav = consumeNavPayload<boolean>(key)
  if (fromNav) return true
  try {
    const legacy = Taro.getStorageSync(legacyKey)
    if (legacy) {
      Taro.removeStorageSync(legacyKey)
      return true
    }
  } catch {
    /* ignore */
  }
  return false
}

/** 进入详情页前写入菜谱（兼容 legacy key） */
export function setSelectedRecipeForDetail(recipe: Recipe): void {
  setWithLegacy('selectedRecipe', STORAGE_KEYS.selectedRecipeDetail, recipe)
}

/** 详情页读取：优先 TTL payload，回退 legacy */
export function consumeSelectedRecipeForDetail(): Recipe | null {
  return consumeWithLegacy<Recipe>('selectedRecipe', STORAGE_KEYS.selectedRecipeDetail)
}

export function setSharedRecipeSnapshot(recipe: Recipe): void {
  setWithLegacy('sharedRecipe', STORAGE_KEYS.sharedRecipeSnapshot, recipe)
}

export function peekSharedRecipeSnapshot(id: string | number): Recipe | null {
  const fromNav = peekNavPayload<Recipe>('sharedRecipe')
  if (fromNav && String(fromNav.id) === String(id)) return fromNav
  try {
    const legacy = Taro.getStorageSync(STORAGE_KEYS.sharedRecipeSnapshot) as Recipe | null
    if (legacy && String(legacy.id) === String(id)) return legacy
  } catch {
    /* ignore */
  }
  return null
}

/** tab 页跳转冰箱时的待执行动作 */
export function setPantryPendingAction(action: PantryPendingAction): void {
  setWithLegacy('pantryPendingAction', STORAGE_KEYS.pantryPendingAction, action)
}

export function consumePantryPendingAction(): PantryPendingAction | null {
  const value = consumeWithLegacy<PantryPendingAction>(
    'pantryPendingAction',
    STORAGE_KEYS.pantryPendingAction
  )
  if (value === 'receipt' || value === 'ingredients' || value === 'paste') return value
  return null
}

/** 冰箱临期卡片 → 今晚页自动勾选食材 */
export function setPickAutoSelectIngredients(names: string[]): void {
  if (!names.length) return
  setWithLegacy('pickAutoSelectIngredients', STORAGE_KEYS.pickAutoSelectIngredients, names)
}

export function consumePickAutoSelectIngredients(): string[] {
  const raw = consumeWithLegacy<string[] | string>(
    'pickAutoSelectIngredients',
    STORAGE_KEYS.pickAutoSelectIngredients
  )
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean)
  return String(raw).split(',').filter(Boolean)
}

/** 首页 → 我的页打开收藏 */
export function setProfileOpenFavorites(): void {
  setWithLegacy('profileOpenFavorites', STORAGE_KEYS.profileOpenFavorites, true)
}

export function consumeProfileOpenFavorites(): boolean {
  return consumeFlagWithLegacy('profileOpenFavorites', STORAGE_KEYS.profileOpenFavorites)
}

/** 外部落地首页时预填搜索框 */
export function setAutoSearchIngredient(keyword: string): void {
  const trimmed = keyword.trim()
  if (!trimmed) return
  setWithLegacy('autoSearchIngredient', STORAGE_KEYS.autoSearchIngredient, trimmed)
}

export function consumeAutoSearchIngredient(): string | null {
  const value = consumeWithLegacy<string>('autoSearchIngredient', STORAGE_KEYS.autoSearchIngredient)
  return value ? String(value) : null
}

/** 分享链接落地：暂存家庭邀请码，Profile 页消费 */
export function setPendingJoinCode(code: string): void {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return
  setWithLegacy('pendingJoinCode', STORAGE_KEYS.pendingJoinCode, normalized)
}

export function peekPendingJoinCode(): string | null {
  const fromNav = peekNavPayload<string>('pendingJoinCode')
  if (fromNav) return fromNav
  try {
    const legacy = Taro.getStorageSync(STORAGE_KEYS.pendingJoinCode) as string | null
    return legacy ? String(legacy) : null
  } catch {
    return null
  }
}

export function consumePendingJoinCode(): string | null {
  return consumeWithLegacy<string>('pendingJoinCode', STORAGE_KEYS.pendingJoinCode)
}
