#!/usr/bin/env node
/**
 * 功能级冒烟验证（无需微信开发者工具）
 */
import fs from 'node:fs'
import path from 'node:path'
import {
  hasTitleIssue,
  cleanDisplayTitle,
  computeQualityScore,
  hasTimeIssue,
  isPremiumDisplayRecipe,
  hasPremiumDisplayIssue,
  isPremiumFullDish,
  isGenericFallbackTitle,
  GENERIC_FALLBACK_TITLES,
} from './lib/catalog-quality-rules.mjs'
import { isDinnerMainCandidate, recipeTitleText } from './lib/meal-plan-rules.mjs'

const root = process.cwd()
const failures = []

function ok(name, condition) {
  if (!condition) failures.push(name)
}

// ── catalog 质量规则 ──
ok('标题党应被识别', hasTitleIssue('超开胃的番茄土豆肥牛汤‼️下米饭无敌了'))
ok('正常标题不应误报', !hasTitleIssue('番茄炒蛋'))
ok('displayTitle 应清洗 emoji', cleanDisplayTitle('番茄炒蛋🔥🔥').includes('番茄'))
ok('复杂5分钟应判异常', hasTimeIssue({ title: '测试', difficulty: '复杂', time: 3, steps: [{ content: 'a' }] }))
ok('qualityScore 高分菜 > 60', computeQualityScore({ title: '番茄炒蛋', time: 15, difficulty: '简单', rating: 8.5 }) >= 60)

const dirtyTitles = [
  '好吃到舔盘的蒜香黑椒牛肉粒',
  '下饭菜里的天花板 青椒茄子擂辣椒皮蛋',
  '香辣孜然土豆火腿肠～秒杀烧烤店',
  '全蛋️无芝士❗️奶香浓郁的烤牛奶',
  '在亲戚家吃过一回，被惊艳了…',
]
for (const title of dirtyTitles) {
  const cleaned = cleanDisplayTitle(title)
  ok(`清洗首页脏标题：${title}`, !/[❗🔥✨💯]|舔盘|天花板|秒杀|巨好|被惊艳|亲戚家/.test(cleaned))
  ok(`清洗后标题不能为空：${title}`, cleaned.length >= 2)
  ok(`清洗后标题不应过长：${title}`, cleaned.length <= 16)
}
ok('营销标题应被识别：舔盘', hasTitleIssue('好吃到舔盘的蒜香黑椒牛肉粒'))
ok('营销标题应被识别：天花板', hasTitleIssue('下饭菜里的天花板 青椒茄子擂辣椒皮蛋'))
ok('营销标题应被识别：秒杀', hasTitleIssue('香辣孜然土豆火腿肠～秒杀烧烤店'))

const platformDirtyTitles = [
  '今天这个补钙神器超下饭菜',
  '简直不失败的粉嘟嘟同款',
  '好吃的复刻产品同款',
]
for (const title of platformDirtyTitles) {
  ok(`平台感标题应被识别：${title}`, hasTitleIssue(title))
  const cleaned = cleanDisplayTitle(title)
  ok(
    `清洗平台感标题：${title}`,
    !/今天这个|简直不|补钙神器|超下饭|粉嘟嘟|同款|复刻|产品/.test(cleaned)
  )
}

const recommendSrc = fs.readFileSync(path.join(root, 'src/utils/recommend.ts'), 'utf8')
ok('首页推荐池应排除标题异常菜谱', recommendSrc.includes('isPremiumDisplayRecipe'))

const weeklySrc = fs.readFileSync(path.join(root, 'src/utils/weeklyMenuSuggest.ts'), 'utf8')
ok('Profile 本周晚饭应使用精品池', weeklySrc.includes('isPremiumDisplayRecipe'))

const recipeResultCardSrc = fs.readFileSync(
  path.join(root, 'src/pages/result/components/RecipeResultCard.tsx'),
  'utf8'
)
ok('结果卡片应展示 displayTitle', recipeResultCardSrc.includes('displayTitle || recipe.title'))

const recipeImageSrc = fs.readFileSync(path.join(root, 'src/utils/recipeImageUrl.ts'), 'utf8')
ok('本地不可靠图片应可识别', recipeImageSrc.includes('isRenderableRecipeImage'))
ok('本地 catalog 代理应降级为占位', recipeImageSrc.includes('return undefined'))

