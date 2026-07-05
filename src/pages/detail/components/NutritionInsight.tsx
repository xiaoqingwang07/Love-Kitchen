import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'

type Props = {
  analysis: string
}

export function NutritionInsight({ analysis }: Props) {
  return (
    <View style={{ padding: `0 ${D.pagePadH}px 28px` }}>
      <View
        style={{
          backgroundColor: D.bgElevated,
          padding: 16,
          borderRadius: D.radiusM,
          border: `0.5px solid ${D.separatorLight}`,
        }}
      >
        <Text
          style={{
            color: D.green,
            fontWeight: D.weightSemibold,
            fontSize: D.caption,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            marginBottom: 8,
          }}
        >
          营养洞察
        </Text>
        <Text style={{ color: D.labelSecondary, fontSize: D.footnote, lineHeight: 1.6 }}>{analysis}</Text>
      </View>
    </View>
  )
}
