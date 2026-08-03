import { pickRealDishImage } from '../data/dishImages'
import { EXACT_DISH_IMAGE_OVERRIDES } from '../data/exactDishImages'
import { getStepImages } from '../data/stepImages'
import { recipeImageUrl, isRenderableRecipeImage } from './recipeImageUrl'
import type { Recipe } from '../types/recipe'

/** legacy 精品（id 1–200）：封面走精确表，步骤图走 STEP_IMAGE_MAP */
function canUseLegacyCover(recipe: Recipe): boolean {
  const id = Number(recipe.id)
  if (Number.isFinite(id) && id >= 1 && id <= 200) return true
  const title = (recipe.title || '').trim()
  return Boolean(title && EXACT_DISH_IMAGE_OVERRIDES[title])
}

/** catalog / 下厨房来源：只展示逐步内嵌图（1:1 对齐后） */
function shouldTrustInlineStepImages(recipe: Recipe): boolean {
  const ext = recipe as Recipe & { mediaAligned?: boolean; xiachufangId?: string }
  if (ext.mediaAligned === true || ext.xiachufangId) return true
  const id = Number(recipe.id)
  if (Number.isFinite(id) && id > 200) return true
  return !canUseLegacyCover(recipe)
}

function sanitizeImage(url?: string): string | undefined {
  const resolved = recipeImageUrl(url)
  if (!resolved || !isRenderableRecipeImage(resolved)) return undefined
  return resolved
}

/**
 * 配图规则（诚实、不糊弄）：
 * - catalog（下厨房抓取）：封面 + 步骤图均来自 chunk 内嵌，逐步 1:1
 * - legacy 200 手写精品：精确封面 + STEP_IMAGE_MAP 里按本地步骤数对齐过的真实过程图
 * - AI 生成：无真实图 → emoji
 */
export function enrichRecipeMedia(recipe: Recipe): Recipe {
  const trustInline = shouldTrustInlineStepImages(recipe)

  const inlineCover = sanitizeImage(recipe.image)
  const legacyCover =
    !trustInline && canUseLegacyCover(recipe)
      ? sanitizeImage(pickRealDishImage(recipe.title, []))
      : undefined
  const image = inlineCover || legacyCover

  if (!recipe.steps?.length) {
    return { ...recipe, image: image || undefined }
  }

  /**
   * legacy 菜谱的步骤图来自 STEP_IMAGE_MAP（scripts/fetch-recipe-images.mjs 抓取并
   * 按本地步骤数对齐）。此前该表虽已生成，但没有任何代码读取它，
   * 导致这 200 道菜在烹饪模式下全程纯文字。
   */
  const legacySteps = !trustInline ? getStepImages(recipe.title) : []

  const steps = recipe.steps.map((step, idx) => ({
    ...step,
    image: trustInline ? sanitizeImage(step.image) : sanitizeImage(legacySteps[idx]),
  }))

  const coverFromSteps = trustInline ? steps.find((s) => s.image)?.image : undefined
  return {
    ...recipe,
    image: image || coverFromSteps || undefined,
    steps,
  }
}