const mealBuilderSrc = fs.readFileSync(path.join(root, 'src/utils/mealPlanBuilder.ts'), 'utf8')
ok('晚饭主菜应先 block 再 allow', /NON_DINNER_MAIN_RE\.test\(text\)\) return false/.test(mealBuilderSrc))
ok('buildPlanFromMain 应拒绝非晚饭主菜', mealBuilderSrc.includes('isDinnerMainCandidate(main)'))

const blockedMainTitles = [
  '香芋牛奶西米露',
  '芋泥汤圆',
  '芋泥麻薯小丸子',
  '芋头糕',
  '芋泥烤奶',
  '鲜芋仙双皮奶',
  '芋圆奶茶',
  '芋泥虎皮卷',
  '紫薯芋泥糯米凉糕',
  '春游小饭团',
  '咸香咸香的香芋糕',
  '自制无添加万能低脂芋头泥',
  '生酮低碳免炒芋泥',
  '芋泥馅',
  '超好喝的芋泥鲜奶',
  '健康奶香芋泥',
]
for (const title of blockedMainTitles) {
  ok(`芋头场景主菜应排除：${title}`, !isDinnerMainCandidate({ title, displayTitle: title }))
}
for (const title of ['芋头烧排骨', '剁椒蒸芋头', '芋泥香酥鸭', '粉蒸排骨肉', '自制芋头咸饭', '芋头排骨汤']) {
  ok(`晚饭主菜应保留：${title}`, isDinnerMainCandidate({ title, displayTitle: title }))
}
ok('紫菜蛋花汤不应当晚饭主菜', !isDinnerMainCandidate({ title: '紫菜蛋花汤', displayTitle: '紫菜蛋花汤', tags: ['汤类', '快手'] }))
ok('凉拌黄瓜不应当晚饭主菜', !isDinnerMainCandidate({ title: '凉拌黄瓜', displayTitle: '凉拌黄瓜', tags: ['凉菜', '素食'] }))
ok('白灼虾应可当晚饭主菜', isDinnerMainCandidate({ title: '白灼虾', displayTitle: '白灼虾', tags: ['海鲜'] }))
ok('清炒油麦菜不应当晚饭主菜', !isDinnerMainCandidate({ title: '清炒油麦菜', displayTitle: '清炒油麦菜', tags: ['炒菜', '素食'] }))
for (const title of ['广式香芋饼', '只需三样食材的烧芋头']) {
  if (title.includes('香芋饼')) {
    ok(`晚饭主菜应排除：${title}`, !isDinnerMainCandidate({ title, displayTitle: title }))
  } else {
    ok(`烧芋头展示名应清洗：${title}`, cleanDisplayTitle(title) === '烧芋头')
    ok(`晚饭主菜可保留：${title}`, isDinnerMainCandidate({
      title: cleanDisplayTitle(title),
      displayTitle: cleanDisplayTitle(title),
    }))
  }
}

const realWorldPremiumTitles = [
  [
    '这样做的豆角拿肉都不换',
    (cleaned) => /豆角/.test(cleaned) && !/这样做的|拿肉都不换/.test(cleaned),
    false,
  ],
  [
    '免烤️搅一搅就成功｜大理石纹紫薯慕斯蛋糕',
    (cleaned) => /慕斯|紫薯|蛋糕/.test(cleaned) && !/免烤|搅一搅就成功|大理石纹/.test(cleaned),
    false,
  ],
  [
    '村驴老师的水嫩鸡排',
    (cleaned) => cleaned === '水嫩鸡排',
    true,
  ],
]
for (const [raw, expectClean, expectPremium] of realWorldPremiumTitles) {
  ok(`平台标题应被识别：${raw}`, hasTitleIssue(raw) || hasPremiumDisplayIssue(raw))
  const cleaned = cleanDisplayTitle(raw)
  ok(`清洗后像菜名：${raw}`, expectClean(cleaned))
  ok(`清洗后无平台话术：${raw}`, !/这样做的|拿肉都不换|免烤|搅一搅就成功|村驴老师|老师的|大理石纹/.test(cleaned))
  const recipe = {
    originalTitle: raw,
    displayTitle: cleaned,
    title: cleaned,
    qualityScore: 90,
    time: 20,
    difficulty: '简单',
    rating: 8.5,
  }
  ok(
    `精品池预期 ${expectPremium ? '允许' : '拒绝'}：${raw}`,
    isPremiumDisplayRecipe(recipe) === expectPremium
  )
}

