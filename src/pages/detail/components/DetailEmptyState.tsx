import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { D } from '../../../theme/designTokens'

type Props = {
  variant: 'share-miss' | 'not-found'
}

export function DetailEmptyState({ variant }: Props) {
  const message =
    variant === 'share-miss'
      ? '分享菜谱内容已超出小程序可承载范围。请让对方在小程序内重新打开后再分享。'
      : '这道菜还没有准备好展示。回首页重新搜索，或从收藏里进入。'

  return (
    <View
      style={{
        padding: 40,
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        backgroundColor: D.bg,
      }}
    >
      <Text style={{ fontSize: D.body, color: D.labelSecondary, textAlign: 'center', lineHeight: 1.55 }}>
        {message}
      </Text>
      <View
        className="tap-scale"
        style={{
          height: 44,
          padding: '0 28px',
          backgroundColor: D.accent,
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
      >
        <Text style={{ fontSize: 16, fontWeight: D.weightSemibold, color: D.onAccent, lineHeight: 1.2 }}>
          回首页
        </Text>
      </View>
    </View>
  )
}
