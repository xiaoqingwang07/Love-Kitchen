import type { Recipe } from '../types/recipe'
import { ingredientsLikelyMatch } from './ingredientMatch'

/** 常见调料/辅材：不算「偏离用户食材」 */
const STAPLE_NAMES = new Set([
  '油', '食用油', '植物油', '色拉油', '橄榄油',
  '盐', '糖', '白糖', '冰糖', '红糖',
  '酱油', '生抽', '老抽', '蚝油', '料酒', '醋', '香醋', '白醋',
  '葱', '小葱', '大葱', '姜', '生姜', '蒜', '大蒜', '蒜末', '姜片',
  '淀粉', '玉米淀粉', '生粉', '水', '清水', '热水', '冷水',
  '花椒', '八角', '香叶', '桂皮', '胡椒粉', '白胡椒粉', '黑胡椒粉',
  '鸡精', '味精', '芝麻', '白芝麻', '香油', '芝麻油',
  '干辣椒', '辣椒', '小米辣', '豆瓣酱', '郫县豆瓣酱',
  '虾皮', '虾米',
])

function normalizeIngredientName(name: string): string {
  return name.trim().replace(/^#+/, '').replace(/[🍯]/g, '').trim()
}

function isStaple(name: string): boolean {
  const n = normalizeIngredientName(name)
  if (!n) return true
  if (STAPLE_NAMES.has(n)) return true
  return Array.from(STAPLE_NAMES).some((s) => n.includes(s) || s.includes(n))
}

export function isStapleIngredient(name: string): boolean {
  return isStaple(name)
}

/** 用户所选食材在菜谱用料里命中了哪些 */
export function matchedUserIngredients(
  recipe: Recipe,
  userIngredients: string[]
): string[] {
  const selected = userIngredients.map((s) => s.trim()).filter(Boolean)
  if (!selected.length) return []

  const hits: string[] = []
  for (const sel of selected) {
    const found = (recipe.ingredients || []).some((ing) =>
      ingredientsLikelyMatch(sel, ing.name)
    )
    if (found) hits.push(sel)
  }
  return hits
}

export interface IngredientBindingOptions {
  /** 至少命中几个用户食材（默认：1 个时要求 1，多个时至少 2 或全中） */
  minHits?: number
}

/** 判断菜谱是否「真的在用用户选的食材」 */
export function recipeBindsUserIngredients(
  recipe: Recipe,
  userIngredients: string[],
  opts: IngredientBindingOptions = {}
): boolean {
  const selected = userIngredients.map((s) => s.trim()).filter(Boolean)
  if (!selected.length) return true

  const hits = matchedUserIngredients(recipe, selected)
  const minHits =
    opts.minHits ??
    (selected.length === 1 ? 1 : Math.min(2, selected.length))

  if (hits.length < minHits) return false

  // 除调料外，至少有一个用户食材作为主料出现在用料里
  const mainNames = (recipe.ingredients || [])
    .map((i) => normalizeIngredientName(i.name))
    .filter((n) => n && !isStaple(n))

  return selected.some((sel) =>
    mainNames.some((name) => ingredientsLikelyMatch(sel, name))
  )
}

export function filterRecipesByUserIngredients(
  recipes: Recipe[],
  userIngredients: string[],
  opts?: IngredientBindingOptions
): Recipe[] {
  return recipes.filter((r) => recipeBindsUserIngredients(r, userIngredients, opts))
}
