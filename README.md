# 🍳 爱心厨房

> 微信小程序 · AI 菜谱与冰箱助手 —— 帮家里「清库存、少浪费、吃好饭」

---

## 这是啥？

**爱心厨房** 面向 **负责一家人吃饭** 的场景：记下冰箱里有什么、临期先吃、按食材出菜谱。不必先填满冰箱也能用——首页可直接输入食材搜索，或浏览今日推荐。

整套体验围绕三件事打磨：
1. **搜得快**：首页一个搜索框承接「输入 / 拍照 / 相册 / 语音」四种入口；
2. **写得准**：冰箱页双门柜 + 临期红黄点 + 小票 / 备忘预填；
3. **做得稳**：详情页骨架屏加载、多步并行计时、采购清单一键带走。

---

## 核心功能

| 功能 | 说明 |
|------|------|
| 🏠 清冰箱 | 双门冰箱视图管理库存，格子上用红 / 黄点直观标注临期与过期 |
| ✍️ 多模态入库 | 首页「拍照 / 相册 / 语音」采集后跳冰箱页，再由用户核对文本入库 |
| 🍳 智能选菜 | 200 道本地常见菜 + AI 兜底，勾选 / 输入食材后优先匹配能消耗库存和临期食材的菜谱 |
| 🔎 首页搜索 | 不依赖冰箱，输入食材即可 AI 推荐；历史记录可清空 |
| 🌤 今日推荐 | 默认按家常菜评分 + 当日种子给出稳定推荐；点「接入实时天气」后才叠加天气维度（授权制） |
| 热门 200 道菜支持封面 + 关键步骤图，全屏沉浸式，多步可 **并行计时**，后台切换也不丢失基准时间 |
| 🛒 采购清单 | 详情页自动对齐冰箱库存，勾选缺项 → 复制 / 分享带走 |
| ❤️ 收藏 & 成就 | 菜谱可收藏，「我的」中查看成就进度（已做、收藏、连续入库等） |

---

## 技术栈

- **前端**：Taro 3 + React + TypeScript + MobX
- **AI**：MiniMax（OpenAI 兼容接口，默认 `MiniMax-M2.7`）；**生产环境推荐**服务端中转（`TARO_APP_LLM_PROXY_URL`），密钥不落客户端
- **数据校验**：Zod（保证 LLM 返回的 JSON 结构可用）
- **天气**：Open-Meteo（按用户授权，一次性取实时温度 / 天气码，无后台常驻）
- **持久化**：`Taro.setStorageSync` 统一走 `STORAGE_KEYS`，键名集中、禁止随意改名
- **设计系统**：`src/theme/designTokens.ts`（`D`）—— 所有色值、字号、圆角、阴影、字重均走 Token，**禁止硬编码**

---

## 项目结构

```
src/
├── api/                    # weather / recipe LLM 调用
├── components/             # Skeleton、VoiceRecorderSheet、ShoppingListSheet 等
├── hooks/
│   └── useParallelTimers.ts  # 多步并行计时（基于时间戳）
├── pages/
│   ├── index/              # 首页：统一搜索框 + 今日推荐
│   ├── pick/               # 选菜页：分类勾选 + 临期一键加入
│   ├── pantry/             # 冰箱页：双门柜 + 小票/语音备忘入库
│   ├── result/             # 结果页：骨架屏 + AI/本地/缓存统一视觉
│   ├── detail/             # 详情页：做菜模式 + 采购清单
│   └── profile/            # 我的：偏好、成就、关于（7 连击解锁开发入口）
├── store/                  # MobX PantryStore + storage utils + key 常量
├── theme/designTokens.ts   # 单一设计源
├── types/                  # recipe / pantry / fridge 领域模型
└── utils/
    ├── recommend.ts        # getDailyRecommendations（天气无关）
    ├── mediaIntake.ts      # 首页多模态采集 → 冰箱页预填
    ├── shoppingList.ts     # 对齐冰箱库存
    └── achievements.ts     # 成就规则
```

