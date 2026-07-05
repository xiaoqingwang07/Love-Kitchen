/**
 * 用户偏好读写（持久化 Storage，非导航 payload）
 */
import Taro from '@tarojs/taro'
import { STORAGE_KEYS } from './storageKeys'

const DEFAULT_DINERS = 2

export function getDefaultDinersCount(): number {
  try {
    const n = Number(Taro.getStorageSync(STORAGE_KEYS.defaultDinersCount))
    if (Number.isFinite(n) && n >= 1 && n <= 10) return n
  } catch {
    /* ignore */
  }
  return DEFAULT_DINERS
}

export function setDefaultDinersCount(count: number): void {
  const next = Math.max(1, Math.min(10, Math.round(count)))
  try {
    Taro.setStorageSync(STORAGE_KEYS.defaultDinersCount, next)
  } catch {
    /* ignore */
  }
}
