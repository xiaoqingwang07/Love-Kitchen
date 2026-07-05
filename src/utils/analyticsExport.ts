/**
 * 埋点导出与上报抽象（Task 1.5）
 */
import Taro from '@tarojs/taro'
import {
  trackEvent,
  getAnalyticsEvents,
  summarizeAnalytics,
  clearAnalyticsEvents,
  type AnalyticsEvent,
} from './analytics'

export { getAnalyticsEvents, summarizeAnalytics, clearAnalyticsEvents, type AnalyticsEvent }

/** 标准化事件名 */
export const EVENTS = {
  firstIntakeDone: 'first_intake_done',
  mealPlanView: 'meal_plan_view',
  cookStart: 'cook_start',
  cookComplete: 'cook_complete',
  pantryDeduct: 'pantry_deduct',
  sharePrepare: 'share_prepare',
  shareSend: 'share_send',
  shareOpen: 'share_open',
  mealSolved: 'meal_solved',
  upgradePromptShown: 'upgrade_prompt_shown',
  weeklyMenuView: 'weekly_menu_view',
} as const

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>

/**
 * 统一上报入口：本地队列 + 预留微信数据分析 / 自定义后端。
 */
export function reportEvent(name: string, props?: AnalyticsProps): void {
  trackEvent(name, props)
  try {
    const wx = Taro as unknown as {
      reportAnalytics?: (eventName: string, data: Record<string, unknown>) => void
    }
    wx.reportAnalytics?.(name, props ?? {})
  } catch {
    /* 上报不能影响主流程 */
  }
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
