/** 晚饭主菜候选规则（与 src/utils/mealPlanBuilder.ts 对齐） */

export const SAVORY_DINNER_ALLOW_RE =
  /咸饭|烧排骨|排骨汤|蒸芋头|香酥鸭|粉蒸排骨|剁椒|红烧|清炒|炖|煲|炒|煮|蒸(?!点)|煎|爆|焖|卤|拌|烤肉|烤鱼|烧肉|烧鸭|烧鸡/

export const NON_DINNER_MAIN_RE =
  /鲜芋仙|西米露|汤圆|麻薯|小丸子|烤奶|甜品|甜汤|糖水|奶茶|饮品|芋圆|仙草|芋头糕|面包(?!糠)|蛋糕|饼干|曲奇|慕斯|布丁|吐司|贝果|可颂|松饼|早餐|合集|小吃|点心|下午茶|厚奶|厚乳|刨冰|圣代|冰淇淋|奶昔|泡芙|蛋挞|瑞士卷|舒芙蕾|铜锣烧|华夫|烘焙|饮料|香芋牛奶|牛奶西米露|芋泥(?:汤圆|麻薯|小丸子|烤奶)|虎皮卷|糯米凉糕|凉糕|饭团|雪媚娘|奶冻|甜点|宝宝辅食|春游|便当|小食|香芋糕|香芋饼|芋[\u4e00-\u9fa5]{0,4}饼|芋泥鲜奶|鲜奶|芋泥馅|芋头泥|低脂芋头泥|生酮低碳|免炒芋泥|奶香芋泥|万能低脂|超好喝|糕|(?<![香酥])芋泥(?!香酥)/

export function recipeTitleText(recipe) {
  return [recipe.displayTitle, recipe.title, recipe.originalTitle, ...(recipe.tags || [])]
    .filter(Boolean)
    .join(' ')
}

export function isDinnerMainCandidate(recipe) {
  const text = recipeTitleText(recipe)
  if (NON_DINNER_MAIN_RE.test(text)) return false
  if (SAVORY_DINNER_ALLOW_RE.test(text)) return true
  if (/芋泥/.test(text) && /(?:汤圆|麻薯|小丸子|烤奶|甜品|奶茶|虎皮卷|凉糕|饭团)/.test(text)) {
    return false
  }
  return true
}
