# Love Kitchen WeChat QA Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the specific issues reproduced in WeChat DevTools on 2026-07-05 without reopening broad product redesign, dependency churn, catalog refetching, or git workflow damage.

**Architecture:** Keep the current Taro mini-program structure. Apply small targeted fixes in app config, recommendation quality rules, meal-plan accounting, result-page actions, storage persistence, and local-service degradation. Prefer runtime fallback and deterministic tests over large rewrites.

**Tech Stack:** Taro 3.6, React, TypeScript, WeChat Mini Program, local catalog CDN scripts, Node verification scripts.

---

## Cursor Execution Prompt

Use this exact scope:

> Before editing anything, verify the current workspace with `pwd` and `git rev-parse --show-toplevel`. The only allowed repository root is `/Users/test/cursor/Love-Kitchen`. If the path is different, stop immediately and ask the user to reopen the correct folder. Then fix only the WeChat DevTools hardening issues listed in `docs/superpowers/plans/2026-07-05-love-kitchen-wechat-devtools-hardening.md`. Do not refactor unrelated modules, do not upgrade dependencies, do not fetch new recipes, do not remove git hooks, do not commit or push unless the user explicitly asks. After each task, run the listed verification command and report exact output.

## Workspace Lock

Cursor must not edit an older checkout or any similarly named folder. The correct local folder is:

```text
/Users/test/cursor/Love-Kitchen
```

Before changing files, run:

```bash
pwd
git rev-parse --show-toplevel
test "$(git rev-parse --show-toplevel)" = "/Users/test/cursor/Love-Kitchen"
test -f docs/superpowers/plans/2026-07-05-love-kitchen-wechat-devtools-hardening.md
```

Expected:

- `pwd` is `/Users/test/cursor/Love-Kitchen`.
- `git rev-parse --show-toplevel` is `/Users/test/cursor/Love-Kitchen`.
- The `test` commands exit 0.

If any command fails, Cursor must stop. Do not search for another Love-Kitchen folder, do not copy files between folders, and do not continue in the current window. The user must reopen the correct folder with Cursor's `File -> Open Folder...` menu and select `/Users/test/cursor/Love-Kitchen`.

## What Cursor May Do

- Edit source files listed in each task below.
- Add focused regression assertions to existing Node verification scripts.
- Run `npm run clean:catalog` only after changing shared catalog title rules, and only if the changed rules require regenerated catalog JSON.
- Run `npm run build:weapp`, `npm run verify:all`, `npm run audit:catalog`, and WeChat DevTools manual checks.
- Update comments/docs that currently say `scope.record` must be declared in `app.json`.

## What Cursor Must Not Do

- Do not run `git reset`, `git checkout --`, destructive `rm`, or any command that discards user/Cursor changes.
- Do not remove `.git/hooks/pre-commit` or `.git/hooks/pre-push`.
- Do not commit, push, create branches, or open PRs unless the user explicitly asks.
- Do not modify `project.config.json`, appid, package name, tabbar page paths, or WeChat DevTools project identity.
- Do not move API keys into client code. Do not print or quote `.env.local` secrets.
- Do not change `package-lock.json` or upgrade dependencies for this pass.
- Do not run recipe fetch/import scripts such as `fetch:popular-recipes`, `import:recipe`, `fetch:recipe-images`, or any broad network data refresh.
- Do not replace the entire catalog with new external data.
- Do not attempt production CDN migration in this pass. Local image warnings are handled by fallback and documentation; full HTTPS media hosting needs separate approval.
- Do not hide real business errors by globally suppressing `console.error`.

## Known Acceptable Warnings

These are allowed after this pass:

- Browserslist/caniuse-lite stale warning during build.
- Webpack size warning for `common.js` around 356 KiB.
- Webpack `NoAsyncChunksWarning`.
- WeChat DevTools gray-base-library internal error containing `navigator` if it still points only to `beforebaselibready.js` and not app code.
- Local image HTTP warning when using `TARO_APP_CATALOG_BASE_URL=http://127.0.0.1:8790`; production still needs HTTPS media hosting later.

