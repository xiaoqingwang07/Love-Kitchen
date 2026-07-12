import { matchRecipes } from './recipeMatch'
import { getCatalogRecipes } from '../data/recipeRegistry'
import { ingredientsLikelyMatch } from './ingredientMatch'
import { isRecommendable } from './catalogQuality'
import { fetchRecipes, usesLlmProxy } from '../api/recipe'
import type { Recipe } from '../types/recipe'
import type { MealConstraint, MealPlan, MealPlanRecipeSlot, MealRecipeRole } from '../types/mealPlan'

const SOUP_KW = ['汤', '炖', '煲', '羮', '羹']
const VEG_KW = ['素', '蔬菜', '凉拌', '沙拉', '清炒', '蒜蓉', '西兰花', '菠菜', '青菜']
const QUICK_KW = ['快手', '简单', '10分钟', '15分钟']

const SAVORY_DINNER_ALLOW_RE =
  /咸饭|烧排骨|排骨汤|蒸芋头|香酥鸭|粉蒸排骨|剁椒|红烧|清炒|炖|煲|炒|煮|蒸(?!点)|煎|爆|焖|卤|拌|烤肉|烤鱼|烧肉|烧鸭|烧鸡/

const NON_DINNER_MAIN_RE =
  /鲜芋仙|西米露|汤圆|麻薯|小丸子|烤奶|甜品|甜汤|糖水|奶茶|饮品|芋圆|仙草|芋头糕|面包(?!糠)|蛋糕|饼干|曲奇|慕斯|布丁|吐司|贝果|可颂|松饼|早餐|合集|小吃|点心|下午茶|厚奶|厚乳|刨冰|圣代|冰淇淋|奶昔|泡芙|蛋挞|瑞士卷|舒芙蕾|铜锣烧|华夫|烘焙|饮料|香芋牛奶|牛奶西米露|芋泥(?:汤圆|麻薯|小丸子|烤奶)|虎皮卷|糯米凉糕|凉糕|饭团|雪媚娘|奶冻|甜点|宝宝辅食|春游|便当|小食|香芋糕|香芋饼|芋[\u4e00-\u9fa5]{0,4}饼|芋泥鲜奶|鲜奶|芋泥馅|芋头泥|低脂芋头泥|生酮低碳|免炒芋泥|奶香芋泥|万能低脂|超好喝|糕|(?<![香酥])芋泥(?!香酥)/

function recipeTitleText(recipe: Recipe): string {
  return [recipe.displayTitle, recipe.title, recipe.originalTitle, ...(recipe.tags || [])]
    .filter(Boolean)
    .join(' ')
}

/** 是否适合作为晚饭主菜（仅看标题/tags，不看 ingredients） */
export function isDinnerMainCandidate(recipe: Recipe): boolean {
  const text = recipeTitleText(recipe)
  if (NON_DINNER_MAIN_RE.test(text)) return false
  if (SAVORY_DINNER_ALLOW_RE.test(text)) return true
  if (/芋泥/.test(text) && /(?:汤圆|麻薯|小丸子|烤奶|甜品|奶茶|虎皮卷|凉糕|饭团)/.test(text)) {
    return false
  }
  return true
}

/** @deprecated 使用 isDinnerMainCandidate */
export function isDessertOrDrink(recipe: Recipe): boolean {
  return !isDinnerMainCandidate(recipe)
}

function classifyRole(recipe: Recipe): MealRecipeRole {
  const text = `${recipe.title}${(recipe.tags || []).join('')}`
  if (SOUP_KW.some((k) => text.includes(k))) return 'soup'
  if (VEG_KW.some((k) => text.includes(k))) return 'veg'
  if ((recipe.time ?? 99) <= 12 && QUICK_KW.some((k) => text.includes(k))) return 'quick'
  return 'main'
}

