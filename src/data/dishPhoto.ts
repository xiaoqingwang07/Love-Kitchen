/**
 * 菜谱高可信配图 URL 生成器。
 *
 * 之前的 Unsplash 图池会出现「菜名与照片不一致」的问题。这里改为按菜名与步骤内容
 * 生成稳定的写实食物摄影 URL：同一道菜固定同一张图，且 prompt 明确约束菜品主体。
 *
 * 小程序后台需把 image.pollinations.ai 加入 downloadFile 合法域名。
 */

const IMAGE_HOST = 'https://image.pollinations.ai/prompt'

const DISH_HINTS: Record<string, string> = {
  鲫鱼豆腐汤: 'milky white crucian carp tofu soup with tofu cubes and fish pieces in a ceramic bowl, authentic Chinese home cooking, absolutely no wontons, no dumplings, no noodles',
  黄焖鸡米饭: 'Chinese braised chicken with potatoes and green peppers served with white rice, rich brown sauce',
  番茄炒蛋: 'Chinese tomato scrambled eggs, glossy red tomatoes and soft yellow eggs on a white plate',
  清蒸鲈鱼: 'Chinese steamed sea bass with scallions and ginger, soy sauce, whole fish on oval plate',
  麻婆豆腐: 'Sichuan mapo tofu, tofu cubes in red chili oil sauce with minced pork and scallions',
  宫保鸡丁: 'Kung pao chicken with diced chicken, peanuts and dried chilies, Chinese stir fry',
  鱼香肉丝: 'Chinese yuxiang shredded pork with wood ear mushroom and carrots in glossy sauce',
  红烧肉: 'Chinese red braised pork belly cubes, glossy caramel soy sauce, home style',
  可乐鸡翅: 'Chinese cola chicken wings, glossy brown chicken wings in sweet soy sauce',
  蛋炒饭: 'Chinese egg fried rice with distinct rice grains, egg and scallion',
  葱油拌面: 'Shanghai scallion oil noodles, glossy noodles with fried scallions',
  白灼虾: 'Chinese poached shrimp, whole pink shrimp arranged on a plate with dipping sauce',
}

function stableHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function photoUrl(prompt: string, seed: string, height = 800): string {
  const clean = prompt
    .replace(/\s+/g, ' ')
    .trim()
  const params = [
    'width=1200',
    `height=${height}`,
    `seed=${stableHash(seed)}`,
    'model=flux',
    'nologo=true',
    'enhance=true',
  ].join('&')
  return `${IMAGE_HOST}/${encodeURIComponent(clean)}?${params}`
}

function negativeFor(title: string): string {
  const negatives: string[] = [
    'no text',
    'no watermark',
    'no cartoon',
    'no illustration',
    'no western fast food',
    'no people',
    'no hands',
  ]
  if (!/[饺包馄云吞锅贴]/.test(title)) {
    negatives.push('no dumplings', 'no wontons', 'no buns')
  }
  if (!/[面粉米粉河粉粉丝粉条意面]/.test(title)) {
    negatives.push('no noodles')
  }
  if (!/[饭粥米]/.test(title)) {
    negatives.push('no plain rice bowl')
  }
  return negatives.join(', ')
}

export function buildDishPhotoUrl(title: string, tags?: string[]): string {
  const dish = title.trim()
  const hint = DISH_HINTS[dish] || `authentic Chinese dish named "${dish}", home cooking food photography, realistic cooked dish, plated finished food, ${tags?.join(', ') || 'Chinese cuisine'}`
  const prompt = `${hint}, natural window light, appetizing, professional food photography, 50mm lens, realistic texture, ${negativeFor(dish)}`
  return photoUrl(prompt, `dish:${dish}`)
}

export function buildStepPhotoUrl(title: string, stepContent: string, index: number): string {
  const dish = title.trim()
  const prompt = `realistic Chinese cooking process photo for "${dish}", step ${index + 1}: ${stepContent}, show the actual ingredients, cookware, heat state and texture clearly, documentary kitchen food photography, ${negativeFor(dish)}`
  return photoUrl(prompt, `step:${dish}:${index}:${stepContent}`, 760)
}