These are not allowed after this pass:

- `无效的 app.json permission["scope.record"]`
- `PantryStore persist failed` red error on normal page load
- `POST http://127.0.0.1:8787/ net::ERR_CONNECTION_REFUSED` merely from opening `pages/profile/index`
- Result page showing `临期消耗 200%`
- Result page primary action looking tappable but doing nothing
- Homepage first viewport showing titles with `舔盘`, `天花板`, `秒杀`, `巨好`, `❗`, repeated emoji, or similar marketing copy

## Files Map

- `src/app.config.ts`: app-level WeChat permission declaration.
- `src/components/VoiceRecorderSheet.tsx`: voice recorder comments and permission expectations.
- `src/utils/catalogQuality.ts`: runtime title quality, display title cleanup, recommendation eligibility.
- `scripts/lib/catalog-quality-rules.mjs`: build/audit-time title quality rules; must stay aligned with runtime rules.
- `scripts/verify-features.mjs`: feature-level assertions for title cleanup, app config, result action, and profile AI behavior.
- `scripts/regression-checks.mjs`: static regression checks for no invalid app permission, meal-plan ratio guard, and no auto LLM request on profile open.
- `src/utils/recommend.ts`: home recommendation pool quality filter.
- `src/pages/index/components/HomeRecommendSection.tsx`: render clean display title and reliable image fallback.
- `src/utils/mealPlanBuilder.ts`: pantry ingredient canonicalization, used/expiring accounting, ratio clamp.
- `src/pages/result/components/MealPlanCard.tsx`: result card title display and image fallback.
- `src/pages/result/components/MealPlanActions.tsx`: primary CTA click reliability.
- `src/pages/result/index.tsx`: result CTA loading/failure feedback.
- `src/store/pantryStore.ts`: storage persistence hardening and DevTools-safe logging.
- `src/pages/profile/useProfileLifecycle.ts`: avoid automatic AI proxy probe on page open.
- `scripts/dev-local.mjs`: local service startup messaging only, if needed.

---

### Task 0: Guardrail Preflight

**Files:**
- Read only: current git status and config.

- [ ] **Step 1: Record current dirty tree**

Run:

```bash
git status --short
```

Expected: many existing staged/modified files are present. Do not revert them.

- [ ] **Step 2: Confirm no dependency change is needed**

Run:

```bash
node -e "const p=require('./package.json'); console.log(p.scripts['verify:all']); console.log(p.scripts['dev:local']);"
```

Expected: both scripts print. Do not install or upgrade packages.

- [ ] **Step 3: Keep hooks intact**

Run:

```bash
test -f .git/hooks/pre-commit && test -f .git/hooks/pre-push && echo hooks-present
```

Expected: `hooks-present`

---

### Task 1: Remove Invalid WeChat Record Permission

**Files:**
- Modify: `src/app.config.ts`
- Modify: `src/components/VoiceRecorderSheet.tsx`
- Test: `scripts/verify-features.mjs`
- Test: `scripts/regression-checks.mjs`

- [ ] **Step 1: Add static checks before changing code**

In `scripts/verify-features.mjs`, after the `appJson` block is loaded, add checks equivalent to:

```js
ok('app.json 不应声明无效 scope.record', !appJson.permission?.['scope.record'])
ok('app.json 仍保留定位权限说明', Boolean(appJson.permission?.['scope.userLocation']?.desc))
```

In `scripts/regression-checks.mjs`, add:

```js
expect('app.config 不应声明无效 scope.record', !appConfig.includes("'scope.record'"))
```

- [ ] **Step 2: Verify the checks fail before the fix**

Run:

```bash
npm run build:weapp && node scripts/verify-features.mjs
```

Expected before fix: failure mentioning `scope.record`.

- [ ] **Step 3: Remove only the invalid permission declaration**

