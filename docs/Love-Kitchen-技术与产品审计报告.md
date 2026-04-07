# Love-Kitchen 技术与产品审计报告

> 审计依据：`Love-Kitchen-产品需求汇总-v1.1.md`、`src/` 实现与 `git log` 近期提交。仅评估，不含代码修改建议的实施。

---

## 总览

项目为 **Taro 3.6 + React + TypeScript**，以微信小程序为主目标；**冰箱库存**使用 **MobX `PantryStore`**；**收藏 / 搜索历史 / 菜谱缓存 /「做过的菜」** 等集中在 **`src/store/index.ts`** 的 **同步 Storage 函数**；**LLM** 集中在 **`src/api/recipe.ts`**，并用 **`src/schemas/recipeLlm.ts`（Zod）** 做返回校验，与需求文档中的「统一 JSON、强校验」一致。

Git 历史可见从早期「药丸冰箱」到 **4 Tab、LLM 代理、Zod、体验收尾** 的多轮迭代（如 `da04526`、`53a5c02`、`b0960b9`），能解释部分「两套体系并存」现象。

---

## 1. 整体架构

**评分：7 / 10**

### 做得好的地方

- **页面与信息架构**与需求一致：`src/app.config.ts` 中首页 / 选菜 / 冰箱 / 我的 + 结果 / 详情，与 PRD 四 Tab + 子页一致。
- **AI 与数据契约**边界清晰：`src/api/recipe.ts` 统一 `fetchRecipes`、`usesLlmProxy`、重试与错误类型；`src/schemas/recipeLlm.ts` 对 LLM 数组做 **safeParse 丢弃坏项**，符合「防白屏」方向。
- **冰箱域模型**较完整：`src/store/pantryStore.ts` 含持久化、校验、槽位、`deductItems` 与 `src/utils/ingredientMatch.ts` 联动，和选菜 / 详情扣减闭环匹配。

### 最严重的 3 个问题

1. **状态管理分裂**：全局只有 `StoreContext` 里的 `pantryStore`（`src/store/context.ts`），其余能力全是 **模块级函数 + `Taro.setStorageSync`**；详情页扣库存直接 `import { pantryStore } from '../../store/pantryStore'`（**绕过 Context**），与「通过 Provider 注入」的写法并存，长期会增加测试与替换成本。
2. **跨页数据靠大量「约定键」**：如 `selectedRecipeDetail`、`savedIngredients`、`profileOpenFavorites`、`autoSearchIngredient`、`SHARE_SNAPSHOT_KEY` 等分散在 `index` / `pick` / `profile` / `detail`，没有单一 **导航状态或 store 枚举**，易出现漏清、竞态或文档与实现不一致。
3. **主题 / Token 重复且有一处完全闲置**：`src/theme/designTokens.ts`（`D`）为实际在用；**`src/theme/tokens.ts` 整文件未被任何 `import` 引用**（全仓库无 `from .../tokens`），属于典型迭代遗留。

### 本维度最高优先级改进方向

**收敛跨页状态**：要么把「当前菜谱、分享、临时搜索词」等纳入少量明确模块（甚至一个小型 `navigationStore` / 常量表 + 封装读写），要么统一用路由参数 + 短生命周期缓存；同时 **删除或合并未使用的 `tokens.ts`**，避免双套设计体系。

---

## 2. 代码质量

**评分：6 / 10**

### 做得好的地方

- **类型与校验**：`PantryStore` 的 `parseRow` / `sanitizeStoredItems`、LLM 的 Zod schema，说明对脏数据有意识防护。
- **结果页兜底**：`src/pages/result/index.tsx` 中 `getFallbackMessage`、本地匹配、`shuffleWithSeed` 与缓存键 `generateCacheKey`，逻辑集中、可读。

### 最严重的 3 个问题

1. **「做过的菜」双实现**：`src/store/index.ts` 已导出 **`markAsCooked`**，但全仓库 **无任何调用**；`src/pages/detail/index.tsx` 里 **`handleMarkCooked` 手写 `Taro.getStorageSync('cookedRecipes')`** 与 `setStorageSync`（含 `(c: any)`）。同一业务两条路径，后续改规则极易只改一处。
2. **重复逻辑**：选菜页 **`slotHint`**（`src/pages/pick/index.tsx`）与冰箱页 **`slotShortLabel`**（`src/pages/pantry/index.tsx`）语义相同、实现重复；同类「格子文案」应共享工具函数（当前未抽）。
3. **样式与工具层混用旧色板**：`src/styles/common.ts` 中如 **`tagStyle` 使用 `#8e8e93`、`#f3f4f6`**，与 `D` 的灰阶体系不一致；`errorBoxStyle` / `errorTextStyle` 也是独立橙色体系，而结果页已用 `D` 自建 `errorBox`。属于多次改版留下的 **局部未对齐**。

