import { pickRealDishImage, isRealDishPhotoUrl } from '../data/dishImages'
import { EXACT_DISH_IMAGE_OVERRIDES } from '../data/exactDishImages'
import type { Recipe } from '../types/recipe'

/** legacy 精品（id 1–200）：仅封面精确表，步骤图为手写步骤不混用下厨房过程图 */
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
  return url && isRealDishPhotoUrl(url) ? url : undefined
}

/**
 * 配图规则（诚实、不糊弄）：
 * - catalog（下厨房抓取）：封面 + 步骤图均来自 chunk 内嵌，逐步 1:1
 * - legacy 200 手写精品：仅精确封面，步骤不贴图（避免与手写步骤错位）
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

  const steps = recipe.steps.map((step) => ({
    ...step,
    image: trustInline ? sanitizeImage(step.image) : undefined,
  }))

  const coverFromSteps = trustInline ? steps.find((s) => s.image)?.image : undefined
  return {
    ...recipe,
    image: image || coverFromSteps || undefined,
    steps,
  }
}
