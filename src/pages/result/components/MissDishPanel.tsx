import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import { hasUsableLlm } from '../resultUtils'

type Props = {
  dishName: string
  onGenerateWithAi: () => void
  onAddWish: () => void
}

export function MissDishPanel({ dishName, onGenerateWithAi, onAddWish }: Props) {
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
      }}
    >
      {hasUsableLlm() ? (
        <View
          className="tap-scale"
          style={{
            flex: 1,
            height: 44,
            borderRadius: 999,
            backgroundColor: D.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={onGenerateWithAi}
        >
          <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.onAccent, lineHeight: 1.2 }}>
            生成「{dishName}」
          </Text>
        </View>
      ) : null}
      <View
        className="tap-scale"
        style={{
          height: 44,
          padding: '0 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        onClick={onAddWish}
      >
        <Text style={{ fontSize: D.subheadline, fontWeight: D.weightMedium, color: D.accentDeep, lineHeight: 1.2 }}>
          加入心愿
        </Text>
      </View>
    </View>
  )
}
