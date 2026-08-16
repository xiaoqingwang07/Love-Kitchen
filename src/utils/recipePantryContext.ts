import type { Recipe } from '../types/recipe'
import type { PantryItem } from '../types/pantry'
import { findPantryItemForRecipeIngredient } from './ingredientMatch'
import { getFreshnessStatus } from '../types/pantry'
import { isStapleIngredient } from './recipeIngredientFilter'

export interface RecipePantryContext {
  hits: PantryItem[]
  expiringHits: PantryItem[]
  missing: { name: string; amount: string }[]
  reason: string
}

export function getRecipePantryContext(
  recipe: Recipe,
  pantryItems: PantryItem[]
): RecipePantryContext {
  const hits: PantryItem[] = []
  const missing: { name: string; amount: string }[] = []
  const seenPantry = new Set<string>()

  for (const ing of recipe.ingredients || []) {
    const hit = findPantryItemForRecipeIngredient(pantryItems, ing.name)
    if (hit && !seenPantry.has(hit.id)) {
      seenPantry.add(hit.id)
      hits.push(hit)
    } else if (!hit && !isStapleIngredient(ing.name)) {
      missing.push({ name: ing.name, amount: ing.amount || '适量' })
    }
  }

  const expiringHits = hits.filter((i) => getFreshnessStatus(i) !== 'fresh')
  const reason = buildReasonText(expiringHits, missing, hits.length)

  return { hits, expiringHits, missing, reason }
}

function buildReasonText(
  expiringHits: PantryItem[],
  missing: { name: string; amount: string }[],
  hitCount: number
): string {
  if (expiringHits.length > 0) {
    const names = expiringHits.map((i) => i.name).slice(0, 2).join('、')
    return `${names} 快过期了，做这道菜正好消耗掉`
  }
  if (hitCount > 0 && missing.length === 0) {
    return '冰箱里的食材刚好够做这一道'
  }
  if (hitCount > 0 && missing.length > 0) {
    return `能用上冰箱里的 ${hitCount} 样食材，还缺 ${missing.length} 样`
  }
  if (missing.length > 0) {
    return `还缺 ${missing.slice(0, 3).map((m) => m.name).join('、')} 等 ${missing.length} 样`
  }
  return '家常稳妥，适合今晚'
}
