/**
 * 统一 API 层：场景 + 就餐人数 + 单一 JSON 协议
 * LLM：MiniMax OpenAI 兼容接口（默认模型 MiniMax-M2.7）
 * 国内接入点见官方文档：https://platform.minimaxi.com/docs/guides/text-ai-coding-tools
 */
import Taro from '@tarojs/taro'
import type { Recipe, SceneType } from '../types/recipe'
import { enrichRecipeMedia } from '../utils/enrichRecipeMedia'
import { parseLlmRecipeArray } from '../schemas/recipeLlm'
import { filterRecipesByUserIngredients } from '../utils/recipeIngredientFilter'
import { STORAGE_KEYS } from '../store/storageKeys'
import { getDefaultDinersCount } from '../store/userPreferences'

/** OpenAI 兼容 Base URL（中国大陆：api.minimaxi.com，勿使用 api.minimax.io） */
const API_BASE_URL = 'https://api.minimaxi.com/v1'
const DEFAULT_MODEL = 'MiniMax-M2.7'

export function getStoredScene(): SceneType {
  const s = Taro.getStorageSync(STORAGE_KEYS.recipeScene) as SceneType | ''
  if (s === 'runner' || s === 'quick' || s === 'muscle' || s === 'normal') return s
  return 'normal'
}

export function setStoredScene(scene: SceneType): void {
  Taro.setStorageSync(STORAGE_KEYS.recipeScene, scene)
}

function getDiners(): number {
  return getDefaultDinersCount()
}

