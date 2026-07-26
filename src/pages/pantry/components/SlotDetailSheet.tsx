import { View, Text, Input, Button, ScrollView } from '@tarojs/components'
import type { CSSProperties } from 'react'
import { D } from '../../../theme/designTokens'
import { getFreshnessStatus, getDaysLeft } from '../../../types/pantry'
import type { PantryItem, FreshnessStatus } from '../../../types/pantry'
import type { FridgeSide } from '../../../types/fridge'
import { slotTitle } from '../../../types/fridge'
import { slotShortLabel } from '../../../utils/slotLabel'

function getStatusStyle(status: FreshnessStatus): CSSProperties {
  if (status === 'expired') return { color: D.red, backgroundColor: 'rgba(208,90,56,0.12)' }
  if (status === 'expiring') return { color: D.accentWarm, backgroundColor: D.accentWarmMuted }
  return { color: D.green, backgroundColor: 'rgba(74,140,108,0.12)' }
}

type SlotRef = { side: FridgeSide; slotIndex: number }

type Props = {
  slot: SlotRef | null
  pad: number
  items: PantryItem[]
  addName: string
  addAmount: string
  onAddNameChange: (value: string) => void
  onAddAmountChange: (value: string) => void
  onClose: () => void
  onAdd: () => void
  onEditItem: (item: PantryItem) => void
}

export function SlotDetailSheet({
  slot,
  pad,
  items,
  addName,
  addAmount,
  onAddNameChange,
  onAddAmountChange,
  onClose,
  onAdd,
  onEditItem,
}: Props) {
  if (!slot) return null

  return (
    <View
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(18,17,15,0.5)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <View
        style={{
          width: '100%',
          maxHeight: '82%',
          backgroundColor: D.bgElevated,
          borderTopLeftRadius: D.radiusXL,
          borderTopRightRadius: D.radiusXL,
          padding: `20px ${pad}px`,
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
          boxShadow: D.shadowLift,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <View
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: D.separator,
            alignSelf: 'center',
            margin: '0 auto 16px',
          }}
        />
        <Text
          style={{
            fontSize: D.headline,
            fontWeight: D.weightBold,
            color: D.label,
            letterSpacing: '-0.02em',
          }}
        >
          {slotTitle(slot.side, slot.slotIndex)}
        </Text>
        <Text style={{ fontSize: D.footnote, color: D.labelTertiary, marginTop: 4 }}>
          {slotShortLabel(slot.side, slot.slotIndex)}
        </Text>

        <ScrollView scrollY style={{ maxHeight: 240, marginTop: 16 }}>
          {items.map((item) => {
            const st = getFreshnessStatus(item)
            const stStyle = getStatusStyle(st)
            const daysLeft = getDaysLeft(item)
            return (
              <View
                key={item.id}
                className="tap-scale"
                onClick={() => onEditItem(item)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: `0.5px solid ${D.separatorLight}`,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: D.body, fontWeight: D.weightSemibold, color: D.label }}>
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 2 }}>{item.amount}</Text>
                  <View
                    style={{
                      marginTop: 6,
                      alignSelf: 'flex-start',
                      padding: '3px 8px',
                      borderRadius: 6,
                      ...stStyle,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: D.weightSemibold, color: stStyle.color }}>
                      {st === 'expired' ? '已过期' : st === 'expiring' ? `${daysLeft} 天到期` : `${daysLeft} 天`}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: D.caption, color: D.labelTertiary, padding: '0 6px' }}>编辑</Text>
              </View>
            )
          })}
          {items.length === 0 ? (
            <Text style={{ fontSize: D.footnote, color: D.labelTertiary, padding: '12px 0' }}>这一格还空着</Text>
          ) : null}
        </ScrollView>

        <Text
          style={{
            fontSize: D.caption,
            fontWeight: D.weightSemibold,
            color: D.labelSecondary,
            marginTop: 16,
            marginBottom: 8,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
          }}
        >
          放入此格
        </Text>
        <Input
          style={{
            height: 48,
            backgroundColor: D.bg,
            borderRadius: D.radiusS,
            padding: '0 14px',
            fontSize: D.body,
            marginBottom: 8,
          }}
          placeholder="名称"
          value={addName}
          onInput={(e) => onAddNameChange(e.detail.value)}
        />
        <Input
          style={{
            height: 48,
            backgroundColor: D.bg,
            borderRadius: D.radiusS,
            padding: '0 14px',
            fontSize: D.body,
            marginBottom: 12,
          }}
          placeholder="数量，如 2 个 / 500g"
          value={addAmount}
          onInput={(e) => onAddAmountChange(e.detail.value)}
        />
        <Button
          style={{
            height: 48,
            borderRadius: 999,
            backgroundColor: D.accent,
            color: D.onAccent,
            fontSize: D.subheadline,
            fontWeight: D.weightSemibold,
            border: 'none',
          }}
          onClick={onAdd}
        >
          放入
        </Button>
        <Button
          style={{
            marginTop: 10,
            height: 42,
            borderRadius: 999,
            backgroundColor: 'transparent',
            color: D.labelSecondary,
            fontSize: D.footnote,
            border: 'none',
          }}
          onClick={onClose}
        >
          关闭
        </Button>
      </View>
    </View>
  )
}