In `src/app.config.ts`, remove only this block:

```ts
'scope.record': {
  desc: '用于语音记录食材，便于快速整理冰箱库存'
}
```

Keep:

```ts
'scope.userLocation': {
  desc: '用于获取当地天气，推荐时令菜谱'
}
```

- [ ] **Step 4: Update the recorder comment**

In `src/components/VoiceRecorderSheet.tsx`, replace the line saying mini programs must declare `scope.record` in `app.json`. The new comment should say:

```ts
 * - 录音授权由微信运行时弹窗处理；不要在 app.json permission 中声明 scope.record
```

- [ ] **Step 5: Verify**

Run:

```bash
npm run build:weapp && node scripts/verify-features.mjs && npm run test:regression
```

Expected: commands pass, and `dist/app.json` no longer contains `scope.record`.

---

### Task 2: Clean Homepage-Visible Marketing Titles

**Files:**
- Modify: `src/utils/catalogQuality.ts`
- Modify: `scripts/lib/catalog-quality-rules.mjs`
- Modify: `scripts/verify-features.mjs`
- Maybe regenerate: `catalog-cdn/index.json`, `catalog-cdn/chunks/chunk-*.json`

- [ ] **Step 1: Add failing title-quality assertions**

In `scripts/verify-features.mjs`, add assertions:

```js
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
```

- [ ] **Step 2: Verify the new assertions fail before implementation**

Run:

```bash
node scripts/verify-features.mjs
```

Expected before fix: at least one dirty-title assertion fails.

- [ ] **Step 3: Align runtime and script cleanup rules**

Update both `src/utils/catalogQuality.ts` and `scripts/lib/catalog-quality-rules.mjs` with the same intent:

- Detect and penalize `好吃到`, `舔盘`, `舔手指`, `天花板`, `秒杀`, `巨好`, `比外面卖的`, `被惊艳`, `亲戚家`, `全蛋️`, and repeated emoji/punctuation.
- Use a non-global regex for `.test()` and a global regex or helper for `.replace()`, so repeated emoji are removed without regex state bugs.
- `cleanDisplayTitle()` should remove marketing prefixes/suffixes rather than merely truncating them.
- Keep normal dish names such as `番茄炒蛋`, `鱼香肉丝`, `干煸四季豆`, `番茄鸡蛋汤` unchanged.

Do not add LLM rewriting. Do not create a manual list of 5000 renamed recipes.

- [ ] **Step 4: Regenerate catalog only if rules changed catalog output**

Run:

```bash
npm run clean:catalog
```

Expected: only catalog quality fields/titles update. Do not run recipe fetch scripts.

- [ ] **Step 5: Verify title quality and catalog audit**

Run:

```bash
node scripts/verify-features.mjs && npm run audit:catalog
```

Expected:

- `verify-features passed`
- `展示标题异常` is at or below the previous 3.4%, preferably lower.
- Homepage dirty examples no longer appear in cleaned display titles.

---

### Task 3: Make Homepage Recommendation Pool Premium Enough

**Files:**
- Modify: `src/utils/recommend.ts`
- Modify: `src/pages/index/components/HomeRecommendSection.tsx`
- Modify: `scripts/verify-features.mjs`

- [ ] **Step 1: Add static verification for the home recommendation guard**

In `scripts/verify-features.mjs`, read `src/utils/recommend.ts` and assert it filters home recommendations using title quality, not only numeric score:

```js
const recommendSrc = fs.readFileSync(path.join(root, 'src/utils/recommend.ts'), 'utf8')
ok('首页推荐池应排除标题异常菜谱', recommendSrc.includes('hasTitleIssue') || recommendSrc.includes('isPremiumHomeRecipe'))
```

- [ ] **Step 2: Tighten the home pool without changing all search results**

In `src/utils/recommend.ts`, keep `isRecommendable` for broad recommendation/search behavior, but add a homepage-specific predicate such as:

