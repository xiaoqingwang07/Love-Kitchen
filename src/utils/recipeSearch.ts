import { getCatalogRecipes } from '../data/recipeRegistry'
import type { Recipe } from '../types/recipe'

export interface TitleSearchHit {
  recipe: Recipe
  /** 0~1，越高越像用户要找的菜名 */
  score: number
}

function normalizeTitle(s: string): string {
  return s.replace(/\s/g, '').toLowerCase()
}

function titleScore(query: string, title: string): number {
  const q = normalizeTitle(query)
  const t = normalizeTitle(title)
  if (!q || !t) return 0
  if (q === t) return 1
  if (t.includes(q)) return 0.88 + (q.length / t.length) * 0.1
  if (q.includes(t)) return 0.75
  const qSet = new Set(q.split(''))
  let inter = 0
  for (const c of qSet) if (t.includes(c)) inter++
  return (inter / Math.max(qSet.size, t.length)) * 0.65
}

/** 按菜名在全库中搜索（内置 + 定制） */
export function searchRecipesByTitle(query: string, limit = 12): TitleSearchHit[] {
  const q = query.trim()
  if (!q) return []

  return getCatalogRecipes()
    .map((recipe) => ({
      recipe,
      score: Math.max(titleScore(q, recipe.title), ...(recipe.tags || []).map((tag) => titleScore(q, tag) * 0.85)),
    }))
    .filter((h) => h.score >= 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/** 输入更像「菜名」还是「食材清单」 */
export function looksLikeIngredientList(input: string): boolean {
  const s = input.trim()
  if (!s) return false
  if (/[,、，/|+]/.test(s)) return true
  if (/\d+\s*(g|kg|ml|个|只|根|把|片)/i.test(s)) return true
  return false
}
