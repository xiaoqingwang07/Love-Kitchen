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
          backgroundColor: D.bgGrouped,
          padding: '12px 14px',
          borderRadius: D.radiusS,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Text
          className="lk-block"
          style={{
            color: D.green,
            fontWeight: D.weightSemibold,
            fontSize: D.caption,
            letterSpacing: '0.08em',
            lineHeight: 1.3,
            marginBottom: 6,
          }}
        >
          营养洞察
        </Text>
        <Text
          className="lk-block"
          style={{ color: D.labelSecondary, fontSize: D.footnote, lineHeight: 1.45 }}
        >
          {analysis}
        </Text>
      </View>
    </View>
  )
}
