import { View, Text, Input, ScrollView } from '@tarojs/components'
import type { CSSProperties } from 'react'
import { D } from '../../../theme/designTokens'
import { SheetActions, SheetHeading, SheetOverlay, SheetPanel, TwoLine } from '../../../components/SheetChrome'
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
    <SheetOverlay zIndex={200} onClose={onClose}>
      <SheetPanel maxHeight="82vh">
        <SheetHeading
          title={slotTitle(slot.side, slot.slotIndex)}
          subtitle={slotShortLabel(slot.side, slot.slotIndex)}
        />

        <ScrollView scrollY style={{ maxHeight: 240 }}>
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
                  padding: '10px 0',
                  borderBottom: `0.5px solid ${D.separatorLight}`,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <TwoLine title={item.name} detail={item.amount} />
                  <View
                    style={{
                      marginTop: 6,
                      alignSelf: 'flex-start',
                      padding: '3px 8px',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      ...stStyle,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: D.weightSemibold, color: stStyle.color, lineHeight: 1.2 }}>
                      {st === 'expired' ? '已过期' : st === 'expiring' ? `${daysLeft} 天到期` : `${daysLeft} 天`}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: D.caption, color: D.labelTertiary, padding: '0 6px', lineHeight: 1.2 }}>
                  编辑
                </Text>
              </View>
            )
          })}
          {items.length === 0 ? (
            <Text className="lk-block" style={{ fontSize: D.footnote, color: D.labelTertiary, padding: '12px 0' }}>
              这一格还空着
            </Text>
          ) : null}
        </ScrollView>

        <Text
          className="lk-block"
          style={{
            fontSize: D.caption,
            fontWeight: D.weightSemibold,
            color: D.labelSecondary,
            marginTop: 16,
            marginBottom: 8,
            letterSpacing: '0.08em',
            lineHeight: 1.2,
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
          }}
          placeholder="数量，如 2 个 / 500g"
          value={addAmount}
          onInput={(e) => onAddAmountChange(e.detail.value)}
        />
        <SheetActions
          secondary={{ label: '关闭', onClick: onClose }}
          primary={{ label: '放入', onClick: onAdd }}
        />
      </SheetPanel>
    </SheetOverlay>
  )
}