```ts
function isPremiumHomeRecipe(recipe: Recipe): boolean {
  const title = recipe.displayTitle || recipe.title
  if (!isRecommendable(recipe)) return false
  if ((recipe.qualityScore ?? 100) < 80) return false
  if (hasTitleIssue(title)) return false
  return true
}
```

Use it for the default daily/personalized/weather home pool. Do not use it for dish search, ingredient search, or detail lookup.

- [ ] **Step 3: Render the clean display title**

In `src/pages/index/components/HomeRecommendSection.tsx`, render:

```tsx
const displayTitle = item.displayTitle || item.title
```

Use `displayTitle` for the visible title and placeholder emoji, but keep the original `item` object for navigation.

- [ ] **Step 4: Verify**

Run:

```bash
node scripts/verify-features.mjs && npm run build:weapp
```

Expected: pass. In WeChat DevTools homepage, the first horizontal recommendation list must not show the dirty examples from Task 2.

---

### Task 4: Fix Meal Plan Ingredient Dedupe and Expiring Ratio

**Files:**
- Modify: `src/utils/mealPlanBuilder.ts`
- Modify: `src/pages/result/components/MealPlanCard.tsx`
- Modify: `scripts/verify-features.mjs`
- Modify: `scripts/regression-checks.mjs`

- [ ] **Step 1: Add a deterministic regression assertion**

In `scripts/verify-features.mjs`, import or otherwise exercise `buildLocalMealPlans` if practical. If importing TS is not convenient in this script, add a static check in `scripts/regression-checks.mjs` that requires a clamp:

```js
expect('mealPlanBuilder 应 clamp 临期消耗比例到 1', mealBuilder.includes('Math.min(1') && mealBuilder.includes('expiringConsumeRatio'))
```

Also check for a canonical/dedupe helper:

```js
expect('mealPlanBuilder 应规范化食材名避免芋头重复计数', /canonical|normalize/.test(mealBuilder) && mealBuilder.includes('expiringHit'))
```

- [ ] **Step 2: Implement canonical pantry matching**

In `src/utils/mealPlanBuilder.ts`, normalize ingredient names before counting used pantry and expiring hits. The behavior must satisfy:

- `芋头` and `荔浦芋头` count as one pantry/expiring hit when the user only selected `芋头`.
- `expiringConsumeRatio` never exceeds `1`.
- `usedPantryItems` should display selected pantry names, not every matched catalog synonym.

Use a small local helper in `mealPlanBuilder.ts`; do not introduce a new dependency.

- [ ] **Step 3: Clamp display defensively**

In `src/pages/result/components/MealPlanCard.tsx`, display:

```tsx
const safeRatio = Math.max(0, Math.min(1, plan.expiringConsumeRatio || 0))
```

Use `safeRatio` for `临期消耗`.

- [ ] **Step 4: Verify**

Run:

```bash
npm run test:regression && npm run build:weapp
```

Expected: pass. In WeChat DevTools, selecting only `芋头` must not show `临期消耗 200%`.

---

### Task 5: Make Result Primary CTA and Result Images Reliable

**Files:**
- Modify: `src/pages/result/components/MealPlanActions.tsx`
- Modify: `src/pages/result/components/MealPlanCard.tsx`
- Modify: `src/pages/result/index.tsx`
- Modify: `scripts/verify-features.mjs`

- [ ] **Step 1: Add static checks for CTA implementation**

In `scripts/verify-features.mjs`, add checks:

```js
const mealPlanActionsSrc = fs.readFileSync(path.join(root, 'src/pages/result/components/MealPlanActions.tsx'), 'utf8')
ok('结果页主 CTA 应使用 Button 或明确 loading 状态', mealPlanActionsSrc.includes('Button') && mealPlanActionsSrc.includes('开始做主菜'))
const mealPlanCardSrc = fs.readFileSync(path.join(root, 'src/pages/result/components/MealPlanCard.tsx'), 'utf8')
ok('MealPlanCard 图片应有 onError fallback', mealPlanCardSrc.includes('onError') && mealPlanCardSrc.includes('failed'))
```

