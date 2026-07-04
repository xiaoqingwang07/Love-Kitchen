import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
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

expect(
  'PantryStore autorun 应观察条目字段，避免编辑/移动不落盘',
  /this\.items\.map\(\(item\) => \(\{[\s\S]*expiresAt[\s\S]*slotIndex[\s\S]*\}\)\)/.test(pantryStore)
)

expect(
  '冰箱入库预览应使用 IntakePreviewRow，确保 duplicateOf 类型存在',
  pantryPage.includes('type IntakePreviewRow') && pantryPage.includes('useState<IntakePreviewRow[] | null>')
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

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`)
  console.error(`\nRegression checks failed: ${failures.length}`)
  process.exit(1)
}

console.log('Regression checks passed.')