function recipeMatchesConstraints(recipe: Recipe, constraints: MealConstraint[]): boolean {
  for (const c of constraints) {
    if (c === 'quick15' && (recipe.time ?? 99) > 15) return false
    if (c === 'light') {
      const text = `${recipe.title}${(recipe.tags || []).join('')}`
      if (/重口|麻辣|炸|烧烤|红烧/.test(text)) return false
    }
    if (c === 'highProtein') {
      const text = `${recipe.title}${(recipe.ingredients || []).map((i) => i.name).join('')}`
      if (!/肉|鸡|鱼|虾|蛋|牛|猪|豆腐/.test(text)) return false
    }
    if (c === 'kidFriendly') {
      const text = `${recipe.title}${(recipe.tags || []).join('')}`
      if (/辣|麻|花椒|魔鬼/.test(text)) return false
    }
  }
  return true
}

function collectMissing(
  recipes: Recipe[],
  pantryNames: string[]
): { name: string; amount: string }[] {
  const missing: { name: string; amount: string }[] = []
  const seen = new Set<string>()
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients || []) {
      const key = ing.name.trim()
      if (!key || seen.has(key)) continue
      const hit = pantryNames.some((p) => ingredientsLikelyMatch(p, key))
      if (!hit) {
        seen.add(key)
        missing.push({ name: key, amount: ing.amount || '适量' })
      }
    }
  }
  return missing
}

/** 将菜谱用料名映射回用户选中的冰箱食材名，避免「芋头/荔浦芋头」重复计数 */
function canonicalPantryName(pantryNames: string[], ingredientName: string): string | null {
  const hit = pantryNames.find((p) => ingredientsLikelyMatch(p, ingredientName))
  return hit?.trim() || null
}

function normalizeUsedPantryNames(pantryNames: string[], ingredientNames: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const name of ingredientNames) {
    const canonical = canonicalPantryName(pantryNames, name)
    if (!canonical || seen.has(canonical)) continue
    seen.add(canonical)
    out.push(canonical)
  }
  return out
}

function countExpiringHits(pantryNames: string[], expiringNames: string[], ingredientNames: string[]): number {
  const expiringHit = new Set<string>()
  for (const name of ingredientNames) {
    const canonical = canonicalPantryName(pantryNames, name)
    if (!canonical) continue
    if (expiringNames.some((e) => ingredientsLikelyMatch(e, canonical))) {
      expiringHit.add(canonical)
    }
  }
  return expiringHit.size
}