### 性能与隐患（结合具体代码）

- **`PantryStore` 构造函数里 `autorun` 每次 `items` 变化都 `JSON.stringify` + `setStorageSync`**（`src/store/pantryStore.ts`）：食材多、操作频繁时写入偏密，小程序 Storage 有同步与体积限制，属于可预见的扩展瓶颈。
- **结果页 `useEffect` 依赖 `router.params` 对象引用**（`src/pages/result/index.tsx`）：若 Taro 在重渲染时给出新对象引用，可能触发 **重复拉取 / 重复 effect**；需结合真机验证。

### 本维度最高优先级改进方向

**删掉或统一「做过的菜」写入路径**：只保留 `markAsCooked`（或只保留一处封装），去掉 `any`；顺带 **抽出槽位文案工具函数**，并把 `common.ts` 里仍用硬编码色的样式 **迁到 `D` 或明确标注废弃**。

---

## 3. 前端审美与 UI 一致性

**评分：7 / 10**

### 做得好的地方

- **`src/theme/designTokens.ts`** 定义了背景、分隔线、圆角层级（`radiusL/M/S/XL`）、烹饪模式深色一组色（`cookingBg` 等），与 `app.config.ts` 导航栏 `#FFFCF9` 一致。
- **冰箱页**大量定制渐变与金属质感（`src/pages/pantry/index.tsx` 内联 `fridgeCabinet`、`freezerChamber` 等），**产品记忆点强**，与「生活方式 / 家庭厨房」定位相符。
- 整体 **不是**「泛 AI 紫渐变」，而是 **暖灰纸感 + 咖啡褐主色**，方向明确。

### 最严重的 3 个问题

1. **首页与其它页样式组织方式不一致**：首页主要用 **`src/pages/index/styles.ts`** + 少量内联（如空冰箱引导一整块手写 `rgba(255,149,0,...)`）；选菜 / 冰箱 / 我的 / 详情则以 **`D` + 超长内联 style** 为主。同一产品内 **「抽离样式模块 vs 页内堆样式」** 两套习惯并存。
2. **首页样式文件存在明显「历史 UI」遗留**：`src/pages/index/styles.ts` 仍保留 **`deckWrapStyle` / `deckCardStyle`** 等「扑克牌叠放」说明与样式，但当前 **`src/pages/index/index.tsx` 已改为横向 `moreChip` 列表**，这些 export **极可能为死代码**，属于多轮改版痕迹。
3. **全局字体栈偏「系统默认」**：`src/app.scss` 使用 `-apple-system`、**`Arial`、`Roboto`** 等；若未来做 H5 或强调品牌字，**当前未做分层**（主标题 / 正文统一走系统栈）。

### 响应式与安全区

- 多处已写 **`env(safe-area-inset-bottom)`**（如选菜底栏、冰箱底栏、详情底栏），这是加分项。
- **`tailwind.config.js` 存在但业务几乎不用**（全 `src` 仅 `className="search-input"` 一处），属于 **配置债务**。

### 本维度最高优先级改进方向

**统一「页面样式放哪」的约定**（例如：布局与复用块进 `styles.ts` 或 `components`，页面只留结构）；并 **清理 `index/styles.ts` 中已下线 UI 的 export**，避免后续误用。

---

## 4. 用户体验（含与 PRD 对齐）

**评分：7 / 10**

### 做得好的地方

- **天气**：与 PRD 一致——默认 `getMockWeather`，用户点「刷新天气」再 `fetchLiveWeather`（`src/pages/index/index.tsx` 与天气 API 路径）。
- **空状态 / 引导**：首页空冰箱横幅、选菜空冰箱、冰箱空状态、`result` 的 fallback 文案、`detail` 的 `shareMiss` 与无数据回首页，覆盖较全。
- **加载态**：AI 请求时结果页全屏「正在为你搭配菜谱…」，符合核心等待路径。