const titleCleanCases = [
  ['家庭版～鱼香肉丝', '鱼香肉丝'],
  ['家庭必备腌黄瓜', '腌黄瓜'],
  ['土豆燉牛肉之饭扫光', '土豆炖牛肉'],
  ['夏日开胃小凉菜"皮蛋拌黄瓜🥒"开胃减脂', '皮蛋拌黄瓜'],
  ['下饭菜"青椒酿肉"，香糯多汁鲜嫩下饭', '青椒酿肉'],
  ['香菇卤肉饭造起来', '香菇卤肉饭'],
  ['香到嘬手指的"手把排骨"', '手把排骨'],
  ['只需三样食材的烧芋头', '烧芋头'],
]
for (const [raw, expected] of titleCleanCases) {
  const cleaned = cleanDisplayTitle(raw)
  ok(`标题清洗：${raw} -> ${expected}`, cleaned === expected)
}

const condimentRaw = '万能的"拌面，水饺🥟"调料'
ok(
  '万能调料不进精品池',
  !isPremiumDisplayRecipe({
    originalTitle: condimentRaw,
    displayTitle: cleanDisplayTitle(condimentRaw),
    title: cleanDisplayTitle(condimentRaw),
    qualityScore: 90,
    rating: 9,
  })
)

const relativeRaw = '在亲戚家吃过一回，被惊艳了…'
const relativeClean = cleanDisplayTitle(relativeRaw)
ok('亲戚家标题清洗不为空', relativeClean.length >= 2)
ok(
  '亲戚家标题不进精品池',
  !isPremiumDisplayRecipe({
    originalTitle: relativeRaw,
    displayTitle: relativeClean,
    title: relativeClean,
    qualityScore: 90,
    rating: 9,
  })
)

const notFullDishTitles = [
  '酱香饼的酱',
  '拌凉菜万能拌料汁',
  '家庭必备腌黄瓜',
]
for (const raw of notFullDishTitles) {
  const cleaned = cleanDisplayTitle(raw.includes('腌黄瓜') ? raw : raw)
  ok(`非完整菜品应拒绝精品池：${raw}`, !isPremiumDisplayRecipe({
    originalTitle: raw,
    displayTitle: cleaned,
    title: cleaned,
    qualityScore: 90,
    rating: 9,
  }))
  ok(`非完整菜品识别：${cleaned}`, !isPremiumFullDish(cleaned))
}

const fullDishTitle = cleanDisplayTitle('家庭版～鱼香肉丝')
ok('完整菜品应允许精品池：鱼香肉丝', isPremiumDisplayRecipe({
  originalTitle: '家庭版～鱼香肉丝',
  displayTitle: fullDishTitle,
  title: fullDishTitle,
  qualityScore: 90,
  rating: 9,
}))

function loadCatalogRecipes() {
  const indexPath = path.join(root, 'catalog-cdn/index.json')
  if (!fs.existsSync(indexPath)) return []
  return JSON.parse(fs.readFileSync(indexPath, 'utf8'))
}

const catalogRecipes = loadCatalogRecipes()
ok('catalog 样本应可加载', catalogRecipes.length >= 1000)

const premiumPool = catalogRecipes.filter(isPremiumDisplayRecipe)
const genericFallbackPremium = premiumPool.filter((r) =>
  GENERIC_FALLBACK_TITLES.includes(r.displayTitle || r.title)
).length
ok('genericFallbackPremium 必须为 0', genericFallbackPremium === 0)
ok(
  'premiumPool 中无亲戚家泛化兜底',
  !premiumPool.some(
    (r) =>
      String(r.originalTitle || '').includes('亲戚家') &&
      GENERIC_FALLBACK_TITLES.includes(r.displayTitle || r.title)
  )
)
for (const name of GENERIC_FALLBACK_TITLES) {
  ok(
    `premiumPool 不含泛化兜底：${name}`,
    !premiumPool.some((r) => (r.displayTitle || r.title) === name)
  )
}
const premiumTop = [...premiumPool]
  .sort((a, b) => (b.rating || 0) - (a.rating || 0))
  .slice(0, 120)
