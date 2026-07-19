# AGENTS.md

## Cursor Cloud specific instructions

爱心厨房 (Love Kitchen) 是一个基于 **Taro 3 + React + TypeScript + MobX** 的微信小程序（单一应用，非 monorepo）。主要目标平台是微信小程序（weapp）；标准命令见 `package.json` 的 `scripts` 与 `README.md`（快速开始 / 生产部署章节）。

### 如何运行与预览（重要）
- 微信开发者工具无法在无头 Linux VM 中运行，因此**无法用 weapp 产物直接预览**。要在浏览器里真正跑起来、做端到端验证，请用 **H5 版**：`npm run dev:h5`，开发服务器监听 `http://localhost:10086/`（Taro 默认端口）。
- weapp 仍是主目标：`npm run dev:weapp`（watch 编译）/ `npm run build:weapp` 能正常编译产物，只是预览需要微信开发者工具。

### Lint / Test / Build
- Lint：项目**未配置 ESLint**，用类型检查代替：`npm run typecheck`（`tsc --noEmit`）。
- Test：`npm run test:regression`（纯 Node 断言脚本，无需服务）。另有 `npm run check:release`、`npm run verify:features`。
- Build：`npm run build:weapp` / `npm run build:h5`（H5 产物输出到 `dist-h5/`，与 weapp 的 `dist/` 分离）。

### 依赖 / 环境变量的非显然点
- `postinstall` 会给 `@swc/register` 打补丁（Node 22+ 下 Taro 3.6 自带的 `@swc/core@1.3.23` 否则报 `unknown field cwd`）并创建 `public/catalog` 符号链接。请**保持 `@swc/core` 固定在 `1.3.23`**，勿升级。
- 构建期变量在 `config/index.js` 里从 `.env.local` 读取并写进 `defineConstants`，因此**改动 `.env.local` 后必须重启 dev/build** 才生效。`.env.local` 已被 gitignore；用 `npm run setup:env` 生成模板。

### 可选后端服务（按需启动，均为后台常驻进程）
- **AI 功能需密钥**：首页食材搜索、拍照识菜（dishVision）、小票/图片入库识别（pantryVision）都走 LLM 代理。需在 `.env.local` 填 `MINIMAX_API_KEY`，再运行 `npm run dev:llm-proxy`（端口 8787）。**未配置密钥时这些 AI 入口会弹错误提示，但 App 其余功能可完全离线使用**（内置 legacy ~200 道本地菜谱）。
- **5000 道 catalog**：`npm run dev:catalog` 把 `catalog-cdn/` 挂到 `http://127.0.0.1:8790`（`.env.local` 的 `TARO_APP_CATALOG_BASE_URL` 指向它）。**不启动也没关系**——catalog 请求失败会静默回退到内置 legacy 菜谱，不阻塞页面。

### 已知的开发期现象（非 bug）
- H5 dev 模式下，当 AI/网络后端未运行时，`react-refresh-webpack-plugin` 会弹出红色错误遮罩（来自未捕获的网络 Promise 拒绝）。**可直接关闭、不阻塞核心流程**：浏览冰箱、离线加食材入库、查看菜谱详情/步骤都能正常完成。
