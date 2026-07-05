import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'

type Props = {
  onBack: () => void
  onLogoTap: () => void
}

export function AboutPage({ onBack, onLogoTap }: Props) {
  return (
    <View style={{ minHeight: '100vh', backgroundColor: D.bg }}>
      <View
        style={{
          padding: '20px 22px',
          backgroundColor: D.bgElevated,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: `0.5px solid ${D.separatorLight}`,
        }}
      >
        <Text style={{ fontSize: D.body, color: D.accent }} onClick={onBack}>
          ← 返回
        </Text>
        <Text
          style={{
            fontSize: D.headline,
            fontWeight: D.weightBold,
            color: D.label,
            letterSpacing: '-0.02em',
          }}
        >
          关于
        </Text>
      </View>
      <View
        style={{
          padding: '48px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 72, marginBottom: 20 }} onClick={onLogoTap}>
          🍳
        </Text>
        <Text
          style={{
            fontSize: D.title,
            fontWeight: D.weightBold,
            color: D.label,
            marginBottom: 6,
            letterSpacing: '-0.02em',
          }}
        >
          爱心厨房
        </Text>
        <Text style={{ fontSize: D.footnote, color: D.labelTertiary, marginBottom: 28 }}>
          Love Kitchen · v1.1
        </Text>
        <View
          style={{
            backgroundColor: D.bgElevated,
            borderRadius: D.radiusL,
            padding: 20,
            width: '100%',
            border: `0.5px solid ${D.separatorLight}`,
            boxShadow: D.shadowCard,
          }}
        >
          <Text style={{ fontSize: D.subheadline, color: D.labelSecondary, lineHeight: 1.7 }}>
            面向家庭的 AI 厨房助手。把食材管理、今天吃什么、一步一步做到完成，串成一条顺滑的路径。
          </Text>
          <Text style={{ fontSize: D.footnote, color: D.labelTertiary, marginTop: 14, lineHeight: 1.6 }}>
            让每一餐都有爱。
          </Text>
        </View>
      </View>
    </View>
  )
}
