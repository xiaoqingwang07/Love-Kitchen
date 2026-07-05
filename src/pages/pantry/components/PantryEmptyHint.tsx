import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'

type Props = {
  pad: number
}

export function PantryEmptyHint({ pad }: Props) {
  return (
    <View
      style={{
        margin: `0 ${pad}px 14px`,
        padding: '16px 18px',
        backgroundColor: D.bgElevated,
        borderRadius: D.radiusM,
        border: `0.5px solid ${D.separatorLight}`,
      }}
    >
      <Text style={{ fontSize: D.body, fontWeight: D.weightSemibold, color: D.label }}>先填一些食材</Text>
      <Text style={{ fontSize: D.footnote, color: D.labelSecondary, lineHeight: 1.5, marginTop: 6 }}>
        点任意格子可手动录入，或从下方「采购清单」粘贴一批。
      </Text>
    </View>
  )
}
