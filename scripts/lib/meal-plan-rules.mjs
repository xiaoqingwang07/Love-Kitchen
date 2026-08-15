/** 晚饭主菜 / 一餐角色规则（与 src/utils/mealPlanBuilder.ts 对齐） */

export const SAVORY_DINNER_ALLOW_RE =
  /咸饭|烧排骨|排骨汤|蒸芋头|香酥鸭|粉蒸排骨|剁椒|红烧|清炒|炖|煲|炒|煮|蒸(?!点)|煎|爆|焖|卤|拌|烤肉|烤鱼|烧肉|烧鸭|烧鸡/

export const NON_DINNER_MAIN_RE =
  /鲜芋仙|西米露|汤圆|麻薯|小丸子|烤奶|甜品|甜汤|糖水|奶茶|饮品|芋圆|仙草|芋头糕|面包(?!糠)|蛋糕|饼干|曲奇|慕斯|布丁|吐司|贝果|可颂|松饼|早餐|合集|小吃|点心|下午茶|厚奶|厚乳|刨冰|圣代|冰淇淋|奶昔|泡芙|蛋挞|瑞士卷|舒芙蕾|铜锣烧|华夫|烘焙|饮料|香芋牛奶|牛奶西米露|芋泥(?:汤圆|麻薯|小丸子|烤奶)|虎皮卷|糯米凉糕|凉糕|饭团|雪媚娘|奶冻|甜点|宝宝辅食|春游|便当|小食|香芋糕|香芋饼|芋[\u4e00-\u9fa5]{0,4}饼|芋泥鲜奶|鲜奶|芋泥馅|芋头泥|低脂芋头泥|生酮低碳|免炒芋泥|奶香芋泥|万能低脂|超好喝|糕|(?<![香酥])芋泥(?!香酥)/

/** 能撑起一餐的浓汤/炖汤，允许作为主菜 */
export const HEARTY_SOUP_RE = /排骨汤|鸡汤|牛肉汤|羊肉汤|鱼头汤|鸭汤|蹄花汤|羊蝎/

/** 凉菜 / 叶菜配菜，不应占主菜槽 */
export const VEG_SIDE_TITLE_RE =
  /凉拌|沙拉|拍黄瓜|手撕包菜|油麦菜|蒜蓉西兰花|清炒(?:油麦菜|时蔬|青菜|菠菜|生菜|白菜|西兰花|菜心|空心菜|娃娃菜|包菜)/

export const SOUP_TITLE_RE = /汤|羹|羮/

export function recipeTitleText(recipe) {
  return [recipe.displayTitle, recipe.title, recipe.originalTitle, ...(recipe.tags || [])]
    .filter(Boolean)
    .join(' ')
}

function tagsText(recipe) {
  return (recipe.tags || []).join('')
}

/** 一餐槽位：main / veg / soup / quick */
export function classifyMealRole(recipe) {
  const title = `${recipe.displayTitle || ''} ${recipe.title || ''}`
  const tags = tagsText(recipe)
  const text = `${title}${tags}`
  if (SOUP_TITLE_RE.test(title) || /汤类/.test(tags)) return 'soup'
  if (VEG_SIDE_TITLE_RE.test(title) || /凉菜|沙拉/.test(tags)) return 'veg'
  if ((recipe.time ?? 99) <= 12 && /快手|简单|10分钟|15分钟/.test(text)) return 'quick'
  return 'main'
}

export function isDinnerMainCandidate(recipe) {
  const text = recipeTitleText(recipe)
  if (NON_DINNER_MAIN_RE.test(text)) return false
  if (/芋泥/.test(text) && /(?:汤圆|麻薯|小丸子|烤奶|甜品|奶茶|虎皮卷|凉糕|饭团)/.test(text)) {
    return false
  }
  const role = classifyMealRole(recipe)
  if (role === 'veg') return false
  if (role === 'soup') return HEARTY_SOUP_RE.test(text)
  if (SAVORY_DINNER_ALLOW_RE.test(text)) return true
  return true
}
