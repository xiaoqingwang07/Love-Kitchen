export type FridgeSide = 'freezer' | 'fridge'

export const SLOTS_PER_SIDE = 7

export type FridgeLayoutType =
  | 'side-by-side'
  | 'french-door'
  | 'cross-door'
  | 'top-freezer'
  | 'bottom-freezer'
  | 'single-door'

export interface FridgeLayoutConfig {
  type: FridgeLayoutType
  freezerSlots: number
  fridgeSlots: number
}

export interface FridgeLayoutPreset extends FridgeLayoutConfig {
  name: string
  desc: string
}

export const FRIDGE_LAYOUT_PRESETS: FridgeLayoutPreset[] = [
  { type: 'side-by-side', name: '双开门', desc: '左冷冻 · 右冷藏', freezerSlots: 7, fridgeSlots: 7 },
  { type: 'french-door', name: '法式多门', desc: '上冷藏 · 下冷冻抽屉', freezerSlots: 3, fridgeSlots: 5 },
  { type: 'cross-door', name: '十字对开门', desc: '上冷藏 · 下分区冷冻', freezerSlots: 4, fridgeSlots: 4 },
  { type: 'top-freezer', name: '上冷冻两门', desc: '上冷冻 · 下冷藏', freezerSlots: 2, fridgeSlots: 5 },
  { type: 'bottom-freezer', name: '下冷冻两门', desc: '上冷藏 · 下冷冻', freezerSlots: 3, fridgeSlots: 5 },
  { type: 'single-door', name: '单门 / 小冰箱', desc: '小冷冻格 · 主冷藏区', freezerSlots: 1, fridgeSlots: 4 },
]

export const DEFAULT_FRIDGE_LAYOUT: FridgeLayoutConfig = {
  type: 'side-by-side',
  freezerSlots: 7,
  fridgeSlots: 7,
}

export function normalizeSlotCount(n: unknown, fallback: number): number {
  const v = Number(n)
  if (!Number.isFinite(v)) return fallback
  return Math.max(1, Math.min(9, Math.round(v)))
}

export function normalizeFridgeLayout(raw: unknown): FridgeLayoutConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_FRIDGE_LAYOUT
  const o = raw as Partial<FridgeLayoutConfig>
  const preset = FRIDGE_LAYOUT_PRESETS.find((p) => p.type === o.type) || FRIDGE_LAYOUT_PRESETS[0]
  return {
    type: preset.type,
    freezerSlots: normalizeSlotCount(o.freezerSlots, preset.freezerSlots),
    fridgeSlots: normalizeSlotCount(o.fridgeSlots, preset.fridgeSlots),
  }
}

export function slotCountForSide(layout: FridgeLayoutConfig, side: FridgeSide): number {
  return side === 'freezer' ? layout.freezerSlots : layout.fridgeSlots
}

export function slotKind(index: number): 'pull' | 'drawer' {
  return index < 4 ? 'pull' : 'drawer'
}

/** 自上而下展示：0 为最上层抽拉 */
export function slotTitle(side: FridgeSide, index: number): string {
  const zone = side === 'freezer' ? '冷冻' : '冷藏'
  if (slotKind(index) === 'pull') return `${zone} · 第 ${index + 1} 层`
  return `${zone} · 抽屉 ${index - 3}`
}

export function sideLabel(side: FridgeSide): string {
  return side === 'freezer' ? '冷冻' : '冷藏'
}
