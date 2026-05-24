/**
 * 冰箱入库视觉识别：购物小票 / 食材照片 → 结构化清单
 */
import Taro from '@tarojs/taro'
import { readImageAsDataUrl } from '../utils/imageBase64'
import { parsePantryVisionJson } from '../schemas/pantryVision'
import { usesLlmProxy } from './recipe'

export type PantryVisionMode = 'receipt' | 'ingredients' | 'auto'

export interface PantryVisionItem {
  name: string
  amount: string
}

export class PantryVisionError extends Error {
  constructor(
    message: string,
    public code: 'NO_PROXY' | 'NETWORK' | 'PARSE' | 'EMPTY' = 'PARSE'
  ) {
    super(message)
    this.name = 'PantryVisionError'
  }
}

const MODEL = 'MiniMax-M2.7'
const TIMEOUT_MS = 90000

function proxyUrl(): string {
  if (typeof TARO_APP_LLM_PROXY_URL !== 'string') return ''
  return TARO_APP_LLM_PROXY_URL.trim()
}

const PROMPTS: Record<PantryVisionMode, string> = {
  receipt: `你是购物小票 OCR 助手。从图片中识别「食材/食品」类商品，忽略塑料袋费、配送费、优惠等非食材行。
只返回 JSON：{"kind":"receipt","items":[{"name":"食材名","amount":"数量或重量"}]}
规则：name 用中文家常叫法；amount 保留小票上的单位（如 500g、1盒）；合并重复项；最多 30 项；不要 Markdown。`,
  ingredients: `你是厨房食材识别助手。识别图中可见的「可入库食材/食品」，忽略厨具、包装外观文字若看不清可估数量。
只返回 JSON：{"kind":"ingredients","items":[{"name":"食材名","amount":"估数量"}]}
规则：name 用中文；看不清数量写「适量」；同种合并；最多 20 项；不要 Markdown。`,
  auto: `你是冰箱入库助手。判断图片是「购物小票」还是「食材/冰箱照片」，并提取可入库的食材清单。
只返回 JSON：{"kind":"receipt或ingredients","items":[{"name":"食材名","amount":"数量"}]}
规则：小票→kind=receipt；散放食材/冰箱内食材→kind=ingredients；name 中文；忽略非食品；不要 Markdown。`,
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

export async function recognizePantryImage(
  filePath: string,
  mode: PantryVisionMode = 'auto'
): Promise<{ kind: 'receipt' | 'ingredients'; items: PantryVisionItem[] }> {
  if (!usesLlmProxy()) {
    throw new PantryVisionError('请配置 AI 服务（TARO_APP_LLM_PROXY_URL）', 'NO_PROXY')
  }

  const dataUrl = readImageAsDataUrl(filePath)
  const p = proxyUrl()

  const { statusCode, data } = await Taro.request({
    url: p,
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    timeout: TIMEOUT_MS,
    data: {
      model: MODEL,
      temperature: 0.2,
      max_tokens: 2500,
      messages: [
        { role: 'system', content: PROMPTS[mode] },
        {
          role: 'user',
          content: [
            { type: 'text', text: '请识别图片中的食材并返回 JSON。' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    },
  })

  if (statusCode !== 200) {
    throw new PantryVisionError(`识别服务异常 (${statusCode})`, 'NETWORK')
  }

  const dataObj = data as { choices?: { message?: { content?: string } }[] }
  const content = dataObj?.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    throw new PantryVisionError('AI 未返回有效内容', 'PARSE')
  }

  const parsed = parsePantryVisionJson(extractJson(content))
  if (!parsed?.items.length) {
    throw new PantryVisionError('未能从图片中识别出食材，请换一张更清晰的照片或改用手动输入', 'EMPTY')
  }

  return {
    kind: parsed.kind,
    items: parsed.items.map((i) => ({ name: i.name, amount: i.amount })),
  }
}
