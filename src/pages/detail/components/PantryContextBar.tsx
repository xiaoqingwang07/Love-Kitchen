import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import type { RecipePantryContext } from '../../../utils/recipePantryContext'

type Props = {
  context: RecipePantryContext
}

export function PantryContextBar({ context }: Props) {
  return (
    <View
      style={{
        marginTop: 12,
        padding: '10px 12px',
        backgroundColor: D.accentMuted,
        borderRadius: D.radiusM,
        border: `0.5px solid ${D.accentLine}`,
      }}
    >
      <Text style={{ fontSize: D.caption, color: D.accentDeep, fontWeight: D.weightSemibold }}>
        为什么适合今晚
      </Text>
      <Text
        style={{
          fontSize: D.footnote,
          color: D.labelSecondary,
          lineHeight: 1.5,
          marginTop: 4,
          display: 'block',
        }}
      >
        {context.reason}
      </Text>
      {context.hits.length > 0 ? (
        <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 6 }}>
          会用掉：{context.hits.map((i) => i.name).join('、')}
        </Text>
      ) : null}
      {context.missing.length > 0 ? (
        <Text style={{ fontSize: D.caption, color: D.accentWarm, marginTop: 4 }}>
          还缺：{context.missing.map((m) => m.name).join('、')}
        </Text>
      ) : null}
    </View>
  )
}
