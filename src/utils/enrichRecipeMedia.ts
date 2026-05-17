import { pickDishImage } from '../data/dishImages'
import { buildStepPhotoUrl } from '../data/dishPhoto'
import type { Recipe } from '../types/recipe'

/**
 * 为菜谱补全配图：
 * - 头图：优先沿用菜谱已有 image；若无，则按菜名/标签智能匹配真实食物图（不再随机）；
 * - 步骤图：保留 step 自带 image；若缺失，按「菜名 + 步骤内容」生成稳定写实过程图。
 *
 * 设计取舍：
 *   原版会给每一步配随机图，图文不符；
 *   现在每一步都基于具体菜名和步骤内容生成，避免出现泛图或错图。
 */
export function enrichRecipeMedia(recipe: Recipe): Recipe {
  const image = recipe.image?.trim()
    ? recipe.image
    : pickDishImage(recipe.title, recipe.tags)
  if (!recipe.steps?.length) {
    return { ...recipe, image }
  }
  const steps = recipe.steps.map((step, idx) => ({
    ...step,
    image: step.image || buildStepPhotoUrl(recipe.title, step.content, idx),
  }))
  return { ...recipe, image, steps }
}
