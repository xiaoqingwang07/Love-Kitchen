import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

/** 提取 class 方法源码（按大括号配对，支持嵌套 reaction 等） */
function methodBody(src, name) {
  const re = new RegExp(`\\n  (?:private )?${name}\\([^)]*\\)\\s*\\{`)
  const m = re.exec(src)
  if (!m) return ''
  const lineStart = m.index + 1
  const brace = src.indexOf('{', m.index)
  if (brace < 0) return ''
  let depth = 0
  for (let i = brace; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') {
      depth--
      if (depth === 0) return src.slice(lineStart, i + 1)
    }
  }
  return ''
}

function expect(name, condition) {
  if (!condition) failures.push(name)
}

const pantryStore = read('src/store/pantryStore.ts')
const pantryPage = read('src/pages/pantry/index.tsx')
const recipeApi = read('src/api/recipe.ts')
const llmProxy = read('api/llm-proxy.js')
const catalogLoader = read('src/data/catalogLoader.ts')
const appConfig = read('src/app.config.ts')
const indexPage = read('src/pages/index/index.tsx')
const resultPage = read('src/pages/result/index.tsx')
const mealBuilder = read('src/utils/mealPlanBuilder.ts')
const reminderCron = read('api/reminder-cron.js')
const catalogQuality = read('src/utils/catalogQuality.ts')

expect(
  'PantryStore autorun 应观察条目字段，避免编辑/移动不落盘',
  /this\.items\.map\(\(item\) => \(\{[\s\S]*expiresAt[\s\S]*slotIndex[\s\S]*\}\)\)/.test(pantryStore)
)

expect(
  '冰箱入库预览应使用 IntakePreviewRow，确保 duplicateOf 类型存在',
  read('src/utils/pantryIntake.ts').includes('IntakePreviewRow') &&
    (pantryPage.includes('IntakePreviewRow') || read('src/pages/pantry/usePantryIntake.ts').includes('IntakePreviewRow'))
)

expect(
  '客户端 AI 请求必须依赖 TARO_APP_LLM_PROXY_URL，不允许回退直连 Key',
  recipeApi.includes('TARO_APP_LLM_PROXY_URL') && !recipeApi.includes('TARO_APP_MINIMAX_API_KEY')
)

expect(
  'LLM 代理必须限制模型、消息长度和请求速率',
  llmProxy.includes('ALLOWED_MODELS') &&
    llmProxy.includes('MAX_MESSAGE_LENGTH') &&
    llmProxy.includes('RATE_LIMIT_MAX')
)

expect(
  '远端 catalog 未配置时必须回退 legacy，不应强依赖 CDN',
  catalogLoader.includes('usesRemoteCatalog') && catalogLoader.includes('直接走 legacy')
)

expect(
  'tabbar 必须引用已存在的本地图片资源',
  ['home', 'pick', 'pantry', 'profile'].every((name) =>
    appConfig.includes(`assets/tabbar/${name}.png`) &&
    fs.existsSync(path.join(root, `src/assets/tabbar/${name}.png`)) &&
    fs.existsSync(path.join(root, `src/assets/tabbar/${name}_active.png`))
  )
)

expect(
  'tabBar 搭配页名称须时段中性（不叫「选菜」，也不叫把场景限死在晚饭的「今晚」）',
  appConfig.includes("text: '搭配'") &&
    !appConfig.includes("text: '选菜'") &&
    !appConfig.includes("text: '今晚'")
)

expect('app.config 不应声明无效 scope.record', !appConfig.includes("'scope.record'"))

expect(
  'mealPlanBuilder 应 clamp 临期消耗比例到 1',
  mealBuilder.includes('Math.min(1') && mealBuilder.includes('expiringConsumeRatio')
)
expect(
  'mealPlanBuilder 应规范化食材名避免芋头重复计数',
  /canonical|normalize/.test(mealBuilder) && mealBuilder.includes('expiringHit')
)