export enum APIErrorType {
  NO_API_KEY = 'NO_API_KEY',
  INVALID_KEY = 'INVALID_KEY',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export class APIError extends Error {
  constructor(
    message: string,
    public type: APIErrorType = APIErrorType.UNKNOWN,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'APIError'
  }
}

interface RequestConfig {
  retry?: number
  timeout?: number
}

export interface FetchRecipesOptions extends RequestConfig {
  scene?: SceneType
  /** 不传则从本地 defaultDinersCount 读取 */
  diners?: number
  /** 更严格的食材绑定（默认已在 prompt + 校验中强制执行） */
  strictIngredients?: boolean
}

const DEFAULT_RETRY = 2
const DEFAULT_TIMEOUT_MS = 60000
const DEFAULT_CONFIG: RequestConfig = { retry: DEFAULT_RETRY, timeout: DEFAULT_TIMEOUT_MS }

function proxyUrl(): string {
  if (typeof TARO_APP_LLM_PROXY_URL !== 'string') return ''
  return TARO_APP_LLM_PROXY_URL.trim()
}

function taroFailMessage(e: unknown): string {
  const err = e as { errMsg?: string; message?: string }
  return String(err?.errMsg || err?.message || '').trim()
}

function isWeappLocalRequestBlocked(msg: string): boolean {
  return /url not in domain list|合法域名|网络错误|request:fail|ERR_CONNECTION|timeout/i.test(msg)
}

/** 已配置构建期 LLM 中转 URL（生产环境应优先使用，避免 Key 进包） */
export function usesLlmProxy(): boolean {
  return proxyUrl().length > 0
}

async function llmChatCompletions(
  body: Record<string, unknown>,
  timeout: number
): Promise<{ statusCode: number; data: unknown }> {
  const p = proxyUrl()
  if (!p) {
    throw new APIError(
      '智能推荐服务未就绪，请稍后再试',
      APIErrorType.NO_API_KEY
    )
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const response = await Taro.request({
    url: p,
    method: 'POST',
    header: headers,
    data: body,
    timeout,
  })
  return { statusCode: response.statusCode ?? 0, data: response.data }
}

function normalizeDifficulty(d?: string): Recipe['difficulty'] {
  if (d === '简单' || d === '中等' || d === '复杂') return d
  return '中等'
}

const safeParseJSON = (str: string): Recipe | Recipe[] | null => {
  try {
    const match = str.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
    if (match) return JSON.parse(match[0])
    return JSON.parse(str)
  } catch { return null }
}

const parseError = (statusCode?: number, message?: string): APIError => {
  if (!statusCode) {
    return new APIError('网络连接失败，请检查网络', APIErrorType.NETWORK_ERROR)
  }
  if (statusCode === 401 || statusCode === 403) {
    return new APIError('API Key 无效，请检查设置', APIErrorType.INVALID_KEY, statusCode)
  }
  if (statusCode === 429) {
    return new APIError('请求太频繁，请稍后再试', APIErrorType.RATE_LIMIT, statusCode)
  }
  if (message?.includes('timeout')) {
    return new APIError('请求超时，请重试', APIErrorType.TIMEOUT, statusCode)
  }
  return new APIError(message || `请求失败 (${statusCode})`, APIErrorType.UNKNOWN, statusCode)
}

const requestWithRetry = async <T>(fn: () => Promise<T>, retries: number = 2): Promise<T> => {
  let lastError: Error | null = null
  for (let i = 0; i <= retries; i++) {
    try { return await fn() }
    catch (e: any) {
      lastError = e as Error
      if (e instanceof APIError && (e.type === APIErrorType.INVALID_KEY || e.type === APIErrorType.NO_API_KEY)) {
        throw e
      }
      if (i < retries) await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw lastError
}

/**
 * 步骤内容格式要求（强制）：
 * - 每步 content 30~60 字，包含具体动作、火候、时间信息
 * - 举例："中火热锅后倒入 2 勺油，油温七成热时放入姜蒜末，翻炒约 30 秒至金黄出香。"
 * - tip 字段（可选）：补充关键技巧或避坑提示，10~30 字
 */
const STEP_FORMAT_RULE = `每个步骤的写法规范（必须严格遵守）：
- content：30~60 字，包含「动作 + 火候（大火/中火/小火）+ 器具（锅/平底锅/砂锅等）+ 时间或状态判断」，例如："中火热锅，倒入 2 勺食用油，油温七成热（微微冒烟）时放入姜蒜末，持续翻炒约 30 秒至金黄出香。"
- time：该步骤所需分钟数（整数）
- tip（可选）：关键技巧或避坑提示，10~30 字，例如："锅要够热，蔬菜才不会出水变烂。"`

const JSON_SCHEMA = `必须返回纯 JSON 数组，不要 Markdown、不要解释文字。结构示例：
[{ "title": "菜名", "quote": "一句话历史或文化点评（30字以内）", "rating": 4.8, "count": 1024, "emoji": "🥘", "ingredients": [{"name": "食材1", "amount": "具体用量（含单位，如 200g/3勺/1个）"}], "steps": [{"content": "详细步骤文字", "time": 5, "tip": "可选技巧"}], "nutritionAnalysis": "营养要点（30~50字）", "time": 20, "difficulty": "简单" }]
不要在 JSON 中加 image 字段（客户端已有智能配图）。`

/** 按用户现有食材生成时：主料必须来自用户清单，禁止「瞎编菜」 */
const INGREDIENT_BINDING_RULE = `【硬性约束 — 必须遵守】
1. 用户列出的每一种食材，至少要在其中 1 道菜的 ingredients 里作为主材出现（可写同义词，如 番茄/西红柿）。
2. 禁止推荐与用户食材无关的菜：例如用户只有「番茄、鸡蛋」时，不得返回「红烧肉」「可乐鸡翅」等未使用这些食材的菜。
3. 除用户已有食材外，仅可补充常见调料（油、盐、糖、酱油、葱、姜、蒜、料酒、淀粉、醋等），不得凭空加入用户未提供的主材（如用户没给猪肉，就不能做回锅肉）。
4. 每道菜的 title 与 steps 必须围绕上述食材展开，步骤里要真的用到这些食材。`

const INGREDIENT_BINDING_STRICT = `${INGREDIENT_BINDING_RULE}
5. 若食材较少，可做「XX炒YY」「XX汤」「XX拌YY」等简单组合，但仍须全部用到用户食材中的主料。`

const SCENE_BLOCKS: Record<SceneType, string> = {
  normal: `你是专业中餐与家庭营养主厨，擅长将菜谱写得既家常又专业。
要求：营养均衡、做法家常、用料贴近中国家庭厨房；步骤细节要足够帮助零基础厨房新手成功。`,
  runner: `你是专业运动营养主厨，了解运动后身体需求。
用户可能刚做完运动，需要一餐家常、易消化、能补充能量与蛋白质的加餐。
要求：做法务实、调料常见；步骤描述详细，像给家人做饭一样自然。`,
  quick: `你是专业快手菜主厨，擅长用最少时间做出最美味的家常菜。
用户时间紧张，需要快手菜。
要求：总耗时尽量控制在 15 分钟内、步骤不超过 5 步、调料常见；步骤要简洁高效。`,
  muscle: `你是专业高蛋白饮食主厨，了解健康饮食需求。
用户想吃得更高蛋白，但仍然是家常饮食场景。
要求：高蛋白、烹饪方式简单（蒸/煮/快炒为主），口味自然，每份用量说明合理。`,
}

const SCENE_USER_TAIL: Record<SceneType, string> = {
  normal: '请推荐家常菜。',
  runner: '请推荐适合运动后加餐的家常菜。',
  quick: '请推荐快手菜。',
  muscle: '请推荐高蛋白家常菜。',
}

const DEFAULT_TAGS: Record<SceneType, string[]> = {
  normal: ['家常'],
  runner: ['运动加餐'],
  quick: ['快手'],
  muscle: ['高蛋白'],
}

export const fetchRecipes = async (
  ingredients: string[],
  count: number = 3,
  config?: FetchRecipesOptions
): Promise<Recipe[]> => {
  if (!usesLlmProxy()) {
    throw new APIError(
      '智能推荐服务未就绪',
      APIErrorType.NO_API_KEY
    )
  }

  const scene: SceneType = config?.scene ?? getStoredScene()
  const diners = config?.diners ?? getDiners()
  const strict = config?.strictIngredients ?? false

  const userContent = `食材（用户现有，必须全部用上或作为主材）：${ingredients.join('、')}。
就餐人数：${diners} 人（请按人数调整用料用量描述）。
${SCENE_USER_TAIL[scene]}
请推荐 ${count} 道菜。每道菜必须以上述食材为主，不得偏离。`

  const runOnce = async (bindingRule: string, temperature: number) => {
    const { statusCode, data: rawData } = await llmChatCompletions(
      {
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `${SCENE_BLOCKS[scene]}

${bindingRule}

${STEP_FORMAT_RULE}

${JSON_SCHEMA}
共返回 ${count} 道菜；每道菜的 ingredients 与 steps 必须完整、可执行。steps 至少 4 步，每步必须符合上述格式规范。`,
          },
          { role: 'user', content: userContent },
        ],
        temperature,
        max_tokens: 4000,
      },
      config?.timeout ?? DEFAULT_TIMEOUT_MS
    )

    if (statusCode !== 200) {
      const d = rawData as Record<string, unknown> | undefined
      const errObj = d?.error as { message?: string } | undefined
      const msg =
        errObj?.message ||
        (typeof d?.message === 'string' ? d.message : undefined) ||
        (typeof d?.msg === 'string' ? d.msg : undefined)
      throw parseError(statusCode, msg)
    }

    const dataObj = rawData as { choices?: { message?: { content?: string } }[] }
    const content = dataObj?.choices?.[0]?.message?.content
    if (!content || typeof content !== 'string') {
      throw new APIError('AI 返回为空', APIErrorType.PARSE_ERROR)
    }

    const parsedJson = safeParseJSON(content)
    if (!parsedJson) {
      throw new APIError('无法解析 AI 返回的 JSON', APIErrorType.PARSE_ERROR)
    }

    const validated = parseLlmRecipeArray(Array.isArray(parsedJson) ? parsedJson : [parsedJson])
    if (validated.length === 0) {
      throw new APIError('菜谱数据未通过校验（模型返回格式异常）', APIErrorType.PARSE_ERROR)
    }

    const tags = DEFAULT_TAGS[scene]
    const batchId = Date.now()
    const mapped = validated.map((r, idx) => {
      const stableId =
        r.id != null && String(r.id).trim() !== ''
          ? String(r.id)
          : `ai-${batchId}-${idx}-${Math.random().toString(36).slice(2, 8)}`
      return enrichRecipeMedia({
        ...r,
        id: stableId,
        isFavorite: false,
        source: 'ai' as const,
        time: r.time ?? 20,
        difficulty: normalizeDifficulty(r.difficulty),
        tags: r.tags?.length ? r.tags : tags,
        steps: r.steps,
      })
    })

    return filterRecipesByUserIngredients(mapped, ingredients)
  }

  return requestWithRetry(async () => {
    let filtered = await runOnce(
      strict ? INGREDIENT_BINDING_STRICT : INGREDIENT_BINDING_RULE,
      strict ? 0.35 : 0.45
    )
    if (filtered.length === 0) {
      filtered = await runOnce(INGREDIENT_BINDING_STRICT, 0.3)
    }
    if (filtered.length === 0) {
      throw new APIError(
        'AI 推荐的菜与所选食材不符，请调整食材后重试',
        APIErrorType.PARSE_ERROR
      )
    }
    return filtered.slice(0, count)
  }, config?.retry ?? DEFAULT_RETRY)
}

export const checkApiKey = async (): Promise<{ valid: boolean; error?: string }> => {
  if (!usesLlmProxy()) {
    return { valid: false, error: '智能推荐服务未就绪' }
  }
  try {
    const { statusCode, data } = await llmChatCompletions(
      { model: DEFAULT_MODEL, messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
      15000
    )
    if (statusCode === 200) return { valid: true }
    if (statusCode === 401 || statusCode === 403) {
      return { valid: false, error: '中转或上游鉴权失败' }
    }
    const d = data as Record<string, unknown> | undefined
    const errObj = d?.error as { message?: string } | undefined
    const hint = errObj?.message || (typeof d?.message === 'string' ? d.message : '')
    return { valid: false, error: hint ? `${statusCode}: ${hint}` : `错误: ${statusCode}` }
  } catch (e: unknown) {
    const raw = taroFailMessage(e)
    if (!raw || isWeappLocalRequestBlocked(raw)) {
      return {
        valid: false,
        error:
          '开发者工具拦截了本地 AI 地址。请打开：详情 → 本地设置 → 勾选「不校验合法域名、web-view、TLS 以及 HTTPS 证书」，然后重新编译。真机预览无法访问本机 127.0.0.1。',
      }
    }
    return { valid: false, error: raw }
  }
}

/** 兼容旧调用：单场景单道，内部走统一 fetchRecipes */
export const fetchRecipesByScene = async (
  ingredients: string[],
  scene: SceneType = 'normal',
  config?: FetchRecipesOptions
): Promise<Recipe[]> => {
  return fetchRecipes(ingredients, 1, { ...config, scene })
}

/** 库中搜不到某道菜时：按菜名请 AI 生成完整菜谱（1 道） */
export const fetchRecipeByDishName = async (
  dishName: string,
  config?: FetchRecipesOptions
): Promise<Recipe[]> => {
  if (!usesLlmProxy()) {
    throw new APIError(
      '智能推荐服务未就绪',
      APIErrorType.NO_API_KEY
    )
  }

  const scene: SceneType = config?.scene ?? getStoredScene()
  const diners = config?.diners ?? getDiners()
  const name = dishName.trim()
  if (!name) {
    throw new APIError('菜名不能为空', APIErrorType.PARSE_ERROR)
  }

  const systemPrompt = `${SCENE_BLOCKS[scene]}

${STEP_FORMAT_RULE}

${JSON_SCHEMA}
只返回 1 道菜；菜名必须为「${name}」或非常接近的家常叫法；ingredients 与 steps 必须完整可执行。`

  const userContent = `请给出「${name}」的完整家常菜谱（1 道）。
就餐人数：${diners} 人。
${SCENE_USER_TAIL[scene]}`

  return requestWithRetry(async () => {
    const { statusCode, data: rawData } = await llmChatCompletions(
      {
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      },
      config?.timeout ?? DEFAULT_TIMEOUT_MS
    )

    if (statusCode !== 200) {
      const d = rawData as Record<string, unknown> | undefined
      const errObj = d?.error as { message?: string } | undefined
      const msg =
        errObj?.message ||
        (typeof d?.message === 'string' ? d.message : undefined) ||
        (typeof d?.msg === 'string' ? d.msg : undefined)
      throw parseError(statusCode, msg)
    }

    const dataObj = rawData as { choices?: { message?: { content?: string } }[] }
    const content = dataObj?.choices?.[0]?.message?.content
    if (!content || typeof content !== 'string') {
      throw new APIError('AI 返回为空', APIErrorType.PARSE_ERROR)
    }

    const parsedJson = safeParseJSON(content)
    if (!parsedJson) {
      throw new APIError('无法解析 AI 返回的 JSON', APIErrorType.PARSE_ERROR)
    }

    const validated = parseLlmRecipeArray(Array.isArray(parsedJson) ? parsedJson : [parsedJson])
    if (validated.length === 0) {
      throw new APIError('菜谱数据未通过校验', APIErrorType.PARSE_ERROR)
    }

    const batchId = Date.now()
    return validated.slice(0, 1).map((r, idx) => {
      const stableId = `ai-${batchId}-${idx}`
      return enrichRecipeMedia({
        ...r,
        id: stableId,
        title: r.title?.trim() || name,
        isFavorite: false,
        source: 'ai' as const,
        time: r.time ?? 25,
        difficulty: normalizeDifficulty(r.difficulty),
        tags: r.tags?.length ? r.tags : ['AI生成', ...(DEFAULT_TAGS[scene] || [])],
        steps: r.steps,
      })
    })
  }, config?.retry ?? DEFAULT_RETRY)
}
