import { View, Text, Input } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import { PrimaryButton, SheetHeading, SheetOverlay, SheetPanel, TextAction } from '../../../components/SheetChrome'
import type { PantryItem } from '../../../types/pantry'
import { slotShortLabel } from '../../../utils/slotLabel'

type Props = {
  item: PantryItem | null
  pad: number
  editAmount: string
  editDaysLeft: number
  onEditAmountChange: (value: string) => void
  onEditDaysLeftChange: (delta: number) => void
  onClose: () => void
  onSave: () => void
  onDelete: () => void
  onMove: () => void
}

export function PantryItemEditSheet({
  item,
  pad: _pad,
  editAmount,
  editDaysLeft,
  onEditAmountChange,
  onEditDaysLeftChange,
  onClose,
  onSave,
  onDelete,
  onMove,
}: Props) {
  if (!item) return null

  return (
    <SheetOverlay zIndex={260} onClose={onClose}>
      <SheetPanel>
        <SheetHeading title={item.name} subtitle={`当前位置：${slotShortLabel(item.side, item.slotIndex)}`} />

        <Text
          className="lk-block"
          style={{
            fontSize: D.caption,
            fontWeight: D.weightSemibold,
            color: D.labelSecondary,
            marginTop: 18,
            marginBottom: 6,
            letterSpacing: '0.08em',
            lineHeight: 1.2,
          }}
        >
          数量
        </Text>
        <Input
          style={{
            height: 48,
            backgroundColor: D.bg,
            borderRadius: D.radiusS,
            padding: '0 14px',
            fontSize: D.body,
          }}
          value={editAmount}
          onInput={(e) => onEditAmountChange(e.detail.value)}
        />

        <Text
          className="lk-block"
          style={{
            fontSize: D.caption,
            fontWeight: D.weightSemibold,
            color: D.labelSecondary,
            marginTop: 16,
            marginBottom: 6,
            letterSpacing: '0.08em',
            lineHeight: 1.2,
          }}
        >
          还能放几天
        </Text>
        <View style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <View
            className="tap-scale"
            onClick={() => onEditDaysLeftChange(-1)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: D.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20, color: D.label }}>−</Text>
          </View>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 28, fontWeight: D.weightBold, color: D.label }}>
            {editDaysLeft}
            <Text style={{ fontSize: D.footnote, color: D.labelTertiary, fontWeight: D.weightRegular }}> 天</Text>
          </Text>
          <View
            className="tap-scale"
            onClick={() => onEditDaysLeftChange(1)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: D.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20, color: D.label }}>+</Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            marginTop: 20,
          }}
        >
          <TextAction label="取消" onClick={onClose} />
          <PrimaryButton label="保存" onClick={onSave} />
        </View>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 28,
            marginTop: 4,
          }}
        >
          <Text
            className="tap-scale"
            style={{ fontSize: D.footnote, color: D.red, padding: '10px 4px', lineHeight: 1.2 }}
            onClick={onDelete}
          >
            删除
          </Text>
          <Text
            className="tap-scale"
            style={{ fontSize: D.footnote, color: D.labelSecondary, padding: '10px 4px', lineHeight: 1.2 }}
            onClick={onMove}
          >
            换位置
          </Text>
        </View>
      </SheetPanel>
    </SheetOverlay>
  )
}