### 最严重的 3 个问题

1. **PRD 中的「语音 / 拍照入库」未实现**：冰箱页明确写 **「拍照识别小票将后续接入」**（`src/pages/pantry/index.tsx`），当前为 **手动清单 + 解析**；需求文档 3.1 的语音、拍照仍是 **产品缺口**。
2. **分享链路对 AI 菜谱仍脆弱**：详情通过 `payload` 或 `shareId` + `SHARE_SNAPSHOT_KEY` 兜底（`src/pages/detail/index.tsx`）；`shareMiss` 已处理失败文案，但 **跨设备 / 清缓存 / 超长 payload** 仍依赖用户理解——与 PRD「分享卡片附带食材列表」相比，工程上已压缩 payload，体验上仍是 **妥协方案**。
3. **选菜页「默认勾选临期」只初始化一次**：`initialized` 在 `useDidShow` 里仅当 `!initialized && expiringNames.length > 0` 时设置（`src/pages/pick/index.tsx`）。用户若首次进入时冰箱无临期、后来有了临期，或清空后再进，**不一定会再次自动勾选**，与 PRD「进入默认勾选 1–2 款临期」在 **边界场景** 上可能不一致。

### 本维度最高优先级改进方向

在 v1 范围内建议优先 **理顺选菜默认勾选与冰箱数据变化的同步策略**（与 PRD 主路径一致）；语音/拍照若不在本期，建议在 **产品文档与界面预期** 上标成「后续」，避免评审与实现长期错位。

---

## 5. 历史改动痕迹（风格不一致 / 打补丁感）

**评分：6 / 10**

### 可观察证据

- **Git**：`e68d2d3` 项目更名、`53a5c02` 合并收藏与 LLM 代理、`b0960b9` 体验收尾等，说明功能迭代快，**易出现未删尽的旧抽象**。
- **代码**：未使用的 **`src/theme/tokens.ts`**、首页 **deck 样式残留**、`src/styles/common.ts` **旧色值**、**`markAsCooked` 死导出**、`recipe.ts` 中 **`getDeepseekApiKey` 别名**（deprecated 注释）——整体像 **「新层叠在旧层上」**。

### 最严重的 3 个问题

1. **双主题文件**：`tokens.ts` 与 `D` 并存且前者零引用，是最典型的 **改名/换设计体系未收尾**。
2. **Store 命名与职责**：`src/store/index.ts` 实际是 **Storage 工具集**，不是 Redux/MobX 意义上的 index；新同学会 **误判架构**。
3. **详情对 MobX 的用法不统一**：既用 `observer` 包装页面，又对 `pantryStore` **直接单例 import**，与 `App` 里 `Provider` 模式 **语义打架**，属于 **补丁式接入** 的痕迹。

### 本维度最高优先级改进方向

做一次 **「无行为变更」的清理型整理**：删或合并死文件、死样式、死导出；**重命名或注释 `store/index.ts` 的真实角色**，降低后续协作成本。

---

## 综合：跨维度优先级最高的改进方向

1. **统一跨页状态与存储键封装**（架构 + 历史债），减少 `setStorageSync` 散落。
2. **合并「做过的菜」与槽位文案等重复实现**（代码质量）。
3. **清理未使用模块与首页遗留样式**（`tokens.ts`、`index/styles.ts` 中 deck 相关），并把 `common.ts` 硬编码色迁入 `D`（UI 一致性）。
4. **产品对齐**：明确语音/拍照与分享在 v1 的边界；修正选菜页临期默认勾选的边界行为（UX + PRD）。

---

## 各维度分数一览

| 维度 | 分数 |
|------|------|
| 1. 整体架构 | **7** |
| 2. 代码质量 | **6** |
| 3. 前端审美与 UI 一致性 | **7** |
| 4. 用户体验 | **7** |
| 5. 历史改动痕迹 | **6** |

**综合主观分：约 6.5～7 / 10** —— 作为 **MVP + 明确设计方向的微信小程序** 质量合格，且在 **LLM 校验、冰箱玩法、体验文案** 上有亮点；主要短板在 **状态与样式体系的统一性**、**重复/死代码**，以及 **PRD 部分能力尚未落地** 的透明化管理。

---

*文档版本：与对话审计一致，可随代码演进更新。*
