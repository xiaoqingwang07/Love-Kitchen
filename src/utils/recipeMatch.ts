import { getCatalogRecipes } from '../data/recipeRegistry'
import type { Recipe } from '../types/recipe'
import { ingredientsLikelyMatch } from './ingredientMatch'
import { isRecommendable } from './catalogQuality'

export interface MatchResult {
  recipe: Recipe
  matchedIngredients: string[]
  /** 命中的临期食材名称 */
  matchedExpiringIngredients: string[]
  matchCount: number
  coverageRate: number
  /** 综合得分（含临期加权），越高越优先 */
  score: number
}

/**
 * 根据选中的食材名称，在本地菜谱库中匹配最合适的菜谱。
 *
 * 排序规则（得分越高越靠前）：
 *   base  = 食材命中数 × 2 + 覆盖率
 *   bonus = 每命中一个「临期食材」额外加 3 分
 *
 * 这样可以优先推荐能消耗临期食材的菜式，帮助减少浪费。
 */
export function matchRecipes(
  selectedIngredients: string[],
  limit: number = 6,
  expiringIngredients: string[] = [],
): MatchResult[] {
  if (selectedIngredients.length === 0) return []

  const selectedArr = selectedIngredients.map((s) => s.trim()).filter(Boolean)
  const expiringArr = expiringIngredients.map((s) => s.trim()).filter(Boolean)
  const minSelectedHits =
    selectedArr.length <= 1 ? 1 : Math.min(2, selectedArr.length)

  const results: MatchResult[] = getCatalogRecipes()
    .filter(isRecommendable)
    .map(recipe => {
      const recipeIngredientNames = (recipe.ingredients || []).map(i => i.name)

      const matchedSelected = selectedArr.filter((sel) =>
        recipeIngredientNames.some((name) => ingredientsLikelyMatch(sel, name))
      )
      const matched = recipeIngredientNames.filter((name) =>
        selectedArr.some((sel) => ingredientsLikelyMatch(sel, name))
      )
      const matchedExpiring = matched.filter((name) =>
        expiringArr.some((e) => ingredientsLikelyMatch(e, name))
      )

      const matchCount = matchedSelected.length
      const coverageRate = selectedArr.length > 0 ? matchCount / selectedArr.length : 0

      // 临期加权：每命中一个临期食材 +3 分；用户食材覆盖率越高越靠前
      const score = matchCount * 4 + coverageRate * 3 + matchedExpiring.length * 3

      return {
        recipe,
        matchedIngredients: matched,
        matchedExpiringIngredients: matchedExpiring,
        matchCount,
        coverageRate,
        score,
      }
    })
    .filter((r) => r.matchCount >= minSelectedHits)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return results
}

/**
 * 简化版：直接返回 Recipe[]，便于结果页使用。
 * 当本地匹配数量 < minLocalCount（默认 2）时，返回空数组，
 * 让调用方降级到 AI 推荐。
 */
export function matchRecipesSimple(
  selectedIngredients: string[],
  limit: number = 6,
  opts: { expiringIngredients?: string[]; minLocalCount?: number } = {}
): Recipe[] {
  const { expiringIngredients = [], minLocalCount = 1 } = opts
  const results = matchRecipes(selectedIngredients, limit, expiringIngredients)
  if (results.length < minLocalCount) return []
  return results.map(r => ({
    ...r.recipe,
    isFavorite: false,
  }))
}

/**
 * 综合策略：先本地匹配，本地结果充足（≥ threshold）则返回；
 * 不足时返回 null，由调用方决定是否走 AI。
 */
export function matchRecipesWithFallbackSignal(
  selectedIngredients: string[],
  opts: {
    limit?: number
    expiringIngredients?: string[]
    /** 本地命中数量低于此值时，返回 null 提示需要 AI 补足 */
    aiTriggerThreshold?: number
  } = {}
): { recipes: Recipe[]; needsAI: boolean } {
  const { limit = 6, expiringIngredients = [], aiTriggerThreshold = 3 } = opts
  const results = matchRecipes(selectedIngredients, limit, expiringIngredients)
  const recipes = results.map(r => ({ ...r.recipe, isFavorite: false }))
  return {
    recipes,
    needsAI: recipes.length < aiTriggerThreshold,
  }
}
