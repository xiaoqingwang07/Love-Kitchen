/**
 * 购物清单生成工具
 */
import type { PantryItem } from '../types/pantry'
import type { Ingredient } from '../types/recipe'
import { ingredientsLikelyMatch } from './ingredientMatch'

export interface ShoppingItem {
  name: string
  amount: string
  haveIt: boolean
}

/**
 * 根据菜谱食材和冰箱库存，生成购物清单
 */
export function generateShoppingList(
  recipeIngredients: Ingredient[],
  pantryItems: PantryItem[]
): ShoppingItem[] {
  return recipeIngredients.map((ing) => {
    const haveIt = pantryItems.some((p) =>
      ingredientsLikelyMatch(p.name, ing.name)
    )
    return {
      name: ing.name,
      amount: ing.amount,
      haveIt,
    }
  })
}

/**
 * 将购物清单复制为文本格式，方便分享给家人
 */
export function formatShoppingListText(items: ShoppingItem[]): string {
  const lines = ['🛒 采购清单', '']
  const missing = items.filter((i) => !i.haveIt)
  const available = items.filter((i) => i.haveIt)

  if (missing.length > 0) {
    lines.push('❌ 缺少：')
    missing.forEach((item) => {
      lines.push(`  • ${item.name} ${item.amount}`)
    })
  }

  if (available.length > 0) {
    lines.push('')
    lines.push('✅ 已有：')
    available.forEach((item) => {
      lines.push(`  • ${item.name}`)
    })
  }

  return lines.join('\n')
}
