import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const root = process.cwd()
const errors = []
const warnings = []

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'))
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel))
}

function fail(msg) {
  errors.push(msg)
}

function warn(msg) {
  warnings.push(msg)
}

const packageJson = readJson('package.json')
const projectConfig = readJson('project.config.json')
const appConfig = fs.readFileSync(path.join(root, 'src/app.config.ts'), 'utf8')
const npmrc = exists('.npmrc') ? fs.readFileSync(path.join(root, '.npmrc'), 'utf8') : ''

for (const script of ['typecheck', 'test:regression', 'check:release', 'build:weapp', 'audit:catalog']) {
  if (!packageJson.scripts?.[script]) fail(`package.json 缺少 scripts.${script}`)
}

for (const icon of [
  'home.png',
  'home_active.png',
  'pick.png',
  'pick_active.png',
  'pantry.png',
  'pantry_active.png',
  'profile.png',
  'profile_active.png',
]) {
  if (!exists(`src/assets/tabbar/${icon}`)) fail(`缺少 tabbar 图标：src/assets/tabbar/${icon}`)
}

if (!appConfig.includes("plugins:") || !appConfig.includes("WechatSI")) {
  warn('未启用 WechatSI 插件（默认关闭，避免未授权导致模拟器无法启动）；语音 ASR 将降级。上线前在公众平台添加插件并设 TARO_APP_ENABLE_WECHAT_SI=true')
}

const setting = projectConfig.setting || {}
if (setting.urlCheck !== true) fail('project.config.json: setting.urlCheck 应为 true，避免上传前漏配合法域名')
if (setting.minified !== true) fail('project.config.json: setting.minified 应为 true')
if (setting.uploadWithSourceMap !== false) fail('project.config.json: setting.uploadWithSourceMap 应为 false')

if (!npmrc.includes('registry=https://registry.npmjs.org/')) {
  fail('.npmrc 应固定 registry=https://registry.npmjs.org/，避免 lockfile 中 npmmirror tarball 403')
}
if (!npmrc.includes('replace-registry-host=always')) {
  fail('.npmrc 应设置 replace-registry-host=always')
}

if (!exists('catalog-cdn/meta.json')) {
  warn('未检测到 catalog-cdn/meta.json；如需 5000 道菜，请确认 CDN 已部署 catalog-cdn')
} else {
  const meta = readJson('catalog-cdn/meta.json')
  if (!meta.count || meta.count < 200) warn('catalog-cdn/meta.json 的 count 看起来偏小')
}

if (exists('.env.local')) {
  const env = fs.readFileSync(path.join(root, '.env.local'), 'utf8')
  if (/TARO_APP_MINIMAX_API_KEY/.test(env)) {
    fail('.env.local 不应放入 TARO_APP_MINIMAX_API_KEY；生产客户端只能配置 TARO_APP_LLM_PROXY_URL')
  }
  if (/^MINIMAX_API_KEY=/m.test(env)) {
    warn('.env.local 检测到 MINIMAX_API_KEY；本地代理可用，生产请只在服务端环境变量配置')
  }
  if (!/TARO_APP_LLM_PROXY_URL=https?:\/\//.test(env)) {
    warn('.env.local 未检测到 TARO_APP_LLM_PROXY_URL，AI 功能会走本地兜底')
  }
  if (!/TARO_APP_CATALOG_BASE_URL=https?:\/\//.test(env)) {
    warn('.env.local 未检测到 TARO_APP_CATALOG_BASE_URL，将只使用内置菜谱库')
  }
} else {
  warn('未检测到 .env.local；请在发布机确认 TARO_APP_LLM_PROXY_URL / TARO_APP_CATALOG_BASE_URL 等构建变量')
}

const indexPage = exists('src/pages/index/index.tsx') ? fs.readFileSync(path.join(root, 'src/pages/index/index.tsx'), 'utf8') : ''
if (!indexPage.includes('拍小票建冰箱')) {
  warn('首页空冰箱引导应包含「拍小票建冰箱」主动作')
}
if (!appConfig.includes("text: '今晚'")) {
  warn('tabBar 选菜页应改名为「今晚」')
}

if (exists('catalog-cdn/index.json')) {
  try {
    const raw = execSync('node scripts/audit-catalog-quality.mjs --json', { cwd: root, stdio: 'pipe' }).toString()
    const report = JSON.parse(raw)
    if (report.displayTitleIssueRate > 0.05) {
      errors.push(`catalog 展示标题异常率 ${(report.displayTitleIssueRate * 100).toFixed(1)}% > 5%`)
    }
    if (report.ingredientIssueRate > 0.01) {
      errors.push(`catalog 食材异常率 ${(report.ingredientIssueRate * 100).toFixed(1)}% > 1%`)
    }
    if (report.timeIssueRate > 0.01) {
      errors.push(`catalog 耗时异常率 ${(report.timeIssueRate * 100).toFixed(1)}% > 1%`)
    }
  } catch (e) {
    if (e.status === 1) throw e
    warn('catalog 质量审计未通过或脚本执行失败，请运行 npm run audit:catalog')
  }
}

for (const msg of warnings) console.warn(`WARN ${msg}`)
for (const msg of errors) console.error(`FAIL ${msg}`)

if (errors.length > 0) {
  console.error(`\nRelease readiness failed: ${errors.length} error(s), ${warnings.length} warning(s).`)
  process.exit(1)
}

console.log(`Release readiness passed: ${warnings.length} warning(s).`)
