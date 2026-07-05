/**
 * 「今晚一餐」方案类型
 */
import type { Recipe } from './recipe'

export type MealRecipeRole = 'main' | 'veg' | 'soup' | 'quick'

export type MealConstraint =
  | 'quick15'
  | 'lessPots'
  | 'kidFriendly'
  | 'highProtein'
  | 'light'

export interface MealPlanRecipeSlot {
  role: MealRecipeRole
  recipe: Recipe
  usedIngredients: string[]
  expiringUsed: string[]
}

export interface MealPlanMissingItem {
  name: string
  amount: string
}

export interface MealPlan {
  id: string
  recipes: MealPlanRecipeSlot[]
  usedPantryItems: string[]
  missingItems: MealPlanMissingItem[]
  totalTime: number
  servings: number
  expiringConsumeRatio: number
  reason: string
  qualityScore: number
}

export const MEAL_CONSTRAINT_LABELS: Record<MealConstraint, string> = {
  quick15: '15 分钟内',
  lessPots: '少洗锅',
  kidFriendly: '孩子能吃',
  highProtein: '高蛋白',
  light: '清淡',
}
