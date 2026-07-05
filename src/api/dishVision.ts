/**
 * 拍菜识别：一张「做好的菜」照片 → 2~3 个候选菜名（按可能性排序）
 *
 * 为什么是候选而不是单一答案：做好的菜在视觉上天生多对多（红烧肉/东坡肉/把子肉
 * 几乎同形；同一道菜不同人做又千差万别）。给候选 + 用户一点，比硬猜一个更准、体验更好。
 * 选中后由首页 doSearch 接管：库里有→进真图菜谱；库里没有→AI 生成兜底。
 */
import Taro from '@tarojs/taro'
import { readImageAsDataUrl } from '../utils/imageBase64'
import { usesLlmProxy } from './recipe'

const MODEL = 'MiniMax-M2.7'
const TIMEOUT_MS = 90000

export interface DishCandidate {
  /** 中文家常菜名，可直接拿去搜菜谱 */
  name: string
  /** 一句话区分依据（颜色/主料/形态），帮用户选对 */
  note: string
  /** 0~1 置信度，用于排序与展示 */
  confidence: number
}

export class DishVisionError extends Error {
  constructor(
    message: string,
    public code: 'NO_PROXY' | 'NETWORK' | 'PARSE' | 'EMPTY' | 'NOT_FOOD' = 'PARSE'
  ) {
    super(message)
    this.name = 'DishVisionError'
  }
}

const PROMPT = `你是中餐识菜助手。看图判断这是「哪道做好的菜」，给出最可能的 2~3 个候选菜名。
只返回 JSON，格式：{"isFood":true,"candidates":[{"name":"菜名","note":"区分依据","confidence":0.0}]}
规则：
1. name 用中文家常叫法（如「红烧肉」「番茄炒蛋」），不要写「一盘肉」这种泛称；
2. 按可能性从高到低排序，最多 3 个，confidence 为 0~1 小数；
3. note 用一句话写区分依据（颜色/主料/形态），帮用户分辨相似菜；
4. 若图中明显不是食物或无法判断，返回 {"isFood":false,"candidates":[]}；
5. 只输出 JSON，不要 Markdown、不要解释。`

function proxyUrl(): string {
  if (typeof TARO_APP_LLM_PROXY_URL !== 'string') return ''
  return TARO_APP_LLM_PROXY_URL.trim()
}

function extractJson(text: string): unknown {
  const match = text.match(/(\{[\s\S]*\})/)
  if (!match) return null
  try {
    return JSON.parse(match[1])
  } catch {
    return null
  }
}

function clampConfidence(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return 0.5
  return Math.max(0, Math.min(1, n))
}

function parseCandidates(raw: unknown): { isFood: boolean; candidates: DishCandidate[] } {
  if (!raw || typeof raw !== 'object') return { isFood: true, candidates: [] }
  const obj = raw as { isFood?: unknown; candidates?: unknown }
  const isFood = obj.isFood !== false
  const list = Array.isArray(obj.candidates) ? obj.candidates : []
  const candidates: DishCandidate[] = []
  for (const it of list) {
    if (!it || typeof it !== 'object') continue
    const c = it as { name?: unknown; note?: unknown; confidence?: unknown }
    const name = typeof c.name === 'string' ? c.name.trim() : ''
    if (!name) continue
    candidates.push({
      name,
      note: typeof c.note === 'string' ? c.note.trim() : '',
      confidence: clampConfidence(c.confidence),
    })
    if (candidates.length >= 3) break
  }
  candidates.sort((a, b) => b.confidence - a.confidence)
  return { isFood, candidates }
}

/** 识别一张菜品照片，返回 2~3 个候选菜名 */
export async function recognizeDishCandidates(filePath: string): Promise<DishCandidate[]> {
  if (!usesLlmProxy()) {
    throw new DishVisionError('智能识菜服务未就绪，请稍后再试', 'NO_PROXY')
  }

  const dataUrl = readImageAsDataUrl(filePath)
  const p = proxyUrl()

  let statusCode = 0
  let data: unknown = null
  try {
    const res = await Taro.request({
      url: p,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      timeout: TIMEOUT_MS,
      data: {
        model: MODEL,
        temperature: 0.3,
        max_tokens: 600,
        messages: [
          { role: 'system', content: PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: '这是哪道菜？给出 2~3 个候选。' },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
      },
    })
    statusCode = res.statusCode ?? 0
    data = res.data
  } catch {
    throw new DishVisionError('网络异常，请稍后再试', 'NETWORK')
  }

  if (statusCode !== 200) {
    throw new DishVisionError(`识别服务异常 (${statusCode})`, 'NETWORK')
  }

  const content = (data as { choices?: { message?: { content?: string } }[] })
    ?.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    throw new DishVisionError('AI 未返回有效内容', 'PARSE')
  }

  const { isFood, candidates } = parseCandidates(extractJson(content))
  if (!isFood) {
    throw new DishVisionError('这张照片好像不是菜，换一张菜品照片试试', 'NOT_FOOD')
  }
  if (candidates.length === 0) {
    throw new DishVisionError('没认出来，换个角度或更清晰的照片再拍一张', 'EMPTY')
  }
  return candidates
}