const premiumBanned = [
  '这样做的',
  '拿肉都不换',
  '免烤',
  '搅一搅就成功',
  '村驴老师',
  '料汁',
  '万能拌料',
  '蘸料',
  '腌料',
  '家庭必备',
  '饭扫光',
  '百吃不厌',
  '零失败',
  '新手轻松做',
  '家庭版',
  '造起来',
  '夏日开胃',
  '小凉菜',
  '嘬手指',
  '万能的',
  '配方',
  '爽口又开胃',
  '烤牛奶',
  '奶香浓郁',
  '双皮奶',
  '甜牛奶',
]
const premiumBannedPatterns = [
  [/的酱$/, '的酱'],
  [/(?:万能)?(?:拌)?调料/, '调料'],
  [/^腌(?:黄瓜|萝卜|椒|菜|蒜|姜)/, '腌小菜'],
  [/^(?:精选|素香|荤香|海鲜)小炒$|^奶香小点$|^香卤小食$/, '泛化兜底'],
]
for (const recipe of premiumTop) {
  const text = [recipe.displayTitle, recipe.title].filter(Boolean).join(' ')
  for (const word of premiumBanned) {
    ok(`精品池 top120 不含「${word}」：${recipe.displayTitle || recipe.title}`, !text.includes(word))
  }
  for (const [re, label] of premiumBannedPatterns) {
    ok(
      `精品池 top120 不含「${label}」：${recipe.displayTitle || recipe.title}`,
      !re.test(recipe.displayTitle || recipe.title || '')
    )
  }
  ok(
    `精品池 top120 为完整菜品：${recipe.displayTitle || recipe.title}`,
    isPremiumFullDish(recipe.displayTitle || recipe.title)
  )
}

ok("cleanDisplayTitle('嫩滑鸡胸肉片～')", cleanDisplayTitle('嫩滑鸡胸肉片～') === '嫩滑鸡胸肉片')
ok('家常快手宫保鸡丁清洗', cleanDisplayTitle('家常快手宫保鸡丁') === '宫保鸡丁')
ok('糖醋排骨简单好做清洗', cleanDisplayTitle('糖醋排骨简单好做') === '糖醋排骨')
ok(
  '自制麻辣牛肉干味道绝了清洗',
  cleanDisplayTitle('自制麻辣牛肉干，味道绝了') === '麻辣牛肉干'
)
ok(
  '毛豆炒香干｜家常小炒 清洗',
  cleanDisplayTitle('毛豆炒香干｜家常小炒') === '毛豆炒香干'
)
ok(
  '烤牛奶不进精品池',
  !isPremiumDisplayRecipe({
    originalTitle: '全蛋️无芝士❗️奶香浓郁的烤牛奶',
    displayTitle: cleanDisplayTitle('全蛋️无芝士❗️奶香浓郁的烤牛奶'),
    title: cleanDisplayTitle('全蛋️无芝士❗️奶香浓郁的烤牛奶'),
    qualityScore: 90,
    rating: 9,
  })
)

const premiumTop20List = [...premiumPool]
  .sort((a, b) => (b.rating || 0) - (a.rating || 0))
  .slice(0, 20)
const premiumDessertBanned = ['烤牛奶', '奶香浓郁', '双皮奶', '甜牛奶', '烤奶', '牛奶甜品']
for (const recipe of premiumTop20List) {
  const text = recipe.displayTitle || recipe.title || ''
  for (const word of premiumDessertBanned) {
    ok(`premiumTop20 不含甜品/饮品词「${word}」：${text}`, !text.includes(word))
  }
}

const taroMatches = catalogRecipes
  .filter((r) => /芋头|芋泥|香芋/.test(recipeTitleText(r)))
  .filter(isDinnerMainCandidate)
  .sort((a, b) => (b.rating || 0) - (a.rating || 0))
  .slice(0, 10)
