import Taro from '@tarojs/taro'
import { STORAGE_KEYS } from '../store/storageKeys'

const MAX_EVENTS = 200

type AnalyticsValue = string | number | boolean | null | undefined

export interface AnalyticsEvent {
  name: string
  at: number
  props?: Record<string, AnalyticsValue>
}

function sanitizeProps(props?: Record<string, AnalyticsValue>): Record<string, AnalyticsValue> | undefined {
  if (!props) return undefined
  const out: Record<string, AnalyticsValue> = {}
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string') out[key] = value.slice(0, 80)
    else if (typeof value === 'number' || typeof value === 'boolean' || value == null) out[key] = value
  }
  return out
}

export function trackEvent(name: string, props?: Record<string, AnalyticsValue>): void {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEYS.analyticsEvents)
    const events: AnalyticsEvent[] = Array.isArray(raw) ? raw : []
    const next = [
      ...events,
      {
        name,
        at: Date.now(),
        props: sanitizeProps(props),
      },
    ].slice(-MAX_EVENTS)
    Taro.setStorageSync(STORAGE_KEYS.analyticsEvents, next)
  } catch {
    /* 埋点不能影响主流程 */
  }
}

export function getAnalyticsEvents(): AnalyticsEvent[] {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEYS.analyticsEvents)
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

/** 标准化事件名（新增埋点请在此登记） */
export const ANALYTICS_EVENTS = {
  firstIntakeDone: 'first_intake_done',
  mealPlanView: 'meal_plan_view',
  sharePrepare: 'share_prepare',
  shareSend: 'share_send',
  shareOpen: 'share_open',
  detailView: 'detail_view',
  recipeCooked: 'recipe_cooked',
} as const

export function summarizeAnalytics(events = getAnalyticsEvents()): Record<string, number> {
  const summary: Record<string, number> = {}
  for (const e of events) {
    summary[e.name] = (summary[e.name] || 0) + 1
  }
  return summary
}

export function exportAnalyticsBundle() {
  const events = getAnalyticsEvents()
  return {
    exportedAt: new Date().toISOString(),
    total: events.length,
    summary: summarizeAnalytics(events),
    events,
  }
}

export function copyAnalyticsExport(): void {
  const json = JSON.stringify(exportAnalyticsBundle(), null, 2)
  Taro.setClipboardData({
    data: json,
    success: () => Taro.showToast({ title: '埋点 JSON 已复制', icon: 'success' }),
  })
}

export function clearAnalyticsEvents(): void {
  try {
    Taro.removeStorageSync(STORAGE_KEYS.analyticsEvents)
  } catch {
    /* ignore */
  }
}
