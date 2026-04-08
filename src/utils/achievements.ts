/**
 * 成就系统
 */
import Taro from '@tarojs/taro'
import type { PantryItem } from '../types/pantry'
import type { Recipe } from '../types/recipe'
import { getFavoriteIds, getCookedRecipes } from '../store/storageUtils'
import { STORAGE_KEYS } from '../store/storageKeys'

export interface UserStats {
  cookedCount: number
  favoriteCount: number
  pantryItemCount: number
  uniqueRecipesCooked: number
}

export interface Achievement {
  id: string
  emoji: string
  title: string
  description: string
  unlocked: boolean
}

export function getUserStats(pantryItems: PantryItem[]): UserStats {
  const cooked = getCookedRecipes()
  const uniqueIds = new Set(cooked.map((r) => String(r.id)))
  return {
    cookedCount: cooked.length,
    favoriteCount: getFavoriteIds().length,
    pantryItemCount: pantryItems.length,
    uniqueRecipesCooked: uniqueIds.size,
  }
}

export const ACHIEVEMENTS: Array<{
  id: string
  emoji: string
  title: string
  description: string
  check: (s: UserStats) => boolean
}> = [
  {
    id: 'first_cook',
    emoji: '🍳',
    title: '初试牛刀',
    description: '完成第一道菜',
    check: (s) => s.cookedCount >= 1,
  },
  {
    id: 'cook_5',
    emoji: '👨‍🍳',
    title: '小厨入门',
    description: '累计完成 5 道菜',
    check: (s) => s.cookedCount >= 5,
  },
  {
    id: 'cook_20',
    emoji: '⭐',
    title: '厨房之星',
    description: '累计完成 20 道菜',
    check: (s) => s.cookedCount >= 20,
  },
  {
    id: 'collector',
    emoji: '❤️',
    title: '美食收藏家',
    description: '收藏 10 道菜谱',
    check: (s) => s.favoriteCount >= 10,
  },
  {
    id: 'organized',
    emoji: '🧊',
    title: '冰箱管家',
    description: '冰箱录入 10 种食材',
    check: (s) => s.pantryItemCount >= 10,
  },
  {
    id: 'variety',
    emoji: '🌈',
    title: '百变大咖',
    description: '做过 10 种不同的菜',
    check: (s) => s.uniqueRecipesCooked >= 10,
  },
]

export function getUnlockedAchievements(
  stats: UserStats,
  previouslyUnlocked: string[] = []
): Achievement[] {
  return ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: a.check(stats) && !previouslyUnlocked.includes(a.id),
  }))
}

export function getAllAchievements(stats: UserStats): Achievement[] {
  return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: a.check(stats) }))
}

function getStoredUnlockedAchievements(): string[] {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEYS.unlockedAchievements)
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function saveUnlockedAchievements(ids: string[]): void {
  try {
    Taro.setStorageSync(STORAGE_KEYS.unlockedAchievements, ids)
  } catch {
    /* ignore */
  }
}

/**
 * 检测哪些成就是新解锁的，并自动保存
 */
export function detectAndSaveNewAchievements(stats: UserStats): Achievement[] {
  const stored = getStoredUnlockedAchievements()
  const newOnes = ACHIEVEMENTS.filter(
    (a) => a.check(stats) && !stored.includes(a.id)
  ).map((a) => ({ ...a, unlocked: true }))
  if (newOnes.length > 0) {
    const updated = [...stored, ...newOnes.map((a) => a.id)]
    saveUnlockedAchievements(updated)
  }
  return newOnes
}
