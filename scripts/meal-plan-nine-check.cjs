#!/usr/bin/env node
/**
 * 运行时校验：选 9 种食材应生成「主菜 + 素菜 + 汤」，且主菜不能是汤/凉拌。
 */
const Module = require('module')
const path = require('path')

const taro = {
  getStorageSync: () => '',
  setStorageSync: () => {},
  removeStorageSync: () => {},
  request: async () => ({ statusCode: 404, data: null }),
  getFileSystemManager: undefined,
  env: {},
  showToast: () => {},
}

const origLoad = Module._load
Module._load = function hook(request, parent, isMain) {
  if (request === '@tarojs/taro') {
    return Object.assign(taro, { default: taro })
  }
  return origLoad.apply(this, arguments)
}

require('@swc/register')({
  module: { type: 'commonjs' },
  jsc: {
    parser: { syntax: 'typescript', tsx: true, decorators: true },
    target: 'es2022',
  },
})

const { buildLocalMealPlans, isDinnerMainCandidate, classifyMealRole } = require(
  path.join(__dirname, '../src/utils/mealPlanBuilder.ts')
)
const { ingredientsLikelyMatch } = require(path.join(__dirname, '../src/utils/ingredientMatch.ts'))

function fail(msg) {
  console.error(`FAIL ${msg}`)
  process.exit(1)
}

if (ingredientsLikelyMatch('虾', '虾皮')) fail('虾 不应命中 虾皮')
if (!ingredientsLikelyMatch('虾', '鲜虾')) fail('虾 应命中 鲜虾')
if (!ingredientsLikelyMatch('虾', '虾仁')) fail('虾 应命中 虾仁')
if (!ingredientsLikelyMatch('千张', '豆皮')) fail('千张 应命中 豆皮')
if (ingredientsLikelyMatch('千张', '豆腐')) fail('千张 不应命中 豆腐')

if (isDinnerMainCandidate({ title: '紫菜蛋花汤', tags: ['汤类'] })) fail('紫菜蛋花汤 不应当主菜')
if (isDinnerMainCandidate({ title: '凉拌黄瓜', tags: ['凉菜'] })) fail('凉拌黄瓜 不应当主菜')
if (!isDinnerMainCandidate({ title: '白灼虾', tags: ['海鲜'] })) fail('白灼虾 应当主菜')
if (!isDinnerMainCandidate({ title: '芋头排骨汤', tags: ['汤类', '排骨'] })) fail('芋头排骨汤 应可当主菜')
if (classifyMealRole({ title: '紫菜蛋花汤', tags: ['汤类'] }) !== 'soup') fail('紫菜蛋花汤 角色应为汤')

const pantryNames = ['虾', '紫菜', '千张', '黄瓜', '油麦菜', '包菜', '西红柿', '鸡蛋', '豆腐']
const plans = buildLocalMealPlans({ pantryNames, servings: 3, limit: 3 })

if (!plans.length) fail('9 种食材应至少生成 1 套方案')

const first = plans[0]
const roles = first.recipes.map((s) => s.role)
const titles = first.recipes.map((s) => s.recipe.displayTitle || s.recipe.title)
const main = first.recipes.find((s) => s.role === 'main')

if (!main) fail('方案应有主菜槽')
if (classifyMealRole(main.recipe) === 'soup') fail(`主菜不能是汤：${main.recipe.title}`)
if (!roles.includes('veg')) fail(`第一套方案应有素菜，实际：${titles.join('、')}`)
if (!roles.includes('soup')) fail(`第一套方案应有汤，实际：${titles.join('、')}`)
if (first.recipes.length < 3) fail(`第一套方案应有 3 道菜，实际 ${first.recipes.length}：${titles.join('、')}`)
if (/鸡胸|沙拉|凉拌鸡|鱼丸/.test(titles.join(''))) fail(`不应塞进缺货荤菜/鱼丸：${titles.join('、')}`)
if (classifyMealRole(first.recipes.find((s) => s.role === 'soup').recipe) !== 'soup') {
  fail('汤槽角色应为 soup')
}

const used = first.usedPantryItems
if (!used.some((n) => /虾/.test(n))) fail(`应用上虾类，已用：${used.join('、')}`)
if (!used.some((n) => n === '紫菜' || n === '黄瓜' || n === '油麦菜' || n === '包菜')) {
  fail(`配菜/汤应消耗所选蔬菜或紫菜，已用：${used.join('、')}`)
}

const noEggPlans = buildLocalMealPlans({
  pantryNames: ['虾', '紫菜', '千张', '黄瓜', '油麦菜', '包菜', '土豆', '青椒', '生菜'],
  servings: 3,
  limit: 3,
})
if (!noEggPlans.length) fail('无鸡蛋的 9 种食材也应生成方案')
const noEggFirst = noEggPlans[0]
if (noEggFirst.recipes.length < 3) {
  fail(`无鸡蛋方案也应尽量 3 道，实际：${noEggFirst.recipes.map((s) => s.recipe.title).join('、')}`)
}
if (classifyMealRole(noEggFirst.recipes.find((s) => s.role === 'main').recipe) === 'soup') {
  fail('无鸡蛋方案主菜不能是汤')
}

console.log(
  `meal-plan-nine-check passed: plans=${plans.length} first=${titles.join(' + ')} used=${used.join('、')}`
)
for (const [i, plan] of plans.entries()) {
  const line = plan.recipes.map((s) => `${s.role}:${s.recipe.title}`).join(' | ')
  console.log(`  [${i}] ${line}`)
}
console.log(
  `  no-egg: ${noEggFirst.recipes.map((s) => `${s.role}:${s.recipe.title}`).join(' | ')}`
)
