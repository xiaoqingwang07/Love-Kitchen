import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { PantryItem } from '../../../types/pantry'
import { D } from '../../../theme/designTokens'
import { AppIcon } from '../../../components/AppIcon'
import { trackEvent } from '../../../utils/analytics'
import { startReceiptIntakeFromHome } from '../../../utils/mediaIntake'
import * as S from '../styles'

type Props = {
  expiringItems: PantryItem[]
  emptyPantry: boolean
  onLoadDemo?: () => void
}

export function HomePantryBanner({ expiringItems, emptyPantry, onLoadDemo }: Props) {
  if (expiringItems.length > 0) {
    return (
      <View style={S.urgentCardStyle}>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={S.urgentTitleStyle}>
              冰箱里有 {expiringItems.length} 样快过期的
            </Text>
            <Text className="lk-block" style={{ ...S.urgentLeadStyle, marginTop: 4 }}>
              {expiringItems
                .slice(0, 3)
                .map((i) => i.name)
                .join('、')}
              {expiringItems.length > 3 ? ' 等' : ''}
            </Text>
          </View>
          <Text
            className="tap-scale"
            style={{
              fontSize: D.footnote,
              fontWeight: D.weightSemibold,
              color: D.accentDeep,
              flexShrink: 0,
              lineHeight: 1.2,
            }}
            onClick={() => {
              const names = expiringItems.map((i) => i.name)
              const ing = encodeURIComponent(names.join(','))
              const exp = encodeURIComponent(names.join(','))
              Taro.navigateTo({
                url: `/pages/result/index?from=meal&ingredients=${ing}&expiring=${exp}&source=home`,
              })
            }}
          >
            拿临期做一顿
          </Text>
        </View>
      </View>
    )
  }

  if (!emptyPantry) return null

  return (
    <View style={S.onboardCardStyle}>
      <Text
        className="lk-block"
        style={{ fontSize: D.headline, fontWeight: D.weightSemibold, color: D.label }}
      >
        30 秒建好你的冰箱
      </Text>
      <Text
        className="lk-block"
        style={{
          fontSize: D.footnote,
          color: D.labelSecondary,
          lineHeight: 1.5,
          marginTop: 6,
        }}
      >
        录入后自动提醒临期、推荐晚饭、生成待买清单
      </Text>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          marginTop: 12,
        }}
      >
        <View
          className="tap-scale"
          style={{
            height: 36,
            padding: '0 14px',
            borderRadius: 999,
            backgroundColor: D.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => {
            trackEvent('onboard_receipt_intake', { surface: 'home' })
            void startReceiptIntakeFromHome()
          }}
        >
          <View style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AppIcon name="camera" size={14} color="#fff" backgroundColor="rgba(255,255,255,0.2)" />
            <Text style={{ fontSize: D.footnote, fontWeight: D.weightSemibold, color: D.onAccent }}>
              拍小票建冰箱
            </Text>
          </View>
        </View>
        <Text
          className="tap-scale"
          style={{ fontSize: D.footnote, fontWeight: D.weightSemibold, color: D.accentDeep, lineHeight: 1.2 }}
          onClick={() => {
            trackEvent('onboard_ask_meal', { surface: 'home' })
            Taro.navigateTo({ url: '/pages/result/index?from=meal&source=home-empty' })
          }}
        >
          直接问吃什么
        </Text>
      </View>
      {onLoadDemo ? (
        <Text
          className="lk-block tap-scale"
          style={{
            marginTop: 10,
            fontSize: D.footnote,
            fontWeight: D.weightMedium,
            color: D.labelSecondary,
            lineHeight: 1.2,
          }}
          onClick={onLoadDemo}
        >
          先体验示例冰箱
        </Text>
      ) : null}
    </View>
  )
}