function buildPlanFromMain(
  mainMatch: ReturnType<typeof matchRecipes>[0],
  pantryNames: string[],
  expiringNames: string[],
  constraints: MealConstraint[],
  servings: number,
  altIndex: number
): MealPlan | null {
  const main = mainMatch.recipe
  if (!isRecommendable(main)) return null
  if (!isDinnerMainCandidate(main)) return null
  if (!recipeMatchesConstraints(main, constraints)) return null

  const usedSet = new Set<string>()
  const slots: MealPlanRecipeSlot[] = [
    {
      role: 'main',
      recipe: main,
      usedIngredients: normalizeUsedPantryNames(pantryNames, mainMatch.matchedIngredients),
      expiringUsed: normalizeUsedPantryNames(
        pantryNames,
        mainMatch.matchedExpiringIngredients
      ),
    },
  ]
  mainMatch.matchedIngredients.forEach((n) => {
    const c = canonicalPantryName(pantryNames, n)
    if (c) usedSet.add(c)
  })

  const candidates = getCatalogRecipes().filter((r) => r.id !== main.id && isRecommendable(r))
  const pickSide = (role: MealRecipeRole, keywords: string[]): Recipe | null => {
    const pool = candidates
      .filter((r) => classifyRole(r) === role || keywords.some((k) => r.title.includes(k)))
      .filter((r) => recipeMatchesConstraints(r, constraints))
      .slice(altIndex * 3, altIndex * 3 + 12)
    for (const r of pool) {
      const names = (r.ingredients || []).map((i) => i.name)
      const overlap = names.filter((n) =>
        pantryNames.some((p) => ingredientsLikelyMatch(p, n))
      )
      if (overlap.length >= 1 || role === 'soup') return r
    }
    return pool[0] ?? null
  }

  const veg = pickSide('veg', VEG_KW)
  if (veg) {
    const names = (veg.ingredients || []).map((i) => i.name)
    const overlap = names.filter((n) => pantryNames.some((p) => ingredientsLikelyMatch(p, n)))
    const expiringUsed = normalizeUsedPantryNames(pantryNames, overlap).filter((n) =>
      expiringNames.some((e) => ingredientsLikelyMatch(e, n))
    )
    slots.push({
      role: 'veg',
      recipe: veg,
      usedIngredients: normalizeUsedPantryNames(pantryNames, overlap),
      expiringUsed,
    })
  }

  const soup = pickSide('soup', SOUP_KW)
  if (soup && (soup.time ?? 0) <= 40) {
    const names = (soup.ingredients || []).map((i) => i.name)
    const overlap = names.filter((n) => pantryNames.some((p) => ingredientsLikelyMatch(p, n)))
    const expiringUsed = normalizeUsedPantryNames(pantryNames, overlap).filter((n) =>
      expiringNames.some((e) => ingredientsLikelyMatch(e, n))
    )
    slots.push({
      role: 'soup',
      recipe: soup,
      usedIngredients: normalizeUsedPantryNames(pantryNames, overlap),
      expiringUsed,
    })
  }

  const allRecipes = slots.map((s) => s.recipe)
  const usedPantry = Array.from(new Set(slots.flatMap((s) => s.usedIngredients)))
  const expiringHit = countExpiringHits(
    pantryNames.length > 0 ? pantryNames : expiringNames,
    expiringNames,
    slots.flatMap((s) => s.usedIngredients)
  )
  const expiringConsumeRatio =
    expiringNames.length > 0 ? Math.min(1, expiringHit / expiringNames.length) : 0
  const totalTime = allRecipes.reduce((sum, r) => sum + (r.time ?? 15), 0)
  const missingItems = collectMissing(allRecipes, pantryNames)
  const qualityScore = Math.round(
    slots.reduce((s, slot) => s + (slot.recipe.qualityScore ?? 80), 0) / slots.length
  )

  const reason =
    expiringNames.length > 0
      ? `优先消耗临期：${expiringNames.slice(0, 3).join('、')}${expiringNames.length > 3 ? ' 等' : ''}`
      : pantryNames.length > 0
      ? `基于冰箱里的 ${pantryNames.slice(0, 3).join('、')} 搭配`
      : '家常稳妥的一餐组合'

  return {
    id: `meal-${main.id}-${altIndex}`,
    recipes: slots,
    usedPantryItems: usedPantry,
    missingItems,
    totalTime,
    servings,
    expiringConsumeRatio,
    reason,
    qualityScore,
  }
}

export function buildLocalMealPlans(opts: {
  pantryNames: string[]
  expiringNames?: string[]
  constraints?: MealConstraint[]
  servings?: number
  limit?: number
}): MealPlan[] {
  const {
    pantryNames,
    expiringNames = [],
    constraints = [],
    servings = 3,
    limit = 3,
  } = opts
  const selected = pantryNames.map((s) => s.trim()).filter(Boolean)
  if (selected.length === 0 && expiringNames.length === 0) {
    const pool = getCatalogRecipes()
      .filter(isRecommendable)
      .filter((r) => isDinnerMainCandidate(r))
      .slice(0, 12)
    const plans: MealPlan[] = []
    for (let i = 0; i < Math.min(limit, pool.length); i++) {
      const main = pool[i]
      const fakeMatch = {
        recipe: main,
        matchedIngredients: (main.ingredients || []).map((ing) => ing.name).slice(0, 3),
        matchedExpiringIngredients: [] as string[],
        matchCount: 1,
        coverageRate: 0.5,
        score: main.rating || 0,
      }
      const plan = buildPlanFromMain(fakeMatch, [], [], constraints, servings, i)
      if (plan) plans.push(plan)
    }
    return plans
  }

  const matchSource = selected.length > 0 ? selected : expiringNames
  const matches = matchRecipes(matchSource, 20, expiringNames).filter((m) =>
    isDinnerMainCandidate(m.recipe)
  )
  const plans: MealPlan[] = []

  for (let i = 0; i < Math.min(limit, matches.length); i++) {
    const plan = buildPlanFromMain(
      matches[i],
      pantryNames.length > 0 ? pantryNames : expiringNames,
      expiringNames,
      constraints,
      servings,
      i
    )
    if (plan) plans.push(plan)
  }

  return plans
}

