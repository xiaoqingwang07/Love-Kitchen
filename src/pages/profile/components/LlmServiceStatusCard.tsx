import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'

type Props = {
  valid: boolean | null
}

export function LlmServiceStatusCard({ valid }: Props) {
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
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: valid === false ? D.red : valid === true ? D.green : D.labelTertiary,
        }}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.label }}>
          智能推荐
        </Text>
        <Text className="lk-block" style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 2 }}>
          {valid === false
            ? '暂不可用，稍后 AI 会自动回退到本地库'
            : valid === true
            ? '已启用，密钥保存在服务端'
            : '未检测，可手动检测'}
        </Text>
      </View>
    </View>
  )
}
