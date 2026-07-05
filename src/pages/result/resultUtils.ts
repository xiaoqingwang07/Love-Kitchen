import type { SceneType } from '../../types/recipe'
import { getStoredScene, usesLlmProxy } from '../../api/recipe'
import { findRecipeById } from '../../data/recipeRegistry'
import type { MealPlan, MealRecipeRole } from '../../types/mealPlan'
import type { Recipe } from '../../types/recipe'

export type ErrorNotice = {
  tone: 'info' | 'warn'
  title: string
  detail: string
}

export function parseScene(s: string | undefined): SceneType {
  if (s === 'runner' || s === 'quick' || s === 'muscle' || s === 'normal') return s
  return getStoredScene()
}

export function hasUsableLlm(): boolean {
  return usesLlmProxy()
}

export function buildErrorNotice(raw: string | undefined, hasIngredientMatch: boolean): ErrorNotice {
  if (!raw || hasIngredientMatch) {
    return {
      tone: 'info',
      title: '已为你匹配本地菜谱',
      detail: '联网推荐不可用时的备选内容，质量稳妥。',
    }
  }
  if (raw.includes('超时') || raw.includes('网络')) {
    return { tone: 'warn', title: '网络不稳定', detail: '先展示本地菜谱，稍后可重试 AI。' }
  }
  if (raw.includes('频繁')) {
    return { tone: 'warn', title: '请求过于频繁', detail: '稍等一下再试，先看看本地推荐。' }
  }
  return { tone: 'info', title: '本地推荐', detail: 'AI 暂不可用，已展示本地匹配菜谱。' }
}

export function buildSharedMealPlans(ids: string[]): MealPlan[] {
  const roles: MealRecipeRole[] = ['main', 'veg', 'soup', 'quick']
  const recipes: Recipe[] = []
  for (const id of ids) {
    const hit = findRecipeById(id)
    if (hit) recipes.push(hit)
  }
  if (recipes.length === 0) return []
  const slots = recipes.map((recipe, i) => ({
    role: roles[i] ?? 'veg',
    recipe,
    usedIngredients: [] as string[],
    expiringUsed: [] as string[],
  }))
  return [
    {
      id: `shared-${ids.join('-')}`,
      recipes: slots,
      usedPantryItems: [],
      missingItems: [],
      totalTime: recipes.reduce((sum, r) => sum + (Number(r.time) || 20), 0),
      servings: 3,
      expiringConsumeRatio: 0,
      reason: '朋友分享的一餐搭配，点开主菜即可开做',
      qualityScore: 80,
    },
  ]
}