/** 本地方案优先；不足时用 AI 菜谱补充（失败则仅返回本地） */
export async function buildMealPlansWithAiFallback(
  opts: Parameters<typeof buildLocalMealPlans>[0]
): Promise<MealPlan[]> {
  const limit = opts.limit ?? 3
  const expiringNames = opts.expiringNames ?? []
  const constraints = opts.constraints ?? []
  const servings = opts.servings ?? 3
  const pantryNames = opts.pantryNames ?? []
  const local = buildLocalMealPlans({ pantryNames, expiringNames, constraints, servings, limit })
  if (local.length >= limit || !usesLlmProxy()) return local

  const ingredients = pantryNames.length > 0 ? pantryNames : expiringNames
  if (ingredients.length === 0) return local

  try {
    const aiRecipes = await fetchRecipes(ingredients, 4, { scene: 'normal' })
    const merged = [...local]
    for (const recipe of aiRecipes) {
      if (merged.length >= limit) break
      if (merged.some((p) => p.recipes.some((s) => String(s.recipe.id) === String(recipe.id)))) continue
      const fakeMatch = {
        recipe: { ...recipe, source: recipe.source ?? 'ai' },
        matchedIngredients: (recipe.ingredients || []).map((ing) => ing.name).slice(0, 4),
        matchedExpiringIngredients: [] as string[],
        matchCount: 1,
        coverageRate: 0.4,
        score: recipe.rating || 0,
      }
      const plan = buildPlanFromMain(
        fakeMatch,
        pantryNames.length > 0 ? pantryNames : expiringNames,
        expiringNames,
        constraints,
        servings,
        merged.length
      )
      if (plan) {
        plan.reason = 'AI 补充的一餐搭配'
        merged.push(plan)
      }
    }
    return merged.slice(0, limit)
  } catch {
    return local
  }
}

export type MealPlanDegradeLevel = 'none' | 'relaxed' | 'generic'

export type MealPlanBuildOutcome = {
  plans: MealPlan[]
  /** none=正常；relaxed=放宽了筛选条件；generic=所选食材拼不出，改为家常兜底 */
  degraded: MealPlanDegradeLevel
}

/**
 * 永不空手的方案生成：
 * 1. 按用户所选食材 + 约束正常拼；
 * 2. 拼不出则去掉约束重试（放宽）；
 * 3. 仍拼不出则退回「热门家常搭配」，保证结果页永远给得出可做的一餐。
 */
export async function buildMealPlansResilient(
  opts: Parameters<typeof buildLocalMealPlans>[0]
): Promise<MealPlanBuildOutcome> {
  const strict = await buildMealPlansWithAiFallback(opts)
  if (strict.length > 0) return { plans: strict, degraded: 'none' }

  if ((opts.constraints?.length ?? 0) > 0) {
    const relaxed = await buildMealPlansWithAiFallback({ ...opts, constraints: [] })
    if (relaxed.length > 0) return { plans: relaxed, degraded: 'relaxed' }
  }

  const generic = buildLocalMealPlans({
    pantryNames: [],
    expiringNames: [],
    constraints: [],
    servings: opts.servings,
    limit: opts.limit,
  })
  return { plans: generic, degraded: 'generic' }
}

export function mealRoleLabel(role: MealRecipeRole): string {
  switch (role) {
    case 'main':
      return '主菜'
    case 'veg':
      return '素菜'
    case 'soup':
      return '汤'
    case 'quick':
      return '快手'
    default:
      return '菜'
  }
}