---

## 快速开始

```bash
npm install
npm run dev:weapp        # 微信小程序开发
npm run build:weapp      # 生产构建
npm run build:h5         # H5 构建
```

`npm install` 后会自动执行 `postinstall`：对 `@swc/register` 做极小补丁（去掉传入 `transformSync` 的 `cwd` 字段），否则在 **Node 22+** 下 Taro 3.6 自带的 `@swc/core@1.3.23` 会报 `unknown field cwd` 并无法加载 CLI 预设。项目已将 **`@swc/core` 固定为 `1.3.23`**（与 Taro 内置 WASM 插件 ABI 一致），请勿随意升到 1.4+。

本地探活 MiniMax（需 `.env.local` 中配置 `MINIMAX_API_KEY`）：

```bash
npm run smoke:minimax
```

### AI 菜谱生成（必配）

1. 初始化环境：`npm run setup:env`
2. 编辑 `.env.local`，填入 `MINIMAX_API_KEY=你的密钥`
3. 确认 `TARO_APP_LLM_PROXY_URL=http://127.0.0.1:8787`
4. 终端 1：`npm run dev:llm-proxy`（启动本地 LLM 中转）
5. 终端 2：`npm run dev:weapp`（重新编译小程序）
6. 微信开发者工具 → 详情 → 本地设置 → 勾选「不校验合法域名」

上线部署：将 `api/llm-proxy.js` 部署到 Vercel，在 Vercel 环境变量配置 `MINIMAX_API_KEY`，客户端 `.env.local` 改为 Vercel 地址。

### 生产部署：LLM 代理

客户端不应持有模型 Key。推荐走 Vercel Serverless：

```
POST ${TARO_APP_LLM_PROXY_URL}
Body: { messages, model, temperature, stream }
```

参考实现见仓库 `api/llm-proxy.js`，部署后在小程序后台把你的域名加入 `request` 白名单。

### 微信小程序合法域名清单

在**微信公众平台 → 开发 → 开发管理 → 服务器域名**中添加以下域名：

| 类型 | 域名 | 用途 |
|------|------|------|
| request | `api.minimaxi.com` | MiniMax LLM 直连（开发调试用） |
| request | `你的-vercel-proxy.vercel.app` | 生产环境 LLM 中转（推荐） |
| request | `api.open-meteo.com` | 实时天气（按授权触发） |
| downloadFile | `i2.chuimg.com` | 200 道本地菜谱封面与步骤图 |
| downloadFile | `images.unsplash.com` | 关键词池兜底（仅未命中精确映射时） |
| uploadFile | `你的-vercel-proxy.vercel.app` | 图片识别上传（如接入 OCR） |

> 开发阶段可在微信开发者工具勾选「不校验合法域名」临时绕过。
> 当前 `project.config.json` 已将 `urlCheck` 设为 `false`，方便本地预览真实菜谱图；上线前仍必须在微信公众平台配置上述合法域名。

---

## 设计原则（对开发者）

1. **Token first**：所有色值 / 圆角 / 字号 / 阴影 **必须** 走 `D.*`；发现硬编码先问是否该进 Token。
2. **不道歉**：UI 文案从用户视角出发，不写「配图多为氛围参考」「后续接入」这类自述。
3. **诚实胜于花哨**：天气、定位、OCR 这类不稳定的能力，默认关闭；用户主动触发后给反馈。
4. **骨架屏 > loading spinner**：有结构化结果的页面用 `SkeletonRecipeList` 等，别让用户盯转圈。
5. **时间戳 > setInterval 累加**：涉及倒计时的地方全部基于 `Date.now()` + `expireAt`，后台挂起恢复后依然准确。

---

## 文档

- 产品需求摘要见仓库内 `Love-Kitchen-产品需求汇总-v1.1.md`
- 技术与产品审计见 `docs/Love-Kitchen-技术与产品审计报告.md`

---

## License

MIT
