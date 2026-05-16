import { pickDishImage } from '../data/dishImages'
import { getStepImages } from '../data/stepImages'
import type { Recipe } from '../types/recipe'

/**
 * 为菜谱补全配图：
 * - 头图：优先沿用菜谱已有 image；若无，则按菜名/标签智能匹配真实食物图（不再随机）；
 * - 步骤图：保留 step 自带 image；仅热门 30 道补关键步骤图，其他菜不乱配。
 *
 * 设计取舍：
 *   原版会给每一步配随机图，图文不符；
 *   现在只有人工挑过的热门菜步骤图会自动补全，其余步骤保持纯文字。
 */
export function enrichRecipeMedia(recipe: Recipe): Recipe {
  const image = recipe.image?.trim()
    ? recipe.image
    : pickDishImage(recipe.title, recipe.tags)
  if (!recipe.steps?.length) {
    return { ...recipe, image }
  }
  const stepImages = getStepImages(recipe.title)
  if (stepImages.length === 0) {
    return { ...recipe, image }
  }

  // 只给热门菜补「关键步骤图」：有图就保留，无图按顺序补，图片不足时不硬塞。
  const steps = recipe.steps.map((step, idx) => ({
    ...step,
    image: step.image || stepImages[idx] || undefined,
  }))
  return { ...recipe, image, steps }
}
