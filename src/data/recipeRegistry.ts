/**
 * 菜谱统一注册表：内置库 + 用户定制库，供搜索 / 匹配 / 详情共用。
 * 扩库时优先改内置数据；用户侧新增走 customRecipes 存储。
 */
import { getCatalogLiteRecipes, getRecipeDetailById, getRecipeDetailByIdSync } from './catalogLoader'
import { getCustomRecipes } from '../store/customRecipes'
import type { Recipe } from '../types/recipe'

/** 内置本地库（catalog 或 legacy 200 道） */
export function getBuiltinRecipes(): Recipe[] {
  return getCatalogLiteRecipes()
}

/** 用户保存的定制菜谱（AI 生成后入库、或后续脚本导入） */
export function getUserCustomRecipes(): Recipe[] {
  return getCustomRecipes()
}

/** 全库：内置 + 定制（同名时定制覆盖内置，便于用户覆盖） */
export function getCatalogRecipes(): Recipe[] {
  const custom = getCustomRecipes()
  const customTitles = new Set(custom.map((r) => r.title.trim()))
  const builtin = getCatalogLiteRecipes().filter((r) => !customTitles.has(r.title.trim()))
  return [...builtin, ...custom.map((r) => ({ ...r, source: r.source ?? 'custom' }))]
}

export function findRecipeById(id: string | number): Recipe | undefined {
  const sid = String(id)
  const custom = getCustomRecipes().find((r) => String(r.id) === sid)
  if (custom) return custom
  const detail = getRecipeDetailByIdSync(id)
  if (detail) return detail
  return getCatalogRecipes().find(
    (r) => String(r.id) === sid || (r.catalogId != null && String(r.catalogId) === sid)
  )
}

export function findRecipeByTitleExact(title: string): Recipe | undefined {
  const t = title.trim()
  if (!t) return undefined
  return getCatalogRecipes().find((r) => r.title.trim() === t)
}

/** 轻量条目补全步骤（catalog chunk 懒加载） */
export async function resolveFullRecipe(recipe: Recipe): Promise<Recipe> {
  if (recipe.steps?.length) return recipe
  if (recipe.id == null) return recipe
  const full = await getRecipeDetailById(recipe.id)
  return full ?? recipe
}
