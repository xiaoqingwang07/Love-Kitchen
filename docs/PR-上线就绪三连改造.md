# 上线就绪三连改造：包体积 / 临期召回 / 拍照识别

一次性解决上线前的体积硬卡点，补齐留存召回闭环，并修正拍照识别的体验真相。全程 `tsc --noEmit` 0 报错，对外 API 零破坏。

---

## P1 · catalog 改云端加载，主包体积从 ~20MB 降到 832KB

**问题**：5000 道 catalog 以 JSON `require()` 进分包，约 19MB，顶着微信 20MB 总包上限，且 3.2MB 索引在启动时 `JSON.parse` 卡主线程。

**改法**：catalog 改为云端按需拉取 + 本地文件缓存，主包只保留 legacy 200 道。

- `src/data/catalogLoader.ts` 重写：`Taro.request` 拉 `meta/index/chunk`，写入 `USER_DATA_PATH/catalog`；首启走网络，之后命中缓存（秒开、可离线），后台按 `meta.version` 静默刷新；CDN 未配或断网时回退主包 200 道。**对外导出签名不变**，`recipes.ts` / `recipeRegistry.ts` / 页面零改动。
- 删除分包：`packageCatalogA/B`、`catalogBridge.ts`、stub 页、subpkgLoader、`app.config.ts` 的 `subPackages` 与 `preloadRule`。
- catalog 数据整理进 `catalog-cdn/`（5000 索引 + chunk0–9，已校验一致），待上传 CDN / 微信云托管。
- 新增构建变量 `TARO_APP_CATALOG_BASE_URL`（config/index.js + env.d.ts）。

**部署动作**：上传 `catalog-cdn/` → 配 `TARO_APP_CATALOG_BASE_URL` → 域名加入 request 白名单。未配置则用内置 200 道照常运行。

## P2 · 临期提醒召回（微信订阅消息）

**目标**：食材将过期时微信推送召回——小程序最强留存钩子。

**客户端**（已集成可用）：
- `src/utils/subscribeReminder.ts`：用户点击触发 `requestSubscribeMessage` 授权 → `wx.login` 换 code → 把 3 天内将到期食材 POST 登记。含授权计数、12h 节流、配置缺失优雅降级。
- 「我的 · 偏好」新增临期提醒开关；profile 展示时按节流静默同步到期清单。

**服务端**（参考实现，需配凭证）：
- `api/reminder-register.js`：code→openid，存推送计划。
- `api/reminder-cron.js`：每天 09:00（北京）扫描，对 1–2 天内到期食材发订阅消息；一次性授权发完即清理，拒收用户自动剔除。
- `lib/reminder/wx.js`（jscode2session + access_token 带 KV 缓存 + send）、`lib/reminder/store.js`（Upstash Redis REST）。
- `vercel.json` 增加 functions + crons。

**部署动作**：申请订阅模板 → 配 `TARO_APP_EXPIRY_TMPL_ID` / `TARO_APP_REMINDER_API_URL` / `WX_APPID` / `WX_SECRET` / `UPSTASH_*` / `CRON_SECRET` → 按模板字段名改 `buildTemplateData`。

## P3 · 拍照/相册识别：修正体验真相

**澄清**：相册/拍照的 OCR 食材识别**此前已完整实现并可端到端跑通**（`api/pantryVision.ts` 真调 MiniMax 视觉，跨页 draft 交接 + 冰箱页自动识别 + 预览 + 入库）。本次只修体验：

- 首页拍照/相册反馈改为 AI 感知：已配 AI 提示「识别中，去冰箱看看」，未配则「已采集，去冰箱核对」。
- 删除入口点击时多余的预 toast。

**已知缺口**：语音入口仍是「录音→边听边写」，无真正 ASR，需另接语音识别（后续 PR）。

---

## 验证与边界

- `tsc --noEmit`：本次顺带修复了此前 9 个类型错误（含 subpkgLoader 路径 off-by-one、ErrorBoundary children、Set 迭代），现 **0 报错**，类型检查恢复为可用的 CI 关卡。
- 沙箱无法验证：真机包体积、微信订阅推送、视觉识别均依赖真机 + 凭证；本次保证代码正确、类型干净、逻辑自洽。
- 建议把 `npx tsc --noEmit` 加入上线前 checklist。

## 改动规模

40 文件，+889 / −274。catalog 文件为 git rename，历史保留。
