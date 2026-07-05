# Love-Kitchen 爆款改造总执行计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Love-Kitchen 从「AI 菜谱 + 冰箱 + 采购」功能集合，收束为「家庭饭桌助手：先吃快坏的，少买重复的，今晚就知道做什么」的高频闭环产品。

**Architecture:** 以冰箱库存为产品主资产，用「首日激活 → 今晚一餐 → 临期召回 → 做完扣减 → 家庭同步」串联已有能力；数据层增加 catalog 质量管线；状态层统一跨页导航 payload；家庭协作通过接口抽象层 + 本地缓存实现 MVP。

**Tech Stack:** Taro 3.6 + React 18 + TypeScript + MobX + Zod；Vercel serverless（llm-proxy / reminder）；catalog-cdn 分包；微信订阅消息。

**评审依据:** `Love-Kitchen-爆款产品评审与改造执行报告.md`（2026-07-05）

---

## 0. 现状差距分析（评审 vs 代码库）

| 评审要求 | 当前实现 | 差距 |
|---|---|---|
| 30 秒魔法瞬间：「拍小票建冰箱」「直接问今晚吃什么」 | 空冰箱引导为「去填冰箱 / 先看推荐」，需 switchTab 到冰箱页 | 首屏主动作不够强，未直达入库预览 |
| 「今晚一餐」方案（主菜+配菜+汤） | `result` 页展示菜谱列表；`from=ai/dish/pantry/random` | 无 `MealPlan` 类型与 `from=meal` 模式 |
| catalog 质量清洗 + qualityScore | `recommend.ts` 按 rating 排序；无 audit 脚本 | 标题党/重复图/荒谬时间未过滤 |
| 临期提醒直达方案 | `reminder-cron.js` 推送 generic 文案；点击无 scene | 提醒未带食材参数，落地页仅为冰箱 |
| 家庭共享冰箱 | `pantryStore` 纯本地 Storage | 无 Household 模型与同步层 |
| Tab「选菜」→「今晚」 | `app.config.ts` 仍为「选菜」 | 命名与定位未调整 |
| 详情页「为什么适合我」 | 有扣减确认，无冰箱命中/临期/缺失展示 | 个性化理由缺失 |
| emoji 图标系统 | 首页/冰箱大量 emoji 按钮 | 未统一 icon 体系 |
| 页面拆分（<500 行） | pantry 2186 行、detail 1125 行 | 单文件过重，迭代风险高 |
| 跨页 Storage 统一 | 6+ 分散 key，无 TTL | 无 `navigationPayload` 封装 |
| 隐藏开发者 API Key 配置 | Profile 可能仍暴露调试入口 | 需确认并降级 |

**已有优势（改造时保留，不推倒重来）：**

- 冰箱页双门视觉 + 临期高亮 + 逛超市秒查（`pantry/index.tsx`）
- 详情页烹饪模式 + 自动扣减（`detail/index.tsx`）
- `mediaIntake` / `pantryIntake` / `pantryVision` 入库链路
- `recipeMatch.ts` 临期加权排序
- LLM 代理 + Zod 校验 + 回归脚本

---

## 1. 分阶段路线图

```
第 0 阶段（1–2 周）可信度 + 首日激活
  ├── P0-3 catalog 质量管线
  ├── P0-1 首页首日激活改造
  ├── 6.1 Tab「选菜」→「今晚」
  ├── 7.2 首页任务台信息层级
  └── 6.6 隐藏开发者 Key 入口

第 1 阶段（2–4 周）爆款闭环
  ├── P0-2 「今晚一餐」模式
  ├── P0-5 临期提醒召回闭环
  ├── 7.4 详情页个性化理由
  ├── 购物清单分享增强
  └── 埋点导出/后端接入

第 2 阶段（4–8 周）家庭协作
  ├── P0-4 家庭共享冰箱 MVP
  ├── 9.2 分享卡片分类型
  └── 10.1 页面组件拆分（随功能迭代）

第 3 阶段（8 周+）商业化试验
  ├── Pro 权益页（仅在有 D7 留存数据后）
  └── 减少浪费统计报告

并行 / 视觉打磨期（P2，不阻塞核心闭环）
  ├── P2 图标系统替换 emoji
  ├── 6.2 天气推荐保持轻量
  └── 6.3 成就系统不扩展
```

**北极星指标：** 每周完成烹饪并扣减库存的家庭数。

---

## 2. 第 0 阶段：可信度 + 首日激活

### Task 0.1：catalog 质量审计脚本

