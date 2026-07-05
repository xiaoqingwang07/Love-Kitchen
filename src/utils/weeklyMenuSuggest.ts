/**
 * 每周菜单建议：基于冰箱食材 + 高质量菜谱，按周种子稳定输出
 */
import { getCatalogRecipes } from '../data/recipeRegistry'
import { isPremiumDisplayRecipe } from './catalogQuality'
import { ingredientsLikelyMatch } from './ingredientMatch'

const WEEKDAY = ['周一', '周二', '周三', '周四', '周五']

function weekSeed(): number {
  const now = new Date()
  const jan1 = new Date(now.getFullYear(), 0, 1)
  return Math.floor((now.getTime() - jan1.getTime()) / (7 * 86400000))
}

function stableHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

export type WeeklyMenuDay = {
  label: string
  title: string
  recipeId: string | number
}

export function buildWeeklyMenuSuggestion(
  pantryNames: string[],
  days = 5
): WeeklyMenuDay[] {
  const pool = getCatalogRecipes().filter(isPremiumDisplayRecipe)
  if (pool.length === 0) return []

  const seed = weekSeed()
  const scored = pool
    .map((r) => {
      const ingNames = (r.ingredients || []).map((i) => i.name)
      const hits = pantryNames.filter((p) =>
        ingNames.some((ing) => ingredientsLikelyMatch(p, ing))
      ).length
      const score = hits * 10 + (r.qualityScore ?? 50) + (r.rating ?? 0)
      return { r, score, tie: stableHash(`${seed}:${r.title}`) }
    })
    .sort((a, b) => b.score - a.score || a.tie - b.tie)

  const picked: WeeklyMenuDay[] = []
  const used = new Set<string>()
  for (const { r } of scored) {
    const key = r.title.trim()
    if (!key || used.has(key)) continue
    used.add(key)
    picked.push({
      label: WEEKDAY[picked.length] ?? `第${picked.length + 1}天`,
      title: r.displayTitle || r.title,
      recipeId: r.id,
    })
    if (picked.length >= days) break
  }

  return picked
}

export function weeklyMenuSummary(days: WeeklyMenuDay[]): string {
  if (!days.length) return '录入冰箱后生成本周建议'
  return days.map((d) => `${d.label} ${d.title}`).join(' · ')
}
