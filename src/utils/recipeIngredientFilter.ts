import type { Recipe } from '../types/recipe'
import { ingredientsLikelyMatch } from './ingredientMatch'

/** 常规厨房常备：油盐酱醋、葱姜蒜、常见香料。不算「还缺、要去买」。 */
const STAPLE_NAMES = new Set([
  '油', '食用油', '植物油', '色拉油', '橄榄油', '花生油',
  '盐', '糖', '白糖', '冰糖', '红糖', '糖粉',
  '酱油', '生抽', '老抽', '蚝油', '料酒', '黄酒', '米酒', '花雕',
  '醋', '香醋', '白醋', '陈醋',
  '葱', '小葱', '大葱', '葱花', '葱段', '葱白',
  '姜', '生姜', '姜片', '姜末', '姜丝',
  '蒜', '大蒜', '蒜末', '蒜蓉', '蒜泥', '蒜片',
  '淀粉', '玉米淀粉', '生粉', '水', '清水', '热水', '冷水', '淀粉水',
  '花椒', '八角', '香叶', '桂皮', '胡椒粉', '白胡椒粉', '黑胡椒粉',
  '白胡椒', '黑胡椒', '五香粉', '十三香', '孜然', '孜然粉',
  '鸡精', '味精', '芝麻', '白芝麻', '香油', '芝麻油',
  '干辣椒', '小米辣', '豆瓣酱', '郫县豆瓣酱',
  '番茄酱', '虾皮', '虾米',
])

function normalizeIngredientName(name: string): string {
  return name.trim().replace(/^#+/, '').replace(/[🍯]/g, '').trim()
}

/** 「油/葱/蒜」做子串会误伤油麦菜、洋葱、蒜苔 */
const STAPLE_FALSE_FRIENDS = [
  '洋葱', '油麦菜', '蒜苔', '蒜苗', '蒜黄', '蒜蓉粉丝',
  '红辣椒', '青辣椒', '尖椒', '螺丝椒', '杭椒',
]

function isStaple(name: string): boolean {
  const n = normalizeIngredientName(name)
  if (!n) return true
  if (STAPLE_FALSE_FRIENDS.some((x) => n === x || n.includes(x))) return false
  if (STAPLE_NAMES.has(n)) return true
  // 单字（油/盐/糖/葱）只允许整名命中，避免「油麦菜」「洋葱」被当成调味
  return Array.from(STAPLE_NAMES).some((s) => s.length >= 2 && (n.includes(s) || s.includes(n)))
}

export function isStapleIngredient(name: string): boolean {
  return isStaple(name)
}

/** 方案/详情里真正该去买的：去掉常备调味和辅材 */
export function shopMissingItems<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const item of items) {
    const name = item.name.trim()
    if (!name || isStaple(name) || seen.has(name)) continue
    seen.add(name)
    out.push(item)
  }
  return out
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