**Files:**
- Create: `scripts/audit-catalog-quality.mjs`
- Create: `scripts/lib/catalog-quality-rules.mjs`
- Modify: `package.json`（新增 `audit:catalog` script）
- Modify: `scripts/check-release-readiness.mjs`

**规则实现（catalog-quality-rules.mjs）：**

```javascript
// 标题异常：emoji/感叹号过多、长度>20、营销词
const TITLE_EMOJI_RE = /[\u{1F300}-\u{1FAFF}‼️❗️🔥]/u
const TITLE_MARKETING = /无敌|三碗|绝绝|爆款|神仙/

// 耗时异常：difficulty=复杂 && time<=5，或 steps.length>=6 && time<=5
// 食材异常：name 以 # 开头、amount 空且 name>15字、name 含「：」章节标题
// 图片：统计 image URL 复用次数；校验 steps[].image URL 格式
```

- [ ] **Step 1:** 实现 `auditCatalogQuality(indexPath, chunksDir)` 输出 JSON 报告：counts + top offenders
- [ ] **Step 2:** 运行 `node scripts/audit-catalog-quality.mjs`，记录清洗前基线
- [ ] **Step 3:** 在 `check-release-readiness.mjs` 加入阈值检查（标题异常 <5%、食材异常 <1%、坏步骤图 URL = 0）
- [ ] **Step 4:** 运行 `npm run check:release`，确认新检查通过或输出 warn

**验收标准：**
- 脚本能对 5000 条 catalog 在 <60s 内完成审计
- 报告含：titleIssues、timeIssues、ingredientIssues、duplicateImages、badStepUrls

---

### Task 0.2：catalog 清洗与 qualityScore

**Files:**
- Create: `scripts/clean-catalog-quality.mjs`
- Modify: `src/data/catalogLoader.ts`（`CatalogIndexEntry` 增加 `displayTitle?`, `qualityScore?`）
- Modify: `src/types/recipe.ts`（Recipe 增加 `displayTitle?`, `qualityScore?`, `originalTitle?`）
- Modify: `src/utils/recommend.ts`
- Modify: `catalog-cdn/index.json` + `catalog-cdn/chunks/*.json`（运行脚本生成）

**清洗逻辑：**

```javascript
function cleanTitle(title) {
  let t = title.replace(/[\u{1F300}-\u{1FAFF}‼️❗️🔥✨💯]/gu, '').replace(/!+/g, '')
  t = t.replace(/，.*$|！.*$/,'').trim() // 截断营销尾巴
  if (t.length > 16) t = t.slice(0, 14) + '…'
  return t || title.slice(0, 16)
}

function estimateMinTime(recipe) {
  const steps = recipe.steps?.length ?? 0
  const ingCount = recipe.ingredients?.length ?? 0
  return Math.max(recipe.time ?? 0, Math.ceil(steps * 2 + ingCount * 0.5))
}

function computeQualityScore(entry, dupImageCount) {
  let score = 100
  if (entry.title !== entry.displayTitle) score -= 5
  if (dupImageCount > 10) score -= Math.min(30, dupImageCount)
  if (entry.time <= 5 && entry.difficulty === '复杂') score -= 25
  // ...
  return Math.max(0, score)
}
```

- [ ] **Step 1:** 实现清洗脚本，保留 `originalTitle` / `originalMeta`，写入 chunk
- [ ] **Step 2:** 修改 `getDailyRecommendations` / `getPersonalizedRecommendations`：过滤 `qualityScore < 60` 或 `dupImageCount > 50` 的菜谱
- [ ] **Step 3:** UI 展示优先 `displayTitle ?? title`
- [ ] **Step 4:** 运行清洗前后 audit，确认指标达标
- [ ] **Step 5:** `npm run typecheck && npm run test:regression && npm run check:release`

**验收标准：**
- 标题异常比例 < 5%
- 食材异常 < 1%
- 首页推荐 Top 20 人工抽查无明显标题党

---

### Task 0.3：首页首日激活改造（P0-1）

**Files:**
- Modify: `src/pages/index/index.tsx`
- Modify: `src/pages/index/styles.ts`
- Modify: `src/pages/pantry/index.tsx`（接收 `?action=receipt` 自动打开入库 sheet）
- Modify: `src/utils/mediaIntake.ts`（新增 `startReceiptIntake()` helper）
- Modify: `src/store/storageKeys.ts`（新增 `firstIntakeCompleted`, `navigateToMealAfterIntake`）
- Modify: `scripts/regression-checks.mjs`（断言空冰箱首屏有两个 CTA）

