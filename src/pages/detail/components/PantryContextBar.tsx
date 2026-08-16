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
        backgroundColor: D.bgGrouped,
        borderRadius: D.radiusS,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Text className="lk-block" style={{ fontSize: D.caption, color: D.accentDeep, fontWeight: D.weightSemibold, lineHeight: 1.3 }}>
        为什么适合今晚
      </Text>
      <Text
        className="lk-block"
        style={{
          fontSize: D.footnote,
          color: D.labelSecondary,
          lineHeight: 1.4,
          marginTop: 4,
        }}
      >
        {context.reason}
      </Text>
      {context.hits.length > 0 ? (
        <Text className="lk-block" style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 6, lineHeight: 1.25 }}>
          会用掉：{context.hits.map((i) => i.name).join('、')}
        </Text>
      ) : null}
      {context.missing.length > 0 ? (
        <Text className="lk-block" style={{ fontSize: D.caption, color: D.accentWarm, marginTop: 4, lineHeight: 1.25 }}>
          还缺：{context.missing.map((m) => m.name).join('、')}
        </Text>
      ) : null}
    </View>
  )
}
