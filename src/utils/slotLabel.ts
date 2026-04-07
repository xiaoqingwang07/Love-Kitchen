import type { FridgeSide } from '../types/fridge'
import type { PantryItem } from '../types/pantry'

function slotLabel(side: FridgeSide, slotIndex: number, withDot: boolean): string {
  const z = side === 'freezer' ? '冻' : '藏'
  const sep = withDot ? '·' : ''
  if (slotIndex < 5) return `${z}${sep}${slotIndex + 1}层`
  if (slotIndex === 5) return `${z}${sep}上抽`
  return `${z}${sep}下抽`
}

/** 冰箱页 / 小票预览：「冻·1层」「藏·上抽」 */
export function slotShortLabel(side: FridgeSide, slotIndex: number): string {
  return slotLabel(side, slotIndex, true)
}

/** 选菜页紧凑文案：「冻1层」「藏上抽」（与历史一致，无间隔点） */
export function slotHint(p: Pick<PantryItem, 'side' | 'slotIndex'>): string {
  return slotLabel(p.side, p.slotIndex, false)
}
