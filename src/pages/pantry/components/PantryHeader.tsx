import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'

type Props = {
  pad: number
  presetName: string
  onOpenLayoutSettings: () => void
}

export function PantryHeader({ pad, presetName, onOpenLayoutSettings }: Props) {
  return (
    <View style={{ padding: `44px ${pad}px 12px` }}>
      <View style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <Text
          style={{
            fontSize: D.titleLarge,
            fontWeight: D.weightBold,
            color: D.label,
            letterSpacing: '-0.04em',
          }}
        >
          冰箱
        </Text>
        <View
          className="tap-scale"
          onClick={onOpenLayoutSettings}
          style={{
            marginTop: 3,
            padding: '6px 10px',
            borderRadius: 999,
            backgroundColor: D.bgElevated,
            border: `0.5px solid ${D.separatorLight}`,
            boxShadow: '0 1px 6px rgba(18,17,15,0.04)',
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: D.caption, fontWeight: D.weightSemibold, color: D.labelSecondary }}>
            {presetName}
          </Text>
        </View>
      </View>
      <Text className="lk-block"
        style={{
          fontSize: D.footnote,
          color: D.labelSecondary,
          marginTop: 8,
          lineHeight: 1.5,
          maxWidth: 340,
        }}
      >
        点格子查看 / 添加，食材会自动标记临期（黄）和过期（红）。
      </Text>
    </View>
  )
}