**目标 UI 结构（空冰箱时）：**

```
今晚吃什么？                    [收藏]
[ 搜索框：番茄、鸡蛋… ]
┌─────────────────┬─────────────────┐
│  拍小票建冰箱    │ 直接问今晚吃什么  │
└─────────────────┴─────────────────┘
（有临期时：临期卡在此之上）
今日推荐（下移）
```

**交互流程：**

1. 「拍小票建冰箱」→ `pickImageForIntake('camera', 'receipt')` → `switchTab('/pages/pantry/index?action=receipt')`
2. 冰箱页 `useDidShow` 检测 intake draft → 打开 IntakePreviewSheet
3. AI 不可用 → 降级粘贴清单 / 快速补货（已有逻辑，确保不卡死）
4. 首次入库成功 → `setStorage(firstIntakeCompleted)` → Toast + 按钮「看今晚做什么」→ `navigateTo('/pages/result/index?from=meal&source=first-intake')`

- [ ] **Step 1:** 重构空冰箱卡片为双主 CTA，移除弱引导文案
- [ ] **Step 2:** 实现 `handleReceiptIntake` 复用 mediaIntake 链路
- [ ] **Step 3:** 冰箱页支持 URL query `action=receipt|ingredients|paste`
- [ ] **Step 4:** 首次入库后引导跳转 meal 结果（Task 1.1 未完成时可临时跳 `from=pantry&expiring=...`）
- [ ] **Step 5:** 顶栏标题改为「今晚吃什么？」
- [ ] **Step 6:** `npm run typecheck && npm run test:regression`

**验收标准：**
- 空冰箱首屏 ≤3 次点击到入库预览
- 无 AI 时可通过粘贴/快速补货完成入库
- 不新增硬编码色，沿用 `D` tokens

---

### Task 0.4：Tab「选菜」→「今晚」+ 页面定位

**Files:**
- Modify: `src/app.config.ts`（tabBar text: `今晚`）
- Modify: `src/pages/pick/index.config.ts`（navigationBarTitleText）
- Modify: `src/pages/pick/index.tsx`（页头文案、引导语）

- [ ] **Step 1:** 改 tabBar 文案与导航标题
- [ ] **Step 2:** 页头改为「今晚吃什么」+ 副标题「勾选食材，生成一顿饭方案」
- [ ] **Step 3:** 底部主按钮文案从「开始匹配」→「生成今晚方案」，跳转 `from=meal`

**验收标准：** Tab 名称与页面定位一致，不破坏现有 ingredient 选择逻辑

---

### Task 0.5：隐藏开发者 API Key 入口

**Files:**
- Modify: `src/pages/profile/index.tsx`

- [ ] **Step 1:** 将 LLM Key / 代理地址配置移入「开发者选项」（连续点击版本号 7 次解锁）
- [ ] **Step 2:** 普通用户只看到「智能推荐可用 / 暂不可用，已用本地库」状态条
- [ ] **Step 3:** 回归检查 profile 不含裸露 `TARO_APP_*` 说明给普通用户

---

## 3. 第 1 阶段：爆款闭环

### Task 1.1：MealPlan 类型与本地组合算法

**Files:**
- Create: `src/types/mealPlan.ts`
- Create: `src/utils/mealPlanBuilder.ts`
- Modify: `src/types/recipe.ts`（可选 re-export）
- Test: `scripts/regression-checks.mjs`（新增 mealPlan 断言）

**类型定义：**

```typescript
export interface MealPlanRecipeSlot {
  role: 'main' | 'veg' | 'soup' | 'quick'
  recipe: Recipe
  usedIngredients: string[]
  expiringUsed: string[]
}

export interface MealPlan {
  id: string
  recipes: MealPlanRecipeSlot[]
  usedPantryItems: string[]
  missingItems: { name: string; amount: string }[]
  totalTime: number
  servings: number
  expiringConsumeRatio: number // 0-1
  reason: string
  qualityScore: number
}

export type MealConstraint =
  | 'quick15' | 'lessPots' | 'kidFriendly' | 'highProtein' | 'light'
```

**本地算法（mealPlanBuilder.ts）：**