const profileLifecycle = read('src/pages/profile/useProfileLifecycle.ts')
expect(
  'Profile 打开时不应自动请求 AI proxy',
  !/useEffect\(\(\) => \{[\s\S]*checkApiKey\(\)/.test(profileLifecycle)
)

expect('PantryStore 仍应持久化 pantryItems', pantryStore.includes('setStorageSync(STORAGE_KEYS.pantryItems'))
expect(
  'PantryStore persist 不应在 DevTools 正常启动时刷红错',
  !pantryStore.includes("console.error('PantryStore persist failed")
)

const homePantryBanner = read('src/pages/index/components/HomePantryBanner.tsx')
expect(
  '首页空冰箱应有拍小票建冰箱引导',
  homePantryBanner.includes('拍小票建冰箱') && homePantryBanner.includes('startReceiptIntakeFromHome')
)

const resultLoader = read('src/pages/result/useResultLoader.ts')
expect(
  '结果页应支持 tonight meal 模式',
  resultLoader.includes("from === 'meal'") && resultLoader.includes('buildMealPlansWithAiFallback')
)

expect(
  'mealPlanBuilder 应能输出 MealPlan',
  mealBuilder.includes('buildLocalMealPlans') && fs.existsSync(path.join(root, 'src/types/mealPlan.ts'))
)

expect('catalogLoader 应经 legacyFullLoader 加载内置菜谱', catalogLoader.includes('legacyFullLoader') && fs.existsSync(path.join(root, 'src/data/legacyFullLoader.ts')))
expect(
  'catalog 运行时质量分',
  catalogQuality.includes('computeQualityScore') && catalogLoader.includes('applyQualityEnrichment')
)

expect(
  '临期提醒应跳转到 meal 方案页',
  reminderCron.includes('from=meal') && reminderCron.includes('source=reminder')
)

const householdStore = read('src/store/householdStore.ts')
const householdApi = read('src/api/household.ts')
const applyRemotePantryFn = methodBody(householdStore, 'applyRemotePantry')
const bindPantryFn = methodBody(householdStore, 'bindPantry')
expect(
  '家庭厨房应有 HouseholdStore 与 API 抽象',
  householdStore.includes('class HouseholdStore') &&
    householdApi.includes('householdApiConfigured') &&
    fs.existsSync(path.join(root, 'src/types/household.ts'))
)

expect('Profile 应包含采购清单入口', read('src/pages/profile/index.tsx').includes('ShoppingListPanel'))
expect(
  'Profile 家庭入口仅在 API 配置时渲染',
  read('src/pages/profile/components/HouseholdPanel.tsx').includes('householdApiConfigured()') &&
    read('src/pages/profile/components/HouseholdPanel.tsx').includes('return null')
)

const shareLinks = read('src/utils/shareLinks.ts')
const profilePage = read('src/pages/profile/index.tsx')
const navPayload = read('src/utils/navigationPayload.ts')
expect('分享链路应支持分类型 path', shareLinks.includes('primeShoppingShare') && shareLinks.includes('buildHouseholdSharePath'))
expect('Profile 开发者区应可导出埋点', profilePage.includes('copyAnalyticsExport'))
expect('跨页导航应使用 navigationPayload', navPayload.includes('setSelectedRecipeForDetail'))
expect('冰箱页应拆出 FridgeCabinet 组件', fs.existsSync(path.join(root, 'src/pages/pantry/components/FridgeCabinet.tsx')))
expect('应有 AppIcon 统一主功能图标', fs.existsSync(path.join(root, 'src/components/AppIcon.tsx')))
expect('详情页应拆出 CookingMode 组件', fs.existsSync(path.join(root, 'src/pages/detail/components/CookingMode.tsx')))
expect('pantry 应拆出 IntakeSheet 组件', fs.existsSync(path.join(root, 'src/pages/pantry/components/IntakeSheet.tsx')))
expect('详情页应拆出 RecipeHero 与 PantryContextBar', fs.existsSync(path.join(root, 'src/pages/detail/components/RecipeHero.tsx')))
expect('mealPlanBuilder 应支持 AI 补充方案', read('src/utils/mealPlanBuilder.ts').includes('buildMealPlansWithAiFallback'))
expect('冰箱页应拆出 SupermarketLookup 与 PantryItemEditSheet', pantryPage.includes('SupermarketLookup') && pantryPage.includes('PantryItemEditSheet'))
expect('详情页应拆出 IngredientGrid', read('src/pages/detail/index.tsx').includes('IngredientGrid'))
expect('Profile 应拆出 AchievementsPanel 与 PreferencePanel', read('src/pages/profile/components/ProfileStatsHeader.tsx').includes('AchievementsPanel') && profilePage.includes('PreferencePanel'))
expect('冰箱页应拆出 FridgeLayoutSettingsSheet 与 SlotDetailSheet', pantryPage.includes('FridgeLayoutSettingsSheet') && pantryPage.includes('SlotDetailSheet'))
expect('详情页应拆出 RecipeStepsList', read('src/pages/detail/index.tsx').includes('RecipeStepsList'))
expect('Profile 应拆出 FavoritesListPage 与 CookedHistoryPage', profilePage.includes('FavoritesListPage') && profilePage.includes('CookedHistoryPage'))
expect('Profile 应拆出 useProfileLifecycle 与 ProfileStatsHeader', profilePage.includes('useProfileLifecycle') && fs.existsSync(path.join(root, 'src/pages/profile/components/ProfileStatsHeader.tsx')))
expect('pantry 应拆出 ExpiryOverview 与 QuickFillPanel', pantryPage.includes('ExpiryOverview') && pantryPage.includes('QuickFillPanel'))
expect('Profile 应拆出 AboutPage 与 DevToolsPanel', profilePage.includes('AboutPage') && profilePage.includes('DevToolsPanel'))
expect('navigationPayload 应封装跨页导航 flag', navPayload.includes('setPantryPendingAction') && navPayload.includes('consumePickAutoSelectIngredients') && navPayload.includes('setPendingJoinCode'))
expect('跨页导航应经 navigationPayload 读写', indexPage.includes('consumeAutoSearchIngredient') && read('src/utils/mediaIntake.ts').includes('setPantryPendingAction'))
expect('pantry 应拆出 usePantryIntake 与 PantryBottomBar', pantryPage.includes('usePantryIntake') && pantryPage.includes('PantryBottomBar'))
expect('result 应拆出 RecipeResultCard 与 MealPlanActions', resultPage.includes('RecipeResultCard') && resultPage.includes('MealPlanActions'))
expect('index 应拆出 HomePantryBanner 与 HomeSearchBar', indexPage.includes('HomePantryBanner') && fs.existsSync(path.join(root, 'src/pages/index/components/HomeSearchBar.tsx')))
expect('AppIcon 应支持 PNG 资源', fs.existsSync(path.join(root, 'src/assets/icons/camera.png')))
expect('首页搜索栏主按钮应使用 AppIcon', read('src/pages/index/components/HomeSearchBar.tsx').includes('AppIcon') && !read('src/pages/index/components/HomeSearchBar.tsx').includes('🎙'))
expect('result 应拆出 ResultPageHeader 与 resultUtils', resultPage.includes('ResultPageHeader') && fs.existsSync(path.join(root, 'src/pages/result/resultUtils.ts')))
expect('result 应拆出 useResultLoader', fs.existsSync(path.join(root, 'src/pages/result/useResultLoader.ts')) && resultPage.includes('useResultLoader'))
expect('detail 应拆出 NutritionInsight 与 DetailBottomBar', read('src/pages/detail/index.tsx').includes('NutritionInsight') && read('src/pages/detail/index.tsx').includes('DetailBottomBar'))
const reminderEmpty = read('src/pages/result/components/ReminderMealEmptyBar.tsx')
expect(
  '临期无方案降级应支持延长/丢弃/采购',
  reminderEmpty.includes('extendExpiringByNames') &&
    reminderEmpty.includes('deductItems') &&
    reminderEmpty.includes('addShoppingItems')
)
expect('verify-bundle 脚本应存在', fs.existsSync(path.join(root, 'scripts/verify-bundle.mjs')))
expect('PantryStore 应支持延长临期', pantryStore.includes('extendExpiringByNames'))

const householdSyncApi = read('api/household-sync.js')
expect('P0-1 家庭同步 pull/push 须 memberToken 鉴权', householdSyncApi.includes('verifyMemberAuth') && householdSyncApi.includes('401'))
expect(
  'P0-1 pullHouseholdRemote 401 应抛出 HouseholdApiError，不得吞掉返回 null',
  householdApi.includes('export class HouseholdApiError') &&
    householdApi.includes('get unauthorized') &&
    householdApi.includes('normalizeApiErrorMessage') &&
    /pullHouseholdRemote[\s\S]*Promise<Household>/.test(householdApi) &&
    !/pullHouseholdRemote[\s\S]*catch[\s\S]*return null/.test(householdApi)
)
expect(
  'P0-1 post 应将 unauthorized 映射为中文，不得透传空 error',
  householdApi.includes("err === 'unauthorized'") &&
    householdApi.includes('无权访问家庭数据，请重新加入家庭') &&
    householdApi.includes('网络异常，请稍后重试')
)
expect(
  'P0-1 HouseholdStore 同步错误应有 fallback，不得显示空文案',
  householdStore.includes('function syncErrorMessage') &&
    householdStore.includes('failSync') &&
    householdStore.includes("failSync(e, '拉取失败')") &&
    householdStore.includes("failSync(e, '推送失败')") &&
    householdStore.includes("syncErrorMessage(e, '创建失败')") &&
    householdStore.includes("syncErrorMessage(e, '加入失败')")
)
expect(
  'P0-1 pull/push 401 应清除 memberToken',
  householdStore.includes('failSync') &&
    /failSync[\s\S]*e\.unauthorized[\s\S]*clearUnauthorizedToken/.test(householdStore) &&
    /pushRemote[\s\S]*缺少成员凭证/.test(householdStore)
)
expect('P0-3 购物清单 push 应覆盖而非 name-merge', householdSyncApi.includes('incoming.shoppingList') && !householdSyncApi.includes('mergeShoppingList(existing'))
expect('P0-2 catalog 详情应保留 lite.id', catalogLoader.includes('attachStableCatalogDetail') && catalogLoader.includes('catalogId'))
expect('P1 catalog 索引 id 应映射到 offset runtime id', catalogLoader.includes('toCatalogRuntimeId') && catalogLoader.includes('CATALOG_RUNTIME_OFFSET'))
expect('P1 catalog-only 应有 catalogId 且 lite 查找优先', catalogLoader.includes('findLiteByAnyId') && catalogLoader.includes('catalogId: entry.id'))
expect('P1 findRecipeById 应支持 catalogId 回退', read('src/data/recipeRegistry.ts').includes('catalogId'))
expect('P1 getRecipeDetailById 不应先按 legacy id 覆盖 catalog', !catalogLoader.includes('if (legacyById?.steps?.length) return enrichRecipeMedia(legacyById)'))
expect('P2 pull 应 cancel 待执行的 debounce push', householdStore.includes('schedulePush.cancel()'))
expect(
  'P0-4 applyRemotePantry 应置 suppress，由 reaction 消费复位',
  /applyRemotePantry[\s\S]*suppressNextPantryPush = true[\s\S]*replaceItems[\s\S]*}\s*\n/.test(
    householdStore
  ) &&
    /if \(this\.suppressNextPantryPush\)[\s\S]*suppressNextPantryPush = false[\s\S]*return/.test(
      householdStore
    )
)
expect(
  'P0-4 不应使用 counter/setTimeout/snapshot 抑制 push',
  !householdStore.includes('pantrySnapshot') &&
    !householdStore.includes('remotePantrySnapshot') &&
    !householdStore.includes('suppressPantryPushDepth') &&
    !householdStore.includes('skipCounter') &&
    !/applyRemotePantry[\s\S]*setTimeout/.test(householdStore)
)
expect(
  'P0-4 PantryStore.replaceItems 应整表替换 items',
  pantryStore.includes('replaceItems(items: PantryItem[])') &&
    /replaceItems[\s\S]*this\.items\s*=/.test(pantryStore)
)
expect(
  'P0-4 bindPantry reaction 应监听 pantry.items',
  bindPantryFn.includes('reaction(') && bindPantryFn.includes('pantry.items.map')
)
expect(
  'P2 bindPantry 应先注册 reaction 再 applyRemotePantry',
  bindPantryFn.indexOf('this.disposer = reaction(') <
    bindPantryFn.indexOf('this.applyRemotePantry(this.household.pantryItems)')
)
expect(
  'P0-4 冰箱变更应经 reaction → schedulePush → pushRemote',
  bindPantryFn.includes('schedulePush()') &&
    householdStore.includes('debounce(() => void this.pushRemote()') &&
    householdStore.includes('async pushRemote()')
)
expect(
  'P0-4 applyRemotePantry 只 replaceItems，不直接 push',
  applyRemotePantryFn.includes('this.pantry.replaceItems(items)') &&
    !applyRemotePantryFn.includes('schedulePush') &&
    !applyRemotePantryFn.includes('pushRemote')
)
expect(
  'P0-4 pull 链路应为 applyHousehold → applyRemotePantry → replaceItems',
  /pullRemote[\s\S]*applyHousehold\(remote,\s*true\)/.test(householdStore) &&
    /applyHousehold[\s\S]*applyRemotePantry\(h\.pantryItems\)/.test(householdStore)
)
const homeKitchenStatus = read('src/pages/index/components/HomeKitchenStatus.tsx')
expect('首页应有厨房状态面板', indexPage.includes('HomeKitchenStatus'))
expect(
  '示例冰箱应带 ingredients 跳转今晚方案',
  homeKitchenStatus.includes('buildMealResultPath') &&
    homeKitchenStatus.includes('const items = pantryStore.loadDemoPantry()') &&
    homeKitchenStatus.includes("buildMealResultPath(items, 'demo-pantry')") &&
    homeKitchenStatus.includes('ingredients=') &&
    homeKitchenStatus.includes('expiring=') &&
    pantryStore.includes('loadDemoPantry(): PantryItem[]')
)
expect('空冰箱应可体验示例冰箱', homePantryBanner.includes('示例冰箱') && pantryStore.includes('loadDemoPantry'))
expect('用户可见错误不应暴露 TARO_APP', !read('src/api/dishVision.ts').includes("'TARO_APP") && read('src/api/recipe.ts').includes('智能推荐服务未就绪'))

// ── P0 不变量：购物清单 UX 重构后须保持 ──
const shoppingListPanel = read('src/pages/profile/components/ShoppingListPanel.tsx')
expect(
  'P0 采购清单 UI 须经 store 勾选/删除（不得直接改 shoppingList）',
  shoppingListPanel.includes('toggleShoppingItem') &&
    shoppingListPanel.includes('removeCheckedShopping') &&
    !/this\.shoppingList\s*=/.test(shoppingListPanel) &&
    !/shoppingList\.push/.test(shoppingListPanel)
)
expect(
  'P0 购物清单增删改在 household 模式应 schedulePush',
  /addShoppingItems[\s\S]*if \(this\.inHousehold\) this\.schedulePush\(\)/.test(householdStore) &&
    /toggleShoppingItem[\s\S]*if \(this\.inHousehold\) this\.schedulePush\(\)/.test(householdStore) &&
    /removeCheckedShopping[\s\S]*if \(this\.inHousehold\) this\.schedulePush\(\)/.test(householdStore)
)
expect(
  'P0 pull 应 cancel debounce 且 applyRemote 不 echo push',
  householdStore.includes('this.schedulePush.cancel()') &&
    applyRemotePantryFn.includes('this.pantry.replaceItems(items)') &&
    !applyRemotePantryFn.includes('schedulePush')
)
expect(
  'P0 catalog runtime id 须稳定映射（无 nextId 自增）',
  catalogLoader.includes('toCatalogRuntimeId(entry.id)') &&
    catalogLoader.includes('catalogId: entry.id') &&
    !catalogLoader.includes('nextId')
)
expect(
  'P0 household-suppress 回归应挂在 test:regression',
  fs.readFileSync(path.join(root, 'package.json'), 'utf8').includes('household-suppress-push-check.mjs') &&
    fs.readFileSync(path.join(root, 'package.json'), 'utf8').includes('catalog-id-check.mjs')
)
expect('采购清单面板应支持删除已勾选', shoppingListPanel.includes('removeCheckedShopping'))
expect('烹饪完成应上报 meal_solved', read('src/utils/analyticsExport.ts').includes('meal_solved'))
expect('Epic E 应有 mealSolved 计数与 Plus 软提示', fs.existsSync(path.join(root, 'src/utils/mealSolvedTracker.ts')) && read('src/utils/mealSolvedTracker.ts').includes('EVENTS.upgradePromptShown'))
expect('Epic E 应有每周菜单建议', fs.existsSync(path.join(root, 'src/pages/profile/components/WeeklyMenuCard.tsx')) && read('src/utils/weeklyMenuSuggest.ts').includes('buildWeeklyMenuSuggestion'))
expect('今晚方案应解释推荐依据', fs.existsSync(path.join(root, 'src/pages/result/components/MealPlanReasonBar.tsx')))
expect('分享应支持三类标题', shareLinks.includes('这顿吃【') && shareLinks.includes('帮我买') && shareLinks.includes('加入我家的厨房清单'))
expect('meal 缺货应加入采购清单', resultPage.includes('handleAddMealShopping') && resultPage.includes('addShoppingItems'))

// ── 2026-07-06 整改不变量：扣减确认 / 采购直达 / 结果页冰箱联动 / 精简 ──
const detailPage = read('src/pages/detail/index.tsx')
expect(
  '扣减应做完后经确认清单，不再开做前整项静默删除',
  fs.existsSync(path.join(root, 'src/pages/detail/components/DeductConfirmSheet.tsx')) &&
    detailPage.includes('previewDeduction') &&
    detailPage.includes('DeductConfirmSheet') &&
    !detailPage.includes('要自动扣减这道菜用掉的食材吗')
)
expect(
  'PantryStore 应支持 previewDeduction 与 removeItemsByIds',
  pantryStore.includes('previewDeduction') && pantryStore.includes('removeItemsByIds')
)
expect(
  '首页「待采购」应直达我的页采购清单',
  homeKitchenStatus.includes('setProfileOpenShopping') &&
    profileLifecycle.includes('consumeProfileOpenShopping') &&
    profilePage.includes('shopping-panel')
)
expect(
  '非 meal 结果卡应展示冰箱联动提示',
  resultPage.includes('getRecipePantryContext') &&
    read('src/pages/result/components/RecipeResultCard.tsx').includes('pantryHint')
)
expect(
  '场景偏好应收敛为家庭主场景两档',
  !profilePage.includes('运动后') &&
    !profilePage.includes('高蛋白') &&
    profilePage.includes('normalizeScene')
)
expect(
  '首页推荐区不应保留与换一批重复的随机入口',
  !indexPage.includes('handleRandom') &&
    !read('src/pages/index/components/HomeRecommendSection.tsx').includes('onRandom')
)
expect('AI 生成菜谱提示不应出现对内话术', !resultPage.includes('收录进正式库'))

expect(
  '今晚方案必须永不空手：约束放宽 + 家常兜底三级降级',
  mealBuilder.includes('buildMealPlansResilient') &&
    mealBuilder.includes("degraded: 'relaxed'") &&
    mealBuilder.includes("degraded: 'generic'") &&
    resultLoader.includes('buildMealPlansResilient')
)
expect(
  '临期召回场景保留诚实空态（不套家常兜底）',
  resultLoader.includes("params.source === 'reminder'") &&
    resultLoader.includes('临期食材暂无搭配方案')
)

// ===== 2026-07-26 界面淡雅化改造 =====
const iconGen = fs.existsSync(path.join(root, 'scripts/generate-icons.mjs'))
  ? read('scripts/generate-icons.mjs')
  : ''
expect(
  '图标生成不应依赖字体渲染（PingFang.ttc 在 PIL 下无法打开，静默兜底会产出坏图标）',
  iconGen !== '' && !iconGen.includes('ImageFont')
)
expect(
  '图标生成应走 SVG 源文件',
  iconGen.includes('qlmanage') && fs.existsSync(path.join(root, 'scripts/icons/src'))
)

expect(
  '图标 PNG 应为高分辨率（≥128px，解决高清屏发虚）',
  (() => {
    // PNG IHDR：宽度位于第 16-19 字节（大端）
    const buf = fs.readFileSync(path.join(root, 'src/assets/tabbar/pick.png'))
    return buf.readUInt32BE(16) >= 128
  })()
)
expect('旧的字体渲染图标脚本应已移除', !fs.existsSync(path.join(root, 'scripts/generate-app-icons.mjs')))

const tokens = read('src/theme/designTokens.ts')
expect('设计变量应采用淡雅暖色主色', tokens.includes("accent: '#E89562'"))
expect('设计变量正文色应为暖灰而非近纯黑', tokens.includes("label: '#3A342E'"))
expect(
  '圆角应收敛为三档',
  tokens.includes('radiusS: 14') && tokens.includes('radiusM: 18') && tokens.includes('radiusPill: 999')
)

const appScss = read('src/app.scss')
expect('不应对全局文字施加统一行距', !appScss.includes('line-height: 1.47'))
expect('应提供块级文字工具类修复标题黏连', appScss.includes('.lk-block'))

expect(
  '首页不应再有页面级大标题（与搜索框、推荐区表达重复）',
  !indexPage.includes('titleStyle') && !read('src/pages/index/styles.ts').includes('titleLarge')
)
expect(
  '首页推荐条数须克制，避免首屏无限下滑',
  /HOME_RECOMMEND_COUNT = [1-6]\b/.test(indexPage)
)
expect(
  '搭配页食材分类须覆盖主要品类（原仅蔬菜/肉类两类且归类有误）',
  (() => {
    const pick = read('src/pages/pick/index.tsx')
    return (
      ['蔬菜', '菌菇', '肉类', '水产', '蛋奶豆', '主食'].every((c) => pick.includes(`title: '${c}'`)) &&
      // 调味料不参与「决定吃什么」，不应出现在食材选择列表
      !pick.includes("title: '调味'")
    )
  })()
)
expect('首页应移除与「我的」tab 重复的收藏入口', !indexPage.includes('setProfileOpenFavorites'))
expect(
  '首页临期提醒应置顶于搜索框之前',
  (() => {
    const banner = indexPage.indexOf('<HomePantryBanner')
    const search = indexPage.indexOf('<HomeSearchBar')
    return banner > -1 && search > -1 && banner < search
  })()
)

/** WCAG 相对亮度 */
function relLum(hex) {
  const c = hex.replace('#', '')
  const ch = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}
function contrast(a, b) {
  const [x, y] = [relLum(a), relLum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const pickToken = (name) => (tokens.match(new RegExp(`${name}: '(#[0-9A-Fa-f]{6})'`)) || [])[1]

expect(
  '橙底按钮文字对比度须 ≥4.5:1（白字配浅杏橙仅 2.36:1，不可读）',
  contrast(pickToken('onAccent'), pickToken('accent')) >= 4.5
)
expect(
  '浅底橙色文字对比度须 ≥3:1',
  contrast(pickToken('accentDeep'), pickToken('bg')) >= 3
)
expect('页面不应残留橙底白字', !/backgroundColor: D\.accent[\s\S]{0,220}?color: '#fff'/.test(
  ['src/pages/index/components/HomeKitchenStatus.tsx', 'src/pages/index/components/HomePantryBanner.tsx']
    .map((f) => read(f)).join('\n')
))
expect(
  'tabBar 配色须与图标生成脚本一致且达标',
  appConfig.includes("color: '#9C948B'") &&
    appConfig.includes("selectedColor: '#D4783F'") &&
    iconGen.includes("TAB_IDLE = '#9C948B'") &&
    iconGen.includes("TAB_ACTIVE = '#D4783F'")
)

expect(
  'tab 页不应在页面内重复渲染页面名（页面名归原生导航栏）',
  ['pick', 'pantry', 'profile'].every((p) =>
    fs.existsSync(path.join(root, `src/pages/${p}/index.config.ts`))
  ) &&
    !fs.existsSync(path.join(root, 'src/pages/pantry/components/PantryHeader.tsx')) &&
    !read('src/pages/profile/components/ProfileStatsHeader.tsx').includes('titleLarge') &&
    !read('src/pages/pick/index.tsx').includes('titleLarge')
)
expect(
  '首页推荐区不应因存在临期食材而整体隐藏（会留下大片空白）',
  indexPage.includes('const showGenericRecommend = !emptyPantry') &&
    !indexPage.includes('expiringItems.length === 0')
)
expect(
  '冰箱底部操作条应收敛为单一入口（原 5 个按钮占满两行并遮挡柜体）',
  (() => {
    const bar = read('src/pages/pantry/components/PantryBottomBar.tsx')
    return (
      bar.includes('showActionSheet') &&
      bar.includes('添加食材') &&
      !bar.includes('去选菜') &&
      !bar.includes('清过期')
    )
  })()
)

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`)
  console.error(`\nRegression checks failed: ${failures.length}`)
  process.exit(1)
}

console.log('Regression checks passed.')
