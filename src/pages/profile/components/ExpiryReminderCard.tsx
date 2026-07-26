import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'

type Props = {
  enabled: boolean
  onToggle: () => void
}

export function ExpiryReminderCard({ enabled, onToggle }: Props) {
  return (
    <View
      style={{
        backgroundColor: D.bgElevated,
        borderRadius: D.radiusM,
        padding: 16,
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        border: `0.5px solid ${D.separatorLight}`,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.label }}>
          临期提醒
        </Text>
        <Text className="lk-block" style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 4, lineHeight: 1.5 }}>
          食材快过期时，微信提醒你趁早做掉，少浪费
        </Text>
      </View>
      <View
        className="tap-scale"
        style={{
          padding: '7px 16px',
          borderRadius: 999,
          backgroundColor: enabled ? D.accent : D.bg,
          border: enabled ? 'none' : `0.5px solid ${D.separator}`,
        }}
        onClick={onToggle}
      >
        <Text
          style={{
            fontSize: D.footnote,
            fontWeight: D.weightSemibold,
            color: enabled ? '#fff' : D.labelSecondary,
          }}
        >
          {enabled ? '已开启' : '开启'}
        </Text>
      </View>
    </View>
  )
}