- [ ] **Step 2: Convert primary CTA to a reliable button**

In `MealPlanActions.tsx`:

- Use Taro `Button` for the primary action.
- Add `loading?: boolean` and `disabled?: boolean` props.
- Keep visual style similar to current green pill.
- Do not nest `Button` inside another tappable `View`.

- [ ] **Step 3: Add click feedback and failure toast**

In `src/pages/result/index.tsx`, wrap `goToDetail(main)` for the main CTA with:

- `Taro.showLoading({ title: '打开菜谱…', mask: true })`
- `try/finally Taro.hideLoading()`
- `catch` toast `暂时打不开这道菜`

Do not swallow errors silently.

- [ ] **Step 4: Add result-plan image fallback**

In `MealPlanCard.tsx`, mirror homepage behavior:

- Track failed image ids locally.
- Add `onError` to `Image`.
- Show emoji placeholder when image fails.
- Use `slot.recipe.displayTitle || slot.recipe.title` for the visible title.

- [ ] **Step 5: Verify**

Run:

```bash
node scripts/verify-features.mjs && npm run build:weapp
```

Expected: pass. In WeChat DevTools, tapping `开始做主菜` should either open `pages/detail/index` or show an error toast; it must not appear to do nothing.

---

### Task 6: Stop Profile Page from Auto-Probing Dead Local AI Proxy

**Files:**
- Modify: `src/pages/profile/useProfileLifecycle.ts`
- Modify: `src/pages/profile/components/LlmServiceStatusCard.tsx`
- Modify: `scripts/regression-checks.mjs`

- [ ] **Step 1: Add a static regression check**

In `scripts/regression-checks.mjs`, add:

```js
const profileLifecycle = read('src/pages/profile/useProfileLifecycle.ts')
expect(
  'Profile 打开时不应自动请求 AI proxy',
  !/useEffect\(\(\) => \{[\s\S]*checkApiKey\(\)/.test(profileLifecycle)
)
```

- [ ] **Step 2: Remove automatic probe on page open**

In `src/pages/profile/useProfileLifecycle.ts`, keep `handleTestLlmProxy`, but remove automatic `checkApiKey()` from the mount effect. The page may initialize `apiKeyValid` as:

- `null` or `false` when not checked yet
- valid/invalid only after the user taps `检测 AI 服务`

Do not remove the manual detection button.

- [ ] **Step 3: Make status copy honest**

In `LlmServiceStatusCard.tsx`, show a neutral state before manual detection, such as `未检测` or `可手动检测`. Do not show a scary unavailable state before any request has been made.

- [ ] **Step 4: Verify**

Run:

```bash
npm run test:regression && npm run build:weapp
```

Expected: pass. In WeChat DevTools, opening `pages/profile/index` must not create `POST http://127.0.0.1:8787/ net::ERR_CONNECTION_REFUSED`. Clicking `检测 AI 服务` may still show failure if local proxy is not running.

---

### Task 7: Reduce PantryStore Persistence Noise Without Hiding Data Loss

**Files:**
- Modify: `src/store/pantryStore.ts`
- Modify: `scripts/regression-checks.mjs`

- [ ] **Step 1: Add regression guard**

In `scripts/regression-checks.mjs`, require that the storage write still exists, but direct `console.error('PantryStore persist failed'...)` is gone:

```js
expect('PantryStore 仍应持久化 pantryItems', pantryStore.includes('setStorageSync(STORAGE_KEYS.pantryItems'))
expect('PantryStore persist 不应在 DevTools 正常启动时刷红错', !pantryStore.includes("console.error('PantryStore persist failed"))
```

- [ ] **Step 2: Harden persistence**

In `src/store/pantryStore.ts`:

