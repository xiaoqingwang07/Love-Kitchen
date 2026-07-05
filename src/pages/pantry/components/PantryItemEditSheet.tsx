import { View, Text, Input, Button } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
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
  pad,
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
    <View
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(18,17,15,0.55)',
        zIndex: 260,
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <View
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          backgroundColor: D.bgElevated,
          borderTopLeftRadius: D.radiusXL,
          borderTopRightRadius: D.radiusXL,
          padding: `20px ${pad}px`,
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
          boxShadow: D.shadowLift,
        }}
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
        <Text style={{ fontSize: D.headline, fontWeight: D.weightBold, color: D.label }}>{item.name}</Text>
        <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 4 }}>
          当前位置：{slotShortLabel(item.side, item.slotIndex)}
        </Text>

        <Text
          style={{
            fontSize: D.caption,
            fontWeight: D.weightSemibold,
            color: D.labelSecondary,
            marginTop: 18,
            marginBottom: 6,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
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
          style={{
            fontSize: D.caption,
            fontWeight: D.weightSemibold,
            color: D.labelSecondary,
            marginTop: 16,
            marginBottom: 6,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
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

        <View style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Button
            style={{
              flex: 1,
              height: 48,
              borderRadius: 999,
              backgroundColor: D.errorBg,
              color: D.errorFg,
              fontSize: D.footnote,
              fontWeight: D.weightSemibold,
              border: 'none',
            }}
            onClick={onDelete}
          >
            删除
          </Button>
          <Button
            style={{
              flex: 1,
              height: 48,
              borderRadius: 999,
              backgroundColor: D.bg,
              color: D.label,
              fontSize: D.footnote,
              fontWeight: D.weightSemibold,
              border: `0.5px solid ${D.separator}`,
            }}
            onClick={onMove}
          >
            换位置
          </Button>
          <Button
            style={{
              flex: 1.4,
              height: 48,
              borderRadius: 999,
              backgroundColor: D.accent,
              color: '#fff',
              fontSize: D.footnote,
              fontWeight: D.weightSemibold,
              border: 'none',
            }}
            onClick={onSave}
          >
            保存
          </Button>
        </View>
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
          取消
        </Button>
      </View>
    </View>
  )
}