```typescript
export function buildLocalMealPlans(opts: {
  pantryNames: string[]
  expiringNames: string[]
  constraints: MealConstraint[]
  servings: number
}): MealPlan[] {
  // 1. matchRecipesWithFallbackSignal 取 top 30
  // 2. 按 role 分类：tags 含「汤/炖」→ soup；tags 含「素/蔬菜」→ veg；其余 → main
  // 3. 贪心组合：最大化 expiring 覆盖 + 最小 missing + totalTime 约束
  // 4. 返回 1 主方案 + 2 备选
}
```

- [ ] **Step 1:** 创建类型文件
- [ ] **Step 2:** 实现 `buildLocalMealPlans`，单测通过 regression 字符串断言
- [ ] **Step 3:** 实现 `buildAiMealPlan`（调用 `fetchRecipes` 扩展 prompt，Zod 校验）
- [ ] **Step 4:** AI 失败时 fallback 到 local

---

### Task 1.2：结果页「今晚一餐」模式（P0-2）

**Files:**
- Create: `src/pages/result/components/MealPlanCard.tsx`
- Create: `src/pages/result/components/MealPlanConstraints.tsx`
- Modify: `src/pages/result/index.tsx`
- Modify: `src/pages/pick/index.tsx`（跳转 `from=meal`）
- Modify: `src/pages/pantry/index.tsx`（临期卡 → `from=meal&expiring=...`）
- Modify: `src/pages/index/index.tsx`（临期卡 / 首次入库 → meal）

**路由约定：**

```
/pages/result/index?from=meal
  &ingredients=番茄,鸡蛋
  &expiring=番茄
  &constraints=quick15,lessPots
  &servings=3
  &source=pantry|pick|home|reminder
```

**UI 结构（from=meal）：**

```
标题：今晚先吃掉这些（临期） / 今晚吃什么
[约束 chips：15分钟内 | 少洗锅 | …]
┌─ 推荐方案 ─────────────────┐
│ 主菜：番茄炒蛋  12min        │
│ 素菜：蒜蓉西兰花  8min       │
│ 汤：…（或无）               │
│ 用掉：番茄(临期)、鸡蛋       │
│ 还缺：…  [加入采购清单]      │
│ 总耗时 25min · 3人份        │
└────────────────────────────┘
[备选方案 1] [备选方案 2]
```

- [ ] **Step 1:** result 页解析 `from=meal`，调用 mealPlanBuilder
- [ ] **Step 2:** 实现 MealPlanCard 组件
- [ ] **Step 3:** 一键加入采购清单（复用 `ShoppingListSheet`）
- [ ] **Step 4:** 保持 `from=ai/dish/pantry/random` 路径不变
- [ ] **Step 5:** `npm run typecheck && npm run test:regression`

**验收标准：**
- 临期进入时标题为「今晚先吃掉这些」
- 每方案显示消耗/缺失/总耗时
- AI 不可用时至少有 1 个本地方案

---

### Task 1.3：临期提醒召回闭环（P0-5）

**Files:**
- Modify: `api/reminder-cron.js`
- Modify: `api/reminder-register.js`
- Modify: `lib/reminder/store.js`
- Modify: `src/utils/subscribeReminder.ts`
- Modify: `src/app.ts`（onLaunch 解析 scene / query）
- Modify: `src/pages/result/index.tsx`（`from=meal&source=reminder`）

**服务端改动：**

```javascript
// buildTemplateData：合并同日多项临期
function buildTemplateData(items) {
  const names = items.map(i => i.name).slice(0, 3).join('、')
  return {
    thing1: { value: names.slice(0, 20) },
    date2: { value: fmtDate(Math.min(...items.map(i => i.expiresAt))) },
    thing3: { value: '点击查看今晚方案' },
  }
}

// subscribeMessage.send 的 page 参数：
// /pages/result/index?from=meal&source=reminder&expiring=encodeURIComponent(names.join(','))
```

**客户端：**

- 合并登记：同一天只 register 一次，items 合并
- 扣减后：客户端 sync 时从 schedule 移除已消耗 item（或 cron 侧过滤）

- [ ] **Step 1:** cron 合并提醒 + 带 expiring query 的 page path
- [ ] **Step 2:** 客户端 onLaunch 处理订阅消息落地
- [ ] **Step 3:** 无可推荐菜谱时展示采购/丢弃/延长保存建议
- [ ] **Step 4:** 每天最多推送 1 条（cron 层 dedupe by openid per day）
- [ ] **Step 5:** 文档更新 `docs/reminder-flow.md`

---

### Task 1.4：详情页「为什么适合我」

**Files:**
- Create: `src/utils/recipePantryContext.ts`
- Modify: `src/pages/detail/index.tsx`

