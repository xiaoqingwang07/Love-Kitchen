import { View, Text } from '@tarojs/components'
import type { CSSProperties } from 'react'
import { D } from '../../../theme/designTokens'
import type { PantryItem } from '../../../types/pantry'
import type { FridgeLayoutConfig, FridgeSide } from '../../../types/fridge'
import { slotCountForSide, slotKind } from '../../../types/fridge'
import { getFreshnessStatus } from '../../../types/pantry'

export type FridgeHighlightMode = 'all' | 'expiring' | 'expired'

const SLOT_PULL_MIN = 56
const SLOT_DRAWER_MIN = 62
const SLOT_STACK_GAP = 5

type Props = {
  layout: FridgeLayoutConfig
  items: PantryItem[]
  highlight: FridgeHighlightMode
  freezerIndices: number[]
  fridgeIndices: number[]
  onSlotClick: (side: FridgeSide, slotIndex: number) => void
}

export function FridgeCabinet({
  layout,
  items,
  highlight,
  freezerIndices,
  fridgeIndices,
  onSlotClick,
}: Props) {
  const freezerChamber: CSSProperties = {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    padding: '8px 7px 10px',
    position: 'relative',
    background: 'linear-gradient(168deg, #d8e6f5 0%, #c5d8ed 28%, #b8cce8 55%, #a8bedd 100%)',
    border: '1px solid rgba(255,255,255,0.5)',
    boxShadow: 'inset 0 3px 14px rgba(255,255,255,0.45), inset 0 -8px 24px rgba(25,55,95,0.12)',
    display: 'flex',
    flexDirection: 'column',
  }
  const fridgeChamber: CSSProperties = {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    padding: '8px 7px 10px',
    position: 'relative',
    background: 'linear-gradient(168deg, #f4faf6 0%, #e8f2eb 30%, #dce8df 60%, #d0dfd3 100%)',
    border: '1px solid rgba(255,255,255,0.55)',
    boxShadow: 'inset 0 3px 14px rgba(255,255,255,0.55), inset 0 -8px 24px rgba(45,75,55,0.08)',
    display: 'flex',
    flexDirection: 'column',
  }
  const frostOverlay: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)',
    pointerEvents: 'none',
  }
  const ledBar = (isFz: boolean): CSSProperties => ({
    height: 4,
    borderRadius: 2,
    marginBottom: 2,
    background: isFz
      ? 'linear-gradient(90deg, rgba(120,170,230,0.35), rgba(200,230,255,0.9), rgba(120,170,230,0.35))'
      : 'linear-gradient(90deg, rgba(140,200,160,0.25), rgba(230,255,240,0.85), rgba(140,200,160,0.25))',
    boxShadow: '0 0 8px rgba(255,255,255,0.6)',
  })

  const slotItems = (side: FridgeSide, slotIndex: number): PantryItem[] => {
    const count = slotCountForSide(layout, side)
    const last = count - 1
    return items.filter((i) => {
      if (i.side !== side) return false
      if (slotIndex === last) return i.slotIndex >= last
      return i.slotIndex === slotIndex
    })
  }

  const slotDimmed = (side: FridgeSide, slotIndex: number): boolean => {
    if (highlight === 'all') return false
    const list = slotItems(side, slotIndex)
    if (list.length === 0) return true
    return !list.some((i) => {
      const s = getFreshnessStatus(i)
      return highlight === 'expiring' ? s === 'expiring' : s === 'expired'
    })
  }

  const renderSlot = (side: FridgeSide, index: number) => {
    const slotList = slotItems(side, index)
    const kind = slotKind(index)
    const dim = slotDimmed(side, index)
    const hasExpired = slotList.some((i) => getFreshnessStatus(i) === 'expired')
    const hasExpiring = slotList.some((i) => getFreshnessStatus(i) === 'expiring')
    const ring =
      highlight !== 'all' &&
      slotList.some((i) =>
        getFreshnessStatus(i) === (highlight === 'expiring' ? 'expiring' : 'expired')
      )
    const minH = kind === 'pull' ? SLOT_PULL_MIN : SLOT_DRAWER_MIN
    const isFz = side === 'freezer'
    const summary = slotList.length === 0 ? '空' : slotList.map((i) => i.name).join('、')
    const sideColor = isFz ? '#4E8FC5' : '#5E9D72'

    return (
      <View
        key={`${side}-${index}`}
        style={{
          minHeight: minH,
          width: '100%',
          borderRadius: 12,
          backgroundColor: 'rgba(255,255,255,0.72)',
          border: ring
            ? `1.5px solid ${highlight === 'expiring' ? D.accentWarm : D.red}`
            : '0.5px solid rgba(255,255,255,0.9)',
          boxShadow: '0 1px 8px rgba(18,17,15,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
          padding: '8px 9px',
          opacity: dim ? 0.35 : 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          boxSizing: 'border-box',
          flex: 1,
          alignSelf: 'stretch',
          position: 'relative',
        }}
        onClick={() => onSlotClick(side, index)}
      >
        {hasExpired || hasExpiring ? (
          <View
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: hasExpired ? D.red : D.accentWarm,
              boxShadow: `0 0 0 2px ${isFz ? 'rgba(216,230,245,0.9)' : 'rgba(244,250,246,0.9)'}`,
            }}
          />
        ) : null}
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: '700', color: sideColor, letterSpacing: '0.06em' }}>
            {kind === 'pull' ? `搁板 ${index + 1}` : `抽屉 ${index - 3}`}
          </Text>
          {slotList.length > 0 ? (
            <View
              style={{
                backgroundColor: isFz ? 'rgba(78,143,197,0.12)' : 'rgba(94,157,114,0.12)',
                padding: '2px 7px',
                borderRadius: 999,
                flexShrink: 0,
                marginRight: hasExpired || hasExpiring ? 12 : 0,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: '700', color: sideColor }}>{slotList.length}</Text>
            </View>
          ) : null}
        </View>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: slotList.length === 0 ? D.labelTertiary : D.label,
            marginTop: 4,
            lineHeight: 1.45,
          }}
        >
          {summary}
        </Text>
      </View>
    )
  }

  const renderZone = (
    side: FridgeSide,
    indices: number[],
    opts: { compact?: boolean; title?: string } = {}
  ) => {
    const isFz = side === 'freezer'
    const chamber = isFz ? freezerChamber : fridgeChamber
    return (
      <View style={{ ...chamber, minHeight: opts.compact ? 120 : 0 }}>
        <View style={isFz ? frostOverlay : undefined} />
        <View style={ledBar(isFz)} />
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: 2,
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: D.weightBold,
              color: isFz ? '#1e3a5c' : '#2d4a38',
              letterSpacing: '-0.02em',
            }}
          >
            {opts.title || (isFz ? '冷冻室' : '冷藏室')}
          </Text>
          <Text
            style={{
              fontSize: 9,
              fontWeight: D.weightSemibold,
              color: isFz ? 'rgba(30,58,92,0.55)' : 'rgba(45,74,56,0.5)',
            }}
          >
            {isFz ? '≈ −18°C' : '≈ 4°C'}
          </Text>
        </View>
        <View style={{ display: 'flex', flexDirection: 'column', gap: SLOT_STACK_GAP, flex: 1 }}>
          {indices.map((idx) => (
            <View key={`${side}-${idx}`} style={{ display: 'flex', flex: 1 }}>
              {renderSlot(side, idx)}
            </View>
          ))}
        </View>
      </View>
    )
  }

  if (layout.type === 'side-by-side') {
    return (
      <View style={{ display: 'flex', flexDirection: 'column' }}>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            padding: '6px 4px 8px',
            gap: 6,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            {renderZone('freezer', freezerIndices, { title: '冷冻室' })}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            {renderZone('fridge', fridgeIndices, { title: '冷藏室' })}
          </View>
        </View>
      </View>
    )
  }

  if (layout.type === 'top-freezer') {
    return (
      <View style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 4px 8px' }}>
        {renderZone('freezer', freezerIndices, { compact: true, title: '上冷冻' })}
        {renderZone('fridge', fridgeIndices, { title: '下冷藏' })}
      </View>
    )
  }

  if (layout.type === 'bottom-freezer') {
    return (
      <View style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 4px 8px' }}>
        {renderZone('fridge', fridgeIndices, { title: '上冷藏' })}
        {renderZone('freezer', freezerIndices, { compact: true, title: '下冷冻' })}
      </View>
    )
  }

  if (layout.type === 'single-door') {
    return (
      <View style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 4px 8px' }}>
        {renderZone('freezer', freezerIndices, { compact: true, title: '小冷冻格' })}
        {renderZone('fridge', fridgeIndices, { title: '主冷藏区' })}
      </View>
    )
  }

  return (
    <View style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 4px 8px' }}>
      {renderZone('fridge', fridgeIndices, { title: '上层冷藏' })}
      <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          {renderZone('freezer', freezerIndices.slice(0, Math.ceil(freezerIndices.length / 2)), {
            compact: true,
            title: '下左冷冻',
          })}
        </View>
        <View style={{ flex: 1 }}>
          {renderZone('freezer', freezerIndices.slice(Math.ceil(freezerIndices.length / 2)), {
            compact: true,
            title: '下右冷冻',
          })}
        </View>
      </View>
    </View>
  )
}
