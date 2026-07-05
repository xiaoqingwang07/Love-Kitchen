import Taro from '@tarojs/taro'
import type { FridgeLayoutConfig } from '../types/fridge'
import { DEFAULT_FRIDGE_LAYOUT, normalizeFridgeLayout } from '../types/fridge'
import { STORAGE_KEYS } from '../store/storageKeys'

export function loadFridgeLayoutConfig(): FridgeLayoutConfig {
  try {
    return normalizeFridgeLayout(Taro.getStorageSync(STORAGE_KEYS.fridgeLayoutConfig))
  } catch {
    return DEFAULT_FRIDGE_LAYOUT
  }
}

export function saveFridgeLayoutConfig(layout: FridgeLayoutConfig): void {
  try {
    Taro.setStorageSync(STORAGE_KEYS.fridgeLayoutConfig, layout)
  } catch {
    /* ignore */
  }
}
