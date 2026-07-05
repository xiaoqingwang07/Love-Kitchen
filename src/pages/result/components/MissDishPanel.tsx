import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import { resultPageStyles as S } from '../resultPageStyles'
import { hasUsableLlm } from '../resultUtils'

type Props = {
  dishName: string
  onGenerateWithAi: () => void
  onAddWish: () => void
}

export function MissDishPanel({ dishName, onGenerateWithAi, onAddWish }: Props) {
  return (
    <View style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
      {hasUsableLlm() ? (
        <View className="tap-scale" style={S.regenBtn} onClick={onGenerateWithAi}>
          <Text>✨</Text>
          <Text>用 AI 生成「{dishName}」</Text>
        </View>
      ) : null}
      <View
        className="tap-scale"
        style={{
          ...S.regenBtn,
          backgroundColor: D.bgElevated,
          color: D.labelSecondary,
          border: `0.5px solid ${D.separatorLight}`,
        }}
        onClick={onAddWish}
      >
        <Text>📝</Text>
        <Text>加入心愿菜（优先收录进正式库）</Text>
      </View>
    </View>
  )
}