- Keep `Taro.setStorageSync(STORAGE_KEYS.pantryItems, ...)`.
- Catch storage errors.
- In development, use `console.warn` once per session with a concise message.
- In production, do not throw from autorun.
- Do not remove the autorun field tracking that persists item edits/moves.

- [ ] **Step 3: Verify**

Run:

```bash
npm run test:regression && npm run build:weapp
```

Expected: pass. In WeChat DevTools normal startup, there should be no red `PantryStore persist failed` app error. A yellow warning is acceptable only if the DevTools storage bridge is actually failing.

---

### Task 8: Local Service and Image Scope Boundary

**Files:**
- Maybe modify: `scripts/dev-local.mjs`
- Maybe modify: `.env.local.example`
- Do not modify: production CDN architecture unless separately approved.

- [ ] **Step 1: Confirm local services are already available**

Run:

```bash
node -e "const p=require('./package.json'); console.log(p.scripts['dev:local']); console.log(p.scripts['dev:catalog']); console.log(p.scripts['dev:llm-proxy']);"
```

Expected: all three scripts exist.

- [ ] **Step 2: Improve wording only if unclear**

If needed, update `scripts/dev-local.mjs` log messages to explicitly say:

- Start this command before opening WeChat DevTools.
- If only catalog is needed, `npm run dev:catalog` is enough.
- AI failures are expected until `npm run dev:llm-proxy` or `npm run dev:local` is running.

Do not add process managers, background daemons, HTTPS certificates, or dependency installs.

- [ ] **Step 3: Do not chase local HTTP image warning**

Do not try to remove the WeChat local HTTP warning by disabling security checks, modifying DevTools settings, or adding self-signed certs. This pass should ensure image fallbacks are graceful. Production HTTPS image hosting is a separate project.

---

### Task 9: Final Verification

**Files:**
- No new files unless verification scripts were changed above.

- [ ] **Step 1: Full automated verification**

Run:

```bash
npm run verify:all
```

Expected: exit 0.

Allowed warnings:

- caniuse-lite/Browserslist stale
- `common.js` size warning
- `NoAsyncChunksWarning`
- `.env.local` warning about local MiniMax key only if it remains local and server-side

- [ ] **Step 2: Catalog audit**

Run:

```bash
npm run audit:catalog
```

Expected:

- `展示标题异常` not higher than 3.4%.
- No increase in bad step URLs.
- Low-quality count does not materially increase.

- [ ] **Step 3: WeChat DevTools manual smoke**

Build first:

```bash
npm run build:weapp
```

Then open/compile in WeChat DevTools and verify:

- Homepage loads.
- Console no longer contains `无效的 app.json permission["scope.record"]`.
- Homepage first recommendations do not show dirty marketing titles.
- `今晚` tab: select `芋头`, generate plan.
- Result page: `临期消耗` does not exceed `100%`.
- Result page: tap `开始做主菜`; it opens detail or shows a toast, never silent.
- Result cards show fallback if an image fails.
- `冰箱` tab opens; no red `PantryStore persist failed` on normal startup.
- `我的` tab opens; no automatic `127.0.0.1:8787` red POST unless the user taps `检测 AI 服务`.

- [ ] **Step 4: Final status**

Run:

```bash
git status --short
```

Report changed files by task. Do not commit or push unless the user explicitly asks.

## Acceptance Summary

The pass is complete only when:

- `npm run verify:all` exits 0.
- WeChat DevTools no longer reports invalid `scope.record`.
- Homepage content quality is visibly more premium.
- The `芋头` result case no longer shows duplicate pantry consumption or `200%`.
- The result CTA has deterministic feedback.
- Opening Profile does not auto-fail the AI proxy.
- No forbidden action from this document was performed.

## Things To Defer

- Real production HTTPS image CDN/cloud storage migration.
- Bundle splitting/subpackages for `common.js`.
- Redesigning the homepage visual system beyond title/content quality.
- Refetching or expanding the 5000-recipe catalog.
- Reworking AI proxy architecture.
- Adding paid features or purchase flow.
