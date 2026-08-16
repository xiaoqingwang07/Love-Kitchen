import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'

type Props = {
  onOpen: () => void
}

export function ProfileAboutRow({ onOpen }: Props) {
  return (
    <View
      className="tap-scale"
      style={{
        backgroundColor: D.bgElevated,
        borderRadius: D.radiusM,
        padding: '12px 14px',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        border: `0.5px solid ${D.separatorLight}`,
      }}
      onClick={onOpen}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.label }}>
          关于
        </Text>
        <Text className="lk-block" style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 2 }}>
          爱心厨房 v1.1
        </Text>
      </View>
      <Text style={{ color: D.labelTertiary }}>›</Text>
    </View>
  )
}