ok('芋头 catalog 应有晚饭主菜候选', taroMatches.length >= 1)
const taroBlocked = [
  '鲜芋仙',
  '芋圆',
  '奶茶',
  '西米露',
  '汤圆',
  '麻薯',
  '小丸子',
  '芋头糕',
  '烤奶',
  '虎皮卷',
  '糯米凉糕',
  '凉糕',
  '饭团',
  '雪媚娘',
  '奶冻',
  '宝宝辅食',
  '春游',
  '香芋糕',
  '芋泥鲜奶',
  '鲜奶',
  '芋泥馅',
  '芋头泥',
  '低脂芋头泥',
  '生酮低碳',
  '免炒芋泥',
  '奶香芋泥',
  '万能低脂',
  '超好喝',
  '香芋饼',
]
for (const recipe of taroMatches) {
  const text = recipeTitleText(recipe)
  for (const word of taroBlocked) {
    ok(`芋头主菜 top10 不含「${word}」：${text}`, !text.includes(word))
  }
}

const representativeTitles = [
  ['卖了十几年鸡爪的阿姨教我做的', /鸡爪|豉汁|凤爪/],
  ['我妈的拿手菜！炝拌藕丝！酸辣脆爽', /炝拌藕丝/],
  ['羽毛般柔软拉丝 | 奶呼呼的', /^(?!.*(?:羽毛|奶呼呼|拉丝))/],
  ['锁死这个配方，超级好吃的德式布丁塔', /^(?!.*(?:锁死|超级好吃|配方))/],
  ['比饭店好吃的爆炒鱿鱼', /爆炒鱿鱼/],
  ['学校门口炸串', /炸串/],
]
for (const [raw, expectRe] of representativeTitles) {
  ok(`平台标题应被识别：${raw}`, hasTitleIssue(raw))
  const cleaned = cleanDisplayTitle(raw)
  ok(`清洗后像菜名：${raw}`, cleaned.length >= 2 && cleaned.length <= 16 && expectRe.test(cleaned))
  ok(`清洗后无平台话术：${raw}`, !/羽毛|奶呼呼|拉丝|柔软|锁死|超级好吃|配方|学校门口|比饭店|阿姨|卖了十几年|我妈的拿手菜/.test(cleaned))
  if (raw !== '羽毛般柔软拉丝 | 奶呼呼的') {
    ok(`清洗后无展示异常：${raw}`, !hasTitleIssue(cleaned))
  }
}

const detailHeroSrc = fs.readFileSync(path.join(root, 'src/pages/detail/components/RecipeHero.tsx'), 'utf8')
const detailStepsSrc = fs.readFileSync(path.join(root, 'src/pages/detail/components/RecipeStepsList.tsx'), 'utf8')
const detailCookSrc = fs.readFileSync(path.join(root, 'src/pages/detail/components/CookingMode.tsx'), 'utf8')
ok('详情 Hero 应使用 isRenderableRecipeImage', detailHeroSrc.includes('isRenderableRecipeImage'))
ok('详情步骤图应使用 isRenderableRecipeImage', detailStepsSrc.includes('isRenderableRecipeImage'))
ok('烹饪模式步骤图应使用 isRenderableRecipeImage', detailCookSrc.includes('isRenderableRecipeImage'))

const pantryPageSrc = fs.readFileSync(path.join(root, 'src/pages/pantry/index.tsx'), 'utf8')
ok('冰箱页应为底部栏预留滚动空间', pantryPageSrc.includes('PANTRY_BOTTOM_RESERVE'))

const mealPlanActionsSrc = fs.readFileSync(path.join(root, 'src/pages/result/components/MealPlanActions.tsx'), 'utf8')
ok(
  '结果页主 CTA 应使用 Button 或明确 loading 状态',
  mealPlanActionsSrc.includes('Button') && mealPlanActionsSrc.includes('开始做主菜')
)
const mealPlanCardSrc = fs.readFileSync(path.join(root, 'src/pages/result/components/MealPlanCard.tsx'), 'utf8')
ok(
  'MealPlanCard 图片应有 onError fallback',
  mealPlanCardSrc.includes('onError') && mealPlanCardSrc.includes('failed')
)

