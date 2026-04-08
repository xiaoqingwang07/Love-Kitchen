/**
 * 统一 API 层：场景 + 就餐人数 + 单一 JSON 协议
 * LLM：MiniMax OpenAI 兼容接口（默认模型 MiniMax-M2.7）
 * 国内接入点见官方文档：https://platform.minimaxi.com/docs/guides/text-ai-coding-tools
 */
import Taro from '@tarojs/taro'
import type { Recipe, SceneType } from '../types/recipe'
import { enrichRecipeMedia } from '../utils/enrichRecipeMedia'
import { parseLlmRecipeArray } from '../schemas/recipeLlm'
import { STORAGE_KEYS } from '../store/storageKeys'

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
  const n = Number(Taro.getStorageSync(STORAGE_KEYS.defaultDinersCount))
  if (Number.isFinite(n) && n >= 1 && n <= 10) return n
  return 2
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
}

const DEFAULT_RETRY = 2
const DEFAULT_TIMEOUT_MS = 60000
const DEFAULT_CONFIG: RequestConfig = { retry: DEFAULT_RETRY, timeout: DEFAULT_TIMEOUT_MS }

function proxyUrl(): string {
  if (typeof TARO_APP_LLM_PROXY_URL !== 'string') return ''
  return TARO_APP_LLM_PROXY_URL.trim()
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
      '请配置服务端 LLM 中转（.env.local 中 TARO_APP_LLM_PROXY_URL）',
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

const JSON_SCHEMA = `必须返回纯 JSON 数组，不要 Markdown、不要解释文字。结构示例：
[{ "title": "菜名", "quote": "一句话点评", "rating": 4.8, "count": 1024, "emoji": "🥘", "image": "可选 HTTPS 成品图 URL", "ingredients": [{"name": "食材1", "amount": "用量"}], "steps": [{"content": "步骤1", "time": 10, "tip": "可选", "image": "可选 HTTPS 步骤图 URL"}], "nutritionAnalysis": "营养要点", "time": 20, "difficulty": "简单" }]
image 与 steps[].image 可省略；省略时客户端会用图库兜底。`

const SCENE_BLOCKS: Record<SceneType, string> = {
  normal: `你是专业中餐与家庭营养主厨。
要求：营养均衡、做法家常、用料贴近中国家庭厨房。`,
  runner: `用户可能刚做完运动，需要一餐家常、易消化、能补充能量与蛋白质的加餐。
要求：做法务实、调料常见；不必强调极限运动或专业数据，像给家人做饭一样自然。`,
  quick: `用户时间紧张，需要快手菜。
要求：总耗时尽量控制在 15 分钟内、步骤不超过 5 步、调料常见。`,
  muscle: `用户想吃得更高蛋白，但仍然是家常饮食场景。
要求：高蛋白、烹饪方式简单（蒸/煮/快炒为主），口味自然，份量说明要合理。`,
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
      '请配置 LLM 中转：填写 TARO_APP_LLM_PROXY_URL',
      APIErrorType.NO_API_KEY
    )
  }

  const scene: SceneType = config?.scene ?? getStoredScene()
  const diners = config?.diners ?? getDiners()

  const systemPrompt = `${SCENE_BLOCKS[scene]}

${JSON_SCHEMA}
共返回 ${count} 道菜；每道菜的 ingredients 与 steps 必须完整、可执行。`

  const userContent = `食材（用户现有）：${ingredients.join('、')}。
就餐人数：${diners} 人（请按人数调整用料用量描述）。
${SCENE_USER_TAIL[scene]}
请推荐 ${count} 道菜。`

  return requestWithRetry(async () => {
    const { statusCode, data: rawData } = await llmChatCompletions(
      {
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.75,
        max_tokens: 2800,
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
    return validated.map((r, idx) => {
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
  }, config?.retry ?? DEFAULT_RETRY)
}

export const checkApiKey = async (): Promise<{ valid: boolean; error?: string }> => {
  if (!usesLlmProxy()) {
    return { valid: false, error: '请配置 TARO_APP_LLM_PROXY_URL' }
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
  } catch (e: any) {
    return { valid: false, error: e.message || '网络错误' }
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
