import type { PantryItem } from '../types/pantry'

/** 常见同义词：菜谱用料名 vs 冰箱名称 */
const GROUPS: string[][] = [
  ['西红柿', '番茄', '圣女果'],
  ['青椒', '甜椒', '彩椒'],
  ['土豆', '马铃薯'],
  ['鸡蛋', '蛋清', '蛋黄'],
  ['千张', '豆皮', '白干'],
  ['包菜', '卷心菜', '高丽菜'],
]

/**
 * 短名会被更长短语包含、但实际不是同一种东西。
 * 例如冰箱里的「虾」不应命中汤里的「虾皮」。
 */
const FALSE_FRIEND_PAIRS: Array<[string, string]> = [
  ['虾', '虾皮'],
  ['虾', '虾酱'],
  ['虾', '虾油'],
  ['鱼', '鱼露'],
  ['鱼', '鱼酱'],
]

function isFalseFriend(a: string, b: string): boolean {
  for (const [short, long] of FALSE_FRIEND_PAIRS) {
    const aIsShort = a === short
    const bIsShort = b === short
    const aIsLong = a.includes(long)
    const bIsLong = b.includes(long)
    if ((aIsShort && bIsLong) || (bIsShort && aIsLong)) return true
  }
  return false
}

function sameGroup(a: string, b: string): boolean {
  const x = a.trim()
  const y = b.trim()
  if (!x || !y) return false
  for (const g of GROUPS) {
    const ix = g.some(s => x.includes(s) || s.includes(x))
    const iy = g.some(s => y.includes(s) || s.includes(y))
    if (ix && iy) return true
  }
  return false
}

export function ingredientsLikelyMatch(pantryName: string, recipeIngredientName: string): boolean {
  const p = pantryName.trim()
  const r = recipeIngredientName.trim()
  if (!p || !r) return false
  if (p === r) return true
  if (isFalseFriend(p, r)) return false
  if (p.includes(r) || r.includes(p)) return true
  return sameGroup(p, r)
}

export function findPantryItemForRecipeIngredient(
  items: PantryItem[],
  recipeIngredientName: string
): PantryItem | undefined {
  return items.find(i => ingredientsLikelyMatch(i.name, recipeIngredientName))
}
