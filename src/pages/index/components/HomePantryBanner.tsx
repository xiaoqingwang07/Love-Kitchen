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
        <Text style={S.urgentTitleStyle}>
          冰箱里有 {expiringItems.length} 样快过期的
        </Text>
        <Text style={S.urgentLeadStyle}>
          先处理掉它们：{expiringItems
            .slice(0, 3)
            .map((i) => i.name)
            .join('、')}
          {expiringItems.length > 3 ? ' 等' : ''}
        </Text>
        <View style={S.urgentActionsStyle}>
          <View
            className="tap-scale"
            style={S.urgentPrimaryBtnStyle}
            onClick={() => {
              const names = expiringItems.map((i) => i.name)
              const ing = encodeURIComponent(names.join(','))
              const exp = encodeURIComponent(names.join(','))
              Taro.navigateTo({
                url: `/pages/result/index?from=meal&ingredients=${ing}&expiring=${exp}&source=home`,
              })
            }}
          >
            <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.onAccent }}>
              拿临期做一顿
            </Text>
          </View>
          <View
            className="tap-scale"
            style={S.urgentSecondaryBtnStyle}
            onClick={() => Taro.switchTab({ url: '/pages/pantry/index' })}
          >
            <Text style={{ fontSize: D.subheadline, fontWeight: D.weightMedium, color: D.label }}>
              去冰箱看看
            </Text>
          </View>
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
        录入后自动提醒临期、推荐晚饭、生成采购清单
      </Text>
      <View style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
        <View style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
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
            onClick={() => {
              trackEvent('onboard_receipt_intake', { surface: 'home' })
              void startReceiptIntakeFromHome()
            }}
          >
            <View style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AppIcon name="camera" size={16} color="#fff" backgroundColor="rgba(255,255,255,0.2)" />
              <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.onAccent }}>
                拍小票建冰箱
              </Text>
            </View>
          </View>
          <View
            className="tap-scale"
            style={{
              flex: 1,
              height: 44,
              borderRadius: 999,
              backgroundColor: D.bgElevated,
              border: `0.5px solid ${D.separator}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => {
              trackEvent('onboard_ask_meal', { surface: 'home' })
              Taro.navigateTo({ url: '/pages/result/index?from=meal&source=home-empty' })
            }}
          >
            <View style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AppIcon name="meal" size={16} color={D.accent} />
              <Text style={{ fontSize: D.subheadline, fontWeight: D.weightMedium, color: D.label }}>
                直接问吃什么
              </Text>
            </View>
          </View>
        </View>
        {onLoadDemo ? (
          <View
            className="tap-scale"
            style={{
              height: 40,
              borderRadius: 999,
              backgroundColor: D.accentMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={onLoadDemo}
          >
            <Text className="lk-block" style={{ fontSize: D.footnote, fontWeight: D.weightSemibold, color: D.accentDeep }}>
              先体验示例冰箱（18 样食材）
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}