// ── 构建产物（weapp 结构；若刚 build:h5 则跳过）──
const isWeappDist = fs.existsSync(path.join(root, 'dist/app.json'))
if (isWeappDist) {
  const distPages = [
    'dist/pages/index/index.js',
    'dist/pages/pantry/index.js',
    'dist/pages/result/index.js',
    'dist/pages/profile/index.js',
  ]
  for (const p of distPages) {
    ok(`构建产物存在 ${p}`, fs.existsSync(path.join(root, p)))
  }
  const appJson = JSON.parse(fs.readFileSync(path.join(root, 'dist/app.json'), 'utf8'))
  // 名称须时段中性：「今晚」把使用场景限死在晚饭，「选菜」像点单
  ok(
    'tabBar 搭配页名称正确',
    appJson.tabBar?.list?.some((t) => t.text === '搭配') &&
      !appJson.tabBar?.list?.some((t) => t.text === '今晚' || t.text === '选菜')
  )
  ok('app.json 不应声明无效 scope.record', !appJson.permission?.['scope.record'])
  ok('app.json 仍保留定位权限说明', Boolean(appJson.permission?.['scope.userLocation']?.desc))
} else {
  console.warn('skip dist checks: 当前 dist 非 weapp 产物（可能刚 build:h5）')
}

// ── 源码关键路径（不依赖 minify 后中文）──
const homePantryBannerSrc = fs.readFileSync(path.join(root, 'src/pages/index/components/HomePantryBanner.tsx'), 'utf8')
ok('首页源码含拍小票建冰箱', homePantryBannerSrc.includes('拍小票建冰箱') && homePantryBannerSrc.includes('startReceiptIntakeFromHome'))

const resultLoaderSrc = fs.readFileSync(path.join(root, 'src/pages/result/useResultLoader.ts'), 'utf8')
ok('结果页源码含 meal 模式', resultLoaderSrc.includes("from === 'meal'") && resultLoaderSrc.includes('buildMealPlansWithAiFallback'))

const profileSrc = fs.readFileSync(path.join(root, 'src/pages/profile/index.tsx'), 'utf8')
ok('Profile 源码含采购清单面板', profileSrc.includes('ShoppingListPanel'))

const householdSrc = fs.readFileSync(path.join(root, 'src/store/householdStore.ts'), 'utf8')
ok('HouseholdStore 含同步逻辑', householdSrc.includes('pullRemote') && householdSrc.includes('pushRemote'))
ok(
  'P0 suppress + pull cancel 仍在 HouseholdStore',
  householdSrc.includes('suppressNextPantryPush') &&
    householdSrc.includes('schedulePush.cancel()')
)

const catalogLoaderSrc = fs.readFileSync(path.join(root, 'src/data/catalogLoader.ts'), 'utf8')
ok(
  'P0 catalog runtime id 映射仍在',
  catalogLoaderSrc.includes('CATALOG_RUNTIME_OFFSET') && catalogLoaderSrc.includes('toCatalogRuntimeId')
)

// ── legacy 菜谱质量抽样 ──
const legacy = fs.readFileSync(path.join(root, 'src/data/recipesLegacy.ts'), 'utf8')
const titles = [...legacy.matchAll(/title:\s*'([^']+)'/g)].map((m) => m[1])
let badTitles = 0
for (const t of titles) {
  if (hasTitleIssue(t)) badTitles++
}
const badRate = titles.length ? badTitles / titles.length : 0
ok(`legacy 标题异常率 < 15%（实际 ${(badRate * 100).toFixed(1)}%）`, badRate < 0.15)

if (failures.length) {
  console.error('FAIL verify-features:')
  for (const f of failures) console.error(' -', f)
  process.exit(1)
}

console.log('verify-features passed:', {
  legacyRecipes: titles.length,
  legacyBadTitleRate: `${(badRate * 100).toFixed(1)}%`,
  weappDist: isWeappDist,
  premiumPoolSize: premiumPool.length,
  genericFallbackPremium,
  premiumTop20: premiumTop.slice(0, 20).map((r) => r.displayTitle || r.title),
  taroMainSample: taroMatches.slice(0, 10).map((r) => r.displayTitle || r.title),
})
