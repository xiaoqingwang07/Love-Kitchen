/**
 * Epic B：loadDemoPantry → ingredients → result meal 链路静态校验
 */
import fs from 'node:fs'
import path from 'node:path'
import { isDinnerMainCandidate, NON_DINNER_MAIN_RE } from './lib/meal-plan-rules.mjs'

const root = process.cwd()
const pantrySrc = fs.readFileSync(path.join(root, 'src/store/pantryStore.ts'), 'utf8')
const homeStatusSrc = fs.readFileSync(path.join(root, 'src/pages/index/components/HomeKitchenStatus.tsx'), 'utf8')
const resultLoaderSrc = fs.readFileSync(path.join(root, 'src/pages/result/useResultLoader.ts'), 'utf8')

const mockNames = [...pantrySrc.matchAll(/name:\s*'([^']+)'/g)]
  .map((m) => m[1])
  .filter((_, i, arr) => {
    const idx = pantrySrc.indexOf('function createMockData')
    const end = pantrySrc.indexOf('return mocks.map', idx)
    const block = pantrySrc.slice(idx, end)
    return block.includes(`name: '${arr[i]}'`)
  })

if (mockNames.length < 10) {
  console.error(`FAIL createMockData 应有足够示例食材，实际 ${mockNames.length}`)
  process.exit(1)
}

if (!pantrySrc.includes('loadDemoPantry(): PantryItem[]')) {
  console.error('FAIL loadDemoPantry 应返回 PantryItem[]')
  process.exit(1)
}

if (!homeStatusSrc.includes('const items = pantryStore.loadDemoPantry()')) {
  console.error('FAIL loadDemoPantryAndGoMeal 应使用 loadDemoPantry 返回值')
  process.exit(1)
}

if (!homeStatusSrc.includes('buildMealResultPath(items, \'demo-pantry\')')) {
  console.error('FAIL 应用 demo 食材构建 meal result path')
  process.exit(1)
}

if (!resultLoaderSrc.includes("from === 'meal'")) {
  console.error('FAIL result 页应解析 from=meal + ingredients')
  process.exit(1)
}

const mealBuilderSrc = fs.readFileSync(path.join(root, 'src/utils/mealPlanBuilder.ts'), 'utf8')
if (!mealBuilderSrc.includes('isDinnerMainCandidate') || !mealBuilderSrc.includes('NON_DINNER_MAIN_RE')) {
  console.error('FAIL mealPlanBuilder 应使用 isDinnerMainCandidate 过滤晚饭主菜')
  process.exit(1)
}
if (!/NON_DINNER_MAIN_RE\.test\(text\)\) return false/.test(mealBuilderSrc)) {
  console.error('FAIL isDinnerMainCandidate 应先 block 再 allow')
  process.exit(1)
}
if (!mealBuilderSrc.includes('isDinnerMainCandidate(m.recipe)')) {
  console.error('FAIL 芋头匹配结果应排除非晚饭主菜')
  process.exit(1)
}
if (!mealBuilderSrc.includes('isDinnerMainCandidate(main)')) {
  console.error('FAIL buildPlanFromMain 应拒绝非晚饭主菜')
  process.exit(1)
}

const blocked = [
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
  '糕',
]
for (const word of blocked) {
  if (!NON_DINNER_MAIN_RE.source.includes(word.replace(/[()?!]/g, ''))) {
    console.error(`FAIL 晚饭主菜排除规则应覆盖：${word}`)
    process.exit(1)
  }
}

const blockedTitles = [
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
for (const title of blockedTitles) {
  if (isDinnerMainCandidate({ title, displayTitle: title })) {
    console.error(`FAIL 晚饭主菜应排除：${title}`)
    process.exit(1)
  }
}

console.log(
  `demo-pantry-meal-check passed: mockItems=${mockNames.length} sample=${mockNames.slice(0, 3).join('、')}`
)