```typescript
export function getRecipePantryContext(recipe: Recipe, pantryItems: PantryItem[]) {
  const hits = recipe.ingredients?.map(ing => findPantryItemForRecipeIngredient(ing.name, pantryItems)).filter(Boolean)
  const expiringHits = hits.filter(i => getFreshnessStatus(i!) !== 'fresh')
  const missing = recipe.ingredients?.filter(ing => !findPantryItemForRecipeIngredient(ing.name, pantryItems))
  return { hits, expiringHits, missing, reason: buildReasonText(expiringHits, missing) }
}
```

- [ ] **Step 1:** 实现 context helper
- [ ] **Step 2:** 详情页 hero 下方增加「适合你因为…」信息条
- [ ] **Step 3:** 显示「做完将扣减：…」「还缺：…已加入清单？」

---

### Task 1.5：埋点与关键行为统计

**Files:**
- Modify: `src/utils/analytics.ts`
- Create: `src/utils/analyticsExport.ts`

- [ ] **Step 1:** 标准化事件：`first_intake_done`, `meal_plan_view`, `cook_start`, `cook_complete`, `pantry_deduct`
- [ ] **Step 2:** Profile 开发者区增加「导出埋点 JSON」
- [ ] **Step 3:** 为后续接入微信数据分析留 `reportEvent` 抽象

---

## 4. 第 2 阶段：家庭协作

### Task 2.1：Household 数据模型与 API 抽象

**Files:**
- Create: `src/types/household.ts`
- Create: `src/api/household.ts`（接口抽象 + mock 实现）
- Create: `api/household-sync.js`（Vercel serverless MVP）
- Modify: `src/store/storageKeys.ts`

```typescript
export interface HouseholdMember {
  id: string
  nickname: string
  joinedAt: number
}

export interface Household {
  householdId: string
  inviteCode: string
  members: HouseholdMember[]
  pantryItems: PantryItem[]
  shoppingList: ShoppingListItem[]
  updatedAt: number
  updatedBy?: string
}
```

- [ ] **Step 1:** 定义类型与 `HouseholdApi` interface（create/join/sync/pull/push）
- [ ] **Step 2:** Mock 实现（localStorage 模拟，便于无后端开发）
- [ ] **Step 3:** Serverless 实现（KV/Upstash 或微信云开发，二选一）
- [ ] **Step 4:** 单元测试 sync 冲突策略（last-write-wins + merge by id）

---

### Task 2.2：PantryStore 双模式

**Files:**
- Modify: `src/store/pantryStore.ts`
- Create: `src/store/householdStore.ts`

- [ ] **Step 1:** `mode: 'local' | 'household'`
- [ ] **Step 2:** 共享模式下：本地 autorun 防抖 push；onShow pull
- [ ] **Step 3:** 同步失败 Toast + 保留本地，不阻塞使用
- [ ] **Step 4:** 显示「最近更新：爸爸 · 10 分钟前」

---

### Task 2.3：Profile「家庭厨房」入口

**Files:**
- Modify: `src/pages/profile/index.tsx`
- Create: `src/pages/profile/components/HouseholdPanel.tsx`

- [ ] **Step 1:** 创建家庭 / 复制邀请码 / 加入家庭 UI
- [ ] **Step 2:** 退出家庭回退 local 模式
- [ ] **Step 3:** 隐私说明：仅家庭成员可见库存

---

### Task 2.4：购物清单与分享增强

**Files:**
- Modify: `src/components/ShoppingListSheet.tsx`
- Modify: `src/pages/detail/index.tsx`

- [ ] **Step 1:** 缺失食材一键加入家庭购物清单
- [ ] **Step 2:** 分享类型：菜谱 / 今晚菜单 / 购物清单 / 邀请家庭
- [ ] **Step 3:** 分享卡片 path 带参数，B 用户打开可一键加入

**验收标准（P0-4）：**
- A 创建家庭，B 加入后看到共享冰箱
- A 扣减后 B 下次进入可同步
- 无网络可读本地缓存

---

## 5. 第 3 阶段：架构与视觉（随迭代并行）

### Task 5.1：跨页导航状态统一

**Files:**
- Create: `src/utils/navigationPayload.ts`

```typescript
const TTL_MS = 30 * 60 * 1000

export function setNavPayload<T>(key: NavPayloadKey, value: T): void
export function consumeNavPayload<T>(key: NavPayloadKey): T | null
// 替代直接 setStorageSync 的 selectedRecipeDetail 等
```

