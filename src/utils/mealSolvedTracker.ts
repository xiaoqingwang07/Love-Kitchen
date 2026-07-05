/**
 * 晚餐闭环计数 + 完成 3 次后软提示 Plus（不弹付费墙）
 */
import Taro from '@tarojs/taro'
import { STORAGE_KEYS } from '../store/storageKeys'
import { reportEvent, EVENTS } from './analyticsExport'

const SOLVED_THRESHOLD = 3

function readCount(): number {
  try {
    const n = Taro.getStorageSync(STORAGE_KEYS.mealSolvedCount)
    return typeof n === 'number' && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

function writeCount(n: number) {
  try {
    Taro.setStorageSync(STORAGE_KEYS.mealSolvedCount, n)
  } catch {
    /* ignore */
  }
}

function plusPromptShown(): boolean {
  try {
    return Boolean(Taro.getStorageSync(STORAGE_KEYS.plusPromptShown))
  } catch {
    return false
  }
}

function markPlusPromptShown() {
  try {
    Taro.setStorageSync(STORAGE_KEYS.plusPromptShown, true)
  } catch {
    /* ignore */
  }
}

/** 烹饪模式完成一顿：计数 + 埋点 + 满 3 次软提示 */
export function recordMealSolved(props: { recipeId: string; title: string }): void {
  const next = readCount() + 1
  writeCount(next)
  reportEvent(EVENTS.mealSolved, { ...props, totalSolved: next })

  if (next >= SOLVED_THRESHOLD && !plusPromptShown()) {
    markPlusPromptShown()
    reportEvent(EVENTS.upgradePromptShown, { mealSolvedCount: next })
    void Taro.showModal({
      title: '你已经做了 3 顿晚饭 🎉',
      content:
        '家庭云同步、无限 OCR、周菜单自动规划等功能正在准备中。继续用爱心厨房，上线后会第一时间通知你。',
      showCancel: false,
      confirmText: '继续用',
    })
  }
}

export function getMealSolvedCount(): number {
  return readCount()
}
