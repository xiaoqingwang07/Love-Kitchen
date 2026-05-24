import { getCategoryForName } from '../data/shelfLife'
import type { PantryItem } from '../types/pantry'
import type { FridgeLayoutConfig, FridgeSide } from '../types/fridge'
import { suggestPlacementWithBalance } from './fridgePlacement'

export interface IntakePreviewRow {
  name: string
  amount: string
  side: FridgeSide
  slotIndex: number
}

/** 根据分类与现有库存，为一批食材生成推荐格位预览 */
export function buildIntakePreview(
  lines: { name: string; amount: string }[],
  existing: PantryItem[],
  layout: FridgeLayoutConfig
): IntakePreviewRow[] {
  const virtual: PantryItem[] = [...existing]
  const preview: IntakePreviewRow[] = []

  for (const line of lines) {
    const cat = getCategoryForName(line.name)
    const p = suggestPlacementWithBalance(line.name, cat, virtual, layout)
    const now = Date.now()
    virtual.push({
      id: 'virt',
      name: line.name,
      category: cat,
      amount: line.amount,
      addedAt: now,
      expiresAt: now,
      defaultShelfLife: 1,
      side: p.side,
      slotIndex: p.slotIndex,
    })
    preview.push({
      name: line.name,
      amount: line.amount,
      side: p.side,
      slotIndex: p.slotIndex,
    })
  }

  return preview
}

/** 预览行 → 粘贴到清单文本框 */
export function previewToReceiptText(rows: { name: string; amount: string }[]): string {
  return rows.map((r) => `${r.name} ${r.amount}`.trim()).join('\n')
}