- [ ] **Step 1:** 封装读写 + TTL + 类型
- [ ] **Step 2:** 逐页迁移（index → result → detail → pick → pantry）
- [ ] **Step 3:** regression 检查无裸 Storage key 新增

---

### Task 5.2：页面组件拆分

**优先级顺序（按行数）：**

| 源文件 | 拆出组件 |
|---|---|
| `pantry/index.tsx` | `FridgeCabinet`, `IntakeSheet`, `SupermarketLookup`, `ExpiryOverview` |
| `detail/index.tsx` | `CookingMode`, `IngredientGrid`, `RecipeHero`, `PantryContextBar` |
| `result/index.tsx` | `RecipeResultCard`, `MealPlanCard` |
| `profile/index.tsx` | `AchievementsPanel`, `PreferencePanel`, `HouseholdPanel` |

- [ ] **Step 1:** pantry 拆 FridgeCabinet（最大块）
- [ ] **Step 2:** detail 拆 CookingMode
- [ ] **Step 3:** 每拆一块跑 typecheck + regression
- [ ] **目标:** 单页 < 500 行

---

### Task 5.3：图标系统（P2）

**Files:**
- Create: `src/assets/icons/`（PNG 24/48px 或 iconfont）
- Create: `src/components/AppIcon.tsx`
- Modify: 首页、冰箱、详情主按钮

- [ ] **Step 1:** 定义 12 个核心 icon
- [ ] **Step 2:** AppIcon 组件统一 size/color
- [ ] **Step 3:** 替换主功能 emoji；空状态可保留轻量 emoji

---

## 6. 验证命令（每个 Task 完成后）

```bash
npm run typecheck
npm run test:regression
npm run check:release
# 涉及 catalog 时额外：
npm run audit:catalog
# 发版前：
npm run verify:release
```

**真机验证清单（上线前人工）：**
- [ ] 拍小票 / 拍食材入库
- [ ] 订阅消息点击落地 meal 页
- [ ] 分享卡片打开
- [ ] 烹饪完成扣减
- [ ] 图片域名 downloadFile 合法
- [ ] 无 AI 时全路径可走通

---

## 7. 风险与依赖

| 风险 | 缓解 |
|---|---|
| catalog 清洗改 CDN 数据量大 | 脚本可逆（保留 originalTitle）；分 chunk 增量 patch |
| MealPlan 本地算法效果一般 | 先保证有方案；AI 增强为加分项 |
| 家庭同步冲突 | MVP 用 last-write-wins；条目级 merge by id |
| 订阅消息模板字段不匹配 | `buildTemplateData` 按公众平台实际模板调整 |
| pantry 拆分引入回归 | 每拆一个组件跑 regression + 真机点检 |
| 图标小程序兼容 | 优先 PNG，避免复杂 SVG 滤镜 |

**Task 依赖图：**

```
0.1 audit ──→ 0.2 clean ──→ recommend 质量
0.3 首日激活 ──→ 1.2 meal UI（首次入库跳转）
1.1 MealPlan 类型 ──→ 1.2 result meal 模式
1.2 meal 模式 ──→ 1.3 提醒落地
2.1 household API ──→ 2.2 pantry 双模式 ──→ 2.3 profile UI
```

---

## 8. 建议执行顺序（给 Agent 的工作队列）

**第一批（可并行）：**
1. Task 0.1 + 0.2（catalog 质量，独立）
2. Task 0.4（Tab 改名，极小改动）

**第二批：**
3. Task 0.3（首日激活，依赖 0.2 可选）
4. Task 0.5（Profile 降级）

**第三批：**
5. Task 1.1 → 1.2（今晚一餐，核心）
6. Task 1.4（详情页上下文，可与 1.2 并行）

**第四批：**
7. Task 1.3（提醒闭环，依赖 1.2）
8. Task 1.5（埋点）

**第五批（第 2 阶段）：**
9. Task 2.1 → 2.2 → 2.3 → 2.4

**持续：**
10. Task 5.1 / 5.2 / 5.3 穿插在功能迭代中

---

## 9. 不做清单（评审明确拒绝）

- 重社区（评论、广场、打卡墙）
- 成就系统复杂化 / 排行榜
- 首日引导配置冰箱布局
- 现在收费 / Pro 墙挡住核心闭环
- 天气推荐加重
- 让用户配置 API Key（生产环境）

---

*Plan complete. 评审报告路径：`/Users/test/Desktop/Love-Kitchen-爆款产品评审与改造执行报告.md`*
