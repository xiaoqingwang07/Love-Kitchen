/**
 * 分类型分享：菜谱 / 采购清单 / 今晚一餐 / 家庭邀请
 * 小程序 useShareAppMessage 只能在页面注册，子组件通过 prime* 预设本次分享内容。
 */
import type { MealPlan } from '../types/mealPlan'
import { reportEvent, EVENTS } from './analyticsExport'

export type ShareKind = 'shopping' | 'meal' | 'household'

export interface ShoppingSharePayload {
  title: string
  items: { name: string; amount: string }[]
}

export interface MealSharePayload {
  title: string
  missingCount: number
  recipeIds: string[]
  ingredientsParam?: string
}

type PendingShare =
  | { kind: 'shopping'; at: number; payload: ShoppingSharePayload }
  | { kind: 'meal'; at: number; payload: MealSharePayload }
  | { kind: 'household'; at: number; inviteCode: string; householdName?: string }

let pendingShare: PendingShare | null = null

const SHARE_TTL_MS = 60_000
const PAYLOAD_LIMIT = 1200

function encodeParam(obj: unknown): string {
  return encodeURIComponent(JSON.stringify(obj))
}

export function decodeShareParam<T>(raw: string | undefined): T | null {
  if (!raw) return null
  try {
    return JSON.parse(decodeURIComponent(raw)) as T
  } catch {
    return null
  }
}

function fitsEncoded(obj: unknown): string | null {
  const enc = encodeParam(obj)
  return enc.length <= PAYLOAD_LIMIT ? enc : null
}

export function primeShoppingShare(payload: ShoppingSharePayload): void {
  pendingShare = { kind: 'shopping', payload, at: Date.now() }
  reportEvent(EVENTS.sharePrepare, { kind: 'shopping', count: payload.items.length })
}

export function primeMealShare(plan: MealPlan, ingredientsParam?: string): void {
  const main = plan.recipes.find((s) => s.role === 'main')?.recipe
  const payload: MealSharePayload = {
    title: main?.title ?? '今晚一餐',
    missingCount: plan.missingItems.length,
    recipeIds: plan.recipes.map((s) => String(s.recipe.id)),
    ingredientsParam,
  }
  pendingShare = { kind: 'meal', payload, at: Date.now() }
  reportEvent(EVENTS.sharePrepare, { kind: 'meal', missing: plan.missingItems.length })
}

export function primeHouseholdShare(inviteCode: string, householdName?: string): void {
  pendingShare = { kind: 'household', inviteCode: inviteCode.toUpperCase(), householdName, at: Date.now() }
  reportEvent(EVENTS.sharePrepare, { kind: 'household' })
}

export function getPendingShare(): PendingShare | null {
  if (!pendingShare || Date.now() - pendingShare.at > SHARE_TTL_MS) return null
  return pendingShare
}

export function buildShoppingSharePath(payload: ShoppingSharePayload): string {
  const compact = {
    t: payload.title.slice(0, 24),
    i: payload.items.slice(0, 24).map((x) => [x.name.slice(0, 16), (x.amount || '适量').slice(0, 12)]),
  }
  const enc = fitsEncoded(compact)
  if (enc) return `/pages/pantry/index?shop=${enc}`
  return `/pages/pantry/index?shopTitle=${encodeURIComponent(payload.title.slice(0, 20))}`
}

export function buildMealSharePath(payload: MealSharePayload): string {
  const compact = {
    ids: payload.recipeIds.slice(0, 5),
    ing: payload.ingredientsParam,
  }
  const enc = fitsEncoded(compact)
  if (enc) return `/pages/result/index?from=meal&plan=${enc}`
  return `/pages/result/index?from=meal`
}

export function buildHouseholdSharePath(inviteCode: string): string {
  return `/pages/profile/index?joinCode=${encodeURIComponent(inviteCode.toUpperCase())}`
}

export function resolvePrimedShare(
  fallback: { title: string; path: string; imageUrl?: string }
): { title: string; path: string; imageUrl?: string } {
  const pending = getPendingShare()
  if (!pending) return fallback

  switch (pending.kind) {
    case 'shopping': {
      const p = pending.payload
      reportEvent(EVENTS.shareSend, { kind: 'shopping', count: p.items.length })
      return {
        title: p.items.length ? `帮我买 ${p.items.length} 样 · ${p.title}` : `采购清单 · ${p.title}`,
        path: buildShoppingSharePath(p),
      }
    }
    case 'meal': {
      const p = pending.payload
      const miss = p.missingCount > 0 ? ` · 还缺 ${p.missingCount} 样` : ''
      reportEvent(EVENTS.shareSend, { kind: 'meal', missing: p.missingCount })
      return {
        title: `今晚吃【${p.title}】${miss}`,
        path: buildMealSharePath(p),
      }
    }
    case 'household': {
      reportEvent(EVENTS.shareSend, { kind: 'household' })
      return {
        title: pending.householdName
          ? `加入「${pending.householdName}」我家的厨房清单`
          : `加入我家的厨房清单 · 码 ${pending.inviteCode}`,
        path: buildHouseholdSharePath(pending.inviteCode),
      }
    }
    default:
      return fallback
  }
}

export function decodeShoppingShare(raw: string | undefined): ShoppingSharePayload | null {
  const data = decodeShareParam<{ t?: string; i?: [string, string][] }>(raw)
  if (!data?.i?.length) return null
  return {
    title: data.t || '采购清单',
    items: data.i.map(([name, amount]) => ({ name, amount: amount || '适量' })),
  }
}

export function decodeMealShare(raw: string | undefined): {
  recipeIds: string[]
  ingredientsParam?: string
} | null {
  const data = decodeShareParam<{ ids?: string[]; ing?: string }>(raw)
  if (!data?.ids?.length) return null
  return { recipeIds: data.ids.map(String), ingredientsParam: data.ing }
}
